import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/stats', (req, res, next) => reviewsController.getStats(req, res, next));
router.get('/', (req, res, next) => reviewsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => reviewsController.getById(req, res, next));
router.post('/:id/respond', requireAdmin, (req, res, next) => reviewsController.respond(req, res, next));
router.put('/:id/status', requireAdmin, (req, res, next) => reviewsController.updateStatus(req, res, next));
router.get('/:id/suggest-response', (req, res, next) => reviewsController.suggestResponse(req, res, next));

export default router;
