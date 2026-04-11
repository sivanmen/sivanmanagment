import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

// Stats endpoint (must come before /:id routes)
router.get('/stats', requireAdmin, (req, res, next) => usersController.getStats(req, res, next));

// CRUD
router.get('/', requireAdmin, (req, res, next) => usersController.getAll(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => usersController.getById(req, res, next));
router.post('/', requireSuperAdmin, (req, res, next) => usersController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => usersController.update(req, res, next));
router.delete('/:id', requireSuperAdmin, (req, res, next) => usersController.delete(req, res, next));

// Invite
router.post('/invite', requireSuperAdmin, (req, res, next) => usersController.invite(req, res, next));

// User actions
router.post('/:id/reset-password', requireSuperAdmin, (req, res, next) => usersController.resetPassword(req, res, next));
router.post('/:id/suspend', requireSuperAdmin, (req, res, next) => usersController.suspend(req, res, next));
router.post('/:id/activate', requireSuperAdmin, (req, res, next) => usersController.activate(req, res, next));

// Activity & Sessions
router.get('/:id/activity', requireAdmin, (req, res, next) => usersController.getActivity(req, res, next));
router.get('/:id/sessions', requireAdmin, (req, res, next) => usersController.getSessions(req, res, next));
router.delete('/:id/sessions/:sessionId', requireAdmin, (req, res, next) => usersController.revokeSession(req, res, next));

// Notification settings
router.put('/:id/notification-settings', requireAdmin, (req, res, next) => usersController.updateNotificationSettings(req, res, next));
router.put('/:id/quiet-hours', requireAdmin, (req, res, next) => usersController.updateQuietHours(req, res, next));

export default router;
