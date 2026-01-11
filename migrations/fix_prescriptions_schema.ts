import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in .env file");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
    try {
        console.log("Executando atualização de schema para prescriptions...");

        // Adicionar colunas faltantes em prescriptions
        await pool.query(`
      ALTER TABLE prescriptions 
      ADD COLUMN IF NOT EXISTS profile_id INTEGER REFERENCES profiles(id),
      ADD COLUMN IF NOT EXISTS doctor_name TEXT,
      ADD COLUMN IF NOT EXISTS doctor_crm TEXT,
      ADD COLUMN IF NOT EXISTS doctor_specialty TEXT,
      ADD COLUMN IF NOT EXISTS medications JSON,
      ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS observations TEXT,
      ADD COLUMN IF NOT EXISTS pdf_path TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `);

        console.log("Schema atualizado com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("Erro ao atualizar schema:", error);
        process.exit(1);
    }
}

runMigration();
