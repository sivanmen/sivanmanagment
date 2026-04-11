import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { documentsService } from './documents.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createDocumentSchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1).max(255),
  category: z.enum([
    'CONTRACT', 'INVOICE', 'RECEIPT', 'LICENSE', 'INSURANCE',
    'TAX', 'ID_DOCUMENT', 'PHOTO', 'REPORT', 'OTHER',
  ]),
  tags: z.any().optional(),
  parentId: z.string().uuid().optional(),
  accessLevel: z.enum(['PUBLIC', 'OWNER_VISIBLE', 'ADMIN_ONLY']).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.any().optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  category: z.enum([
    'CONTRACT', 'INVOICE', 'RECEIPT', 'LICENSE', 'INSURANCE',
    'TAX', 'ID_DOCUMENT', 'PHOTO', 'REPORT', 'OTHER',
  ]).optional(),
  tags: z.any().optional(),
  accessLevel: z.enum(['PUBLIC', 'OWNER_VISIBLE', 'ADMIN_ONLY']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  metadata: z.any().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  category: z.enum([
    'CONTRACT', 'INVOICE', 'RECEIPT', 'LICENSE', 'INSURANCE',
    'TAX', 'ID_DOCUMENT', 'PHOTO', 'REPORT', 'OTHER',
  ]).optional(),
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  accessLevel: z.enum(['PUBLIC', 'OWNER_VISIBLE', 'ADMIN_ONLY']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'title', 'category', 'fileSize', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class DocumentsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { documents, total, page, limit } = await documentsService.getAllDocuments(
        filters,
        userOwnerId,
      );

      sendPaginated(res, documents, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const document = await documentsService.getDocumentById(req.params.id as string, userOwnerId);
      sendSuccess(res, document);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDocumentSchema.parse(req.body);
      const document = await documentsService.createDocument({
        ...data,
        uploadedById: req.user!.userId,
      });
      sendSuccess(res, document, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateDocumentSchema.parse(req.body);
      const document = await documentsService.updateDocument(req.params.id as string, data);
      sendSuccess(res, document);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.deleteDocument(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const documents = await documentsService.getDocumentsByEntity(
        'property',
        req.params.propertyId as string,
        userOwnerId,
      );
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }

  async getByOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const documents = await documentsService.getDocumentsByEntity(
        'owner',
        req.params.ownerId as string,
        userOwnerId,
      );
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
