import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bulkService } from './bulk.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/api-error';

const executeBulkActionSchema = z.object({
  type: z.enum(['UPDATE_STATUS', 'ASSIGN', 'DELETE', 'EXPORT', 'SEND_MESSAGE', 'TAG']),
  entity: z.enum(['BOOKING', 'PROPERTY', 'GUEST', 'TASK', 'EXPENSE']),
  entityIds: z.array(z.string()).min(1),
  params: z.record(z.any()).optional().default({}),
});

const exportDataSchema = z.object({
  entity: z.enum(['BOOKING', 'PROPERTY', 'GUEST', 'TASK', 'EXPENSE']),
  filters: z.record(z.any()).optional().default({}),
  format: z.enum(['csv', 'json']).optional().default('csv'),
});

export class BulkController {
  async executeAction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = executeBulkActionSchema.parse(req.body);
      const action = bulkService.executeBulkAction(data, req.user!.userId);
      sendSuccess(res, action, 201);
    } catch (error) {
      next(error);
    }
  }

  async getActions(req: Request, res: Response, next: NextFunction) {
    try {
      const entity = req.query.entity as string | undefined;
      const status = req.query.status as string | undefined;
      const actions = bulkService.getBulkActions({
        entity: entity as any,
        status: status as any,
      });
      sendSuccess(res, actions);
    } catch (error) {
      next(error);
    }
  }

  async getActionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const action = bulkService.getBulkActionById(id);
      if (!action) {
        throw ApiError.notFound('Bulk action');
      }
      sendSuccess(res, action);
    } catch (error) {
      next(error);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = exportDataSchema.parse(req.body);
      const exported = bulkService.exportData(data.entity, data.filters, data.format);

      if (data.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${data.entity.toLowerCase()}-export.csv`);
        return res.send(exported);
      }

      sendSuccess(res, JSON.parse(exported));
    } catch (error) {
      next(error);
    }
  }
}

export const bulkController = new BulkController();
