import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  User,
  Search,
  Filter,
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Flag,
  Unlock,
  History,
  Settings2,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  Users,
  TrendingUp,
  TrendingDown,
  Hash,
  Globe,
  Camera,
  BadgeCheck,
  FileText,
  MessageCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScreeningStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'BLOCKED';
type BookingSource = 'Airbnb' | 'Booking.com' | 'Direct' | 'VRBO' | 'Expedia';
type TabKey = 'queue' | 'blacklist' | 'rules' | 'history';
type IdVerification = 'VERIFIED' | 'PENDING' | 'FAILED' | 'NOT_SUBMITTED';

interface ScreeningGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  nationality: string;
  nationalityFlag: string;
  bookingRef: string;
  source: BookingSource;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  riskScore: number;
  status: ScreeningStatus;
  previousStays: number;
  cancellationRate: number;
  avgRating: number;
  totalSpent: number;
  idVerification: IdVerification;
  notes: string;
  socialLinks: { platform: string; url: string }[];
  screenedAt?: string;
  screenedBy?: string;
}

interface BlacklistEntry {
  id: string;
  guestName: string;
  email: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
}

interface ScreeningRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'FLAG' | 'BLOCK';
  enabled: boolean;
}

interface HistoryEntry {
  id: string;
  guestName: string;
  action: ScreeningStatus;
  reviewer: string;
  timestamp: string;
  notes: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockGuests: ScreeningGuest[] = [
  {
    id: 'sg-001', name: 'Maria Papadopoulos', email: 'maria.p@gmail.com', phone: '+30 694 123 4567',
    nationality: 'Greece', nationalityFlag: '\u{1F1EC}\u{1F1F7}', bookingRef: 'BK-2026-0412',
    source: 'Airbnb', checkIn: '2026-04-22', checkOut: '2026-04-28', propertyName: 'Santorini Sunset Villa',
    riskScore: 12, status: 'APPROVED', previousStays: 5, cancellationRate: 0, avgRating: 4.9,
    totalSpent: 8400, idVerification: 'VERIFIED', notes: 'Repeat guest, excellent reviews.',
    socialLinks: [{ platform: 'LinkedIn', url: '#' }], screenedAt: '2026-04-10T14:30:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-002', name: 'Hans Mueller', email: 'h.mueller@outlook.de', phone: '+49 170 987 6543',
    nationality: 'Germany', nationalityFlag: '\u{1F1E9}\u{1F1EA}', bookingRef: 'BK-2026-0413',
    source: 'Booking.com', checkIn: '2026-04-25', checkOut: '2026-04-30', propertyName: 'Athens Central Loft',
    riskScore: 45, status: 'PENDING', previousStays: 1, cancellationRate: 50, avgRating: 3.8,
    totalSpent: 1890, idVerification: 'PENDING', notes: 'First-time guest with one cancellation on record.',
    socialLinks: [], screenedAt: undefined, screenedBy: undefined,
  },
  {
    id: 'sg-003', name: 'Sophie Laurent', email: 'sophie.l@yahoo.fr', phone: '+33 6 12 34 56 78',
    nationality: 'France', nationalityFlag: '\u{1F1EB}\u{1F1F7}', bookingRef: 'BK-2026-0414',
    source: 'Direct', checkIn: '2026-04-18', checkOut: '2026-04-24', propertyName: 'Mykonos Beach House',
    riskScore: 8, status: 'APPROVED', previousStays: 3, cancellationRate: 0, avgRating: 4.7,
    totalSpent: 5200, idVerification: 'VERIFIED', notes: 'Loyal direct booker.',
    socialLinks: [{ platform: 'Instagram', url: '#' }, { platform: 'Facebook', url: '#' }],
    screenedAt: '2026-04-09T09:15:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-004', name: 'Dmitry Volkov', email: 'd.volkov@mail.ru', phone: '+7 916 555 1234',
    nationality: 'Russia', nationalityFlag: '\u{1F1F7}\u{1F1FA}', bookingRef: 'BK-2026-0415',
    source: 'Airbnb', checkIn: '2026-05-01', checkOut: '2026-05-14', propertyName: 'Crete Harbor Suite',
    riskScore: 72, status: 'FLAGGED', previousStays: 0, cancellationRate: 100, avgRating: 0,
    totalSpent: 0, idVerification: 'NOT_SUBMITTED', notes: 'No history. Long stay request. ID not provided.',
    socialLinks: [], screenedAt: '2026-04-11T16:00:00Z', screenedBy: 'Yael K.',
  },
  {
    id: 'sg-005', name: 'James Thompson', email: 'j.thompson@gmail.com', phone: '+44 7700 900123',
    nationality: 'United Kingdom', nationalityFlag: '\u{1F1EC}\u{1F1E7}', bookingRef: 'BK-2026-0416',
    source: 'VRBO', checkIn: '2026-04-20', checkOut: '2026-04-27', propertyName: 'Rhodes Old Town Apt',
    riskScore: 22, status: 'APPROVED', previousStays: 3, cancellationRate: 10, avgRating: 4.5,
    totalSpent: 4500, idVerification: 'VERIFIED', notes: 'Good track record.',
    socialLinks: [{ platform: 'Twitter', url: '#' }],
    screenedAt: '2026-04-08T11:20:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-006', name: 'Aisha Benali', email: 'a.benali@hotmail.com', phone: '+212 661 234 567',
    nationality: 'Morocco', nationalityFlag: '\u{1F1F2}\u{1F1E6}', bookingRef: 'BK-2026-0417',
    source: 'Booking.com', checkIn: '2026-04-28', checkOut: '2026-05-03', propertyName: 'Santorini Sunset Villa',
    riskScore: 55, status: 'PENDING', previousStays: 0, cancellationRate: 0, avgRating: 0,
    totalSpent: 0, idVerification: 'PENDING', notes: 'First booking, no history.',
    socialLinks: [], screenedAt: undefined, screenedBy: undefined,
  },
  {
    id: 'sg-007', name: 'Marco Rossi', email: 'm.rossi@libero.it', phone: '+39 333 456 7890',
    nationality: 'Italy', nationalityFlag: '\u{1F1EE}\u{1F1F9}', bookingRef: 'BK-2026-0418',
    source: 'Airbnb', checkIn: '2026-04-30', checkOut: '2026-05-05', propertyName: 'Athens Central Loft',
    riskScore: 15, status: 'APPROVED', previousStays: 2, cancellationRate: 0, avgRating: 4.8,
    totalSpent: 3800, idVerification: 'VERIFIED', notes: 'Returning guest, always punctual.',
    socialLinks: [{ platform: 'LinkedIn', url: '#' }],
    screenedAt: '2026-04-10T10:00:00Z', screenedBy: 'Yael K.',
  },
  {
    id: 'sg-008', name: 'Elena Petrova', email: 'elena.p@yandex.ru', phone: '+7 903 678 9012',
    nationality: 'Russia', nationalityFlag: '\u{1F1F7}\u{1F1FA}', bookingRef: 'BK-2026-0419',
    source: 'Direct', checkIn: '2026-05-10', checkOut: '2026-05-24', propertyName: 'Mykonos Beach House',
    riskScore: 85, status: 'BLOCKED', previousStays: 1, cancellationRate: 100, avgRating: 2.0,
    totalSpent: 0, idVerification: 'FAILED', notes: 'Previous property damage reported. ID verification failed.',
    socialLinks: [], screenedAt: '2026-04-11T08:45:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-009', name: 'Li Wei Chen', email: 'liwei.chen@qq.com', phone: '+86 138 0013 8000',
    nationality: 'China', nationalityFlag: '\u{1F1E8}\u{1F1F3}', bookingRef: 'BK-2026-0420',
    source: 'Expedia', checkIn: '2026-05-02', checkOut: '2026-05-08', propertyName: 'Crete Harbor Suite',
    riskScore: 38, status: 'PENDING', previousStays: 0, cancellationRate: 0, avgRating: 0,
    totalSpent: 0, idVerification: 'PENDING', notes: 'New guest, high-value property booking.',
    socialLinks: [{ platform: 'WeChat', url: '#' }], screenedAt: undefined, screenedBy: undefined,
  },
  {
    id: 'sg-010', name: 'Anna Schmidt', email: 'anna.s@web.de', phone: '+49 176 234 5678',
    nationality: 'Germany', nationalityFlag: '\u{1F1E9}\u{1F1EA}', bookingRef: 'BK-2026-0421',
    source: 'Booking.com', checkIn: '2026-04-19', checkOut: '2026-04-23', propertyName: 'Rhodes Old Town Apt',
    riskScore: 62, status: 'FLAGGED', previousStays: 1, cancellationRate: 50, avgRating: 3.2,
    totalSpent: 1350, idVerification: 'VERIFIED', notes: 'Low rating from last stay. Noise complaint.',
    socialLinks: [{ platform: 'Facebook', url: '#' }],
    screenedAt: '2026-04-10T17:30:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-011', name: 'Carlos Mendez', email: 'carlos.m@proton.me', phone: '+34 612 345 678',
    nationality: 'Spain', nationalityFlag: '\u{1F1EA}\u{1F1F8}', bookingRef: 'BK-2026-0422',
    source: 'Airbnb', checkIn: '2026-05-05', checkOut: '2026-05-12', propertyName: 'Santorini Sunset Villa',
    riskScore: 18, status: 'APPROVED', previousStays: 4, cancellationRate: 5, avgRating: 4.6,
    totalSpent: 6200, idVerification: 'VERIFIED', notes: 'Long-time customer.',
    socialLinks: [{ platform: 'Instagram', url: '#' }],
    screenedAt: '2026-04-09T15:00:00Z', screenedBy: 'Yael K.',
  },
  {
    id: 'sg-012', name: 'Yuki Tanaka', email: 'y.tanaka@icloud.com', phone: '+81 90 1234 5678',
    nationality: 'Japan', nationalityFlag: '\u{1F1EF}\u{1F1F5}', bookingRef: 'BK-2026-0423',
    source: 'Direct', checkIn: '2026-05-08', checkOut: '2026-05-15', propertyName: 'Athens Central Loft',
    riskScore: 10, status: 'APPROVED', previousStays: 2, cancellationRate: 0, avgRating: 5.0,
    totalSpent: 4100, idVerification: 'VERIFIED', notes: 'Perfect guest record.',
    socialLinks: [], screenedAt: '2026-04-10T12:00:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-013', name: 'Ahmed Hassan', email: 'ahmed.h@outlook.com', phone: '+20 100 234 5678',
    nationality: 'Egypt', nationalityFlag: '\u{1F1EA}\u{1F1EC}', bookingRef: 'BK-2026-0424',
    source: 'Booking.com', checkIn: '2026-05-12', checkOut: '2026-05-18', propertyName: 'Mykonos Beach House',
    riskScore: 42, status: 'PENDING', previousStays: 0, cancellationRate: 0, avgRating: 0,
    totalSpent: 0, idVerification: 'NOT_SUBMITTED', notes: 'First-time guest, ID not yet submitted.',
    socialLinks: [], screenedAt: undefined, screenedBy: undefined,
  },
  {
    id: 'sg-014', name: 'Eva Johansson', email: 'eva.j@gmail.com', phone: '+46 70 123 4567',
    nationality: 'Sweden', nationalityFlag: '\u{1F1F8}\u{1F1EA}', bookingRef: 'BK-2026-0425',
    source: 'VRBO', checkIn: '2026-05-15', checkOut: '2026-05-22', propertyName: 'Crete Harbor Suite',
    riskScore: 5, status: 'APPROVED', previousStays: 6, cancellationRate: 0, avgRating: 4.9,
    totalSpent: 11200, idVerification: 'VERIFIED', notes: 'VIP repeat guest.',
    socialLinks: [{ platform: 'LinkedIn', url: '#' }, { platform: 'Instagram', url: '#' }],
    screenedAt: '2026-04-08T09:00:00Z', screenedBy: 'Sivan M.',
  },
  {
    id: 'sg-015', name: 'Pavel Novak', email: 'p.novak@seznam.cz', phone: '+420 777 123 456',
    nationality: 'Czech Republic', nationalityFlag: '\u{1F1E8}\u{1F1FF}', bookingRef: 'BK-2026-0426',
    source: 'Expedia', checkIn: '2026-04-26', checkOut: '2026-05-01', propertyName: 'Rhodes Old Town Apt',
    riskScore: 68, status: 'FLAGGED', previousStays: 1, cancellationRate: 100, avgRating: 2.5,
    totalSpent: 850, idVerification: 'PENDING', notes: 'Cancelled previous booking last-minute. Low rating.',
    socialLinks: [], screenedAt: '2026-04-11T14:15:00Z', screenedBy: 'Yael K.',
  },
  {
    id: 'sg-016', name: 'Isabella Garcia', email: 'isa.garcia@gmail.com', phone: '+54 11 5555 6789',
    nationality: 'Argentina', nationalityFlag: '\u{1F1E6}\u{1F1F7}', bookingRef: 'BK-2026-0427',
    source: 'Airbnb', checkIn: '2026-05-20', checkOut: '2026-05-27', propertyName: 'Santorini Sunset Villa',
    riskScore: 28, status: 'PENDING', previousStays: 1, cancellationRate: 0, avgRating: 4.2,
    totalSpent: 1600, idVerification: 'VERIFIED', notes: 'One previous stay, positive review.',
    socialLinks: [{ platform: 'Instagram', url: '#' }], screenedAt: undefined, screenedBy: undefined,
  },
];

const mockBlacklist: BlacklistEntry[] = [
  { id: 'bl-001', guestName: 'Elena Petrova', email: 'elena.p@yandex.ru', reason: 'Property damage during previous stay. Refused to pay for damages.', blockedAt: '2026-04-11T08:45:00Z', blockedBy: 'Sivan M.' },
  { id: 'bl-002', guestName: 'Boris Kuznetsov', email: 'boris.k@mail.ru', reason: 'Violent behavior toward cleaning staff. Police report filed.', blockedAt: '2026-03-15T10:30:00Z', blockedBy: 'Sivan M.' },
  { id: 'bl-003', guestName: 'John Doe', email: 'jdoe_fake@temp.com', reason: 'Fraudulent identity documents submitted.', blockedAt: '2026-02-28T14:00:00Z', blockedBy: 'Yael K.' },
  { id: 'bl-004', guestName: 'Lisa Park', email: 'lisa.park@fakeid.net', reason: 'Multiple chargebacks after stays. Suspected fraud.', blockedAt: '2026-01-20T09:15:00Z', blockedBy: 'Sivan M.' },
];

const mockRules: ScreeningRule[] = [
  { id: 'rule-001', name: 'High cancellation rate', description: 'Flag guests with cancellation rate above 50%', condition: 'cancellationRate > 50', action: 'FLAG', enabled: true },
  { id: 'rule-002', name: 'Block repeat offenders', description: 'Block guests with more than 3 cancellations', condition: 'cancellations > 3', action: 'BLOCK', enabled: true },
  { id: 'rule-003', name: 'First-time high-value', description: 'Flag first-time guests booking properties over 200/night', condition: 'previousStays == 0 && nightlyRate > 200', action: 'FLAG', enabled: true },
  { id: 'rule-004', name: 'No ID verification', description: 'Flag guests who have not submitted ID within 48h of booking', condition: 'idVerification == NOT_SUBMITTED && hoursAfterBooking > 48', action: 'FLAG', enabled: false },
  { id: 'rule-005', name: 'Long stay newcomer', description: 'Flag first-time guests requesting stays longer than 10 nights', condition: 'previousStays == 0 && stayLength > 10', action: 'FLAG', enabled: true },
  { id: 'rule-006', name: 'Low rating block', description: 'Block guests with average rating below 2.5', condition: 'avgRating < 2.5 && avgRating > 0', action: 'BLOCK', enabled: false },
];

const mockHistory: HistoryEntry[] = [
  { id: 'h-001', guestName: 'Elena Petrova', action: 'BLOCKED', reviewer: 'Sivan M.', timestamp: '2026-04-11T08:45:00Z', notes: 'Property damage reported. ID verification failed.' },
  { id: 'h-002', guestName: 'Dmitry Volkov', action: 'FLAGGED', reviewer: 'Yael K.', timestamp: '2026-04-11T16:00:00Z', notes: 'No history, long stay, no ID.' },
  { id: 'h-003', guestName: 'Anna Schmidt', action: 'FLAGGED', reviewer: 'Sivan M.', timestamp: '2026-04-10T17:30:00Z', notes: 'Noise complaint from previous stay.' },
  { id: 'h-004', guestName: 'Pavel Novak', action: 'FLAGGED', reviewer: 'Yael K.', timestamp: '2026-04-11T14:15:00Z', notes: 'Last-minute cancellation history.' },
  { id: 'h-005', guestName: 'Maria Papadopoulos', action: 'APPROVED', reviewer: 'Sivan M.', timestamp: '2026-04-10T14:30:00Z', notes: 'Repeat guest, excellent reviews.' },
  { id: 'h-006', guestName: 'Sophie Laurent', action: 'APPROVED', reviewer: 'Sivan M.', timestamp: '2026-04-09T09:15:00Z', notes: 'Loyal direct booker.' },
  { id: 'h-007', guestName: 'James Thompson', action: 'APPROVED', reviewer: 'Sivan M.', timestamp: '2026-04-08T11:20:00Z', notes: 'Good track record.' },
  { id: 'h-008', guestName: 'Marco Rossi', action: 'APPROVED', reviewer: 'Yael K.', timestamp: '2026-04-10T10:00:00Z', notes: 'Returning guest.' },
  { id: 'h-009', guestName: 'Carlos Mendez', action: 'APPROVED', reviewer: 'Yael K.', timestamp: '2026-04-09T15:00:00Z', notes: 'Long-time customer.' },
  { id: 'h-010', guestName: 'Yuki Tanaka', action: 'APPROVED', reviewer: 'Sivan M.', timestamp: '2026-04-10T12:00:00Z', notes: 'Perfect guest record.' },
  { id: 'h-011', guestName: 'Eva Johansson', action: 'APPROVED', reviewer: 'Sivan M.', timestamp: '2026-04-08T09:00:00Z', notes: 'VIP repeat guest.' },
  { id: 'h-012', guestName: 'Boris Kuznetsov', action: 'BLOCKED', reviewer: 'Sivan M.', timestamp: '2026-03-15T10:30:00Z', notes: 'Violent behavior. Police report filed.' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function riskColor(score: number): string {
  if (score < 30) return 'text-success';
  if (score <= 60) return 'text-warning';
  return 'text-error';
}

function riskBg(score: number): string {
  if (score < 30) return 'bg-success/10';
  if (score <= 60) return 'bg-warning/10';
  return 'bg-error/10';
}

function riskBarColor(score: number): string {
  if (score < 30) return '#2e7d32';
  if (score <= 60) return '#ed6c02';
  return '#ba1a1a';
}

const statusConfig: Record<ScreeningStatus, { bg: string; text: string; icon: typeof Shield; label: string }> = {
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', icon: ShieldQuestion, label: 'Pending' },
  APPROVED: { bg: 'bg-success/10', text: 'text-success', icon: ShieldCheck, label: 'Approved' },
  FLAGGED: { bg: 'bg-warning/10', text: 'text-warning', icon: ShieldAlert, label: 'Flagged' },
  BLOCKED: { bg: 'bg-error/10', text: 'text-error', icon: ShieldX, label: 'Blocked' },
};

const idVerifConfig: Record<IdVerification, { bg: string; text: string; label: string }> = {
  VERIFIED: { bg: 'bg-success/10', text: 'text-success', label: 'Verified' },
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
  FAILED: { bg: 'bg-error/10', text: 'text-error', label: 'Failed' },
  NOT_SUBMITTED: { bg: 'bg-outline-variant/20', text: 'text-on-surface-variant', label: 'Not Submitted' },
};

const sourceColors: Record<BookingSource, string> = {
  Airbnb: 'bg-[#FF5A5F]/10 text-[#FF5A5F]',
  'Booking.com': 'bg-[#003580]/10 text-[#003580]',
  Direct: 'bg-secondary/10 text-secondary',
  VRBO: 'bg-[#3B5998]/10 text-[#3B5998]',
  Expedia: 'bg-[#FBAF00]/10 text-[#FBAF00]',
};

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuestScreeningPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ── API Queries ────────────────────────────────────────────────────────
  const { data: screeningData } = useQuery<{
    guests: ScreeningGuest[];
    blacklist: BlacklistEntry[];
    rules: ScreeningRule[];
    history: HistoryEntry[];
  }>({
    queryKey: ['guests', 'screening', 'rules'],
    queryFn: async () => {
      const res = await apiClient.get('/guests/screening/rules');
      return res.data.data ?? res.data ?? { guests: [], blacklist: [], rules: [], history: [] };
    },
  });

  const updateRulesMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.put('/guests/screening/rules', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', 'screening', 'rules'] });
    },
    onError: () => toast.error('Failed to update screening rules'),
  });

  const guests = screeningData?.guests ?? mockGuests;
  const blacklist = screeningData?.blacklist ?? mockBlacklist;
  const rules = screeningData?.rules ?? mockRules;
  const history = screeningData?.history ?? mockHistory;

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<BookingSource | 'ALL'>('ALL');
  const [historyFilter, setHistoryFilter] = useState<ScreeningStatus | 'ALL'>('ALL');

  // Derived
  const selectedGuest = useMemo(() => guests.find((g) => g.id === selectedGuestId) || null, [guests, selectedGuestId]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !g.email.toLowerCase().includes(q) && !g.bookingRef.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
      if (sourceFilter !== 'ALL' && g.source !== sourceFilter) return false;
      return true;
    });
  }, [guests, searchQuery, statusFilter, sourceFilter]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'ALL') return history;
    return history.filter((h) => h.action === historyFilter);
  }, [history, historyFilter]);

  // Risk distribution for chart
  const riskDistribution = useMemo(() => {
    const buckets = [
      { range: '0-10', count: 0, color: '#2e7d32' },
      { range: '11-20', count: 0, color: '#2e7d32' },
      { range: '21-30', count: 0, color: '#4caf50' },
      { range: '31-40', count: 0, color: '#ed6c02' },
      { range: '41-50', count: 0, color: '#ed6c02' },
      { range: '51-60', count: 0, color: '#f57c00' },
      { range: '61-70', count: 0, color: '#ba1a1a' },
      { range: '71-80', count: 0, color: '#ba1a1a' },
      { range: '81-90', count: 0, color: '#d32f2f' },
      { range: '91-100', count: 0, color: '#d32f2f' },
    ];
    guests.forEach((g) => {
      const idx = Math.min(Math.floor(g.riskScore / 10), 9);
      buckets[idx].count++;
    });
    return buckets;
  }, [guests]);

  // Summary stats
  const stats = useMemo(() => {
    const total = guests.length;
    const avgRisk = total > 0 ? Math.round(guests.reduce((s, g) => s + g.riskScore, 0) / total) : 0;
    const flagged = guests.filter((g) => g.status === 'FLAGGED').length;
    const blocked = guests.filter((g) => g.status === 'BLOCKED').length;
    const pending = guests.filter((g) => g.status === 'PENDING').length;
    return { total, avgRisk, flagged, blocked, pending };
  }, [guests]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const guestActionMutation = useMutation({
    mutationFn: async ({ guestId, action }: { guestId: string; action: ScreeningStatus }) => {
      const res = await apiClient.put(`/guests/screening/${guestId}/action`, { action });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', 'screening', 'rules'] });
      toast.success('Guest screening status updated');
    },
    onError: () => toast.error('Failed to update guest status'),
  });

  const unblockMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const res = await apiClient.delete(`/guests/screening/blacklist/${entryId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', 'screening', 'rules'] });
      toast.success('Guest unblocked');
    },
    onError: () => toast.error('Failed to unblock guest'),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const rule = rules.find((r) => r.id === ruleId);
      const res = await apiClient.put(`/guests/screening/rules/${ruleId}`, { enabled: !rule?.enabled });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', 'screening', 'rules'] });
      toast.success('Rule updated');
    },
    onError: () => toast.error('Failed to toggle rule'),
  });

  // Actions
  const handleAction = useCallback((guestId: string, action: ScreeningStatus) => {
    guestActionMutation.mutate({ guestId, action });
  }, [guestActionMutation]);

  const handleUnblock = useCallback((entryId: string) => {
    unblockMutation.mutate(entryId);
  }, [unblockMutation]);

  const handleToggleRule = useCallback((ruleId: string) => {
    toggleRuleMutation.mutate(ruleId);
  }, [toggleRuleMutation]);

  // Tab definitions
  const tabs: { key: TabKey; label: string; icon: typeof Shield; count?: number }[] = [
    { key: 'queue', label: 'Screening Queue', icon: Shield, count: stats.pending },
    { key: 'blacklist', label: 'Blacklist', icon: ShieldX, count: blacklist.length },
    { key: 'rules', label: 'Auto-Screening Rules', icon: Settings2 },
    { key: 'history', label: 'History', icon: History },
  ];

  const inputClass = 'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Security
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Guest Screening
          </h1>
        </div>
      </div>

      {/* ── Risk Score Overview Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Screened', value: stats.total, icon: Users, iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
          { label: 'Average Risk', value: stats.avgRisk, icon: TrendingUp, iconBg: riskBg(stats.avgRisk), iconColor: riskColor(stats.avgRisk), suffix: '/100' },
          { label: 'Flagged Guests', value: stats.flagged, icon: ShieldAlert, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
          { label: 'Blocked Guests', value: stats.blocked, icon: ShieldX, iconBg: 'bg-error/10', iconColor: 'text-error' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-1">{card.label}</p>
              <p className="text-2xl font-headline font-bold text-on-surface">
                {card.value}<span className="text-sm font-normal text-on-surface-variant">{card.suffix || ''}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Risk Score Distribution Chart ──────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h2 className="font-headline font-semibold text-on-surface mb-4">Risk Score Distribution</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskDistribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#46464c', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#46464c', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e7e8e9', borderRadius: '0.5rem', fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Guests">
                {riskDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === tab.key
                  ? 'bg-surface-container-lowest ambient-shadow text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50'
                }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  tab.key === 'blacklist' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by name, email, or booking ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ScreeningStatus | 'ALL')} className={inputClass}>
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FLAGGED">Flagged</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as BookingSource | 'ALL')} className={inputClass}>
              <option value="ALL">All Sources</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Booking.com">Booking.com</option>
              <option value="Direct">Direct</option>
              <option value="VRBO">VRBO</option>
              <option value="Expedia">Expedia</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Guest</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden md:table-cell">Contact</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden lg:table-cell">Booking</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Source</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Check-in</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Risk</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Status</th>
                    <th className="text-end px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Shield className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-3" />
                        <p className="text-on-surface-variant text-sm">No guests match your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest) => {
                      const sc = statusConfig[guest.status];
                      const StatusIcon = sc.icon;
                      return (
                        <tr
                          key={guest.id}
                          onClick={() => setSelectedGuestId(guest.id)}
                          className={`border-b border-outline-variant/10 hover:bg-surface-container-low/50 cursor-pointer transition-colors ${
                            selectedGuestId === guest.id ? 'bg-secondary/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {guest.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-on-surface truncate">{guest.name}</p>
                                <p className="text-xs text-on-surface-variant">{guest.nationalityFlag} {guest.nationality}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[160px]">{guest.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                <Phone className="w-3 h-3 flex-shrink-0" /><span>{guest.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-xs font-mono text-on-surface-variant">{guest.bookingRef}</p>
                            <p className="text-xs text-on-surface-variant truncate max-w-[140px]">{guest.propertyName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sourceColors[guest.source]}`}>
                              {guest.source}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-on-surface">{formatDate(guest.checkIn)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${riskBg(guest.riskScore)} ${riskColor(guest.riskScore)}`}>
                                {guest.riskScore}
                              </span>
                              <div className="hidden xl:block w-16 h-1.5 rounded-full bg-outline-variant/20 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${guest.riskScore}%`, backgroundColor: riskBarColor(guest.riskScore) }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {guest.status !== 'APPROVED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(guest.id, 'APPROVED'); }}
                                  title="Approve"
                                  className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {guest.status !== 'FLAGGED' && guest.status !== 'BLOCKED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(guest.id, 'FLAGGED'); }}
                                  title="Flag"
                                  className="p-1.5 rounded-lg text-warning hover:bg-warning/10 transition-colors"
                                >
                                  <Flag className="w-4 h-4" />
                                </button>
                              )}
                              {guest.status !== 'BLOCKED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(guest.id, 'BLOCKED'); }}
                                  title="Block"
                                  className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedGuestId(guest.id); }}
                                title="View Details"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BLACKLIST TAB */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            {blacklist.length === 0 ? (
              <div className="text-center py-16">
                <ShieldCheck className="w-12 h-12 mx-auto text-success/40 mb-4" />
                <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">Blacklist is Empty</h3>
                <p className="text-sm text-on-surface-variant">No guests are currently blocked.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20">
                      <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Guest</th>
                      <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Reason</th>
                      <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden md:table-cell">Blocked</th>
                      <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden md:table-cell">By</th>
                      <th className="text-end px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklist.map((entry) => (
                      <tr key={entry.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error flex-shrink-0">
                              <ShieldX className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-on-surface">{entry.guestName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-on-surface-variant text-xs">{entry.email}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-on-surface-variant max-w-xs truncate">{entry.reason}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-on-surface-variant">{formatDate(entry.blockedAt)}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-on-surface-variant">{entry.blockedBy}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleUnblock(entry.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Unblock
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">Configure automatic screening rules that apply to all incoming bookings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className={`bg-surface-container-lowest rounded-xl p-5 ambient-shadow transition-all ${!rule.enabled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      rule.action === 'BLOCK' ? 'bg-error/10' : 'bg-warning/10'
                    }`}>
                      {rule.action === 'BLOCK' ? (
                        <ShieldX className="w-4.5 h-4.5 text-error" />
                      ) : (
                        <ShieldAlert className="w-4.5 h-4.5 text-warning" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-on-surface text-sm">{rule.name}</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        rule.action === 'BLOCK' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                      }`}>
                        {rule.action}
                      </span>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      rule.enabled ? 'bg-secondary' : 'bg-outline-variant/40'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      rule.enabled ? 'end-0.5' : 'start-0.5'
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">{rule.description}</p>
                <div className="px-2 py-1.5 rounded bg-surface-container-low">
                  <code className="text-[10px] font-mono text-on-surface-variant">{rule.condition}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value as ScreeningStatus | 'ALL')} className={inputClass}>
              <option value="ALL">All Decisions</option>
              <option value="APPROVED">Approved</option>
              <option value="FLAGGED">Flagged</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Guest</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Decision</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden sm:table-cell">Reviewer</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Timestamp</th>
                    <th className="text-start px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <History className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-3" />
                        <p className="text-on-surface-variant text-sm">No history entries found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((entry) => {
                      const sc = statusConfig[entry.action];
                      const ActionIcon = sc.icon;
                      return (
                        <tr key={entry.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-on-surface">{entry.guestName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                              <ActionIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-xs text-on-surface-variant">{entry.reviewer}</td>
                          <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDateTime(entry.timestamp)}</td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-on-surface-variant max-w-xs truncate">{entry.notes}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Guest Profile Sidebar (Slide-over) ────────────────────────────── */}
      {selectedGuest && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setSelectedGuestId(null)}
          />
          {/* Panel */}
          <div className="fixed top-0 end-0 h-full w-full max-w-md bg-surface z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-headline font-bold text-on-surface text-lg">Guest Profile</h2>
              <button
                onClick={() => setSelectedGuestId(null)}
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-xl flex-shrink-0">
                  {selectedGuest.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-headline font-bold text-on-surface text-lg">{selectedGuest.name}</h3>
                  <p className="text-sm text-on-surface-variant">{selectedGuest.nationalityFlag} {selectedGuest.nationality}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const sc = statusConfig[selectedGuest.status];
                      const SIcon = sc.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                          <SIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      );
                    })()}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${riskBg(selectedGuest.riskScore)} ${riskColor(selectedGuest.riskScore)}`}>
                      Risk: {selectedGuest.riskScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">Contact Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <span className="text-on-surface">{selectedGuest.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <span className="text-on-surface">{selectedGuest.phone}</span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">Current Booking</h4>
                <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Reference</span>
                    <span className="font-mono text-on-surface font-medium">{selectedGuest.bookingRef}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Property</span>
                    <span className="text-on-surface">{selectedGuest.propertyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Check-in</span>
                    <span className="text-on-surface">{formatDate(selectedGuest.checkIn)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Check-out</span>
                    <span className="text-on-surface">{formatDate(selectedGuest.checkOut)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Source</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sourceColors[selectedGuest.source]}`}>
                      {selectedGuest.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">Booking History</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Previous Stays</p>
                    <p className="text-xl font-headline font-bold text-on-surface">{selectedGuest.previousStays}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Cancel Rate</p>
                    <p className={`text-xl font-headline font-bold ${selectedGuest.cancellationRate > 30 ? 'text-error' : 'text-on-surface'}`}>
                      {selectedGuest.cancellationRate}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Avg Rating</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <p className="text-xl font-headline font-bold text-on-surface">{selectedGuest.avgRating > 0 ? selectedGuest.avgRating.toFixed(1) : '-'}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Total Spent</p>
                    <p className="text-xl font-headline font-bold text-on-surface">{'\u20AC'}{selectedGuest.totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* ID Verification */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">ID Verification</h4>
                {(() => {
                  const idv = idVerifConfig[selectedGuest.idVerification];
                  return (
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${idv.bg}`}>
                      <BadgeCheck className={`w-5 h-5 ${idv.text}`} />
                      <div>
                        <p className={`text-sm font-semibold ${idv.text}`}>{idv.label}</p>
                        <p className="text-xs text-on-surface-variant">
                          {selectedGuest.idVerification === 'VERIFIED' && 'Government ID verified successfully.'}
                          {selectedGuest.idVerification === 'PENDING' && 'Awaiting document submission or review.'}
                          {selectedGuest.idVerification === 'FAILED' && 'ID verification failed. Manual review required.'}
                          {selectedGuest.idVerification === 'NOT_SUBMITTED' && 'Guest has not submitted identification.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Screening Notes */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">Screening Notes</h4>
                <div className="p-4 rounded-xl bg-surface-container-low">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-on-surface">{selectedGuest.notes || 'No notes.'}</p>
                  </div>
                  {selectedGuest.screenedBy && (
                    <p className="text-[10px] text-on-surface-variant mt-2">
                      Screened by {selectedGuest.screenedBy} on {formatDateTime(selectedGuest.screenedAt || '')}
                    </p>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {selectedGuest.socialLinks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGuest.socialLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-2">
                {selectedGuest.status !== 'APPROVED' && (
                  <button
                    onClick={() => { handleAction(selectedGuest.id, 'APPROVED'); setSelectedGuestId(null); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-success hover:bg-success/90 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Guest
                  </button>
                )}
                {selectedGuest.status !== 'FLAGGED' && selectedGuest.status !== 'BLOCKED' && (
                  <button
                    onClick={() => { handleAction(selectedGuest.id, 'FLAGGED'); setSelectedGuestId(null); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-warning border border-warning/30 hover:bg-warning/10 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Flag for Review
                  </button>
                )}
                {selectedGuest.status !== 'BLOCKED' && (
                  <button
                    onClick={() => { handleAction(selectedGuest.id, 'BLOCKED'); setSelectedGuestId(null); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-error border border-error/30 hover:bg-error/10 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Block Guest
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
