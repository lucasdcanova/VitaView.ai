import { storage } from "./server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
    try {
        const username = "admin";
        const password = "adminpassword";

        console.log(`Checking if user ${username} exists...`);
        const existingUser = await storage.getUserByUsername(username);

        if (existingUser) {
            console.log(`User ${username} already exists.`);
            return;
        }

        console.log(`Creating user ${username}...`);
        const hashedPassword = await hashPassword(password);

        const user = await storage.createUser({
            username,
            password: hashedPassword,
            fullName: "System Admin",
            email: "admin@vitaview.ai",
            // role: "admin" // Assuming role field exists or will be handled by RBAC system based on username
        });

        console.log(`User ${username} created successfully.`);
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
}

createAdmin();
