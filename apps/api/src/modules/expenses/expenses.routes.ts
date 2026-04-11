import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/stats', (req, res, next) => expensesController.getStats(req, res, next));
router.get('/recurring', (req, res, next) => expensesController.getRecurring(req, res, next));
router.get('/budget', (req, res, next) => expensesController.getBudgetVsActual(req, res, next));

// Approval workflow
router.get('/approvals', (req, res, next) => expensesController.getApprovalRequests(req, res, next));
router.get('/approvals/owner/:ownerId/pending', (req, res, next) => expensesController.getPendingApprovalsForOwner(req, res, next));
router.get('/approvals/owner/:ownerId/history', (req, res, next) => expensesController.getApprovalHistoryForOwner(req, res, next));
router.get('/approvals/threshold/:propertyId', (req, res, next) => expensesController.getApprovalThreshold(req, res, next));
router.post('/approvals/reminder/:requestId', requireAdmin, (req, res, next) => expensesController.sendApprovalReminder(req, res, next));

router.get('/', (req, res, next) => expensesController.getAll(req, res, next));
router.get('/:id', (req, res, next) => expensesController.getById(req, res, next));
router.post('/', (req, res, next) => expensesController.create(req, res, next));
router.put('/:id', (req, res, next) => expensesController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => expensesController.delete(req, res, next));
router.post('/:id/approve', requireAdmin, (req, res, next) => expensesController.approve(req, res, next));
router.post('/:id/reject', requireAdmin, (req, res, next) => expensesController.reject(req, res, next));
router.post('/:id/pay', requireAdmin, (req, res, next) => expensesController.markPaid(req, res, next));
router.post('/:id/request-approval', (req, res, next) => expensesController.requestApproval(req, res, next));
router.post('/:id/approve-web', (req, res, next) => expensesController.approveViaWeb(req, res, next));
router.post('/:id/reject-web', (req, res, next) => expensesController.rejectViaWeb(req, res, next));

export default router;
