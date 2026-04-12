import { useState, useMemo } from 'react';
import {
  Globe,
  Code,
  Palette,
  CreditCard,
  BarChart3,
  Settings2,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Users,
  DollarSign,
  Percent,
  Zap,
  Clock,
  Shield,
  Eye,
  ExternalLink,
  Search,
  ToggleLeft,
  ToggleRight,
  Building2,
  Tag,
  Link2,
  RefreshCw,
  AlertTriangle,
  Image,
  Hash,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────

type TabType = 'widget' | 'rules' | 'payment' | 'seo';

interface WidgetTheme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: number;
}

interface BookingRule {
  propertyId: string;
  propertyName: string;
  minStay: number;
  maxStay: number;
  advanceBookingDays: number;
  lastMinuteDiscount: boolean;
  lastMinutePercent: number;
  cancellationPolicy: 'Flexible' | 'Moderate' | 'Strict';
  instantBooking: boolean;
}

interface DirectBooking {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  source: string;
  createdAt: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────

const kpis = {
  directBookingsThisMonth: 18,
  directBookingsTrend: 22.5,
  conversionRate: 4.8,
  conversionTrend: 0.6,
  directRevenue: 32400,
  otaRevenue: 68200,
  revenueTrend: 15.3,
  commissionSaved: 8640,
  commissionTrend: 28.1,
};

const conversionFunnelData = [
  { name: 'Site Visits', value: 3820, fill: '#6b38d4' },
  { name: 'Property Views', value: 1640, fill: '#8455ef' },
  { name: 'Date Search', value: 680, fill: '#9b6ff0' },
  { name: 'Booking Started', value: 310, fill: '#b18af5' },
  { name: 'Booking Completed', value: 184, fill: '#c7a5fa' },
];

const monthlyDirectVsOta = [
  { month: 'Jan', direct: 4200, ota: 12800 },
  { month: 'Feb', direct: 5100, ota: 13200 },
  { month: 'Mar', direct: 7600, ota: 16800 },
  { month: 'Apr', direct: 12400, ota: 24600 },
  { month: 'May', direct: 18200, ota: 32400 },
  { month: 'Jun', direct: 26800, ota: 42600 },
  { month: 'Jul', direct: 32400, ota: 48200 },
  { month: 'Aug', direct: 34800, ota: 49600 },
  { month: 'Sep', direct: 22400, ota: 36200 },
  { month: 'Oct', direct: 14200, ota: 22800 },
  { month: 'Nov', direct: 8400, ota: 15600 },
  { month: 'Dec', direct: 6800, ota: 14200 },
];

const channelSplitData = [
  { name: 'Direct', value: 32, color: '#6b38d4' },
  { name: 'Airbnb', value: 35, color: '#FF5A5F' },
  { name: 'Booking.com', value: 22, color: '#003580' },
  { name: 'VRBO', value: 8, color: '#3B5998' },
  { name: 'Other', value: 3, color: '#94a3b8' },
];

const supportedProperties = [
  { id: 'p1', name: 'Villa Elounda Royale', enabled: true, bookings: 28 },
  { id: 'p2', name: 'Chania Harbor Suite', enabled: true, bookings: 18 },
  { id: 'p3', name: 'Rethymno Beach House', enabled: true, bookings: 16 },
  { id: 'p4', name: 'Heraklion City Loft', enabled: false, bookings: 0 },
  { id: 'p5', name: 'Agios Nikolaos Villa', enabled: true, bookings: 8 },
  { id: 'p6', name: 'Plakias Seaside', enabled: false, bookings: 0 },
  { id: 'p7', name: 'Sitia Countryside', enabled: false, bookings: 0 },
];

const mockBookingRules: BookingRule[] = [
  { propertyId: 'p1', propertyName: 'Villa Elounda Royale', minStay: 3, maxStay: 30, advanceBookingDays: 365, lastMinuteDiscount: true, lastMinutePercent: 15, cancellationPolicy: 'Moderate', instantBooking: true },
  { propertyId: 'p2', propertyName: 'Chania Harbor Suite', minStay: 2, maxStay: 21, advanceBookingDays: 180, lastMinuteDiscount: true, lastMinutePercent: 10, cancellationPolicy: 'Flexible', instantBooking: false },
  { propertyId: 'p3', propertyName: 'Rethymno Beach House', minStay: 4, maxStay: 28, advanceBookingDays: 365, lastMinuteDiscount: false, lastMinutePercent: 0, cancellationPolicy: 'Strict', instantBooking: true },
  { propertyId: 'p5', propertyName: 'Agios Nikolaos Villa', minStay: 2, maxStay: 14, advanceBookingDays: 120, lastMinuteDiscount: true, lastMinutePercent: 20, cancellationPolicy: 'Moderate', instantBooking: false },
];

const recentBookings: DirectBooking[] = [
  { id: 'DB-1042', guestName: 'Emma Thompson', property: 'Villa Elounda Royale', checkIn: '2026-04-18', checkOut: '2026-04-25', amount: 2960, status: 'confirmed', source: 'Website Widget', createdAt: '2026-04-11T14:30:00Z' },
  { id: 'DB-1041', guestName: 'Marcus Weber', property: 'Chania Harbor Suite', checkIn: '2026-04-20', checkOut: '2026-04-24', amount: 780, status: 'confirmed', source: 'Direct Link', createdAt: '2026-04-11T09:15:00Z' },
  { id: 'DB-1040', guestName: 'Sofia Papadopoulos', property: 'Rethymno Beach House', checkIn: '2026-04-22', checkOut: '2026-04-29', amount: 1890, status: 'pending', source: 'Website Widget', createdAt: '2026-04-10T18:45:00Z' },
  { id: 'DB-1039', guestName: 'James Wilson', property: 'Villa Elounda Royale', checkIn: '2026-04-15', checkOut: '2026-04-19', amount: 1680, status: 'confirmed', source: 'Google Ads', createdAt: '2026-04-09T11:20:00Z' },
  { id: 'DB-1038', guestName: 'Anna Muller', property: 'Agios Nikolaos Villa', checkIn: '2026-04-16', checkOut: '2026-04-21', amount: 1050, status: 'completed', source: 'Instagram Bio', createdAt: '2026-04-08T16:00:00Z' },
  { id: 'DB-1037', guestName: 'Pierre Dupont', property: 'Chania Harbor Suite', checkIn: '2026-04-12', checkOut: '2026-04-15', amount: 585, status: 'completed', source: 'Website Widget', createdAt: '2026-04-07T13:10:00Z' },
  { id: 'DB-1036', guestName: 'Yuki Tanaka', property: 'Villa Elounda Royale', checkIn: '2026-05-01', checkOut: '2026-05-08', amount: 3220, status: 'confirmed', source: 'Direct Link', createdAt: '2026-04-06T08:55:00Z' },
  { id: 'DB-1035', guestName: 'Carlos Mendez', property: 'Rethymno Beach House', checkIn: '2026-04-10', checkOut: '2026-04-13', amount: 810, status: 'cancelled', source: 'Website Widget', createdAt: '2026-04-05T20:30:00Z' },
];

// ── Helper components ─────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  trend,
  prefix,
  suffix,
  icon: Icon,
  color = 'secondary',
}: {
  title: string;
  value: number | string;
  trend: number;
  prefix?: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const colorMap: Record<string, { bg: string; text: string }> = {
    secondary: { bg: 'bg-secondary/10', text: 'text-secondary' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  };
  const c = colorMap[color] || colorMap.secondary;

  return (
    <div className="glass-card p-4 rounded-xl hover:shadow-ambient transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${c.text}`} />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold
            ${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}
        >
          <TrendIcon className="w-3 h-3" />
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{title}</p>
      <p className="text-xl font-headline font-bold mt-0.5">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: DirectBooking['status'] }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', label: 'Confirmed' },
    pending: { bg: 'bg-amber-500/15', text: 'text-amber-500', label: 'Pending' },
    cancelled: { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Cancelled' },
    completed: { bg: 'bg-blue-500/15', text: 'text-blue-500', label: 'Completed' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function DirectBookingConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>('widget');
  const [copied, setCopied] = useState(false);

  // Widget theme state
  const [theme, setTheme] = useState<WidgetTheme>({
    primaryColor: '#6b38d4',
    fontFamily: 'Inter',
    borderRadius: 12,
  });

  // Properties selector
  const [properties, setProperties] = useState(supportedProperties);

  // Booking rules
  const [rules, setRules] = useState(mockBookingRules);

  // Payment settings
  const [stripeConnected] = useState(true);
  const [depositRequired, setDepositRequired] = useState(true);
  const [depositPercent, setDepositPercent] = useState(30);
  const [balanceDue, setBalanceDue] = useState('14_days');

  // SEO settings
  const [seoTitle, setSeoTitle] = useState('Book Direct | Sivan Property Management - Crete, Greece');
  const [seoDescription, setSeoDescription] = useState('Book your dream vacation in Crete directly. Best price guaranteed. Luxury villas, suites, and apartments across Elounda, Chania, Rethymno.');
  const [ogImage, setOgImage] = useState('https://book.sivanmanagment.com/og-image.jpg');
  const [gaId, setGaId] = useState('G-SIVAN2026XYZ');
  const [utmSource, setUtmSource] = useState('direct_booking_widget');
  const [utmMedium, setUtmMedium] = useState('website');
  const [utmCampaign, setUtmCampaign] = useState('spring_2026');

  const tabs: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'widget', label: 'Website Widget', icon: Code },
    { key: 'rules', label: 'Booking Rules', icon: Settings2 },
    { key: 'payment', label: 'Payment Settings', icon: CreditCard },
    { key: 'seo', label: 'SEO & Marketing', icon: BarChart3 },
  ];

  // Build embed code dynamically
  const embedCode = useMemo(() => {
    const enabledIds = properties.filter((p) => p.enabled).map((p) => p.id);
    return `<script src="https://book.sivanmanagment.com/widget.js"></script>
<div
  id="sivan-booking-widget"
  data-api-key="pk_live_sivan_abc123xyz"
  data-properties="${enabledIds.join(',')}"
  data-color="${theme.primaryColor}"
  data-font="${theme.fontFamily}"
  data-radius="${theme.borderRadius}"
  data-lang="en"
></div>`;
  }, [properties, theme]);

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleProperty = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );
  };

  const updateRule = (propertyId: string, field: keyof BookingRule, value: unknown) => {
    setRules((prev) =>
      prev.map((r) => (r.propertyId === propertyId ? { ...r, [field]: value } : r)),
    );
  };

  const enabledCount = properties.filter((p) => p.enabled).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Channels
          </p>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2 text-on-surface">
            <Globe className="w-6 h-6 text-secondary" />
            Direct Booking Engine
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Configure your booking widget, rules, payment, and marketing settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://book.sivanmanagment.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Booking Site
          </a>
        </div>
      </div>

      {/* ── KPI Dashboard ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Direct Bookings (Apr)"
          value={kpis.directBookingsThisMonth}
          trend={kpis.directBookingsTrend}
          icon={Calendar}
          color="secondary"
        />
        <KPICard
          title="Conversion Rate"
          value={kpis.conversionRate}
          trend={kpis.conversionTrend}
          suffix="%"
          icon={Percent}
          color="blue"
        />
        <KPICard
          title="Direct Revenue"
          value={kpis.directRevenue}
          trend={kpis.revenueTrend}
          prefix="€"
          icon={DollarSign}
          color="emerald"
        />
        <KPICard
          title="Commission Saved"
          value={kpis.commissionSaved}
          trend={kpis.commissionTrend}
          prefix="€"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* ── Revenue Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Direct vs OTA Revenue */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Direct vs OTA Revenue</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Monthly comparison (2026)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-secondary" />
                Direct
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-outline-variant" />
                OTA
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyDirectVsOta}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#46464c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#46464c' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e7e8e9', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`€${value.toLocaleString()}`, undefined]}
              />
              <Area type="monotone" dataKey="ota" stackId="1" stroke="#c7c5cd" fill="#c7c5cd" fillOpacity={0.3} name="OTA" />
              <Area type="monotone" dataKey="direct" stackId="1" stroke="#6b38d4" fill="#6b38d4" fillOpacity={0.4} name="Direct" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Split Pie */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-on-surface mb-1">Revenue by Channel</h3>
          <p className="text-xs text-on-surface-variant mb-3">Current month share</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={channelSplitData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {channelSplitData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e7e8e9', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`${value}%`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {channelSplitData.map((ch) => (
              <div key={ch.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                <span className="text-[10px] text-on-surface-variant truncate">{ch.name}</span>
                <span className="text-[10px] font-semibold text-on-surface ms-auto">{ch.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Conversion Funnel ───────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-1">Booking Conversion Funnel</h3>
        <p className="text-xs text-on-surface-variant mb-4">Visitor journey this month</p>
        <div className="grid grid-cols-5 gap-3">
          {conversionFunnelData.map((step, i) => {
            const pct = i === 0 ? 100 : ((step.value / conversionFunnelData[0].value) * 100).toFixed(1);
            const dropoff = i > 0 ? (((conversionFunnelData[i - 1].value - step.value) / conversionFunnelData[i - 1].value) * 100).toFixed(0) : null;
            return (
              <div key={step.name} className="text-center">
                <div
                  className="mx-auto rounded-lg flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: step.fill + '20',
                    width: `${60 + (40 * (conversionFunnelData.length - i)) / conversionFunnelData.length}%`,
                    minHeight: 64,
                  }}
                >
                  <span className="text-lg font-headline font-bold" style={{ color: step.fill }}>
                    {step.value.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-medium text-on-surface mt-2">{step.name}</p>
                <p className="text-[10px] text-on-surface-variant">{pct}%</p>
                {dropoff && (
                  <p className="text-[10px] text-red-500 mt-0.5">-{dropoff}% drop</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant/30">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === key
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40'
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: Website Widget
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'widget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Customizer */}
            <div className="glass-card rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Theme Customizer</h3>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-outline-variant/30 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm font-mono"
                  />
                  <div className="flex gap-1">
                    {['#6b38d4', '#1a73e8', '#0d9488', '#e11d48', '#030303'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setTheme({ ...theme, primaryColor: c })}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${
                          theme.primaryColor === c ? 'border-secondary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Font Family</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                >
                  <option value="Inter">Inter</option>
                  <option value="Manrope">Manrope</option>
                  <option value="DM Sans">DM Sans</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="system-ui">System Default</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">
                  Border Radius: {theme.borderRadius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={theme.borderRadius}
                  onChange={(e) => setTheme({ ...theme, borderRadius: Number(e.target.value) })}
                  className="w-full accent-secondary"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                  <span>Sharp</span>
                  <span>Rounded</span>
                </div>
              </div>
            </div>

            {/* Widget Preview */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Widget Preview</h3>
              </div>

              <div
                className="border border-outline-variant/30 bg-surface-container-lowest p-5 space-y-4"
                style={{ borderRadius: theme.borderRadius, fontFamily: theme.fontFamily }}
              >
                {/* Mini property card */}
                <div className="flex gap-3">
                  <div
                    className="w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-100 flex-shrink-0 flex items-center justify-center text-blue-400"
                    style={{ borderRadius: Math.max(theme.borderRadius - 4, 0) }}
                  >
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">Villa Elounda Royale</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Elounda, Crete</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-bold" style={{ color: theme.primaryColor }}>€280</span>
                      <span className="text-[10px] text-on-surface-variant">/ night</span>
                    </div>
                  </div>
                </div>

                {/* Date picker mockup */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="px-3 py-2 border border-outline-variant/30 bg-surface"
                    style={{ borderRadius: Math.max(theme.borderRadius - 4, 0) }}
                  >
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Check-in</p>
                    <p className="text-xs font-medium text-on-surface mt-0.5">Apr 18, 2026</p>
                  </div>
                  <div
                    className="px-3 py-2 border border-outline-variant/30 bg-surface"
                    style={{ borderRadius: Math.max(theme.borderRadius - 4, 0) }}
                  >
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Check-out</p>
                    <p className="text-xs font-medium text-on-surface mt-0.5">Apr 25, 2026</p>
                  </div>
                </div>

                {/* Guest selector mockup */}
                <div
                  className="px-3 py-2 border border-outline-variant/30 bg-surface flex items-center justify-between"
                  style={{ borderRadius: Math.max(theme.borderRadius - 4, 0) }}
                >
                  <div>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Guests</p>
                    <p className="text-xs font-medium text-on-surface mt-0.5">2 Adults, 1 Child</p>
                  </div>
                  <Users className="w-4 h-4 text-on-surface-variant" />
                </div>

                {/* Book button */}
                <button
                  className="w-full py-2.5 text-white text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: theme.primaryColor,
                    borderRadius: Math.max(theme.borderRadius - 4, 0),
                  }}
                >
                  Book Now — €1,960
                </button>

                <p className="text-[9px] text-center text-on-surface-variant">
                  Best price guaranteed. No hidden fees.
                </p>
              </div>
            </div>
          </div>

          {/* Embed Code Generator */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Embed Code</h3>
              </div>
              <button
                onClick={handleCopyEmbed}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-white text-xs font-medium hover:bg-secondary/90 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-primary/[0.03] border border-outline-variant/20 text-xs text-emerald-700 font-mono overflow-x-auto whitespace-pre">
                {embedCode}
              </pre>
            </div>
          </div>

          {/* Supported Properties Selector */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">
                  Supported Properties
                  <span className="text-xs text-on-surface-variant font-normal ms-2">
                    {enabledCount} of {properties.length} active
                  </span>
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    p.enabled
                      ? 'border-secondary/30 bg-secondary/[0.04]'
                      : 'border-outline-variant/20 bg-surface hover:bg-surface-container-low'
                  }`}
                  onClick={() => toggleProperty(p.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        p.enabled ? 'bg-secondary/10' : 'bg-outline-variant/10'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 ${p.enabled ? 'text-secondary' : 'text-on-surface-variant'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{p.name}</p>
                      {p.bookings > 0 && (
                        <p className="text-[10px] text-on-surface-variant">{p.bookings} direct bookings</p>
                      )}
                    </div>
                  </div>
                  {p.enabled ? (
                    <ToggleRight className="w-6 h-6 text-secondary flex-shrink-0" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-on-surface-variant flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Booking Rules
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.propertyId} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Building2 className="w-[18px] h-[18px] text-secondary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">{rule.propertyName}</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    {rule.instantBooking ? 'Instant Booking' : 'Request to Book'}
                  </p>
                </div>
                <div className="ms-auto">
                  <button
                    onClick={() => updateRule(rule.propertyId, 'instantBooking', !rule.instantBooking)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      rule.instantBooking
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {rule.instantBooking ? (
                      <><Zap className="w-3 h-3" /> Instant</>
                    ) : (
                      <><Clock className="w-3 h-3" /> Request</>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Min Stay */}
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">
                    Min Stay (nights)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={rule.maxStay}
                    value={rule.minStay}
                    onChange={(e) => updateRule(rule.propertyId, 'minStay', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                  />
                </div>

                {/* Max Stay */}
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">
                    Max Stay (nights)
                  </label>
                  <input
                    type="number"
                    min={rule.minStay}
                    value={rule.maxStay}
                    onChange={(e) => updateRule(rule.propertyId, 'maxStay', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                  />
                </div>

                {/* Advance Booking Window */}
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">
                    Advance Window (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rule.advanceBookingDays}
                    onChange={(e) => updateRule(rule.propertyId, 'advanceBookingDays', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                  />
                </div>

                {/* Last-Minute Discount */}
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">
                    Last-Minute Discount
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateRule(rule.propertyId, 'lastMinuteDiscount', !rule.lastMinuteDiscount)}
                      className="flex-shrink-0"
                    >
                      {rule.lastMinuteDiscount ? (
                        <ToggleRight className="w-6 h-6 text-secondary" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                      )}
                    </button>
                    {rule.lastMinuteDiscount && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={rule.lastMinutePercent}
                          onChange={(e) => updateRule(rule.propertyId, 'lastMinutePercent', Number(e.target.value))}
                          className="w-14 px-2 py-1.5 rounded border border-outline-variant/30 bg-surface text-xs text-center"
                        />
                        <span className="text-xs text-on-surface-variant">%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Policy */}
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1">
                    Cancellation Policy
                  </label>
                  <select
                    value={rule.cancellationPolicy}
                    onChange={(e) => updateRule(rule.propertyId, 'cancellationPolicy', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Strict">Strict</option>
                  </select>
                </div>

                {/* Policy Info */}
                <div className="flex items-end">
                  <div
                    className={`w-full px-3 py-2 rounded-lg text-[10px] font-medium ${
                      rule.cancellationPolicy === 'Flexible'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : rule.cancellationPolicy === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {rule.cancellationPolicy === 'Flexible' && 'Full refund 24h before'}
                    {rule.cancellationPolicy === 'Moderate' && 'Full refund 5 days before'}
                    {rule.cancellationPolicy === 'Strict' && '50% refund 7 days before'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
            + Add Rules for Another Property
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: Payment Settings
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stripe Integration */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-semibold text-on-surface">Stripe Integration</h3>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              stripeConnected
                ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                : 'border-red-500/30 bg-red-500/[0.04]'
            }`}>
              <div className="flex items-center gap-3">
                {stripeConnected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {stripeConnected ? 'Stripe Connected' : 'Not Connected'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {stripeConnected ? 'Account: acct_1sivan2026 (Sivan Management Ltd.)' : 'Connect your Stripe account to accept payments'}
                  </p>
                </div>
              </div>
              <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                stripeConnected
                  ? 'bg-outline-variant/10 text-on-surface-variant hover:bg-outline-variant/20'
                  : 'bg-secondary text-white hover:bg-secondary/90'
              } transition-colors`}>
                {stripeConnected ? 'Manage' : 'Connect'}
              </button>
            </div>

            {stripeConnected && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-surface-container-low text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total Processed</p>
                  <p className="text-lg font-headline font-bold text-on-surface mt-1">€89,400</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">This Month</p>
                  <p className="text-lg font-headline font-bold text-emerald-600 mt-1">€12,680</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Pending</p>
                  <p className="text-lg font-headline font-bold text-amber-600 mt-1">€3,240</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Accepted Methods</h4>
              {[
                { method: 'Credit / Debit Card', enabled: true },
                { method: 'Apple Pay / Google Pay', enabled: true },
                { method: 'SEPA Direct Debit', enabled: false },
                { method: 'Bank Transfer (manual)', enabled: false },
              ].map((m) => (
                <div key={m.method} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                  <span className="text-sm text-on-surface">{m.method}</span>
                  {m.enabled ? (
                    <ToggleRight className="w-6 h-6 text-secondary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deposit & Schedule */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Deposit Requirements</h3>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <span className="text-sm text-on-surface">Require Deposit</span>
                <button onClick={() => setDepositRequired(!depositRequired)}>
                  {depositRequired ? (
                    <ToggleRight className="w-6 h-6 text-secondary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                  )}
                </button>
              </div>

              {depositRequired && (
                <>
                  <div>
                    <label className="text-xs text-on-surface-variant block mb-1.5">Deposit Percentage</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        className="flex-1 accent-secondary"
                      />
                      <span className="text-sm font-semibold text-on-surface w-12 text-end">{depositPercent}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                      <span>10%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-on-surface-variant block mb-1.5">Remaining Balance Due</label>
                    <select
                      value={balanceDue}
                      onChange={(e) => setBalanceDue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                    >
                      <option value="immediately">Immediately at booking</option>
                      <option value="7_days">7 days before check-in</option>
                      <option value="14_days">14 days before check-in</option>
                      <option value="30_days">30 days before check-in</option>
                      <option value="checkin">On check-in day</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Payment Schedule Visual */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-on-surface">Payment Schedule Preview</h3>
              <p className="text-xs text-on-surface-variant">
                For a €1,000 booking made today (check-in Apr 26)
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-on-surface">Deposit (today)</p>
                      <p className="text-sm font-bold text-secondary">
                        €{depositRequired ? Math.round(1000 * depositPercent / 100) : 1000}
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-1.5">
                      <div
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${depositRequired ? depositPercent : 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {depositRequired && depositPercent < 100 && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-on-surface">
                          Balance (
                          {balanceDue === 'immediately' && 'immediately'}
                          {balanceDue === '7_days' && '7 days before'}
                          {balanceDue === '14_days' && '14 days before'}
                          {balanceDue === '30_days' && '30 days before'}
                          {balanceDue === 'checkin' && 'on check-in'}
                          )
                        </p>
                        <p className="text-sm font-bold text-amber-600">
                          €{1000 - Math.round(1000 * depositPercent / 100)}
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-1.5">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${100 - depositPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: SEO & Marketing
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meta Tags */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-semibold text-on-surface">Meta Tags</h3>
            </div>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1.5">Page Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">{seoTitle.length}/60 characters</p>
            </div>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1.5">Meta Description</label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">{seoDescription.length}/160 characters</p>
            </div>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1.5">OG Image URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                />
                <button className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors">
                  <Image className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Google Preview */}
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Google Preview</p>
              <div>
                <p className="text-sm text-blue-600 font-medium truncate">{seoTitle || 'Page Title'}</p>
                <p className="text-xs text-emerald-700 mt-0.5">book.sivanmanagment.com</p>
                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                  {seoDescription || 'Meta description will appear here...'}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics & Tracking */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Google Analytics</h3>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Measurement ID</label>
                <input
                  type="text"
                  value={gaId}
                  onChange={(e) => setGaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm font-mono"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                gaId ? 'bg-emerald-500/[0.06] border border-emerald-500/20' : 'bg-amber-500/[0.06] border border-amber-500/20'
              }`}>
                {gaId ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-emerald-700">Analytics tracking is active</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">No tracking configured</p>
                  </>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">UTM Tracking</h3>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Default Source</label>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Default Medium</label>
                <input
                  type="text"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Active Campaign</label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface text-sm"
                />
              </div>

              {/* Generated URL Preview */}
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1.5">Generated Link</p>
                <code className="text-[11px] text-secondary font-mono break-all">
                  https://book.sivanmanagment.com?utm_source={utmSource}&utm_medium={utmMedium}&utm_campaign={utmCampaign}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://book.sivanmanagment.com?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`,
                    );
                    toast.success('UTM link copied');
                  }}
                  className="flex items-center gap-1 mt-2 text-[10px] text-secondary font-medium hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Bookings Table ───────────────────────────────────── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Recent Direct Bookings</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Last 30 days activity</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary bg-secondary/10 hover:bg-secondary/15 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Guest</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Property</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Check-in</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Check-out</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Amount</th>
                <th className="text-start px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Source</th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-outline-variant/10 hover:bg-secondary/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-secondary font-semibold">{booking.id}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-on-surface">{booking.guestName}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{booking.property}</td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-3 font-semibold text-on-surface">€{booking.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-on-surface-variant">{booking.source}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
