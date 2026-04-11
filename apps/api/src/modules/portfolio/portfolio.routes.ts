import { Router } from 'express';
import { portfolioController } from './portfolio.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

// Portfolio endpoints (own data only)
router.get('/overview', (req, res, next) => portfolioController.getOverview(req, res, next));
router.get('/properties', (req, res, next) => portfolioController.getProperties(req, res, next));
router.get('/trend', (req, res, next) => portfolioController.getTrend(req, res, next));
router.get('/comparison', (req, res, next) => portfolioController.getComparison(req, res, next));

export default router;
