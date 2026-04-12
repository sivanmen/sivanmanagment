import { useState } from 'react';
import {
  Megaphone, Mail, MessageSquare, Globe, BarChart3,
  Plus, Send, Eye, MousePointerClick, Users, Calendar,
  TrendingUp, TrendingDown, Target, Zap, ExternalLink, Copy, Check,
  DollarSign, Percent, Search, Hash, ArrowUpRight, ArrowDownRight,
  Instagram, Facebook, Play, Heart, Share2, MessageCircle,
  Star, Award, Gift, Clock, Filter, RefreshCw, ChevronDown,
  Bookmark, Link2, FileText, Image, Video, Pause, MoreVertical,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'campaigns' | 'email' | 'social' | 'seo' | 'analytics';

type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft';
type CampaignType = 'discount' | 'loyalty' | 'dynamic' | 'referral' | 'email' | 'social' | 'sms';

interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  startDate: string;
  endDate?: string;
}

interface EmailCampaign {
  id: string;
  subject: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  sentDate: string;
  status: 'sent' | 'scheduled' | 'draft';
}

interface SocialAccount {
  platform: 'instagram' | 'facebook' | 'tiktok';
  handle: string;
  followers: number;
  followersChange: number;
  posts: number;
  engagement: number;
  reach: number;
}

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok';
  content: string;
  type: 'image' | 'video' | 'carousel' | 'reel';
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  postedAt: string;
}

interface SEOKeyword {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

interface ContentCalendarItem {
  id: string;
  date: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'blog';
  title: string;
  type: 'image' | 'video' | 'carousel' | 'reel' | 'article';
  status: 'scheduled' | 'draft' | 'published';
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const overviewKPIs = [
  { label: 'Total Leads', value: '1,847', change: '+23%', trend: 'up' as const, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Conversion Rate', value: '4.8%', change: '+0.6%', trend: 'up' as const, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Marketing Spend', value: '€3,240', change: '-8%', trend: 'down' as const, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'ROI', value: '340%', change: '+45%', trend: 'up' as const, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Website Visitors', value: '12,450', change: '+18%', trend: 'up' as const, icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: 'Direct Booking Rate', value: '42%', change: '+8%', trend: 'up' as const, icon: Bookmark, color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

const campaigns: MarketingCampaign[] = [
  {
    id: 'c1', name: 'Summer Early Bird 2026', description: '15% discount for early bookings (Jun-Sep)',
    type: 'discount', status: 'active', reach: 18500, impressions: 42300, clicks: 3840,
    conversions: 186, spend: 850, revenue: 28400, roi: 3241,
    startDate: '2026-02-01', endDate: '2026-05-31',
  },
  {
    id: 'c2', name: 'Returning Guest Loyalty', description: '10% off for past guests on next booking',
    type: 'loyalty', status: 'active', reach: 3420, impressions: 8900, clicks: 1240,
    conversions: 89, spend: 320, revenue: 14200, roi: 4337,
    startDate: '2026-01-15',
  },
  {
    id: 'c3', name: 'Last Minute Deals', description: 'Dynamic discounts for next 7 days availability',
    type: 'dynamic', status: 'active', reach: 9200, impressions: 21400, clicks: 2180,
    conversions: 67, spend: 480, revenue: 8900, roi: 1754,
    startDate: '2026-03-01',
  },
  {
    id: 'c4', name: 'Referral Program', description: '\u20ac50 credit per successful referral',
    type: 'referral', status: 'active', reach: 5800, impressions: 14200, clicks: 980,
    conversions: 42, spend: 2100, revenue: 12600, roi: 500,
    startDate: '2026-01-01',
  },
  {
    id: 'c5', name: 'Crete Experience Blog', description: 'Content marketing SEO for organic traffic',
    type: 'social', status: 'active', reach: 28000, impressions: 65000, clicks: 5200,
    conversions: 124, spend: 600, revenue: 18600, roi: 3000,
    startDate: '2025-11-01',
  },
  {
    id: 'c6', name: 'Easter Weekend Special', description: '20% off Easter week stays in Chania',
    type: 'discount', status: 'ended', reach: 12400, impressions: 28600, clicks: 2840,
    conversions: 156, spend: 720, revenue: 24800, roi: 3344,
    startDate: '2026-03-15', endDate: '2026-04-06',
  },
  {
    id: 'c7', name: 'Google Ads - Crete Villas', description: 'PPC campaign targeting villa rentals Crete',
    type: 'sms', status: 'paused', reach: 34000, impressions: 89000, clicks: 4200,
    conversions: 98, spend: 1200, revenue: 15400, roi: 1183,
    startDate: '2026-02-15',
  },
  {
    id: 'c8', name: 'Instagram Reels - Property Tours', description: 'Video tours of top properties',
    type: 'social', status: 'active', reach: 42000, impressions: 128000, clicks: 6800,
    conversions: 210, spend: 450, revenue: 31500, roi: 6900,
    startDate: '2026-01-10',
  },
];

const emailCampaigns: EmailCampaign[] = [
  { id: 'e1', subject: 'Early Bird Summer 2026 - Save 15%', sentCount: 2840, openRate: 42.3, clickRate: 12.8, unsubscribeRate: 0.3, sentDate: '2026-04-10', status: 'sent' },
  { id: 'e2', subject: 'New Property Alert: Beachfront Villa in Rethymno', sentCount: 3120, openRate: 48.6, clickRate: 18.4, unsubscribeRate: 0.1, sentDate: '2026-04-05', status: 'sent' },
  { id: 'e3', subject: 'Your Crete Adventure Awaits - Easter Specials', sentCount: 2650, openRate: 38.9, clickRate: 9.7, unsubscribeRate: 0.4, sentDate: '2026-03-28', status: 'sent' },
  { id: 'e4', subject: 'Guest Review: "Best Holiday Ever" + 10% Off', sentCount: 1890, openRate: 44.1, clickRate: 15.2, unsubscribeRate: 0.2, sentDate: '2026-03-20', status: 'sent' },
  { id: 'e5', subject: 'Last Chance: Spring Deals Ending Soon', sentCount: 2200, openRate: 35.6, clickRate: 8.9, unsubscribeRate: 0.5, sentDate: '2026-03-15', status: 'sent' },
  { id: 'e6', subject: 'Summer 2026 Guide: Best Beaches in Crete', sentCount: 0, openRate: 0, clickRate: 0, unsubscribeRate: 0, sentDate: '2026-04-15', status: 'scheduled' },
  { id: 'e7', subject: 'Exclusive: Secret Spots Only Locals Know', sentCount: 0, openRate: 0, clickRate: 0, unsubscribeRate: 0, sentDate: '', status: 'draft' },
];

const socialAccounts: SocialAccount[] = [
  { platform: 'instagram', handle: '@sivan_crete_villas', followers: 14200, followersChange: 840, posts: 342, engagement: 4.8, reach: 42000 },
  { platform: 'facebook', handle: 'Sivan Property Management', followers: 8600, followersChange: 320, posts: 218, engagement: 2.4, reach: 28000 },
  { platform: 'tiktok', handle: '@crete.stays', followers: 5400, followersChange: 1200, posts: 86, engagement: 8.2, reach: 68000 },
];

const socialPosts: SocialPost[] = [
  { id: 'sp1', platform: 'instagram', content: 'Sunset from Villa Elounda - pure magic', type: 'carousel', likes: 892, comments: 67, shares: 34, reach: 8400, postedAt: '2026-04-10' },
  { id: 'sp2', platform: 'tiktok', content: 'Morning routine at our beachfront villa', type: 'reel', likes: 2340, comments: 189, shares: 456, reach: 34000, postedAt: '2026-04-09' },
  { id: 'sp3', platform: 'instagram', content: 'Private pool tour - Villa Chania Heights', type: 'reel', likes: 1560, comments: 98, shares: 78, reach: 12400, postedAt: '2026-04-08' },
  { id: 'sp4', platform: 'facebook', content: 'New listing: 3BR apartment in Old Town Chania', type: 'image', likes: 234, comments: 45, shares: 89, reach: 5600, postedAt: '2026-04-07' },
  { id: 'sp5', platform: 'instagram', content: 'Guest review spotlight - The Johnsons from London', type: 'image', likes: 456, comments: 23, shares: 12, reach: 4200, postedAt: '2026-04-06' },
  { id: 'sp6', platform: 'tiktok', content: 'What €200/night gets you in Crete vs Mykonos', type: 'video', likes: 4500, comments: 312, shares: 890, reach: 62000, postedAt: '2026-04-05' },
];

const contentCalendar: ContentCalendarItem[] = [
  { id: 'cc1', date: '2026-04-13', platform: 'instagram', title: 'Property tour: Villa Ammos', type: 'reel', status: 'scheduled' },
  { id: 'cc2', date: '2026-04-14', platform: 'facebook', title: 'Early bird deals reminder', type: 'image', status: 'scheduled' },
  { id: 'cc3', date: '2026-04-15', platform: 'tiktok', title: 'Day in the life: Property manager in Crete', type: 'video', status: 'draft' },
  { id: 'cc4', date: '2026-04-16', platform: 'blog', title: '10 Hidden Gems Near Chania', type: 'article', status: 'draft' },
  { id: 'cc5', date: '2026-04-17', platform: 'instagram', title: 'Guest testimonial carousel', type: 'carousel', status: 'scheduled' },
  { id: 'cc6', date: '2026-04-18', platform: 'instagram', title: 'Weekend getaway guide', type: 'image', status: 'draft' },
  { id: 'cc7', date: '2026-04-19', platform: 'tiktok', title: 'Greek breakfast recipe from our villas', type: 'reel', status: 'scheduled' },
  { id: 'cc8', date: '2026-04-20', platform: 'facebook', title: 'New summer pricing announcement', type: 'image', status: 'draft' },
];

const seoKeywords: SEOKeyword[] = [
  { keyword: 'villa rental crete', position: 3, previousPosition: 5, searchVolume: 8800, clicks: 420, impressions: 12400, ctr: 3.4 },
  { keyword: 'chania holiday apartment', position: 2, previousPosition: 4, searchVolume: 5400, clicks: 380, impressions: 9200, ctr: 4.1 },
  { keyword: 'beachfront villa greece', position: 7, previousPosition: 12, searchVolume: 12200, clicks: 280, impressions: 18600, ctr: 1.5 },
  { keyword: 'crete vacation rental', position: 4, previousPosition: 6, searchVolume: 6800, clicks: 340, impressions: 10800, ctr: 3.1 },
  { keyword: 'luxury villa rethymno', position: 1, previousPosition: 3, searchVolume: 3200, clicks: 520, impressions: 6400, ctr: 8.1 },
  { keyword: 'family villa crete pool', position: 5, previousPosition: 8, searchVolume: 4600, clicks: 210, impressions: 7200, ctr: 2.9 },
  { keyword: 'short term rental heraklion', position: 6, previousPosition: 9, searchVolume: 3800, clicks: 180, impressions: 5400, ctr: 3.3 },
  { keyword: 'greek island holiday home', position: 11, previousPosition: 18, searchVolume: 9400, clicks: 120, impressions: 14200, ctr: 0.8 },
  { keyword: 'crete airbnb alternative', position: 8, previousPosition: 14, searchVolume: 7200, clicks: 260, impressions: 11000, ctr: 2.4 },
  { keyword: 'private pool villa chania', position: 2, previousPosition: 2, searchVolume: 2800, clicks: 440, impressions: 5800, ctr: 7.6 },
];

// ── Chart Data ────────────────────────────────────────────────────────────────

const monthlyLeadsData = [
  { month: 'Oct', leads: 98, conversions: 8 },
  { month: 'Nov', leads: 124, conversions: 12 },
  { month: 'Dec', leads: 156, conversions: 18 },
  { month: 'Jan', leads: 210, conversions: 24 },
  { month: 'Feb', leads: 280, conversions: 32 },
  { month: 'Mar', leads: 345, conversions: 42 },
  { month: 'Apr', leads: 420, conversions: 56 },
];

const funnelData = [
  { stage: 'Impressions', value: 285000, fill: '#6b38d4' },
  { stage: 'Clicks', value: 24800, fill: '#8b5cf6' },
  { stage: 'Visits', value: 12450, fill: '#a78bfa' },
  { stage: 'Inquiries', value: 1847, fill: '#c4b5fd' },
  { stage: 'Bookings', value: 892, fill: '#ddd6fe' },
];

const channelAttributionData = [
  { channel: 'Direct / Website', bookings: 375, revenue: 56250, color: '#6b38d4' },
  { channel: 'Organic Search', bookings: 210, revenue: 31500, color: '#8b5cf6' },
  { channel: 'Social Media', bookings: 124, revenue: 18600, color: '#06b6d4' },
  { channel: 'Email Marketing', bookings: 89, revenue: 13350, color: '#10b981' },
  { channel: 'Referral', bookings: 56, revenue: 8400, color: '#f59e0b' },
  { channel: 'Paid Ads', bookings: 38, revenue: 5700, color: '#ef4444' },
];

const spendVsRevenueData = [
  { campaign: 'Summer Early Bird', spend: 850, revenue: 28400 },
  { campaign: 'Guest Loyalty', spend: 320, revenue: 14200 },
  { campaign: 'Last Minute', spend: 480, revenue: 8900 },
  { campaign: 'Referral', spend: 2100, revenue: 12600 },
  { campaign: 'Crete Blog', spend: 600, revenue: 18600 },
  { campaign: 'Easter Special', spend: 720, revenue: 24800 },
  { campaign: 'Google Ads', spend: 1200, revenue: 15400 },
  { campaign: 'IG Reels', spend: 450, revenue: 31500 },
];

const organicTrafficData = [
  { month: 'Oct', organic: 3200, paid: 1800, referral: 900, social: 1400 },
  { month: 'Nov', organic: 3800, paid: 2100, referral: 1100, social: 1600 },
  { month: 'Dec', organic: 4200, paid: 2400, referral: 1300, social: 1800 },
  { month: 'Jan', organic: 4800, paid: 2200, referral: 1500, social: 2200 },
  { month: 'Feb', organic: 5600, paid: 2600, referral: 1800, social: 2800 },
  { month: 'Mar', organic: 6400, paid: 2800, referral: 2000, social: 3400 },
  { month: 'Apr', organic: 7200, paid: 3000, referral: 2200, social: 3800 },
];

const websitePageRankings = [
  { page: '/villas/chania', position: 2, traffic: 3400, title: 'Villas in Chania' },
  { page: '/villas/rethymno', position: 4, traffic: 2100, title: 'Rethymno Villas' },
  { page: '/blog/best-beaches', position: 1, traffic: 4200, title: 'Best Beaches in Crete' },
  { page: '/villas/heraklion', position: 6, traffic: 1400, title: 'Heraklion Stays' },
  { page: '/blog/crete-guide', position: 3, traffic: 2800, title: 'Complete Crete Guide' },
  { page: '/', position: 5, traffic: 1800, title: 'Homepage' },
];

const emailPerformanceTrend = [
  { month: 'Oct', openRate: 32.4, clickRate: 8.2, subscribers: 2400 },
  { month: 'Nov', openRate: 34.8, clickRate: 9.1, subscribers: 2580 },
  { month: 'Dec', openRate: 36.2, clickRate: 10.4, subscribers: 2780 },
  { month: 'Jan', openRate: 38.6, clickRate: 11.8, subscribers: 2950 },
  { month: 'Feb', openRate: 40.1, clickRate: 12.6, subscribers: 3120 },
  { month: 'Mar', openRate: 41.8, clickRate: 13.4, subscribers: 3340 },
  { month: 'Apr', openRate: 43.2, clickRate: 14.8, subscribers: 3540 },
];

// ── Style Helpers ─────────────────────────────────────────────────────────────

const statusColors: Record<CampaignStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-400',
  ended: 'bg-blue-500/10 text-blue-400',
  draft: 'bg-[#1a1a1a] text-on-surface-variant',
};

const statusDot: Record<CampaignStatus, string> = {
  active: 'bg-emerald-400',
  paused: 'bg-amber-400',
  ended: 'bg-blue-400',
  draft: 'bg-gray-500',
};

const campaignTypeLabels: Record<CampaignType, string> = {
  discount: 'Discount',
  loyalty: 'Loyalty',
  dynamic: 'Dynamic Pricing',
  referral: 'Referral',
  email: 'Email',
  social: 'Social',
  sms: 'Paid Ads',
};

const campaignTypeIcons: Record<CampaignType, typeof Mail> = {
  discount: Percent,
  loyalty: Award,
  dynamic: Zap,
  referral: Gift,
  email: Mail,
  social: Globe,
  sms: Megaphone,
};

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Play,
  blog: FileText,
};

const platformColors: Record<string, string> = {
  instagram: 'text-pink-400',
  facebook: 'text-blue-400',
  tiktok: 'text-cyan-400',
  blog: 'text-amber-400',
};

const platformBg: Record<string, string> = {
  instagram: 'bg-pink-500/10',
  facebook: 'bg-blue-500/10',
  tiktok: 'bg-cyan-500/10',
  blog: 'bg-amber-500/10',
};

const contentTypeIcons: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  carousel: Image,
  reel: Play,
  article: FileText,
};

const tooltipStyle = {
  background: '#0a0a0a',
  border: '1px solid #1a1a1a',
  borderRadius: 8,
  fontSize: 12,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copied, setCopied] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<CampaignStatus | 'all'>('all');
  const [showNewEmailForm, setShowNewEmailForm] = useState(false);
  const [newEmailSubject, setNewEmailSubject] = useState('');
  const [newEmailSegment, setNewEmailSegment] = useState('all');
  const [seoSort, setSeoSort] = useState<'position' | 'volume' | 'clicks'>('position');

  const bookingLink = 'https://book.sivanmanagment.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCampaigns = campaignFilter === 'all'
    ? campaigns
    : campaigns.filter((c) => c.status === campaignFilter);

  const sortedKeywords = [...seoKeywords].sort((a, b) => {
    if (seoSort === 'position') return a.position - b.position;
    if (seoSort === 'volume') return b.searchVolume - a.searchVolume;
    return b.clicks - a.clicks;
  });

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  const tabs: { key: TabKey; label: string; icon: typeof Megaphone }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'social', label: 'Social', icon: Globe },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Marketing & Growth</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Campaigns, channels, SEO, and direct booking optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sync Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* ── Direct Booking Link ────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Direct Booking Link</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Share with guests to bypass OTA commissions (avg. 15-20% saved)</p>
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

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-container-low w-fit overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: OVERVIEW
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {overviewKPIs.map((kpi) => {
              const Icon = kpi.icon;
              const isUp = kpi.trend === 'up';
              return (
                <div key={kpi.label} className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-2xl font-headline font-bold text-on-surface">{kpi.value}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Leads & Conversions Chart + Channel Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads Over Time */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Leads & Conversions</h3>
              <p className="text-xs text-on-surface-variant mb-4">Monthly trend over last 7 months</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyLeadsData}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="leads" stroke="#6b38d4" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
                  <Area type="monotone" dataKey="conversions" stroke="#10b981" fill="url(#convGrad)" strokeWidth={2} name="Conversions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Attribution Pie */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Channel Attribution</h3>
              <p className="text-xs text-on-surface-variant mb-4">Bookings by marketing channel</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie
                      data={channelAttributionData}
                      dataKey="bookings"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      strokeWidth={0}
                    >
                      {channelAttributionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {channelAttributionData.map((ch) => (
                    <div key={ch.channel} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: ch.color }} />
                        <span className="text-on-surface-variant">{ch.channel}</span>
                      </div>
                      <span className="text-on-surface font-medium">{ch.bookings}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Campaign Summary */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline text-sm font-semibold text-on-surface">Active Campaigns Summary</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {campaigns.filter((c) => c.status === 'active').length} active &middot; Total spend: &euro;{totalSpend.toLocaleString()} &middot; Total revenue: &euro;{totalRevenue.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setActiveTab('campaigns')} className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {campaigns.filter((c) => c.status === 'active').slice(0, 4).map((c) => {
                const TypeIcon = campaignTypeIcons[c.type];
                return (
                  <div key={c.id} className="p-3 rounded-lg bg-surface-container-low border border-outline/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-secondary/10 flex items-center justify-center">
                        <TypeIcon className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-on-surface truncate">{c.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{campaignTypeLabels[c.type]}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-[10px] text-on-surface-variant">Conv.</p>
                        <p className="text-sm font-semibold text-on-surface">{c.conversions}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant">ROI</p>
                        <p className="text-sm font-semibold text-emerald-400">{(c.roi / 100).toFixed(0)}x</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: CAMPAIGNS
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaign KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Megaphone className="w-4 h-4 text-secondary" />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  {campaigns.filter((c) => c.status === 'active').length} active
                </span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">{campaigns.length}</p>
              <p className="text-xs text-on-surface-variant mt-1">Total Campaigns</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+18%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">{totalConversions}</p>
              <p className="text-xs text-on-surface-variant mt-1">Total Conversions</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowDownRight className="w-3 h-3" />-8%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">&euro;{totalSpend.toLocaleString()}</p>
              <p className="text-xs text-on-surface-variant mt-1">Total Spend</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+45%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">&euro;{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-on-surface-variant mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <span className="text-xs text-on-surface-variant">Filter:</span>
            {(['all', 'active', 'paused', 'ended', 'draft'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setCampaignFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  campaignFilter === f
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Campaigns Table */}
          <div className="rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Campaign</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Reach</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Conversions</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Spend</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">ROI</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c) => {
                    const TypeIcon = campaignTypeIcons[c.type];
                    return (
                      <tr key={c.id} className="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-on-surface">{c.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{c.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-3.5 h-3.5 text-on-surface-variant" />
                            <span className="text-xs text-on-surface-variant">{campaignTypeLabels[c.type]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColors[c.status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status]}`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-on-surface">{c.reach.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-secondary">{c.conversions}</td>
                        <td className="px-4 py-3 text-right text-sm text-on-surface">&euro;{c.spend.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm text-emerald-400 font-medium">&euro;{c.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-on-surface">{(c.roi / 100).toFixed(0)}x</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {c.status === 'active' && (
                              <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors" title="Pause">
                                <Pause className="w-3.5 h-3.5 text-on-surface-variant" />
                              </button>
                            )}
                            {c.status === 'paused' && (
                              <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors" title="Resume">
                                <Play className="w-3.5 h-3.5 text-on-surface-variant" />
                              </button>
                            )}
                            <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors" title="More">
                              <MoreVertical className="w-3.5 h-3.5 text-on-surface-variant" />
                            </button>
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
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: EMAIL MARKETING
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Email KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+400</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">3,540</p>
              <p className="text-xs text-on-surface-variant mt-1">Total Subscribers</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+2.1%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">43.2%</p>
              <p className="text-xs text-on-surface-variant mt-1">Average Open Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <MousePointerClick className="w-4 h-4 text-purple-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+1.4%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">14.8%</p>
              <p className="text-xs text-on-surface-variant mt-1">Click Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowDownRight className="w-3 h-3" />-0.1%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">0.3%</p>
              <p className="text-xs text-on-surface-variant mt-1">Unsubscribe Rate</p>
            </div>
          </div>

          {/* Email Performance Trend */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Email Performance Trend</h3>
            <p className="text-xs text-on-surface-variant mb-4">Open rate, click rate, and subscriber growth</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={emailPerformanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis yAxisId="rate" tick={{ fill: '#888', fontSize: 11 }} unit="%" />
                <YAxis yAxisId="subs" orientation="right" tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="rate" type="monotone" dataKey="openRate" stroke="#6b38d4" strokeWidth={2} dot={{ r: 3 }} name="Open Rate %" />
                <Line yAxisId="rate" type="monotone" dataKey="clickRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Click Rate %" />
                <Line yAxisId="subs" type="monotone" dataKey="subscribers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Subscribers" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Email Campaigns */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline text-sm font-semibold text-on-surface">Email Campaigns</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{emailCampaigns.length} campaigns</p>
              </div>
              <button
                onClick={() => setShowNewEmailForm(!showNewEmailForm)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                New Campaign
              </button>
            </div>

            {/* New Email Form */}
            {showNewEmailForm && (
              <div className="mb-4 p-4 rounded-lg bg-surface-container-low border border-outline/5">
                <h4 className="text-xs font-semibold text-on-surface mb-3">Create New Email Campaign</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">Subject Line</label>
                    <input
                      type="text"
                      value={newEmailSubject}
                      onChange={(e) => setNewEmailSubject(e.target.value)}
                      placeholder="e.g., Summer in Crete: Your Dream Villa Awaits"
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 border border-outline/10"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant mb-1 uppercase tracking-wider">Segment</label>
                    <select
                      value={newEmailSegment}
                      onChange={(e) => setNewEmailSegment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border border-outline/10 appearance-none"
                    >
                      <option value="all">All Subscribers (3,540)</option>
                      <option value="returning">Returning Guests (890)</option>
                      <option value="high_value">High Value (340)</option>
                      <option value="inactive">Inactive 6mo+ (520)</option>
                      <option value="vip">VIP Stars (45)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button className="px-4 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:opacity-90">
                    <Send className="w-3.5 h-3.5 inline-block me-1" />
                    Create Draft
                  </button>
                  <button
                    onClick={() => setShowNewEmailForm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Email Campaign Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Sent</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Open Rate</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Click Rate</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Unsub.</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {emailCampaigns.map((ec) => (
                    <tr key={ec.id} className="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                          <span className="text-sm text-on-surface">{ec.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          ec.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400'
                            : ec.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-[#1a1a1a] text-on-surface-variant'
                        }`}>
                          {ec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-on-surface">
                        {ec.sentCount > 0 ? ec.sentCount.toLocaleString() : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-on-surface">
                        {ec.openRate > 0 ? `${ec.openRate}%` : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-on-surface">
                        {ec.clickRate > 0 ? `${ec.clickRate}%` : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-on-surface">
                        {ec.unsubscribeRate > 0 ? `${ec.unsubscribeRate}%` : '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-on-surface-variant">
                        {ec.sentDate || '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audience Segments */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Audience Segments</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { segment: 'All Subscribers', count: 3540, desc: 'Full email list', icon: Users },
                { segment: 'Returning Guests', count: 890, desc: 'Booked 2+ times', icon: Award },
                { segment: 'High Value', count: 340, desc: 'Spent \u20ac5,000+ lifetime', icon: Star },
                { segment: 'VIP Stars', count: 45, desc: 'Loyalty program members', icon: Star },
                { segment: 'Inactive (6mo+)', count: 520, desc: 'No booking in 6 months', icon: Clock },
                { segment: 'New Leads', count: 680, desc: 'Signed up, never booked', icon: Target },
              ].map((seg) => {
                const Icon = seg.icon;
                return (
                  <div key={seg.segment} className="p-3 rounded-lg bg-surface-container-low border border-outline/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-secondary" />
                        <p className="text-xs font-medium text-on-surface">{seg.segment}</p>
                      </div>
                      <p className="text-sm font-headline font-bold text-on-surface">{seg.count.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">{seg.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: SOCIAL MEDIA
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          {/* Social Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {socialAccounts.map((acc) => {
              const PlatformIcon = platformIcons[acc.platform];
              return (
                <div key={acc.platform} className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${platformBg[acc.platform]} flex items-center justify-center`}>
                      <PlatformIcon className={`w-5 h-5 ${platformColors[acc.platform]}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface capitalize">{acc.platform}</p>
                      <p className="text-xs text-on-surface-variant">{acc.handle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Followers</p>
                      <p className="text-lg font-headline font-bold text-on-surface">{acc.followers.toLocaleString()}</p>
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                        <ArrowUpRight className="w-2.5 h-2.5" />+{acc.followersChange.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Engagement</p>
                      <p className="text-lg font-headline font-bold text-on-surface">{acc.engagement}%</p>
                      <span className="text-[10px] text-on-surface-variant">{acc.posts} posts</span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Monthly Reach</p>
                      <p className="text-lg font-headline font-bold text-on-surface">{acc.reach.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Posts Performance */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Recent Posts Performance</h3>
            <p className="text-xs text-on-surface-variant mb-4">Top performing posts across all platforms</p>
            <div className="space-y-3">
              {socialPosts.map((post) => {
                const PlatformIcon = platformIcons[post.platform];
                const ContentIcon = contentTypeIcons[post.type];
                return (
                  <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low border border-outline/5 hover:border-secondary/10 transition-colors">
                    <div className={`w-9 h-9 rounded-lg ${platformBg[post.platform]} flex items-center justify-center flex-shrink-0`}>
                      <PlatformIcon className={`w-4 h-4 ${platformColors[post.platform]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-on-surface truncate">{post.content}</p>
                        <span className="flex items-center gap-1 text-[10px] text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded flex-shrink-0">
                          <ContentIcon className="w-2.5 h-2.5" />
                          {post.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant">{post.postedAt}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Heart className="w-3 h-3 text-rose-400" />
                        <span>{post.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <MessageCircle className="w-3 h-3 text-blue-400" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Share2 className="w-3 h-3 text-emerald-400" />
                        <span>{post.shares}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Eye className="w-3 h-3" />
                        <span>{post.reach.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Calendar */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline text-sm font-semibold text-on-surface">Content Calendar</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Upcoming scheduled and draft content</p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:opacity-90 transition-opacity">
                <Plus className="w-3.5 h-3.5" />
                Schedule Post
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {contentCalendar.map((item) => {
                const PlatformIcon = platformIcons[item.platform];
                const ContentIcon = contentTypeIcons[item.type];
                return (
                  <div key={item.id} className="p-3 rounded-lg bg-surface-container-low border border-outline/5 hover:border-secondary/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md ${platformBg[item.platform]} flex items-center justify-center`}>
                          <PlatformIcon className={`w-3 h-3 ${platformColors[item.platform]}`} />
                        </div>
                        <span className="text-[10px] text-on-surface-variant capitalize">{item.platform}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                        item.status === 'scheduled' ? 'bg-emerald-500/10 text-emerald-400'
                          : item.status === 'published' ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#1a1a1a] text-on-surface-variant'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-on-surface mb-1">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <Calendar className="w-2.5 h-2.5" />
                        {item.date}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <ContentIcon className="w-2.5 h-2.5" />
                        {item.type}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: SEO DASHBOARD
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* SEO KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+28%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">7,200</p>
              <p className="text-xs text-on-surface-variant mt-1">Organic Visitors (Apr)</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+12</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">142</p>
              <p className="text-xs text-on-surface-variant mt-1">Ranking Keywords</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+0.8%</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">3.4%</p>
              <p className="text-xs text-on-surface-variant mt-1">Avg. CTR</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-2">
                <Hash className="w-4 h-4 text-amber-400" />
                <span className="flex items-center gap-1 text-xs text-emerald-400"><ArrowUpRight className="w-3 h-3" />+2 spots</span>
              </div>
              <p className="text-2xl font-headline font-bold text-on-surface">4.2</p>
              <p className="text-xs text-on-surface-variant mt-1">Avg. Position</p>
            </div>
          </div>

          {/* Organic Traffic Trend */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Traffic by Source</h3>
            <p className="text-xs text-on-surface-variant mb-4">Monthly website traffic breakdown</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={organicTrafficData}>
                <defs>
                  <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="organic" stroke="#6b38d4" fill="url(#orgGrad)" strokeWidth={2} name="Organic" />
                <Area type="monotone" dataKey="paid" stroke="#ef4444" fill="url(#paidGrad)" strokeWidth={1.5} name="Paid" />
                <Area type="monotone" dataKey="referral" stroke="#f59e0b" fill="url(#refGrad)" strokeWidth={1.5} name="Referral" />
                <Area type="monotone" dataKey="social" stroke="#06b6d4" fill="url(#socGrad)" strokeWidth={1.5} name="Social" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Keywords + Page Rankings side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Keywords */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline text-sm font-semibold text-on-surface">Top Keywords</h3>
                <div className="flex items-center gap-1">
                  {(['position', 'volume', 'clicks'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeoSort(s)}
                      className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-all ${
                        seoSort === s ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {sortedKeywords.map((kw) => {
                  const posChange = kw.previousPosition - kw.position;
                  const isImproved = posChange > 0;
                  const isSame = posChange === 0;
                  return (
                    <div key={kw.keyword} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low border border-outline/5">
                      <div className="w-7 h-7 rounded-md bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-secondary">#{kw.position}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-on-surface truncate">{kw.keyword}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-on-surface-variant">{kw.searchVolume.toLocaleString()} vol.</span>
                          <span className="text-[10px] text-on-surface-variant">{kw.clicks} clicks</span>
                          <span className="text-[10px] text-on-surface-variant">{kw.ctr}% CTR</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                        isImproved ? 'text-emerald-400' : isSame ? 'text-on-surface-variant' : 'text-red-400'
                      }`}>
                        {isImproved ? <ArrowUpRight className="w-2.5 h-2.5" /> : isSame ? null : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {isSame ? 'stable' : `${Math.abs(posChange)} pos`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Page Rankings */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Top Pages by Organic Traffic</h3>
              <div className="space-y-3">
                {websitePageRankings.sort((a, b) => b.traffic - a.traffic).map((page, idx) => {
                  const maxTraffic = websitePageRankings[0].traffic;
                  const barWidth = (page.traffic / Math.max(...websitePageRankings.map(p => p.traffic))) * 100;
                  return (
                    <div key={page.page} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-on-surface-variant w-4">#{page.position}</span>
                          <span className="text-xs font-medium text-on-surface">{page.title}</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">{page.traffic.toLocaleString()} visits</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-accent rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-mono">{page.page}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
           TAB: ANALYTICS
         ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Marketing Funnel */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Marketing Funnel</h3>
            <p className="text-xs text-on-surface-variant mb-6">Impression to booking conversion path</p>
            <div className="flex flex-col gap-2">
              {funnelData.map((stage, idx) => {
                const maxVal = funnelData[0].value;
                const barWidth = Math.max((stage.value / maxVal) * 100, 8);
                const dropRate = idx > 0
                  ? (((funnelData[idx - 1].value - stage.value) / funnelData[idx - 1].value) * 100).toFixed(1)
                  : null;
                return (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-24 text-right flex-shrink-0">
                      <p className="text-xs font-medium text-on-surface">{stage.stage}</p>
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full h-10 bg-surface-container-low rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pe-3 transition-all"
                          style={{
                            width: `${barWidth}%`,
                            background: stage.fill,
                            opacity: 1 - idx * 0.1,
                          }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow">
                            {stage.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      {dropRate !== null && (
                        <span className="text-[10px] text-on-surface-variant">
                          -{dropRate}% drop
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface-container-low border border-outline/5">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Target className="w-3.5 h-3.5 text-secondary" />
                <span>Overall conversion rate: <strong className="text-secondary">{((892 / 285000) * 100).toFixed(2)}%</strong> (Impression to Booking)</span>
              </div>
            </div>
          </div>

          {/* Spend vs Revenue by Campaign */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Spend vs Revenue by Campaign</h3>
            <p className="text-xs text-on-surface-variant mb-4">Marketing investment efficiency</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={spendVsRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} />
                <YAxis
                  dataKey="campaign"
                  type="category"
                  tick={{ fill: '#888', fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => `\u20ac${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="spend" fill="#ef4444" radius={[0, 4, 4, 0]} name="Spend" barSize={12} />
                <Bar dataKey="revenue" fill="#6b38d4" radius={[0, 4, 4, 0]} name="Revenue" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Attribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attribution by Revenue */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Revenue by Channel</h3>
              <p className="text-xs text-on-surface-variant mb-4">Which channels generate the most revenue</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={channelAttributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis dataKey="channel" tick={{ fill: '#888', fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `\u20ac${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Revenue">
                    {channelAttributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign ROI Comparison */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Campaign ROI Ranking</h3>
              <p className="text-xs text-on-surface-variant mb-4">Return on investment per campaign</p>
              <div className="space-y-3">
                {[...campaigns]
                  .sort((a, b) => b.roi - a.roi)
                  .map((c, idx) => {
                    const maxRoi = Math.max(...campaigns.map((x) => x.roi));
                    const barWidth = (c.roi / maxRoi) * 100;
                    const TypeIcon = campaignTypeIcons[c.type];
                    return (
                      <div key={c.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant font-mono w-4">#{idx + 1}</span>
                            <TypeIcon className="w-3 h-3 text-on-surface-variant" />
                            <span className="text-xs font-medium text-on-surface">{c.name}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400">{(c.roi / 100).toFixed(0)}x ROI</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${barWidth}%`,
                              background: `linear-gradient(90deg, #6b38d4 0%, #10b981 100%)`,
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
                          <span>Spend: &euro;{c.spend.toLocaleString()}</span>
                          <span>Revenue: &euro;{c.revenue.toLocaleString()}</span>
                          <span className={statusColors[c.status].replace('bg-', '').split(' ')[1]}>{c.status}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Monthly Revenue from Marketing */}
          <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-1">Monthly Marketing Performance</h3>
            <p className="text-xs text-on-surface-variant mb-4">Revenue attributed to marketing efforts</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={[
                { month: 'Oct', revenue: 8400, spend: 1800, profit: 6600 },
                { month: 'Nov', revenue: 12600, spend: 2100, profit: 10500 },
                { month: 'Dec', revenue: 16800, spend: 2400, profit: 14400 },
                { month: 'Jan', revenue: 19200, spend: 2800, profit: 16400 },
                { month: 'Feb', revenue: 24600, spend: 3100, profit: 21500 },
                { month: 'Mar', revenue: 28400, spend: 3400, profit: 25000 },
                { month: 'Apr', revenue: 34200, spend: 3240, profit: 30960 },
              ]}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b38d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `\u20ac${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `\u20ac${value.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6b38d4" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profGrad)" strokeWidth={2} name="Profit" />
                <Area type="monotone" dataKey="spend" stroke="#ef4444" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name="Spend" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
