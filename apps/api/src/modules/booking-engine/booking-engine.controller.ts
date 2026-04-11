import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingEngineService } from './booking-engine.service';
import { sendSuccess } from '../../utils/response';

// ─── Admin schemas ──────────────────────────────────────────────────────────

const upsertConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  widgetSettings: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    logoUrl: z.string().url().optional(),
    customCss: z.string().optional(),
    showReviews: z.boolean().optional(),
    showAmenities: z.boolean().optional(),
    showMap: z.boolean().optional(),
    maxGuestsDefault: z.number().int().min(1).max(50).optional(),
    instantBooking: z.boolean().optional(),
    requireDeposit: z.boolean().optional(),
    depositPercent: z.number().min(0).max(100).optional(),
  }).optional(),
  seoSettings: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    ogImage: z.string().url().optional(),
  }).optional(),
  policies: z.object({
    cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT', 'SUPER_STRICT']).optional(),
    cancellationDays: z.number().int().min(0).optional(),
    refundPercent: z.number().min(0).max(100).optional(),
    petPolicy: z.string().optional(),
    smokingPolicy: z.string().optional(),
    partyPolicy: z.string().optional(),
    childrenPolicy: z.string().optional(),
  }).optional(),
  paymentMethods: z.array(
    z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE']),
  ).optional(),
});

const createPromotionSchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(1).max(255),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  minNights: z.number().int().min(1).optional(),
  maxUses: z.number().int().min(1).optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  isActive: z.boolean(),
});

const updatePromotionSchema = z.object({
  code: z.string().min(2).max(30).optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  value: z.number().positive().optional(),
  minNights: z.number().int().min(1).optional(),
  maxUses: z.number().int().min(1).optional(),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

// ─── Public schemas ─────────────────────────────────────────────────────────

const searchQuerySchema = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  amenities: z.string().optional(), // comma-separated
});

const availabilityQuerySchema = z.object({
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
});

const quoteSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  guests: z.number().int().min(1),
  promotionCode: z.string().optional(),
});

const bookingSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  guests: z.number().int().min(1),
  guestInfo: z.object({
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    email: z.string().email(),
    phone: z.string().optional(),
    nationality: z.string().max(2).optional(),
  }),
  promotionCode: z.string().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE']),
  specialRequests: z.string().max(1000).optional(),
});

const validatePromoSchema = z.object({
  propertyId: z.string().min(1),
  code: z.string().min(1),
});

// ─── Controller ─────────────────────────────────────────────────────────────

export class BookingEngineController {
  // ── Admin endpoints ──────────────────────────────────────────────────────

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = bookingEngineService.getEngineConfig(req.params.propertyId as string);
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async upsertConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const data = upsertConfigSchema.parse(req.body);
      const config = bookingEngineService.upsertEngineConfig(
        req.params.propertyId as string,
        data as any,
      );
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async getPromotions(req: Request, res: Response, next: NextFunction) {
    try {
      const promotions = bookingEngineService.getPromotions(req.params.propertyId as string);
      sendSuccess(res, promotions);
    } catch (error) {
      next(error);
    }
  }

  async createPromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPromotionSchema.parse(req.body);
      const promotion = bookingEngineService.createPromotion(
        req.params.propertyId as string,
        data,
      );
      sendSuccess(res, promotion, 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updatePromotionSchema.parse(req.body);
      const promotion = bookingEngineService.updatePromotion(
        req.params.promoId as string,
        data,
      );
      sendSuccess(res, promotion);
    } catch (error) {
      next(error);
    }
  }

  async deletePromotion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = bookingEngineService.deletePromotion(req.params.promoId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── Public endpoints ─────────────────────────────────────────────────────

  async searchProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = searchQuerySchema.parse(req.query);
      const amenities = filters.amenities
        ? filters.amenities.split(',').map((a) => a.trim())
        : undefined;
      const results = bookingEngineService.searchProperties({
        ...filters,
        amenities,
      });
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }

  async getPropertyPublicInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const property = bookingEngineService.getPropertyPublicInfo(
        req.params.propertyId as string,
      );
      sendSuccess(res, property);
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkIn, checkOut } = availabilityQuerySchema.parse(req.query);
      const availability = bookingEngineService.checkAvailability(
        req.params.propertyId as string,
        checkIn,
        checkOut,
      );
      sendSuccess(res, availability);
    } catch (error) {
      next(error);
    }
  }

  async calculateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data = quoteSchema.parse(req.body);
      const quote = bookingEngineService.calculateQuote(
        data.propertyId,
        data.checkIn,
        data.checkOut,
        data.guests,
        data.promotionCode,
      );
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  async createDirectBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bookingSchema.parse(req.body);
      const booking = bookingEngineService.createDirectBooking(data);
      sendSuccess(res, booking, 201);
    } catch (error) {
      next(error);
    }
  }

  async validatePromoCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, code } = validatePromoSchema.parse(req.body);
      const result = bookingEngineService.validatePromoCode(propertyId, code);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingEngineController = new BookingEngineController();
