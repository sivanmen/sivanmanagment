import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class ReportsService {
  async getOccupancyReport(params: {
    propertyId?: string;
    startDate: string;
    endDate: string;
    userOwnerId?: string;
  }) {
    const { propertyId, startDate, endDate, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      throw ApiError.badRequest('End date must be after start date', 'INVALID_DATES');
    }

    const propertyWhere: Prisma.PropertyWhereInput = { deletedAt: null };
    if (propertyId) propertyWhere.id = propertyId;
    if (userOwnerId) propertyWhere.ownerId = userOwnerId;

    const properties = await prisma.property.findMany({
      where: propertyWhere,
      select: { id: true, name: true, internalCode: true, city: true },
    });

    const occupancyData = await Promise.all(
      properties.map(async (property) => {
        const bookings = await prisma.booking.findMany({
          where: {
            propertyId: property.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
            checkIn: { lt: end },
            checkOut: { gt: start },
          },
          select: { checkIn: true, checkOut: true, nights: true },
        });

        let bookedNights = 0;
        for (const booking of bookings) {
          const bookingStart = booking.checkIn > start ? booking.checkIn : start;
          const bookingEnd = booking.checkOut < end ? booking.checkOut : end;
          const nights = Math.ceil(
            (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24),
          );
          bookedNights += Math.max(0, nights);
        }

        const occupancyRate = totalDays > 0 ? Math.round((bookedNights / totalDays) * 10000) / 100 : 0;

        return {
          property,
          totalDays,
          bookedNights,
          availableNights: totalDays - bookedNights,
          occupancyRate,
          totalBookings: bookings.length,
        };
      }),
    );

    const avgOccupancy =
      occupancyData.length > 0
        ? Math.round(
            (occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length) * 100,
          ) / 100
        : 0;

    return {
      period: { startDate, endDate, totalDays },
      averageOccupancy: avgOccupancy,
      properties: occupancyData,
    };
  }

  async getRevenueReport(params: {
    ownerId?: string;
    propertyId?: string;
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
    userOwnerId?: string;
  }) {
    const { ownerId, propertyId, startDate, endDate, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingWhere: Prisma.BookingWhereInput = {
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { gte: start, lte: end },
    };

    if (propertyId) {
      bookingWhere.propertyId = propertyId;
    }

    const effectiveOwnerId = userOwnerId || ownerId;
    if (effectiveOwnerId) {
      bookingWhere.property = { ownerId: effectiveOwnerId };
    }

    const [bookings, revenueAgg] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          property: {
            select: { id: true, name: true, internalCode: true, ownerId: true },
          },
        },
        orderBy: { checkIn: 'asc' },
      }),
      prisma.booking.aggregate({
        where: bookingWhere,
        _sum: {
          totalAmount: true,
          subtotal: true,
          cleaningFee: true,
          serviceFee: true,
          taxes: true,
        },
        _count: { id: true },
        _avg: { nightlyRate: true, totalAmount: true },
      }),
    ]);

    // Group by property
    const byProperty: Record<string, { property: any; revenue: number; bookings: number }> = {};
    for (const booking of bookings) {
      const pId = booking.propertyId;
      if (!byProperty[pId]) {
        byProperty[pId] = { property: booking.property, revenue: 0, bookings: 0 };
      }
      byProperty[pId].revenue += Number(booking.totalAmount);
      byProperty[pId].bookings += 1;
    }

    // Group by source
    const bySource: Record<string, { revenue: number; bookings: number }> = {};
    for (const booking of bookings) {
      const src = booking.source;
      if (!bySource[src]) {
        bySource[src] = { revenue: 0, bookings: 0 };
      }
      bySource[src].revenue += Number(booking.totalAmount);
      bySource[src].bookings += 1;
    }

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
        totalSubtotal: Number(revenueAgg._sum.subtotal ?? 0),
        totalCleaningFees: Number(revenueAgg._sum.cleaningFee ?? 0),
        totalServiceFees: Number(revenueAgg._sum.serviceFee ?? 0),
        totalTaxes: Number(revenueAgg._sum.taxes ?? 0),
        totalBookings: revenueAgg._count.id,
        avgNightlyRate: Number(revenueAgg._avg.nightlyRate ?? 0),
        avgBookingValue: Number(revenueAgg._avg.totalAmount ?? 0),
      },
      byProperty: Object.values(byProperty),
      bySource: Object.entries(bySource).map(([source, data]) => ({
        source,
        ...data,
      })),
    };
  }

  async getBookingsReport(params: {
    startDate: string;
    endDate: string;
    userOwnerId?: string;
  }) {
    const { startDate, endDate, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const baseWhere: Prisma.BookingWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    if (userOwnerId) {
      baseWhere.property = { ownerId: userOwnerId };
    }

    const [
      total,
      byStatus,
      bySource,
      byPaymentStatus,
      cancelled,
    ] = await Promise.all([
      prisma.booking.count({ where: baseWhere }),
      prisma.booking.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.booking.groupBy({
        by: ['source'],
        where: baseWhere,
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.booking.groupBy({
        by: ['paymentStatus'],
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.booking.count({
        where: { ...baseWhere, status: 'CANCELLED' },
      }),
    ]);

    const confirmed = byStatus.find((s) => s.status === 'CONFIRMED')?._count.id ?? 0;
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0;

    return {
      period: { startDate, endDate },
      totalBookings: total,
      conversionRate,
      cancellationRate,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      bySource: bySource.map((s) => ({
        source: s.source,
        count: s._count.id,
        revenue: Number(s._sum.totalAmount ?? 0),
      })),
      byPaymentStatus: byPaymentStatus.map((s) => ({
        paymentStatus: s.paymentStatus,
        count: s._count.id,
      })),
    };
  }

  async getMaintenanceReport(params: {
    propertyId?: string;
    startDate: string;
    endDate: string;
    userOwnerId?: string;
  }) {
    const { propertyId, startDate, endDate, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const where: Prisma.MaintenanceRequestWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    if (propertyId) where.propertyId = propertyId;
    if (userOwnerId) {
      where.property = { ownerId: userOwnerId };
    }

    const [
      total,
      byStatus,
      byPriority,
      byCategory,
      costAgg,
    ] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      }),
      prisma.maintenanceRequest.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      }),
      prisma.maintenanceRequest.aggregate({
        where,
        _sum: { estimatedCost: true, actualCost: true },
      }),
    ]);

    const completed = byStatus.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    return {
      period: { startDate, endDate },
      totalRequests: total,
      resolutionRate,
      totalEstimatedCost: Number(costAgg._sum.estimatedCost ?? 0),
      totalActualCost: Number(costAgg._sum.actualCost ?? 0),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
    };
  }

  async getOwnerStatement(params: {
    ownerId: string;
    periodMonth: number;
    periodYear: number;
    userOwnerId?: string;
  }) {
    const { ownerId, periodMonth, periodYear, userOwnerId } = params;

    // RLS: owner can only view their own statement
    if (userOwnerId && userOwnerId !== ownerId) {
      throw ApiError.forbidden('You do not have access to this owner statement');
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        properties: {
          where: { deletedAt: null },
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const startDate = new Date(periodYear, periodMonth - 1, 1);
    const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

    const propertyIds = owner.properties.map((p) => p.id);

    // Income from bookings
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startDate, lte: endDate },
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    const totalIncome = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // Expenses
    const expenses = await prisma.expenseRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        periodMonth,
        periodYear,
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    const totalExpenses = expenses.reduce((sum: number, e) => sum + Number(e.amount), 0);

    // Management fees
    const feeCalcs = await prisma.managementFeeCalculation.findMany({
      where: {
        ownerId,
        propertyId: { in: propertyIds },
        periodMonth,
        periodYear,
      },
    });

    const totalFees = feeCalcs.reduce((sum: number, f) => sum + Number(f.appliedFee), 0);

    const netAmount = totalIncome - totalExpenses - totalFees;

    return {
      owner: {
        id: owner.id,
        companyName: owner.companyName,
      },
      period: {
        month: periodMonth,
        year: periodYear,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      income: {
        total: totalIncome,
        bookingsCount: bookings.length,
        bookings: bookings.map((b) => ({
          id: b.id,
          guestName: b.guestName,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          nights: b.nights,
          totalAmount: Number(b.totalAmount),
          property: b.property,
        })),
      },
      expenses: {
        total: totalExpenses,
        count: expenses.length,
        items: expenses.map((e) => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
          date: e.date,
          property: e.property,
        })),
      },
      fees: {
        total: totalFees,
        records: feeCalcs.map((f) => ({
          id: f.id,
          appliedFee: Number(f.appliedFee),
          feePercent: Number(f.feePercent),
          feeType: f.feeType,
          propertyId: f.propertyId,
        })),
      },
      netAmount,
    };
  }

  async getPortfolioReport(userOwnerId?: string) {
    const propertyWhere: Prisma.PropertyWhereInput = { deletedAt: null };
    if (userOwnerId) {
      propertyWhere.ownerId = userOwnerId;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalProperties,
      totalBookingsMonth,
      monthlyRevenueAgg,
      yearlyRevenueAgg,
      activeBookings,
      occupancyBookings,
    ] = await Promise.all([
      prisma.property.count({ where: propertyWhere }),
      prisma.booking.count({
        where: {
          property: propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.booking.aggregate({
        where: {
          property: propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
        _avg: { nightlyRate: true },
      }),
      prisma.booking.aggregate({
        where: {
          property: propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: startOfYear },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.booking.count({
        where: {
          property: propertyWhere,
          status: 'CHECKED_IN',
        },
      }),
      // For monthly occupancy calculation
      prisma.booking.findMany({
        where: {
          property: propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { lt: endOfMonth },
          checkOut: { gt: startOfMonth },
        },
        select: { nights: true, checkIn: true, checkOut: true },
      }),
    ]);

    const daysInMonth = endOfMonth.getDate();
    let totalBookedNights = 0;
    for (const booking of occupancyBookings) {
      const bookingStart = booking.checkIn > startOfMonth ? booking.checkIn : startOfMonth;
      const bookingEnd = booking.checkOut < endOfMonth ? booking.checkOut : endOfMonth;
      const nights = Math.ceil(
        (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      totalBookedNights += Math.max(0, nights);
    }

    const monthlyOccupancy =
      totalProperties > 0
        ? Math.round((totalBookedNights / (totalProperties * daysInMonth)) * 10000) / 100
        : 0;

    return {
      totalProperties,
      activeBookings,
      monthlyOccupancy,
      monthly: {
        bookings: totalBookingsMonth,
        revenue: Number(monthlyRevenueAgg._sum.totalAmount ?? 0),
        avgNightlyRate: Number(monthlyRevenueAgg._avg.nightlyRate ?? 0),
      },
      yearly: {
        bookings: yearlyRevenueAgg._count.id,
        revenue: Number(yearlyRevenueAgg._sum.totalAmount ?? 0),
      },
    };
  }
}

export const reportsService = new ReportsService();
