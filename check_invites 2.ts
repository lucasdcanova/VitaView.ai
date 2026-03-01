import { db } from "./server/db";
import { users, clinicInvitations } from "./shared/schema";
import { eq, or, sql } from "drizzle-orm";

async function check() {
  const allInvites = await db.select().from(clinicInvitations);
  console.log("Clinic Invitations:");
  console.log(allInvites);

  const allUsers = await db.select().from(users).where(
    or(
      sql`email = 'isabelapbiasi@gmail.com'`,
      sql`email = 'ricardo.canovax@gmail.com'`
    )
  );
  console.log("\nUsers found:");
  console.log(allUsers.map((u: any) => ({ id: u.id, email: u.email, username: u.username })));
}

check().catch(console.error).finally(() => process.exit(0));
