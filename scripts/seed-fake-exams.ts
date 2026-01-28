
import { db } from "../server/db";
import { users } from "@shared/schema";
import { storage } from "../server/storage";

async function seed() {
    console.log("Seeding fake exam data...");

    // 1. Find a target user
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
        console.error("No user found to attach data to.");
        process.exit(1);
    }

    const user = allUsers[0];
    console.log(`Found user: ${user.username} (ID: ${user.id})`);
    const userId = user.id;
    const profileId = user.activeProfileId;

    // 2. Define fake exams
    const fakeExams = [
        { name: "Hemograma Completo", date: "2025-08-15" },
        { name: "Check-up Rotina", date: "2025-10-10" },
        { name: "Exames Laboratoriais", date: "2025-12-05" },
        { name: "Acompanhamento Mensal", date: "2026-01-20" },
    ];

    // 3. Insert Exams and Metrics
    const metricsData = [
        { name: "Hemoglobina Glicada", unit: "%", min: 4.0, max: 7.0, values: [5.2, 5.5, 5.9, 6.2] },
        { name: "Colesterol Total", unit: "mg/dL", min: 140, max: 190, values: [160, 175, 210, 195] },
        { name: "Vitamina D", unit: "ng/mL", min: 20, max: 100, values: [22, 28, 35, 42] },
        { name: "Ferritina", unit: "ng/mL", min: 30, max: 400, values: [45, 120, 90, 85] }
    ];

    for (let i = 0; i < fakeExams.length; i++) {
        const fake = fakeExams[i];
        console.log(`Creating exam: ${fake.name} on ${fake.date}`);

        // Check if exam already exists to avoid duplicates if run multiple times (optional but good practice)
        // Actually, createExam will create a new one. For testing, multiple runs are fine, user can delete.

        const exam = await storage.createExam({
            userId,
            profileId,
            name: fake.name,
            fileType: "pdf",
            status: "analyzed",
            laboratoryName: "Laboratório Exemplo",
            examDate: fake.date,
            originalContent: "Fake content for testing",
            filePath: "fake_path.pdf"
        });

        // Create metrics for this exam
        for (const m of metricsData) {
            const value = m.values[i];
            let status = "normal";
            if (value < m.min) status = "baixo";
            if (value > m.max) status = "alto";

            // Calculate change (simplified)
            let change = undefined;
            if (i > 0) {
                const prev = m.values[i - 1];
                const diff = value - prev;
                change = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
            }

            await storage.createHealthMetric({
                userId,
                profileId,
                examId: exam.id,
                name: m.name,
                value: value.toString(),
                unit: m.unit,
                status,
                date: new Date(fake.date),
                change,
                referenceMin: m.min.toString(),
                referenceMax: m.max.toString()
            });
        }
    }

    console.log("Done seeding!");
    process.exit(0);
}

seed().catch(console.error);
