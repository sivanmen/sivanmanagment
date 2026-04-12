import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  X,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  property?: { id: string; name: string };
  propertyName?: string;
  propertyId?: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  resolvedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
}

interface PropertyOption {
  id: string;
  name: string;
}

type StatusFilter = 'all' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  OPEN: { label: 'Open', color: 'bg-error/10 text-error', icon: AlertCircle },
  open: { label: 'Open', color: 'bg-error/10 text-error', icon: AlertCircle },
  ASSIGNED: { label: 'Assigned', color: 'bg-secondary/10 text-secondary', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-warning/10 text-warning', icon: Loader2 },
  in_progress: { label: 'In Progress', color: 'bg-warning/10 text-warning', icon: Loader2 },
  WAITING_PARTS: { label: 'Waiting Parts', color: 'bg-warning/10 text-warning', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-on-surface-variant/10 text-on-surface-variant', icon: X },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-on-surface-variant/10 text-on-surface-variant' },
  low: { label: 'Low', color: 'bg-on-surface-variant/10 text-on-surface-variant' },
  MEDIUM: { label: 'Medium', color: 'bg-warning/10 text-warning' },
  medium: { label: 'Medium', color: 'bg-warning/10 text-warning' },
  HIGH: { label: 'High', color: 'bg-error/10 text-error' },
  high: { label: 'High', color: 'bg-error/10 text-error' },
  URGENT: { label: 'Urgent', color: 'bg-error/20 text-error' },
  urgent: { label: 'Urgent', color: 'bg-error/20 text-error' },
};

const categoryLabels: Record<string, string> = {
  PLUMBING: 'Plumbing',
  plumbing: 'Plumbing',
  ELECTRICAL: 'Electrical',
  electrical: 'Electrical',
  HVAC: 'HVAC',
  hvac: 'HVAC',
  APPLIANCE: 'Appliance',
  appliance: 'Appliance',
  STRUCTURAL: 'Structural',
  structural: 'Structural',
  PEST: 'Pest Control',
  CLEANING: 'Cleaning',
  cleaning: 'Cleaning',
  LANDSCAPING: 'Landscaping',
  OTHER: 'Other',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPropertyName(r: MaintenanceRequest): string {
  return r.property?.name || r.propertyName || 'Property';
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-surface-container-high rounded w-3/4" />
          <div className="h-3 bg-surface-container-high rounded w-1/3" />
        </div>
        <div className="h-6 bg-surface-container-high rounded w-20" />
      </div>
      <div className="h-4 bg-surface-container-high rounded w-full mb-3" />
      <div className="h-3 bg-surface-container-high rounded w-1/2 mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-surface-container-high rounded w-16" />
        <div className="h-5 bg-surface-container-high rounded w-12" />
      </div>
      <div className="flex justify-between pt-3 border-t border-surface-container-high/50">
        <div className="h-3 bg-surface-container-high rounded w-24" />
        <div className="h-4 bg-surface-container-high rounded w-16" />
      </div>
    </div>
  );
}

export default function MaintenanceRequestsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for creating a new request
  const [newRequest, setNewRequest] = useState({
    propertyId: '',
    title: '',
    description: '',
    category: 'OTHER' as string,
    priority: 'MEDIUM' as string,
    estimatedCost: '' as string,
  });

  const {
    data: requestsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['maintenance-requests'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/maintenance', {
        params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      return res.data.data as MaintenanceRequest[];
    },
  });

  // Fetch properties for the create form
  const { data: propertiesData } = useQuery({
    queryKey: ['my-properties-for-maintenance'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/properties');
      return res.data.data as PropertyOption[];
    },
  });

  const properties = propertiesData ?? [];
  const requests = requestsResponse ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      propertyId: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      estimatedCost?: number;
    }) => {
      const res = await apiClient.post('/api/v1/maintenance', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      setShowCreateModal(false);
      setNewRequest({
        propertyId: '',
        title: '',
        description: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        estimatedCost: '',
      });
      toast.success('Maintenance request submitted successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to submit request: ${err.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.propertyId || !newRequest.title || !newRequest.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate({
      propertyId: newRequest.propertyId,
      title: newRequest.title,
      description: newRequest.description,
      category: newRequest.category,
      priority: newRequest.priority,
      estimatedCost: newRequest.estimatedCost ? Number(newRequest.estimatedCost) : undefined,
    });
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (activeTab !== 'all') {
      if (activeTab === 'IN_PROGRESS') {
        filtered = filtered.filter((r) => ['IN_PROGRESS', 'in_progress', 'ASSIGNED', 'WAITING_PARTS'].includes(r.status));
      } else {
        filtered = filtered.filter((r) => r.status.toUpperCase() === activeTab);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          getPropertyName(r).toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [requests, activeTab, searchQuery]);

  // Stats
  const totalRequests = requests.length;
  const openCount = requests.filter((r) => r.status.toUpperCase() === 'OPEN').length;
  const inProgressCount = requests.filter((r) =>
    ['IN_PROGRESS', 'ASSIGNED', 'WAITING_PARTS'].includes(r.status.toUpperCase()),
  ).length;
  const totalCost = requests
    .filter((r) => r.status.toUpperCase() === 'COMPLETED')
    .reduce((sum, r) => sum + (r.actualCost || 0), 0);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('maintenance.all') },
    { key: 'OPEN', label: t('maintenance.open') },
    { key: 'IN_PROGRESS', label: t('maintenance.inProgress') },
    { key: 'COMPLETED', label: t('maintenance.completed') },
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-on-secondary text-sm font-medium whitespace-nowrap transition-all hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {t('maintenance.reportIssue')}
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-error/5 border border-error/20 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-error flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-on-surface">Failed to load maintenance requests</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {(error as Error)?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-medium hover:bg-error/20 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high mb-2" />
              <div className="h-6 bg-surface-container-high rounded w-16 mb-1" />
              <div className="h-3 bg-surface-container-high rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
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
      )}

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
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((request) => {
            const statusCfg = statusConfig[request.status] || statusConfig.OPEN;
            const priorityCfg = priorityConfig[request.priority] || priorityConfig.MEDIUM;
            const StatusIcon = statusCfg.icon;
            const catLabel = categoryLabels[request.category] || request.category;
            const resolvedDate = request.completedAt || request.resolvedAt;

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
                    <span className="text-xs font-mono text-secondary">{request.id.substring(0, 16)}</span>
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
                  <span className="text-xs text-on-surface-variant">{getPropertyName(request)}</span>
                </div>

                {/* Badges row */}
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-high text-on-surface-variant">
                    <Tag className="w-2.5 h-2.5" />
                    {catLabel}
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
                    {resolvedDate && (
                      <>
                        <span className="mx-1">&rarr;</span>
                        <span>{formatDate(resolvedDate)}</span>
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
      )}

      {!isLoading && filteredRequests.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Wrench className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant font-medium">{t('maintenance.noRequests')}</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg ambient-shadow max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-container-high">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                Report Maintenance Issue
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {/* Property Select */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Property *
                </label>
                <select
                  value={newRequest.propertyId}
                  onChange={(e) => setNewRequest({ ...newRequest, propertyId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                >
                  <option value="">Select property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Description *
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Detailed description of the problem..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary resize-none"
                  required
                />
              </div>

              {/* Category + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newRequest.category}
                    onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="PEST">Pest Control</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="LANDSCAPING">Landscaping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Estimated Cost */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Estimated Cost (optional)
                </label>
                <input
                  type="number"
                  value={newRequest.estimatedCost}
                  onChange={(e) => setNewRequest({ ...newRequest, estimatedCost: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
