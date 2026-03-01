import { createHmac } from "crypto";
import { db } from "../server/db";
import { sql, eq } from "drizzle-orm";
import { clinics, users } from "../shared/schema";

function signSessionId(sid: string, secret: string): string {
  const sig = createHmac("sha256", secret)
    .update(sid)
    .digest("base64")
    .replace(/=+$/, "");
  return `s:${sid}.${sig}`;
}

async function run() {
  const userId = 25;
  const sessionRows = await db.execute(sql`
    select sid, sess::text as sess
    from session
    where sess::text like ${'%"passport":{"user":25%'}
    order by expire desc
    limit 1
  `);

  const session = sessionRows.rows?.[0] as { sid?: string } | undefined;
  if (!session?.sid) {
    console.log("No session for user 25");
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.log("SESSION_SECRET missing");
    return;
  }

  const cookieVal = encodeURIComponent(signSessionId(session.sid, secret));
  const name = `Diag Clinic ${Date.now()}`;

  const res = await fetch("http://localhost:3000/api/clinics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `connect.sid=${cookieVal}`,
    },
    body: JSON.stringify({ name }),
  });

  const bodyText = await res.text();
  console.log("status", res.status);
  console.log("body", bodyText);

  if (res.status === 201) {
    try {
      const parsed = JSON.parse(bodyText) as { clinic?: { id?: number } };
      const clinicId = parsed?.clinic?.id;
      if (clinicId) {
        await db.delete(clinics).where(eq(clinics.id, clinicId));
        await db.update(users).set({ clinicId: null, clinicRole: null }).where(eq(users.id, userId));
        console.log("cleanup", "deleted clinic", clinicId);
      }
    } catch (error) {
      console.log("cleanup", "skip parse", String(error));
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
