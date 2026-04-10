import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { calendarService } from './calendar.service';
import { sendSuccess } from '../../utils/response';

const calendarQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  unitId: z.string().uuid().optional(),
});

const createBlockSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  blockType: z.enum(['OWNER_BLOCK', 'MAINTENANCE', 'RENOVATION', 'OTHER']),
  reason: z.string().optional(),
});

const updateBlockSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  blockType: z.enum(['OWNER_BLOCK', 'MAINTENANCE', 'RENOVATION', 'OTHER']).optional(),
  reason: z.string().nullable().optional(),
});

const createIcalFeedSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  channelName: z.string().min(1).max(255),
  importUrl: z.string().url(),
  syncIntervalMinutes: z.number().int().min(5).max(1440).optional(),
});

const exportQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
});

export class CalendarController {
  async getCalendarData(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, unitId } = calendarQuerySchema.parse(req.query);
      const propertyId = req.params.propertyId as string;
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const data = await calendarService.getCalendarData(
        propertyId,
        startDate,
        endDate,
        unitId,
        userOwnerId,
      );

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async createBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBlockSchema.parse(req.body);
      const block = await calendarService.createBlock(data, req.user!.userId);
      sendSuccess(res, block, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBlockSchema.parse(req.body);
      const block = await calendarService.updateBlock(req.params.id as string, data);
      sendSuccess(res, block);
    } catch (error) {
      next(error);
    }
  }

  async deleteBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await calendarService.deleteBlock(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getIcalFeeds(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const feeds = await calendarService.getIcalFeeds(propertyId);
      sendSuccess(res, feeds);
    } catch (error) {
      next(error);
    }
  }

  async createIcalFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createIcalFeedSchema.parse(req.body);
      const feed = await calendarService.createIcalFeed(data);
      sendSuccess(res, feed, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteIcalFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await calendarService.deleteIcalFeed(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async exportIcal(req: Request, res: Response, next: NextFunction) {
    try {
      const { unitId } = exportQuerySchema.parse(req.query);
      const propertyId = req.params.propertyId as string;

      const ical = await calendarService.generateIcalExport(propertyId, unitId);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="calendar-${propertyId}.ics"`);
      res.send(ical);
    } catch (error) {
      next(error);
    }
  }
}

export const calendarController = new CalendarController();
