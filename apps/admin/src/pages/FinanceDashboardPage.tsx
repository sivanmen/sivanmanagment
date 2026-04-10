import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  ChevronDown,
  ArrowRight,
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

const revenueVsExpensesData = [
  { month: 'Apr', income: 18200, expenses: 6800 },
  { month: 'May', income: 21400, expenses: 7200 },
  { month: 'Jun', income: 28600, expenses: 8100 },
  { month: 'Jul', income: 34200, expenses: 9400 },
  { month: 'Aug', income: 38500, expenses: 10200 },
  { month: 'Sep', income: 31800, expenses: 8600 },
  { month: 'Oct', income: 24600, expenses: 7900 },
  { month: 'Nov', income: 19800, expenses: 7100 },
  { month: 'Dec', income: 16400, expenses: 6200 },
  { month: 'Jan', income: 14200, expenses: 5800 },
  { month: 'Feb', income: 15600, expenses: 6100 },
  { month: 'Mar', income: 22400, expenses: 7500 },
];

const incomeBreakdown = [
  { name: 'Rental Income', value: 68, color: '#6b38d4' },
  { name: 'Cleaning Fee', value: 14, color: '#2e7d32' },
  { name: 'Extra Services', value: 9, color: '#ed6c02' },
  { name: 'Late Fees', value: 5, color: '#ba1a1a' },
  { name: 'Other', value: 4, color: '#77767d' },
];

const expenseBreakdown = [
  { name: 'Maintenance', value: 32, color: '#6b38d4' },
  { name: 'Utilities', value: 24, color: '#2e7d32' },
  { name: 'Cleaning', value: 22, color: '#ed6c02' },
  { name: 'Insurance', value: 13, color: '#ba1a1a' },
  { name: 'Supplies', value: 9, color: '#77767d' },
];

const topProperties = [
  { name: 'Santorini Sunset Villa', income: 12400, expenses: 3200, net: 9200, fee: 1240 },
  { name: 'Athens Central Loft', income: 8600, expenses: 2100, net: 6500, fee: 860 },
  { name: 'Mykonos Beach House', income: 9800, expenses: 2800, net: 7000, fee: 980 },
  { name: 'Crete Harbor Suite', income: 6200, expenses: 1900, net: 4300, fee: 620 },
  { name: 'Rhodes Old Town Apt', income: 5400, expenses: 1500, net: 3900, fee: 540 },
];

export default function FinanceDashboardPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodKey>('this_month');

  const summaryCards = [
    {
      label: t('finance.income'),
      value: '\u20AC42,400',
      change: '+8.3%',
      trend: 'up' as const,
      color: 'bg-success/10',
      iconColor: 'text-success',
      icon: TrendingUp,
    },
    {
      label: t('finance.expenses'),
      value: '\u20AC11,500',
      change: '+2.1%',
      trend: 'up' as const,
      color: 'bg-error/10',
      iconColor: 'text-error',
      icon: TrendingDown,
    },
    {
      label: t('finance.netIncome'),
      value: '\u20AC30,900',
      change: '+11.2%',
      trend: 'up' as const,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
      icon: DollarSign,
    },
    {
      label: t('finance.managementFees'),
      value: '\u20AC4,240',
      change: '+5.6%',
      trend: 'up' as const,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
      icon: Wallet,
    },
  ];

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

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income Breakdown */}
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

        {/* Expense Breakdown */}
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
      </div>

      {/* Top Performing Properties */}
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
                    {'\u20AC'}{prop.income.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-error font-medium">
                    {'\u20AC'}{prop.expenses.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-on-surface font-semibold">
                    {'\u20AC'}{prop.net.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-secondary font-medium">
                    {'\u20AC'}{prop.fee.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
