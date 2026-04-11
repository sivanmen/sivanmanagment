import { Router } from 'express';
import { guestExperienceController } from './guest-experience.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// ── Check-in Forms ────────────────────────────────────────────────────────

// Public: guest submits their check-in form
router.put('/check-in/:id/submit', (req, res, next) =>
  guestExperienceController.submitCheckInForm(req, res, next),
);

// Admin: list all check-in forms
router.get('/check-in', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.getCheckInForms(req, res, next),
);

// Auth: get a specific check-in form
router.get('/check-in/:id', authMiddleware, (req, res, next) =>
  guestExperienceController.getCheckInForm(req, res, next),
);

// Admin: create a check-in form for a booking
router.post('/check-in/:bookingId', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.createCheckInForm(req, res, next),
);

// Admin: verify a check-in form
router.post('/check-in/:id/verify', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.verifyCheckInForm(req, res, next),
);

// ── Guidebooks ────────────────────────────────────────────────────────────

// Public: get published guidebook for guest access
router.get('/guidebook/:propertyId/public', (req, res, next) =>
  guestExperienceController.getPublicGuidebook(req, res, next),
);

// Admin: list all guidebooks
router.get('/guidebooks', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.getAllGuidebooks(req, res, next),
);

// Auth: get guidebook for a property
router.get('/guidebook/:propertyId', authMiddleware, (req, res, next) =>
  guestExperienceController.getGuidebook(req, res, next),
);

// Admin: create a guidebook
router.post('/guidebook', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.createGuidebook(req, res, next),
);

// Admin: update a guidebook
router.put('/guidebook/:propertyId', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.updateGuidebook(req, res, next),
);

// Admin: publish a guidebook
router.post('/guidebook/:propertyId/publish', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.publishGuidebook(req, res, next),
);

// ── Contracts ─────────────────────────────────────────────────────────────

// Public: guest signs a contract
router.post('/contracts/:id/sign', (req, res, next) =>
  guestExperienceController.signContract(req, res, next),
);

// Auth: get contracts for a booking
router.get('/contracts/booking/:bookingId', authMiddleware, (req, res, next) =>
  guestExperienceController.getContractsByBooking(req, res, next),
);

// Admin: list all contracts
router.get('/contracts', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.getContracts(req, res, next),
);

// Admin: create a contract
router.post('/contracts', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.createContract(req, res, next),
);

// Admin: send a contract
router.post('/contracts/:id/send', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.sendContract(req, res, next),
);

// ── Upsells ───────────────────────────────────────────────────────────────

// Auth: get upsell orders for a booking
router.get('/upsells/orders/:bookingId', authMiddleware, (req, res, next) =>
  guestExperienceController.getUpsellOrders(req, res, next),
);

// Auth: list all upsells
router.get('/upsells', authMiddleware, (req, res, next) =>
  guestExperienceController.getUpsells(req, res, next),
);

// Admin: create an upsell
router.post('/upsells', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.createUpsell(req, res, next),
);

// Auth: order an upsell
router.post('/upsells/order', authMiddleware, (req, res, next) =>
  guestExperienceController.orderUpsell(req, res, next),
);

// Admin: update an upsell
router.put('/upsells/:id', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.updateUpsell(req, res, next),
);

// Admin: delete an upsell
router.delete('/upsells/:id', authMiddleware, requireAdmin, (req, res, next) =>
  guestExperienceController.deleteUpsell(req, res, next),
);

export default router;
