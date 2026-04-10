import { z } from 'zod';
import { PaymentMethod } from '../types/owner.types';

export const createOwnerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  companyName: z.string().max(300).optional(),
  taxId: z.string().max(50).optional(),
  billingAddress: z.string().max(500).optional(),
  defaultManagementFeePercent: z.number().min(0).max(100),
  defaultMinimumMonthlyFee: z.number().min(0).default(0),
  expenseApprovalThreshold: z.number().min(0).default(500),
  preferredPaymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  contractEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  notes: z.string().max(5000).optional(),
});

export const updateOwnerSchema = createOwnerSchema.partial().extend({
  id: z.string().uuid('Invalid owner ID'),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;
