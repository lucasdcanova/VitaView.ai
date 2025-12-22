import 'dotenv/config';
import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Same format as auth.ts: hash.salt
async function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
}

async function run() {
    try {
        console.log('Updating admin password with correct format...');
        const hashedPassword = await hashPassword('admin123');

        await pool.query(
            "UPDATE users SET password = $1 WHERE username = 'admin'",
            [hashedPassword]
        );

        console.log('Password updated successfully!');
        console.log('\n=== CREDENCIAIS DE ADMIN ===');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('==============================\n');

        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
