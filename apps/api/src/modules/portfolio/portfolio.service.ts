import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class PortfolioService {
  async getPortfolioOverview(ownerId: string) {
    // Verify owner exists
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [
      properties,
      monthlyIncome,
      monthlyExpenses,
      monthlyFees,
      bookingStats,
      latestScores,
    ] = await Promise.all([
      // Total properties
      prisma.property.findMany({
        where: { ownerId, deletedAt: null },
        select: {
          id: true,
          purchasePrice: true,
          status: true,
        },
      }),
      // Monthly income
      prisma.incomeRecord.aggregate({
        where: {
          ownerId,
          periodMonth: currentMonth,
          periodYear: currentYear,
        },
        _sum: { amount: true },
      }),
      // Monthly expenses
      prisma.expenseRecord.aggregate({
        where: {
          ownerId,
          periodMonth: currentMonth,
          periodYear: currentYear,
        },
        _sum: { amount: true },
      }),
      // Monthly management fees
      prisma.managementFeeCalculation.aggregate({
        where: {
          ownerId,
          periodMonth: currentMonth,
          periodYear: currentYear,
        },
        _sum: { appliedFee: true },
      }),
      // Booking stats for occupancy calculation
      prisma.booking.aggregate({
        where: {
          property: { ownerId },
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
        _sum: { nights: true },
        _count: { id: true },
      }),
      // Latest property scores
      prisma.propertyScore.findMany({
        where: {
          property: { ownerId },
          periodMonth: currentMonth,
          periodYear: currentYear,
        },
        select: {
          overallScore: true,
          occupancyScore: true,
        },
      }),
    ]);

    const totalProperties = properties.length;
    const totalValue = properties.reduce(
      (sum, p) => sum + (p.purchasePrice ? p.purchasePrice.toNumber() : 0),
      0,
    );

    const totalMonthlyIncome = monthlyIncome._sum.amount
      ? monthlyIncome._sum.amount.toNumber()
      : 0;
    const totalMonthlyExpenses = monthlyExpenses._sum.amount
      ? monthlyExpenses._sum.amount.toNumber()
      : 0;
    const totalManagementFees = monthlyFees._sum.appliedFee
      ? monthlyFees._sum.appliedFee.toNumber()
      : 0;
    const netIncome = totalMonthlyIncome - totalMonthlyExpenses - totalManagementFees;

    // Average occupancy from scores
    const avgOccupancy = latestScores.length > 0
      ? latestScores.reduce((sum, s) => sum + s.occupancyScore.toNumber(), 0) / latestScores.length
      : 0;

    // Average property score
    const avgPropertyScore = latestScores.length > 0
      ? latestScores.reduce((sum, s) => sum + s.overallScore.toNumber(), 0) / latestScores.length
      : 0;

    // Days in current month for occupancy
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const totalNightsBooked = bookingStats._sum.nights ?? 0;
    const averageOccupancyRate = totalProperties > 0
      ? (totalNightsBooked / (totalProperties * daysInMonth)) * 100
      : 0;

    return {
      totalProperties,
      totalValue,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      totalManagementFees,
      netIncome,
      averageOccupancy: Math.round(avgOccupancy * 100) / 100,
      averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100,
      averagePropertyScore: Math.round(avgPropertyScore * 100) / 100,
      currentMonth,
      currentYear,
    };
  }

  async getPortfolioProperties(ownerId: string) {
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const properties = await prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      select: {
        id: true,
        name: true,
        internalCode: true,
        propertyType: true,
        status: true,
        city: true,
        country: true,
        bedrooms: true,
        bathrooms: true,
        maxGuests: true,
        baseNightlyRate: true,
        purchasePrice: true,
        managementFeePercent: true,
        propertyScore: true,
      },
    });

    // Get income, expenses, bookings, and scores for all properties in one go
    const propertyIds = properties.map((p) => p.id);

    const [incomeByProperty, expensesByProperty, bookingsByProperty, scoresByProperty] =
      await Promise.all([
        prisma.incomeRecord.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            periodMonth: currentMonth,
            periodYear: currentYear,
          },
          _sum: { amount: true },
        }),
        prisma.expenseRecord.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            periodMonth: currentMonth,
            periodYear: currentYear,
          },
          _sum: { amount: true },
        }),
        prisma.booking.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
            checkIn: {
              gte: new Date(currentYear, currentMonth - 1, 1),
              lt: new Date(currentYear, currentMonth, 1),
            },
          },
          _count: { id: true },
          _sum: { nights: true },
        }),
        prisma.propertyScore.findMany({
          where: {
            propertyId: { in: propertyIds },
            periodMonth: currentMonth,
            periodYear: currentYear,
          },
          select: {
            propertyId: true,
            overallScore: true,
            occupancyScore: true,
          },
        }),
      ]);

    const incomeMap = new Map(
      incomeByProperty.map((i) => [i.propertyId, i._sum.amount?.toNumber() ?? 0]),
    );
    const expensesMap = new Map(
      expensesByProperty.map((e) => [e.propertyId, e._sum.amount?.toNumber() ?? 0]),
    );
    const bookingsMap = new Map(
      bookingsByProperty.map((b) => [b.propertyId, { count: b._count.id, nights: b._sum.nights ?? 0 }]),
    );
    const scoresMap = new Map(
      scoresByProperty.map((s) => [s.propertyId, {
        overallScore: s.overallScore.toNumber(),
        occupancyScore: s.occupancyScore.toNumber(),
      }]),
    );

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const enrichedProperties = properties.map((property) => {
      const income = incomeMap.get(property.id) ?? 0;
      const expenses = expensesMap.get(property.id) ?? 0;
      const bookingData = bookingsMap.get(property.id) ?? { count: 0, nights: 0 };
      const scores = scoresMap.get(property.id);
      const occupancyRate = daysInMonth > 0
        ? (bookingData.nights / daysInMonth) * 100
        : 0;

      return {
        ...property,
        baseNightlyRate: property.baseNightlyRate.toNumber(),
        purchasePrice: property.purchasePrice?.toNumber() ?? null,
        managementFeePercent: property.managementFeePercent.toNumber(),
        propertyScore: property.propertyScore?.toNumber() ?? null,
        kpis: {
          monthlyIncome: income,
          monthlyExpenses: expenses,
          netIncome: income - expenses,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          bookingsCount: bookingData.count,
          nightsBooked: bookingData.nights,
          overallScore: scores?.overallScore ?? null,
          occupancyScore: scores?.occupancyScore ?? null,
        },
      };
    });

    return enrichedProperties;
  }

  async getPortfolioTrend(ownerId: string, months: number = 12) {
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const now = new Date();
    const periods: Array<{ month: number; year: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }

    const startPeriod = periods[0];
    const endPeriod = periods[periods.length - 1];

    const [incomeByPeriod, expensesByPeriod, bookingsByPeriod] = await Promise.all([
      prisma.incomeRecord.groupBy({
        by: ['periodMonth', 'periodYear'],
        where: {
          ownerId,
          OR: periods.map((p) => ({
            periodMonth: p.month,
            periodYear: p.year,
          })),
        },
        _sum: { amount: true },
      }),
      prisma.expenseRecord.groupBy({
        by: ['periodMonth', 'periodYear'],
        where: {
          ownerId,
          OR: periods.map((p) => ({
            periodMonth: p.month,
            periodYear: p.year,
          })),
        },
        _sum: { amount: true },
      }),
      prisma.booking.groupBy({
        by: [
          // Group bookings by extracting month/year from checkIn is not directly possible
          // So we'll use a raw query approach via count
        ] as any,
        where: {
          property: { ownerId },
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: {
            gte: new Date(startPeriod.year, startPeriod.month - 1, 1),
            lt: new Date(endPeriod.year, endPeriod.month, 1),
          },
        },
        _count: { id: true },
        _sum: { nights: true, totalAmount: true },
      }).catch(() => []),
    ]);

    const incomeMap = new Map(
      incomeByPeriod.map((i) => [`${i.periodYear}-${i.periodMonth}`, i._sum.amount?.toNumber() ?? 0]),
    );
    const expensesMap = new Map(
      expensesByPeriod.map((e) => [`${e.periodYear}-${e.periodMonth}`, e._sum.amount?.toNumber() ?? 0]),
    );

    const trend = periods.map((period) => {
      const key = `${period.year}-${period.month}`;
      const income = incomeMap.get(key) ?? 0;
      const expenses = expensesMap.get(key) ?? 0;

      return {
        month: period.month,
        year: period.year,
        income,
        expenses,
        netIncome: income - expenses,
      };
    });

    return trend;
  }

  async getPortfolioComparison(ownerId: string) {
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get last 3 months for comparison
    const comparisonMonths = 3;
    const periods: Array<{ month: number; year: number }> = [];
    for (let i = comparisonMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }

    const properties = await prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      select: {
        id: true,
        name: true,
        internalCode: true,
        city: true,
        propertyType: true,
      },
    });

    const propertyIds = properties.map((p) => p.id);

    const [incomeByPropertyPeriod, expensesByPropertyPeriod, bookingsByProperty] =
      await Promise.all([
        prisma.incomeRecord.groupBy({
          by: ['propertyId', 'periodMonth', 'periodYear'],
          where: {
            propertyId: { in: propertyIds },
            OR: periods.map((p) => ({
              periodMonth: p.month,
              periodYear: p.year,
            })),
          },
          _sum: { amount: true },
        }),
        prisma.expenseRecord.groupBy({
          by: ['propertyId', 'periodMonth', 'periodYear'],
          where: {
            propertyId: { in: propertyIds },
            OR: periods.map((p) => ({
              periodMonth: p.month,
              periodYear: p.year,
            })),
          },
          _sum: { amount: true },
        }),
        prisma.booking.groupBy({
          by: ['propertyId'],
          where: {
            propertyId: { in: propertyIds },
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
            checkIn: {
              gte: new Date(periods[0].year, periods[0].month - 1, 1),
              lt: new Date(currentYear, currentMonth, 1),
            },
          },
          _count: { id: true },
          _sum: { nights: true, totalAmount: true },
        }),
      ]);

    const comparison = properties.map((property) => {
      const propertyIncome = incomeByPropertyPeriod
        .filter((i) => i.propertyId === property.id)
        .reduce((sum, i) => sum + (i._sum.amount?.toNumber() ?? 0), 0);

      const propertyExpenses = expensesByPropertyPeriod
        .filter((e) => e.propertyId === property.id)
        .reduce((sum, e) => sum + (e._sum.amount?.toNumber() ?? 0), 0);

      const propertyBookings = bookingsByProperty.find((b) => b.propertyId === property.id);

      const avgMonthlyIncome = propertyIncome / comparisonMonths;
      const avgMonthlyExpenses = propertyExpenses / comparisonMonths;

      return {
        ...property,
        totalIncome: propertyIncome,
        totalExpenses: propertyExpenses,
        netIncome: propertyIncome - propertyExpenses,
        avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
        avgMonthlyExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
        totalBookings: propertyBookings?._count.id ?? 0,
        totalNightsBooked: propertyBookings?._sum.nights ?? 0,
        totalBookingRevenue: propertyBookings?._sum.totalAmount?.toNumber() ?? 0,
        comparisonPeriod: {
          months: comparisonMonths,
          from: periods[0],
          to: periods[periods.length - 1],
        },
      };
    });

    // Sort by net income descending
    comparison.sort((a, b) => b.netIncome - a.netIncome);

    return comparison;
  }
}

export const portfolioService = new PortfolioService();
