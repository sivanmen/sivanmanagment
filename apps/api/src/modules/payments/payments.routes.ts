import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All payment routes require authentication
router.use(authMiddleware);

// Payment methods (user's own)
router.get('/methods', (req, res, next) => paymentsController.getUserPaymentMethods(req, res, next));
router.post('/methods', (req, res, next) => paymentsController.addPaymentMethod(req, res, next));
router.delete('/methods/:id', (req, res, next) => paymentsController.removePaymentMethod(req, res, next));

// Refund (admin only)
router.post('/refund', requireAdmin, (req, res, next) => paymentsController.processRefund(req, res, next));

// Transactions
router.get('/transactions', (req, res, next) => paymentsController.getAllTransactions(req, res, next));
router.get('/transactions/:id', (req, res, next) => paymentsController.getTransactionById(req, res, next));
router.post('/transactions', requireAdmin, (req, res, next) => paymentsController.createTransaction(req, res, next));
router.put('/transactions/:id/status', requireAdmin, (req, res, next) => paymentsController.updateTransactionStatus(req, res, next));

export default router;
