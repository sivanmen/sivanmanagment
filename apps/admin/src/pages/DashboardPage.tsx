import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  RefreshCw,
  ArrowRight,
  Building2,
  MapPin,
  CalendarCheck,
  Users,
  Wrench,
  Clock,
  CheckCircle,
  DollarSign,
  BarChart3,
  Home,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiClient from '../lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardKpis {
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
}

interface RevenueByMonth {
  month: string;
  revenue: number;
  expenses: number;
}

interface BookingsBySource {
  source: string;
  count: number;
}

interface RecentBooking {
  id: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
  source: string;
}

interface UpcomingCheckIn {
  id: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
}

interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  city: string;
  revenue: number;
  bookingsCount: number;
  occupancyRate: number;
}

interface MaintenanceStats {
  open: number;
  inProgress: number;
  completed: number;
  urgent: number;
}

interface DashboardData {
  kpis: DashboardKpis;
  revenueByMonth: RevenueByMonth[];
  bookingsBySource: BookingsBySource[];
  recentBookings: RecentBooking[];
  upcomingCheckIns: UpcomingCheckIn[];
  propertyPerformance: PropertyPerformance[];
  maintenanceStats: MaintenanceStats;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('en', { month: 'short' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SOURCE_COLORS: Record<string, string> = {
  AIRBNB: '#FF5A5F',
  BOOKING_COM: '#003580',
  DIRECT: '#6b38d4',
  VRBO: '#3B5998',
  ICAL: '#46464c',
  MANUAL: '#77767d',
  WIDGET: '#8455ef',
};

const SOURCE_LABELS: Record<string, string> = {
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  DIRECT: 'Direct',
  VRBO: 'VRBO',
  ICAL: 'iCal',
  MANUAL: 'Manual',
  WIDGET: 'Widget',
};

// ── Skeleton Components ──────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-surface-container-high rounded" />
        <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-7 w-20 bg-surface-container-high rounded mb-1" />
      <div className="h-3 w-16 bg-surface-container-high rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="h-5 w-36 bg-surface-container-high rounded mb-6" />
      <div className="h-64 bg-surface-container-high rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="h-5 w-36 bg-surface-container-high rounded mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 w-24 bg-surface-container-high rounded" />
          <div className="h-4 w-32 bg-surface-container-high rounded" />
          <div className="h-4 w-20 bg-surface-container-high rounded" />
          <div className="h-4 w-16 bg-surface-container-high rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  // ── Error State ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Failed to load dashboard
          </h2>
          <p className="text-sm text-on-surface-variant text-center max-w-md">
            {(error as any)?.message || 'An unexpected error occurred while loading the dashboard data.'}
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Loading State ────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
              {t('dashboard.title')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
              {t('dashboard.subtitle')}
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const { kpis, revenueByMonth, bookingsBySource, recentBookings, upcomingCheckIns, propertyPerformance, maintenanceStats } = data;

  // Build KPI cards from real data
  const kpiCards = [
    {
      key: 'totalProperties',
      label: 'Properties',
      value: `${kpis.activeProperties}/${kpis.totalProperties}`,
      sub: 'active / total',
      icon: Building2,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      key: 'totalRevenue',
      label: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      sub: `${formatCurrency(kpis.monthlyRevenue)} this month`,
      icon: DollarSign,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      key: 'occupancyRate',
      label: t('dashboard.occupancyRate'),
      value: `${kpis.occupancyRate}%`,
      sub: `${kpis.activeBookings} active bookings`,
      icon: BarChart3,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      key: 'pendingPayments',
      label: 'Pending Payments',
      value: formatCurrency(kpis.pendingPayments),
      sub: `${kpis.maintenanceOpen} open maintenance`,
      icon: Clock,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
  ];

  // Chart data
  const chartData = revenueByMonth.map((r) => ({
    month: formatMonthLabel(r.month),
    revenue: r.revenue,
    expenses: r.expenses,
  }));

  const avgRevenue = chartData.length > 0
    ? Math.round(chartData.reduce((s, c) => s + c.revenue, 0) / chartData.length)
    : 0;

  // Pie chart data
  const totalBookingsBySource = bookingsBySource.reduce((s, b) => s + b.count, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('dashboard.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('dashboard.subtitle')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-on-surface-variant">
              Last updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {card.label}
              </p>
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {card.value}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-on-surface-variant">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Bookings by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                {t('dashboard.revenueTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Monthly revenue vs expenses</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-secondary" />
                <span className="text-on-surface-variant">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-outline-variant" />
                <span className="text-on-surface-variant">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#46464c' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#46464c' }}
                    tickFormatter={(value) => `${formatCurrency(value)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 24px 48px rgba(25,28,29,0.06)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'revenue' ? 'Revenue' : 'Expenses',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#c7c5cd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                No revenue data available yet
              </div>
            )}
          </div>
        </div>

        {/* Bookings by Source */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              Bookings by Source
            </h3>
          </div>
          {bookingsBySource.length > 0 ? (
            <>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingsBySource}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                    >
                      {bookingsBySource.map((entry) => (
                        <Cell
                          key={entry.source}
                          fill={SOURCE_COLORS[entry.source] || '#77767d'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(20px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0px 24px 48px rgba(25,28,29,0.06)',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} bookings (${totalBookingsBySource > 0 ? Math.round((value / totalBookingsBySource) * 100) : 0}%)`,
                        SOURCE_LABELS[name] || name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {bookingsBySource.map((entry) => (
                  <div key={entry.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: SOURCE_COLORS[entry.source] || '#77767d' }}
                      />
                      <span className="text-xs text-on-surface-variant">
                        {SOURCE_LABELS[entry.source] || entry.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">{entry.count}</span>
                      <span className="text-[10px] text-on-surface-variant">
                        ({totalBookingsBySource > 0 ? Math.round((entry.count / totalBookingsBySource) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-on-surface-variant text-sm">
              No booking data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings + Upcoming Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-secondary" />
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                Recent Bookings
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-fixed text-secondary">
              {kpis.totalBookings} total
            </span>
          </div>
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface truncate">
                        {booking.guestName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{booking.propertyName}</span>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN'
                          ? 'bg-success/10 text-success'
                          : booking.status === 'CANCELLED'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {booking.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-on-surface-variant">
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              No bookings yet
            </div>
          )}
        </div>

        {/* Upcoming Check-ins */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-warning" />
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                Upcoming Check-ins
              </h3>
            </div>
          </div>
          {upcomingCheckIns.length > 0 ? (
            <div className="space-y-3">
              {upcomingCheckIns.map((checkin) => (
                <div
                  key={checkin.id}
                  className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface truncate">
                        {checkin.guestName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{checkin.propertyName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant flex-shrink-0 ml-2">
                      <Users className="w-3 h-3" />
                      <span>{checkin.guestsCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-on-surface-variant">
                      {formatDate(checkin.checkIn)} - {formatDate(checkin.checkOut)}
                    </span>
                    <span className="font-medium text-secondary">
                      {checkin.nights} nights
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              No upcoming check-ins
            </div>
          )}
        </div>
      </div>

      {/* Property Performance + Maintenance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Properties */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.topAssets')}
            </h3>
            <button className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors">
              <span>{t('dashboard.viewPortfolio')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {propertyPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">City</th>
                    <th className="text-right py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Revenue</th>
                    <th className="text-right py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyPerformance.slice(0, 5).map((prop) => (
                    <tr
                      key={prop.propertyId}
                      className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Home className="w-3.5 h-3.5 text-secondary" />
                          </div>
                          <span className="text-sm font-medium text-on-surface truncate max-w-[200px]">
                            {prop.propertyName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <MapPin className="w-3 h-3" />
                          <span>{prop.city}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-semibold text-on-surface">
                          {formatCurrency(prop.revenue)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-sm text-on-surface-variant">{prop.bookingsCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              No property data yet
            </div>
          )}
        </div>

        {/* Maintenance Stats */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              Maintenance
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error" />
                <span className="text-sm text-on-surface">Open</span>
              </div>
              <span className="text-lg font-headline font-bold text-on-surface">{maintenanceStats.open}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-sm text-on-surface">In Progress</span>
              </div>
              <span className="text-lg font-headline font-bold text-on-surface">{maintenanceStats.inProgress}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-on-surface">Completed</span>
              </div>
              <span className="text-lg font-headline font-bold text-on-surface">{maintenanceStats.completed}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="text-sm text-on-surface font-medium">Urgent</span>
              </div>
              <span className="text-lg font-headline font-bold text-error">{maintenanceStats.urgent}</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-surface-container-high">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Guests</p>
                <p className="text-lg font-headline font-bold text-on-surface">{kpis.totalGuests}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Owners</p>
                <p className="text-lg font-headline font-bold text-on-surface">{kpis.totalOwners}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
