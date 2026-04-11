import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  Bell,
  Palette,
  Globe,
  CalendarHeart,
  Users,
  Save,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface PortalConfig {
  ownerId: string;
  customDomain: string;
  branding: { logoUrl: string; accentColor: string; welcomeMessage: string };
  visibility: {
    showFinancials: boolean;
    showGuestContacts: boolean;
    showBookingDetails: boolean;
    showMaintenanceRequests: boolean;
    showDocuments: boolean;
    showOccupancyMetrics: boolean;
    showRevenueCharts: boolean;
    allowOwnerReservations: boolean;
    allowFriendsAndFamily: boolean;
    maxOwnerBlockDaysPerMonth: number;
  };
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    checkIn: boolean;
    checkOut: boolean;
    monthlyReport: boolean;
    maintenanceUpdate: boolean;
  };
}

const demoOwners = [
  { id: 'owner-1', name: 'Dimitris Papadopoulos' },
  { id: 'owner-2', name: 'Maria Konstantinou' },
  { id: 'owner-3', name: 'Yannis Alexiou' },
];

const defaultConfig: PortalConfig = {
  ownerId: 'owner-1',
  customDomain: '',
  branding: { logoUrl: '', accentColor: '#6C5CE7', welcomeMessage: 'Welcome to your owner portal' },
  visibility: {
    showFinancials: true,
    showGuestContacts: false,
    showBookingDetails: true,
    showMaintenanceRequests: true,
    showDocuments: true,
    showOccupancyMetrics: true,
    showRevenueCharts: true,
    allowOwnerReservations: true,
    allowFriendsAndFamily: true,
    maxOwnerBlockDaysPerMonth: 7,
  },
  notifications: {
    newBooking: true,
    cancellation: true,
    checkIn: true,
    checkOut: false,
    monthlyReport: true,
    maintenanceUpdate: true,
  },
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer group">
      <span className="text-sm text-on-surface group-hover:text-secondary transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-secondary' : 'bg-outline-variant/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export default function OwnerPortalConfigPage() {
  const { t } = useTranslation();
  const [selectedOwnerId, setSelectedOwnerId] = useState('owner-1');
  const [config, setConfig] = useState<PortalConfig>(defaultConfig);

  const handleOwnerChange = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setConfig({ ...defaultConfig, ownerId });
  };

  const updateVisibility = (key: keyof PortalConfig['visibility'], value: boolean | number) => {
    setConfig((prev) => ({
      ...prev,
      visibility: { ...prev.visibility, [key]: value },
    }));
  };

  const updateNotification = (key: keyof PortalConfig['notifications'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateBranding = (key: keyof PortalConfig['branding'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      branding: { ...prev.branding, [key]: value },
    }));
  };

  const handleSave = () => {
    toast.success(t('ownerPortal.configSaved'));
  };

  const selectedOwner = demoOwners.find((o) => o.id === selectedOwnerId);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('ownerPortal.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('ownerPortal.configTitle')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info(t('ownerPortal.previewOpened'))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container-lowest ambient-shadow text-on-surface hover:bg-surface-container-low transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {t('ownerPortal.previewPortal')}
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Save className="w-4 h-4" />
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Owner Selector */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.selectOwner')}</h2>
        </div>
        <div className="relative max-w-sm">
          <select
            value={selectedOwnerId}
            onChange={(e) => handleOwnerChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          >
            {demoOwners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visibility Toggles */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.portalVisibility')}</h2>
          </div>
          <div className="space-y-1 divide-y divide-outline-variant/10">
            <Toggle checked={config.visibility.showFinancials} onChange={(v) => updateVisibility('showFinancials', v)} label={t('ownerPortal.showFinancials')} />
            <Toggle checked={config.visibility.showGuestContacts} onChange={(v) => updateVisibility('showGuestContacts', v)} label={t('ownerPortal.showGuestContacts')} />
            <Toggle checked={config.visibility.showBookingDetails} onChange={(v) => updateVisibility('showBookingDetails', v)} label={t('ownerPortal.showBookingDetails')} />
            <Toggle checked={config.visibility.showMaintenanceRequests} onChange={(v) => updateVisibility('showMaintenanceRequests', v)} label={t('ownerPortal.showMaintenance')} />
            <Toggle checked={config.visibility.showDocuments} onChange={(v) => updateVisibility('showDocuments', v)} label={t('ownerPortal.showDocuments')} />
            <Toggle checked={config.visibility.showOccupancyMetrics} onChange={(v) => updateVisibility('showOccupancyMetrics', v)} label={t('ownerPortal.showOccupancy')} />
            <Toggle checked={config.visibility.showRevenueCharts} onChange={(v) => updateVisibility('showRevenueCharts', v)} label={t('ownerPortal.showRevenue')} />
          </div>
        </div>

        {/* Notification Toggles */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-warning" />
            </div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.notificationSettings')}</h2>
          </div>
          <div className="space-y-1 divide-y divide-outline-variant/10">
            <Toggle checked={config.notifications.newBooking} onChange={(v) => updateNotification('newBooking', v)} label={t('ownerPortal.notifyNewBooking')} />
            <Toggle checked={config.notifications.cancellation} onChange={(v) => updateNotification('cancellation', v)} label={t('ownerPortal.notifyCancellation')} />
            <Toggle checked={config.notifications.checkIn} onChange={(v) => updateNotification('checkIn', v)} label={t('ownerPortal.notifyCheckIn')} />
            <Toggle checked={config.notifications.checkOut} onChange={(v) => updateNotification('checkOut', v)} label={t('ownerPortal.notifyCheckOut')} />
            <Toggle checked={config.notifications.monthlyReport} onChange={(v) => updateNotification('monthlyReport', v)} label={t('ownerPortal.notifyMonthlyReport')} />
            <Toggle checked={config.notifications.maintenanceUpdate} onChange={(v) => updateNotification('maintenanceUpdate', v)} label={t('ownerPortal.notifyMaintenance')} />
          </div>
        </div>

        {/* Owner Reservation Settings */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CalendarHeart className="w-4 h-4 text-success" />
            </div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.reservationSettings')}</h2>
          </div>
          <div className="space-y-1 divide-y divide-outline-variant/10">
            <Toggle checked={config.visibility.allowOwnerReservations} onChange={(v) => updateVisibility('allowOwnerReservations', v)} label={t('ownerPortal.allowOwnerReservations')} />
            <Toggle checked={config.visibility.allowFriendsAndFamily} onChange={(v) => updateVisibility('allowFriendsAndFamily', v)} label={t('ownerPortal.allowFriendsFamily')} />
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/10">
            <label className="block text-sm text-on-surface mb-2">{t('ownerPortal.maxBlockDays')}</label>
            <input
              type="number"
              min={0}
              max={31}
              value={config.visibility.maxOwnerBlockDaysPerMonth}
              onChange={(e) => updateVisibility('maxOwnerBlockDaysPerMonth', Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            />
            <p className="text-xs text-on-surface-variant mt-1">{t('ownerPortal.maxBlockDaysHint')}</p>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.brandingSettings')}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('ownerPortal.accentColor')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.branding.accentColor}
                  onChange={(e) => updateBranding('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.branding.accentColor}
                  onChange={(e) => updateBranding('accentColor', e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('ownerPortal.logoUrl')}
              </label>
              <input
                type="text"
                value={config.branding.logoUrl}
                onChange={(e) => updateBranding('logoUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('ownerPortal.welcomeMessage')}
              </label>
              <textarea
                rows={3}
                value={config.branding.welcomeMessage}
                onChange={(e) => updateBranding('welcomeMessage', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="font-headline text-lg font-semibold text-on-surface">{t('ownerPortal.customDomain')}</h2>
        </div>
        <input
          type="text"
          value={config.customDomain}
          onChange={(e) => setConfig((prev) => ({ ...prev, customDomain: e.target.value }))}
          placeholder="portal.example.com"
          className="w-full max-w-md px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
        />
        <p className="text-xs text-on-surface-variant mt-2">{t('ownerPortal.customDomainHint')}</p>
      </div>
    </div>
  );
}
