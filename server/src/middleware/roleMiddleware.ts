// src/middleware/role.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowed: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;   // set by authMiddleware
    if (!user || !allowed.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
      });
      return;
    }
    next();
  };
};