import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  Building2,
  Calendar,
  Tag,
  CircleDollarSign,
} from 'lucide-react';
import api from '../lib/api-client';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  propertyName: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'cleaning' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  resolvedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
}

const demoRequests: MaintenanceRequest[] = [
  {
    id: 'MR-2026-041',
    title: 'Water Heater Malfunction',
    description: 'Hot water not reaching adequate temperature. Guest reported lukewarm showers.',
    propertyName: 'Aegean Sunset Villa',
    category: 'plumbing',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-04-09',
    estimatedCost: 350,
  },
  {
    id: 'MR-2026-039',
    title: 'Air Conditioning Unit Noise',
    description: 'AC unit in master bedroom making rattling sound. Possible fan bearing issue.',
    propertyName: 'Heraklion Harbor Suite',
    category: 'hvac',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-04-08',
    estimatedCost: 200,
  },
  {
    id: 'MR-2026-037',
    title: 'Kitchen Faucet Leak',
    description: 'Slow drip from kitchen faucet. Washer may need replacement.',
    propertyName: 'Chania Old Town Residence',
    category: 'plumbing',
    priority: 'low',
    status: 'open',
    createdAt: '2026-04-07',
    estimatedCost: 80,
  },
  {
    id: 'MR-2026-035',
    title: 'Power Outlet Not Working',
    description: 'Two outlets in living room have no power. Circuit breaker checked, no trip.',
    propertyName: 'Rethymno Beachfront Studio',
    category: 'electrical',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2026-04-05',
    estimatedCost: 180,
  },
  {
    id: 'MR-2026-032',
    title: 'Dishwasher Error Code E4',
    description: 'Dishwasher displaying E4 error and not completing wash cycle.',
    propertyName: 'Aegean Sunset Villa',
    category: 'appliance',
    priority: 'medium',
    status: 'completed',
    createdAt: '2026-03-28',
    resolvedAt: '2026-04-02',
    estimatedCost: 250,
    actualCost: 220,
  },
  {
    id: 'MR-2026-029',
    title: 'Balcony Door Alignment',
    description: 'Sliding balcony door sticking and difficult to close properly.',
    propertyName: 'Heraklion Harbor Suite',
    category: 'structural',
    priority: 'medium',
    status: 'completed',
    createdAt: '2026-03-20',
    resolvedAt: '2026-03-25',
    estimatedCost: 120,
    actualCost: 95,
  },
  {
    id: 'MR-2026-026',
    title: 'Deep Cleaning After Long Stay',
    description: 'Full deep clean required after 30-day booking. Includes carpet and upholstery.',
    propertyName: 'Chania Old Town Residence',
    category: 'cleaning',
    priority: 'low',
    status: 'completed',
    createdAt: '2026-03-15',
    resolvedAt: '2026-03-17',
    estimatedCost: 300,
    actualCost: 280,
  },
  {
    id: 'MR-2026-040',
    title: 'Wi-Fi Router Replacement',
    description: 'Internet connection dropping frequently. Router is 4 years old.',
    propertyName: 'Rethymno Beachfront Studio',
    category: 'other',
    priority: 'urgent',
    status: 'open',
    createdAt: '2026-04-10',
    estimatedCost: 150,
  },
];

type StatusFilter = 'all' | 'open' | 'in_progress' | 'completed';

const statusConfig: Record<MaintenanceRequest['status'], { label: string; color: string; icon: typeof CheckCircle }> = {
  open: { label: 'Open', color: 'bg-error/10 text-error', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-warning/10 text-warning', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
};

const priorityConfig: Record<MaintenanceRequest['priority'], { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-on-surface-variant/10 text-on-surface-variant' },
  medium: { label: 'Medium', color: 'bg-warning/10 text-warning' },
  high: { label: 'High', color: 'bg-error/10 text-error' },
  urgent: { label: 'Urgent', color: 'bg-error/20 text-error' },
};

const categoryLabels: Record<MaintenanceRequest['category'], string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  appliance: 'Appliance',
  structural: 'Structural',
  cleaning: 'Cleaning',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MaintenanceRequestsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/maintenance');
        return res.data.data as MaintenanceRequest[];
      } catch {
        return demoRequests;
      }
    },
    initialData: demoRequests,
  });

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab !== 'all') {
      filtered = filtered.filter((r) => r.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.propertyName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [requests, activeTab, searchQuery]);

  // Stats
  const totalRequests = requests.length;
  const openCount = requests.filter((r) => r.status === 'open').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const totalCost = requests
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.actualCost || 0), 0);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('maintenance.all') },
    { key: 'open', label: t('maintenance.open') },
    { key: 'in_progress', label: t('maintenance.inProgress') },
    { key: 'completed', label: t('maintenance.completed') },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('maintenance.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('maintenance.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`${t('common.search')}...`}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-on-secondary text-sm font-medium whitespace-nowrap transition-all hover:opacity-90">
            <Plus className="w-4 h-4" />
            {t('maintenance.reportIssue')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{totalRequests}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('maintenance.totalRequests')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-error" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{openCount}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('maintenance.openIssues')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{inProgressCount}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('maintenance.inProgressCount')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{'\u20AC'}{totalCost.toLocaleString()}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('maintenance.resolvedCost')}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'gradient-accent text-on-secondary'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.map((request) => {
          const statusCfg = statusConfig[request.status];
          const priorityCfg = priorityConfig[request.priority];
          const StatusIcon = statusCfg.icon;

          return (
            <div
              key={request.id}
              className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-headline font-semibold text-on-surface text-lg">
                    {request.title}
                  </h3>
                  <span className="text-xs font-mono text-secondary">{request.id}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${statusCfg.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">
                {request.description}
              </p>

              {/* Property */}
              <div className="flex items-center gap-1.5 mb-3">
                <Building2 className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                <span className="text-xs text-on-surface-variant">{request.propertyName}</span>
              </div>

              {/* Badges row */}
              <div className="flex items-center flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-high text-on-surface-variant">
                  <Tag className="w-2.5 h-2.5" />
                  {categoryLabels[request.category]}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${priorityCfg.color}`}
                >
                  {priorityCfg.label}
                </span>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/50">
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(request.createdAt)}</span>
                  {request.resolvedAt && (
                    <>
                      <span className="mx-1">&rarr;</span>
                      <span>{formatDate(request.resolvedAt)}</span>
                    </>
                  )}
                </div>
                <div className="text-sm font-semibold text-on-surface">
                  {request.actualCost
                    ? `\u20AC${request.actualCost.toLocaleString()}`
                    : request.estimatedCost
                      ? `~\u20AC${request.estimatedCost.toLocaleString()}`
                      : '-'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Wrench className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium">{t('maintenance.noRequests')}</p>
        </div>
      )}
    </div>
  );
}
