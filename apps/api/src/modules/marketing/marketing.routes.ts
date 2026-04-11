import { Router } from 'express';
import { marketingController } from './marketing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All marketing routes require authentication and admin access
router.use(authMiddleware);
router.use(requireAdmin);

// Widgets
router.get('/widgets', (req, res, next) => marketingController.getWidgets(req, res, next));
router.get('/widgets/:id', (req, res, next) => marketingController.getWidgetById(req, res, next));
router.get('/widgets/:id/stats', (req, res, next) => marketingController.getWidgetStats(req, res, next));
router.post('/widgets', (req, res, next) => marketingController.createWidget(req, res, next));
router.put('/widgets/:id', (req, res, next) => marketingController.updateWidget(req, res, next));
router.delete('/widgets/:id', (req, res, next) => marketingController.deleteWidget(req, res, next));

// Booking Pages (Direct Booking Settings)
router.get('/pages', (req, res, next) => marketingController.getBookingPages(req, res, next));
router.post('/pages', (req, res, next) => marketingController.createBookingPage(req, res, next));
router.put('/pages/:id', (req, res, next) => marketingController.updateBookingPage(req, res, next));

export default router;
