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
                // Soft limit - throttle instead of block for first 10% overage
                const overage = currentUsage - limit;
                const overagePercentage = overage / limit;

                if (overagePercentage < 0.1) {
                    // Warning header
                    res.setHeader('X-Fair-Use-Warning', 'Limit exceeded, throttling applied');
                    // Add artificial delay (throttle)
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return next();
                } else {
                    // Hard block after 10% overage
                    return res.status(429).json({
                        message: "Limite de uso excedido para este recurso no seu plano atual.",
                        code: "FAIR_USE_LIMIT_EXCEEDED",
                        resource,
                        limit,
                        currentUsage,
                        upgradeRequired: true
                    });
                }
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
