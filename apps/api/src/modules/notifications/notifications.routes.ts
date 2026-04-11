import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// ==========================================
// User's own notifications (existing)
// ==========================================

// Unread count - must be before /:id to avoid route conflict
router.get('/unread-count', (req, res, next) => notificationsController.getUnreadCount(req, res, next));

// Mark all as read - must be before /:id to avoid route conflict
router.put('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));

// Notifications CRUD (own only)
router.get('/', (req, res, next) => notificationsController.getAll(req, res, next));
router.put('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationsController.delete(req, res, next));

// ==========================================
// Channel configuration (admin only)
// ==========================================

router.get('/channels', requireAdmin, (req, res, next) => notificationsController.getChannels(req, res, next));
router.post('/channels', requireAdmin, (req, res, next) => notificationsController.createChannel(req, res, next));
router.put('/channels/:id', requireAdmin, (req, res, next) => notificationsController.updateChannel(req, res, next));
router.delete('/channels/:id', requireAdmin, (req, res, next) => notificationsController.deleteChannel(req, res, next));
router.post('/channels/:id/test', requireAdmin, (req, res, next) => notificationsController.testChannel(req, res, next));

// ==========================================
// User notification preferences (admin)
// ==========================================

router.get('/users/:userId/preferences', requireAdmin, (req, res, next) => notificationsController.getUserPreferences(req, res, next));
router.put('/users/:userId/preferences', requireAdmin, (req, res, next) => notificationsController.updateUserPreferences(req, res, next));

// ==========================================
// Send notification (admin)
// ==========================================

router.post('/send', requireAdmin, (req, res, next) => notificationsController.sendNotification(req, res, next));

export default router;
