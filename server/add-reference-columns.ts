
import "dotenv/config";
import { pool } from "./db";

async function main() {
    try {
        console.log("Adding reference columns to health_metrics table...");

        const query = `
      ALTER TABLE health_metrics 
      ADD COLUMN IF NOT EXISTS reference_min TEXT,
      ADD COLUMN IF NOT EXISTS reference_max TEXT;
    `;

        await pool.query(query);
        console.log("Columns added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error adding columns:", err);
        process.exit(1);
    }
}

main();
