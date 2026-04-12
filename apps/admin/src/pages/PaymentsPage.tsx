import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Link2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from 'lucide-react';
import apiClient from '../lib/api-client';

// ----- Types -----

interface PaymentTransaction {
  id: string;
  bookingId: string | null;
  ownerId: string | null;
  type: string;
  provider: string;
  providerTransactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  feeAmount: number;
  metadata: Record<string, any> | null;
  completedAt: string | null;
  createdAt: string;
  booking?: {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  } | null;
  owner?: {
    id: string;
    companyName: string;
    user?: { firstName: string; lastName: string; email: string };
  } | null;
}

// ----- Demo Data -----

const demoTransactions: PaymentTransaction[] = [
  {
    id: 'pt-001',
    bookingId: 'bk-101',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'STRIPE',
    providerTransactionId: 'pi_3Qx7KkABC123',
    amount: 1250,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 36.25,
    metadata: { stripePaymentIntentId: 'pi_3Qx7KkABC123' },
    completedAt: '2026-04-10T14:30:00Z',
    createdAt: '2026-04-10T14:28:00Z',
    booking: { id: 'bk-101', guestName: 'Maria Schmidt', checkIn: '2026-04-15', checkOut: '2026-04-20', totalAmount: 1250 },
  },
  {
    id: 'pt-002',
    bookingId: 'bk-102',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'STRIPE',
    providerTransactionId: 'pi_3Qx8LmDEF456',
    amount: 840,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 24.36,
    metadata: null,
    completedAt: '2026-04-09T11:20:00Z',
    createdAt: '2026-04-09T11:18:00Z',
    booking: { id: 'bk-102', guestName: 'Jean-Pierre Dubois', checkIn: '2026-04-12', checkOut: '2026-04-16', totalAmount: 840 },
  },
  {
    id: 'pt-003',
    bookingId: 'bk-103',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'STRIPE',
    providerTransactionId: 'pi_3Qx9NnGHI789',
    amount: 2100,
    currency: 'EUR',
    status: 'PENDING',
    feeAmount: 0,
    metadata: null,
    completedAt: null,
    createdAt: '2026-04-08T16:45:00Z',
    booking: { id: 'bk-103', guestName: 'Thomas Anderson', checkIn: '2026-04-20', checkOut: '2026-04-27', totalAmount: 2100 },
  },
  {
    id: 'pt-004',
    bookingId: 'bk-104',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'STRIPE',
    providerTransactionId: 'pi_3Qx0JkJKL012',
    amount: 680,
    currency: 'EUR',
    status: 'FAILED',
    feeAmount: 0,
    metadata: { failureMessage: 'Card declined - insufficient funds' },
    completedAt: null,
    createdAt: '2026-04-07T09:15:00Z',
    booking: { id: 'bk-104', guestName: 'Elena Papadopoulos', checkIn: '2026-04-18', checkOut: '2026-04-22', totalAmount: 680 },
  },
  {
    id: 'pt-005',
    bookingId: 'bk-105',
    ownerId: null,
    type: 'REFUND',
    provider: 'STRIPE',
    providerTransactionId: 'ch_3QxABcMNO345',
    amount: 450,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 0,
    metadata: { originalPaymentIntentId: 'pi_3QxABcMNO345', reason: 'Early checkout' },
    completedAt: '2026-04-06T10:00:00Z',
    createdAt: '2026-04-06T09:55:00Z',
    booking: { id: 'bk-105', guestName: 'James Wilson', checkIn: '2026-04-01', checkOut: '2026-04-05', totalAmount: 900 },
  },
  {
    id: 'pt-006',
    bookingId: 'bk-106',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'CASH',
    providerTransactionId: null,
    amount: 560,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 0,
    metadata: null,
    completedAt: '2026-04-05T18:00:00Z',
    createdAt: '2026-04-05T18:00:00Z',
    booking: { id: 'bk-106', guestName: 'Sofia Rossi', checkIn: '2026-04-05', checkOut: '2026-04-08', totalAmount: 560 },
  },
  {
    id: 'pt-007',
    bookingId: 'bk-107',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'STRIPE',
    providerTransactionId: 'pi_3QxCDePQR678',
    amount: 1780,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 51.62,
    metadata: null,
    completedAt: '2026-04-04T13:10:00Z',
    createdAt: '2026-04-04T13:08:00Z',
    booking: { id: 'bk-107', guestName: 'Hans Mueller', checkIn: '2026-04-10', checkOut: '2026-04-17', totalAmount: 1780 },
  },
  {
    id: 'pt-008',
    bookingId: 'bk-108',
    ownerId: null,
    type: 'BOOKING_PAYMENT',
    provider: 'BANK_TRANSFER',
    providerTransactionId: 'BT-2026-0408',
    amount: 3200,
    currency: 'EUR',
    status: 'COMPLETED',
    feeAmount: 0,
    metadata: null,
    completedAt: '2026-04-03T08:30:00Z',
    createdAt: '2026-04-02T15:00:00Z',
    booking: { id: 'bk-108', guestName: 'Yuki Tanaka', checkIn: '2026-04-08', checkOut: '2026-04-18', totalAmount: 3200 },
  },
];

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  PENDING: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning' },
  PROCESSING: { label: 'Processing', icon: RefreshCcw, color: 'bg-secondary/10 text-secondary' },
  FAILED: { label: 'Failed', icon: XCircle, color: 'bg-error/10 text-error' },
  REFUNDED: { label: 'Refunded', icon: RotateCcw, color: 'bg-outline-variant/20 text-on-surface-variant' },
};

const typeLabels: Record<string, string> = {
  BOOKING_PAYMENT: 'Payment',
  OWNER_PAYOUT: 'Owner Payout',
  REFUND: 'Refund',
  FEE_COLLECTION: 'Fee',
  AFFILIATE_PAYOUT: 'Affiliate Payout',
};

const providerLabels: Record<string, string> = {
  STRIPE: 'Stripe',
  BANK_TRANSFER: 'Bank Transfer',
  PAYPAL: 'PayPal',
  CASH: 'Cash',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
};

// ----- Component -----

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [providerFilter, setProviderFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal state
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Payment link form
  const [linkBookingId, setLinkBookingId] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Refund form
  const [refundPaymentIntentId, setRefundPaymentIntentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filter demo data
  const filtered = demoTransactions.filter((tx) => {
    if (statusFilter !== 'All' && tx.status !== statusFilter) return false;
    if (providerFilter !== 'All' && tx.provider !== providerFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const guestName = tx.booking?.guestName?.toLowerCase() || '';
      const stripeId = tx.providerTransactionId?.toLowerCase() || '';
      const bookingId = tx.bookingId?.toLowerCase() || '';
      if (!guestName.includes(q) && !stripeId.includes(q) && !bookingId.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // KPI calculations
  const completedPayments = demoTransactions.filter(
    (tx) => tx.type === 'BOOKING_PAYMENT' && tx.status === 'COMPLETED',
  );
  const totalRevenue = completedPayments.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingPayments = demoTransactions.filter(
    (tx) => tx.status === 'PENDING',
  );
  const totalPending = pendingPayments.reduce((sum, tx) => sum + tx.amount, 0);
  const refundTransactions = demoTransactions.filter(
    (tx) => tx.type === 'REFUND' && tx.status === 'COMPLETED',
  );
  const totalRefunds = refundTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgTransaction = completedPayments.length > 0
    ? totalRevenue / completedPayments.length
    : 0;

  // Handlers
  const handleCreatePaymentLink = async () => {
    if (!linkBookingId || !linkAmount) return;
    setLinkLoading(true);
    try {
      const res = await apiClient.post('/payments/create-link', {
        bookingId: linkBookingId,
        amount: parseFloat(linkAmount),
        currency: 'EUR',
        description: linkDescription || undefined,
      });
      setGeneratedLink(res.data.data.url);
    } catch (err: any) {
      setGeneratedLink('');
      alert(err.response?.data?.error?.message || 'Failed to create payment link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleProcessRefund = async () => {
    if (!refundPaymentIntentId) return;
    setRefundLoading(true);
    setRefundResult(null);
    try {
      const res = await apiClient.post('/payments/stripe-refund', {
        paymentIntentId: refundPaymentIntentId,
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason || undefined,
      });
      setRefundResult({
        success: true,
        message: `Refund processed: ${res.data.data.refundId} (${res.data.data.currency.toUpperCase()} ${res.data.data.amount})`,
      });
    } catch (err: any) {
      setRefundResult({
        success: false,
        message: err.response?.data?.error?.message || 'Failed to process refund',
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const closePaymentLinkModal = () => {
    setShowPaymentLinkModal(false);
    setLinkBookingId('');
    setLinkAmount('');
    setLinkDescription('');
    setGeneratedLink('');
    setLinkCopied(false);
  };

  const closeRefundModal = () => {
    setShowRefundModal(false);
    setRefundPaymentIntentId('');
    setRefundAmount('');
    setRefundReason('');
    setRefundResult(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.finance', 'Finance')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Payments
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRefundModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface border border-outline-variant hover:bg-surface-container-high transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Refund</span>
          </button>
          <button
            onClick={() => setShowPaymentLinkModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Link2 className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Revenue
            </p>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            {'\u20AC'}{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {completedPayments.length} completed payments
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Payments
            </p>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            {'\u20AC'}{totalPending.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {pendingPayments.length} awaiting confirmation
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-error" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Refunds
            </p>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            {'\u20AC'}{totalRefunds.toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {refundTransactions.length} refunds issued
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Avg Transaction
            </p>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">
            {'\u20AC'}{Math.round(avgTransaction).toLocaleString()}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Per completed payment
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by guest, booking ID, or Stripe ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="All">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="All">All Providers</option>
          <option value="STRIPE">Stripe</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CASH">Cash</option>
          <option value="PAYPAL">PayPal</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Date
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Guest
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Booking
                </th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Amount
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Type
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Status
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Provider
                </th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Stripe ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginated.map((tx) => {
                const stConf = statusConfig[tx.status] || statusConfig.PENDING;
                const StatusIcon = stConf.icon;
                return (
                  <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-on-surface">
                        {tx.booking?.guestName || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tx.bookingId ? (
                        <span className="text-secondary text-xs font-mono">
                          {tx.bookingId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-end">
                      <span className={`font-semibold ${tx.type === 'REFUND' ? 'text-error' : 'text-on-surface'}`}>
                        {tx.type === 'REFUND' ? '-' : ''}{'\u20AC'}{tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-on-surface-variant">
                        {typeLabels[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stConf.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {stConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-on-surface-variant">
                        {providerLabels[tx.provider] || tx.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tx.providerTransactionId ? (
                        <span className="text-xs font-mono text-on-surface-variant" title={tx.providerTransactionId}>
                          {tx.providerTransactionId.length > 16
                            ? tx.providerTransactionId.slice(0, 16) + '...'
                            : tx.providerTransactionId}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No transactions match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? 'gradient-accent text-white'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Payment Link Modal */}
      {showPaymentLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closePaymentLinkModal} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-on-surface">Create Payment Link</h2>
              <button onClick={closePaymentLinkModal} className="p-1 rounded-lg hover:bg-surface-container-high transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {!generatedLink ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                      Booking ID
                    </label>
                    <input
                      type="text"
                      value={linkBookingId}
                      onChange={(e) => setLinkBookingId(e.target.value)}
                      placeholder="Enter booking UUID..."
                      className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                      Amount (EUR)
                    </label>
                    <input
                      type="number"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="e.g., Security deposit for Villa Sunset"
                      className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreatePaymentLink}
                  disabled={!linkBookingId || !linkAmount || linkLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg disabled:opacity-50 transition-all"
                >
                  {linkLoading ? 'Generating...' : 'Generate Payment Link'}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <p className="text-sm font-medium text-success">Payment link generated</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 rounded bg-surface-container-low text-xs font-mono text-on-surface truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="Copy link"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </button>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4 text-on-surface-variant" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Send this link to the guest via email or WhatsApp. The link expires in 24 hours.
                </p>
                <button
                  onClick={closePaymentLinkModal}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-on-surface border border-outline-variant hover:bg-surface-container-high transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeRefundModal} />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-on-surface">Process Stripe Refund</h2>
              <button onClick={closeRefundModal} className="p-1 rounded-lg hover:bg-surface-container-high transition-all">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Stripe Payment Intent ID
                </label>
                <input
                  type="text"
                  value={refundPaymentIntentId}
                  onChange={(e) => setRefundPaymentIntentId(e.target.value)}
                  placeholder="pi_..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm font-mono text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Refund Amount (EUR) - leave empty for full refund
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Full refund if empty"
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Reason (Optional)
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select reason...</option>
                  <option value="requested_by_customer">Requested by customer</option>
                  <option value="duplicate">Duplicate payment</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="Early checkout">Early checkout</option>
                  <option value="Booking cancelled">Booking cancelled</option>
                  <option value="Service issue">Service issue</option>
                </select>
              </div>
            </div>

            {refundResult && (
              <div className={`rounded-lg p-3 ${refundResult.success ? 'bg-success/5 border border-success/20' : 'bg-error/5 border border-error/20'}`}>
                <p className={`text-sm font-medium ${refundResult.success ? 'text-success' : 'text-error'}`}>
                  {refundResult.message}
                </p>
              </div>
            )}

            <button
              onClick={handleProcessRefund}
              disabled={!refundPaymentIntentId || refundLoading}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-error hover:bg-error/90 disabled:opacity-50 transition-all"
            >
              {refundLoading ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
