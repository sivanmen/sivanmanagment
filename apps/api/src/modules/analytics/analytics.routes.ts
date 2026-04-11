import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// Dashboard endpoints (accessible to all authenticated users)
router.get('/dashboard', requireAdmin, (req, res, next) => analyticsController.getDashboard(req, res, next));
router.get('/owner-dashboard', (req, res, next) => analyticsController.getOwnerDashboard(req, res, next));

// Admin-only analytics
router.use(requireAdmin);

// Revenue overview with date/property filters
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));

// Property performance ranking
router.get('/properties', (req, res, next) => analyticsController.getPropertyPerformance(req, res, next));

// Channel distribution analytics
router.get('/channels', (req, res, next) => analyticsController.getChannelAnalytics(req, res, next));

// Revenue forecast
router.get('/forecast', (req, res, next) => analyticsController.getForecast(req, res, next));

// Owner financial reports
router.get('/owners', (req, res, next) => analyticsController.getOwnerReports(req, res, next));

// KPI dashboard summary
router.get('/kpi', (req, res, next) => analyticsController.getKPIDashboard(req, res, next));

// Side-by-side property comparison
router.get('/comparison', (req, res, next) => analyticsController.getComparisonReport(req, res, next));

// Seasonal trend analysis
router.get('/seasonal', (req, res, next) => analyticsController.getSeasonalTrends(req, res, next));

// Export report data
router.get('/export', (req, res, next) => analyticsController.exportReport(req, res, next));

// Occupancy heatmap for a property (must be after all non-parameterized routes)
router.get('/occupancy/:propertyId', (req, res, next) => analyticsController.getOccupancyHeatmap(req, res, next));

export default router;
