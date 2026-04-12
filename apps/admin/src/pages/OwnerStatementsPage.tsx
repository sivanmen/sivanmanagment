import { useState, useRef, Fragment, useMemo } from 'react';
// import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Mail,
  Printer,
  BarChart3,
  Plus,
  Check,
  Send,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Building2,
  Eye,
  X,
  ArrowLeftRight,
  Clock,
  Search,
  ChevronLeft,
  Layers,
  CalendarRange,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────────

type StatementStatus = 'DRAFT' | 'APPROVED' | 'SENT';
type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface BookingEntry {
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  platform: string;
  grossAmount: number;
  managementFee: number;
  netAmount: number;
}

interface ExpenseEntry {
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  receipt?: string;
}

interface PayoutHistoryEntry {
  date: string;
  method: string;
  reference: string;
  amount: number;
}

interface StatementProperty {
  propertyId: string;
  propertyName: string;
  location: string;
  bookings: BookingEntry[];
  totalGrossIncome: number;
  totalManagementFees: number;
  totalNetBookingIncome: number;
  expenses: ExpenseEntry[];
  totalExpenses: number;
  netPropertyIncome: number;
}

interface Statement {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerCompany: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  periodType: PeriodType;
  properties: StatementProperty[];
  totalGrossIncome: number;
  totalExpenses: number;
  totalManagementFees: number;
  netPayout: number;
  currency: string;
  status: StatementStatus;
  generatedAt: string;
  sentAt?: string;
  payoutHistory: PayoutHistoryEntry[];
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const statusStyles: Record<StatementStatus, string> = {
  DRAFT: 'bg-outline-variant/20 text-on-surface-variant',
  APPROVED: 'bg-secondary/10 text-secondary',
  SENT: 'bg-success/10 text-success',
};

const statusIcons: Record<StatementStatus, typeof FileText> = {
  DRAFT: FileText,
  APPROVED: Check,
  SENT: Send,
};

const platformColors: Record<string, string> = {
  'Airbnb': 'bg-[#FF5A5F]/10 text-[#FF5A5F]',
  'Booking.com': 'bg-[#003580]/10 text-[#003580] dark:text-[#4A90D9]',
  'VRBO': 'bg-[#3B5998]/10 text-[#3B5998] dark:text-[#6D8FCA]',
  'Direct': 'bg-secondary/10 text-secondary',
};

const expenseCategoryColors: Record<string, string> = {
  'Cleaning': 'bg-sky-500/10 text-sky-500',
  'Maintenance': 'bg-warning/10 text-warning',
  'Utilities': 'bg-emerald-500/10 text-emerald-500',
  'Supplies': 'bg-violet-500/10 text-violet-500',
  'Insurance': 'bg-error/10 text-error',
  'Taxes': 'bg-rose-500/10 text-rose-500',
  'Other': 'bg-outline-variant/20 text-on-surface-variant',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const demoOwners = [
  { id: 'owner-1', name: 'Dimitris Papadopoulos', email: 'dimitris@example.com', company: 'Papadopoulos Properties LLC' },
  { id: 'owner-2', name: 'Maria Konstantinou', email: 'maria.k@example.com', company: 'MK Real Estate' },
  { id: 'owner-3', name: 'Yannis Alexiou', email: 'yannis.a@example.com', company: 'Alexiou Investments' },
  { id: 'owner-4', name: 'Elena Georgiou', email: 'elena.g@example.com', company: 'Georgiou Hospitality' },
];

const demoProperties = [
  { id: 'prop-1', name: 'Santorini Sunset Villa', ownerId: 'owner-1', location: 'Oia, Santorini' },
  { id: 'prop-2', name: 'Athens Central Loft', ownerId: 'owner-1', location: 'Plaka, Athens' },
  { id: 'prop-3', name: 'Mykonos Beach House', ownerId: 'owner-2', location: 'Ornos, Mykonos' },
  { id: 'prop-4', name: 'Crete Harbor Suite', ownerId: 'owner-2', location: 'Chania, Crete' },
  { id: 'prop-5', name: 'Rhodes Old Town Apt', ownerId: 'owner-3', location: 'Old Town, Rhodes' },
  { id: 'prop-6', name: 'Paros Seaside Cottage', ownerId: 'owner-3', location: 'Naoussa, Paros' },
  { id: 'prop-7', name: 'Corfu Olive Grove Villa', ownerId: 'owner-4', location: 'Kassiopi, Corfu' },
  { id: 'prop-8', name: 'Naxos Mountain Retreat', ownerId: 'owner-4', location: 'Halki, Naxos' },
];

function buildDemoStatements(): Statement[] {
  return [
    {
      id: 'stmt-1',
      ownerId: 'owner-1',
      ownerName: 'Dimitris Papadopoulos',
      ownerEmail: 'dimitris@example.com',
      ownerCompany: 'Papadopoulos Properties LLC',
      periodLabel: 'March 2026',
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      periodType: 'monthly',
      properties: [
        {
          propertyId: 'prop-1',
          propertyName: 'Santorini Sunset Villa',
          location: 'Oia, Santorini',
          bookings: [
            { guestName: 'Marcus Lindqvist', checkIn: '2026-03-01', checkOut: '2026-03-08', nights: 7, platform: 'Airbnb', grossAmount: 1960, managementFee: 196, netAmount: 1764 },
            { guestName: 'Sophie Dubois', checkIn: '2026-03-14', checkOut: '2026-03-21', nights: 7, platform: 'Booking.com', grossAmount: 1820, managementFee: 182, netAmount: 1638 },
            { guestName: 'Tomoko Nakamura', checkIn: '2026-03-24', checkOut: '2026-03-30', nights: 6, platform: 'Direct', grossAmount: 1500, managementFee: 150, netAmount: 1350 },
          ],
          totalGrossIncome: 5280,
          totalManagementFees: 528,
          totalNetBookingIncome: 4752,
          expenses: [
            { date: '2026-03-02', category: 'Cleaning', description: 'Post-checkout deep clean', vendor: 'SparkClean Santorini', amount: 95 },
            { date: '2026-03-09', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'SparkClean Santorini', amount: 85 },
            { date: '2026-03-15', category: 'Maintenance', description: 'Hot water heater repair', vendor: 'Nikos Plumbing', amount: 220 },
            { date: '2026-03-22', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'SparkClean Santorini', amount: 85 },
            { date: '2026-03-25', category: 'Utilities', description: 'Electricity March', vendor: 'HEDNO S.A.', amount: 145 },
            { date: '2026-03-28', category: 'Supplies', description: 'Toiletries & amenities restock', vendor: 'Hotel Supply GR', amount: 62 },
          ],
          totalExpenses: 692,
          netPropertyIncome: 4060,
        },
        {
          propertyId: 'prop-2',
          propertyName: 'Athens Central Loft',
          location: 'Plaka, Athens',
          bookings: [
            { guestName: 'James Richardson', checkIn: '2026-03-05', checkOut: '2026-03-12', nights: 7, platform: 'VRBO', grossAmount: 980, managementFee: 98, netAmount: 882 },
            { guestName: 'Luisa Fernandez', checkIn: '2026-03-18', checkOut: '2026-03-23', nights: 5, platform: 'Airbnb', grossAmount: 650, managementFee: 65, netAmount: 585 },
          ],
          totalGrossIncome: 1630,
          totalManagementFees: 400,
          totalNetBookingIncome: 1230,
          expenses: [
            { date: '2026-03-06', category: 'Cleaning', description: 'Standard cleaning', vendor: 'Athens Clean Co', amount: 65 },
            { date: '2026-03-13', category: 'Cleaning', description: 'Deep clean + laundry', vendor: 'Athens Clean Co', amount: 120 },
            { date: '2026-03-20', category: 'Maintenance', description: 'Plumbing repair - bathroom', vendor: 'Quick Fix Athens', amount: 85 },
            { date: '2026-03-28', category: 'Utilities', description: 'Water bill Q1', vendor: 'EYDAP S.A.', amount: 48 },
          ],
          totalExpenses: 318,
          netPropertyIncome: 912,
        },
      ],
      totalGrossIncome: 6910,
      totalExpenses: 1010,
      totalManagementFees: 928,
      netPayout: 4972,
      currency: 'EUR',
      status: 'SENT',
      generatedAt: '2026-04-02',
      sentAt: '2026-04-03',
      payoutHistory: [
        { date: '2026-04-05', method: 'Bank Transfer', reference: 'TXN-2026-0405-DP', amount: 4972 },
        { date: '2026-03-05', method: 'Bank Transfer', reference: 'TXN-2026-0305-DP', amount: 4150 },
        { date: '2026-02-04', method: 'Bank Transfer', reference: 'TXN-2026-0204-DP', amount: 3820 },
      ],
    },
    {
      id: 'stmt-2',
      ownerId: 'owner-2',
      ownerName: 'Maria Konstantinou',
      ownerEmail: 'maria.k@example.com',
      ownerCompany: 'MK Real Estate',
      periodLabel: 'March 2026',
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      periodType: 'monthly',
      properties: [
        {
          propertyId: 'prop-3',
          propertyName: 'Mykonos Beach House',
          location: 'Ornos, Mykonos',
          bookings: [
            { guestName: 'Hans Weber', checkIn: '2026-03-10', checkOut: '2026-03-17', nights: 7, platform: 'Airbnb', grossAmount: 2100, managementFee: 315, netAmount: 1785 },
            { guestName: 'Anna Kowalski', checkIn: '2026-03-20', checkOut: '2026-03-27', nights: 7, platform: 'Booking.com', grossAmount: 2100, managementFee: 315, netAmount: 1785 },
          ],
          totalGrossIncome: 4200,
          totalManagementFees: 630,
          totalNetBookingIncome: 3570,
          expenses: [
            { date: '2026-03-11', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'Mykonos Cleaners', amount: 110 },
            { date: '2026-03-18', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'Mykonos Cleaners', amount: 110 },
            { date: '2026-03-20', category: 'Supplies', description: 'Guest amenities restock', vendor: 'Hotel Supply GR', amount: 75 },
            { date: '2026-03-25', category: 'Maintenance', description: 'Pool filter replacement', vendor: 'Pool Masters GR', amount: 340 },
          ],
          totalExpenses: 635,
          netPropertyIncome: 2935,
        },
        {
          propertyId: 'prop-4',
          propertyName: 'Crete Harbor Suite',
          location: 'Chania, Crete',
          bookings: [
            { guestName: 'Pierre Laurent', checkIn: '2026-03-03', checkOut: '2026-03-10', nights: 7, platform: 'Direct', grossAmount: 1120, managementFee: 168, netAmount: 952 },
          ],
          totalGrossIncome: 1120,
          totalManagementFees: 168,
          totalNetBookingIncome: 952,
          expenses: [
            { date: '2026-03-05', category: 'Cleaning', description: 'Standard cleaning', vendor: 'Crete Clean', amount: 70 },
            { date: '2026-03-15', category: 'Utilities', description: 'Electricity March', vendor: 'HEDNO S.A.', amount: 88 },
          ],
          totalExpenses: 158,
          netPropertyIncome: 794,
        },
      ],
      totalGrossIncome: 5320,
      totalExpenses: 793,
      totalManagementFees: 798,
      netPayout: 3729,
      currency: 'EUR',
      status: 'APPROVED',
      generatedAt: '2026-04-03',
      payoutHistory: [
        { date: '2026-03-04', method: 'Bank Transfer', reference: 'TXN-2026-0304-MK', amount: 3280 },
        { date: '2026-02-05', method: 'Bank Transfer', reference: 'TXN-2026-0205-MK', amount: 2950 },
      ],
    },
    {
      id: 'stmt-3',
      ownerId: 'owner-3',
      ownerName: 'Yannis Alexiou',
      ownerEmail: 'yannis.a@example.com',
      ownerCompany: 'Alexiou Investments',
      periodLabel: 'March 2026',
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      periodType: 'monthly',
      properties: [
        {
          propertyId: 'prop-5',
          propertyName: 'Rhodes Old Town Apt',
          location: 'Old Town, Rhodes',
          bookings: [
            { guestName: 'Oliver Bennett', checkIn: '2026-03-08', checkOut: '2026-03-15', nights: 7, platform: 'Booking.com', grossAmount: 1050, managementFee: 157.50, netAmount: 892.50 },
            { guestName: 'Emma Johansson', checkIn: '2026-03-22', checkOut: '2026-03-28', nights: 6, platform: 'Airbnb', grossAmount: 840, managementFee: 126, netAmount: 714 },
          ],
          totalGrossIncome: 1890,
          totalManagementFees: 283.50,
          totalNetBookingIncome: 1606.50,
          expenses: [
            { date: '2026-03-09', category: 'Cleaning', description: 'Standard cleaning', vendor: 'Rhodes Clean Co', amount: 60 },
            { date: '2026-03-16', category: 'Cleaning', description: 'Deep clean', vendor: 'Rhodes Clean Co', amount: 80 },
            { date: '2026-03-20', category: 'Maintenance', description: 'AC unit servicing', vendor: 'Cool Air Services', amount: 150 },
          ],
          totalExpenses: 290,
          netPropertyIncome: 1316.50,
        },
        {
          propertyId: 'prop-6',
          propertyName: 'Paros Seaside Cottage',
          location: 'Naoussa, Paros',
          bookings: [
            { guestName: 'Clara Muller', checkIn: '2026-03-12', checkOut: '2026-03-19', nights: 7, platform: 'VRBO', grossAmount: 1260, managementFee: 189, netAmount: 1071 },
          ],
          totalGrossIncome: 1260,
          totalManagementFees: 189,
          totalNetBookingIncome: 1071,
          expenses: [
            { date: '2026-03-13', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'Island Cleaners', amount: 75 },
            { date: '2026-03-18', category: 'Supplies', description: 'Kitchen supplies', vendor: 'Metro Cash & Carry', amount: 45 },
          ],
          totalExpenses: 120,
          netPropertyIncome: 951,
        },
      ],
      totalGrossIncome: 3150,
      totalExpenses: 410,
      totalManagementFees: 472.50,
      netPayout: 2267.50,
      currency: 'EUR',
      status: 'DRAFT',
      generatedAt: '2026-04-05',
      payoutHistory: [
        { date: '2026-03-06', method: 'Bank Transfer', reference: 'TXN-2026-0306-YA', amount: 1950 },
      ],
    },
    {
      id: 'stmt-4',
      ownerId: 'owner-4',
      ownerName: 'Elena Georgiou',
      ownerEmail: 'elena.g@example.com',
      ownerCompany: 'Georgiou Hospitality',
      periodLabel: 'March 2026',
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      periodType: 'monthly',
      properties: [
        {
          propertyId: 'prop-7',
          propertyName: 'Corfu Olive Grove Villa',
          location: 'Kassiopi, Corfu',
          bookings: [
            { guestName: 'Michael O\'Brien', checkIn: '2026-03-05', checkOut: '2026-03-14', nights: 9, platform: 'Airbnb', grossAmount: 2700, managementFee: 324, netAmount: 2376 },
            { guestName: 'Isabella Rossi', checkIn: '2026-03-18', checkOut: '2026-03-25', nights: 7, platform: 'Direct', grossAmount: 1890, managementFee: 226.80, netAmount: 1663.20 },
          ],
          totalGrossIncome: 4590,
          totalManagementFees: 550.80,
          totalNetBookingIncome: 4039.20,
          expenses: [
            { date: '2026-03-06', category: 'Cleaning', description: 'Post-checkout deep clean', vendor: 'Corfu Cleaners', amount: 130 },
            { date: '2026-03-15', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'Corfu Cleaners', amount: 100 },
            { date: '2026-03-20', category: 'Maintenance', description: 'Garden maintenance', vendor: 'Green Corfu', amount: 200 },
            { date: '2026-03-25', category: 'Utilities', description: 'Electricity + Water', vendor: 'HEDNO/DEYA', amount: 175 },
            { date: '2026-03-28', category: 'Supplies', description: 'Pool chemicals', vendor: 'Pool Masters GR', amount: 90 },
          ],
          totalExpenses: 695,
          netPropertyIncome: 3344.20,
        },
      ],
      totalGrossIncome: 4590,
      totalExpenses: 695,
      totalManagementFees: 550.80,
      netPayout: 3344.20,
      currency: 'EUR',
      status: 'SENT',
      generatedAt: '2026-04-01',
      sentAt: '2026-04-02',
      payoutHistory: [
        { date: '2026-04-03', method: 'Bank Transfer', reference: 'TXN-2026-0403-EG', amount: 3344.20 },
        { date: '2026-03-03', method: 'Bank Transfer', reference: 'TXN-2026-0303-EG', amount: 2890 },
        { date: '2026-02-04', method: 'Bank Transfer', reference: 'TXN-2026-0204-EG', amount: 3100 },
      ],
    },
    // Historical statement for comparison
    {
      id: 'stmt-5',
      ownerId: 'owner-1',
      ownerName: 'Dimitris Papadopoulos',
      ownerEmail: 'dimitris@example.com',
      ownerCompany: 'Papadopoulos Properties LLC',
      periodLabel: 'February 2026',
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
      periodType: 'monthly',
      properties: [
        {
          propertyId: 'prop-1',
          propertyName: 'Santorini Sunset Villa',
          location: 'Oia, Santorini',
          bookings: [
            { guestName: 'Karl Becker', checkIn: '2026-02-05', checkOut: '2026-02-12', nights: 7, platform: 'Airbnb', grossAmount: 1680, managementFee: 168, netAmount: 1512 },
            { guestName: 'Emily Chen', checkIn: '2026-02-18', checkOut: '2026-02-24', nights: 6, platform: 'Booking.com', grossAmount: 1380, managementFee: 138, netAmount: 1242 },
          ],
          totalGrossIncome: 3060,
          totalManagementFees: 306,
          totalNetBookingIncome: 2754,
          expenses: [
            { date: '2026-02-06', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'SparkClean Santorini', amount: 85 },
            { date: '2026-02-13', category: 'Cleaning', description: 'Post-checkout cleaning', vendor: 'SparkClean Santorini', amount: 85 },
            { date: '2026-02-20', category: 'Utilities', description: 'Electricity Feb', vendor: 'HEDNO S.A.', amount: 130 },
          ],
          totalExpenses: 300,
          netPropertyIncome: 2454,
        },
        {
          propertyId: 'prop-2',
          propertyName: 'Athens Central Loft',
          location: 'Plaka, Athens',
          bookings: [
            { guestName: 'David Thompson', checkIn: '2026-02-10', checkOut: '2026-02-17', nights: 7, platform: 'VRBO', grossAmount: 910, managementFee: 91, netAmount: 819 },
          ],
          totalGrossIncome: 910,
          totalManagementFees: 400,
          totalNetBookingIncome: 510,
          expenses: [
            { date: '2026-02-11', category: 'Cleaning', description: 'Standard cleaning', vendor: 'Athens Clean Co', amount: 65 },
            { date: '2026-02-15', category: 'Utilities', description: 'Gas heating', vendor: 'EPA S.A.', amount: 72 },
          ],
          totalExpenses: 137,
          netPropertyIncome: 373,
        },
      ],
      totalGrossIncome: 3970,
      totalExpenses: 437,
      totalManagementFees: 706,
      netPayout: 2827,
      currency: 'EUR',
      status: 'SENT',
      generatedAt: '2026-03-02',
      sentAt: '2026-03-03',
      payoutHistory: [
        { date: '2026-03-05', method: 'Bank Transfer', reference: 'TXN-2026-0305-DP', amount: 2827 },
      ],
    },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatEur(amount: number): string {
  return `\u20AC${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pctChange(current: number, previous: number): { value: number; label: string; positive: boolean } {
  if (previous === 0) return { value: 0, label: 'N/A', positive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    label: `${change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(1)}%`,
    positive: change >= 0,
  };
}

// ─── Tab type ───────────────────────────────────────────────────────────────────

type ActiveTab = 'generator' | 'history' | 'comparison';

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function OwnerStatementsPage() {
  // const { t } = useTranslation();

  // Statement data
  const [statements, setStatements] = useState<Statement[]>(buildDemoStatements);

  // Active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

  // Generator controls
  const [genOwner, setGenOwner] = useState('all');
  const [genPeriodType, setGenPeriodType] = useState<PeriodType>('monthly');
  const [genMonth, setGenMonth] = useState('3');
  const [genQuarter, setGenQuarter] = useState('1');
  const [genYear, setGenYear] = useState('2026');
  const [genCustomStart, setGenCustomStart] = useState('2026-03-01');
  const [genCustomEnd, setGenCustomEnd] = useState('2026-03-31');
  const [genPropertyFilter, setGenPropertyFilter] = useState('all');

  // Preview
  const [previewStmt, setPreviewStmt] = useState<Statement | null>(null);

  // Comparison
  const [compareOwnerId, setCompareOwnerId] = useState('owner-1');
  const [comparePeriodA, setComparePeriodA] = useState('');
  const [comparePeriodB, setComparePeriodB] = useState('');

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | StatementStatus>('all');
  const [historyOwnerFilter, setHistoryOwnerFilter] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 8;

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  // ── Computed ──

  const totalNetPayout = statements.reduce((sum, s) => sum + s.netPayout, 0);
  const totalGrossIncome = statements.reduce((sum, s) => sum + s.totalGrossIncome, 0);
  const totalFees = statements.reduce((sum, s) => sum + s.totalManagementFees, 0);
  const totalExpenses = statements.reduce((sum, s) => sum + s.totalExpenses, 0);
  const draftCount = statements.filter((s) => s.status === 'DRAFT').length;
  const sentCount = statements.filter((s) => s.status === 'SENT').length;

  // Properties for selected owner in generator
  const ownerProperties = useMemo(() => {
    if (genOwner === 'all') return demoProperties;
    return demoProperties.filter((p) => p.ownerId === genOwner);
  }, [genOwner]);

  // Comparison data
  const ownerStatementsForCompare = useMemo(() => {
    return statements.filter((s) => s.ownerId === compareOwnerId);
  }, [statements, compareOwnerId]);

  const compareA = useMemo(() => statements.find((s) => s.id === comparePeriodA), [statements, comparePeriodA]);
  const compareB = useMemo(() => statements.find((s) => s.id === comparePeriodB), [statements, comparePeriodB]);

  // History filtered
  const filteredHistory = useMemo(() => {
    return statements.filter((s) => {
      if (historyStatusFilter !== 'all' && s.status !== historyStatusFilter) return false;
      if (historyOwnerFilter !== 'all' && s.ownerId !== historyOwnerFilter) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        if (
          !s.ownerName.toLowerCase().includes(q) &&
          !s.periodLabel.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [statements, historyStatusFilter, historyOwnerFilter, historySearch]);

  const historyTotalPages = Math.ceil(filteredHistory.length / historyPageSize);
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  );

  // ── Actions ──

  const handleGenerate = () => {
    const targetOwners = genOwner === 'all' ? demoOwners : demoOwners.filter((o) => o.id === genOwner);

    let periodLabel = '';
    let periodStart = '';
    let periodEnd = '';

    switch (genPeriodType) {
      case 'monthly':
        periodLabel = `${months[Number(genMonth) - 1]} ${genYear}`;
        periodStart = `${genYear}-${genMonth.padStart(2, '0')}-01`;
        periodEnd = `${genYear}-${genMonth.padStart(2, '0')}-${new Date(Number(genYear), Number(genMonth), 0).getDate()}`;
        break;
      case 'quarterly':
        const qStartMonth = (Number(genQuarter) - 1) * 3 + 1;
        periodLabel = `Q${genQuarter} ${genYear}`;
        periodStart = `${genYear}-${String(qStartMonth).padStart(2, '0')}-01`;
        periodEnd = `${genYear}-${String(qStartMonth + 2).padStart(2, '0')}-${new Date(Number(genYear), qStartMonth + 2, 0).getDate()}`;
        break;
      case 'yearly':
        periodLabel = genYear;
        periodStart = `${genYear}-01-01`;
        periodEnd = `${genYear}-12-31`;
        break;
      case 'custom':
        periodLabel = `${genCustomStart} to ${genCustomEnd}`;
        periodStart = genCustomStart;
        periodEnd = genCustomEnd;
        break;
    }

    const newStatements: Statement[] = targetOwners.map((owner) => {
      const props = demoProperties.filter((p) => p.ownerId === owner.id);
      const filteredProps = genPropertyFilter === 'all' ? props : props.filter((p) => p.id === genPropertyFilter);

      const stmtProperties: StatementProperty[] = filteredProps.map((prop) => ({
        propertyId: prop.id,
        propertyName: prop.name,
        location: prop.location,
        bookings: [
          {
            guestName: 'Demo Guest A',
            checkIn: periodStart,
            checkOut: `${periodStart.slice(0, 8)}08`,
            nights: 7,
            platform: 'Airbnb',
            grossAmount: 1400,
            managementFee: 140,
            netAmount: 1260,
          },
          {
            guestName: 'Demo Guest B',
            checkIn: `${periodStart.slice(0, 8)}15`,
            checkOut: `${periodStart.slice(0, 8)}22`,
            nights: 7,
            platform: 'Booking.com',
            grossAmount: 1260,
            managementFee: 126,
            netAmount: 1134,
          },
        ],
        totalGrossIncome: 2660,
        totalManagementFees: 266,
        totalNetBookingIncome: 2394,
        expenses: [
          { date: periodStart, category: 'Cleaning', description: 'Professional cleaning x2', vendor: 'Local Cleaners', amount: 160 },
          { date: periodStart, category: 'Utilities', description: 'Electricity + Water', vendor: 'HEDNO S.A.', amount: 130 },
        ],
        totalExpenses: 290,
        netPropertyIncome: 2104,
      }));

      const totalGross = stmtProperties.reduce((s, p) => s + p.totalGrossIncome, 0);
      const totalExp = stmtProperties.reduce((s, p) => s + p.totalExpenses, 0);
      const totalMgmt = stmtProperties.reduce((s, p) => s + p.totalManagementFees, 0);

      return {
        id: `stmt-${Date.now()}-${owner.id}`,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerCompany: owner.company,
        periodLabel,
        periodStart,
        periodEnd,
        periodType: genPeriodType,
        properties: stmtProperties,
        totalGrossIncome: totalGross,
        totalExpenses: totalExp,
        totalManagementFees: totalMgmt,
        netPayout: totalGross - totalExp - totalMgmt,
        currency: 'EUR',
        status: 'DRAFT' as StatementStatus,
        generatedAt: new Date().toISOString().split('T')[0],
        payoutHistory: [],
      };
    });

    setStatements((prev) => [...newStatements, ...prev]);
    toast.success(
      genOwner === 'all'
        ? `${newStatements.length} statements generated for all owners`
        : `Statement generated for ${targetOwners[0]?.name}`,
    );
  };

  const handleApprove = (id: string) => {
    setStatements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'APPROVED' as StatementStatus } : s)),
    );
    toast.success('Statement approved');
  };

  const handleSend = (id: string) => {
    const stmt = statements.find((s) => s.id === id);
    setStatements((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: 'SENT' as StatementStatus, sentAt: new Date().toISOString().split('T')[0] }
          : s,
      ),
    );
    toast.success(`Statement sent to ${stmt?.ownerEmail || 'owner'}`);
  };

  const handleDownloadPdf = (stmt: Statement) => {
    toast.success(`PDF download started: ${stmt.ownerName} - ${stmt.periodLabel}`);
  };

  const handleEmailOwner = (stmt: Statement) => {
    toast.success(`Email sent to ${stmt.ownerEmail}`);
  };

  const handlePrint = () => {
    toast.info('Opening print dialog...');
    window.print();
  };

  const handleBatchGenerate = () => {
    setGenOwner('all');
    handleGenerate();
  };

  // ── Render helpers ──

  const renderStatCard = (
    label: string,
    value: string,
    icon: typeof DollarSign,
    colorClass: string,
    subtitle?: string,
  ) => {
    const Icon = icon;
    return (
      <div className="bg-surface-container-lowest rounded-xl px-5 py-4 ambient-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>
          <div className={`w-7 h-7 rounded-lg ${colorClass} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="font-headline text-xl font-bold text-on-surface">{value}</p>
        {subtitle && <p className="text-[10px] text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
    );
  };

  // ── Tabs ──

  const tabs: { key: ActiveTab; label: string; icon: typeof FileText }[] = [
    { key: 'generator', label: 'Generate Statements', icon: Plus },
    { key: 'history', label: 'Statement History', icon: Clock },
    { key: 'comparison', label: 'Period Comparison', icon: ArrowLeftRight },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Finance
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Owner Statements
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Generate, preview, and distribute financial statements to property owners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('generator');
              handleBatchGenerate();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-all"
          >
            <Layers className="w-4 h-4" />
            Batch Generate
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Statement
          </button>
        </div>
      </div>

      {/* ─── KPI Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {renderStatCard('Gross Income', formatEur(totalGrossIncome), TrendingUp, 'bg-success/10 text-success')}
        {renderStatCard('Expenses', formatEur(totalExpenses), TrendingDown, 'bg-error/10 text-error')}
        {renderStatCard('Mgmt Fees', formatEur(totalFees), Receipt, 'bg-warning/10 text-warning')}
        {renderStatCard('Net Payout', formatEur(totalNetPayout), DollarSign, 'bg-secondary/10 text-secondary')}
        {renderStatCard('Drafts', String(draftCount), FileText, 'bg-outline-variant/20 text-on-surface-variant')}
        {renderStatCard('Sent', String(sentCount), Send, 'bg-success/10 text-success')}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 ambient-shadow">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'gradient-accent text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Generator Tab ─── */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Generator Form */}
          <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
            <h2 className="font-headline text-lg font-semibold text-on-surface mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              Statement Generator
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Owner */}
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Owner
                </label>
                <select
                  value={genOwner}
                  onChange={(e) => {
                    setGenOwner(e.target.value);
                    setGenPropertyFilter('all');
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="all">All Owners (Batch)</option>
                  {demoOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Type */}
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Period Type
                </label>
                <select
                  value={genPeriodType}
                  onChange={(e) => setGenPeriodType(e.target.value as PeriodType)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Period Selector */}
              {genPeriodType === 'monthly' && (
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Month
                  </label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={String(i + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {genPeriodType === 'quarterly' && (
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Quarter
                  </label>
                  <select
                    value={genQuarter}
                    onChange={(e) => setGenQuarter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    <option value="1">Q1 (Jan-Mar)</option>
                    <option value="2">Q2 (Apr-Jun)</option>
                    <option value="3">Q3 (Jul-Sep)</option>
                    <option value="4">Q4 (Oct-Dec)</option>
                  </select>
                </div>
              )}
              {genPeriodType === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Start
                    </label>
                    <input
                      type="date"
                      value={genCustomStart}
                      onChange={(e) => setGenCustomStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      End
                    </label>
                    <input
                      type="date"
                      value={genCustomEnd}
                      onChange={(e) => setGenCustomEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                </div>
              )}

              {/* Year */}
              {genPeriodType !== 'custom' && (
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Year
                  </label>
                  <select
                    value={genYear}
                    onChange={(e) => setGenYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    {['2026', '2025', '2024'].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Property Filter */}
            {genOwner !== 'all' && (
              <div className="mb-5">
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Property Filter
                </label>
                <select
                  value={genPropertyFilter}
                  onChange={(e) => setGenPropertyFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="all">All Properties</option>
                  {ownerProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <FileText className="w-4 h-4" />
                {genOwner === 'all' ? 'Generate All Statements' : 'Generate Statement'}
              </button>
              {genOwner === 'all' && (
                <p className="text-xs text-on-surface-variant">
                  Will generate {demoOwners.length} statements for all owners
                </p>
              )}
            </div>
          </div>

          {/* Recent Statements (quick access from generator) */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/10">
              <h3 className="font-headline text-base font-semibold text-on-surface flex items-center gap-2">
                <Clock className="w-4 h-4 text-on-surface-variant" />
                Recently Generated
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant w-8" />
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Owner
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Period
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Gross Income
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Expenses
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Fees
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Net Payout
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statements.slice(0, 5).map((stmt) => {
                    const StatusIcon = statusIcons[stmt.status];
                    return (
                      <Fragment key={stmt.id}>
                        <tr
                          className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                          onClick={() => setExpandedId(expandedId === stmt.id ? null : stmt.id)}
                        >
                          <td className="py-3 px-4">
                            {expandedId === stmt.id ? (
                              <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-on-surface">{stmt.ownerName}</p>
                              <p className="text-[10px] text-on-surface-variant">{stmt.ownerCompany}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <CalendarRange className="w-3.5 h-3.5 text-on-surface-variant" />
                              <span className="text-sm text-on-surface-variant">{stmt.periodLabel}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-end text-on-surface">
                            {formatEur(stmt.totalGrossIncome)}
                          </td>
                          <td className="py-3 px-4 text-sm text-end text-error">
                            {formatEur(stmt.totalExpenses)}
                          </td>
                          <td className="py-3 px-4 text-sm text-end text-warning">
                            {formatEur(stmt.totalManagementFees)}
                          </td>
                          <td className="py-3 px-4 text-sm text-end font-bold text-secondary">
                            {formatEur(stmt.netPayout)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[stmt.status]}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {stmt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewStmt(stmt)}
                                title="Preview"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {stmt.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleApprove(stmt.id)}
                                  title="Approve"
                                  className="p-1.5 rounded-lg text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {stmt.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleSend(stmt.id)}
                                  title="Send"
                                  className="p-1.5 rounded-lg text-success bg-success/10 hover:bg-success/20 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDownloadPdf(stmt)}
                                title="Download PDF"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEmailOwner(stmt)}
                                title="Email"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Detail */}
                        {expandedId === stmt.id && (
                          <tr key={`${stmt.id}-detail`}>
                            <td colSpan={9} className="px-4 py-4 bg-surface-container-low/50">
                              <div className="space-y-4">
                                {stmt.properties.map((prop) => (
                                  <div
                                    key={prop.propertyId}
                                    className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow"
                                  >
                                    <div className="flex items-center gap-2 mb-4">
                                      <Building2 className="w-4 h-4 text-secondary" />
                                      <h4 className="font-headline font-semibold text-on-surface">
                                        {prop.propertyName}
                                      </h4>
                                      <span className="text-xs text-on-surface-variant">
                                        {prop.location}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                      {/* Income / Bookings */}
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                                          Income - Booking Breakdown
                                        </p>
                                        <div className="space-y-2">
                                          {prop.bookings.map((b, i) => (
                                            <div
                                              key={i}
                                              className="p-2.5 rounded-lg bg-surface-container-low"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-on-surface">
                                                  {b.guestName}
                                                </span>
                                                <span
                                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${platformColors[b.platform] || 'bg-outline-variant/20 text-on-surface-variant'}`}
                                                >
                                                  {b.platform}
                                                </span>
                                              </div>
                                              <div className="text-[10px] text-on-surface-variant mb-1">
                                                {b.checkIn} - {b.checkOut} ({b.nights} nights)
                                              </div>
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-on-surface-variant">
                                                  Gross: {formatEur(b.grossAmount)}
                                                </span>
                                                <span className="text-warning">
                                                  Fee: -{formatEur(b.managementFee)}
                                                </span>
                                                <span className="font-semibold text-success">
                                                  Net: {formatEur(b.netAmount)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-xs font-semibold text-on-surface">
                                            <span>Total Revenue</span>
                                            <span>{formatEur(prop.totalGrossIncome)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Expenses */}
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                                          Expenses by Category
                                        </p>
                                        <div className="space-y-1.5">
                                          {prop.expenses.map((e, i) => (
                                            <div
                                              key={i}
                                              className="flex items-center justify-between text-xs"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${expenseCategoryColors[e.category] || 'bg-outline-variant/20 text-on-surface-variant'}`}
                                                >
                                                  {e.category}
                                                </span>
                                                <span className="text-on-surface-variant truncate max-w-[120px]">
                                                  {e.description}
                                                </span>
                                              </div>
                                              <span className="font-medium text-error">
                                                -{formatEur(e.amount)}
                                              </span>
                                            </div>
                                          ))}
                                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-xs font-semibold text-error">
                                            <span>Total Expenses</span>
                                            <span>-{formatEur(prop.totalExpenses)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Summary */}
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                                          Property Summary
                                        </p>
                                        <div className="space-y-2 bg-surface-container-low rounded-lg p-3">
                                          <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">
                                              Gross Income
                                            </span>
                                            <span className="font-medium text-on-surface">
                                              {formatEur(prop.totalGrossIncome)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">
                                              Management Fees
                                            </span>
                                            <span className="font-medium text-warning">
                                              -{formatEur(prop.totalManagementFees)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">
                                              Expenses
                                            </span>
                                            <span className="font-medium text-error">
                                              -{formatEur(prop.totalExpenses)}
                                            </span>
                                          </div>
                                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-sm font-bold text-secondary">
                                            <span>Net Income</span>
                                            <span>{formatEur(prop.netPropertyIncome)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Tab ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by owner or period..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
            <select
              value={historyOwnerFilter}
              onChange={(e) => {
                setHistoryOwnerFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">All Owners</option>
              {demoOwners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value as 'all' | StatementStatus);
                setHistoryPage(1);
              }}
              className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="SENT">Sent</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Period
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Owner
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Properties
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Total Income
                    </th>
                    <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Total Payout
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Generated
                    </th>
                    <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-on-surface-variant">
                        No statements found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((stmt) => {
                      const StatusIcon = statusIcons[stmt.status];
                      return (
                        <tr
                          key={stmt.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <CalendarRange className="w-3.5 h-3.5 text-on-surface-variant" />
                              <span className="text-sm font-medium text-on-surface">
                                {stmt.periodLabel}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium text-on-surface">{stmt.ownerName}</p>
                              <p className="text-[10px] text-on-surface-variant">{stmt.ownerCompany}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-on-surface-variant" />
                              <span className="text-xs text-on-surface-variant">
                                {stmt.properties.length} {stmt.properties.length === 1 ? 'property' : 'properties'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-end text-on-surface">
                            {formatEur(stmt.totalGrossIncome)}
                          </td>
                          <td className="py-3 px-4 text-sm text-end font-bold text-secondary">
                            {formatEur(stmt.netPayout)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[stmt.status]}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {stmt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-on-surface-variant">
                            {stmt.generatedAt}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewStmt(stmt)}
                                title="Preview"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(stmt)}
                                title="Download PDF"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEmailOwner(stmt)}
                                title="Email"
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </button>
                              {stmt.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleApprove(stmt.id)}
                                  title="Approve"
                                  className="p-1.5 rounded-lg text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {stmt.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleSend(stmt.id)}
                                  title="Send to Owner"
                                  className="p-1.5 rounded-lg text-success bg-success/10 hover:bg-success/20 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setHistoryPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === historyPage
                      ? 'gradient-accent text-white'
                      : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage === historyTotalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Comparison Tab ─── */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Comparison Selector */}
          <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
            <h2 className="font-headline text-lg font-semibold text-on-surface mb-5 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Period Comparison
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Owner
                </label>
                <select
                  value={compareOwnerId}
                  onChange={(e) => {
                    setCompareOwnerId(e.target.value);
                    setComparePeriodA('');
                    setComparePeriodB('');
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  {demoOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Period A
                </label>
                <select
                  value={comparePeriodA}
                  onChange={(e) => setComparePeriodA(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select period...</option>
                  {ownerStatementsForCompare.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.periodLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Period B
                </label>
                <select
                  value={comparePeriodB}
                  onChange={(e) => setComparePeriodB(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  <option value="">Select period...</option>
                  {ownerStatementsForCompare
                    .filter((s) => s.id !== comparePeriodA)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.periodLabel}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Results */}
          {compareA && compareB ? (
            <div className="space-y-4">
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[compareA, compareB].map((stmt, idx) => (
                  <div
                    key={stmt.id}
                    className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                          idx === 0 ? 'bg-secondary' : 'bg-warning'
                        }`}
                      >
                        {idx === 0 ? 'A' : 'B'}
                      </div>
                      <div>
                        <h3 className="font-headline font-semibold text-on-surface text-sm">
                          {stmt.periodLabel}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant">{stmt.ownerName}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Gross Income</span>
                        <span className="font-medium text-on-surface">
                          {formatEur(stmt.totalGrossIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Expenses</span>
                        <span className="font-medium text-error">
                          -{formatEur(stmt.totalExpenses)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Management Fees</span>
                        <span className="font-medium text-warning">
                          -{formatEur(stmt.totalManagementFees)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-outline-variant/20 flex justify-between text-sm font-bold">
                        <span className="text-on-surface">Net Payout</span>
                        <span className="text-secondary">{formatEur(stmt.netPayout)}</span>
                      </div>
                      <div className="pt-1 flex justify-between text-xs text-on-surface-variant">
                        <span>Properties</span>
                        <span>{stmt.properties.length}</span>
                      </div>
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Total Bookings</span>
                        <span>
                          {stmt.properties.reduce((s, p) => s + p.bookings.length, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Change Summary */}
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-secondary" />
                  Change Analysis: {compareA.periodLabel} vs {compareB.periodLabel}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Gross Income',
                      a: compareA.totalGrossIncome,
                      b: compareB.totalGrossIncome,
                    },
                    {
                      label: 'Expenses',
                      a: compareA.totalExpenses,
                      b: compareB.totalExpenses,
                    },
                    {
                      label: 'Mgmt Fees',
                      a: compareA.totalManagementFees,
                      b: compareB.totalManagementFees,
                    },
                    {
                      label: 'Net Payout',
                      a: compareA.netPayout,
                      b: compareB.netPayout,
                    },
                  ].map((metric) => {
                    const change = pctChange(metric.a, metric.b);
                    return (
                      <div key={metric.label} className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                          {metric.label}
                        </p>
                        <p className="text-lg font-bold text-on-surface">{formatEur(metric.a)}</p>
                        <p className="text-xs text-on-surface-variant mb-1">
                          vs {formatEur(metric.b)}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            metric.label === 'Expenses'
                              ? change.positive
                                ? 'bg-error/10 text-error'
                                : 'bg-success/10 text-success'
                              : change.positive
                                ? 'bg-success/10 text-success'
                                : 'bg-error/10 text-error'
                          }`}
                        >
                          {change.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Visual bars */}
                <div className="mt-6 space-y-3">
                  {[
                    { label: 'Gross Income', a: compareA.totalGrossIncome, b: compareB.totalGrossIncome, color: 'bg-success' },
                    { label: 'Net Payout', a: compareA.netPayout, b: compareB.netPayout, color: 'bg-secondary' },
                  ].map((bar) => {
                    const maxVal = Math.max(bar.a, bar.b);
                    return (
                      <div key={bar.label}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                          {bar.label}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant w-20 text-end shrink-0">
                              {compareA.periodLabel}
                            </span>
                            <div className="flex-1 h-4 bg-surface-container-low rounded-full overflow-hidden">
                              <div
                                className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                                style={{ width: `${maxVal > 0 ? (bar.a / maxVal) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-on-surface w-20 shrink-0">
                              {formatEur(bar.a)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant w-20 text-end shrink-0">
                              {compareB.periodLabel}
                            </span>
                            <div className="flex-1 h-4 bg-surface-container-low rounded-full overflow-hidden">
                              <div
                                className={`h-full ${bar.color}/60 rounded-full transition-all duration-500`}
                                style={{ width: `${maxVal > 0 ? (bar.b / maxVal) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-on-surface w-20 shrink-0">
                              {formatEur(bar.b)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
              <ArrowLeftRight className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="text-sm text-on-surface-variant">
                Select two periods for the same owner to compare financial performance side by side.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Statement Preview Modal ─── */}
      {previewStmt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 lg:p-8"
          onClick={() => setPreviewStmt(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl w-full max-w-4xl ambient-shadow my-4"
            onClick={(e) => e.stopPropagation()}
            ref={printRef}
          >
            {/* Modal Header - Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                Statement Preview
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewStmt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button
                  onClick={() => handleEmailOwner(previewStmt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setPreviewStmt(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Statement Content */}
            <div className="p-6 lg:p-8 space-y-8">
              {/* ── Statement Header ── */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-outline-variant/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-on-surface tracking-wider">
                      SIVAN MANAGEMENT
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Property Management Services
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Thessaloniki, Greece
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                    Owner Statement
                  </p>
                  <p className="text-lg font-bold text-on-surface">{previewStmt.periodLabel}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {previewStmt.periodStart} - {previewStmt.periodEnd}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Generated: {previewStmt.generatedAt}
                  </p>
                </div>
              </div>

              {/* ── Owner Info ── */}
              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Statement For
                </p>
                <p className="text-sm font-bold text-on-surface">{previewStmt.ownerName}</p>
                <p className="text-xs text-on-surface-variant">{previewStmt.ownerCompany}</p>
                <p className="text-xs text-on-surface-variant">{previewStmt.ownerEmail}</p>
              </div>

              {/* ── Income Section ── */}
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Income
                </h3>
                {previewStmt.properties.map((prop) => (
                  <div key={prop.propertyId} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-sm font-semibold text-on-surface">{prop.propertyName}</span>
                      <span className="text-[10px] text-on-surface-variant">({prop.location})</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant/20">
                            <th className="text-start py-2 pe-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Guest
                            </th>
                            <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Dates
                            </th>
                            <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Platform
                            </th>
                            <th className="text-end py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Gross
                            </th>
                            <th className="text-end py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Fee
                            </th>
                            <th className="text-end py-2 ps-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Net
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {prop.bookings.map((b, i) => (
                            <tr
                              key={i}
                              className="border-b border-outline-variant/10"
                            >
                              <td className="py-2 pe-3 text-on-surface">{b.guestName}</td>
                              <td className="py-2 px-3 text-on-surface-variant">
                                {b.checkIn} - {b.checkOut} ({b.nights}n)
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${platformColors[b.platform] || 'bg-outline-variant/20 text-on-surface-variant'}`}
                                >
                                  {b.platform}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-end text-on-surface">
                                {formatEur(b.grossAmount)}
                              </td>
                              <td className="py-2 px-3 text-end text-warning">
                                -{formatEur(b.managementFee)}
                              </td>
                              <td className="py-2 ps-3 text-end font-medium text-success">
                                {formatEur(b.netAmount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td colSpan={3} className="py-2 pe-3 text-on-surface">
                              Subtotal - {prop.propertyName}
                            </td>
                            <td className="py-2 px-3 text-end text-on-surface">
                              {formatEur(prop.totalGrossIncome)}
                            </td>
                            <td className="py-2 px-3 text-end text-warning">
                              -{formatEur(prop.totalManagementFees)}
                            </td>
                            <td className="py-2 ps-3 text-end text-success">
                              {formatEur(prop.totalNetBookingIncome)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Expense Section ── */}
              <div>
                <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-error" />
                  Expenses
                </h3>
                {previewStmt.properties.map((prop) => (
                  <div key={prop.propertyId} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-sm font-semibold text-on-surface">{prop.propertyName}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant/20">
                            <th className="text-start py-2 pe-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Date
                            </th>
                            <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Category
                            </th>
                            <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Description
                            </th>
                            <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Vendor
                            </th>
                            <th className="text-end py-2 ps-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {prop.expenses.map((e, i) => (
                            <tr
                              key={i}
                              className="border-b border-outline-variant/10"
                            >
                              <td className="py-2 pe-3 text-on-surface-variant">{e.date}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${expenseCategoryColors[e.category] || 'bg-outline-variant/20 text-on-surface-variant'}`}
                                >
                                  {e.category}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-on-surface-variant">{e.description}</td>
                              <td className="py-2 px-3 text-on-surface-variant">{e.vendor}</td>
                              <td className="py-2 ps-3 text-end font-medium text-error">
                                -{formatEur(e.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td colSpan={4} className="py-2 text-on-surface">
                              Subtotal - {prop.propertyName}
                            </td>
                            <td className="py-2 ps-3 text-end text-error">
                              -{formatEur(prop.totalExpenses)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Summary ── */}
              <div className="bg-surface-container-low rounded-xl p-5">
                <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-secondary" />
                  Statement Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Total Gross Income</span>
                    <span className="font-medium text-on-surface">
                      {formatEur(previewStmt.totalGrossIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Total Management Fees</span>
                    <span className="font-medium text-warning">
                      -{formatEur(previewStmt.totalManagementFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Total Expenses</span>
                    <span className="font-medium text-error">
                      -{formatEur(previewStmt.totalExpenses)}
                    </span>
                  </div>
                  <div className="pt-3 border-t-2 border-outline-variant/30 flex justify-between text-lg font-bold">
                    <span className="text-on-surface">Net Payout Due</span>
                    <span className="text-secondary">{formatEur(previewStmt.netPayout)}</span>
                  </div>
                </div>
              </div>

              {/* ── Payment History ── */}
              {previewStmt.payoutHistory.length > 0 && (
                <div>
                  <h3 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-on-surface-variant" />
                    Payment History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-outline-variant/20">
                          <th className="text-start py-2 pe-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Date
                          </th>
                          <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Method
                          </th>
                          <th className="text-start py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Reference
                          </th>
                          <th className="text-end py-2 ps-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewStmt.payoutHistory.map((p, i) => (
                          <tr
                            key={i}
                            className="border-b border-outline-variant/10"
                          >
                            <td className="py-2 pe-3 text-on-surface-variant">{p.date}</td>
                            <td className="py-2 px-3 text-on-surface">{p.method}</td>
                            <td className="py-2 px-3 text-on-surface-variant font-mono text-[10px]">
                              {p.reference}
                            </td>
                            <td className="py-2 ps-3 text-end font-medium text-secondary">
                              {formatEur(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div className="pt-6 border-t border-outline-variant/20 text-center">
                <p className="text-[10px] text-on-surface-variant">
                  This statement was generated by Sivan Management Property System. For any questions, please contact management@sivanpm.com
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <span className="text-[10px] text-on-surface-variant/50">
                    Statement ID: {previewStmt.id}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/50">
                    Status: {previewStmt.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
