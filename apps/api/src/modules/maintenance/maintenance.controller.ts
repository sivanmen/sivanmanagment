import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { maintenanceService } from './maintenance.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createRequestSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.enum([
    'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
    'PEST', 'CLEANING', 'LANDSCAPING', 'OTHER',
  ]),
  estimatedCost: z.number().min(0).optional(),
  images: z.any().optional(),
  scheduledDate: z.string().datetime().optional(),
  metadata: z.any().optional(),
});

const updateRequestSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.enum([
    'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
    'PEST', 'CLEANING', 'LANDSCAPING', 'OTHER',
  ]).optional(),
  estimatedCost: z.number().min(0).nullable().optional(),
  actualCost: z.number().min(0).nullable().optional(),
  images: z.any().optional(),
  scheduledDate: z.string().datetime().nullable().optional(),
  completionNotes: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

const assignRequestSchema = z.object({
  assignedToId: z.string().uuid(),
});

const completeRequestSchema = z.object({
  completionNotes: z.string().optional(),
  actualCost: z.number().min(0).optional(),
  createExpense: z.boolean().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum([
    'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL',
    'PEST', 'CLEANING', 'LANDSCAPING', 'OTHER',
  ]).optional(),
  propertyId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'title', 'scheduledDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class MaintenanceController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { requests, total, page, limit } = await maintenanceService.getAllRequests(
        filters,
        userOwnerId,
      );

      sendPaginated(res, requests, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const request = await maintenanceService.getRequestById(req.params.id as string, userOwnerId);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRequestSchema.parse(req.body);
      const request = await maintenanceService.createRequest({
        ...data,
        reportedById: req.user!.userId,
      });
      sendSuccess(res, request, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRequestSchema.parse(req.body);
      const request = await maintenanceService.updateRequest(req.params.id as string, data);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { assignedToId } = assignRequestSchema.parse(req.body);
      const request = await maintenanceService.assignRequest(req.params.id as string, assignedToId);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = completeRequestSchema.parse(req.body);
      const request = await maintenanceService.completeRequest(req.params.id as string, data);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await maintenanceService.deleteRequest(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const stats = await maintenanceService.getMaintenanceStats(userOwnerId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const maintenanceController = new MaintenanceController();
