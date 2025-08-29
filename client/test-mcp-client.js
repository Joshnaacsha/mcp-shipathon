import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMcpServer() {
    console.log("Starting MCP client test...");

    const client = new Client({
        name: "whatsapp-test-client",
        version: "0.1.0",
    });

    const transport = new StdioClientTransport({
        command: "node",
        args: ["../server/dist/main.js"],
    });

    try {
        console.log("Connecting to MCP server...");
        await client.connect(transport);
        console.log("✅ Connected to MCP server!");

        // Test all available tools
        console.log("\n🔍 Testing available tools...");
        const tools = await client.listTools();
        console.log(`Found ${tools.length} tools:`);
        tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
        });

        // Test list_chats tool
        console.log("\n📱 Testing list_chats tool...");
        try {
            const chatsResult = await client.callTool("list_chats", { limit: 5 });
            console.log("✅ list_chats result:", chatsResult.content[0].text);
        } catch (error) {
            console.log("❌ list_chats failed:", error.message);
        }

        // Test list_messages tool (if we have a chat)
        console.log("\n💬 Testing list_messages tool...");
        try {
            // Try to get messages from the first available chat
            const chats = await client.callTool("list_chats", { limit: 1 });
            if (chats.content[0].text) {
                const chatData = JSON.parse(chats.content[0].text);
                if (chatData.length > 0) {
                    const firstChat = chatData[0];
                    console.log(`Testing with chat: ${firstChat.name} (${firstChat.jid})`);

                    const messagesResult = await client.callTool("list_messages", {
                        chat_jid: firstChat.jid,
                        limit: 3
                    });
                    console.log("✅ list_messages result:", messagesResult.content[0].text);
                }
            }
        } catch (error) {
            console.log("❌ list_messages failed:", error.message);
        }

        // Test search_contacts tool
        console.log("\n👥 Testing search_contacts tool...");
        try {
            const contactsResult = await client.callTool("search_contacts", { query: "test" });
            console.log("✅ search_contacts result:", contactsResult.content[0].text);
        } catch (error) {
            console.log("❌ search_contacts failed:", error.message);
        }

        // Test search_messages tool
        console.log("\n🔍 Testing search_messages tool...");
        try {
            const searchResult = await client.callTool("search_messages", { query: "hello", limit: 3 });
            console.log("✅ search_messages result:", searchResult.content[0].text);
        } catch (error) {
            console.log("❌ search_messages failed:", error.message);
        }

        // Test get_chat tool (if we have a chat)
        console.log("\n📋 Testing get_chat tool...");
        try {
            const chats = await client.callTool("list_chats", { limit: 1 });
            if (chats.content[0].text) {
                const chatData = JSON.parse(chats.content[0].text);
                if (chatData.length > 0) {
                    const firstChat = chatData[0];
                    const chatResult = await client.callTool("get_chat", { chat_jid: firstChat.jid });
                    console.log("✅ get_chat result:", chatResult.content[0].text);
                }
            }
        } catch (error) {
            console.log("❌ get_chat failed:", error.message);
        }

        // Test send_message tool (commented out to avoid spam)
        console.log("\n📤 Testing send_message tool (skipped to avoid spam)...");
        console.log("   To test send_message, uncomment the code below and provide a valid recipient JID");
        /*
        try {
          const sendResult = await client.callTool("send_message", { 
            recipient: "1234567890@s.whatsapp.net", 
            message: "Hello from MCP test client!" 
          });
          console.log("✅ send_message result:", sendResult.content[0].text);
        } catch (error) {
          console.log("❌ send_message failed:", error.message);
        }
        */

        // Test resources
        console.log("\n📚 Testing available resources...");
        const resources = await client.listResources();
        console.log(`Found ${resources.length} resources:`);
        resources.forEach(resource => {
            console.log(`  - ${resource.uri}: ${resource.name}`);
        });

        // Test db_schema resource
        console.log("\n🗄️ Testing db_schema resource...");
        try {
            const schemaResult = await client.readResource("schema://whatsapp/main");
            console.log("✅ db_schema result:", schemaResult.contents[0].text);
        } catch (error) {
            console.log("❌ db_schema failed:", error.message);
        }

        console.log("\n🎉 MCP client test completed successfully!");

    } catch (error) {
        console.log("❌ Error testing MCP server:", error);
    } finally {
        await client.close();
        console.log("Client disconnected.");
    }
}

testMcpServer().catch(console.error); 