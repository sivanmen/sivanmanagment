import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.post('/2fa/setup', authMiddleware, (req, res, next) => authController.setup2FA(req, res, next));
router.post('/2fa/verify', authMiddleware, (req, res, next) => authController.verify2FA(req, res, next));

export default router;
