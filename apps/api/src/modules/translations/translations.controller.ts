import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { translationsService } from './translations.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  namespace: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  search: z.string().optional(),
  isVerified: z.coerce.boolean().optional(),
  missing: z.string().min(2).max(5).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const createSchema = z.object({
  namespace: z.string().min(1).max(100),
  key: z.string().min(1).max(255),
  translations: z.record(z.string()),
  description: z.string().optional(),
});

const updateSchema = z.object({
  translations: z.record(z.string()).optional(),
  description: z.string().nullable().optional(),
  isVerified: z.boolean().optional(),
});

const exportSchema = z.object({
  namespace: z.string().min(1),
  language: z.string().min(2).max(5),
});

const importSchema = z.object({
  namespace: z.string().min(1).max(100),
  language: z.string().min(2).max(5),
  translations: z.record(z.string()),
});

export class TranslationsController {
  async getNamespaces(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await translationsService.getNamespaces();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const result = await translationsService.getTranslations(filters);
      if (Array.isArray(result.translations)) {
        sendPaginated(res, result.translations, result.total, result.page, result.limit);
      } else {
        sendSuccess(res, result);
      }
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await translationsService.getTranslationById(req.params.id as string);
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const entry = await translationsService.createTranslation(data);
      sendSuccess(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const entry = await translationsService.updateTranslation(
        req.params.id as string,
        data,
        req.user?.userId,
      );
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await translationsService.deleteTranslation(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const params = exportSchema.parse(req.query);
      const result = await translationsService.exportNamespace(params.namespace, params.language);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async import(req: Request, res: Response, next: NextFunction) {
    try {
      const data = importSchema.parse(req.body);
      const result = await translationsService.importTranslations(data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await translationsService.getStats();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const translationsController = new TranslationsController();
