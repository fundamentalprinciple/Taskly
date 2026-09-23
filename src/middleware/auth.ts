import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/token.js';

export interface AuthenticatedRequest extends Request {
  user: ReturnType<typeof verifyAccessToken>;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = header.slice(7);
    (req as AuthenticatedRequest).user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
