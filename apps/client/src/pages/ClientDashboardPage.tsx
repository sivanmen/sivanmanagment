import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  AlertTriangle,
  CalendarCheck,
  MapPin,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  RefreshCw,
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
} from 'recharts';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

interface OwnerDashboardKpis {
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
}

interface RevenueByMonth {
  month: string;
  revenue: number;
  expenses: number;
}

interface RecentBooking {
  id: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
}

interface PendingExpenseApproval {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  propertyName: string;
  createdAt: string;
  urgency: string;
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

interface OwnerDashboardData {
  kpis: OwnerDashboardKpis;
  revenueByMonth: RevenueByMonth[];
  recentBookings: RecentBooking[];
  pendingExpenseApprovals: PendingExpenseApproval[];
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

function daysAgo(dateStr: string): number {
  const now = new Date();
  const date = new Date(dateStr);
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

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

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="h-5 w-36 bg-surface-container-high rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-container-high rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const firstName = user?.firstName || 'Owner';
  const ownerId = user?.owner?.id;

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery<OwnerDashboardData>({
    queryKey: ['owner-dashboard', ownerId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (ownerId) params.ownerId = ownerId;
      const res = await apiClient.get('/analytics/owner-dashboard', { params });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled: true,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-dashboard', ownerId] });
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
            {(error as any)?.message || 'An unexpected error occurred while loading your dashboard data.'}
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
              {t('dashboard.welcomeBack')}, {firstName}
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <div className="lg:col-span-2"><CardSkeleton /></div>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const { kpis, revenueByMonth, recentBookings, pendingExpenseApprovals, propertyPerformance, maintenanceStats } = data;

  // Build KPI cards from real data
  const kpiCards = [
    {
      key: 'monthlyIncome',
      label: t('dashboard.monthlyIncome'),
      value: formatCurrency(kpis.monthlyIncome),
      sub: `${kpis.totalBookings} total bookings`,
      icon: DollarSign,
      trend: 'up' as const,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      key: 'monthlyExpenses',
      label: t('dashboard.monthlyExpenses'),
      value: formatCurrency(kpis.monthlyExpenses),
      sub: `${kpis.pendingApprovals} pending approvals`,
      icon: TrendingDown,
      trend: 'down' as const,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
    {
      key: 'netIncome',
      label: t('dashboard.netIncome'),
      value: formatCurrency(kpis.netIncome),
      sub: `${kpis.activeProperties}/${kpis.totalProperties} properties active`,
      icon: TrendingUp,
      trend: kpis.netIncome >= 0 ? 'up' as const : 'down' as const,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      key: 'occupancyRate',
      label: t('dashboard.occupancyRate'),
      value: `${kpis.occupancyRate}%`,
      sub: `${kpis.activeBookings} active bookings`,
      icon: BarChart3,
      trend: 'up' as const,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  // Chart data
  const chartData = revenueByMonth.map((r) => ({
    month: formatMonthLabel(r.month),
    revenue: r.revenue,
    expenses: r.expenses,
  }));

  // Property score (from average rating)
  const propertyScore = kpis.averageRating > 0 ? Math.round(kpis.averageRating * 10) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('dashboard.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('dashboard.welcomeBack')}, {firstName}
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
          {/* Loyalty Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-fixed ambient-shadow">
            <Award className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-[10px] text-secondary/70 uppercase tracking-wider font-semibold">{t('dashboard.loyaltyTier')}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-headline font-bold text-secondary">
                  {kpis.totalProperties >= 5 ? 'Platinum' : kpis.totalProperties >= 3 ? 'Gold' : 'Silver'}
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < Math.min(5, kpis.totalProperties) ? 'text-warning fill-warning' : 'text-outline-variant'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
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

      {/* Property Score + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property Score */}
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            {t('dashboard.propertyScore')}
          </p>
          {/* Score gauge */}
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e7e8e9"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(propertyScore / 100) * 314} 314`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6b38d4" />
                  <stop offset="100%" stopColor="#8455ef" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-4xl font-bold text-on-surface">{propertyScore}</span>
              <span className="text-xs text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${propertyScore >= 70 ? 'bg-success' : propertyScore >= 40 ? 'bg-warning' : 'bg-error'}`} />
            <span className="text-sm text-on-surface-variant">
              {propertyScore >= 70 ? 'Excellent Standing' : propertyScore >= 40 ? 'Good Standing' : 'Needs Attention'}
            </span>
          </div>
          {/* Maintenance mini-stats */}
          <div className="mt-4 pt-4 border-t border-surface-container-high w-full">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Maintenance</p>
                <p className="text-sm font-bold text-on-surface">{maintenanceStats.open} open</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Urgent</p>
                <p className={`text-sm font-bold ${maintenanceStats.urgent > 0 ? 'text-error' : 'text-success'}`}>
                  {maintenanceStats.urgent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.pendingApprovals')}
            </h3>
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning">
              {pendingExpenseApprovals.length} pending
            </span>
          </div>
          {pendingExpenseApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingExpenseApprovals.map((item) => {
                const itemDaysAgo = daysAgo(item.createdAt);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-on-surface">{item.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {item.description} - {item.propertyName}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.urgency === 'high'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span className="font-semibold text-on-surface">{formatCurrency(item.amount)}</span>
                        <span>{itemDaysAgo} day{itemDaysAgo !== 1 ? 's' : ''} ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-error bg-error/5 hover:bg-error/10 transition-colors">
                          Decline
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity">
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-on-surface-variant">
              No pending approvals - you're all caught up!
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueByMonth.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                {t('dashboard.revenueTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Monthly income vs expenses</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-secondary" />
                <span className="text-on-surface-variant">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-outline-variant" />
                <span className="text-on-surface-variant">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-52">
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
                  tickFormatter={(value) => formatCurrency(value)}
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
                    name === 'revenue' ? 'Income' : 'Expenses',
                  ]}
                />
                <Bar dataKey="revenue" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#c7c5cd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.recentBookings')}
            </h3>
          </div>
          <button className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-container-high">
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Guest</th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Property</th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Check-in</th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Check-out</th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-on-surface-variant" />
                        </div>
                        <span className="text-sm text-on-surface font-medium">{booking.guestName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <MapPin className="w-3 h-3" />
                        <span>{booking.propertyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className="text-xs text-on-surface-variant">{formatDate(booking.checkIn)}</span>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className="text-xs text-on-surface-variant">{formatDate(booking.checkOut)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-semibold text-on-surface">{formatCurrency(booking.totalAmount)}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-on-surface-variant">
            No bookings yet
          </div>
        )}
      </div>

      {/* Property Performance */}
      {propertyPerformance.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.topAssets')}
            </h3>
            <button className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors">
              <span>{t('dashboard.viewPortfolio')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {propertyPerformance.map((prop) => (
              <div
                key={prop.propertyId}
                className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Home className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate">{prop.propertyName}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{prop.city}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Revenue</p>
                    <p className="text-sm font-semibold text-on-surface">{formatCurrency(prop.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Bookings</p>
                    <p className="text-sm font-semibold text-secondary">{prop.bookingsCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
