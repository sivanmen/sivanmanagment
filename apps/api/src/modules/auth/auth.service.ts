import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as OTPAuth from 'otpauth';
import { prisma } from '../../prisma/client';
import { config } from '../../config';
import { ApiError } from '../../utils/api-error';
import { TokenPayload } from '../../middleware/auth.middleware';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    locale?: string;
    role?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        preferredLocale: data.locale || 'en',
        role: (data.role as any) || 'OWNER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    // If owner role, create owner record
    if (user.role === 'OWNER' || user.role === 'VIP_STAR') {
      await prisma.owner.create({
        data: {
          userId: user.id,
          defaultManagementFeePercent: 25,
          defaultMinimumMonthlyFee: 0,
          expenseApprovalThreshold: 100,
        },
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(email: string, password: string, deviceInfo?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { owner: true },
    });

    if (!user || user.deletedAt) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Account suspended', 'ACCOUNT_SUSPENDED');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user, deviceInfo, ipAddress);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      requiresTwoFactor: user.twoFactorEnabled,
    };
  }

  async refreshToken(refreshTokenValue: string) {
    const tokenHash = await bcrypt.hash(refreshTokenValue, 4);

    // Find valid refresh token
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { owner: true } } },
    });

    let matchedToken = null;
    for (const stored of storedTokens) {
      if (await bcrypt.compare(refreshTokenValue, stored.tokenHash)) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(matchedToken.user);

    return {
      user: this.sanitizeUser(matchedToken.user),
      ...tokens,
    };
  }

  async logout(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User');

    const totp = new OTPAuth.TOTP({
      issuer: 'Sivan Management',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 }),
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: totp.secret.base32 },
    });

    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw ApiError.badRequest('2FA not set up');
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Sivan Management',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token, window: 1 });
    if (delta === null) {
      throw ApiError.unauthorized('Invalid 2FA code', 'INVALID_2FA');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        owner: {
          include: {
            properties: { where: { deletedAt: null }, select: { id: true, name: true, status: true } },
          },
        },
        loyaltyMember: { include: { tier: true } },
        affiliateProfile: true,
      },
    });

    if (!user) throw ApiError.notFound('User');
    return this.sanitizeUser(user);
  }

  private async generateTokens(
    user: any,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      ownerId: user.owner?.id,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    } as jwt.SignOptions);

    const refreshTokenValue = uuid();
    const refreshTokenHash = await bcrypt.hash(refreshTokenValue, 4);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        deviceInfo,
        ipAddress,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...safe } = user;
    return safe;
  }
}

export const authService = new AuthService();
