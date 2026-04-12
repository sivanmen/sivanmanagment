import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApiList, useApiMutation } from '../hooks';
import apiClient from '../lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CHECKED_IN' | 'BLOCK';
type BlockType = 'OWNER_BLOCK' | 'MAINTENANCE' | 'RENOVATION' | 'OTHER';

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source?: string;
  nights?: number;
  totalAmount?: number;
  currency?: string;
  paymentStatus?: string;
  unitId?: string | null;
  unit?: { id: string; unitNumber: string; unitType: string } | null;
}

interface CalendarBlock {
  id: string;
  startDate: string;
  endDate: string;
  blockType: BlockType;
  reason?: string | null;
  unitId?: string | null;
  unit?: { id: string; unitNumber: string; unitType: string } | null;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

interface CalendarData {
  property: { id: string; name: string; ownerId: string };
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
}

interface Property {
  id: string;
  name: string;
  internalCode: string;
  status?: string;
  propertyType?: string;
  city?: string;
}

/** Unified calendar entry — a booking or a block rendered the same way */
interface CalendarEntry {
  id: string;
  guestName: string;
  propertyId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  status: BookingStatus;
}

interface CreateBlockPayload {
  propertyId: string;
  startDate: string;
  endDate: string;
  blockType: BlockType;
  reason?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<BookingStatus, { bg: string; text: string; bar: string }> = {
  CONFIRMED: { bg: 'bg-success/20', text: 'text-success', bar: 'bg-success' },
  PENDING: { bg: 'bg-warning/20', text: 'text-warning', bar: 'bg-warning' },
  CHECKED_IN: { bg: 'bg-secondary/20', text: 'text-secondary', bar: 'bg-secondary' },
  BLOCK: { bg: 'bg-outline-variant/20', text: 'text-on-surface-variant', bar: 'bg-outline-variant' },
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a date to YYYY-MM-DD */
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Convert API bookings + blocks into a unified CalendarEntry[] for a given property */
function normalizeCalendarData(propertyId: string, data: CalendarData): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const b of data.bookings) {
    entries.push({
      id: b.id,
      guestName: b.guestName || 'Guest',
      propertyId,
      checkIn: b.checkIn.slice(0, 10),
      checkOut: b.checkOut.slice(0, 10),
      status: b.status as BookingStatus,
    });
  }

  for (const bl of data.blocks) {
    entries.push({
      id: bl.id,
      guestName: bl.reason || bl.blockType.replace(/_/g, ' '),
      propertyId,
      checkIn: bl.startDate.slice(0, 10),
      checkOut: bl.endDate.slice(0, 10),
      status: 'BLOCK',
    });
  }

  return entries;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [propertySearch, setPropertySearch] = useState('');
  const [showDialog, setShowDialog] = useState<{ propertyId: string; date: string } | null>(null);
  const [blockType, setBlockType] = useState<BlockType>('OWNER_BLOCK');
  const [blockReason, setBlockReason] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');

  // Date range for the current month view
  const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const daysInMonth = lastDay;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ── Fetch properties list ──────────────────────────────────────────────────

  const {
    data: propertiesResponse,
    isLoading: propertiesLoading,
    error: propertiesError,
    refetch: refetchProperties,
  } = useApiList<Property>(
    ['properties'],
    '/properties',
    { limit: 100 },
  );

  const allProperties = propertiesResponse?.data ?? [];
  const propertyIds = allProperties.map((p) => p.id);

  // ── Fetch calendar data for all properties in parallel ─────────────────────

  const {
    data: calendarDataMap,
    isLoading: isCalendarLoading,
    error: calendarError,
    refetch: refetchCalendar,
  } = useQuery<Record<string, CalendarData>>({
    queryKey: ['calendar', 'all-properties', startDate, endDate, propertyIds.join(',')],
    queryFn: async () => {
      const results: Record<string, CalendarData> = {};

      const promises = propertyIds.map(async (pid) => {
        try {
          const { data } = await apiClient.get(`/calendar/property/${pid}`, {
            params: { startDate, endDate },
          });
          results[pid] = data.data;
        } catch {
          // Skip failed properties — they just won't show calendar data
        }
      });

      await Promise.all(promises);
      return results;
    },
    enabled: propertyIds.length > 0,
    staleTime: 30_000,
    retry: 2,
  });

  // Merge all entries from all properties
  const allEntries = useMemo(() => {
    if (!calendarDataMap) return [];
    const entries: CalendarEntry[] = [];
    for (const [propertyId, data] of Object.entries(calendarDataMap)) {
      entries.push(...normalizeCalendarData(propertyId, data));
    }
    return entries;
  }, [calendarDataMap]);

  // ── Create block mutation ──────────────────────────────────────────────────

  const createBlockMutation = useApiMutation<unknown, CreateBlockPayload>(
    'post',
    '/calendar/blocks',
    {
      invalidateKeys: [['calendar']],
      successMessage: 'Block created successfully',
    },
  );

  // ── Filter properties by search ────────────────────────────────────────────

  const filteredProperties = allProperties.filter((p) =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.internalCode?.toLowerCase().includes(propertySearch.toLowerCase()),
  );

  // ── Navigation helpers ─────────────────────────────────────────────────────

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

  // ── Cell helpers ───────────────────────────────────────────────────────────

  const getBookingsForPropertyAndDay = (propertyId: string, day: number) => {
    const dateStr = toDateStr(currentYear, currentMonth, day);
    return allEntries.filter(
      (b) => b.propertyId === propertyId && b.checkIn <= dateStr && b.checkOut > dateStr,
    );
  };

  const getBookingBar = (propertyId: string, day: number) => {
    const dateStr = toDateStr(currentYear, currentMonth, day);
    const bookings = allEntries.filter(
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
    const dateStr = toDateStr(currentYear, currentMonth, day);
    const bookings = getBookingsForPropertyAndDay(propertyId, day);
    if (bookings.length > 0 && bookings[0].status !== 'BLOCK') {
      navigate(`/bookings/${bookings[0].id}`);
    } else {
      setShowDialog({ propertyId, date: dateStr });
      // Pre-fill end date as next day
      const nextDay = new Date(currentYear, currentMonth, day + 1);
      setBlockEndDate(nextDay.toISOString().slice(0, 10));
      setBlockType('OWNER_BLOCK');
      setBlockReason('');
    }
  };

  const handleCreateBlock = async () => {
    if (!showDialog) return;
    await createBlockMutation.mutateAsync({
      propertyId: showDialog.propertyId,
      startDate: showDialog.date,
      endDate: blockEndDate,
      blockType,
      reason: blockReason || undefined,
    });
    setShowDialog(null);
    refetchCalendar();
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (propertiesLoading) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-sm text-on-surface-variant">Loading properties...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (propertiesError) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-sm text-error">Failed to load properties</p>
        <p className="text-xs text-on-surface-variant">{propertiesError.message}</p>
        <button
          onClick={() => refetchProperties()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {isCalendarLoading && (
          <div className="flex items-center gap-1.5 ms-auto">
            <Loader2 className="w-3 h-3 text-secondary animate-spin" />
            <span className="text-on-surface-variant">Loading calendar...</span>
          </div>
        )}
      </div>

      {/* Calendar error banner */}
      {calendarError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-error/10 text-error text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Some calendar data could not be loaded.</span>
          <button
            onClick={() => refetchCalendar()}
            className="ms-auto flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {allProperties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <CalendarIcon className="w-12 h-12 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant">No properties found</p>
        </div>
      )}

      {/* Calendar Grid */}
      {filteredProperties.length > 0 && (
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
                      {property.internalCode && (
                        <p className="text-[10px] text-on-surface-variant">{property.internalCode}</p>
                      )}
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
      )}

      {/* Mobile: Single property list view */}
      <div className="block lg:hidden space-y-3">
        {filteredProperties.map((property) => {
          const propertyBookings = allEntries.filter((b) => b.propertyId === property.id);
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
              {allProperties.find((p) => p.id === showDialog.propertyId)?.name} &mdash; {new Date(showDialog.date).toLocaleDateString()}
            </p>
            <div className="space-y-3">
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

              <div className="border-t border-outline-variant/20 pt-3 space-y-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Create Block</p>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as BlockType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="OWNER_BLOCK">Owner Block</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RENOVATION">Renovation</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  min={showDialog.date}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
                <button
                  onClick={handleCreateBlock}
                  disabled={createBlockMutation.isPending || !blockEndDate}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  {createBlockMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )}
                  Create Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
