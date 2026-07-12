import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwtUtils';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = JWTUtils.verifyAccessToken(token);

    if ('error' in decoded) {
      // Distinguish expiry (client should hit /refresh) from a bad token (re-login)
      const isExpired = decoded.error === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        message: isExpired ? 'Access token expired.' : 'Invalid token.',
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};