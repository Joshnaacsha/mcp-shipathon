# WhatsApp MCP Project

A complete WhatsApp integration using the Model Context Protocol (MCP) with a modern React TypeScript client and a powerful MCP server.

## 🏗️ Project Structure

```
mcp-shipathon/
├── client/                 # React TypeScript Client
│   ├── src/               # React source code
│   ├── test-mcp-client.js # Automated test client
│   ├── interactive-mcp-client.js # Interactive test client
│   └── run-tests.bat      # Windows test runner
├── server/                 # MCP Server
│   ├── src/               # TypeScript source code
│   ├── dist/              # Compiled JavaScript
│   ├── auth_info/         # WhatsApp authentication
│   └── data/              # SQLite database
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Start the MCP Server

```bash
cd server
npm install
npm run build
node dist/main.js
```

Scan the QR code with your WhatsApp mobile app. You should see "Logged as <your name>" when connected.

### 2. Test the MCP Server

#### Option A: Automated Test Client
```bash
cd client
node test-mcp-client.js
```

#### Option B: Interactive Test Client
```bash
cd client
node interactive-mcp-client.js
```

#### Option C: React Web Client
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## 🛠️ What You Can Do

### MCP Tools Available
- **📱 List Chats** - View all your WhatsApp conversations
- **💬 List Messages** - Read messages from specific chats
- **👥 Search Contacts** - Find contacts by name or phone
- **🔍 Search Messages** - Search message content across chats
- **📋 Get Chat Details** - Detailed chat information
- **📤 Send Messages** - Send WhatsApp messages to anyone
- **🗄️ Database Schema** - View database structure

### Client Applications
1. **Automated Test Client** - Tests all MCP tools automatically
2. **Interactive Test Client** - Command-line interface for manual testing
3. **React Web Client** - Beautiful desktop-like web interface

## 🔧 Technical Details

### Server (MCP)
- **Framework**: Node.js with TypeScript
- **WhatsApp**: Baileys library for WhatsApp Web API
- **Database**: SQLite for message storage
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: stdio for local communication

### Client (React)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Modern CSS with responsive design
- **MCP Client**: Official MCP SDK integration

## 📱 Features

- ✅ **Real-time WhatsApp Integration**
- ✅ **Message History & Search**
- ✅ **Contact Management**
- ✅ **Group Chat Support**
- ✅ **Message Sending**
- ✅ **Beautiful Modern UI**
- ✅ **Responsive Design**
- ✅ **TypeScript Support**
- ✅ **Comprehensive Testing**

## 🎯 Use Cases

- **Personal Use**: Access WhatsApp from desktop
- **Business**: Customer service integration
- **Development**: Test MCP implementations
- **Learning**: Understand MCP protocol
- **Automation**: WhatsApp bot development

## 🚨 Important Notes

1. **Authentication**: Your WhatsApp session is stored locally
2. **Privacy**: Messages are stored in a local database
3. **Security**: Keep your `auth_info` folder secure
4. **Compliance**: Follow WhatsApp's terms of service

## 🐛 Troubleshooting

### Common Issues
1. **QR Code Won't Scan**: Check phone internet connection
2. **Connection Failed**: Ensure server is running in `server/` folder
3. **Build Errors**: Use Node.js 18+ and run `npm install`
4. **Authentication Errors**: Delete `auth_info` folder and restart

### Getting Help
1. Check the logs in the terminal
2. Verify all dependencies are installed
3. Ensure correct folder structure
4. Check Node.js version compatibility

## 🔮 Future Enhancements

- [ ] Message encryption
- [ ] File/media support
- [ ] Webhook integration
- [ ] Multi-account support
- [ ] Advanced search filters
- [ ] Message scheduling
- [ ] Analytics dashboard

## 📚 Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Baileys WhatsApp Library](https://github.com/WhiskeysSockets/Baileys)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This project demonstrates MCP integration with WhatsApp. Feel free to:

- Improve the UI/UX
- Add new MCP tools
- Enhance error handling
- Optimize performance
- Add new features

## 📄 License

This project is for educational and development purposes. Please respect WhatsApp's terms of service and use responsibly.

---

**Happy coding with MCP! 🚀**
