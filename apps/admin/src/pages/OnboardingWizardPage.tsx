import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Home,
  Link2,
  DollarSign,
  Zap,
  Users,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Clock,
  Mail,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

interface TeamMember {
  email: string;
  role: string;
}

export default function OnboardingWizardPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isDemo, setIsDemo] = useState(false);

  // Step 1: Company
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [timezone, setTimezone] = useState('Europe/Athens');
  const [currency, setCurrency] = useState('EUR');

  // Step 2: Property
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyCountry, setPropertyCountry] = useState('Greece');

  // Step 3: Channels
  const [airbnbConnected, setAirbnbConnected] = useState(false);
  const [bookingConnected, setBookingConnected] = useState(false);

  // Step 4: Pricing
  const [baseRate, setBaseRate] = useState('');
  const [cleaningFee, setCleaningFee] = useState('');

  // Step 5: Automations
  const [autoClean, setAutoClean] = useState(true);
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [autoReview, setAutoReview] = useState(false);

  // Step 6: Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('PROPERTY_MANAGER');

  const addTeamMember = () => {
    if (newEmail.trim()) {
      setTeamMembers([...teamMembers, { email: newEmail, role: newRole }]);
      setNewEmail('');
    }
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const canContinue = () => {
    if (isDemo) return true;
    switch (step) {
      case 1: return companyName.trim().length > 0;
      case 2: return propertyName.trim().length > 0;
      default: return true;
    }
  };

  const handleFinish = () => {
    toast.success(t('onboarding.setupComplete'));
  };

  const stepIcons = [Building2, Home, Link2, DollarSign, Zap, Users, Rocket];
  const stepLabels = [
    t('onboarding.step1'),
    t('onboarding.step2'),
    t('onboarding.step3'),
    t('onboarding.step4'),
    t('onboarding.step5'),
    t('onboarding.step6'),
    t('onboarding.step7'),
  ];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          {t('onboarding.label')}
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          {t('onboarding.title')}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('onboarding.subtitle')}</p>
      </div>

      {/* Demo mode toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsDemo(!isDemo)}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            isDemo ? 'bg-warning/10 text-warning border border-warning/30' : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant'
          }`}
        >
          {isDemo ? t('onboarding.demoActive') : t('onboarding.enableDemo')}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-on-surface-variant">
            {t('onboarding.stepOf', { current: step, total: TOTAL_STEPS })}
          </span>
          <span className="text-xs font-semibold text-secondary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full gradient-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {/* Step indicators */}
        <div className="flex items-center justify-between mt-4">
          {stepLabels.map((label, i) => {
            const Icon = stepIcons[i];
            const isActive = i + 1 === step;
            const isComplete = i + 1 < step;
            return (
              <button
                key={i}
                onClick={() => i + 1 <= step && setStep(i + 1)}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isActive ? 'scale-110' : ''
                } ${i + 1 <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? 'gradient-accent text-white' :
                  isComplete ? 'bg-success/10 text-success' :
                  'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[9px] font-medium hidden sm:block ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow min-h-[320px]">
        {/* Step 1: Company Setup */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.companySetup')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.companySetupDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('settings.companyName')} *</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Sivan Management" className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('settings.timezone')}</label>
                <div className="relative">
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30">
                    <option value="Europe/Athens">Europe/Athens</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New York</option>
                    <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                  </select>
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('properties.currency')}</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="ILS">ILS</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('settings.logoUrl')}</label>
                <input type="text" value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Add First Property */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.addProperty')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.addPropertyDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('properties.propertyName')} *</label>
                <input type="text" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder={t('properties.propertyNamePlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('properties.propertyType')}</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30">
                  <option value="APARTMENT">{t('properties.typeApartment')}</option>
                  <option value="HOUSE">{t('properties.typeHouse')}</option>
                  <option value="HOTEL">{t('properties.typeHotel')}</option>
                  <option value="COMMERCIAL">{t('properties.typeCommercial')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('properties.city')}</label>
                <input type="text" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder={t('properties.cityPlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('properties.country')}</label>
                <input type="text" value={propertyCountry} onChange={(e) => setPropertyCountry(e.target.value)} placeholder={t('properties.countryPlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Connect Channels */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.connectChannels')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.connectChannelsDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setAirbnbConnected(!airbnbConnected)}
                className={`p-5 rounded-xl border-2 transition-all text-start ${
                  airbnbConnected ? 'border-secondary bg-secondary/5' : 'border-outline-variant/20 hover:border-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-on-surface">Airbnb</span>
                  {airbnbConnected && <Check className="w-5 h-5 text-secondary" />}
                </div>
                <p className="text-xs text-on-surface-variant">{t('onboarding.airbnbDesc')}</p>
              </button>
              <button
                onClick={() => setBookingConnected(!bookingConnected)}
                className={`p-5 rounded-xl border-2 transition-all text-start ${
                  bookingConnected ? 'border-secondary bg-secondary/5' : 'border-outline-variant/20 hover:border-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-on-surface">Booking.com</span>
                  {bookingConnected && <Check className="w-5 h-5 text-secondary" />}
                </div>
                <p className="text-xs text-on-surface-variant">{t('onboarding.bookingDesc')}</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Set Pricing */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.setPricing')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.setPricingDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('onboarding.baseRate')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">{'\u20AC'}</span>
                  <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} placeholder="150" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">{t('onboarding.perNight')}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('onboarding.cleaningFee')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">{'\u20AC'}</span>
                  <input type="number" value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} placeholder="65" className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">{t('onboarding.perStay')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Configure Automations */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.configAutomations')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.configAutomationsDesc')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: 'autoClean', label: t('onboarding.autoCleaningTask'), desc: t('onboarding.autoCleaningTaskDesc'), checked: autoClean, toggle: setAutoClean },
                { key: 'autoCheckin', label: t('onboarding.autoCheckinMsg'), desc: t('onboarding.autoCheckinMsgDesc'), checked: autoCheckin, toggle: setAutoCheckin },
                { key: 'autoReview', label: t('onboarding.autoReviewRequest'), desc: t('onboarding.autoReviewRequestDesc'), checked: autoReview, toggle: setAutoReview },
              ].map(({ key, label, desc, checked, toggle }) => (
                <button
                  key={key}
                  onClick={() => toggle(!checked)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-start flex items-center justify-between ${
                    checked ? 'border-secondary bg-secondary/5' : 'border-outline-variant/20 hover:border-secondary/50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">{label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    checked ? 'gradient-accent' : 'bg-surface-container-high'
                  }`}>
                    {checked && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Invite Team */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">{t('onboarding.inviteTeam')}</h2>
                <p className="text-xs text-on-surface-variant">{t('onboarding.inviteTeamDesc')}</p>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="team@example.com" className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
              </div>
              <div className="w-44">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('onboarding.role')}</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30">
                  <option value="PROPERTY_MANAGER">{t('onboarding.roleManager')}</option>
                  <option value="MAINTENANCE">{t('onboarding.roleMaintenance')}</option>
                </select>
              </div>
              <button onClick={addTeamMember} className="px-4 py-2.5 rounded-lg gradient-accent text-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                {teamMembers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-on-surface-variant" />
                      <span className="text-sm text-on-surface">{m.email}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/10 text-secondary uppercase">{m.role}</span>
                    </div>
                    <button onClick={() => removeTeamMember(i)} className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 7: Launch */}
        {step === 7 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mx-auto">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">{t('onboarding.readyToLaunch')}</h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">{t('onboarding.readyToLaunchDesc')}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 max-w-sm mx-auto text-start space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{t('onboarding.setupSummary')}</p>
              {companyName && <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.company')}:</span> {companyName}</p>}
              {propertyName && <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.property')}:</span> {propertyName}</p>}
              <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.channels')}:</span> {[airbnbConnected && 'Airbnb', bookingConnected && 'Booking.com'].filter(Boolean).join(', ') || 'None'}</p>
              {baseRate && <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.pricing')}:</span> {'\u20AC'}{baseRate}/night</p>}
              <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.automations')}:</span> {[autoClean, autoCheckin, autoReview].filter(Boolean).length} active</p>
              <p className="text-xs text-on-surface-variant"><span className="font-medium text-on-surface">{t('onboarding.teamMembers')}:</span> {teamMembers.length} invited</p>
            </div>
            <button
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Rocket className="w-4 h-4" />
              {t('onboarding.goToDashboard')}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('common.back')}
        </button>

        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs text-on-surface-variant hover:text-on-surface transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {t('onboarding.skip')}
            </button>
          )}
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('onboarding.continue')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
