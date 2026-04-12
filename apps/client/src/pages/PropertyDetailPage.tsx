import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Star,
  Calendar,
  TrendingUp,
  TrendingDown,
  Bed,
  Bath,
  Maximize2,
  Users,
  ChevronLeft,
  DollarSign,
  Wrench,
  Camera,
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Shield,
  BarChart3,
  Eye,
  Edit,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Home,
  Key,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock property data
const propertyData = {
  id: '1',
  name: 'Aegean Sunset Villa',
  type: 'Villa',
  status: 'ACTIVE',
  address: 'Elounda Beach Road 42',
  city: 'Elounda',
  region: 'Crete',
  country: 'Greece',
  postalCode: '72053',
  bedrooms: 4,
  bathrooms: 3,
  area: 220,
  maxGuests: 8,
  basePrice: 285,
  currency: 'EUR',
  rating: 4.9,
  reviewCount: 67,
  description: 'Stunning luxury villa perched on the Elounda coastline with panoramic views of the Aegean Sea and Spinalonga Island. Features a private infinity pool, fully equipped modern kitchen, and manicured Mediterranean garden.',
  amenities: [
    { name: 'Private Pool', icon: '🏊' },
    { name: 'Sea View', icon: '🌊' },
    { name: 'WiFi', icon: '📶' },
    { name: 'Parking', icon: '🅿️' },
    { name: 'Full Kitchen', icon: '🍳' },
    { name: 'Air Conditioning', icon: '❄️' },
    { name: 'BBQ', icon: '🔥' },
    { name: 'Washing Machine', icon: '🧺' },
    { name: 'Smart Lock', icon: '🔐' },
    { name: 'Garden', icon: '🌿' },
    { name: 'TV (Smart)', icon: '📺' },
    { name: 'Dishwasher', icon: '🍽️' },
  ],
  channels: [
    { name: 'Airbnb', status: 'active', listingUrl: 'https://airbnb.com/rooms/123', rating: 4.9, reviews: 45 },
    { name: 'Booking.com', status: 'active', listingUrl: 'https://booking.com/hotel/123', rating: 9.4, reviews: 18 },
    { name: 'VRBO', status: 'active', listingUrl: 'https://vrbo.com/123', rating: 4.8, reviews: 4 },
    { name: 'Direct', status: 'active', listingUrl: '', rating: 0, reviews: 0 },
  ],
  icalFeedUrl: 'https://api.sivanmanagment.com/api/v1/calendar/ical/prop-1/feed.ics',
  managementFee: 25,
  minimumMonthlyFee: 500,
  contractStart: '2024-01-01',
};

const monthlyRevenue = [
  { month: 'May', income: 8200, expenses: 2100, net: 6100 },
  { month: 'Jun', income: 10500, expenses: 2400, net: 8100 },
  { month: 'Jul', income: 14200, expenses: 3100, net: 11100 },
  { month: 'Aug', income: 15800, expenses: 3600, net: 12200 },
  { month: 'Sep', income: 11400, expenses: 2800, net: 8600 },
  { month: 'Oct', income: 8600, expenses: 2200, net: 6400 },
  { month: 'Nov', income: 4200, expenses: 1600, net: 2600 },
  { month: 'Dec', income: 3800, expenses: 1400, net: 2400 },
  { month: 'Jan', income: 2400, expenses: 1200, net: 1200 },
  { month: 'Feb', income: 4600, expenses: 1300, net: 3300 },
  { month: 'Mar', income: 7800, expenses: 1900, net: 5900 },
  { month: 'Apr', income: 12400, expenses: 3200, net: 9200 },
];

const occupancyData = [
  { month: 'May', value: 72 },
  { month: 'Jun', value: 83 },
  { month: 'Jul', value: 94 },
  { month: 'Aug', value: 100 },
  { month: 'Sep', value: 87 },
  { month: 'Oct', value: 68 },
  { month: 'Nov', value: 42 },
  { month: 'Dec', value: 35 },
  { month: 'Jan', value: 28 },
  { month: 'Feb', value: 45 },
  { month: 'Mar', value: 65 },
  { month: 'Apr', value: 88 },
];

const revenueByChannel = [
  { name: 'Airbnb', value: 48, color: '#FF5A5F' },
  { name: 'Booking.com', value: 32, color: '#003580' },
  { name: 'Direct', value: 15, color: '#6b38d4' },
  { name: 'VRBO', value: 5, color: '#3B5998' },
];

const upcomingBookings = [
  { id: '1', guest: 'Klaus Weber', checkin: '2026-04-18', checkout: '2026-04-25', nights: 7, total: 1995, source: 'Airbnb', status: 'confirmed' },
  { id: '2', guest: 'Sophie Martin', checkin: '2026-04-26', checkout: '2026-05-01', nights: 5, total: 1425, source: 'Booking.com', status: 'confirmed' },
  { id: '3', guest: 'James Wilson', checkin: '2026-05-03', checkout: '2026-05-10', nights: 7, total: 1995, source: 'Direct', status: 'pending' },
  { id: '4', guest: 'Anna Petrova', checkin: '2026-05-15', checkout: '2026-05-22', nights: 7, total: 2100, source: 'Airbnb', status: 'confirmed' },
];

const recentExpenses = [
  { id: '1', description: 'Pool maintenance', amount: 180, date: '2026-04-08', category: 'Maintenance', status: 'approved' },
  { id: '2', description: 'Deep cleaning', amount: 120, date: '2026-04-05', category: 'Cleaning', status: 'approved' },
  { id: '3', description: 'Garden landscaping', amount: 350, date: '2026-04-01', category: 'Maintenance', status: 'pending' },
  { id: '4', description: 'Smart lock batteries', amount: 45, date: '2026-03-28', category: 'Supplies', status: 'approved' },
  { id: '5', description: 'AC repair unit 2', amount: 280, date: '2026-03-22', category: 'Repair', status: 'approved' },
];

const recentReviews = [
  { guest: 'Maria Schmidt', rating: 5, date: '2026-04-02', text: 'Absolutely stunning villa! The views are breathtaking and the pool area is perfect. Everything was spotlessly clean.', source: 'Airbnb' },
  { guest: 'Pierre Dubois', rating: 5, date: '2026-03-20', text: 'Best vacation rental we\'ve ever stayed in. The host communication was excellent.', source: 'Booking.com' },
  { guest: 'Tom Anderson', rating: 4, date: '2026-03-08', text: 'Beautiful place with amazing views. Minor issue with hot water but resolved quickly.', source: 'Airbnb' },
];

type Tab = 'overview' | 'financial' | 'bookings' | 'reviews';

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const p = propertyData;
  const totalIncome = monthlyRevenue.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyRevenue.reduce((s, m) => s + m.expenses, 0);
  const totalNet = monthlyRevenue.reduce((s, m) => s + m.net, 0);
  const avgOccupancy = Math.round(occupancyData.reduce((s, m) => s + m.value, 0) / occupancyData.length);

  const copyIcal = () => {
    navigator.clipboard.writeText(p.icalFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface mb-3 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Properties
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success">{p.status}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary">{p.type}</span>
            </div>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">{p.name}</h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-sm text-on-surface-variant">{p.address}, {p.city}, {p.region}, {p.country}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-container-lowest px-3 py-2 rounded-lg ambient-shadow">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-headline font-bold text-on-surface">{p.rating}</span>
              <span className="text-xs text-on-surface-variant">({p.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/20">
        {(['overview', 'financial', 'bookings', 'reviews'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize
              ${tab === t ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'This Month', value: `€${(monthlyRevenue[11].income).toLocaleString()}`, sub: `Net: €${monthlyRevenue[11].net.toLocaleString()}`, icon: DollarSign, color: 'bg-success/10', ic: 'text-success' },
              { label: 'Occupancy', value: `${occupancyData[11].value}%`, sub: 'This month', icon: BarChart3, color: 'bg-secondary/10', ic: 'text-secondary' },
              { label: 'Avg Nightly Rate', value: `€${p.basePrice}`, sub: 'Base rate', icon: Home, color: 'bg-warning/10', ic: 'text-warning' },
              { label: 'Upcoming', value: `${upcomingBookings.length}`, sub: 'Bookings', icon: Calendar, color: 'bg-secondary/10', ic: 'text-secondary' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
                  <div className={`w-7 h-7 rounded-lg ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className={`w-3.5 h-3.5 ${kpi.ic}`} />
                  </div>
                </div>
                <p className="font-headline text-xl font-bold text-on-surface">{kpi.value}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Description + Amenities */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">About this Property</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{p.description}</p>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 rounded-lg bg-surface-container-low">
                    <Bed className="w-5 h-5 text-on-surface-variant mx-auto mb-1" />
                    <p className="text-sm font-bold text-on-surface">{p.bedrooms}</p>
                    <p className="text-[10px] text-on-surface-variant">Bedrooms</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-container-low">
                    <Bath className="w-5 h-5 text-on-surface-variant mx-auto mb-1" />
                    <p className="text-sm font-bold text-on-surface">{p.bathrooms}</p>
                    <p className="text-[10px] text-on-surface-variant">Bathrooms</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-container-low">
                    <Maximize2 className="w-5 h-5 text-on-surface-variant mx-auto mb-1" />
                    <p className="text-sm font-bold text-on-surface">{p.area}m²</p>
                    <p className="text-[10px] text-on-surface-variant">Area</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-container-low">
                    <Users className="w-5 h-5 text-on-surface-variant mx-auto mb-1" />
                    <p className="text-sm font-bold text-on-surface">{p.maxGuests}</p>
                    <p className="text-[10px] text-on-surface-variant">Max Guests</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">Amenities</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {p.amenities.map((a) => (
                    <div key={a.name} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
                      <span className="text-base">{a.icon}</span>
                      <span className="text-xs text-on-surface">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Channel Listings */}
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">Channel Listings</h3>
                <div className="space-y-2">
                  {p.channels.map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ch.status === 'active' ? 'bg-success' : 'bg-error'}`} />
                        <span className="text-xs font-medium text-on-surface">{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ch.rating > 0 && (
                          <span className="text-[10px] text-on-surface-variant">{ch.rating} ★ ({ch.reviews})</span>
                        )}
                        {ch.listingUrl && (
                          <a href={ch.listingUrl} target="_blank" rel="noreferrer" className="text-secondary hover:text-secondary/80">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Management Contract */}
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">Management Terms</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Fee Rate</span>
                    <span className="text-xs font-semibold text-on-surface">{p.managementFee}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Min Monthly Fee</span>
                    <span className="text-xs font-semibold text-on-surface">€{p.minimumMonthlyFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-on-surface-variant">Contract Since</span>
                    <span className="text-xs font-semibold text-on-surface">{new Date(p.contractStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* iCal Feed */}
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">Calendar Feed</h3>
                <p className="text-[10px] text-on-surface-variant mb-2">Use this iCal URL to sync your calendar</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={p.icalFeedUrl}
                    className="flex-1 text-[10px] bg-surface-container-low rounded-lg px-2 py-1.5 text-on-surface-variant truncate outline-none"
                  />
                  <button onClick={copyIcal} className="p-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Mini Chart */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Revenue Trend (12 months)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="propIncGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', fontSize: '11px' }} formatter={(v: number) => [`€${v.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fill="url(#propIncGrad)" />
                  <Area type="monotone" dataKey="net" name="Net" stroke="#6b38d4" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'financial' && (
        <>
          {/* Financial KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Annual Income', value: `€${totalIncome.toLocaleString()}`, change: '+18.3%', up: true },
              { label: 'Annual Expenses', value: `€${totalExpenses.toLocaleString()}`, change: '+5.2%', up: false },
              { label: 'Management Fees', value: `€${Math.round(totalIncome * 0.25).toLocaleString()}`, change: '', up: true },
              { label: 'Net Payout', value: `€${totalNet.toLocaleString()}`, change: '+22.1%', up: true },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-2">{kpi.label}</p>
                <p className="font-headline text-xl font-bold text-on-surface">{kpi.value}</p>
                {kpi.change && (
                  <div className="flex items-center gap-1 mt-1">
                    {kpi.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowUpRight className="w-3 h-3 text-error" />}
                    <span className={`text-[10px] font-semibold ${kpi.up ? 'text-success' : 'text-error'}`}>{kpi.change}</span>
                    <span className="text-[10px] text-on-surface-variant">YoY</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Income vs Expenses</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', fontSize: '11px' }} formatter={(v: number) => [`€${v.toLocaleString()}`, '']} />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
              <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Revenue by Channel</h3>
              <div className="h-64 flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueByChannel} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {revenueByChannel.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {revenueByChannel.map((ch) => (
                    <div key={ch.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: ch.color }} />
                      <span className="text-xs text-on-surface flex-1">{ch.name}</span>
                      <span className="text-xs font-semibold text-on-surface">{ch.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-sm font-semibold text-on-surface">Occupancy Rate</h3>
              <span className="text-xs text-on-surface-variant">12-month avg: {avgOccupancy}%</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: 'none', borderRadius: '12px', fontSize: '11px' }} formatter={(v: number) => [`${v}%`, 'Occupancy']} />
                  <Bar dataKey="value" name="Occupancy" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    {['Description', 'Category', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-start px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-2 text-xs text-on-surface">{exp.description}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-container-high text-on-surface-variant">{exp.category}</span></td>
                      <td className="px-3 py-2 text-[11px] text-on-surface-variant">{new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                      <td className="px-3 py-2 text-xs font-medium text-error">€{exp.amount}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${exp.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'bookings' && (
        <>
          {/* Upcoming Bookings */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Upcoming Bookings</h3>
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high/60 transition-colors">
                  <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center text-white text-xs font-bold">
                    {b.guest.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">{b.guest}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(b.checkin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → {new Date(b.checkout).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">· {b.nights} nights</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-on-surface">€{b.total.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        b.source === 'Airbnb' ? 'bg-[#FF5A5F]/10 text-[#FF5A5F]' :
                        b.source === 'Booking.com' ? 'bg-[#003580]/10 text-[#003580]' :
                        'bg-secondary/10 text-secondary'
                      }`}>{b.source}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        b.status === 'confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>{b.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Occupancy Calendar Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-sm font-semibold text-on-surface">Occupancy Calendar</h3>
              <button onClick={() => navigate('/calendar')} className="text-xs text-secondary hover:text-secondary/80 font-medium">View Full Calendar →</button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e8e9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#46464c' }} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 10, fill: '#46464c' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', fontSize: '11px' }} formatter={(v: number) => [`${v}%`, 'Occupancy']} />
                  <Bar dataKey="value" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'reviews' && (
        <>
          {/* Review Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow text-center">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 mx-auto mb-2" />
              <p className="font-headline text-2xl font-bold text-on-surface">{p.rating}</p>
              <p className="text-[10px] text-on-surface-variant">Overall Rating</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow text-center">
              <p className="font-headline text-2xl font-bold text-on-surface">{p.reviewCount}</p>
              <p className="text-[10px] text-on-surface-variant">Total Reviews</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow text-center">
              <p className="font-headline text-2xl font-bold text-success">96%</p>
              <p className="text-[10px] text-on-surface-variant">5-Star Rate</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow text-center">
              <p className="font-headline text-2xl font-bold text-secondary">100%</p>
              <p className="text-[10px] text-on-surface-variant">Response Rate</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Rating Distribution</h3>
            <div className="space-y-2">
              {[
                { stars: 5, count: 58, pct: 87 },
                { stars: 4, count: 6, pct: 9 },
                { stars: 3, count: 2, pct: 3 },
                { stars: 2, count: 1, pct: 1 },
                { stars: 1, count: 0, pct: 0 },
              ].map((r) => (
                <div key={r.stars} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-on-surface w-12">{r.stars} ★</span>
                  <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-xs text-on-surface-variant w-8 text-end">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="font-headline text-sm font-semibold text-on-surface mb-4">Recent Reviews</h3>
            <div className="space-y-4">
              {recentReviews.map((review, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface-container-low">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs font-bold">
                        {review.guest.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{review.guest}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-container-high'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="text-[10px] text-on-surface-variant">{new Date(review.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className={`block px-1.5 py-0.5 rounded text-[9px] font-semibold mt-0.5 ${
                        review.source === 'Airbnb' ? 'bg-[#FF5A5F]/10 text-[#FF5A5F]' : 'bg-[#003580]/10 text-[#003580]'
                      }`}>{review.source}</span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
