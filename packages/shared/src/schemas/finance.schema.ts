import { z } from 'zod';
import { IncomeCategory, ExpenseCategory } from '../types/finance.types';

export const createIncomeSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  category: z.nativeEnum(IncomeCategory),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format'),
  source: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const createExpenseSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  ownerId: z.string().uuid('Invalid owner ID'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format'),
  vendor: z.string().max(200).optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
