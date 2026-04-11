import { useState } from 'react';
import {
  Star,
  Users,
  Award,
  TrendingUp,
  Plus,
  Minus,
  Search,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Gem,
  Crown,
  Sparkles,
  Plane,
  Coffee,
  Key,
  CalendarCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type TabKey = 'members' | 'tiers' | 'benefits' | 'transactions';

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  points: number;
  bookings: number;
  joinDate: string;
}

interface LoyaltyBenefit {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  minTier: Tier;
  pointsCost: number;
  isActive: boolean;
}

interface PointTransaction {
  id: string;
  memberId: string;
  memberName: string;
  type: 'earned' | 'redeemed';
  amount: number;
  description: string;
  date: string;
}

// ── Tier Configuration ─────────────────────────────────────────────────────

const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const tierConfig: Record<Tier, {
  label: string;
  threshold: number;
  hex: string;
  textClass: string;
  benefits: string[];
  icon: React.ElementType;
}> = {
  bronze: {
    label: 'Bronze',
    threshold: 0,
    hex: '#CD7F32',
    textClass: 'text-on-surface',
    benefits: ['Welcome drink on arrival', '5% discount on extended stays', 'Priority email support'],
    icon: Star,
  },
  silver: {
    label: 'Silver',
    threshold: 500,
    hex: '#C0C0C0',
    textClass: 'text-on-surface',
    benefits: ['Early check-in (2pm)', '10% discount on extended stays', 'Free welcome basket', 'Priority booking window'],
    icon: Award,
  },
  gold: {
    label: 'Gold',
    threshold: 1500,
    hex: '#FFD700',
    textClass: 'text-on-surface',
    benefits: ['Early check-in (12pm)', 'Late checkout (2pm)', '15% discount on all bookings', 'Free room upgrade (subject to availability)', 'Complimentary breakfast'],
    icon: Crown,
  },
  platinum: {
    label: 'Platinum',
    threshold: 3000,
    hex: '#E5E4E2',
    textClass: 'text-on-surface',
    benefits: ['Guaranteed early check-in (11am)', 'Late checkout (4pm)', '20% discount on all bookings', 'Guaranteed room upgrade', 'Free airport transfer', 'Dedicated concierge'],
    icon: Gem,
  },
  diamond: {
    label: 'Diamond',
    threshold: 5000,
    hex: '#B9F2FF',
    textClass: 'text-on-surface',
    benefits: ['Flexible check-in/checkout', '25% discount on all bookings', 'Best available room guaranteed', 'Free airport transfer (round trip)', 'Personal concierge 24/7', 'Complimentary spa treatment', 'Exclusive event invitations'],
    icon: Sparkles,
  },
};

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoMembers: LoyaltyMember[] = [
  { id: '1', name: 'Dimitris Papadopoulos', email: 'd.papadopoulos@gmail.com', tier: 'diamond', points: 5820, bookings: 34, joinDate: '2022-03-15' },
  { id: '2', name: 'Maria Konstantinou', email: 'm.konstantinou@yahoo.com', tier: 'platinum', points: 3450, bookings: 22, joinDate: '2023-01-10' },
  { id: '3', name: 'Yannis Alexiou', email: 'y.alexiou@outlook.com', tier: 'gold', points: 2100, bookings: 15, joinDate: '2023-06-20' },
  { id: '4', name: 'Elena Michailidou', email: 'e.michailidou@gmail.com', tier: 'gold', points: 1850, bookings: 12, joinDate: '2024-02-01' },
  { id: '5', name: 'Kostas Nikolaou', email: 'k.nikolaou@mail.gr', tier: 'silver', points: 920, bookings: 7, joinDate: '2024-05-15' },
  { id: '6', name: 'Sofia Andreou', email: 's.andreou@gmail.com', tier: 'silver', points: 680, bookings: 5, joinDate: '2024-08-10' },
  { id: '7', name: 'Nikos Georgiou', email: 'n.georgiou@outlook.com', tier: 'bronze', points: 340, bookings: 3, joinDate: '2025-01-05' },
  { id: '8', name: 'Anna Vlachou', email: 'a.vlachou@yahoo.gr', tier: 'bronze', points: 180, bookings: 2, joinDate: '2025-06-20' },
  { id: '9', name: 'Petros Karagiannis', email: 'p.karagiannis@gmail.com', tier: 'bronze', points: 95, bookings: 1, joinDate: '2025-11-01' },
];

const demoBenefits: LoyaltyBenefit[] = [
  { id: 'b1', name: 'Early Check-in', description: 'Check in before the standard time based on your tier level', icon: Clock, minTier: 'silver', pointsCost: 0, isActive: true },
  { id: 'b2', name: 'Late Checkout', description: 'Extend your checkout time based on your tier level', icon: CalendarCheck, minTier: 'gold', pointsCost: 0, isActive: true },
  { id: 'b3', name: 'Room Upgrade', description: 'Get upgraded to a better room when available', icon: Key, minTier: 'gold', pointsCost: 200, isActive: true },
  { id: 'b4', name: 'Free Airport Transfer', description: 'Complimentary transfer from/to the airport', icon: Plane, minTier: 'platinum', pointsCost: 300, isActive: true },
  { id: 'b5', name: 'Welcome Basket', description: 'Curated local products and treats upon arrival', icon: Gift, minTier: 'silver', pointsCost: 150, isActive: true },
  { id: 'b6', name: 'Complimentary Breakfast', description: 'Daily breakfast at partner restaurants', icon: Coffee, minTier: 'gold', pointsCost: 100, isActive: true },
  { id: 'b7', name: 'Exclusive Experiences', description: 'Access to private tours, tastings, and local events', icon: Sparkles, minTier: 'diamond', pointsCost: 500, isActive: true },
  { id: 'b8', name: 'Spa Treatment', description: 'Complimentary spa session at partner wellness centers', icon: Star, minTier: 'diamond', pointsCost: 400, isActive: false },
];

const demoTransactions: PointTransaction[] = [
  { id: 't1', memberId: '1', memberName: 'Dimitris Papadopoulos', type: 'earned', amount: 320, description: 'Booking completed - Villa Athena, Mykonos', date: '2026-04-08' },
  { id: 't2', memberId: '2', memberName: 'Maria Konstantinou', type: 'redeemed', amount: 300, description: 'Airport transfer redeemed', date: '2026-04-07' },
  { id: 't3', memberId: '3', memberName: 'Yannis Alexiou', type: 'earned', amount: 180, description: 'Booking completed - Seaside Apartment, Crete', date: '2026-04-06' },
  { id: 't4', memberId: '1', memberName: 'Dimitris Papadopoulos', type: 'redeemed', amount: 500, description: 'Exclusive wine tasting experience', date: '2026-04-05' },
  { id: 't5', memberId: '5', memberName: 'Kostas Nikolaou', type: 'earned', amount: 120, description: 'Booking completed - Studio, Thessaloniki', date: '2026-04-04' },
  { id: 't6', memberId: '4', memberName: 'Elena Michailidou', type: 'earned', amount: 250, description: 'Booking completed - Penthouse, Santorini', date: '2026-04-03' },
  { id: 't7', memberId: '6', memberName: 'Sofia Andreou', type: 'redeemed', amount: 150, description: 'Welcome basket redeemed', date: '2026-04-02' },
  { id: 't8', memberId: '2', memberName: 'Maria Konstantinou', type: 'earned', amount: 280, description: 'Booking completed - Beach House, Rhodes', date: '2026-04-01' },
  { id: 't9', memberId: '7', memberName: 'Nikos Georgiou', type: 'earned', amount: 90, description: 'Booking completed - Apartment, Corfu', date: '2026-03-28' },
  { id: 't10', memberId: '3', memberName: 'Yannis Alexiou', type: 'redeemed', amount: 200, description: 'Room upgrade redeemed', date: '2026-03-25' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function determineTier(points: number): Tier {
  if (points >= 5000) return 'diamond';
  if (points >= 3000) return 'platinum';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}

function getTierIndex(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LoyaltyAdminPage() {
  const [members, setMembers] = useState(demoMembers);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  // Derived data
  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const membersByTier = members.reduce<Record<Tier, number>>(
    (acc, m) => {
      acc[m.tier] = (acc[m.tier] ?? 0) + 1;
      return acc;
    },
    { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
  );

  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  const thisMonthEarned = demoTransactions
    .filter((tx) => tx.type === 'earned' && tx.date.startsWith('2026-04'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const thisMonthRedeemed = demoTransactions
    .filter((tx) => tx.type === 'redeemed' && tx.date.startsWith('2026-04'))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const activeStars = members.filter((m) => m.tier !== 'bronze').length;

  // Handlers
  const handleAwardPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newPoints = m.points + amount;
        return { ...m, points: newPoints, tier: determineTier(newPoints) };
      }),
    );
    setPointsInput((prev) => ({ ...prev, [id]: '' }));
    toast.success(`Awarded ${amount} stars`);
  };

  const handleDeductPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newPoints = Math.max(0, m.points - amount);
        return { ...m, points: newPoints, tier: determineTier(newPoints) };
      }),
    );
    setPointsInput((prev) => ({ ...prev, [id]: '' }));
    toast.success(`Deducted ${amount} stars`);
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const member: LoyaltyMember = {
      id: String(Date.now()),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      tier: 'bronze',
      points: 0,
      bookings: 0,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setMembers((prev) => [...prev, member]);
    setNewMember({ name: '', email: '' });
    setShowAddModal(false);
    toast.success('Member added to Stars program');
  };

  // KPI stats
  const stats = [
    { label: 'Total Members', value: members.length, icon: Users, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: 'Active Stars', value: activeStars, icon: Star, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: 'Points Issued', value: thisMonthEarned.toLocaleString(), subtitle: 'This month', icon: TrendingUp, color: 'bg-success/10', iconColor: 'text-success' },
    { label: 'Redemptions', value: thisMonthRedeemed.toLocaleString(), subtitle: 'This month', icon: Gift, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'members', label: 'Members' },
    { key: 'tiers', label: 'Tiers' },
    { key: 'benefits', label: 'Benefits' },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Loyalty Program
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Stars Loyalty Program
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage members, tiers, benefits, and reward transactions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-on-secondary font-semibold text-sm hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                {stat.label}
              </p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
            {stat.subtitle && (
              <p className="text-[10px] text-on-surface-variant mt-0.5">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-surface-container-lowest text-on-surface ambient-shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>

          {/* Members Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Member</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Email</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Tier</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Points</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Bookings</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Joined</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Manage Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const config = tierConfig[member.tier];
                    return (
                      <tr key={member.id} className="border-b border-outline/5 hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: config.hex + '25', color: config.hex }}
                            >
                              {member.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="font-medium text-on-surface">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{member.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                            style={{ backgroundColor: config.hex + '20', color: config.hex }}
                          >
                            <config.icon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end font-semibold text-on-surface">
                          {member.points.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-end text-on-surface-variant">
                          {member.bookings}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {formatDate(member.joinDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              placeholder="0"
                              value={pointsInput[member.id] || ''}
                              onChange={(e) =>
                                setPointsInput((prev) => ({ ...prev, [member.id]: e.target.value }))
                              }
                              className="w-20 px-2 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/30"
                            />
                            <button
                              onClick={() => handleAwardPoints(member.id)}
                              className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                              title="Award stars"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeductPoints(member.id)}
                              className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                              title="Deduct stars"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                        No members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TIER_ORDER.map((tierKey) => {
            const config = tierConfig[tierKey];
            return (
              <div
                key={tierKey}
                className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden"
              >
                {/* Tier header band */}
                <div
                  className="px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: config.hex + '15' }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: config.hex + '30' }}
                  >
                    <config.icon className="w-5 h-5" style={{ color: config.hex }} />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-bold text-on-surface">
                      {config.label}
                    </h3>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                      {config.threshold === 0
                        ? 'Entry Level'
                        : `${config.threshold.toLocaleString()}+ points required`}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Member count */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Members at this tier</span>
                    <span
                      className="font-headline text-lg font-bold"
                      style={{ color: config.hex }}
                    >
                      {membersByTier[tierKey]}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-outline/5" />

                  {/* Benefits list */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                      Benefits
                    </p>
                    <ul className="space-y-1.5">
                      {config.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-on-surface">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                            style={{ color: config.hex }}
                          />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === 'benefits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoBenefits.map((benefit) => {
              const minTierConfig = tierConfig[benefit.minTier];
              return (
                <div
                  key={benefit.id}
                  className={`bg-surface-container-lowest rounded-xl ambient-shadow p-5 transition-all ${
                    !benefit.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: minTierConfig.hex + '20' }}
                    >
                      <benefit.icon className="w-5 h-5" style={{ color: minTierConfig.hex }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-headline text-sm font-bold text-on-surface">
                          {benefit.name}
                        </h3>
                        {!benefit.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error/10 text-error">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mb-3">
                        {benefit.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                          style={{
                            backgroundColor: minTierConfig.hex + '20',
                            color: minTierConfig.hex,
                          }}
                        >
                          <minTierConfig.icon className="w-3 h-3" />
                          {minTierConfig.label}+
                        </span>
                        {benefit.pointsCost > 0 && (
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {benefit.pointsCost} stars to redeem
                          </span>
                        )}
                        {benefit.pointsCost === 0 && (
                          <span className="text-[10px] font-semibold text-success">
                            Included with tier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                    Earned This Month
                  </p>
                  <p className="font-headline text-lg font-bold text-success">
                    +{thisMonthEarned.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-error" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                    Redeemed This Month
                  </p>
                  <p className="font-headline text-lg font-bold text-error">
                    -{thisMonthRedeemed.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline/5">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Date</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Member</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Type</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Description</th>
                    <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Stars</th>
                  </tr>
                </thead>
                <tbody>
                  {demoTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-outline/5 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-on-surface">
                        {tx.memberName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${
                            tx.type === 'earned'
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {tx.type === 'earned' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {tx.description}
                      </td>
                      <td
                        className={`px-4 py-3 text-end font-semibold ${
                          tx.type === 'earned' ? 'text-success' : 'text-error'
                        }`}
                      >
                        {tx.type === 'earned' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-surface-container-lowest rounded-2xl ambient-shadow p-6 w-full max-w-md mx-4 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                Add New Member
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              New members start at Bronze tier with 0 stars.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Alexandros Dimitriou"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. alex@example.com"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline/5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-on-secondary text-sm font-semibold hover:shadow-lg transition-all"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
