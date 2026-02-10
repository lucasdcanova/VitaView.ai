
import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { FAIR_USE_LIMITS } from "@shared/schema";

interface FairUseRequest extends Request {
    user?: any;
}

export async function checkPrescriptionLimit(req: FairUseRequest, res: Response, next: NextFunction) {
    // 1. Skip for admins
    if (req.user?.role === 'admin') {
        return next();
    }

    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }

        // 2. Check Subscription Status
        const subscription = await storage.getUserSubscription(userId);
        const isPaidPlan = subscription && subscription.status === 'active';

        // 3. If Paid Plan -> No Limit (return next)
        if (isPaidPlan) {
            return next();
        }

        // 4. If Free Plan -> Check Limit (10 per month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const count = await storage.getPrescriptionsCountByUserIdAndDate(userId, startOfMonth, endOfMonth);

        if (count >= 10) {
            return res.status(403).json({
                message: "Você atingiu o limite do plano Gratuito (10 prescrições/mês). Faça um upgrade para prescrever sem limites.",
                code: "PRESCRIPTION_LIMIT_EXCEEDED",
                upgradeRequired: true
            });
        }

        next();

    } catch (error) {
        console.error('Prescription limit check error:', error);
        // Fail open 
        next();
    }
}
