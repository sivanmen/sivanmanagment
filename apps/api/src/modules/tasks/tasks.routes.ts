import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

// Stats and upcoming - must be before /:id to avoid route conflict
router.get('/stats', (req, res, next) => tasksController.getStats(req, res, next));
router.get('/upcoming', (req, res, next) => tasksController.getUpcoming(req, res, next));

// Task CRUD
router.get('/', (req, res, next) => tasksController.getAll(req, res, next));
router.get('/:id', (req, res, next) => tasksController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => tasksController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => tasksController.update(req, res, next));
router.post('/:id/assign', requireAdmin, (req, res, next) => tasksController.assign(req, res, next));
router.post('/:id/complete', requireAdmin, (req, res, next) => tasksController.complete(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => tasksController.delete(req, res, next));

// Assignment management
router.put('/assignments/:id', (req, res, next) => tasksController.updateAssignment(req, res, next));

export default router;
