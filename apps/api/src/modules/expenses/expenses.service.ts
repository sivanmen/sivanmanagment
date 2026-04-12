import { Prisma, ExpenseCategory, ApprovalStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const propertySelect = {
  id: true,
  name: true,
  internalCode: true,
} as const;

const defaultInclude = {
  property: { select: propertySelect },
  owner: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

/**
 * Map legacy category names (from the frontend / controller zod schema)
 * to the Prisma ExpenseCategory enum values.
 */
const CATEGORY_MAP: Record<string, ExpenseCategory> = {
  MAINTENANCE: 'MAINTENANCE',
  UTILITIES: 'UTILITIES',
  SUPPLIES: 'SUPPLIES',
  CLEANING: 'CLEANING',
  INSURANCE: 'INSURANCE',
  TAX: 'TAXES',
  TAXES: 'TAXES',
  MARKETING: 'MARKETING',
  MANAGEMENT: 'MANAGEMENT_FEE',
  MANAGEMENT_FEE: 'MANAGEMENT_FEE',
  MISC: 'OTHER',
  OTHER: 'OTHER',
  EQUIPMENT: 'EQUIPMENT',
};

function mapCategory(raw?: string): ExpenseCategory | undefined {
  if (!raw) return undefined;
  const mapped = CATEGORY_MAP[raw.toUpperCase()];
  if (!mapped) return undefined;
  return mapped;
}

/**
 * Map legacy approval status strings (including 'PAID') to the actual enum.
 * 'PAID' is not in the enum; we treat those as APPROVED with a paidAt in metadata.
 */
const STATUS_MAP: Record<string, ApprovalStatus> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  AUTO_APPROVED: 'AUTO_APPROVED',
  REJECTED: 'REJECTED',
};

function mapApprovalStatus(raw?: string): ApprovalStatus | undefined {
  if (!raw) return undefined;
  return STATUS_MAP[raw.toUpperCase()];
}

/**
 * Build the Prisma `orderBy` from a legacy sortBy / sortOrder pair.
 */
function buildOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): Prisma.ExpenseRecordOrderByWithRelationInput {
  switch (sortBy) {
    case 'date':
      return { date: sortOrder };
    case 'amount':
      return { amount: sortOrder };
    case 'category':
      return { category: sortOrder };
    case 'approvalStatus':
      return { approvalStatus: sortOrder };
    case 'propertyName':
      return { property: { name: sortOrder } };
    default:
      return { date: sortOrder };
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ExpensesService {
  // ── List ────────────────────────────────────────────────────────────────

  async getAllExpenses(filters: {
    propertyId?: string;
    category?: string;
    approvalStatus?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    vendor?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      propertyId,
      category,
      approvalStatus,
      isRecurring,
      startDate,
      endDate,
      vendor,
      search,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.ExpenseRecordWhereInput = {};

    if (propertyId) where.propertyId = propertyId;

    const mappedCategory = mapCategory(category);
    if (mappedCategory) where.category = mappedCategory;

    // Handle the legacy 'PAID' status: filter by APPROVED + metadata.paidAt exists
    if (approvalStatus?.toUpperCase() === 'PAID') {
      where.approvalStatus = 'APPROVED';
      where.metadata = { path: ['paidAt'], not: Prisma.DbNull };
    } else {
      const mappedStatus = mapApprovalStatus(approvalStatus);
      if (mappedStatus) where.approvalStatus = mappedStatus;
    }

    if (isRecurring !== undefined) where.isRecurring = isRecurring;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (vendor) {
      where.vendor = { contains: vendor, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { property: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expenseRecord.findMany({
        where,
        include: defaultInclude,
        orderBy: buildOrderBy(sortBy, sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expenseRecord.count({ where }),
    ]);

    return { expenses, total, page, limit };
  }

  // ── Get by ID ───────────────────────────────────────────────────────────

  async getExpenseById(id: string) {
    const expense = await prisma.expenseRecord.findUnique({
      where: { id },
      include: defaultInclude,
    });

    if (!expense) throw ApiError.notFound('Expense');
    return expense;
  }

  // ── Create ──────────────────────────────────────────────────────────────

  async createExpense(
    data: {
      propertyId: string;
      category: string;
      description: string;
      amount: number;
      currency?: string;
      date: string;
      vendor?: string;
      receiptUrl?: string;
      isRecurring?: boolean;
      recurringSchedule?: {
        frequency: string;
        nextDate: string;
        endDate?: string;
      };
      notes?: string;
      tags?: string[];
      invoiceNumber?: string;
      propertyName?: string; // accepted but not stored as separate field
    },
    createdBy: string,
  ) {
    const expenseDate = new Date(data.date);
    const periodMonth = expenseDate.getMonth() + 1;
    const periodYear = expenseDate.getFullYear();
    const category = mapCategory(data.category);
    if (!category) {
      throw ApiError.badRequest(`Invalid expense category: ${data.category}`);
    }

    // Look up the property to find the owner
    let ownerId: string | undefined;
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { ownerId: true },
      });
      if (property) ownerId = property.ownerId;
    }

    // Build metadata for extra fields that don't have dedicated columns
    const metadata: Record<string, Prisma.InputJsonValue> = {};
    if (data.tags?.length) metadata.tags = data.tags as string[];
    if (data.invoiceNumber) metadata.invoiceNumber = data.invoiceNumber;
    if (data.recurringSchedule) metadata.recurringSchedule = data.recurringSchedule as unknown as Prisma.InputJsonValue;

    const expense = await prisma.expenseRecord.create({
      data: {
        propertyId: data.propertyId,
        ownerId: ownerId ?? undefined,
        category,
        description: data.description,
        amount: data.amount,
        currency: data.currency ?? 'EUR',
        date: expenseDate,
        periodMonth,
        periodYear,
        vendor: data.vendor,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring ?? false,
        recurrencePattern: data.recurringSchedule?.frequency ?? null,
        approvalStatus: 'PENDING',
        notes: data.notes,
        metadata: Object.keys(metadata).length > 0 ? (metadata as Prisma.InputJsonValue) : undefined,
      },
      include: defaultInclude,
    });

    return expense;
  }

  // ── Update ──────────────────────────────────────────────────────────────

  async updateExpense(id: string, data: Record<string, unknown>) {
    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
      select: { approvalStatus: true, metadata: true },
    });
    if (!existing) throw ApiError.notFound('Expense');

    // Cannot edit an expense that has been paid (paidAt in metadata)
    const meta = (existing.metadata ?? {}) as Record<string, unknown>;
    if (meta.paidAt) {
      throw ApiError.badRequest('Cannot edit a paid expense');
    }

    // Build the update payload from the allowed fields
    const updateData: Prisma.ExpenseRecordUpdateInput = {};

    if (data.category !== undefined) {
      const mapped = mapCategory(data.category as string);
      if (mapped) updateData.category = mapped;
    }
    if (data.description !== undefined) updateData.description = data.description as string;
    if (data.amount !== undefined) updateData.amount = data.amount as number;
    if (data.date !== undefined) {
      const d = new Date(data.date as string);
      updateData.date = d;
      updateData.periodMonth = d.getMonth() + 1;
      updateData.periodYear = d.getFullYear();
    }
    if (data.vendor !== undefined) updateData.vendor = data.vendor as string;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl as string;
    if (data.notes !== undefined) updateData.notes = data.notes as string;

    // Merge tags / invoiceNumber into metadata
    if (data.tags !== undefined || data.invoiceNumber !== undefined) {
      const existingMeta = (existing.metadata ?? {}) as Record<string, Prisma.InputJsonValue>;
      if (data.tags !== undefined) existingMeta.tags = data.tags as Prisma.InputJsonValue;
      if (data.invoiceNumber !== undefined) existingMeta.invoiceNumber = data.invoiceNumber as Prisma.InputJsonValue;
      updateData.metadata = existingMeta as Prisma.InputJsonValue;
    }

    const expense = await prisma.expenseRecord.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    });

    return expense;
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async deleteExpense(id: string) {
    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
      select: { id: true, approvalStatus: true, metadata: true },
    });
    if (!existing) throw ApiError.notFound('Expense');

    const meta = (existing.metadata ?? {}) as Record<string, unknown>;
    if (meta.paidAt) {
      throw ApiError.badRequest('Cannot delete a paid expense');
    }

    const expense = await prisma.expenseRecord.delete({
      where: { id },
      include: defaultInclude,
    });

    return expense;
  }

  // ── Approve ─────────────────────────────────────────────────────────────

  async approveExpense(id: string, approvedBy: string) {
    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
      select: { approvalStatus: true },
    });
    if (!existing) throw ApiError.notFound('Expense');
    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest('Only pending expenses can be approved');
    }

    const expense = await prisma.expenseRecord.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: approvedBy,
        approvedAt: new Date(),
      },
      include: defaultInclude,
    });

    return expense;
  }

  // ── Reject ──────────────────────────────────────────────────────────────

  async rejectExpense(id: string, reason?: string) {
    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
      select: { approvalStatus: true },
    });
    if (!existing) throw ApiError.notFound('Expense');
    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest('Only pending expenses can be rejected');
    }

    const updateData: Prisma.ExpenseRecordUpdateInput = {
      approvalStatus: 'REJECTED',
    };
    if (reason) updateData.notes = reason;

    const expense = await prisma.expenseRecord.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    });

    return expense;
  }

  // ── Mark as Paid ────────────────────────────────────────────────────────

  async markAsPaid(id: string) {
    const existing = await prisma.expenseRecord.findUnique({
      where: { id },
      select: { approvalStatus: true, metadata: true },
    });
    if (!existing) throw ApiError.notFound('Expense');
    if (existing.approvalStatus !== 'APPROVED') {
      throw ApiError.badRequest('Only approved expenses can be marked as paid');
    }

    // Store paidAt in metadata since there's no dedicated column
    const meta = (existing.metadata ?? {}) as Record<string, Prisma.InputJsonValue>;
    meta.paidAt = new Date().toISOString();

    const expense = await prisma.expenseRecord.update({
      where: { id },
      data: {
        metadata: meta as Prisma.InputJsonValue,
      },
      include: defaultInclude,
    });

    return expense;
  }

  // ── Recurring Expenses ──────────────────────────────────────────────────

  async getRecurringExpenses(filters: { propertyId?: string }) {
    const where: Prisma.ExpenseRecordWhereInput = {
      isRecurring: true,
    };
    if (filters.propertyId) where.propertyId = filters.propertyId;

    const expenses = await prisma.expenseRecord.findMany({
      where,
      include: {
        property: { select: propertySelect },
      },
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => ({
      id: e.id,
      propertyId: e.propertyId,
      propertyName: e.property?.name ?? null,
      category: e.category,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      vendor: e.vendor,
      schedule: e.recurrencePattern
        ? (e.metadata as Record<string, unknown>)?.recurringSchedule ?? {
            frequency: e.recurrencePattern,
          }
        : null,
    }));
  }

  // ── Budget vs Actual ────────────────────────────────────────────────────

  async getBudgetVsActual(filters: {
    propertyId?: string;
    year?: number;
    month?: number;
  }) {
    const { propertyId, year, month } = filters;

    const where: Prisma.ExpenseRecordWhereInput = {};
    if (propertyId) where.propertyId = propertyId;
    if (year) where.periodYear = year;
    if (month) where.periodMonth = month;

    // Aggregate actual spending grouped by property + category + period
    const aggregations = await prisma.expenseRecord.groupBy({
      by: ['propertyId', 'category', 'periodYear', 'periodMonth', 'currency'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    // Fetch property names for the grouped results
    const propertyIds = Array.from(
      new Set(aggregations.map((a) => a.propertyId).filter(Boolean)),
    ) as string[];

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: propertySelect,
    });
    const propertyMap = new Map(properties.map((p) => [p.id, p]));

    const items = aggregations.map((agg) => ({
      propertyId: agg.propertyId,
      propertyName: agg.propertyId ? propertyMap.get(agg.propertyId)?.name ?? null : null,
      category: agg.category,
      year: agg.periodYear,
      month: agg.periodMonth,
      actualAmount: Number(agg._sum.amount ?? 0),
      expenseCount: agg._count.id,
      currency: agg.currency,
    }));

    const totalActual = items.reduce((s, i) => s + i.actualAmount, 0);

    return {
      items,
      summary: {
        totalActual,
        count: items.length,
      },
    };
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  async getStats(filters: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.ExpenseRecordWhereInput = {};
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    // Total + count + average
    const aggregate = await prisma.expenseRecord.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    });

    // By category
    const byCategory = await prisma.expenseRecord.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });

    const byCategoryMap: Record<string, number> = {};
    for (const row of byCategory) {
      byCategoryMap[row.category] = Number(row._sum.amount ?? 0);
    }

    // By property
    const byPropertyRaw = await prisma.expenseRecord.groupBy({
      by: ['propertyId'],
      where,
      _sum: { amount: true },
    });

    const propIds = byPropertyRaw
      .map((r) => r.propertyId)
      .filter(Boolean) as string[];
    const props = await prisma.property.findMany({
      where: { id: { in: propIds } },
      select: { id: true, name: true },
    });
    const propNameMap = new Map(props.map((p) => [p.id, p.name]));

    const byProperty: Record<string, number> = {};
    for (const row of byPropertyRaw) {
      const name = row.propertyId
        ? propNameMap.get(row.propertyId) ?? row.propertyId
        : 'Unassigned';
      byProperty[name] = Number(row._sum.amount ?? 0);
    }

    // By status
    const byStatusRaw = await prisma.expenseRecord.groupBy({
      by: ['approvalStatus'],
      where,
      _count: { id: true },
    });

    const byStatus = {
      pending: 0,
      approved: 0,
      auto_approved: 0,
      rejected: 0,
    };
    for (const row of byStatusRaw) {
      const key = row.approvalStatus.toLowerCase() as keyof typeof byStatus;
      if (key in byStatus) byStatus[key] = row._count.id;
    }

    return {
      totalExpenses: Number(aggregate._sum.amount ?? 0),
      count: aggregate._count.id,
      averageExpense: Math.round(Number(aggregate._avg.amount ?? 0)),
      byCategory: byCategoryMap,
      byProperty,
      byStatus,
    };
  }
}

export const expensesService = new ExpensesService();
