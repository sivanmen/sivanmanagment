import { Router } from 'express';
import multer from 'multer';
import { uploadsController } from './uploads.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// Configure multer for memory storage (buffers for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max (per-type validation in controller)
    files: 20, // Max 20 files per request
  },
});

// All upload routes require authentication + admin role
router.use(authMiddleware);
router.use(requireAdmin);

// Upload property images (multiple files)
router.post(
  '/images',
  upload.array('files', 20),
  (req, res, next) => uploadsController.uploadImages(req, res, next),
);

// Upload documents (multiple files)
router.post(
  '/documents',
  upload.array('files', 10),
  (req, res, next) => uploadsController.uploadDocuments(req, res, next),
);

// Upload receipts (multiple files)
router.post(
  '/receipts',
  upload.array('files', 10),
  (req, res, next) => uploadsController.uploadReceipts(req, res, next),
);

// Delete a file by key (key can contain slashes)
router.delete(
  '/*',
  (req: any, res: any, next: any) => {
    // Extract everything after /api/v1/uploads/ as the key
    req.params.key = req.params[0];
    uploadsController.deleteFile(req, res, next);
  },
);

export default router;
