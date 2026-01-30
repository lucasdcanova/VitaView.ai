
import { db } from "./server/db";
import { subscriptionPlans } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkPlans() {
    console.log("Checking subscription plans...");
    const plans = await db.select().from(subscriptionPlans);

    for (const plan of plans) {
        console.log(`\nPlan: ${plan.name} (ID: ${plan.id})`);
        console.log("Features:", JSON.stringify(plan.features, null, 2));
    }
    process.exit(0);
}

checkPlans().catch(console.error);
