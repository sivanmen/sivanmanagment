import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { accountingService } from './accounting.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const accountsQuerySchema = z.object({
  type: z.enum(['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY']).optional(),
  subType: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const createAccountSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(200),
  type: z.enum(['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY']),
  subType: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const journalQuerySchema = z.object({
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(['DRAFT', 'POSTED', 'VOIDED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['date', 'entryNumber', 'description']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createJournalSchema = z.object({
  date: z.string(),
  description: z.string().min(1).max(500),
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  bookingId: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string(),
    accountCode: z.string(),
    accountName: z.string(),
    debit: z.number().min(0),
    credit: z.number().min(0),
    memo: z.string().optional(),
  })).min(2),
});

const pnlQuerySchema = z.object({
  propertyId: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const taxQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});

export class AccountingController {
  // ── Accounts ──

  async getAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = accountsQuerySchema.parse(req.query);
      const { accounts, total, page, limit } = await accountingService.getAccounts(filters);
      sendPaginated(res, accounts, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getAccountById(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountingService.getAccountById(req.params.id as string);
      sendSuccess(res, account);
    } catch (error) {
      next(error);
    }
  }

  async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAccountSchema.parse(req.body);
      const account = await accountingService.createAccount(data);
      sendSuccess(res, account, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAccountSchema.parse(req.body);
      const account = await accountingService.updateAccount(req.params.id as string, data);
      sendSuccess(res, account);
    } catch (error) {
      next(error);
    }
  }

  // ── Journal Entries ──

  async getJournalEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = journalQuerySchema.parse(req.query);
      const { entries, total, page, limit } = await accountingService.getJournalEntries(filters);
      sendPaginated(res, entries, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getJournalEntryById(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await accountingService.getJournalEntryById(req.params.id as string);
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async createJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createJournalSchema.parse(req.body);
      const entry = await accountingService.createJournalEntry(data);
      sendSuccess(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  async postJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await accountingService.postJournalEntry(req.params.id as string, req.user!.userId);
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  async voidJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await accountingService.voidJournalEntry(req.params.id as string);
      sendSuccess(res, entry);
    } catch (error) {
      next(error);
    }
  }

  // ── Reports ──

  async getTrialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getTrialBalance();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = pnlQuerySchema.parse(req.query);
      const data = await accountingService.getProfitAndLoss(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await accountingService.getBalanceSheet();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getTaxReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = taxQuerySchema.parse(req.query);
      const data = await accountingService.getTaxReport(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export const accountingController = new AccountingController();
