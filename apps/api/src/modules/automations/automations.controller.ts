import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { automationsService } from './automations.service';
import { sendSuccess } from '../../utils/response';

const triggerTypes = [
  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'CHECK_IN',
  'CHECK_OUT',
  'PAYMENT_RECEIVED',
  'EXPENSE_CREATED',
  'MAINTENANCE_CREATED',
  'GUEST_CREATED',
  'DOCUMENT_EXPIRING',
  'OCCUPANCY_DROP',
  'REVIEW_RECEIVED',
  'SCHEDULE',
] as const;

const conditionOperators = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'in',
] as const;

const actionTypes = [
  'SEND_EMAIL',
  'SEND_WHATSAPP',
  'CREATE_TASK',
  'CREATE_NOTIFICATION',
  'UPDATE_STATUS',
  'ASSIGN_TO',
  'ADD_TAG',
  'CALCULATE_FEE',
  'SEND_WEBHOOK',
  'DELAY',
  'CREATE_EXPENSE',
] as const;

const triggerSchema = z.object({
  type: z.enum(triggerTypes),
  config: z.record(z.unknown()).optional(),
});

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(conditionOperators),
  value: z.unknown(),
});

const actionSchema = z.object({
  type: z.enum(actionTypes),
  config: z.record(z.unknown()),
});

const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  trigger: triggerSchema,
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).min(1),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  trigger: triggerSchema.optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).optional(),
});

export class AutomationsController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await automationsService.getAllRules();
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await automationsService.getRuleById(req.params.id as string);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRuleSchema.parse(req.body);
      const conditions = (data.conditions ?? []).map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value ?? null,
      }));
      const rule = await automationsService.createRule({
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
        trigger: data.trigger,
        conditions,
        actions: data.actions,
      });
      sendSuccess(res, rule, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRuleSchema.parse(req.body);
      const updatePayload: Record<string, unknown> = { ...data };
      if (data.conditions) {
        updatePayload.conditions = data.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value ?? null,
        }));
      }
      const rule = await automationsService.updateRule(req.params.id as string, updatePayload);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await automationsService.deleteRule(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await automationsService.toggleRule(req.params.id as string);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await automationsService.testRule(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const ruleId = typeof req.query.ruleId === 'string' ? req.query.ruleId : undefined;
      const logs = await automationsService.getExecutionLog(ruleId);
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

export const automationsController = new AutomationsController();
