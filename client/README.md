# WhatsApp MCP React Client

A modern React TypeScript client for the WhatsApp MCP (Model Context Protocol) server.

## Features

- 🚀 **Modern React 18** with TypeScript
- 📱 **Beautiful UI** with WhatsApp-inspired design
- 🔌 **MCP Integration** - connects to your WhatsApp MCP server
- 📋 **Multiple Tabs**: Chats, Messages, Contacts, Search, Send Message
- 🎨 **Responsive Design** - works on desktop and mobile
- ⚡ **Fast Development** with Vite

## Prerequisites

- Node.js 18+ 
- Your WhatsApp MCP server running (in the `../server` folder)

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Testing

### Option 1: Automated Test Client
```bash
node test-mcp-client.js
```

### Option 2: Interactive Test Client
```bash
node interactive-mcp-client.js
```

### Option 3: Use the Batch File
Double-click `run-tests.bat` and choose your option.

## Building for Production

```bash
npm run build
```

## Project Structure

```
client/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Base styles
├── test-mcp-client.js   # Automated test client
├── interactive-mcp-client.js # Interactive test client
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── run-tests.bat        # Windows test runner
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## MCP Tools Supported

- **list_chats** - List all WhatsApp chats
- **list_messages** - Get messages from a specific chat
- **search_contacts** - Search for contacts
- **search_messages** - Search message content
- **get_chat** - Get detailed chat information
- **send_message** - Send WhatsApp messages

## Troubleshooting

1. **Connection Failed**: Make sure your MCP server is running in the `../server` folder
2. **Build Errors**: Check that all dependencies are installed with `npm install`
3. **TypeScript Errors**: Ensure you're using Node.js 18+ and the latest npm

## Contributing

This is a client application for testing and demonstrating the WhatsApp MCP server capabilities. Feel free to enhance the UI or add new features! 