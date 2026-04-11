import { Router } from 'express';
import { bookingEngineController } from './booking-engine.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// ── Admin routes (require auth + admin) ─────────────────────────────────────

router.get('/config/:propertyId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.getConfig(req, res, next),
);
router.put('/config/:propertyId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.upsertConfig(req, res, next),
);

router.get('/promotions/:propertyId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.getPromotions(req, res, next),
);
router.post('/promotions/:propertyId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.createPromotion(req, res, next),
);
router.put('/promotions/:promoId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.updatePromotion(req, res, next),
);
router.delete('/promotions/:promoId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingEngineController.deletePromotion(req, res, next),
);

// ── Public routes (no auth required) ────────────────────────────────────────

router.get('/public/search', (req, res, next) =>
  bookingEngineController.searchProperties(req, res, next),
);
router.get('/public/property/:propertyId', (req, res, next) =>
  bookingEngineController.getPropertyPublicInfo(req, res, next),
);
router.get('/public/availability/:propertyId', (req, res, next) =>
  bookingEngineController.checkAvailability(req, res, next),
);
router.post('/public/quote', (req, res, next) =>
  bookingEngineController.calculateQuote(req, res, next),
);
router.post('/public/book', (req, res, next) =>
  bookingEngineController.createDirectBooking(req, res, next),
);
router.post('/public/validate-promo', (req, res, next) =>
  bookingEngineController.validatePromoCode(req, res, next),
);

export default router;
