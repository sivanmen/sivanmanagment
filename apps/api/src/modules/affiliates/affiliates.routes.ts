import { Router } from 'express';
import { affiliatesController } from './affiliates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Public route - track referral clicks (no auth required)
router.post('/track', (req, res, next) => affiliatesController.trackReferral(req, res, next));

// All other routes require authentication
router.use(authMiddleware);

// Own profile
router.get('/profile', (req, res, next) => affiliatesController.getProfile(req, res, next));

// Admin routes
router.get('/', requireAdmin, (req, res, next) => affiliatesController.getAll(req, res, next));
router.post('/', requireAdmin, (req, res, next) => affiliatesController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => affiliatesController.update(req, res, next));

// Referrals & stats (admin or own - checked in controller)
router.get('/:id/referrals', (req, res, next) => affiliatesController.getReferrals(req, res, next));
router.get('/:id/stats', (req, res, next) => affiliatesController.getStats(req, res, next));

export default router;
