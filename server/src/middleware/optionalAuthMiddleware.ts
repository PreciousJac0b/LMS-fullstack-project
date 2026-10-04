import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwtUtils';

// Public endpoint, better answer when we know you.
// Missing, expired or invalid token all mean "anonymous" — never a rejection.
export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { user } = JWTUtils.userFromAuthHeader(req.headers.authorization);

  if (user) {
    (req as any).user = user;
  }

  next();
};