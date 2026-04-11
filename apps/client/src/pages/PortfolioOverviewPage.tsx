import { useTranslation } from 'react-i18next';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Percent,
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

interface PortfolioProperty {
  id: string;
  name: string;
  location: string;
  occupancy: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  score: number;
  value: number;
}

const demoProperties: PortfolioProperty[] = [
  { id: '1', name: 'Santorini Sunset Villa', location: 'Oia, Santorini', occupancy: 88, monthlyIncome: 12400, monthlyExpenses: 3200, score: 92, value: 580000 },
  { id: '2', name: 'Athens Central Loft', location: 'Plaka, Athens', occupancy: 76, monthlyIncome: 8600, monthlyExpenses: 2100, score: 85, value: 320000 },
  { id: '3', name: 'Mykonos Beach House', location: 'Ornos, Mykonos', occupancy: 82, monthlyIncome: 9800, monthlyExpenses: 2800, score: 89, value: 720000 },
];

const monthlyTrend = [
  { month: 'Apr', income: 22400 },
  { month: 'May', income: 25600 },
  { month: 'Jun', income: 31200 },
  { month: 'Jul', income: 36800 },
  { month: 'Aug', income: 39400 },
  { month: 'Sep', income: 33200 },
  { month: 'Oct', income: 26800 },
  { month: 'Nov', income: 21400 },
  { month: 'Dec', income: 18200 },
  { month: 'Jan', income: 16400 },
  { month: 'Feb', income: 18800 },
  { month: 'Mar', income: 24600 },
];

const comparisonData = demoProperties.map((p) => ({
  name: p.name.split(' ').slice(0, 2).join(' '),
  income: p.monthlyIncome,
  expenses: p.monthlyExpenses,
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

export default function PortfolioOverviewPage() {
  const { t } = useTranslation();

  const totalValue = demoProperties.reduce((sum, p) => sum + p.value, 0);
  const totalIncome = demoProperties.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const totalExpenses = demoProperties.reduce((sum, p) => sum + p.monthlyExpenses, 0);
  const avgOccupancy = Math.round(demoProperties.reduce((sum, p) => sum + p.occupancy, 0) / demoProperties.length);
  const netYield = ((totalIncome * 12) / totalValue * 100).toFixed(1);

  const kpis = [
    { label: t('portfolio.totalValue'), value: `\u20AC${(totalValue / 1000).toFixed(0)}k`, icon: Building2, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('portfolio.monthlyIncome'), value: `\u20AC${totalIncome.toLocaleString()}`, icon: DollarSign, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('portfolio.netYield'), value: `${netYield}%`, icon: Percent, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: t('portfolio.occupancy'), value: `${avgOccupancy}%`, icon: TrendingUp, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          {t('portfolio.subtitle')}
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          {t('portfolio.title')}
        </h1>
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

      {/* Property Mini-Cards */}
      <div>
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
          {t('portfolio.myProperties')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('portfolio.occupancy')}</p>
                  <p className="font-headline text-sm font-bold text-on-surface">{property.occupancy}%</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('portfolio.income')}</p>
                  <p className="font-headline text-sm font-bold text-success">{'\u20AC'}{(property.monthlyIncome / 1000).toFixed(1)}k</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('portfolio.net')}</p>
                  <p className="font-headline text-sm font-bold text-on-surface">{'\u20AC'}{((property.monthlyIncome - property.monthlyExpenses) / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
          {t('portfolio.monthlyTrend')}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, t('portfolio.totalIncome')]}
              />
              <Line type="monotone" dataKey="income" stroke="#6b38d4" strokeWidth={2.5} dot={{ fill: '#6b38d4', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
          {t('portfolio.propertyComparison')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.property')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.occupancy')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.income')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.expenses')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.net')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('portfolio.score')}</th>
              </tr>
            </thead>
            <tbody>
              {demoProperties.map((p) => (
                <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-on-surface">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">{p.location}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end text-on-surface">{p.occupancy}%</td>
                  <td className="px-4 py-3 text-end text-success font-medium">{'\u20AC'}{p.monthlyIncome.toLocaleString()}</td>
                  <td className="px-4 py-3 text-end text-error font-medium">{'\u20AC'}{p.monthlyExpenses.toLocaleString()}</td>
                  <td className="px-4 py-3 text-end font-semibold text-on-surface">{'\u20AC'}{(p.monthlyIncome - p.monthlyExpenses).toLocaleString()}</td>
                  <td className="px-4 py-3 text-end">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getScoreBg(p.score)} ${getScoreColor(p.score)}`}>
                      <Star className="w-3 h-3" />
                      {p.score}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-container-low font-semibold">
                <td className="px-4 py-3 text-on-surface">{t('portfolio.totals')}</td>
                <td className="px-4 py-3 text-end text-on-surface">{avgOccupancy}%</td>
                <td className="px-4 py-3 text-end text-success">{'\u20AC'}{totalIncome.toLocaleString()}</td>
                <td className="px-4 py-3 text-end text-error">{'\u20AC'}{totalExpenses.toLocaleString()}</td>
                <td className="px-4 py-3 text-end text-on-surface">{'\u20AC'}{(totalIncome - totalExpenses).toLocaleString()}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
