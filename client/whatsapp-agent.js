// whatsapp-agent.js
// Core logic for natural language processing and WhatsApp interactions

import dotenv from 'dotenv';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API integration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

async function parseWithGemini(nlInput) {
    const prompt = `You are a WhatsApp command agent. Convert the following user request to a JSON object with keys 'command' and 'args' (array of strings).\n\nAvailable commands:\n- list_chats [limit, page]\n- get_chat [chat_jid]\n- search_contacts [query]\n- list_messages [chat_jid, limit, page]\n- search_messages [query, chat_jid, limit]\n- get_context [message_id, before, after]\n- send_message [recipient_jid, message]\n\nArgument types:\n- chat_jid: WhatsApp JID string (e.g., 123@s.whatsapp.net)\n- recipient_jid: WhatsApp JID string or contact name (will be resolved)\n- message: string\n- limit, page, before, after: integer\n- query: string\n- message_id: string\n\nUser: ${nlInput}\nOutput:`;

    try {
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;
        return JSON.parse(match[0]);
    } catch (err) {
        console.error('Gemini API error:', err);
        if (err?.response) {
            console.error('Gemini API response data:', err.response.data);
        }
        return null;
    }
}

// Helper: resolve name to JID using search_contacts command
async function resolveNameToJid(name) {
    console.log('Searching for contact:', name);
    try {
        const result = await runMcpClient('search_contacts', [name]);
        console.log('Search result:', result);

        // Parse the result to find JID
        const match = result.match(/\[([\w\d@.\-]+)\]/);
        if (match) {
            const jid = match[1];
            console.log(`Resolved ${name} to ${jid}`);
            return jid;
        }
        // If no match, try LLM fuzzy matching
        console.log(`No direct match for ${name}, trying LLM fuzzy match...`);
        const contactsJson = await runMcpClient('list_contacts', []);
        let contacts;
        try {
            contacts = JSON.parse(contactsJson);
        } catch (e) {
            console.error('Failed to parse contacts JSON:', e);
            return null;
        }
        if (!Array.isArray(contacts) || contacts.length === 0) {
            console.log('No contacts available for LLM matching.');
            return null;
        }
        // Use Gemini to pick the best match
        const prompt = `You are a helpful assistant. Given a user input name and a list of WhatsApp contacts, select the contact that best matches the input.\n\nUser input: ${name}\nContacts: ${contacts.map(c => `${c.name} [${c.jid}]`).join(', ')}\n\nRespond ONLY with the exact JID of the best match, or "NONE" if there is no reasonable match.`;
        const llmResult = await parseWithGemini(prompt);
        if (llmResult && typeof llmResult === 'string' && llmResult.endsWith('@s.whatsapp.net')) {
            console.log(`LLM matched ${name} to ${llmResult}`);
            return llmResult;
        }
        if (llmResult && llmResult.command && typeof llmResult.command === 'string' && llmResult.command.endsWith('@s.whatsapp.net')) {
            // In case Gemini returns a JSON object
            console.log(`LLM matched ${name} to ${llmResult.command}`);
            return llmResult.command;
        }
        console.log('LLM could not find a suitable contact match.');
        return null;
    } catch (err) {
        console.error('Error searching contacts:', err);
        return null;
    }
}

function runMcpClient(command, args) {
    return new Promise((resolve, reject) => {
        console.log('Running MCP script client with:', command, args);
        const proc = spawn('node', ['mcp-script-client.js', command, ...args], { cwd: __dirname });
        let output = '';
        let error = '';

        proc.stdout.on('data', data => {
            const chunk = data.toString();
            console.log('MCP output:', chunk);
            output += chunk;
        });

        proc.stderr.on('data', data => {
            const chunk = data.toString();
            console.error('MCP error:', chunk);
            error += chunk;
        });

        proc.on('close', code => {
            console.log('MCP process exited with code:', code);
            if (code === 0) resolve(output);
            else reject(error || output);
        });
    });
}

export async function processNaturalLanguageCommand(input) {
    console.log('Processing command:', input);

    const parsed = await parseWithGemini(input);
    if (!parsed || !parsed.command) {
        throw new Error('Could not parse input with Gemini');
    }

    // If sending a message and the first arg is not a JID, try to resolve name to JID
    if (parsed.command === 'send_message' && parsed.args && parsed.args.length > 0) {
        const recipient = parsed.args[0];
        if (!recipient.endsWith('@s.whatsapp.net') && !recipient.endsWith('@g.us')) {
            console.log('Attempting to resolve name to JID:', recipient);
            const jid = await resolveNameToJid(recipient);
            if (jid) {
                console.log('Successfully resolved name to JID:', recipient, '->', jid);
                parsed.args[0] = jid;
            } else {
                console.error('Failed to resolve name to JID:', recipient);
                throw new Error(`Could not find a contact named '${recipient}' in your WhatsApp contacts. Please make sure the contact exists and try again.`);
            }
        }
    }

    const result = await runMcpClient(parsed.command, parsed.args || []);

    return {
        success: true,
        input: input,
        command: parsed.command,
        args: parsed.args,
        result: result
    };
}
