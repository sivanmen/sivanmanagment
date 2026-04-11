import { Request, Response, NextFunction } from 'express';
import { templatesService } from './templates.service';
import type { TemplateChannel, TemplateCategory } from './templates.service';

class TemplatesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { channel, category, language, isActive } = req.query;
      const templates = templatesService.getAllTemplates({
        channel: channel as TemplateChannel | undefined,
        category: category as TemplateCategory | undefined,
        language: language as string | undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      res.json({ data: templates, total: templates.length });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tpl = templatesService.getTemplateById(req.params.id as string);
      if (!tpl) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ data: tpl });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug, channel, subject, body, variables, category, language, isActive } =
        req.body;

      if (!name || !slug || !channel || !body || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const tpl = templatesService.createTemplate({
        name,
        slug,
        channel,
        subject,
        body,
        variables: variables || [],
        category,
        language: language || 'en',
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(201).json({ data: tpl });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tpl = templatesService.updateTemplate(req.params.id as string, req.body);
      if (!tpl) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ data: tpl });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = templatesService.deleteTemplate(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const sampleData = req.body.sampleData || {};
      const result = templatesService.previewTemplate(req.params.id as string, sampleData);
      if (!result) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req: Request, res: Response, next: NextFunction) {
    try {
      const tpl = templatesService.duplicateTemplate(req.params.id as string);
      if (!tpl) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.status(201).json({ data: tpl });
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
