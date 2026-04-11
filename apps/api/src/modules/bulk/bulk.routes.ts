import { Router } from 'express';
import { bulkController } from './bulk.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All bulk routes require admin auth
router.use(authMiddleware);
router.use(requireAdmin);

router.post('/actions', (req, res, next) => bulkController.executeAction(req, res, next));
router.get('/actions', (req, res, next) => bulkController.getActions(req, res, next));
router.get('/actions/:id', (req, res, next) => bulkController.getActionById(req, res, next));
router.post('/export', (req, res, next) => bulkController.exportData(req, res, next));

export default router;
