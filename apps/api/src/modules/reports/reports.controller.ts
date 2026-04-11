import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reportsService } from './reports.service';
import { sendSuccess } from '../../utils/response';

const dateRangeSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  propertyId: z.string().uuid().optional(),
});

const revenueQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  ownerId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

const bookingsQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  propertyId: z.string().uuid().optional(),
  source: z.string().optional(),
});

const ownerStatementSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const guestAnalyticsSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export class ReportsController {
  async getOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, propertyId } = dateRangeSchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getOccupancyReport({
        propertyId,
        startDate,
        endDate,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, ownerId, propertyId, groupBy } = revenueQuerySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getRevenueReport({
        ownerId,
        propertyId,
        startDate,
        endDate,
        groupBy,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, propertyId, source } = bookingsQuerySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getBookingsReport({
        startDate,
        endDate,
        propertyId,
        source,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, propertyId } = dateRangeSchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getMaintenanceReport({
        propertyId,
        startDate,
        endDate,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getOwnerStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, month, year } = ownerStatementSchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getOwnerStatement({
        ownerId: req.params.ownerId as string,
        startDate,
        endDate,
        periodMonth: month,
        periodYear: year,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getGuestAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = guestAnalyticsSchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getGuestAnalytics({
        startDate,
        endDate,
        userOwnerId,
      });
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  async getPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const report = await reportsService.getPortfolioReport(userOwnerId);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
