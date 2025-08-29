import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

console.log("🔧 Starting minimal MCP server...");

const server = new McpServer({
  name: "minimal-test",
  version: "0.1.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

console.log("📋 Adding test tool...");

server.tool(
  "test_status",
  {
    description: "Simple test tool",
  },
  async () => {
    console.log("✅ Test tool executed!");
    return {
      content: [
        {
          type: "text",
          text: "Test tool works perfectly!",
        },
      ],
    };
  }
);

console.log("🔌 Creating transport...");
const transport = new StdioServerTransport();

console.log("🔗 Connecting server...");
await server.connect(transport);
console.log("✅ Minimal MCP server ready!");
