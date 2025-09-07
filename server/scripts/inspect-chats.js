// inspect-chats.js
// Script to inspect the chats table and print JID and name for all contacts

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'whatsapp.db');

const db = new Database(DB_PATH);

const rows = db.prepare("SELECT jid, name FROM chats WHERE jid NOT LIKE '%@g.us' ORDER BY name ASC, jid ASC").all();

console.log('Contacts in chats table:');
rows.forEach(row => {
    console.log(`JID: ${row.jid} | Name: ${row.name}`);
});

db.close();
