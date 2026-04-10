import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { feesService } from './fees.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

// ─── Zod Schemas ─────────────────────────────────────────────

const calculateSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

const calculatePropertySchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

const feeQuerySchema = z.object({
  ownerId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'INVOICED', 'PAID']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'appliedFee', 'totalIncome', 'periodYear', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'INVOICED', 'PAID']),
});

const summaryQuerySchema = z.object({
  ownerId: z.string().uuid().optional(),
  periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

// ─── Helper ──────────────────────────────────────────────────

function getUserOwnerId(req: Request): string | undefined {
  return req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
    ? req.user!.ownerId
    : undefined;
}

// ─── Controller ──────────────────────────────────────────────

export class FeesController {
  /**
   * POST /calculate - Trigger monthly fee calculation for all properties.
   * Super admin only.
   */
  async calculateMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const data = calculateSchema.parse(req.body);
      const result = await feesService.calculateMonthlyFees(data.periodMonth, data.periodYear);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /calculate/:propertyId - Calculate fee for a single property.
   * Admin only.
   */
  async calculateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const data = calculatePropertySchema.parse(req.body);
      const result = await feesService.calculatePropertyFee(
        req.params.propertyId as string,
        data.periodMonth,
        data.periodYear,
      );
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET / - List fee calculations with filters.
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = feeQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const { records, total, page, limit } = await feesService.getFeeCalculations(filters, userOwnerId);
      sendPaginated(res, records, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /:id/status - Update fee status.
   * Admin only.
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStatusSchema.parse(req.body);
      const record = await feesService.updateFeeStatus(req.params.id as string, data.status);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /summary - Aggregate fee summary.
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = summaryQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const summary = await feesService.getFeeSummary(filters, userOwnerId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const feesController = new FeesController();
