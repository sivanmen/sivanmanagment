import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { channelsService } from './channels.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createChannelSchema = z.object({
  propertyId: z.string().uuid(),
  channel: z.enum(['AIRBNB', 'BOOKING_COM', 'VRBO', 'EXPEDIA', 'DIRECT', 'CUSTOM']),
  externalListingId: z.string().optional(),
  credentials: z.any().optional(),
  settings: z.any().optional(),
});

const updateChannelSchema = z.object({
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'CHANNEL_PENDING', 'CHANNEL_ERROR']).optional(),
  externalListingId: z.string().nullable().optional(),
  credentials: z.any().optional(),
  settings: z.any().optional(),
  syncError: z.string().nullable().optional(),
});

const querySchema = z.object({
  propertyId: z.string().uuid().optional(),
  channel: z.enum(['AIRBNB', 'BOOKING_COM', 'VRBO', 'EXPEDIA', 'DIRECT', 'CUSTOM']).optional(),
  status: z.enum(['CONNECTED', 'DISCONNECTED', 'CHANNEL_PENDING', 'CHANNEL_ERROR']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'channel', 'status', 'lastSyncedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class ChannelsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { channels, total, page, limit } = await channelsService.getAllChannels(filters);
      sendPaginated(res, channels, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await channelsService.getChannelById(req.params.id as string);
      sendSuccess(res, channel);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createChannelSchema.parse(req.body);
      const channel = await channelsService.createChannel(data);
      sendSuccess(res, channel, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateChannelSchema.parse(req.body);
      const channel = await channelsService.updateChannel(req.params.id as string, data);
      sendSuccess(res, channel);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await channelsService.deleteChannel(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await channelsService.syncChannel(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await channelsService.getChannelStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const channelsController = new ChannelsController();
