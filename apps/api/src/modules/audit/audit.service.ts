/**
 * Audit Service — real Prisma-backed audit log queries.
 *
 * Rewritten 2026-05-25 from a 273-line in-memory mock. The `AuditLog`
 * model is already populated by `audit.middleware.ts` for write requests,
 * so this service simply exposes a query API over it.
 *
 * Schema note: the audit_logs table uses `entityType` (Prisma) but the
 * legacy API/Zod schema uses `entity`. Helpers below project Prisma rows
 * to the legacy shape so the existing frontend doesn't need to change.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface AuditEntryView {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

function projectEntry(row: any): AuditEntryView {
  // Build per-field changes diff from oldValues/newValues if both present.
  let changes: Record<string, { old: unknown; new: unknown }> | undefined;
  if (row.oldValues && row.newValues && typeof row.newValues === 'object') {
    changes = {};
    const newObj = row.newValues as Record<string, unknown>;
    const oldObj = row.oldValues as Record<string, unknown>;
    for (const key of Object.keys(newObj)) {
      if (oldObj[key] !== newObj[key]) {
        changes[key] = { old: oldObj[key], new: newObj[key] };
      }
    }
    if (Object.keys(changes).length === 0) changes = undefined;
  }

  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user?.email ?? null,
    action: row.action,
    entity: row.entityType,
    entityId: row.entityId,
    changes,
    metadata: (row.newValues as Record<string, unknown>) || undefined,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    timestamp: row.createdAt.toISOString(),
  };
}

export class AuditService {
  async getAuditLog(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.AuditLogWhereInput = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entityType = entity;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      entries: rows.map(projectEntry),
      total,
      page,
      limit,
    };
  }

  async getAuditEntry(id: string) {
    const entry = await prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!entry) throw ApiError.notFound('Audit entry');
    return projectEntry(entry);
  }

  async getEntityHistory(entity: string, entityId: string) {
    const rows = await prisma.auditLog.findMany({
      where: { entityType: entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
    return rows.map(projectEntry);
  }

  async getUserActivity(userId: string, filters: { days?: number }) {
    const days = filters.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await prisma.auditLog.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });

    const actionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    for (const r of rows) {
      actionCounts[r.action] = (actionCounts[r.action] ?? 0) + 1;
      entityCounts[r.entityType] = (entityCounts[r.entityType] ?? 0) + 1;
    }

    return {
      userId,
      period: { days, since: since.toISOString() },
      totalActions: rows.length,
      actionCounts,
      entityCounts,
      recentActivity: rows.slice(0, 20).map(projectEntry),
    };
  }

  async getStats(filters: { days?: number }) {
    const days = filters.days || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await prisma.auditLog.findMany({
      where: { createdAt: { gte: since } },
      include: { user: { select: { email: true } } },
    });

    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    for (const r of rows) {
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
      byEntity[r.entityType] = (byEntity[r.entityType] ?? 0) + 1;
      const u = r.user?.email ?? '(system)';
      byUser[u] = (byUser[u] ?? 0) + 1;
    }

    return {
      period: { days, since: since.toISOString() },
      totalEntries: rows.length,
      byAction,
      byEntity,
      byUser,
    };
  }
}

export const auditService = new AuditService();
