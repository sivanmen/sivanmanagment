import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Eye,
  ChevronDown,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Printer,
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
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'sonner';

type StatementStatus = 'finalized' | 'draft' | 'pending_review';

interface StatementProperty {
  name: string;
  bookingRevenue: number;
  extraCharges: number;
  expenses: number;
  managementFee: number;
  netPayout: number;
  bookings: number;
  occupancy: number;
}

interface MonthlyStatement {
  id: string;
  period: string;
  periodLabel: string;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  managementFees: number;
  netPayout: number;
  status: StatementStatus;
  generatedAt: string;
  properties: StatementProperty[];
}

const statusConfig: Record<StatementStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  finalized: { label: 'Finalized', color: 'bg-success/10 text-success', icon: CheckCircle },
  draft: { label: 'Draft', color: 'bg-warning/10 text-warning', icon: Clock },
  pending_review: { label: 'Pending Review', color: 'bg-secondary/10 text-secondary', icon: Eye },
};

const demoStatements: MonthlyStatement[] = [
  {
    id: 'STM-2026-03',
    period: '2026-03',
    periodLabel: 'March 2026',
    year: 2026,
    totalRevenue: 18420,
    totalExpenses: 4280,
    managementFees: 2763,
    netPayout: 11377,
    status: 'finalized',
    generatedAt: '2026-04-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 8200, extraCharges: 450, expenses: 1800, managementFee: 1297, netPayout: 5553, bookings: 4, occupancy: 87 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 5400, extraCharges: 280, expenses: 1380, managementFee: 852, netPayout: 3448, bookings: 3, occupancy: 78 },
      { name: 'Chania Old Town Residence', bookingRevenue: 4090, extraCharges: 0, expenses: 1100, managementFee: 614, netPayout: 2376, bookings: 2, occupancy: 62 },
    ],
  },
  {
    id: 'STM-2026-02',
    period: '2026-02',
    periodLabel: 'February 2026',
    year: 2026,
    totalRevenue: 14800,
    totalExpenses: 3900,
    managementFees: 2220,
    netPayout: 8680,
    status: 'finalized',
    generatedAt: '2026-03-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 6200, extraCharges: 200, expenses: 1500, managementFee: 960, netPayout: 3940, bookings: 3, occupancy: 72 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 4800, extraCharges: 180, expenses: 1200, managementFee: 747, netPayout: 3033, bookings: 2, occupancy: 65 },
      { name: 'Chania Old Town Residence', bookingRevenue: 3420, extraCharges: 0, expenses: 1200, managementFee: 513, netPayout: 1707, bookings: 2, occupancy: 58 },
    ],
  },
  {
    id: 'STM-2026-01',
    period: '2026-01',
    periodLabel: 'January 2026',
    year: 2026,
    totalRevenue: 12600,
    totalExpenses: 3650,
    managementFees: 1890,
    netPayout: 7060,
    status: 'finalized',
    generatedAt: '2026-02-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 5400, extraCharges: 150, expenses: 1300, managementFee: 832, netPayout: 3418, bookings: 2, occupancy: 58 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 4000, extraCharges: 100, expenses: 1150, managementFee: 615, netPayout: 2335, bookings: 2, occupancy: 52 },
      { name: 'Chania Old Town Residence', bookingRevenue: 2950, extraCharges: 0, expenses: 1200, managementFee: 443, netPayout: 1307, bookings: 1, occupancy: 42 },
    ],
  },
  {
    id: 'STM-2025-12',
    period: '2025-12',
    periodLabel: 'December 2025',
    year: 2025,
    totalRevenue: 16200,
    totalExpenses: 4100,
    managementFees: 2430,
    netPayout: 9670,
    status: 'finalized',
    generatedAt: '2026-01-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 7100, extraCharges: 350, expenses: 1700, managementFee: 1118, netPayout: 4632, bookings: 3, occupancy: 80 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 5000, extraCharges: 200, expenses: 1300, managementFee: 780, netPayout: 3120, bookings: 3, occupancy: 70 },
      { name: 'Chania Old Town Residence', bookingRevenue: 3550, extraCharges: 0, expenses: 1100, managementFee: 532, netPayout: 1918, bookings: 2, occupancy: 55 },
    ],
  },
  {
    id: 'STM-2025-11',
    period: '2025-11',
    periodLabel: 'November 2025',
    year: 2025,
    totalRevenue: 15100,
    totalExpenses: 3800,
    managementFees: 2265,
    netPayout: 9035,
    status: 'finalized',
    generatedAt: '2025-12-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 6800, extraCharges: 300, expenses: 1500, managementFee: 1065, netPayout: 4535, bookings: 3, occupancy: 76 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 4700, extraCharges: 150, expenses: 1200, managementFee: 728, netPayout: 2922, bookings: 2, occupancy: 64 },
      { name: 'Chania Old Town Residence', bookingRevenue: 3150, extraCharges: 0, expenses: 1100, managementFee: 472, netPayout: 1578, bookings: 2, occupancy: 50 },
    ],
  },
  {
    id: 'STM-2025-10',
    period: '2025-10',
    periodLabel: 'October 2025',
    year: 2025,
    totalRevenue: 19800,
    totalExpenses: 4500,
    managementFees: 2970,
    netPayout: 12330,
    status: 'finalized',
    generatedAt: '2025-11-02',
    properties: [
      { name: 'Aegean Sunset Villa', bookingRevenue: 8900, extraCharges: 500, expenses: 2000, managementFee: 1410, netPayout: 5990, bookings: 5, occupancy: 92 },
      { name: 'Heraklion Harbor Suite', bookingRevenue: 5800, extraCharges: 300, expenses: 1400, managementFee: 915, netPayout: 3785, bookings: 3, occupancy: 82 },
      { name: 'Chania Old Town Residence', bookingRevenue: 4300, extraCharges: 0, expenses: 1100, managementFee: 645, netPayout: 2555, bookings: 3, occupancy: 72 },
    ],
  },
];

const monthlyTrend = [
  { month: 'Oct', revenue: 19800, payout: 12330 },
  { month: 'Nov', revenue: 15100, payout: 9035 },
  { month: 'Dec', revenue: 16200, payout: 9670 },
  { month: 'Jan', revenue: 12600, payout: 7060 },
  { month: 'Feb', revenue: 14800, payout: 8680 },
  { month: 'Mar', revenue: 18420, payout: 11377 },
];

export default function StatementsPage() {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [expandedId, setExpandedId] = useState<string | null>('STM-2026-03');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStatements = demoStatements.filter((s) => {
    const matchesYear = s.year === selectedYear;
    const matchesSearch = searchQuery === '' || s.periodLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const yearlyTotals = demoStatements
    .filter((s) => s.year === selectedYear)
    .reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.totalRevenue,
        expenses: acc.expenses + s.totalExpenses,
        fees: acc.fees + s.managementFees,
        payout: acc.payout + s.netPayout,
      }),
      { revenue: 0, expenses: 0, fees: 0, payout: 0 }
    );

  const handleDownloadPdf = (statementId: string) => {
    toast.success(`Downloading PDF for ${statementId}...`, {
      description: 'Your statement will download shortly.',
    });
  };

  const handlePrint = (statementId: string) => {
    toast.success(`Preparing print view for ${statementId}...`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Finance
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Monthly Statements
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Revenue statements and payout summaries for your properties in Crete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Yearly Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Revenue</p>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            ${yearlyTotals.revenue.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">{selectedYear} year-to-date</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Expenses</p>
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-error" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            ${yearlyTotals.expenses.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">{selectedYear} year-to-date</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Management Fees</p>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            ${yearlyTotals.fees.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">15% of gross revenue</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Net Payout</p>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            ${yearlyTotals.payout.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Deposited to your account</p>
        </div>
      </div>

      {/* Revenue vs Payout Trend */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Revenue vs Net Payout</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-on-surface-variant">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-on-surface-variant">Net Payout</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#6b38d4" strokeWidth={2} dot={{ fill: '#6b38d4', r: 4 }} />
              <Line type="monotone" dataKey="payout" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search statements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Statements List */}
      <div className="space-y-4">
        {filteredStatements.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
            <FileText className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-on-surface-variant text-sm">No statements found for the selected year.</p>
          </div>
        )}

        {filteredStatements.map((statement) => {
          const isExpanded = expandedId === statement.id;
          const StatusIcon = statusConfig[statement.status].icon;

          return (
            <div
              key={statement.id}
              className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden"
            >
              {/* Statement Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : statement.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low/50 transition-colors text-start"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-semibold text-on-surface">
                      {statement.periodLabel}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-on-surface-variant">
                        Generated: {new Date(statement.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[statement.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[statement.status].label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-end">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Net Payout</p>
                    <p className="font-headline text-lg font-bold text-success">
                      ${statement.netPayout.toLocaleString()}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-surface-container-high">
                  {/* Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-surface-container-low/30">
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Gross Revenue</p>
                      <p className="text-lg font-bold text-on-surface">${statement.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Expenses</p>
                      <p className="text-lg font-bold text-error">${statement.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Mgmt. Fees (15%)</p>
                      <p className="text-lg font-bold text-warning">${statement.managementFees.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Net Payout</p>
                      <p className="text-lg font-bold text-success">${statement.netPayout.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Property Breakdown Table */}
                  <div className="p-5">
                    <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-secondary" />
                      Property Breakdown
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-surface-container-high">
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Bookings</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Occupancy</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Revenue</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Extras</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Expenses</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Mgmt. Fee</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Net Payout</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statement.properties.map((prop, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                                  <span className="text-sm text-on-surface font-medium">{prop.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 hidden md:table-cell">
                                <span className="text-sm text-on-surface">{prop.bookings}</span>
                              </td>
                              <td className="py-3 px-3 hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-secondary"
                                      style={{ width: `${prop.occupancy}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-on-surface-variant">{prop.occupancy}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-semibold text-on-surface">${prop.bookingRevenue.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 hidden lg:table-cell">
                                <span className="text-sm text-on-surface">${prop.extraCharges.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 hidden lg:table-cell">
                                <span className="text-sm text-error">-${prop.expenses.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 hidden lg:table-cell">
                                <span className="text-sm text-warning">-${prop.managementFee.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-bold text-success">${prop.netPayout.toLocaleString()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 p-5 pt-0">
                    <button
                      onClick={() => handlePrint(statement.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(statement.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
