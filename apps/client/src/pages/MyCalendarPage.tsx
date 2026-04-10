import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  CalendarDays,
  MapPin,
} from 'lucide-react';

interface CalendarBooking {
  id: string;
  propertyName: string;
  propertyColor: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: 'booked' | 'pending' | 'blocked';
  totalAmount: number;
}

const propertyColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Aegean Sunset Villa': { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success' },
  'Heraklion Harbor Suite': { bg: 'bg-secondary/15', text: 'text-secondary', dot: 'bg-secondary' },
  'Chania Old Town Residence': { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  'Rethymno Beachfront Studio': { bg: 'bg-error/15', text: 'text-error', dot: 'bg-error' },
};

const propertyNames = Object.keys(propertyColors);

// Generate demo bookings relative to today
function generateDemoBookings(): CalendarBooking[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  return [
    {
      id: 'BK-2026-1201',
      propertyName: 'Aegean Sunset Villa',
      propertyColor: 'success',
      guestName: 'Marcus Lindqvist',
      checkIn: new Date(year, month, 14).toISOString().split('T')[0],
      checkOut: new Date(year, month, 21).toISOString().split('T')[0],
      status: 'booked',
      totalAmount: 1960,
    },
    {
      id: 'BK-2026-1198',
      propertyName: 'Heraklion Harbor Suite',
      propertyColor: 'secondary',
      guestName: 'Elena Papadopoulos',
      checkIn: new Date(year, month, 10).toISOString().split('T')[0],
      checkOut: new Date(year, month, 15).toISOString().split('T')[0],
      status: 'booked',
      totalAmount: 600,
    },
    {
      id: 'BK-2026-1195',
      propertyName: 'Chania Old Town Residence',
      propertyColor: 'warning',
      guestName: 'Hans Weber',
      checkIn: new Date(year, month, 18).toISOString().split('T')[0],
      checkOut: new Date(year, month, 25).toISOString().split('T')[0],
      status: 'pending',
      totalAmount: 1400,
    },
    {
      id: 'BK-2026-1190',
      propertyName: 'Aegean Sunset Villa',
      propertyColor: 'success',
      guestName: 'Sophie Dubois',
      checkIn: new Date(year, month, 25).toISOString().split('T')[0],
      checkOut: new Date(year, month + 1, 2).toISOString().split('T')[0],
      status: 'booked',
      totalAmount: 1960,
    },
    {
      id: 'BK-2026-1185',
      propertyName: 'Rethymno Beachfront Studio',
      propertyColor: 'error',
      guestName: '',
      checkIn: new Date(year, month, 1).toISOString().split('T')[0],
      checkOut: new Date(year, month, 8).toISOString().split('T')[0],
      status: 'blocked',
      totalAmount: 0,
    },
    {
      id: 'BK-2026-1180',
      propertyName: 'Heraklion Harbor Suite',
      propertyColor: 'secondary',
      guestName: 'Anna Kowalski',
      checkIn: new Date(year, month, 22).toISOString().split('T')[0],
      checkOut: new Date(year, month, 27).toISOString().split('T')[0],
      status: 'booked',
      totalAmount: 750,
    },
    {
      id: 'BK-2026-1175',
      propertyName: 'Chania Old Town Residence',
      propertyColor: 'warning',
      guestName: 'Maria Fernandez',
      checkIn: new Date(year, month + 1, 3).toISOString().split('T')[0],
      checkOut: new Date(year, month + 1, 10).toISOString().split('T')[0],
      status: 'booked',
      totalAmount: 1400,
    },
    {
      id: 'BK-2026-1172',
      propertyName: 'Aegean Sunset Villa',
      propertyColor: 'success',
      guestName: 'James Richardson',
      checkIn: new Date(year, month + 1, 5).toISOString().split('T')[0],
      checkOut: new Date(year, month + 1, 12).toISOString().split('T')[0],
      status: 'pending',
      totalAmount: 1960,
    },
  ];
}

const demoBookings = generateDemoBookings();

const statusLegend = [
  { key: 'booked', label: 'Booked', color: 'bg-success' },
  { key: 'pending', label: 'Pending', color: 'bg-warning' },
  { key: 'blocked', label: 'Blocked', color: 'bg-on-surface-variant/40' },
  { key: 'available', label: 'Available', color: 'bg-surface-container-lowest border border-surface-container-high' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Monday = 0, Sunday = 6
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function MyCalendarPage() {
  const { t } = useTranslation();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredBookings = useMemo(() => {
    if (selectedProperty === 'all') return demoBookings;
    return demoBookings.filter((b) => b.propertyName === selectedProperty);
  }, [selectedProperty]);

  function getBookingsForDay(day: number): CalendarBooking[] {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    return filteredBookings.filter((b) => {
      return dateStr >= b.checkIn && dateStr < b.checkOut;
    });
  }

  function isToday(day: number): boolean {
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  // Build calendar grid cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  // Fill remaining cells
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('calendar.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('calendar.title')}
          </h1>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Property Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedProperty('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedProperty === 'all'
                ? 'gradient-accent text-on-secondary'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('calendar.allProperties')}
          </button>
          {propertyNames.map((name) => {
            const colors = propertyColors[name];
            return (
              <button
                key={name}
                onClick={() => setSelectedProperty(name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedProperty === name
                    ? 'gradient-accent text-on-secondary'
                    : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                {name}
              </button>
            );
          })}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest ambient-shadow flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-on-surface" />
          </button>
          <span className="font-headline font-semibold text-on-surface min-w-[160px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest ambient-shadow flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-on-surface" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b border-surface-container-high">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, index) => {
            const dayBookings = day ? getBookingsForDay(day) : [];
            const todayClass = day && isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[90px] lg:min-h-[110px] p-1.5 border-b border-r border-surface-container-high/50 ${
                  day ? 'bg-surface-container-lowest' : 'bg-surface-container-low/30'
                }`}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          todayClass
                            ? 'gradient-accent text-on-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((booking) => {
                        const colors = propertyColors[booking.propertyName] || {
                          bg: 'bg-on-surface-variant/10',
                          text: 'text-on-surface-variant',
                          dot: 'bg-on-surface-variant',
                        };

                        const statusBg =
                          booking.status === 'blocked'
                            ? 'bg-on-surface-variant/10'
                            : booking.status === 'pending'
                              ? 'bg-warning/10'
                              : colors.bg;
                        const statusText =
                          booking.status === 'blocked'
                            ? 'text-on-surface-variant'
                            : booking.status === 'pending'
                              ? 'text-warning'
                              : colors.text;

                        return (
                          <button
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] font-medium truncate ${statusBg} ${statusText} hover:opacity-80 transition-opacity`}
                          >
                            {booking.status === 'blocked'
                              ? 'Blocked'
                              : booking.guestName.split(' ')[0]}
                          </button>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <span className="text-[9px] text-on-surface-variant pl-1">
                          +{dayBookings.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {statusLegend.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded ${item.color}`} />
            <span className="text-xs text-on-surface-variant">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Booking Detail Popup */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-primary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow max-w-sm w-full p-6 relative">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-surface-container-low transition-colors"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>

            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
              {t('calendar.bookingDetails')}
            </p>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
              {selectedBooking.propertyName}
            </h3>

            {selectedBooking.status !== 'blocked' && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-on-surface-variant" />
                </div>
                <span className="text-sm font-medium text-on-surface">{selectedBooking.guestName}</span>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {new Date(selectedBooking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}&rarr;{' '}
                  {new Date(selectedBooking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {selectedBooking.status !== 'blocked' && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <MapPin className="w-4 h-4" />
                  <span>{'\u20AC'}{selectedBooking.totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                  selectedBooking.status === 'booked'
                    ? 'bg-success/10 text-success'
                    : selectedBooking.status === 'pending'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-on-surface-variant/10 text-on-surface-variant'
                }`}
              >
                {selectedBooking.status}
              </span>
              <span className="text-xs font-mono text-secondary">{selectedBooking.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
