import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ownersService } from './owners.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { ApiError } from '../../utils/api-error';

const createOwnerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  billingAddress: z.any().optional(),
  defaultManagementFeePercent: z.number().min(0).max(100).optional(),
  defaultMinimumMonthlyFee: z.number().min(0).optional(),
  expenseApprovalThreshold: z.number().min(0).optional(),
  preferredPaymentMethod: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).optional(),
  bankDetails: z.any().optional(),
  stripeAccountId: z.string().optional(),
  paypalEmail: z.string().email().optional(),
  contractStartDate: z.string().datetime().optional(),
  contractEndDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateOwnerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  companyName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  billingAddress: z.any().optional(),
  defaultManagementFeePercent: z.number().min(0).max(100).optional(),
  defaultMinimumMonthlyFee: z.number().min(0).optional(),
  expenseApprovalThreshold: z.number().min(0).optional(),
  preferredPaymentMethod: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).optional(),
  bankDetails: z.any().optional(),
  stripeAccountId: z.string().nullable().optional(),
  paypalEmail: z.string().email().nullable().optional(),
  contractStartDate: z.string().datetime().nullable().optional(),
  contractEndDate: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'companyName', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class OwnersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { owners, total, page, limit } = await ownersService.getAllOwners(filters);
      sendPaginated(res, owners, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      // OWNER role can only view their own profile
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        req.user!.ownerId !== id
      ) {
        throw ApiError.forbidden('You can only view your own profile');
      }

      const owner = await ownersService.getOwnerById(id);
      sendSuccess(res, owner);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOwnerSchema.parse(req.body);
      const result = await ownersService.createOwner(data);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      // OWNER role can only update their own profile
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        req.user!.ownerId !== id
      ) {
        throw ApiError.forbidden('You can only update your own profile');
      }

      const data = updateOwnerSchema.parse(req.body);

      // Non-admin owners cannot change fee configuration
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        (data.defaultManagementFeePercent !== undefined ||
          data.defaultMinimumMonthlyFee !== undefined ||
          data.expenseApprovalThreshold !== undefined)
      ) {
        throw ApiError.forbidden('You cannot modify fee configuration');
      }

      const owner = await ownersService.updateOwner(id, data);
      sendSuccess(res, owner);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ownersService.deleteOwner(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      // OWNER role can only view their own financials
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        req.user!.ownerId !== id
      ) {
        throw ApiError.forbidden('You can only view your own financial summary');
      }

      const summary = await ownersService.getOwnerFinancialSummary(id);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const ownersController = new OwnersController();
