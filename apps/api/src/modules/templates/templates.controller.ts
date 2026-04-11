import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { templatesService } from './templates.service';
import { aiTemplateService } from './ai-template.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import type { Locale, TemplateChannel } from './templates.service';

// ── Validation Schemas ───────────────────────────────────────────

const multiLangSchema = z.record(z.string(), z.string()).optional();

const createTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  category: z.enum(['booking', 'payment', 'maintenance', 'system', 'marketing', 'guest']),
  name: z.record(z.string(), z.string()),
  description: z.string().max(500).optional(),
  emailSubject: multiLangSchema,
  emailBody: multiLangSchema,
  whatsappBody: multiLangSchema,
  smsBody: multiLangSchema,
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  metadata: z.any().optional(),
});

const updateTemplateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores')
    .optional(),
  category: z.enum(['booking', 'payment', 'maintenance', 'system', 'marketing', 'guest']).optional(),
  name: z.record(z.string(), z.string()).optional(),
  description: z.string().max(500).optional().nullable(),
  emailSubject: multiLangSchema,
  emailBody: multiLangSchema,
  whatsappBody: multiLangSchema,
  smsBody: multiLangSchema,
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});

const renderSchema = z.object({
  slug: z.string().min(1).optional(),
  templateId: z.string().uuid().optional(),
  locale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  channel: z.enum(['email', 'whatsapp', 'sms']),
  variables: z.record(z.string(), z.string()).optional(),
});

const translateSchema = z.object({
  content: z.string().min(1),
  fromLocale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  toLocale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  providerId: z.string().uuid().optional(),
});

const translateAllSchema = z.object({
  content: z.string().min(1),
  fromLocale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  providerId: z.string().uuid().optional(),
});

const improveSchema = z.object({
  content: z.string().min(1),
  locale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  instructions: z.string().min(1).max(1000),
  providerId: z.string().uuid().optional(),
});

const generateSchema = z.object({
  description: z.string().min(1).max(1000),
  locale: z.enum(['en', 'he', 'de', 'es', 'fr', 'ru']),
  channel: z.enum(['email', 'whatsapp', 'sms']),
  variables: z.array(z.string()).optional(),
  providerId: z.string().uuid().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  category: z.enum(['booking', 'payment', 'maintenance', 'system', 'marketing', 'guest']).optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'slug', 'category']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ── Controller ───────────────────────────────────────────────────

export class TemplatesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { templates, total, page, limit } = await templatesService.getAll(filters);
      sendPaginated(res, templates, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await templatesService.getById(req.params.id as string);
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTemplateSchema.parse(req.body);
      const template = await templatesService.create({
        ...data,
        lastEditedBy: req.user?.userId,
      });
      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTemplateSchema.parse(req.body);
      const template = await templatesService.update(req.params.id as string, {
        ...data,
        description: data.description ?? undefined,
        lastEditedBy: req.user?.userId,
      });
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await templatesService.remove(req.params.id as string);
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await templatesService.duplicate(req.params.id as string);
      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  async render(req: Request, res: Response, next: NextFunction) {
    try {
      const data = renderSchema.parse(req.body);

      if (!data.slug && !data.templateId) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Either slug or templateId is required' },
        });
      }

      let template;
      if (data.templateId) {
        template = await templatesService.getById(data.templateId);
      } else {
        template = await templatesService.getBySlug(data.slug!);
      }

      const rendered = templatesService.renderTemplate(
        template,
        data.locale as Locale,
        data.channel as TemplateChannel,
        data.variables || {},
      );

      if (!rendered) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_CONTENT',
            message: `No content found for locale "${data.locale}" and channel "${data.channel}"`,
          },
        });
      }

      sendSuccess(res, rendered);
    } catch (error) {
      next(error);
    }
  }

  // ── AI Actions ───────────────────────────────────────────────

  async translate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = translateSchema.parse(req.body);

      if (data.fromLocale === data.toLocale) {
        return sendSuccess(res, { translated: data.content });
      }

      const translated = await aiTemplateService.translateTemplate(
        data.content,
        data.fromLocale as Locale,
        data.toLocale as Locale,
        data.providerId,
      );

      sendSuccess(res, { translated });
    } catch (error) {
      next(error);
    }
  }

  async translateAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = translateAllSchema.parse(req.body);

      const translations = await aiTemplateService.translateAll(
        data.content,
        data.fromLocale as Locale,
        data.providerId,
      );

      sendSuccess(res, { translations });
    } catch (error) {
      next(error);
    }
  }

  async improve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = improveSchema.parse(req.body);

      const improved = await aiTemplateService.improveTemplate(
        data.content,
        data.locale as Locale,
        data.instructions,
        data.providerId,
      );

      sendSuccess(res, { improved });
    } catch (error) {
      next(error);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateSchema.parse(req.body);

      const generated = await aiTemplateService.generateTemplate(
        data.description,
        data.locale as Locale,
        data.channel,
        data.variables,
        data.providerId,
      );

      sendSuccess(res, { generated });
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
