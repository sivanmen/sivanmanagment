import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All maintenance routes require authentication
router.use(authMiddleware);

// Stats - must be before /:id to avoid route conflict
router.get('/stats', (req, res, next) => maintenanceController.getStats(req, res, next));

// Maintenance CRUD
router.get('/', (req, res, next) => maintenanceController.getAll(req, res, next));
router.get('/:id', (req, res, next) => maintenanceController.getById(req, res, next));
router.post('/', (req, res, next) => maintenanceController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => maintenanceController.update(req, res, next));
router.post('/:id/assign', requireAdmin, (req, res, next) => maintenanceController.assign(req, res, next));
router.post('/:id/complete', requireAdmin, (req, res, next) => maintenanceController.complete(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => maintenanceController.delete(req, res, next));

export default router;
