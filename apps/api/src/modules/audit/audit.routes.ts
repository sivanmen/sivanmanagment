import { Router } from 'express';
import { auditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', (req, res, next) => auditController.getLog(req, res, next));
router.get('/stats', (req, res, next) => auditController.getStats(req, res, next));
router.get('/user/:userId', (req, res, next) => auditController.getUserActivity(req, res, next));
router.get('/entity/:entity/:entityId', (req, res, next) => auditController.getEntityHistory(req, res, next));
router.get('/:id', (req, res, next) => auditController.getEntry(req, res, next));

export default router;
