import { Router } from 'express';
import { guestsController } from './guests.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All guest routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// Guest CRUD
router.get('/', (req, res, next) => guestsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => guestsController.getById(req, res, next));
router.post('/', (req, res, next) => guestsController.create(req, res, next));
router.put('/:id', (req, res, next) => guestsController.update(req, res, next));
router.delete('/:id', (req, res, next) => guestsController.delete(req, res, next));

// Merge guests
router.post('/merge', (req, res, next) => guestsController.merge(req, res, next));

export default router;
