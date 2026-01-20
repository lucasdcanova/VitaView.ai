
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testConnection() {
    console.log("Testing connection...");
    try {
        const client = await pool.connect();
        console.log("Connected!");
        const res = await client.query('SELECT NOW()');
        console.log("Query result:", res.rows[0]);
        client.release();
        await pool.end();
        console.log("Connection verified.");
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

testConnection();
