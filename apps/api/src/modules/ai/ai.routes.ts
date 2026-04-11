import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Chat sessions
router.get('/sessions', (req, res, next) => aiController.getSessions(req, res, next));
router.get('/sessions/:id', (req, res, next) => aiController.getSessionMessages(req, res, next));
router.post('/chat', (req, res, next) => aiController.chat(req, res, next));
router.delete('/sessions/:id', (req, res, next) => aiController.deleteSession(req, res, next));

// AI Recommendations
router.get('/recommendations', (req, res, next) => aiController.getRecommendations(req, res, next));
router.put('/recommendations/:id', (req, res, next) => aiController.updateRecommendation(req, res, next));

export default router;
