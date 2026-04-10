import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';

type BookingStatus = 'INQUIRY' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
type BookingSource = 'DIRECT' | 'AIRBNB' | 'BOOKING_COM' | 'VRBO' | 'WEBSITE' | 'PHONE';

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: BookingSource;
  adults: number;
  children: number;
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
  UNPAID: 'bg-error/10 text-error',
  PARTIAL: 'bg-warning/10 text-warning',
  PAID: 'bg-success/10 text-success',
  REFUNDED: 'bg-outline-variant/20 text-on-surface-variant',
};

const demoBookings: Booking[] = [
  {
    id: 'bk-a1b2c3d4-e5f6-7890',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    checkIn: '2026-04-15',
    checkOut: '2026-04-22',
    nights: 7,
    totalAmount: 2450,
    currency: 'EUR',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    source: 'AIRBNB',
    adults: 2,
    children: 1,
  },
  {
    id: 'bk-b2c3d4e5-f6a7-8901',
    guestName: 'Hans Mueller',
    guestEmail: 'h.mueller@outlook.de',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    checkIn: '2026-04-18',
    checkOut: '2026-04-25',
    nights: 7,
    totalAmount: 1890,
    currency: 'EUR',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    source: 'BOOKING_COM',
    adults: 2,
    children: 0,
  },
  {
    id: 'bk-c3d4e5f6-a7b8-9012',
    guestName: 'Sophie Laurent',
    guestEmail: 'sophie.l@yahoo.fr',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    checkIn: '2026-04-10',
    checkOut: '2026-04-14',
    nights: 4,
    totalAmount: 1120,
    currency: 'EUR',
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    source: 'DIRECT',
    adults: 2,
    children: 2,
  },
  {
    id: 'bk-d4e5f6a7-b8c9-0123',
    guestName: 'James Thompson',
    guestEmail: 'j.thompson@gmail.com',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    checkIn: '2026-04-05',
    checkOut: '2026-04-09',
    nights: 4,
    totalAmount: 880,
    currency: 'EUR',
    status: 'CHECKED_OUT',
    paymentStatus: 'PAID',
    source: 'VRBO',
    adults: 1,
    children: 0,
  },
  {
    id: 'bk-e5f6a7b8-c9d0-1234',
    guestName: 'Elena Ivanova',
    guestEmail: 'e.ivanova@mail.ru',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    checkIn: '2026-04-25',
    checkOut: '2026-05-02',
    nights: 7,
    totalAmount: 2650,
    currency: 'EUR',
    status: 'INQUIRY',
    paymentStatus: 'UNPAID',
    source: 'WEBSITE',
    adults: 2,
    children: 0,
  },
  {
    id: 'bk-f6a7b8c9-d0e1-2345',
    guestName: 'Marco Rossi',
    guestEmail: 'm.rossi@libero.it',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    checkIn: '2026-04-20',
    checkOut: '2026-04-27',
    nights: 7,
    totalAmount: 1960,
    currency: 'EUR',
    status: 'CONFIRMED',
    paymentStatus: 'PARTIAL',
    source: 'AIRBNB',
    adults: 2,
    children: 1,
  },
  {
    id: 'bk-a7b8c9d0-e1f2-3456',
    guestName: 'Anna Schmidt',
    guestEmail: 'anna.s@web.de',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    checkIn: '2026-03-28',
    checkOut: '2026-04-02',
    nights: 5,
    totalAmount: 1350,
    currency: 'EUR',
    status: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    source: 'BOOKING_COM',
    adults: 2,
    children: 0,
  },
  {
    id: 'bk-b8c9d0e1-f2a3-4567',
    guestName: 'David Chen',
    guestEmail: 'd.chen@gmail.com',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    checkIn: '2026-04-12',
    checkOut: '2026-04-17',
    nights: 5,
    totalAmount: 1100,
    currency: 'EUR',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    source: 'PHONE',
    adults: 2,
    children: 1,
  },
];

export default function BookingsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return demoBookings.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.guestName.toLowerCase().includes(q) && !b.guestEmail.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (propertyFilter !== 'all' && b.propertyId !== propertyFilter) return false;
      if (sourceFilter !== 'all' && b.source !== sourceFilter) return false;
      if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;
      if (dateFrom && b.checkIn < dateFrom) return false;
      if (dateTo && b.checkIn > dateTo) return false;
      return true;
    });
  }, [search, statusFilter, propertyFilter, sourceFilter, paymentFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const confirmedCount = demoBookings.filter((b) => b.status === 'CONFIRMED').length;
  const revenueThisMonth = demoBookings
    .filter((b) => b.checkIn.startsWith('2026-04') && b.paymentStatus !== 'REFUNDED')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const avgStay =
    demoBookings.length > 0
      ? (demoBookings.reduce((sum, b) => sum + b.nights, 0) / demoBookings.length).toFixed(1)
      : '0';

  const properties = Array.from(new Set(demoBookings.map((b) => JSON.stringify({ id: b.propertyId, name: b.propertyName })))).map(
    (s) => JSON.parse(s) as { id: string; name: string },
  );

  const stats = [
    {
      label: t('bookings.title'),
      value: demoBookings.length,
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
      value: `\u20AC${revenueThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: t('bookings.avgStay'),
      value: `${avgStay} ${t('bookings.nights')}`,
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
            <option value="WEBSITE">Website</option>
            <option value="PHONE">Phone</option>
          </select>
          <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className={inputClass}>
            <option value="all">{t('bookings.allPayments')}</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
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
              {paginated.map((booking) => (
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
                  <td className="px-4 py-3 text-on-surface">{booking.propertyName}</td>
                  <td className="px-4 py-3 text-on-surface whitespace-nowrap">{new Date(booking.checkIn).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-on-surface whitespace-nowrap">{new Date(booking.checkOut).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-on-surface">{booking.nights}</td>
                  <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                    {booking.currency === 'EUR' ? '\u20AC' : '$'}{booking.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[booking.status]}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${paymentStyles[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">{booking.source.replace('_', '.')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${booking.id}`); }}
                      className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-on-surface-variant">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
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
