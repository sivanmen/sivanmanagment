import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { expensesService } from './expenses.service';
import { expenseApprovalService } from './expense-approval.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const querySchema = z.object({
  propertyId: z.string().optional(),
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'CLEANING', 'INSURANCE', 'TAX', 'MARKETING', 'MANAGEMENT', 'MISC']).optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  isRecurring: z.coerce.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  vendor: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['date', 'amount', 'category', 'propertyName', 'approvalStatus']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createSchema = z.object({
  propertyId: z.string(),
  propertyName: z.string(),
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'CLEANING', 'INSURANCE', 'TAX', 'MARKETING', 'MANAGEMENT', 'MISC']),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  date: z.string(),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringSchedule: z.object({
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
    nextDate: z.string(),
    endDate: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  category: z.enum(['MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'CLEANING', 'INSURANCE', 'TAX', 'MARKETING', 'MANAGEMENT', 'MISC']).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  vendor: z.string().optional(),
  invoiceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

const recurringQuerySchema = z.object({
  propertyId: z.string().optional(),
});

const budgetQuerySchema = z.object({
  propertyId: z.string().optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

const statsQuerySchema = z.object({
  propertyId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export class ExpensesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { expenses, total, page, limit } = await expensesService.getAllExpenses(filters);
      sendPaginated(res, expenses, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.getExpenseById(req.params.id as string);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const expense = await expensesService.createExpense(data as any, req.user!.userId);

      // Check if expense needs owner approval via WhatsApp
      let approvalRequest = null;
      if (expense.propertyId && await expenseApprovalService.needsApproval(expense.propertyId, Number(expense.amount))) {
        try {
          // Update the expense status to PENDING (it's already PENDING by default,
          // but this makes the intent explicit for the approval workflow)
          approvalRequest = await expenseApprovalService.requestApproval(expense.id);
        } catch (err: any) {
          // Log but don't fail the expense creation
          console.error('[Expenses] Failed to send approval request:', err.message);
        }
      }

      sendSuccess(res, { ...expense, approvalRequest }, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const expense = await expensesService.updateExpense(req.params.id as string, data);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.deleteExpense(req.params.id as string);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.approveExpense(req.params.id as string, req.user!.userId);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = rejectSchema.parse(req.body);
      const expense = await expensesService.rejectExpense(req.params.id as string, reason);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.markAsPaid(req.params.id as string);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }

  async getRecurring(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = recurringQuerySchema.parse(req.query);
      const data = await expensesService.getRecurringExpenses(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getBudgetVsActual(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = budgetQuerySchema.parse(req.query);
      const data = await expensesService.getBudgetVsActual(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = statsQuerySchema.parse(req.query);
      const stats = await expensesService.getStats(filters);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ── Approval workflow ──

  async requestApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const approvalRequest = await expenseApprovalService.requestApproval(req.params.id as string);
      sendSuccess(res, approvalRequest, 201);
    } catch (error) {
      next(error);
    }
  }

  async getApprovalRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = approvalQuerySchema.parse(req.query);
      const result = await expenseApprovalService.getApprovalRequests(filters);
      sendPaginated(res, result.approvalRequests, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getApprovalThreshold(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.propertyId as string;
      const threshold = await expenseApprovalService.getApprovalThreshold(propertyId);
      sendSuccess(res, { propertyId, threshold });
    } catch (error) {
      next(error);
    }
  }

  async getPendingApprovalsForOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.params.ownerId as string;
      const pending = await expenseApprovalService.getPendingForOwner(ownerId);

      // Enrich with expense details
      const enriched = [];
      for (const req of pending) {
        try {
          const expense = await expensesService.getExpenseById(req.expenseId);
          enriched.push({ ...req, expense });
        } catch {
          enriched.push(req);
        }
      }

      sendSuccess(res, enriched);
    } catch (error) {
      next(error);
    }
  }

  async getApprovalHistoryForOwner(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.params.ownerId as string;
      const history = await expenseApprovalService.getHistoryForOwner(ownerId);

      const enriched = [];
      for (const req of history) {
        try {
          const expense = await expensesService.getExpenseById(req.expenseId);
          enriched.push({ ...req, expense });
        } catch {
          enriched.push(req);
        }
      }

      sendSuccess(res, enriched);
    } catch (error) {
      next(error);
    }
  }

  async approveViaWeb(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await expenseApprovalService.processApproval(
        req.params.id as string,
        true,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async rejectViaWeb(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await expenseApprovalService.processApproval(
        req.params.id as string,
        false,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async sendApprovalReminder(req: Request, res: Response, next: NextFunction) {
    try {
      await expenseApprovalService.sendReminder(req.params.requestId as string);
      sendSuccess(res, { message: 'Reminder sent' });
    } catch (error) {
      next(error);
    }
  }
}

const approvalQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  ownerId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const expensesController = new ExpensesController();
