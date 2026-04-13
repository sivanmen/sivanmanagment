import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import {
  Webhook,
  Plus,
  Zap,
  Trash2,
  TestTube,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  X,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type WebhookEventType = string;

interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  lastStatus?: number;
  failCount: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: any;
  status: number;
  responseBody?: string;
  deliveredAt: string;
  duration: number;
}

const allEventTypes = [
  'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.updated',
  'guest.created', 'guest.updated',
  'payment.received', 'payment.failed',
  'checkin.submitted', 'checkout.completed',
  'maintenance.created', 'maintenance.completed',
  'owner.statement.generated',
];

const apiModules = [
  { name: 'Auth', basePath: '/api/v1/auth', endpoints: [
    { method: 'POST', path: '/login', desc: 'Authenticate user' },
    { method: 'POST', path: '/register', desc: 'Register new user' },
    { method: 'GET', path: '/me', desc: 'Get current user' },
  ]},
  { name: 'Properties', basePath: '/api/v1/properties', endpoints: [
    { method: 'GET', path: '/', desc: 'List properties' },
    { method: 'POST', path: '/', desc: 'Create property' },
    { method: 'GET', path: '/:id', desc: 'Get property' },
    { method: 'PUT', path: '/:id', desc: 'Update property' },
    { method: 'DELETE', path: '/:id', desc: 'Delete property' },
  ]},
  { name: 'Bookings', basePath: '/api/v1/bookings', endpoints: [
    { method: 'GET', path: '/', desc: 'List bookings' },
    { method: 'POST', path: '/', desc: 'Create booking' },
    { method: 'GET', path: '/:id', desc: 'Get booking' },
    { method: 'PUT', path: '/:id', desc: 'Update booking' },
  ]},
  { name: 'Owners', basePath: '/api/v1/owners', endpoints: [
    { method: 'GET', path: '/', desc: 'List owners' },
    { method: 'POST', path: '/', desc: 'Create owner' },
    { method: 'GET', path: '/:id/financial-summary', desc: 'Financial summary' },
  ]},
  { name: 'Owner Portal', basePath: '/api/v1/owner-portal', endpoints: [
    { method: 'GET', path: '/config/:ownerId', desc: 'Get portal config' },
    { method: 'PUT', path: '/config/:ownerId', desc: 'Update portal config' },
    { method: 'GET', path: '/reservations', desc: 'List owner reservations' },
    { method: 'POST', path: '/reservations', desc: 'Create owner reservation' },
    { method: 'POST', path: '/statements/generate', desc: 'Generate statement' },
    { method: 'GET', path: '/statements', desc: 'List statements' },
  ]},
  { name: 'Webhooks', basePath: '/api/v1/webhooks', endpoints: [
    { method: 'GET', path: '/', desc: 'List endpoints' },
    { method: 'POST', path: '/', desc: 'Create endpoint' },
    { method: 'POST', path: '/:id/test', desc: 'Test endpoint' },
    { method: 'GET', path: '/deliveries', desc: 'Delivery log' },
  ]},
  { name: 'Bulk Actions', basePath: '/api/v1/bulk', endpoints: [
    { method: 'POST', path: '/actions', desc: 'Execute bulk action' },
    { method: 'GET', path: '/actions', desc: 'List actions' },
    { method: 'POST', path: '/export', desc: 'Export data' },
  ]},
];

const methodColors: Record<string, string> = {
  GET: 'bg-success/15 text-success',
  POST: 'bg-secondary/15 text-secondary',
  PUT: 'bg-warning/15 text-warning',
  DELETE: 'bg-error/15 text-error',
};

// Demo data removed - now fetched from API

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WebhooksPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'deliveries' | 'docs'>('endpoints');
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [viewPayload, setViewPayload] = useState<any>(null);

  // ── API Queries ────────────────────────────────────────────────────────
  const { data: endpointsData, isLoading: loadingEndpoints } = useQuery<WebhookEndpoint[]>({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const res = await apiClient.get('/webhooks');
      return res.data.data ?? res.data ?? [];
    },
  });

  const { data: deliveriesData, isLoading: loadingDeliveries } = useQuery<WebhookDelivery[]>({
    queryKey: ['webhooks', 'deliveries'],
    queryFn: async () => {
      const res = await apiClient.get('/webhooks/deliveries');
      return res.data.data ?? res.data ?? [];
    },
  });

  const endpoints = endpointsData ?? [];
  const deliveries = deliveriesData ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: { url: string; events: string[] }) => {
      const res = await apiClient.post('/webhooks', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('webhooks.endpointCreated'));
      setShowCreate(false);
      setNewUrl('');
      setNewEvents([]);
    },
    onError: () => toast.error('Failed to create endpoint'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; isActive?: boolean }) => {
      const res = await apiClient.put(`/webhooks/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('webhooks.endpointToggled'));
    },
    onError: () => toast.error('Failed to update endpoint'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(t('webhooks.endpointDeleted'));
    },
    onError: () => toast.error('Failed to delete endpoint'),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/webhooks/${id}/test`);
    },
    onSuccess: () => toast.success(t('webhooks.testSent')),
    onError: () => toast.error('Test failed'),
  });

  const handleToggle = (id: string) => {
    const ep = endpoints.find((e) => e.id === id);
    if (ep) updateMutation.mutate({ id, isActive: !ep.isActive });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleTest = (id: string) => {
    testMutation.mutate(id);
  };

  const handleCreate = () => {
    if (!newUrl || newEvents.length === 0) {
      toast.error(t('webhooks.urlAndEventsRequired'));
      return;
    }
    createMutation.mutate({ url: newUrl, events: newEvents });
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  const tabs = [
    { key: 'endpoints' as const, label: t('webhooks.endpoints') },
    { key: 'deliveries' as const, label: t('webhooks.deliveryLog') },
    { key: 'docs' as const, label: t('webhooks.apiDocs') },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('webhooks.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('webhooks.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('webhooks.addEndpoint')}
        </button>
      </div>

      {/* Tabs */}
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

      {/* Create Endpoint Modal */}
      {showCreate && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow border border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">{t('webhooks.newEndpoint')}</h2>
            <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-surface-container-high"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">URL</label>
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/webhook" className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{t('webhooks.events')}</label>
              <div className="flex flex-wrap gap-2">
                {allEventTypes.map((event) => (
                  <button key={event} onClick={() => toggleEvent(event)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newEvents.includes(event) ? 'bg-secondary text-white' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
                    {event}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high">{t('common.cancel')}</button>
              <button onClick={handleCreate} className="px-5 py-2 rounded-lg text-sm font-medium text-white gradient-accent">{t('common.create')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {endpoints.map((ep) => (
            <div key={ep.id} className={`bg-surface-container-lowest rounded-xl p-5 ambient-shadow border ${ep.isActive ? 'border-transparent' : 'border-error/20 opacity-70'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Webhook className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span className="text-sm font-mono text-on-surface truncate">{ep.url}</span>
                    {!ep.isActive && <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-error/10 text-error">{t('webhooks.inactive')}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ep.events.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/10 text-secondary">{ev}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    {ep.lastTriggeredAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t('webhooks.lastTriggered')}: {formatDate(ep.lastTriggeredAt)}
                      </span>
                    )}
                    {ep.lastStatus !== undefined && (
                      <span className={`flex items-center gap-1 ${ep.lastStatus < 300 ? 'text-success' : 'text-error'}`}>
                        {ep.lastStatus < 300 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {ep.lastStatus}
                      </span>
                    )}
                    {ep.failCount > 0 && (
                      <span className="flex items-center gap-1 text-warning">
                        <AlertTriangle className="w-3 h-3" /> {ep.failCount} {t('webhooks.failures')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTest(ep.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors flex items-center gap-1">
                    <TestTube className="w-3 h-3" /> {t('webhooks.test')}
                  </button>
                  <button
                    onClick={() => handleToggle(ep.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ep.isActive ? 'bg-secondary' : 'bg-outline-variant/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ep.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button onClick={() => handleDelete(ep.id)} className="p-2 rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {endpoints.length === 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
              <Webhook className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant font-medium">{t('webhooks.noEndpoints')}</p>
            </div>
          )}
        </div>
      )}

      {/* Delivery Log Tab */}
      {activeTab === 'deliveries' && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.event')}</th>
                  <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.endpoint')}</th>
                  <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.statusCode')}</th>
                  <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.timestamp')}</th>
                  <th className="text-end py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.duration')}</th>
                  <th className="text-center py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('webhooks.payload')}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => {
                  const ep = endpoints.find((e) => e.id === d.endpointId);
                  return (
                    <tr key={d.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary">{d.event}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-on-surface-variant truncate max-w-[200px]">{ep?.url || d.endpointId}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${d.status < 300 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-on-surface-variant">{formatDate(d.deliveredAt)}</td>
                      <td className="py-3 px-4 text-xs text-end text-on-surface-variant">{d.duration}ms</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setViewPayload(d.payload)} className="text-secondary hover:text-secondary/80 text-xs font-medium">{t('common.view')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Docs Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">{t('webhooks.apiDocsTitle')}</p>
              <p className="text-xs text-on-surface-variant">{t('webhooks.apiDocsDescription')}</p>
            </div>
          </div>
          {apiModules.map((mod) => (
            <div key={mod.name} className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
              <button
                onClick={() => setExpandedDoc(expandedDoc === mod.name ? null : mod.name)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="text-start">
                    <h3 className="font-headline font-semibold text-on-surface">{mod.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">{mod.basePath}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">{mod.endpoints.length} endpoints</span>
                  {expandedDoc === mod.name ? <ChevronDown className="w-4 h-4 text-on-surface-variant" /> : <ChevronRight className="w-4 h-4 text-on-surface-variant" />}
                </div>
              </button>
              {expandedDoc === mod.name && (
                <div className="px-5 pb-4 space-y-2">
                  {mod.endpoints.map((ep, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-container-low">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${methodColors[ep.method] || 'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {ep.method}
                      </span>
                      <span className="text-sm font-mono text-on-surface">{mod.basePath}{ep.path}</span>
                      <span className="text-xs text-on-surface-variant ml-auto">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payload Viewer Modal */}
      {viewPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewPayload(null)}>
          <div className="bg-surface-container-lowest rounded-xl p-6 max-w-lg w-full mx-4 ambient-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-semibold text-on-surface">{t('webhooks.payloadDetail')}</h3>
              <button onClick={() => setViewPayload(null)} className="p-1 rounded-lg hover:bg-surface-container-high"><X className="w-4 h-4" /></button>
            </div>
            <pre className="bg-surface-container-high rounded-lg p-4 text-xs text-on-surface font-mono overflow-auto max-h-64">
              {JSON.stringify(viewPayload, null, 2)}
            </pre>
            <div className="flex justify-end mt-4">
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(viewPayload, null, 2)); toast.success('Copied'); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20">
                <Copy className="w-3 h-3" /> {t('webhooks.copyPayload')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
