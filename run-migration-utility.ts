
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./shared/schema";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function runMigration() {
    const migrationPath = path.resolve("./migrations/add_price_to_appointments.sql");
    console.log(`Reading migration file from: ${migrationPath}`);

    try {
        const migrationSql = fs.readFileSync(migrationPath, "utf8");
        console.log("Executing migration...");

        // Split key statements if necessary, but typically for simple DDL one execute is fine
        // or use sql.raw() if supported, or pool directly.
        // Using pool directly for raw SQL execution is often safer for DDL.

        await pool.query(migrationSql);

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
