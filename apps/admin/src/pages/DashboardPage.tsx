import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Download,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
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
  ReferenceLine,
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 280000, target: 260000 },
  { month: 'Feb', revenue: 310000, target: 270000 },
  { month: 'Mar', revenue: 295000, target: 280000 },
  { month: 'Apr', revenue: 340000, target: 290000 },
  { month: 'May', revenue: 320000, target: 300000 },
  { month: 'Jun', revenue: 360000, target: 310000 },
  { month: 'Jul', revenue: 380000, target: 320000 },
  { month: 'Aug', revenue: 410000, target: 330000 },
  { month: 'Sep', revenue: 395000, target: 340000 },
  { month: 'Oct', revenue: 420000, target: 350000 },
  { month: 'Nov', revenue: 440000, target: 360000 },
  { month: 'Dec', revenue: 460000, target: 370000 },
];

const kpiCards = [
  {
    key: 'totalPortfolioValue',
    value: '$142.8M',
    change: '+4.2%',
    trend: 'up' as const,
    color: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  {
    key: 'netOperatingIncome',
    value: '$3.12M',
    change: '+1.8%',
    trend: 'up' as const,
    color: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    key: 'yieldROI',
    value: '6.82%',
    change: '+0.3%',
    trend: 'up' as const,
    color: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  {
    key: 'occupancyRate',
    value: '98.4%',
    change: '+0.2%',
    trend: 'up' as const,
    color: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
];

const aiActions = [
  {
    title: 'Dynamic Pricing Recommendation',
    description: 'AI suggests 12% rate increase for Rothschild 45 based on market demand and seasonal patterns.',
    type: 'revenue',
    urgency: 'high',
  },
  {
    title: 'Predictive Maintenance Alert',
    description: 'HVAC system at Dizengoff 120 predicted to need service in 14 days. Schedule now to avoid downtime.',
    type: 'maintenance',
    urgency: 'medium',
  },
  {
    title: 'Guest Experience Optimization',
    description: 'Reviews indicate opportunity to add premium coffee service. Projected 4.8 star rating improvement.',
    type: 'experience',
    urgency: 'low',
  },
];

const topAssets = [
  {
    name: 'Rothschild Residence 45',
    location: 'Tel Aviv, Rothschild Blvd',
    occupancy: 99.2,
    revenue: '$48,200/mo',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
  },
  {
    name: 'Carmel Vista Suite',
    location: 'Haifa, Carmel Center',
    occupancy: 97.8,
    revenue: '$32,100/mo',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
  },
  {
    name: 'Jaffa Heritage Loft',
    location: 'Tel Aviv-Jaffa, Old Jaffa',
    occupancy: 96.5,
    revenue: '$29,800/mo',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('dashboard.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('dashboard.subtitle')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors">
            <span>Q3 2024</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors">
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t(`dashboard.${card.key}`)}
              </p>
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                {card.trend === 'up' ? (
                  <TrendingUp className={`w-4 h-4 ${card.iconColor}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${card.iconColor}`} />
                )}
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {card.value}
            </p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-success' : 'text-error'}`}>
                {card.change}
              </span>
              <span className="text-xs text-on-surface-variant">vs last quarter</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                {t('dashboard.revenueTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Monthly revenue vs target</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-secondary" />
                <span className="text-on-surface-variant">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-outline-variant" />
                <span className="text-on-surface-variant">Target</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barCategoryGap="20%">
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
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
                  formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`, '']}
                />
                <Bar dataKey="revenue" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                <ReferenceLine
                  y={330000}
                  stroke="#c7c5cd"
                  strokeDasharray="6 4"
                  label={{
                    value: 'Avg Target',
                    position: 'insideTopRight',
                    fill: '#77767d',
                    fontSize: 10,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Actions */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.aiActions')}
            </h3>
          </div>
          <div className="space-y-3">
            {aiActions.map((action, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h4 className="text-sm font-semibold text-on-surface leading-tight">
                    {action.title}
                  </h4>
                  <span
                    className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                      action.urgency === 'high'
                        ? 'bg-error/10 text-error'
                        : action.urgency === 'medium'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-secondary-fixed text-secondary'
                    }`}
                  >
                    {action.urgency}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {action.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Take Action</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Assets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('dashboard.topAssets')}
          </h3>
          <button className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors">
            <span>{t('dashboard.viewPortfolio')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topAssets.map((asset, index) => (
            <div
              key={index}
              className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all group cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={asset.image}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg glass-card text-xs font-semibold">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span>{asset.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h4 className="font-headline font-semibold text-on-surface mb-1">
                  {asset.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{asset.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Revenue</p>
                    <p className="text-sm font-semibold text-on-surface">{asset.revenue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Occupancy</p>
                    <p className="text-sm font-semibold text-success">{asset.occupancy}%</p>
                  </div>
                </div>

                {/* Occupancy bar */}
                <div className="mt-3 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-accent transition-all duration-500"
                    style={{ width: `${asset.occupancy}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
