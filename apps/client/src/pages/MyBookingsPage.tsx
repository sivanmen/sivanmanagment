import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  Search,
  User,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  TrendingUp,
  CreditCard,
  MapPin,
  AlertTriangle,
  RefreshCcw,
  Building2,
} from 'lucide-react';
import apiClient from '../lib/api-client';

interface Booking {
  id: string;
  property?: { id: string; name: string; images?: { url: string; isPrimary: boolean }[] };
  propertyName?: string;
  propertyImage?: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  totalAmount?: number;
  nightlyRate?: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes?: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

type StatusFilter = 'all' | 'upcoming' | 'active' | 'past' | 'cancelled';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-success/10 text-success', icon: CheckCircle },
  confirmed: { label: 'Confirmed', color: 'bg-success/10 text-success', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  INQUIRY: { label: 'Inquiry', color: 'bg-secondary/10 text-secondary', icon: Clock },
  CHECKED_IN: { label: 'Active', color: 'bg-secondary/10 text-secondary', icon: CalendarCheck },
  active: { label: 'Active', color: 'bg-secondary/10 text-secondary', icon: CalendarCheck },
  CHECKED_OUT: { label: 'Completed', color: 'bg-on-surface-variant/10 text-on-surface-variant', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-on-surface-variant/10 text-on-surface-variant', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-error/10 text-error', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-error/10 text-error', icon: XCircle },
  NO_SHOW: { label: 'No Show', color: 'bg-error/10 text-error', icon: XCircle },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Paid', color: 'text-success' },
  paid: { label: 'Paid', color: 'text-success' },
  PARTIAL: { label: 'Partial', color: 'text-warning' },
  partial: { label: 'Partial', color: 'text-warning' },
  PENDING: { label: 'Unpaid', color: 'text-error' },
  unpaid: { label: 'Unpaid', color: 'text-error' },
  REFUNDED: { label: 'Refunded', color: 'text-on-surface-variant' },
  FAILED: { label: 'Failed', color: 'text-error' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function calcNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function calcTotal(booking: Booking): number {
  if (booking.totalAmount) return booking.totalAmount;
  const nights = booking.nights || calcNights(booking.checkIn, booking.checkOut);
  return (booking.nightlyRate || 0) * nights + (booking.cleaningFee || 0) + (booking.serviceFee || 0) + (booking.taxes || 0);
}

function getPropertyName(b: Booking): string {
  return b.property?.name || b.propertyName || 'Property';
}

function getPropertyImage(b: Booking): string | undefined {
  if (b.propertyImage) return b.propertyImage;
  if (b.property?.images?.length) {
    const primary = b.property.images.find((i) => i.isPrimary);
    return primary?.url || b.property.images[0]?.url;
  }
  return undefined;
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-44 h-40 sm:h-auto bg-surface-container-high flex-shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-5 bg-surface-container-high rounded w-3/4" />
          <div className="h-3 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-1/2" />
          <div className="h-3 bg-surface-container-high rounded w-2/3" />
          <div className="flex justify-between pt-3 border-t border-surface-container-high/50">
            <div className="h-4 bg-surface-container-high rounded w-20" />
            <div className="h-4 bg-surface-container-high rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: bookingsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/bookings', {
        params: { limit: 100, sortBy: 'checkIn', sortOrder: 'desc' },
      });
      return res.data.data as Booking[];
    },
  });

  const bookings = bookingsResponse ?? [];

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    if (activeTab === 'upcoming') {
      filtered = filtered.filter(
        (b) =>
          ['CONFIRMED', 'PENDING', 'confirmed', 'pending', 'INQUIRY'].includes(b.status) &&
          new Date(b.checkIn) > today,
      );
    } else if (activeTab === 'active') {
      filtered = filtered.filter((b) => ['CHECKED_IN', 'active'].includes(b.status));
    } else if (activeTab === 'past') {
      filtered = filtered.filter((b) => ['CHECKED_OUT', 'completed'].includes(b.status));
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter((b) => ['CANCELLED', 'cancelled', 'NO_SHOW'].includes(b.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          getPropertyName(b).toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [bookings, activeTab, searchQuery, today]);

  // Stats
  const totalBookings = bookings.length;
  const upcomingCheckIns = bookings.filter(
    (b) =>
      ['CONFIRMED', 'PENDING', 'confirmed', 'pending'].includes(b.status) &&
      new Date(b.checkIn) >= today &&
      new Date(b.checkIn) <= nextWeek,
  ).length;
  const activeNow = bookings.filter((b) => ['CHECKED_IN', 'active'].includes(b.status)).length;
  const monthlyRevenue = bookings
    .filter((b) => {
      const ci = new Date(b.checkIn);
      return ci >= monthStart && ci <= monthEnd && !['CANCELLED', 'cancelled', 'NO_SHOW'].includes(b.status);
    })
    .reduce((sum, b) => sum + calcTotal(b), 0);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('bookings.all') },
    { key: 'upcoming', label: t('bookings.upcoming') },
    { key: 'active', label: t('bookings.active') },
    { key: 'past', label: t('bookings.past') },
    { key: 'cancelled', label: t('bookings.cancelled') },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('bookings.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('bookings.title')}
          </h1>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search')} ${t('bookings.searchPlaceholder')}...`}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-error flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-on-surface">Failed to load bookings</p>
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

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high mb-2" />
              <div className="h-6 bg-surface-container-high rounded w-16 mb-1" />
              <div className="h-3 bg-surface-container-high rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{totalBookings}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.totalBookings')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{upcomingCheckIns}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.upcomingCheckins')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{activeNow}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.activeNow')}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}{monthlyRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.revenueThisMonth')}</p>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'gradient-accent text-on-secondary'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => {
            const statusKey = booking.status;
            const statusCfg = statusConfig[statusKey] || statusConfig.PENDING;
            const paymentKey = booking.paymentStatus;
            const paymentCfg = paymentConfig[paymentKey] || paymentConfig.PENDING;
            const StatusIcon = statusCfg.icon;
            const nights = booking.nights || calcNights(booking.checkIn, booking.checkOut);
            const total = calcTotal(booking);
            const propImage = getPropertyImage(booking);
            const propName = getPropertyName(booking);

            return (
              <div
                key={booking.id}
                className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-44 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                    {propImage ? (
                      <img
                        src={propImage}
                        alt={propName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-on-surface-variant/30" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${statusCfg.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-headline font-semibold text-on-surface text-lg">
                          {propName}
                        </h3>
                        <span className="text-xs font-mono text-secondary">{booking.id.substring(0, 16)}</span>
                      </div>
                    </div>

                    {/* Guest */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-on-surface-variant" />
                      </div>
                      <span className="text-sm text-on-surface font-medium">{booking.guestName}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 mt-2.5 text-xs text-on-surface-variant">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDate(booking.checkIn)}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{formatDate(booking.checkOut)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-semibold">
                        {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-high/50">
                      <div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.total')}</p>
                        <p className="text-sm font-semibold text-on-surface">
                          {'\u20AC'}{total.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {['PENDING', 'PARTIAL', 'partial'].includes(paymentKey) &&
                          !['CANCELLED', 'cancelled', 'NO_SHOW'].includes(statusKey) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/booking/${booking.id}/pay`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-lg transition-all"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay Now
                          </button>
                        )}
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.payment')}</p>
                          <div className="flex items-center gap-1">
                            <CreditCard className={`w-3 h-3 ${paymentCfg.color}`} />
                            <p className={`text-sm font-medium ${paymentCfg.color}`}>{paymentCfg.label}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredBookings.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <CalendarDays className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium">{t('bookings.noBookings')}</p>
        </div>
      )}
    </div>
  );
}
