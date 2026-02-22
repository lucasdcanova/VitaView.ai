const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function dumpProfiles() {
    try {
        const res = await pool.query(`
      SELECT p.id, p.name as patient_name, u.username as creator_username, u.clinic_id as creator_clinic, p.clinic_id as profile_clinic
      FROM profiles p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC
    `);
        console.log(res.rows);
    } finally {
        pool.end();
    }
}

dumpProfiles();
