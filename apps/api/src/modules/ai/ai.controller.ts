import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiService } from './ai.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const sessionsQuerySchema = z.object({
  context: z.enum(['GENERAL', 'BOOKING', 'MAINTENANCE', 'FINANCE', 'GUEST']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(4000),
  context: z.enum(['GENERAL', 'BOOKING', 'MAINTENANCE', 'FINANCE', 'GUEST']).optional(),
});

const recommendationsQuerySchema = z.object({
  propertyId: z.string().optional(),
  type: z.enum(['PRICING', 'MAINTENANCE', 'MARKETING', 'REVENUE', 'GUEST_EXPERIENCE']).optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DISMISSED']).optional(),
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const updateRecommendationSchema = z.object({
  status: z.enum(['ACCEPTED', 'DISMISSED']),
});

export class AIController {
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = sessionsQuerySchema.parse(req.query);
      const { sessions, total, page, limit } = await aiService.getSessions(req.user!.userId, filters);
      sendPaginated(res, sessions, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getSessionMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getSessionMessages(req.params.id as string, req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const data = chatSchema.parse(req.body);
      const result = await aiService.chat(req.user!.userId, data);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.deleteSession(req.params.id as string, req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = recommendationsQuerySchema.parse(req.query);
      const { recommendations, total, page, limit } = await aiService.getRecommendations(filters);
      sendPaginated(res, recommendations, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async updateRecommendation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRecommendationSchema.parse(req.body);
      const result = await aiService.updateRecommendation(req.params.id as string, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
