import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Calendar,
  Users,
  Building2,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Star,
  Bed,
  Globe,
  Target,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import apiClient from '../lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────

interface KpiData {
  totalRevenue: number;
  revenueTrend: number;
  occupancyRate: number;
  occupancyTrend: number;
  adr: number;
  adrTrend: number;
  revPAR: number;
  revPARTrend: number;
  totalBookings: number;
  bookingsTrend: number;
  avgLOS: number;
  losTrend: number;
  cancellationRate: number;
  cancellationTrend: number;
  directBookingShare: number;
  directTrend: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancy: number;
}

interface ChannelData {
  name: string;
  value: number;
  revenue: number;
  bookings: number;
  color: string;
}

interface PropertyPerformance {
  name: string;
  occupancy: number;
  adr: number;
  revPAR: number;
  revenue: number;
  score: number;
  roi: number;
}

interface ForecastItem {
  month: string;
  predicted: number;
  confidence: number;
  actual: number | null;
}

interface OwnerReport {
  owner: string;
  properties: number;
  revenue: number;
  expenses: number;
  fees: number;
  payout: number;
  occupancy: number;
}

interface SeasonalTrend {
  month: string;
  [year: string]: string | number;
}

interface DashboardAnalytics {
  kpis: KpiData;
  monthlyRevenue: MonthlyRevenue[];
  channelDistribution: ChannelData[];
  propertyPerformance: PropertyPerformance[];
  forecastData: ForecastItem[];
  ownerReports: OwnerReport[];
  seasonalTrends: SeasonalTrend[];
  radarData: Array<Record<string, string | number>>;
  peakInsights: { label: string; value: string }[];
  offSeasonInsights: { label: string; value: string; highlight?: boolean }[];
}

// ── Component ──────────────────────────────────────────────────────────────

type TabType = 'overview' | 'properties' | 'channels' | 'forecast' | 'owners' | 'seasonal';

function KPICard({
  title,
  value,
  trend,
  prefix,
  suffix,
  icon: Icon,
}: {
  title: string;
  value: number;
  trend: number;
  prefix?: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="glass-card p-4 rounded-xl hover:shadow-ambient-md transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-secondary" />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold
            ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
        >
          <TrendIcon className="w-3 h-3" />
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="text-xs text-on-surface-variant">{title}</p>
      <p className="text-xl font-headline font-bold mt-0.5">
        {prefix}
        {typeof value === 'number' && value >= 1000
          ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
          : value}
        {suffix}
      </p>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  // ── API Queries ──────────────────────────────────────────────
  const { data: dashboardData, isLoading, isError, error } = useQuery<DashboardAnalytics>({
    queryKey: ['analytics-dashboard', period],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard', { params: { period } });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: occupancyData } = useQuery<MonthlyRevenue[]>({
    queryKey: ['analytics-occupancy', period],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/occupancy', { params: { period } });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: revenueData } = useQuery<MonthlyRevenue[]>({
    queryKey: ['analytics-revenue', period],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/revenue', { params: { period } });
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-occupancy'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-revenue'] });
  };

  const kpiData = dashboardData?.kpis;
  const monthlyRevenue = revenueData ?? dashboardData?.monthlyRevenue ?? [];
  const channelDistribution = dashboardData?.channelDistribution ?? [];
  const propertyPerformance = dashboardData?.propertyPerformance ?? [];
  const forecastData = dashboardData?.forecastData ?? [];
  const ownerReports = dashboardData?.ownerReports ?? [];
  const seasonalTrends = dashboardData?.seasonalTrends ?? [];
  const radarData = dashboardData?.radarData ?? [];
  const peakInsights = dashboardData?.peakInsights ?? [];
  const offSeasonInsights = dashboardData?.offSeasonInsights ?? [];
  const occupancyMonthly = occupancyData ?? monthlyRevenue;

  const tabsConfig: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Revenue Overview', icon: TrendingUp },
    { key: 'properties', label: 'Property Performance', icon: Building2 },
    { key: 'channels', label: 'Channel Analytics', icon: Globe },
    { key: 'forecast', label: 'Forecast', icon: Target },
    { key: 'owners', label: 'Owner Reports', icon: Users },
    { key: 'seasonal', label: 'Seasonal Trends', icon: Calendar },
  ];

  // ── Error State ──────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Failed to load analytics
          </h2>
          <p className="text-sm text-on-surface-variant text-center max-w-md">
            {(error as any)?.message || 'An unexpected error occurred while loading analytics data.'}
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
  if (isLoading || !kpiData) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-headline font-bold">Revenue Analytics</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Comprehensive financial performance insights across your portfolio
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
              <div className="h-9 w-9 bg-white/10 rounded-lg mb-2" />
              <div className="h-3 w-16 bg-white/10 rounded mb-1" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-5 rounded-xl animate-pulse">
            <div className="h-80 bg-white/5 rounded-lg" />
          </div>
          <div className="glass-card p-5 rounded-xl animate-pulse">
            <div className="h-80 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold">Revenue Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Comprehensive financial performance insights across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard title="Total Revenue" value={kpiData.totalRevenue} trend={kpiData.revenueTrend} prefix="€" icon={DollarSign} />
        <KPICard title="Occupancy" value={kpiData.occupancyRate} trend={kpiData.occupancyTrend} suffix="%" icon={Bed} />
        <KPICard title="ADR" value={kpiData.adr} trend={kpiData.adrTrend} prefix="€" icon={BarChart3} />
        <KPICard title="RevPAR" value={kpiData.revPAR} trend={kpiData.revPARTrend} prefix="€" icon={TrendingUp} />
        <KPICard title="Bookings" value={kpiData.totalBookings} trend={kpiData.bookingsTrend} icon={Calendar} />
        <KPICard title="Avg LOS" value={kpiData.avgLOS} trend={kpiData.losTrend} suffix=" nights" icon={Star} />
        <KPICard title="Cancel Rate" value={kpiData.cancellationRate} trend={kpiData.cancellationTrend} suffix="%" icon={Percent} />
        <KPICard title="Direct Share" value={kpiData.directBookingShare} trend={kpiData.directTrend} suffix="%" icon={Globe} />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabsConfig.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === key
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/20'
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue + Profit Chart */}
          <div className="lg:col-span-2 glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Revenue vs Expenses vs Profit</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`€${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6b38d4" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Distribution */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Channel Distribution</h3>
            {channelDistribution.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {channelDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {channelDistribution.map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                        <span className="text-on-surface-variant">{ch.name}</span>
                      </div>
                      <span className="font-medium">{ch.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Occupancy Rate Over Time */}
          <div className="lg:col-span-3 glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Occupancy Rate Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={occupancyMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, 'Occupancy']}
                />
                <Bar dataKey="occupancy" fill="#6b38d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-6">
          {/* Property Performance Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">#</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Property</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Occupancy</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ADR</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">RevPAR</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Revenue</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ROI</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyPerformance.map((prop, i) => (
                    <tr key={prop.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-on-surface-variant">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{prop.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${prop.occupancy}%` }} />
                          </div>
                          <span>{prop.occupancy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">€{prop.adr}</td>
                      <td className="px-4 py-3">€{prop.revPAR}</td>
                      <td className="px-4 py-3 font-semibold">€{prop.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-emerald-400">{prop.roi}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold
                            ${prop.score >= 90
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : prop.score >= 75
                                ? 'bg-blue-500/15 text-blue-400'
                                : prop.score >= 60
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-red-500/15 text-red-400'
                            }`}
                        >
                          {prop.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {propertyPerformance.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                        No property performance data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar comparison */}
          {radarData.length > 0 && (
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-semibold mb-4">Top 3 Properties — Performance Radar</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  {Object.keys(radarData[0] || {}).filter((k) => k !== 'metric').map((key, i) => {
                    const colors = ['#6b38d4', '#06b6d4', '#f59e0b'];
                    return (
                      <Radar key={key} name={key} dataKey={key} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={i === 0 ? 0.15 : 0.1} />
                    );
                  })}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Revenue */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Revenue by Channel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [`€${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {channelDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Metrics Table */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Channel Metrics</h3>
            <div className="space-y-3">
              {channelDistribution.map((ch) => (
                <div key={ch.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                    <div>
                      <p className="font-medium text-sm">{ch.name}</p>
                      <p className="text-xs text-on-surface-variant">{ch.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-sm">€{ch.revenue.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">{ch.value}% share</p>
                  </div>
                </div>
              ))}
              {channelDistribution.length === 0 && (
                <p className="text-center text-on-surface-variant py-8">No channel data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Revenue Forecast — Next 6 Months</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number, name: string) =>
                    name === 'confidence' ? [`${value}%`, 'Confidence'] : [`€${value?.toLocaleString() || '—'}`, name]
                  }
                />
                <Area type="monotone" dataKey="predicted" stroke="#6b38d4" fill="url(#gradForecast)" strokeWidth={2} strokeDasharray="8 4" name="Predicted Revenue" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {forecastData.map((f) => (
              <div key={f.month} className="glass-card p-4 rounded-xl text-center">
                <p className="text-xs text-on-surface-variant">{f.month}</p>
                <p className="text-lg font-headline font-bold mt-1">€{(f.predicted / 1000).toFixed(0)}k</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${f.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{f.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'owners' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Owner</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Properties</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Revenue</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Expenses</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mgmt Fees</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Net Payout</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {ownerReports.map((owner) => (
                  <tr key={owner.owner} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 font-medium">{owner.owner}</td>
                    <td className="px-4 py-4">{owner.properties}</td>
                    <td className="px-4 py-4 text-emerald-400 font-semibold">€{owner.revenue.toLocaleString()}</td>
                    <td className="px-4 py-4 text-red-400">€{owner.expenses.toLocaleString()}</td>
                    <td className="px-4 py-4 text-amber-400">€{owner.fees.toLocaleString()}</td>
                    <td className="px-4 py-4 font-bold">€{owner.payout.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${owner.occupancy}%` }} />
                        </div>
                        <span>{owner.occupancy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {ownerReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                      No owner report data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'seasonal' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Occupancy Rate — Year Over Year Comparison</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                {Object.keys(seasonalTrends[0] || {}).filter((k) => k !== 'month').map((year, i) => {
                  const colors = ['#64748b', '#06b6d4', '#6b38d4'];
                  const widths = [1.5, 2, 2.5];
                  return (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={year}
                      stroke={colors[i % colors.length]}
                      strokeWidth={widths[i % widths.length]}
                      dot={i === Object.keys(seasonalTrends[0] || {}).filter((k) => k !== 'month').length - 1}
                      strokeDasharray={i === 0 ? '4 4' : undefined}
                    />
                  );
                })}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Best/Worst Months */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-emerald-400">Peak Season Insights</h3>
              <div className="space-y-2">
                {peakInsights.map((insight) => (
                  <div key={insight.label} className="flex justify-between text-sm p-2 rounded bg-emerald-500/5">
                    <span className="text-on-surface-variant">{insight.label}</span>
                    <span className="font-semibold">{insight.value}</span>
                  </div>
                ))}
                {peakInsights.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No peak season data available</p>
                )}
              </div>
            </div>
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">Off-Season Opportunities</h3>
              <div className="space-y-2">
                {offSeasonInsights.map((insight) => (
                  <div key={insight.label} className="flex justify-between text-sm p-2 rounded bg-amber-500/5">
                    <span className="text-on-surface-variant">{insight.label}</span>
                    <span className={`font-semibold ${insight.highlight ? 'text-emerald-400' : ''}`}>{insight.value}</span>
                  </div>
                ))}
                {offSeasonInsights.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No off-season data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
