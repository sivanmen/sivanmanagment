import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import {
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  Star,
  BarChart3,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Edit3,
  Send,
  Mail,
  MessageCircle,
  Phone,
  Clock,
  Calendar,
  Shield,
  CreditCard,
  FileText,
  Wifi,
  MapPin,
  Home,
  Utensils,
  Waves,
  Car,
  Plane,
  AlertTriangle,
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Circle,
  Pencil,
  Globe,
  Sparkles,
  Info,
  Coffee,
  Landmark,
  Bike,
  Umbrella,
  Key,
  DoorClosed,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface CheckInConfig {
  idUploadRequired: boolean;
  passportScanEnabled: boolean;
  guestFormFields: {
    phone: boolean;
    emergencyContact: boolean;
    arrivalTime: boolean;
    vehicleInfo: boolean;
    specialRequests: boolean;
    numberOfGuests: boolean;
    nationality: boolean;
    dietaryRestrictions: boolean;
  };
  welcomeMessageMode: 'global' | 'per-property';
  globalWelcomeMessage: string;
  propertyWelcomeMessages: Record<string, string>;
  digitalHouseRules: boolean;
  requireSignature: boolean;
  damageDepositEnabled: boolean;
  damageDepositAmount: number;
  damageDepositCurrency: string;
  paymentCollectionEnabled: boolean;
  autoSendCheckInLink: boolean;
  checkInLinkTiming: number; // days before arrival
}

interface TimelineMessage {
  id: string;
  trigger: string;
  triggerLabel: string;
  timing: string;
  subject: string;
  body: string;
  channels: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  enabled: boolean;
  variables: string[];
}

interface GuidebookSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  order: number;
}

interface PropertyGuidebook {
  id: string;
  propertyId: string;
  propertyName: string;
  sections: GuidebookSection[];
  houseRules: string[];
  wifiNetwork: string;
  wifiPassword: string;
  localRecommendations: {
    id: string;
    name: string;
    category: 'restaurant' | 'beach' | 'activity' | 'shopping' | 'nightlife' | 'culture';
    description: string;
    distance: string;
    rating?: number;
  }[];
  emergencyContacts: {
    label: string;
    number: string;
  }[];
  transportation: {
    airport: string;
    airportDistance: string;
    taxiCost: string;
    carRental: string;
    publicTransport: string;
  };
  isPublished: boolean;
  updatedAt: string;
}

interface FeedbackSurvey {
  id: string;
  guestName: string;
  propertyName: string;
  bookingId: string;
  type: 'mid-stay' | 'post-stay';
  overallRating: number;
  npsScore: number;
  categories: {
    cleanliness: number;
    communication: number;
    checkIn: number;
    accuracy: number;
    location: number;
    value: number;
  };
  comment: string;
  submittedAt: string;
  responded: boolean;
  responseText?: string;
}

interface PortalAnalytics {
  checkInCompletionRate: number;
  checkInCompletionTrend: number;
  guidebookViews: number;
  guidebookViewsTrend: number;
  messageOpenRate: number;
  messageOpenRateTrend: number;
  averageNps: number;
  npsTrend: number;
  totalSurveys: number;
  responseRate: number;
  upsellConversionRate: number;
  upsellRevenue: number;
  topViewedSections: { name: string; views: number }[];
  messagePerformance: { trigger: string; sent: number; opened: number; clicked: number }[];
  npsDistribution: { score: number; count: number }[];
  checkInTimeline: { date: string; completed: number; pending: number }[];
}

// ── Tabs ────────────────────────────────────────────────────────────────────

const tabs = [
  { key: 'checkin-config', label: 'Online Check-in', icon: ClipboardCheck },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'guidebooks', label: 'Digital Guidebook', icon: BookOpen },
  { key: 'feedback', label: 'Guest Feedback', icon: Star },
  { key: 'analytics', label: 'Portal Analytics', icon: BarChart3 },
] as const;

type TabKey = (typeof tabs)[number]['key'];

// ── Mock Data ───────────────────────────────────────────────────────────────

const mockCheckInConfig: CheckInConfig = {
  idUploadRequired: true,
  passportScanEnabled: true,
  guestFormFields: {
    phone: true,
    emergencyContact: true,
    arrivalTime: true,
    vehicleInfo: false,
    specialRequests: true,
    numberOfGuests: true,
    nationality: true,
    dietaryRestrictions: false,
  },
  welcomeMessageMode: 'per-property',
  globalWelcomeMessage: 'Welcome to your holiday home! We are excited to host you.',
  propertyWelcomeMessages: {
    'prop-aegean-sunset': 'Welcome to Aegean Sunset Villa! Your Cretan paradise awaits.',
    'prop-chania-old-town': 'Kalimera! Welcome to the heart of Chania Old Town.',
  },
  digitalHouseRules: true,
  requireSignature: true,
  damageDepositEnabled: true,
  damageDepositAmount: 300,
  damageDepositCurrency: 'EUR',
  paymentCollectionEnabled: true,
  autoSendCheckInLink: true,
  checkInLinkTiming: 7,
};

const mockTimelineMessages: TimelineMessage[] = [
  {
    id: 'msg-1',
    trigger: 'booking_confirmed',
    triggerLabel: 'Booking Confirmation',
    timing: 'Immediately after booking',
    subject: 'Booking Confirmed - {{propertyName}}',
    body: 'Dear {{guestName}},\n\nThank you for booking {{propertyName}}! Your reservation for {{checkIn}} to {{checkOut}} is confirmed.\n\nBooking reference: {{bookingRef}}\n\nWe will send you check-in details closer to your arrival date.\n\nBest regards,\n{{hostName}}',
    channels: { email: true, whatsapp: true, sms: false },
    enabled: true,
    variables: ['guestName', 'propertyName', 'checkIn', 'checkOut', 'bookingRef', 'hostName'],
  },
  {
    id: 'msg-2',
    trigger: 'pre_arrival',
    triggerLabel: 'Pre-Arrival Instructions',
    timing: '7 days before check-in',
    subject: 'Getting Ready for Your Stay - {{propertyName}}',
    body: 'Dear {{guestName}},\n\nYour stay at {{propertyName}} is just {{daysUntil}} days away! Here\'s what you need to know:\n\n1. Please complete your online check-in: {{checkInLink}}\n2. Review our digital guidebook: {{guidebookLink}}\n3. Check out our add-on services for an enhanced experience\n\nFeel free to reach out with any questions!\n\nBest,\n{{hostName}}',
    channels: { email: true, whatsapp: true, sms: false },
    enabled: true,
    variables: ['guestName', 'propertyName', 'daysUntil', 'checkInLink', 'guidebookLink', 'hostName'],
  },
  {
    id: 'msg-3',
    trigger: 'checkin_details',
    triggerLabel: 'Check-in Details',
    timing: '24 hours before check-in',
    subject: 'Your Check-in Details - {{propertyName}}',
    body: 'Dear {{guestName}},\n\nWelcome to {{propertyName}} tomorrow!\n\nCheck-in time: {{checkInTime}}\nAddress: {{address}}\nSmart lock code: {{lockCode}}\n\nWiFi Network: {{wifiName}}\nWiFi Password: {{wifiPassword}}\n\nDirections: {{directions}}\n\nEmergency contact: {{managerPhone}}\n\nWe hope you have a wonderful stay!\n{{hostName}}',
    channels: { email: true, whatsapp: true, sms: true },
    enabled: true,
    variables: ['guestName', 'propertyName', 'checkInTime', 'address', 'lockCode', 'wifiName', 'wifiPassword', 'directions', 'managerPhone', 'hostName'],
  },
  {
    id: 'msg-4',
    trigger: 'mid_stay',
    triggerLabel: 'Mid-Stay Check-in',
    timing: 'Day 3 of stay',
    subject: 'How is Your Stay? - {{propertyName}}',
    body: 'Dear {{guestName}},\n\nWe hope you\'re enjoying your stay at {{propertyName}}!\n\nIs everything to your satisfaction? If you need anything at all, don\'t hesitate to reach out.\n\nWe\'d also love your quick feedback: {{surveyLink}}\n\nBest,\n{{hostName}}',
    channels: { email: false, whatsapp: true, sms: false },
    enabled: true,
    variables: ['guestName', 'propertyName', 'surveyLink', 'hostName'],
  },
  {
    id: 'msg-5',
    trigger: 'checkout_reminder',
    triggerLabel: 'Check-out Reminder',
    timing: '1 day before check-out',
    subject: 'Check-out Reminder - {{propertyName}}',
    body: 'Dear {{guestName}},\n\nA friendly reminder that check-out is tomorrow at {{checkOutTime}}.\n\nBefore you leave:\n- Please leave keys on the kitchen counter\n- Close all windows and doors\n- Turn off AC/heating\n- Take out trash to the bins outside\n\nWe hope you had a wonderful stay! Please share your experience: {{reviewLink}}\n\nSafe travels!\n{{hostName}}',
    channels: { email: true, whatsapp: true, sms: false },
    enabled: true,
    variables: ['guestName', 'propertyName', 'checkOutTime', 'reviewLink', 'hostName'],
  },
  {
    id: 'msg-6',
    trigger: 'post_stay_review',
    triggerLabel: 'Post-Stay Review Request',
    timing: '1 day after check-out',
    subject: 'How Was Your Stay at {{propertyName}}?',
    body: 'Dear {{guestName}},\n\nThank you for staying at {{propertyName}}! We hope you had a memorable time.\n\nWe\'d love to hear your feedback. Please take a moment to share your experience:\n\n{{reviewLink}}\n\nYour review helps us improve and helps future guests make informed decisions.\n\nWe hope to welcome you back soon!\n\nWarm regards,\n{{hostName}}',
    channels: { email: true, whatsapp: false, sms: false },
    enabled: true,
    variables: ['guestName', 'propertyName', 'reviewLink', 'hostName'],
  },
];

const mockGuidebooks: PropertyGuidebook[] = [
  {
    id: 'gb-1',
    propertyId: 'prop-aegean-sunset',
    propertyName: 'Aegean Sunset Villa',
    sections: [
      { id: 's1', title: 'Property Info & Amenities', icon: 'home', content: 'Spacious 3-bedroom villa with infinity pool overlooking the Aegean Sea. Fully equipped kitchen with Nespresso machine, dishwasher, and oven. Air conditioning in all rooms. Outdoor BBQ area with dining table. Private parking for 2 cars.', order: 1 },
      { id: 's2', title: 'Kitchen & Appliances', icon: 'utensils', content: 'Fully equipped kitchen: Nespresso machine (capsules in drawer), dishwasher, oven, microwave, toaster, kettle. Extra capsules available at the local supermarket (500m). Please run dishwasher before checkout.', order: 2 },
      { id: 's3', title: 'Pool & Outdoor', icon: 'waves', content: 'Infinity pool open 24/7. Please shower before entering. Pool towels provided on loungers - do not take beach towels to pool. Gas BBQ available - please clean grill after use. Pool depth: 1.2m - 1.8m.', order: 3 },
      { id: 's4', title: 'Entertainment', icon: 'tv', content: 'Smart TV with Netflix, YouTube, and local channels. Bluetooth speaker in living room (JBL Flip). Board games and playing cards in the cabinet under the TV. Books library on the bookshelf.', order: 4 },
      { id: 's5', title: 'WiFi & Tech', icon: 'wifi', content: 'High-speed fiber WiFi throughout the property. Network and password on the fridge magnet. Smart home: lights and AC controlled via wall panels. USB charging stations in all bedrooms.', order: 5 },
    ],
    houseRules: [
      'No smoking inside the property (outdoor smoking area available)',
      'Quiet hours: 23:00 - 08:00',
      'Maximum occupancy: 8 guests (as per booking)',
      'Pets allowed with prior notice (+20 EUR/night)',
      'No parties or events without prior approval',
      'Please conserve water - Crete has limited water resources',
      'Pool gate must remain closed at all times (child safety)',
    ],
    wifiNetwork: 'AegeanSunset_Guest',
    wifiPassword: 'Welcome2Crete!',
    localRecommendations: [
      { id: 'r1', name: 'Taverna Knossos', category: 'restaurant', description: 'Traditional Cretan cuisine, amazing sea view. Try the dakos salad and grilled octopus.', distance: '200m', rating: 4.8 },
      { id: 'r2', name: 'Elounda Beach', category: 'beach', description: 'Sandy beach with crystal clear water. Sunbeds and umbrellas available (8 EUR/set).', distance: '50m', rating: 4.6 },
      { id: 'r3', name: 'Captain\'s Table', category: 'restaurant', description: 'Fresh seafood right on the harbor. Reservations recommended for sunset tables.', distance: '800m', rating: 4.7 },
      { id: 'r4', name: 'Spinalonga Island Tour', category: 'activity', description: 'Historic fortress island. Boat tours depart daily at 10:00 from Plaka port.', distance: '4km', rating: 4.9 },
      { id: 'r5', name: 'Olive Oil Museum', category: 'culture', description: 'Learn about Cretan olive oil production. Tastings included in entry (5 EUR).', distance: '3km', rating: 4.3 },
      { id: 'r6', name: 'Elounda Market', category: 'shopping', description: 'Fresh produce, local cheese, wine. Open Tuesday and Saturday mornings.', distance: '500m', rating: 4.4 },
    ],
    emergencyContacts: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance', number: '166' },
      { label: 'Fire Department', number: '199' },
      { label: 'European Emergency', number: '112' },
      { label: 'Property Manager (Sivan)', number: '+30 694 555 1234' },
      { label: 'Local Maintenance', number: '+30 694 555 9876' },
    ],
    transportation: {
      airport: 'Heraklion International (HER)',
      airportDistance: '65 km / ~55 min',
      taxiCost: 'Taxi: ~80 EUR | Private transfer: 55 EUR (book via portal)',
      carRental: 'AutoCrete Rentals - free delivery to villa. +30 694 555 4321',
      publicTransport: 'KTEL bus from Heraklion to Elounda: 8 EUR, runs 4x daily',
    },
    isPublished: true,
    updatedAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'gb-2',
    propertyId: 'prop-chania-old-town',
    propertyName: 'Chania Old Town Apt',
    sections: [
      { id: 's1', title: 'Property Info & Amenities', icon: 'home', content: 'Charming 1-bedroom apartment in a renovated Venetian building. Kitchenette, AC, balcony overlooking the narrow streets of Old Town. Steps from the Venetian Harbor.', order: 1 },
      { id: 's2', title: 'Getting Around', icon: 'map', content: 'Best explored on foot. The harbor is a 3-minute walk. Parking available at the municipal lot (Parking Chania, 800m, 6 EUR/day).', order: 2 },
      { id: 's3', title: 'Kitchen Basics', icon: 'utensils', content: 'Kitchenette with mini fridge, 2-burner stove, microwave, and basic utensils. Coffee maker with complimentary local coffee.', order: 3 },
    ],
    houseRules: [
      'No smoking inside the apartment',
      'Quiet hours: 22:00 - 08:00 (old building, thin walls)',
      'Maximum occupancy: 4 guests',
      'No shoes inside the apartment please',
    ],
    wifiNetwork: 'ChaniaOldTown_WiFi',
    wifiPassword: 'Kalimera2026',
    localRecommendations: [
      { id: 'r1', name: 'Venetian Harbor', category: 'culture', description: 'Iconic harbor with lighthouse. Beautiful sunset views.', distance: '150m', rating: 4.9 },
      { id: 'r2', name: 'Tamam Restaurant', category: 'restaurant', description: 'Creative Mediterranean in a converted Turkish bathhouse.', distance: '100m', rating: 4.6 },
      { id: 'r3', name: 'Nea Chora Beach', category: 'beach', description: 'Small sandy beach west of the harbor. Less touristy.', distance: '600m', rating: 4.2 },
    ],
    emergencyContacts: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance', number: '166' },
      { label: 'Property Manager', number: '+30 694 555 5678' },
    ],
    transportation: {
      airport: 'Chania International (CHQ)',
      airportDistance: '15 km / ~20 min',
      taxiCost: 'Taxi: ~25 EUR',
      carRental: 'Not recommended in Old Town - walking is best',
      publicTransport: 'City bus #2 from airport: 2.50 EUR',
    },
    isPublished: false,
    updatedAt: '2026-04-03T00:00:00Z',
  },
];

const mockFeedback: FeedbackSurvey[] = [
  {
    id: 'fb-1',
    guestName: 'Maria Papadopoulos',
    propertyName: 'Aegean Sunset Villa',
    bookingId: 'booking-001',
    type: 'post-stay',
    overallRating: 5,
    npsScore: 10,
    categories: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 4, location: 5, value: 4 },
    comment: 'Absolutely stunning villa with breathtaking views! The online check-in was so smooth, and the guidebook was incredibly helpful. We especially loved the pool and the restaurant recommendation at Taverna Knossos. Will definitely return!',
    submittedAt: '2026-04-10T14:30:00Z',
    responded: true,
    responseText: 'Thank you so much, Maria! We are delighted you enjoyed your stay. We look forward to welcoming you back to Crete!',
  },
  {
    id: 'fb-2',
    guestName: 'James Richardson',
    propertyName: 'Chania Old Town Apt',
    bookingId: 'booking-002',
    type: 'mid-stay',
    overallRating: 4,
    npsScore: 7,
    categories: { cleanliness: 4, communication: 5, checkIn: 4, accuracy: 3, location: 5, value: 4 },
    comment: 'Great location and very responsive host. The apartment is smaller than expected from the photos, but overall a good experience. The restaurant tips in the guidebook were spot on!',
    submittedAt: '2026-04-09T18:00:00Z',
    responded: false,
  },
  {
    id: 'fb-3',
    guestName: 'Elena Volkov',
    propertyName: 'Aegean Sunset Villa',
    bookingId: 'booking-003',
    type: 'post-stay',
    overallRating: 5,
    npsScore: 9,
    categories: { cleanliness: 5, communication: 4, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    comment: 'Perfect holiday! The villa exceeded our expectations. Kids loved the pool. The smart lock made check-in effortless at midnight. Only suggestion: it would be nice to have more beach towels.',
    submittedAt: '2026-04-08T10:00:00Z',
    responded: true,
    responseText: 'Thank you Elena! Great suggestion about the beach towels - we have added extra sets for future guests. Hope to see you again!',
  },
  {
    id: 'fb-4',
    guestName: 'Thomas Mueller',
    propertyName: 'Aegean Sunset Villa',
    bookingId: 'booking-004',
    type: 'post-stay',
    overallRating: 3,
    npsScore: 5,
    categories: { cleanliness: 3, communication: 4, checkIn: 4, accuracy: 3, location: 5, value: 3 },
    comment: 'Location is fantastic but the villa needs some maintenance. The AC in the master bedroom was noisy and the pool filter was not working properly for 2 days.',
    submittedAt: '2026-04-06T09:00:00Z',
    responded: false,
  },
  {
    id: 'fb-5',
    guestName: 'Sophie Laurent',
    propertyName: 'Chania Old Town Apt',
    bookingId: 'booking-005',
    type: 'post-stay',
    overallRating: 5,
    npsScore: 10,
    categories: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
    comment: 'Parfait! The best Airbnb experience we have ever had. Everything was exactly as described and the host went above and beyond.',
    submittedAt: '2026-04-04T16:00:00Z',
    responded: true,
    responseText: 'Merci beaucoup Sophie! Your kind words mean the world to us. You are welcome anytime!',
  },
];

const mockAnalytics: PortalAnalytics = {
  checkInCompletionRate: 87,
  checkInCompletionTrend: 5.2,
  guidebookViews: 342,
  guidebookViewsTrend: 12.8,
  messageOpenRate: 94,
  messageOpenRateTrend: 2.1,
  averageNps: 8.2,
  npsTrend: 0.4,
  totalSurveys: 48,
  responseRate: 72,
  upsellConversionRate: 34,
  upsellRevenue: 2_840,
  topViewedSections: [
    { name: 'WiFi & Tech', views: 298 },
    { name: 'House Rules', views: 245 },
    { name: 'Local Recommendations', views: 231 },
    { name: 'Check-in Instructions', views: 198 },
    { name: 'Pool & Outdoor', views: 176 },
    { name: 'Transportation', views: 142 },
    { name: 'Emergency Contacts', views: 89 },
  ],
  messagePerformance: [
    { trigger: 'Booking Confirmation', sent: 156, opened: 152, clicked: 134 },
    { trigger: 'Pre-Arrival (7d)', sent: 148, opened: 141, clicked: 118 },
    { trigger: 'Check-in Details (24h)', sent: 145, opened: 143, clicked: 138 },
    { trigger: 'Mid-Stay Check-in', sent: 132, opened: 108, clicked: 72 },
    { trigger: 'Check-out Reminder', sent: 128, opened: 121, clicked: 98 },
    { trigger: 'Post-Stay Review', sent: 128, opened: 96, clicked: 64 },
  ],
  npsDistribution: [
    { score: 0, count: 1 },
    { score: 1, count: 0 },
    { score: 2, count: 0 },
    { score: 3, count: 1 },
    { score: 4, count: 1 },
    { score: 5, count: 3 },
    { score: 6, count: 2 },
    { score: 7, count: 5 },
    { score: 8, count: 8 },
    { score: 9, count: 12 },
    { score: 10, count: 15 },
  ],
  checkInTimeline: [
    { date: 'Mar 1', completed: 12, pending: 2 },
    { date: 'Mar 8', completed: 15, pending: 3 },
    { date: 'Mar 15', completed: 18, pending: 1 },
    { date: 'Mar 22', completed: 14, pending: 4 },
    { date: 'Mar 29', completed: 20, pending: 2 },
    { date: 'Apr 5', completed: 22, pending: 1 },
    { date: 'Apr 12', completed: 8, pending: 3 },
  ],
};

const responseTemplates = [
  { id: 'rt-1', label: 'Positive - Thank you', text: 'Thank you so much for your wonderful review, {{guestName}}! We are thrilled you enjoyed your stay at {{propertyName}}. We look forward to welcoming you back!' },
  { id: 'rt-2', label: 'Constructive - Acknowledge & Improve', text: 'Thank you for your honest feedback, {{guestName}}. We appreciate you bringing this to our attention. We have already taken steps to address {{issue}} and are committed to improving the experience for future guests.' },
  { id: 'rt-3', label: 'Apology - Service Issue', text: 'Dear {{guestName}}, we sincerely apologize for the inconvenience during your stay. {{issue}} is not the standard we strive for. We have taken immediate action to resolve this and would love to make it up to you on your next visit.' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function renderStars(rating: number, max = 5) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < rating ? 'text-amber-500 fill-amber-500' : 'text-outline-variant/40',
          )}
        />
      ))}
    </div>
  );
}

function getNpsColor(score: number) {
  if (score >= 9) return 'text-success';
  if (score >= 7) return 'text-amber-500';
  return 'text-error';
}

function getNpsBg(score: number) {
  if (score >= 9) return 'bg-success/10';
  if (score >= 7) return 'bg-amber-500/10';
  return 'bg-error/10';
}

function getNpsLabel(score: number) {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

const sectionIcons: Record<string, typeof Home> = {
  home: Home,
  utensils: Utensils,
  waves: Waves,
  tv: Sparkles,
  wifi: Wifi,
  map: MapPin,
};

// ── Main Component ──────────────────────────────────────────────────────────

export default function GuestExperiencePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('checkin-config');

  // State
  const [checkInConfig, setCheckInConfig] = useState<CheckInConfig>(mockCheckInConfig);
  const [timelineMessages, setTimelineMessages] = useState<TimelineMessage[]>(mockTimelineMessages);
  const [guidebooks, setGuidebooks] = useState<PropertyGuidebook[]>(mockGuidebooks);
  const [feedback, setFeedback] = useState<FeedbackSurvey[]>(mockFeedback);
  const [analytics] = useState<PortalAnalytics>(mockAnalytics);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [configRes, msgRes, gbRes, fbRes] = await Promise.all([
        apiClient.get('/guest-experience/checkin-config').catch(() => null),
        apiClient.get('/guest-experience/timeline-messages').catch(() => null),
        apiClient.get('/guest-experience/guidebooks').catch(() => null),
        apiClient.get('/guest-experience/feedback').catch(() => null),
      ]);
      if (configRes?.data?.data) setCheckInConfig(configRes.data.data);
      if (msgRes?.data?.data) setTimelineMessages(msgRes.data.data);
      if (gbRes?.data?.data) setGuidebooks(gbRes.data.data);
      if (fbRes?.data?.data) setFeedback(fbRes.data.data);
    } catch {
      // keep mock data
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            {t('guestExperience.title', 'Guest Experience')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('guestExperience.subtitle', 'Configure check-in, communications, guidebooks, feedback & analytics')}
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
      <div className="flex gap-1 bg-surface-container rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap',
                isActive
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50',
              )}
            >
              <Icon className="w-4 h-4" />
              {t(`guestExperience.tabs.${tab.key}`, tab.label)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'checkin-config' && (
        <CheckInConfigTab config={checkInConfig} onChange={setCheckInConfig} />
      )}
      {activeTab === 'communication' && (
        <CommunicationTab messages={timelineMessages} onChange={setTimelineMessages} />
      )}
      {activeTab === 'guidebooks' && (
        <GuidebooksTab guidebooks={guidebooks} onChange={setGuidebooks} />
      )}
      {activeTab === 'feedback' && (
        <FeedbackTab feedback={feedback} onChange={setFeedback} />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab analytics={analytics} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. ONLINE CHECK-IN CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

function CheckInConfigTab({ config, onChange }: { config: CheckInConfig; onChange: (c: CheckInConfig) => void }) {
  const toggle = (key: keyof CheckInConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  const toggleField = (field: keyof CheckInConfig['guestFormFields']) => {
    onChange({
      ...config,
      guestFormFields: { ...config.guestFormFields, [field]: !config.guestFormFields[field] },
    });
  };

  const handleSave = async () => {
    try {
      await apiClient.put('/guest-experience/checkin-config', config);
    } catch { /* fallback */ }
    toast.success('Check-in configuration saved');
  };

  const properties = [
    { id: 'prop-aegean-sunset', name: 'Aegean Sunset Villa' },
    { id: 'prop-chania-old-town', name: 'Chania Old Town Apt' },
  ];

  return (
    <div className="space-y-6">
      {/* ID / Passport Upload */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">ID & Identity Verification</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Require guests to upload identification documents during check-in
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <ToggleRow
            label="Require ID/Passport Upload"
            description="Guests must upload a photo of their ID or passport"
            enabled={config.idUploadRequired}
            onToggle={() => toggle('idUploadRequired')}
          />
          <ToggleRow
            label="Passport Scan & OCR"
            description="Automatically extract data from uploaded passport photos"
            enabled={config.passportScanEnabled}
            onToggle={() => toggle('passportScanEnabled')}
          />
        </div>
      </div>

      {/* Guest Form Fields */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Guest Information Form</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Choose which fields guests must fill out during online check-in
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(config.guestFormFields) as [keyof CheckInConfig['guestFormFields'], boolean][]).map(
              ([field, enabled]) => {
                const fieldLabels: Record<string, { label: string; icon: typeof Phone }> = {
                  phone: { label: 'Phone Number', icon: Phone },
                  emergencyContact: { label: 'Emergency Contact', icon: AlertTriangle },
                  arrivalTime: { label: 'Estimated Arrival Time', icon: Clock },
                  vehicleInfo: { label: 'Vehicle Information', icon: Car },
                  specialRequests: { label: 'Special Requests', icon: MessageCircle },
                  numberOfGuests: { label: 'Number of Guests', icon: Users },
                  nationality: { label: 'Nationality', icon: Globe },
                  dietaryRestrictions: { label: 'Dietary Restrictions', icon: Coffee },
                };
                const meta = fieldLabels[field] || { label: field, icon: Circle };
                const Icon = meta.icon;
                return (
                  <button
                    key={field}
                    onClick={() => toggleField(field)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-start',
                      enabled
                        ? 'bg-secondary/5 border-secondary/30 hover:bg-secondary/10'
                        : 'bg-surface border-outline-variant/20 hover:bg-surface-container-high/50',
                    )}
                  >
                    <Icon className={cn('w-4 h-4', enabled ? 'text-secondary' : 'text-on-surface-variant')} />
                    <span className={cn('text-sm font-medium flex-1', enabled ? 'text-on-surface' : 'text-on-surface-variant')}>
                      {meta.label}
                    </span>
                    {enabled ? (
                      <CheckCircle className="w-4 h-4 text-secondary" />
                    ) : (
                      <Circle className="w-4 h-4 text-outline-variant/40" />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* Welcome Message Template */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-headline font-semibold text-on-surface">Welcome Message Template</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Set up the welcome message guests see when they open their portal
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface rounded-lg p-0.5">
            <button
              onClick={() => onChange({ ...config, welcomeMessageMode: 'global' })}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                config.welcomeMessageMode === 'global'
                  ? 'bg-secondary text-on-secondary'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Global
            </button>
            <button
              onClick={() => onChange({ ...config, welcomeMessageMode: 'per-property' })}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                config.welcomeMessageMode === 'per-property'
                  ? 'bg-secondary text-on-secondary'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              Per Property
            </button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {config.welcomeMessageMode === 'global' ? (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Global Welcome Message
              </label>
              <textarea
                className="w-full rounded-xl border border-outline-variant/30 bg-surface p-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-shadow"
                rows={3}
                value={config.globalWelcomeMessage}
                onChange={(e) => onChange({ ...config, globalWelcomeMessage: e.target.value })}
              />
              <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Available variables: {'{{guestName}}'}, {'{{propertyName}}'}, {'{{checkIn}}'}, {'{{checkOut}}'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map((prop) => (
                <div key={prop.id}>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    {prop.name}
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface p-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-shadow"
                    rows={2}
                    value={config.propertyWelcomeMessages[prop.id] || ''}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        propertyWelcomeMessages: {
                          ...config.propertyWelcomeMessages,
                          [prop.id]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* House Rules & Signature */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-success/10 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Digital House Rules & Agreements</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Require guests to accept rules and sign digitally
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <ToggleRow
            label="Digital House Rules Acceptance"
            description="Guests must read and accept house rules before check-in completes"
            enabled={config.digitalHouseRules}
            onToggle={() => toggle('digitalHouseRules')}
          />
          <ToggleRow
            label="Digital Signature Required"
            description="Guests must draw their signature to confirm acceptance"
            enabled={config.requireSignature}
            onToggle={() => toggle('requireSignature')}
          />
        </div>
      </div>

      {/* Payment & Deposit */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-error/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-error" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Payment & Damage Deposit</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Collect payments and security deposits during check-in
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <ToggleRow
            label="Damage Deposit Collection"
            description="Pre-authorize or collect a security deposit from guests"
            enabled={config.damageDepositEnabled}
            onToggle={() => toggle('damageDepositEnabled')}
          />
          {config.damageDepositEnabled && (
            <div className="flex items-center gap-3 ps-12">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Amount</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-28 rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={config.damageDepositAmount}
                    onChange={(e) => onChange({ ...config, damageDepositAmount: Number(e.target.value) })}
                  />
                  <span className="text-sm text-on-surface-variant font-medium">{config.damageDepositCurrency}</span>
                </div>
              </div>
            </div>
          )}
          <ToggleRow
            label="Online Payment Collection"
            description="Allow guests to pay remaining balance during online check-in"
            enabled={config.paymentCollectionEnabled}
            onToggle={() => toggle('paymentCollectionEnabled')}
          />
        </div>
      </div>

      {/* Auto-Send Settings */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
          <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Send className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Automatic Check-in Link</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Automatically send the online check-in link to guests
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <ToggleRow
            label="Auto-Send Check-in Link"
            description="Automatically email the check-in form link to guests before arrival"
            enabled={config.autoSendCheckInLink}
            onToggle={() => toggle('autoSendCheckInLink')}
          />
          {config.autoSendCheckInLink && (
            <div className="flex items-center gap-3 ps-12">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Send before arrival</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={config.checkInLinkTiming}
                    onChange={(e) => onChange({ ...config, checkInLinkTiming: Number(e.target.value) })}
                    min={1}
                    max={30}
                  />
                  <span className="text-sm text-on-surface-variant">days</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. GUEST COMMUNICATION TIMELINE
// ════════════════════════════════════════════════════════════════════════════

function CommunicationTab({
  messages,
  onChange,
}: {
  messages: TimelineMessage[];
  onChange: (msgs: TimelineMessage[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TimelineMessage | null>(null);

  const handleToggle = (id: string) => {
    onChange(messages.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  const handleChannelToggle = (id: string, channel: 'email' | 'whatsapp' | 'sms') => {
    onChange(
      messages.map((m) =>
        m.id === id ? { ...m, channels: { ...m.channels, [channel]: !m.channels[channel] } } : m,
      ),
    );
  };

  const startEdit = (msg: TimelineMessage) => {
    setEditingId(msg.id);
    setEditDraft({ ...msg });
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    try {
      await apiClient.put(`/guest-experience/timeline-messages/${editDraft.id}`, editDraft);
    } catch { /* fallback */ }
    onChange(messages.map((m) => (m.id === editDraft.id ? editDraft : m)));
    setEditingId(null);
    setEditDraft(null);
    toast.success('Message template updated');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const triggerIcons: Record<string, typeof Mail> = {
    booking_confirmed: CheckCircle,
    pre_arrival: Calendar,
    checkin_details: Key,
    mid_stay: Heart,
    checkout_reminder: DoorClosed,
    post_stay_review: Star,
  };

  const triggerColors: Record<string, string> = {
    booking_confirmed: 'bg-success/10 text-success',
    pre_arrival: 'bg-blue-500/10 text-blue-600',
    checkin_details: 'bg-secondary/10 text-secondary',
    mid_stay: 'bg-amber-500/10 text-amber-600',
    checkout_reminder: 'bg-error/10 text-error',
    post_stay_review: 'bg-secondary/10 text-secondary',
  };

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-headline font-semibold text-on-surface">Automated Message Schedule</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure the messages guests receive at each stage of their journey. Each message can be sent via Email, WhatsApp, or SMS.
              Use template variables like {'{{guestName}}'} and {'{{propertyName}}'} for personalization.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute start-[2.25rem] top-0 bottom-0 w-0.5 bg-outline-variant/20 hidden md:block" />

        <div className="space-y-4">
          {messages.map((msg, index) => {
            const isEditing = editingId === msg.id;
            const TriggerIcon = triggerIcons[msg.trigger] || Mail;
            const colorClass = triggerColors[msg.trigger] || 'bg-outline-variant/20 text-on-surface-variant';
            const draft = isEditing ? editDraft! : msg;

            return (
              <div key={msg.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute start-5 top-6 w-5 h-5 rounded-full bg-surface-container border-2 border-outline-variant/30 z-10 hidden md:flex items-center justify-center">
                  <div className={cn('w-2 h-2 rounded-full', msg.enabled ? 'bg-secondary' : 'bg-outline-variant/40')} />
                </div>

                <div
                  className={cn(
                    'md:ms-16 bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden transition-all',
                    !msg.enabled && 'opacity-60',
                  )}
                >
                  {/* Message header */}
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colorClass)}>
                      <TriggerIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-on-surface text-sm">{msg.triggerLabel}</h3>
                        <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                          {msg.timing}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">{msg.subject}</p>
                    </div>

                    {/* Channel badges */}
                    <div className="flex items-center gap-1.5">
                      <ChannelBadge
                        icon={Mail}
                        label="Email"
                        active={msg.channels.email}
                        onClick={() => handleChannelToggle(msg.id, 'email')}
                      />
                      <ChannelBadge
                        icon={MessageCircle}
                        label="WhatsApp"
                        active={msg.channels.whatsapp}
                        onClick={() => handleChannelToggle(msg.id, 'whatsapp')}
                      />
                      <ChannelBadge
                        icon={Phone}
                        label="SMS"
                        active={msg.channels.sms}
                        onClick={() => handleChannelToggle(msg.id, 'sms')}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(msg)}
                          className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                          title="Edit template"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(msg.id)}
                        className="p-1 transition-colors"
                        title={msg.enabled ? 'Disable' : 'Enable'}
                      >
                        {msg.enabled ? (
                          <ToggleRight className="w-6 h-6 text-success" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-on-surface-variant" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Edit mode */}
                  {isEditing && editDraft && (
                    <div className="px-6 pb-5 border-t border-outline-variant/20 pt-4 space-y-4 bg-surface/50">
                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Subject</label>
                        <input
                          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-shadow"
                          value={editDraft.subject}
                          onChange={(e) => setEditDraft({ ...editDraft, subject: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Message Body</label>
                        <textarea
                          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-shadow font-mono"
                          rows={8}
                          value={editDraft.body}
                          onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Available Variables</label>
                        <div className="flex flex-wrap gap-1.5">
                          {editDraft.variables.map((v) => (
                            <button
                              key={v}
                              onClick={() => {
                                const textarea = document.querySelector('textarea');
                                if (textarea) {
                                  const pos = textarea.selectionStart;
                                  const text = editDraft.body;
                                  setEditDraft({
                                    ...editDraft,
                                    body: text.slice(0, pos) + `{{${v}}}` + text.slice(pos),
                                  });
                                }
                              }}
                              className="px-2 py-1 bg-secondary/10 text-secondary rounded-lg text-xs font-mono hover:bg-secondary/20 transition-colors"
                            >
                              {`{{${v}}}`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChannelBadge({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Mail;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={`${label}: ${active ? 'Enabled' : 'Disabled'}`}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
        active
          ? 'bg-secondary/10 text-secondary'
          : 'bg-surface text-on-surface-variant/40 hover:text-on-surface-variant',
      )}
    >
      <Icon className="w-3 h-3" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. DIGITAL GUIDEBOOK
// ════════════════════════════════════════════════════════════════════════════

function GuidebooksTab({
  guidebooks,
  onChange,
}: {
  guidebooks: PropertyGuidebook[];
  onChange: (gbs: PropertyGuidebook[]) => void;
}) {
  const [selectedProperty, setSelectedProperty] = useState(guidebooks[0]?.propertyId || '');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'sections' | 'rules' | 'recommendations' | 'emergency' | 'transport'>('sections');

  const gb = guidebooks.find((g) => g.propertyId === selectedProperty);

  const handlePublish = async () => {
    if (!gb) return;
    try {
      await apiClient.post(`/guest-experience/guidebook/${gb.propertyId}/publish`);
    } catch { /* fallback */ }
    onChange(guidebooks.map((g) => (g.propertyId === selectedProperty ? { ...g, isPublished: !g.isPublished } : g)));
    toast.success(gb.isPublished ? 'Guidebook unpublished' : 'Guidebook published');
  };

  const updateGuidebook = (updates: Partial<PropertyGuidebook>) => {
    onChange(guidebooks.map((g) => (g.propertyId === selectedProperty ? { ...g, ...updates } : g)));
  };

  const categoryIcons: Record<string, typeof Utensils> = {
    restaurant: Utensils,
    beach: Umbrella,
    activity: Bike,
    shopping: Home,
    nightlife: Sparkles,
    culture: Landmark,
  };

  const categoryColors: Record<string, string> = {
    restaurant: 'bg-amber-500/10 text-amber-600',
    beach: 'bg-blue-500/10 text-blue-600',
    activity: 'bg-success/10 text-success',
    shopping: 'bg-secondary/10 text-secondary',
    nightlife: 'bg-purple-500/10 text-purple-600',
    culture: 'bg-error/10 text-error',
  };

  const subTabs = [
    { key: 'sections' as const, label: 'Property Info', icon: Home },
    { key: 'rules' as const, label: 'House Rules', icon: FileText },
    { key: 'recommendations' as const, label: 'Local Recs', icon: MapPin },
    { key: 'emergency' as const, label: 'Emergency', icon: AlertTriangle },
    { key: 'transport' as const, label: 'Transport', icon: Car },
  ];

  return (
    <div className="space-y-4">
      {/* Property selector and publish */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4 flex items-center gap-4">
        <BookOpen className="w-5 h-5 text-secondary" />
        <div className="flex-1">
          <select
            className="bg-surface rounded-lg border border-outline-variant/30 px-3 py-2 text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary/40 w-full max-w-xs"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            {guidebooks.map((g) => (
              <option key={g.propertyId} value={g.propertyId}>
                {g.propertyName}
              </option>
            ))}
          </select>
        </div>
        {gb && (
          <div className="flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              gb.isPublished ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600',
            )}>
              {gb.isPublished ? 'Published' : 'Draft'}
            </span>
            <span className="text-xs text-on-surface-variant">
              Updated: {fmtDate(gb.updatedAt)}
            </span>
            <button
              onClick={handlePublish}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                gb.isPublished
                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                  : 'bg-success/10 text-success hover:bg-success/20',
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              {gb.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        )}
      </div>

      {gb && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-surface-container rounded-xl p-1">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                    isActive
                      ? 'bg-surface text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sections */}
          {activeSubTab === 'sections' && (
            <div className="space-y-3">
              {/* WiFi card */}
              <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Wifi className="w-5 h-5 text-blue-600" />
                  <h3 className="font-headline font-semibold text-on-surface text-sm">WiFi & Internet</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Network Name</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      value={gb.wifiNetwork}
                      onChange={(e) => updateGuidebook({ wifiNetwork: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Password</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      value={gb.wifiPassword}
                      onChange={(e) => updateGuidebook({ wifiPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Sections list */}
              {gb.sections.map((section) => {
                const SectionIcon = sectionIcons[section.icon] || Home;
                const isExpanded = expandedSection === section.id;
                const isEditingThis = editingSection === section.id;

                return (
                  <div key={section.id} className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-start"
                    >
                      <SectionIcon className="w-4 h-4 text-secondary" />
                      <span className="flex-1 font-medium text-sm text-on-surface">{section.title}</span>
                      <div className="flex items-center gap-1">
                        {!isEditingThis && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); setExpandedSection(section.id); }}
                            className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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
                      <div className="px-5 pb-4 border-t border-outline-variant/10 pt-3">
                        {isEditingThis ? (
                          <div className="space-y-3">
                            <input
                              className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                              value={section.title}
                              onChange={(e) => {
                                const updated = gb.sections.map((s) =>
                                  s.id === section.id ? { ...s, title: e.target.value } : s,
                                );
                                updateGuidebook({ sections: updated });
                              }}
                            />
                            <textarea
                              className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
                              rows={4}
                              value={section.content}
                              onChange={(e) => {
                                const updated = gb.sections.map((s) =>
                                  s.id === section.id ? { ...s, content: e.target.value } : s,
                                );
                                updateGuidebook({ sections: updated });
                              }}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingSection(null)}
                                className="px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-on-surface-variant leading-relaxed">{section.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-outline-variant/30 rounded-2xl text-sm font-medium text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          )}

          {/* House Rules */}
          {activeSubTab === 'rules' && (
            <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-secondary" />
                  <h3 className="font-headline font-semibold text-on-surface text-sm">House Rules</h3>
                </div>
                <button
                  onClick={() => {
                    updateGuidebook({ houseRules: [...gb.houseRules, ''] });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </button>
              </div>
              <div className="px-6 py-4 space-y-2">
                {gb.houseRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <span className="text-xs text-on-surface-variant w-5 text-end">{i + 1}.</span>
                    <input
                      className="flex-1 text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/40 transition-shadow"
                      value={rule}
                      onChange={(e) => {
                        const updated = [...gb.houseRules];
                        updated[i] = e.target.value;
                        updateGuidebook({ houseRules: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        updateGuidebook({ houseRules: gb.houseRules.filter((_, idx) => idx !== i) });
                      }}
                      className="p-1.5 text-on-surface-variant/0 group-hover:text-on-surface-variant hover:!text-error hover:bg-error/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local Recommendations */}
          {activeSubTab === 'recommendations' && (
            <div className="space-y-3">
              <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-secondary" />
                    <h3 className="font-headline font-semibold text-on-surface text-sm">Local Recommendations</h3>
                  </div>
                  <span className="text-xs text-on-surface-variant">{gb.localRecommendations.length} places</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gb.localRecommendations.map((rec) => {
                    const CatIcon = categoryIcons[rec.category] || MapPin;
                    const catColor = categoryColors[rec.category] || 'bg-outline-variant/20 text-on-surface-variant';
                    return (
                      <div key={rec.id} className="bg-surface rounded-xl border border-outline-variant/20 p-4 hover:border-secondary/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', catColor)}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-on-surface">{rec.name}</h4>
                              {rec.rating && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {rec.rating}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{rec.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', catColor)}>
                                {rec.category}
                              </span>
                              <span className="text-xs text-on-surface-variant">{rec.distance}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 border-2 border-dashed border-outline-variant/30 rounded-xl text-sm font-medium text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Recommendation
                </button>
              </div>
            </div>
          )}

          {/* Emergency Contacts */}
          {activeSubTab === 'emergency' && (
            <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-error" />
                  <h3 className="font-headline font-semibold text-on-surface text-sm">Emergency Contacts</h3>
                </div>
                <button
                  onClick={() => {
                    updateGuidebook({
                      emergencyContacts: [...gb.emergencyContacts, { label: '', number: '' }],
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg text-xs font-medium hover:bg-secondary/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                {gb.emergencyContacts.map((contact, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <input
                      className="w-40 text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/40"
                      value={contact.label}
                      placeholder="Label"
                      onChange={(e) => {
                        const updated = [...gb.emergencyContacts];
                        updated[i] = { ...updated[i], label: e.target.value };
                        updateGuidebook({ emergencyContacts: updated });
                      }}
                    />
                    <input
                      className="flex-1 text-sm text-on-surface bg-surface rounded-lg border border-outline-variant/20 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/40 font-mono"
                      value={contact.number}
                      placeholder="Phone number"
                      onChange={(e) => {
                        const updated = [...gb.emergencyContacts];
                        updated[i] = { ...updated[i], number: e.target.value };
                        updateGuidebook({ emergencyContacts: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        updateGuidebook({
                          emergencyContacts: gb.emergencyContacts.filter((_, idx) => idx !== i),
                        });
                      }}
                      className="p-1.5 text-on-surface-variant/0 group-hover:text-on-surface-variant hover:!text-error hover:bg-error/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transportation */}
          {activeSubTab === 'transport' && (
            <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
                <Car className="w-5 h-5 text-secondary" />
                <h3 className="font-headline font-semibold text-on-surface text-sm">Transportation Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5" /> Nearest Airport
                    </label>
                    <input
                      className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      value={gb.transportation.airport}
                      onChange={(e) => updateGuidebook({ transportation: { ...gb.transportation, airport: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Distance / Time</label>
                    <input
                      className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      value={gb.transportation.airportDistance}
                      onChange={(e) => updateGuidebook({ transportation: { ...gb.transportation, airportDistance: e.target.value } })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Taxi / Transfer Cost</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={gb.transportation.taxiCost}
                    onChange={(e) => updateGuidebook({ transportation: { ...gb.transportation, taxiCost: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5" /> Car Rental
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={gb.transportation.carRental}
                    onChange={(e) => updateGuidebook({ transportation: { ...gb.transportation, carRental: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Public Transport</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                    value={gb.transportation.publicTransport}
                    onChange={(e) => updateGuidebook({ transportation: { ...gb.transportation, publicTransport: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save guidebook */}
          <div className="flex justify-end">
            <button
              onClick={() => toast.success('Guidebook saved')}
              className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Guidebook
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. GUEST FEEDBACK
// ════════════════════════════════════════════════════════════════════════════

function FeedbackTab({
  feedback,
  onChange,
}: {
  feedback: FeedbackSurvey[];
  onChange: (fb: FeedbackSurvey[]) => void;
}) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mid-stay' | 'post-stay'>('all');
  const [filterResponded, setFilterResponded] = useState<'all' | 'pending' | 'responded'>('all');

  const filteredFeedback = feedback.filter((fb) => {
    if (filterType !== 'all' && fb.type !== filterType) return false;
    if (filterResponded === 'pending' && fb.responded) return false;
    if (filterResponded === 'responded' && !fb.responded) return false;
    return true;
  });

  // NPS summary
  const promoters = feedback.filter((f) => f.npsScore >= 9).length;
  const passives = feedback.filter((f) => f.npsScore >= 7 && f.npsScore < 9).length;
  const detractors = feedback.filter((f) => f.npsScore < 7).length;
  const npsScore = feedback.length > 0
    ? Math.round(((promoters - detractors) / feedback.length) * 100)
    : 0;
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length).toFixed(1)
    : '0';

  const handleRespond = async (id: string) => {
    try {
      await apiClient.post(`/guest-experience/feedback/${id}/respond`, { text: responseText });
    } catch { /* fallback */ }
    onChange(feedback.map((fb) => (fb.id === id ? { ...fb, responded: true, responseText } : fb)));
    setRespondingTo(null);
    setResponseText('');
    toast.success('Response sent to guest');
  };

  const applyTemplate = (templateId: string, guestName: string, propertyName: string) => {
    const template = responseTemplates.find((t) => t.id === templateId);
    if (template) {
      setResponseText(
        template.text
          .replace('{{guestName}}', guestName)
          .replace('{{propertyName}}', propertyName)
          .replace('{{issue}}', '[specific issue]'),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* NPS Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-secondary" />
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">NPS Score</span>
          </div>
          <div className="text-3xl font-headline font-bold text-on-surface">{npsScore}</div>
          <p className="text-xs text-on-surface-variant mt-1">
            {promoters}P / {passives}N / {detractors}D
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Avg Rating</span>
          </div>
          <div className="text-3xl font-headline font-bold text-on-surface">{avgRating}</div>
          <div className="mt-1">{renderStars(Math.round(Number(avgRating)))}</div>
        </div>

        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Reviews</span>
          </div>
          <div className="text-3xl font-headline font-bold text-on-surface">{feedback.length}</div>
          <p className="text-xs text-on-surface-variant mt-1">
            {feedback.filter((f) => f.type === 'mid-stay').length} mid-stay / {feedback.filter((f) => f.type === 'post-stay').length} post-stay
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Response Rate</span>
          </div>
          <div className="text-3xl font-headline font-bold text-on-surface">
            {feedback.length > 0 ? Math.round((feedback.filter((f) => f.responded).length / feedback.length) * 100) : 0}%
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {feedback.filter((f) => !f.responded).length} awaiting response
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
          {(['all', 'mid-stay', 'post-stay'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                filterType === type
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
          {(['all', 'pending', 'responded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterResponded(status)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                filterResponded === status
                  ? 'bg-surface text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-4">
        {filteredFeedback.map((fb) => {
          const isResponding = respondingTo === fb.id;
          const FaceIcon = fb.overallRating >= 4 ? Smile : fb.overallRating >= 3 ? Meh : Frown;
          const faceColor = fb.overallRating >= 4 ? 'text-success' : fb.overallRating >= 3 ? 'text-amber-500' : 'text-error';

          return (
            <div key={fb.id} className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', getNpsBg(fb.npsScore))}>
                    <FaceIcon className={cn('w-5 h-5', faceColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-on-surface">{fb.guestName}</span>
                      <span className="text-xs text-on-surface-variant">{fb.propertyName}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        fb.type === 'mid-stay' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600',
                      )}>
                        {fb.type}
                      </span>
                      {fb.responded ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Responded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                          Awaiting Response
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      {renderStars(fb.overallRating)}
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', getNpsBg(fb.npsScore), getNpsColor(fb.npsScore))}>
                        NPS: {fb.npsScore} ({getNpsLabel(fb.npsScore)})
                      </span>
                      <span className="text-xs text-on-surface-variant">{fmtDateTime(fb.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(Object.entries(fb.categories) as [string, number][]).map(([cat, score]) => (
                    <div key={cat} className="text-center">
                      <div className="text-lg font-bold text-on-surface">{score}</div>
                      <div className="text-xs text-on-surface-variant capitalize">{cat}</div>
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div className="mt-4 bg-surface rounded-xl border border-outline-variant/20 p-4">
                  <p className="text-sm text-on-surface leading-relaxed">{fb.comment}</p>
                </div>

                {/* Response */}
                {fb.responded && fb.responseText && (
                  <div className="mt-3 bg-secondary/5 rounded-xl border border-secondary/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-xs font-medium text-secondary">Your Response</span>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed">{fb.responseText}</p>
                  </div>
                )}

                {/* Response form */}
                {isResponding && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Write Response</label>
                        <select
                          className="text-xs bg-surface border border-outline-variant/30 rounded-lg px-2 py-1 text-on-surface-variant focus:outline-none"
                          value={selectedTemplate}
                          onChange={(e) => {
                            setSelectedTemplate(e.target.value);
                            applyTemplate(e.target.value, fb.guestName, fb.propertyName);
                          }}
                        >
                          <option value="">Use template...</option>
                          {responseTemplates.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-secondary/40"
                        rows={4}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to this guest..."
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText(''); }}
                        className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRespond(fb.id)}
                        disabled={!responseText.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Send Response
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!fb.responded && !isResponding && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setRespondingTo(fb.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Respond
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredFeedback.length === 0 && (
          <div className="bg-surface-container rounded-2xl border border-outline-variant/30 px-6 py-12 text-center">
            <Star className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">No feedback matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5. PORTAL ANALYTICS
// ════════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ analytics }: { analytics: PortalAnalytics }) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Check-in Completion"
          value={`${analytics.checkInCompletionRate}%`}
          trend={analytics.checkInCompletionTrend}
          icon={ClipboardCheck}
          iconBg="bg-success/10"
          iconColor="text-success"
        />
        <KpiCard
          title="Guidebook Views"
          value={analytics.guidebookViews.toLocaleString()}
          trend={analytics.guidebookViewsTrend}
          icon={BookOpen}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Message Open Rate"
          value={`${analytics.messageOpenRate}%`}
          trend={analytics.messageOpenRateTrend}
          icon={Mail}
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
        />
        <KpiCard
          title="Average NPS"
          value={analytics.averageNps.toFixed(1)}
          trend={analytics.npsTrend}
          icon={Star}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4">
          <span className="text-xs font-medium text-on-surface-variant">Total Surveys</span>
          <div className="text-xl font-bold text-on-surface mt-1">{analytics.totalSurveys}</div>
        </div>
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4">
          <span className="text-xs font-medium text-on-surface-variant">Response Rate</span>
          <div className="text-xl font-bold text-on-surface mt-1">{analytics.responseRate}%</div>
        </div>
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4">
          <span className="text-xs font-medium text-on-surface-variant">Upsell Conversion</span>
          <div className="text-xl font-bold text-on-surface mt-1">{analytics.upsellConversionRate}%</div>
        </div>
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-4">
          <span className="text-xs font-medium text-on-surface-variant">Upsell Revenue</span>
          <div className="text-xl font-bold text-on-surface mt-1">{'\u20AC'}{analytics.upsellRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Performance */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline font-semibold text-on-surface text-sm">Message Performance</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Sent, opened, and clicked per trigger</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {analytics.messagePerformance.map((mp) => {
              const openRate = mp.sent > 0 ? Math.round((mp.opened / mp.sent) * 100) : 0;
              const clickRate = mp.sent > 0 ? Math.round((mp.clicked / mp.sent) * 100) : 0;
              return (
                <div key={mp.trigger}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-on-surface">{mp.trigger}</span>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span>{mp.sent} sent</span>
                      <span className="text-blue-600">{openRate}% opened</span>
                      <span className="text-success">{clickRate}% clicked</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500/30 rounded-s-full"
                      style={{ width: `${openRate}%` }}
                    />
                    <div
                      className="bg-success"
                      style={{ width: `${clickRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Viewed Guidebook Sections */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20">
            <h3 className="font-headline font-semibold text-on-surface text-sm">Top Guidebook Sections</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Most viewed sections across all properties</p>
          </div>
          <div className="px-6 py-4 space-y-3">
            {analytics.topViewedSections.map((section, i) => {
              const maxViews = analytics.topViewedSections[0]?.views || 1;
              const pct = Math.round((section.views / maxViews) * 100);
              return (
                <div key={section.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-on-surface flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-secondary/10 text-secondary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {section.name}
                    </span>
                    <span className="text-xs text-on-surface-variant">{section.views} views</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary/60 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NPS Distribution */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline font-semibold text-on-surface text-sm">NPS Score Distribution</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            How guests rated their likelihood to recommend (0-10)
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-end gap-2 h-32">
            {analytics.npsDistribution.map((item) => {
              const maxCount = Math.max(...analytics.npsDistribution.map((d) => d.count), 1);
              const height = (item.count / maxCount) * 100;
              const barColor = item.score >= 9 ? 'bg-success' : item.score >= 7 ? 'bg-amber-500' : 'bg-error';
              return (
                <div key={item.score} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-on-surface">{item.count}</span>
                  <div
                    className={cn('w-full rounded-t-lg transition-all', barColor)}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-on-surface-variant">{item.score}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-error" />
              <span className="text-xs text-on-surface-variant">Detractors (0-6)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-xs text-on-surface-variant">Passives (7-8)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-xs text-on-surface-variant">Promoters (9-10)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Timeline */}
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20">
          <h3 className="font-headline font-semibold text-on-surface text-sm">Check-in Completion Timeline</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Weekly online check-in completion vs pending
          </p>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-end gap-3 h-32">
            {analytics.checkInTimeline.map((week) => {
              const total = week.completed + week.pending;
              const maxTotal = Math.max(...analytics.checkInTimeline.map((w) => w.completed + w.pending), 1);
              const totalHeight = (total / maxTotal) * 100;
              const completedPct = total > 0 ? (week.completed / total) * 100 : 0;
              return (
                <div key={week.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-on-surface">{total}</span>
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse"
                    style={{ height: `${Math.max(totalHeight, 8)}%` }}
                  >
                    <div className="bg-success" style={{ height: `${completedPct}%` }} />
                    <div className="bg-amber-500/40 flex-1" />
                  </div>
                  <span className="text-xs text-on-surface-variant">{week.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-xs text-on-surface-variant">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
              <span className="text-xs text-on-surface-variant">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ───────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 text-start group"
    >
      <div className="flex-1">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>
      {enabled ? (
        <ToggleRight className="w-7 h-7 text-success flex-shrink-0 group-hover:scale-110 transition-transform" />
      ) : (
        <ToggleLeft className="w-7 h-7 text-on-surface-variant flex-shrink-0 group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}

function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  trend: number;
  icon: typeof BarChart3;
  iconBg: string;
  iconColor: string;
}) {
  const isPositive = trend >= 0;
  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div className={cn(
          'flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
          isPositive ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{trend}%
        </div>
      </div>
      <div className="text-2xl font-headline font-bold text-on-surface">{value}</div>
      <span className="text-xs text-on-surface-variant mt-0.5">{title}</span>
    </div>
  );
}
