import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// NOTE: The Stripe webhook endpoint is mounted directly in app.ts
// with express.raw() middleware BEFORE express.json(), so it is NOT
// included here. See app.ts for: POST /api/v1/payments/stripe/webhook

// All payment routes below require authentication
router.use(authMiddleware);

// --- Stripe Integration ---
// Create a payment intent for a booking
router.post('/create-intent', requireAdmin, (req, res, next) => paymentsController.createPaymentIntent(req, res, next));

// Generate a payment link (for guest email/WhatsApp)
router.post('/create-link', requireAdmin, (req, res, next) => paymentsController.createPaymentLink(req, res, next));

// Process a Stripe refund
router.post('/stripe-refund', requireAdmin, (req, res, next) => paymentsController.stripeRefund(req, res, next));

// Get payment status for a booking
router.get('/booking/:bookingId', (req, res, next) => paymentsController.getBookingPaymentStatus(req, res, next));

// --- Payment Methods (user's own) ---
router.get('/methods', (req, res, next) => paymentsController.getUserPaymentMethods(req, res, next));
router.post('/methods', (req, res, next) => paymentsController.addPaymentMethod(req, res, next));
router.delete('/methods/:id', (req, res, next) => paymentsController.removePaymentMethod(req, res, next));

// --- Refund (legacy, admin only) ---
router.post('/refund', requireAdmin, (req, res, next) => paymentsController.processRefund(req, res, next));

// --- Transactions ---
router.get('/transactions', (req, res, next) => paymentsController.getAllTransactions(req, res, next));
router.get('/transactions/:id', (req, res, next) => paymentsController.getTransactionById(req, res, next));
router.post('/transactions', requireAdmin, (req, res, next) => paymentsController.createTransaction(req, res, next));
router.put('/transactions/:id/status', requireAdmin, (req, res, next) => paymentsController.updateTransactionStatus(req, res, next));

export default router;
