// sync-google-contacts.js
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import open from 'open';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'whatsapp.db');

// Google OAuth configuration
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3333/oauth2callback'
);

const SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];

async function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}

async function getTokenFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
}

async function fetchGoogleContacts() {
    const service = google.people({ version: 'v1', auth: oauth2Client });

    try {
        const response = await service.people.connections.list({
            resourceName: 'people/me',
            pageSize: 1000,
            personFields: 'names,phoneNumbers',
        });

        const contacts = response.data.connections || [];
        const contactMapping = {};

        contacts.forEach(person => {
            const name = person.names?.[0]?.displayName;
            const phones = person.phoneNumbers || [];

            if (name) {
                phones.forEach(phone => {
                    // Clean the phone number to match WhatsApp format
                    const cleanNumber = phone.value?.replace(/[^0-9]/g, '');
                    if (cleanNumber) {
                        contactMapping[`${cleanNumber}@s.whatsapp.net`] = name;
                    }
                });
            }
        });

        console.log('Contact mapping to be used for update:');
        console.log(contactMapping);
        return contactMapping;
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}

async function updateDatabase(contactMapping) {
    const db = new Database(DB_PATH);

    // Prepare upsert statement (insert or update)
    const upsertStmt = db.prepare(`
        INSERT INTO chats (jid, name)
        VALUES (?, ?)
        ON CONFLICT(jid) DO UPDATE SET name = excluded.name
    `);

    // Begin transaction
    const upsertTransaction = db.transaction((contacts) => {
        let upserted = 0;
        for (const [jid, name] of Object.entries(contacts)) {
            const info = upsertStmt.run(jid, name);
            if (info.changes > 0) {
                upserted++;
                console.log(`Upserted: ${jid} -> ${name}`);
            }
        }
        console.log(`Total rows upserted: ${upserted}`);
    });

    try {
        // Execute upserts in a transaction
        upsertTransaction(contactMapping);
        console.log('Successfully upserted contact names in database');
    } catch (error) {
        console.error('Error updating database:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Start local server to handle OAuth callback
import express from 'express';
const app = express();
const PORT = 3333;

let resolveAuth;
const authPromise = new Promise(resolve => {
    resolveAuth = resolve;
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (code) {
        try {
            const tokens = await getTokenFromCode(code);
            res.send('Authentication successful! You can close this window.');
            resolveAuth(tokens);
        } catch (error) {
            console.error('Error getting tokens:', error);
            res.status(500).send('Authentication failed!');
            resolveAuth(null);
        }
    } else {
        res.status(400).send('No code provided');
        resolveAuth(null);
    }
});

async function main() {
    console.log('Starting Google Contacts sync...');

    // Start local server
    const server = app.listen(PORT, () => {
        console.log(`Listening for OAuth callback on port ${PORT}`);
    });

    try {
        // Get and open auth URL
        const authUrl = await getAuthUrl();
        console.log('Opening browser for authentication...');
        await open(authUrl);

        // Wait for authentication
        const tokens = await authPromise;
        if (!tokens) {
            throw new Error('Authentication failed');
        }

        // Fetch contacts
        console.log('Fetching contacts from Google...');
        const contactMapping = await fetchGoogleContacts();

        // Update database
        console.log('Updating WhatsApp database with contact names...');
        await updateDatabase(contactMapping);

        console.log('Sync completed successfully!');
    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        server.close();
    }
}

// Run the script
main().catch(console.error);
