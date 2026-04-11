import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// All report routes require authentication (RLS handled in service)
router.use(authMiddleware);

router.get('/occupancy', (req, res, next) => reportsController.getOccupancy(req, res, next));
router.get('/revenue', (req, res, next) => reportsController.getRevenue(req, res, next));
router.get('/bookings', (req, res, next) => reportsController.getBookings(req, res, next));
router.get('/maintenance', (req, res, next) => reportsController.getMaintenance(req, res, next));
router.get('/owner-statement/:ownerId', (req, res, next) => reportsController.getOwnerStatement(req, res, next));
router.get('/portfolio', (req, res, next) => reportsController.getPortfolio(req, res, next));

export default router;
