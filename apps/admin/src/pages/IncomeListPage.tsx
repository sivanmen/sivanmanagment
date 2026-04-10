import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import apiClient from '../lib/api-client';

interface IncomeRecord {
  id: string;
  date: string;
  propertyName: string;
  propertyId: string;
  category: string;
  description: string;
  amount: number;
  bookingRef?: string;
}

const incomeCategories = [
  'All',
  'RENTAL',
  'CLEANING_FEE',
  'EXTRA_SERVICES',
  'LATE_FEE',
  'DAMAGE_DEPOSIT',
  'OTHER',
] as const;

const categoryLabels: Record<string, string> = {
  RENTAL: 'Rental',
  CLEANING_FEE: 'Cleaning Fee',
  EXTRA_SERVICES: 'Extra Services',
  LATE_FEE: 'Late Fee',
  DAMAGE_DEPOSIT: 'Damage Deposit',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  RENTAL: 'bg-secondary/10 text-secondary',
  CLEANING_FEE: 'bg-success/10 text-success',
  EXTRA_SERVICES: 'bg-warning/10 text-warning',
  LATE_FEE: 'bg-error/10 text-error',
  DAMAGE_DEPOSIT: 'bg-outline-variant/20 text-on-surface-variant',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const demoProperties = ['All', 'Santorini Sunset Villa', 'Athens Central Loft', 'Mykonos Beach House', 'Crete Harbor Suite', 'Rhodes Old Town Apt'];

const demoIncome: IncomeRecord[] = [
  { id: '1', date: '2026-04-08', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'RENTAL', description: 'Booking #BK-2204 - 5 nights', amount: 1250, bookingRef: 'BK-2204' },
  { id: '2', date: '2026-04-07', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'RENTAL', description: 'Booking #BK-2203 - 3 nights', amount: 540, bookingRef: 'BK-2203' },
  { id: '3', date: '2026-04-06', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'CLEANING_FEE', description: 'Cleaning fee for BK-2204', amount: 80 },
  { id: '4', date: '2026-04-05', propertyName: 'Mykonos Beach House', propertyId: 'p3', category: 'RENTAL', description: 'Booking #BK-2201 - 7 nights', amount: 2100, bookingRef: 'BK-2201' },
  { id: '5', date: '2026-04-04', propertyName: 'Mykonos Beach House', propertyId: 'p3', category: 'EXTRA_SERVICES', description: 'Airport transfer + welcome basket', amount: 120 },
  { id: '6', date: '2026-04-03', propertyName: 'Crete Harbor Suite', propertyId: 'p4', category: 'RENTAL', description: 'Booking #BK-2199 - 4 nights', amount: 680, bookingRef: 'BK-2199' },
  { id: '7', date: '2026-04-02', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'LATE_FEE', description: 'Late checkout fee - guest request', amount: 45 },
  { id: '8', date: '2026-04-01', propertyName: 'Rhodes Old Town Apt', propertyId: 'p5', category: 'RENTAL', description: 'Booking #BK-2197 - 6 nights', amount: 960, bookingRef: 'BK-2197' },
  { id: '9', date: '2026-03-30', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'DAMAGE_DEPOSIT', description: 'Security deposit retained - broken lamp', amount: 75 },
  { id: '10', date: '2026-03-28', propertyName: 'Crete Harbor Suite', propertyId: 'p4', category: 'CLEANING_FEE', description: 'Deep cleaning after long-term guest', amount: 120 },
  { id: '11', date: '2026-03-26', propertyName: 'Mykonos Beach House', propertyId: 'p3', category: 'RENTAL', description: 'Booking #BK-2195 - 3 nights', amount: 900, bookingRef: 'BK-2195' },
  { id: '12', date: '2026-03-24', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'OTHER', description: 'Vending machine revenue share', amount: 35 },
];

const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const years = ['2026', '2025', '2024'];

export default function IncomeListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('2026');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // In production, this would call the API. For now, we filter demo data.
  const filtered = demoIncome.filter((rec) => {
    if (propertyFilter !== 'All' && rec.propertyName !== propertyFilter) return false;
    if (categoryFilter !== 'All' && rec.category !== categoryFilter) return false;
    if (search && !rec.description.toLowerCase().includes(search.toLowerCase()) && !rec.propertyName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalIncome = filtered.reduce((sum, r) => sum + r.amount, 0);

  const categoryBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
      return acc;
    }, {}),
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('finance.income')} Records
          </h1>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all">
          <Plus className="w-4 h-4" />
          <span>{t('finance.addIncome')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search income records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {demoProperties.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'All Properties' : p}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {incomeCategories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : categoryLabels[c] ?? c}
            </option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m === 'All' ? 'All Months' : m}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-surface-container-lowest rounded-xl px-5 py-3 ambient-shadow flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total This Period
            </p>
            <p className="font-headline text-lg font-bold text-on-surface">
              {'\u20AC'}{totalIncome.toLocaleString()}
            </p>
          </div>
        </div>
        {categoryBreakdown.map(([cat, amount]) => (
          <span
            key={cat}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoryColors[cat] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
          >
            {categoryLabels[cat] ?? cat}: {'\u20AC'}{amount.toLocaleString()}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Date
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Property
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.category')}
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Description
                </th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.amount')}
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Booking Ref
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-on-surface-variant">{rec.date}</td>
                  <td className="py-3 px-4 text-sm font-medium text-on-surface">
                    {rec.propertyName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryColors[rec.category] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                    >
                      {categoryLabels[rec.category] ?? rec.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">{rec.description}</td>
                  <td className="py-3 px-4 text-sm text-end font-semibold text-success">
                    {'\u20AC'}{rec.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {rec.bookingRef ? (
                      <Link
                        to={`/bookings`}
                        className="inline-flex items-center gap-1 text-xs text-secondary font-medium hover:text-secondary-container transition-colors"
                      >
                        {rec.bookingRef}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-on-surface-variant">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'gradient-accent text-white'
                  : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
