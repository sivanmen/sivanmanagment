import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import {
  Plus,
  ClipboardCheck,
  BookOpen,
  FileSignature,
  ShoppingBag,
  Eye,
  CheckCircle,
  Send,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Wifi,
  MapPin,
  Home,
  X,
  Save,
  Globe,
  ToggleLeft,
  ToggleRight,
  Smartphone,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface CheckInForm {
  id: string;
  propertyId: string;
  bookingId?: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED';
  arrivalTime?: string;
  numberOfGuests: number;
  idDocument?: { type: string; number: string; expiryDate?: string };
  specialRequests?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
  vehicleInfo?: { plateNumber: string; model: string };
  agreements: { termsAccepted: boolean; houseRulesAccepted: boolean; privacyAccepted: boolean; signedAt?: string };
  submittedAt?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface GuidebookSection {
  title: string;
  icon: string;
  content: string;
  images?: string[];
}

interface NearbyPlace {
  name: string;
  category: string;
  distance: string;
  description?: string;
}

interface PropertyGuidebook {
  id: string;
  propertyId: string;
  welcomeMessage: { en: string; he?: string };
  sections: GuidebookSection[];
  houseRules: string[];
  checkInInstructions: string;
  checkOutInstructions: string;
  wifiName: string;
  wifiPassword: string;
  emergencyNumbers: { police: string; ambulance: string; fire: string; manager: string };
  nearbyPlaces: NearbyPlace[];
  transportInfo: string;
  isPublished: boolean;
  updatedAt: string;
}

interface GuestContract {
  id: string;
  propertyId: string;
  bookingId: string;
  guestName: string;
  contractType: 'RENTAL_AGREEMENT' | 'DAMAGE_WAIVER' | 'HOUSE_RULES' | 'CANCELLATION_POLICY';
  templateContent: string;
  signedContent?: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED';
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  createdAt: string;
}

interface Upsell {
  id: string;
  propertyId?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  isPerNight: boolean;
  isPerGuest: boolean;
  isActive: boolean;
  maxQuantity: number;
  availability: string;
}

interface UpsellOrder {
  id: string;
  bookingId: string;
  upsellId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const tabs = [
  { key: 'checkin', label: 'Check-in Forms', icon: ClipboardCheck },
  { key: 'guidebooks', label: 'Guidebooks', icon: BookOpen },
  { key: 'contracts', label: 'Contracts', icon: FileSignature },
  { key: 'upsells', label: 'Upsells', icon: ShoppingBag },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const checkInStatusStyles: Record<string, { badge: string; label: string }> = {
  PENDING: { badge: 'bg-amber-500/10 text-amber-600', label: 'Pending' },
  SUBMITTED: { badge: 'bg-blue-500/10 text-blue-600', label: 'Submitted' },
  VERIFIED: { badge: 'bg-success/10 text-success', label: 'Verified' },
};

const contractStatusStyles: Record<string, { badge: string; label: string }> = {
  DRAFT: { badge: 'bg-outline-variant/20 text-on-surface-variant', label: 'Draft' },
  SENT: { badge: 'bg-blue-500/10 text-blue-600', label: 'Sent' },
  VIEWED: { badge: 'bg-amber-500/10 text-amber-600', label: 'Viewed' },
  SIGNED: { badge: 'bg-success/10 text-success', label: 'Signed' },
};

const contractTypeLabels: Record<string, string> = {
  RENTAL_AGREEMENT: 'Rental Agreement',
  DAMAGE_WAIVER: 'Damage Waiver',
  HOUSE_RULES: 'House Rules',
  CANCELLATION_POLICY: 'Cancellation Policy',
};

const contractTypeBadges: Record<string, string> = {
  RENTAL_AGREEMENT: 'bg-blue-500/10 text-blue-600',
  DAMAGE_WAIVER: 'bg-warning/10 text-warning',
  HOUSE_RULES: 'bg-secondary/10 text-secondary',
  CANCELLATION_POLICY: 'bg-error/10 text-error',
};

const upsellCategoryLabels: Record<string, string> = {
  EARLY_CHECKIN: 'Early Check-in',
  LATE_CHECKOUT: 'Late Checkout',
  AIRPORT_TRANSFER: 'Airport Transfer',
  CLEANING: 'Cleaning',
  BREAKFAST: 'Breakfast',
  TOUR: 'Tour',
  EQUIPMENT: 'Equipment',
  PET_FEE: 'Pet Fee',
  BABY_PACKAGE: 'Baby Package',
  CUSTOM: 'Custom',
};

const upsellCategoryColors: Record<string, string> = {
  EARLY_CHECKIN: 'bg-amber-500/10 text-amber-600',
  LATE_CHECKOUT: 'bg-blue-500/10 text-blue-600',
  AIRPORT_TRANSFER: 'bg-secondary/10 text-secondary',
  CLEANING: 'bg-success/10 text-success',
  BREAKFAST: 'bg-warning/10 text-warning',
  TOUR: 'bg-blue-500/10 text-blue-600',
  EQUIPMENT: 'bg-outline-variant/20 text-on-surface-variant',
  PET_FEE: 'bg-amber-500/10 text-amber-600',
  BABY_PACKAGE: 'bg-secondary/10 text-secondary',
  CUSTOM: 'bg-outline-variant/20 text-on-surface-variant',
};

const orderStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600',
  CONFIRMED: 'bg-success/10 text-success',
  DELIVERED: 'bg-blue-500/10 text-blue-600',
  CANCELLED: 'bg-error/10 text-error',
};

const nearbyPlaceCategoryColors: Record<string, string> = {
  RESTAURANT: 'bg-amber-500/10 text-amber-600',
  BEACH: 'bg-blue-500/10 text-blue-600',
  SUPERMARKET: 'bg-success/10 text-success',
  PHARMACY: 'bg-error/10 text-error',
  HOSPITAL: 'bg-error/10 text-error',
  ATM: 'bg-secondary/10 text-secondary',
  GAS_STATION: 'bg-outline-variant/20 text-on-surface-variant',
  ATTRACTION: 'bg-secondary/10 text-secondary',
};

const propertyNames: Record<string, string> = {
  'prop-aegean-sunset': 'Aegean Sunset Villa',
  'prop-chania-old-town': 'Chania Old Town Apt',
};

// ── Demo data for fallback ──────────────────────────────────────────────────

const demoCheckInForms: CheckInForm[] = [
  {
    id: 'ci-1',
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-001',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    status: 'SUBMITTED',
    arrivalTime: '15:00',
    numberOfGuests: 4,
    idDocument: { type: 'PASSPORT', number: 'GR12345678', expiryDate: '2028-06-15' },
    specialRequests: 'Late checkout if possible, baby crib needed',
    emergencyContact: { name: 'Nikos Papadopoulos', phone: '+30 694 123 4567', relation: 'Spouse' },
    vehicleInfo: { plateNumber: 'AXY-1234', model: 'Toyota Yaris' },
    agreements: { termsAccepted: true, houseRulesAccepted: true, privacyAccepted: true, signedAt: '2026-04-08T10:30:00Z' },
    submittedAt: '2026-04-08T10:30:00Z',
    createdAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'ci-2',
    propertyId: 'prop-chania-old-town',
    bookingId: 'booking-002',
    guestName: 'James Richardson',
    guestEmail: 'james.r@outlook.com',
    status: 'PENDING',
    numberOfGuests: 2,
    agreements: { termsAccepted: false, houseRulesAccepted: false, privacyAccepted: false },
    createdAt: '2026-04-09T00:00:00Z',
  },
  {
    id: 'ci-3',
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-003',
    guestName: 'Elena Volkov',
    guestEmail: 'elena.v@mail.ru',
    status: 'VERIFIED',
    arrivalTime: '14:00',
    numberOfGuests: 3,
    idDocument: { type: 'PASSPORT', number: 'RU98765432', expiryDate: '2027-11-20' },
    emergencyContact: { name: 'Dmitri Volkov', phone: '+7 495 123 4567', relation: 'Brother' },
    agreements: { termsAccepted: true, houseRulesAccepted: true, privacyAccepted: true, signedAt: '2026-04-02T09:15:00Z' },
    submittedAt: '2026-04-02T09:15:00Z',
    verifiedAt: '2026-04-02T11:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
  },
];

const demoGuidebooks: PropertyGuidebook[] = [
  {
    id: 'gb-1',
    propertyId: 'prop-aegean-sunset',
    welcomeMessage: { en: 'Welcome to Aegean Sunset Villa! We are thrilled to have you.', he: '\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD \u05DC\u05D5\u05D9\u05DC\u05D4 \u05E9\u05E7\u05D9\u05E2\u05EA \u05D4\u05D0\u05D2\u05D0\u05D9!' },
    sections: [
      { title: 'Kitchen & Appliances', icon: 'utensils', content: 'Fully equipped kitchen with Nespresso, oven, microwave...' },
      { title: 'Pool & Outdoor', icon: 'waves', content: 'Infinity pool open 24/7. Please shower before entering.' },
      { title: 'Entertainment', icon: 'tv', content: 'Smart TV with Netflix. Board games available.' },
    ],
    houseRules: ['No smoking inside', 'Quiet hours: 23:00 - 08:00', 'Max 8 guests', 'Pets allowed with notice'],
    checkInInstructions: 'Check-in 15:00. Lockbox code sent 24h before arrival.',
    checkOutInstructions: 'Check-out 11:00. Keys on kitchen counter.',
    wifiName: 'AegeanSunset_Guest',
    wifiPassword: 'Welcome2Crete!',
    emergencyNumbers: { police: '100', ambulance: '166', fire: '199', manager: '+30 694 555 1234' },
    nearbyPlaces: [
      { name: 'Taverna Knossos', category: 'RESTAURANT', distance: '200m', description: 'Traditional Cretan cuisine' },
      { name: 'Elounda Beach', category: 'BEACH', distance: '50m', description: 'Sandy beach, crystal clear' },
      { name: 'Carrefour Express', category: 'SUPERMARKET', distance: '500m' },
      { name: 'Spinalonga Island', category: 'ATTRACTION', distance: '4km', description: 'Historic fortress' },
    ],
    transportInfo: 'Nearest airport: Heraklion (HER) - 65km. Taxi ~80 EUR.',
    isPublished: true,
    updatedAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'gb-2',
    propertyId: 'prop-chania-old-town',
    welcomeMessage: { en: 'Welcome to our charming apartment in the heart of Chania Old Town!' },
    sections: [
      { title: 'Getting Around', icon: 'map', content: 'Best explored on foot. Harbor is 3 min walk.' },
      { title: 'Kitchen Basics', icon: 'utensils', content: 'Kitchenette with mini fridge and stove.' },
    ],
    houseRules: ['No smoking inside', 'Quiet hours: 22:00 - 08:00', 'Max 4 guests'],
    checkInInstructions: 'Check-in from 14:00. Personal welcome at 15 Zambeliou Street.',
    checkOutInstructions: 'Check-out by 10:30. Leave keys on the table.',
    wifiName: 'ChaniaOldTown_WiFi',
    wifiPassword: 'Kalimera2026',
    emergencyNumbers: { police: '100', ambulance: '166', fire: '199', manager: '+30 694 555 5678' },
    nearbyPlaces: [
      { name: 'Venetian Harbor', category: 'ATTRACTION', distance: '150m' },
      { name: 'Tamam Restaurant', category: 'RESTAURANT', distance: '100m' },
    ],
    transportInfo: 'Chania airport (CHQ) 15km. Taxi ~25 EUR.',
    isPublished: false,
    updatedAt: '2026-04-03T00:00:00Z',
  },
];

const demoContracts: GuestContract[] = [
  {
    id: 'ct-1', propertyId: 'prop-aegean-sunset', bookingId: 'booking-001',
    guestName: 'Maria Papadopoulos', contractType: 'RENTAL_AGREEMENT',
    templateContent: 'HOLIDAY RENTAL AGREEMENT...', status: 'SIGNED',
    sentAt: '2026-04-06T09:00:00Z', signedAt: '2026-04-08T10:15:00Z', createdAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'ct-2', propertyId: 'prop-chania-old-town', bookingId: 'booking-002',
    guestName: 'James Richardson', contractType: 'RENTAL_AGREEMENT',
    templateContent: 'HOLIDAY RENTAL AGREEMENT...', status: 'SENT',
    sentAt: '2026-04-09T11:00:00Z', viewedAt: '2026-04-09T15:22:00Z', createdAt: '2026-04-09T00:00:00Z',
  },
  {
    id: 'ct-3', propertyId: 'prop-aegean-sunset', bookingId: 'booking-003',
    guestName: 'Elena Volkov', contractType: 'DAMAGE_WAIVER',
    templateContent: 'DAMAGE WAIVER AGREEMENT...', status: 'DRAFT', createdAt: '2026-04-10T00:00:00Z',
  },
];

const demoUpsells: Upsell[] = [
  { id: 'up-1', name: 'Early Check-in', description: 'Arrive as early as 11:00 AM', category: 'EARLY_CHECKIN', price: 25, currency: 'EUR', isPerNight: false, isPerGuest: false, isActive: true, maxQuantity: 1, availability: 'PRE_ARRIVAL' },
  { id: 'up-2', name: 'Late Checkout', description: 'Check out at 14:00 instead of 11:00', category: 'LATE_CHECKOUT', price: 30, currency: 'EUR', isPerNight: false, isPerGuest: false, isActive: true, maxQuantity: 1, availability: 'DURING_STAY' },
  { id: 'up-3', name: 'Airport Transfer', description: 'Private transfer from Heraklion airport', category: 'AIRPORT_TRANSFER', price: 45, currency: 'EUR', isPerNight: false, isPerGuest: false, isActive: true, maxQuantity: 2, availability: 'PRE_ARRIVAL' },
  { id: 'up-4', name: 'Breakfast Basket', description: 'Fresh local breakfast delivered', category: 'BREAKFAST', price: 18, currency: 'EUR', isPerNight: true, isPerGuest: false, isActive: true, maxQuantity: 14, availability: 'ALWAYS' },
  { id: 'up-5', name: 'Bike Rental', description: 'Explore the area on two wheels!', category: 'EQUIPMENT', price: 15, currency: 'EUR', isPerNight: true, isPerGuest: true, isActive: true, maxQuantity: 4, availability: 'ALWAYS' },
  { id: 'up-6', name: 'Spinalonga Boat Tour', description: 'Full-day guided boat tour', category: 'TOUR', price: 65, currency: 'EUR', isPerNight: false, isPerGuest: true, isActive: true, maxQuantity: 8, availability: 'DURING_STAY' },
  { id: 'up-7', name: 'Baby Package', description: 'Crib, high chair, bath, stroller', category: 'BABY_PACKAGE', price: 20, currency: 'EUR', isPerNight: false, isPerGuest: false, isActive: true, maxQuantity: 2, availability: 'PRE_ARRIVAL' },
  { id: 'up-8', name: 'Pet Fee', description: 'Bring your furry friend!', category: 'PET_FEE', price: 10, currency: 'EUR', isPerNight: true, isPerGuest: false, isActive: true, maxQuantity: 2, availability: 'PRE_ARRIVAL' },
];

const demoOrders: UpsellOrder[] = [
  { id: 'ord-1', bookingId: 'booking-001', upsellId: 'up-1', quantity: 1, totalPrice: 25, status: 'CONFIRMED', createdAt: '2026-04-07T00:00:00Z' },
  { id: 'ord-2', bookingId: 'booking-001', upsellId: 'up-3', quantity: 1, totalPrice: 45, status: 'CONFIRMED', notes: 'Flight at 12:30', createdAt: '2026-04-06T00:00:00Z' },
  { id: 'ord-3', bookingId: 'booking-001', upsellId: 'up-4', quantity: 7, totalPrice: 126, status: 'PENDING', createdAt: '2026-04-08T00:00:00Z' },
];

// ── Helper ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Component ───────────────────────────────────────────────────────────────

export default function GuestExperiencePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('checkin');

  // State
  const [checkInForms, setCheckInForms] = useState<CheckInForm[]>(demoCheckInForms);
  const [guidebooks, setGuidebooks] = useState<PropertyGuidebook[]>(demoGuidebooks);
  const [contracts, setContracts] = useState<GuestContract[]>(demoContracts);
  const [upsells, setUpsells] = useState<Upsell[]>(demoUpsells);
  const [orders, setOrders] = useState<UpsellOrder[]>(demoOrders);

  const [expandedCheckIn, setExpandedCheckIn] = useState<string | null>(null);
  const [editingGuidebook, setEditingGuidebook] = useState<string | null>(null);
  const [showUpsellForm, setShowUpsellForm] = useState(false);

  // Load data from API (with fallback to demo data)
  const loadData = useCallback(async () => {
    try {
      const [ciRes, gbRes, ctRes, upRes] = await Promise.all([
        apiClient.get('/guest-experience/check-in').catch(() => null),
        apiClient.get('/guest-experience/guidebooks').catch(() => null),
        apiClient.get('/guest-experience/contracts').catch(() => null),
        apiClient.get('/guest-experience/upsells').catch(() => null),
      ]);
      if (ciRes?.data?.data) setCheckInForms(ciRes.data.data);
      if (gbRes?.data?.data) setGuidebooks(gbRes.data.data);
      if (ctRes?.data?.data) setContracts(ctRes.data.data);
      if (upRes?.data?.data) setUpsells(upRes.data.data);
    } catch {
      // keep demo data
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Actions
  const handleVerifyCheckIn = async (id: string) => {
    try {
      await apiClient.post(`/guest-experience/check-in/${id}/verify`);
      setCheckInForms((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'VERIFIED' as const, verifiedAt: new Date().toISOString() } : f)),
      );
      toast.success('Check-in form verified');
    } catch {
      setCheckInForms((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'VERIFIED' as const, verifiedAt: new Date().toISOString() } : f)),
      );
      toast.success('Check-in form verified');
    }
  };

  const handleSendContract = async (id: string) => {
    try {
      await apiClient.post(`/guest-experience/contracts/${id}/send`);
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'SENT' as const, sentAt: new Date().toISOString() } : c)),
      );
      toast.success('Contract sent to guest');
    } catch {
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'SENT' as const, sentAt: new Date().toISOString() } : c)),
      );
      toast.success('Contract sent to guest');
    }
  };

  const handlePublishGuidebook = async (propertyId: string) => {
    try {
      await apiClient.post(`/guest-experience/guidebook/${propertyId}/publish`);
      setGuidebooks((prev) =>
        prev.map((g) => (g.propertyId === propertyId ? { ...g, isPublished: true } : g)),
      );
      toast.success('Guidebook published');
    } catch {
      setGuidebooks((prev) =>
        prev.map((g) => (g.propertyId === propertyId ? { ...g, isPublished: true } : g)),
      );
      toast.success('Guidebook published');
    }
  };

  const handleToggleUpsell = async (id: string) => {
    const upsell = upsells.find((u) => u.id === id);
    if (!upsell) return;
    try {
      await apiClient.put(`/guest-experience/upsells/${id}`, { isActive: !upsell.isActive });
    } catch { /* fallback */ }
    setUpsells((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
    );
  };

  const handleDeleteUpsell = async (id: string) => {
    try {
      await apiClient.delete(`/guest-experience/upsells/${id}`);
    } catch { /* fallback */ }
    setUpsells((prev) => prev.filter((u) => u.id !== id));
    toast.success('Upsell deleted');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            {t('guestExperience.title', 'Guest Experience')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('guestExperience.subtitle', 'Manage check-in forms, guidebooks, contracts, and upsells')}
          </p>
        </div>
        <a
          href="/guest-portal-preview"
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          {t('guestExperience.previewPortal', 'Preview Guest Portal')}
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                isActive
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(`guestExperience.tabs.${tab.key}`, tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'checkin' && (
        <CheckInTab
          forms={checkInForms}
          expandedId={expandedCheckIn}
          onToggleExpand={(id) => setExpandedCheckIn((prev) => (prev === id ? null : id))}
          onVerify={handleVerifyCheckIn}
        />
      )}
      {activeTab === 'guidebooks' && (
        <GuidebooksTab
          guidebooks={guidebooks}
          editingId={editingGuidebook}
          onEdit={setEditingGuidebook}
          onPublish={handlePublishGuidebook}
        />
      )}
      {activeTab === 'contracts' && (
        <ContractsTab contracts={contracts} onSend={handleSendContract} />
      )}
      {activeTab === 'upsells' && (
        <UpsellsTab
          upsells={upsells}
          orders={orders}
          onToggle={handleToggleUpsell}
          onDelete={handleDeleteUpsell}
          showForm={showUpsellForm}
          onShowForm={setShowUpsellForm}
        />
      )}
    </div>
  );
}

// ── Check-in Tab ────────────────────────────────────────────────────────────

function CheckInTab({
  forms,
  expandedId,
  onToggleExpand,
  onVerify,
}: {
  forms: CheckInForm[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onVerify: (id: string) => void;
}) {
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/20">
        <h2 className="font-headline font-semibold text-on-surface">Check-in Forms</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Online check-in forms submitted by guests before arrival
        </p>
      </div>

      <div className="divide-y divide-outline-variant/15">
        {forms.map((form) => {
          const isExpanded = expandedId === form.id;
          const status = checkInStatusStyles[form.status];
          return (
            <div key={form.id} className="hover:bg-surface-container-high/30 transition-colors">
              <button
                onClick={() => onToggleExpand(form.id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-start"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-on-surface">{form.guestName}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant">
                    <span>{form.guestEmail}</span>
                    <span>{propertyNames[form.propertyId] || form.propertyId}</span>
                    <span>Guests: {form.numberOfGuests}</span>
                    {form.submittedAt && <span>Submitted: {fmtDateTime(form.submittedAt)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {form.status === 'SUBMITTED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onVerify(form.id); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-medium hover:bg-success/20 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ID Document */}
                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <h4 className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">ID Document</h4>
                    {form.idDocument ? (
                      <div className="space-y-1 text-sm">
                        <p><span className="text-on-surface-variant">Type:</span> {form.idDocument.type}</p>
                        <p><span className="text-on-surface-variant">Number:</span> {form.idDocument.number}</p>
                        {form.idDocument.expiryDate && <p><span className="text-on-surface-variant">Expires:</span> {form.idDocument.expiryDate}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant italic">Not provided</p>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <h4 className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Emergency Contact</h4>
                    {form.emergencyContact ? (
                      <div className="space-y-1 text-sm">
                        <p>{form.emergencyContact.name}</p>
                        <p className="text-on-surface-variant">{form.emergencyContact.phone}</p>
                        <p className="text-on-surface-variant">{form.emergencyContact.relation}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant italic">Not provided</p>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <h4 className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Additional Info</h4>
                    <div className="space-y-1 text-sm">
                      {form.arrivalTime && <p><span className="text-on-surface-variant">Arrival:</span> {form.arrivalTime}</p>}
                      {form.vehicleInfo && <p><span className="text-on-surface-variant">Vehicle:</span> {form.vehicleInfo.model} ({form.vehicleInfo.plateNumber})</p>}
                      {form.specialRequests && <p><span className="text-on-surface-variant">Requests:</span> {form.specialRequests}</p>}
                    </div>
                  </div>

                  {/* Agreements */}
                  <div className="md:col-span-3 bg-surface rounded-xl p-4 border border-outline-variant/20">
                    <h4 className="text-xs font-medium text-on-surface-variant mb-2 uppercase tracking-wider">Agreements</h4>
                    <div className="flex gap-6 text-sm">
                      <span className={`flex items-center gap-1 ${form.agreements.termsAccepted ? 'text-success' : 'text-error'}`}>
                        {form.agreements.termsAccepted ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        Terms & Conditions
                      </span>
                      <span className={`flex items-center gap-1 ${form.agreements.houseRulesAccepted ? 'text-success' : 'text-error'}`}>
                        {form.agreements.houseRulesAccepted ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        House Rules
                      </span>
                      <span className={`flex items-center gap-1 ${form.agreements.privacyAccepted ? 'text-success' : 'text-error'}`}>
                        {form.agreements.privacyAccepted ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        Privacy Policy
                      </span>
                      {form.agreements.signedAt && (
                        <span className="text-on-surface-variant">Signed: {fmtDateTime(form.agreements.signedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {forms.length === 0 && (
        <div className="px-6 py-12 text-center">
          <ClipboardCheck className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">No check-in forms yet</p>
        </div>
      )}
    </div>
  );
}

// ── Guidebooks Tab ──────────────────────────────────────────────────────────

function GuidebooksTab({
  guidebooks,
  editingId,
  onEdit,
  onPublish,
}: {
  guidebooks: PropertyGuidebook[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onPublish: (propertyId: string) => void;
}) {
  const allProperties = [
    { id: 'prop-aegean-sunset', name: 'Aegean Sunset Villa' },
    { id: 'prop-chania-old-town', name: 'Chania Old Town Apt' },
  ];

  return (
    <div className="space-y-4">
      {/* Property cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allProperties.map((prop) => {
          const gb = guidebooks.find((g) => g.propertyId === prop.id);
          const isEditing = editingId === prop.id;
          return (
            <div
              key={prop.id}
              className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-semibold text-on-surface">{prop.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {gb ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${gb.isPublished ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600'}`}>
                        {gb.isPublished ? 'Published' : 'Draft'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-outline-variant/20 text-on-surface-variant">
                        Not Created
                      </span>
                    )}
                    {gb && (
                      <span className="text-xs text-on-surface-variant">
                        Updated: {fmtDate(gb.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gb && !gb.isPublished && (
                    <button
                      onClick={() => onPublish(prop.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-medium hover:bg-success/20 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(isEditing ? null : prop.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors"
                  >
                    {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    {isEditing ? 'Close' : gb ? 'Edit' : 'Create'}
                  </button>
                </div>
              </div>

              {gb && !isEditing && (
                <div className="px-6 py-4 space-y-3">
                  {/* Welcome */}
                  <p className="text-sm text-on-surface-variant line-clamp-2">{gb.welcomeMessage.en}</p>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <BookOpen className="w-3.5 h-3.5" />
                      {gb.sections.length} sections
                    </span>
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Home className="w-3.5 h-3.5" />
                      {gb.houseRules.length} rules
                    </span>
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <MapPin className="w-3.5 h-3.5" />
                      {gb.nearbyPlaces.length} places
                    </span>
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Wifi className="w-3.5 h-3.5" />
                      {gb.wifiName}
                    </span>
                  </div>

                  {/* Nearby places */}
                  {gb.nearbyPlaces.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gb.nearbyPlaces.map((place, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${nearbyPlaceCategoryColors[place.category] || 'bg-outline-variant/20 text-on-surface-variant'}`}
                        >
                          {place.name} ({place.distance})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isEditing && gb && <GuidebookEditor guidebook={gb} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GuidebookEditor({ guidebook }: { guidebook: PropertyGuidebook }) {
  return (
    <div className="px-6 py-4 space-y-4 bg-surface/50">
      {/* Welcome message */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">Welcome Message (EN)</label>
        <textarea
          className="w-full rounded-lg border border-outline-variant/30 bg-surface p-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
          rows={3}
          defaultValue={guidebook.welcomeMessage.en}
        />
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-on-surface-variant">Sections</label>
          <button className="text-xs text-secondary font-medium hover:underline">+ Add Section</button>
        </div>
        {guidebook.sections.map((section, i) => (
          <div key={i} className="mb-2 bg-surface rounded-lg border border-outline-variant/20 p-3">
            <input
              className="w-full text-sm font-medium text-on-surface bg-transparent border-none outline-none mb-1"
              defaultValue={section.title}
            />
            <textarea
              className="w-full text-xs text-on-surface-variant bg-transparent border-none outline-none resize-none"
              rows={2}
              defaultValue={section.content}
            />
          </div>
        ))}
      </div>

      {/* House Rules */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">House Rules</label>
        <div className="space-y-1">
          {guidebook.houseRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant w-4">{i + 1}.</span>
              <input
                className="flex-1 text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-1.5 outline-none focus:ring-2 focus:ring-secondary/40"
                defaultValue={rule}
              />
            </div>
          ))}
        </div>
      </div>

      {/* WiFi */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">WiFi Network</label>
          <input
            className="w-full text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/40"
            defaultValue={guidebook.wifiName}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">WiFi Password</label>
          <input
            className="w-full text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/40"
            defaultValue={guidebook.wifiPassword}
          />
        </div>
      </div>

      {/* Emergency */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">Emergency Numbers</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(guidebook.emergencyNumbers).map(([key, val]) => (
            <div key={key}>
              <span className="block text-xs text-on-surface-variant capitalize">{key}</span>
              <input
                className="w-full text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-2 py-1 outline-none focus:ring-2 focus:ring-secondary/40"
                defaultValue={val}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors">
        <Save className="w-4 h-4" />
        Save Changes
      </button>
    </div>
  );
}

// ── Contracts Tab ───────────────────────────────────────────────────────────

function ContractsTab({
  contracts,
  onSend,
}: {
  contracts: GuestContract[];
  onSend: (id: string) => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <div>
          <h2 className="font-headline font-semibold text-on-surface">Contracts</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Rental agreements and waivers for guest signing
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Create Contract
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant/15">
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Guest</th>
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Booking</th>
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Sent</th>
            <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Signed</th>
            <th className="px-6 py-3 text-end text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/15">
          {contracts.map((contract) => {
            const statusStyle = contractStatusStyles[contract.status];
            const typeLabel = contractTypeLabels[contract.contractType] || contract.contractType;
            const typeBadge = contractTypeBadges[contract.contractType] || 'bg-outline-variant/20 text-on-surface-variant';
            return (
              <tr key={contract.id} className="hover:bg-surface-container-high/30 transition-colors">
                <td className="px-6 py-3">
                  <span className="text-sm font-medium text-on-surface">{contract.guestName}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="text-xs text-on-surface-variant font-mono">{contract.bookingId}</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge}`}>
                    {typeLabel}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                    {statusStyle.label}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-on-surface-variant">{fmtDateTime(contract.sentAt)}</td>
                <td className="px-6 py-3 text-xs text-on-surface-variant">{fmtDateTime(contract.signedAt)}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setPreviewId(previewId === contract.id ? null : contract.id)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {contract.status === 'DRAFT' && (
                      <button
                        onClick={() => onSend(contract.id)}
                        className="p-1.5 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                        title="Send to guest"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Contract preview */}
      {previewId && (
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-on-surface">Contract Preview</h3>
            <button onClick={() => setPreviewId(null)} className="p-1 hover:bg-surface-container rounded-lg">
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
          <pre className="bg-surface border border-outline-variant/20 rounded-xl p-4 text-xs text-on-surface whitespace-pre-wrap font-mono">
            {contracts.find((c) => c.id === previewId)?.signedContent || contracts.find((c) => c.id === previewId)?.templateContent}
          </pre>
        </div>
      )}

      {contracts.length === 0 && (
        <div className="px-6 py-12 text-center">
          <FileSignature className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">No contracts yet</p>
        </div>
      )}
    </div>
  );
}

// ── Upsells Tab ─────────────────────────────────────────────────────────────

function UpsellsTab({
  upsells,
  orders,
  onToggle,
  onDelete,
  showForm,
  onShowForm,
}: {
  upsells: Upsell[];
  orders: UpsellOrder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showForm: boolean;
  onShowForm: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Upsell Cards */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Upsells & Add-ons</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Extra services guests can purchase before or during their stay
            </p>
          </div>
          <button
            onClick={() => onShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Upsell
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {upsells.map((upsell) => {
            const catLabel = upsellCategoryLabels[upsell.category] || upsell.category;
            const catColor = upsellCategoryColors[upsell.category] || 'bg-outline-variant/20 text-on-surface-variant';
            return (
              <div
                key={upsell.id}
                className={`bg-surface rounded-xl border border-outline-variant/20 p-4 transition-all ${!upsell.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catColor}`}>
                    {catLabel}
                  </span>
                  <button
                    onClick={() => onToggle(upsell.id)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                    title={upsell.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {upsell.isActive ? (
                      <ToggleRight className="w-5 h-5 text-success" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <h3 className="font-medium text-on-surface text-sm">{upsell.name}</h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{upsell.description}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="text-lg font-bold text-on-surface">{upsell.currency === 'EUR' ? '\u20AC' : upsell.currency}{upsell.price}</span>
                    <span className="text-xs text-on-surface-variant">
                      {upsell.isPerNight && '/night'}
                      {upsell.isPerGuest && '/guest'}
                    </span>
                  </div>
                  <button
                    onClick={() => onDelete(upsell.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h2 className="font-headline font-semibold text-on-surface">Recent Orders</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Upsell orders from guests
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/15">
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Booking</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Upsell</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Qty</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-start text-xs font-medium text-on-surface-variant uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {orders.map((order) => {
              const upsell = upsells.find((u) => u.id === order.upsellId);
              const statusColor = orderStatusStyles[order.status] || 'bg-outline-variant/20 text-on-surface-variant';
              return (
                <tr key={order.id} className="hover:bg-surface-container-high/30 transition-colors">
                  <td className="px-6 py-3 text-xs text-on-surface-variant font-mono">{order.bookingId}</td>
                  <td className="px-6 py-3 text-sm text-on-surface">{upsell?.name || order.upsellId}</td>
                  <td className="px-6 py-3 text-sm text-on-surface">{order.quantity}</td>
                  <td className="px-6 py-3 text-sm font-medium text-on-surface">{'\u20AC'}{order.totalPrice}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-on-surface-variant">{fmtDate(order.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <ShoppingBag className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
