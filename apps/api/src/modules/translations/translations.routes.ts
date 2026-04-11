import { Router } from 'express';
import { translationsController } from './translations.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/namespaces', (req, res, next) => translationsController.getNamespaces(req, res, next));
router.get('/stats', (req, res, next) => translationsController.getStats(req, res, next));
router.get('/export', (req, res, next) => translationsController.export(req, res, next));
router.get('/', (req, res, next) => translationsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => translationsController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => translationsController.create(req, res, next));
router.post('/import', requireAdmin, (req, res, next) => translationsController.import(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => translationsController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => translationsController.delete(req, res, next));

export default router;
