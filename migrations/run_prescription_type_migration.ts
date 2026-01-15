import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL não está definida');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });

    try {
        console.log('🔄 Executando migração: adicionar coluna prescription_type...');

        await pool.query(`
      ALTER TABLE medications ADD COLUMN IF NOT EXISTS prescription_type TEXT DEFAULT 'padrao';
    `);

        console.log('✅ Coluna prescription_type adicionada com sucesso!');

        // Also add dose_amount if not exists
        await pool.query(`
      ALTER TABLE medications ADD COLUMN IF NOT EXISTS dose_amount INTEGER DEFAULT 1;
    `);

        console.log('✅ Coluna dose_amount verificada/adicionada!');

        // Verify
        const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'medications' 
      AND column_name IN ('prescription_type', 'dose_amount')
    `);

        console.log('📋 Colunas encontradas:', result.rows.map(r => r.column_name));

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
