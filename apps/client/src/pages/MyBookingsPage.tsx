import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import api from '../lib/api-client';

interface Booking {
  id: string;
  propertyName: string;
  propertyImage: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

const demoBookings: Booking[] = [
  {
    id: 'BK-2026-1201',
    propertyName: 'Aegean Sunset Villa',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    guestName: 'Marcus Lindqvist',
    checkIn: '2026-04-14',
    checkOut: '2026-04-21',
    nights: 7,
    totalAmount: 1960,
    currency: 'EUR',
    status: 'confirmed',
    paymentStatus: 'paid',
  },
  {
    id: 'BK-2026-1198',
    propertyName: 'Heraklion Harbor Suite',
    propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    guestName: 'Elena Papadopoulos',
    checkIn: '2026-04-11',
    checkOut: '2026-04-15',
    nights: 4,
    totalAmount: 600,
    currency: 'EUR',
    status: 'active',
    paymentStatus: 'paid',
  },
  {
    id: 'BK-2026-1195',
    propertyName: 'Chania Old Town Residence',
    propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    guestName: 'Hans Weber',
    checkIn: '2026-04-18',
    checkOut: '2026-04-25',
    nights: 7,
    totalAmount: 1400,
    currency: 'EUR',
    status: 'pending',
    paymentStatus: 'partial',
  },
  {
    id: 'BK-2026-1190',
    propertyName: 'Aegean Sunset Villa',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    guestName: 'Sophie Dubois',
    checkIn: '2026-04-25',
    checkOut: '2026-05-02',
    nights: 7,
    totalAmount: 1960,
    currency: 'EUR',
    status: 'confirmed',
    paymentStatus: 'unpaid',
  },
  {
    id: 'BK-2026-1185',
    propertyName: 'Rethymno Beachfront Studio',
    propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
    guestName: 'James Richardson',
    checkIn: '2026-03-28',
    checkOut: '2026-04-04',
    nights: 7,
    totalAmount: 630,
    currency: 'EUR',
    status: 'completed',
    paymentStatus: 'paid',
  },
  {
    id: 'BK-2026-1180',
    propertyName: 'Heraklion Harbor Suite',
    propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    guestName: 'Anna Kowalski',
    checkIn: '2026-03-20',
    checkOut: '2026-03-25',
    nights: 5,
    totalAmount: 750,
    currency: 'EUR',
    status: 'completed',
    paymentStatus: 'paid',
  },
  {
    id: 'BK-2026-1175',
    propertyName: 'Chania Old Town Residence',
    propertyImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    guestName: 'Oliver Bennett',
    checkIn: '2026-03-10',
    checkOut: '2026-03-14',
    nights: 4,
    totalAmount: 800,
    currency: 'EUR',
    status: 'cancelled',
    paymentStatus: 'unpaid',
  },
  {
    id: 'BK-2026-1170',
    propertyName: 'Aegean Sunset Villa',
    propertyImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
    guestName: 'Maria Fernandez',
    checkIn: '2026-05-05',
    checkOut: '2026-05-12',
    nights: 7,
    totalAmount: 1960,
    currency: 'EUR',
    status: 'confirmed',
    paymentStatus: 'paid',
  },
];

type StatusFilter = 'all' | 'upcoming' | 'active' | 'past' | 'cancelled';

const statusConfig: Record<Booking['status'], { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: 'Confirmed', color: 'bg-success/10 text-success', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  active: { label: 'Active', color: 'bg-secondary/10 text-secondary', icon: CalendarCheck },
  completed: { label: 'Completed', color: 'bg-on-surface-variant/10 text-on-surface-variant', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-error/10 text-error', icon: XCircle },
};

const paymentConfig: Record<Booking['paymentStatus'], { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'text-success' },
  partial: { label: 'Partial', color: 'text-warning' },
  unpaid: { label: 'Unpaid', color: 'text-error' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyBookingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/bookings');
        return res.data.data as Booking[];
      } catch {
        return demoBookings;
      }
    },
    initialData: demoBookings,
  });

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Apply status filter
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(
        (b) => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.checkIn) > today,
      );
    } else if (activeTab === 'active') {
      filtered = filtered.filter((b) => b.status === 'active');
    } else if (activeTab === 'past') {
      filtered = filtered.filter((b) => b.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter((b) => b.status === 'cancelled');
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          b.propertyName.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [bookings, activeTab, searchQuery, today]);

  // Stats
  const totalBookings = bookings.length;
  const upcomingCheckIns = bookings.filter(
    (b) =>
      (b.status === 'confirmed' || b.status === 'pending') &&
      new Date(b.checkIn) >= today &&
      new Date(b.checkIn) <= nextWeek,
  ).length;
  const activeNow = bookings.filter((b) => b.status === 'active').length;
  const monthlyRevenue = bookings
    .filter((b) => {
      const ci = new Date(b.checkIn);
      return ci >= monthStart && ci <= monthEnd && b.status !== 'cancelled';
    })
    .reduce((sum, b) => sum + b.totalAmount, 0);

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

      {/* Summary Stats */}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBookings.map((booking) => {
          const statusCfg = statusConfig[booking.status];
          const paymentCfg = paymentConfig[booking.paymentStatus];
          const StatusIcon = statusCfg.icon;

          return (
            <div
              key={booking.id}
              className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-44 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={booking.propertyImage}
                    alt={booking.propertyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
                        {booking.propertyName}
                      </h3>
                      <span className="text-xs font-mono text-secondary">{booking.id}</span>
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
                      {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-container-high/50">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('bookings.total')}</p>
                      <p className="text-sm font-semibold text-on-surface">
                        {'\u20AC'}{booking.totalAmount.toLocaleString()}
                      </p>
                    </div>
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
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <CalendarDays className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium">{t('bookings.noBookings')}</p>
        </div>
      )}
    </div>
  );
}
