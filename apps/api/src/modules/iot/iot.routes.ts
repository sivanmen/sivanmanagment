import { Router } from 'express';
import { iotController } from './iot.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', (req, res, next) => iotController.getDashboard(req, res, next));
router.get('/', (req, res, next) => iotController.getAll(req, res, next));
router.get('/:id', (req, res, next) => iotController.getById(req, res, next));
router.get('/:id/events', (req, res, next) => iotController.getEvents(req, res, next));
router.post('/', requireAdmin, (req, res, next) => iotController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => iotController.update(req, res, next));
router.post('/:id/command', requireAdmin, (req, res, next) => iotController.sendCommand(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => iotController.delete(req, res, next));

export default router;
