import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import { sendSuccess } from '../../utils/response';
import { aiTemplateService } from './ai-template.service';

const createProviderSchema = z.object({
  provider: z.enum(['ANTHROPIC', 'OPENAI', 'GOOGLE']),
  name: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  config: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(100).max(32000).optional(),
    })
    .passthrough()
    .optional(),
});

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  config: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(100).max(32000).optional(),
    })
    .passthrough()
    .optional(),
});

export class AiProvidersController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await prisma.aiProviderConfig.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          provider: true,
          name: true,
          model: true,
          isActive: true,
          isDefault: true,
          config: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
          // Note: apiKey is intentionally excluded for security
        },
      });

      sendSuccess(res, providers);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProviderSchema.parse(req.body);

      // If this is set as default, unset all other defaults
      if (data.isDefault) {
        await prisma.aiProviderConfig.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const provider = await prisma.aiProviderConfig.create({
        data: {
          provider: data.provider,
          name: data.name,
          apiKey: data.apiKey,
          model: data.model,
          isActive: data.isActive ?? true,
          isDefault: data.isDefault ?? false,
          config: data.config as any,
        },
        select: {
          id: true,
          provider: true,
          name: true,
          model: true,
          isActive: true,
          isDefault: true,
          config: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, provider, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateProviderSchema.parse(req.body);

      const existing = await prisma.aiProviderConfig.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('AiProviderConfig');
      }

      const provider = await prisma.aiProviderConfig.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
          ...(data.model !== undefined && { model: data.model }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.config !== undefined && { config: data.config as any }),
        },
        select: {
          id: true,
          provider: true,
          name: true,
          model: true,
          isActive: true,
          isDefault: true,
          config: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, provider);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await prisma.aiProviderConfig.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('AiProviderConfig');
      }

      await prisma.aiProviderConfig.delete({ where: { id } });

      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  }

  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const result = await aiTemplateService.testProvider(id);

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const existing = await prisma.aiProviderConfig.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('AiProviderConfig');
      }

      if (!existing.isActive) {
        throw ApiError.badRequest('Cannot set an inactive provider as default', 'PROVIDER_INACTIVE');
      }

      // Unset all other defaults
      await prisma.aiProviderConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Set this one as default
      const provider = await prisma.aiProviderConfig.update({
        where: { id },
        data: { isDefault: true },
        select: {
          id: true,
          provider: true,
          name: true,
          model: true,
          isActive: true,
          isDefault: true,
          config: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, provider);
    } catch (error) {
      next(error);
    }
  }
}

export const aiProvidersController = new AiProvidersController();
