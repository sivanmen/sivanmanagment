import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingsService } from './bookings.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  source: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'VRBO', 'ICAL', 'MANUAL', 'WIDGET']).optional(),
  externalId: z.string().optional(),
  status: z.enum(['INQUIRY', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']).optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guestsCount: z.number().int().min(1),
  adults: z.number().int().min(0).optional(),
  children: z.number().int().min(0).optional(),
  infants: z.number().int().min(0).optional(),
  pets: z.number().int().min(0).optional(),
  nightlyRate: z.number().positive(),
  cleaningFee: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED']).optional(),
  guestName: z.string().min(1).max(255),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  internalNotes: z.string().optional(),
  icalUid: z.string().optional(),
  metadata: z.any().optional(),
});

const updateBookingSchema = z.object({
  unitId: z.string().uuid().nullable().optional(),
  guestId: z.string().uuid().nullable().optional(),
  source: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'VRBO', 'ICAL', 'MANUAL', 'WIDGET']).optional(),
  externalId: z.string().nullable().optional(),
  status: z.enum(['INQUIRY', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guestsCount: z.number().int().min(1).optional(),
  adults: z.number().int().min(0).optional(),
  children: z.number().int().min(0).optional(),
  infants: z.number().int().min(0).optional(),
  pets: z.number().int().min(0).optional(),
  nightlyRate: z.number().positive().optional(),
  cleaningFee: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED']).optional(),
  guestName: z.string().min(1).max(255).optional(),
  guestEmail: z.string().email().nullable().optional(),
  guestPhone: z.string().nullable().optional(),
  specialRequests: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['INQUIRY', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']).optional(),
  propertyId: z.string().uuid().optional(),
  source: z.enum(['DIRECT', 'AIRBNB', 'BOOKING_COM', 'VRBO', 'ICAL', 'MANUAL', 'WIDGET']).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'FAILED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['checkIn', 'createdAt', 'totalAmount', 'guestName', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class BookingsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { bookings, total, page, limit } = await bookingsService.getAllBookings(
        filters,
        userOwnerId,
      );

      sendPaginated(res, bookings, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const booking = await bookingsService.getBookingById(req.params.id as string, userOwnerId);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBookingSchema.parse(req.body);
      const booking = await bookingsService.createBooking(data);
      sendSuccess(res, booking, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBookingSchema.parse(req.body);
      const booking = await bookingsService.updateBooking(req.params.id as string, data);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = cancelBookingSchema.parse(req.body);
      const booking = await bookingsService.cancelBooking(req.params.id as string, reason);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingsService.deleteBooking(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const stats = await bookingsService.getBookingStats(userOwnerId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingsController = new BookingsController();
