import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Award,
  Gift,
  Copy,
  TrendingUp,
  Users,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api-client';

interface PointsHistoryEntry {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'earned' | 'redeemed';
}

interface LoyaltyData {
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPoints: number;
  pointsToNextTier: number;
  nextTier: string;
  nextTierThreshold: number;
  memberSince: string;
  referralCode: string;
  referralCount: number;
  pointsHistory: PointsHistoryEntry[];
  benefits: string[];
}

const demoLoyalty: LoyaltyData = {
  currentTier: 'gold',
  totalPoints: 2450,
  pointsToNextTier: 550,
  nextTier: 'Platinum',
  nextTierThreshold: 3000,
  memberSince: '2024-06-15',
  referralCode: 'SIVAN-GOLD-7X2K',
  referralCount: 3,
  pointsHistory: [
    {
      id: 'PH-001',
      date: '2026-04-10',
      description: 'Booking Revenue Bonus - April',
      points: 180,
      type: 'earned',
    },
    {
      id: 'PH-002',
      date: '2026-04-05',
      description: 'Referral Bonus - Elena K.',
      points: 250,
      type: 'earned',
    },
    {
      id: 'PH-003',
      date: '2026-03-31',
      description: 'Redeemed: Free Deep Cleaning',
      points: -300,
      type: 'redeemed',
    },
    {
      id: 'PH-004',
      date: '2026-03-15',
      description: 'Quarterly Loyalty Bonus',
      points: 500,
      type: 'earned',
    },
    {
      id: 'PH-005',
      date: '2026-03-01',
      description: 'Booking Revenue Bonus - March',
      points: 160,
      type: 'earned',
    },
    {
      id: 'PH-006',
      date: '2026-02-15',
      description: 'Redeemed: Priority Listing Boost',
      points: -200,
      type: 'redeemed',
    },
    {
      id: 'PH-007',
      date: '2026-02-01',
      description: 'Booking Revenue Bonus - February',
      points: 140,
      type: 'earned',
    },
    {
      id: 'PH-008',
      date: '2026-01-15',
      description: 'Annual Loyalty Anniversary',
      points: 300,
      type: 'earned',
    },
  ],
  benefits: [
    'loyalty.benefitPriority',
    'loyalty.benefitFeeDiscount',
    'loyalty.benefitDeepClean',
    'loyalty.benefitDedicated',
    'loyalty.benefitEarlyAccess',
    'loyalty.benefitQuarterly',
  ],
};

const tierConfig: Record<string, { color: string; gradient: string; bgColor: string }> = {
  bronze: { color: 'text-amber-700', gradient: 'from-amber-600 to-amber-800', bgColor: 'bg-amber-100' },
  silver: { color: 'text-gray-500', gradient: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-100' },
  gold: { color: 'text-yellow-500', gradient: 'from-yellow-400 to-yellow-600', bgColor: 'bg-yellow-50' },
  platinum: { color: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-600', bgColor: 'bg-indigo-50' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LoyaltyPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/loyalty');
        return res.data.data as LoyaltyData;
      } catch {
        return demoLoyalty;
      }
    },
    initialData: demoLoyalty,
  });

  const tier = tierConfig[loyalty.currentTier] || tierConfig.gold;
  const progressPercent = ((loyalty.totalPoints) / loyalty.nextTierThreshold) * 100;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(loyalty.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          {t('loyalty.subtitle')}
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          {t('loyalty.title')}
        </h1>
      </div>

      {/* Tier Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Tier */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center`}>
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                {t('loyalty.currentTier')}
              </p>
              <h2 className={`font-headline text-3xl font-bold capitalize ${tier.color}`}>
                {loyalty.currentTier}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t('loyalty.memberSince')} {formatDate(loyalty.memberSince)}
              </p>
            </div>
          </div>

          {/* Points & Progress */}
          <div className="mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  {t('loyalty.totalPoints')}
                </p>
                <p className="font-headline text-2xl font-bold text-on-surface">
                  {loyalty.totalPoints.toLocaleString()}
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">
                {loyalty.pointsToNextTier} {t('loyalty.pointsToNext')} {loyalty.nextTier}
              </p>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-on-surface-variant">
              <span>0</span>
              <span>{loyalty.nextTierThreshold.toLocaleString()} {t('loyalty.points')}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('loyalty.totalPoints')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {loyalty.totalPoints.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t('loyalty.referrals')}
              </p>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface">
              {loyalty.referralCount}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits + Referral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Benefits */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('loyalty.yourBenefits')}
            </h3>
          </div>
          <div className="space-y-3">
            {loyalty.benefits.map((benefitKey, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm text-on-surface">{t(benefitKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('loyalty.referralProgram')}
            </h3>
          </div>

          <p className="text-sm text-on-surface-variant mb-4">
            {t('loyalty.referralDescription')}
          </p>

          <div className="p-4 rounded-lg bg-surface-container-low mb-4">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              {t('loyalty.yourCode')}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-lg font-mono font-bold text-secondary">
                {loyalty.referralCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? t('loyalty.copied') : t('loyalty.copy')}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-success/5 border border-success/10 mt-auto">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-success" />
              <p className="text-xs font-semibold text-success">{t('loyalty.referralReward')}</p>
            </div>
            <p className="text-xs text-on-surface-variant">
              {t('loyalty.referralRewardDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('loyalty.pointsHistory')}
          </h3>
        </div>

        <div className="space-y-2">
          {loyalty.pointsHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    entry.type === 'earned' ? 'bg-success/10' : 'bg-error/10'
                  }`}
                >
                  {entry.type === 'earned' ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-error" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface truncate">{entry.description}</p>
                  <p className="text-xs text-on-surface-variant">{formatDate(entry.date)}</p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold flex-shrink-0 ms-3 ${
                  entry.type === 'earned' ? 'text-success' : 'text-error'
                }`}
              >
                {entry.type === 'earned' ? '+' : ''}{entry.points} {t('loyalty.pts')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
