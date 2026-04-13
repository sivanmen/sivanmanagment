import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  LogIn,
  LogOut,
  XCircle,
  User,
  Mail,
  Phone,
  Globe,
  CalendarDays,
  Users,
  Baby,
  Dog,
  CreditCard,
  Building2,
  MapPin,
  MessageSquare,
  Clock,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Send,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type BookingStatus = 'INQUIRY' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'FAILED';

interface BookingDetail {
  id: string;
  propertyId: string;
  unitId?: string | null;
  guestId?: string | null;
  source: string;
  externalId?: string | null;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  specialRequests?: string | null;
  internalNotes?: string | null;
  icalUid?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
    city?: string;
    internalCode?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    unitType: string;
  } | null;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    nationality?: string;
    totalStays?: number;
  } | null;
}

const statusStyles: Record<BookingStatus, string> = {
  INQUIRY: 'bg-blue-500/10 text-blue-600',
  PENDING: 'bg-warning/10 text-warning',
  CONFIRMED: 'bg-success/10 text-success',
  CHECKED_IN: 'bg-secondary/10 text-secondary',
  CHECKED_OUT: 'bg-outline-variant/20 text-on-surface-variant',
  CANCELLED: 'bg-error/10 text-error',
  NO_SHOW: 'bg-error/10 text-error',
};

const paymentStyles: Record<PaymentStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  PARTIAL: 'bg-warning/10 text-warning',
  PAID: 'bg-success/10 text-success',
  REFUNDED: 'bg-outline-variant/20 text-on-surface-variant',
  FAILED: 'bg-error/10 text-error',
};

export default function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch booking from API
  const { data: bookingResponse, isLoading, isError, error } = useQuery<{ data: BookingDetail }>({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const data = bookingResponse?.data;

  // Local state for internal notes (initialized from fetched data)
  const [notesValue, setNotesValue] = useState<string | null>(null);

  // Once data loads, sync notes if not yet set by user
  const displayNotes = notesValue !== null ? notesValue : (data?.internalNotes ?? '');

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: (notes: string) => apiClient.put(`/bookings/${id}`, { internalNotes: notes }),
    onSuccess: () => {
      toast.success(t('bookings.notesSaved', 'Notes saved'));
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: () => {
      toast.error(t('bookings.notesSaveError', 'Failed to save notes'));
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => apiClient.post(`/bookings/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success(t('bookings.cancelSuccess', 'Booking cancelled successfully'));
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.cancelError', 'Failed to cancel booking'));
    },
  });

  // Confirm booking mutation (PENDING -> CONFIRMED)
  const confirmMutation = useMutation({
    mutationFn: () => apiClient.put(`/bookings/${id}`, { status: 'CONFIRMED' }),
    onSuccess: () => {
      toast.success(t('bookings.confirmSuccess', 'Booking confirmed'));
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.confirmError', 'Failed to confirm booking'));
    },
  });

  // Check-in mutation (CONFIRMED -> CHECKED_IN)
  const checkInMutation = useMutation({
    mutationFn: () => apiClient.put(`/bookings/${id}`, { status: 'CHECKED_IN' }),
    onSuccess: () => {
      toast.success(t('bookings.checkInSuccess', 'Guest checked in successfully'));
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.checkInError', 'Failed to check in guest'));
    },
  });

  // Check-out mutation (CHECKED_IN -> CHECKED_OUT)
  const checkOutMutation = useMutation({
    mutationFn: () => apiClient.put(`/bookings/${id}`, { status: 'CHECKED_OUT' }),
    onSuccess: () => {
      toast.success(t('bookings.checkOutSuccess', 'Guest checked out successfully'));
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.checkOutError', 'Failed to check out guest'));
    },
  });

  const handleCancel = () => {
    const reason = window.prompt(t('bookings.cancelReasonPrompt', 'Reason for cancellation (optional):'));
    if (reason !== null) {
      cancelMutation.mutate(reason || undefined);
    }
  };

  const isActionPending = cancelMutation.isPending || confirmMutation.isPending || checkInMutation.isPending || checkOutMutation.isPending;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
          <h2 className="font-headline text-lg font-semibold text-on-surface mb-2">
            {t('bookings.notFound', 'Booking not found')}
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            {(error as Error)?.message || t('bookings.loadError', 'Could not load booking details. Please try again.')}
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('bookings.backToList', 'Back to Bookings')}
          </button>
        </div>
      </div>
    );
  }

  const ref = data.id.slice(0, 14).toUpperCase();
  const guestDisplayName = data.guest
    ? `${data.guest.firstName} ${data.guest.lastName}`
    : data.guestName;
  const guestEmail = data.guest?.email || data.guestEmail || '';
  const guestPhone = data.guest?.phone || data.guestPhone || '';
  const guestNationality = data.guest?.nationality || '';
  const guestTotalStays = data.guest?.totalStays ?? 0;
  const currencySymbol = data.currency === 'EUR' ? '\u20AC' : data.currency === 'USD' ? '$' : data.currency;

  // Build a simple timeline from available data
  const timeline: { date: string; event: string; type: string }[] = [];
  if (data.createdAt) {
    timeline.push({
      date: new Date(data.createdAt).toLocaleString(),
      event: 'Booking created',
      type: 'create',
    });
  }
  if (data.confirmedAt) {
    timeline.push({
      date: new Date(data.confirmedAt).toLocaleString(),
      event: 'Booking confirmed',
      type: 'status',
    });
  }
  if (data.cancelledAt) {
    timeline.push({
      date: new Date(data.cancelledAt).toLocaleString(),
      event: `Booking cancelled${data.cancellationReason ? `: ${data.cancellationReason}` : ''}`,
      type: 'cancel',
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-2xl font-bold text-on-surface">{ref}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[data.status]}`}>
                {data.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">{data.property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data.status === 'PENDING' && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={isActionPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>Confirm</span>
            </button>
          )}
          {data.status === 'CONFIRMED' && (
            <button
              onClick={() => checkInMutation.mutate()}
              disabled={isActionPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              {checkInMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Check In</span>
            </button>
          )}
          {data.status === 'CHECKED_IN' && (
            <button
              onClick={() => checkOutMutation.mutate()}
              disabled={isActionPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              {checkOutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>Check Out</span>
            </button>
          )}
          {!['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(data.status) && (
            <button
              onClick={handleCancel}
              disabled={isActionPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/5 hover:bg-error/10 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              <span>Cancel</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/bookings/${data.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>{t('common.edit')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Guest Info */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Guest Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-lg">
                {guestDisplayName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-on-surface">{guestDisplayName}</p>
                {guestTotalStays > 0 && (
                  <p className="text-xs text-on-surface-variant">{guestTotalStays} previous stays</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guestEmail && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{guestEmail}</span>
                </div>
              )}
              {guestPhone && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{guestPhone}</span>
                </div>
              )}
              {guestNationality && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>{guestNationality}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">Stay Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <CalendarDays className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.checkIn')}</p>
                  <p className="text-sm font-semibold text-on-surface">{new Date(data.checkIn).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <CalendarDays className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.checkOut')}</p>
                  <p className="text-sm font-semibold text-on-surface">{new Date(data.checkOut).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Clock className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.nights')}</p>
                  <p className="text-sm font-semibold text-on-surface">{data.nights}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                <Users className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Guests</p>
                  <p className="text-sm font-semibold text-on-surface">{data.guestsCount}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <User className="w-4 h-4" />
                <span>{data.adults} Adults</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Users className="w-4 h-4" />
                <span>{data.children} Children</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Baby className="w-4 h-4" />
                <span>{data.infants} Infants</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Dog className="w-4 h-4" />
                <span>{data.pets} Pets</span>
              </div>
            </div>

            {data.specialRequests && (
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Special Requests</p>
                <p className="text-sm text-on-surface leading-relaxed">{data.specialRequests}</p>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <MessageSquare className="w-5 h-5 inline-block me-2 text-secondary" />
              Internal Notes
            </h3>
            <textarea
              value={displayNotes}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none border border-outline-variant/30"
              placeholder="Add internal notes..."
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => saveNotesMutation.mutate(displayNotes)}
                disabled={saveNotesMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
              >
                {saveNotesMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Notes
              </button>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
                <Clock className="w-5 h-5 inline-block me-2 text-secondary" />
                Activity Timeline
              </h3>
              <div className="space-y-3">
                {timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">{item.event}</p>
                      <p className="text-xs text-on-surface-variant">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Financial */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <CreditCard className="w-5 h-5 inline-block me-2 text-secondary" />
              Financial Summary
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Nightly rate x {data.nights} nights</span>
                <span className="text-on-surface font-medium">{currencySymbol}{Number(Number(data.nightlyRate) * data.nights).toLocaleString()}</span>
              </div>
              {Number(data.cleaningFee) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Cleaning fee</span>
                  <span className="text-on-surface font-medium">{currencySymbol}{Number(data.cleaningFee).toLocaleString()}</span>
                </div>
              )}
              {Number(data.serviceFee) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Service fee</span>
                  <span className="text-on-surface font-medium">{currencySymbol}{Number(data.serviceFee).toLocaleString()}</span>
                </div>
              )}
              {Number(data.taxes) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Taxes</span>
                  <span className="text-on-surface font-medium">{currencySymbol}{Number(data.taxes).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-outline-variant/20 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{t('bookings.total')}</span>
                  <span className="font-headline text-xl font-bold text-on-surface">
                    {currencySymbol}{Number(data.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">{t('bookings.payment')}:</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${paymentStyles[data.paymentStatus]}`}>
                {data.paymentStatus}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">Currency:</span>
              <span className="text-xs font-medium text-on-surface">{data.currency}</span>
            </div>

            {/* Payment Actions */}
            {(data.paymentStatus === 'PENDING' || data.paymentStatus === 'PARTIAL') && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Payment Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      try {
                        toast.loading('Generating payment link...', { id: 'payment-link' });
                        const res = await apiClient.post('/payments/create-link', {
                          bookingId: data.id,
                          amount: Number(data.totalAmount),
                          currency: data.currency || 'EUR',
                          description: `Booking at ${data.property.name} - ${data.guestName}`,
                        });
                        const url = res.data?.data?.url || res.data?.url;
                        if (url) {
                          await navigator.clipboard.writeText(url);
                          toast.success('Payment link copied to clipboard!', { id: 'payment-link' });
                        } else {
                          toast.error('Failed to generate link', { id: 'payment-link' });
                        }
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Failed to generate payment link', { id: 'payment-link' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#635BFF] text-white hover:bg-[#5851DB] transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Payment Link
                  </button>
                  <button
                    onClick={async () => {
                      if (!data.guestEmail) {
                        toast.error('No guest email on file');
                        return;
                      }
                      try {
                        toast.loading('Sending payment link...', { id: 'send-link' });
                        const res = await apiClient.post('/payments/create-link', {
                          bookingId: data.id,
                          amount: Number(data.totalAmount),
                          currency: data.currency || 'EUR',
                          description: `Booking at ${data.property.name} - ${data.guestName}`,
                        });
                        const url = res.data?.data?.url || res.data?.url;
                        if (url) {
                          window.open(`https://wa.me/${data.guestPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${data.guestName}, here is your payment link for your booking at ${data.property.name}: ${url}`)}`, '_blank');
                          toast.success('WhatsApp opened with payment link', { id: 'send-link' });
                        }
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Failed', { id: 'send-link' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Property Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <Building2 className="w-5 h-5 inline-block me-2 text-secondary" />
              Property
            </h3>
            <p className="font-semibold text-on-surface mb-1">{data.property.name}</p>
            {data.property.city && (
              <div className="flex items-start gap-2 text-sm text-on-surface-variant mb-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{data.property.city}</span>
              </div>
            )}
            {data.property.internalCode && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                <Building2 className="w-4 h-4" />
                <span>{data.property.internalCode}</span>
              </div>
            )}
            {data.unit && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span>Unit: <span className="font-medium text-on-surface">{data.unit.unitNumber}</span></span>
              </div>
            )}
            <Link
              to={`/properties/${data.property.id}`}
              className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              View Property
            </Link>
          </div>

          {/* Source */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              {t('bookings.source')}
            </p>
            <p className="font-semibold text-on-surface">{data.source}</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Created {new Date(data.createdAt).toLocaleDateString()} at {new Date(data.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
