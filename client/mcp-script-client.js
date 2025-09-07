// mcp-script-client.js
// Scriptable MCP client for automation (non-interactive)
// Modified to connect to existing MCP server instead of spawning new one

import {
    getChats,
    getMessages,
    getChat,
    searchDbForContacts,
    searchMessages,
    getMessagesAround,
    initializeDatabase
} from '../server/dist/database.js';


import { spawn } from 'child_process';

// Function to communicate with MCP server via stdio (like interactive-mcp-client)
async function callMcpTool(toolName, args) {
    return new Promise((resolve, reject) => {
        const mcpRequest = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "tools/call",
            params: {
                name: toolName,
                arguments: args
            }
        };

        const MCP_SERVER_PATH = '../server/dist/main.js';
        const mcpProcess = spawn('node', [MCP_SERVER_PATH], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let responseBuffer = '';
        let errorBuffer = '';
        let hasResponded = false;

        const cleanup = () => {
            if (!hasResponded) {
                hasResponded = true;
                mcpProcess.kill('SIGTERM');
            }
        };

        // Set timeout
        const timeout = setTimeout(() => {
            if (!hasResponded) {
                cleanup();
                reject(new Error('MCP request timed out after 30 seconds'));
            }
        }, 30000);

        mcpProcess.stdout.on('data', (data) => {
            responseBuffer += data.toString();
            // Try to parse JSON responses as they come in
            const lines = responseBuffer.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const response = JSON.parse(line.trim());
                        if (response.id === mcpRequest.id && !hasResponded) {
                            hasResponded = true;
                            clearTimeout(timeout);
                            cleanup();
                            if (response.error) {
                                reject(new Error(response.error.message || 'MCP tool error'));
                            } else {
                                resolve(response.result);
                            }
                            return;
                        }
                    } catch (parseError) {
                        // Not a JSON line, continue collecting data
                    }
                }
            }
        });

        mcpProcess.stderr.on('data', (data) => {
            errorBuffer += data.toString();
        });

        mcpProcess.on('error', (error) => {
            if (!hasResponded) {
                hasResponded = true;
                clearTimeout(timeout);
                reject(new Error(`Failed to start MCP process: ${error.message}`));
            }
        });

        mcpProcess.on('close', (code) => {
            if (!hasResponded) {
                hasResponded = true;
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`MCP process exited with code ${code}\nError output: ${errorBuffer}`));
                } else {
                    reject(new Error('MCP process closed without sending response'));
                }
            }
        });

        // Send the request
        try {
            mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
            mcpProcess.stdin.end();
        } catch (error) {
            if (!hasResponded) {
                hasResponded = true;
                clearTimeout(timeout);
                cleanup();
                reject(new Error(`Failed to send request: ${error.message}`));
            }
        }
    });
}

async function main() {
    const [, , command, ...args] = process.argv;
    await initializeDatabase();

    // For database operations, we can handle directly without MCP
    if (command === 'search_contacts') {
        const query = args[0];
        if (!query) {
            console.error('Usage: search_contacts <query>');
            process.exit(1);
        }
        const contacts = searchDbForContacts(query, 20);
        if (contacts.length === 0) {
            console.log('No contacts found.');
            process.exit(0);
        }
        contacts.forEach((contact, i) => {
            const name = contact.name || contact.jid.split("@")[0];
            console.log(`${i + 1}. ${name} [${contact.jid}]`);
        });
        process.exit(0);
    }

    if (command === 'list_contacts') {
        // Print all contacts as JSON for LLM matching
        const contacts = searchDbForContacts('', 1000);
        const out = contacts.map(c => ({ name: c.name || c.jid.split("@")[0], jid: c.jid }));
        console.log(JSON.stringify(out));
        process.exit(0);
    }

    if (command === 'send_message') {
        const recipientQuery = args[0];
        const message = args.slice(1).join(' ');
        if (!recipientQuery || !message) {
            console.error('Usage: send_message <recipient_name_or_jid> <message>');
            process.exit(1);
        }

        // Try to find contact(s)
        const contacts = searchDbForContacts(recipientQuery, 20);
        let selectedContact = null;
        if (contacts.length === 0) {
            // If not found, maybe it's a JID
            if (/^\d+@s\.whatsapp\.net$/.test(recipientQuery) || /^\d+$/.test(recipientQuery)) {
                selectedContact = { jid: recipientQuery };
            } else {
                console.error('No contacts found matching:', recipientQuery);
                process.exit(1);
            }
        } else if (contacts.length === 1) {
            selectedContact = contacts[0];
        } else {
            // Prefer exact match (case-insensitive)
            const exact = contacts.find(c => (c.name || '').toLowerCase() === recipientQuery.toLowerCase());
            if (exact) {
                selectedContact = exact;
            } else {
                // Prompt user to select
                console.log('Multiple contacts found:');
                contacts.forEach((c, i) => {
                    console.log(`${i + 1}. ${(c.name || c.jid)} [${c.jid}]`);
                });
                const readline = await import('readline');
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                const answer = await new Promise(res => rl.question('Select contact number: ', res));
                rl.close();
                const idx = parseInt(answer, 10) - 1;
                if (idx >= 0 && idx < contacts.length) {
                    selectedContact = contacts[idx];
                } else {
                    console.error('Invalid selection.');
                    process.exit(1);
                }
            }
        }

        try {
            const result = await callMcpTool('send_message', { recipient: selectedContact.jid, message });
            if (result.content && result.content[0] && result.content[0].text) {
                console.log(result.content[0].text);
            } else {
                console.log('✅ Message sent successfully!');
            }
            process.exit(0);
        } catch (error) {
            console.error(`❌ Failed to send message: ${error.message}`);
            console.error('Make sure your WhatsApp MCP server is running and accessible.');
            console.error('Try running: node ../server/dist/main.js');
            process.exit(1);
        }
    }

    // Add other commands that might need MCP server
    if (command === 'get_status') {
        try {
            const result = await callMcpTool('get_status', {});
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        } catch (error) {
            console.error(`❌ Failed to get status: ${error.message}`);
            process.exit(1);
        }
    }

    console.error('Unknown command:', command);
    console.error('Available commands: search_contacts, list_contacts, send_message, get_status');
    process.exit(1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Received interrupt signal. Exiting...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Received terminate signal. Exiting...');
    process.exit(0);
});

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});