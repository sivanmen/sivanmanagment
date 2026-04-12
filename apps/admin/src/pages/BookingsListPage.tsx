import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Moon,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  XCircle,
  LogIn,
  LogOut,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type BookingStatus = 'INQUIRY' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'FAILED';
type BookingSource = 'DIRECT' | 'AIRBNB' | 'BOOKING_COM' | 'VRBO' | 'ICAL' | 'MANUAL' | 'WIDGET';

interface Booking {
  id: string;
  propertyId: string;
  unitId?: string | null;
  guestId?: string | null;
  guestName: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  guestsCount: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  property: {
    id: string;
    name: string;
    city?: string;
    internalCode?: string;
  };
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  } | null;
  unit?: {
    id: string;
    unitNumber: string;
    unitType: string;
  } | null;
}

interface BookingsResponse {
  data: Booking[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface BookingStatsResponse {
  data: {
    byStatus: { status: string; count: number }[];
    monthlyRevenue: number;
    monthlyBookings: number;
    upcomingCheckIns: number;
    upcomingCheckOuts: number;
  };
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

export default function BookingsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch bookings from API with server-side filtering and pagination
  const { data: bookingsData, isLoading, isError, error } = useQuery<BookingsResponse>({
    queryKey: ['bookings', { search, status: statusFilter, propertyId: propertyFilter, source: sourceFilter, paymentStatus: paymentFilter, dateFrom, dateTo, page, limit: pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      params.sortBy = 'checkIn';
      params.sortOrder = 'desc';
      const res = await apiClient.get('/bookings', { params });
      return res.data;
    },
  });

  // Fetch stats from dedicated endpoint
  const { data: statsData } = useQuery<BookingStatsResponse>({
    queryKey: ['bookings-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/bookings/stats');
      return res.data;
    },
  });

  // Fetch properties for the filter dropdown
  const { data: propertiesData } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ['properties-list-minimal'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 100 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success(t('bookings.cancelSuccess', 'Booking cancelled successfully'));
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.cancelError', 'Failed to cancel booking'));
    },
  });

  // Check-in mutation (update status to CHECKED_IN)
  const checkInMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/bookings/${id}`, { status: 'CHECKED_IN' }),
    onSuccess: () => {
      toast.success(t('bookings.checkInSuccess', 'Guest checked in successfully'));
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.checkInError', 'Failed to check in guest'));
    },
  });

  // Check-out mutation (update status to CHECKED_OUT)
  const checkOutMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/bookings/${id}`, { status: 'CHECKED_OUT' }),
    onSuccess: () => {
      toast.success(t('bookings.checkOutSuccess', 'Guest checked out successfully'));
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
    onError: () => {
      toast.error(t('bookings.checkOutError', 'Failed to check out guest'));
    },
  });

  const handleCancel = (e: React.MouseEvent, id: string, guestName: string) => {
    e.stopPropagation();
    if (window.confirm(t('bookings.confirmCancel', { name: guestName, defaultValue: `Cancel booking for ${guestName}?` }))) {
      cancelMutation.mutate(id);
    }
  };

  const handleCheckIn = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    checkInMutation.mutate(id);
  };

  const handleCheckOut = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    checkOutMutation.mutate(id);
  };

  const bookings = bookingsData?.data ?? [];
  const meta = bookingsData?.meta ?? { total: 0, page: 1, perPage: pageSize, totalPages: 1 };
  const totalPages = meta.totalPages;

  const properties = propertiesData?.data ?? [];

  // Stats from API
  const statsByStatus = statsData?.data?.byStatus ?? [];
  const totalBookings = statsByStatus.reduce((sum, s) => sum + s.count, 0);
  const confirmedCount = statsByStatus.find((s) => s.status === 'CONFIRMED')?.count ?? 0;
  const monthlyRevenue = statsData?.data?.monthlyRevenue ?? 0;
  const avgStayFromBookings =
    bookings.length > 0
      ? (bookings.reduce((sum, b) => sum + b.nights, 0) / bookings.length).toFixed(1)
      : '0';

  const stats = [
    {
      label: t('bookings.title'),
      value: totalBookings,
      icon: Calendar,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: t('bookings.confirmed'),
      value: confirmedCount,
      icon: TrendingUp,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: t('bookings.revenueMonth'),
      value: `\u20AC${Number(monthlyRevenue).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: t('bookings.avgStay'),
      value: `${avgStayFromBookings} ${t('bookings.nights')}`,
      icon: Moon,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('bookings.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('bookings.title')}
          </h1>
        </div>
        <Link
          to="/bookings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('bookings.newBooking')}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder={t('bookings.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">{t('bookings.allStatuses')}</option>
            <option value="INQUIRY">Inquiry</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          <select value={propertyFilter} onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">{t('bookings.allProperties')}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputClass} />
            <span className="text-xs text-on-surface-variant">&ndash;</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={inputClass} />
          </div>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">{t('bookings.allSources')}</option>
            <option value="DIRECT">Direct</option>
            <option value="AIRBNB">Airbnb</option>
            <option value="BOOKING_COM">Booking.com</option>
            <option value="VRBO">VRBO</option>
            <option value="ICAL">iCal</option>
            <option value="MANUAL">Manual</option>
            <option value="WIDGET">Widget</option>
          </select>
          <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">{t('bookings.allPayments')}</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            <span className="ms-2 text-sm text-on-surface-variant">{t('common.loading', 'Loading...')}</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <AlertTriangle className="w-8 h-8 text-error" />
            <p className="text-sm text-error">
              {(error as any)?.response?.data?.error?.message || t('common.error', 'An error occurred')}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}
              className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.guest')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.property')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.checkIn')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.checkOut')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.nights')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.total')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.status')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.payment')}</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('bookings.source')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{booking.guestName}</p>
                        <p className="text-xs text-on-surface-variant">{booking.guestEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface">{booking.property?.name ?? ''}</td>
                    <td className="px-4 py-3 text-on-surface whitespace-nowrap">{new Date(booking.checkIn).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-on-surface whitespace-nowrap">{new Date(booking.checkOut).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-on-surface">{booking.nights}</td>
                    <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                      {booking.currency === 'EUR' ? '\u20AC' : '$'}{Number(booking.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[booking.status]}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${paymentStyles[booking.paymentStatus] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">{booking.source.replace('_', '.')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${booking.id}`); }}
                          className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                          title={t('common.view', 'View')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Check-in button: show for CONFIRMED bookings */}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={(e) => handleCheckIn(e, booking.id)}
                            disabled={checkInMutation.isPending}
                            className="flex items-center justify-center p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors disabled:opacity-40"
                            title={t('bookings.checkIn', 'Check In')}
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                        )}
                        {/* Check-out button: show for CHECKED_IN bookings */}
                        {booking.status === 'CHECKED_IN' && (
                          <button
                            onClick={(e) => handleCheckOut(e, booking.id)}
                            disabled={checkOutMutation.isPending}
                            className="flex items-center justify-center p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-40"
                            title={t('bookings.checkOut', 'Check Out')}
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        {/* Cancel button: show for non-cancelled, non-checked-out, non-no-show bookings */}
                        {!['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(booking.status) && (
                          <button
                            onClick={(e) => handleCancel(e, booking.id, booking.guestName)}
                            disabled={cancelMutation.isPending}
                            className="flex items-center justify-center p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-40"
                            title={t('bookings.cancel', 'Cancel')}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-on-surface-variant">
                      {t('common.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
