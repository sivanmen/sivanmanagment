import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { icalSyncService } from './ical-sync.service';
import { calendarService } from './calendar.service';
import { sendSuccess } from '../../utils/response';

const createFeedSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  channelName: z.string().min(1).max(255),
  importUrl: z.string().url(),
  syncIntervalMinutes: z.number().int().min(5).max(1440).optional(),
});

const exportQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
});

export class IcalSyncController {
  /**
   * POST /api/v1/calendar/ical-feeds
   * Add a new iCal feed for a property.
   */
  async createFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFeedSchema.parse(req.body);
      const feed = await calendarService.createIcalFeed(data);
      sendSuccess(res, feed, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/calendar/ical-feeds
   * List iCal feeds, optionally filtered by propertyId.
   */
  async listFeeds(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.query.propertyId as string | undefined;
      if (!propertyId) {
        // Return all feeds (admin)
        const { prisma } = await import('../../prisma/client');
        const feeds = await prisma.icalFeed.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { id: true, name: true } },
          },
        });
        return sendSuccess(res, feeds);
      }

      const feeds = await calendarService.getIcalFeeds(propertyId);
      sendSuccess(res, feeds);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/calendar/ical-feeds/:id/sync
   * Trigger a manual sync for a specific feed.
   */
  async syncFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const feedId = req.params.id as string;
      const result = await icalSyncService.syncFeed(feedId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/calendar/ical-feeds/:id
   * Remove an iCal feed.
   */
  async deleteFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await calendarService.deleteIcalFeed(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/calendar/export/:propertyId.ics
   * Export iCal feed (PUBLIC endpoint, no auth required).
   */
  async exportFeed(req: Request, res: Response, next: NextFunction) {
    try {
      // Strip .ics extension if present
      let propertyId = req.params.propertyId as string;
      if (propertyId.endsWith('.ics')) {
        propertyId = propertyId.slice(0, -4);
      }

      const { unitId } = exportQuerySchema.parse(req.query);
      const ical = await icalSyncService.generateFeed(propertyId, unitId);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="calendar-${propertyId}.ics"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(ical);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/calendar/ical-feeds/sync-all
   * Sync all active feeds (can be triggered by cron).
   */
  async syncAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await icalSyncService.syncAllFeeds();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const icalSyncController = new IcalSyncController();
