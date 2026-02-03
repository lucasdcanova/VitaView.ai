import * as dotenv from "dotenv";
dotenv.config();

import { pool } from "./server/db";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
    const sqlPath = path.join(process.cwd(), "migrations", "add_ai_conversations.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running AI conversations migration...");

    try {
        await pool.query(sql);
        console.log("Migration completed successfully!");
    } catch (error: any) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }

    process.exit(0);
}

runMigration();
