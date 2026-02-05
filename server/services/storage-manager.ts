import { db } from "../db";
import { exams, storageLogs } from "@shared/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { S3Service } from "./s3.service";
import logger from "../logger";

export class StorageManager {
    /**
     * Executa a política de migração de storage.
     * Move arquivos 'hot' com mais de 6 meses para 'cold' (S3 Standard-IA).
     */
    static async runMigrationPolicy() {
        try {
            logger.info("[StorageManager] Iniciando verificação de política de storage...");

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            // Encontrar exames elegíveis: HOT e antigos
            const candidates = await db.select()
                .from(exams)
                .where(
                    and(
                        eq(exams.storageClass, 'hot'),
                        lt(exams.uploadDate, sixMonthsAgo),
                        isNotNull(exams.filePath) // Apenas se tiver arquivo associado
                    )
                )
                .limit(100); // Processar em lotes para não sobrecarregar

            logger.info(`[StorageManager] Encontrados ${candidates.length} candidatos para migração.`);

            let successCount = 0;
            let failCount = 0;

            for (const exam of candidates) {
                if (!exam.filePath) continue; // Should be handled by query, but safe check

                try {
                    const fileKey = exam.filePath;

                    // 1. Executar transição no S3
                    await S3Service.transitionObject(fileKey, 'STANDARD_IA');

                    // 2. Atualizar registro no banco
                    await db.update(exams)
                        .set({
                            storageClass: 'cold',
                            storageMigratedAt: new Date(),
                            // lastAccessedAt não muda na migração
                        })
                        .where(eq(exams.id, exam.id));

                    // 3. Registrar Log
                    await db.insert(storageLogs).values({
                        examId: exam.id,
                        previousClass: 'hot',
                        newClass: 'cold',
                        reason: 'auto_policy_6months',
                        migratedAt: new Date(),
                        fileSize: 0, // TODO: Se tiver size no metadata, usar aqui. Por enquanto 0.
                        costSavingsEstimate: 'Estimated ~45% reduction'
                    });

                    successCount++;
                    logger.info(`[StorageManager] Exame #${exam.id} migrado com sucesso.`);

                } catch (error) {
                    logger.error(`[StorageManager] Falha ao migrar exame #${exam.id}:`, error);
                    failCount++;
                }
            }

            logger.info(`[StorageManager] Ciclo concluído. Sucesso: ${successCount}, Falhas: ${failCount}`);
            return { successCount, failCount };

        } catch (error) {
            logger.error("[StorageManager] Erro crítico ao executar política:", error);
            throw error;
        }
    }
}
