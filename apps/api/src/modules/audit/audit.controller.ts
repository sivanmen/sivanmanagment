import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auditService } from './audit.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW', 'STATUS_CHANGE']).optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  sortBy: z.enum(['timestamp', 'action', 'entity', 'userEmail']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const entityHistorySchema = z.object({
  entity: z.string().min(1),
  entityId: z.string().min(1),
});

const userActivitySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

const statsSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export class AuditController {
  async getLog(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { entries, total, page, limit } = await auditService.getAuditLog(filters);
      sendPaginated(res, entries, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await auditService.getAuditEntry(req.params.id as string);
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async getEntityHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, entityId } = entityHistorySchema.parse(req.params);
      const entries = await auditService.getEntityHistory(entity, entityId);
      sendSuccess(res, entries);
    } catch (error) {
      next(error);
    }
  }

  async getUserActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = userActivitySchema.parse(req.query);
      const result = await auditService.getUserActivity(req.params.userId as string, filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = statsSchema.parse(req.query);
      const result = await auditService.getStats(filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
