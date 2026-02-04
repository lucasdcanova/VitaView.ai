import { createHash } from "crypto";
import { db } from "../db"; // Asumindo que db é exportado daqui, ou ajustar import
import { aiCache, type InsertAICache } from "@shared/schema";
import { eq, sql } from "drizzle-orm"; // Ajustar imports do ORM
import logger from "../logger";

// Configuração de TTL por tipo de tarefa
const TTL_CONFIG: Record<string, number> = {
    default: 7 * 24 * 60 * 60 * 1000, // 7 dias
    simple: 30 * 24 * 60 * 60 * 1000, // 30 dias (extração de nome, etc)
    medium: 7 * 24 * 60 * 60 * 1000, // 7 dias
    complex: 24 * 60 * 60 * 1000 // 24 horas (mais volátil)
};

export class AICacheService {
    /**
     * Gera um hash determinístico para a requisição de IA.
     */
    static generateHash(model: string, messages: any[], params: Record<string, any> = {}): string {
        const payload = JSON.stringify({
            model,
            messages, // Importante: ordem das mensagens afeta o hash
            params: {
                temperature: params.temperature,
                max_tokens: params.max_tokens,
                // Outros params que afetam a resposta
            }
        });

        return createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Busca uma resposta em cache. Retorna null se não existir ou expirada.
     */
    static async get(hash: string): Promise<any | null> {
        try {
            const [entry] = await db
                .select()
                .from(aiCache)
                .where(eq(aiCache.hash, hash))
                .limit(1);

            if (!entry) return null;

            // Verificar expiração
            if (new Date() > entry.expiresAt) {
                logger.debug(`[AICache] Expired entry for hash ${hash}`);
                // Opcional: deletar background
                return null; // Cache miss por expiração
            }

            // Increment hit count (fire and forget)
            db.update(aiCache)
                .set({ hitCount: sql`${aiCache.hitCount} + 1` })
                .where(eq(aiCache.id, entry.id))
                .execute()
                .catch(err => logger.error("[AICache] Failed to update hit count", err));

            logger.info(`[AICache] HIT for hash ${hash.substring(0, 8)}...`);
            return entry.response;
        } catch (error) {
            logger.warn("[AICache] Error getting cache", error);
            return null; // Fail safe
        }
    }

    /**
     * Salva uma resposta no cache.
     */
    static async set(
        hash: string,
        response: any,
        metadata: {
            model: string,
            prompt: string,
            complexity?: 'simple' | 'medium' | 'complex' | string
        }
    ): Promise<void> {
        try {
            const ttl = TTL_CONFIG[metadata.complexity || 'default'] || TTL_CONFIG.default;
            const expiresAt = new Date(Date.now() + ttl);

            const newEntry: InsertAICache = {
                hash,
                prompt: metadata.prompt.substring(0, 500), // Truncate for storage
                response,
                model: metadata.model,
                complexity: metadata.complexity || 'unknown',
                expiresAt
            };

            await db
                .insert(aiCache)
                .values(newEntry)
                .onConflictDoUpdate({
                    target: aiCache.hash,
                    set: {
                        response, // Atualiza resposta se hash colidir (re-run) ou renova
                        expiresAt, // Renova TTL
                        createdAt: new Date(), // Reset creation time to indicate refresh
                        complexity: metadata.complexity || 'unknown'
                    }
                });

            logger.info(`[AICache] SET for hash ${hash.substring(0, 8)}... (TTL: ${ttl / 1000}s)`);
        } catch (error) {
            logger.error("[AICache] Failed to set cache", error);
        }
    }
}
