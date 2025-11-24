import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function generate() {
    const adminHash = await hashPassword("adminpassword");
    const demoHash = await hashPassword("password");
    console.log("ADMIN_HASH=" + adminHash);
    console.log("DEMO_HASH=" + demoHash);
}

generate();
