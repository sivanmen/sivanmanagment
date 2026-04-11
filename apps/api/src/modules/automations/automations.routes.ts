import { Router } from 'express';
import { automationsController } from './automations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All automation routes require authentication + admin
router.use(authMiddleware);
router.use(requireAdmin);

// Logs - must be before /:id to avoid route conflict
router.get('/logs', (req, res, next) => automationsController.getLogs(req, res, next));

// CRUD
router.get('/', (req, res, next) => automationsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => automationsController.getById(req, res, next));
router.post('/', (req, res, next) => automationsController.create(req, res, next));
router.put('/:id', (req, res, next) => automationsController.update(req, res, next));
router.delete('/:id', (req, res, next) => automationsController.delete(req, res, next));

// Actions
router.post('/:id/toggle', (req, res, next) => automationsController.toggle(req, res, next));
router.post('/:id/test', (req, res, next) => automationsController.test(req, res, next));

export default router;
