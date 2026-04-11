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
          select: { checkIn: true, checkOut: true, nights: true, totalAmount: true, nightlyRate: true },
        });

        let bookedNights = 0;
        let totalRevenue = 0;
        for (const booking of bookings) {
          const bookingStart = booking.checkIn > start ? booking.checkIn : start;
          const bookingEnd = booking.checkOut < end ? booking.checkOut : end;
          const nights = Math.ceil(
            (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24),
          );
          bookedNights += Math.max(0, nights);
          totalRevenue += Number(booking.totalAmount);
        }

        const occupancyRate = totalDays > 0 ? Math.round((bookedNights / totalDays) * 10000) / 100 : 0;
        const avgNightlyRate = bookedNights > 0 ? Math.round((totalRevenue / bookedNights) * 100) / 100 : 0;

        return {
          propertyId: property.id,
          propertyName: property.name,
          internalCode: property.internalCode,
          city: property.city,
          totalNights: totalDays,
          bookedNights,
          availableNights: totalDays - bookedNights,
          occupancyRate,
          revenue: totalRevenue,
          avgNightlyRate,
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

    const bestProperty = occupancyData.length > 0
      ? occupancyData.reduce((best, d) => d.occupancyRate > best.occupancyRate ? d : best)
      : null;
    const worstProperty = occupancyData.length > 0
      ? occupancyData.reduce((worst, d) => d.occupancyRate < worst.occupancyRate ? d : worst)
      : null;

    return {
      period: { startDate, endDate, totalDays },
      averageOccupancy: avgOccupancy,
      bestProperty: bestProperty ? { name: bestProperty.propertyName, rate: bestProperty.occupancyRate } : null,
      worstProperty: worstProperty ? { name: worstProperty.propertyName, rate: worstProperty.occupancyRate } : null,
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
    const { ownerId, propertyId, startDate, endDate, groupBy = 'month', userOwnerId } = params;

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

    // Build property filter for expenses
    const expensePropertyWhere: Prisma.PropertyWhereInput = { deletedAt: null };
    if (propertyId) expensePropertyWhere.id = propertyId;
    if (effectiveOwnerId) expensePropertyWhere.ownerId = effectiveOwnerId;

    const [bookings, revenueAgg, expenses] = await Promise.all([
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
      prisma.expenseRecord.findMany({
        where: {
          property: expensePropertyWhere,
          date: { gte: start, lte: end },
        },
        select: {
          amount: true,
          date: true,
          category: true,
          propertyId: true,
        },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Build time-series data grouped by period
    const timeSeriesMap: Record<string, { revenue: number; expenses: number; bookings: number }> = {};

    for (const booking of bookings) {
      const periodKey = getGroupKey(booking.checkIn, groupBy);
      if (!timeSeriesMap[periodKey]) {
        timeSeriesMap[periodKey] = { revenue: 0, expenses: 0, bookings: 0 };
      }
      timeSeriesMap[periodKey].revenue += Number(booking.totalAmount);
      timeSeriesMap[periodKey].bookings += 1;
    }

    for (const expense of expenses) {
      const periodKey = getGroupKey(expense.date, groupBy);
      if (!timeSeriesMap[periodKey]) {
        timeSeriesMap[periodKey] = { revenue: 0, expenses: 0, bookings: 0 };
      }
      timeSeriesMap[periodKey].expenses += Number(expense.amount);
    }

    const timeSeries = Object.entries(timeSeriesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, vals]) => ({
        period,
        revenue: Math.round(vals.revenue * 100) / 100,
        expenses: Math.round(vals.expenses * 100) / 100,
        netIncome: Math.round((vals.revenue - vals.expenses) * 100) / 100,
        bookings: vals.bookings,
      }));

    // Group by property
    const byProperty: Record<string, { property: any; revenue: number; expenses: number; bookings: number }> = {};
    for (const booking of bookings) {
      const pId = booking.propertyId;
      if (!byProperty[pId]) {
        byProperty[pId] = { property: booking.property, revenue: 0, expenses: 0, bookings: 0 };
      }
      byProperty[pId].revenue += Number(booking.totalAmount);
      byProperty[pId].bookings += 1;
    }
    for (const expense of expenses) {
      if (expense.propertyId && byProperty[expense.propertyId]) {
        byProperty[expense.propertyId].expenses += Number(expense.amount);
      }
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

    const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);

    return {
      period: { startDate, endDate },
      data: timeSeries,
      summary: {
        totalRevenue,
        totalExpenses,
        totalNet: Math.round((totalRevenue - totalExpenses) * 100) / 100,
        totalBookings: revenueAgg._count.id,
        avgNightlyRate: Math.round(Number(revenueAgg._avg.nightlyRate ?? 0) * 100) / 100,
        avgBookingValue: Math.round(Number(revenueAgg._avg.totalAmount ?? 0) * 100) / 100,
        totalCleaningFees: Number(revenueAgg._sum.cleaningFee ?? 0),
        totalServiceFees: Number(revenueAgg._sum.serviceFee ?? 0),
        totalTaxes: Number(revenueAgg._sum.taxes ?? 0),
      },
      byProperty: Object.values(byProperty).map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        expenses: Math.round(p.expenses * 100) / 100,
        netIncome: Math.round((p.revenue - p.expenses) * 100) / 100,
      })),
      bySource: Object.entries(bySource).map(([source, data]) => ({
        source,
        ...data,
        revenue: Math.round(data.revenue * 100) / 100,
      })),
    };
  }

  async getBookingsReport(params: {
    startDate: string;
    endDate: string;
    propertyId?: string;
    source?: string;
    userOwnerId?: string;
  }) {
    const { startDate, endDate, propertyId, source, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const baseWhere: Prisma.BookingWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    if (propertyId) baseWhere.propertyId = propertyId;
    if (source) baseWhere.source = source as any;
    if (userOwnerId) {
      baseWhere.property = { ownerId: userOwnerId };
    }

    const [
      total,
      byStatus,
      bySource,
      byPaymentStatus,
      cancelled,
      bookings,
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
      prisma.booking.findMany({
        where: baseWhere,
        select: {
          checkIn: true,
          nights: true,
          nightlyRate: true,
          totalAmount: true,
          source: true,
          propertyId: true,
          property: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Build time series grouped by month
    const monthlyMap: Record<string, { bookings: number; revenue: number; totalNights: number }> = {};
    for (const booking of bookings) {
      const key = `${booking.checkIn.getFullYear()}-${String(booking.checkIn.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { bookings: 0, revenue: 0, totalNights: 0 };
      }
      monthlyMap[key].bookings += 1;
      monthlyMap[key].revenue += Number(booking.totalAmount);
      monthlyMap[key].totalNights += booking.nights;
    }

    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month,
        bookings: vals.bookings,
        revenue: Math.round(vals.revenue * 100) / 100,
        avgStay: vals.bookings > 0 ? Math.round((vals.totalNights / vals.bookings) * 10) / 10 : 0,
      }));

    // By property
    const propertyMap: Record<string, { name: string; bookings: number; revenue: number }> = {};
    for (const booking of bookings) {
      const pId = booking.propertyId;
      if (!propertyMap[pId]) {
        propertyMap[pId] = { name: booking.property.name, bookings: 0, revenue: 0 };
      }
      propertyMap[pId].bookings += 1;
      propertyMap[pId].revenue += Number(booking.totalAmount);
    }

    const avgStay = bookings.length > 0
      ? Math.round((bookings.reduce((sum, b) => sum + b.nights, 0) / bookings.length) * 10) / 10
      : 0;
    const avgRate = bookings.length > 0
      ? Math.round((bookings.reduce((sum, b) => sum + Number(b.nightlyRate), 0) / bookings.length) * 100) / 100
      : 0;

    const confirmed = byStatus.find((s) => s.status === 'CONFIRMED')?._count.id ?? 0;
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 10000) / 100 : 0;

    return {
      period: { startDate, endDate },
      totalBookings: total,
      avgStay,
      avgRate,
      conversionRate,
      cancellationRate,
      data: monthlyData,
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
      byProperty: Object.entries(propertyMap).map(([id, data]) => ({
        propertyId: id,
        propertyName: data.name,
        bookings: data.bookings,
        revenue: Math.round(data.revenue * 100) / 100,
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
      requests,
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
        _avg: { estimatedCost: true, actualCost: true },
      }),
      prisma.maintenanceRequest.findMany({
        where,
        select: {
          createdAt: true,
          completedAt: true,
          status: true,
          category: true,
          actualCost: true,
          estimatedCost: true,
        },
      }),
    ]);

    // Calculate avg resolution time for completed requests
    const completedRequests = requests.filter((r) => r.completedAt);
    const avgResolutionHours = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => {
          const hours = (r.completedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedRequests.length
      : 0;
    const avgResolutionDays = Math.round(avgResolutionHours / 24 * 10) / 10;

    const openCount = byStatus
      .filter((s) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(s.status))
      .reduce((sum, s) => sum + s._count.id, 0);

    const completed = byStatus.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;
    const resolutionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    // Category breakdown with costs
    const categoryDetails: Record<string, { count: number; totalCost: number }> = {};
    for (const req of requests) {
      if (!categoryDetails[req.category]) {
        categoryDetails[req.category] = { count: 0, totalCost: 0 };
      }
      categoryDetails[req.category].count += 1;
      categoryDetails[req.category].totalCost += Number(req.actualCost ?? req.estimatedCost ?? 0);
    }

    return {
      period: { startDate, endDate },
      totalRequests: total,
      openRequests: openCount,
      resolutionRate,
      avgResolutionDays,
      totalEstimatedCost: Number(costAgg._sum.estimatedCost ?? 0),
      totalActualCost: Number(costAgg._sum.actualCost ?? 0),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      byCategory: Object.entries(categoryDetails).map(([category, data]) => ({
        category,
        count: data.count,
        totalCost: Math.round(data.totalCost * 100) / 100,
        avgCost: data.count > 0 ? Math.round((data.totalCost / data.count) * 100) / 100 : 0,
      })),
    };
  }

  async getOwnerStatement(params: {
    ownerId: string;
    startDate?: string;
    endDate?: string;
    periodMonth?: number;
    periodYear?: number;
    userOwnerId?: string;
  }) {
    const { ownerId, userOwnerId } = params;

    // RLS: owner can only view their own statement
    if (userOwnerId && userOwnerId !== ownerId) {
      throw ApiError.forbidden('You do not have access to this owner statement');
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        properties: {
          where: { deletedAt: null },
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    // Support both date range and month/year
    let startDate: Date;
    let endDate: Date;
    let periodMonth: number;
    let periodYear: number;

    if (params.startDate && params.endDate) {
      startDate = new Date(params.startDate);
      endDate = new Date(params.endDate);
      periodMonth = startDate.getMonth() + 1;
      periodYear = startDate.getFullYear();
    } else if (params.periodMonth && params.periodYear) {
      periodMonth = params.periodMonth;
      periodYear = params.periodYear;
      startDate = new Date(periodYear, periodMonth - 1, 1);
      endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);
    } else {
      // Default: current month
      const now = new Date();
      periodMonth = now.getMonth() + 1;
      periodYear = now.getFullYear();
      startDate = new Date(periodYear, periodMonth - 1, 1);
      endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);
    }

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

    // Expenses
    const expenses = await prisma.expenseRecord.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        property: {
          select: { id: true, name: true, internalCode: true },
        },
      },
    });

    // Management fees
    const feeCalcs = await prisma.managementFeeCalculation.findMany({
      where: {
        ownerId,
        propertyId: { in: propertyIds },
        periodMonth,
        periodYear,
      },
    });

    // Build per-property breakdown
    const propertyBreakdown: Record<string, {
      property: { id: string; name: string; internalCode: string };
      income: number;
      expenses: number;
      managementFee: number;
      bookingsCount: number;
    }> = {};

    for (const prop of owner.properties) {
      propertyBreakdown[prop.id] = {
        property: prop,
        income: 0,
        expenses: 0,
        managementFee: 0,
        bookingsCount: 0,
      };
    }

    for (const booking of bookings) {
      if (propertyBreakdown[booking.propertyId]) {
        propertyBreakdown[booking.propertyId].income += Number(booking.totalAmount);
        propertyBreakdown[booking.propertyId].bookingsCount += 1;
      }
    }

    for (const expense of expenses) {
      if (expense.propertyId && propertyBreakdown[expense.propertyId]) {
        propertyBreakdown[expense.propertyId].expenses += Number(expense.amount);
      }
    }

    for (const fee of feeCalcs) {
      if (propertyBreakdown[fee.propertyId]) {
        propertyBreakdown[fee.propertyId].managementFee += Number(fee.appliedFee);
      }
    }

    const properties = Object.values(propertyBreakdown).map((p) => ({
      ...p,
      income: Math.round(p.income * 100) / 100,
      expenses: Math.round(p.expenses * 100) / 100,
      managementFee: Math.round(p.managementFee * 100) / 100,
      netToOwner: Math.round((p.income - p.expenses - p.managementFee) * 100) / 100,
    }));

    const totalIncome = properties.reduce((sum, p) => sum + p.income, 0);
    const totalExpenses = properties.reduce((sum, p) => sum + p.expenses, 0);
    const totalFees = properties.reduce((sum, p) => sum + p.managementFee, 0);
    const netAmount = Math.round((totalIncome - totalExpenses - totalFees) * 100) / 100;

    return {
      owner: {
        id: owner.id,
        companyName: owner.companyName,
        name: `${owner.user.firstName} ${owner.user.lastName}`,
      },
      period: {
        month: periodMonth,
        year: periodYear,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      properties,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        managementFee: totalFees,
        netToOwner: netAmount,
      },
    };
  }

  async getGuestAnalytics(params: {
    startDate: string;
    endDate: string;
    userOwnerId?: string;
  }) {
    const { startDate, endDate, userOwnerId } = params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingWhere: Prisma.BookingWhereInput = {
      checkIn: { gte: start, lte: end },
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
    };

    if (userOwnerId) {
      bookingWhere.property = { ownerId: userOwnerId };
    }

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: {
        guestId: true,
        guestEmail: true,
        guestName: true,
        nights: true,
        checkIn: true,
        guest: {
          select: {
            id: true,
            nationality: true,
            totalStays: true,
          },
        },
      },
    });

    const totalBookings = bookings.length;

    // Count unique guests by email or guestId
    const guestSet = new Set<string>();
    const repeatGuestSet = new Set<string>();
    const nationalityCounts: Record<string, number> = {};
    const monthlyGuests: Record<string, Set<string>> = {};
    let totalNights = 0;

    for (const booking of bookings) {
      const guestKey = booking.guestId || booking.guestEmail || booking.guestName;
      if (!guestKey) continue;

      if (guestSet.has(guestKey)) {
        repeatGuestSet.add(guestKey);
      }
      guestSet.add(guestKey);
      totalNights += booking.nights;

      // Nationality
      if (booking.guest?.nationality) {
        const nat = booking.guest.nationality;
        nationalityCounts[nat] = (nationalityCounts[nat] || 0) + 1;
      }

      // Monthly
      const monthKey = `${booking.checkIn.getFullYear()}-${String(booking.checkIn.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyGuests[monthKey]) {
        monthlyGuests[monthKey] = new Set();
      }
      monthlyGuests[monthKey].add(guestKey);
    }

    // Also count guests that have totalStays > 1 from the profile
    for (const booking of bookings) {
      if (booking.guest && booking.guest.totalStays > 1) {
        const guestKey = booking.guestId || booking.guestEmail || booking.guestName;
        if (guestKey) repeatGuestSet.add(guestKey);
      }
    }

    const totalGuests = guestSet.size;
    const repeatGuests = repeatGuestSet.size;
    const repeatRate = totalGuests > 0 ? Math.round((repeatGuests / totalGuests) * 10000) / 100 : 0;
    const avgStayLength = totalBookings > 0 ? Math.round((totalNights / totalBookings) * 10) / 10 : 0;

    const topNationalities = Object.entries(nationalityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([nationality, count]) => ({ nationality, count }));

    const guestsByMonth = Object.entries(monthlyGuests)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, guests]) => ({
        month,
        guests: guests.size,
      }));

    return {
      period: { startDate, endDate },
      totalGuests,
      repeatGuests,
      repeatRate,
      avgStayLength,
      totalBookings,
      topNationalities,
      guestsByMonth,
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

function getGroupKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    return date.toISOString().slice(0, 10);
  } else if (groupBy === 'week') {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    d.setDate(diff);
    return `W${d.toISOString().slice(0, 10)}`;
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const reportsService = new ReportsService();
