import { Router } from 'express';
import { pricingController } from './pricing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Price calculation & calendar - auth only
router.post('/calculate', authMiddleware, (req, res, next) =>
  pricingController.calculate(req, res, next),
);
router.get('/calendar/:propertyId', authMiddleware, (req, res, next) =>
  pricingController.getCalendar(req, res, next),
);

// Admin-only routes
router.get('/', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.getAll(req, res, next),
);
router.post('/', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.create(req, res, next),
);
router.put('/:id', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.update(req, res, next),
);
router.delete('/:id', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.delete(req, res, next),
);
router.post('/:id/toggle', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.toggle(req, res, next),
);
router.post('/simulate', authMiddleware, requireAdmin, (req, res, next) =>
  pricingController.simulate(req, res, next),
);

export default router;
