
import "dotenv/config";
import { pool, db } from "../server/db";
import { users, clinics, subscriptions, subscriptionPlans, appointments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
    console.log("🌱 Starting seed for Clinic Features...");

    // 1. Ensure 'Vita Team' plan exists
    let teamPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.name, "Vita Team")
    });

    if (!teamPlan) {
        console.log("Creating Vita Team plan...");
        [teamPlan] = await db.insert(subscriptionPlans).values({
            name: "Vita Team",
            description: "Para clínicas e equipes",
            price: 29990, // cents
            interval: "month",
            maxProfiles: 5,
            maxUploadsPerProfile: 1000,
            features: ["clinic_management", "unified_agenda"]
        }).returning();
    }

    // 2. Create/Get Clinic Admin User
    const adminEmail = "admin@clinic.test";
    let adminUser = await db.query.users.findFirst({
        where: eq(users.email, adminEmail)
    });

    if (!adminUser) {
        console.log("Creating Admin User...");
        const pwd = await hashPassword("password123");
        [adminUser] = await db.insert(users).values({
            email: adminEmail,
            username: "ClinicAdmin",
            fullName: "Dr. Admin",
            password: pwd,
            role: "doctor"
        }).returning();
    } else {
        // Ensure password is known
        const pwd = await hashPassword("password123");
        await db.update(users).set({ password: pwd }).where(eq(users.id, adminUser.id));
        console.log("Updated Admin User password.");
    }

    // 3. Subscription for Admin
    const activeSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, adminUser.id)
    });

    if (!activeSub) {
        console.log("Creating Subscription...");
        await db.insert(subscriptions).values({
            userId: adminUser.id,
            planId: teamPlan.id,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    } else {
        console.log("Updating Subscription to Vita Team...");
        await db.update(subscriptions).set({ planId: teamPlan.id, status: "active" }).where(eq(subscriptions.id, activeSub.id));
    }

    // 4. Create Clinic
    let clinic = await db.query.clinics.findFirst({
        where: eq(clinics.adminUserId, adminUser.id)
    });

    if (!clinic) {
        console.log("Creating Clinic...");
        [clinic] = await db.insert(clinics).values({
            name: "Clínica Vida Saudável",
            adminUserId: adminUser.id,
            maxProfessionals: 5
        }).returning();
    }

    // Update user's clinicId and role
    await db.update(users).set({ clinicId: clinic.id, clinicRole: "admin" }).where(eq(users.id, adminUser.id));

    // 5. Create Member User
    const memberEmail = "member@clinic.test";
    let memberUser = await db.query.users.findFirst({
        where: eq(users.email, memberEmail)
    });

    if (!memberUser) {
        console.log("Creating Member User...");
        const pwd = await hashPassword("password123");
        [memberUser] = await db.insert(users).values({
            email: memberEmail,
            username: "DrMember",
            fullName: "Dra. Ana Member",
            password: pwd,
            role: "doctor",
            clinicId: clinic.id,
            clinicRole: "member"
        }).returning();
    } else {
        // Update existing member
        await db.update(users).set({ clinicId: clinic.id, clinicRole: "member" }).where(eq(users.id, memberUser.id));
    }

    // 6. Create Appointments
    console.log("Creating Appointments...");

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Clear existing appointments for cleaner test? No, let's just append.
    // Or we can check if they exist.
    // Let's just append.

    await db.insert(appointments).values([
        {
            userId: adminUser.id,
            clinicId: clinic.id,
            date: today,
            time: "09:00",
            duration: 30,
            type: "consulta",
            status: "scheduled",
            notes: "Routine Checkup",
            patientName: "João Silva"
        },
        {
            userId: adminUser.id,
            clinicId: clinic.id,
            date: today,
            time: "10:00",
            duration: 60,
            type: "retorno",
            status: "completed",
            notes: "Follow up",
            patientName: "Maria Santos"
        },
        {
            userId: memberUser.id,
            clinicId: clinic.id,
            date: today,
            time: "14:00",
            duration: 45,
            type: "consulta",
            status: "scheduled",
            notes: "New Patient Consultation",
            patientName: "Pedro Oliveira"
        },
        {
            userId: memberUser.id,
            clinicId: clinic.id,
            date: tomorrow,
            time: "11:00",
            duration: 30,
            type: "retorno",
            status: "scheduled",
            notes: "Return visit",
            patientName: "Ana Costa"
        }
    ]);

    console.log("✅ Seed completed successfully!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
