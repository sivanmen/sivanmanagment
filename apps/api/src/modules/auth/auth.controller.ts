import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  locale: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const verify2FASchema = z.object({
  token: z.string().length(6),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(
        email,
        password,
        req.headers['user-agent'],
        req.ip,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.setup2FA(req.user!.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = verify2FASchema.parse(req.body);
      const result = await authService.verify2FA(req.user!.userId, token);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
