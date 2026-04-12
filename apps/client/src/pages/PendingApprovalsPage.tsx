import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X,
  Clock,
  Building2,
  Receipt,
  User,
  MessageCircle,
  AlertCircle,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth.store';
import { useApiQuery, useApiMutation } from '../hooks/useApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApprovalTab = 'pending' | 'history';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface ExpenseRecord {
  id: string;
  propertyId: string;
  propertyName: string;
  category: string;
  description: string;
  vendor?: string | null;
  amount: number;
  currency: string;
  date: string;
  approvalStatus: string;
  createdBy?: string | null;
}

interface ApprovalRequest {
  id: string;
  expenseId: string;
  ownerId: string;
  ownerPhone: string;
  status: ApprovalStatus;
  sentAt: string;
  respondedAt?: string | null;
  expiresAt: string;
  reminderSentAt?: string | null;
  expense?: ExpenseRecord;
}

// Normalized shape used for rendering cards (same visual structure as before)
interface ApprovalItem {
  id: string;
  expenseId: string;
  propertyName: string;
  propertyId: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  submittedBy: string;
  status: ApprovalStatus;
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Helpers — labels & styles (unchanged)
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  CLEANING: 'Cleaning',
  INSURANCE: 'Insurance',
  SUPPLIES: 'Supplies',
  TAXES: 'Taxes',
  TAX: 'Taxes',
  MARKETING: 'Marketing',
  MANAGEMENT: 'Management',
  MISC: 'Other',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-secondary/10 text-secondary',
  UTILITIES: 'bg-success/10 text-success',
  CLEANING: 'bg-warning/10 text-warning',
  INSURANCE: 'bg-error/10 text-error',
  SUPPLIES: 'bg-outline-variant/20 text-on-surface-variant',
  TAXES: 'bg-secondary/10 text-secondary',
  TAX: 'bg-secondary/10 text-secondary',
  MARKETING: 'bg-secondary/10 text-secondary',
  MANAGEMENT: 'bg-secondary/10 text-secondary',
  MISC: 'bg-outline-variant/20 text-on-surface-variant',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const statusStyles: Record<ApprovalStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-error/10 text-error',
  EXPIRED: 'bg-outline-variant/20 text-on-surface-variant',
};

const statusLabels: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

// ---------------------------------------------------------------------------
// Normalize API response into the card-friendly shape
// ---------------------------------------------------------------------------

function toApprovalItem(req: ApprovalRequest): ApprovalItem {
  const exp = req.expense;
  return {
    id: req.id,
    expenseId: req.expenseId,
    propertyName: exp?.propertyName ?? 'Unknown Property',
    propertyId: exp?.propertyId ?? '',
    category: exp?.category ?? 'OTHER',
    description: exp?.description ?? '',
    vendor: exp?.vendor ?? '',
    amount: exp ? Number(exp.amount) : 0,
    currency: exp?.currency ?? 'EUR',
    date: exp?.date ? String(exp.date).split('T')[0] : '',
    submittedBy: exp?.createdBy ?? 'Property Manager',
    status: req.status as ApprovalStatus,
    sentAt: req.sentAt,
    respondedAt: req.respondedAt ?? undefined,
    expiresAt: req.expiresAt,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PendingApprovalsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pending');
  const user = useAuthStore((s) => s.user);
  const ownerId = user?.owner?.id ?? user?.id ?? '';

  // ── Queries ──

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = useApiQuery<ApprovalRequest[]>(
    ['approvals', 'pending', ownerId],
    `/expenses/approvals/owner/${ownerId}/pending`,
    undefined,
    { enabled: !!ownerId },
  );

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useApiQuery<ApprovalRequest[]>(
    ['approvals', 'history', ownerId],
    `/expenses/approvals/owner/${ownerId}/history`,
    undefined,
    { enabled: !!ownerId },
  );

  const approvals: ApprovalItem[] = (pendingData?.data ?? []).map(toApprovalItem);
  const history: ApprovalItem[] = (historyData?.data ?? []).map(toApprovalItem);

  // ── Mutations ──

  const approveMutation = useApiMutation<unknown, { expenseId: string }>(
    'post',
    (vars) => `/expenses/${vars.expenseId}/approve-web`,
    {
      invalidateKeys: [
        ['approvals', 'pending', ownerId],
        ['approvals', 'history', ownerId],
      ],
      successMessage: 'Expense approved',
    },
  );

  const rejectMutation = useApiMutation<unknown, { expenseId: string; reason?: string }>(
    'post',
    (vars) => `/expenses/${vars.expenseId}/reject-web`,
    {
      invalidateKeys: [
        ['approvals', 'pending', ownerId],
        ['approvals', 'history', ownerId],
      ],
      successMessage: 'Expense rejected',
    },
  );

  const handleApprove = (item: ApprovalItem) => {
    approveMutation.mutate({ expenseId: item.expenseId });
  };

  const handleReject = (item: ApprovalItem) => {
    rejectMutation.mutate({ expenseId: item.expenseId });
  };

  // ── Derived state ──

  const isLoading = activeTab === 'pending' ? pendingLoading : historyLoading;
  const isError = activeTab === 'pending' ? pendingError : historyError;
  const displayItems = activeTab === 'pending' ? approvals : history;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Finance
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          Expense Approvals
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review and approve expenses submitted by your property manager. You can also approve or
          reject via WhatsApp.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Review
            </p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {pendingLoading ? '...' : approvals.length}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-1">
            {'\u20AC'}
            {approvals.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} total
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Approved
            </p>
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {historyLoading ? '...' : history.filter((h) => h.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Rejected
            </p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {historyLoading ? '...' : history.filter((h) => h.status === 'REJECTED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'pending'
              ? 'bg-surface-container-lowest text-on-surface ambient-shadow'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {approvals.length > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-warning/20 text-warning text-[10px] font-bold flex items-center justify-center">
              {approvals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-surface-container-lowest text-on-surface ambient-shadow'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">Loading approvals...</p>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm font-medium text-on-surface">Failed to load approvals</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => {
              refetchPending();
              refetchHistory();
            }}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Cards */}
      {!isLoading && !isError && displayItems.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm font-medium text-on-surface">
            {activeTab === 'pending' ? 'No pending approvals' : 'No approval history yet'}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {activeTab === 'pending'
              ? 'All expenses are up to date. New requests will appear here and via WhatsApp.'
              : 'Your approved and rejected expenses will appear here.'}
          </p>
        </div>
      ) : !isLoading && !isError && (
        <div className="space-y-4">
          {displayItems.map((item) => {
            const isMutating =
              (approveMutation.isPending && approveMutation.variables?.expenseId === item.expenseId) ||
              (rejectMutation.isPending && rejectMutation.variables?.expenseId === item.expenseId);

            return (
              <div
                key={item.id}
                className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-outline/5 ${
                  isMutating ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-on-surface">{item.propertyName}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mt-1 ${
                          categoryColors[item.category] ?? 'bg-outline-variant/20 text-on-surface-variant'
                        }`}
                      >
                        {categoryLabels[item.category] ?? item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-headline text-lg font-bold text-error">
                      {'\u20AC'}{item.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mt-1 ${
                        statusStyles[item.status]
                      }`}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 pt-3 space-y-2">
                  <p className="text-sm text-on-surface">{item.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-on-surface-variant">
                    {item.vendor && (
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3 h-3" />
                        <span>{item.vendor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>{item.submittedBy}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3 h-3" />
                      <span>
                        Sent {new Date(item.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {item.respondedAt && (
                    <p className="text-[10px] text-on-surface-variant">
                      Responded: {new Date(item.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Card actions */}
                {item.status === 'PENDING' && (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-outline/5 bg-surface-container-low/30">
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-success hover:bg-success/90 transition-colors disabled:opacity-50"
                    >
                      {approveMutation.isPending && approveMutation.variables?.expenseId === item.expenseId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item)}
                      disabled={isMutating}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-error hover:bg-error/90 transition-colors disabled:opacity-50"
                    >
                      {rejectMutation.isPending && rejectMutation.variables?.expenseId === item.expenseId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-secondary/5 border border-secondary/10">
        <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-on-surface">
            WhatsApp Approval
          </p>
          <p className="text-xs text-on-surface-variant">
            You can also approve or reject expenses by replying to the WhatsApp message. Reply{' '}
            <span className="font-semibold text-on-surface">1</span> or{' '}
            <span className="font-semibold text-on-surface">Approve</span> to approve, and{' '}
            <span className="font-semibold text-on-surface">2</span> or{' '}
            <span className="font-semibold text-on-surface">Reject</span> to reject.
          </p>
        </div>
      </div>
    </div>
  );
}
