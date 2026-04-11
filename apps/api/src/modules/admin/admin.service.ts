import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AdminService {
  async getSystemStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalUsers,
      activeUsers,
      totalProperties,
      activeProperties,
      totalBookings,
      monthlyBookings,
      monthlyRevenue,
      monthlyExpenses,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.property.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.incomeRecord.aggregate({
        where: {
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
        _sum: { amount: true },
      }),
      prisma.expenseRecord.aggregate({
        where: {
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      properties: {
        total: totalProperties,
        active: activeProperties,
      },
      bookings: {
        total: totalBookings,
        thisMonth: monthlyBookings,
      },
      revenue: monthlyRevenue._sum.amount?.toNumber() ?? 0,
      expenses: monthlyExpenses._sum.amount?.toNumber() ?? 0,
      netIncome:
        (monthlyRevenue._sum.amount?.toNumber() ?? 0) -
        (monthlyExpenses._sum.amount?.toNumber() ?? 0),
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    };
  }

  async getAllUsers(filters: UserFilters) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = role as any;
    }

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      role: 'role',
      status: 'status',
      lastLoginAt: 'lastLoginAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          status: true,
          preferredLocale: true,
          timezone: true,
          lastLoginAt: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw ApiError.notFound('User');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return updatedUser;
  }

  async suspendUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw ApiError.notFound('User');
    }

    if (user.status === 'SUSPENDED') {
      throw ApiError.badRequest('User is already suspended', 'ALREADY_SUSPENDED');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return updatedUser;
  }

  async activateUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw ApiError.notFound('User');
    }

    if (user.status === 'ACTIVE') {
      throw ApiError.badRequest('User is already active', 'ALREADY_ACTIVE');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return updatedUser;
  }

  async getAuditLog(filters: AuditLogFilters) {
    const {
      userId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      action: 'action',
      entityType: 'entityType',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getSystemHealth() {
    const healthChecks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = {
        status: 'healthy',
        latencyMs: Date.now() - dbStart,
      };
    } catch (error) {
      healthChecks.database = {
        status: 'unhealthy',
        latencyMs: Date.now() - dbStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Redis check (placeholder - would check actual Redis connection)
    healthChecks.redis = {
      status: 'not_configured',
    };

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      status: healthChecks.database.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: healthChecks,
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  }
}

export const adminService = new AdminService();
