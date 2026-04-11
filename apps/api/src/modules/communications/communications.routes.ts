import { Router } from 'express';
import { communicationsController } from './communications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All communication routes require authentication
router.use(authMiddleware);

// Stats - must be before /:id to avoid route conflict
router.get('/stats', (req, res, next) => communicationsController.getStats(req, res, next));

// Thread CRUD
router.get('/', (req, res, next) => communicationsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => communicationsController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => communicationsController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => communicationsController.update(req, res, next));

// Messages
router.post('/:id/messages', (req, res, next) => communicationsController.addMessage(req, res, next));
router.put('/messages/:id/read', (req, res, next) => communicationsController.markMessageRead(req, res, next));

// Thread actions
router.post('/:id/assign', requireAdmin, (req, res, next) => communicationsController.assignThread(req, res, next));
router.post('/:id/resolve', requireAdmin, (req, res, next) => communicationsController.resolveThread(req, res, next));

export default router;
