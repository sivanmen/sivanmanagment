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
} from 'lucide-react';
import { toast } from 'sonner';

type AffiliateStatus = 'active' | 'inactive' | 'pending';

interface Affiliate {
  id: string;
  name: string;
  code: string;
  email: string;
  referrals: number;
  conversions: number;
  commissionEarned: number;
  status: AffiliateStatus;
  joinDate: string;
}

const statusStyles: Record<AffiliateStatus, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-outline-variant/20 text-on-surface-variant',
  pending: 'bg-warning/10 text-warning',
};

const demoAffiliates: Affiliate[] = [
  { id: '1', name: 'Travel Greece Partners', code: 'TGP-2024', email: 'partners@travelgreece.com', referrals: 45, conversions: 18, commissionEarned: 4320, status: 'active', joinDate: '2024-03-10' },
  { id: '2', name: 'Crete Luxury Living', code: 'CLL-2024', email: 'info@creteluxury.com', referrals: 32, conversions: 12, commissionEarned: 2880, status: 'active', joinDate: '2024-06-15' },
  { id: '3', name: 'Mediterranean Homes Blog', code: 'MHB-2024', email: 'editor@medhomes.blog', referrals: 28, conversions: 8, commissionEarned: 1920, status: 'active', joinDate: '2024-09-01' },
  { id: '4', name: 'Greek Islands Guide', code: 'GIG-2025', email: 'contact@greekislands.guide', referrals: 15, conversions: 4, commissionEarned: 960, status: 'pending', joinDate: '2025-01-20' },
  { id: '5', name: 'Euro Property Network', code: 'EPN-2025', email: 'affiliates@europrop.net', referrals: 8, conversions: 1, commissionEarned: 240, status: 'inactive', joinDate: '2025-04-05' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AffiliatesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [affiliates] = useState(demoAffiliates);

  const filteredAffiliates = affiliates.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q);
  });

  const totalAffiliates = affiliates.length;
  const totalReferrals = affiliates.reduce((sum, a) => sum + a.referrals, 0);
  const totalCommission = affiliates.reduce((sum, a) => sum + a.commissionEarned, 0);
  const totalConversions = affiliates.reduce((sum, a) => sum + a.conversions, 0);
  const conversionRate = totalReferrals > 0 ? ((totalConversions / totalReferrals) * 100).toFixed(1) : '0';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`);
  };

  const stats = [
    { label: t('affiliates.totalAffiliates'), value: totalAffiliates, icon: Users, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('affiliates.totalReferrals'), value: totalReferrals, icon: TrendingUp, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('affiliates.totalCommission'), value: `\u20AC${totalCommission.toLocaleString()}`, icon: DollarSign, color: 'bg-warning/10', iconColor: 'text-warning' },
    { label: t('affiliates.conversionRate'), value: `${conversionRate}%`, icon: Percent, color: 'bg-secondary/10', iconColor: 'text-secondary' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('affiliates.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('affiliates.title')}
          </h1>
        </div>
        <button
          onClick={() => toast.info('Add affiliate form coming soon')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('affiliates.addAffiliate')}</span>
        </button>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          placeholder={t('affiliates.searchPlaceholder')}
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
              <tr className="border-b border-outline-variant/20">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.partner')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.code')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.referrals')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.conversions')}</th>
                <th className="text-end px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.commission')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.status')}</th>
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('affiliates.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAffiliates.map((affiliate) => (
                <tr key={affiliate.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-on-surface">{affiliate.name}</p>
                      <p className="text-xs text-on-surface-variant">{affiliate.email}</p>
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
                  <td className="px-4 py-3 text-end text-on-surface font-medium">{affiliate.conversions}</td>
                  <td className="px-4 py-3 text-end font-semibold text-secondary">{'\u20AC'}{affiliate.commissionEarned.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[affiliate.status]}`}>
                      {affiliate.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(affiliate.joinDate)}</td>
                </tr>
              ))}
              {filteredAffiliates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
