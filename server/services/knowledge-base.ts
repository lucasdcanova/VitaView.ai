
import { db } from "../db";
import { supportArticles, type InsertSupportArticle, type SupportArticle } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { generateEmbedding } from "./openai";
import logger from "../logger";

// Cosine Similarity implementation for JSON vectors
// Note: pgvector would be better, but this works for < 10k articles
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class KnowledgeBaseService {
    async createArticle(data: InsertSupportArticle): Promise<SupportArticle> {
        try {
            // Generate embedding for title + content
            const textToEmbed = `${data.title}\n${data.content}`;
            const embedding = await generateEmbedding(textToEmbed);

            const [article] = await db.insert(supportArticles).values({
                ...data,
                embedding,
                updatedAt: new Date(),
            }).returning();

            logger.info(`[KB] Created article: ${article.title} (ID: ${article.id})`);
            return article;
        } catch (error) {
            logger.error("[KB] Failed to create article", { error });
            throw error;
        }
    }

    async updateArticle(id: number, data: Partial<InsertSupportArticle>): Promise<SupportArticle> {
        try {
            let embedding = undefined;

            // Regenerate embedding if content changed
            if (data.title || data.content) {
                const current = await this.getArticle(id);
                if (current) {
                    const newTitle = data.title || current.title;
                    const newContent = data.content || current.content;
                    embedding = await generateEmbedding(`${newTitle}\n${newContent}`);
                }
            }

            const [article] = await db.update(supportArticles)
                .set({ ...data, ...(embedding ? { embedding } : {}), updatedAt: new Date() })
                .where(eq(supportArticles.id, id))
                .returning();

            return article;
        } catch (error) {
            logger.error("[KB] Failed to update article", { error, id });
            throw error;
        }
    }

    async getArticle(id: number): Promise<SupportArticle | undefined> {
        const result = await db.select().from(supportArticles).where(eq(supportArticles.id, id));
        return result[0];
    }

    async deleteArticle(id: number): Promise<void> {
        await db.delete(supportArticles).where(eq(supportArticles.id, id));
    }

    async searchArticles(query: string, limit = 5, clinicId?: number): Promise<SupportArticle[]> {
        try {
            const queryEmbedding = await generateEmbedding(query);

            // Fetch all articles (optimize: filter by clinicId first)
            // For large datasets, we must use pgvector. For now, we fetch relevant columns and compute in-memory.
            let dbQuery = db.select().from(supportArticles);

            if (clinicId) {
                // TODO: Add logic to fetch public AND clinic-specific
                // For now, strict filter or handled by caller? 
                // Let's fetch public OR matching clinicId
                // But drizzle doesn't easily support mixed OR with optional clinicId in this simple builder
                // We'll filter in memory or minimal SQL filter
            }

            const allArticles = await dbQuery;

            // Filter and Sort by Similarity
            const scored = allArticles
                .filter(a => {
                    // Permission check: Public OR (ClinicId matches if provided)
                    if (a.isPublic) return true;
                    if (clinicId && a.clinicId === clinicId) return true;
                    return false;
                })
                .map(article => {
                    const similarity = article.embedding
                        ? cosineSimilarity(queryEmbedding, article.embedding as number[])
                        : 0;
                    return { article, similarity };
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return scored.map(s => s.article);
        } catch (error) {
            logger.error("[KB] Search failed", { error });
            throw error; // Or return empty array?
        }
    }

    async listArticles(clinicId?: number): Promise<SupportArticle[]> {
        return db.select().from(supportArticles).orderBy(desc(supportArticles.updatedAt));
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
