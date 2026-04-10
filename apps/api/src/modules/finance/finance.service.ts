import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ─── Income Filters ──────────────────────────────────────────
interface IncomeFilters {
  propertyId?: string;
  ownerId?: string;
  bookingId?: string;
  category?: string;
  periodMonth?: number;
  periodYear?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Expense Filters ─────────────────────────────────────────
interface ExpenseFilters {
  propertyId?: string;
  ownerId?: string;
  category?: string;
  approvalStatus?: string;
  periodMonth?: number;
  periodYear?: number;
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  isRecurring?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Summary Filters ─────────────────────────────────────────
interface SummaryFilters {
  propertyId?: string;
  ownerId?: string;
  periodMonth?: number;
  periodYear?: number;
}

// ─── Trend Filters ───────────────────────────────────────────
interface TrendFilters {
  propertyId?: string;
  ownerId?: string;
  months?: number;
}

export class FinanceService {
  // ═══════════════════════════════════════════════════════════
  // INCOME
  // ═══════════════════════════════════════════════════════════

  async getIncomeRecords(filters: IncomeFilters, userOwnerId?: string) {
    const {
      propertyId,
      ownerId,
      bookingId,
      category,
      periodMonth,
      periodYear,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.IncomeRecordWhereInput = {};

    // RLS: if user is OWNER, restrict to their income
    if (userOwnerId) {
      where.ownerId = userOwnerId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (propertyId) where.propertyId = propertyId;
    if (bookingId) where.bookingId = bookingId;
    if (category) where.category = category as any;
    if (periodMonth) where.periodMonth = periodMonth;
    if (periodYear) where.periodYear = periodYear;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const allowedSortFields: Record<string, string> = {
      date: 'date',
      amount: 'amount',
      createdAt: 'createdAt',
      category: 'category',
    };
    const orderByField = allowedSortFields[sortBy] || 'date';

    const [records, total] = await Promise.all([
      prisma.incomeRecord.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, internalCode: true },
          },
          booking: {
            select: { id: true, guestName: true, checkIn: true, checkOut: true },
          },
          owner: {
            select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incomeRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  async createIncomeRecord(data: {
    propertyId: string;
    bookingId?: string;
    ownerId: string;
    category: string;
    amount: number;
    currency?: string;
    description?: string;
    date: string;
    metadata?: any;
  }) {
    // Validate property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.notFound('Property');
    }

    // Validate owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: data.ownerId },
    });
    if (!owner) {
      throw ApiError.notFound('Owner');
    }

    // Validate booking if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
      });
      if (!booking) {
        throw ApiError.notFound('Booking');
      }
    }

    // Auto-set periodMonth/periodYear from date
    const dateObj = new Date(data.date);
    const periodMonth = dateObj.getUTCMonth() + 1; // 1-12
    const periodYear = dateObj.getUTCFullYear();

    const record = await prisma.incomeRecord.create({
      data: {
        propertyId: data.propertyId,
        bookingId: data.bookingId,
        ownerId: data.ownerId,
        category: data.category as any,
        amount: data.amount,
        currency: data.currency || 'EUR',
        description: data.description,
        date: dateObj,
        periodMonth,
        periodYear,
        metadata: data.metadata,
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    return record;
  }

  async updateIncomeRecord(
    id: string,
    data: Partial<{
      propertyId: string;
      bookingId: string | null;
      ownerId: string;
      category: string;
      amount: number;
      currency: string;
      description: string | null;
      date: string;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.incomeRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Income record');
    }

    const updateData: any = { ...data };

    // Recalc period if date changes
    if (data.date) {
      const dateObj = new Date(data.date);
      updateData.date = dateObj;
      updateData.periodMonth = dateObj.getUTCMonth() + 1;
      updateData.periodYear = dateObj.getUTCFullYear();
    }

    // Cast category
    if (data.category) {
      updateData.category = data.category as any;
    }

    const record = await prisma.incomeRecord.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    return record;
  }

  async deleteIncomeRecord(id: string) {
    const existing = await prisma.incomeRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Income record');
    }

    await prisma.incomeRecord.delete({ where: { id } });

    return { message: 'Income record deleted successfully' };
  }

  // ═══════════════════════════════════════════════════════════
  // EXPENSES
  // ═══════════════════════════════════════════════════════════

  async getExpenseRecords(filters: ExpenseFilters, userOwnerId?: string) {
    const {
      propertyId,
      ownerId,
      category,
      approvalStatus,
      periodMonth,
      periodYear,
      dateFrom,
      dateTo,
      vendor,
      isRecurring,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ExpenseRecordWhereInput = {};

    // RLS: if user is OWNER, restrict to their expenses
    if (userOwnerId) {
      where.ownerId = userOwnerId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (propertyId) where.propertyId = propertyId;
    if (category) where.category = category as any;
    if (approvalStatus) where.approvalStatus = approvalStatus as any;
    if (periodMonth) where.periodMonth = periodMonth;
    if (periodYear) where.periodYear = periodYear;
    if (vendor) where.vendor = { contains: vendor, mode: 'insensitive' };
    if (isRecurring !== undefined) where.isRecurring = isRecurring;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const allowedSortFields: Record<string, string> = {
      date: 'date',
      amount: 'amount',
      createdAt: 'createdAt',
      category: 'category',
      approvalStatus: 'approvalStatus',
    };
    const orderByField = allowedSortFields[sortBy] || 'date';

    const [records, total] = await Promise.all([
      prisma.expenseRecord.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, internalCode: true },
          },
          owner: {
            select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expenseRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  async createExpenseRecord(
    data: {
      propertyId?: string;
      ownerId?: string;
      category: string;
      amount: number;
      currency?: string;
      description: string;
      date: string;
      vendor?: string;
      receiptUrl?: string;
      notes?: string;
      isRecurring?: boolean;
      recurrencePattern?: string;
      metadata?: any;
    },
    userId: string,
  ) {
    // Validate property if provided
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (!property || property.deletedAt) {
        throw ApiError.notFound('Property');
      }
    }

    // Determine approval status based on owner's threshold
    let approvalStatus: 'AUTO_APPROVED' | 'PENDING' = 'AUTO_APPROVED';
    let approvalThresholdAtTime: number | undefined;

    if (data.ownerId) {
      const owner = await prisma.owner.findUnique({
        where: { id: data.ownerId },
      });
      if (!owner) {
        throw ApiError.notFound('Owner');
      }

      const threshold = owner.expenseApprovalThreshold.toNumber();
      if (data.amount > threshold) {
        approvalStatus = 'PENDING';
        approvalThresholdAtTime = threshold;
      }
    }

    // Auto-set periodMonth/periodYear from date
    const dateObj = new Date(data.date);
    const periodMonth = dateObj.getUTCMonth() + 1;
    const periodYear = dateObj.getUTCFullYear();

    const record = await prisma.expenseRecord.create({
      data: {
        propertyId: data.propertyId,
        ownerId: data.ownerId,
        category: data.category as any,
        amount: data.amount,
        currency: data.currency || 'EUR',
        description: data.description,
        date: dateObj,
        periodMonth,
        periodYear,
        vendor: data.vendor,
        receiptUrl: data.receiptUrl,
        approvalStatus,
        approvalThresholdAtTime,
        notes: data.notes,
        isRecurring: data.isRecurring || false,
        recurrencePattern: data.recurrencePattern,
        metadata: data.metadata,
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
        owner: {
          select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return record;
  }

  async updateExpenseRecord(
    id: string,
    data: Partial<{
      propertyId: string | null;
      ownerId: string | null;
      category: string;
      amount: number;
      currency: string;
      description: string;
      date: string;
      vendor: string | null;
      receiptUrl: string | null;
      notes: string | null;
      isRecurring: boolean;
      recurrencePattern: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Expense record');
    }

    const updateData: any = { ...data };

    // Recalc period if date changes
    if (data.date) {
      const dateObj = new Date(data.date);
      updateData.date = dateObj;
      updateData.periodMonth = dateObj.getUTCMonth() + 1;
      updateData.periodYear = dateObj.getUTCFullYear();
    }

    if (data.category) {
      updateData.category = data.category as any;
    }

    const record = await prisma.expenseRecord.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
        owner: {
          select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return record;
  }

  async deleteExpenseRecord(id: string) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Expense record');
    }

    await prisma.expenseRecord.delete({ where: { id } });

    return { message: 'Expense record deleted successfully' };
  }

  async approveExpense(id: string, userId: string) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Expense record');
    }

    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest(
        `Cannot approve expense with status ${existing.approvalStatus}`,
        'INVALID_STATUS',
      );
    }

    const record = await prisma.expenseRecord.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
        owner: {
          select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return record;
  }

  async rejectExpense(id: string, userId: string) {
    const existing = await prisma.expenseRecord.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Expense record');
    }

    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest(
        `Cannot reject expense with status ${existing.approvalStatus}`,
        'INVALID_STATUS',
      );
    }

    const record = await prisma.expenseRecord.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
        owner: {
          select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return record;
  }

  // ═══════════════════════════════════════════════════════════
  // FINANCIAL SUMMARY
  // ═══════════════════════════════════════════════════════════

  async getFinancialSummary(
    filters: SummaryFilters,
    userOwnerId?: string,
  ) {
    const { propertyId, ownerId, periodMonth, periodYear } = filters;

    // Build income where clause
    const incomeWhere: Prisma.IncomeRecordWhereInput = {};
    const expenseWhere: Prisma.ExpenseRecordWhereInput = {};

    // RLS
    if (userOwnerId) {
      incomeWhere.ownerId = userOwnerId;
      expenseWhere.ownerId = userOwnerId;
    } else if (ownerId) {
      incomeWhere.ownerId = ownerId;
      expenseWhere.ownerId = ownerId;
    }

    if (propertyId) {
      incomeWhere.propertyId = propertyId;
      expenseWhere.propertyId = propertyId;
    }

    if (periodMonth) {
      incomeWhere.periodMonth = periodMonth;
      expenseWhere.periodMonth = periodMonth;
    }

    if (periodYear) {
      incomeWhere.periodYear = periodYear;
      expenseWhere.periodYear = periodYear;
    }

    // Aggregate income
    const [incomeAgg, expenseAgg, incomeByCategory, expensesByCategory] = await Promise.all([
      prisma.incomeRecord.aggregate({
        where: incomeWhere,
        _sum: { amount: true },
      }),
      prisma.expenseRecord.aggregate({
        where: {
          ...expenseWhere,
          approvalStatus: { in: ['AUTO_APPROVED', 'APPROVED'] },
        },
        _sum: { amount: true },
      }),
      prisma.incomeRecord.groupBy({
        by: ['category'],
        where: incomeWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expenseRecord.groupBy({
        by: ['category'],
        where: {
          ...expenseWhere,
          approvalStatus: { in: ['AUTO_APPROVED', 'APPROVED'] },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount?.toNumber() || 0;
    const totalExpenses = expenseAgg._sum.amount?.toNumber() || 0;
    const netIncome = totalIncome - totalExpenses;

    const result: any = {
      totalIncome,
      totalExpenses,
      netIncome,
      incomeByCategory: incomeByCategory.map((g) => ({
        category: g.category,
        total: g._sum.amount?.toNumber() || 0,
        count: g._count.id,
      })),
      expensesByCategory: expensesByCategory.map((g) => ({
        category: g.category,
        total: g._sum.amount?.toNumber() || 0,
        count: g._count.id,
      })),
    };

    // Occupancy rate if propertyId and period are specified
    if (propertyId && periodMonth && periodYear) {
      const daysInMonth = new Date(periodYear, periodMonth, 0).getDate();
      const monthStart = new Date(periodYear, periodMonth - 1, 1);
      const monthEnd = new Date(periodYear, periodMonth, 0);

      const bookings = await prisma.booking.findMany({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { lte: monthEnd },
          checkOut: { gte: monthStart },
        },
        select: { checkIn: true, checkOut: true },
      });

      let occupiedDays = 0;
      for (const b of bookings) {
        const start = b.checkIn > monthStart ? b.checkIn : monthStart;
        const end = b.checkOut < monthEnd ? b.checkOut : monthEnd;
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        occupiedDays += Math.max(0, days);
      }

      result.occupancyRate = Math.min(100, Math.round((occupiedDays / daysInMonth) * 100 * 100) / 100);
      result.occupiedDays = Math.min(occupiedDays, daysInMonth);
      result.daysInMonth = daysInMonth;
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // MONTHLY TREND
  // ═══════════════════════════════════════════════════════════

  async getMonthlyTrend(
    filters: TrendFilters,
    userOwnerId?: string,
  ) {
    const { propertyId, ownerId, months = 12 } = filters;

    // Calculate start period
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();

    // Build common where clauses
    const baseIncomeWhere: Prisma.IncomeRecordWhereInput = {};
    const baseExpenseWhere: Prisma.ExpenseRecordWhereInput = {
      approvalStatus: { in: ['AUTO_APPROVED', 'APPROVED'] },
    };

    if (userOwnerId) {
      baseIncomeWhere.ownerId = userOwnerId;
      baseExpenseWhere.ownerId = userOwnerId;
    } else if (ownerId) {
      baseIncomeWhere.ownerId = ownerId;
      baseExpenseWhere.ownerId = ownerId;
    }

    if (propertyId) {
      baseIncomeWhere.propertyId = propertyId;
      baseExpenseWhere.propertyId = propertyId;
    }

    // Build period filter using OR conditions for each month
    const periods: { periodMonth: number; periodYear: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(startYear, startMonth - 1 + i, 1);
      periods.push({
        periodMonth: d.getMonth() + 1,
        periodYear: d.getFullYear(),
      });
    }

    baseIncomeWhere.OR = periods.map((p) => ({
      periodMonth: p.periodMonth,
      periodYear: p.periodYear,
    }));

    baseExpenseWhere.OR = periods.map((p) => ({
      periodMonth: p.periodMonth,
      periodYear: p.periodYear,
    }));

    const [incomeByMonth, expensesByMonth] = await Promise.all([
      prisma.incomeRecord.groupBy({
        by: ['periodMonth', 'periodYear'],
        where: baseIncomeWhere,
        _sum: { amount: true },
      }),
      prisma.expenseRecord.groupBy({
        by: ['periodMonth', 'periodYear'],
        where: baseExpenseWhere,
        _sum: { amount: true },
      }),
    ]);

    // Build lookup maps
    const incomeMap = new Map<string, number>();
    for (const row of incomeByMonth) {
      incomeMap.set(`${row.periodYear}-${row.periodMonth}`, row._sum.amount?.toNumber() || 0);
    }

    const expenseMap = new Map<string, number>();
    for (const row of expensesByMonth) {
      expenseMap.set(`${row.periodYear}-${row.periodMonth}`, row._sum.amount?.toNumber() || 0);
    }

    // Build result array
    const trend = periods.map((p) => {
      const key = `${p.periodYear}-${p.periodMonth}`;
      const income = incomeMap.get(key) || 0;
      const expenses = expenseMap.get(key) || 0;
      return {
        month: p.periodMonth,
        year: p.periodYear,
        income,
        expenses,
        net: income - expenses,
      };
    });

    return trend;
  }
}

export const financeService = new FinanceService();
