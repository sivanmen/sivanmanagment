import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ─── Filters ─────────────────────────────────────────────────
interface FeeFilters {
  ownerId?: string;
  propertyId?: string;
  periodMonth?: number;
  periodYear?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FeeSummaryFilters {
  ownerId?: string;
  periodMonth?: number;
  periodYear?: number;
}

export class FeesService {
  /**
   * Calculate management fees for ALL active properties in a given period.
   */
  async calculateMonthlyFees(periodMonth: number, periodYear: number) {
    // Get all active properties with their owner info
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        managementFeePercent: true,
        minimumMonthlyFee: true,
      },
    });

    const results: Array<{
      propertyId: string;
      propertyName: string;
      ownerId: string;
      totalIncome: number;
      feePercent: number;
      calculatedFee: number;
      minimumFee: number;
      appliedFee: number;
      feeType: 'PERCENTAGE' | 'MINIMUM';
    }> = [];

    for (const property of properties) {
      const calc = await this.calculatePropertyFee(property.id, periodMonth, periodYear);
      results.push({
        propertyId: property.id,
        propertyName: property.name,
        ownerId: property.ownerId,
        totalIncome: calc.totalIncome,
        feePercent: calc.feePercent,
        calculatedFee: calc.calculatedFee,
        minimumFee: calc.minimumFee,
        appliedFee: calc.appliedFee,
        feeType: calc.feeType,
      });
    }

    return {
      periodMonth,
      periodYear,
      propertiesProcessed: results.length,
      totalFeesCollected: results.reduce((sum, r) => sum + r.appliedFee, 0),
      results,
    };
  }

  /**
   * Calculate fee for a single property and upsert the ManagementFeeCalculation record.
   */
  async calculatePropertyFee(propertyId: string, periodMonth: number, periodYear: number) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        managementFeePercent: true,
        minimumMonthlyFee: true,
      },
    });

    if (!property) {
      throw ApiError.notFound('Property');
    }

    // Sum income for this property in the given period
    const incomeAgg = await prisma.incomeRecord.aggregate({
      where: {
        propertyId,
        periodMonth,
        periodYear,
      },
      _sum: { amount: true },
    });

    const totalIncome = incomeAgg._sum.amount?.toNumber() || 0;
    const feePercent = property.managementFeePercent.toNumber();
    const minimumFee = property.minimumMonthlyFee.toNumber();

    // appliedFee = MAX(feePercent/100 * totalIncome, minimumFee)
    const calculatedFee = (feePercent / 100) * totalIncome;
    const appliedFee = Math.max(calculatedFee, minimumFee);
    const feeType: 'PERCENTAGE' | 'MINIMUM' = calculatedFee >= minimumFee ? 'PERCENTAGE' : 'MINIMUM';

    // Upsert the ManagementFeeCalculation
    const feeCalc = await prisma.managementFeeCalculation.upsert({
      where: {
        ownerId_propertyId_periodMonth_periodYear: {
          ownerId: property.ownerId,
          propertyId,
          periodMonth,
          periodYear,
        },
      },
      create: {
        ownerId: property.ownerId,
        propertyId,
        periodMonth,
        periodYear,
        totalIncome,
        feePercent,
        calculatedFee,
        minimumFee,
        appliedFee,
        feeType,
        status: 'DRAFT',
      },
      update: {
        totalIncome,
        feePercent,
        calculatedFee,
        minimumFee,
        appliedFee,
        feeType,
        // Don't overwrite status if already progressed beyond DRAFT
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

    return {
      ...feeCalc,
      totalIncome,
      feePercent,
      calculatedFee,
      minimumFee,
      appliedFee,
      feeType,
    };
  }

  /**
   * Get paginated list of fee calculations with filters.
   */
  async getFeeCalculations(filters: FeeFilters, userOwnerId?: string) {
    const {
      ownerId,
      propertyId,
      periodMonth,
      periodYear,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ManagementFeeCalculationWhereInput = {};

    // RLS
    if (userOwnerId) {
      where.ownerId = userOwnerId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (propertyId) where.propertyId = propertyId;
    if (periodMonth) where.periodMonth = periodMonth;
    if (periodYear) where.periodYear = periodYear;
    if (status) where.status = status as any;

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      appliedFee: 'appliedFee',
      totalIncome: 'totalIncome',
      periodYear: 'periodYear',
      status: 'status',
    };
    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [records, total] = await Promise.all([
      prisma.managementFeeCalculation.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, internalCode: true },
          },
          owner: {
            select: { id: true, companyName: true, user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.managementFeeCalculation.count({ where }),
    ]);

    return { records, total, page, limit };
  }

  /**
   * Update fee status: DRAFT -> APPROVED -> INVOICED -> PAID
   */
  async updateFeeStatus(id: string, status: string) {
    const existing = await prisma.managementFeeCalculation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('Fee calculation');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['APPROVED'],
      APPROVED: ['INVOICED'],
      INVOICED: ['PAID'],
      PAID: [],
    };

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    const record = await prisma.managementFeeCalculation.update({
      where: { id },
      data: { status: status as any },
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

  /**
   * Get aggregate fee summary by owner or overall.
   */
  async getFeeSummary(filters: FeeSummaryFilters, userOwnerId?: string) {
    const { ownerId, periodMonth, periodYear } = filters;

    const where: Prisma.ManagementFeeCalculationWhereInput = {};

    if (userOwnerId) {
      where.ownerId = userOwnerId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (periodMonth) where.periodMonth = periodMonth;
    if (periodYear) where.periodYear = periodYear;

    const [totals, byStatus, byOwner] = await Promise.all([
      prisma.managementFeeCalculation.aggregate({
        where,
        _sum: {
          appliedFee: true,
          totalIncome: true,
          calculatedFee: true,
        },
        _count: { id: true },
      }),
      prisma.managementFeeCalculation.groupBy({
        by: ['status'],
        where,
        _sum: { appliedFee: true },
        _count: { id: true },
      }),
      prisma.managementFeeCalculation.groupBy({
        by: ['ownerId'],
        where,
        _sum: { appliedFee: true, totalIncome: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalFees: totals._sum.appliedFee?.toNumber() || 0,
      totalIncome: totals._sum.totalIncome?.toNumber() || 0,
      totalCalculations: totals._count.id,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        totalFees: s._sum.appliedFee?.toNumber() || 0,
        count: s._count.id,
      })),
      byOwner: byOwner.map((o) => ({
        ownerId: o.ownerId,
        totalFees: o._sum.appliedFee?.toNumber() || 0,
        totalIncome: o._sum.totalIncome?.toNumber() || 0,
        count: o._count.id,
      })),
    };
  }
}

export const feesService = new FeesService();
