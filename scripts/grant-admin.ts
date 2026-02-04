
import 'dotenv/config';
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function grantAdmin() {
    const email = "ricardo.canovax@gmail.com";
    console.log(`Looking for user with email: ${email}`);

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.error("User not found!");
            process.exit(1);
        }

        console.log(`Found user: ${user.username} (ID: ${user.id}, Current Role: ${user.role})`);

        await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.id, user.id));

        console.log("Successfully updated user role to 'admin'.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating user role:", error);
        process.exit(1);
    }
}

grantAdmin();
