import 'dotenv/config';
import { db } from "./server/db";
import { users } from "./shared/schema";

async function checkUsers() {
    try {
        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            username: users.username
        }).from(users);

        console.log("Users in database:");
        allUsers.forEach(u => console.log(`  ID: ${u.id}, Email: ${u.email}, Username: ${u.username}`));
        console.log(`Total: ${allUsers.length} users`);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkUsers();
