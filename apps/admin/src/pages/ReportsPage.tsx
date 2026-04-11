import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Wrench,
  FileText,
  DollarSign,
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
} from 'recharts';

type ReportType = 'occupancy' | 'revenue' | 'bookings' | 'maintenance' | 'owner_statement';

const occupancyData = [
  { month: 'Jan', rate: 45 },
  { month: 'Feb', rate: 52 },
  { month: 'Mar', rate: 68 },
  { month: 'Apr', rate: 74 },
  { month: 'May', rate: 82 },
  { month: 'Jun', rate: 91 },
  { month: 'Jul', rate: 96 },
  { month: 'Aug', rate: 98 },
  { month: 'Sep', rate: 88 },
  { month: 'Oct', rate: 72 },
  { month: 'Nov', rate: 55 },
  { month: 'Dec', rate: 48 },
];

const revenueData = [
  { month: 'Jan', revenue: 14200, expenses: 5800 },
  { month: 'Feb', revenue: 15600, expenses: 6100 },
  { month: 'Mar', revenue: 22400, expenses: 7500 },
  { month: 'Apr', revenue: 28600, expenses: 8100 },
  { month: 'May', revenue: 31200, expenses: 8400 },
  { month: 'Jun', revenue: 38600, expenses: 9200 },
  { month: 'Jul', revenue: 42800, expenses: 10100 },
  { month: 'Aug', revenue: 45200, expenses: 10800 },
  { month: 'Sep', revenue: 36400, expenses: 9000 },
  { month: 'Oct', revenue: 27800, expenses: 7800 },
  { month: 'Nov', revenue: 19200, expenses: 6400 },
  { month: 'Dec', revenue: 16800, expenses: 5900 },
];

const bookingsData = [
  { month: 'Jan', bookings: 18, cancellations: 2 },
  { month: 'Feb', bookings: 22, cancellations: 1 },
  { month: 'Mar', bookings: 34, cancellations: 3 },
  { month: 'Apr', bookings: 42, cancellations: 2 },
  { month: 'May', bookings: 48, cancellations: 4 },
  { month: 'Jun', bookings: 56, cancellations: 3 },
  { month: 'Jul', bookings: 62, cancellations: 2 },
  { month: 'Aug', bookings: 65, cancellations: 1 },
  { month: 'Sep', bookings: 52, cancellations: 3 },
  { month: 'Oct', bookings: 38, cancellations: 2 },
  { month: 'Nov', bookings: 24, cancellations: 1 },
  { month: 'Dec', bookings: 20, cancellations: 2 },
];

const maintenancePie = [
  { name: 'Plumbing', value: 28, color: '#6b38d4' },
  { name: 'Electrical', value: 22, color: '#2e7d32' },
  { name: 'HVAC', value: 18, color: '#ed6c02' },
  { name: 'Appliances', value: 16, color: '#ba1a1a' },
  { name: 'General', value: 16, color: '#77767d' },
];

const maintenanceTable = [
  { property: 'Santorini Sunset Villa', requests: 8, resolved: 7, avgDays: 2.1, cost: 2400 },
  { property: 'Athens Central Loft', requests: 5, resolved: 5, avgDays: 1.5, cost: 1200 },
  { property: 'Mykonos Beach House', requests: 6, resolved: 4, avgDays: 3.2, cost: 3100 },
  { property: 'Crete Harbor Suite', requests: 3, resolved: 3, avgDays: 1.8, cost: 900 },
  { property: 'Rhodes Old Town Apt', requests: 4, resolved: 3, avgDays: 2.5, cost: 1600 },
];

const owners = ['All Owners', 'Dimitris Papadopoulos', 'Maria Konstantinou', 'Yannis Alexiou', 'Elena Michailidou'];

const ownerStatementData = {
  ownerName: 'Dimitris Papadopoulos',
  period: 'Q1 2026',
  properties: [
    { name: 'Santorini Sunset Villa', income: 32400, expenses: 8200, fee: 3240, net: 20960 },
    { name: 'Athens Central Loft', income: 18600, expenses: 5100, fee: 1860, net: 11640 },
  ],
  totals: { income: 51000, expenses: 13300, fee: 5100, net: 32600 },
};

const reportTypes: { key: ReportType; icon: typeof BarChart3; label: string }[] = [
  { key: 'occupancy', icon: BarChart3, label: 'reports.occupancy' },
  { key: 'revenue', icon: TrendingUp, label: 'reports.revenue' },
  { key: 'bookings', icon: Calendar, label: 'reports.bookingsReport' },
  { key: 'maintenance', icon: Wrench, label: 'reports.maintenance' },
  { key: 'owner_statement', icon: FileText, label: 'reports.ownerStatement' },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<ReportType>('occupancy');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  const [selectedOwner, setSelectedOwner] = useState('Dimitris Papadopoulos');

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('reports.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('reports.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
          <span className="text-xs text-on-surface-variant">&ndash;</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.key}
            onClick={() => setSelectedReport(rt.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              selectedReport === rt.key
                ? 'gradient-accent text-white shadow-ambient-lg'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <rt.icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{t(rt.label)}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'occupancy' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('reports.occupancyTrend')}
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}%`, t('reports.occupancy')]}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#6b38d4" strokeWidth={2.5} dot={{ fill: '#6b38d4', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.month')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.occupancyRate')}</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.map((d) => (
                  <tr key={d.month} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{d.month}</td>
                    <td className="px-4 py-3 text-end">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${d.rate >= 80 ? 'bg-success/10 text-success' : d.rate >= 60 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}>
                        {d.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'revenue' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('reports.revenueTrend')}
            </h3>
            <div className="flex items-center gap-4 text-xs mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-success" />
                <span className="text-on-surface-variant">{t('finance.income')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-error" />
                <span className="text-on-surface-variant">{t('finance.expenses')}</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                    formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="revenue" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.month')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.income')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.expenses')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.netIncome')}</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((d) => (
                  <tr key={d.month} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{d.month}</td>
                    <td className="px-4 py-3 text-end text-success font-medium">{'\u20AC'}{d.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end text-error font-medium">{'\u20AC'}{d.expenses.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end font-semibold text-on-surface">{'\u20AC'}{(d.revenue - d.expenses).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              {t('reports.bookingsTrend')}
            </h3>
            <div className="flex items-center gap-4 text-xs mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6b38d4' }} />
                <span className="text-on-surface-variant">{t('reports.bookingsCount')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-error" />
                <span className="text-on-surface-variant">{t('reports.cancellations')}</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#46464c' }} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                  />
                  <Bar dataKey="bookings" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancellations" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'maintenance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                {t('reports.maintenanceByType')}
              </h3>
              <div className="flex items-center gap-6">
                <div className="h-48 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={maintenancePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {maintenancePie.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', boxShadow: '0px 24px 48px rgba(25,28,29,0.06)', fontSize: '12px' }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {maintenancePie.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-on-surface">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                {t('reports.maintenanceSummary')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{t('reports.totalRequests')}</p>
                  <p className="font-headline text-xl font-bold text-on-surface">26</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{t('reports.resolved')}</p>
                  <p className="font-headline text-xl font-bold text-success">22</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{t('reports.avgResolution')}</p>
                  <p className="font-headline text-xl font-bold text-on-surface">2.2d</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{t('reports.totalCost')}</p>
                  <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}9,200</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.requests')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.resolved')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.avgDays')}</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.totalCost')}</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceTable.map((d) => (
                  <tr key={d.property} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{d.property}</td>
                    <td className="px-4 py-3 text-end text-on-surface">{d.requests}</td>
                    <td className="px-4 py-3 text-end text-success font-medium">{d.resolved}</td>
                    <td className="px-4 py-3 text-end text-on-surface-variant">{d.avgDays}</td>
                    <td className="px-4 py-3 text-end font-semibold text-on-surface">{'\u20AC'}{d.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'owner_statement' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} className={inputClass}>
              {owners.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-on-surface">
                  {t('reports.ownerStatement')} - {ownerStatementData.ownerName}
                </h3>
                <p className="text-xs text-on-surface-variant">{ownerStatementData.period}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.income')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.expenses')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.managementFees')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('finance.netIncome')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerStatementData.properties.map((p) => (
                    <tr key={p.name} className="border-b border-outline-variant/10">
                      <td className="px-4 py-3 font-medium text-on-surface">{p.name}</td>
                      <td className="px-4 py-3 text-end text-success font-medium">{'\u20AC'}{p.income.toLocaleString()}</td>
                      <td className="px-4 py-3 text-end text-error font-medium">{'\u20AC'}{p.expenses.toLocaleString()}</td>
                      <td className="px-4 py-3 text-end text-secondary font-medium">{'\u20AC'}{p.fee.toLocaleString()}</td>
                      <td className="px-4 py-3 text-end font-bold text-on-surface">{'\u20AC'}{p.net.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-container-low font-semibold">
                    <td className="px-4 py-3 text-on-surface">{t('reports.totals')}</td>
                    <td className="px-4 py-3 text-end text-success">{'\u20AC'}{ownerStatementData.totals.income.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end text-error">{'\u20AC'}{ownerStatementData.totals.expenses.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end text-secondary">{'\u20AC'}{ownerStatementData.totals.fee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-end text-on-surface">{'\u20AC'}{ownerStatementData.totals.net.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
