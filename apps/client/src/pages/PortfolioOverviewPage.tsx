import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Star,
  Eye,
  Calendar,
  Users,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  Bath,
  ChevronRight,
  Target,
  Award,
  Wallet,
  Filter,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────
interface PortfolioProperty {
  id: string;
  name: string;
  type: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  occupancy: number;
  occupancyChange: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  managementFee: number;
  netPayout: number;
  score: number;
  value: number;
  roi: number;
  bookingsThisMonth: number;
  avgNightlyRate: number;
  reviewRating: number;
  reviewCount: number;
  status: 'active' | 'maintenance' | 'seasonal-closed';
}

// ── Demo Data ──────────────────────────────────────────
const properties: PortfolioProperty[] = [
  {
    id: '1', name: 'Aegean Sunset Villa', type: 'Villa', location: 'Elounda Beach Road 42', city: 'Elounda, Crete',
    bedrooms: 4, bathrooms: 3, occupancy: 88, occupancyChange: 5.2,
    monthlyIncome: 12400, monthlyExpenses: 3200, managementFee: 3100, netPayout: 6100,
    score: 94, value: 580000, roi: 12.6, bookingsThisMonth: 4,
    avgNightlyRate: 285, reviewRating: 4.9, reviewCount: 67, status: 'active',
  },
  {
    id: '2', name: 'Venetian Harbor Loft', type: 'Apartment', location: 'Old Port Street 15', city: 'Chania, Crete',
    bedrooms: 2, bathrooms: 1, occupancy: 76, occupancyChange: -2.1,
    monthlyIncome: 5800, monthlyExpenses: 1600, managementFee: 1450, netPayout: 2750,
    score: 85, value: 320000, roi: 10.3, bookingsThisMonth: 6,
    avgNightlyRate: 145, reviewRating: 4.7, reviewCount: 43, status: 'active',
  },
  {
    id: '3', name: 'Spinalonga View Suite', type: 'Suite', location: 'Coastal Avenue 8', city: 'Plaka, Crete',
    bedrooms: 1, bathrooms: 1, occupancy: 82, occupancyChange: 8.4,
    monthlyIncome: 4200, monthlyExpenses: 1100, managementFee: 1050, netPayout: 2050,
    score: 89, value: 240000, roi: 10.3, bookingsThisMonth: 5,
    avgNightlyRate: 120, reviewRating: 4.8, reviewCount: 31, status: 'active',
  },
  {
    id: '4', name: 'Olive Grove Retreat', type: 'Villa', location: 'Rural Road 3', city: 'Rethymno, Crete',
    bedrooms: 3, bathrooms: 2, occupancy: 71, occupancyChange: 3.6,
    monthlyIncome: 8200, monthlyExpenses: 2400, managementFee: 2050, netPayout: 3750,
    score: 81, value: 420000, roi: 10.7, bookingsThisMonth: 3,
    avgNightlyRate: 210, reviewRating: 4.6, reviewCount: 28, status: 'active',
  },
  {
    id: '5', name: 'Heraklion City Studio', type: 'Studio', location: 'Lions Square 22', city: 'Heraklion, Crete',
    bedrooms: 1, bathrooms: 1, occupancy: 92, occupancyChange: 1.3,
    monthlyIncome: 3400, monthlyExpenses: 900, managementFee: 850, netPayout: 1650,
    score: 91, value: 180000, roi: 11.0, bookingsThisMonth: 8,
    avgNightlyRate: 95, reviewRating: 4.5, reviewCount: 89, status: 'active',
  },
  {
    id: '6', name: 'Balos Beach House', type: 'Villa', location: 'Kissamos Coast 7', city: 'Kissamos, Crete',
    bedrooms: 5, bathrooms: 4, occupancy: 0, occupancyChange: 0,
    monthlyIncome: 0, monthlyExpenses: 800, managementFee: 300, netPayout: -1100,
    score: 72, value: 750000, roi: 0, bookingsThisMonth: 0,
    avgNightlyRate: 380, reviewRating: 4.9, reviewCount: 12, status: 'seasonal-closed',
  },
];

const monthlyTrend = [
  { month: 'May \'25', income: 25600, expenses: 7200, net: 18400 },
  { month: 'Jun', income: 31200, expenses: 8100, net: 23100 },
  { month: 'Jul', income: 36800, expenses: 9400, net: 27400 },
  { month: 'Aug', income: 39400, expenses: 10200, net: 29200 },
  { month: 'Sep', income: 33200, expenses: 8800, net: 24400 },
  { month: 'Oct', income: 26800, expenses: 7500, net: 19300 },
  { month: 'Nov', income: 18400, expenses: 6200, net: 12200 },
  { month: 'Dec', income: 14200, expenses: 5800, net: 8400 },
  { month: 'Jan \'26', income: 12400, expenses: 5200, net: 7200 },
  { month: 'Feb', income: 16800, expenses: 5600, net: 11200 },
  { month: 'Mar', income: 24600, expenses: 6900, net: 17700 },
  { month: 'Apr', income: 34000, expenses: 9000, net: 25000 },
];

const revenueByType = [
  { name: 'Airbnb', value: 42, color: '#FF5A5F' },
  { name: 'Booking.com', value: 28, color: '#003580' },
  { name: 'Direct', value: 18, color: '#6b38d4' },
  { name: 'VRBO', value: 8, color: '#3B5998' },
  { name: 'Expedia', value: 4, color: '#00355F' },
];

const roiProjection = [
  { year: '2024', actual: 8.2, projected: null },
  { year: '2025', actual: 10.8, projected: null },
  { year: '2026', actual: null, projected: 12.4 },
  { year: '2027', actual: null, projected: 13.8 },
  { year: '2028', actual: null, projected: 15.1 },
];

// ── Helpers ────────────────────────────────────────────
function getScoreColor(s: number) { return s >= 85 ? 'text-success' : s >= 70 ? 'text-warning' : 'text-error'; }
function getScoreBg(s: number) { return s >= 85 ? 'bg-success/10' : s >= 70 ? 'bg-warning/10' : 'bg-error/10'; }
function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return { label: 'Active', cls: 'bg-success/10 text-success' };
    case 'maintenance': return { label: 'Maintenance', cls: 'bg-warning/10 text-warning' };
    case 'seasonal-closed': return { label: 'Seasonal', cls: 'bg-on-surface-variant/10 text-on-surface-variant' };
    default: return { label: status, cls: 'bg-surface-container-high text-on-surface-variant' };
  }
}

type ViewMode = 'overview' | 'comparison' | 'analytics';

export default function PortfolioOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('overview');
  const [sortBy, setSortBy] = useState<'score' | 'income' | 'occupancy' | 'roi'>('score');

  const activeProperties = properties.filter(p => p.status === 'active');
  const totalValue = properties.reduce((s, p) => s + p.value, 0);
  const totalIncome = activeProperties.reduce((s, p) => s + p.monthlyIncome, 0);
  const totalExpenses = activeProperties.reduce((s, p) => s + p.monthlyExpenses, 0);
  const totalFees = activeProperties.reduce((s, p) => s + p.managementFee, 0);
  const totalNet = activeProperties.reduce((s, p) => s + p.netPayout, 0);
  const avgOccupancy = Math.round(activeProperties.reduce((s, p) => s + p.occupancy, 0) / activeProperties.length);
  const annualizedNet = totalNet * 12;
  const netYield = ((annualizedNet) / totalValue * 100).toFixed(1);
  const avgRoi = (activeProperties.reduce((s, p) => s + p.roi, 0) / activeProperties.length).toFixed(1);

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      switch (sortBy) {
        case 'income': return b.monthlyIncome - a.monthlyIncome;
        case 'occupancy': return b.occupancy - a.occupancy;
        case 'roi': return b.roi - a.roi;
        default: return b.score - a.score;
      }
    });
  }, [sortBy]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Investment Overview
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            My Portfolio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'comparison', 'analytics'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                ${view === v ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:bg-surface-container-high/60'}`}
            >
              {v === 'overview' ? 'Overview' : v === 'comparison' ? 'Compare' : 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Portfolio Value', value: `€${(totalValue / 1000000).toFixed(1)}M`, icon: Building2, change: '+8.2%', up: true, color: 'bg-secondary/10', ic: 'text-secondary' },
          { label: 'Monthly Income', value: `€${totalIncome.toLocaleString()}`, icon: DollarSign, change: '+12.4%', up: true, color: 'bg-success/10', ic: 'text-success' },
          { label: 'Net Payout', value: `€${totalNet.toLocaleString()}`, icon: Wallet, change: '+9.1%', up: true, color: 'bg-secondary/10', ic: 'text-secondary' },
          { label: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: Target, change: '+3.2%', up: true, color: 'bg-warning/10', ic: 'text-warning' },
          { label: 'Net Yield', value: `${netYield}%`, icon: Percent, change: '+1.8%', up: true, color: 'bg-success/10', ic: 'text-success' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
              <div className={`w-7 h-7 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.ic}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-error" />}
              <span className={`text-[10px] font-semibold ${kpi.up ? 'text-success' : 'text-error'}`}>{kpi.change}</span>
              <span className="text-[10px] text-on-surface-variant">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Breakdown Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">Monthly Financial Breakdown</h3>
        <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
          <div style={{ width: `${(totalNet / totalIncome * 100)}%` }} className="h-full bg-success/80 rounded-s-lg flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">Net: €{totalNet.toLocaleString()}</span>
          </div>
          <div style={{ width: `${(totalFees / totalIncome * 100)}%` }} className="h-full bg-secondary/60 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">Fees: €{totalFees.toLocaleString()}</span>
          </div>
          <div style={{ width: `${(totalExpenses / totalIncome * 100)}%` }} className="h-full bg-error/60 rounded-e-lg flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">Expenses: €{totalExpenses.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-on-surface-variant">Total Gross: €{totalIncome.toLocaleString()}</span>
          <span className="text-[10px] text-on-surface-variant">Management Fee Rate: 25%</span>
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Property Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-semibold text-on-surface">My Properties ({properties.length})</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-xs bg-surface-container-low rounded-lg px-2 py-1 text-on-surface-variant border-none outline-none"
                >
                  <option value="score">By Score</option>
                  <option value="income">By Income</option>
                  <option value="occupancy">By Occupancy</option>
                  <option value="roi">By ROI</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedProperties.map((p) => {
                const badge = getStatusBadge(p.status);
                return (
                  <div
                    key={p.id}
                    className="bg-surface-container-lowest rounded-xl ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/properties/${p.id}`)}
                  >
                    {/* Image placeholder */}
                    <div className="h-36 rounded-t-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center relative overflow-hidden">
                      <Building2 className="w-10 h-10 text-secondary/30" />
                      <div className="absolute top-2 end-2 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <div className="absolute bottom-2 start-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[11px] font-bold text-white">{p.reviewRating}</span>
                        <span className="text-[9px] text-white/60">({p.reviewCount})</span>
                      </div>
                    </div>
                    {/* Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-headline text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">{p.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-on-surface-variant" />
                            <p className="text-[11px] text-on-surface-variant">{p.city}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getScoreBg(p.score)}`}>
                          <Award className="w-3 h-3" />
                          <span className={`text-xs font-bold ${getScoreColor(p.score)}`}>{p.score}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-on-surface-variant mb-3">
                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.bookingsThisMonth} bookings</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-surface-container-low text-center">
                          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Occupancy</p>
                          <p className="font-headline text-sm font-bold text-on-surface">{p.occupancy}%</p>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            {p.occupancyChange >= 0
                              ? <TrendingUp className="w-2.5 h-2.5 text-success" />
                              : <TrendingDown className="w-2.5 h-2.5 text-error" />}
                            <span className={`text-[9px] font-semibold ${p.occupancyChange >= 0 ? 'text-success' : 'text-error'}`}>
                              {p.occupancyChange > 0 ? '+' : ''}{p.occupancyChange}%
                            </span>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low text-center">
                          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Net/mo</p>
                          <p className={`font-headline text-sm font-bold ${p.netPayout >= 0 ? 'text-success' : 'text-error'}`}>
                            €{Math.abs(p.netPayout).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low text-center">
                          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">ROI</p>
                          <p className="font-headline text-sm font-bold text-secondary">{p.roi}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === 'comparison' && (
        <>
          {/* Comparison Table */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Property Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    {['Property', 'Type', 'Occupancy', 'ADR', 'Income', 'Expenses', 'Fees', 'Net Payout', 'ROI', 'Score'].map(h => (
                      <th key={h} className="text-start px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedProperties.map((p) => (
                    <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-on-surface text-xs">{p.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{p.city}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">{p.type}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${p.occupancy}%` }} />
                          </div>
                          <span className="text-xs font-medium text-on-surface">{p.occupancy}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface">€{p.avgNightlyRate}</td>
                      <td className="px-3 py-3 text-xs font-medium text-success">€{p.monthlyIncome.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-error">€{p.monthlyExpenses.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">€{p.managementFee.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-on-surface">€{p.netPayout.toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs font-medium text-secondary">{p.roi}%</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getScoreBg(p.score)} ${getScoreColor(p.score)}`}>
                          {p.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-container-low font-semibold text-xs">
                    <td className="px-3 py-3 text-on-surface">Totals / Avg</td>
                    <td className="px-3 py-3">{properties.length} props</td>
                    <td className="px-3 py-3 text-on-surface">{avgOccupancy}%</td>
                    <td className="px-3 py-3 text-on-surface">€{Math.round(activeProperties.reduce((s, p) => s + p.avgNightlyRate, 0) / activeProperties.length)}</td>
                    <td className="px-3 py-3 text-success">€{totalIncome.toLocaleString()}</td>
                    <td className="px-3 py-3 text-error">€{totalExpenses.toLocaleString()}</td>
                    <td className="px-3 py-3 text-on-surface-variant">€{totalFees.toLocaleString()}</td>
                    <td className="px-3 py-3 text-on-surface">€{totalNet.toLocaleString()}</td>
                    <td className="px-3 py-3 text-secondary">{avgRoi}%</td>
                    <td className="px-3 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Income vs Expenses Comparison */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Income vs Expenses by Property</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedProperties.filter(p => p.status === 'active').map(p => ({
                  name: p.name.split(' ').slice(0, 2).join(' '),
                  income: p.monthlyIncome,
                  expenses: p.monthlyExpenses,
                  fees: p.managementFee,
                  net: p.netPayout,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant, #e7e8e9)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '11px' }}
                    formatter={(v: number) => [`€${v.toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fees" name="Fees" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {view === 'analytics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trend */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">12-Month Revenue Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '11px' }}
                      formatter={(v: number) => [`€${v.toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="income" name="Gross Income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="net" name="Net Payout" stroke="#6b38d4" strokeWidth={2} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Channel */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Revenue by Channel</h3>
              <div className="h-64 flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueByType} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {revenueByType.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {revenueByType.map((ch) => (
                    <div key={ch.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: ch.color }} />
                      <span className="text-xs text-on-surface flex-1">{ch.name}</span>
                      <span className="text-xs font-semibold text-on-surface">{ch.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROI Projection */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">ROI Projection</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roiProjection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual ROI" stroke="#6b38d4" strokeWidth={2.5} dot={{ fill: '#6b38d4', r: 5 }} connectNulls={false} />
                    <Line type="monotone" dataKey="projected" name="Projected" stroke="#6b38d4" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#6b38d4', r: 4 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performing Summary */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Performance Highlights</h3>
              <div className="space-y-3">
                {[
                  { label: 'Highest Occupancy', property: activeProperties.reduce((a, b) => a.occupancy > b.occupancy ? a : b), value: (p: PortfolioProperty) => `${p.occupancy}%`, icon: Target },
                  { label: 'Highest Income', property: activeProperties.reduce((a, b) => a.monthlyIncome > b.monthlyIncome ? a : b), value: (p: PortfolioProperty) => `€${p.monthlyIncome.toLocaleString()}`, icon: DollarSign },
                  { label: 'Best ROI', property: activeProperties.reduce((a, b) => a.roi > b.roi ? a : b), value: (p: PortfolioProperty) => `${p.roi}%`, icon: TrendingUp },
                  { label: 'Top Rated', property: activeProperties.reduce((a, b) => a.reviewRating > b.reviewRating ? a : b), value: (p: PortfolioProperty) => `${p.reviewRating} ★`, icon: Star },
                  { label: 'Most Bookings', property: activeProperties.reduce((a, b) => a.bookingsThisMonth > b.bookingsThisMonth ? a : b), value: (p: PortfolioProperty) => `${p.bookingsThisMonth} this month`, icon: Calendar },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-medium text-on-surface truncate">{item.property.name}</p>
                    </div>
                    <span className="text-sm font-bold text-secondary">{item.value(item.property)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions Footer */}
      <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/financials')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Financial Summary
          </button>
          <button
            onClick={() => navigate('/statements')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/60 text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Statements
          </button>
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/60 text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            All Properties
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/60 text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
