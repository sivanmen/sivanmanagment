import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!AUDITED_METHODS.includes(req.method)) {
    return next();
  }

  const originalSend = res.json.bind(res);

  res.json = function (body: unknown) {
    // Log audit asynchronously after response
    if (res.statusCode < 400 && req.user) {
      const pathParts = req.path.split('/').filter(Boolean);
      const entityType = pathParts[2] || 'unknown'; // /api/v1/{entity}
      const entityId = pathParts[3];
      const action = `${req.method.toLowerCase()}.${entityType}`;

      prisma.auditLog
        .create({
          data: {
            userId: req.user.userId,
            action,
            entityType,
            entityId: entityId || undefined,
            newValues: req.method !== 'DELETE' ? (req.body as object) : undefined,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        })
        .catch((err: Error) => console.error('Audit log error:', err));
    }

    return originalSend(body);
  };

  next();
}
