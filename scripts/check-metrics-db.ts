
import { db } from "../server/db";
import { exams, healthMetrics } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkData() {
    const allExams = await db.select().from(exams);
    console.log(`Total exams: ${allExams.length}`);
    allExams.forEach(e => console.log(`Exam: ${e.id} - ${e.name}`));

    const allMetrics = await db.select().from(healthMetrics);
    console.log(`Total metrics: ${allMetrics.length}`);

    let matchCount = 0;
    for (const m of allMetrics) {
        if (m.examId) {
            const parent = allExams.find(e => e.id === m.examId);
            if (parent) {
                matchCount++;
            } else {
                console.log(`Orphan metric: ${m.name} (examId: ${m.examId})`);
            }
        } else {
            console.log(`Metric without examId: ${m.name}`);
        }
    }

    console.log(`Metrics with valid parent exam: ${matchCount}`);
    process.exit(0);
}

checkData().catch(console.error);
