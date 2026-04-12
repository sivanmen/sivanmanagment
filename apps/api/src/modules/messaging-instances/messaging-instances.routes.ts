import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole, requireAdmin } from '../../middleware/rbac.middleware';
import {
  listInstances,
  getInstance,
  createInstance,
  updateInstance,
  deleteInstance,
  testConnection,
  getQrCode,
  sendMessage,
  assignProperties,
  disconnectInstance,
} from './messaging-instances.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// List all instances (admin + manager)
router.get('/', listInstances);

// Get single instance
router.get('/:id', getInstance);

// Create new instance (admin only)
router.post('/', requireAdmin, createInstance);

// Update instance
router.put('/:id', requireAdmin, updateInstance);

// Delete instance
router.delete('/:id', requireAdmin, deleteInstance);

// Test connection to Evolution API
router.post('/:id/test', requireAdmin, testConnection);

// Get QR code for pairing
router.get('/:id/qr', requireAdmin, getQrCode);

// Disconnect instance
router.post('/:id/disconnect', requireAdmin, disconnectInstance);

// Send a message through an instance
router.post('/send', requireRole('SUPER_ADMIN', 'PROPERTY_MANAGER'), sendMessage);

// Assign properties to an instance
router.post('/:id/assign-properties', requireAdmin, assignProperties);

export default router;
