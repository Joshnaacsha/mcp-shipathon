import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

console.log("🔧 Starting simple MCP test...");

const server = new McpServer({
  name: "test-server",
  version: "0.1.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

console.log("📋 Adding simple tool...");

server.tool(
  "test_tool",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "Test tool works!",
        },
      ],
    };
  }
);

console.log("🔌 Creating transport...");
const transport = new StdioServerTransport();

console.log("🔗 Connecting server...");
try {
  await server.connect(transport);
  console.log("✅ MCP server connected and ready!");
} catch (error) {
  console.log("❌ Error:", error.message);
  process.exit(1);
}
