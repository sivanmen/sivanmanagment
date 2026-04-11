import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// Unread count - must be before /:id to avoid route conflict
router.get('/unread-count', (req, res, next) => notificationsController.getUnreadCount(req, res, next));

// Mark all as read - must be before /:id to avoid route conflict
router.put('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));

// Notifications CRUD (own only)
router.get('/', (req, res, next) => notificationsController.getAll(req, res, next));
router.put('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));
router.delete('/:id', (req, res, next) => notificationsController.delete(req, res, next));

export default router;
