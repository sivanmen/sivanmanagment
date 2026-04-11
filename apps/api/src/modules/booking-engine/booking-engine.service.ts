import { ApiError } from '../../utils/api-error';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookingPromotion {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minNights?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
}

interface BookingEngineConfig {
  id: string;
  propertyId: string;
  isEnabled: boolean;
  widgetSettings: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
    customCss?: string;
    showReviews: boolean;
    showAmenities: boolean;
    showMap: boolean;
    maxGuestsDefault: number;
    instantBooking: boolean;
    requireDeposit: boolean;
    depositPercent: number;
  };
  seoSettings: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  policies: {
    cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'SUPER_STRICT';
    cancellationDays: number;
    refundPercent: number;
    petPolicy: string;
    smokingPolicy: string;
    partyPolicy: string;
    childrenPolicy: string;
  };
  paymentMethods: ('CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE')[];
  promotions: BookingPromotion[];
  createdAt: Date;
  updatedAt: Date;
}

interface AvailabilityResult {
  propertyId: string;
  dates: { date: string; available: boolean; price: number; minStay: number }[];
}

interface BookingQuote {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  discount: number;
  promotionCode?: string;
  taxes: number;
  total: number;
  depositRequired: number;
  cancellationPolicy: string;
}

interface DirectBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    nationality?: string;
  };
  promotionCode?: string;
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE';
  specialRequests?: string;
}

interface DirectBooking {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  guestInfo: DirectBookingInput['guestInfo'];
  quote: BookingQuote;
  paymentMethod: string;
  specialRequests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
}

interface PropertyPublicInfo {
  id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  nightlyRate: number;
  cleaningFee: number;
  currency: string;
  rating: number;
  reviewCount: number;
  coordinates?: { lat: number; lng: number };
}

interface SearchFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

// ─── In-memory stores ────────────────────────────────────────────────────────

const configs: Map<string, BookingEngineConfig> = new Map();
const directBookings: Map<string, DirectBooking> = new Map();

// ─── Demo property data (public facing) ──────────────────────────────────────

const propertyPublicData: Map<string, PropertyPublicInfo> = new Map();

const demoProperties: PropertyPublicInfo[] = [
  {
    id: 'prop_santorini_001',
    name: 'Santorini Sunset Villa',
    description: 'Stunning caldera-view villa in Oia with private infinity pool, traditional Cycladic architecture, and breathtaking sunset views. Perfect for couples and families seeking a luxury Greek island escape.',
    city: 'Santorini',
    country: 'Greece',
    propertyType: 'VILLA',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['pool', 'wifi', 'air_conditioning', 'kitchen', 'parking', 'sea_view', 'bbq', 'washer', 'dryer', 'balcony'],
    images: [
      'https://images.example.com/santorini-villa-1.jpg',
      'https://images.example.com/santorini-villa-2.jpg',
      'https://images.example.com/santorini-villa-3.jpg',
      'https://images.example.com/santorini-villa-pool.jpg',
    ],
    nightlyRate: 280,
    cleaningFee: 85,
    currency: 'EUR',
    rating: 4.9,
    reviewCount: 127,
    coordinates: { lat: 36.4618, lng: 25.3753 },
  },
  {
    id: 'prop_mykonos_002',
    name: 'Mykonos Beachfront Suite',
    description: 'Modern beachfront suite steps from Platis Gialos beach with designer interiors, private terrace, and stunning Aegean views. Walking distance to beach bars and restaurants.',
    city: 'Mykonos',
    country: 'Greece',
    propertyType: 'APARTMENT',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['wifi', 'air_conditioning', 'kitchen', 'sea_view', 'balcony', 'beach_access', 'washer'],
    images: [
      'https://images.example.com/mykonos-suite-1.jpg',
      'https://images.example.com/mykonos-suite-2.jpg',
      'https://images.example.com/mykonos-suite-terrace.jpg',
    ],
    nightlyRate: 220,
    cleaningFee: 65,
    currency: 'EUR',
    rating: 4.7,
    reviewCount: 89,
    coordinates: { lat: 37.4467, lng: 25.3289 },
  },
  {
    id: 'prop_athens_003',
    name: 'Athens Acropolis Penthouse',
    description: 'Luxurious penthouse apartment with direct Acropolis views from the rooftop terrace. Located in the heart of Plaka, surrounded by historic sites, galleries, and tavernas.',
    city: 'Athens',
    country: 'Greece',
    propertyType: 'APARTMENT',
    maxGuests: 5,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'air_conditioning', 'kitchen', 'city_view', 'balcony', 'washer', 'elevator', 'dishwasher'],
    images: [
      'https://images.example.com/athens-penthouse-1.jpg',
      'https://images.example.com/athens-penthouse-2.jpg',
      'https://images.example.com/athens-penthouse-rooftop.jpg',
    ],
    nightlyRate: 165,
    cleaningFee: 50,
    currency: 'EUR',
    rating: 4.8,
    reviewCount: 204,
    coordinates: { lat: 37.9715, lng: 23.7257 },
  },
];

demoProperties.forEach((p) => propertyPublicData.set(p.id, p));

// ─── Seed booking engine configs ────────────────────────────────────────────

const demoConfigs: BookingEngineConfig[] = [
  {
    id: 'bec_santorini_001',
    propertyId: 'prop_santorini_001',
    isEnabled: true,
    widgetSettings: {
      primaryColor: '#1a365d',
      accentColor: '#e53e3e',
      logoUrl: 'https://images.example.com/sivan-pms-logo.png',
      showReviews: true,
      showAmenities: true,
      showMap: true,
      maxGuestsDefault: 2,
      instantBooking: true,
      requireDeposit: true,
      depositPercent: 30,
    },
    seoSettings: {
      title: 'Santorini Sunset Villa - Luxury Caldera View | Book Direct',
      description: 'Book directly and save 15%. Stunning caldera-view villa in Oia, Santorini with private infinity pool.',
      ogImage: 'https://images.example.com/santorini-villa-og.jpg',
    },
    policies: {
      cancellationPolicy: 'MODERATE',
      cancellationDays: 5,
      refundPercent: 50,
      petPolicy: 'No pets allowed.',
      smokingPolicy: 'Strictly non-smoking property.',
      partyPolicy: 'No parties or events.',
      childrenPolicy: 'Children welcome. Baby cot available on request.',
    },
    paymentMethods: ['CREDIT_CARD', 'STRIPE', 'BANK_TRANSFER'],
    promotions: [
      {
        id: 'promo_early_001',
        code: 'EARLYBIRD2026',
        name: 'Early Bird Discount',
        type: 'PERCENT',
        value: 15,
        minNights: 5,
        maxUses: 50,
        usedCount: 12,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-06-30'),
        isActive: true,
      },
      {
        id: 'promo_long_002',
        code: 'LONGSTAY10',
        name: 'Long Stay Discount',
        type: 'PERCENT',
        value: 10,
        minNights: 7,
        maxUses: 100,
        usedCount: 28,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        isActive: true,
      },
    ],
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2026-03-20'),
  },
  {
    id: 'bec_mykonos_002',
    propertyId: 'prop_mykonos_002',
    isEnabled: true,
    widgetSettings: {
      primaryColor: '#2b6cb0',
      accentColor: '#d69e2e',
      showReviews: true,
      showAmenities: true,
      showMap: true,
      maxGuestsDefault: 2,
      instantBooking: true,
      requireDeposit: true,
      depositPercent: 25,
    },
    seoSettings: {
      title: 'Mykonos Beachfront Suite - Steps from Platis Gialos | Book Direct',
      description: 'Modern beachfront suite on Mykonos with Aegean views. Book directly for the best rate.',
    },
    policies: {
      cancellationPolicy: 'STRICT',
      cancellationDays: 14,
      refundPercent: 50,
      petPolicy: 'No pets allowed.',
      smokingPolicy: 'Non-smoking property.',
      partyPolicy: 'No parties or events. Quiet hours after 23:00.',
      childrenPolicy: 'Children 6+ welcome.',
    },
    paymentMethods: ['CREDIT_CARD', 'STRIPE'],
    promotions: [
      {
        id: 'promo_welcome_003',
        code: 'WELCOME20',
        name: 'Welcome Discount',
        type: 'FIXED',
        value: 50,
        minNights: 3,
        maxUses: 30,
        usedCount: 8,
        validFrom: new Date('2026-03-01'),
        validTo: new Date('2026-09-30'),
        isActive: true,
      },
    ],
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2026-04-01'),
  },
  {
    id: 'bec_athens_003',
    propertyId: 'prop_athens_003',
    isEnabled: true,
    widgetSettings: {
      primaryColor: '#2d3748',
      accentColor: '#38a169',
      showReviews: true,
      showAmenities: true,
      showMap: true,
      maxGuestsDefault: 2,
      instantBooking: false,
      requireDeposit: false,
      depositPercent: 0,
    },
    seoSettings: {
      title: 'Athens Acropolis Penthouse - Rooftop Views | Book Direct',
      description: 'Luxury penthouse with Acropolis views in historic Plaka. Request to book for the best rates.',
    },
    policies: {
      cancellationPolicy: 'FLEXIBLE',
      cancellationDays: 2,
      refundPercent: 100,
      petPolicy: 'Small pets welcome with prior approval (max 8kg). EUR 30 pet fee applies.',
      smokingPolicy: 'Smoking allowed on the terrace only.',
      partyPolicy: 'Small gatherings up to 8 people allowed until 22:00.',
      childrenPolicy: 'Children of all ages welcome.',
    },
    paymentMethods: ['CREDIT_CARD', 'STRIPE', 'PAYPAL', 'BANK_TRANSFER'],
    promotions: [],
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2026-02-15'),
  },
];

demoConfigs.forEach((c) => configs.set(c.propertyId, c));

// ─── Helper functions ────────────────────────────────────────────────────────

function getDaysBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generateDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getSeasonalMultiplier(dateStr: string): number {
  const month = new Date(dateStr).getMonth() + 1;
  // Peak season: June-September
  if (month >= 6 && month <= 9) return 1.4;
  // Shoulder season: April-May, October
  if (month >= 4 && month <= 5) return 1.15;
  if (month === 10) return 1.1;
  // Low season
  return 0.85;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class BookingEngineService {
  // ── Admin operations ─────────────────────────────────────────────────────

  getEngineConfig(propertyId: string): BookingEngineConfig {
    const config = configs.get(propertyId);
    if (!config) {
      throw ApiError.notFound('Booking engine config');
    }
    return config;
  }

  upsertEngineConfig(
    propertyId: string,
    data: Partial<Omit<BookingEngineConfig, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'promotions'>>,
  ): BookingEngineConfig {
    const existing = configs.get(propertyId);
    const now = new Date();

    if (existing) {
      if (data.isEnabled !== undefined) existing.isEnabled = data.isEnabled;
      if (data.widgetSettings) existing.widgetSettings = { ...existing.widgetSettings, ...data.widgetSettings };
      if (data.seoSettings) existing.seoSettings = { ...existing.seoSettings, ...data.seoSettings };
      if (data.policies) existing.policies = { ...existing.policies, ...data.policies };
      if (data.paymentMethods) existing.paymentMethods = data.paymentMethods;
      existing.updatedAt = now;
      configs.set(propertyId, existing);
      return existing;
    }

    const config: BookingEngineConfig = {
      id: 'bec_' + Date.now().toString(36),
      propertyId,
      isEnabled: data.isEnabled ?? true,
      widgetSettings: data.widgetSettings ?? {
        primaryColor: '#1a365d',
        accentColor: '#3182ce',
        showReviews: true,
        showAmenities: true,
        showMap: true,
        maxGuestsDefault: 2,
        instantBooking: true,
        requireDeposit: true,
        depositPercent: 25,
      },
      seoSettings: data.seoSettings ?? {},
      policies: data.policies ?? {
        cancellationPolicy: 'MODERATE',
        cancellationDays: 5,
        refundPercent: 50,
        petPolicy: 'No pets allowed.',
        smokingPolicy: 'Non-smoking property.',
        partyPolicy: 'No parties or events.',
        childrenPolicy: 'Children welcome.',
      },
      paymentMethods: data.paymentMethods ?? ['CREDIT_CARD', 'STRIPE'],
      promotions: [],
      createdAt: now,
      updatedAt: now,
    };

    configs.set(propertyId, config);
    return config;
  }

  // ── Promotions ───────────────────────────────────────────────────────────

  getPromotions(propertyId: string): BookingPromotion[] {
    const config = configs.get(propertyId);
    if (!config) {
      throw ApiError.notFound('Booking engine config');
    }
    return config.promotions;
  }

  createPromotion(
    propertyId: string,
    data: Omit<BookingPromotion, 'id' | 'usedCount'>,
  ): BookingPromotion {
    const config = configs.get(propertyId);
    if (!config) {
      throw ApiError.notFound('Booking engine config');
    }

    // Check for duplicate code across this property
    const duplicate = config.promotions.find(
      (p) => p.code.toLowerCase() === data.code.toLowerCase(),
    );
    if (duplicate) {
      throw ApiError.conflict('A promotion with this code already exists for this property', 'DUPLICATE_PROMO_CODE');
    }

    const promotion: BookingPromotion = {
      id: 'promo_' + Date.now().toString(36),
      code: data.code.toUpperCase(),
      name: data.name,
      type: data.type,
      value: data.value,
      minNights: data.minNights,
      maxUses: data.maxUses,
      usedCount: 0,
      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo),
      isActive: data.isActive,
    };

    config.promotions.push(promotion);
    config.updatedAt = new Date();
    configs.set(propertyId, config);

    return promotion;
  }

  updatePromotion(
    promoId: string,
    data: Partial<Omit<BookingPromotion, 'id' | 'usedCount'>>,
  ): BookingPromotion {
    let foundPromo: BookingPromotion | undefined;
    let foundConfig: BookingEngineConfig | undefined;

    configs.forEach((config) => {
      const promo = config.promotions.find((p) => p.id === promoId);
      if (promo) {
        foundPromo = promo;
        foundConfig = config;
      }
    });

    if (!foundPromo || !foundConfig) {
      throw ApiError.notFound('Promotion');
    }

    if (data.code !== undefined) foundPromo.code = data.code.toUpperCase();
    if (data.name !== undefined) foundPromo.name = data.name;
    if (data.type !== undefined) foundPromo.type = data.type;
    if (data.value !== undefined) foundPromo.value = data.value;
    if (data.minNights !== undefined) foundPromo.minNights = data.minNights;
    if (data.maxUses !== undefined) foundPromo.maxUses = data.maxUses;
    if (data.validFrom !== undefined) foundPromo.validFrom = new Date(data.validFrom);
    if (data.validTo !== undefined) foundPromo.validTo = new Date(data.validTo);
    if (data.isActive !== undefined) foundPromo.isActive = data.isActive;

    foundConfig.updatedAt = new Date();
    configs.set(foundConfig.propertyId, foundConfig);

    return foundPromo;
  }

  deletePromotion(promoId: string): { message: string } {
    let found = false;

    configs.forEach((config) => {
      const index = config.promotions.findIndex((p) => p.id === promoId);
      if (index !== -1) {
        config.promotions.splice(index, 1);
        config.updatedAt = new Date();
        configs.set(config.propertyId, config);
        found = true;
      }
    });

    if (!found) {
      throw ApiError.notFound('Promotion');
    }

    return { message: 'Promotion deleted successfully' };
  }

  // ── Public operations ────────────────────────────────────────────────────

  searchProperties(filters: SearchFilters): PropertyPublicInfo[] {
    let results = Array.from(propertyPublicData.values());

    if (filters.city) {
      const city = filters.city.toLowerCase();
      results = results.filter((p) => p.city.toLowerCase().includes(city));
    }

    if (filters.guests) {
      results = results.filter((p) => p.maxGuests >= filters.guests!);
    }

    if (filters.minPrice) {
      results = results.filter((p) => p.nightlyRate >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      results = results.filter((p) => p.nightlyRate <= filters.maxPrice!);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      results = results.filter((p) =>
        filters.amenities!.every((a) => p.amenities.includes(a)),
      );
    }

    // Only return properties with enabled booking engines
    results = results.filter((p) => {
      const config = configs.get(p.id);
      return config && config.isEnabled;
    });

    return results;
  }

  getPropertyPublicInfo(propertyId: string): PropertyPublicInfo {
    const property = propertyPublicData.get(propertyId);
    if (!property) {
      throw ApiError.notFound('Property');
    }

    // Only show if booking engine is enabled
    const config = configs.get(propertyId);
    if (!config || !config.isEnabled) {
      throw ApiError.notFound('Property');
    }

    return property;
  }

  checkAvailability(propertyId: string, checkIn: string, checkOut: string): AvailabilityResult {
    const property = propertyPublicData.get(propertyId);
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const dates = generateDateRange(checkIn, checkOut);

    // Simulate availability - some dates blocked for demo
    const blockedDates = new Set(['2026-07-15', '2026-07-16', '2026-07-17', '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13']);

    const availabilityDates = dates.map((date) => {
      const multiplier = getSeasonalMultiplier(date);
      const basePrice = property.nightlyRate;
      const isWeekend = [0, 5, 6].includes(new Date(date).getDay());
      const weekendSurcharge = isWeekend ? 1.1 : 1.0;

      return {
        date,
        available: !blockedDates.has(date),
        price: Math.round(basePrice * multiplier * weekendSurcharge),
        minStay: multiplier > 1.2 ? 3 : 2,
      };
    });

    return {
      propertyId,
      dates: availabilityDates,
    };
  }

  calculateQuote(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    promoCode?: string,
  ): BookingQuote {
    const property = propertyPublicData.get(propertyId);
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const config = configs.get(propertyId);
    if (!config || !config.isEnabled) {
      throw ApiError.notFound('Booking engine config');
    }

    if (guests > property.maxGuests) {
      throw ApiError.badRequest(
        `Maximum ${property.maxGuests} guests allowed`,
        'EXCEEDS_MAX_GUESTS',
      );
    }

    const nights = getDaysBetween(checkIn, checkOut);
    if (nights <= 0) {
      throw ApiError.badRequest('Check-out must be after check-in', 'INVALID_DATES');
    }

    // Calculate average nightly rate based on seasonal pricing
    const dates = generateDateRange(checkIn, checkOut);
    let totalNightlySum = 0;
    dates.forEach((date) => {
      const multiplier = getSeasonalMultiplier(date);
      const isWeekend = [0, 5, 6].includes(new Date(date).getDay());
      const weekendSurcharge = isWeekend ? 1.1 : 1.0;
      totalNightlySum += Math.round(property.nightlyRate * multiplier * weekendSurcharge);
    });

    const avgNightlyRate = Math.round(totalNightlySum / nights);
    const subtotal = totalNightlySum;
    const cleaningFee = property.cleaningFee;

    // Apply promotion
    let discount = 0;
    let appliedPromoCode: string | undefined;

    if (promoCode) {
      const promo = config.promotions.find(
        (p) =>
          p.code.toLowerCase() === promoCode.toLowerCase() &&
          p.isActive &&
          new Date() >= p.validFrom &&
          new Date() <= p.validTo,
      );

      if (promo) {
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
          throw ApiError.badRequest('Promotion code has reached maximum uses', 'PROMO_EXHAUSTED');
        }
        if (promo.minNights && nights < promo.minNights) {
          throw ApiError.badRequest(
            `Promotion requires minimum ${promo.minNights} nights`,
            'PROMO_MIN_NIGHTS',
          );
        }

        if (promo.type === 'PERCENT') {
          discount = Math.round(subtotal * (promo.value / 100));
        } else {
          discount = promo.value;
        }
        appliedPromoCode = promo.code;
      } else {
        throw ApiError.badRequest('Invalid or expired promotion code', 'INVALID_PROMO');
      }
    }

    const taxableAmount = subtotal + cleaningFee - discount;
    const taxRate = 0.13; // Greek VAT for accommodation
    const taxes = Math.round(taxableAmount * taxRate);
    const total = taxableAmount + taxes;

    const depositRequired = config.widgetSettings.requireDeposit
      ? Math.round(total * (config.widgetSettings.depositPercent / 100))
      : 0;

    return {
      propertyId,
      checkIn,
      checkOut,
      guests,
      nights,
      nightlyRate: avgNightlyRate,
      subtotal,
      cleaningFee,
      discount,
      promotionCode: appliedPromoCode,
      taxes,
      total,
      depositRequired,
      cancellationPolicy: config.policies.cancellationPolicy,
    };
  }

  createDirectBooking(data: DirectBookingInput): DirectBooking {
    const property = propertyPublicData.get(data.propertyId);
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const config = configs.get(data.propertyId);
    if (!config || !config.isEnabled) {
      throw ApiError.badRequest('Direct booking is not available for this property', 'BOOKING_ENGINE_DISABLED');
    }

    // Validate payment method
    if (!config.paymentMethods.includes(data.paymentMethod)) {
      throw ApiError.badRequest(
        `Payment method ${data.paymentMethod} is not accepted for this property`,
        'INVALID_PAYMENT_METHOD',
      );
    }

    // Calculate quote
    const quote = this.calculateQuote(
      data.propertyId,
      data.checkIn,
      data.checkOut,
      data.guests,
      data.promotionCode,
    );

    // Check availability
    const availability = this.checkAvailability(data.propertyId, data.checkIn, data.checkOut);
    const unavailableDates = availability.dates.filter((d) => !d.available);
    if (unavailableDates.length > 0) {
      throw ApiError.badRequest(
        `Property is not available for the selected dates: ${unavailableDates.map((d) => d.date).join(', ')}`,
        'DATES_UNAVAILABLE',
      );
    }

    // Increment promo usage if applicable
    if (data.promotionCode) {
      const promo = config.promotions.find(
        (p) => p.code.toLowerCase() === data.promotionCode!.toLowerCase(),
      );
      if (promo) {
        promo.usedCount++;
      }
    }

    const status = config.widgetSettings.instantBooking ? 'CONFIRMED' : 'PENDING';

    const booking: DirectBooking = {
      id: 'db_' + Date.now().toString(36),
      propertyId: data.propertyId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      nights: quote.nights,
      guestInfo: data.guestInfo,
      quote,
      paymentMethod: data.paymentMethod,
      specialRequests: data.specialRequests,
      status,
      createdAt: new Date(),
    };

    directBookings.set(booking.id, booking);
    return booking;
  }

  validatePromoCode(
    propertyId: string,
    code: string,
  ): { valid: boolean; promotion?: BookingPromotion; reason?: string } {
    const config = configs.get(propertyId);
    if (!config) {
      return { valid: false, reason: 'Property not found' };
    }

    const promo = config.promotions.find(
      (p) => p.code.toLowerCase() === code.toLowerCase(),
    );

    if (!promo) {
      return { valid: false, reason: 'Promotion code not found' };
    }

    if (!promo.isActive) {
      return { valid: false, reason: 'Promotion is inactive' };
    }

    const now = new Date();
    if (now < promo.validFrom) {
      return { valid: false, reason: 'Promotion has not started yet' };
    }

    if (now > promo.validTo) {
      return { valid: false, reason: 'Promotion has expired' };
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false, reason: 'Promotion has reached maximum uses' };
    }

    return { valid: true, promotion: promo };
  }
}

export const bookingEngineService = new BookingEngineService();
