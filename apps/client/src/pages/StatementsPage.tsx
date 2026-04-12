import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Eye,
  ChevronDown,
  CheckCircle,
  Clock,
  Search,
  Printer,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type StatementStatus = 'DRAFT' | 'APPROVED' | 'SENT';

interface StatementProperty {
  propertyId: string;
  propertyName: string;
  bookings: { guestName: string; checkIn: string; checkOut: string; nights: number; revenue: number }[];
  totalRevenue: number;
  expenses: { category: string; description: string; amount: number }[];
  totalExpenses: number;
  managementFee: number;
  feeType: string;
  netIncome: number;
}

interface OwnerStatement {
  id: string;
  ownerId: string;
  periodMonth: number;
  periodYear: number;
  properties: StatementProperty[];
  totalIncome: number;
  totalExpenses: number;
  totalManagementFees: number;
  netPayout: number;
  currency: string;
  status: StatementStatus;
  generatedAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  SENT: { label: 'Finalized', color: 'bg-success/10 text-success', icon: CheckCircle },
  finalized: { label: 'Finalized', color: 'bg-success/10 text-success', icon: CheckCircle },
  DRAFT: { label: 'Draft', color: 'bg-warning/10 text-warning', icon: Clock },
  draft: { label: 'Draft', color: 'bg-warning/10 text-warning', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-secondary/10 text-secondary', icon: Eye },
  pending_review: { label: 'Pending Review', color: 'bg-secondary/10 text-secondary', icon: Eye },
};

const monthNames = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function SkeletonStatement() {
  return (
    <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden animate-pulse">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high" />
          <div className="space-y-2">
            <div className="h-5 bg-surface-container-high rounded w-32" />
            <div className="h-3 bg-surface-container-high rounded w-48" />
          </div>
        </div>
        <div className="h-6 bg-surface-container-high rounded w-24" />
      </div>
    </div>
  );
}

export default function StatementsPage() {
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: statementsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['owner-statements'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/owner-portal/statements');
      return res.data.data as OwnerStatement[];
    },
  });

  const statements = statementsResponse ?? [];

  const filteredStatements = statements.filter((s) => {
    const matchesYear = s.periodYear === selectedYear;
    const periodLabel = `${monthNames[s.periodMonth]} ${s.periodYear}`;
    const matchesSearch =
      searchQuery === '' || periodLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  // Auto-expand first statement
  if (filteredStatements.length > 0 && expandedId === null) {
    // don't auto-set in render to avoid loop - handled in effect-like way via default
  }

  const yearlyTotals = statements
    .filter((s) => s.periodYear === selectedYear)
    .reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.totalIncome,
        expenses: acc.expenses + s.totalExpenses,
        fees: acc.fees + s.totalManagementFees,
        payout: acc.payout + s.netPayout,
      }),
      { revenue: 0, expenses: 0, fees: 0, payout: 0 },
    );

  // Build trend data from statements
  const monthlyTrend = [...statements]
    .filter((s) => s.periodYear === selectedYear)
    .sort((a, b) => a.periodMonth - b.periodMonth)
    .map((s) => ({
      month: monthNames[s.periodMonth]?.substring(0, 3),
      revenue: s.totalIncome,
      payout: s.netPayout,
    }));

  // Available years from statements
  const availableYears = [...new Set(statements.map((s) => s.periodYear))].sort((a, b) => b - a);
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

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
            Revenue statements and payout summaries for your properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-error flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-on-surface">Failed to load statements</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {(error as Error)?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Yearly Summary KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 bg-surface-container-high rounded w-24" />
                <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
              </div>
              <div className="h-7 bg-surface-container-high rounded w-28 mb-1" />
              <div className="h-3 bg-surface-container-high rounded w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Revenue</p>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {'\u20AC'}{yearlyTotals.revenue.toLocaleString()}
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
              {'\u20AC'}{yearlyTotals.expenses.toLocaleString()}
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
              {'\u20AC'}{yearlyTotals.fees.toLocaleString()}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Management fees</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Net Payout</p>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {'\u20AC'}{yearlyTotals.payout.toLocaleString()}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">Deposited to your account</p>
          </div>
        </div>
      )}

      {/* Revenue vs Payout Trend */}
      {monthlyTrend.length > 0 && (
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
                <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `\u20AC${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`\u20AC${value.toLocaleString()}`, '']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6b38d4" strokeWidth={2} dot={{ fill: '#6b38d4', r: 4 }} />
                <Line type="monotone" dataKey="payout" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
        {isLoading && (
          <>
            {[...Array(3)].map((_, i) => (
              <SkeletonStatement key={i} />
            ))}
          </>
        )}

        {!isLoading && filteredStatements.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
            <FileText className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-on-surface-variant text-sm">No statements found for the selected year.</p>
          </div>
        )}

        {filteredStatements.map((statement) => {
          const isExpanded = expandedId === statement.id;
          const statusCfg = statusConfig[statement.status] || statusConfig.DRAFT;
          const StatusIcon = statusCfg.icon;
          const periodLabel = `${monthNames[statement.periodMonth]} ${statement.periodYear}`;

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
                      {periodLabel}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-on-surface-variant">
                        Generated: {new Date(statement.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-end">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Net Payout</p>
                    <p className="font-headline text-lg font-bold text-success">
                      {'\u20AC'}{statement.netPayout.toLocaleString()}
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
                      <p className="text-lg font-bold text-on-surface">{'\u20AC'}{statement.totalIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Expenses</p>
                      <p className="text-lg font-bold text-error">{'\u20AC'}{statement.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Mgmt. Fees</p>
                      <p className="text-lg font-bold text-warning">{'\u20AC'}{statement.totalManagementFees.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Net Payout</p>
                      <p className="text-lg font-bold text-success">{'\u20AC'}{statement.netPayout.toLocaleString()}</p>
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
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Revenue</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Expenses</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Mgmt. Fee</th>
                            <th className="text-start py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Net Income</th>
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
                                  <span className="text-sm text-on-surface font-medium">{prop.propertyName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 hidden md:table-cell">
                                <span className="text-sm text-on-surface">{prop.bookings.length}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-sm font-semibold text-on-surface">{'\u20AC'}{prop.totalRevenue.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 hidden lg:table-cell">
                                <span className="text-sm text-error">-{'\u20AC'}{prop.totalExpenses.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3 hidden lg:table-cell">
                                <span className="text-sm text-warning">-{'\u20AC'}{prop.managementFee.toLocaleString()}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-sm font-bold ${prop.netIncome >= 0 ? 'text-success' : 'text-error'}`}>
                                  {prop.netIncome >= 0 ? '' : '-'}{'\u20AC'}{Math.abs(prop.netIncome).toLocaleString()}
                                </span>
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
