import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  Star,
  RefreshCw,
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
  LineChart,
  Line,
} from 'recharts';
import apiClient from '../lib/api-client';

interface PortfolioProperty {
  id: string;
  name: string;
  location: string;
  score: number;
  occupancy: number;
  monthlyIncome: number;
  trend: number[];
  value: number;
}

interface PortfolioOverview {
  totalValue: number;
  totalIncome: number;
  avgOccupancy: number;
  netYield: number;
  propertyCount: number;
  owners: string[];
  portfolioTrend: { month: string; value: number }[];
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-warning';
  return 'text-error';
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-success/10';
  if (score >= 70) return 'bg-warning/10';
  return 'bg-error/10';
}

export default function PortfolioPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedOwner, setSelectedOwner] = useState('All Owners');

  // ── API Queries ──────────────────────────────────────────────
  const { data: overview, isLoading: overviewLoading, isError: overviewError, error: overviewErr } = useQuery<PortfolioOverview>({
    queryKey: ['portfolio-overview', selectedOwner],
    queryFn: async () => {
      const params = selectedOwner !== 'All Owners' ? { owner: selectedOwner } : {};
      const res = await apiClient.get('/portfolio/overview', { params });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<PortfolioProperty[]>({
    queryKey: ['portfolio-properties', selectedOwner],
    queryFn: async () => {
      const params = selectedOwner !== 'All Owners' ? { owner: selectedOwner } : {};
      const res = await apiClient.get('/portfolio/properties', { params });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = overviewLoading || propertiesLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio-overview'] });
    queryClient.invalidateQueries({ queryKey: ['portfolio-properties'] });
  };

  const owners = overview?.owners ?? ['All Owners'];
  const propertiesList = properties ?? [];

  const totalValue = overview?.totalValue ?? 0;
  const totalIncome = overview?.totalIncome ?? 0;
  const avgOccupancy = overview?.avgOccupancy ?? 0;
  const netYield = overview?.netYield ?? 0;

  const comparisonData = propertiesList.map((p) => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    income: p.monthlyIncome,
  }));

  const portfolioTrendData = overview?.portfolioTrend ?? [];

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const kpis = [
    { label: t('portfolio.totalValue'), value: `\u20AC${(totalValue / 1000).toFixed(0)}k`, icon: Building2, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('portfolio.monthlyIncome'), value: `\u20AC${totalIncome.toLocaleString()}`, icon: DollarSign, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('portfolio.netYield'), value: `${netYield}%`, icon: Percent, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: t('portfolio.totalProperties'), value: overview?.propertyCount ?? propertiesList.length, icon: BarChart3, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

  // ── Error State ──────────────────────────────────────────────
  if (overviewError) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Failed to load portfolio
          </h2>
          <p className="text-sm text-on-surface-variant text-center max-w-md">
            {(overviewErr as any)?.message || 'An unexpected error occurred while loading portfolio data.'}
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

  // ── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
              {t('portfolio.label')}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
              {t('portfolio.title')}
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
              <div className="h-3 w-24 bg-outline-variant/20 rounded mb-3" />
              <div className="h-7 w-20 bg-outline-variant/20 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
          <div className="h-72 bg-outline-variant/10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('portfolio.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('portfolio.title')}
          </h1>
        </div>
        <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} className={inputClass}>
          {owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
              <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Property Comparison Chart */}
      {comparisonData.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('portfolio.incomeComparison')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} width={120} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                  formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, t('portfolio.monthlyIncome')]}
                />
                <Bar dataKey="income" fill="#6b38d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Property Cards Grid */}
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
          {t('portfolio.propertyPerformance')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propertiesList.map((property) => (
            <div key={property.id} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-headline text-sm font-bold text-on-surface">{property.name}</h4>
                  <p className="text-xs text-on-surface-variant">{property.location}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getScoreBg(property.score)}`}>
                  <Star className={`w-3 h-3 ${getScoreColor(property.score)}`} />
                  <span className={`text-xs font-bold ${getScoreColor(property.score)}`}>{property.score}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('portfolio.occupancy')}</p>
                  <p className="font-headline text-sm font-bold text-on-surface">{property.occupancy}%</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('portfolio.income')}</p>
                  <p className="font-headline text-sm font-bold text-on-surface">{'\u20AC'}{(property.monthlyIncome / 1000).toFixed(1)}k</p>
                </div>
              </div>

              {/* Sparkline */}
              {property.trend && property.trend.length > 0 && (
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={property.trend.map((v, i) => ({ v, i }))}>
                      <Line type="monotone" dataKey="v" stroke="#6b38d4" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
          {propertiesList.length === 0 && (
            <div className="col-span-full text-center py-12 text-on-surface-variant">
              No properties found
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Trend */}
      {portfolioTrendData.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
            {t('portfolio.portfolioTrend')}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolioTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                  formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, t('portfolio.totalIncome')]}
                />
                <Line type="monotone" dataKey="value" stroke="#6b38d4" strokeWidth={2.5} dot={{ fill: '#6b38d4', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
