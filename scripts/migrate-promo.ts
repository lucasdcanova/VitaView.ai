
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log("Checking and adding columns...");
        await pool.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN IF NOT EXISTS promo_price INTEGER,
      ADD COLUMN IF NOT EXISTS promo_description TEXT
    `);

        console.log("Updating 'Profissional de Saúde' plan...");
        const result = await pool.query(`
      UPDATE subscription_plans 
      SET promo_price = 4900, promo_description = 'no 1º mês'
      WHERE name = 'Profissional de Saúde'
    `);

        console.log(`Updated ${result.rowCount} rows.`);

        const finalCheck = await pool.query(`
      SELECT name, price, promo_price, promo_description 
      FROM subscription_plans 
      WHERE name = 'Profissional de Saúde'
    `);
        console.log("Final data:", finalCheck.rows[0]);

        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();
