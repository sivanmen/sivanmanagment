import { Router } from 'express';
import { loyaltyController } from './loyalty.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All loyalty routes require authentication
router.use(authMiddleware);

// Own profile & transactions
router.get('/profile', (req, res, next) => loyaltyController.getProfile(req, res, next));
router.get('/transactions', (req, res, next) => loyaltyController.getTransactions(req, res, next));

// Available rewards (auth)
router.get('/rewards', (req, res, next) => loyaltyController.getRewards(req, res, next));

// Redeem (auth)
router.post('/redeem', (req, res, next) => loyaltyController.redeemPoints(req, res, next));

// Admin routes
router.post('/earn', requireAdmin, (req, res, next) => loyaltyController.earnPoints(req, res, next));
router.get('/members', requireAdmin, (req, res, next) => loyaltyController.getAllMembers(req, res, next));

export default router;
