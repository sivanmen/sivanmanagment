import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import {
  FileText,
  Send,
  ArrowRight,
  Plus,
  Trash2,
  Eye,
  X,
  Users,
  CreditCard,
  Printer,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED';
type GroupStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
type FolioItemType = 'ACCOMMODATION' | 'CLEANING' | 'UPSELL' | 'DAMAGE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TAX';
type FolioCategory = 'CHARGE' | 'PAYMENT' | 'CREDIT';

interface PriceAdjustmentDetail {
  ruleName: string;
  ruleType: string;
  adjustmentType: string;
  amount: number;
}

interface PriceBreakdown {
  baseRate: number;
  nights: number;
  subtotal: number;
  adjustments: PriceAdjustmentDetail[];
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
}

interface GuestQuote {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricing: PriceBreakdown;
  status: QuoteStatus;
  expiresAt: string;
  personalMessage?: string;
  sentAt?: string;
  respondedAt?: string;
  convertedBookingId?: string;
  createdAt: string;
}

interface FolioItem {
  id: string;
  type: FolioItemType;
  description: string;
  amount: number;
  date: string;
  category: FolioCategory;
}

interface GuestFolio {
  id: string;
  bookingId: string;
  guestName: string;
  items: FolioItem[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  currency: string;
}

interface GroupReservation {
  id: string;
  name: string;
  organizer: { name: string; email: string; phone?: string };
  propertyId: string;
  bookingIds: string[];
  totalGuests: number;
  totalAmount: number;
  notes?: string;
  status: GroupStatus;
  createdAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const quoteStatusConfig: Record<QuoteStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'bg-outline-variant/20 text-on-surface-variant', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-blue-500/10 text-blue-600', icon: Send },
  VIEWED: { label: 'Viewed', color: 'bg-secondary/10 text-secondary', icon: Eye },
  ACCEPTED: { label: 'Accepted', color: 'bg-success/10 text-success', icon: CheckCircle },
  EXPIRED: { label: 'Expired', color: 'bg-warning/10 text-warning', icon: Clock },
  DECLINED: { label: 'Declined', color: 'bg-error/10 text-error', icon: XCircle },
};

const groupStatusConfig: Record<GroupStatus, { label: string; color: string }> = {
  TENTATIVE: { label: 'Tentative', color: 'bg-warning/10 text-warning' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-success/10 text-success' },
  CANCELLED: { label: 'Cancelled', color: 'bg-error/10 text-error' },
};

const folioTypeConfig: Record<FolioItemType, { label: string; color: string }> = {
  ACCOMMODATION: { label: 'Accommodation', color: 'bg-blue-500/10 text-blue-600' },
  CLEANING: { label: 'Cleaning', color: 'bg-secondary/10 text-secondary' },
  UPSELL: { label: 'Upsell', color: 'bg-success/10 text-success' },
  DAMAGE: { label: 'Damage', color: 'bg-error/10 text-error' },
  PAYMENT: { label: 'Payment', color: 'bg-success/10 text-success' },
  REFUND: { label: 'Refund', color: 'bg-warning/10 text-warning' },
  ADJUSTMENT: { label: 'Adjustment', color: 'bg-outline-variant/20 text-on-surface-variant' },
  TAX: { label: 'Tax', color: 'bg-amber-500/10 text-amber-600' },
};

// ── Component ──────────────────────────────────────────────────────────────

type Tab = 'quotes' | 'folio' | 'groups';

export default function BookingExtrasPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('quotes');

  // ── API Queries ─────────────────────────────────────────────────
  const { data: quotesData, isLoading: loadingQuotes } = useQuery<GuestQuote[]>({
    queryKey: ['booking-extras', 'quotes'],
    queryFn: async () => {
      const res = await apiClient.get('/booking-extras', { params: { type: 'quotes' } });
      return res.data.data ?? res.data ?? [];
    },
  });

  const { data: foliosData } = useQuery<GuestFolio[]>({
    queryKey: ['booking-extras', 'folios'],
    queryFn: async () => {
      const res = await apiClient.get('/booking-extras', { params: { type: 'folios' } });
      return res.data.data ?? res.data ?? [];
    },
  });

  const { data: groupsData } = useQuery<GroupReservation[]>({
    queryKey: ['booking-extras', 'groups'],
    queryFn: async () => {
      const res = await apiClient.get('/booking-extras', { params: { type: 'groups' } });
      return res.data.data ?? res.data ?? [];
    },
  });

  const { data: propertiesData } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['properties-list'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { perPage: 100 } });
      const props = res.data.data ?? res.data ?? [];
      return props.map((p: any) => ({ id: p.id, name: p.name }));
    },
  });

  const quotes = quotesData ?? [];
  const folios = foliosData ?? [];
  const groups = groupsData ?? [];
  const demoProperties = propertiesData ?? [];
  const demoBookings = folios.map((f) => ({ id: f.bookingId, label: `${f.bookingId} - ${f.guestName}` }));

  // ── Mutations ──────────────────────────────────────────────────
  const createQuoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/booking-extras', { ...payload, type: 'quote' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-extras'] });
      toast.success(t('bookingExtras.quoteCreated', 'Quote created'));
    },
    onError: () => toast.error('Failed to create quote'),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: any }) => {
      const res = await apiClient.put(`/booking-extras/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-extras'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const createGroupMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/booking-extras', { ...payload, type: 'group' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-extras'] });
      toast.success(t('bookingExtras.groupCreated', 'Group reservation created'));
    },
    onError: () => toast.error('Failed to create group'),
  });

  // Quotes form state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    propertyId: '',
    guestName: '',
    guestEmail: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    personalMessage: '',
  });
  const [viewingQuote, setViewingQuote] = useState<GuestQuote | null>(null);

  // Folio state
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    type: 'UPSELL' as FolioItemType,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'CHARGE' as FolioCategory,
  });

  // Groups state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    propertyId: '',
    totalGuests: 2,
    totalAmount: 0,
    notes: '',
  });

  // ── Selected folio ─────────────────────────────────────────────────

  const selectedFolio = useMemo(
    () => folios.find((f) => f.bookingId === selectedBookingId),
    [folios, selectedBookingId],
  );

  // ── Handlers: Quotes ───────────────────────────────────────────────

  const handleCreateQuote = useCallback(() => {
    if (!quoteForm.guestName.trim() || !quoteForm.guestEmail.trim() || !quoteForm.checkIn || !quoteForm.checkOut) {
      toast.error('Please fill in all required fields');
      return;
    }
    const nights = Math.round((new Date(quoteForm.checkOut).getTime() - new Date(quoteForm.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      toast.error('Check-out must be after check-in');
      return;
    }
    createQuoteMutation.mutate(quoteForm);
    setShowQuoteForm(false);
    setQuoteForm({ propertyId: '', guestName: '', guestEmail: '', checkIn: '', checkOut: '', guests: 2, personalMessage: '' });
  }, [quoteForm, createQuoteMutation]);

  const handleSendQuote = useCallback((id: string) => {
    updateQuoteMutation.mutate({ id, status: 'SENT' });
    toast.success(t('bookingExtras.quoteSent', 'Quote sent to guest'));
  }, [t, updateQuoteMutation]);

  const handleConvertQuote = useCallback((id: string) => {
    updateQuoteMutation.mutate({ id, status: 'ACCEPTED', convertToBooking: true });
    toast.success(t('bookingExtras.quoteConverted', 'Quote converted to booking'));
  }, [t, updateQuoteMutation]);

  // ── Handlers: Folio ────────────────────────────────────────────────

  const handleAddFolioItem = useCallback(() => {
    if (!chargeForm.description.trim() || chargeForm.amount === 0) {
      toast.error('Please fill in all fields');
      return;
    }
    const newItem: FolioItem = {
      id: `fi-${Date.now()}`,
      type: chargeForm.type,
      description: chargeForm.description,
      amount: chargeForm.category === 'PAYMENT' ? -Math.abs(chargeForm.amount) : chargeForm.amount,
      date: chargeForm.date,
      category: chargeForm.category,
    };

    updateQuoteMutation.mutate({ id: selectedBookingId, addFolioItem: newItem });
    setShowAddCharge(false);
    setChargeForm({ type: 'UPSELL', description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'CHARGE' });
    toast.success(t('bookingExtras.folioItemAdded', 'Folio item added'));
    queryClient.invalidateQueries({ queryKey: ['booking-extras', 'folios'] });
  }, [chargeForm, selectedBookingId, t, updateQuoteMutation, queryClient]);

  const handleRemoveFolioItem = useCallback((itemId: string) => {
    updateQuoteMutation.mutate({ id: selectedBookingId, removeFolioItemId: itemId });
    toast.success(t('bookingExtras.folioItemRemoved', 'Folio item removed'));
    queryClient.invalidateQueries({ queryKey: ['booking-extras', 'folios'] });
  }, [selectedBookingId, t, updateQuoteMutation, queryClient]);

  // ── Handlers: Groups ───────────────────────────────────────────────

  const handleCreateGroup = useCallback(() => {
    if (!groupForm.name.trim() || !groupForm.organizerName.trim() || !groupForm.organizerEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    createGroupMutation.mutate(groupForm);
    setShowGroupForm(false);
    setGroupForm({ name: '', organizerName: '', organizerEmail: '', organizerPhone: '', propertyId: '', totalGuests: 2, totalAmount: 0, notes: '' });
  }, [groupForm, createGroupMutation]);

  const handleUpdateGroupStatus = useCallback((id: string, status: GroupStatus) => {
    updateQuoteMutation.mutate({ id, status });
    toast.success(t('bookingExtras.groupStatusUpdated', 'Group status updated'));
  }, [t, updateQuoteMutation]);

  // ── Styles ────────────────────────────────────────────────────────

  const inputClass = 'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-semibold text-on-surface">
            {t('bookingExtras.title', 'Booking Extras')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('bookingExtras.subtitle', 'Quotes, guest folio, and group reservations')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1">
        {([
          { key: 'quotes' as Tab, label: t('bookingExtras.quotes', 'Quotes'), icon: FileText },
          { key: 'folio' as Tab, label: t('bookingExtras.guestFolio', 'Guest Folio'), icon: CreditCard },
          { key: 'groups' as Tab, label: t('bookingExtras.groupReservations', 'Group Reservations'), icon: Users },
        ]).map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === tb.key
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* ── Quotes Tab ──────────────────────────────────────────────── */}
      {tab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowQuoteForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t('bookingExtras.createQuote', 'Create Quote')}
            </button>
          </div>

          {/* Quotes table */}
          <div className="bg-surface-container rounded-2xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Guest</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Property</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Dates</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Expires</th>
                    <th className="text-end p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => {
                    const sc = quoteStatusConfig[q.status];
                    const StatusIcon = sc.icon;
                    const propName = demoProperties.find((p) => p.id === q.propertyId)?.name || q.propertyId;
                    return (
                      <tr key={q.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-all">
                        <td className="p-4">
                          <div className="text-sm font-medium text-on-surface">{q.guestName}</div>
                          <div className="text-xs text-on-surface-variant">{q.guestEmail}</div>
                        </td>
                        <td className="p-4 text-sm text-on-surface">{propName}</td>
                        <td className="p-4 text-sm text-on-surface">{q.checkIn} - {q.checkOut}</td>
                        <td className="p-4 text-sm font-semibold text-on-surface">{q.pricing.total.toFixed(2)} EUR</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-on-surface-variant">
                          {new Date(q.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingQuote(q)}
                              className="p-1.5 rounded-lg hover:bg-surface-container-high transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-on-surface-variant" />
                            </button>
                            {q.status === 'DRAFT' && (
                              <button
                                onClick={() => handleSendQuote(q.id)}
                                className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-all"
                                title="Send"
                              >
                                <Send className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            {(q.status === 'SENT' || q.status === 'VIEWED') && (
                              <button
                                onClick={() => handleConvertQuote(q.id)}
                                className="p-1.5 rounded-lg hover:bg-success/10 transition-all"
                                title="Convert to booking"
                              >
                                <ArrowRight className="w-4 h-4 text-success" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Folio Tab ───────────────────────────────────────────────── */}
      {tab === 'folio' && (
        <div className="space-y-4">
          {/* Booking selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Select Booking</label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className={inputClass + ' w-full'}
              >
                {demoBookings.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setShowAddCharge(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <button
                onClick={() => toast.success('Print folio (placeholder)')}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-highest transition-all"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {selectedFolio ? (
            <div className="bg-surface-container rounded-2xl ambient-shadow overflow-hidden">
              {/* Guest info */}
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-on-surface">{selectedFolio.guestName}</h3>
                  <p className="text-xs text-on-surface-variant">Booking: {selectedFolio.bookingId}</p>
                </div>
                <div className="text-end">
                  <div className={`text-lg font-headline font-bold ${selectedFolio.balance === 0 ? 'text-success' : selectedFolio.balance > 0 ? 'text-error' : 'text-success'}`}>
                    Balance: {selectedFolio.balance.toFixed(2)} {selectedFolio.currency}
                  </div>
                </div>
              </div>

              {/* Ledger table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <th className="text-start p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Date</th>
                      <th className="text-start p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Description</th>
                      <th className="text-start p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Type</th>
                      <th className="text-end p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Charge</th>
                      <th className="text-end p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Payment</th>
                      <th className="text-end p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Balance</th>
                      <th className="text-end p-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let runningBalance = 0;
                      return selectedFolio.items.map((item) => {
                        if (item.category === 'CHARGE') runningBalance += item.amount;
                        else runningBalance += item.amount; // negative for payments
                        const tc = folioTypeConfig[item.type];
                        return (
                          <tr key={item.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-all">
                            <td className="p-3 text-sm text-on-surface">{item.date}</td>
                            <td className="p-3 text-sm text-on-surface">{item.description}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.color}`}>
                                {tc.label}
                              </span>
                            </td>
                            <td className="p-3 text-end text-sm font-medium text-on-surface">
                              {item.category === 'CHARGE' ? `${item.amount.toFixed(2)}` : ''}
                            </td>
                            <td className="p-3 text-end text-sm font-medium text-success">
                              {item.category === 'PAYMENT' ? `${Math.abs(item.amount).toFixed(2)}` : ''}
                            </td>
                            <td className="p-3 text-end text-sm font-semibold text-on-surface">
                              {runningBalance.toFixed(2)}
                            </td>
                            <td className="p-3 text-end">
                              <button
                                onClick={() => handleRemoveFolioItem(item.id)}
                                className="p-1 rounded-lg hover:bg-error/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-error" />
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="p-4 border-t border-outline-variant/20 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant uppercase">Total Charges</p>
                  <p className="text-lg font-headline font-bold text-on-surface">{selectedFolio.totalCharges.toFixed(2)} {selectedFolio.currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant uppercase">Total Payments</p>
                  <p className="text-lg font-headline font-bold text-success">{selectedFolio.totalPayments.toFixed(2)} {selectedFolio.currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-on-surface-variant uppercase">Balance</p>
                  <p className={`text-lg font-headline font-bold ${selectedFolio.balance === 0 ? 'text-success' : 'text-error'}`}>
                    {selectedFolio.balance.toFixed(2)} {selectedFolio.currency}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container rounded-2xl p-12 text-center ambient-shadow">
              <CreditCard className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">No folio found for this booking</p>
            </div>
          )}
        </div>
      )}

      {/* ── Groups Tab ──────────────────────────────────────────────── */}
      {tab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowGroupForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t('bookingExtras.createGroup', 'Create Group')}
            </button>
          </div>

          <div className="bg-surface-container rounded-2xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Group</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Organizer</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Property</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Bookings</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Guests</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total</th>
                    <th className="text-start p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="text-end p-4 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => {
                    const sc = groupStatusConfig[g.status];
                    const propName = demoProperties.find((p) => p.id === g.propertyId)?.name || g.propertyId;
                    return (
                      <tr key={g.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-all">
                        <td className="p-4">
                          <div className="text-sm font-medium text-on-surface">{g.name}</div>
                          {g.notes && <div className="text-xs text-on-surface-variant mt-0.5">{g.notes}</div>}
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-on-surface">{g.organizer.name}</div>
                          <div className="text-xs text-on-surface-variant">{g.organizer.email}</div>
                        </td>
                        <td className="p-4 text-sm text-on-surface">{propName}</td>
                        <td className="p-4 text-sm font-medium text-on-surface">{g.bookingIds.length}</td>
                        <td className="p-4 text-sm text-on-surface">{g.totalGuests}</td>
                        <td className="p-4 text-sm font-semibold text-on-surface">{g.totalAmount.toLocaleString()} EUR</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {g.status === 'TENTATIVE' && (
                              <button
                                onClick={() => handleUpdateGroupStatus(g.id, 'CONFIRMED')}
                                className="p-1.5 rounded-lg hover:bg-success/10 transition-all"
                                title="Confirm"
                              >
                                <CheckCircle className="w-4 h-4 text-success" />
                              </button>
                            )}
                            {g.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleUpdateGroupStatus(g.id, 'CANCELLED')}
                                className="p-1.5 rounded-lg hover:bg-error/10 transition-all"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4 text-error" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Quote Form Modal ───────────────────────────────────────── */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-headline font-semibold text-on-surface">
                {t('bookingExtras.createQuote', 'Create Quote')}
              </h2>
              <button onClick={() => setShowQuoteForm(false)} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Guest Name *</label>
                  <input value={quoteForm.guestName} onChange={(e) => setQuoteForm({ ...quoteForm, guestName: e.target.value })} className={inputClass + ' w-full'} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Email *</label>
                  <input type="email" value={quoteForm.guestEmail} onChange={(e) => setQuoteForm({ ...quoteForm, guestEmail: e.target.value })} className={inputClass + ' w-full'} placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Property</label>
                <select value={quoteForm.propertyId} onChange={(e) => setQuoteForm({ ...quoteForm, propertyId: e.target.value })} className={inputClass + ' w-full'}>
                  {demoProperties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Check-in *</label>
                  <input type="date" value={quoteForm.checkIn} onChange={(e) => setQuoteForm({ ...quoteForm, checkIn: e.target.value })} className={inputClass + ' w-full'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Check-out *</label>
                  <input type="date" value={quoteForm.checkOut} onChange={(e) => setQuoteForm({ ...quoteForm, checkOut: e.target.value })} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Guests</label>
                <input type="number" min={1} max={20} value={quoteForm.guests} onChange={(e) => setQuoteForm({ ...quoteForm, guests: parseInt(e.target.value) || 1 })} className={inputClass + ' w-full'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Personal Message</label>
                <textarea value={quoteForm.personalMessage} onChange={(e) => setQuoteForm({ ...quoteForm, personalMessage: e.target.value })} className={inputClass + ' w-full'} rows={3} placeholder="Optional message for the guest..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowQuoteForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">Cancel</button>
                <button onClick={handleCreateQuote} className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md">Create Quote</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quote Detail Modal ─────────────────────────────────────── */}
      {viewingQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-headline font-semibold text-on-surface">Quote Details</h2>
              <button onClick={() => setViewingQuote(null)} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Guest</p>
                  <p className="text-sm font-medium text-on-surface">{viewingQuote.guestName}</p>
                  <p className="text-xs text-on-surface-variant">{viewingQuote.guestEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Property</p>
                  <p className="text-sm font-medium text-on-surface">{demoProperties.find((p) => p.id === viewingQuote.propertyId)?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Dates</p>
                  <p className="text-sm font-medium text-on-surface">{viewingQuote.checkIn} to {viewingQuote.checkOut}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Guests</p>
                  <p className="text-sm font-medium text-on-surface">{viewingQuote.guests}</p>
                </div>
              </div>
              {viewingQuote.personalMessage && (
                <div className="p-3 rounded-lg bg-surface-container-high">
                  <p className="text-xs text-on-surface-variant mb-1">Personal Message</p>
                  <p className="text-sm text-on-surface">{viewingQuote.personalMessage}</p>
                </div>
              )}
              <div className="border-t border-outline-variant/20 pt-4">
                <h3 className="text-sm font-semibold text-on-surface mb-3">Price Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Base rate x {viewingQuote.pricing.nights} nights</span>
                    <span className="text-on-surface">{(viewingQuote.pricing.baseRate * viewingQuote.pricing.nights).toFixed(2)} EUR</span>
                  </div>
                  {viewingQuote.pricing.adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={adj.amount > 0 ? 'text-error' : 'text-success'}>{adj.ruleName}</span>
                      <span className={adj.amount > 0 ? 'text-error' : 'text-success'}>{adj.amount > 0 ? '+' : ''}{adj.amount.toFixed(2)} EUR</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Cleaning</span><span>{viewingQuote.pricing.cleaningFee.toFixed(2)} EUR</span></div>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Service fee</span><span>{viewingQuote.pricing.serviceFee.toFixed(2)} EUR</span></div>
                  <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Taxes</span><span>{viewingQuote.pricing.taxes.toFixed(2)} EUR</span></div>
                  <div className="border-t border-outline-variant/20 pt-2 flex justify-between">
                    <span className="font-semibold text-on-surface">Total</span>
                    <span className="text-lg font-headline font-bold text-secondary">{viewingQuote.pricing.total.toFixed(2)} EUR</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${quoteStatusConfig[viewingQuote.status].color}`}>
                  {quoteStatusConfig[viewingQuote.status].label}
                </span>
                {viewingQuote.convertedBookingId && (
                  <span className="text-xs text-success font-medium">Converted: {viewingQuote.convertedBookingId}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Folio Item Modal ───────────────────────────────────── */}
      {showAddCharge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-headline font-semibold text-on-surface">Add Folio Item</h2>
              <button onClick={() => setShowAddCharge(false)} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Category</label>
                <select value={chargeForm.category} onChange={(e) => setChargeForm({ ...chargeForm, category: e.target.value as FolioCategory })} className={inputClass + ' w-full'}>
                  <option value="CHARGE">Charge</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Type</label>
                <select value={chargeForm.type} onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value as FolioItemType })} className={inputClass + ' w-full'}>
                  {Object.entries(folioTypeConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Description</label>
                <input value={chargeForm.description} onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })} className={inputClass + ' w-full'} placeholder="e.g. Late checkout fee" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Amount (EUR)</label>
                  <input type="number" step="0.01" value={chargeForm.amount || ''} onChange={(e) => setChargeForm({ ...chargeForm, amount: parseFloat(e.target.value) || 0 })} className={inputClass + ' w-full'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Date</label>
                  <input type="date" value={chargeForm.date} onChange={(e) => setChargeForm({ ...chargeForm, date: e.target.value })} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddCharge(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">Cancel</button>
                <button onClick={handleAddFolioItem} className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md">Add Item</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Group Form Modal ───────────────────────────────────────── */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-headline font-semibold text-on-surface">
                {t('bookingExtras.createGroup', 'Create Group Reservation')}
              </h2>
              <button onClick={() => setShowGroupForm(false)} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Group Name *</label>
                <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} className={inputClass + ' w-full'} placeholder="e.g. Smith Family Reunion" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Organizer Name *</label>
                  <input value={groupForm.organizerName} onChange={(e) => setGroupForm({ ...groupForm, organizerName: e.target.value })} className={inputClass + ' w-full'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Organizer Email *</label>
                  <input type="email" value={groupForm.organizerEmail} onChange={(e) => setGroupForm({ ...groupForm, organizerEmail: e.target.value })} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Organizer Phone</label>
                <input value={groupForm.organizerPhone} onChange={(e) => setGroupForm({ ...groupForm, organizerPhone: e.target.value })} className={inputClass + ' w-full'} placeholder="+49..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Property</label>
                <select value={groupForm.propertyId} onChange={(e) => setGroupForm({ ...groupForm, propertyId: e.target.value })} className={inputClass + ' w-full'}>
                  {demoProperties.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Total Guests</label>
                  <input type="number" min={1} value={groupForm.totalGuests} onChange={(e) => setGroupForm({ ...groupForm, totalGuests: parseInt(e.target.value) || 1 })} className={inputClass + ' w-full'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Total Amount (EUR)</label>
                  <input type="number" min={0} value={groupForm.totalAmount || ''} onChange={(e) => setGroupForm({ ...groupForm, totalAmount: parseFloat(e.target.value) || 0 })} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Notes</label>
                <textarea value={groupForm.notes} onChange={(e) => setGroupForm({ ...groupForm, notes: e.target.value })} className={inputClass + ' w-full'} rows={3} placeholder="Special requirements..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowGroupForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">Cancel</button>
                <button onClick={handleCreateGroup} className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md">Create Group</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
