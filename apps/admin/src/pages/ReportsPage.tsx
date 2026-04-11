import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Wrench,
  FileText,
  Users,
  Download,
  FileSpreadsheet,
  FileDown,
  Building2,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  Globe,
  Repeat,
  Moon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import apiClient from '../lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'revenue' | 'occupancy' | 'owner_statement' | 'bookings' | 'maintenance' | 'guests';

interface RevenueTimeSeries {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  bookings: number;
}

interface RevenueReport {
  period: { startDate: string; endDate: string };
  data: RevenueTimeSeries[];
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalNet: number;
    totalBookings: number;
    avgNightlyRate: number;
    avgBookingValue: number;
    totalCleaningFees: number;
    totalServiceFees: number;
    totalTaxes: number;
  };
  byProperty: Array<{
    property: { id: string; name: string; internalCode: string };
    revenue: number;
    expenses: number;
    netIncome: number;
    bookings: number;
  }>;
  bySource: Array<{ source: string; revenue: number; bookings: number }>;
}

interface OccupancyProperty {
  propertyId: string;
  propertyName: string;
  internalCode: string;
  city: string;
  totalNights: number;
  bookedNights: number;
  availableNights: number;
  occupancyRate: number;
  revenue: number;
  avgNightlyRate: number;
  totalBookings: number;
}

interface OccupancyReport {
  period: { startDate: string; endDate: string; totalDays: number };
  averageOccupancy: number;
  bestProperty: { name: string; rate: number } | null;
  worstProperty: { name: string; rate: number } | null;
  properties: OccupancyProperty[];
}

interface BookingsReport {
  period: { startDate: string; endDate: string };
  totalBookings: number;
  avgStay: number;
  avgRate: number;
  conversionRate: number;
  cancellationRate: number;
  data: Array<{ month: string; bookings: number; revenue: number; avgStay: number }>;
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number; revenue: number }>;
  byPaymentStatus: Array<{ paymentStatus: string; count: number }>;
  byProperty: Array<{ propertyId: string; propertyName: string; bookings: number; revenue: number }>;
}

interface MaintenanceReport {
  period: { startDate: string; endDate: string };
  totalRequests: number;
  openRequests: number;
  resolutionRate: number;
  avgResolutionDays: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  byCategory: Array<{ category: string; count: number; totalCost: number; avgCost: number }>;
}

interface OwnerStatementReport {
  owner: { id: string; companyName: string | null; name: string };
  period: { month: number; year: number; startDate: string; endDate: string };
  properties: Array<{
    property: { id: string; name: string; internalCode: string };
    income: number;
    expenses: number;
    managementFee: number;
    netToOwner: number;
    bookingsCount: number;
  }>;
  totals: { income: number; expenses: number; managementFee: number; netToOwner: number };
}

interface GuestAnalyticsReport {
  period: { startDate: string; endDate: string };
  totalGuests: number;
  repeatGuests: number;
  repeatRate: number;
  avgStayLength: number;
  totalBookings: number;
  topNationalities: Array<{ nationality: string; count: number }>;
  guestsByMonth: Array<{ month: string; guests: number }>;
}

interface OwnerOption {
  id: string;
  companyName: string | null;
  user: { firstName: string; lastName: string };
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = {
  primary: '#6b38d4',
  primaryLight: '#8455ef',
  success: '#2e7d32',
  error: '#ba1a1a',
  warning: '#ed6c02',
  info: '#0288d1',
  gray: '#77767d',
  surface: '#46464c',
};

const PIE_COLORS = ['#6b38d4', '#2e7d32', '#ed6c02', '#0288d1', '#ba1a1a', '#8455ef', '#77767d', '#4caf50', '#ff9800'];

const SOURCE_COLORS: Record<string, string> = {
  AIRBNB: '#FF5A5F',
  BOOKING_COM: '#003580',
  DIRECT: '#6b38d4',
  VRBO: '#3B5998',
  ICAL: '#46464c',
  MANUAL: '#77767d',
  WIDGET: '#8455ef',
};

const SOURCE_LABELS: Record<string, string> = {
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
  DIRECT: 'Direct',
  VRBO: 'VRBO',
  ICAL: 'iCal',
  MANUAL: 'Manual',
  WIDGET: 'Widget',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_PARTS: 'Waiting Parts',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#2e7d32',
  MEDIUM: '#ed6c02',
  HIGH: '#ba1a1a',
  URGENT: '#d32f2f',
};

const tooltipStyle = {
  background: 'rgba(30,30,30,0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(107,56,212,0.2)',
  borderRadius: '12px',
  boxShadow: '0px 24px 48px rgba(0,0,0,0.3)',
  fontSize: '12px',
  color: '#e7e8e9',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPeriodLabel(period: string): string {
  if (period.startsWith('W')) {
    return period.slice(1);
  }
  if (period.length === 10) {
    const d = new Date(period);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  // month format: 2026-01
  const [year, month] = period.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleString('en', { month: 'short', year: '2-digit' });
}

function getQuickRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case 'thisMonth': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'lastMonth': {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'thisQuarter': {
      const qStart = Math.floor(m / 3) * 3;
      const start = new Date(y, qStart, 1);
      const end = new Date(y, qStart + 3, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'thisYear': {
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    case 'lastYear': {
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
    }
    default:
      return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function exportToCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success('CSV exported successfully');
}

// ── Skeleton Components ──────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-surface-container-high rounded" />
        <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
      </div>
      <div className="h-7 w-20 bg-surface-container-high rounded mb-1" />
      <div className="h-3 w-16 bg-surface-container-high rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5 animate-pulse">
      <div className="h-5 w-36 bg-surface-container-high rounded mb-6" />
      <div className="h-64 bg-surface-container-high rounded" />
    </div>
  );
}

function ReportLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color = 'text-secondary' }: {
  label: string;
  value: string | number;
  icon: typeof DollarSign;
  color?: string;
}) {
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase">{label}</p>
        <div className={`w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="font-headline text-xl lg:text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

// ── Error / Empty State ──────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-12 text-center">
      <BarChart3 className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
      <p className="text-sm text-on-surface-variant">{message}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-surface-container rounded-2xl border border-error/20 p-12 text-center">
      <AlertTriangle className="w-12 h-12 text-error/60 mx-auto mb-4" />
      <p className="text-sm text-error">{message}</p>
    </div>
  );
}

// ── Report Type Config ───────────────────────────────────────────────────────

const reportTypes: { key: ReportType; icon: typeof BarChart3; labelKey: string }[] = [
  { key: 'revenue', icon: TrendingUp, labelKey: 'reports.revenue' },
  { key: 'occupancy', icon: Building2, labelKey: 'reports.occupancy' },
  { key: 'owner_statement', icon: FileText, labelKey: 'reports.ownerStatement' },
  { key: 'bookings', icon: Calendar, labelKey: 'reports.bookingsAnalysis' },
  { key: 'maintenance', icon: Wrench, labelKey: 'reports.maintenance' },
  { key: 'guests', icon: Users, labelKey: 'reports.guestAnalytics' },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<ReportType>('revenue');
  const [datePreset, setDatePreset] = useState('thisYear');
  const [dateFrom, setDateFrom] = useState(() => getQuickRange('thisYear').start);
  const [dateTo, setDateTo] = useState(() => getQuickRange('thisYear').end);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  const handlePresetChange = useCallback((preset: string) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getQuickRange(preset);
      setDateFrom(range.start);
      setDateTo(range.end);
    }
  }, []);

  const handleDateFromChange = useCallback((val: string) => {
    setDateFrom(val);
    setDatePreset('custom');
  }, []);

  const handleDateToChange = useCallback((val: string) => {
    setDateTo(val);
    setDatePreset('custom');
  }, []);

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const presets = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'lastYear', 'custom'] as const;

  // ── Owners list for owner statement ──
  const { data: ownersList } = useQuery<OwnerOption[]>({
    queryKey: ['owners-list-for-reports'],
    queryFn: async () => {
      const res = await apiClient.get('/owners', { params: { pageSize: 200 } });
      return res.data.data?.items || res.data.data || [];
    },
    enabled: selectedReport === 'owner_statement',
    staleTime: 5 * 60 * 1000,
  });

  // ── Revenue Query ──
  const revenueQuery = useQuery<RevenueReport>({
    queryKey: ['reports-revenue', dateFrom, dateTo, groupBy],
    queryFn: async () => {
      const res = await apiClient.get('/reports/revenue', {
        params: { startDate: dateFrom, endDate: dateTo, groupBy },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'revenue',
    staleTime: 2 * 60 * 1000,
  });

  // ── Occupancy Query ──
  const occupancyQuery = useQuery<OccupancyReport>({
    queryKey: ['reports-occupancy', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get('/reports/occupancy', {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'occupancy',
    staleTime: 2 * 60 * 1000,
  });

  // ── Bookings Query ──
  const bookingsQuery = useQuery<BookingsReport>({
    queryKey: ['reports-bookings', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get('/reports/bookings', {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'bookings',
    staleTime: 2 * 60 * 1000,
  });

  // ── Maintenance Query ──
  const maintenanceQuery = useQuery<MaintenanceReport>({
    queryKey: ['reports-maintenance', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get('/reports/maintenance', {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'maintenance',
    staleTime: 2 * 60 * 1000,
  });

  // ── Owner Statement Query ──
  const ownerStatementQuery = useQuery<OwnerStatementReport>({
    queryKey: ['reports-owner-statement', selectedOwnerId, dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/owner-statement/${selectedOwnerId}`, {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'owner_statement' && !!selectedOwnerId,
    staleTime: 2 * 60 * 1000,
  });

  // ── Guest Analytics Query ──
  const guestsQuery = useQuery<GuestAnalyticsReport>({
    queryKey: ['reports-guests', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get('/reports/guests', {
        params: { startDate: dateFrom, endDate: dateTo },
      });
      return res.data.data;
    },
    enabled: selectedReport === 'guests',
    staleTime: 2 * 60 * 1000,
  });

  // ── CSV Export Handlers ──
  const handleExportCsv = useCallback(() => {
    switch (selectedReport) {
      case 'revenue': {
        const d = revenueQuery.data;
        if (!d) return;
        const rows = d.data.map((r) => ({
          Period: r.period,
          Revenue: r.revenue,
          Expenses: r.expenses,
          'Net Income': r.netIncome,
          Bookings: r.bookings,
        }));
        exportToCsv(rows, 'revenue_report');
        break;
      }
      case 'occupancy': {
        const d = occupancyQuery.data;
        if (!d) return;
        const rows = d.properties.map((p) => ({
          Property: p.propertyName,
          City: p.city,
          'Total Nights': p.totalNights,
          'Booked Nights': p.bookedNights,
          'Occupancy Rate': `${p.occupancyRate}%`,
          Revenue: p.revenue,
          'Avg Nightly Rate': p.avgNightlyRate,
        }));
        exportToCsv(rows, 'occupancy_report');
        break;
      }
      case 'bookings': {
        const d = bookingsQuery.data;
        if (!d) return;
        const rows = d.data.map((r) => ({
          Month: r.month,
          Bookings: r.bookings,
          Revenue: r.revenue,
          'Avg Stay': r.avgStay,
        }));
        exportToCsv(rows, 'bookings_report');
        break;
      }
      case 'maintenance': {
        const d = maintenanceQuery.data;
        if (!d) return;
        const rows = d.byCategory.map((c) => ({
          Category: c.category,
          Count: c.count,
          'Total Cost': c.totalCost,
          'Avg Cost': c.avgCost,
        }));
        exportToCsv(rows, 'maintenance_report');
        break;
      }
      case 'owner_statement': {
        const d = ownerStatementQuery.data;
        if (!d) return;
        const rows = d.properties.map((p) => ({
          Property: p.property.name,
          Income: p.income,
          Expenses: p.expenses,
          'Management Fee': p.managementFee,
          'Net to Owner': p.netToOwner,
        }));
        exportToCsv(rows, `owner_statement_${d.owner.name}`);
        break;
      }
      case 'guests': {
        const d = guestsQuery.data;
        if (!d) return;
        const rows = d.topNationalities.map((n) => ({
          Nationality: n.nationality,
          'Guest Count': n.count,
        }));
        exportToCsv(rows, 'guest_analytics');
        break;
      }
    }
  }, [selectedReport, revenueQuery.data, occupancyQuery.data, bookingsQuery.data, maintenanceQuery.data, ownerStatementQuery.data, guestsQuery.data]);

  const handleExportPdf = useCallback(() => {
    toast.info(t('reports.pdfComingSoon'));
  }, [t]);

  const handleExportExcel = useCallback(() => {
    toast.info(t('reports.excelComingSoon'));
  }, [t]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('reports.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('reports.title')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Export buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/20 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                datePreset === preset
                  ? 'gradient-accent text-white shadow-ambient'
                  : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t(`reports.${preset}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-on-surface-variant">&ndash;</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className={inputClass}
          />
        </div>
        {selectedReport === 'revenue' && (
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
            className={inputClass}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        )}
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.key}
            onClick={() => setSelectedReport(rt.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
              selectedReport === rt.key
                ? 'gradient-accent text-white shadow-ambient-lg'
                : 'bg-surface-container border border-outline-variant/20 text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <rt.icon className="w-5 h-5" />
            <span className="text-xs font-semibold text-center">{t(rt.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'revenue' && <RevenueReportView query={revenueQuery} />}
      {selectedReport === 'occupancy' && <OccupancyReportView query={occupancyQuery} />}
      {selectedReport === 'bookings' && <BookingsReportView query={bookingsQuery} />}
      {selectedReport === 'maintenance' && <MaintenanceReportView query={maintenanceQuery} />}
      {selectedReport === 'owner_statement' && (
        <OwnerStatementView
          query={ownerStatementQuery}
          owners={ownersList || []}
          selectedOwnerId={selectedOwnerId}
          onSelectOwner={setSelectedOwnerId}
        />
      )}
      {selectedReport === 'guests' && <GuestAnalyticsView query={guestsQuery} />}
    </div>
  );
}

// ── Revenue Report View ──────────────────────────────────────────────────────

function RevenueReportView({ query }: { query: ReturnType<typeof useQuery<RevenueReport>> }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  if (isLoading) return <ReportLoadingSkeleton />;
  if (isError) return <ErrorState message={t('reports.error')} />;
  if (!data) return <EmptyState message={t('reports.noData')} />;

  const { summary, data: timeSeries, byProperty } = data;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('reports.totalRevenue')} value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="text-success" />
        <KpiCard label={t('reports.totalExpenses')} value={formatCurrency(summary.totalExpenses)} icon={TrendingUp} color="text-error" />
        <KpiCard label={t('reports.netIncome')} value={formatCurrency(summary.totalNet)} icon={DollarSign} color="text-secondary" />
        <KpiCard label={t('reports.totalBookings')} value={summary.totalBookings} icon={Calendar} />
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">{t('reports.revenueTrend')}</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Avg nightly rate: {formatCurrency(summary.avgNightlyRate)} | Avg booking: {formatCurrency(summary.avgBookingValue)}
        </p>
        {timeSeries.length === 0 ? (
          <EmptyState message={t('reports.noData')} />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.error} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.error} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} tickFormatter={formatPeriodLabel} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Net']} labelFormatter={formatPeriodLabel} />
                <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.success} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke={CHART_COLORS.error} fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                <Line type="monotone" dataKey="netIncome" stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Revenue by Property Table */}
      {byProperty.length > 0 && (
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline text-base font-semibold text-on-surface">{t('reports.revenueByProperty')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.bookingsCount')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.income')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.expenses')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.netIncome')}</th>
                </tr>
              </thead>
              <tbody>
                {byProperty.map((p) => (
                  <tr key={p.property.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-on-surface">
                      <span className="text-xs text-on-surface-variant mr-2">{p.property.internalCode}</span>
                      {p.property.name}
                    </td>
                    <td className="px-5 py-3 text-end text-on-surface">{p.bookings}</td>
                    <td className="px-5 py-3 text-end text-success font-medium">{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-3 text-end text-error font-medium">{formatCurrency(p.expenses)}</td>
                    <td className="px-5 py-3 text-end font-semibold text-on-surface">{formatCurrency(p.netIncome)}</td>
                  </tr>
                ))}
                <tr className="bg-surface-container-high/50 font-semibold">
                  <td className="px-5 py-3 text-on-surface">{t('reports.totals')}</td>
                  <td className="px-5 py-3 text-end text-on-surface">{summary.totalBookings}</td>
                  <td className="px-5 py-3 text-end text-success">{formatCurrency(summary.totalRevenue)}</td>
                  <td className="px-5 py-3 text-end text-error">{formatCurrency(summary.totalExpenses)}</td>
                  <td className="px-5 py-3 text-end text-on-surface">{formatCurrency(summary.totalNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Occupancy Report View ────────────────────────────────────────────────────

function OccupancyReportView({ query }: { query: ReturnType<typeof useQuery<OccupancyReport>> }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  if (isLoading) return <ReportLoadingSkeleton />;
  if (isError) return <ErrorState message={t('reports.error')} />;
  if (!data) return <EmptyState message={t('reports.noData')} />;

  const { averageOccupancy, bestProperty, worstProperty, properties } = data;

  const chartData = properties.map((p) => ({
    name: p.propertyName.length > 20 ? p.propertyName.slice(0, 18) + '...' : p.propertyName,
    fullName: p.propertyName,
    occupancy: p.occupancyRate,
    revenue: p.revenue,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('reports.avgOccupancy')} value={`${averageOccupancy}%`} icon={Percent} color="text-secondary" />
        <KpiCard label={t('reports.properties')} value={properties.length} icon={Building2} />
        <KpiCard label={t('reports.bestProperty')} value={bestProperty ? `${bestProperty.name.slice(0, 20)} (${bestProperty.rate}%)` : '-'} icon={Star} color="text-success" />
        <KpiCard label={t('reports.worstProperty')} value={worstProperty ? `${worstProperty.name.slice(0, 20)} (${worstProperty.rate}%)` : '-'} icon={AlertTriangle} color="text-warning" />
      </div>

      {/* Occupancy Bar Chart */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
        <h3 className="font-headline text-lg font-semibold text-on-surface mb-4">{t('reports.occupancyByProperty')}</h3>
        {chartData.length === 0 ? (
          <EmptyState message={t('reports.noData')} />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} width={150} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Occupancy']} />
                <Bar dataKey="occupancy" radius={[0, 4, 4, 0]} fill={CHART_COLORS.primary}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.occupancy >= 80 ? CHART_COLORS.success : entry.occupancy >= 50 ? CHART_COLORS.primary : CHART_COLORS.error}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Occupancy Table */}
      {properties.length > 0 && (
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.bookedNights')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.availableNights')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.occupancyRate')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.totalRevenue')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.avgRate')}</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.propertyId} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-on-surface">{p.propertyName}</div>
                      <div className="text-[10px] text-on-surface-variant">{p.city} | {p.internalCode}</div>
                    </td>
                    <td className="px-5 py-3 text-end text-on-surface">{p.bookedNights}</td>
                    <td className="px-5 py-3 text-end text-on-surface-variant">{p.availableNights}</td>
                    <td className="px-5 py-3 text-end">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        p.occupancyRate >= 80
                          ? 'bg-success/10 text-success'
                          : p.occupancyRate >= 50
                          ? 'bg-warning/10 text-warning'
                          : 'bg-error/10 text-error'
                      }`}>
                        {p.occupancyRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-end font-medium text-on-surface">{formatCurrency(p.revenue)}</td>
                    <td className="px-5 py-3 text-end text-on-surface-variant">{formatCurrency(p.avgNightlyRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bookings Report View ─────────────────────────────────────────────────────

function BookingsReportView({ query }: { query: ReturnType<typeof useQuery<BookingsReport>> }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  if (isLoading) return <ReportLoadingSkeleton />;
  if (isError) return <ErrorState message={t('reports.error')} />;
  if (!data) return <EmptyState message={t('reports.noData')} />;

  const sourcePieData = data.bySource.map((s) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s.count,
    revenue: s.revenue,
    color: SOURCE_COLORS[s.source] || CHART_COLORS.gray,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('reports.totalBookings')} value={data.totalBookings} icon={Calendar} />
        <KpiCard label={t('reports.avgStay')} value={`${data.avgStay} ${t('reports.nights')}`} icon={Moon} />
        <KpiCard label={t('reports.avgRate')} value={formatCurrency(data.avgRate)} icon={DollarSign} />
        <KpiCard label={t('reports.cancellationRate')} value={`${data.cancellationRate}%`} icon={AlertTriangle} color="text-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bookings Over Time */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.bookingsOverTime')}</h3>
          {data.data.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} tickFormatter={formatPeriodLabel} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={formatPeriodLabel} />
                  <Bar dataKey="bookings" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bookings by Source Pie */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.bookingsBySource')}</h3>
          {sourcePieData.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourcePieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _: any, props: any) => [value, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {sourcePieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-on-surface-variant whitespace-nowrap">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bookings by Property Table */}
      {data.byProperty.length > 0 && (
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline text-base font-semibold text-on-surface">{t('reports.revenueByProperty')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.bookingsCount')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.totalRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {data.byProperty.map((p) => (
                  <tr key={p.propertyId} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-on-surface">{p.propertyName}</td>
                    <td className="px-5 py-3 text-end text-on-surface">{p.bookings}</td>
                    <td className="px-5 py-3 text-end text-success font-medium">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Maintenance Report View ──────────────────────────────────────────────────

function MaintenanceReportView({ query }: { query: ReturnType<typeof useQuery<MaintenanceReport>> }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  if (isLoading) return <ReportLoadingSkeleton />;
  if (isError) return <ErrorState message={t('reports.error')} />;
  if (!data) return <EmptyState message={t('reports.noData')} />;

  const priorityPieData = data.byPriority.map((p) => ({
    name: p.priority,
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || CHART_COLORS.gray,
  }));

  const categoryBarData = data.byCategory.map((c) => ({
    category: c.category.charAt(0) + c.category.slice(1).toLowerCase(),
    count: c.count,
    cost: c.totalCost,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('reports.totalRequests')} value={data.totalRequests} icon={Wrench} />
        <KpiCard label={t('reports.openIssues')} value={data.openRequests} icon={AlertTriangle} color="text-warning" />
        <KpiCard label={t('reports.avgResolution')} value={`${data.avgResolutionDays}d`} icon={Clock} />
        <KpiCard label={t('reports.totalCost')} value={formatCurrency(data.totalActualCost || data.totalEstimatedCost)} icon={DollarSign} color="text-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issues by Category */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.maintenanceByType')}</h3>
          {categoryBarData.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#77767d' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Issues" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* By Priority Pie */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.maintenanceByPriority')}</h3>
          {priorityPieData.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {priorityPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-on-surface-variant capitalize">{item.name.toLowerCase()}</span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status & Category Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Status */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline text-base font-semibold text-on-surface">{t('reports.maintenanceSummary')}</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {data.byStatus.map((s) => (
              <div key={s.status} className="p-3 rounded-lg bg-surface-container-high/50">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                  {STATUS_LABELS[s.status] || s.status}
                </p>
                <p className="font-headline text-lg font-bold text-on-surface">{s.count}</p>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-secondary/10">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">{t('reports.resolutionRate')}</p>
              <p className="font-headline text-lg font-bold text-secondary">{data.resolutionRate}%</p>
            </div>
          </div>
        </div>

        {/* Category cost table */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline text-base font-semibold text-on-surface">{t('reports.totalCost')} by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Category</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.count')}</th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.totalCost')}</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((c) => (
                  <tr key={c.category} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-on-surface capitalize">{c.category.toLowerCase()}</td>
                    <td className="px-5 py-3 text-end text-on-surface">{c.count}</td>
                    <td className="px-5 py-3 text-end text-error font-medium">{formatCurrency(c.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Owner Statement View ─────────────────────────────────────────────────────

function OwnerStatementView({
  query,
  owners,
  selectedOwnerId,
  onSelectOwner,
}: {
  query: ReturnType<typeof useQuery<OwnerStatementReport>>;
  owners: OwnerOption[];
  selectedOwnerId: string;
  onSelectOwner: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container border border-outline-variant/20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="space-y-4">
      {/* Owner Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedOwnerId}
          onChange={(e) => onSelectOwner(e.target.value)}
          className={inputClass + ' min-w-[240px]'}
        >
          <option value="">{t('reports.selectOwner')}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.companyName || `${owner.user.firstName} ${owner.user.lastName}`}
            </option>
          ))}
        </select>
        <button
          onClick={() => toast.info(t('reports.pdfComingSoon'))}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg gradient-accent text-white text-xs font-semibold shadow-ambient hover:shadow-ambient-lg transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          {t('reports.generatePdf')}
        </button>
      </div>

      {!selectedOwnerId && (
        <EmptyState message={t('reports.selectOwner')} />
      )}

      {selectedOwnerId && isLoading && <ReportLoadingSkeleton />}
      {selectedOwnerId && isError && <ErrorState message={t('reports.error')} />}

      {selectedOwnerId && data && (
        <>
          {/* Owner Info */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-on-surface">
                  {data.owner.companyName || data.owner.name}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {data.period.month}/{data.period.year}
                </p>
              </div>
            </div>

            {/* Per-property Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.property')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.bookingsCount')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.income')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.expenses')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.managementFee')}</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('reports.netToOwner')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.properties.map((p) => (
                    <tr key={p.property.id} className="border-b border-outline-variant/10">
                      <td className="px-4 py-3 font-medium text-on-surface">
                        <span className="text-xs text-on-surface-variant mr-2">{p.property.internalCode}</span>
                        {p.property.name}
                      </td>
                      <td className="px-4 py-3 text-end text-on-surface">{p.bookingsCount}</td>
                      <td className="px-4 py-3 text-end text-success font-medium">{formatCurrency(p.income)}</td>
                      <td className="px-4 py-3 text-end text-error font-medium">{formatCurrency(p.expenses)}</td>
                      <td className="px-4 py-3 text-end text-secondary font-medium">{formatCurrency(p.managementFee)}</td>
                      <td className="px-4 py-3 text-end font-bold text-on-surface">{formatCurrency(p.netToOwner)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-container-high/50 font-semibold">
                    <td className="px-4 py-3 text-on-surface" colSpan={2}>{t('reports.totals')}</td>
                    <td className="px-4 py-3 text-end text-success">{formatCurrency(data.totals.income)}</td>
                    <td className="px-4 py-3 text-end text-error">{formatCurrency(data.totals.expenses)}</td>
                    <td className="px-4 py-3 text-end text-secondary">{formatCurrency(data.totals.managementFee)}</td>
                    <td className="px-4 py-3 text-end text-on-surface">{formatCurrency(data.totals.netToOwner)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={t('reports.income')} value={formatCurrency(data.totals.income)} icon={DollarSign} color="text-success" />
            <KpiCard label={t('reports.expenses')} value={formatCurrency(data.totals.expenses)} icon={TrendingUp} color="text-error" />
            <KpiCard label={t('reports.managementFee')} value={formatCurrency(data.totals.managementFee)} icon={Percent} color="text-secondary" />
            <KpiCard label={t('reports.netToOwner')} value={formatCurrency(data.totals.netToOwner)} icon={CheckCircle} color="text-success" />
          </div>
        </>
      )}
    </div>
  );
}

// ── Guest Analytics View ─────────────────────────────────────────────────────

function GuestAnalyticsView({ query }: { query: ReturnType<typeof useQuery<GuestAnalyticsReport>> }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = query;

  if (isLoading) return <ReportLoadingSkeleton />;
  if (isError) return <ErrorState message={t('reports.error')} />;
  if (!data) return <EmptyState message={t('reports.noData')} />;

  const nationalityBarData = data.topNationalities.map((n) => ({
    country: n.nationality,
    guests: n.count,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('reports.totalGuests')} value={data.totalGuests} icon={Users} />
        <KpiCard label={t('reports.repeatGuests')} value={data.repeatGuests} icon={Repeat} color="text-success" />
        <KpiCard label={t('reports.repeatRate')} value={`${data.repeatRate}%`} icon={Percent} />
        <KpiCard label={t('reports.avgStayLength')} value={`${data.avgStayLength} ${t('reports.nights')}`} icon={Moon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Guests Over Time */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.guestsByMonth')}</h3>
          {data.guestsByMonth.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.guestsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} tickFormatter={formatPeriodLabel} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={formatPeriodLabel} />
                  <Line type="monotone" dataKey="guests" stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={{ fill: CHART_COLORS.primary, r: 4 }} name="Guests" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Nationalities */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5">
          <h3 className="font-headline text-base font-semibold text-on-surface mb-4">{t('reports.topNationalities')}</h3>
          {nationalityBarData.length === 0 ? (
            <EmptyState message={t('reports.noData')} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationalityBarData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} />
                  <YAxis type="category" dataKey="country" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#77767d' }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="guests" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Guests">
                    {nationalityBarData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
