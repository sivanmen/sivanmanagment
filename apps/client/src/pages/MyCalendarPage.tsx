import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  X,
  User,
  CalendarDays,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApiQuery } from '../hooks/useApi';

interface Property {
  id: string;
  name: string;
}

interface CalendarEvent {
  id: string;
  propertyId: string;
  propertyName: string;
  guestName?: string;
  checkIn: string;
  checkOut: string;
  status: 'booked' | 'pending' | 'blocked';
  totalAmount?: number;
  source?: string;
}

// Stable color map based on property index
const colorPalette = [
  { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success' },
  { bg: 'bg-secondary/15', text: 'text-secondary', dot: 'bg-secondary' },
  { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  { bg: 'bg-error/15', text: 'text-error', dot: 'bg-error' },
  { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500' },
  { bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-500' },
];

function getPropertyColor(index: number) {
  return colorPalette[index % colorPalette.length];
}

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
  const [selectedBooking, setSelectedBooking] = useState<CalendarEvent | null>(null);

  // ── Fetch owner properties ──
  const {
    data: propertiesResponse,
    isLoading: propertiesLoading,
  } = useApiQuery<Property[]>(
    ['owner-portal-properties'],
    '/owner-portal/properties',
  );

  const properties: Property[] = propertiesResponse?.data ?? [];

  // Build a color map from property id/name
  const propertyColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {};
    properties.forEach((p, i) => {
      map[p.id] = getPropertyColor(i);
      map[p.name] = getPropertyColor(i);
    });
    return map;
  }, [properties]);

  // ── Fetch calendar data for selected property or all ──
  // When "all" we fetch for each property, but more practically the API likely supports
  // fetching all at once. We'll try a general calendar endpoint first.
  const calendarMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const calendarPropertyId = selectedProperty === 'all' ? undefined : selectedProperty;

  const {
    data: calendarResponse,
    isLoading: calendarLoading,
    isError: calendarError,
    refetch: refetchCalendar,
  } = useApiQuery<CalendarEvent[]>(
    ['calendar', calendarMonth, selectedProperty],
    calendarPropertyId
      ? `/calendar/property/${calendarPropertyId}`
      : '/calendar/property/all',
    {
      params: {
        month: currentMonth + 1,
        year: currentYear,
      },
    },
  );

  const bookings: CalendarEvent[] = calendarResponse?.data ?? [];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredBookings = useMemo(() => {
    if (selectedProperty === 'all') return bookings;
    return bookings.filter((b) => b.propertyId === selectedProperty || b.propertyName === selectedProperty);
  }, [bookings, selectedProperty]);

  function getBookingsForDay(day: number): CalendarEvent[] {
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    return filteredBookings.filter((b) => {
      const checkIn = b.checkIn?.split('T')[0];
      const checkOut = b.checkOut?.split('T')[0];
      return dateStr >= checkIn && dateStr < checkOut;
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
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const isLoading = propertiesLoading || calendarLoading;

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

      {/* Error state */}
      {calendarError && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm font-medium text-on-surface">Failed to load calendar</p>
          <button
            onClick={() => refetchCalendar()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

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
          {properties.map((prop, index) => {
            const colors = getPropertyColor(index);
            return (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedProperty === prop.id
                    ? 'gradient-accent text-on-secondary'
                    : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                {prop.name}
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

      {/* Loading */}
      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">Loading calendar...</p>
        </div>
      )}

      {/* Calendar Grid */}
      {!isLoading && !calendarError && (
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
                          const colors = propertyColorMap[booking.propertyId] || propertyColorMap[booking.propertyName] || {
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
                                : (booking.guestName || '').split(' ')[0] || 'Guest'}
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
      )}

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

            {selectedBooking.status !== 'blocked' && selectedBooking.guestName && (
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
              {selectedBooking.status !== 'blocked' && selectedBooking.totalAmount != null && selectedBooking.totalAmount > 0 && (
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
