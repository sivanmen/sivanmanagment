import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Users,
  Award,
  TrendingUp,
  Plus,
  Minus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  points: number;
  totalStays: number;
  joinDate: string;
}

const tierConfig: Record<Tier, { label: string; threshold: number; color: string; gradient: string; bgColor: string }> = {
  bronze: { label: 'Bronze', threshold: 0, color: 'text-amber-700', gradient: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-100' },
  silver: { label: 'Silver', threshold: 500, color: 'text-gray-500', gradient: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-100' },
  gold: { label: 'Gold', threshold: 1500, color: 'text-yellow-500', gradient: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-50' },
  platinum: { label: 'Platinum Star', threshold: 3000, color: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-50' },
};

const demoMembers: LoyaltyMember[] = [
  { id: '1', name: 'Dimitris Papadopoulos', email: 'd.papadopoulos@gmail.com', tier: 'platinum', points: 3450, totalStays: 0, joinDate: '2023-01-15' },
  { id: '2', name: 'Maria Konstantinou', email: 'm.konstantinou@yahoo.com', tier: 'gold', points: 2100, totalStays: 0, joinDate: '2023-06-10' },
  { id: '3', name: 'Yannis Alexiou', email: 'y.alexiou@outlook.com', tier: 'gold', points: 1850, totalStays: 0, joinDate: '2024-02-20' },
  { id: '4', name: 'Elena Michailidou', email: 'e.michailidou@gmail.com', tier: 'silver', points: 920, totalStays: 0, joinDate: '2024-05-01' },
  { id: '5', name: 'Kostas Nikolaou', email: 'k.nikolaou@mail.gr', tier: 'silver', points: 680, totalStays: 0, joinDate: '2024-08-15' },
  { id: '6', name: 'Sofia Andreou', email: 's.andreou@gmail.com', tier: 'bronze', points: 340, totalStays: 0, joinDate: '2025-01-10' },
  { id: '7', name: 'Nikos Georgiou', email: 'n.georgiou@outlook.com', tier: 'bronze', points: 180, totalStays: 0, joinDate: '2025-06-05' },
  { id: '8', name: 'Anna Vlachou', email: 'a.vlachou@yahoo.gr', tier: 'bronze', points: 95, totalStays: 0, joinDate: '2025-11-20' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LoyaltyAdminPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState(demoMembers);
  const [search, setSearch] = useState('');
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const membersByTier = members.reduce<Record<Tier, number>>((acc, m) => {
    acc[m.tier] = (acc[m.tier] ?? 0) + 1;
    return acc;
  }, { bronze: 0, silver: 0, gold: 0, platinum: 0 });

  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  const handleAwardPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newPoints = m.points + amount;
        let newTier: Tier = 'bronze';
        if (newPoints >= 3000) newTier = 'platinum';
        else if (newPoints >= 1500) newTier = 'gold';
        else if (newPoints >= 500) newTier = 'silver';
        return { ...m, points: newPoints, tier: newTier };
      }),
    );
    setPointsInput((prev) => ({ ...prev, [id]: '' }));
    toast.success(`Awarded ${amount} points`);
  };

  const handleDeductPoints = (id: string) => {
    const amount = parseInt(pointsInput[id] || '0');
    if (!amount || amount <= 0) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newPoints = Math.max(0, m.points - amount);
        let newTier: Tier = 'bronze';
        if (newPoints >= 3000) newTier = 'platinum';
        else if (newPoints >= 1500) newTier = 'gold';
        else if (newPoints >= 500) newTier = 'silver';
        return { ...m, points: newPoints, tier: newTier };
      }),
    );
    setPointsInput((prev) => ({ ...prev, [id]: '' }));
    toast.success(`Deducted ${amount} points`);
  };

  const stats = [
    { label: t('loyaltyAdmin.totalMembers'), value: members.length, icon: Users, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('loyaltyAdmin.totalPoints'), value: totalPoints.toLocaleString(), icon: Star, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: t('loyaltyAdmin.goldPlus'), value: membersByTier.gold + membersByTier.platinum, icon: Award, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('loyaltyAdmin.avgPoints'), value: Math.round(totalPoints / members.length), icon: TrendingUp, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          {t('loyaltyAdmin.label')}
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          {t('loyaltyAdmin.title')}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tier Configuration */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(tierConfig) as [Tier, typeof tierConfig.bronze][]).map(([key, config]) => (
          <div key={key} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-headline text-sm font-bold ${config.color}`}>{config.label}</h3>
                <p className="text-[10px] text-on-surface-variant">
                  {config.threshold === 0 ? t('loyaltyAdmin.entryLevel') : `${config.threshold}+ ${t('loyaltyAdmin.points')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">{t('loyaltyAdmin.members')}</span>
              <span className="font-headline text-lg font-bold text-on-surface">{membersByTier[key]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          placeholder={t('loyaltyAdmin.searchPlaceholder')}
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
              <tr className="border-b border-outline-variant/20">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('loyaltyAdmin.member')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('loyaltyAdmin.tier')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('loyaltyAdmin.points')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('loyaltyAdmin.joined')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('loyaltyAdmin.managePoints')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const config = tierConfig[member.tier];
                return (
                  <tr key={member.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-on-surface">{member.name}</p>
                        <p className="text-xs text-on-surface-variant">{member.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.bgColor} ${config.color}`}>
                        <Star className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end font-semibold text-on-surface">{member.points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(member.joinDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={pointsInput[member.id] || ''}
                          onChange={(e) => setPointsInput((prev) => ({ ...prev, [member.id]: e.target.value }))}
                          className="w-20 px-2 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                        <button
                          onClick={() => handleAwardPoints(member.id)}
                          className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                          title={t('loyaltyAdmin.award')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeductPoints(member.id)}
                          className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                          title={t('loyaltyAdmin.deduct')}
                        >
                          <Minus className="w-3.5 h-3.5" />
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
  );
}
