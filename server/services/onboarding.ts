
import { db } from "../db";
import { specialtyTemplates, examProtocols, medications, type InsertExamProtocol } from "@shared/schema";
import { eq } from "drizzle-orm";
import logger from "../logger";

// Define the template config structure
interface TemplateConfig {
    favoriteExams?: string[];
    favoriteMedications?: {
        name: string;
        dosage?: string;
        frequency?: string;
        format?: string;
    }[];
}

export class OnboardingService {

    async applySpecialtyTemplate(userId: number, specialty: string) {
        try {
            logger.info(`[Onboarding] Applying template for ${specialty} to user ${userId}`);

            // 1. Find Template
            const template = await db.query.specialtyTemplates.findFirst({
                where: eq(specialtyTemplates.specialty, specialty)
            });

            if (!template) {
                logger.info(`[Onboarding] No template found for ${specialty}`);
                return;
            }

            const config = template.config as TemplateConfig;

            // 2. Apply Favorite Exams (Exam Protocols)
            if (config.favoriteExams && config.favoriteExams.length > 0) {
                // Create a protocol named "Favoritos - {Specialty}"
                const protocolName = `Favoritos - ${specialty}`;

                // Check if exists
                const existing = await db.query.examProtocols.findFirst({
                    where: (ep, { and, eq }) => and(eq(ep.userId, userId), eq(ep.name, protocolName))
                });

                if (!existing) {
                    await db.insert(examProtocols).values({
                        userId,
                        name: protocolName,
                        exams: config.favoriteExams, // Assuming string[] is stored as JSON
                        description: `Protocolo sugerido para ${specialty}`
                    });
                    logger.info(`[Onboarding] Created exam protocol: ${protocolName}`);
                }
            }

            // 3. Apply Favorite Medications (Custom Medications)
            // Note: This matches the 'custom_medications' if available or just internal tracking
            // We will skip for now as 'custom_medications' table structure needs verification

            // TODO: Add medications logic if table exists and matches

            return { success: true, applied: true };

        } catch (error) {
            logger.error("[Onboarding] Failed to apply template", { error });
            return { success: false, error };
        }
    }

    async seedTemplates() {
        // Seed Cardiologia
        const cardio = await db.query.specialtyTemplates.findFirst({
            where: eq(specialtyTemplates.specialty, "Cardiologia")
        });

        if (!cardio) {
            await db.insert(specialtyTemplates).values({
                specialty: "Cardiologia",
                config: {
                    favoriteExams: ["Eletrocardiograma", "Ecocardiograma", "Teste Ergométrico", "Lipidograma"],
                    favoriteMedications: [{ name: "Atenolol", dosage: "25mg" }]
                }
            });
        }

        // Seed Dermatologia
        const dermato = await db.query.specialtyTemplates.findFirst({
            where: eq(specialtyTemplates.specialty, "Dermatologia")
        });

        if (!dermato) {
            await db.insert(specialtyTemplates).values({
                specialty: "Dermatologia",
                config: {
                    favoriteExams: ["Dermatoscopia", "Biópsia de Pele"],
                    favoriteMedications: []
                }
            });
        }
    }
}

export const onboardingService = new OnboardingService();
