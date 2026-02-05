import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { FAIR_USE_LIMITS } from "@shared/schema";

interface FairUseRequest extends Request {
    user?: any;
}

export const checkFairUse = (resource: 'aiRequests' | 'transcriptionMinutes' | 'examAnalyses') => {
    return async (req: FairUseRequest, res: Response, next: NextFunction) => {
        // Skip check for admins
        if (req.user?.role === 'admin') {
            return next();
        }

        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Usuário não autenticado" });
            }

            const today = new Date().toISOString().slice(0, 10);
            const yearMonth = today.slice(0, 7);

            // Get monthly usage
            const usage = await storage.getMonthlyAIUsage(userId, yearMonth);

            // Get user plan and add-ons
            const subscription = await storage.getUserSubscription(userId);
            const user = await storage.getUser(userId);
            const addons = (user?.addons as string[]) || [];

            let limits;
            let planName = 'free';

            if (subscription && subscription.status === 'active') {
                limits = FAIR_USE_LIMITS.paid;
                planName = 'paid';
            } else {
                limits = FAIR_USE_LIMITS.free;
            }

            // Check specific limits based on resource type
            let limit = 0;
            let currentUsage = 0;
            let isUnlimited = false;

            switch (resource) {
                case 'aiRequests':
                    limit = limits.aiRequestsPerMonth;
                    currentUsage = usage.aiRequests;
                    if (addons.includes('advanced_ai') || addons.includes('addon_advanced_ai')) {
                        isUnlimited = true;
                    }
                    break;

                case 'transcriptionMinutes':
                    limit = limits.transcriptionMinutesPerMonth;
                    currentUsage = usage.transcriptionMinutes;
                    if (addons.includes('transcription_power') || addons.includes('addon_transcription')) {
                        isUnlimited = true;
                    }
                    break;

                case 'examAnalyses':
                    limit = limits.examAnalysesPerMonth;
                    currentUsage = usage.examAnalyses;
                    break;
            }

            // Check if limit exceeded (if not unlimited)
            if (!isUnlimited && currentUsage >= limit) {
                // SPECIAL CASE: Transcription Hard Block (unless addon)
                if (resource === 'transcriptionMinutes') {
                    // Check for transcription add-on specifically
                    const hasTranscriptionAddon = addons.includes('transcription_power') || addons.includes('addon_transcription');

                    if (!hasTranscriptionAddon) {
                        return res.status(403).json({
                            message: "Limite de transcrição excedido. Adquira o pacote Transcription Power para continuar.",
                            code: "TRANSCRIPTION_LIMIT_EXCEEDED",
                            resource,
                            limit,
                            currentUsage,
                            upgradeRequired: true
                        });
                    }
                }

                // Elastic Limit - Soft Throttle Logic
                const overageRatio = currentUsage / limit;
                let delay = 0;
                let warningLevel = '';

                if (overageRatio < 1.2) {
                    // Up to 20% overage: 2s delay (Check engine warning)
                    delay = 2000;
                    warningLevel = 'weary';
                } else if (overageRatio < 1.5) {
                    // Up to 50% overage: 5s delay (Orange warning)
                    delay = 5000;
                    warningLevel = 'critical';
                } else {
                    // > 50% overage: 10s delay (Red warning)
                    delay = 10000;
                    warningLevel = 'critical';
                }

                // Apply headers and delay
                res.setHeader('X-AI-Warning', warningLevel);
                res.setHeader('X-AI-Throttle-Delay', delay);

                console.log(`[FairUse] Throttling user ${userId} for ${resource}. Usage: ${currentUsage}/${limit} (${(overageRatio * 100).toFixed(1)}%). Delay: ${delay}ms`);

                // Artificially delay the response
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Add usage headers
            if (!isUnlimited && limit > 0) {
                const remaining = Math.max(0, limit - currentUsage);
                res.setHeader('X-RateLimit-Limit', limit);
                res.setHeader('X-RateLimit-Remaining', remaining);

                // Warning if used > 80%
                if (currentUsage / limit > 0.8) {
                    res.setHeader('X-Fair-Use-Warning', 'Approaching monthly limit');
                }
            }

            next();
        } catch (error) {
            console.error('Fair use check error:', error);
            // Fail open to avoid blocking users on system error
            next();
        }
    };
};

export const trackUsage = async (userId: number, resource: 'aiRequests' | 'aiTokensUsed' | 'transcriptionMinutes' | 'examAnalyses', amount: number) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        await storage.incrementAIUsage(userId, today, resource, amount);
    } catch (error) {
        console.error(`Error tracking usage for ${resource}:`, error);
    }
};
