import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  MessageCircle,
  Smartphone,
  Settings2,
  Plug,
  TestTube2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Eye,
  EyeOff,
  Send,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  QrCode,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ───────────────────────────────────────────────────────────────────

type ChannelType = 'email' | 'whatsapp' | 'sms';
type ChannelStatus = 'connected' | 'disconnected' | 'error';

interface NotificationChannel {
  id: string;
  type: ChannelType;
  name: string;
  status: ChannelStatus;
  config: Record<string, string>;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  channels: ChannelType[];
  subject?: string;
  updatedAt: string;
}

interface ActivityLogEntry {
  id: string;
  channel: ChannelType;
  recipient: string;
  subject: string;
  status: 'delivered' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

interface ChannelsResponse {
  data: NotificationChannel[];
}

interface TemplatesResponse {
  data: NotificationTemplate[];
}

interface ActivityLogResponse {
  data: ActivityLogEntry[];
}

// ── Reusable Styles ─────────────────────────────────────────────────────────

const inputClasses =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';
const labelClasses =
  'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const sectionCard =
  'bg-surface-container-lowest rounded-xl p-5 ambient-shadow';
const toggleClasses =
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30';

// ── Toggle Component ────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-on-surface font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`${toggleClasses} ${checked ? 'bg-secondary' : 'bg-outline-variant/30'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ── Channel Icon Map ────────────────────────────────────────────────────────

const channelIconMap: Record<ChannelType, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
};

const channelColorMap: Record<ChannelType, { bg: string; text: string }> = {
  email: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  whatsapp: { bg: 'bg-green-500/10', text: 'text-green-400' },
  sms: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
};

const statusConfig: Record<ChannelStatus, { label: string; color: string; dotColor: string; icon: typeof CheckCircle }> = {
  connected: { label: 'Connected', color: 'text-success', dotColor: 'bg-success', icon: CheckCircle },
  disconnected: { label: 'Disconnected', color: 'text-on-surface-variant', dotColor: 'bg-outline-variant', icon: XCircle },
  error: { label: 'Error', color: 'text-error', dotColor: 'bg-error', icon: AlertCircle },
};

// ── Default channel configs ─────────────────────────────────────────────────

const defaultEmailConfig = {
  smtpHost: '',
  smtpPort: '587',
  useSsl: 'true',
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
};

const defaultWhatsappConfig = {
  apiUrl: '',
  apiKey: '',
  instanceName: '',
};

const defaultSmsConfig = {
  accountSid: '',
  authToken: '',
  fromPhone: '',
  countryCode: '+1',
};

// ── Helper: Password Field ──────────────────────────────────────────────────

function PasswordField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses + ' pe-10'}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Email Config Form ───────────────────────────────────────────────────────

function EmailConfigForm({
  config,
  setConfig,
}: {
  config: Record<string, string>;
  setConfig: (c: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const updateField = (key: string, value: string) => setConfig({ ...config, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>{t('integrations.smtpHost')}</label>
          <input
            type="text"
            value={config.smtpHost || ''}
            onChange={(e) => updateField('smtpHost', e.target.value)}
            placeholder="smtp.gmail.com"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>{t('integrations.smtpPort')}</label>
          <select
            value={config.smtpPort || '587'}
            onChange={(e) => updateField('smtpPort', e.target.value)}
            className={inputClasses}
          >
            <option value="25">25 (SMTP)</option>
            <option value="465">465 (SMTPS)</option>
            <option value="587">587 (Submission)</option>
          </select>
        </div>
      </div>

      <Toggle
        checked={config.useSsl === 'true'}
        onChange={(v) => updateField('useSsl', v ? 'true' : 'false')}
        label={t('integrations.sslTls')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>{t('integrations.username')}</label>
          <input
            type="text"
            value={config.username || ''}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="user@example.com"
            className={inputClasses}
          />
        </div>
        <PasswordField
          value={config.password || ''}
          onChange={(v) => updateField('password', v)}
          placeholder="••••••••"
          label={t('integrations.password')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>{t('integrations.fromEmail')}</label>
          <input
            type="email"
            value={config.fromEmail || ''}
            onChange={(e) => updateField('fromEmail', e.target.value)}
            placeholder="notifications@yourcompany.com"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>{t('integrations.fromName')}</label>
          <input
            type="text"
            value={config.fromName || ''}
            onChange={(e) => updateField('fromName', e.target.value)}
            placeholder="Your Company"
            className={inputClasses}
          />
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp Config Form ────────────────────────────────────────────────────

function WhatsAppConfigForm({
  config,
  setConfig,
}: {
  config: Record<string, string>;
  setConfig: (c: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const updateField = (key: string, value: string) => setConfig({ ...config, [key]: value });

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>{t('integrations.apiUrl')}</label>
        <input
          type="url"
          value={config.apiUrl || ''}
          onChange={(e) => updateField('apiUrl', e.target.value)}
          placeholder="https://evolution-api.yourserver.com"
          className={inputClasses}
        />
      </div>
      <PasswordField
        value={config.apiKey || ''}
        onChange={(v) => updateField('apiKey', v)}
        placeholder="••••••••"
        label={t('integrations.apiKey')}
      />
      <div>
        <label className={labelClasses}>{t('integrations.instanceName')}</label>
        <input
          type="text"
          value={config.instanceName || ''}
          onChange={(e) => updateField('instanceName', e.target.value)}
          placeholder="my-instance"
          className={inputClasses}
        />
      </div>

      {/* QR Code area */}
      <div className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
        <QrCode className="w-10 h-10 text-on-surface-variant/40" />
        <p className="text-xs text-on-surface-variant text-center">
          {t('integrations.qrCodeArea')}
        </p>
      </div>
    </div>
  );
}

// ── SMS Config Form ─────────────────────────────────────────────────────────

function SmsConfigForm({
  config,
  setConfig,
}: {
  config: Record<string, string>;
  setConfig: (c: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const updateField = (key: string, value: string) => setConfig({ ...config, [key]: value });

  const countryCodes = [
    { code: '+1', label: 'US/CA (+1)' },
    { code: '+44', label: 'UK (+44)' },
    { code: '+30', label: 'GR (+30)' },
    { code: '+972', label: 'IL (+972)' },
    { code: '+49', label: 'DE (+49)' },
    { code: '+33', label: 'FR (+33)' },
    { code: '+34', label: 'ES (+34)' },
    { code: '+39', label: 'IT (+39)' },
    { code: '+61', label: 'AU (+61)' },
    { code: '+81', label: 'JP (+81)' },
    { code: '+86', label: 'CN (+86)' },
    { code: '+91', label: 'IN (+91)' },
    { code: '+55', label: 'BR (+55)' },
    { code: '+52', label: 'MX (+52)' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClasses}>{t('integrations.accountSid')}</label>
        <input
          type="text"
          value={config.accountSid || ''}
          onChange={(e) => updateField('accountSid', e.target.value)}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className={inputClasses}
        />
      </div>
      <PasswordField
        value={config.authToken || ''}
        onChange={(v) => updateField('authToken', v)}
        placeholder="••••••••"
        label={t('integrations.authToken')}
      />
      <div>
        <label className={labelClasses}>{t('integrations.fromPhone')}</label>
        <div className="flex gap-2">
          <select
            value={config.countryCode || '+1'}
            onChange={(e) => updateField('countryCode', e.target.value)}
            className={inputClasses + ' !w-40 flex-shrink-0'}
          >
            {countryCodes.map((cc) => (
              <option key={cc.code} value={cc.code}>
                {cc.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={config.fromPhone || ''}
            onChange={(e) => updateField('fromPhone', e.target.value)}
            placeholder="1234567890"
            className={inputClasses}
          />
        </div>
      </div>
    </div>
  );
}

// ── Configuration Modal ─────────────────────────────────────────────────────

function ConfigureModal({
  channel,
  onClose,
  onSave,
  onTest,
  isSaving,
  isTesting,
}: {
  channel: NotificationChannel | null;
  onClose: () => void;
  onSave: (channelType: ChannelType, config: Record<string, string>, channelId?: string) => void;
  onTest: (channelType: ChannelType, config: Record<string, string>, channelId?: string) => void;
  isSaving: boolean;
  isTesting: boolean;
}) {
  const { t } = useTranslation();
  const channelType = channel?.type || 'email';
  const [config, setConfig] = useState<Record<string, string>>(() => {
    if (channel?.config) return { ...channel.config };
    switch (channelType) {
      case 'email':
        return { ...defaultEmailConfig };
      case 'whatsapp':
        return { ...defaultWhatsappConfig };
      case 'sms':
        return { ...defaultSmsConfig };
      default:
        return {};
    }
  });

  const Icon = channelIconMap[channelType];
  const colors = channelColorMap[channelType];
  const channelNames: Record<ChannelType, string> = {
    email: t('integrations.email'),
    whatsapp: t('integrations.whatsapp'),
    sms: t('integrations.sms'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container rounded-t-2xl p-5 border-b border-outline-variant/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface">
                {t('integrations.configure')} {channelNames[channelType]}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {channel?.id ? t('integrations.editConfiguration') : t('integrations.newConfiguration')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-5">
          {channelType === 'email' && <EmailConfigForm config={config} setConfig={setConfig} />}
          {channelType === 'whatsapp' && <WhatsAppConfigForm config={config} setConfig={setConfig} />}
          {channelType === 'sms' && <SmsConfigForm config={config} setConfig={setConfig} />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-container rounded-b-2xl p-5 border-t border-outline-variant/20 flex items-center justify-between">
          <button
            onClick={() => onTest(channelType, config, channel?.id)}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube2 className="w-4 h-4" />
            )}
            {t('integrations.testConnection')}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => onSave(channelType, config, channel?.id)}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Settings2 className="w-4 h-4" />
              )}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template Categories ─────────────────────────────────────────────────────

const templateCategories = [
  { key: 'booking_confirmation', channels: ['email', 'whatsapp', 'sms'] as ChannelType[] },
  { key: 'booking_cancellation', channels: ['email', 'whatsapp'] as ChannelType[] },
  { key: 'payment_receipt', channels: ['email'] as ChannelType[] },
  { key: 'payment_reminder', channels: ['email', 'sms'] as ChannelType[] },
  { key: 'check_in_instructions', channels: ['email', 'whatsapp'] as ChannelType[] },
  { key: 'check_out_reminder', channels: ['email', 'whatsapp', 'sms'] as ChannelType[] },
  { key: 'maintenance_update', channels: ['email', 'whatsapp'] as ChannelType[] },
  { key: 'review_request', channels: ['email', 'whatsapp'] as ChannelType[] },
  { key: 'welcome_message', channels: ['email', 'whatsapp'] as ChannelType[] },
  { key: 'owner_report', channels: ['email'] as ChannelType[] },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // ── State ──
  const [configModal, setConfigModal] = useState<{
    open: boolean;
    channel: NotificationChannel | null;
    type: ChannelType;
  }>({ open: false, channel: null, type: 'email' });
  const [activityExpanded, setActivityExpanded] = useState(true);
  const [templatesExpanded, setTemplatesExpanded] = useState(true);

  // ── Queries ──
  const { data: channelsData, isLoading: channelsLoading } = useQuery<ChannelsResponse>({
    queryKey: ['notification-channels'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/channels');
      return res.data;
    },
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityLogResponse>({
    queryKey: ['notification-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/channels', { params: { include: 'activity' } });
      return res.data;
    },
  });

  const channels = channelsData?.data ?? [];
  const activityLog = activityData?.data ?? [];

  // ── Build channel status map ──
  const channelMap: Record<ChannelType, NotificationChannel | undefined> = {
    email: channels.find((c) => c.type === 'email'),
    whatsapp: channels.find((c) => c.type === 'whatsapp'),
    sms: channels.find((c) => c.type === 'sms'),
  };

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async ({
      channelType,
      config,
      channelId,
    }: {
      channelType: ChannelType;
      config: Record<string, string>;
      channelId?: string;
    }) => {
      if (channelId) {
        return apiClient.put(`/notifications/channels/${channelId}`, { type: channelType, config });
      }
      return apiClient.post('/notifications/channels', { type: channelType, config });
    },
    onSuccess: () => {
      toast.success(t('integrations.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      setConfigModal({ open: false, channel: null, type: 'email' });
    },
    onError: () => {
      toast.error(t('integrations.saveError'));
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({
      channelType,
      config,
      channelId,
    }: {
      channelType: ChannelType;
      config: Record<string, string>;
      channelId?: string;
    }) => {
      if (channelId) {
        return apiClient.post(`/notifications/channels/${channelId}/test`);
      }
      return apiClient.post('/notifications/channels', {
        type: channelType,
        config,
        testOnly: true,
      });
    },
    onSuccess: () => {
      toast.success(t('integrations.testSuccess'));
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    },
    onError: () => {
      toast.error(t('integrations.testError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/channels/${id}`),
    onSuccess: () => {
      toast.success(t('integrations.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    },
    onError: () => {
      toast.error(t('integrations.deleteError'));
    },
  });

  // ── Handlers ──
  const handleSave = (channelType: ChannelType, config: Record<string, string>, channelId?: string) => {
    saveMutation.mutate({ channelType, config, channelId });
  };

  const handleTest = (channelType: ChannelType, config: Record<string, string>, channelId?: string) => {
    testMutation.mutate({ channelType, config, channelId });
  };

  const handleTestExisting = (channel: NotificationChannel) => {
    testMutation.mutate({ channelType: channel.type, config: channel.config, channelId: channel.id });
  };

  const handleDelete = (channel: NotificationChannel) => {
    if (window.confirm(t('integrations.confirmDelete', { name: channel.name || channel.type }))) {
      deleteMutation.mutate(channel.id);
    }
  };

  const openConfig = (type: ChannelType) => {
    const existing = channelMap[type];
    setConfigModal({
      open: true,
      channel: existing || { id: '', type, name: type, status: 'disconnected', config: {}, createdAt: '', updatedAt: '' },
      type,
    });
  };

  // ── Channel card definitions ──
  const channelDefs: { type: ChannelType; nameKey: string; descKey: string }[] = [
    { type: 'email', nameKey: 'integrations.email', descKey: 'integrations.emailDesc' },
    { type: 'whatsapp', nameKey: 'integrations.whatsapp', descKey: 'integrations.whatsappDesc' },
    { type: 'sms', nameKey: 'integrations.sms', descKey: 'integrations.smsDesc' },
  ];

  const formatTimestamp = (ts?: string) => {
    if (!ts) return t('integrations.never');
    return new Date(ts).toLocaleString();
  };

  const deliveryStatusStyles: Record<string, { bg: string; text: string }> = {
    delivered: { bg: 'bg-success/10', text: 'text-success' },
    failed: { bg: 'bg-error/10', text: 'text-error' },
    pending: { bg: 'bg-warning/10', text: 'text-warning' },
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('integrations.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('integrations.title')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('integrations.description')}
          </p>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelDefs.map((def) => {
          const channel = channelMap[def.type];
          const Icon = channelIconMap[def.type];
          const colors = channelColorMap[def.type];
          const status: ChannelStatus = channel?.status || 'disconnected';
          const statusCfg = statusConfig[status];
          const StatusIcon = statusCfg.icon;

          return (
            <div key={def.type} className={`${sectionCard} space-y-4`}>
              {/* Icon + Title */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-headline font-semibold text-on-surface">
                      {t(def.nameKey)}
                    </h3>
                    <p className="text-xs text-on-surface-variant">{t(def.descKey)}</p>
                  </div>
                </div>
                {channel && channel.id && (
                  <button
                    onClick={() => handleDelete(channel)}
                    className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusCfg.dotColor}`} />
                <span className={`text-xs font-medium ${statusCfg.color}`}>
                  {t(`integrations.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                </span>
              </div>

              {/* Last tested */}
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <Clock className="w-3 h-3" />
                <span>
                  {t('integrations.lastTested')}: {formatTimestamp(channel?.lastTestedAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => openConfig(def.type)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {t('integrations.configure')}
                </button>
                {channel && channel.id && (
                  <button
                    onClick={() => handleTestExisting(channel)}
                    disabled={testMutation.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <TestTube2 className="w-3.5 h-3.5" />
                    )}
                    {t('integrations.test')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading skeleton for channels */}
      {channelsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${sectionCard} animate-pulse space-y-4`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high" />
                <div className="space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-24" />
                  <div className="h-3 bg-surface-container-high rounded w-32" />
                </div>
              </div>
              <div className="h-3 bg-surface-container-high rounded w-20" />
              <div className="h-8 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Notification Templates Section */}
      <div className={`${sectionCard}`}>
        <button
          onClick={() => setTemplatesExpanded(!templatesExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-secondary" />
            </div>
            <div className="text-start">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                {t('integrations.notificationTemplates')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t('integrations.templatesDescription')}
              </p>
            </div>
          </div>
          {templatesExpanded ? (
            <ChevronUp className="w-5 h-5 text-on-surface-variant" />
          ) : (
            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
          )}
        </button>

        {templatesExpanded && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant pb-3">
                    {t('integrations.templateName')}
                  </th>
                  <th className="text-start text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant pb-3">
                    {t('integrations.supportedChannels')}
                  </th>
                  <th className="text-end text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant pb-3">
                    {t('integrations.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {templateCategories.map((tmpl) => (
                  <tr
                    key={tmpl.key}
                    className="border-b border-outline-variant/10 last:border-0"
                  >
                    <td className="py-3">
                      <span className="text-sm font-medium text-on-surface">
                        {t(`integrations.templates.${tmpl.key}`)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {tmpl.channels.map((ch) => {
                          const ChIcon = channelIconMap[ch];
                          const chColors = channelColorMap[ch];
                          return (
                            <div
                              key={ch}
                              className={`w-7 h-7 rounded-lg ${chColors.bg} flex items-center justify-center`}
                              title={ch}
                            >
                              <ChIcon className={`w-3.5 h-3.5 ${chColors.text}`} />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toast.info(t('integrations.templatePreview'))}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          {t('common.view')}
                        </button>
                        <button
                          onClick={() => toast.info(t('integrations.templateEdit'))}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                        >
                          <Settings2 className="w-3 h-3" />
                          {t('common.edit')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Log Section */}
      <div className={`${sectionCard}`}>
        <button
          onClick={() => setActivityExpanded(!activityExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-secondary" />
            </div>
            <div className="text-start">
              <h2 className="font-headline text-lg font-bold text-on-surface">
                {t('integrations.activityLog')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t('integrations.activityLogDescription')}
              </p>
            </div>
          </div>
          {activityExpanded ? (
            <ChevronUp className="w-5 h-5 text-on-surface-variant" />
          ) : (
            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
          )}
        </button>

        {activityExpanded && (
          <div className="mt-4">
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface-container-high rounded w-1/3" />
                      <div className="h-2.5 bg-surface-container-high rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-surface-container-high rounded w-16" />
                  </div>
                ))}
              </div>
            ) : activityLog.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 mx-auto text-on-surface-variant/30 mb-3" />
                <p className="text-sm text-on-surface-variant">
                  {t('integrations.noActivity')}
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {activityLog.slice(0, 50).map((entry) => {
                  const ChIcon = channelIconMap[entry.channel] || Mail;
                  const chColors = channelColorMap[entry.channel] || channelColorMap.email;
                  const statusStyle = deliveryStatusStyles[entry.status] || deliveryStatusStyles.pending;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-surface-container-low transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg ${chColors.bg} flex items-center justify-center flex-shrink-0`}>
                        <ChIcon className={`w-4 h-4 ${chColors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {entry.subject}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {entry.recipient} &middot; {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} flex-shrink-0`}
                      >
                        {t(`integrations.delivery${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {configModal.open && (
        <ConfigureModal
          channel={configModal.channel}
          onClose={() => setConfigModal({ open: false, channel: null, type: 'email' })}
          onSave={handleSave}
          onTest={handleTest}
          isSaving={saveMutation.isPending}
          isTesting={testMutation.isPending}
        />
      )}
    </div>
  );
}
