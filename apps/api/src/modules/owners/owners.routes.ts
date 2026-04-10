import { Router } from 'express';
import { ownersController } from './owners.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All owner routes require authentication
router.use(authMiddleware);

// Owner CRUD
router.get('/', requireAdmin, (req, res, next) => ownersController.getAll(req, res, next));
router.get('/:id', (req, res, next) => ownersController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => ownersController.create(req, res, next));
router.put('/:id', (req, res, next) => ownersController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => ownersController.delete(req, res, next));

// Financial summary
router.get('/:id/financial-summary', (req, res, next) => ownersController.getFinancialSummary(req, res, next));

export default router;
