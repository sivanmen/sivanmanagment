import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentsService } from './payments.service';
import { stripeService } from './stripe.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const transactionQuerySchema = z.object({
  type: z.enum(['BOOKING_PAYMENT', 'OWNER_PAYOUT', 'REFUND', 'FEE_COLLECTION', 'AFFILIATE_PAYOUT']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  bookingId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  provider: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status', 'type']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createTransactionSchema = z.object({
  bookingId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  type: z.enum(['BOOKING_PAYMENT', 'OWNER_PAYOUT', 'REFUND', 'FEE_COLLECTION', 'AFFILIATE_PAYOUT']),
  provider: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']),
  providerTransactionId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  feeAmount: z.number().min(0).optional(),
  metadata: z.any().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']),
  metadata: z.any().optional(),
});

const addPaymentMethodSchema = z.object({
  provider: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']),
  providerMethodId: z.string().min(1),
  type: z.string().min(1),
  lastFour: z.string().length(4).optional(),
  brand: z.string().optional(),
  isDefault: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

const processRefundSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
});

const createPaymentLinkSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
});

const stripeRefundSchema = z.object({
  paymentIntentId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

export class PaymentsController {
  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = transactionQuerySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { transactions, total, page, limit } = await paymentsService.getAllTransactions(
        filters,
        userOwnerId,
      );

      sendPaginated(res, transactions, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const transaction = await paymentsService.getTransactionById(
        req.params.id as string,
        userOwnerId,
      );
      sendSuccess(res, transaction);
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTransactionSchema.parse(req.body);
      const transaction = await paymentsService.createTransaction(data);
      sendSuccess(res, transaction, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTransactionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, metadata } = updateStatusSchema.parse(req.body);
      const transaction = await paymentsService.updateTransactionStatus(
        req.params.id as string,
        status,
        metadata,
      );
      sendSuccess(res, transaction);
    } catch (error) {
      next(error);
    }
  }

  async getUserPaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const methods = await paymentsService.getUserPaymentMethods(req.user!.userId);
      sendSuccess(res, methods);
    } catch (error) {
      next(error);
    }
  }

  async addPaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addPaymentMethodSchema.parse(req.body);
      const method = await paymentsService.addPaymentMethod(req.user!.userId, data);
      sendSuccess(res, method, 201);
    } catch (error) {
      next(error);
    }
  }

  async removePaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.removePaymentMethod(
        req.params.id as string,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, amount, reason } = processRefundSchema.parse(req.body);
      const refund = await paymentsService.processRefund(transactionId, amount, reason);
      sendSuccess(res, refund, 201);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Stripe Integration Endpoints
  // ==========================================

  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId, amount, currency } = createPaymentIntentSchema.parse(req.body);

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency || 'EUR',
        { bookingId },
      );

      // Record a pending transaction
      await paymentsService.createTransaction({
        bookingId,
        type: 'BOOKING_PAYMENT',
        provider: 'STRIPE',
        providerTransactionId: paymentIntent.id,
        amount,
        currency: currency || 'EUR',
        status: 'PENDING',
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      });

      sendSuccess(res, {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async createPaymentLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId, amount, currency, description } = createPaymentLinkSchema.parse(req.body);

      const paymentUrl = await stripeService.createPaymentLink(
        bookingId,
        amount,
        currency || 'EUR',
        description || '',
      );

      sendSuccess(res, { url: paymentUrl, bookingId }, 201);
    } catch (error) {
      next(error);
    }
  }

  async stripeRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentIntentId, amount, reason } = stripeRefundSchema.parse(req.body);

      const refund = await stripeService.createRefund(paymentIntentId, amount, reason);

      sendSuccess(res, {
        refundId: refund.id,
        amount: (refund.amount || 0) / 100,
        currency: refund.currency,
        status: refund.status,
        paymentIntentId: refund.payment_intent,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async getBookingPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.bookingId as string;
      const status = await stripeService.getBookingPaymentStatus(bookingId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
