import { ApiError } from '../../utils/api-error';

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'OTA' | 'PAYMENT' | 'ACCOUNTING' | 'COMMUNICATION' | 'IOT' | 'ANALYTICS' | 'CRM' | 'CLEANING' | 'CUSTOM';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING';
  config: Record<string, any>;
  credentials?: Record<string, string>;
  webhookUrl?: string;
  lastSyncAt?: string;
  syncFrequencyMin: number;
  errorMessage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SyncLog {
  id: string;
  integrationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  errorDetails?: string;
  timestamp: string;
}

const integrations: Integration[] = [
  {
    id: 'int-001',
    name: 'Airbnb',
    provider: 'airbnb',
    type: 'OTA',
    status: 'CONNECTED',
    config: { apiVersion: 'v3', listingIds: ['12345', '67890'], autoSync: true },
    webhookUrl: 'https://api.sivanmanagement.com/webhooks/airbnb',
    lastSyncAt: '2026-04-11T08:00:00Z',
    syncFrequencyMin: 15,
    isActive: true,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-04-11T08:00:00Z',
  },
  {
    id: 'int-002',
    name: 'Booking.com',
    provider: 'booking_com',
    type: 'OTA',
    status: 'CONNECTED',
    config: { apiVersion: 'v2.5', hotelIds: ['H001', 'H002', 'H003'], rateSync: true },
    webhookUrl: 'https://api.sivanmanagement.com/webhooks/booking',
    lastSyncAt: '2026-04-11T07:45:00Z',
    syncFrequencyMin: 15,
    isActive: true,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-04-11T07:45:00Z',
  },
  {
    id: 'int-003',
    name: 'Stripe Payments',
    provider: 'stripe',
    type: 'PAYMENT',
    status: 'CONNECTED',
    config: { mode: 'live', currency: 'EUR', autoCapture: true },
    webhookUrl: 'https://api.sivanmanagement.com/webhooks/stripe',
    lastSyncAt: '2026-04-11T09:00:00Z',
    syncFrequencyMin: 5,
    isActive: true,
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2026-04-11T09:00:00Z',
  },
  {
    id: 'int-004',
    name: 'VRBO / Expedia',
    provider: 'vrbo',
    type: 'OTA',
    status: 'DISCONNECTED',
    config: { apiVersion: 'v1' },
    syncFrequencyMin: 30,
    errorMessage: 'API credentials expired on 2026-03-15',
    isActive: false,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 'int-005',
    name: 'WhatsApp Business',
    provider: 'whatsapp',
    type: 'COMMUNICATION',
    status: 'CONNECTED',
    config: { phoneNumberId: 'WA-001', businessAccountId: 'BA-001', templateNamespace: 'sivan_mgmt' },
    webhookUrl: 'https://api.sivanmanagement.com/webhooks/whatsapp',
    lastSyncAt: '2026-04-11T09:10:00Z',
    syncFrequencyMin: 1,
    isActive: true,
    createdAt: '2025-07-01T00:00:00Z',
    updatedAt: '2026-04-11T09:10:00Z',
  },
  {
    id: 'int-006',
    name: 'Nuki Smart Lock',
    provider: 'nuki',
    type: 'IOT',
    status: 'CONNECTED',
    config: { bridgeId: 'NB-001', autoCodeGeneration: true },
    lastSyncAt: '2026-04-11T09:05:00Z',
    syncFrequencyMin: 10,
    isActive: true,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-04-11T09:05:00Z',
  },
  {
    id: 'int-007',
    name: 'Google Analytics',
    provider: 'google_analytics',
    type: 'ANALYTICS',
    status: 'CONNECTED',
    config: { measurementId: 'G-XXXXXXX', trackBookings: true },
    lastSyncAt: '2026-04-11T06:00:00Z',
    syncFrequencyMin: 60,
    isActive: true,
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2026-04-11T06:00:00Z',
  },
];

const syncLogs: SyncLog[] = [
  { id: 'sync-001', integrationId: 'int-001', direction: 'INBOUND', status: 'SUCCESS', recordsProcessed: 5, recordsFailed: 0, duration: 1200, timestamp: '2026-04-11T08:00:00Z' },
  { id: 'sync-002', integrationId: 'int-002', direction: 'INBOUND', status: 'SUCCESS', recordsProcessed: 8, recordsFailed: 0, duration: 1800, timestamp: '2026-04-11T07:45:00Z' },
  { id: 'sync-003', integrationId: 'int-001', direction: 'OUTBOUND', status: 'SUCCESS', recordsProcessed: 3, recordsFailed: 0, duration: 900, timestamp: '2026-04-11T07:00:00Z' },
  { id: 'sync-004', integrationId: 'int-003', direction: 'INBOUND', status: 'SUCCESS', recordsProcessed: 12, recordsFailed: 0, duration: 500, timestamp: '2026-04-11T09:00:00Z' },
  { id: 'sync-005', integrationId: 'int-004', direction: 'INBOUND', status: 'FAILED', recordsProcessed: 0, recordsFailed: 0, duration: 200, errorDetails: 'Authentication failed: API key expired', timestamp: '2026-03-15T08:00:00Z' },
  { id: 'sync-006', integrationId: 'int-005', direction: 'OUTBOUND', status: 'PARTIAL', recordsProcessed: 15, recordsFailed: 2, duration: 3200, errorDetails: '2 messages failed to send: invalid phone numbers', timestamp: '2026-04-11T09:10:00Z' },
];

export class IntegrationsService {
  async getAllIntegrations(filters: {
    type?: string;
    status?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { type, status, isActive, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    let filtered = [...integrations];
    if (type) filtered = filtered.filter((i) => i.type === type);
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (isActive !== undefined) filtered = filtered.filter((i) => i.isActive === isActive);

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    // Strip credentials from response
    const safe = items.map(({ credentials, ...rest }) => rest);
    return { integrations: safe, total, page, limit };
  }

  async getIntegrationById(id: string) {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) throw ApiError.notFound('Integration');

    const { credentials, ...safe } = integration;
    return safe;
  }

  async createIntegration(data: {
    name: string;
    provider: string;
    type: string;
    config?: Record<string, any>;
    credentials?: Record<string, string>;
    syncFrequencyMin?: number;
  }) {
    const now = new Date().toISOString();
    const integration: Integration = {
      id: `int-${String(integrations.length + 1).padStart(3, '0')}`,
      name: data.name,
      provider: data.provider,
      type: data.type as Integration['type'],
      status: 'PENDING',
      config: data.config || {},
      credentials: data.credentials,
      syncFrequencyMin: data.syncFrequencyMin || 30,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    integrations.push(integration);
    const { credentials, ...safe } = integration;
    return safe;
  }

  async updateIntegration(
    id: string,
    data: Partial<{
      name: string;
      config: Record<string, any>;
      credentials: Record<string, string>;
      syncFrequencyMin: number;
      isActive: boolean;
    }>,
  ) {
    const idx = integrations.findIndex((i) => i.id === id);
    if (idx === -1) throw ApiError.notFound('Integration');

    if (data.config) integrations[idx].config = { ...integrations[idx].config, ...data.config };
    if (data.credentials) integrations[idx].credentials = data.credentials;
    if (data.name) integrations[idx].name = data.name;
    if (data.syncFrequencyMin !== undefined) integrations[idx].syncFrequencyMin = data.syncFrequencyMin;
    if (data.isActive !== undefined) integrations[idx].isActive = data.isActive;
    integrations[idx].updatedAt = new Date().toISOString();

    const { credentials, ...safe } = integrations[idx];
    return safe;
  }

  async deleteIntegration(id: string) {
    const idx = integrations.findIndex((i) => i.id === id);
    if (idx === -1) throw ApiError.notFound('Integration');

    integrations[idx].isActive = false;
    integrations[idx].status = 'DISCONNECTED';
    integrations[idx].updatedAt = new Date().toISOString();
    return { message: 'Integration disconnected successfully' };
  }

  async syncIntegration(id: string) {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) throw ApiError.notFound('Integration');
    if (!integration.isActive) throw ApiError.badRequest('Integration is not active', 'INACTIVE');
    if (integration.status === 'DISCONNECTED') throw ApiError.badRequest('Integration is disconnected', 'DISCONNECTED');

    const log: SyncLog = {
      id: `sync-${String(syncLogs.length + 1).padStart(3, '0')}`,
      integrationId: id,
      direction: 'INBOUND',
      status: 'SUCCESS',
      recordsProcessed: Math.floor(Math.random() * 20) + 1,
      recordsFailed: 0,
      duration: Math.floor(Math.random() * 3000) + 500,
      timestamp: new Date().toISOString(),
    };
    syncLogs.push(log);

    integration.lastSyncAt = log.timestamp;
    integration.updatedAt = log.timestamp;

    return { message: 'Sync completed', log };
  }

  async testConnection(id: string) {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) throw ApiError.notFound('Integration');

    // Simulate connection test
    const success = integration.status !== 'DISCONNECTED';

    if (success) {
      integration.status = 'CONNECTED';
      integration.errorMessage = undefined;
    }

    return {
      integrationId: id,
      provider: integration.provider,
      success,
      latency: Math.floor(Math.random() * 500) + 50,
      message: success ? 'Connection successful' : 'Connection failed: invalid credentials',
    };
  }

  async getSyncLogs(integrationId: string, filters: { page?: number; limit?: number }) {
    const integration = integrations.find((i) => i.id === integrationId);
    if (!integration) throw ApiError.notFound('Integration');

    const { page = 1, limit = 50 } = filters;
    const filtered = syncLogs
      .filter((l) => l.integrationId === integrationId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { logs: items, total, page, limit };
  }

  async getDashboard() {
    const total = integrations.length;
    const connected = integrations.filter((i) => i.status === 'CONNECTED').length;
    const disconnected = integrations.filter((i) => i.status === 'DISCONNECTED').length;
    const errors = integrations.filter((i) => i.status === 'ERROR').length;

    const recentSyncs = syncLogs
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);

    const byType = integrations.reduce(
      (acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: { total, connected, disconnected, errors },
      byType,
      recentSyncs,
    };
  }
}

export const integrationsService = new IntegrationsService();
