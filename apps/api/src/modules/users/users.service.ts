/**
 * Users Service — real Prisma-backed CRUD for the User model.
 *
 * Rewritten 2026-05-25 from a 616-line in-memory mock that returned hardcoded
 * data and could not actually manage users. See docs/FIX_LOG.md for context.
 *
 * Schema mapping notes:
 *   - Prisma `UserStatus` enum:  ACTIVE | SUSPENDED | PENDING_VERIFICATION
 *   - API/Zod `status` field:    ACTIVE | INACTIVE | SUSPENDED | PENDING
 *     (legacy frontend values — bridged here on input/output)
 *   - Soft delete uses `deletedAt`. Lists exclude soft-deleted by default.
 *   - Quiet hours are stored on `User.metadata` because the schema does not
 *     have a dedicated table for it. Shape: { quietHours: {...} }.
 *
 * Activity logs are sourced from the AuditLog model (populated by the
 * auditMiddleware). Sessions are sourced from RefreshToken records.
 *
 * Notification settings live in the dedicated UserNotificationSetting table
 * with a unique (userId, category) constraint, so we upsert per-row.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ─── Types exposed to controllers ────────────────────────────────────────

type ApiStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

interface ListFilters {
  search?: string;
  role?: UserRole;
  status?: ApiStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'email' | 'firstName' | 'lastName' | 'role' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  language?: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string | null;
  language?: string;
  isActive?: boolean;
  status?: ApiStatus;
  timezone?: string;
  twoFactorEnabled?: boolean;
}

interface InviteUserInput extends CreateUserInput {
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
  welcomeMessage?: string;
  notificationPreset?: 'emailOnly' | 'emailAndWhatsApp' | 'allChannels' | 'minimal' | 'muteAll';
}

interface NotificationSettingInput {
  category: string;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
}

interface QuietHoursInput {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
  exceptUrgent: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Map the API-facing status value to the Prisma enum value.
 * 'INACTIVE' is treated as 'SUSPENDED' (no separate INACTIVE in schema).
 * 'PENDING' maps to 'PENDING_VERIFICATION'.
 */
function toPrismaStatus(s: ApiStatus): UserStatus {
  switch (s) {
    case 'ACTIVE':
      return UserStatus.ACTIVE;
    case 'SUSPENDED':
    case 'INACTIVE':
      return UserStatus.SUSPENDED;
    case 'PENDING':
      return UserStatus.PENDING_VERIFICATION;
  }
}

/**
 * Map the Prisma enum value back to a legacy API string the existing
 * frontend understands.
 */
function fromPrismaStatus(s: UserStatus): ApiStatus {
  switch (s) {
    case UserStatus.ACTIVE:
      return 'ACTIVE';
    case UserStatus.SUSPENDED:
      return 'SUSPENDED';
    case UserStatus.PENDING_VERIFICATION:
      return 'PENDING';
  }
}

/** Project a Prisma User row into the legacy API response shape. */
function toApiUser(u: any) {
  const metadata = (u.metadata as Record<string, unknown>) || {};
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    language: u.preferredLocale,
    status: fromPrismaStatus(u.status),
    isActive: u.status === UserStatus.ACTIVE,
    twoFactorEnabled: u.twoFactorEnabled,
    timezone: u.timezone,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    metadata,
  };
}

/** Generate a short random temporary password (returned to caller, never stored in plain). */
function generateTempPassword(): string {
  // 12 chars, base64 url-safe, no padding. Enough entropy for a one-time invite.
  return crypto.randomBytes(9).toString('base64url');
}

// ─── Service ─────────────────────────────────────────────────────────────

class UsersService {
  /**
   * List users with filters, search and pagination.
   * Soft-deleted users are excluded.
   */
  async getAllUsers(filters: ListFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters.role) where.role = filters.role;

    if (filters.status) {
      where.status = toPrismaStatus(filters.status);
    } else if (filters.isActive !== undefined) {
      where.status = filters.isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    }

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(toApiUser),
      total,
      page,
      limit,
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        notificationSettings: true,
      },
    });
    if (!user) throw ApiError.notFound(`User ${id} not found`);
    const apiUser = toApiUser(user);
    return {
      ...apiUser,
      notificationSettings: user.notificationSettings.map((ns) => ({
        id: ns.id,
        userId: ns.userId,
        category: ns.category,
        email: ns.email,
        whatsapp: ns.whatsapp,
        sms: ns.sms,
        push: ns.push,
      })),
    };
  }

  /**
   * Create a user with a temporary random password. The temp password is
   * returned in the response so an admin can communicate it to the user.
   * In a follow-up, this should trigger an invite email/WhatsApp via the
   * (still pending) SendGrid/Evolution integrations.
   */
  async createUser(input: CreateUserInput) {
    // Reject if email already exists (including soft-deleted to be safe).
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict(`A user with email ${input.email} already exists`, 'EMAIL_EXISTS');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        phone: input.phone || null,
        preferredLocale: input.language || 'en',
        passwordHash,
        status: UserStatus.PENDING_VERIFICATION,
      },
    });

    return {
      ...toApiUser(user),
      tempPassword, // one-shot return — never stored in plain
    };
  }

  async updateUser(id: string, input: UpdateUserInput) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw ApiError.notFound(`User ${id} not found`);

    const data: Prisma.UserUpdateInput = {};

    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.role !== undefined) data.role = input.role;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.language !== undefined) data.preferredLocale = input.language;
    if (input.timezone !== undefined) data.timezone = input.timezone;
    if (input.twoFactorEnabled !== undefined) data.twoFactorEnabled = input.twoFactorEnabled;

    // Status takes precedence over isActive when both are provided.
    if (input.status !== undefined) {
      data.status = toPrismaStatus(input.status);
    } else if (input.isActive !== undefined) {
      data.status = input.isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return toApiUser(updated);
  }

  /** Soft delete — sets deletedAt. Refresh tokens are revoked too. */
  async deleteUser(id: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw ApiError.notFound(`User ${id} not found`);

    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          deletedAt: now,
          status: UserStatus.SUSPENDED,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return { id, deletedAt: now.toISOString() };
  }

  /**
   * Invite a user. Same as createUser but also applies a notification preset
   * and records the intent to send a welcome message. Actual sending depends
   * on SendGrid + Evolution being wired in production.
   */
  async inviteUser(input: InviteUserInput) {
    const created = await this.createUser({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      phone: input.phone,
      language: input.language,
    });

    if (input.notificationPreset) {
      await this.applyNotificationPreset(created.id, input.notificationPreset);
    }

    const channels: string[] = [];
    if (input.sendEmail) channels.push('email');
    if (input.sendWhatsApp) channels.push('whatsapp');

    return {
      ...created,
      invite: {
        channels,
        welcomeMessage: input.welcomeMessage ?? null,
        // Indicates that the API recorded the request but external sending
        // depends on configured integrations.
        scheduled: channels.length > 0,
      },
    };
  }

  async suspendUser(id: string) {
    return this.updateUser(id, { status: 'SUSPENDED' });
  }

  async activateUser(id: string) {
    return this.updateUser(id, { status: 'ACTIVE' });
  }

  /**
   * Reset password to a new random temporary password. Existing refresh
   * tokens are revoked so the user is logged out everywhere.
   */
  async resetPassword(id: string) {
    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw ApiError.notFound(`User ${id} not found`);

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return {
      id,
      tempPassword,
      message: 'Password reset and all active sessions revoked. Communicate the temp password securely.',
    };
  }

  /**
   * Activity log — pulled from the AuditLog model populated by auditMiddleware.
   */
  async getActivity(userId: string, filters: { page?: number; limit?: number }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    return {
      activity: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Active sessions — derived from non-revoked, non-expired RefreshToken rows.
   */
  async getSessions(userId: string) {
    const now = new Date();
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((t) => ({
      id: t.id,
      deviceInfo: t.deviceInfo || 'Unknown device',
      ipAddress: t.ipAddress || 'Unknown',
      createdAt: t.createdAt.toISOString(),
      lastActive: t.createdAt.toISOString(), // schema does not track last-active; use createdAt
      isCurrent: false, // would require comparing to current request's refresh token
      expiresAt: t.expiresAt.toISOString(),
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const token = await prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
    if (!token) throw ApiError.notFound(`Session ${sessionId} not found for user ${userId}`);
    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { id: sessionId, revoked: true };
  }

  /**
   * Replace the user's notification settings. Uses upsert per category so
   * unrelated categories aren't deleted.
   */
  async updateNotificationSettings(userId: string, settings: NotificationSettingInput[]) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw ApiError.notFound(`User ${userId} not found`);

    await prisma.$transaction(
      settings.map((s) =>
        prisma.userNotificationSetting.upsert({
          where: { userId_category: { userId, category: s.category } },
          update: { email: s.email, whatsapp: s.whatsapp, sms: s.sms, push: s.push },
          create: {
            userId,
            category: s.category,
            email: s.email,
            whatsapp: s.whatsapp,
            sms: s.sms,
            push: s.push,
          },
        }),
      ),
    );

    const updated = await prisma.userNotificationSetting.findMany({ where: { userId } });
    return updated.map((ns) => ({
      id: ns.id,
      userId: ns.userId,
      category: ns.category,
      email: ns.email,
      whatsapp: ns.whatsapp,
      sms: ns.sms,
      push: ns.push,
    }));
  }

  /** Apply a notification preset to a freshly invited user. */
  private async applyNotificationPreset(userId: string, preset: NonNullable<InviteUserInput['notificationPreset']>) {
    const CATEGORIES = ['booking', 'payment', 'maintenance', 'system', 'reports', 'marketing'] as const;
    const matrix: Record<typeof preset, { email: boolean; whatsapp: boolean; sms: boolean; push: boolean }> = {
      emailOnly: { email: true, whatsapp: false, sms: false, push: false },
      emailAndWhatsApp: { email: true, whatsapp: true, sms: false, push: false },
      allChannels: { email: true, whatsapp: true, sms: true, push: true },
      minimal: { email: true, whatsapp: false, sms: false, push: false },
      muteAll: { email: false, whatsapp: false, sms: false, push: false },
    };
    const channels = matrix[preset];
    await this.updateNotificationSettings(
      userId,
      CATEGORIES.map((c) => ({ category: c, ...channels })),
    );
  }

  /**
   * Quiet hours are stored on User.metadata (no dedicated table in the
   * schema yet). Shape: metadata = { ...rest, quietHours: {...} }.
   */
  async updateQuietHours(userId: string, data: QuietHoursInput) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw ApiError.notFound(`User ${userId} not found`);

    const currentMetadata = (user.metadata as Record<string, unknown>) || {};
    const nextMetadata = { ...currentMetadata, quietHours: data };

    await prisma.user.update({
      where: { id: userId },
      data: { metadata: nextMetadata as unknown as Prisma.InputJsonValue },
    });

    return { userId, quietHours: data };
  }

  /**
   * Aggregate stats for the admin dashboard.
   */
  async getStats() {
    const [
      totalActive,
      totalSuspended,
      totalPending,
      totalDeleted,
      byRoleRaw,
      activeSessions,
      lastWeekLogins,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null, status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { deletedAt: null, status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { deletedAt: null, status: UserStatus.PENDING_VERIFICATION } }),
      prisma.user.count({ where: { deletedAt: { not: null } } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      prisma.refreshToken.count({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const byRole = byRoleRaw.reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = row._count._all;
      return acc;
    }, {});

    return {
      totals: {
        active: totalActive,
        suspended: totalSuspended,
        pending: totalPending,
        deleted: totalDeleted,
        all: totalActive + totalSuspended + totalPending,
      },
      byRole,
      activeSessions,
      lastWeekLogins,
    };
  }
}

export const usersService = new UsersService();
