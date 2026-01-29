import { IStorage } from "../storage";
import logger from "../logger";
import { db } from "../db";
import { tussProcedures, InsertTussProcedure } from "@shared/schema";
import { count } from "drizzle-orm";

// Direct URL to the raw CSV file on GitHub
const TUSS_CSV_URL = "https://raw.githubusercontent.com/charlesfgarcia/tabelas-ans/master/TUSS/tabela%2022/Tabela%2022%20-%20Terminologia%20de%20procedimentos%20e%20eventos%20em%20saude.csv";

// Initial seed data for fallback/immediate usage
export const INITIAL_TUSS_DATA = [
    // Laboratorial - Hematologia
    { name: "Hemograma completo", category: "Hematologia", type: "laboratorial" },
    { name: "Reticulócitos", category: "Hematologia", type: "laboratorial" },
    { name: "Contagem de plaquetas", category: "Hematologia", type: "laboratorial" },
];

export async function seedTussDatabase(storage: IStorage) {
    try {
        const [countResult] = await db.select({ value: count() }).from(tussProcedures);
        const totalCount = countResult.value;

        if (totalCount > 2000) {
            logger.info(`TUSS database already populated (${totalCount} items). Skipping import.`);
            return;
        }

        logger.info(`TUSS database has ${totalCount} items. Starting full import...`);

        logger.info(`Fetching TUSS table from ${TUSS_CSV_URL}...`);
        const response = await fetch(TUSS_CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch TUSS CSV: ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        logger.info(`Fetched ${lines.length} lines. parsing...`);

        // Remove count variable redeclaration
        let seededCount = 0;
        let skipped = 0;
        let batch: InsertTussProcedure[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(';');
            if (parts.length < 3) continue;

            const code = parts[0].trim();
            const name = parts[1].trim();
            const endVigencia = parts[3] ? parts[3].trim() : "";

            if (endVigencia && endVigencia.length > 5) {
                skipped++;
                continue;
            }

            let category = "Geral";
            let type = "outros";

            const lowerName = name.toLowerCase();

            if (lowerName.includes("sangue") || lowerName.includes("hemograma") || lowerName.includes("urina") || lowerName.includes("cultura")) {
                category = "Laboratorial";
                type = "laboratorial";
            } else if (lowerName.includes("raio-x") || lowerName.includes("radiografia")) {
                category = "Radiologia";
                type = "imagem";
            } else if (lowerName.includes("ultrasso") || lowerName.includes("usg ")) {
                category = "Ultrassonografia";
                type = "imagem";
            } else if (lowerName.includes("tomografia")) {
                category = "Tomografia";
                type = "imagem";
            } else if (lowerName.includes("ressonância")) {
                category = "Ressonância";
                type = "imagem";
            } else if (lowerName.includes("consult")) {
                category = "Consultas";
                type = "consulta";
            }

            batch.push({
                code: code.trim(),
                name: name.trim(),
                category,
                type,
                description: "Importado da Tabela TUSS 22",
                isActive: true
            });

            if (batch.length >= 1000) {
                await db.insert(tussProcedures).values(batch).onConflictDoNothing();
                seededCount += batch.length;
                logger.info(`Imported ${seededCount} items...`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await db.insert(tussProcedures).values(batch).onConflictDoNothing();
            seededCount += batch.length;
        }

        logger.info(`✅ TUSS import completed! Total Imported: ${seededCount}, Skipped (inactive): ${skipped}`);

    } catch (error) {
        logger.error("Failed to seed/import TUSS database:", error);
    }
}
