import { ApiError } from '../../utils/api-error';
import { randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export interface CheckInForm {
  id: string;
  propertyId: string;
  bookingId?: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED';
  arrivalTime?: string;
  numberOfGuests: number;
  idDocument?: {
    type: string;
    number: string;
    expiryDate?: string;
    frontUrl?: string;
    backUrl?: string;
  };
  specialRequests?: string;
  emergencyContact?: { name: string; phone: string; relation: string };
  vehicleInfo?: { plateNumber: string; model: string };
  agreements: {
    termsAccepted: boolean;
    houseRulesAccepted: boolean;
    privacyAccepted: boolean;
    signedAt?: string;
  };
  submittedAt?: string;
  verifiedAt?: string;
  verifiedById?: string;
  createdAt: Date;
}

export interface GuidebookSection {
  title: string;
  icon: string;
  content: string;
  images?: string[];
}

export interface NearbyPlace {
  name: string;
  category:
    | 'RESTAURANT'
    | 'BEACH'
    | 'SUPERMARKET'
    | 'PHARMACY'
    | 'HOSPITAL'
    | 'ATM'
    | 'GAS_STATION'
    | 'ATTRACTION';
  distance: string;
  description?: string;
  mapUrl?: string;
}

export interface PropertyGuidebook {
  id: string;
  propertyId: string;
  welcomeMessage: { en: string; he?: string };
  sections: GuidebookSection[];
  houseRules: string[];
  checkInInstructions: string;
  checkOutInstructions: string;
  wifiName: string;
  wifiPassword: string;
  emergencyNumbers: {
    police: string;
    ambulance: string;
    fire: string;
    manager: string;
  };
  nearbyPlaces: NearbyPlace[];
  transportInfo: string;
  isPublished: boolean;
  updatedAt: Date;
}

export interface GuestContract {
  id: string;
  propertyId: string;
  bookingId: string;
  guestName: string;
  contractType:
    | 'RENTAL_AGREEMENT'
    | 'DAMAGE_WAIVER'
    | 'HOUSE_RULES'
    | 'CANCELLATION_POLICY';
  templateContent: string;
  signedContent?: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED';
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signatureData?: string;
  expiresAt?: string;
  createdAt: Date;
}

export interface Upsell {
  id: string;
  propertyId?: string;
  name: string;
  description: string;
  category:
    | 'EARLY_CHECKIN'
    | 'LATE_CHECKOUT'
    | 'AIRPORT_TRANSFER'
    | 'CLEANING'
    | 'BREAKFAST'
    | 'TOUR'
    | 'EQUIPMENT'
    | 'PET_FEE'
    | 'BABY_PACKAGE'
    | 'CUSTOM';
  price: number;
  currency: string;
  isPerNight: boolean;
  isPerGuest: boolean;
  isActive: boolean;
  imageUrl?: string;
  maxQuantity: number;
  availability: 'ALWAYS' | 'PRE_ARRIVAL' | 'DURING_STAY';
}

export interface UpsellOrder {
  id: string;
  bookingId: string;
  upsellId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
}

export interface CheckInFilters {
  status?: string;
  propertyId?: string;
  search?: string;
}

export interface ContractFilters {
  status?: string;
  propertyId?: string;
  bookingId?: string;
  contractType?: string;
}

// ── Seed data ───────────────────────────────────────────────────────────────

const seedCheckInForms: CheckInForm[] = [
  {
    id: randomUUID(),
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-001',
    guestId: 'guest-001',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    status: 'SUBMITTED',
    arrivalTime: '15:00',
    numberOfGuests: 4,
    idDocument: {
      type: 'PASSPORT',
      number: 'GR12345678',
      expiryDate: '2028-06-15',
    },
    specialRequests: 'Late checkout if possible, baby crib needed',
    emergencyContact: {
      name: 'Nikos Papadopoulos',
      phone: '+30 694 123 4567',
      relation: 'Spouse',
    },
    vehicleInfo: { plateNumber: 'AXY-1234', model: 'Toyota Yaris' },
    agreements: {
      termsAccepted: true,
      houseRulesAccepted: true,
      privacyAccepted: true,
      signedAt: '2026-04-08T10:30:00Z',
    },
    submittedAt: '2026-04-08T10:30:00Z',
    createdAt: new Date('2026-04-05'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-chania-old-town',
    bookingId: 'booking-002',
    guestId: 'guest-002',
    guestName: 'James Richardson',
    guestEmail: 'james.r@outlook.com',
    status: 'PENDING',
    numberOfGuests: 2,
    agreements: {
      termsAccepted: false,
      houseRulesAccepted: false,
      privacyAccepted: false,
    },
    createdAt: new Date('2026-04-09'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-003',
    guestId: 'guest-003',
    guestName: 'Elena Volkov',
    guestEmail: 'elena.v@mail.ru',
    status: 'VERIFIED',
    arrivalTime: '14:00',
    numberOfGuests: 3,
    idDocument: {
      type: 'PASSPORT',
      number: 'RU98765432',
      expiryDate: '2027-11-20',
    },
    emergencyContact: {
      name: 'Dmitri Volkov',
      phone: '+7 495 123 4567',
      relation: 'Brother',
    },
    agreements: {
      termsAccepted: true,
      houseRulesAccepted: true,
      privacyAccepted: true,
      signedAt: '2026-04-02T09:15:00Z',
    },
    submittedAt: '2026-04-02T09:15:00Z',
    verifiedAt: '2026-04-02T11:00:00Z',
    verifiedById: 'admin-001',
    createdAt: new Date('2026-04-01'),
  },
];

const seedGuidebooks: PropertyGuidebook[] = [
  {
    id: randomUUID(),
    propertyId: 'prop-aegean-sunset',
    welcomeMessage: {
      en: 'Welcome to Aegean Sunset Villa! We are thrilled to have you. This stunning beachfront property is your home away from home. Enjoy breathtaking sunsets, crystal-clear waters, and the warm hospitality of Crete.',
      he: '\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD \u05DC\u05D5\u05D9\u05DC\u05D4 \u05E9\u05E7\u05D9\u05E2\u05EA \u05D4\u05D0\u05D2\u05D0\u05D9! \u05D0\u05E0\u05D7\u05E0\u05D5 \u05E9\u05DE\u05D7\u05D9\u05DD \u05DC\u05D0\u05E8\u05D7 \u05D0\u05EA\u05DB\u05DD. \u05EA\u05D4\u05E0\u05D5 \u05DE\u05E9\u05E7\u05D9\u05E2\u05D5\u05EA \u05E2\u05D5\u05E6\u05E8\u05D5\u05EA \u05E0\u05E9\u05D9\u05DE\u05D4, \u05DE\u05D9\u05DD \u05E6\u05DC\u05D5\u05DC\u05D9\u05DD \u05D5\u05D4\u05DB\u05E0\u05E1\u05EA \u05D0\u05D5\u05E8\u05D7\u05D9\u05DD \u05D7\u05DE\u05D4 \u05E9\u05DC \u05DB\u05E8\u05EA\u05D9\u05DD.',
    },
    sections: [
      {
        title: 'Kitchen & Appliances',
        icon: 'utensils',
        content:
          'The fully equipped kitchen includes a dishwasher, microwave, oven, coffee machine (Nespresso capsules provided), toaster, and all cooking essentials. Extra capsules are available at the local supermarket.',
      },
      {
        title: 'Pool & Outdoor',
        icon: 'waves',
        content:
          'The infinity pool is available 24/7. Please shower before entering. Pool towels are provided on the loungers. The BBQ area includes a gas grill - please clean after use.',
      },
      {
        title: 'Entertainment',
        icon: 'tv',
        content:
          'Smart TV with Netflix, YouTube, and local channels. Bluetooth speaker in the living room. Board games and books available in the cabinet.',
      },
    ],
    houseRules: [
      'No smoking inside the property',
      'Quiet hours: 23:00 - 08:00',
      'Maximum occupancy: 8 guests',
      'No parties or events without prior approval',
      'Pets allowed with prior notice (extra fee applies)',
      'Please conserve water - Crete has limited water resources',
    ],
    checkInInstructions:
      'Check-in time is 15:00. A lockbox is located next to the main entrance. Your code will be sent 24 hours before arrival. Free parking is available in the driveway.',
    checkOutInstructions:
      'Check-out time is 11:00. Please leave keys on the kitchen counter, take out trash, turn off AC units, and close all windows and doors.',
    wifiName: 'AegeanSunset_Guest',
    wifiPassword: 'Welcome2Crete!',
    emergencyNumbers: {
      police: '100',
      ambulance: '166',
      fire: '199',
      manager: '+30 694 555 1234',
    },
    nearbyPlaces: [
      {
        name: 'Taverna Knossos',
        category: 'RESTAURANT',
        distance: '200m',
        description: 'Excellent traditional Cretan cuisine. Try the lamb kleftiko!',
      },
      {
        name: 'Elounda Beach',
        category: 'BEACH',
        distance: '50m',
        description: 'Sandy beach with crystal clear water. Sun beds available.',
      },
      {
        name: 'Carrefour Express',
        category: 'SUPERMARKET',
        distance: '500m',
        description: 'Open daily 08:00-22:00. Basic groceries and essentials.',
      },
      {
        name: 'Elounda Pharmacy',
        category: 'PHARMACY',
        distance: '800m',
        description: 'Open Mon-Fri 08:30-14:30, emergencies: call +30 694 111 2222',
      },
      {
        name: 'Spinalonga Island',
        category: 'ATTRACTION',
        distance: '4km (by boat)',
        description:
          'Historic Venetian fortress and former leper colony. Boat trips daily from Elounda port.',
      },
    ],
    transportInfo:
      'Nearest airport: Heraklion (HER) - 65km, ~1 hour drive. Car rental recommended. Local buses available from Elounda square (limited schedule). Taxi from airport: approximately 80 EUR.',
    isPublished: true,
    updatedAt: new Date('2026-04-05'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-chania-old-town',
    welcomeMessage: {
      en: 'Welcome to our charming apartment in the heart of Chania Old Town! Step outside and explore the Venetian harbor, colorful streets, and vibrant tavernas just steps from your door.',
    },
    sections: [
      {
        title: 'Getting Around',
        icon: 'map',
        content:
          'The Old Town is best explored on foot. Our apartment is centrally located - the harbor is 3 minutes walk, the market is 5 minutes. For day trips, car rental can be arranged.',
      },
      {
        title: 'Kitchen Basics',
        icon: 'utensils',
        content:
          'The kitchenette has a mini fridge, two-burner stove, microwave, kettle, and toaster. Coffee and tea are complimentary. Local olive oil is in the cabinet.',
      },
    ],
    houseRules: [
      'No smoking inside',
      'Quiet hours: 22:00 - 08:00 (residential area)',
      'Maximum 4 guests',
      'No shoes inside please',
      'Please separate recycling',
    ],
    checkInInstructions:
      'Check-in from 14:00. We will meet you at the apartment for a personal welcome and walkthrough. The address is 15 Zambeliou Street - look for the blue door!',
    checkOutInstructions:
      'Check-out by 10:30. Leave keys on the table. Strip the beds if you can - much appreciated!',
    wifiName: 'ChaniaOldTown_WiFi',
    wifiPassword: 'Kalimera2026',
    emergencyNumbers: {
      police: '100',
      ambulance: '166',
      fire: '199',
      manager: '+30 694 555 5678',
    },
    nearbyPlaces: [
      {
        name: 'Venetian Harbor',
        category: 'ATTRACTION',
        distance: '150m',
        description: 'The iconic lighthouse and waterfront promenade.',
      },
      {
        name: 'Tamam Restaurant',
        category: 'RESTAURANT',
        distance: '100m',
        description: 'Award-winning restaurant in a former Turkish bathhouse.',
      },
      {
        name: 'Nea Agora Market',
        category: 'SUPERMARKET',
        distance: '300m',
        description: 'Indoor market with fresh produce, cheese, and local products.',
      },
      {
        name: 'Nea Chora Beach',
        category: 'BEACH',
        distance: '800m',
        description: 'Small city beach with a relaxed vibe and waterfront cafes.',
      },
    ],
    transportInfo:
      'Chania airport (CHQ) is 15km away, ~20 min drive. Bus station is 1km walk. Taxis available at Plateia 1866. Airport taxi: approximately 25 EUR.',
    isPublished: false,
    updatedAt: new Date('2026-04-03'),
  },
];

const seedContracts: GuestContract[] = [
  {
    id: randomUUID(),
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-001',
    guestName: 'Maria Papadopoulos',
    contractType: 'RENTAL_AGREEMENT',
    templateContent: `HOLIDAY RENTAL AGREEMENT

This agreement is entered into between Sivan Management ("Host") and {{guestName}} ("Guest").

Property: {{propertyName}}
Check-in: {{checkIn}}
Check-out: {{checkOut}}
Total Amount: {{totalAmount}} {{currency}}

The Guest agrees to abide by all house rules and terms of this agreement.

Signed: ___________________________
Date: {{signDate}}`,
    signedContent: `HOLIDAY RENTAL AGREEMENT

This agreement is entered into between Sivan Management ("Host") and Maria Papadopoulos ("Guest").

Property: Aegean Sunset Villa
Check-in: 2026-04-10
Check-out: 2026-04-17
Total Amount: 2,450 EUR

The Guest agrees to abide by all house rules and terms of this agreement.

Signed: Maria Papadopoulos
Date: 2026-04-08`,
    status: 'SIGNED',
    sentAt: '2026-04-06T09:00:00Z',
    viewedAt: '2026-04-07T14:30:00Z',
    signedAt: '2026-04-08T10:15:00Z',
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    createdAt: new Date('2026-04-05'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-chania-old-town',
    bookingId: 'booking-002',
    guestName: 'James Richardson',
    contractType: 'RENTAL_AGREEMENT',
    templateContent: `HOLIDAY RENTAL AGREEMENT

This agreement is entered into between Sivan Management ("Host") and {{guestName}} ("Guest").

Property: {{propertyName}}
Check-in: {{checkIn}}
Check-out: {{checkOut}}
Total Amount: {{totalAmount}} {{currency}}

The Guest agrees to abide by all house rules and terms of this agreement.

Signed: ___________________________
Date: {{signDate}}`,
    status: 'SENT',
    sentAt: '2026-04-09T11:00:00Z',
    viewedAt: '2026-04-09T15:22:00Z',
    expiresAt: '2026-04-16T11:00:00Z',
    createdAt: new Date('2026-04-09'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-aegean-sunset',
    bookingId: 'booking-003',
    guestName: 'Elena Volkov',
    contractType: 'DAMAGE_WAIVER',
    templateContent: `DAMAGE WAIVER AGREEMENT

Guest: {{guestName}}
Property: {{propertyName}}
Stay Dates: {{checkIn}} to {{checkOut}}

By signing this waiver, the Guest agrees to a non-refundable damage waiver fee of 50 EUR, which covers accidental damages up to 500 EUR during the stay.

Damages exceeding 500 EUR will be charged to the Guest's payment method on file.

Signed: ___________________________
Date: {{signDate}}`,
    status: 'DRAFT',
    createdAt: new Date('2026-04-10'),
  },
];

const seedUpsells: Upsell[] = [
  {
    id: randomUUID(),
    name: 'Early Check-in',
    description:
      'Arrive as early as 11:00 AM instead of the standard 15:00 check-in time. Subject to availability.',
    category: 'EARLY_CHECKIN',
    price: 25,
    currency: 'EUR',
    isPerNight: false,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 1,
    availability: 'PRE_ARRIVAL',
  },
  {
    id: randomUUID(),
    name: 'Late Checkout',
    description:
      'Enjoy your last morning - check out at 14:00 instead of 11:00. Subject to availability.',
    category: 'LATE_CHECKOUT',
    price: 30,
    currency: 'EUR',
    isPerNight: false,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 1,
    availability: 'DURING_STAY',
  },
  {
    id: randomUUID(),
    name: 'Airport Transfer',
    description:
      'Private transfer from Heraklion airport (HER) to the property. Air-conditioned vehicle, meet & greet at arrivals.',
    category: 'AIRPORT_TRANSFER',
    price: 45,
    currency: 'EUR',
    isPerNight: false,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 2,
    availability: 'PRE_ARRIVAL',
  },
  {
    id: randomUUID(),
    name: 'Breakfast Basket',
    description:
      'Fresh local breakfast delivered to your door: bread, cheese, eggs, fruit, yogurt, honey, and coffee.',
    category: 'BREAKFAST',
    price: 18,
    currency: 'EUR',
    isPerNight: true,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 14,
    availability: 'ALWAYS',
  },
  {
    id: randomUUID(),
    name: 'Bike Rental',
    description:
      'Explore the area on two wheels! Includes helmet, lock, and local route map.',
    category: 'EQUIPMENT',
    price: 15,
    currency: 'EUR',
    isPerNight: true,
    isPerGuest: true,
    isActive: true,
    maxQuantity: 4,
    availability: 'ALWAYS',
  },
  {
    id: randomUUID(),
    name: 'Spinalonga Boat Tour',
    description:
      'Full-day guided boat tour to Spinalonga Island, including BBQ lunch on board and swimming stops.',
    category: 'TOUR',
    price: 65,
    currency: 'EUR',
    isPerNight: false,
    isPerGuest: true,
    isActive: true,
    maxQuantity: 8,
    availability: 'DURING_STAY',
  },
  {
    id: randomUUID(),
    name: 'Baby Package',
    description:
      'Everything for your little one: crib, high chair, baby bath, stroller, and baby-proofing kit.',
    category: 'BABY_PACKAGE',
    price: 20,
    currency: 'EUR',
    isPerNight: false,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 2,
    availability: 'PRE_ARRIVAL',
  },
  {
    id: randomUUID(),
    name: 'Pet Fee',
    description:
      'Bring your furry friend! Includes pet bed, bowls, and a welcome treat. Extra cleaning included.',
    category: 'PET_FEE',
    price: 10,
    currency: 'EUR',
    isPerNight: true,
    isPerGuest: false,
    isActive: true,
    maxQuantity: 2,
    availability: 'PRE_ARRIVAL',
  },
];

const seedUpsellOrders: UpsellOrder[] = [
  {
    id: randomUUID(),
    bookingId: 'booking-001',
    upsellId: seedUpsells[0].id,
    quantity: 1,
    totalPrice: 25,
    status: 'CONFIRMED',
    createdAt: new Date('2026-04-07'),
  },
  {
    id: randomUUID(),
    bookingId: 'booking-001',
    upsellId: seedUpsells[2].id,
    quantity: 1,
    totalPrice: 45,
    status: 'CONFIRMED',
    notes: 'Flight arrives at 12:30, Aegean Airlines A3 301',
    createdAt: new Date('2026-04-06'),
  },
  {
    id: randomUUID(),
    bookingId: 'booking-001',
    upsellId: seedUpsells[3].id,
    quantity: 7,
    totalPrice: 126,
    status: 'PENDING',
    createdAt: new Date('2026-04-08'),
  },
];

// ── Service ─────────────────────────────────────────────────────────────────

export class GuestExperienceService {
  private checkInForms: CheckInForm[] = [...seedCheckInForms];
  private guidebooks: PropertyGuidebook[] = [...seedGuidebooks];
  private contracts: GuestContract[] = [...seedContracts];
  private upsells: Upsell[] = [...seedUpsells];
  private upsellOrders: UpsellOrder[] = [...seedUpsellOrders];

  // ── Check-in Forms ──────────────────────────────────────────────────────

  async getCheckInForms(filters: CheckInFilters): Promise<CheckInForm[]> {
    let results = [...this.checkInForms];

    if (filters.status) {
      results = results.filter((f) => f.status === filters.status);
    }
    if (filters.propertyId) {
      results = results.filter((f) => f.propertyId === filters.propertyId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (f) =>
          f.guestName.toLowerCase().includes(s) ||
          f.guestEmail.toLowerCase().includes(s),
      );
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getCheckInForm(id: string): Promise<CheckInForm> {
    const form = this.checkInForms.find((f) => f.id === id);
    if (!form) {
      throw ApiError.notFound('CheckInForm');
    }
    return form;
  }

  async createCheckInForm(bookingId: string): Promise<CheckInForm> {
    const form: CheckInForm = {
      id: randomUUID(),
      propertyId: 'prop-aegean-sunset',
      bookingId,
      guestName: 'New Guest',
      guestEmail: 'guest@example.com',
      status: 'PENDING',
      numberOfGuests: 1,
      agreements: {
        termsAccepted: false,
        houseRulesAccepted: false,
        privacyAccepted: false,
      },
      createdAt: new Date(),
    };
    this.checkInForms.push(form);
    return form;
  }

  async submitCheckInForm(
    id: string,
    data: Partial<CheckInForm>,
  ): Promise<CheckInForm> {
    const idx = this.checkInForms.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw ApiError.notFound('CheckInForm');
    }

    this.checkInForms[idx] = {
      ...this.checkInForms[idx],
      ...data,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      agreements: {
        ...this.checkInForms[idx].agreements,
        ...(data.agreements || {}),
        signedAt: new Date().toISOString(),
      },
    };
    return this.checkInForms[idx];
  }

  async verifyCheckInForm(
    id: string,
    userId: string,
  ): Promise<CheckInForm> {
    const idx = this.checkInForms.findIndex((f) => f.id === id);
    if (idx === -1) {
      throw ApiError.notFound('CheckInForm');
    }

    if (this.checkInForms[idx].status !== 'SUBMITTED') {
      throw ApiError.badRequest(
        'Only submitted forms can be verified',
        'INVALID_STATUS',
      );
    }

    this.checkInForms[idx] = {
      ...this.checkInForms[idx],
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedById: userId,
    };
    return this.checkInForms[idx];
  }

  async getCheckInFormByBooking(bookingId: string): Promise<CheckInForm | null> {
    return this.checkInForms.find((f) => f.bookingId === bookingId) || null;
  }

  // ── Guidebooks ──────────────────────────────────────────────────────────

  async getGuidebook(propertyId: string): Promise<PropertyGuidebook | null> {
    return this.guidebooks.find((g) => g.propertyId === propertyId) || null;
  }

  async createGuidebook(
    data: Omit<PropertyGuidebook, 'id' | 'updatedAt'>,
  ): Promise<PropertyGuidebook> {
    const existing = this.guidebooks.find(
      (g) => g.propertyId === data.propertyId,
    );
    if (existing) {
      throw ApiError.conflict(
        'Guidebook already exists for this property',
        'GUIDEBOOK_EXISTS',
      );
    }

    const guidebook: PropertyGuidebook = {
      id: randomUUID(),
      ...data,
      updatedAt: new Date(),
    };
    this.guidebooks.push(guidebook);
    return guidebook;
  }

  async updateGuidebook(
    propertyId: string,
    data: Partial<Omit<PropertyGuidebook, 'id' | 'propertyId' | 'updatedAt'>>,
  ): Promise<PropertyGuidebook> {
    const idx = this.guidebooks.findIndex((g) => g.propertyId === propertyId);
    if (idx === -1) {
      throw ApiError.notFound('Guidebook');
    }

    this.guidebooks[idx] = {
      ...this.guidebooks[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.guidebooks[idx];
  }

  async publishGuidebook(propertyId: string): Promise<PropertyGuidebook> {
    const idx = this.guidebooks.findIndex((g) => g.propertyId === propertyId);
    if (idx === -1) {
      throw ApiError.notFound('Guidebook');
    }

    this.guidebooks[idx].isPublished = true;
    this.guidebooks[idx].updatedAt = new Date();
    return this.guidebooks[idx];
  }

  async getPublicGuidebook(
    propertyId: string,
  ): Promise<PropertyGuidebook | null> {
    const guidebook = this.guidebooks.find(
      (g) => g.propertyId === propertyId && g.isPublished,
    );
    return guidebook || null;
  }

  async getAllGuidebooks(): Promise<PropertyGuidebook[]> {
    return [...this.guidebooks];
  }

  // ── Contracts ───────────────────────────────────────────────────────────

  async getContracts(filters: ContractFilters): Promise<GuestContract[]> {
    let results = [...this.contracts];

    if (filters.status) {
      results = results.filter((c) => c.status === filters.status);
    }
    if (filters.propertyId) {
      results = results.filter((c) => c.propertyId === filters.propertyId);
    }
    if (filters.bookingId) {
      results = results.filter((c) => c.bookingId === filters.bookingId);
    }
    if (filters.contractType) {
      results = results.filter((c) => c.contractType === filters.contractType);
    }

    return results.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async createContract(
    data: Omit<GuestContract, 'id' | 'createdAt'>,
  ): Promise<GuestContract> {
    const contract: GuestContract = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.contracts.push(contract);
    return contract;
  }

  async sendContract(id: string): Promise<GuestContract> {
    const idx = this.contracts.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw ApiError.notFound('Contract');
    }

    this.contracts[idx] = {
      ...this.contracts[idx],
      status: 'SENT',
      sentAt: new Date().toISOString(),
    };
    return this.contracts[idx];
  }

  async signContract(
    id: string,
    signatureData: string,
  ): Promise<GuestContract> {
    const idx = this.contracts.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw ApiError.notFound('Contract');
    }

    if (
      this.contracts[idx].status !== 'SENT' &&
      this.contracts[idx].status !== 'VIEWED'
    ) {
      throw ApiError.badRequest(
        'Contract must be sent before signing',
        'INVALID_STATUS',
      );
    }

    this.contracts[idx] = {
      ...this.contracts[idx],
      status: 'SIGNED',
      signedAt: new Date().toISOString(),
      signatureData,
      signedContent: this.contracts[idx].templateContent,
    };
    return this.contracts[idx];
  }

  async getContractByBooking(bookingId: string): Promise<GuestContract[]> {
    return this.contracts.filter((c) => c.bookingId === bookingId);
  }

  // ── Upsells ─────────────────────────────────────────────────────────────

  async getUpsells(propertyId?: string): Promise<Upsell[]> {
    if (propertyId) {
      return this.upsells.filter(
        (u) => !u.propertyId || u.propertyId === propertyId,
      );
    }
    return [...this.upsells];
  }

  async createUpsell(data: Omit<Upsell, 'id'>): Promise<Upsell> {
    const upsell: Upsell = {
      id: randomUUID(),
      ...data,
    };
    this.upsells.push(upsell);
    return upsell;
  }

  async updateUpsell(
    id: string,
    data: Partial<Omit<Upsell, 'id'>>,
  ): Promise<Upsell> {
    const idx = this.upsells.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('Upsell');
    }

    this.upsells[idx] = { ...this.upsells[idx], ...data };
    return this.upsells[idx];
  }

  async deleteUpsell(id: string): Promise<{ message: string }> {
    const idx = this.upsells.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('Upsell');
    }
    this.upsells.splice(idx, 1);
    return { message: 'Upsell deleted successfully' };
  }

  async orderUpsell(
    bookingId: string,
    upsellId: string,
    quantity: number,
    notes?: string,
  ): Promise<UpsellOrder> {
    const upsell = this.upsells.find((u) => u.id === upsellId);
    if (!upsell) {
      throw ApiError.notFound('Upsell');
    }

    if (!upsell.isActive) {
      throw ApiError.badRequest('Upsell is not active', 'UPSELL_INACTIVE');
    }

    if (quantity > upsell.maxQuantity) {
      throw ApiError.badRequest(
        `Maximum quantity is ${upsell.maxQuantity}`,
        'MAX_QUANTITY_EXCEEDED',
      );
    }

    const order: UpsellOrder = {
      id: randomUUID(),
      bookingId,
      upsellId,
      quantity,
      totalPrice: upsell.price * quantity,
      status: 'PENDING',
      notes,
      createdAt: new Date(),
    };
    this.upsellOrders.push(order);
    return order;
  }

  async getUpsellOrders(bookingId: string): Promise<UpsellOrder[]> {
    return this.upsellOrders
      .filter((o) => o.bookingId === bookingId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const guestExperienceService = new GuestExperienceService();
