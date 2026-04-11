import { Router } from 'express';
import { calendarController } from './calendar.controller';
import { icalSyncController } from './ical-sync.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Calendar data - requires auth with RLS
router.get('/property/:propertyId', authMiddleware, (req, res, next) => calendarController.getCalendarData(req, res, next));

// Calendar blocks - admin only
router.post('/blocks', authMiddleware, requireAdmin, (req, res, next) => calendarController.createBlock(req, res, next));
router.put('/blocks/:id', authMiddleware, requireAdmin, (req, res, next) => calendarController.updateBlock(req, res, next));
router.delete('/blocks/:id', authMiddleware, requireAdmin, (req, res, next) => calendarController.deleteBlock(req, res, next));

// iCal feeds CRUD - admin only
router.get('/ical-feeds', authMiddleware, requireAdmin, (req, res, next) => icalSyncController.listFeeds(req, res, next));
router.get('/ical-feeds/:propertyId', authMiddleware, requireAdmin, (req, res, next) => calendarController.getIcalFeeds(req, res, next));
router.post('/ical-feeds', authMiddleware, requireAdmin, (req, res, next) => icalSyncController.createFeed(req, res, next));
router.delete('/ical-feeds/:id', authMiddleware, requireAdmin, (req, res, next) => icalSyncController.deleteFeed(req, res, next));

// iCal feed sync - admin only
router.post('/ical-feeds/:id/sync', authMiddleware, requireAdmin, (req, res, next) => icalSyncController.syncFeed(req, res, next));
router.post('/ical-feeds/sync-all', authMiddleware, requireAdmin, (req, res, next) => icalSyncController.syncAll(req, res, next));

// iCal export - PUBLIC endpoint (no auth) so Airbnb/Booking.com can fetch it
router.get('/export/:propertyId.ics', (req, res, next) => icalSyncController.exportFeed(req, res, next));
router.get('/export/:propertyId', (req, res, next) => icalSyncController.exportFeed(req, res, next));

export default router;
