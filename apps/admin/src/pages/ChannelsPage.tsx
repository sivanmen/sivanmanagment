import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Radio,
  Link2,
  Unlink,
  RefreshCw,
  BarChart3,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  Hash,
  ExternalLink,
  ArrowUpDown,
  Plus,
  Copy,
  Check,
  X,
  Clock,
  Rss,
  Globe,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Upload,
  Bell,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

type TabKey = 'overview' | 'matrix' | 'rates' | 'ical' | 'performance' | 'alerts';

interface ChannelData {
  id: string;
  name: string;
  logo: string;
  status: ConnectionStatus;
  lastSync: string | null;
  propertiesListed: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  color: string;
  bgColor: string;
  syncErrors: number;
  commission: number;
  avgRating: number;
}

interface PropertyListing {
  propertyId: string;
  propertyName: string;
  city: string;
  channels: Record<string, 'listed' | 'not_listed' | 'syncing'>;
}

interface ChannelRate {
  propertyId: string;
  propertyName: string;
  channelRates: Record<string, number>;
  baseRate: number;
}

interface SeasonalRateOverride {
  id: string;
  name: string;
  season: 'summer' | 'winter' | 'holiday' | 'shoulder' | 'custom';
  startDate: string;
  endDate: string;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  channelIds: string[];
  propertyIds: string[];
}

interface IcalFeed {
  id: string;
  propertyName: string;
  propertyId: string;
  channelName: string;
  importUrl: string;
  exportUrl: string;
  syncFrequency: number;
  lastSynced: string | null;
  syncStatus: 'ok' | 'error' | 'pending';
  syncError: string | null;
  isActive: boolean;
}

interface SyncLogEntry {
  id: string;
  timestamp: string;
  propertyName: string;
  channelName: string;
  direction: 'import' | 'export';
  status: 'success' | 'fail';
  eventsCount: number;
  message: string;
}

interface ChannelAlert {
  id: string;
  type: 'sync_failure' | 'rate_mismatch' | 'listing_issue' | 'booking_conflict';
  severity: 'high' | 'medium' | 'low';
  channelName: string;
  propertyName: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const CHANNEL_IDS = ['airbnb', 'booking', 'vrbo', 'expedia', 'google', 'direct'] as const;

const mockChannels: ChannelData[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: 'A',
    status: 'connected',
    lastSync: '2026-04-12T08:30:00Z',
    propertiesListed: 12,
    bookingsThisMonth: 18,
    revenueThisMonth: 14250,
    color: '#FF5A5F',
    bgColor: 'bg-[#FF5A5F]/10',
    syncErrors: 0,
    commission: 3,
    avgRating: 4.8,
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: 'B',
    status: 'connected',
    lastSync: '2026-04-12T07:45:00Z',
    propertiesListed: 10,
    bookingsThisMonth: 24,
    revenueThisMonth: 18600,
    color: '#003580',
    bgColor: 'bg-[#003580]/10',
    syncErrors: 1,
    commission: 15,
    avgRating: 9.1,
  },
  {
    id: 'vrbo',
    name: 'VRBO',
    logo: 'V',
    status: 'disconnected',
    lastSync: '2026-03-28T14:00:00Z',
    propertiesListed: 0,
    bookingsThisMonth: 0,
    revenueThisMonth: 0,
    color: '#3D67FF',
    bgColor: 'bg-[#3D67FF]/10',
    syncErrors: 0,
    commission: 8,
    avgRating: 0,
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: 'E',
    status: 'connected',
    lastSync: '2026-04-12T06:15:00Z',
    propertiesListed: 6,
    bookingsThisMonth: 8,
    revenueThisMonth: 6200,
    color: '#FBCE38',
    bgColor: 'bg-[#FBCE38]/10',
    syncErrors: 0,
    commission: 12,
    avgRating: 4.5,
  },
  {
    id: 'google',
    name: 'Google VR',
    logo: 'G',
    status: 'error',
    lastSync: '2026-04-11T23:00:00Z',
    propertiesListed: 8,
    bookingsThisMonth: 5,
    revenueThisMonth: 3850,
    color: '#4285F4',
    bgColor: 'bg-[#4285F4]/10',
    syncErrors: 3,
    commission: 0,
    avgRating: 4.6,
  },
  {
    id: 'direct',
    name: 'Direct',
    logo: 'D',
    status: 'connected',
    lastSync: '2026-04-12T09:00:00Z',
    propertiesListed: 15,
    bookingsThisMonth: 11,
    revenueThisMonth: 9800,
    color: '#6b38d4',
    bgColor: 'bg-[#6b38d4]/10',
    syncErrors: 0,
    commission: 0,
    avgRating: 4.9,
  },
];

const propertyNames = [
  { id: 'p1', name: 'Seaside Villa Corfu', city: 'Corfu' },
  { id: 'p2', name: 'Athens Penthouse', city: 'Athens' },
  { id: 'p3', name: 'Mykonos Beach House', city: 'Mykonos' },
  { id: 'p4', name: 'Santorini Sunset Suite', city: 'Santorini' },
  { id: 'p5', name: 'Crete Mountain Lodge', city: 'Chania' },
  { id: 'p6', name: 'Rhodes Old Town Apt', city: 'Rhodes' },
  { id: 'p7', name: 'Thessaloniki Loft', city: 'Thessaloniki' },
  { id: 'p8', name: 'Zakynthos Pool Villa', city: 'Zakynthos' },
  { id: 'p9', name: 'Naxos Harbour View', city: 'Naxos' },
  { id: 'p10', name: 'Paros Cycladic Home', city: 'Paros' },
  { id: 'p11', name: 'Lefkada Waterfront', city: 'Lefkada' },
  { id: 'p12', name: 'Hydra Stone House', city: 'Hydra' },
  { id: 'p13', name: 'Kefalonia Bay Retreat', city: 'Kefalonia' },
  { id: 'p14', name: 'Skiathos Garden Apt', city: 'Skiathos' },
  { id: 'p15', name: 'Pelion Forest Cabin', city: 'Pelion' },
];

const mockPropertyListings: PropertyListing[] = propertyNames.map((p) => ({
  propertyId: p.id,
  propertyName: p.name,
  city: p.city,
  channels: {
    airbnb: Math.random() > 0.2 ? 'listed' : 'not_listed',
    booking: Math.random() > 0.3 ? 'listed' : 'not_listed',
    vrbo: 'not_listed',
    expedia: Math.random() > 0.5 ? 'listed' : 'not_listed',
    google: Math.random() > 0.4 ? 'listed' : Math.random() > 0.5 ? 'syncing' : 'not_listed',
    direct: 'listed',
  },
}));

const mockChannelRates: ChannelRate[] = propertyNames.slice(0, 12).map((p) => {
  const base = Math.floor(80 + Math.random() * 170);
  return {
    propertyId: p.id,
    propertyName: p.name,
    baseRate: base,
    channelRates: {
      airbnb: base + Math.floor(Math.random() * 15 - 5),
      booking: base + Math.floor(Math.random() * 20 - 3),
      vrbo: base + Math.floor(Math.random() * 10),
      expedia: base + Math.floor(Math.random() * 18 - 8),
      google: base + Math.floor(Math.random() * 12 - 4),
      direct: base - Math.floor(Math.random() * 10),
    },
  };
});

const mockSeasonalRates: SeasonalRateOverride[] = [
  {
    id: 'sr1',
    name: 'Summer Peak',
    season: 'summer',
    startDate: '2026-06-15',
    endDate: '2026-09-15',
    adjustmentType: 'percentage',
    adjustmentValue: 35,
    channelIds: ['airbnb', 'booking', 'expedia', 'google', 'direct'],
    propertyIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
  },
  {
    id: 'sr2',
    name: 'Winter Low',
    season: 'winter',
    startDate: '2026-11-01',
    endDate: '2027-03-15',
    adjustmentType: 'percentage',
    adjustmentValue: -20,
    channelIds: ['airbnb', 'booking', 'direct'],
    propertyIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
  },
  {
    id: 'sr3',
    name: 'Easter Holiday',
    season: 'holiday',
    startDate: '2026-04-01',
    endDate: '2026-04-20',
    adjustmentType: 'percentage',
    adjustmentValue: 25,
    channelIds: ['airbnb', 'booking', 'expedia', 'direct'],
    propertyIds: ['p1', 'p3', 'p4'],
  },
  {
    id: 'sr4',
    name: 'Shoulder Season',
    season: 'shoulder',
    startDate: '2026-04-21',
    endDate: '2026-06-14',
    adjustmentType: 'percentage',
    adjustmentValue: 10,
    channelIds: ['airbnb', 'booking', 'expedia', 'google', 'direct'],
    propertyIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
  },
  {
    id: 'sr5',
    name: 'Christmas / NY',
    season: 'holiday',
    startDate: '2026-12-20',
    endDate: '2027-01-05',
    adjustmentType: 'percentage',
    adjustmentValue: 45,
    channelIds: ['airbnb', 'booking', 'expedia', 'google', 'direct'],
    propertyIds: ['p1', 'p2', 'p3', 'p4'],
  },
];

const mockIcalFeeds: IcalFeed[] = [
  { id: 'f1', propertyName: 'Seaside Villa Corfu', propertyId: 'p1', channelName: 'Airbnb', importUrl: 'https://www.airbnb.com/calendar/ical/12345.ics', exportUrl: 'https://api.sivan.gr/ical/p1/export.ics', syncFrequency: 15, lastSynced: '2026-04-12T08:30:00Z', syncStatus: 'ok', syncError: null, isActive: true },
  { id: 'f2', propertyName: 'Seaside Villa Corfu', propertyId: 'p1', channelName: 'Booking.com', importUrl: 'https://admin.booking.com/ical/prop-67890.ics', exportUrl: 'https://api.sivan.gr/ical/p1/export.ics', syncFrequency: 15, lastSynced: '2026-04-12T07:45:00Z', syncStatus: 'ok', syncError: null, isActive: true },
  { id: 'f3', propertyName: 'Athens Penthouse', propertyId: 'p2', channelName: 'Airbnb', importUrl: 'https://www.airbnb.com/calendar/ical/22222.ics', exportUrl: 'https://api.sivan.gr/ical/p2/export.ics', syncFrequency: 30, lastSynced: '2026-04-12T06:00:00Z', syncStatus: 'ok', syncError: null, isActive: true },
  { id: 'f4', propertyName: 'Mykonos Beach House', propertyId: 'p3', channelName: 'VRBO', importUrl: 'https://www.vrbo.com/icalendar/33333.ics', exportUrl: 'https://api.sivan.gr/ical/p3/export.ics', syncFrequency: 60, lastSynced: '2026-04-11T23:00:00Z', syncStatus: 'error', syncError: 'Connection timeout', isActive: true },
  { id: 'f5', propertyName: 'Santorini Sunset Suite', propertyId: 'p4', channelName: 'Expedia', importUrl: 'https://expedia.com/ical/44444.ics', exportUrl: 'https://api.sivan.gr/ical/p4/export.ics', syncFrequency: 15, lastSynced: '2026-04-12T08:00:00Z', syncStatus: 'ok', syncError: null, isActive: true },
  { id: 'f6', propertyName: 'Crete Mountain Lodge', propertyId: 'p5', channelName: 'Airbnb', importUrl: 'https://www.airbnb.com/calendar/ical/55555.ics', exportUrl: 'https://api.sivan.gr/ical/p5/export.ics', syncFrequency: 15, lastSynced: null, syncStatus: 'pending', syncError: null, isActive: false },
  { id: 'f7', propertyName: 'Rhodes Old Town Apt', propertyId: 'p6', channelName: 'Booking.com', importUrl: 'https://admin.booking.com/ical/prop-66666.ics', exportUrl: 'https://api.sivan.gr/ical/p6/export.ics', syncFrequency: 30, lastSynced: '2026-04-12T05:30:00Z', syncStatus: 'ok', syncError: null, isActive: true },
  { id: 'f8', propertyName: 'Zakynthos Pool Villa', propertyId: 'p8', channelName: 'Google VR', importUrl: 'https://calendar.google.com/ical/88888.ics', exportUrl: 'https://api.sivan.gr/ical/p8/export.ics', syncFrequency: 15, lastSynced: '2026-04-12T01:00:00Z', syncStatus: 'error', syncError: 'Invalid iCal format', isActive: true },
];

const mockSyncLog: SyncLogEntry[] = [
  { id: 'sl1', timestamp: '2026-04-12T08:30:00Z', propertyName: 'Seaside Villa Corfu', channelName: 'Airbnb', direction: 'import', status: 'success', eventsCount: 3, message: 'Imported 3 new blocked dates' },
  { id: 'sl2', timestamp: '2026-04-12T08:15:00Z', propertyName: 'Athens Penthouse', channelName: 'Booking.com', direction: 'export', status: 'success', eventsCount: 5, message: 'Exported 5 bookings to channel' },
  { id: 'sl3', timestamp: '2026-04-12T07:45:00Z', propertyName: 'Mykonos Beach House', channelName: 'VRBO', direction: 'import', status: 'fail', eventsCount: 0, message: 'Connection timeout after 30s' },
  { id: 'sl4', timestamp: '2026-04-12T07:30:00Z', propertyName: 'Santorini Sunset Suite', channelName: 'Airbnb', direction: 'import', status: 'success', eventsCount: 1, message: 'Imported 1 new booking' },
  { id: 'sl5', timestamp: '2026-04-12T06:00:00Z', propertyName: 'Crete Mountain Lodge', channelName: 'Expedia', direction: 'export', status: 'success', eventsCount: 8, message: 'Exported availability for next 90 days' },
  { id: 'sl6', timestamp: '2026-04-12T05:30:00Z', propertyName: 'Rhodes Old Town Apt', channelName: 'Booking.com', direction: 'import', status: 'success', eventsCount: 2, message: 'Imported 2 rate updates' },
  { id: 'sl7', timestamp: '2026-04-12T01:00:00Z', propertyName: 'Zakynthos Pool Villa', channelName: 'Google VR', direction: 'import', status: 'fail', eventsCount: 0, message: 'Invalid iCal format -- VEVENT missing DTSTART' },
  { id: 'sl8', timestamp: '2026-04-11T23:00:00Z', propertyName: 'Seaside Villa Corfu', channelName: 'Booking.com', direction: 'export', status: 'success', eventsCount: 12, message: 'Full calendar sync complete' },
  { id: 'sl9', timestamp: '2026-04-11T22:00:00Z', propertyName: 'Naxos Harbour View', channelName: 'Airbnb', direction: 'import', status: 'success', eventsCount: 0, message: 'No changes detected' },
  { id: 'sl10', timestamp: '2026-04-11T21:30:00Z', propertyName: 'Paros Cycladic Home', channelName: 'Google VR', direction: 'import', status: 'fail', eventsCount: 0, message: 'API quota exceeded' },
];

const mockAlerts: ChannelAlert[] = [
  { id: 'a1', type: 'sync_failure', severity: 'high', channelName: 'Google VR', propertyName: 'Zakynthos Pool Villa', message: 'iCal sync failed 3 times in the last 24 hours. Calendar data may be stale.', timestamp: '2026-04-12T01:00:00Z', resolved: false },
  { id: 'a2', type: 'rate_mismatch', severity: 'medium', channelName: 'Booking.com', propertyName: 'Athens Penthouse', message: 'Rate on Booking.com is 18% higher than base rate. Rate parity may be violated.', timestamp: '2026-04-12T06:00:00Z', resolved: false },
  { id: 'a3', type: 'listing_issue', severity: 'medium', channelName: 'Expedia', propertyName: 'Mykonos Beach House', message: 'Listing suspended due to missing tax registration number.', timestamp: '2026-04-11T14:00:00Z', resolved: false },
  { id: 'a4', type: 'booking_conflict', severity: 'high', channelName: 'Airbnb', propertyName: 'Santorini Sunset Suite', message: 'Double booking detected for Apr 18-22. Airbnb and Booking.com overlap.', timestamp: '2026-04-12T07:30:00Z', resolved: false },
  { id: 'a5', type: 'sync_failure', severity: 'low', channelName: 'VRBO', propertyName: 'Mykonos Beach House', message: 'Channel disconnected. No sync for 15 days.', timestamp: '2026-03-28T14:00:00Z', resolved: false },
  { id: 'a6', type: 'rate_mismatch', severity: 'low', channelName: 'Expedia', propertyName: 'Crete Mountain Lodge', message: 'Direct rate is 12% lower than OTA rates. Consider adjusting for parity.', timestamp: '2026-04-11T10:00:00Z', resolved: true },
  { id: 'a7', type: 'listing_issue', severity: 'medium', channelName: 'Google VR', propertyName: 'Thessaloniki Loft', message: 'Photos not meeting minimum quality standards. Listing visibility reduced.', timestamp: '2026-04-10T09:00:00Z', resolved: false },
];

// Performance chart data
const revenueByChannelData = [
  { month: 'Nov', Airbnb: 8200, 'Booking.com': 12400, VRBO: 1200, Expedia: 4100, 'Google VR': 2800, Direct: 6500 },
  { month: 'Dec', Airbnb: 11500, 'Booking.com': 15800, VRBO: 800, Expedia: 5200, 'Google VR': 3100, Direct: 8200 },
  { month: 'Jan', Airbnb: 6800, 'Booking.com': 9200, VRBO: 400, Expedia: 3100, 'Google VR': 1900, Direct: 4800 },
  { month: 'Feb', Airbnb: 7500, 'Booking.com': 10800, VRBO: 600, Expedia: 3600, 'Google VR': 2100, Direct: 5200 },
  { month: 'Mar', Airbnb: 10200, 'Booking.com': 14500, VRBO: 900, Expedia: 4800, 'Google VR': 3200, Direct: 7400 },
  { month: 'Apr', Airbnb: 14250, 'Booking.com': 18600, VRBO: 0, Expedia: 6200, 'Google VR': 3850, Direct: 9800 },
];

const bookingCountData = [
  { name: 'Airbnb', value: 18, color: '#FF5A5F' },
  { name: 'Booking.com', value: 24, color: '#003580' },
  { name: 'VRBO', value: 0, color: '#3D67FF' },
  { name: 'Expedia', value: 8, color: '#FBCE38' },
  { name: 'Google VR', value: 5, color: '#4285F4' },
  { name: 'Direct', value: 11, color: '#6b38d4' },
];

const adrByChannelData = [
  { channel: 'Airbnb', adr: 158 },
  { channel: 'Booking.com', adr: 155 },
  { channel: 'VRBO', adr: 0 },
  { channel: 'Expedia', adr: 145 },
  { channel: 'Google VR', adr: 142 },
  { channel: 'Direct', adr: 168 },
];

const occupancyByChannel = [
  { month: 'Nov', Airbnb: 62, 'Booking.com': 71, Expedia: 45, 'Google VR': 38, Direct: 55 },
  { month: 'Dec', Airbnb: 78, 'Booking.com': 84, Expedia: 55, 'Google VR': 42, Direct: 68 },
  { month: 'Jan', Airbnb: 42, 'Booking.com': 52, Expedia: 30, 'Google VR': 22, Direct: 35 },
  { month: 'Feb', Airbnb: 48, 'Booking.com': 58, Expedia: 35, 'Google VR': 28, Direct: 40 },
  { month: 'Mar', Airbnb: 65, 'Booking.com': 75, Expedia: 48, 'Google VR': 35, Direct: 58 },
  { month: 'Apr', Airbnb: 82, 'Booking.com': 88, Expedia: 58, 'Google VR': 45, Direct: 72 },
];

const CHART_COLORS = ['#FF5A5F', '#003580', '#3D67FF', '#FBCE38', '#4285F4', '#6b38d4'];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function statusIcon(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-3.5 h-3.5 text-success" />;
    case 'disconnected':
      return <XCircle className="w-3.5 h-3.5 text-on-surface-variant" />;
    case 'error':
      return <AlertTriangle className="w-3.5 h-3.5 text-error" />;
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-warning" />;
  }
}

function statusLabel(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    case 'pending':
      return 'Pending';
  }
}

function statusColor(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return 'text-success';
    case 'disconnected':
      return 'text-on-surface-variant';
    case 'error':
      return 'text-error';
    case 'pending':
      return 'text-warning';
  }
}

function seasonBadgeColor(season: string) {
  switch (season) {
    case 'summer':
      return 'bg-amber-500/10 text-amber-600';
    case 'winter':
      return 'bg-blue-500/10 text-blue-500';
    case 'holiday':
      return 'bg-red-500/10 text-red-500';
    case 'shoulder':
      return 'bg-emerald-500/10 text-emerald-600';
    default:
      return 'bg-secondary/10 text-secondary';
  }
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: Radio },
  { key: 'matrix', label: 'Property Matrix', icon: Hash },
  { key: 'rates', label: 'Rate Management', icon: DollarSign },
  { key: 'ical', label: 'iCal Sync', icon: Calendar },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'alerts', label: 'Alerts', icon: Bell },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChannelsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [channels, setChannels] = useState(mockChannels);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [propertyListings, setPropertyListings] = useState(mockPropertyListings);
  const [channelRates, setChannelRates] = useState(mockChannelRates);
  const [seasonalRates] = useState(mockSeasonalRates);
  const [icalFeeds, setIcalFeeds] = useState(mockIcalFeeds);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [bulkAdjustType, setBulkAdjustType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkAdjustValue, setBulkAdjustValue] = useState('');
  const [bulkAdjustChannel, setBulkAdjustChannel] = useState('all');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedProperty, setNewFeedProperty] = useState('p1');
  const [newFeedChannel, setNewFeedChannel] = useState('');
  const [newFeedFrequency, setNewFeedFrequency] = useState(15);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [rateSearch, setRateSearch] = useState('');
  const [copiedFeedId, setCopiedFeedId] = useState<string | null>(null);

  const connected = channels.filter((c) => c.status === 'connected').length;
  const totalListings = channels.reduce((sum, c) => sum + c.propertiesListed, 0);
  const totalBookings = channels.reduce((sum, c) => sum + c.bookingsThisMonth, 0);
  const totalRevenue = channels.reduce((sum, c) => sum + c.revenueThisMonth, 0);
  const totalErrors = channels.reduce((sum, c) => sum + c.syncErrors, 0);
  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length;

  // Handlers
  const handleSync = useCallback(
    (id: string) => {
      setSyncing(id);
      setTimeout(() => {
        setChannels((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, lastSync: new Date().toISOString(), syncErrors: 0 } : c,
          ),
        );
        setSyncing(null);
        toast.success(`${channels.find((c) => c.id === id)?.name} synced successfully`);
      }, 1500);
    },
    [channels],
  );

  const handleToggleConnection = useCallback(
    (id: string) => {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status:
                  c.status === 'connected'
                    ? ('disconnected' as ConnectionStatus)
                    : ('connected' as ConnectionStatus),
                lastSync:
                  c.status === 'disconnected' ? new Date().toISOString() : c.lastSync,
                propertiesListed: c.status === 'disconnected' ? 5 : 0,
                syncErrors: 0,
              }
            : c,
        ),
      );
      const channel = channels.find((c) => c.id === id);
      if (channel) {
        toast.success(
          channel.status === 'connected'
            ? `${channel.name} disconnected`
            : `${channel.name} connected`,
        );
      }
    },
    [channels],
  );

  const handleToggleListing = useCallback(
    (propertyId: string, channelId: string) => {
      setPropertyListings((prev) =>
        prev.map((p) => {
          if (p.propertyId !== propertyId) return p;
          const current = p.channels[channelId];
          const newStatus = current === 'listed' ? 'not_listed' : 'listed';
          return { ...p, channels: { ...p.channels, [channelId]: newStatus } };
        }),
      );
      toast.success('Listing status updated');
    },
    [],
  );

  const handleBulkRateAdjust = useCallback(() => {
    const val = parseFloat(bulkAdjustValue);
    if (isNaN(val) || val === 0) {
      toast.error('Enter a valid adjustment value');
      return;
    }
    setChannelRates((prev) =>
      prev.map((r) => {
        const newRates = { ...r.channelRates };
        for (const ch of Object.keys(newRates)) {
          if (bulkAdjustChannel !== 'all' && ch !== bulkAdjustChannel) continue;
          if (bulkAdjustType === 'percentage') {
            newRates[ch] = Math.round(newRates[ch] * (1 + val / 100));
          } else {
            newRates[ch] = Math.round(newRates[ch] + val);
          }
        }
        return { ...r, channelRates: newRates };
      }),
    );
    toast.success(
      `Rates adjusted by ${bulkAdjustType === 'percentage' ? val + '%' : formatCurrency(val)} ${bulkAdjustChannel === 'all' ? 'across all channels' : `on ${channels.find((c) => c.id === bulkAdjustChannel)?.name}`}`,
    );
    setBulkAdjustValue('');
  }, [bulkAdjustValue, bulkAdjustType, bulkAdjustChannel, channels]);

  const handleCopyFeedUrl = useCallback((feedId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedFeedId(feedId);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedFeedId(null), 2000);
  }, []);

  const handleToggleFeed = useCallback((feedId: string) => {
    setIcalFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, isActive: !f.isActive } : f)),
    );
    toast.success('Feed status updated');
  }, []);

  const handleAddFeed = useCallback(() => {
    if (!newFeedUrl || !newFeedChannel) {
      toast.error('Please fill in all fields');
      return;
    }
    const prop = propertyNames.find((p) => p.id === newFeedProperty);
    const feed: IcalFeed = {
      id: `f${Date.now()}`,
      propertyName: prop?.name || '',
      propertyId: newFeedProperty,
      channelName: newFeedChannel,
      importUrl: newFeedUrl,
      exportUrl: `https://api.sivan.gr/ical/${newFeedProperty}/export.ics`,
      syncFrequency: newFeedFrequency,
      lastSynced: null,
      syncStatus: 'pending',
      syncError: null,
      isActive: true,
    };
    setIcalFeeds((prev) => [...prev, feed]);
    setShowAddFeed(false);
    setNewFeedUrl('');
    setNewFeedChannel('');
    toast.success('iCal feed added');
  }, [newFeedUrl, newFeedProperty, newFeedChannel, newFeedFrequency]);

  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
    toast.success('Alert resolved');
  }, []);

  const handleDismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    toast.success('Alert dismissed');
  }, []);

  // Filtered data
  const filteredListings = useMemo(
    () =>
      propertyListings.filter(
        (p) =>
          p.propertyName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
          p.city.toLowerCase().includes(matrixSearch.toLowerCase()),
      ),
    [propertyListings, matrixSearch],
  );

  const filteredRates = useMemo(
    () =>
      channelRates.filter((r) =>
        r.propertyName.toLowerCase().includes(rateSearch.toLowerCase()),
      ),
    [channelRates, rateSearch],
  );

  // Rate parity issues
  const rateParityIssues = useMemo(() => {
    const issues: { propertyName: string; channel: string; rate: number; baseRate: number; diff: number }[] = [];
    channelRates.forEach((r) => {
      Object.entries(r.channelRates).forEach(([ch, rate]) => {
        const diffPercent = Math.abs(((rate - r.baseRate) / r.baseRate) * 100);
        if (diffPercent > 10) {
          issues.push({
            propertyName: r.propertyName,
            channel: channels.find((c) => c.id === ch)?.name || ch,
            rate,
            baseRate: r.baseRate,
            diff: Math.round(diffPercent),
          });
        }
      });
    });
    return issues;
  }, [channelRates, channels]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Channel Manager
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            OTA Channel Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              channels.filter((c) => c.status === 'connected').forEach((c) => handleSync(c.id));
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Sync All
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Connected', value: `${connected}/${channels.length}`, icon: Wifi, color: 'bg-success/10', iconColor: 'text-success' },
          { label: 'Listings', value: totalListings, icon: Hash, color: 'bg-secondary/10', iconColor: 'text-secondary' },
          { label: 'Bookings (Apr)', value: totalBookings, icon: Calendar, color: 'bg-blue-500/10', iconColor: 'text-blue-500' },
          { label: 'Revenue (Apr)', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
          { label: 'Sync Errors', value: totalErrors, icon: AlertTriangle, color: totalErrors > 0 ? 'bg-error/10' : 'bg-success/10', iconColor: totalErrors > 0 ? 'text-error' : 'text-success' },
          { label: 'Active Alerts', value: unresolvedAlerts, icon: Bell, color: unresolvedAlerts > 0 ? 'bg-warning/10' : 'bg-success/10', iconColor: unresolvedAlerts > 0 ? 'text-warning' : 'text-success' },
        ].map((stat) => (
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1.5 ambient-shadow overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'gradient-accent text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'alerts' && unresolvedAlerts > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                  {unresolvedAlerts}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          channels={channels}
          syncing={syncing}
          onSync={handleSync}
          onToggle={handleToggleConnection}
        />
      )}
      {activeTab === 'matrix' && (
        <MatrixTab
          listings={filteredListings}
          channels={channels}
          search={matrixSearch}
          onSearchChange={setMatrixSearch}
          onToggleListing={handleToggleListing}
        />
      )}
      {activeTab === 'rates' && (
        <RatesTab
          rates={filteredRates}
          channels={channels}
          seasonalRates={seasonalRates}
          rateParityIssues={rateParityIssues}
          search={rateSearch}
          onSearchChange={setRateSearch}
          bulkAdjustType={bulkAdjustType}
          setBulkAdjustType={setBulkAdjustType}
          bulkAdjustValue={bulkAdjustValue}
          setBulkAdjustValue={setBulkAdjustValue}
          bulkAdjustChannel={bulkAdjustChannel}
          setBulkAdjustChannel={setBulkAdjustChannel}
          onBulkAdjust={handleBulkRateAdjust}
        />
      )}
      {activeTab === 'ical' && (
        <IcalTab
          feeds={icalFeeds}
          syncLog={mockSyncLog}
          showAddFeed={showAddFeed}
          setShowAddFeed={setShowAddFeed}
          newFeedUrl={newFeedUrl}
          setNewFeedUrl={setNewFeedUrl}
          newFeedProperty={newFeedProperty}
          setNewFeedProperty={setNewFeedProperty}
          newFeedChannel={newFeedChannel}
          setNewFeedChannel={setNewFeedChannel}
          newFeedFrequency={newFeedFrequency}
          setNewFeedFrequency={setNewFeedFrequency}
          onAddFeed={handleAddFeed}
          onCopyUrl={handleCopyFeedUrl}
          copiedFeedId={copiedFeedId}
          onToggleFeed={handleToggleFeed}
        />
      )}
      {activeTab === 'performance' && <PerformanceTab />}
      {activeTab === 'alerts' && (
        <AlertsTab
          alerts={alerts}
          onResolve={handleResolveAlert}
          onDismiss={handleDismissAlert}
        />
      )}
    </div>
  );
}

// ============================================================================
// TAB: OVERVIEW
// ============================================================================

function OverviewTab({
  channels,
  syncing,
  onSync,
  onToggle,
}: {
  channels: ChannelData[];
  syncing: string | null;
  onSync: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <div
          key={channel.id}
          className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: channel.color }}
              >
                {channel.logo}
              </div>
              <div>
                <h3 className="font-headline text-base font-semibold text-on-surface">
                  {channel.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusIcon(channel.status)}
                  <span className={`text-xs font-medium ${statusColor(channel.status)}`}>
                    {statusLabel(channel.status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onToggle(channel.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                channel.status === 'connected'
                  ? 'bg-error/10 text-error hover:bg-error/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
              }`}
            >
              {channel.status === 'connected' ? (
                <>
                  <Unlink className="w-3 h-3" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3" />
                  Connect
                </>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Properties</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.propertiesListed}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Bookings</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.bookingsThisMonth}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Revenue</p>
              <p className="font-headline text-sm font-bold text-on-surface">{formatCurrency(channel.revenueThisMonth)}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Commission</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.commission}%</p>
            </div>
          </div>

          {/* Sync Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-xs text-on-surface-variant">Last sync:</span>
            </div>
            <span className="text-xs font-medium text-on-surface">
              {channel.lastSync ? relativeTime(channel.lastSync) : '--'}
            </span>
          </div>

          {/* Errors */}
          {channel.syncErrors > 0 && (
            <div className="p-3 rounded-lg bg-error/5 border border-error/10 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-error" />
                <p className="text-xs text-error font-medium">
                  {channel.syncErrors} sync error{channel.syncErrors > 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {channel.status === 'connected' && (
              <button
                onClick={() => onSync(channel.id)}
                disabled={syncing === channel.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncing === channel.id ? 'animate-spin' : ''}`}
                />
                {syncing === channel.id ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
            {channel.status === 'error' && (
              <button
                onClick={() => onSync(channel.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-error bg-error/10 hover:bg-error/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            <button className="flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TAB: PROPERTY-CHANNEL MATRIX
// ============================================================================

function MatrixTab({
  listings,
  channels,
  search,
  onSearchChange,
  onToggleListing,
}: {
  listings: PropertyListing[];
  channels: ChannelData[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggleListing: (propertyId: string, channelId: string) => void;
}) {
  const activeChannels = channels.filter((c) => c.id !== 'vrbo' || true);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          {listings.length} properties
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant sticky start-0 bg-surface-container-lowest z-10 min-w-[200px]">
                  Property
                </th>
                {activeChannels.map((ch) => (
                  <th key={ch.id} className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: ch.color }}
                      >
                        {ch.logo}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {ch.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, idx) => (
                <tr
                  key={listing.propertyId}
                  className={`border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-surface-container-low/20'
                  }`}
                >
                  <td className="px-4 py-3 sticky start-0 bg-inherit z-10">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{listing.propertyName}</p>
                      <p className="text-[11px] text-on-surface-variant">{listing.city}</p>
                    </div>
                  </td>
                  {activeChannels.map((ch) => {
                    const status = listing.channels[ch.id] || 'not_listed';
                    return (
                      <td key={ch.id} className="px-3 py-3 text-center">
                        <button
                          onClick={() => onToggleListing(listing.propertyId, ch.id)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto transition-all hover:scale-110 ${
                            status === 'listed'
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : status === 'syncing'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-surface-container-high text-on-surface-variant/40 hover:bg-surface-container-highest hover:text-on-surface-variant'
                          }`}
                          title={
                            status === 'listed'
                              ? 'Listed - click to unlist'
                              : status === 'syncing'
                                ? 'Syncing...'
                                : 'Not listed - click to list'
                          }
                        >
                          {status === 'listed' ? (
                            <Check className="w-4 h-4" />
                          ) : status === 'syncing' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB: RATE MANAGEMENT
// ============================================================================

function RatesTab({
  rates,
  channels,
  seasonalRates,
  rateParityIssues,
  search,
  onSearchChange,
  bulkAdjustType,
  setBulkAdjustType,
  bulkAdjustValue,
  setBulkAdjustValue,
  bulkAdjustChannel,
  setBulkAdjustChannel,
  onBulkAdjust,
}: {
  rates: ChannelRate[];
  channels: ChannelData[];
  seasonalRates: SeasonalRateOverride[];
  rateParityIssues: { propertyName: string; channel: string; rate: number; baseRate: number; diff: number }[];
  search: string;
  onSearchChange: (v: string) => void;
  bulkAdjustType: 'percentage' | 'fixed';
  setBulkAdjustType: (v: 'percentage' | 'fixed') => void;
  bulkAdjustValue: string;
  setBulkAdjustValue: (v: string) => void;
  bulkAdjustChannel: string;
  setBulkAdjustChannel: (v: string) => void;
  onBulkAdjust: () => void;
}) {
  const [rateSection, setRateSection] = useState<'grid' | 'seasonal' | 'parity'>('grid');
  const activeChannels = channels.filter((c) => c.status !== 'disconnected');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'grid', label: 'Rate Grid', icon: DollarSign },
          { key: 'seasonal', label: 'Seasonal Overrides', icon: Calendar },
          { key: 'parity', label: 'Rate Parity', icon: ArrowUpDown },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setRateSection(st.key as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                rateSection === st.key
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
              {st.key === 'parity' && rateParityIssues.length > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-warning/80 text-white text-[9px] font-bold flex items-center justify-center">
                  {rateParityIssues.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk Rate Adjustment */}
      <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-semibold text-on-surface">Bulk Rate Adjustment</h3>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
              Type
            </label>
            <select
              value={bulkAdjustType}
              onChange={(e) => setBulkAdjustType(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
              Value
            </label>
            <input
              type="number"
              value={bulkAdjustValue}
              onChange={(e) => setBulkAdjustValue(e.target.value)}
              placeholder={bulkAdjustType === 'percentage' ? 'e.g. 10 or -5' : 'e.g. 20 or -10'}
              className="w-32 px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
              Channel
            </label>
            <select
              value={bulkAdjustChannel}
              onChange={(e) => setBulkAdjustChannel(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">All Channels</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onBulkAdjust}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* Rate Grid */}
      {rateSection === 'grid' && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant sticky start-0 bg-surface-container-lowest z-10 min-w-[180px]">
                      Property
                    </th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant min-w-[80px]">
                      Base
                    </th>
                    {activeChannels.map((ch) => (
                      <th key={ch.id} className="px-3 py-3 text-center min-w-[90px]">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: ch.color }}
                          >
                            {ch.logo}
                          </div>
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {ch.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate, idx) => (
                    <tr
                      key={rate.propertyId}
                      className={`border-b border-outline-variant/5 ${
                        idx % 2 === 0 ? '' : 'bg-surface-container-low/20'
                      }`}
                    >
                      <td className="px-4 py-3 sticky start-0 bg-inherit z-10">
                        <p className="text-sm font-medium text-on-surface">{rate.propertyName}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-semibold text-on-surface">
                          {formatCurrency(rate.baseRate)}
                        </span>
                      </td>
                      {activeChannels.map((ch) => {
                        const chRate = rate.channelRates[ch.id] || 0;
                        const diff = chRate - rate.baseRate;
                        const diffPercent = Math.round((diff / rate.baseRate) * 100);
                        const isHighDiff = Math.abs(diffPercent) > 10;
                        return (
                          <td key={ch.id} className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-medium ${isHighDiff ? 'text-warning' : 'text-on-surface'}`}>
                                {formatCurrency(chRate)}
                              </span>
                              {diff !== 0 && (
                                <span
                                  className={`text-[10px] font-medium ${
                                    diff > 0 ? 'text-success' : 'text-error'
                                  }`}
                                >
                                  {diff > 0 ? '+' : ''}
                                  {diffPercent}%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Overrides */}
      {rateSection === 'seasonal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">Seasonal Rate Overrides</h3>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all">
              <Plus className="w-3.5 h-3.5" />
              Add Season
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasonalRates.map((sr) => (
              <div
                key={sr.id}
                className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow hover:shadow-ambient-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">{sr.name}</h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase mt-1 ${seasonBadgeColor(sr.season)}`}
                    >
                      {sr.season}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {sr.adjustmentValue > 0 ? (
                      <ArrowUp className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-error" />
                    )}
                    <span
                      className={`text-lg font-bold ${sr.adjustmentValue > 0 ? 'text-success' : 'text-error'}`}
                    >
                      {sr.adjustmentValue > 0 ? '+' : ''}
                      {sr.adjustmentValue}
                      {sr.adjustmentType === 'percentage' ? '%' : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {formatDateShort(sr.startDate)} - {formatDateShort(sr.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Radio className="w-3.5 h-3.5" />
                    <span>{sr.channelIds.length} channels</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Hash className="w-3.5 h-3.5" />
                    <span>{sr.propertyIds.length} properties</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {sr.channelIds.map((chId) => {
                    const ch = channels.find((c) => c.id === chId);
                    if (!ch) return null;
                    return (
                      <div
                        key={chId}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ backgroundColor: ch.color }}
                        title={ch.name}
                      >
                        {ch.logo}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Parity Checker */}
      {rateSection === 'parity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Rate Parity Checker</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Properties with rate discrepancies greater than 10% from base rate
              </p>
            </div>
            {rateParityIssues.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-success">All rates in parity</span>
              </div>
            )}
          </div>

          {rateParityIssues.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Property
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Channel
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Base Rate
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Channel Rate
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Variance
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rateParityIssues.map((issue, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-outline-variant/5 hover:bg-surface-container-low/50"
                    >
                      <td className="px-4 py-3 text-sm text-on-surface">{issue.propertyName}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{issue.channel}</td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">
                        {formatCurrency(issue.baseRate)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">
                        {formatCurrency(issue.rate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-bold ${issue.rate > issue.baseRate ? 'text-success' : 'text-error'}`}
                        >
                          {issue.rate > issue.baseRate ? '+' : '-'}
                          {issue.diff}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-[10px] font-semibold uppercase">
                          <AlertTriangle className="w-3 h-3" />
                          Mismatch
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB: iCAL SYNC
// ============================================================================

function IcalTab({
  feeds,
  syncLog,
  showAddFeed,
  setShowAddFeed,
  newFeedUrl,
  setNewFeedUrl,
  newFeedProperty,
  setNewFeedProperty,
  newFeedChannel,
  setNewFeedChannel,
  newFeedFrequency,
  setNewFeedFrequency,
  onAddFeed,
  onCopyUrl,
  copiedFeedId,
  onToggleFeed,
}: {
  feeds: IcalFeed[];
  syncLog: SyncLogEntry[];
  showAddFeed: boolean;
  setShowAddFeed: (v: boolean) => void;
  newFeedUrl: string;
  setNewFeedUrl: (v: string) => void;
  newFeedProperty: string;
  setNewFeedProperty: (v: string) => void;
  newFeedChannel: string;
  setNewFeedChannel: (v: string) => void;
  newFeedFrequency: number;
  setNewFeedFrequency: (v: number) => void;
  onAddFeed: () => void;
  onCopyUrl: (feedId: string, url: string) => void;
  copiedFeedId: string | null;
  onToggleFeed: (feedId: string) => void;
}) {
  const [icalSection, setIcalSection] = useState<'import' | 'export' | 'log'>('import');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'import', label: 'Import Feeds', icon: Download },
          { key: 'export', label: 'Export Feeds', icon: Upload },
          { key: 'log', label: 'Sync Log', icon: Clock },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setIcalSection(st.key as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                icalSection === st.key
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          );
        })}
      </div>

      {/* Import Feeds */}
      {icalSection === 'import' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">iCal Import Feeds</h3>
            <button
              onClick={() => setShowAddFeed(!showAddFeed)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Feed
            </button>
          </div>

          {/* Add Feed Form */}
          {showAddFeed && (
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow border border-secondary/20">
              <h4 className="text-sm font-semibold text-on-surface mb-3">New iCal Import Feed</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
                    iCal URL
                  </label>
                  <input
                    type="url"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
                    Property
                  </label>
                  <select
                    value={newFeedProperty}
                    onChange={(e) => setNewFeedProperty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    {propertyNames.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={newFeedChannel}
                    onChange={(e) => setNewFeedChannel(e.target.value)}
                    placeholder="e.g. Airbnb, Booking.com"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">
                    Sync Frequency
                  </label>
                  <select
                    value={newFeedFrequency}
                    onChange={(e) => setNewFeedFrequency(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    <option value={5}>Every 5 minutes</option>
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={1440}>Every 24 hours</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onAddFeed}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Feed
                    </button>
                    <button
                      onClick={() => setShowAddFeed(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed List */}
          <div className="space-y-3">
            {feeds.map((feed) => (
              <div
                key={feed.id}
                className={`bg-surface-container-lowest rounded-xl p-4 ambient-shadow ${
                  !feed.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-on-surface">{feed.propertyName}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-semibold">
                        {feed.channelName}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 font-mono truncate max-w-md">
                      {feed.importUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${
                        feed.syncStatus === 'ok'
                          ? 'bg-success/10 text-success'
                          : feed.syncStatus === 'error'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {feed.syncStatus === 'ok' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : feed.syncStatus === 'error' ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {feed.syncStatus}
                    </div>
                    <button
                      onClick={() => onToggleFeed(feed.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feed.isActive
                          ? 'text-success hover:bg-success/10'
                          : 'text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                      title={feed.isActive ? 'Disable feed' : 'Enable feed'}
                    >
                      {feed.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>Every {feed.syncFrequency}m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    <span>Last: {feed.lastSynced ? relativeTime(feed.lastSynced) : 'Never'}</span>
                  </div>
                  {feed.syncError && (
                    <div className="flex items-center gap-1.5 text-error">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{feed.syncError}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Feeds */}
      {icalSection === 'export' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">iCal Export URLs</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Auto-generated iCal URLs for each property. Share these with external channels.
            </p>
          </div>
          <div className="space-y-3">
            {propertyNames.slice(0, 10).map((prop) => {
              const exportUrl = `https://api.sivan.gr/ical/${prop.id}/export.ics`;
              const feedId = `export-${prop.id}`;
              return (
                <div
                  key={prop.id}
                  className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface">{prop.name}</h4>
                      <p className="text-xs text-on-surface-variant">{prop.city}</p>
                    </div>
                    <button
                      onClick={() => onCopyUrl(feedId, exportUrl)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        copiedFeedId === feedId
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {copiedFeedId === feedId ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low">
                    <Rss className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                    <code className="text-xs text-on-surface-variant font-mono truncate">
                      {exportUrl}
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sync Log */}
      {icalSection === 'log' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-on-surface">Recent Sync Events</h3>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Time
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Property
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Channel
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Direction
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Events
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncLog.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-outline-variant/5 ${
                        idx % 2 === 0 ? '' : 'bg-surface-container-low/20'
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface">{entry.propertyName}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{entry.channelName}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                            entry.direction === 'import'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {entry.direction === 'import' ? (
                            <Download className="w-3 h-3" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          {entry.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                            entry.status === 'success'
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {entry.status === 'success' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">
                        {entry.eventsCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[250px] truncate">
                        {entry.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB: PERFORMANCE
// ============================================================================

function PerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Revenue by Channel - Stacked Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Revenue by Channel</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByChannelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-container-lowest, #fff)',
                    border: '1px solid var(--color-outline-variant, #e0e0e0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Airbnb" stackId="a" fill="#FF5A5F" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Booking.com" stackId="a" fill="#003580" />
                <Bar dataKey="VRBO" stackId="a" fill="#3D67FF" />
                <Bar dataKey="Expedia" stackId="a" fill="#FBCE38" />
                <Bar dataKey="Google VR" stackId="a" fill="#4285F4" />
                <Bar dataKey="Direct" stackId="a" fill="#6b38d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Count by Channel - Pie */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Bookings by Channel (This Month)</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingCountData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {bookingCountData
                    .filter((d) => d.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-container-lowest, #fff)',
                    border: '1px solid var(--color-outline-variant, #e0e0e0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} bookings`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ADR by Channel - Bar */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="text-sm font-semibold text-on-surface mb-4">ADR by Channel</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adrByChannelData.filter((d) => d.adr > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} width={100} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-container-lowest, #fff)',
                    border: '1px solid var(--color-outline-variant, #e0e0e0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'ADR']}
                />
                <Bar dataKey="adr" radius={[0, 6, 6, 0]}>
                  {adrByChannelData
                    .filter((d) => d.adr > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[CHART_COLORS.length - 1 - (index % CHART_COLORS.length)]}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy by Channel - Line */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Occupancy Rate by Channel (%)</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-container-lowest, #fff)',
                    border: '1px solid var(--color-outline-variant, #e0e0e0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Airbnb" stroke="#FF5A5F" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Booking.com" stroke="#003580" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expedia" stroke="#FBCE38" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Google VR" stroke="#4285F4" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Direct" stroke="#6b38d4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Channel Comparison Summary */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Channel Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Channel
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Properties
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Bookings
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Revenue
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Commission
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Net Revenue
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  ADR
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Rev Share
                </th>
              </tr>
            </thead>
            <tbody>
              {mockChannels
                .filter((ch) => ch.bookingsThisMonth > 0)
                .sort((a, b) => b.revenueThisMonth - a.revenueThisMonth)
                .map((ch, idx) => {
                  const commissionAmt = Math.round((ch.revenueThisMonth * ch.commission) / 100);
                  const netRevenue = ch.revenueThisMonth - commissionAmt;
                  const adr = ch.bookingsThisMonth > 0 ? Math.round(ch.revenueThisMonth / ch.bookingsThisMonth) : 0;
                  const totalRev = mockChannels.reduce((s, c) => s + c.revenueThisMonth, 0);
                  const revShare = totalRev > 0 ? Math.round((ch.revenueThisMonth / totalRev) * 100) : 0;
                  return (
                    <tr
                      key={ch.id}
                      className={`border-b border-outline-variant/5 ${idx % 2 === 0 ? '' : 'bg-surface-container-low/20'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: ch.color }}
                          >
                            {ch.logo}
                          </div>
                          <span className="text-sm font-medium text-on-surface">{ch.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">
                        {ch.propertiesListed}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">
                        {ch.bookingsThisMonth}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">
                        {formatCurrency(ch.revenueThisMonth)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">
                        {ch.commission}% ({formatCurrency(commissionAmt)})
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-success">
                        {formatCurrency(netRevenue)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">
                        {formatCurrency(adr)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${revShare}%`, backgroundColor: ch.color }}
                            />
                          </div>
                          <span className="text-xs font-medium text-on-surface-variant">
                            {revShare}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB: ALERTS
// ============================================================================

function AlertsTab({
  alerts,
  onResolve,
  onDismiss,
}: {
  alerts: ChannelAlert[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);

  const filteredAlerts = showResolved ? alerts : alerts.filter((a) => !a.resolved);

  const highCount = alerts.filter((a) => !a.resolved && a.severity === 'high').length;
  const medCount = alerts.filter((a) => !a.resolved && a.severity === 'medium').length;
  const lowCount = alerts.filter((a) => !a.resolved && a.severity === 'low').length;

  function alertTypeIcon(type: ChannelAlert['type']) {
    switch (type) {
      case 'sync_failure':
        return <RefreshCw className="w-4 h-4" />;
      case 'rate_mismatch':
        return <DollarSign className="w-4 h-4" />;
      case 'listing_issue':
        return <Globe className="w-4 h-4" />;
      case 'booking_conflict':
        return <Calendar className="w-4 h-4" />;
    }
  }

  function alertTypeLabel(type: ChannelAlert['type']) {
    switch (type) {
      case 'sync_failure':
        return 'Sync Failure';
      case 'rate_mismatch':
        return 'Rate Mismatch';
      case 'listing_issue':
        return 'Listing Issue';
      case 'booking_conflict':
        return 'Booking Conflict';
    }
  }

  function severityColor(severity: string) {
    switch (severity) {
      case 'high':
        return 'bg-error/10 text-error border-error/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              High Priority
            </p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-error">{highCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Medium Priority
            </p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-warning">{medCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Low Priority
            </p>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-blue-500">{lowCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">
          {showResolved ? 'All Alerts' : 'Active Alerts'} ({filteredAlerts.length})
        </h3>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          {showResolved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showResolved ? 'Hide Resolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-surface-container-lowest rounded-xl p-4 ambient-shadow border-s-4 ${
              alert.resolved ? 'border-success/40 opacity-60' : severityColor(alert.severity).split(' ')[2] || 'border-outline-variant'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.resolved
                      ? 'bg-success/10 text-success'
                      : severityColor(alert.severity).split(' ').slice(0, 2).join(' ')
                  }`}
                >
                  {alert.resolved ? <CheckCircle className="w-4 h-4" /> : alertTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-on-surface">
                      {alertTypeLabel(alert.type)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${severityColor(alert.severity).split(' ').slice(0, 2).join(' ')}`}
                    >
                      {alert.severity}
                    </span>
                    {alert.resolved && (
                      <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-semibold uppercase">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface mb-1.5">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{alert.channelName}</span>
                    <span className="w-1 h-1 rounded-full bg-on-surface-variant/30" />
                    <span>{alert.propertyName}</span>
                    <span className="w-1 h-1 rounded-full bg-on-surface-variant/30" />
                    <span>{relativeTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
              {!alert.resolved && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Resolve
                  </button>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-on-surface mb-1">All Clear</h3>
            <p className="text-xs text-on-surface-variant">No active alerts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
