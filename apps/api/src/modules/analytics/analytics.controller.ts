import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const overviewQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
});

const propertyPerformanceQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: z.string().optional(),
  sortBy: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const channelQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  propertyId: z.string().optional(),
});

const occupancyQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2030).optional(),
});

const forecastQuerySchema = z.object({
  propertyId: z.string().optional(),
  months: z.coerce.number().int().min(1).max(24).optional(),
});

const ownerQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ownerId: z.string().optional(),
});

const comparisonQuerySchema = z.object({
  propertyIds: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const seasonalQuerySchema = z.object({
  propertyId: z.string().optional(),
});

const exportQuerySchema = z.object({
  type: z.enum(['revenue', 'property', 'channel', 'owner']),
  format: z.enum(['json', 'csv']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
});

const dashboardQuerySchema = z.object({
  ownerId: z.string().optional(),
});

// ── Controller ───────────────────────────────────────────────────────────────

export class AnalyticsController {
  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getDashboard();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getOwnerDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { ownerId } = dashboardQuerySchema.parse(req.query);
      const ownerIdToUse = ownerId || (req as any).user?.owner?.id;
      if (!ownerIdToUse) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_OWNER_ID', message: 'Owner ID is required' } });
      }
      const data = await analyticsService.getOwnerDashboard(ownerIdToUse);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = overviewQuerySchema.parse(req.query);
      const data = await analyticsService.getRevenueOverview(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getPropertyPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = propertyPerformanceQuerySchema.parse(req.query);
      const data = await analyticsService.getPropertyPerformance(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getChannelAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = channelQuerySchema.parse(req.query);
      const data = await analyticsService.getChannelAnalytics(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getOccupancyHeatmap(req: Request, res: Response, next: NextFunction) {
    try {
      const { year } = occupancyQuerySchema.parse(req.query);
      const propertyId = req.params.propertyId as string;
      const data = await analyticsService.getOccupancyHeatmap(
        propertyId,
        year || new Date().getFullYear(),
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, months } = forecastQuerySchema.parse(req.query);
      const data = await analyticsService.getForecast(propertyId, months);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getOwnerReports(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ownerQuerySchema.parse(req.query);
      const data = await analyticsService.getOwnerReports(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getKPIDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getKPIDashboard();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getComparisonReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyIds, startDate, endDate } = comparisonQuerySchema.parse(req.query);
      const ids = propertyIds ? propertyIds.split(',').map((id) => id.trim()) : [];
      const data = await analyticsService.getComparisonReport(ids, startDate, endDate);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getSeasonalTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = seasonalQuerySchema.parse(req.query);
      const data = await analyticsService.getSeasonalTrends(propertyId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = exportQuerySchema.parse(req.query);
      const result = await analyticsService.exportReport({
        type: filters.type,
        format: filters.format || 'json',
        startDate: filters.startDate,
        endDate: filters.endDate,
        propertyId: filters.propertyId,
        ownerId: filters.ownerId,
      });

      if (result.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.type}-report.csv"`);
        return res.status(200).send(result.data);
      }

      sendSuccess(res, result.data);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
