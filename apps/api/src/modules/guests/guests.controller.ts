import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { guestsService } from './guests.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createGuestSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  nationality: z.string().max(2).optional(),
  language: z.string().max(5).optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  idExpiry: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.any().optional(),
  tags: z.any().optional(),
  notes: z.string().optional(),
  screeningStatus: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']).optional(),
  metadata: z.any().optional(),
});

const updateGuestSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  nationality: z.string().max(2).nullable().optional(),
  language: z.string().max(5).nullable().optional(),
  idType: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  idExpiry: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  address: z.any().optional(),
  tags: z.any().optional(),
  notes: z.string().nullable().optional(),
  screeningStatus: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']).nullable().optional(),
  totalStays: z.number().int().min(0).optional(),
  totalRevenue: z.number().min(0).optional(),
  metadata: z.any().optional(),
});

const mergeGuestsSchema = z.object({
  primaryId: z.string().uuid(),
  duplicateId: z.string().uuid(),
});

const querySchema = z.object({
  search: z.string().optional(),
  screeningStatus: z.enum(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']).optional(),
  nationality: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'firstName', 'lastName', 'totalStays', 'totalRevenue', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class GuestsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { guests, total, page, limit } = await guestsService.getAllGuests(filters);
      sendPaginated(res, guests, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const guest = await guestsService.getGuestById(req.params.id as string);
      sendSuccess(res, guest);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createGuestSchema.parse(req.body);
      const guest = await guestsService.createGuest(data);
      sendSuccess(res, guest, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateGuestSchema.parse(req.body);
      const guest = await guestsService.updateGuest(req.params.id as string, data);
      sendSuccess(res, guest);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await guestsService.deleteGuest(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async merge(req: Request, res: Response, next: NextFunction) {
    try {
      const { primaryId, duplicateId } = mergeGuestsSchema.parse(req.body);
      const guest = await guestsService.mergeGuests(primaryId, duplicateId);
      sendSuccess(res, guest);
    } catch (error) {
      next(error);
    }
  }
}

export const guestsController = new GuestsController();
