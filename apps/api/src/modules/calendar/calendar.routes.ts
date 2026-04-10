import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Calendar data - requires auth with RLS
router.get('/property/:propertyId', authMiddleware, (req, res, next) => calendarController.getCalendarData(req, res, next));

// Calendar blocks - admin only
router.post('/blocks', authMiddleware, requireAdmin, (req, res, next) => calendarController.createBlock(req, res, next));
router.put('/blocks/:id', authMiddleware, requireAdmin, (req, res, next) => calendarController.updateBlock(req, res, next));
router.delete('/blocks/:id', authMiddleware, requireAdmin, (req, res, next) => calendarController.deleteBlock(req, res, next));

// iCal feeds - admin only
router.get('/ical-feeds/:propertyId', authMiddleware, requireAdmin, (req, res, next) => calendarController.getIcalFeeds(req, res, next));
router.post('/ical-feeds', authMiddleware, requireAdmin, (req, res, next) => calendarController.createIcalFeed(req, res, next));
router.delete('/ical-feeds/:id', authMiddleware, requireAdmin, (req, res, next) => calendarController.deleteIcalFeed(req, res, next));

// iCal export - public endpoint for external calendar subscriptions
router.get('/export/:propertyId', (req, res, next) => calendarController.exportIcal(req, res, next));

export default router;
