import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { marketingService } from './marketing.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const widgetQuerySchema = z.object({
  settingsId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'viewsCount', 'bookingsCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createWidgetSchema = z.object({
  settingsId: z.string().uuid(),
  embedCode: z.string().min(1),
  domainWhitelist: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateWidgetSchema = z.object({
  embedCode: z.string().min(1).optional(),
  domainWhitelist: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
});

const bookingPageQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  isEnabled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createBookingPageSchema = z.object({
  propertyId: z.string().uuid(),
  isEnabled: z.boolean().optional(),
  widgetConfig: z.any().optional(),
  minAdvanceDays: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().min(1).optional(),
  requireDeposit: z.boolean().optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  termsUrl: z.string().url().optional(),
});

const updateBookingPageSchema = z.object({
  isEnabled: z.boolean().optional(),
  widgetConfig: z.any().optional(),
  minAdvanceDays: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().min(1).optional(),
  requireDeposit: z.boolean().optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  termsUrl: z.string().url().nullable().optional(),
});

export class MarketingController {
  // ---- Widgets ----

  async getWidgets(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = widgetQuerySchema.parse(req.query);
      const { widgets, total, page, limit } = await marketingService.getWidgets(filters);
      sendPaginated(res, widgets, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getWidgetById(req: Request, res: Response, next: NextFunction) {
    try {
      const widget = await marketingService.getWidgetById(req.params.id as string);
      sendSuccess(res, widget);
    } catch (error) {
      next(error);
    }
  }

  async createWidget(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createWidgetSchema.parse(req.body);
      const widget = await marketingService.createWidget(data);
      sendSuccess(res, widget, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateWidget(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateWidgetSchema.parse(req.body);
      const widget = await marketingService.updateWidget(req.params.id as string, data);
      sendSuccess(res, widget);
    } catch (error) {
      next(error);
    }
  }

  async deleteWidget(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await marketingService.deleteWidget(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getWidgetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await marketingService.getWidgetStats(req.params.id as string);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ---- Booking Pages ----

  async getBookingPages(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = bookingPageQuerySchema.parse(req.query);
      const { pages, total, page, limit } = await marketingService.getBookingPages(filters);
      sendPaginated(res, pages, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async createBookingPage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBookingPageSchema.parse(req.body);
      const page = await marketingService.createBookingPage(data);
      sendSuccess(res, page, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBookingPage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBookingPageSchema.parse(req.body);
      const page = await marketingService.updateBookingPage(req.params.id as string, data);
      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  }
}

export const marketingController = new MarketingController();
