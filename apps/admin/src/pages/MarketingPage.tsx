import { useState } from 'react';
import {
  Megaphone, Mail, MessageSquare, Globe, BarChart3,
  Plus, Send, Eye, MousePointerClick, Users, Calendar,
  TrendingUp, Target, Zap, ExternalLink, Copy, Check,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type Campaign = {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'push';
  status: 'draft' | 'active' | 'paused' | 'completed';
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  scheduledAt?: string;
  createdAt: string;
};

const campaigns: Campaign[] = [
  {
    id: '1', name: 'Summer 2026 Early Bird', type: 'email', status: 'active',
    audience: 1250, sent: 1180, opened: 542, clicked: 189, converted: 34,
    scheduledAt: '2026-03-15', createdAt: '2026-03-10',
  },
  {
    id: '2', name: 'Easter Weekend Special', type: 'email', status: 'completed',
    audience: 890, sent: 856, opened: 412, clicked: 156, converted: 28,
    createdAt: '2026-03-28',
  },
  {
    id: '3', name: 'Last Minute Deals - May', type: 'sms', status: 'active',
    audience: 620, sent: 605, opened: 580, clicked: 98, converted: 15,
    createdAt: '2026-04-01',
  },
  {
    id: '4', name: 'Returning Guest Discount', type: 'email', status: 'draft',
    audience: 340, sent: 0, opened: 0, clicked: 0, converted: 0,
    createdAt: '2026-04-08',
  },
  {
    id: '5', name: 'Instagram Crete Highlights', type: 'social', status: 'active',
    audience: 5200, sent: 12, opened: 3400, clicked: 890, converted: 42,
    createdAt: '2026-04-05',
  },
  {
    id: '6', name: 'New Property Alert', type: 'push', status: 'completed',
    audience: 1800, sent: 1750, opened: 980, clicked: 234, converted: 18,
    createdAt: '2026-03-20',
  },
];

const performanceData = [
  { month: 'Jan', directBookings: 12, otaBookings: 45, conversionRate: 2.1 },
  { month: 'Feb', directBookings: 18, otaBookings: 42, conversionRate: 2.8 },
  { month: 'Mar', directBookings: 24, otaBookings: 38, conversionRate: 3.5 },
  { month: 'Apr', directBookings: 31, otaBookings: 35, conversionRate: 4.2 },
];

const kpis = [
  { label: 'Total Campaigns', value: '24', change: '+6', trend: 'up', icon: Megaphone },
  { label: 'Email List Size', value: '3,450', change: '+340', trend: 'up', icon: Users },
  { label: 'Avg Open Rate', value: '38.2%', change: '+4.1%', trend: 'up', icon: Eye },
  { label: 'Direct Booking %', value: '42%', change: '+8%', trend: 'up', icon: Target },
];

const statusColors: Record<string, string> = {
  draft: 'bg-[#1a1a1a] text-on-surface-variant',
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-blue-500/10 text-blue-400',
};

const typeIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  social: Globe,
  push: Zap,
};

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'audience'>('campaigns');
  const [copied, setCopied] = useState(false);

  const bookingLink = 'https://book.sivanmanagment.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Marketing</h1>
          <p className="text-sm text-on-surface-variant mt-1">Campaigns, audience, and direct booking optimization</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-secondary" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">{kpi.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Direct Booking Link */}
      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Direct Booking Link</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Share with guests to bypass OTA commissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-secondary font-mono">
              {bookingLink}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct vs OTA Bookings */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
          <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Direct vs OTA Bookings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="directBookings" fill="#6b38d4" radius={[4, 4, 0, 0]} name="Direct" />
              <Bar dataKey="otaBookings" fill="#2a2a2a" radius={[4, 4, 0, 0]} name="OTA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rate Trend */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
          <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Conversion Rate Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="conversionRate" stroke="#6b38d4" strokeWidth={2} dot={{ fill: '#6b38d4', r: 4 }} name="Conv. Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-container-low w-fit">
        {(['campaigns', 'templates', 'audience'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      {activeTab === 'campaigns' && (
        <div className="rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline/5">
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Sent</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Open Rate</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">CTR</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const TypeIcon = typeIcons[c.type] || Mail;
                const openRate = c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : '—';
                const ctr = c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : '—';
                return (
                  <tr key={c.id} className="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-on-surface">{c.name}</p>
                      <p className="text-xs text-on-surface-variant">{c.createdAt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span className="text-xs text-on-surface-variant capitalize">{c.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface">{c.sent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface">{openRate}%</td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface">{ctr}%</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-secondary">{c.converted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Welcome Email', desc: 'Sent after booking confirmation', uses: 234 },
            { name: 'Check-in Instructions', desc: 'Sent 48h before arrival', uses: 189 },
            { name: 'Review Request', desc: 'Sent 24h after checkout', uses: 156 },
            { name: 'Early Bird Promo', desc: 'Season discount announcement', uses: 89 },
            { name: 'Returning Guest Offer', desc: 'Special rate for repeat guests', uses: 67 },
            { name: 'Last Minute Deal', desc: 'Fill vacant dates quickly', uses: 45 },
          ].map((tpl) => (
            <div key={tpl.name} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow hover:border-secondary/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-on-surface">{tpl.name}</p>
                  <p className="text-xs text-on-surface-variant">{tpl.desc}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Used {tpl.uses} times</p>
            </div>
          ))}
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { segment: 'All Guests', count: 3450, desc: 'Complete guest database' },
              { segment: 'Returning Guests', count: 890, desc: 'Booked 2+ times' },
              { segment: 'High Value', count: 340, desc: 'Spent €5,000+ lifetime' },
              { segment: 'Newsletter Subscribers', count: 2100, desc: 'Opted in for marketing' },
              { segment: 'VIP Stars', count: 45, desc: 'Loyalty program members' },
              { segment: 'Inactive (6mo+)', count: 520, desc: 'No booking in 6 months' },
            ].map((seg) => (
              <div key={seg.segment} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-on-surface">{seg.segment}</p>
                  <Users className="w-4 h-4 text-on-surface-variant" />
                </div>
                <p className="text-2xl font-headline font-bold text-on-surface">{seg.count.toLocaleString()}</p>
                <p className="text-xs text-on-surface-variant mt-1">{seg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
