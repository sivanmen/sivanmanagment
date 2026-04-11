import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  CalendarCheck,
  DollarSign,
  Bell,
  Plug,
  Palette,
  AlertTriangle,
  Save,
  Info,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Trash2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Tab Types ────────────────────────────────────────────────────
type SettingsTab =
  | 'general'
  | 'booking'
  | 'financial'
  | 'notifications'
  | 'integrations'
  | 'appearance'
  | 'danger';

interface TabDef {
  key: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabDef[] = [
  { key: 'general', label: 'General', icon: Building2 },
  { key: 'booking', label: 'Booking', icon: CalendarCheck },
  { key: 'financial', label: 'Financial', icon: DollarSign },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

// ── Reusable Styles ──────────────────────────────────────────────
const inputClasses =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';
const labelClasses =
  'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';
const sectionCard =
  'bg-surface-container-lowest rounded-xl p-5 ambient-shadow space-y-4';
const toggleClasses =
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30';

// ── Toggle Component ─────────────────────────────────────────────
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

// ── Masked Input ─────────────────────────────────────────────────
function MaskedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
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
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function SystemSettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // ── General ──
  const [general, setGeneral] = useState({
    companyName: 'Sivan Management',
    logoUrl: '',
    supportEmail: 'support@sivanmanagment.com',
    supportPhone: '+30 281 0123456',
    defaultCurrency: 'EUR',
    timezone: 'Europe/Athens',
    defaultLanguage: 'en',
    businessAddress: 'Heraklion, Crete, Greece',
  });

  // ── Booking ──
  const [booking, setBooking] = useState({
    defaultCheckInTime: '15:00',
    defaultCheckOutTime: '11:00',
    minimumStay: 1,
    maximumStay: 90,
    autoConfirmBookings: false,
    bufferDays: 0,
    cancellationPolicy: 'Moderate',
    securityDeposit: 200,
    defaultCleaningFee: 80,
  });

  // ── Financial ──
  const [financial, setFinancial] = useState({
    defaultManagementFee: 25,
    defaultMinimumMonthlyFee: 250,
    expenseApprovalThreshold: 100,
    autoCreateIncome: true,
    invoicePrefix: 'SM-',
    taxRate: 24,
    paymentTermsDays: 30,
    bankIban: '',
    bankBic: '',
    bankName: '',
  });

  // ── Notifications ──
  const [notifications, setNotifications] = useState({
    email: {
      newBooking: true,
      cancellation: true,
      checkInReminder: true,
      paymentReceived: true,
      expenseApproval: true,
    },
    whatsapp: {
      newBooking: true,
      cancellation: false,
      checkInReminder: true,
      paymentReceived: false,
      expenseApproval: true,
    },
    sms: {
      newBooking: false,
      cancellation: false,
      checkInReminder: false,
      paymentReceived: false,
      expenseApproval: false,
    },
    checkInReminderLead: '24',
    documentExpiryLead: '14',
  });

  // ── Integrations ──
  const [integrations, setIntegrations] = useState({
    airbnbApiKey: '',
    bookingComUser: '',
    bookingComPass: '',
    vrboUser: '',
    vrboPass: '',
    stripeApiKey: '',
    whatsappToken: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    googleMapsKey: '',
    icalSyncInterval: '15',
  });

  // ── Appearance ──
  const [appearance, setAppearance] = useState({
    primaryColor: '#030303',
    accentColor: '#6b38d4',
    logoUpload: '',
    clientPortalBranding: false,
    customCss: '',
  });

  // ── Danger ──
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast.success(t('settings.saveSuccess'));
  };

  const notifCategories = [
    { key: 'newBooking', label: t('settings.notifNewBooking') },
    { key: 'cancellation', label: t('settings.notifCancellation') },
    { key: 'checkInReminder', label: t('settings.notifCheckInReminder') },
    { key: 'paymentReceived', label: t('settings.notifPaymentReceived') },
    { key: 'expenseApproval', label: t('settings.notifExpenseApproval') },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('nav.settings')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('settings.title')}
          </h1>
        </div>
        {activeTab !== 'danger' && (
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t('common.save')}</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? tab.key === 'danger'
                    ? 'bg-error/10 text-error'
                    : 'bg-secondary/10 text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════ TAB: GENERAL ══════════════ */}
      {activeTab === 'general' && (
        <div className="max-w-3xl space-y-6">
          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.companyInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.companyName')}</label>
                <input
                  type="text"
                  value={general.companyName}
                  onChange={(e) => setGeneral({ ...general, companyName: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.logoUrl')}</label>
                <input
                  type="url"
                  value={general.logoUrl}
                  onChange={(e) => setGeneral({ ...general, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.supportEmail')}</label>
                <input
                  type="email"
                  value={general.supportEmail}
                  onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.supportPhone')}</label>
                <input
                  type="tel"
                  value={general.supportPhone}
                  onChange={(e) => setGeneral({ ...general, supportPhone: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.defaults')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.defaultCurrency')}</label>
                <select
                  value={general.defaultCurrency}
                  onChange={(e) => setGeneral({ ...general, defaultCurrency: e.target.value })}
                  className={inputClasses}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="ILS">ILS</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.timezone')}</label>
                <select
                  value={general.timezone}
                  onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                  className={inputClasses}
                >
                  <option value="Europe/Athens">Europe/Athens (UTC+2)</option>
                  <option value="Asia/Jerusalem">Asia/Jerusalem (UTC+2)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.defaultLanguage')}</label>
                <select
                  value={general.defaultLanguage}
                  onChange={(e) => setGeneral({ ...general, defaultLanguage: e.target.value })}
                  className={inputClasses}
                >
                  <option value="en">English</option>
                  <option value="he">Hebrew</option>
                  <option value="el">Greek</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClasses}>{t('settings.businessAddress')}</label>
              <input
                type="text"
                value={general.businessAddress}
                onChange={(e) => setGeneral({ ...general, businessAddress: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: BOOKING ══════════════ */}
      {activeTab === 'booking' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t('settings.bookingInfoText')}
            </p>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.checkInOut')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.defaultCheckIn')}</label>
                <input
                  type="time"
                  value={booking.defaultCheckInTime}
                  onChange={(e) => setBooking({ ...booking, defaultCheckInTime: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.defaultCheckOut')}</label>
                <input
                  type="time"
                  value={booking.defaultCheckOutTime}
                  onChange={(e) => setBooking({ ...booking, defaultCheckOutTime: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.stayRules')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.minimumStay')}</label>
                <input
                  type="number"
                  min={1}
                  value={booking.minimumStay}
                  onChange={(e) =>
                    setBooking({ ...booking, minimumStay: parseInt(e.target.value) || 1 })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.maximumStay')}</label>
                <input
                  type="number"
                  min={1}
                  value={booking.maximumStay}
                  onChange={(e) =>
                    setBooking({ ...booking, maximumStay: parseInt(e.target.value) || 90 })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.bufferDays')}</label>
                <select
                  value={booking.bufferDays}
                  onChange={(e) =>
                    setBooking({ ...booking, bufferDays: parseInt(e.target.value) })
                  }
                  className={inputClasses}
                >
                  {[0, 1, 2, 3].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.policies')}
            </h3>
            <Toggle
              checked={booking.autoConfirmBookings}
              onChange={(v) => setBooking({ ...booking, autoConfirmBookings: v })}
              label={t('settings.autoConfirmBookings')}
            />
            <div>
              <label className={labelClasses}>{t('settings.cancellationPolicy')}</label>
              <select
                value={booking.cancellationPolicy}
                onChange={(e) =>
                  setBooking({ ...booking, cancellationPolicy: e.target.value })
                }
                className={inputClasses}
              >
                <option value="Flexible">Flexible</option>
                <option value="Moderate">Moderate</option>
                <option value="Strict">Strict</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.securityDeposit')}</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={booking.securityDeposit}
                  onChange={(e) =>
                    setBooking({ ...booking, securityDeposit: parseFloat(e.target.value) || 0 })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.defaultCleaningFee')}</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={booking.defaultCleaningFee}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      defaultCleaningFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: FINANCIAL ══════════════ */}
      {activeTab === 'financial' && (
        <div className="max-w-3xl space-y-6">
          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.feeDefaults')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.defaultMgmtFee')}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={financial.defaultManagementFee}
                    onChange={(e) =>
                      setFinancial({
                        ...financial,
                        defaultManagementFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputClasses + ' pe-8'}
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.defaultMinFee')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    {'\u20AC'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={financial.defaultMinimumMonthlyFee}
                    onChange={(e) =>
                      setFinancial({
                        ...financial,
                        defaultMinimumMonthlyFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputClasses + ' ps-8'}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.expenseThreshold')}</label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    {'\u20AC'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={financial.expenseApprovalThreshold}
                    onChange={(e) =>
                      setFinancial({
                        ...financial,
                        expenseApprovalThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputClasses + ' ps-8'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.invoicing')}
            </h3>
            <Toggle
              checked={financial.autoCreateIncome}
              onChange={(v) => setFinancial({ ...financial, autoCreateIncome: v })}
              label={t('settings.autoCreateIncome')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.invoicePrefix')}</label>
                <input
                  type="text"
                  value={financial.invoicePrefix}
                  onChange={(e) =>
                    setFinancial({ ...financial, invoicePrefix: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.taxRate')}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={financial.taxRate}
                    onChange={(e) =>
                      setFinancial({
                        ...financial,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputClasses + ' pe-8'}
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.paymentTerms')}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={financial.paymentTermsDays}
                    onChange={(e) =>
                      setFinancial({
                        ...financial,
                        paymentTermsDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className={inputClasses + ' pe-14'}
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.bankDetails')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClasses}>IBAN</label>
                <input
                  type="text"
                  value={financial.bankIban}
                  onChange={(e) =>
                    setFinancial({ ...financial, bankIban: e.target.value })
                  }
                  placeholder="GR00 0000 0000 0000 0000 0000 000"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>BIC / SWIFT</label>
                <input
                  type="text"
                  value={financial.bankBic}
                  onChange={(e) =>
                    setFinancial({ ...financial, bankBic: e.target.value })
                  }
                  placeholder="ABCDEFGH"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('settings.bankName')}</label>
                <input
                  type="text"
                  value={financial.bankName}
                  onChange={(e) =>
                    setFinancial({ ...financial, bankName: e.target.value })
                  }
                  placeholder="e.g. Alpha Bank"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: NOTIFICATIONS ══════════════ */}
      {activeTab === 'notifications' && (
        <div className="max-w-4xl space-y-6">
          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.notifChannels')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start py-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t('settings.notifEvent')}
                    </th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Email
                    </th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      WhatsApp
                    </th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      SMS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notifCategories.map((cat) => (
                    <tr
                      key={cat.key}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-3 px-2 text-sm text-on-surface">{cat.label}</td>
                      {(['email', 'whatsapp', 'sms'] as const).map((ch) => (
                        <td key={ch} className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={
                              notifications[ch][cat.key as keyof typeof notifications.email]
                            }
                            onChange={() =>
                              setNotifications({
                                ...notifications,
                                [ch]: {
                                  ...notifications[ch],
                                  [cat.key]:
                                    !notifications[ch][
                                      cat.key as keyof typeof notifications.email
                                    ],
                                },
                              })
                            }
                            className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/30"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.notifLeadTimes')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.checkInReminderLead')}</label>
                <select
                  value={notifications.checkInReminderLead}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      checkInReminderLead: e.target.value,
                    })
                  }
                  className={inputClasses}
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.documentExpiryLead')}</label>
                <select
                  value={notifications.documentExpiryLead}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      documentExpiryLead: e.target.value,
                    })
                  }
                  className={inputClasses}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: INTEGRATIONS ══════════════ */}
      {activeTab === 'integrations' && (
        <div className="max-w-3xl space-y-6">
          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.otaIntegrations')}
            </h3>
            <div>
              <label className={labelClasses}>Airbnb API Key</label>
              <MaskedInput
                value={integrations.airbnbApiKey}
                onChange={(v) => setIntegrations({ ...integrations, airbnbApiKey: v })}
                placeholder="sk_live_..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Booking.com Username</label>
                <input
                  type="text"
                  value={integrations.bookingComUser}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, bookingComUser: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Booking.com Password</label>
                <MaskedInput
                  value={integrations.bookingComPass}
                  onChange={(v) => setIntegrations({ ...integrations, bookingComPass: v })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>VRBO Username</label>
                <input
                  type="text"
                  value={integrations.vrboUser}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, vrboUser: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>VRBO Password</label>
                <MaskedInput
                  value={integrations.vrboPass}
                  onChange={(v) => setIntegrations({ ...integrations, vrboPass: v })}
                />
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.paymentIntegrations')}
            </h3>
            <div>
              <label className={labelClasses}>Stripe API Key</label>
              <MaskedInput
                value={integrations.stripeApiKey}
                onChange={(v) => setIntegrations({ ...integrations, stripeApiKey: v })}
                placeholder="sk_live_..."
              />
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.messagingIntegrations')}
            </h3>
            <div>
              <label className={labelClasses}>WhatsApp Business API Token</label>
              <MaskedInput
                value={integrations.whatsappToken}
                onChange={(v) => setIntegrations({ ...integrations, whatsappToken: v })}
              />
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.smtpSettings')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>SMTP Host</label>
                <input
                  type="text"
                  value={integrations.smtpHost}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, smtpHost: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>SMTP Port</label>
                <input
                  type="text"
                  value={integrations.smtpPort}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, smtpPort: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>SMTP User</label>
                <input
                  type="text"
                  value={integrations.smtpUser}
                  onChange={(e) =>
                    setIntegrations({ ...integrations, smtpUser: e.target.value })
                  }
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>SMTP Password</label>
                <MaskedInput
                  value={integrations.smtpPass}
                  onChange={(v) => setIntegrations({ ...integrations, smtpPass: v })}
                />
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.otherIntegrations')}
            </h3>
            <div>
              <label className={labelClasses}>Google Maps API Key</label>
              <MaskedInput
                value={integrations.googleMapsKey}
                onChange={(v) => setIntegrations({ ...integrations, googleMapsKey: v })}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('settings.icalSyncInterval')}</label>
              <select
                value={integrations.icalSyncInterval}
                onChange={(e) =>
                  setIntegrations({ ...integrations, icalSyncInterval: e.target.value })
                }
                className={inputClasses}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: APPEARANCE ══════════════ */}
      {activeTab === 'appearance' && (
        <div className="max-w-3xl space-y-6">
          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.branding')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>{t('settings.primaryColor')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) =>
                      setAppearance({ ...appearance, primaryColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={appearance.primaryColor}
                    onChange={(e) =>
                      setAppearance({ ...appearance, primaryColor: e.target.value })
                    }
                    className={inputClasses + ' flex-1'}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t('settings.accentColor')}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearance.accentColor}
                    onChange={(e) =>
                      setAppearance({ ...appearance, accentColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={appearance.accentColor}
                    onChange={(e) =>
                      setAppearance({ ...appearance, accentColor: e.target.value })
                    }
                    className={inputClasses + ' flex-1'}
                  />
                </div>
              </div>
            </div>

            {/* Preview swatch */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-container-low">
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: appearance.primaryColor }}
              />
              <div
                className="w-12 h-12 rounded-lg"
                style={{ backgroundColor: appearance.accentColor }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{t('settings.colorPreview')}</p>
                <p className="text-xs text-on-surface-variant">{t('settings.colorPreviewDesc')}</p>
              </div>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.logoUpload')}
            </h3>
            <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-8 text-center">
              <Palette className="w-8 h-8 text-on-surface-variant mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">
                {t('settings.logoUploadDesc')}
              </p>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.clientPortal')}
            </h3>
            <Toggle
              checked={appearance.clientPortalBranding}
              onChange={(v) =>
                setAppearance({ ...appearance, clientPortalBranding: v })
              }
              label={t('settings.clientPortalBrandingToggle')}
            />
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.customCss')}
            </h3>
            <textarea
              value={appearance.customCss}
              onChange={(e) => setAppearance({ ...appearance, customCss: e.target.value })}
              rows={6}
              placeholder="/* Custom CSS overrides */"
              className={inputClasses + ' resize-none font-mono text-xs'}
            />
          </div>
        </div>
      )}

      {/* ══════════════ TAB: DANGER ZONE ══════════════ */}
      {activeTab === 'danger' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-error/5 border border-error/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">
                {t('settings.dangerWarningTitle')}
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('settings.dangerWarningDesc')}
              </p>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.dataExport')}
            </h3>
            <button
              onClick={() => toast.success(t('settings.exportStarted'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface bg-surface-container-low hover:bg-surface-container-high transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t('settings.exportAllCsv')}</span>
            </button>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.resetData')}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => toast.success(t('settings.demoDataReset'))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-warning bg-warning/10 hover:bg-warning/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('settings.resetDemoData')}</span>
              </button>
              <button
                onClick={() => toast.success(t('settings.testBookingsDeleted'))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-error bg-error/10 hover:bg-error/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('settings.deleteTestBookings')}</span>
              </button>
            </div>
          </div>

          <div className={sectionCard}>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('settings.maintenanceMode')}
            </h3>
            <Toggle
              checked={maintenanceMode}
              onChange={setMaintenanceMode}
              label={t('settings.enableMaintenanceMode')}
            />
            {maintenanceMode && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-warning" />
                <p className="text-xs text-warning font-medium">
                  {t('settings.maintenanceModeActive')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
