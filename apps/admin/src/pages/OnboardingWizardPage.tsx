import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Users,
  DollarSign,
  Link2,
  ImagePlus,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  SkipForward,
  Rocket,
  Upload,
  Percent,
  Calendar,
  Waves,
  Mountain,
  TreePine,
  Wifi,
  Car,
  Wind,
  UtensilsCrossed,
  Dumbbell,
  Tv,
  ShowerHead,
  Sun,
  Snowflake,
  Plus,
  X,
  Eye,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

type PropertyType = 'VILLA' | 'APARTMENT' | 'STUDIO' | 'HOUSE' | 'PENTHOUSE' | 'BUNGALOW';

interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

interface ChannelConfig {
  enabled: boolean;
  icalUrl: string;
  commission: string;
}

interface SeasonalPricing {
  summerPremium: string;
  winterDiscount: string;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoOwners: OwnerOption[] = [
  { id: 'o1', name: 'Sivan Menahem', email: 'sivan@sivanmanagement.com' },
  { id: 'o2', name: 'Alexandros Papadopoulos', email: 'alex@greekproperties.gr' },
  { id: 'o3', name: 'Maria Katsarakis', email: 'maria@cretanvillas.gr' },
  { id: 'o4', name: 'Nikos Stavrou', email: 'nikos@athensrentals.gr' },
];

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'HOUSE', label: 'House' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'BUNGALOW', label: 'Bungalow' },
];

const amenitiesList = [
  { key: 'pool', label: 'Pool', icon: Waves },
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'parking', label: 'Parking', icon: Car },
  { key: 'ac', label: 'Air Conditioning', icon: Wind },
  { key: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { key: 'gym', label: 'Gym', icon: Dumbbell },
  { key: 'tv', label: 'Smart TV', icon: Tv },
  { key: 'shower', label: 'Rain Shower', icon: ShowerHead },
];

const featuresList = [
  { key: 'seaView', label: 'Sea View', icon: Waves },
  { key: 'mountainView', label: 'Mountain View', icon: Mountain },
  { key: 'garden', label: 'Garden', icon: TreePine },
  { key: 'balcony', label: 'Balcony', icon: Sun },
  { key: 'terrace', label: 'Terrace', icon: Sun },
  { key: 'privatePool', label: 'Private Pool', icon: Waves },
];

const currencies = ['EUR', 'USD', 'GBP', 'ILS'] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function OnboardingWizardPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  // ── Step 1: Property Basics ────────────────────────────────────────────
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('VILLA');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Greece');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(4);
  const [description, setDescription] = useState('');

  // ── Step 2: Owner Assignment ───────────────────────────────────────────
  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [managementFeePercent, setManagementFeePercent] = useState('20');
  const [managementFeeMin, setManagementFeeMin] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  // ── Step 3: Pricing Setup ──────────────────────────────────────────────
  const [nightlyRate, setNightlyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [cleaningFee, setCleaningFee] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [seasonal, setSeasonal] = useState<SeasonalPricing>({
    summerPremium: '20',
    winterDiscount: '15',
  });

  // ── Step 4: Channel Setup ─────────────────────────────────────────────
  const [channels, setChannels] = useState<Record<string, ChannelConfig>>({
    airbnb: { enabled: false, icalUrl: '', commission: '15' },
    booking: { enabled: false, icalUrl: '', commission: '18' },
    vrbo: { enabled: false, icalUrl: '', commission: '12' },
    direct: { enabled: false, icalUrl: '', commission: '0' },
  });

  // ── Step 5: Photos & Amenities ────────────────────────────────────────
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // ── Helpers ────────────────────────────────────────────────────────────

  const progress = (step / TOTAL_STEPS) * 100;

  const toggleChannel = (key: string) => {
    setChannels((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updateChannel = (key: string, field: 'icalUrl' | 'commission', value: string) => {
    setChannels((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const addPhotoPlaceholder = () => {
    setPhotos((prev) => [...prev, `photo-${prev.length + 1}.jpg`]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return propertyName.trim().length > 0;
      case 2:
        return ownerMode === 'existing' ? selectedOwnerId !== '' : newOwnerName.trim().length > 0;
      default:
        return true;
    }
  };

  const handlePublish = () => {
    toast.success('Property published successfully! Redirecting to dashboard...');
  };

  const getOwnerDisplayName = () => {
    if (ownerMode === 'existing') {
      const owner = demoOwners.find((o) => o.id === selectedOwnerId);
      return owner?.name || 'Not selected';
    }
    return newOwnerName || 'Not set';
  };

  const getEnabledChannels = () => {
    return Object.entries(channels)
      .filter(([, c]) => c.enabled)
      .map(([key]) => {
        const names: Record<string, string> = {
          airbnb: 'Airbnb',
          booking: 'Booking.com',
          vrbo: 'VRBO',
          direct: 'Direct Website',
        };
        return names[key];
      });
  };

  const currencySymbol: Record<string, string> = {
    EUR: '\u20AC',
    USD: '$',
    GBP: '\u00A3',
    ILS: '\u20AA',
  };

  const sym = currencySymbol[currency] || currency;

  // ── Step config ────────────────────────────────────────────────────────

  const stepIcons = [Home, Users, DollarSign, Link2, ImagePlus, ClipboardCheck];
  const stepLabels = [
    'Property Basics',
    'Owner',
    'Pricing',
    'Channels',
    'Photos',
    'Review',
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Property Onboarding
        </p>
        <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
          Add New Property
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Complete each step to onboard a new property into the system
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-on-surface-variant">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-xs font-semibold text-secondary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full gradient-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
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
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? 'gradient-accent text-white'
                      : isComplete
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[9px] font-medium hidden sm:block ${
                    isActive ? 'text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow min-h-[400px]">
        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 1: Property Basics                                         */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Property Basics
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Enter the fundamental details of the property
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. Villa Elounda Royale"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
                >
                  {propertyTypes.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Coastal Road"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Elounda"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Greece"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              {/* Bedrooms / Bathrooms / Max Guests */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min={0}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Max Guests
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="A stunning beachfront villa with panoramic sea views..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 2: Owner Assignment                                        */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Owner Assignment
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Assign an owner and configure the management agreement
                </p>
              </div>
            </div>

            {/* Toggle: Existing / New */}
            <div className="flex gap-2">
              <button
                onClick={() => setOwnerMode('existing')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  ownerMode === 'existing'
                    ? 'gradient-accent text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Select Existing Owner
              </button>
              <button
                onClick={() => setOwnerMode('new')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  ownerMode === 'new'
                    ? 'gradient-accent text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create New Owner
              </button>
            </div>

            {ownerMode === 'existing' ? (
              <div className="space-y-2">
                {demoOwners.map((owner) => (
                  <button
                    key={owner.id}
                    onClick={() => setSelectedOwnerId(owner.id)}
                    className={`w-full text-start p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      selectedOwnerId === owner.id
                        ? 'border-secondary bg-secondary/5'
                        : 'border-outline-variant/20 hover:border-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">
                        {owner.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{owner.name}</p>
                        <p className="text-xs text-on-surface-variant">{owner.email}</p>
                      </div>
                    </div>
                    {selectedOwnerId === owner.id && (
                      <Check className="w-5 h-5 text-secondary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
            )}

            {/* Management Fee */}
            <div className="pt-2 border-t border-outline-variant/20">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Management Fee Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Fee Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={managementFeePercent}
                      onChange={(e) => setManagementFeePercent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 pe-10"
                    />
                    <Percent className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Minimum Amount ({sym})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={managementFeeMin}
                    onChange={(e) => setManagementFeeMin(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
            </div>

            {/* Contract Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Contract Start
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={contractStart}
                    onChange={(e) => setContractStart(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <Calendar className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Contract End
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={contractEnd}
                    onChange={(e) => setContractEnd(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <Calendar className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 3: Pricing Setup                                           */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Pricing Setup
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Configure rates, fees, and seasonal adjustments
                </p>
              </div>
            </div>

            {/* Currency */}
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c} ({currencySymbol[c]})
                  </option>
                ))}
              </select>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Nightly Rate
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    {sym}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={nightlyRate}
                    onChange={(e) => setNightlyRate(e.target.value)}
                    placeholder="150"
                    className="w-full ps-8 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">per night</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Weekly Rate
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    {sym}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={weeklyRate}
                    onChange={(e) => setWeeklyRate(e.target.value)}
                    placeholder="900"
                    className="w-full ps-8 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">per week</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Monthly Rate
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    {sym}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    placeholder="3000"
                    className="w-full ps-8 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">per month</p>
              </div>
            </div>

            {/* Fees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Cleaning Fee
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    {sym}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value)}
                    placeholder="65"
                    className="w-full ps-8 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">per stay</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Security Deposit
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                    {sym}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="300"
                    className="w-full ps-8 pe-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">refundable</p>
              </div>
            </div>

            {/* Seasonal Pricing */}
            <div className="pt-2 border-t border-outline-variant/20">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Seasonal Pricing Quick Setup
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-outline-variant/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-on-surface">Summer Premium</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">
                    Increase applied June - September
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={seasonal.summerPremium}
                      onChange={(e) =>
                        setSeasonal((s) => ({ ...s, summerPremium: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 pe-10"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
                      %
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-outline-variant/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Snowflake className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-on-surface">Winter Discount</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">
                    Reduction applied November - March
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={seasonal.winterDiscount}
                      onChange={(e) =>
                        setSeasonal((s) => ({ ...s, winterDiscount: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 pe-10"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 4: Channel Setup                                           */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Channel Setup
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Connect booking channels and configure iCal syncing
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'airbnb', name: 'Airbnb', color: '#FF5A5F', desc: 'Sync listings, calendars, and pricing with Airbnb' },
                { key: 'booking', name: 'Booking.com', color: '#003580', desc: 'Connect your Booking.com property and manage availability' },
                { key: 'vrbo', name: 'VRBO', color: '#3B5998', desc: 'List on VRBO / HomeAway and sync calendars' },
                { key: 'direct', name: 'Direct Website', color: '#6b38d4', desc: 'Accept bookings directly through your own website' },
              ].map((ch) => {
                const config = channels[ch.key];
                return (
                  <div
                    key={ch.key}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      config.enabled
                        ? 'border-secondary bg-secondary/5'
                        : 'border-outline-variant/20'
                    }`}
                  >
                    <button
                      onClick={() => toggleChannel(ch.key)}
                      className="w-full p-4 text-start flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: ch.color }}
                        >
                          {ch.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{ch.name}</p>
                          <p className="text-xs text-on-surface-variant">{ch.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          config.enabled ? 'gradient-accent' : 'bg-surface-container-high'
                        }`}
                      >
                        {config.enabled && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    {config.enabled && (
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                            iCal URL
                          </label>
                          <input
                            type="url"
                            value={config.icalUrl}
                            onChange={(e) => updateChannel(ch.key, 'icalUrl', e.target.value)}
                            placeholder="https://ical.example.com/calendar.ics"
                            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                            Commission Rate
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={config.commission}
                              onChange={(e) =>
                                updateChannel(ch.key, 'commission', e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 pe-8"
                            />
                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 5: Photos & Amenities                                      */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <ImagePlus className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Photos & Amenities
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Upload property photos and select available amenities
                </p>
              </div>
            </div>

            {/* Photo Upload Area */}
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Property Photos
              </p>
              <button
                onClick={addPhotoPlaceholder}
                className="w-full border-2 border-dashed border-outline-variant/30 rounded-xl p-8 text-center hover:border-secondary/50 transition-colors group"
              >
                <Upload className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2 group-hover:text-secondary/60 transition-colors" />
                <p className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Drag & drop photos here or click to browse
                </p>
                <p className="text-xs text-on-surface-variant/60 mt-1">
                  JPG, PNG, WebP up to 10MB each
                </p>
              </button>

              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      className="relative w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center group"
                    >
                      <ImagePlus className="w-6 h-6 text-on-surface-variant/30" />
                      <span className="absolute bottom-1 start-1 text-[9px] text-on-surface-variant">
                        {photo}
                      </span>
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addPhotoPlaceholder}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant/30 flex items-center justify-center hover:border-secondary/50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-on-surface-variant/40" />
                  </button>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="pt-2 border-t border-outline-variant/20">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Amenities
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {amenitiesList.map((am) => {
                  const Icon = am.icon;
                  const selected = selectedAmenities.includes(am.key);
                  return (
                    <button
                      key={am.key}
                      onClick={() => toggleAmenity(am.key)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selected
                          ? 'border-secondary bg-secondary/5'
                          : 'border-outline-variant/20 hover:border-secondary/50'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mx-auto mb-1 ${
                          selected ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          selected ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      >
                        {am.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="pt-2 border-t border-outline-variant/20">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Property Features
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {featuresList.map((ft) => {
                  const Icon = ft.icon;
                  const selected = selectedFeatures.includes(ft.key);
                  return (
                    <button
                      key={ft.key}
                      onClick={() => toggleFeature(ft.key)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        selected
                          ? 'border-secondary bg-secondary/5'
                          : 'border-outline-variant/20 hover:border-secondary/50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          selected ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          selected ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      >
                        {ft.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Step 6: Review & Publish                                        */}
        {/* ──────────────────────────────────────────────────────────────── */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-headline text-lg font-semibold text-on-surface">
                  Review & Publish
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Review all details before publishing the property
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
              {/* Property Basics */}
              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-secondary" />
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Property Basics
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Name:</span> {propertyName || '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Type:</span>{' '}
                    {propertyTypes.find((pt) => pt.value === propertyType)?.label}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Location:</span>{' '}
                    {[address, city, country].filter(Boolean).join(', ') || '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Capacity:</span>{' '}
                    {bedrooms} bed, {bathrooms} bath, {maxGuests} guests
                  </p>
                  {description && (
                    <p className="text-xs text-on-surface-variant col-span-2 line-clamp-2">
                      <span className="font-medium text-on-surface">Description:</span>{' '}
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-success" />
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Owner Assignment
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Owner:</span>{' '}
                    {getOwnerDisplayName()}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Fee:</span>{' '}
                    {managementFeePercent}%
                    {managementFeeMin ? ` (min ${sym}${managementFeeMin})` : ''}
                  </p>
                  {(contractStart || contractEnd) && (
                    <p className="text-xs text-on-surface-variant col-span-2">
                      <span className="font-medium text-on-surface">Contract:</span>{' '}
                      {contractStart || '...'} to {contractEnd || '...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-secondary" />
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Pricing
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Nightly:</span>{' '}
                    {nightlyRate ? `${sym}${nightlyRate}` : '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Weekly:</span>{' '}
                    {weeklyRate ? `${sym}${weeklyRate}` : '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Monthly:</span>{' '}
                    {monthlyRate ? `${sym}${monthlyRate}` : '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Cleaning:</span>{' '}
                    {cleaningFee ? `${sym}${cleaningFee}` : '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Deposit:</span>{' '}
                    {securityDeposit ? `${sym}${securityDeposit}` : '-'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Currency:</span> {currency}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Summer:</span>{' '}
                    +{seasonal.summerPremium || 0}%
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Winter:</span>{' '}
                    -{seasonal.winterDiscount || 0}%
                  </p>
                </div>
              </div>

              {/* Channels */}
              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-warning" />
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Channels
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                {getEnabledChannels().length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(channels)
                      .filter(([, c]) => c.enabled)
                      .map(([key, config]) => {
                        const names: Record<string, string> = {
                          airbnb: 'Airbnb',
                          booking: 'Booking.com',
                          vrbo: 'VRBO',
                          direct: 'Direct Website',
                        };
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-xs font-medium text-secondary"
                          >
                            <Building2 className="w-3 h-3" />
                            {names[key]} ({config.commission}%)
                          </span>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant">No channels connected</p>
                )}
              </div>

              {/* Photos & Amenities */}
              <div className="p-4 rounded-xl bg-surface-container-low">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-secondary" />
                    <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Photos & Amenities
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(5)}
                    className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Photos:</span>{' '}
                    {photos.length > 0 ? `${photos.length} uploaded` : 'None'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Amenities:</span>{' '}
                    {selectedAmenities.length > 0
                      ? selectedAmenities
                          .map((k) => amenitiesList.find((a) => a.key === k)?.label)
                          .join(', ')
                      : 'None selected'}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    <span className="font-medium text-on-surface">Features:</span>{' '}
                    {selectedFeatures.length > 0
                      ? selectedFeatures
                          .map((k) => featuresList.find((f) => f.key === k)?.label)
                          .join(', ')
                      : 'None selected'}
                  </p>
                </div>
              </div>
            </div>

            {/* Publish Button */}
            <div className="text-center pt-2">
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Rocket className="w-4 h-4" />
                Publish Property
              </button>
              <p className="text-xs text-on-surface-variant mt-2">
                You can always edit the property details later
              </p>
            </div>
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
          Back
        </button>

        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs text-on-surface-variant hover:text-on-surface transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          )}
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
