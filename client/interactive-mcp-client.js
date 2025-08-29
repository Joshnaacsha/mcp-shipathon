import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import readline from 'readline';
import { SERVER_HOST, SERVER_PORT } from './config.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function interactiveMcpClient() {
    console.log("🚀 Starting Interactive MCP Client for WhatsApp");
    console.log("==============================================\n");

    const client = new Client({
        name: "whatsapp-interactive-client",
        version: "0.1.0",
    });

    // Create a transport that connects to an existing server process
    // Connect to the existing server via stdio
    const transport = new StdioClientTransport({
        command: "node",
        args: ["--pipe"],  // Signal that we want to use pipe communication
        timeout: 30000, // 30 second timeout
        bufferSize: 1024 * 1024, // 1MB buffer size
    });

    try {
        console.log("Connecting to MCP server...");
        const connectPromise = client.connect(transport);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Connection timed out")), 30000);
        });

        await Promise.race([connectPromise, timeoutPromise]);
        console.log("✅ Connected to MCP server!\n");

        // Show available tools
        try {
            const toolsResponse = await client.listTools();
            const tools = toolsResponse.tools || toolsResponse || [];
            console.log(`📋 Available tools (${tools.length}):`);
            if (Array.isArray(tools)) {
                tools.forEach((tool, index) => {
                    console.log(`  ${index + 1}. ${tool.name}: ${tool.description}`);
                });
            } else {
                console.log("  No tools available or unexpected response format");
            }
        } catch (toolError) {
            console.log("⚠️ Could not list tools:", toolError.message);
        }

        console.log("\n🔧 Available commands:");
        console.log("  get_status - Check WhatsApp connection status");
        console.log("  list_chats - List all chats");
        console.log("  list_messages <chat_jid> - List messages in a chat");
        console.log("  search_contacts <query> - Search for contacts");
        console.log("  search_messages <query> - Search messages");
        console.log("  get_chat <chat_jid> - Get chat details");
        console.log("  send_message <recipient> <message> - Send a message");
        console.log("  get_schema - Get database schema");
        console.log("  quit - Exit the client\n");

        while (true) {
            const input = await question("Enter command (or 'quit' to exit): ");
            const parts = input.trim().split(' ');
            const command = parts[0].toLowerCase();

            if (command === 'quit' || command === 'exit') {
                break;
            }

            try {
                switch (command) {
                    case 'get_status':
                        console.log("\n🔍 Checking WhatsApp connection status...");
                        const statusResult = await client.callTool("get_status", {});
                        console.log("Result:", statusResult.content[0].text);
                        break;

                    case 'list_chats':
                        const limit = parseInt(parts[1]) || 10;
                        console.log(`\n📱 Listing ${limit} chats...`);
                        const chatsResult = await client.callTool("list_chats", { limit });
                        console.log("Result:", chatsResult.content[0].text);
                        break;

                    case 'list_messages':
                        if (!parts[1]) {
                            console.log("❌ Please provide a chat JID: list_messages <chat_jid>");
                            break;
                        }
                        const chatJid = parts[1];
                        const msgLimit = parseInt(parts[2]) || 10;
                        console.log(`\n💬 Listing ${msgLimit} messages from ${chatJid}...`);
                        const messagesResult = await client.callTool("list_messages", {
                            chat_jid: chatJid,
                            limit: msgLimit
                        });
                        console.log("Result:", messagesResult.content[0].text);
                        break;

                    case 'search_contacts':
                        if (!parts[1]) {
                            console.log("❌ Please provide a search query: search_contacts <query>");
                            break;
                        }
                        const query = parts[1];
                        console.log(`\n👥 Searching contacts for "${query}"...`);
                        const contactsResult = await client.callTool("search_contacts", { query });
                        console.log("Result:", contactsResult.content[0].text);
                        break;

                    case 'search_messages':
                        if (!parts[1]) {
                            console.log("❌ Please provide a search query: search_messages <query>");
                            break;
                        }
                        const searchQuery = parts[1];
                        const searchLimit = parseInt(parts[2]) || 10;
                        console.log(`\n🔍 Searching messages for "${searchQuery}"...`);
                        const searchResult = await client.callTool("search_messages", {
                            query: searchQuery,
                            limit: searchLimit
                        });
                        console.log("Result:", searchResult.content[0].text);
                        break;

                    case 'get_chat':
                        if (!parts[1]) {
                            console.log("❌ Please provide a chat JID: get_chat <chat_jid>");
                            break;
                        }
                        const getChatJid = parts[1];
                        console.log(`\n📋 Getting chat details for ${getChatJid}...`);
                        const chatResult = await client.callTool("get_chat", { chat_jid: getChatJid });
                        console.log("Result:", chatResult.content[0].text);
                        break;

                    case 'send_message':
                        if (!parts[1] || !parts[2]) {
                            console.log("❌ Please provide recipient and message: send_message <recipient> <message>");
                            break;
                        }
                        const recipient = parts[1];
                        const message = parts.slice(2).join(' ');
                        console.log(`\n📤 Sending message to ${recipient}...`);
                        console.log(`Message: "${message}"`);

                        const confirm = await question("Are you sure you want to send this message? (y/N): ");
                        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
                            const sendResult = await client.callTool("send_message", {
                                recipient,
                                message
                            });
                            console.log("Result:", sendResult.content[0].text);
                        } else {
                            console.log("Message sending cancelled.");
                        }
                        break;

                    case 'get_schema':
                        console.log("\n🗄️ Getting database schema...");
                        const schemaResult = await client.readResource("schema://whatsapp/main");
                        console.log("Schema:", schemaResult.contents[0].text);
                        break;

                    default:
                        console.log(`❌ Unknown command: ${command}`);
                        console.log("Type 'quit' to exit or use one of the available commands.");
                }
            } catch (error) {
                console.log(`❌ Error executing command: ${error.message}`);
            }

            console.log("\n" + "=".repeat(50) + "\n");
        }

        console.log("👋 Goodbye!");

    } catch (error) {
        console.log("❌ Error connecting to MCP server:", error);
    } finally {
        await client.close();
        rl.close();
    }
}

interactiveMcpClient().catch(console.error); 