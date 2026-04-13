import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowRight,
  Loader2,
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

type PeriodKey = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

const periodLabels: Record<PeriodKey, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
  custom: 'Custom',
};

function periodToDateRange(period: PeriodKey) {
  const now = new Date();
  let startDate: string;
  let endDate: string = now.toISOString().split('T')[0];

  switch (period) {
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      break;
    case 'this_quarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), qStart, 1).toISOString().split('T')[0];
      break;
    }
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
    default:
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  }

  return { startDate, endDate, period };
}

const PIE_COLORS = ['#6b38d4', '#2e7d32', '#ed6c02', '#ba1a1a', '#77767d'];

export default function FinanceDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodKey>('this_month');

  const dateRange = periodToDateRange(period);

  // Fetch finance summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary', period],
    queryFn: async () => {
      const res = await apiClient.get('/finance/summary', { params: dateRange });
      return res.data.data;
    },
  });

  // Fetch income data (for chart / breakdown)
  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['finance-income', period],
    queryFn: async () => {
      const res = await apiClient.get('/finance/income', { params: dateRange });
      return res.data.data;
    },
  });

  // Fetch expense stats
  const { data: expenseStats, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense-stats', period],
    queryFn: async () => {
      const res = await apiClient.get('/expenses/stats', { params: dateRange });
      return res.data.data;
    },
  });

  const isLoading = summaryLoading || incomeLoading || expenseLoading;

  // Build summary cards from API data
  const summary = summaryData ?? {};
  const summaryCards = [
    {
      label: t('finance.income'),
      value: summary.totalIncome != null ? `\u20AC${Number(summary.totalIncome).toLocaleString()}` : '--',
      change: summary.incomeChange ?? '--',
      trend: 'up' as const,
      color: 'bg-success/10',
      iconColor: 'text-success',
      icon: TrendingUp,
    },
    {
      label: t('finance.expenses'),
      value: summary.totalExpenses != null ? `\u20AC${Number(summary.totalExpenses).toLocaleString()}` : '--',
      change: summary.expenseChange ?? '--',
      trend: 'up' as const,
      color: 'bg-error/10',
      iconColor: 'text-error',
      icon: TrendingDown,
    },
    {
      label: t('finance.netIncome'),
      value: summary.netIncome != null ? `\u20AC${Number(summary.netIncome).toLocaleString()}` : '--',
      change: summary.netIncomeChange ?? '--',
      trend: 'up' as const,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
      icon: DollarSign,
    },
    {
      label: t('finance.managementFees'),
      value: summary.managementFees != null ? `\u20AC${Number(summary.managementFees).toLocaleString()}` : '--',
      change: summary.feesChange ?? '--',
      trend: 'up' as const,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
      icon: Wallet,
    },
  ];

  // Revenue vs Expenses chart data from API
  const revenueVsExpensesData: { month: string; income: number; expenses: number }[] =
    summary.monthlyChart ?? [];

  // Income breakdown from API
  const incomeBreakdown: { name: string; value: number; color: string }[] =
    (incomeData?.breakdown ?? []).map((item: { name: string; value: number }, idx: number) => ({
      ...item,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));

  // Expense breakdown from API
  const expenseBreakdown: { name: string; value: number; color: string }[] =
    (expenseStats?.breakdown ?? []).map((item: { name: string; value: number }, idx: number) => ({
      ...item,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));

  // Top performing properties from API
  const topProperties: { name: string; income: number; expenses: number; net: number; fee: number }[] =
    summary.topProperties ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('finance.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          >
            {Object.entries(periodLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
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
                <p className="font-headline text-2xl font-bold text-on-surface mb-1">{card.value}</p>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-medium ${card.trend === 'up' ? 'text-success' : 'text-error'}`}
                  >
                    {card.change}
                  </span>
                  <span className="text-xs text-on-surface-variant">vs last period</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses Chart */}
          {revenueVsExpensesData.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">
                    {t('finance.income')} vs {t('finance.expenses')}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Last 12 months</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-success" />
                    <span className="text-on-surface-variant">{t('finance.income')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-error" />
                    <span className="text-on-surface-variant">{t('finance.expenses')}</span>
                  </div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueVsExpensesData} barCategoryGap="20%">
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
                      tickFormatter={(value) => `\u20AC${(value / 1000).toFixed(0)}k`}
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
                      formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, '']}
                    />
                    <Bar dataKey="income" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income Breakdown */}
            {incomeBreakdown.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                  {t('finance.income')} Breakdown
                </h3>
                <div className="flex items-center gap-6">
                  <div className="h-48 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {incomeBreakdown.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
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
                          formatter={(value: number) => [`${value}%`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {incomeBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-on-surface">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expense Breakdown */}
            {expenseBreakdown.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                  {t('finance.expenses')} Breakdown
                </h3>
                <div className="flex items-center gap-6">
                  <div className="h-48 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
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
                          formatter={(value: number) => [`${value}%`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {expenseBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-on-surface">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Performing Properties */}
          {topProperties.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-lg font-semibold text-on-surface">
                  Top Performing Properties
                </h3>
                <Link
                  to="/properties"
                  className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        Property
                      </th>
                      <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t('finance.income')}
                      </th>
                      <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t('finance.expenses')}
                      </th>
                      <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t('finance.netIncome')}
                      </th>
                      <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {t('finance.managementFees')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProperties.map((prop) => (
                      <tr
                        key={prop.name}
                        className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-on-surface">{prop.name}</td>
                        <td className="py-3 px-4 text-sm text-end text-success font-medium">
                          {'\u20AC'}{Number(prop.income).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-end text-error font-medium">
                          {'\u20AC'}{Number(prop.expenses).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-end text-on-surface font-semibold">
                          {'\u20AC'}{Number(prop.net).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-end text-secondary font-medium">
                          {'\u20AC'}{Number(prop.fee).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
