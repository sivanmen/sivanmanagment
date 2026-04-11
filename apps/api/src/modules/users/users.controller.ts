import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName', 'role']).optional(),
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
}

export const usersController = new UsersController();
