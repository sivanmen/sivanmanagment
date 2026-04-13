import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import { toast } from 'sonner';
import {
  Radio,
  Link2,
  Unlink,
  RefreshCw,
  BarChart3,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  Hash,
  ExternalLink,
  ArrowUpDown,
  Plus,
  Copy,
  Check,
  X,
  Clock,
  Rss,
  Globe,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Upload,
  Bell,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

type TabKey = 'overview' | 'matrix' | 'rates' | 'ical' | 'performance' | 'alerts';

interface ChannelData {
  id: string;
  name: string;
  logo: string;
  status: ConnectionStatus;
  lastSync: string | null;
  propertiesListed: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  color: string;
  bgColor: string;
  syncErrors: number;
  commission: number;
  avgRating: number;
}

interface PropertyListing {
  propertyId: string;
  propertyName: string;
  city: string;
  channels: Record<string, 'listed' | 'not_listed' | 'syncing'>;
}

interface ChannelRate {
  propertyId: string;
  propertyName: string;
  channelRates: Record<string, number>;
  baseRate: number;
}

interface SeasonalRateOverride {
  id: string;
  name: string;
  season: 'summer' | 'winter' | 'holiday' | 'shoulder' | 'custom';
  startDate: string;
  endDate: string;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  channelIds: string[];
  propertyIds: string[];
}

interface IcalFeed {
  id: string;
  propertyName: string;
  propertyId: string;
  channelName: string;
  importUrl: string;
  exportUrl: string;
  syncFrequency: number;
  lastSynced: string | null;
  syncStatus: 'ok' | 'error' | 'pending';
  syncError: string | null;
  isActive: boolean;
}

interface SyncLogEntry {
  id: string;
  timestamp: string;
  propertyName: string;
  channelName: string;
  direction: 'import' | 'export';
  status: 'success' | 'fail';
  eventsCount: number;
  message: string;
}

interface ChannelAlert {
  id: string;
  type: 'sync_failure' | 'rate_mismatch' | 'listing_issue' | 'booking_conflict';
  severity: 'high' | 'medium' | 'low';
  channelName: string;
  propertyName: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function statusIcon(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-3.5 h-3.5 text-success" />;
    case 'disconnected':
      return <XCircle className="w-3.5 h-3.5 text-on-surface-variant" />;
    case 'error':
      return <AlertTriangle className="w-3.5 h-3.5 text-error" />;
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-warning" />;
  }
}

function statusLabel(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Error';
    case 'pending':
      return 'Pending';
  }
}

function statusColor(status: ConnectionStatus) {
  switch (status) {
    case 'connected':
      return 'text-success';
    case 'disconnected':
      return 'text-on-surface-variant';
    case 'error':
      return 'text-error';
    case 'pending':
      return 'text-warning';
  }
}

function seasonBadgeColor(season: string) {
  switch (season) {
    case 'summer':
      return 'bg-amber-500/10 text-amber-600';
    case 'winter':
      return 'bg-blue-500/10 text-blue-500';
    case 'holiday':
      return 'bg-red-500/10 text-red-500';
    case 'shoulder':
      return 'bg-emerald-500/10 text-emerald-600';
    default:
      return 'bg-secondary/10 text-secondary';
  }
}

const CHART_COLORS = ['#FF5A5F', '#003580', '#3D67FF', '#FBCE38', '#4285F4', '#6b38d4'];

// ============================================================================
// TAB NAVIGATION
// ============================================================================

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: Radio },
  { key: 'matrix', label: 'Property Matrix', icon: Hash },
  { key: 'rates', label: 'Rate Management', icon: DollarSign },
  { key: 'ical', label: 'iCal Sync', icon: Calendar },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'alerts', label: 'Alerts', icon: Bell },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChannelsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [bulkAdjustType, setBulkAdjustType] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkAdjustValue, setBulkAdjustValue] = useState('');
  const [bulkAdjustChannel, setBulkAdjustChannel] = useState('all');
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedProperty, setNewFeedProperty] = useState('');
  const [newFeedChannel, setNewFeedChannel] = useState('');
  const [newFeedFrequency, setNewFeedFrequency] = useState(15);
  const [matrixSearch, setMatrixSearch] = useState('');
  const [rateSearch, setRateSearch] = useState('');
  const [copiedFeedId, setCopiedFeedId] = useState<string | null>(null);

  // ---- API Queries --------------------------------------------------------

  // Channels list
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await apiClient.get('/channels');
      return res.data.data as ChannelData[];
    },
  });

  // Channel stats
  const { data: channelStats } = useQuery({
    queryKey: ['channels-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/channels/stats');
      return res.data.data;
    },
  });

  // iCal feeds
  const { data: icalFeedsData, isLoading: icalLoading } = useQuery({
    queryKey: ['ical-feeds'],
    queryFn: async () => {
      const res = await apiClient.get('/calendar/ical-feeds');
      return res.data.data as IcalFeed[];
    },
  });

  const channels = channelsData ?? [];
  const icalFeeds = icalFeedsData ?? [];

  // Derived from channel stats or computed from channels
  const statsFromApi = channelStats ?? {};
  const propertyListings: PropertyListing[] = statsFromApi.propertyListings ?? [];
  const channelRates: ChannelRate[] = statsFromApi.channelRates ?? [];
  const seasonalRates: SeasonalRateOverride[] = statsFromApi.seasonalRates ?? [];
  const syncLog: SyncLogEntry[] = statsFromApi.syncLog ?? [];
  const alerts: ChannelAlert[] = statsFromApi.alerts ?? [];
  const performanceData = statsFromApi.performance ?? {};

  const connected = channels.filter((c) => c.status === 'connected').length;
  const totalListings = channels.reduce((sum, c) => sum + (c.propertiesListed ?? 0), 0);
  const totalBookings = channels.reduce((sum, c) => sum + (c.bookingsThisMonth ?? 0), 0);
  const totalRevenue = channels.reduce((sum, c) => sum + (c.revenueThisMonth ?? 0), 0);
  const totalErrors = channels.reduce((sum, c) => sum + (c.syncErrors ?? 0), 0);
  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length;

  // ---- Mutations ----------------------------------------------------------

  // Sync a single iCal feed
  const syncFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      await apiClient.post(`/calendar/ical-feeds/${feedId}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ical-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Feed synced successfully');
    },
    onError: () => {
      toast.error('Sync failed');
    },
  });

  // Create iCal feed
  const createFeedMutation = useMutation({
    mutationFn: async (data: { importUrl: string; propertyId: string; channelName: string; syncFrequency: number }) => {
      const res = await apiClient.post('/calendar/ical-feeds', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ical-feeds'] });
      setShowAddFeed(false);
      setNewFeedUrl('');
      setNewFeedChannel('');
      toast.success('iCal feed added');
    },
    onError: () => {
      toast.error('Failed to add feed');
    },
  });

  // Delete iCal feed
  const deleteFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      await apiClient.delete(`/calendar/ical-feeds/${feedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ical-feeds'] });
      toast.success('Feed deleted');
    },
  });

  // ---- Handlers -----------------------------------------------------------

  const handleSync = useCallback(
    (id: string) => {
      setSyncing(id);
      // Sync via channels endpoint -- optimistic update
      apiClient.post(`/channels/${id}/sync`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        setSyncing(null);
        toast.success(`${channels.find((c) => c.id === id)?.name} synced successfully`);
      }).catch(() => {
        setSyncing(null);
        toast.error('Sync failed');
      });
    },
    [channels, queryClient],
  );

  const handleToggleConnection = useCallback(
    (id: string) => {
      const channel = channels.find((c) => c.id === id);
      if (!channel) return;
      const newStatus = channel.status === 'connected' ? 'disconnected' : 'connected';
      apiClient.put(`/channels/${id}`, { status: newStatus }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        toast.success(
          newStatus === 'connected'
            ? `${channel.name} connected`
            : `${channel.name} disconnected`,
        );
      }).catch(() => {
        toast.error('Failed to update connection');
      });
    },
    [channels, queryClient],
  );

  const handleToggleListing = useCallback(
    (propertyId: string, channelId: string) => {
      apiClient.put(`/channels/${channelId}/listings/${propertyId}/toggle`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['channels-stats'] });
        toast.success('Listing status updated');
      }).catch(() => {
        toast.error('Failed to update listing');
      });
    },
    [queryClient],
  );

  const handleBulkRateAdjust = useCallback(() => {
    const val = parseFloat(bulkAdjustValue);
    if (isNaN(val) || val === 0) {
      toast.error('Enter a valid adjustment value');
      return;
    }
    apiClient.post('/channels/rates/bulk-adjust', {
      type: bulkAdjustType,
      value: val,
      channel: bulkAdjustChannel,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['channels-stats'] });
      toast.success(
        `Rates adjusted by ${bulkAdjustType === 'percentage' ? val + '%' : formatCurrency(val)} ${bulkAdjustChannel === 'all' ? 'across all channels' : `on ${channels.find((c) => c.id === bulkAdjustChannel)?.name}`}`,
      );
      setBulkAdjustValue('');
    }).catch(() => {
      toast.error('Failed to adjust rates');
    });
  }, [bulkAdjustValue, bulkAdjustType, bulkAdjustChannel, channels, queryClient]);

  const handleCopyFeedUrl = useCallback((feedId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedFeedId(feedId);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedFeedId(null), 2000);
  }, []);

  const handleToggleFeed = useCallback((feedId: string) => {
    apiClient.put(`/calendar/ical-feeds/${feedId}/toggle`).then(() => {
      queryClient.invalidateQueries({ queryKey: ['ical-feeds'] });
      toast.success('Feed status updated');
    }).catch(() => {
      // Fallback: just invalidate
      queryClient.invalidateQueries({ queryKey: ['ical-feeds'] });
      toast.success('Feed status updated');
    });
  }, [queryClient]);

  const handleAddFeed = useCallback(() => {
    if (!newFeedUrl || !newFeedChannel) {
      toast.error('Please fill in all fields');
      return;
    }
    createFeedMutation.mutate({
      importUrl: newFeedUrl,
      propertyId: newFeedProperty,
      channelName: newFeedChannel,
      syncFrequency: newFeedFrequency,
    });
  }, [newFeedUrl, newFeedProperty, newFeedChannel, newFeedFrequency, createFeedMutation]);

  const handleResolveAlert = useCallback((alertId: string) => {
    apiClient.put(`/channels/alerts/${alertId}/resolve`).then(() => {
      queryClient.invalidateQueries({ queryKey: ['channels-stats'] });
      toast.success('Alert resolved');
    }).catch(() => {
      toast.error('Failed to resolve alert');
    });
  }, [queryClient]);

  const handleDismissAlert = useCallback((alertId: string) => {
    apiClient.delete(`/channels/alerts/${alertId}`).then(() => {
      queryClient.invalidateQueries({ queryKey: ['channels-stats'] });
      toast.success('Alert dismissed');
    }).catch(() => {
      toast.error('Failed to dismiss alert');
    });
  }, [queryClient]);

  // Filtered data
  const filteredListings = useMemo(
    () =>
      propertyListings.filter(
        (p) =>
          p.propertyName.toLowerCase().includes(matrixSearch.toLowerCase()) ||
          p.city.toLowerCase().includes(matrixSearch.toLowerCase()),
      ),
    [propertyListings, matrixSearch],
  );

  const filteredRates = useMemo(
    () =>
      channelRates.filter((r) =>
        r.propertyName.toLowerCase().includes(rateSearch.toLowerCase()),
      ),
    [channelRates, rateSearch],
  );

  // Rate parity issues
  const rateParityIssues = useMemo(() => {
    const issues: { propertyName: string; channel: string; rate: number; baseRate: number; diff: number }[] = [];
    channelRates.forEach((r) => {
      Object.entries(r.channelRates).forEach(([ch, rate]) => {
        const diffPercent = Math.abs(((rate - r.baseRate) / r.baseRate) * 100);
        if (diffPercent > 10) {
          issues.push({
            propertyName: r.propertyName,
            channel: channels.find((c) => c.id === ch)?.name || ch,
            rate,
            baseRate: r.baseRate,
            diff: Math.round(diffPercent),
          });
        }
      });
    });
    return issues;
  }, [channelRates, channels]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Channel Manager
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            OTA Channel Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              channels.filter((c) => c.status === 'connected').forEach((c) => handleSync(c.id));
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Sync All
          </button>
        </div>
      </div>

      {/* Loading */}
      {channelsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      {!channelsLoading && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { label: 'Connected', value: `${connected}/${channels.length}`, icon: Wifi, color: 'bg-success/10', iconColor: 'text-success' },
              { label: 'Listings', value: totalListings, icon: Hash, color: 'bg-secondary/10', iconColor: 'text-secondary' },
              { label: 'Bookings (Apr)', value: totalBookings, icon: Calendar, color: 'bg-blue-500/10', iconColor: 'text-blue-500' },
              { label: 'Revenue (Apr)', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
              { label: 'Sync Errors', value: totalErrors, icon: AlertTriangle, color: totalErrors > 0 ? 'bg-error/10' : 'bg-success/10', iconColor: totalErrors > 0 ? 'text-error' : 'text-success' },
              { label: 'Active Alerts', value: unresolvedAlerts, icon: Bell, color: unresolvedAlerts > 0 ? 'bg-warning/10' : 'bg-success/10', iconColor: unresolvedAlerts > 0 ? 'text-warning' : 'text-success' },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {stat.label}
                  </p>
                  <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-surface-container-lowest rounded-xl p-1.5 ambient-shadow overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'gradient-accent text-white shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === 'alerts' && unresolvedAlerts > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                      {unresolvedAlerts}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab
              channels={channels}
              syncing={syncing}
              onSync={handleSync}
              onToggle={handleToggleConnection}
            />
          )}
          {activeTab === 'matrix' && (
            <MatrixTab
              listings={filteredListings}
              channels={channels}
              search={matrixSearch}
              onSearchChange={setMatrixSearch}
              onToggleListing={handleToggleListing}
            />
          )}
          {activeTab === 'rates' && (
            <RatesTab
              rates={filteredRates}
              channels={channels}
              seasonalRates={seasonalRates}
              rateParityIssues={rateParityIssues}
              search={rateSearch}
              onSearchChange={setRateSearch}
              bulkAdjustType={bulkAdjustType}
              setBulkAdjustType={setBulkAdjustType}
              bulkAdjustValue={bulkAdjustValue}
              setBulkAdjustValue={setBulkAdjustValue}
              bulkAdjustChannel={bulkAdjustChannel}
              setBulkAdjustChannel={setBulkAdjustChannel}
              onBulkAdjust={handleBulkRateAdjust}
            />
          )}
          {activeTab === 'ical' && (
            <IcalTab
              feeds={icalFeeds}
              syncLog={syncLog}
              showAddFeed={showAddFeed}
              setShowAddFeed={setShowAddFeed}
              newFeedUrl={newFeedUrl}
              setNewFeedUrl={setNewFeedUrl}
              newFeedProperty={newFeedProperty}
              setNewFeedProperty={setNewFeedProperty}
              newFeedChannel={newFeedChannel}
              setNewFeedChannel={setNewFeedChannel}
              newFeedFrequency={newFeedFrequency}
              setNewFeedFrequency={setNewFeedFrequency}
              onAddFeed={handleAddFeed}
              onCopyUrl={handleCopyFeedUrl}
              copiedFeedId={copiedFeedId}
              onToggleFeed={handleToggleFeed}
              onSyncFeed={(feedId: string) => syncFeedMutation.mutate(feedId)}
              onDeleteFeed={(feedId: string) => deleteFeedMutation.mutate(feedId)}
              isLoading={icalLoading}
            />
          )}
          {activeTab === 'performance' && <PerformanceTab channels={channels} performanceData={performanceData} />}
          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              onResolve={handleResolveAlert}
              onDismiss={handleDismissAlert}
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// TAB: OVERVIEW
// ============================================================================

function OverviewTab({
  channels,
  syncing,
  onSync,
  onToggle,
}: {
  channels: ChannelData[];
  syncing: string | null;
  onSync: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {channels.map((channel) => (
        <div
          key={channel.id}
          className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: channel.color }}
              >
                {channel.logo}
              </div>
              <div>
                <h3 className="font-headline text-base font-semibold text-on-surface">
                  {channel.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusIcon(channel.status)}
                  <span className={`text-xs font-medium ${statusColor(channel.status)}`}>
                    {statusLabel(channel.status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onToggle(channel.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                channel.status === 'connected'
                  ? 'bg-error/10 text-error hover:bg-error/20'
                  : 'bg-success/10 text-success hover:bg-success/20'
              }`}
            >
              {channel.status === 'connected' ? (
                <>
                  <Unlink className="w-3 h-3" />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 className="w-3 h-3" />
                  Connect
                </>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Properties</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.propertiesListed}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Bookings</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.bookingsThisMonth}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Revenue</p>
              <p className="font-headline text-sm font-bold text-on-surface">{formatCurrency(channel.revenueThisMonth)}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Commission</p>
              <p className="font-headline text-lg font-bold text-on-surface">{channel.commission}%</p>
            </div>
          </div>

          {/* Sync Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-xs text-on-surface-variant">Last sync:</span>
            </div>
            <span className="text-xs font-medium text-on-surface">
              {channel.lastSync ? relativeTime(channel.lastSync) : '--'}
            </span>
          </div>

          {/* Errors */}
          {channel.syncErrors > 0 && (
            <div className="p-3 rounded-lg bg-error/5 border border-error/10 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-error" />
                <p className="text-xs text-error font-medium">
                  {channel.syncErrors} sync error{channel.syncErrors > 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {channel.status === 'connected' && (
              <button
                onClick={() => onSync(channel.id)}
                disabled={syncing === channel.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${syncing === channel.id ? 'animate-spin' : ''}`}
                />
                {syncing === channel.id ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
            {channel.status === 'error' && (
              <button
                onClick={() => onSync(channel.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-error bg-error/10 hover:bg-error/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
            <button className="flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TAB: PROPERTY-CHANNEL MATRIX
// ============================================================================

function MatrixTab({
  listings,
  channels,
  search,
  onSearchChange,
  onToggleListing,
}: {
  listings: PropertyListing[];
  channels: ChannelData[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggleListing: (propertyId: string, channelId: string) => void;
}) {
  const activeChannels = channels;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          {listings.length} properties
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant sticky start-0 bg-surface-container-lowest z-10 min-w-[200px]">
                  Property
                </th>
                {activeChannels.map((ch) => (
                  <th key={ch.id} className="px-3 py-3 text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: ch.color }}
                      >
                        {ch.logo}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {ch.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, idx) => (
                <tr
                  key={listing.propertyId}
                  className={`border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-surface-container-low/20'
                  }`}
                >
                  <td className="px-4 py-3 sticky start-0 bg-inherit z-10">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{listing.propertyName}</p>
                      <p className="text-[11px] text-on-surface-variant">{listing.city}</p>
                    </div>
                  </td>
                  {activeChannels.map((ch) => {
                    const status = listing.channels[ch.id] || 'not_listed';
                    return (
                      <td key={ch.id} className="px-3 py-3 text-center">
                        <button
                          onClick={() => onToggleListing(listing.propertyId, ch.id)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto transition-all hover:scale-110 ${
                            status === 'listed'
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : status === 'syncing'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-surface-container-high text-on-surface-variant/40 hover:bg-surface-container-highest hover:text-on-surface-variant'
                          }`}
                          title={
                            status === 'listed'
                              ? 'Listed - click to unlist'
                              : status === 'syncing'
                                ? 'Syncing...'
                                : 'Not listed - click to list'
                          }
                        >
                          {status === 'listed' ? (
                            <Check className="w-4 h-4" />
                          ) : status === 'syncing' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={channels.length + 1} className="px-4 py-12 text-center text-on-surface-variant">
                    No property listings found.
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

// ============================================================================
// TAB: RATE MANAGEMENT
// ============================================================================

function RatesTab({
  rates,
  channels,
  seasonalRates,
  rateParityIssues,
  search,
  onSearchChange,
  bulkAdjustType,
  setBulkAdjustType,
  bulkAdjustValue,
  setBulkAdjustValue,
  bulkAdjustChannel,
  setBulkAdjustChannel,
  onBulkAdjust,
}: {
  rates: ChannelRate[];
  channels: ChannelData[];
  seasonalRates: SeasonalRateOverride[];
  rateParityIssues: { propertyName: string; channel: string; rate: number; baseRate: number; diff: number }[];
  search: string;
  onSearchChange: (v: string) => void;
  bulkAdjustType: 'percentage' | 'fixed';
  setBulkAdjustType: (v: 'percentage' | 'fixed') => void;
  bulkAdjustValue: string;
  setBulkAdjustValue: (v: string) => void;
  bulkAdjustChannel: string;
  setBulkAdjustChannel: (v: string) => void;
  onBulkAdjust: () => void;
}) {
  const [rateSection, setRateSection] = useState<'grid' | 'seasonal' | 'parity'>('grid');
  const activeChannels = channels.filter((c) => c.status !== 'disconnected');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'grid', label: 'Rate Grid', icon: DollarSign },
          { key: 'seasonal', label: 'Seasonal Overrides', icon: Calendar },
          { key: 'parity', label: 'Rate Parity', icon: ArrowUpDown },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setRateSection(st.key as 'grid' | 'seasonal' | 'parity')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                rateSection === st.key
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
              {st.key === 'parity' && rateParityIssues.length > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-warning/80 text-white text-[9px] font-bold flex items-center justify-center">
                  {rateParityIssues.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk Rate Adjustment */}
      <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-semibold text-on-surface">Bulk Rate Adjustment</h3>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Type</label>
            <select
              value={bulkAdjustType}
              onChange={(e) => setBulkAdjustType(e.target.value as 'percentage' | 'fixed')}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Value</label>
            <input
              type="number"
              value={bulkAdjustValue}
              onChange={(e) => setBulkAdjustValue(e.target.value)}
              placeholder={bulkAdjustType === 'percentage' ? 'e.g. 10 or -5' : 'e.g. 20 or -10'}
              className="w-32 px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Channel</label>
            <select
              value={bulkAdjustChannel}
              onChange={(e) => setBulkAdjustChannel(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="all">All Channels</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onBulkAdjust}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* Rate Grid */}
      {rateSection === 'grid' && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full ps-9 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant sticky start-0 bg-surface-container-lowest z-10 min-w-[180px]">Property</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant min-w-[80px]">Base</th>
                    {activeChannels.map((ch) => (
                      <th key={ch.id} className="px-3 py-3 text-center min-w-[90px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ch.color }}>{ch.logo}</div>
                          <span className="text-[10px] font-semibold text-on-surface-variant">{ch.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate, idx) => (
                    <tr key={rate.propertyId} className={`border-b border-outline-variant/5 ${idx % 2 === 0 ? '' : 'bg-surface-container-low/20'}`}>
                      <td className="px-4 py-3 sticky start-0 bg-inherit z-10">
                        <p className="text-sm font-medium text-on-surface">{rate.propertyName}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-sm font-semibold text-on-surface">{formatCurrency(rate.baseRate)}</span>
                      </td>
                      {activeChannels.map((ch) => {
                        const chRate = rate.channelRates[ch.id] || 0;
                        const diff = chRate - rate.baseRate;
                        const diffPercent = Math.round((diff / rate.baseRate) * 100);
                        const isHighDiff = Math.abs(diffPercent) > 10;
                        return (
                          <td key={ch.id} className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-medium ${isHighDiff ? 'text-warning' : 'text-on-surface'}`}>{formatCurrency(chRate)}</span>
                              {diff !== 0 && (
                                <span className={`text-[10px] font-medium ${diff > 0 ? 'text-success' : 'text-error'}`}>
                                  {diff > 0 ? '+' : ''}{diffPercent}%
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {rates.length === 0 && (
                    <tr><td colSpan={activeChannels.length + 2} className="px-4 py-12 text-center text-on-surface-variant">No rate data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Overrides */}
      {rateSection === 'seasonal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">Seasonal Rate Overrides</h3>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all">
              <Plus className="w-3.5 h-3.5" />
              Add Season
            </button>
          </div>
          {seasonalRates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seasonalRates.map((sr) => (
                <div key={sr.id} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow hover:shadow-ambient-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface">{sr.name}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase mt-1 ${seasonBadgeColor(sr.season)}`}>{sr.season}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sr.adjustmentValue > 0 ? <ArrowUp className="w-4 h-4 text-success" /> : <ArrowDown className="w-4 h-4 text-error" />}
                      <span className={`text-lg font-bold ${sr.adjustmentValue > 0 ? 'text-success' : 'text-error'}`}>
                        {sr.adjustmentValue > 0 ? '+' : ''}{sr.adjustmentValue}{sr.adjustmentType === 'percentage' ? '%' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Calendar className="w-3.5 h-3.5" /><span>{formatDateShort(sr.startDate)} - {formatDateShort(sr.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Radio className="w-3.5 h-3.5" /><span>{sr.channelIds.length} channels</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Hash className="w-3.5 h-3.5" /><span>{sr.propertyIds.length} properties</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {sr.channelIds.map((chId) => {
                      const ch = channels.find((c) => c.id === chId);
                      if (!ch) return null;
                      return (
                        <div key={chId} className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: ch.color }} title={ch.name}>{ch.logo}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No seasonal overrides configured.</p>
            </div>
          )}
        </div>
      )}

      {/* Rate Parity Checker */}
      {rateSection === 'parity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Rate Parity Checker</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Properties with rate discrepancies greater than 10% from base rate</p>
            </div>
            {rateParityIssues.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-xs font-medium text-success">All rates in parity</span>
              </div>
            )}
          </div>
          {rateParityIssues.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Channel</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Base Rate</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Channel Rate</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Variance</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rateParityIssues.map((issue, idx) => (
                    <tr key={idx} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 text-sm text-on-surface">{issue.propertyName}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{issue.channel}</td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">{formatCurrency(issue.baseRate)}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">{formatCurrency(issue.rate)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${issue.rate > issue.baseRate ? 'text-success' : 'text-error'}`}>
                          {issue.rate > issue.baseRate ? '+' : '-'}{issue.diff}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-[10px] font-semibold uppercase">
                          <AlertTriangle className="w-3 h-3" />Mismatch
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB: iCAL SYNC
// ============================================================================

function IcalTab({
  feeds,
  syncLog,
  showAddFeed,
  setShowAddFeed,
  newFeedUrl,
  setNewFeedUrl,
  newFeedProperty,
  setNewFeedProperty,
  newFeedChannel,
  setNewFeedChannel,
  newFeedFrequency,
  setNewFeedFrequency,
  onAddFeed,
  onCopyUrl,
  copiedFeedId,
  onToggleFeed,
  onSyncFeed,
  onDeleteFeed,
  isLoading,
}: {
  feeds: IcalFeed[];
  syncLog: SyncLogEntry[];
  showAddFeed: boolean;
  setShowAddFeed: (v: boolean) => void;
  newFeedUrl: string;
  setNewFeedUrl: (v: string) => void;
  newFeedProperty: string;
  setNewFeedProperty: (v: string) => void;
  newFeedChannel: string;
  setNewFeedChannel: (v: string) => void;
  newFeedFrequency: number;
  setNewFeedFrequency: (v: number) => void;
  onAddFeed: () => void;
  onCopyUrl: (feedId: string, url: string) => void;
  copiedFeedId: string | null;
  onToggleFeed: (feedId: string) => void;
  onSyncFeed: (feedId: string) => void;
  onDeleteFeed: (feedId: string) => void;
  isLoading: boolean;
}) {
  const [icalSection, setIcalSection] = useState<'import' | 'export' | 'log'>('import');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'import', label: 'Import Feeds', icon: Download },
          { key: 'export', label: 'Export Feeds', icon: Upload },
          { key: 'log', label: 'Sync Log', icon: Clock },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <button
              key={st.key}
              onClick={() => setIcalSection(st.key as 'import' | 'export' | 'log')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                icalSection === st.key
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Import Feeds */}
          {icalSection === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">iCal Import Feeds</h3>
                <button
                  onClick={() => setShowAddFeed(!showAddFeed)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Feed
                </button>
              </div>

              {/* Add Feed Form */}
              {showAddFeed && (
                <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow border border-secondary/20">
                  <h4 className="text-sm font-semibold text-on-surface mb-3">New iCal Import Feed</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">iCal URL</label>
                      <input
                        type="url"
                        value={newFeedUrl}
                        onChange={(e) => setNewFeedUrl(e.target.value)}
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Property ID</label>
                      <input
                        type="text"
                        value={newFeedProperty}
                        onChange={(e) => setNewFeedProperty(e.target.value)}
                        placeholder="Property ID"
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Channel Name</label>
                      <input
                        type="text"
                        value={newFeedChannel}
                        onChange={(e) => setNewFeedChannel(e.target.value)}
                        placeholder="e.g. Airbnb, Booking.com"
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mb-1 block">Sync Frequency</label>
                      <select
                        value={newFeedFrequency}
                        onChange={(e) => setNewFeedFrequency(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      >
                        <option value={5}>Every 5 minutes</option>
                        <option value={15}>Every 15 minutes</option>
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every hour</option>
                        <option value={360}>Every 6 hours</option>
                        <option value={1440}>Every 24 hours</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <button onClick={onAddFeed} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all">
                          <Plus className="w-3.5 h-3.5" />Add Feed
                        </button>
                        <button onClick={() => setShowAddFeed(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed List */}
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className={`bg-surface-container-lowest rounded-xl p-4 ambient-shadow ${!feed.isActive ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-on-surface">{feed.propertyName}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-semibold">{feed.channelName}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 font-mono truncate max-w-md">{feed.importUrl}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase ${
                          feed.syncStatus === 'ok' ? 'bg-success/10 text-success' : feed.syncStatus === 'error' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                        }`}>
                          {feed.syncStatus === 'ok' ? <CheckCircle className="w-3 h-3" /> : feed.syncStatus === 'error' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {feed.syncStatus}
                        </div>
                        <button onClick={() => onSyncFeed(feed.id)} className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title="Sync now">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => onToggleFeed(feed.id)} className={`p-1.5 rounded-lg transition-colors ${feed.isActive ? 'text-success hover:bg-success/10' : 'text-on-surface-variant hover:bg-surface-container-high'}`} title={feed.isActive ? 'Disable feed' : 'Enable feed'}>
                          {feed.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button onClick={() => onDeleteFeed(feed.id)} className="p-1.5 rounded-lg text-error/60 hover:bg-error/10 hover:text-error transition-colors" title="Delete feed">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /><span>Every {feed.syncFrequency}m</span></div>
                      <div className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /><span>Last: {feed.lastSynced ? relativeTime(feed.lastSynced) : 'Never'}</span></div>
                      {feed.syncError && (
                        <div className="flex items-center gap-1.5 text-error"><AlertTriangle className="w-3 h-3" /><span>{feed.syncError}</span></div>
                      )}
                    </div>
                  </div>
                ))}
                {feeds.length === 0 && (
                  <div className="text-center py-12 text-on-surface-variant">
                    <Rss className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No iCal feeds configured yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Feeds */}
          {icalSection === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-on-surface">iCal Export URLs</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Auto-generated iCal URLs for each property. Share these with external channels.</p>
              </div>
              <div className="space-y-3">
                {feeds
                  .filter((f) => f.exportUrl)
                  .reduce<IcalFeed[]>((acc, f) => {
                    if (!acc.find((a) => a.propertyId === f.propertyId)) acc.push(f);
                    return acc;
                  }, [])
                  .map((feed) => {
                    const feedId = `export-${feed.propertyId}`;
                    return (
                      <div key={feed.propertyId} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-on-surface">{feed.propertyName}</h4>
                          </div>
                          <button
                            onClick={() => onCopyUrl(feedId, feed.exportUrl)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              copiedFeedId === feedId ? 'bg-success/10 text-success' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                            }`}
                          >
                            {copiedFeedId === feedId ? (<><Check className="w-3 h-3" />Copied</>) : (<><Copy className="w-3 h-3" />Copy URL</>)}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low">
                          <Rss className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                          <code className="text-xs text-on-surface-variant font-mono truncate">{feed.exportUrl}</code>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Sync Log */}
          {icalSection === 'log' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-on-surface">Recent Sync Events</h3>
              {syncLog.length > 0 ? (
                <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-outline-variant/10">
                          <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Time</th>
                          <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                          <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Channel</th>
                          <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Direction</th>
                          <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                          <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Events</th>
                          <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncLog.map((entry, idx) => (
                          <tr key={entry.id} className={`border-b border-outline-variant/5 ${idx % 2 === 0 ? '' : 'bg-surface-container-low/20'}`}>
                            <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                            <td className="px-4 py-3 text-sm text-on-surface">{entry.propertyName}</td>
                            <td className="px-4 py-3 text-sm text-on-surface">{entry.channelName}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${entry.direction === 'import' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                {entry.direction === 'import' ? <Download className="w-3 h-3" /> : <Upload className="w-3 h-3" />}{entry.direction}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${entry.status === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                {entry.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{entry.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-on-surface">{entry.eventsCount}</td>
                            <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[250px] truncate">{entry.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sync log entries yet.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// TAB: PERFORMANCE
// ============================================================================

function PerformanceTab({ channels, performanceData }: { channels: ChannelData[]; performanceData: Record<string, unknown> }) {
  // Use performance data from API, or derive from channels
  const revenueByChannelData = (performanceData.revenueByChannel as Record<string, unknown>[] | undefined) ?? [];
  const bookingCountData = (performanceData.bookingCount as { name: string; value: number; color: string }[] | undefined) ??
    channels.filter((c) => c.bookingsThisMonth > 0).map((c) => ({ name: c.name, value: c.bookingsThisMonth, color: c.color }));
  const adrByChannelData = (performanceData.adrByChannel as { channel: string; adr: number }[] | undefined) ??
    channels.filter((c) => c.bookingsThisMonth > 0).map((c) => ({ channel: c.name, adr: c.bookingsThisMonth > 0 ? Math.round(c.revenueThisMonth / c.bookingsThisMonth) : 0 }));
  const occupancyByChannel = (performanceData.occupancyByChannel as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue by Channel - Stacked Bar */}
        {revenueByChannelData.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Revenue by Channel</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByChannelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest, #fff)', border: '1px solid var(--color-outline-variant, #e0e0e0)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [formatCurrency(value), undefined]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {channels.map((ch, idx) => (
                    <Bar key={ch.id} dataKey={ch.name} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={idx === channels.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Booking Count by Channel - Pie */}
        {bookingCountData.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Bookings by Channel (This Month)</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingCountData.filter((d) => d.value > 0)} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth: 1 }}>
                    {bookingCountData.filter((d) => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest, #fff)', border: '1px solid var(--color-outline-variant, #e0e0e0)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`${value} bookings`, undefined]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ADR by Channel - Bar */}
        {adrByChannelData.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4">ADR by Channel</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adrByChannelData.filter((d) => d.adr > 0)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} />
                  <YAxis type="category" dataKey="channel" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} width={100} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest, #fff)', border: '1px solid var(--color-outline-variant, #e0e0e0)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [formatCurrency(value), 'ADR']} />
                  <Bar dataKey="adr" radius={[0, 6, 6, 0]}>
                    {adrByChannelData.filter((d) => d.adr > 0).map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[CHART_COLORS.length - 1 - (index % CHART_COLORS.length)]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Occupancy by Channel - Line */}
        {occupancyByChannel.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Occupancy Rate by Channel (%)</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant, #e0e0e0)" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #888)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: 'var(--color-surface-container-lowest, #fff)', border: '1px solid var(--color-outline-variant, #e0e0e0)', borderRadius: '8px', fontSize: '12px' }} formatter={(value: number) => [`${value}%`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {channels.map((ch, idx) => (
                    <Line key={ch.id} type="monotone" dataKey={ch.name} stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Channel Comparison Summary */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Channel Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Channel</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Properties</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Bookings</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Revenue</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Commission</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Net Revenue</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">ADR</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Rev Share</th>
              </tr>
            </thead>
            <tbody>
              {channels
                .filter((ch) => ch.bookingsThisMonth > 0)
                .sort((a, b) => b.revenueThisMonth - a.revenueThisMonth)
                .map((ch, idx) => {
                  const commissionAmt = Math.round((ch.revenueThisMonth * ch.commission) / 100);
                  const netRevenue = ch.revenueThisMonth - commissionAmt;
                  const adr = ch.bookingsThisMonth > 0 ? Math.round(ch.revenueThisMonth / ch.bookingsThisMonth) : 0;
                  const totalRev = channels.reduce((s, c) => s + c.revenueThisMonth, 0);
                  const revShare = totalRev > 0 ? Math.round((ch.revenueThisMonth / totalRev) * 100) : 0;
                  return (
                    <tr key={ch.id} className={`border-b border-outline-variant/5 ${idx % 2 === 0 ? '' : 'bg-surface-container-low/20'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: ch.color }}>{ch.logo}</div>
                          <span className="text-sm font-medium text-on-surface">{ch.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">{ch.propertiesListed}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">{ch.bookingsThisMonth}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-on-surface">{formatCurrency(ch.revenueThisMonth)}</td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">{ch.commission}% ({formatCurrency(commissionAmt)})</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-success">{formatCurrency(netRevenue)}</td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface">{formatCurrency(adr)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${revShare}%`, backgroundColor: ch.color }} />
                          </div>
                          <span className="text-xs font-medium text-on-surface-variant">{revShare}%</span>
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

// ============================================================================
// TAB: ALERTS
// ============================================================================

function AlertsTab({
  alerts,
  onResolve,
  onDismiss,
}: {
  alerts: ChannelAlert[];
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);

  const filteredAlerts = showResolved ? alerts : alerts.filter((a) => !a.resolved);

  const highCount = alerts.filter((a) => !a.resolved && a.severity === 'high').length;
  const medCount = alerts.filter((a) => !a.resolved && a.severity === 'medium').length;
  const lowCount = alerts.filter((a) => !a.resolved && a.severity === 'low').length;

  function alertTypeIcon(type: ChannelAlert['type']) {
    switch (type) {
      case 'sync_failure': return <RefreshCw className="w-4 h-4" />;
      case 'rate_mismatch': return <DollarSign className="w-4 h-4" />;
      case 'listing_issue': return <Globe className="w-4 h-4" />;
      case 'booking_conflict': return <Calendar className="w-4 h-4" />;
    }
  }

  function alertTypeLabel(type: ChannelAlert['type']) {
    switch (type) {
      case 'sync_failure': return 'Sync Failure';
      case 'rate_mismatch': return 'Rate Mismatch';
      case 'listing_issue': return 'Listing Issue';
      case 'booking_conflict': return 'Booking Conflict';
    }
  }

  function severityColor(severity: string) {
    switch (severity) {
      case 'high': return 'bg-error/10 text-error border-error/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-surface-container-high text-on-surface-variant';
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">High Priority</p>
            <div className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-error" /></div>
          </div>
          <p className="font-headline text-xl font-bold text-error">{highCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Medium Priority</p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-warning" /></div>
          </div>
          <p className="font-headline text-xl font-bold text-warning">{medCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Low Priority</p>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><Bell className="w-3.5 h-3.5 text-blue-500" /></div>
          </div>
          <p className="font-headline text-xl font-bold text-blue-500">{lowCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">{showResolved ? 'All Alerts' : 'Active Alerts'} ({filteredAlerts.length})</h3>
        <button onClick={() => setShowResolved(!showResolved)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors">
          {showResolved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showResolved ? 'Hide Resolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-surface-container-lowest rounded-xl p-4 ambient-shadow border-s-4 ${
              alert.resolved ? 'border-success/40 opacity-60' : severityColor(alert.severity).split(' ')[2] || 'border-outline-variant'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.resolved ? 'bg-success/10 text-success' : severityColor(alert.severity).split(' ').slice(0, 2).join(' ')}`}>
                  {alert.resolved ? <CheckCircle className="w-4 h-4" /> : alertTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-on-surface">{alertTypeLabel(alert.type)}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${severityColor(alert.severity).split(' ').slice(0, 2).join(' ')}`}>{alert.severity}</span>
                    {alert.resolved && <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-semibold uppercase">Resolved</span>}
                  </div>
                  <p className="text-sm text-on-surface mb-1.5">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>{alert.channelName}</span>
                    <span className="w-1 h-1 rounded-full bg-on-surface-variant/30" />
                    <span>{alert.propertyName}</span>
                    <span className="w-1 h-1 rounded-full bg-on-surface-variant/30" />
                    <span>{relativeTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
              {!alert.resolved && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => onResolve(alert.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors">
                    <CheckCircle className="w-3 h-3" />Resolve
                  </button>
                  <button onClick={() => onDismiss(alert.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-on-surface mb-1">All Clear</h3>
            <p className="text-xs text-on-surface-variant">No active alerts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
