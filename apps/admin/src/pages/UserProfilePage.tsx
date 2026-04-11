import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Bell,
  Shield,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  Mail,
  MessageCircle,
  Smartphone,
  Save,
  Clock,
  Activity,
  Lock,
  Unlock,
  Globe,
  User,
  Building2,
  Crown,
  Wrench,
  Monitor,
  LogOut,
  AlertTriangle,
  Check,
  X,
  Send,
  VolumeX,
  BellOff,
  BellRing,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────

interface NotificationSetting {
  id: string;
  userId: string;
  category: string;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
}

interface QuietHours {
  userId: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
  exceptUrgent: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  language: string;
  status: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  notificationSettings: NotificationSetting[];
  quietHours: QuietHours;
}

interface ActivityEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface SessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const TABS = ['profile', 'notifications', 'activity', 'security'] as const;
type TabKey = (typeof TABS)[number];

const NOTIFICATION_CATEGORIES = [
  { key: 'booking', icon: '🏨', label: 'Bookings' },
  { key: 'payment', icon: '💰', label: 'Payments' },
  { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
  { key: 'system', icon: '⚠️', label: 'System Alerts' },
  { key: 'reports', icon: '📊', label: 'Reports' },
  { key: 'marketing', icon: '📢', label: 'Marketing' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית (Hebrew)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'ru', label: 'Русский (Russian)' },
];

const TIMEZONES = [
  'Europe/Athens',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Moscow',
  'Asia/Jerusalem',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown },
  { value: 'PROPERTY_MANAGER', label: 'Manager', icon: Shield },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench },
  { value: 'OWNER', label: 'Owner', icon: Building2 },
];

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/20',
  PROPERTY_MANAGER: 'bg-secondary/15 text-secondary border-secondary/20',
  MAINTENANCE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  OWNER: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  VIP_STAR: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  AFFILIATE: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROPERTY_MANAGER: 'Manager',
  MAINTENANCE: 'Maintenance',
  OWNER: 'Owner',
  VIP_STAR: 'VIP Star',
  AFFILIATE: 'Affiliate',
};

const statusBadgeStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  INACTIVE: 'bg-zinc-500/15 text-zinc-400',
  SUSPENDED: 'bg-red-500/15 text-red-400',
  PENDING: 'bg-amber-500/15 text-amber-400',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Toggle Switch Component ───────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:ring-offset-2 focus:ring-offset-surface ${
        disabled
          ? 'opacity-30 cursor-not-allowed bg-surface-container-high'
          : checked
            ? 'bg-secondary'
            : 'bg-surface-container-high'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as TabKey) || 'profile';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Profile form state
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    language: 'en',
    timezone: 'Europe/Athens',
  });

  // Notification state
  const [notifSettings, setNotifSettings] = useState<NotificationSetting[]>([]);
  const [quietHours, setQuietHours] = useState<QuietHours>({
    userId: '',
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    days: [],
    exceptUrgent: true,
  });
  const [notifDirty, setNotifDirty] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────

  const { data: userData, isLoading: userLoading } = useQuery<{ data: UserProfile }>({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<{ data: ActivityEntry[] }>({
    queryKey: ['user-activity', id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}/activity`);
      return res.data;
    },
    enabled: !!id && activeTab === 'activity',
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{ data: SessionInfo[] }>({
    queryKey: ['user-sessions', id],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${id}/sessions`);
      return res.data;
    },
    enabled: !!id && activeTab === 'security',
  });

  const user = userData?.data;
  const activities = activityData?.data ?? [];
  const sessions = sessionsData?.data ?? [];

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        language: user.language,
        timezone: user.timezone,
      });
      setNotifSettings(user.notificationSettings);
      setQuietHours(user.quietHours);
    }
  }, [user]);

  // ── Mutations ──────────────────────────────────────────────────────

  const updateUserMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.put(`/users/${id}`, data),
    onSuccess: () => {
      toast.success(t('users.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setEditMode(false);
    },
    onError: () => toast.error(t('users.updateError')),
  });

  const suspendMutation = useMutation({
    mutationFn: () => apiClient.post(`/users/${id}/suspend`),
    onSuccess: () => {
      toast.success(t('users.suspendSuccess'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    onError: () => toast.error(t('users.suspendError')),
  });

  const activateMutation = useMutation({
    mutationFn: () => apiClient.post(`/users/${id}/activate`),
    onSuccess: () => {
      toast.success(t('users.activateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    onError: () => toast.error(t('users.activateError')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => apiClient.post(`/users/${id}/reset-password`),
    onSuccess: () => toast.success(t('users.resetPasswordSuccess')),
    onError: () => toast.error(t('users.resetPasswordError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success(t('users.deleteSuccess'));
      navigate('/users');
    },
    onError: () => toast.error(t('users.deleteError')),
  });

  const updateNotifMutation = useMutation({
    mutationFn: (settings: NotificationSetting[]) =>
      apiClient.put(`/users/${id}/notification-settings`, {
        settings: settings.map((s) => ({
          category: s.category,
          email: s.email,
          whatsapp: s.whatsapp,
          sms: s.sms,
          push: s.push,
        })),
      }),
    onSuccess: () => {
      toast.success(t('users.notifSaved'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setNotifDirty(false);
    },
    onError: () => toast.error(t('users.notifSaveError')),
  });

  const updateQuietHoursMutation = useMutation({
    mutationFn: (data: Omit<QuietHours, 'userId'>) => apiClient.put(`/users/${id}/quiet-hours`, data),
    onSuccess: () => {
      toast.success(t('users.quietHoursSaved'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    onError: () => toast.error(t('users.quietHoursSaveError')),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/users/${id}/sessions/${sessionId}`),
    onSuccess: () => {
      toast.success(t('users.sessionRevoked'));
      queryClient.invalidateQueries({ queryKey: ['user-sessions', id] });
    },
    onError: () => toast.error(t('users.sessionRevokeError')),
  });

  // ── Notification Helpers ───────────────────────────────────────────

  const updateNotifCell = (category: string, channel: 'email' | 'whatsapp' | 'sms' | 'push', value: boolean) => {
    setNotifSettings((prev) =>
      prev.map((s) => (s.category === category ? { ...s, [channel]: value } : s)),
    );
    setNotifDirty(true);
  };

  const applyPreset = (preset: string) => {
    setNotifSettings((prev) =>
      prev.map((s) => {
        switch (preset) {
          case 'emailOnly':
            return { ...s, email: true, whatsapp: false, sms: false, push: false };
          case 'emailAndWhatsApp':
            return { ...s, email: true, whatsapp: true, sms: false, push: false };
          case 'allChannels':
            return { ...s, email: true, whatsapp: true, sms: true, push: true };
          case 'minimal':
            return {
              ...s,
              email: s.category === 'system',
              whatsapp: false,
              sms: false,
              push: false,
            };
          case 'muteAll':
            return { ...s, email: false, whatsapp: false, sms: false, push: false };
          default:
            return s;
        }
      }),
    );
    setNotifDirty(true);
  };

  const saveProfile = () => {
    updateUserMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      role: formData.role,
      status: formData.status,
      language: formData.language,
      timezone: formData.timezone,
    });
  };

  // ── Delivery Summary ───────────────────────────────────────────────

  const getDeliverySummary = (): string[] => {
    const summaries: string[] = [];
    for (const cat of NOTIFICATION_CATEGORIES) {
      const setting = notifSettings.find((s) => s.category === cat.key);
      if (!setting) continue;
      const channels: string[] = [];
      if (setting.email) channels.push('Email');
      if (setting.whatsapp) channels.push('WhatsApp');
      if (setting.sms) channels.push('SMS');
      if (setting.push) channels.push('Push');
      if (channels.length > 0) {
        summaries.push(`${cat.label} via ${channels.join(', ')}`);
      }
    }
    return summaries;
  };

  // ── Loading & Error ────────────────────────────────────────────────

  if (userLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-surface-container-high" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-surface-container-high rounded w-1/3" />
              <div className="h-4 bg-surface-container-high rounded w-1/4" />
            </div>
          </div>
          <div className="h-96 bg-surface-container-lowest rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">{t('users.userNotFound')}</h3>
          <p className="text-sm text-on-surface-variant mb-6">{t('users.userNotFoundDesc')}</p>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('users.backToUsers')}
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/users')}
        className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('users.backToUsers')}
      </button>

      {/* User Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center text-white font-headline font-bold text-2xl flex-shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-headline text-2xl font-bold text-on-surface">
                  {user.firstName} {user.lastName}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeStyles[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeStyles[user.status]}`}>
                  {statusLabels[user.status]}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-1">{user.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t('users.lastLogin')}: {relativeTime(user.lastLoginAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {t('users.memberSince')}: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setEditMode(!editMode); setActiveTab('profile'); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
            >
              <Edit3 className="w-4 h-4" />
              {t('users.editProfile')}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t('users.confirmResetPassword', { name: `${user.firstName} ${user.lastName}` }))) {
                  resetPasswordMutation.mutate();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
            >
              <KeyRound className="w-4 h-4" />
              {t('users.resetPassword')}
            </button>
            {user.status === 'SUSPENDED' ? (
              <button
                onClick={() => activateMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all"
              >
                <UserCheck className="w-4 h-4" />
                {t('users.activateUser')}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm(t('users.confirmSuspend', { name: `${user.firstName} ${user.lastName}` }))) {
                    suspendMutation.mutate();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all"
              >
                <UserX className="w-4 h-4" />
                {t('users.suspendUser')}
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(t('users.confirmDelete', { name: `${user.firstName} ${user.lastName}` }))) {
                  deleteMutation.mutate();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {t('users.deleteUser')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant/20 overflow-x-auto">
        {[
          { key: 'profile' as TabKey, label: t('users.tabProfile'), icon: User },
          { key: 'notifications' as TabKey, label: t('users.tabNotifications'), icon: Bell },
          { key: 'activity' as TabKey, label: t('users.tabActivity'), icon: Activity },
          { key: 'security' as TabKey, label: t('users.tabSecurity'), icon: Shield },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* ═══════ Tab 1: Profile ═══════ */}
        {activeTab === 'profile' && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                {t('users.profileInformation')}
              </h2>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-all"
                  >
                    <X className="w-4 h-4" />
                    {t('users.cancel')}
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={updateUserMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {updateUserMutation.isPending ? t('users.saving') : t('users.saveChanges')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('users.edit')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.firstName')}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  />
                ) : (
                  <p className="text-sm text-on-surface py-2.5">{user.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.lastName')}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  />
                ) : (
                  <p className="text-sm text-on-surface py-2.5">{user.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.email')}
                </label>
                <p className="text-sm text-on-surface py-2.5">{user.email}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.phone')}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                    placeholder="+30-694-000-0000"
                  />
                ) : (
                  <p className="text-sm text-on-surface py-2.5">{user.phone || '-'}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.role')}
                </label>
                {editMode ? (
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeStyles[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.status')}
                </label>
                {editMode ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="py-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeStyles[user.status]}`}>
                      {statusLabels[user.status]}
                    </span>
                  </div>
                )}
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.preferredLanguage')}
                </label>
                {editMode ? (
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-on-surface py-2.5">
                    {LANGUAGES.find((l) => l.code === user.language)?.label || user.language}
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('users.timezone')}
                </label>
                {editMode ? (
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-on-surface py-2.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
                    {user.timezone}
                  </p>
                )}
              </div>
            </div>

            {/* Owner-specific info */}
            {user.role === 'OWNER' && (
              <div className="mt-6 pt-6 border-t border-outline-variant/10">
                <h3 className="text-sm font-semibold text-on-surface mb-3">{t('users.ownerInfo')}</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/owners')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
                  >
                    <Building2 className="w-4 h-4" />
                    {t('users.viewOwnerProfile')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ Tab 2: Notifications ═══════ */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Channel Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Mail,
                  label: t('users.emailChannel'),
                  value: user.email,
                  available: true,
                  color: 'text-secondary',
                  bg: 'bg-secondary/10',
                },
                {
                  icon: MessageCircle,
                  label: t('users.whatsappChannel'),
                  value: user.phone || t('users.noPhoneConfigured'),
                  available: !!user.phone,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                },
                {
                  icon: Smartphone,
                  label: t('users.smsChannel'),
                  value: user.phone || t('users.noPhoneConfigured'),
                  available: !!user.phone,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                },
              ].map((ch) => (
                <div
                  key={ch.label}
                  className={`rounded-xl p-4 ambient-shadow border ${
                    ch.available
                      ? 'bg-surface-container-lowest border-outline-variant/20'
                      : 'bg-surface-container border-outline-variant/10 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${ch.bg} flex items-center justify-center`}>
                      <ch.icon className={`w-5 h-5 ${ch.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface">{ch.label}</p>
                      <p className="text-xs text-on-surface-variant truncate">{ch.value}</p>
                    </div>
                    {ch.available ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Presets Bar */}
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                {t('users.quickPresets')}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'emailOnly', label: t('users.presetEmailOnly'), icon: Mail },
                  { key: 'emailAndWhatsApp', label: t('users.presetEmailWhatsApp'), icon: MessageCircle },
                  { key: 'allChannels', label: t('users.presetAllChannels'), icon: BellRing },
                  { key: 'minimal', label: t('users.presetMinimal'), icon: VolumeX },
                  { key: 'muteAll', label: t('users.presetMuteAll'), icon: BellOff },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
                  >
                    <preset.icon className="w-3.5 h-3.5" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Matrix */}
            <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden">
              <div className="p-5 border-b border-outline-variant/10">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-lg font-semibold text-on-surface">
                    {t('users.notifPreferences')}
                  </h2>
                  {notifDirty && (
                    <button
                      onClick={() => updateNotifMutation.mutate(notifSettings)}
                      disabled={updateNotifMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {updateNotifMutation.isPending ? t('users.saving') : t('users.savePreferences')}
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant w-1/3">
                        {t('users.category')}
                      </th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        <div className="flex flex-col items-center gap-0.5">
                          <Mail className="w-4 h-4 text-secondary" />
                          <span>{t('users.emailLabel')}</span>
                        </div>
                      </th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <span>{t('users.whatsappLabel')}</span>
                        </div>
                      </th>
                      <th className="text-center px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        <div className="flex flex-col items-center gap-0.5">
                          <Smartphone className="w-4 h-4 text-blue-400" />
                          <span>{t('users.smsLabel')}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOTIFICATION_CATEGORIES.map((cat) => {
                      const setting = notifSettings.find((s) => s.category === cat.key);
                      if (!setting) return null;
                      return (
                        <tr key={cat.key} className="border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{cat.icon}</span>
                              <span className="text-sm font-medium text-on-surface">{cat.label}</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle
                                checked={setting.email}
                                onChange={(v) => updateNotifCell(cat.key, 'email', v)}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle
                                checked={setting.whatsapp}
                                onChange={(v) => updateNotifCell(cat.key, 'whatsapp', v)}
                                disabled={!user.phone}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle
                                checked={setting.sms}
                                onChange={(v) => updateNotifCell(cat.key, 'sms', v)}
                                disabled={!user.phone}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <VolumeX className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-headline text-base font-semibold text-on-surface">
                      {t('users.quietHours')}
                    </h3>
                    <p className="text-xs text-on-surface-variant">{t('users.quietHoursDesc')}</p>
                  </div>
                </div>
                <Toggle
                  checked={quietHours.enabled}
                  onChange={(v) => setQuietHours({ ...quietHours, enabled: v })}
                />
              </div>

              {quietHours.enabled && (
                <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                  {/* Time pickers */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        {t('users.startTime')}
                      </label>
                      <input
                        type="time"
                        value={quietHours.startTime}
                        onChange={(e) => setQuietHours({ ...quietHours, startTime: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        {t('users.endTime')}
                      </label>
                      <input
                        type="time"
                        value={quietHours.endTime}
                        onChange={(e) => setQuietHours({ ...quietHours, endTime: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                      {t('users.activeDays')}
                    </label>
                    <div className="flex gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          onClick={() => {
                            const newDays = quietHours.days.includes(day)
                              ? quietHours.days.filter((d) => d !== day)
                              : [...quietHours.days, day];
                            setQuietHours({ ...quietHours, days: newDays });
                          }}
                          className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                            quietHours.days.includes(day)
                              ? 'gradient-accent text-white'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Except urgent */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{t('users.exceptUrgent')}</p>
                      <p className="text-xs text-on-surface-variant">{t('users.exceptUrgentDesc')}</p>
                    </div>
                    <Toggle
                      checked={quietHours.exceptUrgent}
                      onChange={(v) => setQuietHours({ ...quietHours, exceptUrgent: v })}
                    />
                  </div>

                  {/* Save quiet hours */}
                  <button
                    onClick={() =>
                      updateQuietHoursMutation.mutate({
                        enabled: quietHours.enabled,
                        startTime: quietHours.startTime,
                        endTime: quietHours.endTime,
                        days: quietHours.days,
                        exceptUrgent: quietHours.exceptUrgent,
                      })
                    }
                    disabled={updateQuietHoursMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {updateQuietHoursMutation.isPending ? t('users.saving') : t('users.saveQuietHours')}
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Summary */}
            {notifSettings.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
                <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-secondary" />
                  {t('users.deliverySummary')}
                </h3>
                <div className="space-y-1.5">
                  {getDeliverySummary().length > 0 ? (
                    getDeliverySummary().map((line, i) => (
                      <p key={i} className="text-xs text-on-surface-variant flex items-start gap-2">
                        <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant italic">{t('users.noNotificationsEnabled')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ Tab 3: Activity ═══════ */}
        {activeTab === 'activity' && (
          <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden">
            <div className="p-5 border-b border-outline-variant/10">
              <h2 className="font-headline text-lg font-semibold text-on-surface">
                {t('users.activityLog')}
              </h2>
            </div>

            {activityLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-surface-container-high rounded w-2/3" />
                      <div className="h-2 bg-surface-container-high rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
                <p className="text-sm text-on-surface-variant">{t('users.noActivity')}</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/5">
                {activities.map((entry) => {
                  const actionColors: Record<string, string> = {
                    LOGIN: 'text-emerald-400 bg-emerald-500/10',
                    CREATE: 'text-blue-400 bg-blue-500/10',
                    UPDATE: 'text-amber-400 bg-amber-500/10',
                    DELETE: 'text-red-400 bg-red-500/10',
                    VIEW: 'text-secondary bg-secondary/10',
                  };
                  const colorClass = actionColors[entry.action] || 'text-on-surface-variant bg-surface-container';

                  return (
                    <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-container-low/30 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface">
                          <span className="font-medium">{entry.action}</span>
                          {' '}
                          <span className="text-on-surface-variant">{entry.entityType}</span>
                          {entry.entityId && (
                            <span className="text-on-surface-variant"> #{entry.entityId}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant">
                          <span>{formatDate(entry.createdAt)}</span>
                          {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                          {entry.userAgent && <span className="truncate max-w-[200px]">{entry.userAgent}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════ Tab 4: Security ═══════ */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* 2FA */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user.twoFactorEnabled ? 'bg-emerald-500/10' : 'bg-surface-container'}`}>
                    {user.twoFactorEnabled ? (
                      <Lock className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Unlock className="w-6 h-6 text-on-surface-variant" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-on-surface">{t('users.twoFactorAuth')}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {user.twoFactorEnabled ? t('users.twoFactorEnabled') : t('users.twoFactorDisabled')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateUserMutation.mutate({ twoFactorEnabled: !user.twoFactorEnabled });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    user.twoFactorEnabled
                      ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                      : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {user.twoFactorEnabled ? t('users.disable2fa') : t('users.enable2fa')}
                </button>
              </div>
            </div>

            {/* Password Info */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-on-surface-variant" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-on-surface">{t('users.passwordSecurity')}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {t('users.lastUpdated')}: {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(t('users.confirmResetPassword', { name: `${user.firstName} ${user.lastName}` }))) {
                      resetPasswordMutation.mutate();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  {t('users.forcePasswordReset')}
                </button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden">
              <div className="p-5 border-b border-outline-variant/10">
                <h3 className="font-headline text-base font-semibold text-on-surface">
                  {t('users.activeSessions')}
                </h3>
              </div>

              {sessionsLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-surface-container-high rounded w-1/2" />
                        <div className="h-2 bg-surface-container-high rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center">
                  <Monitor className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" />
                  <p className="text-sm text-on-surface-variant">{t('users.noSessions')}</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/5">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.isCurrent ? 'bg-emerald-500/10' : 'bg-surface-container'}`}>
                          <Monitor className={`w-5 h-5 ${session.isCurrent ? 'text-emerald-400' : 'text-on-surface-variant'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-on-surface">{session.deviceInfo}</p>
                            {session.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400">
                                {t('users.currentSession')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-on-surface-variant">
                            <span>IP: {session.ipAddress}</span>
                            <span>{t('users.lastActive')}: {relativeTime(session.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => {
                            if (window.confirm(t('users.confirmRevokeSession'))) {
                              revokeSessionMutation.mutate(session.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          {t('users.revokeSession')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Login Attempts Summary */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                  <Activity className="w-6 h-6 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-on-surface">{t('users.loginAttempts')}</h3>
                  <p className="text-xs text-on-surface-variant">{t('users.loginAttemptsDesc')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-surface-container">
                  <p className="text-2xl font-bold text-emerald-400">
                    {activities.filter((a) => a.action === 'LOGIN').length}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">{t('users.successfulLogins')}</p>
                </div>
                <div className="p-4 rounded-lg bg-surface-container">
                  <p className="text-2xl font-bold text-red-400">0</p>
                  <p className="text-xs text-on-surface-variant mt-1">{t('users.failedLogins')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
