import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CHECKED_IN' | 'BLOCK';

interface CalendarBooking {
  id: string;
  guestName: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
}

interface CalendarProperty {
  id: string;
  name: string;
}

const statusColors: Record<BookingStatus, { bg: string; text: string; bar: string }> = {
  CONFIRMED: { bg: 'bg-success/20', text: 'text-success', bar: 'bg-success' },
  PENDING: { bg: 'bg-warning/20', text: 'text-warning', bar: 'bg-warning' },
  CHECKED_IN: { bg: 'bg-secondary/20', text: 'text-secondary', bar: 'bg-secondary' },
  BLOCK: { bg: 'bg-outline-variant/20', text: 'text-on-surface-variant', bar: 'bg-outline-variant' },
};

const calendarProperties: CalendarProperty[] = [
  { id: 'prop-001', name: 'Elounda Breeze Villa' },
  { id: 'prop-002', name: 'Heraklion Harbor Suite' },
  { id: 'prop-003', name: 'Chania Old Town Residence' },
  { id: 'prop-004', name: 'Rethymno Sunset Apartment' },
];

// Generate demo bookings for the current month
function generateDemoBookings(year: number, month: number): CalendarBooking[] {
  return [
    {
      id: 'bk-a1b2c3d4-e5f6-7890',
      guestName: 'Maria P.',
      propertyId: 'prop-001',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-03`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-10`,
      status: 'CONFIRMED',
    },
    {
      id: 'bk-b2c3d4e5-f6a7-8901',
      guestName: 'Hans M.',
      propertyId: 'prop-002',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-05`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-12`,
      status: 'PENDING',
    },
    {
      id: 'bk-c3d4e5f6-a7b8-9012',
      guestName: 'Sophie L.',
      propertyId: 'prop-003',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-10`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-14`,
      status: 'CHECKED_IN',
    },
    {
      id: 'bk-d4e5f6a7-b8c9-0123',
      guestName: 'David C.',
      propertyId: 'prop-004',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-12`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-17`,
      status: 'CONFIRMED',
    },
    {
      id: 'bk-block-001',
      guestName: 'Maintenance',
      propertyId: 'prop-001',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-15`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-18`,
      status: 'BLOCK',
    },
    {
      id: 'bk-e5f6a7b8-c9d0-1234',
      guestName: 'Elena I.',
      propertyId: 'prop-001',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-20`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-27`,
      status: 'CONFIRMED',
    },
    {
      id: 'bk-f6a7b8c9-d0e1-2345',
      guestName: 'Marco R.',
      propertyId: 'prop-003',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-18`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-25`,
      status: 'PENDING',
    },
    {
      id: 'bk-block-002',
      guestName: 'Owner Block',
      propertyId: 'prop-004',
      checkIn: `${year}-${String(month + 1).padStart(2, '0')}-22`,
      checkOut: `${year}-${String(month + 1).padStart(2, '0')}-28`,
      status: 'BLOCK',
    },
  ];
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [propertySearch, setPropertySearch] = useState('');
  const [showDialog, setShowDialog] = useState<{ propertyId: string; date: string } | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const demoBookings = useMemo(
    () => generateDemoBookings(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const filteredProperties = calendarProperties.filter((p) =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()),
  );

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getBookingsForPropertyAndDay = (propertyId: string, day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return demoBookings.filter(
      (b) => b.propertyId === propertyId && b.checkIn <= dateStr && b.checkOut > dateStr,
    );
  };

  const getBookingBar = (propertyId: string, day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bookings = demoBookings.filter(
      (b) => b.propertyId === propertyId && b.checkIn <= dateStr && b.checkOut > dateStr,
    );
    if (bookings.length === 0) return null;
    const booking = bookings[0];
    const isStart = booking.checkIn === dateStr;
    return { booking, isStart };
  };

  const isToday = (day: number) => {
    return (
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const handleCellClick = (propertyId: string, day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bookings = getBookingsForPropertyAndDay(propertyId, day);
    if (bookings.length > 0 && bookings[0].status !== 'BLOCK') {
      navigate(`/bookings/${bookings[0].id}`);
    } else {
      setShowDialog({ propertyId, date: dateStr });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('calendar.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('calendar.title')}
          </h1>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
          </button>
          <h2 className="font-headline text-xl font-bold text-on-surface min-w-[200px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-on-surface-variant" />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>{t('calendar.today')}</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Filter properties..."
            value={propertySearch}
            onChange={(e) => setPropertySearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm bg-success" />
          <span className="text-on-surface-variant">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm bg-warning" />
          <span className="text-on-surface-variant">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm bg-secondary" />
          <span className="text-on-surface-variant">Checked In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm bg-outline-variant relative overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
            }} />
          </div>
          <span className="text-on-surface-variant">Block</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="sticky start-0 z-10 bg-surface-container-lowest text-start px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant min-w-[180px] border-e border-outline-variant/10">
                  Property
                </th>
                {days.map((day) => {
                  const dayDate = new Date(currentYear, currentMonth, day);
                  const dayOfWeek = dayDate.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  return (
                    <th
                      key={day}
                      className={`px-0 py-2 text-center min-w-[36px] ${
                        isToday(day)
                          ? 'bg-secondary/10'
                          : isWeekend
                          ? 'bg-surface-container-low/50'
                          : ''
                      }`}
                    >
                      <div className="text-[10px] text-on-surface-variant uppercase">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayOfWeek]}
                      </div>
                      <div className={`text-xs font-semibold ${isToday(day) ? 'text-secondary' : 'text-on-surface'}`}>
                        {day}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((property) => (
                <tr key={property.id} className="border-b border-outline-variant/10">
                  <td className="sticky start-0 z-10 bg-surface-container-lowest px-3 py-3 border-e border-outline-variant/10">
                    <p className="text-sm font-medium text-on-surface truncate max-w-[160px]">{property.name}</p>
                  </td>
                  {days.map((day) => {
                    const bar = getBookingBar(property.id, day);
                    const dayDate = new Date(currentYear, currentMonth, day);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                    return (
                      <td
                        key={day}
                        onClick={() => handleCellClick(property.id, day)}
                        className={`relative px-0 py-1 cursor-pointer hover:bg-secondary/5 transition-colors ${
                          isToday(day)
                            ? 'bg-secondary/5'
                            : isWeekend
                            ? 'bg-surface-container-low/30'
                            : ''
                        }`}
                      >
                        {bar && (
                          <div
                            className={`h-6 flex items-center ${statusColors[bar.booking.status].bar} ${
                              bar.booking.status === 'BLOCK' ? 'opacity-50' : 'opacity-80'
                            } ${bar.isStart ? 'rounded-s-md ms-0.5' : ''}`}
                            title={`${bar.booking.guestName} (${bar.booking.status})`}
                            style={bar.booking.status === 'BLOCK' ? {
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)',
                            } : undefined}
                          >
                            {bar.isStart && (
                              <span className="text-[10px] text-white font-medium px-1 truncate">
                                {bar.booking.guestName}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: Single property list view */}
      <div className="block lg:hidden space-y-3">
        {filteredProperties.map((property) => {
          const propertyBookings = demoBookings.filter((b) => b.propertyId === property.id);
          return (
            <div key={property.id} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <h4 className="font-headline text-sm font-semibold text-on-surface mb-3">{property.name}</h4>
              {propertyBookings.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No bookings this month</p>
              ) : (
                <div className="space-y-2">
                  {propertyBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => b.status !== 'BLOCK' ? navigate(`/bookings/${b.id}`) : undefined}
                      className={`flex items-center justify-between p-2 rounded-lg ${statusColors[b.status].bg} cursor-pointer`}
                    >
                      <div>
                        <p className={`text-xs font-medium ${statusColors[b.status].text}`}>{b.guestName}</p>
                        <p className="text-[10px] text-on-surface-variant">
                          {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${statusColors[b.status].bg} ${statusColors[b.status].text}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-semibold text-on-surface">Quick Action</h3>
              <button onClick={() => setShowDialog(null)} className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              {calendarProperties.find((p) => p.id === showDialog.propertyId)?.name} &mdash; {new Date(showDialog.date).toLocaleDateString()}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowDialog(null);
                  navigate(`/bookings/new?property=${showDialog.propertyId}&date=${showDialog.date}`);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Booking
              </button>
              <button
                onClick={() => {
                  setShowDialog(null);
                  toast.success('Block created');
                }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                Create Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
