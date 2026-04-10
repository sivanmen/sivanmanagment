import { Router } from 'express';
import { feesController } from './fees.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All fee routes require authentication
router.use(authMiddleware);

// Summary must be before /:id to avoid route conflict
router.get('/summary', (req, res, next) => feesController.getSummary(req, res, next));

// Calculate fees
router.post('/calculate', requireSuperAdmin, (req, res, next) => feesController.calculateMonthly(req, res, next));
router.post('/calculate/:propertyId', requireAdmin, (req, res, next) => feesController.calculateProperty(req, res, next));

// Fee calculations list
router.get('/', (req, res, next) => feesController.getAll(req, res, next));

// Update status
router.put('/:id/status', requireAdmin, (req, res, next) => feesController.updateStatus(req, res, next));

export default router;
