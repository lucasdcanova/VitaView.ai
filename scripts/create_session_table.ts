import 'dotenv/config';
import { pool } from "../server/db";

async function createSessionTable() {
    try {
        console.log("Creating session table...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);

        // Check if primary key exists
        try {
            await pool.query(`
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      `);
        } catch (err: any) {
            if (err.code === '23505' || err.message.includes('already exists')) {
                console.log("Primary key already exists, skipping.");
            } else {
                console.log("Note regarding PKEY:", err.message);
            }
        }

        await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

        console.log("Session table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating session table:", error);
        process.exit(1);
    }
}

createSessionTable();
