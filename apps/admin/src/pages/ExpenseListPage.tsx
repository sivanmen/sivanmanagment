import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  DollarSign,
  MessageCircle,
  Send,
  User,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type ApprovalStatus = 'AUTO_APPROVED' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface Expense {
  id: string;
  propertyId: string | null;
  category: string;
  amount: string | number;
  currency: string;
  description: string;
  date: string;
  vendor: string | null;
  receiptUrl: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  whatsappApprovalMsgId: string | null;
  isRecurring: boolean;
  notes: string | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    internalCode: string | null;
  } | null;
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface ExpensesResponse {
  data: Expense[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  data: {
    totalExpenses: number;
    count: number;
    averageExpense: number;
    byCategory: Record<string, number>;
    byProperty: Record<string, number>;
    byStatus: {
      pending: number;
      approved: number;
      auto_approved: number;
      rejected: number;
    };
  };
}

const expenseCategories = [
  'All',
  'MAINTENANCE',
  'UTILITIES',
  'CLEANING',
  'INSURANCE',
  'SUPPLIES',
  'TAX',
  'MARKETING',
  'MANAGEMENT',
  'MISC',
] as const;

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  CLEANING: 'Cleaning',
  INSURANCE: 'Insurance',
  SUPPLIES: 'Supplies',
  TAX: 'Taxes',
  MARKETING: 'Marketing',
  MANAGEMENT: 'Management',
  MISC: 'Other',
};

const categoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-secondary/10 text-secondary',
  UTILITIES: 'bg-success/10 text-success',
  CLEANING: 'bg-warning/10 text-warning',
  INSURANCE: 'bg-error/10 text-error',
  SUPPLIES: 'bg-outline-variant/20 text-on-surface-variant',
  TAX: 'bg-secondary/10 text-secondary',
  MARKETING: 'bg-blue-500/10 text-blue-400',
  MANAGEMENT: 'bg-purple-500/10 text-purple-400',
  MISC: 'bg-outline-variant/20 text-on-surface-variant',
};

const approvalStatusStyles: Record<string, string> = {
  AUTO_APPROVED: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  PENDING_WHATSAPP: 'bg-emerald-500/10 text-emerald-400',
  APPROVED: 'bg-secondary/10 text-secondary',
  REJECTED: 'bg-error/10 text-error',
};

const approvalStatusLabels: Record<string, string> = {
  AUTO_APPROVED: 'Auto-Approved',
  PENDING: 'Pending',
  PENDING_WHATSAPP: 'Pending WhatsApp',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const approvalFilters = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED'] as const;

/** Derive a display-level status: if PENDING + has a whatsapp msg id, show as PENDING_WHATSAPP */
function getDisplayStatus(expense: Expense): string {
  if (expense.approvalStatus === 'PENDING' && expense.whatsappApprovalMsgId) {
    return 'PENDING_WHATSAPP';
  }
  return expense.approvalStatus;
}

export default function ExpenseListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('2026');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // ── Fetch properties for filter dropdown ──
  const { data: propertiesData } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ['properties-list-minimal'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 100 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const properties = propertiesData?.data ?? [];

  // ── Fetch expenses with server-side filtering + pagination ──
  const { data: expensesData, isLoading, isError, error } = useQuery<ExpensesResponse>({
    queryKey: ['expenses', { search, propertyId: propertyFilter, category: categoryFilter, approvalStatus: approvalFilter, year: yearFilter, page, limit: pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize, sortBy: 'date', sortOrder: 'desc' };
      if (search) params.search = search;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (approvalFilter !== 'All') params.approvalStatus = approvalFilter;
      // Date range based on year filter
      params.startDate = `${yearFilter}-01-01`;
      params.endDate = `${yearFilter}-12-31`;
      const res = await apiClient.get('/expenses', { params });
      return res.data;
    },
  });

  const expenses = expensesData?.data ?? [];
  const totalPages = expensesData?.meta?.totalPages ?? 1;
  const totalRecords = expensesData?.meta?.total ?? 0;

  // ── Fetch stats ──
  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ['expenses-stats', { propertyId: propertyFilter, year: yearFilter }],
    queryFn: async () => {
      const params: Record<string, string> = {
        startDate: `${yearFilter}-01-01`,
        endDate: `${yearFilter}-12-31`,
      };
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      const res = await apiClient.get('/expenses/stats', { params });
      return res.data;
    },
  });

  const stats = statsData?.data;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const pendingCount = stats?.byStatus?.pending ?? 0;
  const approvedCount = (stats?.byStatus?.approved ?? 0) + (stats?.byStatus?.auto_approved ?? 0);

  // ── Approve mutation ──
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
    },
    onError: () => {
      toast.error('Failed to approve expense');
    },
  });

  // ── Reject mutation ──
  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/expenses/${id}/reject`),
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
    },
    onError: () => {
      toast.error('Failed to reject expense');
    },
  });

  // ── Request WhatsApp approval mutation ──
  const requestApprovalMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/expenses/${id}/request-approval`),
    onSuccess: () => {
      toast.success('Approval request sent via WhatsApp');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => {
      toast.error('Failed to send WhatsApp approval request');
    },
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
    },
    onError: () => {
      toast.error('Failed to delete expense');
    },
  });

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
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
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
              {a === 'All' ? 'All Statuses' : approvalStatusLabels[a] ?? a}
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
              Total Records
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{stats?.count ?? 0}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Approved This Year
            </p>
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{approvedCount}</p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="ml-3 text-on-surface-variant">Loading expenses...</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-error">
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium">Failed to load expenses</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {(error as Error)?.message ?? 'Unknown error'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <DollarSign className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No expenses found</p>
          <p className="text-xs mt-1">Try adjusting your filters or add a new expense.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && expenses.length > 0 && (
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
                {expenses.map((rec) => {
                  const displayStatus = getDisplayStatus(rec);
                  const amount = typeof rec.amount === 'string' ? parseFloat(rec.amount) : rec.amount;
                  const approverName = rec.approvedBy
                    ? `${rec.approvedBy.firstName} ${rec.approvedBy.lastName}`
                    : rec.whatsappApprovalMsgId && rec.approvalStatus === 'APPROVED'
                      ? 'Owner via WhatsApp'
                      : undefined;

                  return (
                    <tr
                      key={rec.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-on-surface-variant">
                        {new Date(rec.date).toLocaleDateString('en-CA')}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-on-surface">
                        {rec.property?.name ?? '-'}
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
                      <td className="py-3 px-4 text-sm text-on-surface-variant">{rec.vendor ?? '-'}</td>
                      <td className="py-3 px-4 text-sm text-end font-semibold text-error">
                        {'\u20AC'}{amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit ${approvalStatusStyles[displayStatus] ?? approvalStatusStyles.PENDING}`}
                          >
                            {displayStatus === 'PENDING_WHATSAPP' && (
                              <MessageCircle className="w-3 h-3" />
                            )}
                            {approvalStatusLabels[displayStatus] ?? displayStatus}
                          </span>
                          {approverName && (
                            <span className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                              <User className="w-2.5 h-2.5" />
                              {approverName}
                              {rec.approvedAt && (
                                <span className="opacity-60">
                                  {new Date(rec.approvedAt).toLocaleDateString()}
                                </span>
                              )}
                            </span>
                          )}
                          {displayStatus === 'PENDING_WHATSAPP' && (
                            <span className="text-[10px] text-emerald-400/70">
                              WhatsApp approval sent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {rec.approvalStatus === 'PENDING' && !rec.whatsappApprovalMsgId ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              onClick={() => approveMutation.mutate(rec.id)}
                              disabled={approveMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              {t('finance.approve')}
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(rec.id)}
                              disabled={rejectMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              {t('finance.reject')}
                            </button>
                            {amount > 300 && (
                              <button
                                onClick={() => requestApprovalMutation.mutate(rec.id)}
                                disabled={requestApprovalMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                                WhatsApp
                              </button>
                            )}
                          </div>
                        ) : displayStatus === 'PENDING_WHATSAPP' ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              onClick={() => approveMutation.mutate(rec.id)}
                              disabled={approveMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              {t('finance.approve')}
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(rec.id)}
                              disabled={rejectMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors disabled:opacity-50"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
