import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { communicationsService } from './communications.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createThreadSchema = z.object({
  propertyId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'IN_APP', 'AIRBNB', 'BOOKING_COM']),
  subject: z.string().max(500).optional(),
  status: z.enum(['OPEN', 'AWAITING_REPLY', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().uuid().optional(),
  metadata: z.any().optional(),
  initialMessage: z.object({
    content: z.string().min(1),
    senderType: z.enum(['GUEST', 'STAFF', 'SYSTEM', 'AI']),
    senderId: z.string().uuid().optional(),
    contentType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION', 'TEMPLATE']).optional(),
    attachments: z.any().optional(),
  }).optional(),
});

const updateThreadSchema = z.object({
  propertyId: z.string().uuid().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  guestId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'IN_APP', 'AIRBNB', 'BOOKING_COM']).optional(),
  subject: z.string().max(500).nullable().optional(),
  status: z.enum(['OPEN', 'AWAITING_REPLY', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  metadata: z.any().optional(),
});

const addMessageSchema = z.object({
  content: z.string().min(1),
  senderType: z.enum(['GUEST', 'STAFF', 'SYSTEM', 'AI']),
  senderId: z.string().uuid().optional(),
  contentType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'LOCATION', 'TEMPLATE']).optional(),
  attachments: z.any().optional(),
  externalMessageId: z.string().optional(),
  metadata: z.any().optional(),
});

const assignThreadSchema = z.object({
  assignedToId: z.string().uuid(),
});

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['OPEN', 'AWAITING_REPLY', 'RESOLVED', 'CLOSED']).optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'IN_APP', 'AIRBNB', 'BOOKING_COM']).optional(),
  propertyId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastMessageAt', 'status', 'channel']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class CommunicationsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { threads, total, page, limit } = await communicationsService.getAllThreads(
        filters,
        userOwnerId,
      );

      sendPaginated(res, threads, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const thread = await communicationsService.getThreadById(req.params.id as string, userOwnerId);
      sendSuccess(res, thread);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createThreadSchema.parse(req.body);
      const thread = await communicationsService.createThread(data);
      sendSuccess(res, thread, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateThreadSchema.parse(req.body);
      const thread = await communicationsService.updateThread(req.params.id as string, data);
      sendSuccess(res, thread);
    } catch (error) {
      next(error);
    }
  }

  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addMessageSchema.parse(req.body);
      const message = await communicationsService.addMessage(req.params.id as string, data);
      sendSuccess(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  async markMessageRead(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await communicationsService.markMessageRead(req.params.id as string);
      sendSuccess(res, message);
    } catch (error) {
      next(error);
    }
  }

  async assignThread(req: Request, res: Response, next: NextFunction) {
    try {
      const data = assignThreadSchema.parse(req.body);
      const thread = await communicationsService.assignThread(req.params.id as string, data);
      sendSuccess(res, thread);
    } catch (error) {
      next(error);
    }
  }

  async resolveThread(req: Request, res: Response, next: NextFunction) {
    try {
      const thread = await communicationsService.resolveThread(req.params.id as string);
      sendSuccess(res, thread);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const stats = await communicationsService.getThreadStats(userOwnerId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const communicationsController = new CommunicationsController();
