import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import {
  Globe,
  Settings,
  Palette,
  Tag,
  Shield,
  CreditCard,
  Search,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Copy,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Code2,
  Percent,
  Clock,
  Building2,
  Star,
  MessageCircle,
  MapPin,
  Image,
  Zap,
  Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface BookingPromotion {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minNights: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

interface PropertyConfig {
  propertyId: string;
  propertyName: string;
  isEnabled: boolean;
  instantBooking: boolean;
  pageUrl: string;
  totalDirectBookings: number;
  revenue: number;
}

interface BookingEngineConfig {
  propertyConfigs: PropertyConfig[];
  promotions: BookingPromotion[];
  design: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    customCss: string;
    displayOptions: { label: string; enabled: boolean; desc: string }[];
  };
  policies: {
    cancellationPolicy: string;
    houseRules: { label: string; value: string }[];
    paymentMethods: { method: string; enabled: boolean }[];
    deposit: { required: boolean; percentage: number; balanceDue: string };
  };
  embed: {
    apiKey: string;
    apiBaseUrl: string;
    widgetCode: string;
    publicEndpoints: { method: string; path: string; desc: string }[];
  };
}

type TabType = 'properties' | 'promotions' | 'design' | 'policies' | 'embed';

// ── Component ──────────────────────────────────────────────────────────────

export default function BookingEnginePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // ── API Queries ────────────────────────────────────────────────────────
  const { data: config, isLoading, error } = useQuery<BookingEngineConfig>({
    queryKey: ['booking-engine-config'],
    queryFn: async () => {
      const res = await apiClient.get('/booking-engine/config');
      return res.data.data ?? res.data;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (payload: Partial<BookingEngineConfig>) => {
      const res = await apiClient.put('/booking-engine/config', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-engine-config'] });
      toast.success('Configuration updated');
    },
    onError: () => toast.error('Failed to update configuration'),
  });

  const tabs: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'properties', label: 'Properties', icon: Building2 },
    { key: 'promotions', label: 'Promotions', icon: Tag },
    { key: 'design', label: 'Design & Branding', icon: Palette },
    { key: 'policies', label: 'Policies', icon: Shield },
    { key: 'embed', label: 'Embed & API', icon: Code2 },
  ];

  const propertyConfigs = config?.propertyConfigs ?? [];
  const promotions = config?.promotions ?? [];

  const enabledCount = propertyConfigs.filter((p) => p.isEnabled).length;
  const totalDirectBookings = propertyConfigs.reduce((s, p) => s + p.totalDirectBookings, 0);
  const totalDirectRevenue = propertyConfigs.reduce((s, p) => s + p.revenue, 0);
  const activePromos = promotions.filter((p) => p.isActive).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-error">
        <p>Failed to load booking engine configuration. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-secondary" />
            Direct Booking Engine
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Configure your direct booking website, promotions, and booking widget
          </p>
        </div>
        <a
          href="https://book.sivanmanagment.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90"
        >
          <ExternalLink className="w-4 h-4" />
          View Booking Site
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Properties Enabled</p>
          <p className="text-2xl font-headline font-bold mt-1">{enabledCount}<span className="text-sm text-on-surface-variant font-normal">/{propertyConfigs.length}</span></p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Direct Bookings</p>
          <p className="text-2xl font-headline font-bold mt-1 text-secondary">{totalDirectBookings}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Direct Revenue</p>
          <p className="text-2xl font-headline font-bold mt-1 text-emerald-400">€{totalDirectRevenue.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Active Promotions</p>
          <p className="text-2xl font-headline font-bold mt-1 text-amber-400">{activePromos}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === key
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/20'
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Property</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Instant Book</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Direct Bookings</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Revenue</th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Page URL</th>
                  <th className="text-end px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {propertyConfigs.map((config) => (
                  <tr key={config.propertyId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium">{config.propertyName}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="inline-flex">
                        {config.isEnabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {config.isEnabled && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          config.instantBooking ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {config.instantBooking ? (
                            <><Zap className="w-2.5 h-2.5" /> Instant</>
                          ) : (
                            <><Clock className="w-2.5 h-2.5" /> Request</>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{config.totalDirectBookings || '—'}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      {config.revenue ? `€${config.revenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {config.pageUrl ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-secondary truncate max-w-[200px]">{config.pageUrl.replace('https://', '')}</span>
                          <button className="text-on-surface-variant hover:text-on-surface">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant">Not configured</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        {config.isEnabled && (
                          <a
                            href={config.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90">
              <Plus className="w-4 h-4" />
              Create Promotion
            </button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Code</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Name</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Discount</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Min Nights</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Usage</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Valid</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Status</th>
                    <th className="text-end px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-secondary/10 text-secondary font-semibold">
                          {promo.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{promo.name}</td>
                      <td className="px-4 py-3">
                        {promo.type === 'PERCENT' ? `${promo.value}%` : `€${promo.value}`}
                      </td>
                      <td className="px-4 py-3">{promo.minNights} nights</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{promo.usedCount}</span>
                          {promo.maxUses > 0 && (
                            <>
                              <span className="text-on-surface-variant">/ {promo.maxUses}</span>
                              <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-secondary rounded-full"
                                  style={{ width: `${Math.min((promo.usedCount / promo.maxUses) * 100, 100)}%` }}
                                />
                              </div>
                            </>
                          )}
                          {promo.maxUses === 0 && <span className="text-xs text-on-surface-variant">unlimited</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {new Date(promo.validFrom).toLocaleDateString()} — {new Date(promo.validTo).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          promo.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-on-surface-variant'
                        }`}>
                          {promo.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded hover:bg-white/10"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Design Tab */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Brand Settings</h3>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#6b38d4] border border-white/10" />
                <input type="text" value="#6b38d4" readOnly className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#030303] border border-white/10" />
                <input type="text" value="#030303" readOnly className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Logo URL</label>
              <input type="text" value="https://sivanmanagment.com/logo.svg" readOnly className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Custom CSS</label>
              <textarea
                rows={4}
                defaultValue={`/* Custom booking page styles */\n.booking-widget {\n  border-radius: 16px;\n}`}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm font-mono"
              />
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Display Options</h3>
            {[
              { label: 'Show Reviews', enabled: true, desc: 'Display guest reviews on property page' },
              { label: 'Show Amenities', enabled: true, desc: 'Display full amenity list' },
              { label: 'Show Map', enabled: true, desc: 'Show property location on map' },
              { label: 'Show Pricing Calendar', enabled: true, desc: 'Display rate calendar with pricing' },
              { label: 'Show Similar Properties', enabled: false, desc: 'Suggest similar properties' },
              { label: 'Show Availability Widget', enabled: true, desc: 'Inline availability checker' },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                </div>
                {opt.enabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-on-surface-variant shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Cancellation Policy</h3>
            {['FLEXIBLE', 'MODERATE', 'STRICT', 'SUPER_STRICT'].map((policy) => (
              <label key={policy} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                policy === 'MODERATE' ? 'bg-secondary/10 ring-1 ring-secondary/30' : 'bg-white/[0.02] hover:bg-white/[0.04]'
              }`}>
                <input type="radio" name="cancellation" value={policy} defaultChecked={policy === 'MODERATE'} className="mt-1" />
                <div>
                  <p className="text-sm font-medium capitalize">{policy.replace('_', ' ').toLowerCase()}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {policy === 'FLEXIBLE' && 'Full refund up to 24 hours before check-in'}
                    {policy === 'MODERATE' && 'Full refund up to 5 days before check-in'}
                    {policy === 'STRICT' && '50% refund up to 7 days before check-in'}
                    {policy === 'SUPER_STRICT' && 'No refund after booking confirmation'}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">House Rules</h3>
            {[
              { label: 'Pets Policy', value: 'Small pets allowed with prior approval' },
              { label: 'Smoking Policy', value: 'No smoking inside the property' },
              { label: 'Party Policy', value: 'No parties or events' },
              { label: 'Children Policy', value: 'Children of all ages welcome' },
              { label: 'Quiet Hours', value: '10 PM - 8 AM' },
            ].map((rule) => (
              <div key={rule.label}>
                <label className="text-xs text-on-surface-variant block mb-1">{rule.label}</label>
                <input
                  type="text"
                  defaultValue={rule.value}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm"
                />
              </div>
            ))}
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Payment Methods</h3>
            {[
              { method: 'Credit Card (Stripe)', enabled: true, icon: CreditCard },
              { method: 'PayPal', enabled: true, icon: CreditCard },
              { method: 'Bank Transfer', enabled: false, icon: CreditCard },
              { method: 'Crypto (USDT/BTC)', enabled: false, icon: CreditCard },
            ].map((pm) => (
              <div key={pm.method} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <pm.icon className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-sm">{pm.method}</span>
                </div>
                {pm.enabled ? (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                )}
              </div>
            ))}
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Deposit Settings</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm">Require Deposit</span>
              <ToggleRight className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Deposit Percentage</label>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={30} className="w-20 px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm" />
                <span className="text-sm text-on-surface-variant">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Balance Due</label>
              <select className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm">
                <option>14 days before check-in</option>
                <option>7 days before check-in</option>
                <option>On check-in day</option>
                <option>Immediately at booking</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Embed Tab */}
      {activeTab === 'embed' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Booking Widget — Embed Code</h3>
            <p className="text-xs text-on-surface-variant">Add this snippet to any website to embed your booking widget.</p>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-black/30 border border-white/10 text-xs text-emerald-400 font-mono overflow-x-auto">
{`<script src="https://book.sivanmanagment.com/widget.js"></script>
<div
  id="sivan-booking-widget"
  data-api-key="pk_live_sivan_abc123xyz"
  data-property="all"
  data-theme="dark"
  data-lang="en"
  data-color="#6b38d4"
></div>`}
              </pre>
              <button className="absolute top-2 end-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">API Access</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">API Base URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs font-mono text-emerald-400">
                    https://api.sivanmanagment.com/api/v1/booking-engine/public
                  </code>
                  <button className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Public API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs font-mono">
                    pk_live_sivan_abc123xyz789
                  </code>
                  <button className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold">Available Public Endpoints</h3>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/public/search', desc: 'Search available properties' },
                { method: 'GET', path: '/public/property/:id', desc: 'Get public property details' },
                { method: 'GET', path: '/public/availability/:id', desc: 'Check availability & pricing' },
                { method: 'POST', path: '/public/quote', desc: 'Calculate booking quote' },
                { method: 'POST', path: '/public/book', desc: 'Create a direct booking' },
                { method: 'POST', path: '/public/validate-promo', desc: 'Validate promotion code' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    ep.method === 'GET' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-on-surface-variant">{ep.path}</code>
                  <span className="text-xs text-on-surface-variant ms-auto">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
