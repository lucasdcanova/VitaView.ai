import 'dotenv/config';
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function setAdminRole() {
    try {
        console.log("Looking for admin user...");

        const result = await db
            .update(users)
            .set({ role: 'admin' })
            .where(eq(users.email, 'admin@vitaview.ai'))
            .returning({ id: users.id, email: users.email, role: users.role });

        if (result.length > 0) {
            console.log("Admin role set successfully:", result[0]);
        } else {
            console.log("User not found");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

setAdminRole();
