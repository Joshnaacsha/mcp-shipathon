import React, { useState, useEffect } from 'react'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import './App.css'

interface Chat {
    jid: string
    name: string
    is_group: boolean
    last_message_time: string | null
    last_message_preview: string | null
    last_sender_display: string | null
    last_is_from_me: boolean | null
}

interface Message {
    id: string
    chat_jid: string
    chat_name: string
    sender_jid: string | null
    sender_display: string
    content: string
    timestamp: string
    is_from_me: boolean
}

interface Contact {
    jid: string
    name: string
}

interface Tool {
    name: string
    description: string
}

function App() {
    const [client, setClient] = useState<Client | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [tools, setTools] = useState<Tool[]>([])
    const [chats, setChats] = useState<Chat[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'chats' | 'messages' | 'contacts' | 'search' | 'send'>('chats')

    // Form states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedChatJid, setSelectedChatJid] = useState('')
    const [messageContent, setMessageContent] = useState('')
    const [recipientJid, setRecipientJid] = useState('')

    useEffect(() => {
        initClient()
    }, [])

    const initClient = async () => {
        try {
            setLoading(true)
            setError(null)

            const mcpClient = new Client({
                name: "whatsapp-react-client",
                version: "0.1.0",
            })

            const transport = new StdioClientTransport({
                command: "node",
                args: ["../server/dist/main.js"],
            })

            // Connect to the MCP server
            console.log("Connecting to MCP server...")
            await mcpClient.connect(transport)
            console.log("MCP connection established")

            // Wait a moment for the connection to stabilize
            await new Promise(resolve => setTimeout(resolve, 1000))

            setClient(mcpClient)
            setIsConnected(true)

            try {
                // Get available tools
                const availableTools = await mcpClient.listTools()
                setTools(availableTools)
            } catch (toolError: any) {
                console.warn("Could not fetch tools:", toolError.message)
                setTools([])
            }

            // Load initial data
            await loadChats()

        } catch (err: any) {
            setError(`Failed to connect: ${err.message}`)
            setIsConnected(false)
        } finally {
            setLoading(false)
        }
    }

    const loadChats = async () => {
        if (!client) return

        try {
            setLoading(true)
            const result = await client.callTool("list_chats", { limit: 20 })
            const chatData = JSON.parse(result.content[0].text)
            setChats(chatData)
        } catch (err: any) {
            setError(`Failed to load chats: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (chatJid: string) => {
        if (!client) return

        try {
            setLoading(true)
            const result = await client.callTool("list_messages", {
                chat_jid: chatJid,
                limit: 50
            })
            const messageData = JSON.parse(result.content[0].text)
            setMessages(messageData)
            setSelectedChatJid(chatJid)
        } catch (err: any) {
            setError(`Failed to load messages: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const searchContacts = async () => {
        if (!client || !searchQuery.trim()) return

        try {
            setLoading(true)
            const result = await client.callTool("search_contacts", { query: searchQuery })
            const contactData = JSON.parse(result.content[0].text)
            setContacts(contactData)
            setActiveTab('contacts')
        } catch (err: any) {
            setError(`Failed to search contacts: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const searchMessages = async () => {
        if (!client || !searchQuery.trim()) return

        try {
            setLoading(true)
            const result = await client.callTool("search_messages", {
                query: searchQuery,
                limit: 20
            })
            const messageData = JSON.parse(result.content[0].text)
            setMessages(messageData)
            setActiveTab('messages')
        } catch (err: any) {
            setError(`Failed to search messages: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async () => {
        if (!client || !recipientJid.trim() || !messageContent.trim()) return

        try {
            setLoading(true)
            const result = await client.callTool("send_message", {
                recipient: recipientJid,
                message: messageContent
            })

            if (result.isError) {
                setError(`Failed to send message: ${result.content[0].text}`)
            } else {
                setError(null)
                setMessageContent('')
                setRecipientJid('')
                alert('Message sent successfully!')
            }
        } catch (err: any) {
            setError(`Failed to send message: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const disconnect = async () => {
        if (client) {
            await client.close()
            setClient(null)
            setIsConnected(false)
            setTools([])
            setChats([])
            setMessages([])
            setContacts([])
        }
    }

    if (loading && !isConnected) {
        return (
            <div className="app">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Connecting to WhatsApp MCP Server...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>📱 WhatsApp MCP Client</h1>
                <div className="connection-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                    {isConnected && (
                        <button onClick={disconnect} className="disconnect-btn">
                            Disconnect
                        </button>
                    )}
                </div>
            </header>

            {error && (
                <div className="error-banner">
                    <span>❌ {error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {!isConnected ? (
                <div className="connect-container">
                    <button onClick={initClient} className="connect-btn">
                        Connect to MCP Server
                    </button>
                </div>
            ) : (
                <div className="app-content">
                    <nav className="tab-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            📱 Chats
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setActiveTab('messages')}
                        >
                            💬 Messages
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contacts')}
                        >
                            👥 Contacts
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => setActiveTab('search')}
                        >
                            🔍 Search
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
                            onClick={() => setActiveTab('send')}
                        >
                            📤 Send Message
                        </button>
                    </nav>

                    <div className="tab-content">
                        {activeTab === 'chats' && (
                            <div className="chats-tab">
                                <div className="tab-header">
                                    <h2>Your Chats</h2>
                                    <button onClick={loadChats} disabled={loading} className="refresh-btn">
                                        {loading ? '🔄' : '🔄'} Refresh
                                    </button>
                                </div>
                                <div className="chats-list">
                                    {chats.map((chat) => (
                                        <div
                                            key={chat.jid}
                                            className="chat-item"
                                            onClick={() => loadMessages(chat.jid)}
                                        >
                                            <div className="chat-info">
                                                <h3>{chat.name}</h3>
                                                <p className="chat-jid">{chat.jid}</p>
                                                {chat.last_message_preview && (
                                                    <p className="last-message">
                                                        {chat.last_sender_display}: {chat.last_message_preview}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="chat-meta">
                                                {chat.is_group && <span className="group-badge">👥 Group</span>}
                                                {chat.last_message_time && (
                                                    <span className="last-time">
                                                        {new Date(chat.last_message_time).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="messages-tab">
                                <div className="tab-header">
                                    <h2>Messages</h2>
                                    {selectedChatJid && (
                                        <p className="selected-chat">Chat: {selectedChatJid}</p>
                                    )}
                                </div>
                                <div className="messages-list">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`message-item ${message.is_from_me ? 'from-me' : 'from-other'}`}
                                        >
                                            <div className="message-header">
                                                <span className="sender">{message.sender_display}</span>
                                                <span className="time">
                                                    {new Date(message.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="message-content">{message.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'contacts' && (
                            <div className="contacts-tab">
                                <div className="tab-header">
                                    <h2>Contacts</h2>
                                </div>
                                <div className="contacts-list">
                                    {contacts.map((contact) => (
                                        <div key={contact.jid} className="contact-item">
                                            <div className="contact-info">
                                                <h3>{contact.name}</h3>
                                                <p className="contact-jid">{contact.jid}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'search' && (
                            <div className="search-tab">
                                <div className="tab-header">
                                    <h2>Search</h2>
                                </div>
                                <div className="search-form">
                                    <input
                                        type="text"
                                        placeholder="Enter search query..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                    <div className="search-buttons">
                                        <button
                                            onClick={searchContacts}
                                            disabled={loading || !searchQuery.trim()}
                                            className="search-btn"
                                        >
                                            🔍 Search Contacts
                                        </button>
                                        <button
                                            onClick={searchMessages}
                                            disabled={loading || !searchQuery.trim()}
                                            className="search-btn"
                                        >
                                            💬 Search Messages
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'send' && (
                            <div className="send-tab">
                                <div className="tab-header">
                                    <h2>Send Message</h2>
                                </div>
                                <div className="send-form">
                                    <div className="form-group">
                                        <label>Recipient JID:</label>
                                        <input
                                            type="text"
                                            placeholder="1234567890@s.whatsapp.net"
                                            value={recipientJid}
                                            onChange={(e) => setRecipientJid(e.target.value)}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Message:</label>
                                        <textarea
                                            placeholder="Enter your message..."
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                            rows={4}
                                            className="form-textarea"
                                        />
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={loading || !recipientJid.trim() || !messageContent.trim()}
                                        className="send-btn"
                                    >
                                        📤 Send Message
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default App 