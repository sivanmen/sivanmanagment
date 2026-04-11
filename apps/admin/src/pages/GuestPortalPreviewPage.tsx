import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wifi,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ShoppingBag,
  MessageCircle,
  Sun,
  Coffee,
  Bike,
  Ship,
  Baby,
  Car,
  Clock,
  Home,
  AlertTriangle,
} from 'lucide-react';

// ── Demo data ───────────────────────────────────────────────────────────────

const guestData = {
  guestName: 'Maria',
  propertyName: 'Aegean Sunset Villa',
  checkIn: 'April 10, 2026',
  checkOut: 'April 17, 2026',
  nights: 7,
  guests: 4,
};

const guidebookSections = [
  { title: 'Kitchen & Appliances', icon: 'utensils', content: 'Fully equipped kitchen with Nespresso, dishwasher, oven, microwave. Extra capsules at local supermarket.' },
  { title: 'Pool & Outdoor', icon: 'waves', content: 'Infinity pool open 24/7. Please shower before entering. Pool towels on loungers. Gas BBQ - clean after use.' },
  { title: 'Entertainment', icon: 'tv', content: 'Smart TV with Netflix and YouTube. Bluetooth speaker in living room. Board games in the cabinet.' },
];

const houseRules = [
  'No smoking inside the property',
  'Quiet hours: 23:00 - 08:00',
  'Maximum occupancy: 8 guests',
  'Pets allowed with prior notice',
];

const nearbyPlaces = [
  { name: 'Taverna Knossos', category: 'Restaurant', distance: '200m' },
  { name: 'Elounda Beach', category: 'Beach', distance: '50m' },
  { name: 'Carrefour Express', category: 'Market', distance: '500m' },
  { name: 'Spinalonga Island', category: 'Attraction', distance: '4km' },
];

const upsellItems = [
  { name: 'Early Check-in', price: 25, icon: Clock, desc: 'Arrive at 11:00 AM' },
  { name: 'Airport Transfer', price: 45, icon: Car, desc: 'Private transfer from HER' },
  { name: 'Breakfast Basket', price: 18, icon: Coffee, desc: 'Fresh local breakfast daily', perNight: true },
  { name: 'Bike Rental', price: 15, icon: Bike, desc: 'Includes helmet & map', perNight: true },
  { name: 'Boat Tour', price: 65, icon: Ship, desc: 'Spinalonga full-day tour', perGuest: true },
  { name: 'Baby Package', price: 20, icon: Baby, desc: 'Crib, high chair, stroller' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function GuestPortalPreviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/guest-experience')}
          className="p-2 hover:bg-surface-container rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </button>
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            {t('guestExperience.portalPreview', 'Guest Portal Preview')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            This is how guests will see their portal on mobile devices
          </p>
        </div>
      </div>

      {/* Mobile frame */}
      <div className="flex justify-center">
        <div className="w-[375px] bg-[#0f1118] rounded-[3rem] p-3 shadow-2xl">
          {/* Phone notch */}
          <div className="bg-[#0f1118] rounded-t-[2.5rem] pt-3 pb-1 flex justify-center">
            <div className="w-28 h-6 bg-[#1a1b25] rounded-full" />
          </div>

          {/* Phone screen */}
          <div className="bg-surface rounded-[2rem] overflow-hidden h-[720px] overflow-y-auto scrollbar-thin">
            {/* Hero / Welcome */}
            <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 px-5 pt-8 pb-6">
              <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4">
                <Sun className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">
                Welcome, {guestData.guestName}!
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Your stay at {guestData.propertyName}
              </p>
            </div>

            {/* Stay details card */}
            <div className="px-5 -mt-2">
              <div className="bg-surface-container rounded-xl border border-outline-variant/20 p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-on-surface-variant block">Check-in</span>
                    <span className="font-medium text-on-surface">{guestData.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block">Check-out</span>
                    <span className="font-medium text-on-surface">{guestData.checkOut}</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block">Nights</span>
                    <span className="font-medium text-on-surface">{guestData.nights}</span>
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant block">Guests</span>
                    <span className="font-medium text-on-surface">{guestData.guests}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in CTA */}
            <div className="px-5 mt-4">
              <button className="w-full flex items-center gap-3 bg-secondary text-on-secondary rounded-xl px-4 py-3 hover:bg-secondary/90 transition-colors">
                <ClipboardCheck className="w-5 h-5" />
                <div className="text-start">
                  <span className="block text-sm font-medium">Complete Online Check-in</span>
                  <span className="block text-xs opacity-80">Fill out your details before arrival</span>
                </div>
                <ChevronRight className="w-4 h-4 ms-auto" />
              </button>
            </div>

            {/* WiFi Card */}
            <div className="px-5 mt-4">
              <div className="bg-surface-container rounded-xl border border-outline-variant/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-on-surface-variant block">WiFi Network</span>
                    <span className="text-sm font-medium text-on-surface">AegeanSunset_Guest</span>
                  </div>
                  <div className="text-end">
                    <span className="text-xs text-on-surface-variant block">Password</span>
                    <span className="text-sm font-mono font-medium text-on-surface">Welcome2Crete!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidebook sections */}
            <div className="px-5 mt-4">
              <h3 className="text-sm font-medium text-on-surface mb-2">Property Guide</h3>
              <div className="space-y-2">
                {guidebookSections.map((section, i) => (
                  <div key={i} className="bg-surface-container rounded-xl border border-outline-variant/20 overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-start"
                    >
                      <span className="text-sm font-medium text-on-surface">{section.title}</span>
                      {expandedSection === i ? (
                        <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </button>
                    {expandedSection === i && (
                      <div className="px-4 pb-3">
                        <p className="text-xs text-on-surface-variant leading-relaxed">{section.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="px-5 mt-4">
              <button
                onClick={() => setShowRules(!showRules)}
                className="w-full flex items-center justify-between bg-surface-container rounded-xl border border-outline-variant/20 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface">House Rules</span>
                </div>
                {showRules ? (
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                )}
              </button>
              {showRules && (
                <div className="mt-2 bg-surface-container rounded-xl border border-outline-variant/20 p-4">
                  <ul className="space-y-2">
                    {houseRules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                        <span className="text-on-surface-variant/50 mt-0.5">{i + 1}.</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upsells */}
            <div className="px-5 mt-4">
              <h3 className="text-sm font-medium text-on-surface mb-2">Enhance Your Stay</h3>
              <div className="grid grid-cols-2 gap-2">
                {upsellItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="bg-surface-container rounded-xl border border-outline-variant/20 p-3 hover:border-secondary/40 transition-colors cursor-pointer"
                    >
                      <Icon className="w-5 h-5 text-secondary mb-2" />
                      <h4 className="text-xs font-medium text-on-surface">{item.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1">{item.desc}</p>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-sm font-bold text-on-surface">{'\u20AC'}{item.price}</span>
                        <button className="text-[10px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nearby Places */}
            <div className="px-5 mt-4">
              <button
                onClick={() => setShowNearby(!showNearby)}
                className="w-full flex items-center justify-between bg-surface-container rounded-xl border border-outline-variant/20 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface">Nearby Places</span>
                </div>
                {showNearby ? (
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                )}
              </button>
              {showNearby && (
                <div className="mt-2 space-y-1">
                  {nearbyPlaces.map((place, i) => (
                    <div key={i} className="flex items-center justify-between bg-surface-container rounded-lg border border-outline-variant/20 px-4 py-2.5">
                      <div>
                        <span className="text-xs font-medium text-on-surface">{place.name}</span>
                        <span className="text-[10px] text-on-surface-variant block">{place.category}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{place.distance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency numbers */}
            <div className="px-5 mt-4">
              <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  <span className="text-xs font-medium text-error">Emergency Numbers</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-on-surface-variant">Police:</span> <span className="font-medium text-on-surface">100</span></div>
                  <div><span className="text-on-surface-variant">Ambulance:</span> <span className="font-medium text-on-surface">166</span></div>
                  <div><span className="text-on-surface-variant">Fire:</span> <span className="font-medium text-on-surface">199</span></div>
                  <div><span className="text-on-surface-variant">Manager:</span> <span className="font-medium text-on-surface">+30 694 555 1234</span></div>
                </div>
              </div>
            </div>

            {/* Contact Manager */}
            <div className="px-5 mt-4 pb-8">
              <button className="w-full flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 hover:bg-surface-container-high transition-colors">
                <MessageCircle className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-on-surface">Contact Your Host</span>
              </button>
            </div>
          </div>

          {/* Phone bottom bar */}
          <div className="bg-[#0f1118] rounded-b-[2.5rem] pt-1 pb-3 flex justify-center">
            <div className="w-32 h-1 bg-[#2a2b35] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
