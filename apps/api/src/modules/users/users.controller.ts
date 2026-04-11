import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName', 'role', 'lastLoginAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']),
  phone: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']).optional(),
  phone: z.string().nullable().optional(),
  language: z.string().min(2).max(5).optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  timezone: z.string().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']),
  phone: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  sendEmail: z.boolean().optional(),
  sendWhatsApp: z.boolean().optional(),
  welcomeMessage: z.string().optional(),
  notificationPreset: z.enum(['emailOnly', 'emailAndWhatsApp', 'allChannels', 'minimal', 'muteAll']).optional(),
});

const notificationSettingsSchema = z.object({
  settings: z.array(
    z.object({
      category: z.string(),
      email: z.boolean(),
      whatsapp: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
  ),
});

const quietHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
  days: z.array(z.string()),
  exceptUrgent: z.boolean(),
});

const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { users, total, page, limit } = await usersService.getAllUsers(filters);
      sendPaginated(res, users, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await usersService.createUser(data);
      sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await usersService.updateUser(req.params.id as string, data);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.deleteUser(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const data = inviteUserSchema.parse(req.body);
      const result = await usersService.inviteUser(data);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async suspend(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.suspendUser(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.activateUser(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.resetPassword(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = activityQuerySchema.parse(req.query);
      const result = await usersService.getActivity(req.params.id as string, filters);
      sendPaginated(res, result.activity, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await usersService.getSessions(req.params.id as string);
      sendSuccess(res, sessions);
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.revokeSession(req.params.id as string, req.params.sessionId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { settings } = notificationSettingsSchema.parse(req.body);
      const result = await usersService.updateNotificationSettings(req.params.id as string, settings);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateQuietHours(req: Request, res: Response, next: NextFunction) {
    try {
      const data = quietHoursSchema.parse(req.body);
      const result = await usersService.updateQuietHours(req.params.id as string, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await usersService.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
