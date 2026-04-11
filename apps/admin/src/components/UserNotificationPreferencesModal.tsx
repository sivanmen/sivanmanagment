import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Mail,
  MessageCircle,
  Smartphone,
  Bell,
  Loader2,
  CheckCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ───────────────────────────────────────────────────────────────────

type ChannelType = 'email' | 'whatsapp' | 'sms';

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface NotificationChannel {
  id: string;
  type: ChannelType;
  status: 'connected' | 'disconnected' | 'error';
}

interface NotificationPreferences {
  bookings: Record<ChannelType, boolean>;
  payments: Record<ChannelType, boolean>;
  maintenance: Record<ChannelType, boolean>;
  systemAlerts: Record<ChannelType, boolean>;
  marketing: Record<ChannelType, boolean>;
  reports: Record<ChannelType, boolean>;
}

type CategoryKey = keyof NotificationPreferences;

interface PreferencesResponse {
  data: NotificationPreferences;
}

interface ChannelsResponse {
  data: NotificationChannel[];
}

// ── Defaults ────────────────────────────────────────────────────────────────

const defaultRow = (): Record<ChannelType, boolean> => ({
  email: false,
  whatsapp: false,
  sms: false,
});

const defaultPreferences = (): NotificationPreferences => ({
  bookings: defaultRow(),
  payments: defaultRow(),
  maintenance: defaultRow(),
  systemAlerts: defaultRow(),
  marketing: defaultRow(),
  reports: defaultRow(),
});

// ── Constants ───────────────────────────────────────────────────────────────

const categories: CategoryKey[] = [
  'bookings',
  'payments',
  'maintenance',
  'systemAlerts',
  'marketing',
  'reports',
];

const channelTypes: ChannelType[] = ['email', 'whatsapp', 'sms'];

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

// ── Toggle Component ────────────────────────────────────────────────────────

function MiniToggle({
  checked,
  onChange,
  disabled,
  disabledTooltip,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30 ${
          disabled
            ? 'bg-outline-variant/10 cursor-not-allowed opacity-40'
            : checked
            ? 'bg-secondary'
            : 'bg-outline-variant/30'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
      {disabled && disabledTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-surface-container-high text-[10px] text-on-surface-variant whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
          {disabledTooltip}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface UserNotificationPreferencesModalProps {
  user: UserInfo;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserNotificationPreferencesModal({
  user,
  isOpen,
  onClose,
}: UserNotificationPreferencesModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences());

  // ── Fetch configured channels ──
  const { data: channelsData } = useQuery<ChannelsResponse>({
    queryKey: ['notification-channels'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/channels');
      return res.data;
    },
    enabled: isOpen,
  });

  const configuredChannels = channelsData?.data ?? [];
  const isChannelActive = (type: ChannelType): boolean => {
    const ch = configuredChannels.find((c) => c.type === type);
    return ch?.status === 'connected';
  };

  // ── Fetch user preferences ──
  const { data: prefsData, isLoading: prefsLoading } = useQuery<PreferencesResponse>({
    queryKey: ['notification-preferences', user.id],
    queryFn: async () => {
      const res = await apiClient.get(`/notifications/users/${user.id}/preferences`);
      return res.data;
    },
    enabled: isOpen && !!user.id,
  });

  useEffect(() => {
    if (prefsData?.data) {
      setPreferences(prefsData.data);
    } else {
      setPreferences(defaultPreferences());
    }
  }, [prefsData]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      return apiClient.put(`/notifications/users/${user.id}/preferences`, prefs);
    },
    onSuccess: () => {
      toast.success(t('notificationPreferences.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user.id] });
      onClose();
    },
    onError: () => {
      toast.error(t('notificationPreferences.saveError'));
    },
  });

  // ── Handlers ──
  const handleToggle = (category: CategoryKey, channel: ChannelType, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value,
      },
    }));
  };

  const handleEnableAll = () => {
    const newPrefs = { ...preferences };
    for (const cat of categories) {
      for (const ch of channelTypes) {
        if (isChannelActive(ch)) {
          newPrefs[cat] = { ...newPrefs[cat], [ch]: true };
        }
      }
    }
    setPreferences(newPrefs);
  };

  const handleEmailOnly = () => {
    const newPrefs = defaultPreferences();
    for (const cat of categories) {
      newPrefs[cat].email = isChannelActive('email');
    }
    setPreferences(newPrefs);
  };

  const handleDisableAll = () => {
    setPreferences(defaultPreferences());
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container rounded-t-2xl p-5 border-b border-outline-variant/20 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">
                  {t('notificationPreferences.title')}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {t('notificationPreferences.description')}
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

          {/* User Info */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold text-secondary">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="truncate">{user.email}</span>
                {user.phone && (
                  <>
                    <span>&middot;</span>
                    <span>{user.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-5 pt-5 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEnableAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-success bg-success/10 hover:bg-success/20 transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            {t('notificationPreferences.enableAll')}
          </button>
          <button
            onClick={handleEmailOnly}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <Mail className="w-3 h-3" />
            {t('notificationPreferences.emailOnly')}
          </button>
          <button
            onClick={handleDisableAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant bg-outline-variant/10 hover:bg-outline-variant/20 transition-colors"
          >
            <X className="w-3 h-3" />
            {t('notificationPreferences.disableAll')}
          </button>
        </div>

        {/* Preferences Matrix */}
        <div className="p-5">
          {prefsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant pb-3 ps-0">
                      {t('notificationPreferences.category')}
                    </th>
                    {channelTypes.map((ch) => {
                      const ChIcon = channelIconMap[ch];
                      const chColors = channelColorMap[ch];
                      const active = isChannelActive(ch);
                      return (
                        <th key={ch} className="text-center pb-3 px-3">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-8 h-8 rounded-lg ${chColors.bg} flex items-center justify-center ${
                                !active ? 'opacity-40' : ''
                              }`}
                            >
                              <ChIcon className={`w-4 h-4 ${chColors.text}`} />
                            </div>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                              active ? 'text-on-surface-variant' : 'text-on-surface-variant/40'
                            }`}>
                              {t(`notificationPreferences.channel${ch.charAt(0).toUpperCase() + ch.slice(1)}`)}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat} className="border-b border-outline-variant/10 last:border-0">
                      <td className="py-3.5 ps-0">
                        <span className="text-sm font-medium text-on-surface">
                          {t(`notificationPreferences.categories.${cat}`)}
                        </span>
                      </td>
                      {channelTypes.map((ch) => {
                        const active = isChannelActive(ch);
                        return (
                          <td key={ch} className="py-3.5 text-center">
                            <div className="flex justify-center">
                              <MiniToggle
                                checked={preferences[cat][ch]}
                                onChange={(v) => handleToggle(cat, ch, v)}
                                disabled={!active}
                                disabledTooltip={t('notificationPreferences.channelNotConfigured')}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="px-5 pb-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
            <Info className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant">
              {t('notificationPreferences.infoNote')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-container rounded-b-2xl p-5 border-t border-outline-variant/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
