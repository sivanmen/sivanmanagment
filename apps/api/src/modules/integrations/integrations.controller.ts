import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { integrationsService } from './integrations.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  type: z.enum(['OTA', 'PAYMENT', 'ACCOUNTING', 'COMMUNICATION', 'IOT', 'ANALYTICS', 'CRM', 'CLEANING', 'CUSTOM']).optional(),
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'name', 'provider', 'lastSyncAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  provider: z.string().min(1).max(100),
  type: z.enum(['OTA', 'PAYMENT', 'ACCOUNTING', 'COMMUNICATION', 'IOT', 'ANALYTICS', 'CRM', 'CLEANING', 'CUSTOM']),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.string()).optional(),
  syncFrequencyMin: z.number().int().min(1).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.string()).optional(),
  syncFrequencyMin: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

const syncLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class IntegrationsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { integrations, total, page, limit } = await integrationsService.getAllIntegrations(filters);
      sendPaginated(res, integrations, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await integrationsService.getIntegrationById(req.params.id as string);
      sendSuccess(res, integration);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const integration = await integrationsService.createIntegration(data);
      sendSuccess(res, integration, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const integration = await integrationsService.updateIntegration(req.params.id as string, data);
      sendSuccess(res, integration);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationsService.deleteIntegration(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationsService.syncIntegration(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationsService.testConnection(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getSyncLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = syncLogsQuerySchema.parse(req.query);
      const { logs, total, page, limit } = await integrationsService.getSyncLogs(req.params.id as string, filters);
      sendPaginated(res, logs, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await integrationsService.getDashboard();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const integrationsController = new IntegrationsController();
