import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwtUtils';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { user, reason } = JWTUtils.userFromAuthHeader(req.headers.authorization);

if (!user) {
    res.status(401).json({
        success: false,
        message:
            reason === 'NO_TOKEN'
                ? 'Access denied. No token provided.'
                : reason === 'TOKEN_EXPIRED'
                  ? 'Access token expired.'
                  : 'Invalid token.',
        code: reason,
    });
    return;
}

(req as any).user = user;
next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};