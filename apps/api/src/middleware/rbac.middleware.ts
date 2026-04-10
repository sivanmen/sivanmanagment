import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

type Role = 'SUPER_ADMIN' | 'PROPERTY_MANAGER' | 'MAINTENANCE' | 'OWNER' | 'VIP_STAR' | 'AFFILIATE';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  if (!['SUPER_ADMIN', 'PROPERTY_MANAGER'].includes(req.user.role)) {
    return next(ApiError.forbidden('Admin access required'));
  }

  next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return next(ApiError.forbidden('Super Admin access required'));
  }

  next();
}
