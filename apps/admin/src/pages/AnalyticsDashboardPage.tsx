import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

// ── Demo Data ──────────────────────────────────────────────────────────────

const kpiData = {
  totalRevenue: 485200,
  revenueTrend: 12.4,
  occupancyRate: 78.3,
  occupancyTrend: 5.2,
  adr: 187.5,
  adrTrend: 8.1,
  revPAR: 146.8,
  revPARTrend: 14.2,
  totalBookings: 342,
  bookingsTrend: 9.7,
  avgLOS: 4.8,
  losTrend: -2.1,
  cancellationRate: 6.2,
  cancellationTrend: -1.5,
  directBookingShare: 32.8,
  directTrend: 18.4,
};

const monthlyRevenue = [
  { month: 'Jan', revenue: 14200, expenses: 5800, profit: 8400, occupancy: 32 },
  { month: 'Feb', revenue: 15600, expenses: 6100, profit: 9500, occupancy: 38 },
  { month: 'Mar', revenue: 22400, expenses: 7500, profit: 14900, occupancy: 55 },
  { month: 'Apr', revenue: 28600, expenses: 8100, profit: 20500, occupancy: 65 },
  { month: 'May', revenue: 38200, expenses: 8400, profit: 29800, occupancy: 78 },
  { month: 'Jun', revenue: 52600, expenses: 9200, profit: 43400, occupancy: 91 },
  { month: 'Jul', revenue: 62800, expenses: 10100, profit: 52700, occupancy: 96 },
  { month: 'Aug', revenue: 65200, expenses: 10800, profit: 54400, occupancy: 98 },
  { month: 'Sep', revenue: 46400, expenses: 9000, profit: 37400, occupancy: 82 },
  { month: 'Oct', revenue: 32800, expenses: 7800, profit: 25000, occupancy: 62 },
  { month: 'Nov', revenue: 21200, expenses: 6400, profit: 14800, occupancy: 42 },
  { month: 'Dec', revenue: 18800, expenses: 5900, profit: 12900, occupancy: 35 },
];

const channelDistribution = [
  { name: 'Airbnb', value: 38, revenue: 184376, bookings: 130, color: '#FF5A5F' },
  { name: 'Booking.com', value: 25, revenue: 121300, bookings: 86, color: '#003580' },
  { name: 'VRBO', value: 12, revenue: 58224, bookings: 41, color: '#3B5998' },
  { name: 'Direct', value: 18, revenue: 87336, bookings: 62, color: '#6b38d4' },
  { name: 'Expedia', value: 5, revenue: 24260, bookings: 17, color: '#F5A623' },
  { name: 'Other', value: 2, revenue: 9704, bookings: 6, color: '#94a3b8' },
];

const propertyPerformance = [
  { name: 'Villa Elounda Royale', occupancy: 92, adr: 280, revPAR: 258, revenue: 94080, score: 95, roi: 18.2 },
  { name: 'Chania Harbor Suite', occupancy: 88, adr: 195, revPAR: 172, revenue: 62600, score: 88, roi: 15.6 },
  { name: 'Rethymno Beach House', occupancy: 85, adr: 210, revPAR: 179, revenue: 65000, score: 84, roi: 14.8 },
  { name: 'Heraklion City Loft', occupancy: 82, adr: 145, revPAR: 119, revenue: 43200, score: 79, roi: 12.1 },
  { name: 'Agios Nikolaos Villa', occupancy: 78, adr: 175, revPAR: 137, revenue: 49700, score: 76, roi: 11.5 },
  { name: 'Plakias Seaside', occupancy: 72, adr: 160, revPAR: 115, revenue: 41900, score: 71, roi: 10.2 },
  { name: 'Sitia Countryside', occupancy: 65, adr: 120, revPAR: 78, revenue: 28400, score: 62, roi: 7.8 },
];

const forecastData = [
  { month: 'Apr 2026', predicted: 31500, confidence: 85, actual: null },
  { month: 'May 2026', predicted: 42000, confidence: 80, actual: null },
  { month: 'Jun 2026', predicted: 56000, confidence: 75, actual: null },
  { month: 'Jul 2026', predicted: 68000, confidence: 70, actual: null },
  { month: 'Aug 2026', predicted: 72000, confidence: 65, actual: null },
  { month: 'Sep 2026', predicted: 48000, confidence: 60, actual: null },
];

const ownerReports = [
  { owner: 'David Cohen', properties: 3, revenue: 201680, expenses: 42800, fees: 50420, payout: 108460, occupancy: 85 },
  { owner: 'Yael Levy', properties: 2, revenue: 149200, expenses: 31600, fees: 37300, payout: 80300, occupancy: 80 },
  { owner: 'Michael Ben-Ari', properties: 2, revenue: 134320, expenses: 28400, fees: 33580, payout: 72340, occupancy: 72 },
];

const seasonalTrends = [
  { month: 'Jan', '2024': 28, '2025': 32, '2026': 35 },
  { month: 'Feb', '2024': 32, '2025': 36, '2026': 40 },
  { month: 'Mar', '2024': 48, '2025': 52, '2026': 58 },
  { month: 'Apr', '2024': 62, '2025': 65, '2026': 68 },
  { month: 'May', '2024': 75, '2025': 78, '2026': 82 },
  { month: 'Jun', '2024': 88, '2025': 90, '2026': 93 },
  { month: 'Jul', '2024': 94, '2025': 95, '2026': 97 },
  { month: 'Aug', '2024': 96, '2025': 97, '2026': 98 },
  { month: 'Sep', '2024': 82, '2025': 85, '2026': 88 },
  { month: 'Oct', '2024': 58, '2025': 62, '2026': 65 },
  { month: 'Nov', '2024': 38, '2025': 42, '2026': 45 },
  { month: 'Dec', '2024': 30, '2025': 34, '2026': 38 },
];

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  const tabs: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Revenue Overview', icon: TrendingUp },
    { key: 'properties', label: 'Property Performance', icon: Building2 },
    { key: 'channels', label: 'Channel Analytics', icon: Globe },
    { key: 'forecast', label: 'Forecast', icon: Target },
    { key: 'owners', label: 'Owner Reports', icon: Users },
    { key: 'seasonal', label: 'Seasonal Trends', icon: Calendar },
  ];

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
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90">
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
          {tabs.map(({ key, label, icon: TabIcon }) => (
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
          </div>

          {/* Occupancy Rate Over Time */}
          <div className="lg:col-span-3 glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Occupancy Rate Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
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
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar comparison */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="text-sm font-semibold mb-4">Top 3 Properties — Performance Radar</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={[
                { metric: 'Occupancy', 'Villa Elounda': 92, 'Chania Harbor': 88, 'Rethymno Beach': 85 },
                { metric: 'ADR', 'Villa Elounda': 93, 'Chania Harbor': 65, 'Rethymno Beach': 70 },
                { metric: 'Reviews', 'Villa Elounda': 95, 'Chania Harbor': 90, 'Rethymno Beach': 82 },
                { metric: 'ROI', 'Villa Elounda': 91, 'Chania Harbor': 78, 'Rethymno Beach': 74 },
                { metric: 'Response', 'Villa Elounda': 98, 'Chania Harbor': 92, 'Rethymno Beach': 88 },
                { metric: 'Repeat Rate', 'Villa Elounda': 85, 'Chania Harbor': 70, 'Rethymno Beach': 65 },
              ]}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Villa Elounda Royale" dataKey="Villa Elounda" stroke="#6b38d4" fill="#6b38d4" fillOpacity={0.15} />
                <Radar name="Chania Harbor Suite" dataKey="Chania Harbor" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                <Radar name="Rethymno Beach House" dataKey="Rethymno Beach" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
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
                <Line type="monotone" dataKey="2024" stroke="#64748b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="2025" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="2026" stroke="#6b38d4" strokeWidth={2.5} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Best/Worst Months */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-emerald-400">Peak Season Insights</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm p-2 rounded bg-emerald-500/5">
                  <span className="text-on-surface-variant">Highest Occupancy</span>
                  <span className="font-semibold">August — 98%</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-emerald-500/5">
                  <span className="text-on-surface-variant">Best Revenue Month</span>
                  <span className="font-semibold">August — €65,200</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-emerald-500/5">
                  <span className="text-on-surface-variant">Highest ADR</span>
                  <span className="font-semibold">July — €295/night</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-emerald-500/5">
                  <span className="text-on-surface-variant">Peak Season Duration</span>
                  <span className="font-semibold">Jun–Sep (4 months)</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-5 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">Off-Season Opportunities</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm p-2 rounded bg-amber-500/5">
                  <span className="text-on-surface-variant">Lowest Occupancy</span>
                  <span className="font-semibold">January — 35%</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-amber-500/5">
                  <span className="text-on-surface-variant">YoY Improvement</span>
                  <span className="font-semibold text-emerald-400">+7% winter occupancy</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-amber-500/5">
                  <span className="text-on-surface-variant">Long-Stay Opportunity</span>
                  <span className="font-semibold">Nov–Feb digital nomads</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-amber-500/5">
                  <span className="text-on-surface-variant">Potential Revenue Lift</span>
                  <span className="font-semibold text-emerald-400">+€12,400/month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
