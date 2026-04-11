import { ApiError } from '../../utils/api-error';
import { prisma } from '../../prisma/client';

// ── Dashboard Types ────────────────────────────────────────────────────────

export interface DashboardData {
  kpis: {
    totalProperties: number;
    activeProperties: number;
    totalBookings: number;
    activeBookings: number;
    occupancyRate: number;
    totalRevenue: number;
    monthlyRevenue: number;
    pendingPayments: number;
    totalGuests: number;
    averageRating: number;
    maintenanceOpen: number;
    totalOwners: number;
  };
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  bookingsBySource: { source: string; count: number }[];
  recentBookings: {
    id: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: string;
    source: string;
  }[];
  upcomingCheckIns: {
    id: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guestsCount: number;
  }[];
  propertyPerformance: {
    propertyId: string;
    propertyName: string;
    city: string;
    revenue: number;
    bookingsCount: number;
    occupancyRate: number;
  }[];
  maintenanceStats: {
    open: number;
    inProgress: number;
    completed: number;
    urgent: number;
  };
}

export interface OwnerDashboardData {
  kpis: {
    totalProperties: number;
    activeProperties: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    occupancyRate: number;
    totalBookings: number;
    activeBookings: number;
    pendingApprovals: number;
    averageRating: number;
  };
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  recentBookings: {
    id: string;
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
    status: string;
  }[];
  pendingExpenseApprovals: {
    id: string;
    title: string;
    description: string;
    amount: number;
    category: string;
    propertyName: string;
    createdAt: string;
    urgency: string;
  }[];
  propertyPerformance: {
    propertyId: string;
    propertyName: string;
    city: string;
    revenue: number;
    bookingsCount: number;
    occupancyRate: number;
  }[];
  maintenanceStats: {
    open: number;
    inProgress: number;
    completed: number;
    urgent: number;
  };
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface RevenueMetrics {
  period: string;
  totalRevenue: number;
  occupancyRate: number;
  averageDailyRate: number;
  revPAR: number;
  averageLOS: number;
  bookingsCount: number;
  cancellationRate: number;
  directBookingShare: number;
  repeatGuestRate: number;
  averageLeadTime: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  totalRevenue: number;
  occupancyRate: number;
  adr: number;
  revPAR: number;
  totalBookings: number;
  averageRating: number;
  roi: number;
  netOperatingIncome: number;
  managementFees: number;
  expenses: number;
  rank: number;
}

export interface ChannelAnalytics {
  channel: string;
  bookings: number;
  revenue: number;
  averageRate: number;
  cancellationRate: number;
  sharePercent: number;
}

export interface OccupancyHeatmapEntry {
  month: string;
  day: number;
  occupied: boolean;
  rate: number;
}

export interface ForecastData {
  month: string;
  predictedOccupancy: number;
  predictedRevenue: number;
  predictedBookings: number;
  confidence: number;
}

export interface OwnerReport {
  ownerId: string;
  ownerName: string;
  propertyCount: number;
  totalRevenue: number;
  totalExpenses: number;
  managementFees: number;
  netPayout: number;
  occupancyRate: number;
  bestProperty: string;
  worstProperty: string;
}

export interface KPIDashboard {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  adr: number;
  revPAR: number;
  pendingPayouts: number;
  maintenanceOpen: number;
  guestSatisfaction: number;
}

export interface SeasonalTrend {
  month: string;
  avgOccupancy: number;
  avgRate: number;
  avgRevenue: number;
}

export interface RevenueOverviewFilters {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  ownerId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface PropertyPerformanceFilters {
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  sortBy?: string;
  limit?: number;
}

export interface ChannelAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
}

export interface OwnerReportFilters {
  startDate?: string;
  endDate?: string;
  ownerId?: string;
}

export interface ExportFilters {
  type: 'revenue' | 'property' | 'channel' | 'owner';
  format: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  ownerId?: string;
}

// ── Demo Properties ─────────────────────────────────────────────────────────

interface DemoProperty {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  purchasePrice: number;
  baseRate: number;
  avgRating: number;
}

const DEMO_PROPERTIES: DemoProperty[] = [
  { id: 'prop-001', name: 'Villa Elounda Royale', ownerId: 'owner-001', ownerName: 'Nikos Papadakis', purchasePrice: 850000, baseRate: 280, avgRating: 4.9 },
  { id: 'prop-002', name: 'Elounda Breeze Villa', ownerId: 'owner-001', ownerName: 'Nikos Papadakis', purchasePrice: 620000, baseRate: 220, avgRating: 4.7 },
  { id: 'prop-003', name: 'Chania Harbor Suite', ownerId: 'owner-002', ownerName: 'Maria Stavrakaki', purchasePrice: 380000, baseRate: 160, avgRating: 4.6 },
  { id: 'prop-004', name: 'Rethymno Sunset Apartment', ownerId: 'owner-002', ownerName: 'Maria Stavrakaki', purchasePrice: 290000, baseRate: 130, avgRating: 4.4 },
  { id: 'prop-005', name: 'Heraklion City Loft', ownerId: 'owner-003', ownerName: 'Yannis Kostarakis', purchasePrice: 210000, baseRate: 95, avgRating: 4.3 },
  { id: 'prop-006', name: 'Agios Nikolaos Seaside', ownerId: 'owner-003', ownerName: 'Yannis Kostarakis', purchasePrice: 450000, baseRate: 190, avgRating: 4.8 },
  { id: 'prop-007', name: 'Sitia Mountain Retreat', ownerId: 'owner-004', ownerName: 'Elena Fragkiadaki', purchasePrice: 180000, baseRate: 75, avgRating: 4.1 },
];

const CHANNELS = ['airbnb', 'booking.com', 'vrbo', 'direct'];
const CHANNEL_WEIGHTS = [0.40, 0.30, 0.12, 0.18];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Seasonal Helpers ────────────────────────────────────────────────────────

function getSeasonalMultiplier(month: number): { occupancy: number; rateMultiplier: number } {
  // month is 0-indexed
  const seasonMap: Record<number, { occupancy: number; rateMultiplier: number }> = {
    0:  { occupancy: 0.25, rateMultiplier: 0.50 },  // Jan
    1:  { occupancy: 0.22, rateMultiplier: 0.48 },  // Feb
    2:  { occupancy: 0.30, rateMultiplier: 0.55 },  // Mar
    3:  { occupancy: 0.55, rateMultiplier: 0.75 },  // Apr
    4:  { occupancy: 0.65, rateMultiplier: 0.85 },  // May
    5:  { occupancy: 0.88, rateMultiplier: 1.10 },  // Jun
    6:  { occupancy: 0.95, rateMultiplier: 1.30 },  // Jul
    7:  { occupancy: 0.93, rateMultiplier: 1.35 },  // Aug
    8:  { occupancy: 0.85, rateMultiplier: 1.15 },  // Sep
    9:  { occupancy: 0.60, rateMultiplier: 0.80 },  // Oct
    10: { occupancy: 0.35, rateMultiplier: 0.55 },  // Nov
    11: { occupancy: 0.28, rateMultiplier: 0.50 },  // Dec
  };
  return seasonMap[month] || { occupancy: 0.50, rateMultiplier: 0.80 };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ── Generate Monthly Data ──────────────────────────────────────────────────

interface MonthlyPropertyData {
  propertyId: string;
  propertyName: string;
  ownerId: string;
  ownerName: string;
  year: number;
  month: number;
  period: string;
  occupancyRate: number;
  adr: number;
  revenue: number;
  bookings: number;
  cancellations: number;
  avgLOS: number;
  channelBreakdown: { channel: string; bookings: number; revenue: number }[];
  directBookings: number;
  repeatGuests: number;
  avgLeadTime: number;
  expenses: number;
  managementFees: number;
  avgRating: number;
}

function generateMonthlyData(): MonthlyPropertyData[] {
  const data: MonthlyPropertyData[] = [];
  const baseYear = 2025;

  for (const prop of DEMO_PROPERTIES) {
    for (let m = 0; m < 12; m++) {
      const year = m >= 5 ? baseYear + 1 : baseYear;
      const actualMonth = m >= 5 ? m - 5 : m + 7; // starts from Aug 2025 to Jul 2026
      const adjustedYear = m < 5 ? 2025 : 2026;
      const calendarMonth = m < 5 ? m + 8 : m - 4; // Aug(8)..Dec(12) then Jan(1)..Jul(7)
      const monthIdx = calendarMonth - 1; // 0-indexed

      const seed = prop.id.charCodeAt(5) * 100 + m;
      const seasonal = getSeasonalMultiplier(monthIdx);

      const noise = (seededRandom(seed) - 0.5) * 0.10;
      const occupancy = Math.min(0.98, Math.max(0.15, seasonal.occupancy + noise));
      const adr = Math.round(prop.baseRate * seasonal.rateMultiplier * (1 + (seededRandom(seed + 1) - 0.5) * 0.15));

      const days = daysInMonth(adjustedYear, monthIdx);
      const occupiedNights = Math.round(occupancy * days);
      const avgLOS = 3 + seededRandom(seed + 2) * 4; // 3–7 nights
      const bookings = Math.max(1, Math.round(occupiedNights / avgLOS));
      const revenue = occupiedNights * adr;
      const cancellations = Math.round(bookings * (0.05 + seededRandom(seed + 3) * 0.10));

      // Channel breakdown
      const channelBreakdown: { channel: string; bookings: number; revenue: number }[] = [];
      let remainingBookings = bookings;
      let remainingRevenue = revenue;
      let directBookings = 0;

      for (let c = 0; c < CHANNELS.length; c++) {
        const isLast = c === CHANNELS.length - 1;
        const channelShare = isLast ? 1 : CHANNEL_WEIGHTS[c] + (seededRandom(seed + 10 + c) - 0.5) * 0.08;
        const chBookings = isLast ? remainingBookings : Math.round(bookings * channelShare);
        const chRevenue = isLast ? remainingRevenue : Math.round(revenue * channelShare);

        channelBreakdown.push({
          channel: CHANNELS[c],
          bookings: Math.max(0, chBookings),
          revenue: Math.max(0, chRevenue),
        });

        if (CHANNELS[c] === 'direct') {
          directBookings = Math.max(0, chBookings);
        }

        if (!isLast) {
          remainingBookings -= chBookings;
          remainingRevenue -= chRevenue;
        }
      }

      const repeatGuests = Math.round(bookings * (0.15 + seededRandom(seed + 5) * 0.20));
      const avgLeadTime = Math.round(15 + seededRandom(seed + 6) * 45);
      const expenses = Math.round(revenue * (0.15 + seededRandom(seed + 7) * 0.10));
      const managementFees = Math.round(revenue * 0.15);

      const periodStr = `${adjustedYear}-${String(calendarMonth).padStart(2, '0')}`;

      data.push({
        propertyId: prop.id,
        propertyName: prop.name,
        ownerId: prop.ownerId,
        ownerName: prop.ownerName,
        year: adjustedYear,
        month: calendarMonth,
        period: periodStr,
        occupancyRate: Math.round(occupancy * 100 * 10) / 10,
        adr,
        revenue,
        bookings,
        cancellations,
        avgLOS: Math.round(avgLOS * 10) / 10,
        channelBreakdown,
        directBookings,
        repeatGuests,
        avgLeadTime,
        expenses,
        managementFees,
        avgRating: prop.avgRating + (seededRandom(seed + 8) - 0.5) * 0.3,
      });
    }
  }

  return data;
}

// ── Service ────────────────────────────────────────────────────────────────

export class AnalyticsService {
  private monthlyData: MonthlyPropertyData[] = generateMonthlyData();

  // ── Revenue Overview ──────────────────────────────────────────────────

  async getRevenueOverview(filters: RevenueOverviewFilters): Promise<RevenueMetrics[]> {
    let filtered = [...this.monthlyData];

    if (filters.propertyId) {
      filtered = filtered.filter((d) => d.propertyId === filters.propertyId);
    }
    if (filters.ownerId) {
      filtered = filtered.filter((d) => d.ownerId === filters.ownerId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((d) => d.period >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((d) => d.period <= filters.endDate!);
    }

    const groupBy = filters.groupBy || 'month';
    const groups = new Map<string, MonthlyPropertyData[]>();

    for (const entry of filtered) {
      let key: string;
      switch (groupBy) {
        case 'day':
          key = entry.period;
          break;
        case 'week':
          key = entry.period;
          break;
        case 'month':
          key = entry.period;
          break;
        case 'quarter': {
          const q = Math.ceil(entry.month / 3);
          key = `${entry.year}-Q${q}`;
          break;
        }
        case 'year':
          key = `${entry.year}`;
          break;
        default:
          key = entry.period;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }

    const results: RevenueMetrics[] = [];

    for (const [period, entries] of groups) {
      const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
      const avgOccupancy = entries.reduce((s, e) => s + e.occupancyRate, 0) / entries.length;
      const totalBookings = entries.reduce((s, e) => s + e.bookings, 0);
      const totalCancellations = entries.reduce((s, e) => s + e.cancellations, 0);
      const avgADR = entries.reduce((s, e) => s + e.adr, 0) / entries.length;
      const avgLOS = entries.reduce((s, e) => s + e.avgLOS, 0) / entries.length;
      const directBookings = entries.reduce((s, e) => s + e.directBookings, 0);
      const repeatGuests = entries.reduce((s, e) => s + e.repeatGuests, 0);
      const avgLeadTime = entries.reduce((s, e) => s + e.avgLeadTime, 0) / entries.length;

      results.push({
        period,
        totalRevenue: Math.round(totalRevenue),
        occupancyRate: Math.round(avgOccupancy * 10) / 10,
        averageDailyRate: Math.round(avgADR),
        revPAR: Math.round(avgADR * (avgOccupancy / 100)),
        averageLOS: Math.round(avgLOS * 10) / 10,
        bookingsCount: totalBookings,
        cancellationRate: totalBookings > 0
          ? Math.round((totalCancellations / (totalBookings + totalCancellations)) * 100 * 10) / 10
          : 0,
        directBookingShare: totalBookings > 0
          ? Math.round((directBookings / totalBookings) * 100 * 10) / 10
          : 0,
        repeatGuestRate: totalBookings > 0
          ? Math.round((repeatGuests / totalBookings) * 100 * 10) / 10
          : 0,
        averageLeadTime: Math.round(avgLeadTime),
      });
    }

    results.sort((a, b) => a.period.localeCompare(b.period));
    return results;
  }

  // ── Property Performance ──────────────────────────────────────────────

  async getPropertyPerformance(filters: PropertyPerformanceFilters): Promise<PropertyPerformance[]> {
    let filtered = [...this.monthlyData];

    if (filters.ownerId) {
      filtered = filtered.filter((d) => d.ownerId === filters.ownerId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((d) => d.period >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((d) => d.period <= filters.endDate!);
    }

    const propertyGroups = new Map<string, MonthlyPropertyData[]>();

    for (const entry of filtered) {
      if (!propertyGroups.has(entry.propertyId)) {
        propertyGroups.set(entry.propertyId, []);
      }
      propertyGroups.get(entry.propertyId)!.push(entry);
    }

    const results: PropertyPerformance[] = [];

    for (const [propertyId, entries] of propertyGroups) {
      const prop = DEMO_PROPERTIES.find((p) => p.id === propertyId)!;
      const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
      const avgOccupancy = entries.reduce((s, e) => s + e.occupancyRate, 0) / entries.length;
      const avgADR = entries.reduce((s, e) => s + e.adr, 0) / entries.length;
      const totalBookings = entries.reduce((s, e) => s + e.bookings, 0);
      const totalExpenses = entries.reduce((s, e) => s + e.expenses, 0);
      const totalMgmtFees = entries.reduce((s, e) => s + e.managementFees, 0);
      const avgRating = entries.reduce((s, e) => s + e.avgRating, 0) / entries.length;
      const netOperatingIncome = totalRevenue - totalExpenses - totalMgmtFees;
      const roi = prop.purchasePrice > 0
        ? Math.round((netOperatingIncome / prop.purchasePrice) * 100 * 10) / 10
        : 0;

      results.push({
        propertyId,
        propertyName: prop.name,
        totalRevenue: Math.round(totalRevenue),
        occupancyRate: Math.round(avgOccupancy * 10) / 10,
        adr: Math.round(avgADR),
        revPAR: Math.round(avgADR * (avgOccupancy / 100)),
        totalBookings,
        averageRating: Math.round(avgRating * 10) / 10,
        roi,
        netOperatingIncome: Math.round(netOperatingIncome),
        managementFees: Math.round(totalMgmtFees),
        expenses: Math.round(totalExpenses),
        rank: 0,
      });
    }

    const sortBy = filters.sortBy || 'totalRevenue';
    results.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      return bVal - aVal;
    });

    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    const limit = filters.limit || results.length;
    return results.slice(0, limit);
  }

  // ── Channel Analytics ─────────────────────────────────────────────────

  async getChannelAnalytics(filters: ChannelAnalyticsFilters): Promise<ChannelAnalytics[]> {
    let filtered = [...this.monthlyData];

    if (filters.propertyId) {
      filtered = filtered.filter((d) => d.propertyId === filters.propertyId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((d) => d.period >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((d) => d.period <= filters.endDate!);
    }

    const channelMap = new Map<string, { bookings: number; revenue: number; cancellations: number }>();

    for (const entry of filtered) {
      for (const ch of entry.channelBreakdown) {
        if (!channelMap.has(ch.channel)) {
          channelMap.set(ch.channel, { bookings: 0, revenue: 0, cancellations: 0 });
        }
        const existing = channelMap.get(ch.channel)!;
        existing.bookings += ch.bookings;
        existing.revenue += ch.revenue;
      }
      // Distribute cancellations proportionally
      for (const ch of entry.channelBreakdown) {
        const existing = channelMap.get(ch.channel)!;
        const share = entry.bookings > 0 ? ch.bookings / entry.bookings : 0;
        existing.cancellations += Math.round(entry.cancellations * share);
      }
    }

    const totalBookings = Array.from(channelMap.values()).reduce((s, c) => s + c.bookings, 0);
    const totalRevenue = Array.from(channelMap.values()).reduce((s, c) => s + c.revenue, 0);

    const results: ChannelAnalytics[] = [];

    for (const [channel, data] of channelMap) {
      results.push({
        channel,
        bookings: data.bookings,
        revenue: Math.round(data.revenue),
        averageRate: data.bookings > 0 ? Math.round(data.revenue / data.bookings) : 0,
        cancellationRate: data.bookings > 0
          ? Math.round((data.cancellations / (data.bookings + data.cancellations)) * 100 * 10) / 10
          : 0,
        sharePercent: totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 100 * 10) / 10
          : 0,
      });
    }

    results.sort((a, b) => b.revenue - a.revenue);
    return results;
  }

  // ── Occupancy Heatmap ─────────────────────────────────────────────────

  async getOccupancyHeatmap(propertyId: string, year: number): Promise<OccupancyHeatmapEntry[]> {
    const prop = DEMO_PROPERTIES.find((p) => p.id === propertyId);
    if (!prop) {
      throw ApiError.notFound('Property');
    }

    const results: OccupancyHeatmapEntry[] = [];

    for (let m = 0; m < 12; m++) {
      const days = daysInMonth(year, m);
      const seasonal = getSeasonalMultiplier(m);
      const seed = prop.id.charCodeAt(5) * 1000 + year * 12 + m;

      for (let d = 1; d <= days; d++) {
        const daySeed = seed + d;
        const threshold = seasonal.occupancy + (seededRandom(daySeed) - 0.5) * 0.20;
        const occupied = seededRandom(daySeed + 100) < threshold;
        const rate = occupied
          ? Math.round(prop.baseRate * seasonal.rateMultiplier * (0.9 + seededRandom(daySeed + 200) * 0.3))
          : 0;

        results.push({
          month: MONTHS[m],
          day: d,
          occupied,
          rate,
        });
      }
    }

    return results;
  }

  // ── Forecast ──────────────────────────────────────────────────────────

  async getForecast(propertyId?: string, months: number = 6): Promise<ForecastData[]> {
    const now = new Date();
    const results: ForecastData[] = [];

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthIdx = futureDate.getMonth();
      const year = futureDate.getFullYear();
      const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

      const seasonal = getSeasonalMultiplier(monthIdx);
      const seed = (propertyId ? propertyId.charCodeAt(5) : 42) * 1000 + year * 12 + monthIdx;

      let baseRevenue: number;
      let baseBookings: number;

      if (propertyId) {
        const prop = DEMO_PROPERTIES.find((p) => p.id === propertyId);
        if (!prop) {
          throw ApiError.notFound('Property');
        }
        const days = daysInMonth(year, monthIdx);
        const occupiedNights = Math.round(seasonal.occupancy * days);
        baseRevenue = occupiedNights * Math.round(prop.baseRate * seasonal.rateMultiplier);
        baseBookings = Math.max(1, Math.round(occupiedNights / 4.5));
      } else {
        // Aggregate across all properties
        baseRevenue = 0;
        baseBookings = 0;
        for (const prop of DEMO_PROPERTIES) {
          const days = daysInMonth(year, monthIdx);
          const occupiedNights = Math.round(seasonal.occupancy * days);
          baseRevenue += occupiedNights * Math.round(prop.baseRate * seasonal.rateMultiplier);
          baseBookings += Math.max(1, Math.round(occupiedNights / 4.5));
        }
      }

      const noise = (seededRandom(seed) - 0.5) * 0.12;
      const confidence = Math.max(0.55, 0.92 - i * 0.06 + (seededRandom(seed + 1) - 0.5) * 0.05);

      results.push({
        month: monthStr,
        predictedOccupancy: Math.round((seasonal.occupancy + noise) * 100 * 10) / 10,
        predictedRevenue: Math.round(baseRevenue * (1 + noise)),
        predictedBookings: Math.max(1, Math.round(baseBookings * (1 + noise))),
        confidence: Math.round(confidence * 100) / 100,
      });
    }

    return results;
  }

  // ── Owner Reports ─────────────────────────────────────────────────────

  async getOwnerReports(filters: OwnerReportFilters): Promise<OwnerReport[]> {
    let filtered = [...this.monthlyData];

    if (filters.ownerId) {
      filtered = filtered.filter((d) => d.ownerId === filters.ownerId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((d) => d.period >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((d) => d.period <= filters.endDate!);
    }

    const ownerGroups = new Map<string, MonthlyPropertyData[]>();

    for (const entry of filtered) {
      if (!ownerGroups.has(entry.ownerId)) {
        ownerGroups.set(entry.ownerId, []);
      }
      ownerGroups.get(entry.ownerId)!.push(entry);
    }

    const results: OwnerReport[] = [];

    for (const [ownerId, entries] of ownerGroups) {
      const ownerName = entries[0].ownerName;
      const propertyIds = [...new Set(entries.map((e) => e.propertyId))];
      const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
      const totalExpenses = entries.reduce((s, e) => s + e.expenses, 0);
      const totalMgmtFees = entries.reduce((s, e) => s + e.managementFees, 0);
      const avgOccupancy = entries.reduce((s, e) => s + e.occupancyRate, 0) / entries.length;

      // Best and worst by revenue per property
      const propRevenue = new Map<string, number>();
      for (const e of entries) {
        propRevenue.set(e.propertyId, (propRevenue.get(e.propertyId) || 0) + e.revenue);
      }

      let bestProperty = '';
      let worstProperty = '';
      let bestRev = -1;
      let worstRev = Infinity;

      for (const [pid, rev] of propRevenue) {
        const prop = DEMO_PROPERTIES.find((p) => p.id === pid);
        if (rev > bestRev) {
          bestRev = rev;
          bestProperty = prop?.name || pid;
        }
        if (rev < worstRev) {
          worstRev = rev;
          worstProperty = prop?.name || pid;
        }
      }

      results.push({
        ownerId,
        ownerName,
        propertyCount: propertyIds.length,
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        managementFees: Math.round(totalMgmtFees),
        netPayout: Math.round(totalRevenue - totalExpenses - totalMgmtFees),
        occupancyRate: Math.round(avgOccupancy * 10) / 10,
        bestProperty,
        worstProperty,
      });
    }

    results.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return results;
  }

  // ── KPI Dashboard ─────────────────────────────────────────────────────

  async getKPIDashboard(): Promise<KPIDashboard> {
    // Use last 3 months of data for current KPIs
    const sorted = [...this.monthlyData].sort((a, b) => b.period.localeCompare(a.period));
    const latestPeriod = sorted[0]?.period || '';
    const currentEntries = sorted.filter((d) => d.period === latestPeriod);

    const totalRevenue = this.monthlyData.reduce((s, e) => s + e.revenue, 0);
    const totalBookings = this.monthlyData.reduce((s, e) => s + e.bookings, 0);
    const avgOccupancy = currentEntries.length > 0
      ? currentEntries.reduce((s, e) => s + e.occupancyRate, 0) / currentEntries.length
      : 0;
    const avgADR = currentEntries.length > 0
      ? currentEntries.reduce((s, e) => s + e.adr, 0) / currentEntries.length
      : 0;
    const avgRating = currentEntries.length > 0
      ? currentEntries.reduce((s, e) => s + e.avgRating, 0) / currentEntries.length
      : 0;

    const totalPendingPayouts = currentEntries.reduce(
      (s, e) => s + (e.revenue - e.expenses - e.managementFees),
      0,
    );

    return {
      totalProperties: DEMO_PROPERTIES.length,
      totalBookings,
      totalRevenue: Math.round(totalRevenue),
      occupancyRate: Math.round(avgOccupancy * 10) / 10,
      adr: Math.round(avgADR),
      revPAR: Math.round(avgADR * (avgOccupancy / 100)),
      pendingPayouts: Math.round(totalPendingPayouts),
      maintenanceOpen: 4,
      guestSatisfaction: Math.round(avgRating * 10) / 10,
    };
  }

  // ── Dashboard (Prisma-based) ───────────────────────────────────────────

  async getDashboard(): Promise<DashboardData> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- KPIs (parallel) ---
    const [
      totalProperties,
      activeProperties,
      totalBookings,
      activeBookings,
      totalGuests,
      totalOwners,
      maintenanceOpen,
      maintenanceInProgress,
      maintenanceCompleted,
      maintenanceUrgent,
      revenueAgg,
      monthlyRevenueAgg,
      pendingPaymentsAgg,
    ] = await Promise.all([
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.property.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: today },
          checkOut: { gte: today },
        },
      }),
      prisma.guestProfile.count({ where: { deletedAt: null } }),
      prisma.owner.count({ where: { deletedAt: null } }),
      prisma.maintenanceRequest.count({ where: { status: 'OPEN' } }),
      prisma.maintenanceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.maintenanceRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.maintenanceRequest.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
      prisma.incomeRecord.aggregate({ _sum: { amount: true } }),
      prisma.incomeRecord.aggregate({
        _sum: { amount: true },
        where: {
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PENDING' },
      }),
    ]);

    // Occupancy rate: ratio of occupied nights to total possible nights this month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalPossibleNights = activeProperties * daysInMonth;
    const occupiedBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
        checkOut: { gt: startOfMonth },
      },
      select: { checkIn: true, checkOut: true },
    });
    let occupiedNights = 0;
    for (const b of occupiedBookings) {
      const start = b.checkIn > startOfMonth ? b.checkIn : startOfMonth;
      const end = b.checkOut < new Date(now.getFullYear(), now.getMonth() + 1, 1)
        ? b.checkOut
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      occupiedNights += diff;
    }
    const occupancyRate = totalPossibleNights > 0
      ? Math.round((occupiedNights / totalPossibleNights) * 100 * 10) / 10
      : 0;

    // Average rating from guest profiles
    const ratingAgg = await prisma.guestProfile.aggregate({
      _avg: { totalRevenue: true },
    });
    // Note: schema doesn't have a review/rating model, so we use property score average
    const propertyScores = await prisma.property.aggregate({
      _avg: { propertyScore: true },
      where: { deletedAt: null, propertyScore: { not: null } },
    });
    const averageRating = propertyScores._avg.propertyScore
      ? Math.round(Number(propertyScores._avg.propertyScore) * 10) / 10
      : 0;

    // --- Revenue by month (last 12 months) ---
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    const incomeByMonth = await prisma.incomeRecord.groupBy({
      by: ['periodYear', 'periodMonth'],
      _sum: { amount: true },
      where: {
        date: { gte: twelveMonthsAgo },
      },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    });
    const expenseByMonth = await prisma.expenseRecord.groupBy({
      by: ['periodYear', 'periodMonth'],
      _sum: { amount: true },
      where: {
        date: { gte: twelveMonthsAgo },
      },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    });

    // Build a map for expenses
    const expenseMap = new Map<string, number>();
    for (const e of expenseByMonth) {
      const key = `${e.periodYear}-${String(e.periodMonth).padStart(2, '0')}`;
      expenseMap.set(key, Number(e._sum.amount || 0));
    }

    const revenueByMonth = incomeByMonth.map((r) => {
      const key = `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`;
      return {
        month: key,
        revenue: Math.round(Number(r._sum.amount || 0) * 100) / 100,
        expenses: Math.round((expenseMap.get(key) || 0) * 100) / 100,
      };
    });

    // --- Bookings by source ---
    const bookingsBySourceRaw = await prisma.booking.groupBy({
      by: ['source'],
      _count: { id: true },
    });
    const bookingsBySource = bookingsBySourceRaw.map((b) => ({
      source: b.source,
      count: b._count.id,
    })).sort((a, b) => b.count - a.count);

    // --- Recent bookings ---
    const recentBookingsRaw = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { name: true } },
      },
    });
    const recentBookings = recentBookingsRaw.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      propertyName: b.property.name,
      checkIn: b.checkIn.toISOString().split('T')[0],
      checkOut: b.checkOut.toISOString().split('T')[0],
      totalAmount: Number(b.totalAmount),
      status: b.status,
      source: b.source,
    }));

    // --- Upcoming check-ins ---
    const upcomingCheckInsRaw = await prisma.booking.findMany({
      where: {
        checkIn: { gte: today },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      take: 5,
      orderBy: { checkIn: 'asc' },
      include: {
        property: { select: { name: true } },
      },
    });
    const upcomingCheckIns = upcomingCheckInsRaw.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      propertyName: b.property.name,
      checkIn: b.checkIn.toISOString().split('T')[0],
      checkOut: b.checkOut.toISOString().split('T')[0],
      nights: b.nights,
      guestsCount: b.guestsCount,
    }));

    // --- Property performance (top properties by revenue) ---
    const propertyRevenueRaw = await prisma.incomeRecord.groupBy({
      by: ['propertyId'],
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    const propertyIds = propertyRevenueRaw.map((p) => p.propertyId);
    const propertiesMap = new Map<string, { name: string; city: string }>();
    if (propertyIds.length > 0) {
      const props = await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, name: true, city: true },
      });
      for (const p of props) {
        propertiesMap.set(p.id, { name: p.name, city: p.city });
      }
    }

    // Get booking counts per property for occupancy
    const propertyBookingCounts = await prisma.booking.groupBy({
      by: ['propertyId'],
      _count: { id: true },
      where: { propertyId: { in: propertyIds } },
    });
    const bookingCountMap = new Map<string, number>();
    for (const bc of propertyBookingCounts) {
      bookingCountMap.set(bc.propertyId, bc._count.id);
    }

    const propertyPerformance = propertyRevenueRaw.map((p) => {
      const info = propertiesMap.get(p.propertyId) || { name: 'Unknown', city: '' };
      return {
        propertyId: p.propertyId,
        propertyName: info.name,
        city: info.city,
        revenue: Math.round(Number(p._sum.amount || 0) * 100) / 100,
        bookingsCount: bookingCountMap.get(p.propertyId) || 0,
        occupancyRate: 0, // would need per-property calculation
      };
    });

    return {
      kpis: {
        totalProperties,
        activeProperties,
        totalBookings,
        activeBookings,
        occupancyRate,
        totalRevenue: Math.round(Number(revenueAgg._sum.amount || 0) * 100) / 100,
        monthlyRevenue: Math.round(Number(monthlyRevenueAgg._sum.amount || 0) * 100) / 100,
        pendingPayments: Math.round(Number(pendingPaymentsAgg._sum.totalAmount || 0) * 100) / 100,
        totalGuests,
        averageRating,
        maintenanceOpen,
        totalOwners,
      },
      revenueByMonth,
      bookingsBySource,
      recentBookings,
      upcomingCheckIns,
      propertyPerformance,
      maintenanceStats: {
        open: maintenanceOpen,
        inProgress: maintenanceInProgress,
        completed: maintenanceCompleted,
        urgent: maintenanceUrgent,
      },
    };
  }

  // ── Owner Dashboard (Prisma-based, filtered by ownerId) ───────────────

  async getOwnerDashboard(ownerId: string): Promise<OwnerDashboardData> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get owner's properties
    const ownerProperties = await prisma.property.findMany({
      where: { ownerId, deletedAt: null },
      select: { id: true, name: true, city: true, status: true },
    });
    const propertyIds = ownerProperties.map((p) => p.id);
    const totalProperties = ownerProperties.length;
    const activeProperties = ownerProperties.filter((p) => p.status === 'ACTIVE').length;

    if (propertyIds.length === 0) {
      return {
        kpis: {
          totalProperties: 0,
          activeProperties: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          netIncome: 0,
          occupancyRate: 0,
          totalBookings: 0,
          activeBookings: 0,
          pendingApprovals: 0,
          averageRating: 0,
        },
        revenueByMonth: [],
        recentBookings: [],
        pendingExpenseApprovals: [],
        propertyPerformance: [],
        maintenanceStats: { open: 0, inProgress: 0, completed: 0, urgent: 0 },
      };
    }

    const [
      totalBookings,
      activeBookings,
      monthlyIncomeAgg,
      monthlyExpenseAgg,
      pendingApprovals,
      maintenanceOpen,
      maintenanceInProgress,
      maintenanceCompleted,
      maintenanceUrgent,
    ] = await Promise.all([
      prisma.booking.count({ where: { propertyId: { in: propertyIds } } }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: today },
          checkOut: { gte: today },
        },
      }),
      prisma.incomeRecord.aggregate({
        _sum: { amount: true },
        where: {
          ownerId,
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      }),
      prisma.expenseRecord.aggregate({
        _sum: { amount: true },
        where: {
          ownerId,
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      }),
      prisma.expenseRecord.count({
        where: {
          ownerId,
          approvalStatus: 'PENDING',
        },
      }),
      prisma.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, status: 'OPEN' } }),
      prisma.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, status: 'IN_PROGRESS' } }),
      prisma.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, status: 'COMPLETED' } }),
      prisma.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, priority: 'URGENT', status: { not: 'COMPLETED' } } }),
    ]);

    const monthlyIncome = Math.round(Number(monthlyIncomeAgg._sum.amount || 0) * 100) / 100;
    const monthlyExpenses = Math.round(Number(monthlyExpenseAgg._sum.amount || 0) * 100) / 100;
    const netIncome = Math.round((monthlyIncome - monthlyExpenses) * 100) / 100;

    // Occupancy rate
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalPossibleNights = activeProperties * daysInMonth;
    const occupiedBookings = await prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
        checkOut: { gt: startOfMonth },
      },
      select: { checkIn: true, checkOut: true },
    });
    let occupiedNights = 0;
    for (const b of occupiedBookings) {
      const start = b.checkIn > startOfMonth ? b.checkIn : startOfMonth;
      const end = b.checkOut < new Date(now.getFullYear(), now.getMonth() + 1, 1)
        ? b.checkOut
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      occupiedNights += diff;
    }
    const occupancyRate = totalPossibleNights > 0
      ? Math.round((occupiedNights / totalPossibleNights) * 100 * 10) / 10
      : 0;

    // Average property score
    const propertyScores = await prisma.property.aggregate({
      _avg: { propertyScore: true },
      where: { id: { in: propertyIds }, propertyScore: { not: null } },
    });
    const averageRating = propertyScores._avg.propertyScore
      ? Math.round(Number(propertyScores._avg.propertyScore) * 10) / 10
      : 0;

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    const incomeByMonth = await prisma.incomeRecord.groupBy({
      by: ['periodYear', 'periodMonth'],
      _sum: { amount: true },
      where: { ownerId, date: { gte: twelveMonthsAgo } },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    });
    const expenseByMonth = await prisma.expenseRecord.groupBy({
      by: ['periodYear', 'periodMonth'],
      _sum: { amount: true },
      where: { ownerId, date: { gte: twelveMonthsAgo } },
      orderBy: [{ periodYear: 'asc' }, { periodMonth: 'asc' }],
    });
    const expenseMap = new Map<string, number>();
    for (const e of expenseByMonth) {
      const key = `${e.periodYear}-${String(e.periodMonth).padStart(2, '0')}`;
      expenseMap.set(key, Number(e._sum.amount || 0));
    }
    const revenueByMonth = incomeByMonth.map((r) => {
      const key = `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`;
      return {
        month: key,
        revenue: Math.round(Number(r._sum.amount || 0) * 100) / 100,
        expenses: Math.round((expenseMap.get(key) || 0) * 100) / 100,
      };
    });

    // Recent bookings
    const recentBookingsRaw = await prisma.booking.findMany({
      where: { propertyId: { in: propertyIds } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { name: true } } },
    });
    const recentBookings = recentBookingsRaw.map((b) => ({
      id: b.id,
      guestName: b.guestName,
      propertyName: b.property.name,
      checkIn: b.checkIn.toISOString().split('T')[0],
      checkOut: b.checkOut.toISOString().split('T')[0],
      totalAmount: Number(b.totalAmount),
      status: b.status,
    }));

    // Pending expense approvals
    const pendingExpensesRaw = await prisma.expenseRecord.findMany({
      where: { ownerId, approvalStatus: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { name: true } } },
    });
    const pendingExpenseApprovals = pendingExpensesRaw.map((e) => ({
      id: e.id,
      title: e.description,
      description: `${e.category} - ${e.vendor || 'No vendor'}`,
      amount: Number(e.amount),
      category: e.category,
      propertyName: e.property?.name || 'General',
      createdAt: e.createdAt.toISOString(),
      urgency: Number(e.amount) > 500 ? 'high' : 'medium',
    }));

    // Property performance
    const propertyRevenueRaw = await prisma.incomeRecord.groupBy({
      by: ['propertyId'],
      _sum: { amount: true },
      where: { ownerId },
      orderBy: { _sum: { amount: 'desc' } },
    });
    const propBookingCounts = await prisma.booking.groupBy({
      by: ['propertyId'],
      _count: { id: true },
      where: { propertyId: { in: propertyIds } },
    });
    const bookingCountMap = new Map<string, number>();
    for (const bc of propBookingCounts) {
      bookingCountMap.set(bc.propertyId, bc._count.id);
    }
    const propNameMap = new Map<string, { name: string; city: string }>();
    for (const p of ownerProperties) {
      propNameMap.set(p.id, { name: p.name, city: p.city });
    }
    const propertyPerformance = propertyRevenueRaw.map((p) => {
      const info = propNameMap.get(p.propertyId) || { name: 'Unknown', city: '' };
      return {
        propertyId: p.propertyId,
        propertyName: info.name,
        city: info.city,
        revenue: Math.round(Number(p._sum.amount || 0) * 100) / 100,
        bookingsCount: bookingCountMap.get(p.propertyId) || 0,
        occupancyRate: 0,
      };
    });

    return {
      kpis: {
        totalProperties,
        activeProperties,
        monthlyIncome,
        monthlyExpenses,
        netIncome,
        occupancyRate,
        totalBookings,
        activeBookings,
        pendingApprovals,
        averageRating,
      },
      revenueByMonth,
      recentBookings,
      pendingExpenseApprovals,
      propertyPerformance,
      maintenanceStats: {
        open: maintenanceOpen,
        inProgress: maintenanceInProgress,
        completed: maintenanceCompleted,
        urgent: maintenanceUrgent,
      },
    };
  }

  // ── Comparison Report ─────────────────────────────────────────────────

  async getComparisonReport(
    propertyIds: string[],
    startDate?: string,
    endDate?: string,
  ): Promise<PropertyPerformance[]> {
    if (!propertyIds || propertyIds.length === 0) {
      throw ApiError.badRequest('At least one property ID is required', 'MISSING_PROPERTY_IDS');
    }

    if (propertyIds.length > 10) {
      throw ApiError.badRequest('Maximum 10 properties for comparison', 'TOO_MANY_PROPERTIES');
    }

    const performances = await this.getPropertyPerformance({
      startDate,
      endDate,
    });

    const filtered = performances.filter((p) => propertyIds.includes(p.propertyId));

    // Re-rank within the comparison set
    filtered.sort((a, b) => b.totalRevenue - a.totalRevenue);
    filtered.forEach((p, i) => {
      p.rank = i + 1;
    });

    return filtered;
  }

  // ── Seasonal Trends ───────────────────────────────────────────────────

  async getSeasonalTrends(propertyId?: string): Promise<SeasonalTrend[]> {
    let filtered = [...this.monthlyData];

    if (propertyId) {
      filtered = filtered.filter((d) => d.propertyId === propertyId);
    }

    const monthGroups = new Map<number, MonthlyPropertyData[]>();

    for (const entry of filtered) {
      if (!monthGroups.has(entry.month)) {
        monthGroups.set(entry.month, []);
      }
      monthGroups.get(entry.month)!.push(entry);
    }

    const results: SeasonalTrend[] = [];

    for (let m = 1; m <= 12; m++) {
      const entries = monthGroups.get(m) || [];
      if (entries.length === 0) {
        results.push({
          month: MONTHS[m - 1],
          avgOccupancy: 0,
          avgRate: 0,
          avgRevenue: 0,
        });
        continue;
      }

      results.push({
        month: MONTHS[m - 1],
        avgOccupancy: Math.round(entries.reduce((s, e) => s + e.occupancyRate, 0) / entries.length * 10) / 10,
        avgRate: Math.round(entries.reduce((s, e) => s + e.adr, 0) / entries.length),
        avgRevenue: Math.round(entries.reduce((s, e) => s + e.revenue, 0) / entries.length),
      });
    }

    return results;
  }

  // ── Export Report ──────────────────────────────────────────────────────

  async exportReport(filters: ExportFilters): Promise<{ data: any; format: string; type: string }> {
    let data: any;

    switch (filters.type) {
      case 'revenue':
        data = await this.getRevenueOverview({
          startDate: filters.startDate,
          endDate: filters.endDate,
          propertyId: filters.propertyId,
          ownerId: filters.ownerId,
        });
        break;
      case 'property':
        data = await this.getPropertyPerformance({
          startDate: filters.startDate,
          endDate: filters.endDate,
          ownerId: filters.ownerId,
        });
        break;
      case 'channel':
        data = await this.getChannelAnalytics({
          startDate: filters.startDate,
          endDate: filters.endDate,
          propertyId: filters.propertyId,
        });
        break;
      case 'owner':
        data = await this.getOwnerReports({
          startDate: filters.startDate,
          endDate: filters.endDate,
          ownerId: filters.ownerId,
        });
        break;
      default:
        throw ApiError.badRequest('Invalid report type', 'INVALID_REPORT_TYPE');
    }

    if (filters.format === 'csv') {
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        return { data: '', format: 'csv', type: filters.type };
      }
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(','),
        ...rows.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            if (typeof val === 'string' && val.includes(',')) {
              return `"${val}"`;
            }
            return val ?? '';
          }).join(','),
        ),
      ];
      return { data: csvLines.join('\n'), format: 'csv', type: filters.type };
    }

    return { data, format: 'json', type: filters.type };
  }
}

export const analyticsService = new AnalyticsService();
