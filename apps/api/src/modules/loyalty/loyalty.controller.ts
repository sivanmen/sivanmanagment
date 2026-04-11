import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loyaltyService } from './loyalty.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const earnPointsSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int().positive(),
  description: z.string().min(1),
  bookingId: z.string().uuid().optional(),
});

const redeemPointsSchema = z.object({
  benefitId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
});

const transactionQuerySchema = z.object({
  type: z.enum(['EARN', 'REDEEM', 'EXPIRE', 'ADJUST', 'BONUS']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const membersQuerySchema = z.object({
  tierId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['joinedAt', 'currentPoints', 'totalPointsEarned', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class LoyaltyController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await loyaltyService.getLoyaltyProfile(req.user!.userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = transactionQuerySchema.parse(req.query);
      const { transactions, total, page, limit } = await loyaltyService.getTransactions(
        req.user!.userId,
        filters,
      );
      sendPaginated(res, transactions, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async earnPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const data = earnPointsSchema.parse(req.body);
      const transaction = await loyaltyService.earnPoints(data);
      sendSuccess(res, transaction, 201);
    } catch (error) {
      next(error);
    }
  }

  async redeemPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const data = redeemPointsSchema.parse(req.body);
      const result = await loyaltyService.redeemPoints({
        userId: req.user!.userId,
        ...data,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAllMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = membersQuerySchema.parse(req.query);
      const { members, total, page, limit } = await loyaltyService.getAllMembers(filters);
      sendPaginated(res, members, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const rewards = await loyaltyService.getAvailableRewards(req.user!.userId);
      sendSuccess(res, rewards);
    } catch (error) {
      next(error);
    }
  }
}

export const loyaltyController = new LoyaltyController();
