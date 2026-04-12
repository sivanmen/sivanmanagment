import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Info,
  DollarSign,
  ChevronRight,
  FileText,
  CreditCard,
  Check,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type FeeStatus = 'DRAFT' | 'APPROVED' | 'INVOICED' | 'PAID';
type FeeType = 'PERCENTAGE' | 'MINIMUM';

interface FeeRecord {
  id: string;
  ownerId: string;
  propertyId: string;
  periodMonth: number;
  periodYear: number;
  totalIncome: number;
  feePercent: number;
  calculatedFee: number;
  minimumFee: number;
  appliedFee: number;
  feeType: FeeType;
  status: FeeStatus;
  property: {
    id: string;
    name: string;
    internalCode: string | null;
  };
  owner: {
    id: string;
    companyName: string | null;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface FeesListResponse {
  data: FeeRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface FeeSummaryResponse {
  data: {
    totalFees: number;
    totalIncome: number;
    totalCalculations: number;
    byStatus: Array<{
      status: FeeStatus;
      totalFees: number;
      count: number;
    }>;
    byOwner: Array<{
      ownerId: string;
      totalFees: number;
      totalIncome: number;
      count: number;
    }>;
  };
}

const feeStatusStyles: Record<FeeStatus, string> = {
  DRAFT: 'bg-outline-variant/20 text-on-surface-variant',
  APPROVED: 'bg-secondary/10 text-secondary',
  INVOICED: 'bg-warning/10 text-warning',
  PAID: 'bg-success/10 text-success',
};

const feeStatusLabels: Record<FeeStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
};

const nextStatus: Record<FeeStatus, FeeStatus | null> = {
  DRAFT: 'APPROVED',
  APPROVED: 'INVOICED',
  INVOICED: 'PAID',
  PAID: null,
};

const nextStatusLabels: Record<FeeStatus, string> = {
  DRAFT: 'Approve',
  APPROVED: 'Mark Invoiced',
  INVOICED: 'Mark Paid',
  PAID: '',
};

const feeTypeStyles: Record<FeeType, string> = {
  PERCENTAGE: 'bg-secondary/10 text-secondary',
  MINIMUM: 'bg-warning/10 text-warning',
};

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const years = ['2026', '2025', '2024'];

export default function ManagementFeesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedYear, setSelectedYear] = useState('2026');

  const periodMonth = months.indexOf(selectedMonth) + 1;
  const periodYear = parseInt(selectedYear);

  // ─── Queries ──────────────────────────────────────────────────

  const {
    data: feesData,
    isLoading,
    isError,
    error,
  } = useQuery<FeesListResponse>({
    queryKey: ['fees', periodMonth, periodYear],
    queryFn: async () => {
      const res = await apiClient.get('/fees', {
        params: { periodMonth, periodYear, limit: 100 },
      });
      return res.data;
    },
  });

  const { data: summaryData } = useQuery<FeeSummaryResponse>({
    queryKey: ['fees-summary', periodMonth, periodYear],
    queryFn: async () => {
      const res = await apiClient.get('/fees/summary', {
        params: { periodMonth, periodYear },
      });
      return res.data;
    },
  });

  // ─── Mutations ────────────────────────────────────────────────

  const calculateMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/fees/calculate', { periodMonth, periodYear }),
    onSuccess: () => {
      toast.success(`Fees calculated for ${selectedMonth} ${selectedYear}`);
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees-summary'] });
    },
    onError: () => {
      toast.error('Failed to calculate fees');
    },
  });

  const advanceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeeStatus }) =>
      apiClient.put(`/fees/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Fee status updated');
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees-summary'] });
    },
    onError: () => {
      toast.error('Failed to update fee status');
    },
  });

  // ─── Derived Data ─────────────────────────────────────────────

  const fees = feesData?.data ?? [];
  const summary = summaryData?.data;

  const totalFees = summary?.totalFees ?? fees.reduce((sum, f) => sum + f.appliedFee, 0);

  const byStatusMap: Record<FeeStatus, number> = { DRAFT: 0, APPROVED: 0, INVOICED: 0, PAID: 0 };
  if (summary?.byStatus) {
    for (const s of summary.byStatus) {
      byStatusMap[s.status] = s.totalFees;
    }
  } else {
    for (const f of fees) {
      byStatusMap[f.status] = (byStatusMap[f.status] ?? 0) + f.appliedFee;
    }
  }

  const handleAdvanceStatus = (id: string, currentStatus: FeeStatus) => {
    const next = nextStatus[currentStatus];
    if (next) {
      advanceStatusMutation.mutate({ id, status: next });
    }
  };

  const handleCalculateFees = () => {
    calculateMutation.mutate();
  };

  const getOwnerName = (fee: FeeRecord) => {
    if (fee.owner?.user) {
      return `${fee.owner.user.firstName} ${fee.owner.user.lastName}`;
    }
    if (fee.owner?.companyName) {
      return fee.owner.companyName;
    }
    return 'Unknown';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('finance.managementFees')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={handleCalculateFees}
            disabled={calculateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-60"
          >
            {calculateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            <span>{t('finance.calculateFees')}</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-on-surface mb-1">How Management Fees Work</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Management fee = <strong>MAX(income x fee%, minimum monthly fee)</strong>. For each property,
            the system calculates the percentage-based fee and compares it to the owner&apos;s minimum monthly fee.
            The higher value is applied as the management fee for that period.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Fees
            </p>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {'\u20AC'}{totalFees.toLocaleString()}
          </p>
        </div>
        {(['DRAFT', 'APPROVED', 'INVOICED', 'PAID'] as FeeStatus[]).map((status) => (
          <div key={status} className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {feeStatusLabels[status]}
              </p>
              <span className={`w-7 h-7 rounded-lg ${feeStatusStyles[status]} flex items-center justify-center`}>
                {status === 'DRAFT' && <FileText className="w-3.5 h-3.5" />}
                {status === 'APPROVED' && <Check className="w-3.5 h-3.5" />}
                {status === 'INVOICED' && <CreditCard className="w-3.5 h-3.5" />}
                {status === 'PAID' && <DollarSign className="w-3.5 h-3.5" />}
              </span>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">
              {'\u20AC'}{(byStatusMap[status] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20 gap-3 text-error">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">{(error as any)?.message || 'Failed to load fee calculations'}</p>
        </div>
      )}

      {/* Fees Table */}
      {!isLoading && !isError && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          {fees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Calculator className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No fee calculations for this period</p>
              <p className="text-xs mt-1 opacity-70">Click "Calculate Fees" to generate fee records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Owner
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Property
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Total {t('finance.income')}
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t('finance.feePercent')}
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Calculated
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t('finance.minimumFee')}
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t('finance.appliedFee')}
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Type
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-on-surface">{getOwnerName(fee)}</td>
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{fee.property?.name ?? '-'}</td>
                      <td className="py-3 px-4 text-sm text-end text-on-surface">
                        {'\u20AC'}{Number(fee.totalIncome).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                        {Number(fee.feePercent)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                        {'\u20AC'}{Number(fee.calculatedFee).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                        {'\u20AC'}{Number(fee.minimumFee).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-end font-bold text-secondary">
                        {'\u20AC'}{Number(fee.appliedFee).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${feeTypeStyles[fee.feeType]}`}
                        >
                          {fee.feeType === 'PERCENTAGE' ? '%' : 'MIN'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${feeStatusStyles[fee.status]}`}
                        >
                          {feeStatusLabels[fee.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {nextStatus[fee.status] ? (
                          <button
                            onClick={() => handleAdvanceStatus(fee.id, fee.status)}
                            disabled={advanceStatusMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors disabled:opacity-60"
                          >
                            {nextStatusLabels[fee.status]}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <Check className="w-4 h-4 text-success mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
