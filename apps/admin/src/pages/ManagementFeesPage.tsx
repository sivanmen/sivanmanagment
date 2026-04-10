import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  Info,
  DollarSign,
  ChevronRight,
  FileText,
  CreditCard,
  Check,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type FeeStatus = 'DRAFT' | 'APPROVED' | 'INVOICED' | 'PAID';
type FeeType = 'PERCENTAGE' | 'MINIMUM';

interface FeeCalculation {
  id: string;
  ownerName: string;
  propertyName: string;
  totalIncome: number;
  feePercent: number;
  calculatedFee: number;
  minimumFee: number;
  appliedFee: number;
  feeType: FeeType;
  status: FeeStatus;
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

const demoFees: FeeCalculation[] = [
  { id: '1', ownerName: 'Dimitris Papadopoulos', propertyName: 'Santorini Sunset Villa', totalIncome: 12400, feePercent: 10, calculatedFee: 1240, minimumFee: 400, appliedFee: 1240, feeType: 'PERCENTAGE', status: 'PAID' },
  { id: '2', ownerName: 'Dimitris Papadopoulos', propertyName: 'Athens Central Loft', totalIncome: 2800, feePercent: 12, calculatedFee: 336, minimumFee: 400, appliedFee: 400, feeType: 'MINIMUM', status: 'INVOICED' },
  { id: '3', ownerName: 'Maria Konstantinou', propertyName: 'Mykonos Beach House', totalIncome: 9800, feePercent: 10, calculatedFee: 980, minimumFee: 350, appliedFee: 980, feeType: 'PERCENTAGE', status: 'APPROVED' },
  { id: '4', ownerName: 'Maria Konstantinou', propertyName: 'Crete Harbor Suite', totalIncome: 3100, feePercent: 15, calculatedFee: 465, minimumFee: 500, appliedFee: 500, feeType: 'MINIMUM', status: 'DRAFT' },
  { id: '5', ownerName: 'Yannis Alexiou', propertyName: 'Rhodes Old Town Apt', totalIncome: 5400, feePercent: 10, calculatedFee: 540, minimumFee: 300, appliedFee: 540, feeType: 'PERCENTAGE', status: 'DRAFT' },
  { id: '6', ownerName: 'Yannis Alexiou', propertyName: 'Paros Seaside Studio', totalIncome: 1800, feePercent: 12, calculatedFee: 216, minimumFee: 350, appliedFee: 350, feeType: 'MINIMUM', status: 'DRAFT' },
  { id: '7', ownerName: 'Elena Michailidou', propertyName: 'Corfu Garden Villa', totalIncome: 7600, feePercent: 10, calculatedFee: 760, minimumFee: 400, appliedFee: 760, feeType: 'PERCENTAGE', status: 'APPROVED' },
  { id: '8', ownerName: 'Elena Michailidou', propertyName: 'Zakynthos Blue Apt', totalIncome: 2200, feePercent: 10, calculatedFee: 220, minimumFee: 300, appliedFee: 300, feeType: 'MINIMUM', status: 'INVOICED' },
];

export default function ManagementFeesPage() {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [fees, setFees] = useState(demoFees);

  const totalFees = fees.reduce((sum, f) => sum + f.appliedFee, 0);
  const byStatus = fees.reduce<Record<FeeStatus, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + f.appliedFee;
    return acc;
  }, {} as Record<FeeStatus, number>);

  const handleAdvanceStatus = (id: string) => {
    setFees((prev) =>
      prev.map((f) => {
        if (f.id === id && nextStatus[f.status]) {
          return { ...f, status: nextStatus[f.status]! };
        }
        return f;
      }),
    );
    toast.success('Fee status updated');
  };

  const handleCalculateFees = () => {
    toast.success(`Fees calculated for ${selectedMonth} ${selectedYear}`);
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Calculator className="w-4 h-4" />
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
              {'\u20AC'}{(byStatus[status] ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Fees Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
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
                  <td className="py-3 px-4 text-sm font-medium text-on-surface">{fee.ownerName}</td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">{fee.propertyName}</td>
                  <td className="py-3 px-4 text-sm text-end text-on-surface">
                    {'\u20AC'}{fee.totalIncome.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                    {fee.feePercent}%
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                    {'\u20AC'}{fee.calculatedFee.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end text-on-surface-variant">
                    {'\u20AC'}{fee.minimumFee.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-end font-bold text-secondary">
                    {'\u20AC'}{fee.appliedFee.toLocaleString()}
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
                        onClick={() => handleAdvanceStatus(fee.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
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
      </div>
    </div>
  );
}
