import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Building2,
  Globe,
  Bell,
  CreditCard,
  Lock,
  Save,
  Check,
} from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
}

interface PreferencesData {
  locale: string;
  timezone: string;
  notifyBookings: boolean;
  notifyMaintenance: boolean;
  notifyFinancials: boolean;
  notifyMarketing: boolean;
}

interface PaymentMethodData {
  type: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  brand: string;
}

const demoProfile: ProfileData = {
  firstName: 'Sivan',
  lastName: 'Menahem',
  email: 'sivan@sivanmanagement.com',
  phone: '+30 694 123 4567',
  companyName: 'Sivan Property Management',
  companyTaxId: 'EL-801234567',
  companyAddress: 'Heraklion, Crete, Greece',
};

const demoPreferences: PreferencesData = {
  locale: 'en',
  timezone: 'Europe/Athens',
  notifyBookings: true,
  notifyMaintenance: true,
  notifyFinancials: true,
  notifyMarketing: false,
};

const demoPayment: PaymentMethodData = {
  type: 'card',
  last4: '4242',
  expiryMonth: '09',
  expiryYear: '2028',
  brand: 'Visa',
};

const localeOptions = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'עברית' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'ru', label: 'Русский' },
];

const timezoneOptions = [
  { value: 'Europe/Athens', label: 'Europe/Athens (GMT+3)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+2)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+2)' },
  { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem (GMT+3)' },
  { value: 'America/New_York', label: 'America/New_York (GMT-4)' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData>(demoProfile);
  const [preferences, setPreferences] = useState<PreferencesData>(demoPreferences);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-surface-container-high';

  const labelClasses = 'block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('settings.subtitle')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('settings.title')}
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-accent text-on-secondary text-sm font-medium whitespace-nowrap transition-all hover:opacity-90"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? t('settings.saved') : t('common.save')}
        </button>
      </div>

      {/* Profile Section */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('settings.profile')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>{t('settings.firstName')}</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.lastName')}</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.email')}</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.phone')}</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Company Section */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('settings.companyInfo')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>{t('settings.companyName')}</label>
            <input
              type="text"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.taxId')}</label>
            <input
              type="text"
              value={profile.companyTaxId}
              onChange={(e) => setProfile({ ...profile, companyTaxId: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClasses}>{t('settings.address')}</label>
            <input
              type="text"
              value={profile.companyAddress}
              onChange={(e) => setProfile({ ...profile, companyAddress: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('settings.preferences')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClasses}>{t('settings.language')}</label>
            <select
              value={preferences.locale}
              onChange={(e) => setPreferences({ ...preferences, locale: e.target.value })}
              className={inputClasses}
            >
              {localeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>{t('settings.timezone')}</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className={inputClasses}
            >
              {timezoneOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notification Toggles */}
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-on-surface-variant" />
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {t('settings.notifications')}
          </p>
        </div>

        <div className="space-y-3">
          {[
            { key: 'notifyBookings' as const, label: t('settings.notifyBookings') },
            { key: 'notifyMaintenance' as const, label: t('settings.notifyMaintenance') },
            { key: 'notifyFinancials' as const, label: t('settings.notifyFinancials') },
            { key: 'notifyMarketing' as const, label: t('settings.notifyMarketing') },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low"
            >
              <span className="text-sm text-on-surface">{item.label}</span>
              <button
                onClick={() =>
                  setPreferences({ ...preferences, [item.key]: !preferences[item.key] })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  preferences[item.key] ? 'bg-secondary' : 'bg-surface-container-high'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    preferences[item.key] ? 'translate-x-5.5 ltr:translate-x-[22px] rtl:-translate-x-[22px]' : 'translate-x-0.5 ltr:translate-x-[2px] rtl:-translate-x-[2px]'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('settings.paymentMethod')}
          </h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">
                {demoPayment.brand} {t('settings.endingIn')} {demoPayment.last4}
              </p>
              <p className="text-xs text-on-surface-variant">
                {t('settings.expires')} {demoPayment.expiryMonth}/{demoPayment.expiryYear}
              </p>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            {t('settings.update')}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-secondary" />
          <h3 className="font-headline text-lg font-semibold text-on-surface">
            {t('settings.changePassword')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>{t('settings.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="********"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>{t('settings.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              className={inputClasses}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 rounded-lg bg-surface-container-high text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
        >
          {t('settings.updatePassword')}
        </button>
      </div>
    </div>
  );
}
