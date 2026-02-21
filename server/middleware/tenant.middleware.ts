
import { Request, Response, NextFunction } from "express";

// Extend Express Request to include tenantId
declare global {
    namespace Express {
        interface Request {
            tenantId?: number;
        }
    }
}

export async function ensureTenant(req: Request, res: Response, next: NextFunction) {
    // Public API endpoints that must remain accessible without session auth
    if (req.originalUrl.startsWith("/api/webhook")) {
        return next();
    }

    // Must be authenticated first
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;

    // Set tenantId if available, but don't block requests for users without a clinic
    if (user.clinicId) {
        req.tenantId = user.clinicId;
    }

    next();
}

// Strict version: use on routes that REQUIRE a clinic context
export async function requireTenant(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;

    if (!user.clinicId) {
        return res.status(403).json({ message: "Usuário não associado a nenhuma clínica" });
    }

    req.tenantId = user.clinicId;
    next();
}
