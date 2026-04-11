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
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApprovalTab = 'pending' | 'history';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

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
// Demo data
// ---------------------------------------------------------------------------

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  CLEANING: 'Cleaning',
  INSURANCE: 'Insurance',
  SUPPLIES: 'Supplies',
  TAXES: 'Taxes',
  MARKETING: 'Marketing',
  MANAGEMENT: 'Management',
  OTHER: 'Other',
};

const categoryColors: Record<string, string> = {
  MAINTENANCE: 'bg-secondary/10 text-secondary',
  UTILITIES: 'bg-success/10 text-success',
  CLEANING: 'bg-warning/10 text-warning',
  INSURANCE: 'bg-error/10 text-error',
  SUPPLIES: 'bg-outline-variant/20 text-on-surface-variant',
  TAXES: 'bg-secondary/10 text-secondary',
  MARKETING: 'bg-secondary/10 text-secondary',
  MANAGEMENT: 'bg-secondary/10 text-secondary',
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

const demoApprovals: ApprovalItem[] = [
  {
    id: 'ear-001',
    expenseId: 'exp-101',
    propertyName: 'Santorini Sunset Villa',
    propertyId: 'p1',
    category: 'MAINTENANCE',
    description: 'Pool pump replacement and filter system upgrade',
    vendor: 'Pool Masters GR',
    amount: 780,
    currency: 'EUR',
    date: '2026-04-03',
    submittedBy: 'Maria K. (Property Manager)',
    status: 'PENDING',
    sentAt: '2026-04-03T09:15:00Z',
    expiresAt: '2026-04-04T09:15:00Z',
  },
  {
    id: 'ear-002',
    expenseId: 'exp-102',
    propertyName: 'Crete Harbor Suite',
    propertyId: 'p4',
    category: 'SUPPLIES',
    description: 'Premium linens and towels replacement for summer season',
    vendor: 'Hospitality Supply GR',
    amount: 450,
    currency: 'EUR',
    date: '2026-04-07',
    submittedBy: 'Maria K. (Property Manager)',
    status: 'PENDING',
    sentAt: '2026-04-07T10:00:00Z',
    expiresAt: '2026-04-08T10:00:00Z',
  },
  {
    id: 'ear-003',
    expenseId: 'exp-103',
    propertyName: 'Athens Central Loft',
    propertyId: 'p2',
    category: 'MAINTENANCE',
    description: 'Exterior paint touch-up and balcony railing repair',
    vendor: 'Athens Painters',
    amount: 350,
    currency: 'EUR',
    date: '2026-03-27',
    submittedBy: 'Kostas D. (Maintenance)',
    status: 'PENDING',
    sentAt: '2026-03-27T14:00:00Z',
    expiresAt: '2026-03-28T14:00:00Z',
  },
];

const demoHistory: ApprovalItem[] = [
  {
    id: 'ear-010',
    expenseId: 'exp-110',
    propertyName: 'Santorini Sunset Villa',
    propertyId: 'p1',
    category: 'INSURANCE',
    description: 'Annual property insurance premium renewal',
    vendor: 'Ethniki Insurance',
    amount: 1200,
    currency: 'EUR',
    date: '2026-04-06',
    submittedBy: 'Maria K. (Property Manager)',
    status: 'APPROVED',
    sentAt: '2026-04-06T15:00:00Z',
    respondedAt: '2026-04-06T16:20:00Z',
    expiresAt: '2026-04-07T15:00:00Z',
  },
  {
    id: 'ear-011',
    expenseId: 'exp-111',
    propertyName: 'Mykonos Beach House',
    propertyId: 'p3',
    category: 'UTILITIES',
    description: 'Electricity bill - March 2026',
    vendor: 'HEDNO S.A.',
    amount: 320,
    currency: 'EUR',
    date: '2026-04-08',
    submittedBy: 'Kostas D. (Maintenance)',
    status: 'APPROVED',
    sentAt: '2026-04-08T09:00:00Z',
    respondedAt: '2026-04-08T14:30:00Z',
    expiresAt: '2026-04-09T09:00:00Z',
  },
  {
    id: 'ear-012',
    expenseId: 'exp-112',
    propertyName: 'Rhodes Old Town Apt',
    propertyId: 'p5',
    category: 'SUPPLIES',
    description: 'Kitchen supplies restock - premium items',
    vendor: 'Metro Cash & Carry',
    amount: 110,
    currency: 'EUR',
    date: '2026-03-29',
    submittedBy: 'Maria K. (Property Manager)',
    status: 'REJECTED',
    sentAt: '2026-03-29T10:00:00Z',
    respondedAt: '2026-03-29T18:45:00Z',
    expiresAt: '2026-03-30T10:00:00Z',
  },
  {
    id: 'ear-013',
    expenseId: 'exp-113',
    propertyName: 'Santorini Sunset Villa',
    propertyId: 'p1',
    category: 'TAXES',
    description: 'Property tax Q1 2026',
    vendor: 'Hellenic Tax Authority',
    amount: 520,
    currency: 'EUR',
    date: '2026-04-01',
    submittedBy: 'Maria K. (Property Manager)',
    status: 'APPROVED',
    sentAt: '2026-04-01T08:00:00Z',
    respondedAt: '2026-04-01T11:45:00Z',
    expiresAt: '2026-04-02T08:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PendingApprovalsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pending');
  const [approvals, setApprovals] = useState(demoApprovals);
  const [history, setHistory] = useState(demoHistory);

  const handleApprove = (id: string) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) => [
      {
        ...item,
        status: 'APPROVED' as ApprovalStatus,
        respondedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success(`Expense approved: ${item.description}`);
  };

  const handleReject = (id: string) => {
    const item = approvals.find((a) => a.id === id);
    if (!item) return;

    setApprovals((prev) => prev.filter((a) => a.id !== id));
    setHistory((prev) => [
      {
        ...item,
        status: 'REJECTED' as ApprovalStatus,
        respondedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success(`Expense rejected: ${item.description}`);
  };

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
          <p className="font-headline text-xl font-bold text-on-surface">{approvals.length}</p>
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
            {history.filter((h) => h.status === 'APPROVED').length}
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
            {history.filter((h) => h.status === 'REJECTED').length}
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

      {/* Cards */}
      {displayItems.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border border-outline/5"
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
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-success hover:bg-success/90 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-error hover:bg-error/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
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
