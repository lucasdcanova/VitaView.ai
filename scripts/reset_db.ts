import { pool } from "../server/db";

async function reset() {
    console.log("Resetting database (DROP SCHEMA public)...");
    try {
        await pool.query("DROP SCHEMA public CASCADE");
        await pool.query("CREATE SCHEMA public");
        // Grant permissions if necessary? Usually owner has them.
        await pool.query("GRANT ALL ON SCHEMA public TO public");
        console.log("Database reset successful. Schema is empty.");
    } catch (e) {
        console.error("Error resetting DB:", e);
    } finally {
        await pool.end();
    }
}

reset();
