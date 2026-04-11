import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertCircle,
  DollarSign,
  MessageCircle,
  Send,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

type ApprovalStatus = 'AUTO_APPROVED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_WHATSAPP';

interface ExpenseRecord {
  id: string;
  date: string;
  propertyName: string;
  propertyId: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  whatsappSentAt?: string;
}

const expenseCategories = [
  'All',
  'MAINTENANCE',
  'UTILITIES',
  'CLEANING',
  'INSURANCE',
  'SUPPLIES',
  'TAXES',
  'OTHER',
] as const;

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  CLEANING: 'Cleaning',
  INSURANCE: 'Insurance',
  SUPPLIES: 'Supplies',
  TAXES: 'Taxes',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-secondary/10 text-secondary',
  UTILITIES: 'bg-success/10 text-success',
  CLEANING: 'bg-warning/10 text-warning',
  INSURANCE: 'bg-error/10 text-error',
  SUPPLIES: 'bg-outline-variant/20 text-on-surface-variant',
  TAXES: 'bg-secondary/10 text-secondary',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const approvalStatusStyles: Record<ApprovalStatus, string> = {
  AUTO_APPROVED: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  PENDING_WHATSAPP: 'bg-emerald-500/10 text-emerald-400',
  APPROVED: 'bg-secondary/10 text-secondary',
  REJECTED: 'bg-error/10 text-error',
};

const approvalStatusLabels: Record<ApprovalStatus, string> = {
  AUTO_APPROVED: 'Auto-Approved',
  PENDING: 'Pending',
  PENDING_WHATSAPP: 'Pending WhatsApp',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const demoProperties = ['All', 'Santorini Sunset Villa', 'Athens Central Loft', 'Mykonos Beach House', 'Crete Harbor Suite', 'Rhodes Old Town Apt'];
const approvalFilters = ['All', 'PENDING', 'PENDING_WHATSAPP', 'APPROVED', 'REJECTED', 'AUTO_APPROVED'] as const;

const demoExpenses: ExpenseRecord[] = [
  { id: '1', date: '2026-04-10', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'MAINTENANCE', description: 'Plumber - kitchen faucet repair', vendor: 'Nikos Plumbing Co.', amount: 180, approvalStatus: 'PENDING' },
  { id: '2', date: '2026-04-09', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'CLEANING', description: 'Deep cleaning after guest checkout', vendor: 'SparkClean Athens', amount: 95, approvalStatus: 'AUTO_APPROVED' },
  { id: '3', date: '2026-04-08', propertyName: 'Mykonos Beach House', propertyId: 'p3', category: 'UTILITIES', description: 'Electricity bill - March 2026', vendor: 'HEDNO S.A.', amount: 320, approvalStatus: 'APPROVED', approvedBy: 'Dimitris P.', approvedAt: '2026-04-08T14:30:00Z' },
  { id: '4', date: '2026-04-07', propertyName: 'Crete Harbor Suite', propertyId: 'p4', category: 'SUPPLIES', description: 'Linens and towels replacement', vendor: 'Hospitality Supply GR', amount: 450, approvalStatus: 'PENDING_WHATSAPP', whatsappSentAt: '2026-04-07T10:00:00Z' },
  { id: '5', date: '2026-04-06', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'INSURANCE', description: 'Annual property insurance premium', vendor: 'Ethniki Insurance', amount: 1200, approvalStatus: 'APPROVED', approvedBy: 'Owner via WhatsApp', approvedAt: '2026-04-06T16:20:00Z' },
  { id: '6', date: '2026-04-05', propertyName: 'Rhodes Old Town Apt', propertyId: 'p5', category: 'MAINTENANCE', description: 'AC unit servicing', vendor: 'Cool Air Services', amount: 150, approvalStatus: 'AUTO_APPROVED' },
  { id: '7', date: '2026-04-04', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'UTILITIES', description: 'Water bill - Q1 2026', vendor: 'EYDAP S.A.', amount: 85, approvalStatus: 'AUTO_APPROVED' },
  { id: '8', date: '2026-04-03', propertyName: 'Mykonos Beach House', propertyId: 'p3', category: 'MAINTENANCE', description: 'Pool pump replacement', vendor: 'Pool Masters GR', amount: 780, approvalStatus: 'PENDING_WHATSAPP', whatsappSentAt: '2026-04-03T09:15:00Z' },
  { id: '9', date: '2026-04-02', propertyName: 'Crete Harbor Suite', propertyId: 'p4', category: 'CLEANING', description: 'Monthly pest control', vendor: 'PestGuard Crete', amount: 60, approvalStatus: 'AUTO_APPROVED' },
  { id: '10', date: '2026-04-01', propertyName: 'Santorini Sunset Villa', propertyId: 'p1', category: 'TAXES', description: 'Property tax Q1 2026', vendor: 'Hellenic Tax Authority', amount: 520, approvalStatus: 'APPROVED', approvedBy: 'Owner via WhatsApp', approvedAt: '2026-04-01T11:45:00Z' },
  { id: '11', date: '2026-03-29', propertyName: 'Rhodes Old Town Apt', propertyId: 'p5', category: 'SUPPLIES', description: 'Kitchen supplies restock', vendor: 'Metro Cash & Carry', amount: 110, approvalStatus: 'REJECTED' },
  { id: '12', date: '2026-03-27', propertyName: 'Athens Central Loft', propertyId: 'p2', category: 'MAINTENANCE', description: 'Exterior paint touch-up', vendor: 'Athens Painters', amount: 350, approvalStatus: 'PENDING' },
];

export default function ExpenseListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('2026');
  const [page, setPage] = useState(1);
  const [expenses, setExpenses] = useState(demoExpenses);
  const pageSize = 8;

  const filtered = expenses.filter((rec) => {
    if (propertyFilter !== 'All' && rec.propertyName !== propertyFilter) return false;
    if (categoryFilter !== 'All' && rec.category !== categoryFilter) return false;
    if (approvalFilter !== 'All' && rec.approvalStatus !== approvalFilter) return false;
    if (search && !rec.description.toLowerCase().includes(search.toLowerCase()) && !rec.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalExpenses = filtered.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = expenses.filter((r) => r.approvalStatus === 'PENDING').length;
  const pendingWhatsAppCount = expenses.filter((r) => r.approvalStatus === 'PENDING_WHATSAPP').length;
  const approvedThisMonth = expenses.filter((r) => r.approvalStatus === 'APPROVED' || r.approvalStatus === 'AUTO_APPROVED').length;

  const handleApprove = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, approvalStatus: 'APPROVED' as ApprovalStatus, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : e)),
    );
    toast.success('Expense approved');
  };

  const handleReject = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, approvalStatus: 'REJECTED' as ApprovalStatus } : e)),
    );
    toast.success('Expense rejected');
  };

  const handleRequestApproval = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, approvalStatus: 'PENDING_WHATSAPP' as ApprovalStatus, whatsappSentAt: new Date().toISOString() } : e)),
    );
    toast.success('Approval request sent via WhatsApp');
  };

  const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['2026', '2025', '2024'];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('finance.expenses')}
          </h1>
        </div>
        <Link
          to="/finance/expenses/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('finance.addExpense')}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {demoProperties.map((p) => (
            <option key={p} value={p}>
              {p === 'All' ? 'All Properties' : p}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {expenseCategories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : categoryLabels[c] ?? c}
            </option>
          ))}
        </select>
        <select
          value={approvalFilter}
          onChange={(e) => {
            setApprovalFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {approvalFilters.map((a) => (
            <option key={a} value={a}>
              {a === 'All' ? 'All Statuses' : approvalStatusLabels[a as ApprovalStatus] ?? a}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Expenses
            </p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {'\u20AC'}{totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Approval
            </p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{pendingCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Awaiting WhatsApp
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{pendingWhatsAppCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Approved This Month
            </p>
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{approvedThisMonth}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Date
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Property
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.category')}
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Description
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.vendor')}
                </th>
                <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.amount')}
                </th>
                <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {t('finance.approval')}
                </th>
                <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((rec) => (
                <tr
                  key={rec.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-on-surface-variant">{rec.date}</td>
                  <td className="py-3 px-4 text-sm font-medium text-on-surface">
                    {rec.propertyName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryColors[rec.category] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                    >
                      {categoryLabels[rec.category] ?? rec.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant max-w-[200px] truncate">
                    {rec.description}
                  </td>
                  <td className="py-3 px-4 text-sm text-on-surface-variant">{rec.vendor}</td>
                  <td className="py-3 px-4 text-sm text-end font-semibold text-error">
                    {'\u20AC'}{rec.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit ${approvalStatusStyles[rec.approvalStatus]}`}
                      >
                        {rec.approvalStatus === 'PENDING_WHATSAPP' && (
                          <MessageCircle className="w-3 h-3" />
                        )}
                        {approvalStatusLabels[rec.approvalStatus]}
                      </span>
                      {rec.approvedBy && (
                        <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                          <User className="w-2.5 h-2.5" />
                          {rec.approvedBy}
                          {rec.approvedAt && (
                            <span className="opacity-60">
                              {new Date(rec.approvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      )}
                      {rec.whatsappSentAt && rec.approvalStatus === 'PENDING_WHATSAPP' && (
                        <span className="text-[10px] text-emerald-400/70">
                          Sent {new Date(rec.whatsappSentAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {rec.approvalStatus === 'PENDING' ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleApprove(rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          {t('finance.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          {t('finance.reject')}
                        </button>
                        {rec.amount > 300 && (
                          <button
                            onClick={() => handleRequestApproval(rec.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            WhatsApp
                          </button>
                        )}
                      </div>
                    ) : rec.approvalStatus === 'PENDING_WHATSAPP' ? (
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleApprove(rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          {t('finance.approve')}
                        </button>
                        <button
                          onClick={() => handleReject(rec.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          {t('finance.reject')}
                        </button>
                        <span className="text-[10px] text-on-surface-variant italic">Awaiting reply</span>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant text-center block">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'gradient-accent text-white'
                  : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
