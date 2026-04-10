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
import api from '../lib/api-client';

type Period = 'this_month' | 'last_month' | 'this_year' | 'custom';

interface PropertyBreakdown {
  name: string;
  bookings: number;
  grossIncome: number;
  managementFee: number;
  netIncome: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  property: string;
  type: 'income' | 'expense';
  amount: number;
}

interface FinancialData {
  totalIncome: number;
  managementFees: number;
  netIncome: number;
  occupancyRate: number;
  incomeChange: number;
  feeChange: number;
  netChange: number;
  occupancyChange: number;
  monthlyRevenue: { month: string; revenue: number; expenses: number }[];
  propertyBreakdown: PropertyBreakdown[];
  recentTransactions: Transaction[];
  managementFeePercent: number;
  minimumMonthlyFee: number;
}

const demoData: FinancialData = {
  totalIncome: 14280,
  managementFees: 2142,
  netIncome: 12138,
  occupancyRate: 87.3,
  incomeChange: 8.4,
  feeChange: 8.4,
  netChange: 8.4,
  occupancyChange: 3.1,
  monthlyRevenue: [
    { month: 'Jul', revenue: 9800, expenses: 1470 },
    { month: 'Aug', revenue: 12400, expenses: 1860 },
    { month: 'Sep', revenue: 10200, expenses: 1530 },
    { month: 'Oct', revenue: 8600, expenses: 1290 },
    { month: 'Nov', revenue: 5400, expenses: 810 },
    { month: 'Dec', revenue: 6200, expenses: 930 },
    { month: 'Jan', revenue: 4800, expenses: 720 },
    { month: 'Feb', revenue: 5600, expenses: 840 },
    { month: 'Mar', revenue: 8400, expenses: 1260 },
    { month: 'Apr', revenue: 14280, expenses: 2142 },
    { month: 'May', revenue: 0, expenses: 0 },
    { month: 'Jun', revenue: 0, expenses: 0 },
  ],
  propertyBreakdown: [
    {
      name: 'Aegean Sunset Villa',
      bookings: 8,
      grossIncome: 6720,
      managementFee: 1008,
      netIncome: 5712,
    },
    {
      name: 'Heraklion Harbor Suite',
      bookings: 6,
      grossIncome: 3600,
      managementFee: 540,
      netIncome: 3060,
    },
    {
      name: 'Chania Old Town Residence',
      bookings: 5,
      grossIncome: 3200,
      managementFee: 480,
      netIncome: 2720,
    },
    {
      name: 'Rethymno Beachfront Studio',
      bookings: 3,
      grossIncome: 760,
      managementFee: 114,
      netIncome: 646,
    },
  ],
  recentTransactions: [
    {
      id: 'TXN-001',
      date: '2026-04-10',
      description: 'Booking BK-2026-1201 - Marcus Lindqvist',
      property: 'Aegean Sunset Villa',
      type: 'income',
      amount: 1960,
    },
    {
      id: 'TXN-002',
      date: '2026-04-09',
      description: 'Management Fee - April',
      property: 'Aegean Sunset Villa',
      type: 'expense',
      amount: 294,
    },
    {
      id: 'TXN-003',
      date: '2026-04-08',
      description: 'Booking BK-2026-1198 - Elena Papadopoulos',
      property: 'Heraklion Harbor Suite',
      type: 'income',
      amount: 600,
    },
    {
      id: 'TXN-004',
      date: '2026-04-07',
      description: 'Cleaning Service',
      property: 'Heraklion Harbor Suite',
      type: 'expense',
      amount: 80,
    },
    {
      id: 'TXN-005',
      date: '2026-04-06',
      description: 'Booking BK-2026-1195 - Hans Weber',
      property: 'Chania Old Town Residence',
      type: 'income',
      amount: 1400,
    },
    {
      id: 'TXN-006',
      date: '2026-04-05',
      description: 'Management Fee - March',
      property: 'Chania Old Town Residence',
      type: 'expense',
      amount: 210,
    },
    {
      id: 'TXN-007',
      date: '2026-04-04',
      description: 'Maintenance - Plumbing Repair',
      property: 'Rethymno Beachfront Studio',
      type: 'expense',
      amount: 320,
    },
    {
      id: 'TXN-008',
      date: '2026-04-03',
      description: 'Booking BK-2026-1185 - James Richardson',
      property: 'Rethymno Beachfront Studio',
      type: 'income',
      amount: 630,
    },
    {
      id: 'TXN-009',
      date: '2026-04-02',
      description: 'Utility Payment - Water',
      property: 'Aegean Sunset Villa',
      type: 'expense',
      amount: 145,
    },
    {
      id: 'TXN-010',
      date: '2026-04-01',
      description: 'Booking BK-2026-1180 - Anna Kowalski',
      property: 'Heraklion Harbor Suite',
      type: 'income',
      amount: 750,
    },
  ],
  managementFeePercent: 15,
  minimumMonthlyFee: 250,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export default function FinancialSummaryPage() {
  const { t } = useTranslation();
  const [activePeriod, setActivePeriod] = useState<Period>('this_month');

  const { data: financials } = useQuery({
    queryKey: ['financials', activePeriod],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/financials', { params: { period: activePeriod } });
        return res.data.data as FinancialData;
      } catch {
        return demoData;
      }
    },
    initialData: demoData,
  });

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

      {/* Summary Cards */}
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
            {'\u20AC'}{financials.totalIncome.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-success">+{financials.incomeChange}%</span>
            <span className="text-xs text-on-surface-variant">vs last month</span>
          </div>
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
            {'\u20AC'}{financials.managementFees.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-error">+{financials.feeChange}%</span>
            <span className="text-xs text-on-surface-variant">vs last month</span>
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
            {'\u20AC'}{financials.netIncome.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-success">+{financials.netChange}%</span>
            <span className="text-xs text-on-surface-variant">vs last month</span>
          </div>
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
            {financials.occupancyRate}%
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-success">+{financials.occupancyChange}%</span>
            <span className="text-xs text-on-surface-variant">vs last month</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart + Management Fee Info */}
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financials.monthlyRevenue} barGap={2}>
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
                <Bar dataKey="expenses" fill="#ba1a1a40" radius={[4, 4, 0, 0]} name="Fees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Management Fee Info */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('financials.managementInfo')}
            </h3>
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-4 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                {t('financials.feePercentage')}
              </p>
              <p className="font-headline text-2xl font-bold text-secondary">
                {financials.managementFeePercent}%
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {t('financials.feeDescription')}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                {t('financials.minimumFee')}
              </p>
              <p className="font-headline text-2xl font-bold text-on-surface">
                {'\u20AC'}{financials.minimumMonthlyFee}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {t('financials.minimumFeeDescription')}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-success/5 border border-success/10">
              <p className="text-xs font-medium text-success">
                {t('financials.feeNote')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Breakdown */}
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
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('financials.grossIncome')}
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('financials.mgmtFee')}
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('financials.netLabel')}
                </th>
              </tr>
            </thead>
            <tbody>
              {financials.propertyBreakdown.map((prop) => (
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
                  <td className="py-3 px-3">
                    <span className="text-sm font-semibold text-on-surface">
                      {'\u20AC'}{prop.grossIncome.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-error">
                      -{'\u20AC'}{prop.managementFee.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm font-semibold text-success">
                      {'\u20AC'}{prop.netIncome.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-surface-container-low/50">
                <td className="py-3 px-3">
                  <span className="text-sm font-bold text-on-surface">{t('financials.total')}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm font-semibold text-on-surface">
                    {financials.propertyBreakdown.reduce((s, p) => s + p.bookings, 0)}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm font-bold text-on-surface">
                    {'\u20AC'}{financials.propertyBreakdown.reduce((s, p) => s + p.grossIncome, 0).toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm font-bold text-error">
                    -{'\u20AC'}{financials.propertyBreakdown.reduce((s, p) => s + p.managementFee, 0).toLocaleString()}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm font-bold text-success">
                    {'\u20AC'}{financials.propertyBreakdown.reduce((s, p) => s + p.netIncome, 0).toLocaleString()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('financials.recentTransactions')}
          </h3>
        </div>

        <div className="space-y-2">
          {financials.recentTransactions.map((txn) => (
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
                    {txn.property} &middot; {formatDate(txn.date)}
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
      </div>
    </div>
  );
}
