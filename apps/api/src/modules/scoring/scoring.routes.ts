import { Router } from 'express';
import { scoringController } from './scoring.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All scoring routes require authentication + admin
router.use(authMiddleware);
router.use(requireAdmin);

// Portfolio-level score summary (must be before /:propertyId to avoid route conflict)
router.get('/portfolio', (req, res, next) => scoringController.getPortfolioScore(req, res, next));

// Score configuration
router.get('/config', (req, res, next) => scoringController.getScoreConfig(req, res, next));
router.put('/config', (req, res, next) => scoringController.updateScoreConfig(req, res, next));

// Compare multiple property scores
router.post('/compare', (req, res, next) => scoringController.compareScores(req, res, next));

// All property scores
router.get('/', (req, res, next) => scoringController.getAllScores(req, res, next));

// Single property score
router.get('/:propertyId', (req, res, next) => scoringController.getPropertyScore(req, res, next));

// Trigger score recalculation
router.post('/:propertyId/recalculate', (req, res, next) => scoringController.recalculateScore(req, res, next));

// Score history
router.get('/:propertyId/history', (req, res, next) => scoringController.getScoreHistory(req, res, next));

// Improvement recommendations
router.get('/:propertyId/recommendations', (req, res, next) => scoringController.getRecommendations(req, res, next));

// Update recommendation status
router.put('/:propertyId/recommendations/:recId', (req, res, next) => scoringController.updateRecommendationStatus(req, res, next));

export default router;
