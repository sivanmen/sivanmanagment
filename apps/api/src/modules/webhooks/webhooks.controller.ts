import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { webhooksService } from './webhooks.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/api-error';

const webhookEventTypes = [
  'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.updated',
  'guest.created', 'guest.updated',
  'payment.received', 'payment.failed',
  'checkin.submitted', 'checkout.completed',
  'maintenance.created', 'maintenance.completed',
  'owner.statement.generated',
] as const;

const createEndpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(webhookEventTypes)).min(1),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
});

const updateEndpointSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(webhookEventTypes)).min(1).optional(),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
});

export class WebhooksController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const endpoints = webhooksService.getAllEndpoints();
      sendSuccess(res, endpoints);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createEndpointSchema.parse(req.body);
      const endpoint = webhooksService.createEndpoint(data);
      sendSuccess(res, endpoint, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateEndpointSchema.parse(req.body);
      const endpoint = webhooksService.updateEndpoint(id, data);
      if (!endpoint) {
        throw ApiError.notFound('Webhook endpoint');
      }
      sendSuccess(res, endpoint);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const deleted = webhooksService.deleteEndpoint(id);
      if (!deleted) {
        throw ApiError.notFound('Webhook endpoint');
      }
      sendSuccess(res, { message: 'Endpoint deleted' });
    } catch (error) {
      next(error);
    }
  }

  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const endpoint = webhooksService.toggleEndpoint(id);
      if (!endpoint) {
        throw ApiError.notFound('Webhook endpoint');
      }
      sendSuccess(res, endpoint);
    } catch (error) {
      next(error);
    }
  }

  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const delivery = webhooksService.testEndpoint(id);
      if (!delivery) {
        throw ApiError.notFound('Webhook endpoint');
      }
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  }

  async getDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      const endpointId = req.query.endpointId as string | undefined;
      const deliveries = webhooksService.getDeliveryLog(endpointId);
      sendSuccess(res, deliveries);
    } catch (error) {
      next(error);
    }
  }
}

export const webhooksController = new WebhooksController();
