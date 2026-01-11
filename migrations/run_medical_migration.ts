import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import fs from "fs";
import path from "path";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in .env file");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, "create_medical_documents_tables.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");

        console.log("Executando migração...");
        await pool.query(sql);
        console.log("Migração concluída com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("Erro ao executar migração:", error);
        process.exit(1);
    }
}

runMigration();
