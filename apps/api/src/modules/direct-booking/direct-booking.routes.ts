import { Router } from 'express';
import { directBookingController } from './direct-booking.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Public endpoints (no auth)
router.get('/public/search', (req, res, next) => directBookingController.searchProperties(req, res, next));
router.get('/public/property/:propertyId', (req, res, next) => directBookingController.getPropertyDetails(req, res, next));
router.get('/public/availability/:propertyId', (req, res, next) => directBookingController.checkAvailability(req, res, next));
router.get('/public/price/:propertyId', (req, res, next) => directBookingController.calculatePrice(req, res, next));
router.post('/public/book', (req, res, next) => directBookingController.createBooking(req, res, next));
router.post('/public/payment/:bookingId', (req, res, next) => directBookingController.createPaymentIntent(req, res, next));
router.get('/public/confirmation/:bookingId', (req, res, next) => directBookingController.getConfirmation(req, res, next));

// Admin endpoints (auth required)
router.use(authMiddleware);
router.get('/bookings', requireAdmin, (req, res, next) => directBookingController.getAllBookings(req, res, next));

export default router;
