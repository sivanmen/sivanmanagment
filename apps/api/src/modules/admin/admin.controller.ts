import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from './admin.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName', 'role', 'status', 'lastLoginAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']),
});

const auditLogQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'action', 'entityType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class AdminController {
  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getSystemStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = userQuerySchema.parse(req.query);
      const { users, total, page, limit } = await adminService.getAllUsers(filters);
      sendPaginated(res, users, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = updateRoleSchema.parse(req.body);
      const user = await adminService.updateUserRole(req.params.id as string, role);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.suspendUser(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.activateUser(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = auditLogQuerySchema.parse(req.query);
      const { logs, total, page, limit } = await adminService.getAuditLog(filters);
      sendPaginated(res, logs, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await adminService.getSystemHealth();
      sendSuccess(res, health);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
