import { z } from 'zod';
import { BookingSource, BookingStatus, PaymentStatus } from '../types/booking.types';

export const createBookingSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  unitId: z.string().uuid('Invalid unit ID').optional(),
  guestId: z.string().uuid('Invalid guest ID'),
  source: z.nativeEnum(BookingSource),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format'),
  guests: z.number().int().min(1, 'At least 1 guest is required'),
  adultsCount: z.number().int().min(1).optional(),
  childrenCount: z.number().int().min(0).optional(),
  infantsCount: z.number().int().min(0).optional(),
  nightlyRate: z.number().positive('Nightly rate must be positive'),
  cleaningFee: z.number().min(0).default(0),
  serviceFee: z.number().min(0).default(0),
  taxes: z.number().min(0).default(0),
  extraCharges: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  guestNotes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  specialRequests: z.string().max(2000).optional(),
  externalBookingId: z.string().max(200).optional(),
}).refine(
  (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  }
);

export const updateBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  propertyId: z.string().uuid('Invalid property ID').optional(),
  unitId: z.string().uuid('Invalid unit ID').optional().nullable(),
  guestId: z.string().uuid('Invalid guest ID').optional(),
  source: z.nativeEnum(BookingSource).optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').optional(),
  guests: z.number().int().min(1).optional(),
  adultsCount: z.number().int().min(1).optional(),
  childrenCount: z.number().int().min(0).optional(),
  infantsCount: z.number().int().min(0).optional(),
  nightlyRate: z.number().positive().optional(),
  cleaningFee: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  extraCharges: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  guestNotes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  specialRequests: z.string().max(2000).optional(),
  cancellationReason: z.string().max(1000).optional(),
  externalBookingId: z.string().max(200).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
