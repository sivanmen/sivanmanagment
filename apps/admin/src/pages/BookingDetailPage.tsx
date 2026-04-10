import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { toast } from 'sonner';

type BookingStatus = 'INQUIRY' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

interface BookingDetail {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestNationality: string;
  guestTotalStays: number;
  propertyName: string;
  propertyId: string;
  propertyAddress: string;
  propertyType: string;
  unitName?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  specialRequests: string;
  nightlyRate: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: string;
  internalNotes: string;
  createdAt: string;
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

const demoBookings: Record<string, BookingDetail> = {
  'bk-a1b2c3d4-e5f6-7890': {
    id: 'bk-a1b2c3d4-e5f6-7890',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    guestPhone: '+30 694 123 4567',
    guestNationality: 'GR',
    guestTotalStays: 3,
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    propertyAddress: '12 Coastal Road, Elounda, Crete',
    propertyType: 'Villa',
    checkIn: '2026-04-15',
    checkOut: '2026-04-22',
    nights: 7,
    adults: 2,
    children: 1,
    infants: 0,
    pets: 0,
    specialRequests: 'Late check-in around 22:00. Baby cot needed.',
    nightlyRate: 320,
    cleaningFee: 90,
    serviceFee: 75,
    taxes: 45,
    totalAmount: 2450,
    currency: 'EUR',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    source: 'Airbnb',
    internalNotes: 'Returning guest. VIP treatment recommended.',
    createdAt: '2026-03-20T14:30:00Z',
  },
  'bk-b2c3d4e5-f6a7-8901': {
    id: 'bk-b2c3d4e5-f6a7-8901',
    guestName: 'Hans Mueller',
    guestEmail: 'h.mueller@outlook.de',
    guestPhone: '+49 170 987 6543',
    guestNationality: 'DE',
    guestTotalStays: 1,
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    propertyAddress: '8 Venetian Port Street, Heraklion, Crete',
    propertyType: 'Apartment',
    unitName: 'Suite A',
    checkIn: '2026-04-18',
    checkOut: '2026-04-25',
    nights: 7,
    adults: 2,
    children: 0,
    infants: 0,
    pets: 0,
    specialRequests: 'Quiet room preferred. Allergic to feathers.',
    nightlyRate: 250,
    cleaningFee: 60,
    serviceFee: 55,
    taxes: 25,
    totalAmount: 1890,
    currency: 'EUR',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    source: 'Booking.com',
    internalNotes: '',
    createdAt: '2026-04-01T09:15:00Z',
  },
  'bk-c3d4e5f6-a7b8-9012': {
    id: 'bk-c3d4e5f6-a7b8-9012',
    guestName: 'Sophie Laurent',
    guestEmail: 'sophie.l@yahoo.fr',
    guestPhone: '+33 6 12 34 56 78',
    guestNationality: 'FR',
    guestTotalStays: 2,
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    propertyAddress: '5 Zambeliou Street, Chania, Crete',
    propertyType: 'House',
    checkIn: '2026-04-10',
    checkOut: '2026-04-14',
    nights: 4,
    adults: 2,
    children: 2,
    infants: 0,
    pets: 1,
    specialRequests: 'Traveling with a small dog (~5kg). Need parking.',
    nightlyRate: 250,
    cleaningFee: 70,
    serviceFee: 40,
    taxes: 10,
    totalAmount: 1120,
    currency: 'EUR',
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    source: 'Direct',
    internalNotes: 'Guest confirmed arrival. Dog-friendly setup done.',
    createdAt: '2026-03-15T18:00:00Z',
  },
};

const timeline = [
  { date: '2026-03-20 14:30', event: 'Booking created', type: 'create' },
  { date: '2026-03-21 10:00', event: 'Payment received', type: 'payment' },
  { date: '2026-03-22 09:00', event: 'Booking confirmed', type: 'status' },
  { date: '2026-04-14 11:00', event: 'Reminder sent to guest', type: 'communication' },
];

export default function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  // Find from demo data or create fallback
  const booking = id ? demoBookings[id] : undefined;

  // Use the first demo booking as fallback for any ID
  const data = booking ?? Object.values(demoBookings)[0];
  const [notesValue, setNotesValue] = useState(data.internalNotes);

  const handleAction = (action: string) => {
    toast.success(`${action} action triggered for booking ${data.id.slice(0, 8)}`);
  };

  const ref = data.id.slice(0, 14).toUpperCase();

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
            <p className="text-sm text-on-surface-variant mt-0.5">{data.propertyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data.status === 'PENDING' && (
            <button
              onClick={() => handleAction('Confirm')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm</span>
            </button>
          )}
          {data.status === 'CONFIRMED' && (
            <button
              onClick={() => handleAction('Check-in')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Check In</span>
            </button>
          )}
          {data.status === 'CHECKED_IN' && (
            <button
              onClick={() => handleAction('Check-out')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Check Out</span>
            </button>
          )}
          {!['CANCELLED', 'CHECKED_OUT', 'NO_SHOW'].includes(data.status) && (
            <button
              onClick={() => handleAction('Cancel')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/5 hover:bg-error/10 transition-colors"
            >
              <XCircle className="w-4 h-4" />
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
                {data.guestName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-on-surface">{data.guestName}</p>
                <p className="text-xs text-on-surface-variant">{data.guestTotalStays} previous stays</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{data.guestEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{data.guestPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span>{data.guestNationality}</span>
              </div>
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
                  <p className="text-sm font-semibold text-on-surface">{data.adults + data.children}</p>
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
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none border border-outline-variant/30"
              placeholder="Add internal notes..."
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => toast.success('Notes saved')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* Timeline */}
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
                <span className="text-on-surface font-medium">{data.currency === 'EUR' ? '\u20AC' : '$'}{(data.nightlyRate * data.nights).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Cleaning fee</span>
                <span className="text-on-surface font-medium">{data.currency === 'EUR' ? '\u20AC' : '$'}{data.cleaningFee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Service fee</span>
                <span className="text-on-surface font-medium">{data.currency === 'EUR' ? '\u20AC' : '$'}{data.serviceFee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Taxes</span>
                <span className="text-on-surface font-medium">{data.currency === 'EUR' ? '\u20AC' : '$'}{data.taxes}</span>
              </div>
              <div className="border-t border-outline-variant/20 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{t('bookings.total')}</span>
                  <span className="font-headline text-xl font-bold text-on-surface">
                    {data.currency === 'EUR' ? '\u20AC' : '$'}{data.totalAmount.toLocaleString()}
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
          </div>

          {/* Property Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">
              <Building2 className="w-5 h-5 inline-block me-2 text-secondary" />
              Property
            </h3>
            <p className="font-semibold text-on-surface mb-1">{data.propertyName}</p>
            <div className="flex items-start gap-2 text-sm text-on-surface-variant mb-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{data.propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
              <Building2 className="w-4 h-4" />
              <span>{data.propertyType}</span>
            </div>
            {data.unitName && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span>Unit: <span className="font-medium text-on-surface">{data.unitName}</span></span>
              </div>
            )}
            <Link
              to={`/properties/${data.propertyId}`}
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
