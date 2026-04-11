import { Router } from 'express';
import { templatesController } from './templates.controller';
import { aiProvidersController } from './ai-providers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All template routes require authentication
router.use(authMiddleware);

// ── AI Provider Routes (admin only) ──────────────────────────────
router.get('/ai/providers', requireAdmin, (req, res, next) => aiProvidersController.getAll(req, res, next));
router.post('/ai/providers', requireAdmin, (req, res, next) => aiProvidersController.create(req, res, next));
router.put('/ai/providers/:id', requireAdmin, (req, res, next) => aiProvidersController.update(req, res, next));
router.delete('/ai/providers/:id', requireAdmin, (req, res, next) => aiProvidersController.remove(req, res, next));
router.post('/ai/providers/:id/test', requireAdmin, (req, res, next) => aiProvidersController.test(req, res, next));
router.put('/ai/providers/:id/default', requireAdmin, (req, res, next) => aiProvidersController.setDefault(req, res, next));

// ── AI Template Actions (admin only) ─────────────────────────────
router.post('/ai/translate', requireAdmin, (req, res, next) => templatesController.translate(req, res, next));
router.post('/ai/translate-all', requireAdmin, (req, res, next) => templatesController.translateAll(req, res, next));
router.post('/ai/improve', requireAdmin, (req, res, next) => templatesController.improve(req, res, next));
router.post('/ai/generate', requireAdmin, (req, res, next) => templatesController.generate(req, res, next));

// ── Template Render (preview) ────────────────────────────────────
router.post('/render', (req, res, next) => templatesController.render(req, res, next));

// ── Template CRUD ────────────────────────────────────────────────
router.get('/', (req, res, next) => templatesController.getAll(req, res, next));
router.get('/:id', (req, res, next) => templatesController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => templatesController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => templatesController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => templatesController.remove(req, res, next));
router.post('/:id/duplicate', requireAdmin, (req, res, next) => templatesController.duplicate(req, res, next));

export default router;
