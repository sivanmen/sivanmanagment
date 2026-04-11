import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  UserPlus,
  Mail,
  MessageCircle,
  Shield,
  Wrench,
  Building2,
  Crown,
  Send,
  Globe,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────

interface InviteUserModalProps {
  defaultRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────

const ROLES = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    desc: 'Full system access. Can manage all settings, users, and data.',
    icon: Crown,
    color: 'border-red-500/30 bg-red-500/5',
    textColor: 'text-red-400',
  },
  {
    value: 'PROPERTY_MANAGER',
    label: 'Property Manager',
    desc: 'Manages properties, bookings, maintenance, and guest communications.',
    icon: Shield,
    color: 'border-secondary/30 bg-secondary/5',
    textColor: 'text-secondary',
  },
  {
    value: 'MAINTENANCE',
    label: 'Maintenance Staff',
    desc: 'Handles maintenance requests and property upkeep tasks.',
    icon: Wrench,
    color: 'border-amber-500/30 bg-amber-500/5',
    textColor: 'text-amber-400',
  },
  {
    value: 'OWNER',
    label: 'Property Owner',
    desc: 'Views their property data, statements, and booking reports.',
    icon: Building2,
    color: 'border-blue-500/30 bg-blue-500/5',
    textColor: 'text-blue-400',
  },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'Hebrew' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ru', label: 'Russian' },
];

const PRESETS = [
  { key: 'emailOnly', label: 'Email Only' },
  { key: 'emailAndWhatsApp', label: 'Email & WhatsApp' },
  { key: 'allChannels', label: 'All Channels' },
  { key: 'minimal', label: 'Minimal (System Only)' },
  { key: 'muteAll', label: 'Mute All' },
];

// ── Component ──────────────────────────────────────────────────────────

export default function InviteUserModal({ defaultRole, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation();

  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [notificationPreset, setNotificationPreset] = useState('emailOnly');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const inviteMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/users/invite', data),
    onSuccess: () => {
      toast.success(t('users.inviteSuccess'));
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || t('users.inviteError');
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !firstName || !lastName) {
      toast.error(t('users.fillRequired'));
      return;
    }

    inviteMutation.mutate({
      email,
      firstName,
      lastName,
      role,
      phone: phone || undefined,
      language,
      notificationPreset,
      sendEmail,
      sendWhatsApp: sendWhatsApp && !!phone,
      welcomeMessage: welcomeMessage || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-2xl ambient-shadow-lg border border-outline-variant/20">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/10 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  {t('users.inviteUser')}
                </h2>
                <p className="text-xs text-on-surface-variant">{t('users.inviteUserDesc')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              {t('users.selectRole')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-start ${
                    role === r.value
                      ? `${r.color} border-2`
                      : 'border-outline-variant/20 hover:border-outline-variant/40'
                  }`}
                >
                  <r.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${role === r.value ? r.textColor : 'text-on-surface-variant'}`} />
                  <div>
                    <p className={`text-sm font-medium ${role === r.value ? r.textColor : 'text-on-surface'}`}>
                      {r.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant leading-tight mt-0.5">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('users.firstName')} *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('users.lastName')} *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {t('users.email')} *
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {t('users.phone')}
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                placeholder="+30-694-000-0000"
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {t('users.preferredLanguage')}
            </label>
            <div className="relative">
              <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all appearance-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification Preset */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              {t('users.initialNotifications')}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setNotificationPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    notificationPreset === p.key
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invitation Options */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/10">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {t('users.invitationOptions')}
            </p>

            {/* Send Email Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary" />
                <span className="text-sm text-on-surface">{t('users.sendInvitationEmail')}</span>
              </div>
              <button
                type="button"
                onClick={() => setSendEmail(!sendEmail)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  sendEmail ? 'bg-secondary' : 'bg-surface-container-high'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${sendEmail ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Send WhatsApp Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className={`w-4 h-4 ${phone ? 'text-emerald-400' : 'text-zinc-600'}`} />
                <span className={`text-sm ${phone ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                  {t('users.sendWelcomeWhatsApp')}
                </span>
                {!phone && (
                  <span className="text-[10px] text-on-surface-variant">{t('users.requiresPhone')}</span>
                )}
              </div>
              <button
                type="button"
                disabled={!phone}
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !phone
                    ? 'opacity-30 cursor-not-allowed bg-surface-container-high'
                    : sendWhatsApp
                      ? 'bg-emerald-500'
                      : 'bg-surface-container-high'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${sendWhatsApp ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              {t('users.welcomeMessage')}
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none"
              placeholder={t('users.welcomeMessagePlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-all"
            >
              {t('users.cancel')}
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {inviteMutation.isPending ? t('users.sending') : t('users.sendInvitation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
