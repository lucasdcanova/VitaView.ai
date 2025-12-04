import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}
console.log('DATABASE_URL starts with:', connectionString.substring(0, 15));


const pool = new Pool({ connectionString });

async function runMigration() {
    try {
        console.log('Running migration...');
        const sql = fs.readFileSync(path.join(__dirname, 'create_all_missing_tables.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
