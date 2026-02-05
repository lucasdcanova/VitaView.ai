
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
    // Must be authenticated first
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;

    if (!user.clinicId) {
        // Should not happen after migration, but fail safe
        return res.status(403).json({ message: "User not associated with any Organization (Tenant)" });
    }

    // Inject Context
    req.tenantId = user.clinicId;

    next();
}
