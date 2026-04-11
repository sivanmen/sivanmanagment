import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  Star,
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

const owners = ['All Owners', 'Dimitris Papadopoulos', 'Maria Konstantinou', 'Yannis Alexiou', 'Elena Michailidou'];

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

const demoProperties: PortfolioProperty[] = [
  { id: '1', name: 'Santorini Sunset Villa', location: 'Oia, Santorini', score: 92, occupancy: 88, monthlyIncome: 12400, trend: [8200, 9100, 10400, 11200, 12400, 11800, 12400, 13100, 14200, 12800, 11500, 12400], value: 580000 },
  { id: '2', name: 'Athens Central Loft', location: 'Plaka, Athens', score: 85, occupancy: 76, monthlyIncome: 8600, trend: [5800, 6200, 7100, 7800, 8200, 8600, 9100, 8900, 8400, 7800, 7200, 8600], value: 320000 },
  { id: '3', name: 'Mykonos Beach House', location: 'Ornos, Mykonos', score: 89, occupancy: 82, monthlyIncome: 9800, trend: [4200, 5100, 6800, 8200, 9800, 12400, 14600, 15200, 11800, 8400, 5200, 9800], value: 720000 },
  { id: '4', name: 'Crete Harbor Suite', location: 'Chania, Crete', score: 78, occupancy: 68, monthlyIncome: 6200, trend: [4100, 4600, 5200, 5800, 6200, 7100, 7800, 8200, 6800, 5400, 4800, 6200], value: 280000 },
  { id: '5', name: 'Rhodes Old Town Apt', location: 'Rhodes Town', score: 81, occupancy: 72, monthlyIncome: 5400, trend: [3200, 3800, 4200, 4800, 5400, 6100, 6800, 7200, 5800, 4600, 3800, 5400], value: 240000 },
  { id: '6', name: 'Paros Seaside Studio', location: 'Naoussa, Paros', score: 75, occupancy: 64, monthlyIncome: 4200, trend: [2100, 2600, 3200, 3800, 4200, 5400, 6200, 6800, 5100, 3600, 2400, 4200], value: 195000 },
];

const comparisonData = demoProperties.map((p) => ({
  name: p.name.split(' ').slice(0, 2).join(' '),
  income: p.monthlyIncome,
}));

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const portfolioTrendData = months.map((month, i) => ({
  month,
  value: demoProperties.reduce((sum, p) => sum + p.trend[i], 0),
}));

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
  const [selectedOwner, setSelectedOwner] = useState('All Owners');

  const totalValue = demoProperties.reduce((sum, p) => sum + p.value, 0);
  const totalIncome = demoProperties.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const avgOccupancy = Math.round(demoProperties.reduce((sum, p) => sum + p.occupancy, 0) / demoProperties.length);
  const netYield = ((totalIncome * 12) / totalValue * 100).toFixed(1);

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const kpis = [
    { label: t('portfolio.totalValue'), value: `\u20AC${(totalValue / 1000).toFixed(0)}k`, icon: Building2, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('portfolio.monthlyIncome'), value: `\u20AC${totalIncome.toLocaleString()}`, icon: DollarSign, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('portfolio.netYield'), value: `${netYield}%`, icon: Percent, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: t('portfolio.totalProperties'), value: demoProperties.length, icon: BarChart3, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

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

      {/* Property Cards Grid */}
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
          {t('portfolio.propertyPerformance')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoProperties.map((property) => (
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
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={property.trend.map((v, i) => ({ v, i }))}>
                    <Line type="monotone" dataKey="v" stroke="#6b38d4" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Trend */}
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
    </div>
  );
}
