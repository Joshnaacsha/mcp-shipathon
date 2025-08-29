import readline from 'readline';
import { spawn } from 'child_process';
import {
    getChats,
    getMessages,
    getChat,
    searchDbForContacts,
    searchMessages,
    getMessagesAround,
    initializeDatabase
} from '../server/dist/database.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function formatMessage(msg) {
    const sender = msg.is_from_me ? "You" : (msg.sender?.split("@")[0] || "Unknown");
    const timestamp = msg.timestamp.toLocaleString();
    return `[${timestamp}] ${sender}: ${msg.content}`;
}

function showMenu() {
    console.log("\n" + "=".repeat(60));
    console.log("           WHATSAPP DATABASE EXPLORER");
    console.log("=".repeat(60));
    console.log("\nAVAILABLE COMMANDS:");
    console.log("─".repeat(40));
    console.log("📱 CHAT MANAGEMENT:");
    console.log("   1. list_chats [limit] [page]           - List all chats");
    console.log("   2. get_chat <chat_jid>                 - Get specific chat details");
    console.log("   3. search_contacts <query>             - Search for contacts");
    console.log("");
    console.log("💬 MESSAGE OPERATIONS:");
    console.log("   4. list_messages <chat_jid> [limit] [page]  - Show messages in chat");
    console.log("   5. search_messages <query> [chat_jid] [limit] - Search message content");
    console.log("   6. get_context <message_id> [before] [after] - Get message context");
    console.log("   7. send_message <recipient_jid> <message>   - Send a WhatsApp message");
    console.log("");
    console.log("ℹ️ UTILITY:");
    console.log("   8. help                                - Show this menu");
    console.log("   9. menu                                - Show this menu");
    console.log("  10. clear                               - Clear screen");
    console.log("   0. quit                                - Exit application");
    console.log("");
    console.log("EXAMPLES:");
    console.log("  list_chats 10              - Show 10 most recent chats");
    console.log("  search_contacts john       - Find contacts with 'john' in name");
    console.log("  list_messages 123@s.whatsapp.net 5  - Show 5 messages from contact");
    console.log("  search_messages hello      - Find all messages containing 'hello'");
    console.log("  send_message 123@s.whatsapp.net Hello there! - Send a message");
    console.log("─".repeat(60));
}

// Function to communicate with MCP server via stdio
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

        // Spawn the MCP server process
        const mcpProcess = spawn('node', ['../server/dist/main.js'], {
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

function formatChat(chat) {
    const name = chat.name || chat.jid.split("@")[0];
    const isGroup = chat.jid.endsWith("@g.us") ? " (Group)" : "";
    const lastMsg = chat.last_message ? ` - "${chat.last_message.substring(0, 50)}..."` : "";
    const lastTime = chat.last_message_time ? ` (${chat.last_message_time.toLocaleString()})` : "";
    return `${name}${isGroup} [${chat.jid}]${lastMsg}${lastTime}`;
}

async function executeCommand(command, args) {
    try {
        switch (command) {
            case 'help':
            case 'menu':
                showMenu();
                break;

            case 'list_chats':
                const limit = parseInt(args[0]) || 20;
                const page = parseInt(args[1]) || 0;
                console.log(`\n📱 Listing ${limit} chats (page ${page})...`);

                const chats = getChats(limit, page, "last_active", null, true);
                if (chats.length === 0) {
                    console.log("No chats found.");
                } else {
                    chats.forEach((chat, i) => {
                        console.log(`${i + 1}. ${formatChat(chat)}`);
                    });
                }
                break;

            case 'list_messages':
                if (!args[0]) {
                    console.log("❌ Please provide a chat JID: list_messages <chat_jid> [limit] [page]");
                    break;
                }
                const chatJid = args[0];
                const msgLimit = parseInt(args[1]) || 20;
                const msgPage = parseInt(args[2]) || 0;

                console.log(`\n💬 Listing ${msgLimit} messages from ${chatJid} (page ${msgPage})...`);
                const messages = getMessages(chatJid, msgLimit, msgPage);

                if (messages.length === 0) {
                    console.log("No messages found.");
                } else {
                    console.log(`\nChat: ${messages[0]?.chat_name || chatJid}`);
                    console.log("─".repeat(80));
                    messages.reverse().forEach(msg => {
                        console.log(formatMessage(msg));
                    });
                }
                break;

            case 'search_contacts':
                if (!args[0]) {
                    console.log("❌ Please provide a search query: search_contacts <query>");
                    break;
                }
                const contactQuery = args[0];
                console.log(`\n👥 Searching contacts for "${contactQuery}"...`);

                const contacts = searchDbForContacts(contactQuery, 20);
                if (contacts.length === 0) {
                    console.log("No contacts found.");
                } else {
                    contacts.forEach((contact, i) => {
                        const name = contact.name || contact.jid.split("@")[0];
                        console.log(`${i + 1}. ${name} [${contact.jid}]`);
                    });
                }
                break;

            case 'search_messages':
                if (!args[0]) {
                    console.log("❌ Please provide a search query: search_messages <query> [chat_jid] [limit]");
                    break;
                }
                const searchQuery = args[0];
                const searchChatJid = args[1] || null;
                const searchLimit = parseInt(args[2]) || 10;

                const scope = searchChatJid ? `in chat ${searchChatJid}` : "across all chats";
                console.log(`\n🔍 Searching messages for "${searchQuery}" ${scope}...`);

                const foundMessages = searchMessages(searchQuery, searchChatJid, searchLimit);
                if (foundMessages.length === 0) {
                    console.log("No messages found.");
                } else {
                    foundMessages.forEach((msg, i) => {
                        console.log(`\n${i + 1}. ${formatMessage(msg)}`);
                        console.log(`   Chat: ${msg.chat_name || msg.chat_jid}`);
                    });
                }
                break;

            case 'get_chat':
                if (!args[0]) {
                    console.log("❌ Please provide a chat JID: get_chat <chat_jid>");
                    break;
                }
                const getChatJid = args[0];
                console.log(`\n📋 Getting chat details for ${getChatJid}...`);

                const chat = getChat(getChatJid, true);
                if (!chat) {
                    console.log("Chat not found.");
                } else {
                    console.log("Chat Details:");
                    console.log(`  Name: ${chat.name || "Unknown"}`);
                    console.log(`  JID: ${chat.jid}`);
                    console.log(`  Type: ${chat.jid.endsWith("@g.us") ? "Group" : "Individual"}`);
                    console.log(`  Last Active: ${chat.last_message_time?.toLocaleString() || "Never"}`);
                    if (chat.last_message) {
                        console.log(`  Last Message: "${chat.last_message}"`);
                        const lastSender = chat.last_is_from_me ? "You" : (chat.last_sender?.split("@")[0] || "Unknown");
                        console.log(`  Last Sender: ${lastSender}`);
                    }
                }
                break;

            case 'get_context':
                if (!args[0]) {
                    console.log("❌ Please provide a message ID: get_context <message_id> [before] [after]");
                    break;
                }
                const messageId = args[0];
                const before = parseInt(args[1]) || 5;
                const after = parseInt(args[2]) || 5;

                console.log(`\n🔍 Getting context around message ${messageId} (${before} before, ${after} after)...`);
                const context = getMessagesAround(messageId, before, after);

                if (!context.target) {
                    console.log("Message not found.");
                } else {
                    console.log("\nMessages Before:");
                    context.before.forEach(msg => console.log(`  ${formatMessage(msg)}`));

                    console.log("\n🎯 Target Message:");
                    console.log(`  ${formatMessage(context.target)}`);

                    console.log("\nMessages After:");
                    context.after.forEach(msg => console.log(`  ${formatMessage(msg)}`));
                }
                break;

            case 'send_message':
                if (!args[0] || !args[1]) {
                    console.log("❌ Please provide recipient and message: send_message <recipient_jid> <message>");
                    console.log("   Example: send_message 919876543210@s.whatsapp.net Hello there!");
                    break;
                }
                const recipient = args[0];
                const messageText = args.slice(1).join(' ');

                console.log(`\n📤 Preparing to send message to ${recipient}...`);
                console.log(`Message: "${messageText}"`);
                console.log(`\nNote: This requires your main WhatsApp MCP server to be running.`);

                const confirm = await question("Are you sure you want to send this message? (y/N): ");
                if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                    try {
                        console.log("📡 Attempting to send via MCP server...");
                        const result = await callMcpTool('send_message', {
                            recipient: recipient,
                            message: messageText
                        });

                        if (result.content && result.content[0] && result.content[0].text) {
                            console.log("✅ " + result.content[0].text);
                        } else {
                            console.log("✅ Message sent successfully!");
                        }
                    } catch (error) {
                        console.log(`❌ Failed to send message: ${error.message}`);
                        console.log("Make sure your WhatsApp MCP server is running and connected.");
                        console.log("Try running: node ../server/dist/main.js");
                    }
                } else {
                    console.log("📋 Message sending cancelled.");
                }
                break;

            case 'status':
                try {
                    console.log("📊 Checking MCP server status...");
                    const statusResult = await callMcpTool('get_status', {});

                    if (statusResult.content && statusResult.content[0] && statusResult.content[0].text) {
                        const status = JSON.parse(statusResult.content[0].text);
                        console.log("\n📊 Server Status:");
                        console.log(`  WhatsApp Connected: ${status.whatsapp_connected ? '✅' : '❌'}`);
                        console.log(`  User: ${status.user_name}`);
                        console.log(`  Server Ready: ${status.server_ready ? '✅' : '❌'}`);
                        console.log(`  State: ${status.state}`);
                        console.log(`  Timestamp: ${new Date(status.timestamp).toLocaleString()}`);
                    }
                } catch (error) {
                    console.log(`❌ Failed to get status: ${error.message}`);
                    console.log("Make sure your WhatsApp MCP server is running.");
                }
                break;

            case 'clear':
                console.clear();
                showMenu();
                break;

            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log("Type 'help' for available commands or 'quit' to exit.");
        }
    } catch (error) {
        console.log(`❌ Error executing command: ${error.message}`);
    }
}

async function main() {
    console.log("🚀 Starting WhatsApp Database Reader");
    console.log("===================================\n");

    try {
        // Initialize database connection
        console.log("🗄️ Initializing database connection...");
        initializeDatabase();
        console.log("✅ Database connected successfully!\n");

        console.log("💡 This client reads directly from the WhatsApp database.");
        console.log("   For sending messages, make sure your WhatsApp MCP server is running separately.\n");

        console.log("💡 TIP: Use 'status' command to check if your MCP server is connected to WhatsApp.\n");
        console.log("Type 'help' for available commands or 'quit' to exit.\n");

        while (true) {
            const input = await question("💬 Enter command: ");
            const trimmed = input.trim();

            if (!trimmed) continue;

            if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
                break;
            }

            const parts = trimmed.split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            await executeCommand(command, args);
            console.log("\n" + "─".repeat(50) + "\n");
        }

        console.log("👋 Goodbye!");

    } catch (error) {
        console.log("❌ Failed to initialize database:", error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log("\n👋 Received interrupt signal. Exiting...");
    rl.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log("\n👋 Received terminate signal. Exiting...");
    rl.close();
    process.exit(0);
});

main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
});