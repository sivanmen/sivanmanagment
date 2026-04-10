import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All booking routes require authentication
router.use(authMiddleware);

// Stats - must be before /:id to avoid route conflict
router.get('/stats', (req, res, next) => bookingsController.getStats(req, res, next));

// Booking CRUD
router.get('/', (req, res, next) => bookingsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => bookingsController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => bookingsController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => bookingsController.update(req, res, next));
router.post('/:id/cancel', requireAdmin, (req, res, next) => bookingsController.cancel(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => bookingsController.delete(req, res, next));

export default router;
