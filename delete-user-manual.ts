import 'dotenv/config';
import { storage } from "./server/storage";

async function deleteSpecificUser() {
    const targetEmail = "curl5001@test.com";

    try {
        console.log(`Searching for user with email: ${targetEmail}...`);
        const user = await storage.getUserByEmail(targetEmail);

        if (!user) {
            console.log("User not found.");
            process.exit(0);
        }

        console.log(`Found user ID: ${user.id}, Username: ${user.username}`);
        console.log("Attempting to delete user and all related data...");

        const success = await storage.deleteUser(user.id);

        if (success) {
            console.log("✅ User deleted successfully!");
        } else {
            console.error("❌ Failed to delete user.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error executing deletion:", error);
        process.exit(1);
    }
}

deleteSpecificUser();
