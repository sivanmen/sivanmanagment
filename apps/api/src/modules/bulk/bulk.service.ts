import { v4 as uuid } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────

type BulkActionType = 'UPDATE_STATUS' | 'ASSIGN' | 'DELETE' | 'EXPORT' | 'SEND_MESSAGE' | 'TAG';
type BulkEntity = 'BOOKING' | 'PROPERTY' | 'GUEST' | 'TASK' | 'EXPENSE';
type BulkStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface BulkAction {
  id: string;
  type: BulkActionType;
  entity: BulkEntity;
  entityIds: string[];
  params: Record<string, any>;
  status: BulkStatus;
  processedCount: number;
  totalCount: number;
  errors?: string[];
  createdById: string;
  createdAt: Date;
  completedAt?: Date;
}

// ─── In-memory store ─────────────────────────────────────────────────────────

const bulkActions: Map<string, BulkAction> = new Map();

// Seed demo data
const demoBulkActions: BulkAction[] = [
  {
    id: uuid(),
    type: 'UPDATE_STATUS',
    entity: 'BOOKING',
    entityIds: ['BK-2026-1185', 'BK-2026-1180', 'BK-2026-1175'],
    params: { status: 'COMPLETED' },
    status: 'COMPLETED',
    processedCount: 3,
    totalCount: 3,
    createdById: 'admin-1',
    createdAt: new Date('2026-04-05T10:00:00Z'),
    completedAt: new Date('2026-04-05T10:00:02Z'),
  },
  {
    id: uuid(),
    type: 'TAG',
    entity: 'PROPERTY',
    entityIds: ['prop-1', 'prop-3', 'prop-5'],
    params: { tag: 'premium-listing' },
    status: 'COMPLETED',
    processedCount: 3,
    totalCount: 3,
    createdById: 'admin-1',
    createdAt: new Date('2026-04-03T14:30:00Z'),
    completedAt: new Date('2026-04-03T14:30:01Z'),
  },
  {
    id: uuid(),
    type: 'SEND_MESSAGE',
    entity: 'GUEST',
    entityIds: ['g-101', 'g-102', 'g-103', 'g-104'],
    params: { templateId: 'tmpl-welcome', channel: 'EMAIL' },
    status: 'COMPLETED',
    processedCount: 4,
    totalCount: 4,
    createdById: 'admin-1',
    createdAt: new Date('2026-04-01T09:00:00Z'),
    completedAt: new Date('2026-04-01T09:00:05Z'),
  },
  {
    id: uuid(),
    type: 'EXPORT',
    entity: 'EXPENSE',
    entityIds: ['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5'],
    params: { format: 'csv' },
    status: 'FAILED',
    processedCount: 3,
    totalCount: 5,
    errors: ['exp-4: Missing category', 'exp-5: Invalid amount'],
    createdById: 'admin-1',
    createdAt: new Date('2026-03-28T16:00:00Z'),
    completedAt: new Date('2026-03-28T16:00:03Z'),
  },
];

demoBulkActions.forEach((a) => bulkActions.set(a.id, a));

// ─── Service ─────────────────────────────────────────────────────────────────

export class BulkService {
  executeBulkAction(data: {
    type: BulkActionType;
    entity: BulkEntity;
    entityIds: string[];
    params: Record<string, any>;
  }, userId: string): BulkAction {
    const action: BulkAction = {
      id: uuid(),
      type: data.type,
      entity: data.entity,
      entityIds: data.entityIds,
      params: data.params,
      status: 'PROCESSING',
      processedCount: 0,
      totalCount: data.entityIds.length,
      createdById: userId,
      createdAt: new Date(),
    };

    // Simulate processing
    const errors: string[] = [];
    data.entityIds.forEach((entityId, index) => {
      // Simulate random failures (5% chance)
      if (Math.random() < 0.05) {
        errors.push(`${entityId}: Simulated processing error`);
      } else {
        action.processedCount = index + 1;
      }
    });

    action.processedCount = data.entityIds.length - errors.length;
    action.status = errors.length > 0 ? 'FAILED' : 'COMPLETED';
    action.errors = errors.length > 0 ? errors : undefined;
    action.completedAt = new Date();

    bulkActions.set(action.id, action);
    return action;
  }

  getBulkActions(filters?: { entity?: BulkEntity; status?: BulkStatus }): BulkAction[] {
    let all = Array.from(bulkActions.values());

    if (filters?.entity) {
      all = all.filter((a) => a.entity === filters.entity);
    }
    if (filters?.status) {
      all = all.filter((a) => a.status === filters.status);
    }

    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getBulkActionById(id: string): BulkAction | undefined {
    return bulkActions.get(id);
  }

  exportData(entity: BulkEntity, _filters: Record<string, any>, format: 'csv' | 'json'): string {
    // Generate sample export data based on entity type
    const sampleData: Record<BulkEntity, any[]> = {
      BOOKING: [
        { id: 'BK-2026-1201', guest: 'Marcus Lindqvist', property: 'Santorini Sunset Villa', checkIn: '2026-04-14', checkOut: '2026-04-21', total: 1960 },
        { id: 'BK-2026-1198', guest: 'Elena Papadopoulos', property: 'Heraklion Harbor Suite', checkIn: '2026-04-11', checkOut: '2026-04-15', total: 600 },
        { id: 'BK-2026-1195', guest: 'Hans Weber', property: 'Chania Old Town Residence', checkIn: '2026-04-18', checkOut: '2026-04-25', total: 1400 },
      ],
      PROPERTY: [
        { id: 'prop-1', name: 'Santorini Sunset Villa', type: 'Villa', status: 'Active', owner: 'Dimitris Papadopoulos', rate: 280 },
        { id: 'prop-2', name: 'Athens Central Loft', type: 'Apartment', status: 'Active', owner: 'Dimitris Papadopoulos', rate: 140 },
        { id: 'prop-3', name: 'Mykonos Beach House', type: 'House', status: 'Active', owner: 'Maria Konstantinou', rate: 300 },
      ],
      GUEST: [
        { id: 'g-101', name: 'Marcus Lindqvist', email: 'marcus@example.com', stays: 3, totalSpent: 5880 },
        { id: 'g-102', name: 'Sophie Dubois', email: 'sophie@example.com', stays: 2, totalSpent: 3920 },
      ],
      TASK: [
        { id: 't-1', title: 'Deep clean Villa', type: 'CLEANING', status: 'PENDING', dueDate: '2026-04-14', assignee: 'Cleaning Team A' },
        { id: 't-2', title: 'Fix AC unit', type: 'MAINTENANCE', status: 'IN_PROGRESS', dueDate: '2026-04-12', assignee: 'Nikos' },
      ],
      EXPENSE: [
        { id: 'exp-1', description: 'Professional cleaning', category: 'Cleaning', amount: 90, property: 'Santorini Sunset Villa', date: '2026-04-10' },
        { id: 'exp-2', description: 'Plumbing repair', category: 'Maintenance', amount: 250, property: 'Athens Central Loft', date: '2026-04-08' },
      ],
    };

    const data = sampleData[entity] || [];

    if (format === 'json') {
      return JSON.stringify({ entity, count: data.length, data, exportedAt: new Date().toISOString() }, null, 2);
    }

    // CSV
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];
    data.forEach((row) => {
      csvLines.push(headers.map((h) => String(row[h] ?? '')).join(','));
    });
    return csvLines.join('\n');
  }
}

export const bulkService = new BulkService();
