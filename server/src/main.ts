import { pino } from "pino";
import { initializeDatabase } from "./database.js";
import { startWhatsAppConnection, type WhatsAppSocket } from "./whatsapp.js";
import { startMcpServer } from "./mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const waLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination("./wa-logs.txt")
);

const mcpLogger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination("./mcp-logs.txt")
);

async function main() {
  console.log("🚀 Starting WhatsApp MCP Server...");
  mcpLogger.info("Starting WhatsApp MCP Server...");

  let whatsappSocket: WhatsAppSocket | null = null;

  try {
    console.log("📊 Initializing database...");
    mcpLogger.info("Initializing database...");
    initializeDatabase();
    mcpLogger.info("Database initialized successfully.");
    console.log("✅ Database initialized successfully.");

    console.log("📱 Attempting to connect to WhatsApp...");
    mcpLogger.info("Attempting to connect to WhatsApp...");

    try {
      whatsappSocket = await startWhatsAppConnection(waLogger);
      if (whatsappSocket) {
        mcpLogger.info("WhatsApp connection successful");
        console.log("✅ WhatsApp connection successful");
      }
    } catch (waError: any) {
      console.log("❌ WhatsApp connection failed:");
      mcpLogger.error({ err: waError }, "WhatsApp connection failed");

      if (waError.message?.includes("Timed out waiting for QR")) {
        console.log("⚠️ QR code was not generated. Please restart the server.");
      } else if (waError.message?.includes("Timed out waiting for QR scan")) {
        console.log("⚠️ QR code was not scanned in time. Please restart the server.");
      } else {
        console.log("⚠️ Error:", waError.message || "Unknown error");
      }

      mcpLogger.info("MCP server will run without WhatsApp functionality");
      whatsappSocket = null;
    }
  } catch (error: any) {
    console.log("❌ Failed during database initialization:", error);
    mcpLogger.fatal(
      { err: error },
      "Failed during database initialization"
    );
    process.exit(1);
  }

  // Start MCP server in background without blocking
  console.log("🔧 Starting MCP server...");
  mcpLogger.info("Starting MCP server...");

  // Don't await - let it run in background
  startMcpServer(whatsappSocket, mcpLogger, waLogger).catch((error: any) => {
    console.log("❌ MCP server error:", error.message);
    mcpLogger.error({ err: error }, "MCP server error");
  });

  console.log("✅ MCP Server initiated in background!");

  mcpLogger.info("Application setup complete. Running...");
}

async function shutdown(signal: string) {
  mcpLogger.info(`Received ${signal}. Shutting down gracefully...`);

  waLogger.flush();
  mcpLogger.flush();

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((error) => {
  mcpLogger.fatal({ err: error }, "Unhandled error during application startup");
  waLogger.flush();
  mcpLogger.flush();
  process.exit(1);
});
