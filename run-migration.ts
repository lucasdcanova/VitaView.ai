import { pool } from './server/db.js';
import * as fs from 'fs';

async function runMigration() {
    try {
        console.log('Running prescriptions migration...');

        const migrationSQL = fs.readFileSync('./migration-prescriptions.sql', 'utf-8');

        await pool.query(migrationSQL);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
