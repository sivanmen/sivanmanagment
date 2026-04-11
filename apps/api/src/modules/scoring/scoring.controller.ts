import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scoringService } from './scoring.service';
import { sendSuccess } from '../../utils/response';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const allScoresQuerySchema = z.object({
  ownerId: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.string().optional(),
});

const historyQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
});

const updateRecommendationSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED']),
});

const updateConfigSchema = z.object({
  weights: z.record(z.number()).optional(),
  thresholds: z.array(z.object({
    grade: z.string(),
    minScore: z.number().min(0).max(100),
  })).optional(),
  benchmarks: z.record(z.number()).optional(),
});

const compareSchema = z.object({
  propertyIds: z.array(z.string()).min(1).max(10),
});

const portfolioQuerySchema = z.object({
  ownerId: z.string().optional(),
});

// ── Controller ───────────────────────────────────────────────────────────────

export class ScoringController {
  async getAllScores(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = allScoresQuerySchema.parse(req.query);
      const data = await scoringService.getAllScores(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getPropertyScore(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const data = await scoringService.getPropertyScore(propertyId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async recalculateScore(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const data = await scoringService.recalculateScore(propertyId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getScoreHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const { months } = historyQuerySchema.parse(req.query);
      const data = await scoringService.getScoreHistory(propertyId, months);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const data = await scoringService.getRecommendations(propertyId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateRecommendationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const recId = req.params.recId as string;
      const { status } = updateRecommendationSchema.parse(req.body);
      const data = await scoringService.updateRecommendationStatus(propertyId, recId, status);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getScoreConfig(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await scoringService.getScoreConfig();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateScoreConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = updateConfigSchema.parse(req.body);
      const data = await scoringService.updateScoreConfig(updates);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getPortfolioScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { ownerId } = portfolioQuerySchema.parse(req.query);
      const data = await scoringService.getPortfolioScore(ownerId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async compareScores(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyIds } = compareSchema.parse(req.body);
      const data = await scoringService.compareScores(propertyIds);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export const scoringController = new ScoringController();
