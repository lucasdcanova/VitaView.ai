import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ 
    error: "Não autorizado", 
    message: "Você precisa estar logado para acessar este recurso" 
  });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        error: "Não autorizado", 
        message: "Você precisa estar logado para acessar este recurso" 
      });
    }

    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Acesso negado", 
        message: "Você não tem permissão para acessar este recurso" 
      });
    }

    return next();
  };
};