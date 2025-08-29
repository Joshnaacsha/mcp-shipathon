# WhatsApp MCP Server

The WhatsApp MCP (Model Context Protocol) server that provides tools for interacting with WhatsApp through the Baileys library.

## Features

- 🔌 **MCP Server** - Model Context Protocol implementation
- 📱 **WhatsApp Integration** - Uses Baileys for WhatsApp Web API
- 🗄️ **Database Storage** - SQLite database for messages and chats
- 🛠️ **Multiple Tools** - Search, send, list, and manage WhatsApp data
- 📊 **Logging** - Comprehensive logging with Pino

## Prerequisites

- Node.js 18+
- WhatsApp account for QR code authentication

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Running the Server

1. Start the server:
```bash
node dist/main.js
```

2. Scan the QR code with your WhatsApp mobile app

3. The server will show "Logged as <your name>" when connected

## MCP Tools Available

### Core Tools
- **list_chats** - List all WhatsApp chats with pagination
- **list_messages** - Get messages from a specific chat
- **search_contacts** - Search contacts by name or phone number
- **search_messages** - Search message content across chats
- **get_chat** - Get detailed information about a specific chat
- **get_message_context** - Get context around a specific message
- **send_message** - Send WhatsApp messages to recipients

### Resources
- **db_schema** - Database schema information

## Configuration

The server uses environment variables and configuration files:

- `mcp-example.json` - MCP client configuration
- `auth_info/` - WhatsApp authentication data
- `data/` - SQLite database files

## Project Structure

```
server/
├── src/
│   ├── main.ts          # Main server entry point
│   ├── mcp.ts           # MCP server implementation
│   ├── whatsapp.ts      # WhatsApp Baileys integration
│   └── database.ts      # Database operations
├── dist/                # Compiled JavaScript (after build)
├── auth_info/           # WhatsApp authentication data
├── data/                # SQLite database files
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── Dockerfile           # Docker configuration
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

3. Run in development mode:
```bash
npm run dev
```

## Testing

The server can be tested using:

1. **MCP Clients** - Any MCP-compatible client
2. **Test Scripts** - Located in the `../client` folder
3. **Manual Testing** - Using the MCP tools directly

## Troubleshooting

1. **QR Code Issues**: Make sure your phone has a stable internet connection
2. **Authentication Errors**: Delete the `auth_info` folder and try again
3. **Database Errors**: Check that the `data` folder is writable
4. **Connection Issues**: Verify the server is running and accessible

## Security Notes

- The server stores WhatsApp authentication data locally
- Messages are stored in a local SQLite database
- Use appropriate security measures in production environments

## Contributing

This server provides the backend MCP functionality for WhatsApp integration. Enhancements to the MCP tools or WhatsApp integration are welcome! 