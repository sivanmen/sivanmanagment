import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface TransactionFilters {
  type?: string;
  status?: string;
  bookingId?: string;
  ownerId?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PaymentsService {
  async getAllTransactions(filters: TransactionFilters, userOwnerId?: string) {
    const {
      type,
      status,
      bookingId,
      ownerId,
      provider,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.PaymentTransactionWhereInput = {};

    // RLS: if user is OWNER, restrict to their own transactions
    if (userOwnerId) {
      where.ownerId = userOwnerId;
    }

    if (type) {
      where.type = type as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (ownerId && !userOwnerId) {
      where.ownerId = ownerId;
    }

    if (provider) {
      where.provider = provider as any;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      amount: 'amount',
      status: 'status',
      type: 'type',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
              totalAmount: true,
            },
          },
          owner: {
            select: {
              id: true,
              companyName: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentTransaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async getTransactionById(id: string, userOwnerId?: string) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
            totalAmount: true,
            property: {
              select: {
                id: true,
                name: true,
                internalCode: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw ApiError.notFound('PaymentTransaction');
    }

    // RLS: owner can only view their own transactions
    if (userOwnerId && transaction.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this transaction');
    }

    return transaction;
  }

  async createTransaction(data: {
    bookingId?: string;
    ownerId?: string;
    type: string;
    provider: string;
    providerTransactionId?: string;
    amount: number;
    currency?: string;
    status?: string;
    feeAmount?: number;
    metadata?: any;
  }) {
    // Verify booking exists if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
      });
      if (!booking) {
        throw ApiError.badRequest('Booking not found', 'BOOKING_NOT_FOUND');
      }
    }

    // Verify owner exists if provided
    if (data.ownerId) {
      const owner = await prisma.owner.findUnique({
        where: { id: data.ownerId },
      });
      if (!owner || owner.deletedAt) {
        throw ApiError.badRequest('Owner not found', 'OWNER_NOT_FOUND');
      }
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        bookingId: data.bookingId,
        ownerId: data.ownerId,
        type: data.type as any,
        provider: data.provider as any,
        providerTransactionId: data.providerTransactionId,
        amount: data.amount,
        currency: data.currency || 'EUR',
        status: (data.status as any) || 'PENDING',
        feeAmount: data.feeAmount || 0,
        metadata: data.metadata,
      },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return transaction;
  }

  async updateTransactionStatus(
    id: string,
    status: string,
    metadata?: any,
  ) {
    const existing = await prisma.paymentTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('PaymentTransaction');
    }

    const updateData: any = {
      status: status as any,
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const transaction = await prisma.paymentTransaction.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return transaction;
  }

  async getUserPaymentMethods(userId: string) {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return methods;
  }

  async addPaymentMethod(
    userId: string,
    data: {
      provider: string;
      providerMethodId: string;
      type: string;
      lastFour?: string;
      brand?: string;
      isDefault?: boolean;
      expiresAt?: string;
    },
  ) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        userId,
        provider: data.provider as any,
        providerMethodId: data.providerMethodId,
        type: data.type,
        lastFour: data.lastFour,
        brand: data.brand,
        isDefault: data.isDefault ?? false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    return method;
  }

  async removePaymentMethod(id: string, userId: string) {
    const method = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) {
      throw ApiError.notFound('PaymentMethod');
    }

    if (method.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this payment method');
    }

    await prisma.paymentMethod.delete({ where: { id } });

    return { message: 'Payment method removed successfully' };
  }

  async processRefund(transactionId: string, amount?: number, reason?: string) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw ApiError.notFound('PaymentTransaction');
    }

    if (transaction.status !== 'COMPLETED') {
      throw ApiError.badRequest(
        'Only completed transactions can be refunded',
        'INVALID_REFUND',
      );
    }

    const refundAmount = amount ?? transaction.amount.toNumber();

    if (refundAmount > transaction.amount.toNumber()) {
      throw ApiError.badRequest(
        'Refund amount cannot exceed transaction amount',
        'REFUND_EXCEEDS_AMOUNT',
      );
    }

    // Create a refund transaction
    const refund = await prisma.paymentTransaction.create({
      data: {
        bookingId: transaction.bookingId,
        ownerId: transaction.ownerId,
        type: 'REFUND',
        provider: transaction.provider,
        amount: refundAmount,
        currency: transaction.currency,
        status: 'PENDING',
        metadata: {
          originalTransactionId: transactionId,
          reason,
        },
      },
    });

    // Update original transaction status
    await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { status: 'REFUNDED' },
    });

    return refund;
  }
}

export const paymentsService = new PaymentsService();
