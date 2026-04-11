import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  isRead: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class NotificationsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { notifications, total, page, limit } = await notificationsService.getUserNotifications(
        req.user!.userId,
        filters,
      );
      sendPaginated(res, notifications, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.getUnreadCount(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationsService.markAsRead(
        req.params.id as string,
        req.user!.userId,
      );
      sendSuccess(res, notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.deleteNotification(
        req.params.id as string,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
