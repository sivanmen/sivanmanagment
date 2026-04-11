import { Router } from 'express';
import { documentsController } from './documents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All document routes require authentication
router.use(authMiddleware);

// Entity-specific routes - must be before /:id to avoid route conflict
router.get('/property/:propertyId', (req, res, next) => documentsController.getByProperty(req, res, next));
router.get('/owner/:ownerId', (req, res, next) => documentsController.getByOwner(req, res, next));

// Document CRUD
router.get('/', (req, res, next) => documentsController.getAll(req, res, next));
router.get('/:id', (req, res, next) => documentsController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => documentsController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => documentsController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => documentsController.delete(req, res, next));

export default router;
