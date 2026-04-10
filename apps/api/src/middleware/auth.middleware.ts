import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../utils/api-error';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  ownerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      locale?: string;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired token'));
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
    req.user = payload;
  } catch {
    // Token invalid, continue without user
  }
  next();
}
