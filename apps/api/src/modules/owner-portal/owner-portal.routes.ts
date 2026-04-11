import { Router } from 'express';
import { ownerPortalController } from './owner-portal.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Portal Config
router.get('/config/:ownerId', (req, res, next) => ownerPortalController.getConfig(req, res, next));
router.put('/config/:ownerId', requireAdmin, (req, res, next) => ownerPortalController.updateConfig(req, res, next));

// Owner Reservations
router.get('/reservations', (req, res, next) => ownerPortalController.getReservations(req, res, next));
router.post('/reservations', (req, res, next) => ownerPortalController.createReservation(req, res, next));
router.put('/reservations/:id/approve', requireAdmin, (req, res, next) => ownerPortalController.approveReservation(req, res, next));
router.put('/reservations/:id/reject', requireAdmin, (req, res, next) => ownerPortalController.rejectReservation(req, res, next));
router.put('/reservations/:id/cancel', (req, res, next) => ownerPortalController.cancelReservation(req, res, next));

// Statements
router.post('/statements/generate', requireAdmin, (req, res, next) => ownerPortalController.generateStatement(req, res, next));
router.get('/statements', (req, res, next) => ownerPortalController.getStatements(req, res, next));
router.get('/statements/:id', (req, res, next) => ownerPortalController.getStatementById(req, res, next));
router.post('/statements/:id/approve', requireAdmin, (req, res, next) => ownerPortalController.approveStatement(req, res, next));
router.post('/statements/:id/send', requireAdmin, (req, res, next) => ownerPortalController.sendStatement(req, res, next));

// Export
router.get('/export/:ownerId', requireAdmin, (req, res, next) => ownerPortalController.exportOwnerData(req, res, next));

export default router;
