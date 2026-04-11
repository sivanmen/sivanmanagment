import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Link2,
  Copy,
  Gift,
  DollarSign,
  TrendingUp,
  Award,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Mail,
  MessageSquare,
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
} from 'recharts';
import { toast } from 'sonner';

type ReferralStatus = 'active' | 'pending' | 'converted' | 'expired';

interface Referral {
  id: string;
  referredName: string;
  email: string;
  date: string;
  status: ReferralStatus;
  properties?: number;
  commission?: number;
  conversionDate?: string;
}

interface CommissionEntry {
  id: string;
  referralName: string;
  amount: number;
  date: string;
  type: 'signup_bonus' | 'monthly_commission' | 'tier_bonus';
  status: 'paid' | 'pending';
}

const statusConfig: Record<ReferralStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'bg-success/10 text-success', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  converted: { label: 'Converted', color: 'bg-secondary/10 text-secondary', icon: Award },
  expired: { label: 'Expired', color: 'bg-outline-variant/20 text-on-surface-variant', icon: XCircle },
};

const affiliateData = {
  referralCode: 'SIVAN-CRETE-2026',
  referralLink: 'https://sivan.pm/ref/SIVAN-CRETE-2026',
  tier: 'Gold Partner',
  totalReferrals: 12,
  activeReferrals: 8,
  totalEarnings: 4850,
  pendingEarnings: 620,
  conversionRate: 66.7,
  lifetimeValue: 28400,
};

const demoReferrals: Referral[] = [
  {
    id: 'REF-001',
    referredName: 'Marina Stavros',
    email: 'marina.s@email.com',
    date: '2026-03-15',
    status: 'converted',
    properties: 2,
    commission: 450,
    conversionDate: '2026-03-22',
  },
  {
    id: 'REF-002',
    referredName: 'Giorgos Papadopoulos',
    email: 'g.papa@email.com',
    date: '2026-03-01',
    status: 'active',
    properties: 3,
    commission: 620,
    conversionDate: '2026-03-08',
  },
  {
    id: 'REF-003',
    referredName: 'Helena Nikos',
    email: 'helena.n@email.com',
    date: '2026-02-20',
    status: 'pending',
  },
  {
    id: 'REF-004',
    referredName: 'Dimitris Katsaros',
    email: 'd.katsaros@email.com',
    date: '2026-02-10',
    status: 'converted',
    properties: 1,
    commission: 280,
    conversionDate: '2026-02-18',
  },
  {
    id: 'REF-005',
    referredName: 'Anna Christodoulou',
    email: 'anna.c@email.com',
    date: '2026-01-28',
    status: 'active',
    properties: 4,
    commission: 890,
    conversionDate: '2026-02-05',
  },
  {
    id: 'REF-006',
    referredName: 'Nikos Antonakis',
    email: 'n.antonakis@email.com',
    date: '2026-01-15',
    status: 'expired',
  },
  {
    id: 'REF-007',
    referredName: 'Irene Vlachos',
    email: 'irene.v@email.com',
    date: '2025-12-20',
    status: 'converted',
    properties: 2,
    commission: 380,
    conversionDate: '2025-12-30',
  },
  {
    id: 'REF-008',
    referredName: 'Kostas Manolis',
    email: 'kostas.m@email.com',
    date: '2025-12-05',
    status: 'active',
    properties: 1,
    commission: 210,
    conversionDate: '2025-12-12',
  },
];

const commissionHistory: CommissionEntry[] = [
  { id: 'COM-001', referralName: 'Marina Stavros', amount: 250, date: '2026-03-22', type: 'signup_bonus', status: 'paid' },
  { id: 'COM-002', referralName: 'Marina Stavros', amount: 200, date: '2026-04-01', type: 'monthly_commission', status: 'pending' },
  { id: 'COM-003', referralName: 'Giorgos Papadopoulos', amount: 250, date: '2026-03-08', type: 'signup_bonus', status: 'paid' },
  { id: 'COM-004', referralName: 'Giorgos Papadopoulos', amount: 370, date: '2026-04-01', type: 'monthly_commission', status: 'pending' },
  { id: 'COM-005', referralName: 'Dimitris Katsaros', amount: 250, date: '2026-02-18', type: 'signup_bonus', status: 'paid' },
  { id: 'COM-006', referralName: 'Anna Christodoulou', amount: 250, date: '2026-02-05', type: 'signup_bonus', status: 'paid' },
  { id: 'COM-007', referralName: 'Anna Christodoulou', amount: 640, date: '2026-04-01', type: 'monthly_commission', status: 'pending' },
  { id: 'COM-008', referralName: 'Tier Bonus (Q1 2026)', amount: 500, date: '2026-04-01', type: 'tier_bonus', status: 'paid' },
];

const monthlyCommissions = [
  { month: 'Oct', earned: 320 },
  { month: 'Nov', earned: 480 },
  { month: 'Dec', earned: 590 },
  { month: 'Jan', earned: 710 },
  { month: 'Feb', earned: 530 },
  { month: 'Mar', earned: 950 },
];

const referralStatusBreakdown = [
  { name: 'Active', value: 4, color: '#22c55e' },
  { name: 'Converted', value: 3, color: '#6b38d4' },
  { name: 'Pending', value: 1, color: '#eab308' },
  { name: 'Expired', value: 1, color: '#666666' },
];

const tiers = [
  { name: 'Starter', min: 0, max: 3, commission: '5%', bonus: '$100', color: '#666' },
  { name: 'Silver', min: 3, max: 6, commission: '8%', bonus: '$200', color: '#94a3b8' },
  { name: 'Gold', min: 6, max: 12, commission: '12%', bonus: '$250', color: '#eab308' },
  { name: 'Platinum', min: 12, max: 999, commission: '15%', bonus: '$500', color: '#6b38d4' },
];

export default function AffiliatePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'referrals' | 'commissions'>('referrals');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(affiliateData.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateData.referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Join Sivan Property Management');
    const body = encodeURIComponent(
      `I've been using Sivan PM for managing my properties in Crete and I love it! Use my referral link to get started with a special bonus:\n\n${affiliateData.referralLink}\n\nOr use code: ${affiliateData.referralCode}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const currentTierIndex = tiers.findIndex((t) => t.name === 'Gold');

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Referral Program
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Affiliate Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Refer property owners and earn commissions on their managed revenue
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-fixed ambient-shadow">
          <Award className="w-5 h-5 text-secondary" />
          <div>
            <p className="text-[10px] text-secondary/70 uppercase tracking-wider font-semibold">Partner Tier</p>
            <span className="text-sm font-headline font-bold text-secondary">{affiliateData.tier}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Referrals</p>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">{affiliateData.totalReferrals}</p>
          <p className="text-xs text-on-surface-variant mt-1">{affiliateData.activeReferrals} active</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Conversion Rate</p>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">{affiliateData.conversionRate}%</p>
          <p className="text-xs text-success mt-1">Above average</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Earned</p>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">${affiliateData.totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-on-surface-variant mt-1">${affiliateData.pendingEarnings} pending</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Lifetime Value</p>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface">${affiliateData.lifetimeValue.toLocaleString()}</p>
          <p className="text-xs text-on-surface-variant mt-1">Total referred portfolio value</p>
        </div>
      </div>

      {/* Referral Code + Share Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referral Code Card */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Your Referral Link</h3>
          </div>

          <div className="space-y-3">
            {/* Referral Code */}
            <div>
              <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Referral Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high font-mono text-sm text-secondary font-medium">
                  {affiliateData.referralCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high hover:bg-surface-container-high transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Referral Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface-variant truncate">
                  {affiliateData.referralLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high hover:bg-surface-container-high transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleShareEmail}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity"
              >
                <Mail className="w-4 h-4" />
                Share via Email
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low border border-surface-container-high hover:bg-surface-container-high transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Link
              </button>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Partner Tiers</h3>
          </div>

          <div className="space-y-3">
            {tiers.map((tier, idx) => {
              const isCurrent = idx === currentTierIndex;
              const isAchieved = idx < currentTierIndex;
              const isNext = idx === currentTierIndex + 1;

              return (
                <div
                  key={tier.name}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-secondary/10 border border-secondary/30'
                      : isAchieved
                        ? 'bg-surface-container-low'
                        : 'bg-surface-container-low/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${tier.color}20` }}
                    >
                      <Award className="w-4 h-4" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-secondary' : 'text-on-surface'}`}>
                          {tier.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary">
                            Current
                          </span>
                        )}
                        {isAchieved && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        {tier.min}-{tier.max === 999 ? '...' : tier.max} referrals
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-on-surface">{tier.commission}</p>
                    <p className="text-xs text-on-surface-variant">+ {tier.bonus} bonus</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-surface-container-low">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-on-surface-variant">Progress to Platinum</span>
              <span className="text-xs font-semibold text-secondary">
                {affiliateData.totalReferrals}/12 referrals
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-container transition-all duration-500"
                style={{ width: `${(affiliateData.totalReferrals / 12) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Commissions Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Monthly Commissions</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCommissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`$${value}`, 'Earned']}
                />
                <Bar dataKey="earned" fill="#6b38d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referral Status Breakdown */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">Status Breakdown</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referralStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="none"
                >
                  {referralStatusBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {referralStatusBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-on-surface-variant">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Referrals / Commissions */}
      <div>
        <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 w-fit mb-4">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'referrals'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Referrals ({demoReferrals.length})
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'commissions'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Commissions ({commissionHistory.length})
          </button>
        </div>

        {/* Referrals Table */}
        {activeTab === 'referrals' && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Referred Owner</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Date</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Properties</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {demoReferrals.map((referral) => {
                    const StatusIcon = statusConfig[referral.status].icon;
                    return (
                      <tr
                        key={referral.id}
                        className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-on-surface">{referral.referredName}</p>
                            <p className="text-xs text-on-surface-variant">{referral.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-xs text-on-surface-variant">
                            {new Date(referral.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[referral.status].color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[referral.status].label}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {referral.properties ? (
                            <span className="text-sm text-on-surface">{referral.properties}</span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {referral.commission ? (
                            <span className="text-sm font-semibold text-success">${referral.commission}</span>
                          ) : (
                            <span className="text-xs text-on-surface-variant">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commissions Table */}
        {activeTab === 'commissions' && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Description</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Date</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Type</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionHistory.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm text-on-surface font-medium">{entry.referralName}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-on-surface-variant">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          entry.type === 'signup_bonus'
                            ? 'bg-secondary/10 text-secondary'
                            : entry.type === 'tier_bonus'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}>
                          {entry.type === 'signup_bonus' ? 'Signup Bonus' : entry.type === 'tier_bonus' ? 'Tier Bonus' : 'Monthly'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-success">+${entry.amount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          entry.status === 'paid'
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {entry.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">How the Affiliate Program Works</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-container-low">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5 text-secondary" />
            </div>
            <h4 className="text-sm font-semibold text-on-surface mb-1">1. Share Your Link</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Share your unique referral code or link with property owners in Crete who need management services.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container-low">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <h4 className="text-sm font-semibold text-on-surface mb-1">2. They Sign Up</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When a referred owner signs up and onboards their first property, you earn a signup bonus instantly.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container-low">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <h4 className="text-sm font-semibold text-on-surface mb-1">3. Earn Commissions</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Receive ongoing monthly commissions based on the revenue generated from referred properties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
