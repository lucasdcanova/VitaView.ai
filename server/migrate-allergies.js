import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    console.log('Running allergies table migration...');
    
    const migrationSQL = readFileSync(
      join(process.cwd(), 'server/db/migrations/create_allergies_table.sql'), 
      'utf8'
    );
    
    await pool.query(migrationSQL);
    console.log('✅ Allergies table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();