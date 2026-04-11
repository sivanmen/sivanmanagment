import { Router } from 'express';
import { templatesController } from './templates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All template routes require authentication
router.use(authMiddleware);

// Read
router.get('/', (req, res, next) => templatesController.getAll(req, res, next));
router.get('/:id', (req, res, next) => templatesController.getById(req, res, next));

// Write (admin only)
router.post('/', requireAdmin, (req, res, next) => templatesController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => templatesController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => templatesController.remove(req, res, next));

// Special actions
router.post('/:id/preview', (req, res, next) => templatesController.preview(req, res, next));
router.post('/:id/duplicate', requireAdmin, (req, res, next) => templatesController.duplicate(req, res, next));

export default router;
