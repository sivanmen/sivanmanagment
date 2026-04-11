import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  TrendingUp,
  DollarSign,
  Percent,
  Plus,
  Search,
  Copy,
  ExternalLink,
  Link2,
  Check,
  CreditCard,
  Settings,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Mail,
  Globe,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ─── Types ─────────────────────────────────────────────────────── */

type AffiliateStatus = 'active' | 'pending' | 'suspended';
type Tab = 'affiliates' | 'referrals' | 'payouts' | 'settings';
type PayoutStatus = 'paid' | 'pending' | 'processing';
type ReferralStatus = 'visited' | 'signed_up' | 'booked' | 'completed';

interface Affiliate {
  id: string;
  name: string;
  code: string;
  email: string;
  type: string;
  referrals: number;
  bookingsGenerated: number;
  revenue: number;
  commissionRate: number;
  commissionEarned: number;
  status: AffiliateStatus;
  joinDate: string;
}

interface Referral {
  id: string;
  affiliateId: string;
  affiliateName: string;
  visitorIp: string;
  visitDate: string;
  signUpDate?: string;
  bookingDate?: string;
  bookingValue?: number;
  status: ReferralStatus;
  guestName?: string;
}

interface Payout {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  date: string;
  method: string;
  status: PayoutStatus;
  period: string;
}

/* ─── Status styles ─────────────────────────────────────────────── */

const affiliateStatusStyles: Record<AffiliateStatus, string> = {
  active: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  suspended: 'bg-error/10 text-error',
};

const payoutStatusStyles: Record<PayoutStatus, string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-secondary/10 text-secondary',
};

const referralStatusStyles: Record<ReferralStatus, string> = {
  visited: 'bg-outline-variant/20 text-on-surface-variant',
  signed_up: 'bg-secondary/10 text-secondary',
  booked: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

/* ─── Demo Data ─────────────────────────────────────────────────── */

const demoAffiliates: Affiliate[] = [
  {
    id: '1', name: 'Travel Greece Partners', code: 'TGP-2024', email: 'partners@travelgreece.com',
    type: 'Travel Blogger', referrals: 245, bookingsGenerated: 68, revenue: 48600,
    commissionRate: 8, commissionEarned: 3888, status: 'active', joinDate: '2024-03-10',
  },
  {
    id: '2', name: 'Crete Luxury Living', code: 'CLL-2024', email: 'info@creteluxury.com',
    type: 'Local Agent', referrals: 182, bookingsGenerated: 54, revenue: 41200,
    commissionRate: 10, commissionEarned: 4120, status: 'active', joinDate: '2024-06-15',
  },
  {
    id: '3', name: 'Mediterranean Homes Blog', code: 'MHB-2024', email: 'editor@medhomes.blog',
    type: 'Travel Blogger', referrals: 128, bookingsGenerated: 32, revenue: 22400,
    commissionRate: 7, commissionEarned: 1568, status: 'active', joinDate: '2024-09-01',
  },
  {
    id: '4', name: 'Greek Islands Guide', code: 'GIG-2025', email: 'contact@greekislands.guide',
    type: 'Local Agent', referrals: 65, bookingsGenerated: 14, revenue: 9800,
    commissionRate: 8, commissionEarned: 784, status: 'pending', joinDate: '2025-01-20',
  },
  {
    id: '5', name: 'Euro Property Network', code: 'EPN-2025', email: 'affiliates@europrop.net',
    type: 'Partner Hotel', referrals: 38, bookingsGenerated: 8, revenue: 5600,
    commissionRate: 6, commissionEarned: 336, status: 'suspended', joinDate: '2025-04-05',
  },
  {
    id: '6', name: 'Santorini Stays Hub', code: 'SSH-2025', email: 'hello@santorinistays.com',
    type: 'Partner Hotel', referrals: 92, bookingsGenerated: 28, revenue: 19600,
    commissionRate: 9, commissionEarned: 1764, status: 'active', joinDate: '2025-02-14',
  },
];

const demoReferrals: Referral[] = [
  { id: 'R1', affiliateId: '1', affiliateName: 'Travel Greece Partners', visitorIp: '192.168.1.***', visitDate: '2026-04-08', signUpDate: '2026-04-08', bookingDate: '2026-04-09', bookingValue: 1200, status: 'completed', guestName: 'Hans Mueller' },
  { id: 'R2', affiliateId: '2', affiliateName: 'Crete Luxury Living', visitorIp: '10.0.0.***', visitDate: '2026-04-09', signUpDate: '2026-04-09', bookingDate: '2026-04-10', bookingValue: 850, status: 'booked', guestName: 'Sophie Dubois' },
  { id: 'R3', affiliateId: '1', affiliateName: 'Travel Greece Partners', visitorIp: '172.16.0.***', visitDate: '2026-04-10', signUpDate: '2026-04-10', status: 'signed_up', guestName: 'James Wilson' },
  { id: 'R4', affiliateId: '6', affiliateName: 'Santorini Stays Hub', visitorIp: '192.168.2.***', visitDate: '2026-04-10', status: 'visited' },
  { id: 'R5', affiliateId: '3', affiliateName: 'Mediterranean Homes Blog', visitorIp: '10.1.1.***', visitDate: '2026-04-11', signUpDate: '2026-04-11', bookingDate: '2026-04-11', bookingValue: 2100, status: 'completed', guestName: 'Maria Rossi' },
  { id: 'R6', affiliateId: '2', affiliateName: 'Crete Luxury Living', visitorIp: '172.16.1.***', visitDate: '2026-04-11', signUpDate: '2026-04-11', status: 'signed_up', guestName: 'Erik Johansson' },
  { id: 'R7', affiliateId: '4', affiliateName: 'Greek Islands Guide', visitorIp: '192.168.3.***', visitDate: '2026-04-11', status: 'visited' },
  { id: 'R8', affiliateId: '6', affiliateName: 'Santorini Stays Hub', visitorIp: '10.2.0.***', visitDate: '2026-04-11', signUpDate: '2026-04-11', bookingDate: '2026-04-11', bookingValue: 1450, status: 'booked', guestName: 'Anna Kowalska' },
];

const demoPayouts: Payout[] = [
  { id: 'P1', affiliateId: '1', affiliateName: 'Travel Greece Partners', amount: 1240, date: '2026-04-01', method: 'Bank Transfer', status: 'paid', period: 'Mar 2026' },
  { id: 'P2', affiliateId: '2', affiliateName: 'Crete Luxury Living', amount: 1560, date: '2026-04-01', method: 'Bank Transfer', status: 'paid', period: 'Mar 2026' },
  { id: 'P3', affiliateId: '6', affiliateName: 'Santorini Stays Hub', amount: 890, date: '2026-04-01', method: 'PayPal', status: 'paid', period: 'Mar 2026' },
  { id: 'P4', affiliateId: '3', affiliateName: 'Mediterranean Homes Blog', amount: 720, date: '2026-04-01', method: 'PayPal', status: 'paid', period: 'Mar 2026' },
  { id: 'P5', affiliateId: '1', affiliateName: 'Travel Greece Partners', amount: 1380, date: '2026-04-15', method: 'Bank Transfer', status: 'processing', period: 'Apr 2026 (partial)' },
  { id: 'P6', affiliateId: '2', affiliateName: 'Crete Luxury Living', amount: 980, date: '2026-04-15', method: 'Bank Transfer', status: 'pending', period: 'Apr 2026 (partial)' },
  { id: 'P7', affiliateId: '4', affiliateName: 'Greek Islands Guide', amount: 340, date: '2026-04-15', method: 'PayPal', status: 'pending', period: 'Apr 2026 (partial)' },
];

const referralTrendData = [
  { month: 'Nov', referrals: 68, bookings: 14, revenue: 9800 },
  { month: 'Dec', referrals: 92, bookings: 22, revenue: 15400 },
  { month: 'Jan', referrals: 78, bookings: 18, revenue: 12600 },
  { month: 'Feb', referrals: 105, bookings: 28, revenue: 19600 },
  { month: 'Mar', referrals: 134, bookings: 38, revenue: 26600 },
  { month: 'Apr', referrals: 156, bookings: 45, revenue: 31500 },
];

/* ─── Helpers ───────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(value: number): string {
  return `\u20AC${value.toLocaleString()}`;
}

/* ─── Custom Recharts Tooltip ───────────────────────────────────── */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 ambient-shadow border border-outline/5 text-xs">
      <p className="font-semibold text-on-surface mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Tabs config ───────────────────────────────────────────────── */

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'affiliates', label: 'Affiliates', icon: Users },
  { id: 'referrals', label: 'Referrals', icon: UserPlus },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/* ─── Component ─────────────────────────────────────────────────── */

export default function AffiliatesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('affiliates');
  const [search, setSearch] = useState('');
  const [affiliates] = useState(demoAffiliates);
  const [copiedLink, setCopiedLink] = useState(false);

  // Commission settings state
  const [commissionSettings, setCommissionSettings] = useState({
    defaultRate: 8,
    bloggerRate: 7,
    agentRate: 10,
    hotelRate: 9,
    cookieDays: 30,
    minPayout: 50,
    payoutFrequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
  });

  const filteredAffiliates = affiliates.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
  });

  const totalAffiliates = affiliates.length;
  const activeReferrals = demoReferrals.filter((r) => r.status !== 'completed').length;
  const totalRevenue = affiliates.reduce((sum, a) => sum + a.revenue, 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + a.commissionEarned, 0);

  const affiliateLink = 'https://book.yourpms.com/?ref=YOUR_CODE';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopiedLink(true);
    toast.success('Affiliate link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const stats = [
    { label: 'Total Affiliates', value: totalAffiliates, icon: Users, color: 'bg-secondary/10', iconColor: 'text-secondary', change: '+2 this month', up: true },
    { label: 'Active Referrals', value: activeReferrals, icon: UserPlus, color: 'bg-success/10', iconColor: 'text-success', change: '+12% vs last month', up: true },
    { label: 'Revenue Generated', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-warning/10', iconColor: 'text-warning', change: '+18% vs last month', up: true },
    { label: 'Commission Paid', value: formatCurrency(totalCommission), icon: Percent, color: 'bg-secondary/10', iconColor: 'text-secondary', change: '+15% vs last month', up: true },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('affiliates.label', 'Partner Program')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('affiliates.title', 'Affiliates Program')}
          </h1>
        </div>
        <button
          onClick={() => toast.info('Add affiliate form coming soon')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('affiliates.addAffiliate', 'Add Affiliate')}</span>
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {stat.up ? (
                <ArrowUpRight className="w-3 h-3 text-success" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-error" />
              )}
              <span className="text-[10px] text-on-surface-variant">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Referral Trend Chart ────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Referral Performance</p>
            <h2 className="font-headline text-lg font-bold text-on-surface">Last 6 Months</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary inline-block" /> Referrals</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Bookings</span>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={referralTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientReferrals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary, #7c5cfc)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-secondary, #7c5cfc)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success, #22c55e)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success, #22c55e)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #333)" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant, #999)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant, #999)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="referrals" name="referrals" stroke="var(--color-secondary, #7c5cfc)" fill="url(#gradientReferrals)" strokeWidth={2} />
              <Area type="monotone" dataKey="bookings" name="bookings" stroke="var(--color-success, #22c55e)" fill="url(#gradientBookings)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Your Affiliate Link ─────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-secondary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Your Affiliate Link</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-low border border-outline/5">
            <Globe className="w-4 h-4 text-on-surface-variant shrink-0" />
            <code className="text-sm text-secondary font-mono truncate flex-1">{affiliateLink}</code>
          </div>
          <button
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              copiedLink
                ? 'bg-success/10 text-success'
                : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
            }`}
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          Share this link with partners. Replace <code className="text-secondary">YOUR_CODE</code> with the affiliate's unique code.
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-surface-container-lowest text-on-surface ambient-shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Affiliates ─────────────────────────────────────── */}
      {activeTab === 'affiliates' && (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name, code or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Partner</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Code</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Referrals</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Bookings</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Revenue</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Rate</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Status</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b border-outline/5 last:border-0 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-on-surface">{affiliate.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{affiliate.type} &middot; {affiliate.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono font-semibold text-secondary bg-secondary/5 px-2 py-1 rounded">
                            {affiliate.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(affiliate.code)}
                            className="p-1 rounded text-on-surface-variant hover:text-secondary transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end text-on-surface">{affiliate.referrals}</td>
                      <td className="px-4 py-3 text-end text-on-surface font-medium">{affiliate.bookingsGenerated}</td>
                      <td className="px-4 py-3 text-end font-semibold text-secondary">{formatCurrency(affiliate.revenue)}</td>
                      <td className="px-4 py-3 text-end text-on-surface">{affiliate.commissionRate}%</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${affiliateStatusStyles[affiliate.status]}`}>
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(affiliate.joinDate)}</td>
                    </tr>
                  ))}
                  {filteredAffiliates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                        {t('common.noData', 'No data available')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Referrals ──────────────────────────────────────── */}
      {activeTab === 'referrals' && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-outline/5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Referral Tracking</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Visitor to booking conversion flow</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/5">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Affiliate</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Guest</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Visit Date</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Sign Up</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Booking</th>
                  <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Value</th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-outline/5 last:border-0 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{ref.affiliateName}</td>
                    <td className="px-4 py-3 text-on-surface">{ref.guestName || <span className="text-on-surface-variant italic">Anonymous</span>}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(ref.visitDate)}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{ref.signUpDate ? formatDate(ref.signUpDate) : <span className="text-on-surface-variant/50">&mdash;</span>}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{ref.bookingDate ? formatDate(ref.bookingDate) : <span className="text-on-surface-variant/50">&mdash;</span>}</td>
                    <td className="px-4 py-3 text-end font-semibold text-secondary">{ref.bookingValue ? formatCurrency(ref.bookingValue) : <span className="text-on-surface-variant/50">&mdash;</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${referralStatusStyles[ref.status]}`}>
                        {ref.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Payouts ────────────────────────────────────────── */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          {/* Payout summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Total Paid</p>
              <p className="font-headline text-xl font-bold text-success">
                {formatCurrency(demoPayouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0))}
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Processing</p>
              <p className="font-headline text-xl font-bold text-secondary">
                {formatCurrency(demoPayouts.filter((p) => p.status === 'processing').reduce((s, p) => s + p.amount, 0))}
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Pending</p>
              <p className="font-headline text-xl font-bold text-warning">
                {formatCurrency(demoPayouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0))}
              </p>
            </div>
          </div>

          {/* Payouts table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Date</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Affiliate</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Period</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Method</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Amount</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {demoPayouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-outline/5 last:border-0 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(payout.date)}</td>
                      <td className="px-4 py-3 font-medium text-on-surface">{payout.affiliateName}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{payout.period}</td>
                      <td className="px-4 py-3 text-xs text-on-surface">{payout.method}</td>
                      <td className="px-4 py-3 text-end font-semibold text-secondary">{formatCurrency(payout.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${payoutStatusStyles[payout.status]}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Settings ───────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Commission Structure Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Commission */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-secondary" />
                <h3 className="font-headline text-sm font-bold text-on-surface">Default Commission Rate</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">Base Rate (%)</label>
                  <input
                    type="number"
                    value={commissionSettings.defaultRate}
                    onChange={(e) => setCommissionSettings({ ...commissionSettings, defaultRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-xs text-on-surface-variant">Applied to all new affiliates unless overridden by type-specific rates.</p>
              </div>
            </div>

            {/* Type-specific Rates */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <h3 className="font-headline text-sm font-bold text-on-surface">Type-Specific Rates</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Travel Bloggers</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={commissionSettings.bloggerRate}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, bloggerRate: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                    <span className="text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Local Agents</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={commissionSettings.agentRate}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, agentRate: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                    <span className="text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Partner Hotels</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={commissionSettings.hotelRate}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, hotelRate: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/30"
                    />
                    <span className="text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookie & Attribution */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-secondary" />
                <h3 className="font-headline text-sm font-bold text-on-surface">Cookie & Attribution</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">Cookie Duration (days)</label>
                  <input
                    type="number"
                    value={commissionSettings.cookieDays}
                    onChange={(e) => setCommissionSettings({ ...commissionSettings, cookieDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-xs text-on-surface-variant">How long after a click the referral is attributed to the affiliate.</p>
              </div>
            </div>

            {/* Payout Configuration */}
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-secondary" />
                <h3 className="font-headline text-sm font-bold text-on-surface">Payout Configuration</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">Minimum Payout ({'\u20AC'})</label>
                  <input
                    type="number"
                    value={commissionSettings.minPayout}
                    onChange={(e) => setCommissionSettings({ ...commissionSettings, minPayout: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">Payout Frequency</label>
                  <select
                    value={commissionSettings.payoutFrequency}
                    onChange={(e) => setCommissionSettings({ ...commissionSettings, payoutFrequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline/5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={() => toast.success('Commission settings saved successfully')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
