import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testConnection() {
    console.log("🔌 Testing MCP Connection...");

    try {
        const client = new Client({
            name: "test-client",
            version: "0.1.0",
        });

        const transport = new StdioClientTransport({
            command: "node",
            args: ["dist/main.js"],
            cwd: "../server",
        });

        await client.connect(transport); console.log("📡 Connecting to MCP server...");
        await client.connect(transport);
        console.log("✅ Connected successfully!");

        console.log("🔧 Getting server info...");
        console.log("Client connected to MCP server");

        console.log("🛠️ Testing tool calls...");

        // Test a simple tool call
        try {
            console.log("Testing list_chats tool...");
            const result = await client.callTool("list_chats", { limit: 5 });
            console.log("✅ list_chats tool works!");
            console.log("Result:", result.content[0].text);
        } catch (toolError) {
            console.log("⚠️ Tool test failed:", toolError.message);
        }

        console.log("📚 Testing resource access...");

        try {
            console.log("Testing db_schema resource...");
            const schemaResult = await client.readResource("schema://whatsapp/main");
            console.log("✅ Resource access works!");
            console.log("Schema:", schemaResult.contents[0].text);
        } catch (resourceError) {
            console.log("⚠️ Resource test failed:", resourceError.message);
        }

        console.log("🎉 Connection test completed successfully!");
        await client.close();

    } catch (error) {
        console.error("❌ Connection test failed:", error);
        console.error("Error details:", error.message);
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
    }
}

testConnection(); 