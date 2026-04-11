import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reviewsService } from './reviews.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  propertyId: z.string().optional(),
  source: z.enum(['AIRBNB', 'BOOKING_COM', 'VRBO', 'GOOGLE', 'DIRECT', 'TRIPADVISOR']).optional(),
  status: z.enum(['PENDING_RESPONSE', 'RESPONDED', 'FLAGGED', 'ARCHIVED']).optional(),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
  ratingMin: z.coerce.number().int().min(1).max(5).optional(),
  ratingMax: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['publishedAt', 'rating', 'guestName', 'propertyName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const respondSchema = z.object({
  response: z.string().min(10).max(2000),
});

const statusSchema = z.object({
  status: z.enum(['PENDING_RESPONSE', 'RESPONDED', 'FLAGGED', 'ARCHIVED']),
});

const statsQuerySchema = z.object({
  propertyId: z.string().optional(),
});

export class ReviewsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { reviews, total, page, limit } = await reviewsService.getAllReviews(filters);
      sendPaginated(res, reviews, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewsService.getReviewById(req.params.id as string);
      sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }

  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const data = respondSchema.parse(req.body);
      const review = await reviewsService.respondToReview(
        req.params.id as string,
        data,
        req.user!.userId,
      );
      sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = statusSchema.parse(req.body);
      const review = await reviewsService.updateReviewStatus(req.params.id as string, data);
      sendSuccess(res, review);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = statsQuerySchema.parse(req.query);
      const stats = await reviewsService.getStats(filters);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async suggestResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewsService.generateResponseSuggestion(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();
