import { Router } from 'express';
import { adminController } from './admin.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Health check (admin)
router.get('/health', requireAdmin, (req, res, next) => adminController.getSystemHealth(req, res, next));

// System stats (super admin)
router.get('/stats', requireSuperAdmin, (req, res, next) => adminController.getSystemStats(req, res, next));

// User management
router.get('/users', requireAdmin, (req, res, next) => adminController.getAllUsers(req, res, next));
router.put('/users/:id/role', requireSuperAdmin, (req, res, next) => adminController.updateUserRole(req, res, next));
router.post('/users/:id/suspend', requireSuperAdmin, (req, res, next) => adminController.suspendUser(req, res, next));
router.post('/users/:id/activate', requireSuperAdmin, (req, res, next) => adminController.activateUser(req, res, next));

// Audit log (super admin)
router.get('/audit-log', requireSuperAdmin, (req, res, next) => adminController.getAuditLog(req, res, next));

export default router;
