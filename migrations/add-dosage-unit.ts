import { config } from "dotenv";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL não está definida no arquivo .env");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
    try {
        console.log("🔄 Executando migração: adicionar coluna dosage_unit...");
        console.log("📊 Conectando ao banco de dados...");

        // Add dosage_unit column if it doesn't exist
        await pool.query(`
      ALTER TABLE medications 
      ADD COLUMN IF NOT EXISTS dosage_unit TEXT DEFAULT 'mg'
    `);

        console.log("✅ Coluna dosage_unit adicionada com sucesso!");

        // Add comment to the column
        await pool.query(`
      COMMENT ON COLUMN medications.dosage_unit IS 'Unit of measurement for dosage (mg, g, ml, mcg, UI, %, gotas, comprimido(s), cápsula(s))'
    `);

        console.log("✅ Migração executada com sucesso!");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao executar migração:", error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
