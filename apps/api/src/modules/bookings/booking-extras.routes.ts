import { Router } from 'express';
import { bookingExtrasController } from './booking-extras.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// ── Quotes ──────────────────────────────────────────────────────────────────

router.get('/quotes', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.getQuotes(req, res, next),
);
router.post('/quotes', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.createQuote(req, res, next),
);
router.get('/quotes/:id', authMiddleware, (req, res, next) =>
  bookingExtrasController.getQuoteById(req, res, next),
);
router.post('/quotes/:id/send', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.sendQuote(req, res, next),
);
router.post('/quotes/:id/convert', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.convertQuote(req, res, next),
);
router.put('/quotes/:id/status', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.updateQuoteStatus(req, res, next),
);

// ── Folio ───────────────────────────────────────────────────────────────────

router.get('/folio/:bookingId', authMiddleware, (req, res, next) =>
  bookingExtrasController.getFolio(req, res, next),
);
router.post('/folio/:bookingId/items', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.addFolioItem(req, res, next),
);
router.delete('/folio/:bookingId/items/:itemId', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.removeFolioItem(req, res, next),
);

// ── Group Reservations ──────────────────────────────────────────────────────

router.get('/groups', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.getGroups(req, res, next),
);
router.post('/groups', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.createGroup(req, res, next),
);
router.get('/groups/:id', authMiddleware, (req, res, next) =>
  bookingExtrasController.getGroupById(req, res, next),
);
router.post('/groups/:id/bookings', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.addBookingToGroup(req, res, next),
);
router.put('/groups/:id/status', authMiddleware, requireAdmin, (req, res, next) =>
  bookingExtrasController.updateGroupStatus(req, res, next),
);

export default router;
