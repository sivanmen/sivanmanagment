import { ApiError } from '../../utils/api-error';

interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW' | 'STATUS_CHANGE';
  entity: string;
  entityId?: string;
  entityName?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

const auditLog: AuditEntry[] = [
  {
    id: 'audit-001',
    userId: 'u-001',
    userEmail: 'sivan@sivanmanagement.com',
    action: 'LOGIN',
    entity: 'auth',
    metadata: { method: 'password' },
    ipAddress: '85.73.120.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-04-11T08:00:00Z',
  },
  {
    id: 'audit-002',
    userId: 'u-001',
    userEmail: 'sivan@sivanmanagement.com',
    action: 'UPDATE',
    entity: 'property',
    entityId: 'prop-001',
    entityName: 'Villa Elounda Seafront',
    changes: { nightlyRate: { old: 260, new: 280 }, minStay: { old: 3, new: 5 } },
    ipAddress: '85.73.120.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-04-11T08:15:00Z',
  },
  {
    id: 'audit-003',
    userId: 'u-002',
    userEmail: 'maria@sivanmanagement.com',
    action: 'CREATE',
    entity: 'booking',
    entityId: 'book-055',
    entityName: 'Booking #055 - Hans Mueller',
    metadata: { source: 'DIRECT', totalAmount: 2100 },
    ipAddress: '94.66.33.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-04-10T14:30:00Z',
  },
  {
    id: 'audit-004',
    userId: 'u-002',
    userEmail: 'maria@sivanmanagement.com',
    action: 'STATUS_CHANGE',
    entity: 'maintenance',
    entityId: 'maint-012',
    entityName: 'Pool pump replacement',
    changes: { status: { old: 'IN_PROGRESS', new: 'COMPLETED' } },
    ipAddress: '94.66.33.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2026-04-10T16:00:00Z',
  },
  {
    id: 'audit-005',
    userId: 'u-001',
    userEmail: 'sivan@sivanmanagement.com',
    action: 'EXPORT',
    entity: 'report',
    metadata: { reportType: 'owner_statement', format: 'PDF', ownerId: 'owner-001' },
    ipAddress: '85.73.120.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-04-10T10:00:00Z',
  },
  {
    id: 'audit-006',
    userId: 'u-003',
    userEmail: 'nikos@sivanmanagement.com',
    action: 'UPDATE',
    entity: 'task',
    entityId: 'task-023',
    entityName: 'Deep cleaning - Villa Elounda',
    changes: { status: { old: 'IN_PROGRESS', new: 'COMPLETED' }, actualDurationMin: { old: null, new: 180 } },
    ipAddress: '31.217.45.88',
    userAgent: 'Mozilla/5.0 (Linux; Android 13)',
    timestamp: '2026-04-09T17:30:00Z',
  },
  {
    id: 'audit-007',
    userId: 'u-001',
    userEmail: 'sivan@sivanmanagement.com',
    action: 'DELETE',
    entity: 'document',
    entityId: 'doc-015',
    entityName: 'Old lease agreement - draft.pdf',
    ipAddress: '85.73.120.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: '2026-04-09T09:00:00Z',
  },
  {
    id: 'audit-008',
    userId: 'u-004',
    userEmail: 'owner.george@gmail.com',
    action: 'VIEW',
    entity: 'owner_statement',
    entityId: 'stmt-003',
    entityName: 'March 2026 Statement',
    ipAddress: '78.62.11.201',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    timestamp: '2026-04-08T18:00:00Z',
  },
];

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
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = filters;

    let filtered = [...auditLog];

    if (userId) filtered = filtered.filter((a) => a.userId === userId);
    if (action) filtered = filtered.filter((a) => a.action === action);
    if (entity) filtered = filtered.filter((a) => a.entity === entity);
    if (entityId) filtered = filtered.filter((a) => a.entityId === entityId);

    if (startDate) {
      filtered = filtered.filter((a) => a.timestamp >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((a) => a.timestamp <= endDate);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.userEmail.toLowerCase().includes(q) ||
          (a.entityName && a.entityName.toLowerCase().includes(q)) ||
          a.entity.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { entries: items, total, page, limit };
  }

  async getAuditEntry(id: string) {
    const entry = auditLog.find((a) => a.id === id);
    if (!entry) throw ApiError.notFound('Audit entry');
    return entry;
  }

  async getEntityHistory(entity: string, entityId: string) {
    const entries = auditLog
      .filter((a) => a.entity === entity && a.entityId === entityId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return entries;
  }

  async getUserActivity(userId: string, filters: { days?: number }) {
    const days = filters.days || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const entries = auditLog
      .filter((a) => a.userId === userId && a.timestamp >= since)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const actionCounts = entries.reduce(
      (acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const entityCounts = entries.reduce(
      (acc, e) => {
        acc[e.entity] = (acc[e.entity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      userId,
      period: { days, since },
      totalActions: entries.length,
      actionCounts,
      entityCounts,
      recentActivity: entries.slice(0, 20),
    };
  }

  async getStats(filters: { days?: number }) {
    const days = filters.days || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const recent = auditLog.filter((a) => a.timestamp >= since);

    const byAction = recent.reduce(
      (acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byEntity = recent.reduce(
      (acc, e) => {
        acc[e.entity] = (acc[e.entity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byUser = recent.reduce(
      (acc, e) => {
        acc[e.userEmail] = (acc[e.userEmail] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      period: { days, since },
      totalEntries: recent.length,
      byAction,
      byEntity,
      byUser,
    };
  }
}

export const auditService = new AuditService();
