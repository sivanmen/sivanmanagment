import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireAdmin, (req, res, next) => usersController.getAll(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => usersController.getById(req, res, next));
router.post('/', requireSuperAdmin, (req, res, next) => usersController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => usersController.update(req, res, next));
router.delete('/:id', requireSuperAdmin, (req, res, next) => usersController.delete(req, res, next));

export default router;
