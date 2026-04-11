import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationsService } from './notifications.service';
import { notificationChannelsService } from './notification-channels.service';
import { notificationDispatcher } from './notification-dispatcher.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

// ==========================================
// Existing schemas
// ==========================================

const querySchema = z.object({
  isRead: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ==========================================
// Channel management schemas
// ==========================================

const createChannelSchema = z.object({
  type: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'PUSH']),
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  config: z.object({
    // EMAIL
    host: z.string().optional(),
    port: z.number().optional(),
    secure: z.boolean().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().optional(),
    fromName: z.string().optional(),
    // WHATSAPP
    apiUrl: z.string().optional(),
    apiKey: z.string().optional(),
    instanceName: z.string().optional(),
    // SMS
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    fromNumber: z.string().optional(),
  }),
  metadata: z.record(z.unknown()).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    secure: z.boolean().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().optional(),
    fromName: z.string().optional(),
    apiUrl: z.string().optional(),
    apiKey: z.string().optional(),
    instanceName: z.string().optional(),
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    fromNumber: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ==========================================
// User notification settings schemas
// ==========================================

const updateUserPreferencesSchema = z.object({
  preferences: z.array(z.object({
    category: z.enum(['booking', 'maintenance', 'payment', 'system', 'marketing']),
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
  })),
});

// ==========================================
// Send notification schema
// ==========================================

const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  category: z.enum(['booking', 'maintenance', 'payment', 'system', 'marketing']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  htmlBody: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  forceChannels: z.array(z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'PUSH'])).optional(),
});

export class NotificationsController {
  // ==========================================
  // Existing notification endpoints (user's own)
  // ==========================================

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

  // ==========================================
  // Channel configuration endpoints (admin)
  // ==========================================

  async getChannels(_req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await notificationChannelsService.listChannels();
      sendSuccess(res, channels);
    } catch (error) {
      next(error);
    }
  }

  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createChannelSchema.parse(req.body);
      const channel = await notificationChannelsService.createChannel(data);
      sendSuccess(res, channel, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateChannelSchema.parse(req.body);
      const channel = await notificationChannelsService.updateChannel(req.params.id as string, data);
      sendSuccess(res, channel);
    } catch (error) {
      next(error);
    }
  }

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationChannelsService.deleteChannel(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async testChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationChannelsService.testChannel(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // User notification preferences endpoints
  // ==========================================

  async getUserPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const preferences = await notificationChannelsService.getUserPreferences(userId);
      sendSuccess(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  async updateUserPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const data = updateUserPreferencesSchema.parse(req.body);
      const preferences = await notificationChannelsService.updateUserPreferences(userId, data.preferences);
      sendSuccess(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Send notification endpoint (admin)
  // ==========================================

  async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendNotificationSchema.parse(req.body);
      const results = await notificationDispatcher.dispatch({
        type: data.type,
        category: data.category,
        userId: data.userId,
        title: data.title,
        body: data.body,
        htmlBody: data.htmlBody,
        data: data.data,
        recipientEmail: data.recipientEmail,
        recipientPhone: data.recipientPhone,
        forceChannels: data.forceChannels as any,
      });
      sendSuccess(res, { dispatched: results });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
