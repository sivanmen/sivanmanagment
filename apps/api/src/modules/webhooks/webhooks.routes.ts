import { Router } from 'express';
import { webhooksController } from './webhooks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All webhook routes require admin auth
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', (req, res, next) => webhooksController.getAll(req, res, next));
router.post('/', (req, res, next) => webhooksController.create(req, res, next));
router.put('/:id', (req, res, next) => webhooksController.update(req, res, next));
router.delete('/:id', (req, res, next) => webhooksController.delete(req, res, next));
router.post('/:id/toggle', (req, res, next) => webhooksController.toggle(req, res, next));
router.post('/:id/test', (req, res, next) => webhooksController.test(req, res, next));
router.get('/deliveries', (req, res, next) => webhooksController.getDeliveries(req, res, next));

export default router;
