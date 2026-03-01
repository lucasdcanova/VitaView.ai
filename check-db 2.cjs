const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDb() {
    try {
        const users = await pool.query(`SELECT id, username, full_name, clinic_id FROM users WHERE full_name ILIKE '%ricardo%' OR username ILIKE '%ricardo%'`);
        console.log('Ricardo:', users.rows);

        if (users.rows.length > 0) {
            const ricardoId = users.rows[0].id;
            const clinicId = users.rows[0].clinic_id;

            const profilesByUserId = await pool.query(`SELECT id, name, user_id, clinic_id FROM profiles WHERE user_id = $1`, [ricardoId]);
            console.log('--- Patients created by Ricardo ---');
            console.log(profilesByUserId.rows);

            if (clinicId) {
                const profilesByClinicId = await pool.query(`SELECT id, name, user_id, clinic_id FROM profiles WHERE clinic_id = $1`, [clinicId]);
                console.log('--- Total Clinic Patients ---');
                console.log(`Count: ${profilesByClinicId.rows.length}`);

                const nullClinicProfiles = await pool.query(`SELECT COUNT(*) FROM profiles WHERE clinic_id IS NULL AND user_id IN (SELECT id FROM users WHERE clinic_id = $1)`, [clinicId]);
                console.log(`--- Null Clinic Patients for this Clinic's Users ---`);
                console.log(nullClinicProfiles.rows[0]);
            }

            const secr = await pool.query(`SELECT id, username, clinic_id FROM users WHERE clinic_role = 'secretary' AND clinic_id = $1 LIMIT 1`, [clinicId]);
            if (secr.rows.length > 0) {
                const secProfiles = await pool.query(`SELECT id, name, user_id, clinic_id FROM profiles WHERE user_id = $1`, [secr.rows[0].id]);
                console.log(`--- Patients created by Secretary ${secr.rows[0].username} ---`);
                console.log(`Count: ${secProfiles.rows.length}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkDb();
