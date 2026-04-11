import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pricingService } from './pricing.service';
import { sendSuccess } from '../../utils/response';

const ruleTypes = [
  'SEASONAL',
  'DAY_OF_WEEK',
  'LENGTH_OF_STAY',
  'LAST_MINUTE',
  'EARLY_BIRD',
  'OCCUPANCY',
  'CUSTOM',
] as const;

const adjustmentTypes = ['PERCENTAGE', 'FIXED', 'OVERRIDE'] as const;
const applyToTypes = ['NIGHTLY_RATE', 'TOTAL', 'CLEANING_FEE'] as const;

const conditionSchema = z.object({
  dateRange: z
    .object({ start: z.string(), end: z.string() })
    .optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  minNights: z.number().min(1).optional(),
  maxNights: z.number().min(1).optional(),
  minDaysBeforeCheckin: z.number().min(0).optional(),
  maxDaysBeforeCheckin: z.number().min(0).optional(),
  minOccupancyPercent: z.number().min(0).max(100).optional(),
  maxOccupancyPercent: z.number().min(0).max(100).optional(),
});

const adjustmentSchema = z.object({
  type: z.enum(adjustmentTypes),
  value: z.number(),
  applyTo: z.enum(applyToTypes),
});

const createRuleSchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(1).max(255),
  type: z.enum(ruleTypes),
  priority: z.number().min(0).max(1000),
  isActive: z.boolean().optional(),
  conditions: conditionSchema,
  adjustment: adjustmentSchema,
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

const updateRuleSchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(ruleTypes).optional(),
  priority: z.number().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  conditions: conditionSchema.optional(),
  adjustment: adjustmentSchema.optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

const calculateSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().min(1),
});

const simulateSchema = z.object({
  propertyId: z.string().min(1),
  scenarios: z.array(
    z.object({
      checkIn: z.string().min(1),
      checkOut: z.string().min(1),
      guests: z.number().min(1),
    }),
  ).min(1),
});

export class PricingController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
      const rules = await pricingService.getAllRules(propertyId);
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRuleSchema.parse(req.body);
      const rule = await pricingService.createRule({
        propertyId: data.propertyId,
        name: data.name,
        type: data.type,
        priority: data.priority,
        isActive: data.isActive ?? true,
        conditions: data.conditions,
        adjustment: data.adjustment,
        validFrom: data.validFrom,
        validTo: data.validTo,
      });
      sendSuccess(res, rule, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRuleSchema.parse(req.body);
      const rule = await pricingService.updateRule(req.params.id as string, data);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pricingService.deleteRule(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await pricingService.toggleRule(req.params.id as string);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  }

  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = calculateSchema.parse(req.body);
      const breakdown = await pricingService.calculatePrice(
        data.propertyId,
        data.checkIn,
        data.checkOut,
        data.guests,
      );
      sendSuccess(res, breakdown);
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const calendar = await pricingService.getSeasonalCalendar(propertyId, month, year);
      sendSuccess(res, calendar);
    } catch (error) {
      next(error);
    }
  }

  async simulate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = simulateSchema.parse(req.body);
      const results = await pricingService.simulatePricing(data.propertyId, data.scenarios);
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();
