import { Router } from 'express';
import { channelsController } from './channels.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All channel routes require authentication + admin
router.use(authMiddleware);
router.use(requireAdmin);

// Stats - must be before /:id to avoid route conflict
router.get('/stats', (req, res, next) => channelsController.getStats(req, res, next));

// Channel CRUD
router.get('/', (req, res, next) => channelsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => channelsController.getById(req, res, next));
router.post('/', (req, res, next) => channelsController.create(req, res, next));
router.put('/:id', (req, res, next) => channelsController.update(req, res, next));
router.delete('/:id', (req, res, next) => channelsController.delete(req, res, next));

// Sync
router.post('/:id/sync', (req, res, next) => channelsController.sync(req, res, next));

export default router;
