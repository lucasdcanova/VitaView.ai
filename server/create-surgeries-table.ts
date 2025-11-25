
import "dotenv/config";
import { pool } from "./db";

async function main() {
    try {
        console.log("Creating surgeries table...");

        const query = `
      CREATE TABLE IF NOT EXISTS surgeries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        procedure_name TEXT NOT NULL,
        hospital_name TEXT,
        surgeon_name TEXT,
        surgery_date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

        await pool.query(query);
        console.log("Surgeries table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating surgeries table:", err);
        process.exit(1);
    }
}

main();
