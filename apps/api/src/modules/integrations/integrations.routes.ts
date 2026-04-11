import { Router } from 'express';
import { integrationsController } from './integrations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/dashboard', (req, res, next) => integrationsController.getDashboard(req, res, next));
router.get('/', (req, res, next) => integrationsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => integrationsController.getById(req, res, next));
router.get('/:id/sync-logs', (req, res, next) => integrationsController.getSyncLogs(req, res, next));
router.post('/', (req, res, next) => integrationsController.create(req, res, next));
router.put('/:id', (req, res, next) => integrationsController.update(req, res, next));
router.post('/:id/sync', (req, res, next) => integrationsController.sync(req, res, next));
router.post('/:id/test', (req, res, next) => integrationsController.testConnection(req, res, next));
router.delete('/:id', (req, res, next) => integrationsController.delete(req, res, next));

export default router;
