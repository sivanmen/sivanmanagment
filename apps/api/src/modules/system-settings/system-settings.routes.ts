import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../../middleware/rbac.middleware';
import {
  listSettings,
  getSetting,
  setSetting,
  bulkUpdateSettings,
  deleteSetting,
  getCategories,
} from './system-settings.controller';

const router = Router();

router.use(authMiddleware);

// List all settings (admin)
router.get('/', requireAdmin, listSettings);

// Get categories
router.get('/categories', requireAdmin, getCategories);

// Get single setting
router.get('/:key', requireAdmin, getSetting);

// Create/update setting
router.post('/', requireAdmin, setSetting);

// Bulk update
router.put('/bulk', requireAdmin, bulkUpdateSettings);

// Delete setting (super admin only)
router.delete('/:key', requireSuperAdmin, deleteSetting);

export default router;
