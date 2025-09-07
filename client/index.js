

// Load environment variables from .env
import dotenv from 'dotenv';
dotenv.config();

// index.js
// REST API endpoint for WhatsApp Agent

import express from 'express';
import { processNaturalLanguageCommand } from './whatsapp-agent.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// POST endpoint to receive natural language input
// POST endpoint to receive natural language input
app.post('/api/whatsapp', async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    try {
        const result = await processNaturalLanguageCommand(input);
        res.json(result);
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({
            success: false,
            error: err.toString(),
            input: input
        });
    }
});
app.post('/api/whatsapp', async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    try {
        const result = await processNaturalLanguageCommand(input);
        res.json(result);
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({
            success: false,
            error: err.toString(),
            input: input
        });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Agent API listening on port ${PORT}`);
});
