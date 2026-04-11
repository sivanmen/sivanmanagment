import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { portfolioService } from './portfolio.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/api-error';

const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(36).optional(),
});

export class PortfolioController {
  private getOwnerId(req: Request): string {
    const ownerId = req.user!.ownerId;
    if (!ownerId) {
      throw ApiError.forbidden('Portfolio is only available for owners');
    }
    return ownerId;
  }

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = this.getOwnerId(req);
      const overview = await portfolioService.getPortfolioOverview(ownerId);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  }

  async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = this.getOwnerId(req);
      const properties = await portfolioService.getPortfolioProperties(ownerId);
      sendSuccess(res, properties);
    } catch (error) {
      next(error);
    }
  }

  async getTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = this.getOwnerId(req);
      const { months } = trendQuerySchema.parse(req.query);
      const trend = await portfolioService.getPortfolioTrend(ownerId, months);
      sendSuccess(res, trend);
    } catch (error) {
      next(error);
    }
  }

  async getComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = this.getOwnerId(req);
      const comparison = await portfolioService.getPortfolioComparison(ownerId);
      sendSuccess(res, comparison);
    } catch (error) {
      next(error);
    }
  }
}

export const portfolioController = new PortfolioController();
