import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Sparkles,
  Zap,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Activity,
  Coins,
  BarChart3,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ───────────────────────────────────────────────────────────
interface AiProvider {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  isDefault: boolean;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsageStats {
  totalCalls: number;
  tokensUsed: number;
  estimatedCost: number;
}

interface ProviderConfig {
  key: string;
  name: string;
  icon: typeof Brain;
  iconColor: string;
  bgColor: string;
  models: string[];
}

// ── Constants ───────────────────────────────────────────────────────

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    key: 'anthropic',
    name: 'Anthropic Claude',
    icon: Brain,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
  },
  {
    key: 'openai',
    name: 'OpenAI GPT',
    icon: Sparkles,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  },
  {
    key: 'google',
    name: 'Google Gemini',
    icon: Zap,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  },
];

const inputClasses =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

const labelClasses =
  'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

// ── Main Component ──────────────────────────────────────────────────

export default function AiProvidersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local form state per provider
  const [formState, setFormState] = useState<
    Record<string, { apiKey: string; model: string; showKey: boolean }>
  >({
    anthropic: { apiKey: '', model: 'claude-sonnet-4-20250514', showKey: false },
    openai: { apiKey: '', model: 'gpt-4o', showKey: false },
    google: { apiKey: '', model: 'gemini-1.5-pro', showKey: false },
  });

  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // ── Fetch providers ─────────────────────────────────────────────
  const { data: providersData, isLoading: isLoadingProviders } = useQuery<{ data: AiProvider[] }>({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/providers');
      return res.data;
    },
    onSuccess: (data: { data: AiProvider[] }) => {
      if (data?.data) {
        const newState = { ...formState };
        for (const p of data.data) {
          if (newState[p.provider]) {
            newState[p.provider] = {
              ...newState[p.provider],
              apiKey: p.apiKey || '',
              model: p.model || newState[p.provider].model,
            };
          }
        }
        setFormState(newState);
      }
    },
  } as any);

  // ── Fetch usage stats ───────────────────────────────────────────
  const { data: usageData } = useQuery<{ data: UsageStats }>({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/providers/usage');
      return res.data;
    },
  });

  const providers = providersData?.data ?? [];
  const usage = usageData?.data ?? { totalCalls: 0, tokensUsed: 0, estimatedCost: 0 };

  const getProviderData = (providerKey: string): AiProvider | undefined => {
    return providers.find((p) => p.provider === providerKey);
  };

  // ── Save mutation ───────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (providerKey: string) => {
      const form = formState[providerKey];
      const existing = getProviderData(providerKey);

      const payload = {
        provider: providerKey,
        apiKey: form.apiKey,
        model: form.model,
      };

      if (existing?.id) {
        return apiClient.put(`/ai/providers/${existing.id}`, payload);
      }
      return apiClient.post('/ai/providers', payload);
    },
    onSuccess: (_, providerKey) => {
      const config = PROVIDER_CONFIGS.find((c) => c.key === providerKey);
      toast.success(`${config?.name || providerKey} saved successfully`);
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
    onError: (_, providerKey) => {
      const config = PROVIDER_CONFIGS.find((c) => c.key === providerKey);
      toast.error(`Failed to save ${config?.name || providerKey}`);
    },
  });

  // ── Test connection mutation ────────────────────────────────────
  const testMutation = useMutation({
    mutationFn: async (providerKey: string) => {
      setTestingProvider(providerKey);
      const existing = getProviderData(providerKey);
      if (!existing?.id) {
        throw new Error('Provider not configured');
      }
      const res = await apiClient.post(`/ai/providers/${existing.id}/test`);
      return res.data;
    },
    onSuccess: (_, providerKey) => {
      toast.success(t('aiProviders.testSuccess', 'Connection successful'));
      setTestingProvider(null);
    },
    onError: (err, providerKey) => {
      toast.error(t('aiProviders.testFailed', 'Connection failed'));
      setTestingProvider(null);
    },
  });

  // ── Set default mutation ────────────────────────────────────────
  const setDefaultMutation = useMutation({
    mutationFn: async (providerKey: string) => {
      const existing = getProviderData(providerKey);
      if (!existing?.id) {
        throw new Error('Provider not configured');
      }
      return apiClient.put(`/ai/providers/${existing.id}/default`);
    },
    onSuccess: () => {
      toast.success('Default provider updated');
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
    onError: () => {
      toast.error('Failed to set default provider');
    },
  });

  const updateForm = (providerKey: string, field: string, value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      [providerKey]: {
        ...prev[providerKey],
        [field]: value,
      },
    }));
  };

  const maskApiKey = (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.settings', 'Settings')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('aiProviders.title', 'AI Providers')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('aiProviders.subtitle', 'Configure AI services for template translation and generation')}
          </p>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('aiProviders.apiCalls', 'API Calls')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {usage.totalCalls.toLocaleString()}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {t('aiProviders.usage', 'This month')}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('aiProviders.tokensUsed', 'Tokens Used')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-warning" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            {usage.tokensUsed > 1000000
              ? `${(usage.tokensUsed / 1000000).toFixed(1)}M`
              : usage.tokensUsed > 1000
                ? `${(usage.tokensUsed / 1000).toFixed(1)}K`
                : usage.tokensUsed.toLocaleString()}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {t('aiProviders.usage', 'This month')}
          </p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('aiProviders.estimatedCost', 'Estimated Cost')}
            </p>
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">
            ${usage.estimatedCost.toFixed(2)}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {t('aiProviders.usage', 'This month')}
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PROVIDER_CONFIGS.map((config) => {
          const providerData = getProviderData(config.key);
          const form = formState[config.key];
          const isConfigured = providerData?.isConfigured || false;
          const isDefault = providerData?.isDefault || false;
          const Icon = config.icon;
          const isTesting = testingProvider === config.key;
          const isSaving = saveMutation.isPending && saveMutation.variables === config.key;

          return (
            <div
              key={config.key}
              className={`bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden transition-all ${
                isDefault ? 'ring-2 ring-secondary/30' : ''
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-outline-variant/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-semibold text-on-surface">
                        {t(`aiProviders.${config.key}`, config.name)}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isConfigured ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                            <CheckCircle className="w-3 h-3" />
                            {t('aiProviders.connected', 'Connected')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
                            <XCircle className="w-3 h-3" />
                            {t('aiProviders.notConfigured', 'Not Configured')}
                          </span>
                        )}
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary">
                            <Star className="w-2.5 h-2.5" />
                            {t('aiProviders.default', 'Default')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* API Key */}
                <div>
                  <label className={labelClasses}>{t('aiProviders.apiKey', 'API Key')}</label>
                  <div className="relative">
                    <input
                      type={form.showKey ? 'text' : 'password'}
                      value={form.apiKey}
                      onChange={(e) => updateForm(config.key, 'apiKey', e.target.value)}
                      placeholder="sk-..."
                      className={inputClasses + ' pe-10 font-mono text-xs'}
                    />
                    <button
                      onClick={() => updateForm(config.key, 'showKey', !form.showKey)}
                      className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {form.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model Selector */}
                <div>
                  <label className={labelClasses}>{t('aiProviders.model', 'Model')}</label>
                  <select
                    value={form.model}
                    onChange={(e) => updateForm(config.key, 'model', e.target.value)}
                    className={inputClasses}
                  >
                    {config.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Set as Default Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-on-surface-variant">
                    {t('aiProviders.setDefault', 'Set as Default')}
                  </label>
                  <button
                    onClick={() => {
                      if (!isDefault && isConfigured) {
                        setDefaultMutation.mutate(config.key);
                      }
                    }}
                    disabled={isDefault || !isConfigured}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isDefault ? 'bg-secondary' : 'bg-outline-variant/30'
                    } ${!isConfigured ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        isDefault ? 'start-[22px]' : 'start-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-5 py-4 border-t border-outline-variant/10 flex items-center gap-2">
                <button
                  onClick={() => testMutation.mutate(config.key)}
                  disabled={!isConfigured || isTesting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  {t('aiProviders.testConnection', 'Test Connection')}
                </button>
                <button
                  onClick={() => saveMutation.mutate(config.key)}
                  disabled={!form.apiKey || isSaving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {t('common.save', 'Save')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
