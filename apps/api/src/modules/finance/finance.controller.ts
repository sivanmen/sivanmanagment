import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { financeService } from './finance.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

// ─── Zod Schemas ─────────────────────────────────────────────

const incomeQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  category: z.enum(['RENTAL', 'CLEANING_FEE', 'EXTRA_SERVICES', 'DAMAGE_DEPOSIT', 'LATE_CHECKOUT', 'OTHER']).optional(),
  periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt', 'category']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createIncomeSchema = z.object({
  propertyId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  ownerId: z.string().uuid(),
  category: z.enum(['RENTAL', 'CLEANING_FEE', 'EXTRA_SERVICES', 'DAMAGE_DEPOSIT', 'LATE_CHECKOUT', 'OTHER']),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
  date: z.string(),
  metadata: z.any().optional(),
});

const updateIncomeSchema = z.object({
  propertyId: z.string().uuid().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().optional(),
  category: z.enum(['RENTAL', 'CLEANING_FEE', 'EXTRA_SERVICES', 'DAMAGE_DEPOSIT', 'LATE_CHECKOUT', 'OTHER']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  description: z.string().nullable().optional(),
  date: z.string().optional(),
  metadata: z.any().optional(),
});

const expenseQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'CLEANING', 'SUPPLIES', 'INSURANCE', 'TAXES', 'MANAGEMENT_FEE', 'MARKETING', 'EQUIPMENT', 'OTHER']).optional(),
  approvalStatus: z.enum(['AUTO_APPROVED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendor: z.string().optional(),
  isRecurring: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : undefined, z.boolean().optional()),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt', 'category', 'approvalStatus']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createExpenseSchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'CLEANING', 'SUPPLIES', 'INSURANCE', 'TAXES', 'MANAGEMENT_FEE', 'MARKETING', 'EQUIPMENT', 'OTHER']),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().min(1),
  date: z.string(),
  vendor: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional(),
  metadata: z.any().optional(),
});

const updateExpenseSchema = z.object({
  propertyId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'CLEANING', 'SUPPLIES', 'INSURANCE', 'TAXES', 'MANAGEMENT_FEE', 'MARKETING', 'EQUIPMENT', 'OTHER']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  vendor: z.string().nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

const summaryQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  periodYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

const trendQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  months: z.coerce.number().int().min(1).max(60).optional(),
});

// ─── Helper ──────────────────────────────────────────────────

function getUserOwnerId(req: Request): string | undefined {
  return req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
    ? req.user!.ownerId
    : undefined;
}

// ─── Controller ──────────────────────────────────────────────

export class FinanceController {
  // ── Income ─────────────────────────────────────────────────

  async getIncome(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = incomeQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const { records, total, page, limit } = await financeService.getIncomeRecords(filters, userOwnerId);
      sendPaginated(res, records, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async createIncome(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createIncomeSchema.parse(req.body);
      const record = await financeService.createIncomeRecord(data);
      sendSuccess(res, record, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateIncome(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateIncomeSchema.parse(req.body);
      const record = await financeService.updateIncomeRecord(req.params.id as string, data);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  async deleteIncome(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteIncomeRecord(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── Expenses ───────────────────────────────────────────────

  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = expenseQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const { records, total, page, limit } = await financeService.getExpenseRecords(filters, userOwnerId);
      sendPaginated(res, records, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createExpenseSchema.parse(req.body);
      const record = await financeService.createExpenseRecord(data, req.user!.userId);
      sendSuccess(res, record, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateExpenseSchema.parse(req.body);
      const record = await financeService.updateExpenseRecord(req.params.id as string, data);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await financeService.deleteExpenseRecord(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async approveExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await financeService.approveExpense(req.params.id as string, req.user!.userId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  async rejectExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await financeService.rejectExpense(req.params.id as string, req.user!.userId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }

  // ── Summary & Trend ────────────────────────────────────────

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = summaryQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const summary = await financeService.getFinancialSummary(filters, userOwnerId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = trendQuerySchema.parse(req.query);
      const userOwnerId = getUserOwnerId(req);
      const trend = await financeService.getMonthlyTrend(filters, userOwnerId);
      sendSuccess(res, trend);
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
