import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// -- Types ------------------------------------------------------------------

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

interface LoyaltyStats {
  totalMembers: number;
  activeStars: number;
  pointsIssuedThisMonth: number;
  redemptionsThisMonth: number;
  membersByTier: Record<Tier, number>;
  totalPoints: number;
}

// -- Tier Configuration -----------------------------------------------------

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

// -- Icon lookup for benefits from API --------------------------------------
const benefitIconMap: Record<string, React.ElementType> = {
  'Early Check-in': Clock,
  'Late Checkout': CalendarCheck,
  'Room Upgrade': Key,
  'Free Airport Transfer': Plane,
  'Welcome Basket': Gift,
  'Complimentary Breakfast': Coffee,
  'Exclusive Experiences': Sparkles,
  'Spa Treatment': Star,
};

// -- Helpers ----------------------------------------------------------------

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

// -- Component --------------------------------------------------------------

export default function LoyaltyAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  // ---- API Queries --------------------------------------------------------

  // Loyalty stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/loyalty/stats');
      return res.data.data as LoyaltyStats;
    },
  });

  // Members list
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['loyalty-members'],
    queryFn: async () => {
      const res = await apiClient.get('/loyalty/members');
      return res.data.data as LoyaltyMember[];
    },
  });

  // Tiers list
  const { data: tiersData } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const res = await apiClient.get('/loyalty/tiers');
      return res.data.data;
    },
  });

  const members = membersData ?? [];
  const stats = statsData;

  // ---- Derived Data -------------------------------------------------------

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const membersByTier = stats?.membersByTier ?? members.reduce<Record<Tier, number>>(
    (acc, m) => {
      acc[m.tier] = (acc[m.tier] ?? 0) + 1;
      return acc;
    },
    { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 },
  );

  const totalMembers = stats?.totalMembers ?? members.length;
  const activeStars = stats?.activeStars ?? members.filter((m) => m.tier !== 'bronze').length;
  const thisMonthEarned = stats?.pointsIssuedThisMonth ?? 0;
  const thisMonthRedeemed = stats?.redemptionsThisMonth ?? 0;

  // ---- Mutations ----------------------------------------------------------

  // Update tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ tierId, updates }: { tierId: string; updates: Record<string, unknown> }) => {
      const res = await apiClient.put(`/loyalty/tiers/${tierId}`, updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
    },
  });

  // Award / Deduct points (hypothetical endpoint, adjusting member points)
  const adjustPointsMutation = useMutation({
    mutationFn: async ({ memberId, amount }: { memberId: string; amount: number }) => {
      const res = await apiClient.put(`/loyalty/members/${memberId}/points`, { amount });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-members'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
    },
  });

  // Add member
  const addMemberMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await apiClient.post('/loyalty/members', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-members'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
      setNewMember({ name: '', email: '' });
      setShowAddModal(false);
      toast.success('Member added to Stars program');
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });

  // ---- Handlers -----------------------------------------------------------

  const handleAwardPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    adjustPointsMutation.mutate(
      { memberId: id, amount },
      {
        onSuccess: () => {
          setPointsInput((prev) => ({ ...prev, [id]: '' }));
          toast.success(`Awarded ${amount} stars`);
        },
      },
    );
  };

  const handleDeductPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    adjustPointsMutation.mutate(
      { memberId: id, amount: -amount },
      {
        onSuccess: () => {
          setPointsInput((prev) => ({ ...prev, [id]: '' }));
          toast.success(`Deducted ${amount} stars`);
        },
      },
    );
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    addMemberMutation.mutate(newMember);
  };

  // Merge tier data from API with local config
  const tiersFromApi = tiersData ?? [];
  const mergedTierConfig = TIER_ORDER.map((tierKey) => {
    const apiTier = Array.isArray(tiersFromApi) ? tiersFromApi.find((t: { name?: string; id?: string }) => t.name?.toLowerCase() === tierKey || t.id === tierKey) : undefined;
    return {
      ...tierConfig[tierKey],
      tierKey,
      ...(apiTier ?? {}),
    };
  });

  // Benefits from tiers or fallback
  const benefits: LoyaltyBenefit[] = (tiersFromApi as { benefits?: LoyaltyBenefit[] })?.benefits
    ? (tiersFromApi as { benefits: LoyaltyBenefit[] }).benefits
    : [];

  // Transactions from stats or separate endpoint
  const transactions: PointTransaction[] = (stats as unknown as { transactions?: PointTransaction[] })?.transactions ?? [];

  // ---- KPI Stats ----------------------------------------------------------

  const kpiStats = [
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'bg-secondary/10', iconColor: 'text-secondary' },
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

  const isLoading = statsLoading || membersLoading;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* -- Header --------------------------------------------------------- */}
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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* -- KPI Cards --------------------------------------------------- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiStats.map((stat) => (
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

          {/* -- Tabs -------------------------------------------------------- */}
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

          {/* -- Tab Content ------------------------------------------------- */}

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
                        const config = tierConfig[member.tier] ?? tierConfig.bronze;
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
                                  disabled={adjustPointsMutation.isPending}
                                  className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                                  title="Award stars"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeductPoints(member.id)}
                                  disabled={adjustPointsMutation.isPending}
                                  className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
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
              {mergedTierConfig.map((tier) => {
                const config = tierConfig[tier.tierKey as Tier] ?? tierConfig.bronze;
                return (
                  <div
                    key={tier.tierKey}
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
                          {membersByTier[tier.tierKey as Tier] ?? 0}
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
              {benefits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit) => {
                    const minTierCfg = tierConfig[benefit.minTier] ?? tierConfig.bronze;
                    const BenefitIcon = benefitIconMap[benefit.name] ?? Gift;
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
                            style={{ backgroundColor: minTierCfg.hex + '20' }}
                          >
                            <BenefitIcon className="w-5 h-5" style={{ color: minTierCfg.hex }} />
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
                                  backgroundColor: minTierCfg.hex + '20',
                                  color: minTierCfg.hex,
                                }}
                              >
                                <minTierCfg.icon className="w-3 h-3" />
                                {minTierCfg.label}+
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
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Benefits will appear here once configured.</p>
                </div>
              )}
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
              {transactions.length > 0 ? (
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
                        {transactions.map((tx) => (
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
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No transactions found for this period.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* -- Add Member Modal ------------------------------------------------ */}
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
                disabled={addMemberMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-on-secondary text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
