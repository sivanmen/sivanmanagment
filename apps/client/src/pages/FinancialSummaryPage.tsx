import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Receipt,
  AlertTriangle,
  RefreshCcw,
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
import apiClient from '../lib/api-client';

type Period = 'this_month' | 'last_month' | 'this_year';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate?: number;
  incomeByCategory: { category: string; total: number; count: number }[];
  expensesByCategory: { category: string; total: number; count: number }[];
}

interface TrendPoint {
  month: number;
  year: number;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

interface PropertySummary {
  id: string;
  name: string;
  _count?: { bookings: number };
  baseNightlyRate: number;
}

function getPeriodParams(period: Period): { periodMonth?: number; periodYear?: number } {
  const now = new Date();
  if (period === 'this_month') {
    return { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() };
  }
  if (period === 'last_month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { periodMonth: d.getMonth() + 1, periodYear: d.getFullYear() };
  }
  // this_year: only year
  return { periodYear: now.getFullYear() };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function SkeletonKPI() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-surface-container-high rounded w-24" />
        <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-7 bg-surface-container-high rounded w-28 mb-1" />
      <div className="h-3 bg-surface-container-high rounded w-20" />
    </div>
  );
}

export default function FinancialSummaryPage() {
  const { t } = useTranslation();
  const [activePeriod, setActivePeriod] = useState<Period>('this_month');

  // Fetch financial summary
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorObj,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['finance-summary', activePeriod],
    queryFn: async () => {
      const params = getPeriodParams(activePeriod);
      const res = await apiClient.get('/api/v1/finance/summary', { params });
      return res.data.data as FinancialSummary;
    },
  });

  // Fetch monthly trend for the chart
  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['finance-trend'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/finance/trend', { params: { months: 12 } });
      return res.data.data as TrendPoint[];
    },
  });

  // Fetch properties for breakdown
  const { data: properties } = useQuery({
    queryKey: ['my-properties-for-finance'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/properties');
      return res.data.data as PropertySummary[];
    },
  });

  // Fetch recent transactions (income + expenses)
  const { data: recentIncome } = useQuery({
    queryKey: ['recent-income', activePeriod],
    queryFn: async () => {
      const params = getPeriodParams(activePeriod);
      const res = await apiClient.get('/api/v1/finance/income', {
        params: { ...params, limit: 10, sortBy: 'date', sortOrder: 'desc' },
      });
      return res.data.data as {
        id: string;
        date: string;
        description?: string;
        property?: { name: string };
        category: string;
        amount: number;
      }[];
    },
  });

  const { data: recentExpenses } = useQuery({
    queryKey: ['recent-expenses', activePeriod],
    queryFn: async () => {
      const params = getPeriodParams(activePeriod);
      const res = await apiClient.get('/api/v1/finance/expenses', {
        params: { ...params, limit: 10, sortBy: 'date', sortOrder: 'desc' },
      });
      return res.data.data as {
        id: string;
        date: string;
        description: string;
        property?: { name: string };
        category: string;
        amount: number;
      }[];
    },
  });

  // Build chart data from trend
  const chartData = (trend || []).map((t) => ({
    month: t.label || `${t.year}-${String(t.month).padStart(2, '0')}`,
    revenue: t.income,
    expenses: t.expenses,
  }));

  // Build recent transactions from income + expenses
  const recentTransactions = [
    ...(recentIncome || []).map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description || r.category,
      property: r.property?.name || '',
      type: 'income' as const,
      amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
    })),
    ...(recentExpenses || []).map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description || r.category,
      property: r.property?.name || '',
      type: 'expense' as const,
      amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Derived values
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const netIncome = summary?.netIncome ?? 0;
  const occupancyRate = summary?.occupancyRate ?? 0;

  // Management fee calculation from expenses by category
  const mgmtFee = summary?.expensesByCategory?.find((c) => c.category === 'MANAGEMENT_FEE');
  const managementFees = mgmtFee?.total ?? 0;

  // Property breakdown
  const propertyBreakdown = (properties || []).map((p) => ({
    name: p.name,
    bookings: p._count?.bookings || 0,
    grossIncome: 0, // would need per-property income call
    managementFee: 0,
    netIncome: 0,
  }));

  const periods: { key: Period; label: string }[] = [
    { key: 'this_month', label: t('financials.thisMonth') },
    { key: 'last_month', label: t('financials.lastMonth') },
    { key: 'this_year', label: t('financials.thisYear') },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('financials.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('financials.title')}
          </h1>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => setActivePeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activePeriod === period.key
                  ? 'gradient-accent text-on-secondary'
                  : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {summaryError && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-error flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-on-surface">Failed to load financial data</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {(summaryErrorObj as Error)?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => refetchSummary()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('financials.totalIncome')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {'\u20AC'}{totalIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('financials.managementFees')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-error" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {'\u20AC'}{totalExpenses.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-on-surface-variant">
                Mgmt: {'\u20AC'}{managementFees.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('financials.netIncome')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {'\u20AC'}{netIncome.toLocaleString()}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('financials.occupancyRate')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Percent className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {occupancyRate}%
            </p>
          </div>
        </div>
      )}

      {/* Revenue Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('financials.revenueChart')}
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-secondary" />
                <span className="text-on-surface-variant">{t('financials.revenue')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-error/40" />
                <span className="text-on-surface-variant">{t('financials.fees')}</span>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            {trendLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#46464c', fontSize: 11 }}
                    axisLine={{ stroke: '#e7e8e9' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#46464c', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => `\u20AC${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 24px 48px rgba(25, 28, 29, 0.06)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#6b38d4" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#ba1a1a40" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Income/Expense Category Breakdown */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('financials.managementInfo')}
            </h3>
          </div>

          <div className="flex-1 space-y-3">
            {summary?.incomeByCategory?.map((cat) => (
              <div key={cat.category} className="p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-on-surface-variant capitalize">
                    {cat.category.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <span className="text-sm font-semibold text-success">
                    +{'\u20AC'}{cat.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{cat.count} records</p>
              </div>
            ))}

            {summary?.expensesByCategory?.map((cat) => (
              <div key={cat.category} className="p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-on-surface-variant capitalize">
                    {cat.category.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <span className="text-sm font-semibold text-error">
                    -{'\u20AC'}{cat.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{cat.count} records</p>
              </div>
            ))}

            {!summaryLoading && !summary?.incomeByCategory?.length && !summary?.expensesByCategory?.length && (
              <div className="p-4 rounded-lg bg-surface-container-low text-center">
                <p className="text-sm text-on-surface-variant">No category data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Breakdown */}
      {propertyBreakdown.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('financials.propertyBreakdown')}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-container-high">
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('financials.property')}
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('financials.bookingsCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {propertyBreakdown.map((prop) => (
                  <tr
                    key={prop.name}
                    className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="text-sm font-medium text-on-surface">{prop.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-on-surface-variant">{prop.bookings}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('financials.recentTransactions')}
          </h3>
        </div>

        {recentTransactions.length === 0 && !summaryLoading ? (
          <div className="text-center py-8">
            <Receipt className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-2" />
            <p className="text-sm text-on-surface-variant">No transactions for this period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      txn.type === 'income' ? 'bg-success/10' : 'bg-error/10'
                    }`}
                  >
                    {txn.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-error" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">{txn.description}</p>
                    <p className="text-xs text-on-surface-variant">
                      {txn.property && <>{txn.property} &middot; </>}{formatDate(txn.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold flex-shrink-0 ml-3 ${
                    txn.type === 'income' ? 'text-success' : 'text-error'
                  }`}
                >
                  {txn.type === 'income' ? '+' : '-'}{'\u20AC'}{txn.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
