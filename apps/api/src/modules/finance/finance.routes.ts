import { Router } from 'express';
import { financeController } from './finance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All finance routes require authentication
router.use(authMiddleware);

// ── Income ───────────────────────────────────────────────────
router.get('/income', (req, res, next) => financeController.getIncome(req, res, next));
router.post('/income', requireAdmin, (req, res, next) => financeController.createIncome(req, res, next));
router.put('/income/:id', requireAdmin, (req, res, next) => financeController.updateIncome(req, res, next));
router.delete('/income/:id', requireAdmin, (req, res, next) => financeController.deleteIncome(req, res, next));

// ── Expenses ─────────────────────────────────────────────────
router.get('/expenses', (req, res, next) => financeController.getExpenses(req, res, next));
router.post('/expenses', requireAdmin, (req, res, next) => financeController.createExpense(req, res, next));
router.put('/expenses/:id', requireAdmin, (req, res, next) => financeController.updateExpense(req, res, next));
router.delete('/expenses/:id', requireAdmin, (req, res, next) => financeController.deleteExpense(req, res, next));
router.post('/expenses/:id/approve', requireAdmin, (req, res, next) => financeController.approveExpense(req, res, next));
router.post('/expenses/:id/reject', requireAdmin, (req, res, next) => financeController.rejectExpense(req, res, next));

// ── Summary & Trend ──────────────────────────────────────────
router.get('/summary', (req, res, next) => financeController.getSummary(req, res, next));
router.get('/trend', (req, res, next) => financeController.getTrend(req, res, next));

export default router;
