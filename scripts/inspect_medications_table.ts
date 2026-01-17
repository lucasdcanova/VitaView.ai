
import "dotenv/config";
import { pool } from "../server/db";

async function inspectTable() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'medications';
    `);
        console.log("Medications Table Schema:");
        console.table(res.rows);
    } catch (err) {
        console.error("Error inspecting table:", err);
    } finally {
        await pool.end();
    }
}

inspectTable();
