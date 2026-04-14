import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
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

/** Extract a plain-text description from the multilingual Json field */
function extractDescription(desc: unknown): string {
  if (!desc) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc === 'object') {
    const d = desc as Record<string, string>;
    return d.en || d.he || Object.values(d)[0] || '';
  }
  return '';
}

/** Map a DB property + related data into the public-facing DTO */
function toPropertyPublicInfo(
  prop: any,
  images: { url: string }[],
  avgRating: number,
  reviewCount: number,
): PropertyPublicInfo {
  return {
    id: prop.id,
    name: prop.name,
    description: extractDescription(prop.description),
    city: prop.city,
    country: prop.country,
    propertyType: prop.propertyType,
    maxGuests: prop.maxGuests,
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    amenities: Array.isArray(prop.amenities) ? (prop.amenities as string[]) : [],
    images: images.map((i) => i.url),
    nightlyRate: Number(prop.baseNightlyRate),
    cleaningFee: Number(prop.cleaningFee),
    currency: prop.currency,
    rating: avgRating,
    reviewCount,
    coordinates:
      prop.latitude && prop.longitude
        ? { lat: Number(prop.latitude), lng: Number(prop.longitude) }
        : undefined,
  };
}

/** Build a BookingEngineConfig from DirectBookingSetting DB row + promotions */
function toBookingEngineConfig(
  dbs: any,
  promotions: BookingPromotion[],
): BookingEngineConfig {
  const wc = (dbs.widgetConfig as Record<string, any>) || {};

  const defaultWidgetSettings = {
    primaryColor: '#1a365d',
    accentColor: '#3182ce',
    showReviews: true,
    showAmenities: true,
    showMap: true,
    maxGuestsDefault: 2,
    instantBooking: true,
    requireDeposit: Boolean(dbs.requireDeposit),
    depositPercent: Number(dbs.depositPercent),
  };

  const defaultPolicies = {
    cancellationPolicy: 'MODERATE' as const,
    cancellationDays: 5,
    refundPercent: 50,
    petPolicy: 'No pets allowed.',
    smokingPolicy: 'Non-smoking property.',
    partyPolicy: 'No parties or events.',
    childrenPolicy: 'Children welcome.',
  };

  return {
    id: dbs.id,
    propertyId: dbs.propertyId,
    isEnabled: dbs.isEnabled,
    widgetSettings: { ...defaultWidgetSettings, ...wc.widgetSettings },
    seoSettings: wc.seoSettings || {},
    policies: { ...defaultPolicies, ...wc.policies },
    paymentMethods: wc.paymentMethods || ['CREDIT_CARD', 'STRIPE'],
    promotions,
    createdAt: dbs.createdAt,
    updatedAt: dbs.updatedAt,
  };
}

// ─── Promotions key helper ──────────────────────────────────────────────────
// Promotions are stored in SystemSetting under "booking_engine.promotions.<propertyId>"

function promoSettingKey(propertyId: string): string {
  return `booking_engine.promotions.${propertyId}`;
}

async function loadPromotions(propertyId: string): Promise<BookingPromotion[]> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: promoSettingKey(propertyId) },
  });
  if (!row) return [];
  try {
    return JSON.parse(row.value) as BookingPromotion[];
  } catch {
    return [];
  }
}

async function savePromotions(propertyId: string, promotions: BookingPromotion[]): Promise<void> {
  const key = promoSettingKey(propertyId);
  const value = JSON.stringify(promotions);
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
      category: 'booking_engine',
      label: `Promotions for property ${propertyId}`,
    },
    update: {
      value,
      updatedAt: new Date(),
    },
  });
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class BookingEngineService {
  // ── Admin operations ─────────────────────────────────────────────────────

  async getEngineConfig(propertyId: string): Promise<BookingEngineConfig> {
    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });
    if (!dbs) {
      throw ApiError.notFound('Booking engine config');
    }

    const promotions = await loadPromotions(propertyId);
    return toBookingEngineConfig(dbs, promotions);
  }

  async upsertEngineConfig(
    propertyId: string,
    data: Partial<Omit<BookingEngineConfig, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'promotions'>>,
  ): Promise<BookingEngineConfig> {
    // Ensure property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const existing = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });

    let dbs: any;

    if (existing) {
      const existingWc = (existing.widgetConfig as Record<string, any>) || {};
      const updatedWc: Record<string, any> = { ...existingWc };

      if (data.widgetSettings) {
        updatedWc.widgetSettings = { ...existingWc.widgetSettings, ...data.widgetSettings };
      }
      if (data.seoSettings) {
        updatedWc.seoSettings = { ...existingWc.seoSettings, ...data.seoSettings };
      }
      if (data.policies) {
        updatedWc.policies = { ...existingWc.policies, ...data.policies };
      }
      if (data.paymentMethods) {
        updatedWc.paymentMethods = data.paymentMethods;
      }

      dbs = await prisma.directBookingSetting.update({
        where: { propertyId },
        data: {
          isEnabled: data.isEnabled ?? existing.isEnabled,
          requireDeposit:
            data.widgetSettings?.requireDeposit ?? existing.requireDeposit,
          depositPercent:
            data.widgetSettings?.depositPercent !== undefined
              ? data.widgetSettings.depositPercent
              : existing.depositPercent,
          widgetConfig: updatedWc as Prisma.InputJsonValue,
        },
      });
    } else {
      const wc: Record<string, any> = {};
      if (data.widgetSettings) wc.widgetSettings = data.widgetSettings;
      if (data.seoSettings) wc.seoSettings = data.seoSettings;
      if (data.policies) wc.policies = data.policies;
      if (data.paymentMethods) wc.paymentMethods = data.paymentMethods;

      dbs = await prisma.directBookingSetting.create({
        data: {
          propertyId,
          isEnabled: data.isEnabled ?? true,
          requireDeposit: data.widgetSettings?.requireDeposit ?? true,
          depositPercent: data.widgetSettings?.depositPercent ?? 25,
          widgetConfig: wc as Prisma.InputJsonValue,
        },
      });
    }

    const promotions = await loadPromotions(propertyId);
    return toBookingEngineConfig(dbs, promotions);
  }

  // ── Promotions ───────────────────────────────────────────────────────────

  async getPromotions(propertyId: string): Promise<BookingPromotion[]> {
    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });
    if (!dbs) {
      throw ApiError.notFound('Booking engine config');
    }
    return loadPromotions(propertyId);
  }

  async createPromotion(
    propertyId: string,
    data: Omit<BookingPromotion, 'id' | 'usedCount'>,
  ): Promise<BookingPromotion> {
    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });
    if (!dbs) {
      throw ApiError.notFound('Booking engine config');
    }

    const promotions = await loadPromotions(propertyId);

    // Check for duplicate code
    const duplicate = promotions.find(
      (p) => p.code.toLowerCase() === data.code.toLowerCase(),
    );
    if (duplicate) {
      throw ApiError.conflict(
        'A promotion with this code already exists for this property',
        'DUPLICATE_PROMO_CODE',
      );
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

    promotions.push(promotion);
    await savePromotions(propertyId, promotions);

    return promotion;
  }

  async updatePromotion(
    promoId: string,
    data: Partial<Omit<BookingPromotion, 'id' | 'usedCount'>>,
  ): Promise<BookingPromotion> {
    // Search all promotion settings for this promo
    const allPromoSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'booking_engine.promotions.' } },
    });

    let foundPromo: BookingPromotion | undefined;
    let foundPropertyId: string | undefined;
    let allPromotions: BookingPromotion[] = [];

    for (const setting of allPromoSettings) {
      try {
        const promos = JSON.parse(setting.value) as BookingPromotion[];
        const promo = promos.find((p) => p.id === promoId);
        if (promo) {
          foundPromo = promo;
          foundPropertyId = setting.key.replace('booking_engine.promotions.', '');
          allPromotions = promos;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!foundPromo || !foundPropertyId) {
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

    // Update in the array
    const idx = allPromotions.findIndex((p) => p.id === promoId);
    if (idx !== -1) allPromotions[idx] = foundPromo;

    await savePromotions(foundPropertyId, allPromotions);

    return foundPromo;
  }

  async deletePromotion(promoId: string): Promise<{ message: string }> {
    const allPromoSettings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: 'booking_engine.promotions.' } },
    });

    let found = false;

    for (const setting of allPromoSettings) {
      try {
        const promos = JSON.parse(setting.value) as BookingPromotion[];
        const idx = promos.findIndex((p) => p.id === promoId);
        if (idx !== -1) {
          promos.splice(idx, 1);
          const propertyId = setting.key.replace('booking_engine.promotions.', '');
          await savePromotions(propertyId, promos);
          found = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!found) {
      throw ApiError.notFound('Promotion');
    }

    return { message: 'Promotion deleted successfully' };
  }

  // ── Public operations ────────────────────────────────────────────────────

  async searchProperties(filters: SearchFilters): Promise<PropertyPublicInfo[]> {
    // Build Prisma where clause
    const where: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      directBookingSettings: {
        isEnabled: true,
      },
    };

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.guests) {
      where.maxGuests = { gte: filters.guests };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.baseNightlyRate = {};
      if (filters.minPrice) {
        (where.baseNightlyRate as Prisma.DecimalFilter).gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        (where.baseNightlyRate as Prisma.DecimalFilter).lte = filters.maxPrice;
      }
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { url: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Post-filter by amenities (stored as Json array)
    let filtered = properties;
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = properties.filter((p) => {
        const propAmenities = Array.isArray(p.amenities) ? (p.amenities as string[]) : [];
        return filters.amenities!.every((a) => propAmenities.includes(a));
      });
    }

    // If date range provided, filter out properties with booking / block conflicts
    if (filters.checkIn && filters.checkOut) {
      const checkInDate = new Date(filters.checkIn);
      const checkOutDate = new Date(filters.checkOut);

      const propertyIds = filtered.map((p) => p.id);

      // Find properties that have conflicting bookings
      const conflictBookings = await prisma.booking.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
        select: { propertyId: true },
      });

      // Find properties that have conflicting calendar blocks
      const conflictBlocks = await prisma.calendarBlock.findMany({
        where: {
          propertyId: { in: propertyIds },
          startDate: { lt: checkOutDate },
          endDate: { gt: checkInDate },
        },
        select: { propertyId: true },
      });

      const blockedIds = new Set([
        ...conflictBookings.map((b) => b.propertyId),
        ...conflictBlocks.map((b) => b.propertyId),
      ]);

      filtered = filtered.filter((p) => !blockedIds.has(p.id));
    }

    return filtered.map((p) => {
      const reviewCount = p.reviews.length;
      const avgRating =
        reviewCount > 0
          ? Math.round((p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
          : 0;
      return toPropertyPublicInfo(p, p.images, avgRating, reviewCount);
    });
  }

  async getPropertyPublicInfo(propertyId: string): Promise<PropertyPublicInfo> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, deletedAt: null },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { url: true },
        },
        reviews: {
          select: { rating: true },
        },
        directBookingSettings: {
          select: { isEnabled: true },
        },
      },
    });

    if (!property) {
      throw ApiError.notFound('Property');
    }

    // Only show if booking engine is enabled
    if (!property.directBookingSettings || !property.directBookingSettings.isEnabled) {
      throw ApiError.notFound('Property');
    }

    const reviewCount = property.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Math.round(
            (property.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
          ) / 10
        : 0;

    return toPropertyPublicInfo(property, property.images, avgRating, reviewCount);
  }

  async checkAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<AvailabilityResult> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Get all bookings that overlap the date range
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { checkIn: true, checkOut: true },
    });

    // Get all calendar blocks that overlap the date range
    const blocks = await prisma.calendarBlock.findMany({
      where: {
        propertyId,
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate },
      },
      select: { startDate: true, endDate: true },
    });

    // Get seasonal rates for pricing
    const seasonalRates = await prisma.seasonalRate.findMany({
      where: {
        propertyId,
        startDate: { lte: checkOutDate },
        endDate: { gte: checkInDate },
      },
      orderBy: { priority: 'desc' },
    });

    // Build set of blocked dates
    const blockedDates = new Set<string>();

    for (const booking of bookings) {
      const cur = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      while (cur < end) {
        blockedDates.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    for (const block of blocks) {
      const cur = new Date(block.startDate);
      const end = new Date(block.endDate);
      while (cur < end) {
        blockedDates.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    const baseRate = Number(property.baseNightlyRate);
    const dates = generateDateRange(checkIn, checkOut);

    const availabilityDates = dates.map((dateStr) => {
      const dateObj = new Date(dateStr);

      // Find best matching seasonal rate
      let price = baseRate;
      let minStay = property.minStayNights;

      for (const sr of seasonalRates) {
        if (dateObj >= sr.startDate && dateObj <= sr.endDate) {
          price = Number(sr.nightlyRate);
          if (sr.minStay) minStay = sr.minStay;
          break; // highest priority first
        }
      }

      // Weekend surcharge (+10%) if no seasonal override
      const isWeekend = [0, 5, 6].includes(dateObj.getDay());
      if (isWeekend && seasonalRates.length === 0) {
        price = Math.round(price * 1.1);
      }

      return {
        date: dateStr,
        available: !blockedDates.has(dateStr),
        price: Math.round(price),
        minStay,
      };
    });

    return {
      propertyId,
      dates: availabilityDates,
    };
  }

  async calculateQuote(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    promoCode?: string,
  ): Promise<BookingQuote> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });
    if (!dbs || !dbs.isEnabled) {
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

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const baseRate = Number(property.baseNightlyRate);

    // Load seasonal rates for the date range
    const seasonalRates = await prisma.seasonalRate.findMany({
      where: {
        propertyId,
        startDate: { lte: checkOutDate },
        endDate: { gte: checkInDate },
      },
      orderBy: { priority: 'desc' },
    });

    // Calculate nightly totals
    const dates = generateDateRange(checkIn, checkOut);
    let totalNightlySum = 0;
    dates.forEach((dateStr) => {
      const dateObj = new Date(dateStr);
      let nightRate = baseRate;

      // Apply seasonal rate (highest priority first)
      for (const sr of seasonalRates) {
        if (dateObj >= sr.startDate && dateObj <= sr.endDate) {
          nightRate = Number(sr.nightlyRate);
          break;
        }
      }

      // Weekend surcharge if no seasonal override applied
      const isWeekend = [0, 5, 6].includes(dateObj.getDay());
      if (isWeekend && seasonalRates.length === 0) {
        nightRate = Math.round(nightRate * 1.1);
      }

      totalNightlySum += Math.round(nightRate);
    });

    const avgNightlyRate = Math.round(totalNightlySum / nights);
    const subtotal = totalNightlySum;
    const cleaningFee = Number(property.cleaningFee);

    // Apply promotion
    let discount = 0;
    let appliedPromoCode: string | undefined;

    if (promoCode) {
      const promotions = await loadPromotions(propertyId);
      const promo = promotions.find(
        (p) =>
          p.code.toLowerCase() === promoCode.toLowerCase() &&
          p.isActive &&
          new Date() >= new Date(p.validFrom) &&
          new Date() <= new Date(p.validTo),
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

    const wc = (dbs.widgetConfig as Record<string, any>) || {};
    const widgetSettings = wc.widgetSettings || {};
    const policies = wc.policies || {};

    const requireDeposit = dbs.requireDeposit;
    const depositPercent = Number(dbs.depositPercent);
    const depositRequired = requireDeposit ? Math.round(total * (depositPercent / 100)) : 0;

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
      cancellationPolicy: policies.cancellationPolicy || 'MODERATE',
    };
  }

  async createDirectBooking(data: DirectBookingInput): Promise<DirectBooking> {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId, deletedAt: null },
    });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId: data.propertyId },
    });
    if (!dbs || !dbs.isEnabled) {
      throw ApiError.badRequest(
        'Direct booking is not available for this property',
        'BOOKING_ENGINE_DISABLED',
      );
    }

    const wc = (dbs.widgetConfig as Record<string, any>) || {};
    const widgetSettings = wc.widgetSettings || {};
    const acceptedPaymentMethods = wc.paymentMethods || ['CREDIT_CARD', 'STRIPE'];

    // Validate payment method
    if (!acceptedPaymentMethods.includes(data.paymentMethod)) {
      throw ApiError.badRequest(
        `Payment method ${data.paymentMethod} is not accepted for this property`,
        'INVALID_PAYMENT_METHOD',
      );
    }

    // Calculate quote
    const quote = await this.calculateQuote(
      data.propertyId,
      data.checkIn,
      data.checkOut,
      data.guests,
      data.promotionCode,
    );

    // Check availability (real DB check)
    const availability = await this.checkAvailability(data.propertyId, data.checkIn, data.checkOut);
    const unavailableDates = availability.dates.filter((d) => !d.available);
    if (unavailableDates.length > 0) {
      throw ApiError.badRequest(
        `Property is not available for the selected dates: ${unavailableDates.map((d) => d.date).join(', ')}`,
        'DATES_UNAVAILABLE',
      );
    }

    // Increment promo usage if applicable
    if (data.promotionCode) {
      const promotions = await loadPromotions(data.propertyId);
      const promo = promotions.find(
        (p) => p.code.toLowerCase() === data.promotionCode!.toLowerCase(),
      );
      if (promo) {
        promo.usedCount++;
        await savePromotions(data.propertyId, promotions);
      }
    }

    const instantBooking = widgetSettings.instantBooking ?? true;
    const bookingStatus = instantBooking ? 'CONFIRMED' : 'PENDING';

    // Upsert guest profile
    let guestProfile = await prisma.guestProfile.findFirst({
      where: { email: data.guestInfo.email },
    });

    if (guestProfile) {
      guestProfile = await prisma.guestProfile.update({
        where: { id: guestProfile.id },
        data: {
          firstName: data.guestInfo.firstName,
          lastName: data.guestInfo.lastName,
          phone: data.guestInfo.phone || guestProfile.phone,
          nationality: data.guestInfo.nationality || guestProfile.nationality,
        },
      });
    } else {
      guestProfile = await prisma.guestProfile.create({
        data: {
          firstName: data.guestInfo.firstName,
          lastName: data.guestInfo.lastName,
          email: data.guestInfo.email,
          phone: data.guestInfo.phone,
          nationality: data.guestInfo.nationality,
        },
      });
    }

    // Create the real booking in DB
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    const dbBooking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        guestId: guestProfile.id,
        source: 'DIRECT',
        status: bookingStatus,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: quote.nights,
        guestsCount: data.guests,
        nightlyRate: quote.nightlyRate,
        subtotal: quote.subtotal,
        cleaningFee: quote.cleaningFee,
        taxes: quote.taxes,
        totalAmount: quote.total,
        currency: property.currency,
        guestName: `${data.guestInfo.firstName} ${data.guestInfo.lastName}`,
        guestEmail: data.guestInfo.email,
        guestPhone: data.guestInfo.phone,
        specialRequests: data.specialRequests,
        confirmedAt: bookingStatus === 'CONFIRMED' ? new Date() : undefined,
        metadata: {
          paymentMethod: data.paymentMethod,
          promotionCode: data.promotionCode,
          depositRequired: quote.depositRequired,
        },
      },
    });

    return {
      id: dbBooking.id,
      propertyId: data.propertyId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      nights: quote.nights,
      guestInfo: data.guestInfo,
      quote,
      paymentMethod: data.paymentMethod,
      specialRequests: data.specialRequests,
      status: bookingStatus,
      createdAt: dbBooking.createdAt,
    };
  }

  async validatePromoCode(
    propertyId: string,
    code: string,
  ): Promise<{ valid: boolean; promotion?: BookingPromotion; reason?: string }> {
    const dbs = await prisma.directBookingSetting.findUnique({
      where: { propertyId },
    });
    if (!dbs) {
      return { valid: false, reason: 'Property not found' };
    }

    const promotions = await loadPromotions(propertyId);
    const promo = promotions.find(
      (p) => p.code.toLowerCase() === code.toLowerCase(),
    );

    if (!promo) {
      return { valid: false, reason: 'Promotion code not found' };
    }

    if (!promo.isActive) {
      return { valid: false, reason: 'Promotion is inactive' };
    }

    const now = new Date();
    if (now < new Date(promo.validFrom)) {
      return { valid: false, reason: 'Promotion has not started yet' };
    }

    if (now > new Date(promo.validTo)) {
      return { valid: false, reason: 'Promotion has expired' };
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false, reason: 'Promotion has reached maximum uses' };
    }

    return { valid: true, promotion: promo };
  }
}

export const bookingEngineService = new BookingEngineService();
