import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import path from "path";

console.log("🚀 Starting Simple WhatsApp MCP Server...");

// Simple WhatsApp connection
let whatsappSocket = null;

async function connectWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log("📱 QR Code generated! Scan with WhatsApp.");
      }
      
      if (connection === 'open') {
        console.log("✅ WhatsApp connected!");
        whatsappSocket = sock;
      }
    });

    sock.ev.on('creds.update', saveCreds);
    
    return sock;
  } catch (error) {
    console.log("⚠️ WhatsApp connection failed:", error.message);
    return null;
  }
}

// Start WhatsApp
const sock = await connectWhatsApp();

// Create MCP Server
const server = new McpServer({
  name: "simple-whatsapp",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// Add simple status tool
server.tool("get_status", {
  description: "Check WhatsApp connection status"
}, async () => {
  const isConnected = whatsappSocket && whatsappSocket.user;
  const status = isConnected ? "Connected" : "Disconnected";
  const user = whatsappSocket?.user?.name || "None";
  
  return {
    content: [{
      type: "text",
      text: `WhatsApp Status: ${status}\nUser: ${user}`
    }]
  };
});

// Add send message tool
server.tool("send_message", {
  description: "Send WhatsApp message",
  inputSchema: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient JID" },
      message: { type: "string", description: "Message text" }
    },
    required: ["to", "message"]
  }
}, async (args) => {
  if (!whatsappSocket) {
    return {
      content: [{
        type: "text",
        text: "❌ WhatsApp not connected"
      }]
    };
  }
  
  try {
    await whatsappSocket.sendMessage(args.to, { text: args.message });
    return {
      content: [{
        type: "text",
        text: `✅ Message sent to ${args.to}: ${args.message}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to send message: ${error.message}`
      }]
    };
  }
});

// Connect MCP server
console.log("🔌 Starting MCP server...");
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("✅ Simple WhatsApp MCP Server ready!");
