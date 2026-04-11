import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { directBookingService } from './direct-booking.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const searchQuerySchema = z.object({
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(1).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  type: z.enum(['VILLA', 'APARTMENT', 'HOUSE']).optional(),
  amenities: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const availabilityQuerySchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
});

const priceQuerySchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1),
});

const createBookingSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().min(1),
  guestDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    country: z.string().optional(),
  }),
  specialRequests: z.string().max(1000).optional(),
});

const adminBookingsQuerySchema = z.object({
  propertyId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class DirectBookingController {
  // ── Public endpoints (no auth) ──

  async searchProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = searchQuerySchema.parse(req.query);
      const filters = {
        ...parsed,
        amenities: parsed.amenities ? parsed.amenities.split(',') : undefined,
      };
      const { properties, total, page, limit } = await directBookingService.searchProperties(filters);
      sendPaginated(res, properties, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getPropertyDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await directBookingService.getPropertyDetails(req.params.propertyId as string);
      sendSuccess(res, property);
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkIn, checkOut } = availabilityQuerySchema.parse(req.query);
      const result = await directBookingService.checkAvailability(req.params.propertyId as string, checkIn, checkOut);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async calculatePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { checkIn, checkOut, guests } = priceQuerySchema.parse(req.query);
      const result = await directBookingService.calculatePrice(req.params.propertyId as string, checkIn, checkOut, guests);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBookingSchema.parse(req.body);
      const booking = await directBookingService.createBooking(data);
      sendSuccess(res, booking, 201);
    } catch (error) {
      next(error);
    }
  }

  async createPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await directBookingService.createPaymentIntent(req.params.bookingId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getConfirmation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await directBookingService.getBookingConfirmation(req.params.bookingId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ── Admin endpoints (auth required) ──

  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = adminBookingsQuerySchema.parse(req.query);
      const { bookings, total, page, limit } = await directBookingService.getAllBookings(filters);
      sendPaginated(res, bookings, total, page, limit);
    } catch (error) {
      next(error);
    }
  }
}

export const directBookingController = new DirectBookingController();
