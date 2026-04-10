import { Router } from 'express';
import { propertiesController } from './properties.controller';
import { unitsController } from './units.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All property routes require authentication
router.use(authMiddleware);

// Property stats - must be before /:id to avoid route conflict
router.get('/stats', requireAdmin, (req, res, next) => propertiesController.getStats(req, res, next));

// Property CRUD
router.get('/', (req, res, next) => propertiesController.getAll(req, res, next));
router.get('/:id', (req, res, next) => propertiesController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => propertiesController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => propertiesController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => propertiesController.delete(req, res, next));

// Property Units (nested under property)
router.get('/:propertyId/units', (req, res, next) => unitsController.getAll(req, res, next));
router.get('/:propertyId/units/:unitId', (req, res, next) => unitsController.getById(req, res, next));
router.post('/:propertyId/units', requireAdmin, (req, res, next) => unitsController.create(req, res, next));
router.put('/:propertyId/units/:unitId', requireAdmin, (req, res, next) => unitsController.update(req, res, next));
router.delete('/:propertyId/units/:unitId', requireAdmin, (req, res, next) => unitsController.delete(req, res, next));

export default router;
