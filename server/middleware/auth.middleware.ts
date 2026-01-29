import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

const parsePreferences = (preferences: unknown): Record<string, any> | null => {
    if (!preferences) return null;
    if (typeof preferences === "string") {
        try {
            const parsed = JSON.parse(preferences);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            return null;
        }
    }
    if (typeof preferences === "object") return preferences as Record<string, any>;
    return null;
};

const applyDelegatedAccess = async (req: Request) => {
    const user = req.user;
    if (!user) return;

    const preferences = parsePreferences(user.preferences);
    const delegateForUserId = preferences?.delegateForUserId;
    const delegateType = preferences?.delegateType;

    if (!delegateForUserId || delegateType !== "secretary") return;

    const delegateUserId = Number(delegateForUserId);
    if (!Number.isInteger(delegateUserId) || delegateUserId === user.id) return;

    const ownerUser = await storage.getUser(delegateUserId);
    if (!ownerUser) return;

    (ownerUser as any).delegatedBy = {
        id: user.id,
        fullName: user.fullName || user.username,
        email: user.email,
    };

    req.user = ownerUser as any;
};

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    // Verifica a autenticação padrão pelo Passport
    if (req.isAuthenticated()) {
        await applyDelegatedAccess(req);
        return next();
    }

    // Se não estiver autenticado, retorna 401
    return res.status(401).json({ message: "Não autenticado" });
}
