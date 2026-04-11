import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

type WebhookEventType =
  | 'booking.created' | 'booking.confirmed' | 'booking.cancelled' | 'booking.updated'
  | 'guest.created' | 'guest.updated'
  | 'payment.received' | 'payment.failed'
  | 'checkin.submitted' | 'checkout.completed'
  | 'maintenance.created' | 'maintenance.completed'
  | 'owner.statement.generated';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  headers?: Record<string, string>;
  retryCount: number;
  lastTriggeredAt?: Date;
  lastStatus?: number;
  failCount: number;
  createdAt: Date;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: any;
  status: number;
  responseBody?: string;
  deliveredAt: Date;
  duration: number;
}

// ─── In-memory stores ────────────────────────────────────────────────────────

const endpoints: Map<string, WebhookEndpoint> = new Map();
const deliveries: WebhookDelivery[] = [];

// ─── Seed demo data ─────────────────────────────────────────────────────────

const demoEndpoints: WebhookEndpoint[] = [
  {
    id: uuid(),
    url: 'https://accounting.example.com/webhooks/pms',
    events: ['booking.created', 'booking.confirmed', 'booking.cancelled', 'payment.received', 'payment.failed'],
    secret: crypto.randomBytes(32).toString('hex'),
    isActive: true,
    headers: { 'X-Source': 'sivan-pms' },
    retryCount: 3,
    lastTriggeredAt: new Date('2026-04-10T14:30:00Z'),
    lastStatus: 200,
    failCount: 0,
    createdAt: new Date('2026-01-15'),
  },
  {
    id: uuid(),
    url: 'https://crm.example.com/api/incoming/pms',
    events: ['guest.created', 'guest.updated', 'checkin.submitted', 'checkout.completed'],
    secret: crypto.randomBytes(32).toString('hex'),
    isActive: true,
    retryCount: 3,
    lastTriggeredAt: new Date('2026-04-09T09:15:00Z'),
    lastStatus: 200,
    failCount: 1,
    createdAt: new Date('2026-02-01'),
  },
  {
    id: uuid(),
    url: 'https://old-system.example.com/webhook',
    events: ['booking.created'],
    secret: crypto.randomBytes(32).toString('hex'),
    isActive: false,
    retryCount: 3,
    lastTriggeredAt: new Date('2026-03-01T11:00:00Z'),
    lastStatus: 500,
    failCount: 12,
    createdAt: new Date('2025-10-01'),
  },
];

demoEndpoints.forEach((e) => endpoints.set(e.id, e));

// Seed demo deliveries
const demoDeliveries: WebhookDelivery[] = [
  {
    id: uuid(),
    endpointId: demoEndpoints[0].id,
    event: 'booking.created',
    payload: { bookingId: 'BK-2026-1201', guestName: 'Marcus Lindqvist', property: 'Santorini Sunset Villa' },
    status: 200,
    responseBody: '{"received": true}',
    deliveredAt: new Date('2026-04-10T14:30:00Z'),
    duration: 234,
  },
  {
    id: uuid(),
    endpointId: demoEndpoints[0].id,
    event: 'payment.received',
    payload: { bookingId: 'BK-2026-1201', amount: 1960, currency: 'EUR' },
    status: 200,
    responseBody: '{"processed": true}',
    deliveredAt: new Date('2026-04-10T14:31:00Z'),
    duration: 189,
  },
  {
    id: uuid(),
    endpointId: demoEndpoints[1].id,
    event: 'guest.created',
    payload: { guestId: 'g-101', name: 'Sophie Dubois', email: 'sophie@example.com' },
    status: 200,
    deliveredAt: new Date('2026-04-09T09:15:00Z'),
    duration: 312,
  },
  {
    id: uuid(),
    endpointId: demoEndpoints[1].id,
    event: 'checkin.submitted',
    payload: { bookingId: 'BK-2026-1198', guestName: 'Elena Papadopoulos' },
    status: 502,
    responseBody: 'Bad Gateway',
    deliveredAt: new Date('2026-04-08T16:45:00Z'),
    duration: 5012,
  },
  {
    id: uuid(),
    endpointId: demoEndpoints[2].id,
    event: 'booking.created',
    payload: { bookingId: 'BK-2026-1175', guestName: 'Oliver Bennett' },
    status: 500,
    responseBody: 'Internal Server Error',
    deliveredAt: new Date('2026-03-01T11:00:00Z'),
    duration: 8045,
  },
];

deliveries.push(...demoDeliveries);

// ─── Service ─────────────────────────────────────────────────────────────────

export class WebhooksService {
  getAllEndpoints(): WebhookEndpoint[] {
    return Array.from(endpoints.values());
  }

  getEndpointById(id: string): WebhookEndpoint | undefined {
    return endpoints.get(id);
  }

  createEndpoint(data: {
    url: string;
    events: WebhookEventType[];
    headers?: Record<string, string>;
    retryCount?: number;
  }): WebhookEndpoint {
    const endpoint: WebhookEndpoint = {
      id: uuid(),
      url: data.url,
      events: data.events,
      secret: crypto.randomBytes(32).toString('hex'),
      isActive: true,
      headers: data.headers,
      retryCount: data.retryCount ?? 3,
      failCount: 0,
      createdAt: new Date(),
    };
    endpoints.set(endpoint.id, endpoint);
    return endpoint;
  }

  updateEndpoint(id: string, data: Partial<{
    url: string;
    events: WebhookEventType[];
    headers: Record<string, string>;
    retryCount: number;
  }>): WebhookEndpoint | undefined {
    const endpoint = endpoints.get(id);
    if (!endpoint) return undefined;

    if (data.url !== undefined) endpoint.url = data.url;
    if (data.events !== undefined) endpoint.events = data.events;
    if (data.headers !== undefined) endpoint.headers = data.headers;
    if (data.retryCount !== undefined) endpoint.retryCount = data.retryCount;

    endpoints.set(id, endpoint);
    return endpoint;
  }

  deleteEndpoint(id: string): boolean {
    return endpoints.delete(id);
  }

  toggleEndpoint(id: string): WebhookEndpoint | undefined {
    const endpoint = endpoints.get(id);
    if (!endpoint) return undefined;
    endpoint.isActive = !endpoint.isActive;
    endpoints.set(id, endpoint);
    return endpoint;
  }

  testEndpoint(id: string): WebhookDelivery | undefined {
    const endpoint = endpoints.get(id);
    if (!endpoint) return undefined;

    // Simulated delivery
    const delivery: WebhookDelivery = {
      id: uuid(),
      endpointId: id,
      event: 'test.ping',
      payload: { test: true, timestamp: new Date().toISOString(), message: 'Webhook test from Sivan PMS' },
      status: 200,
      responseBody: '{"pong": true}',
      deliveredAt: new Date(),
      duration: Math.floor(Math.random() * 300) + 50,
    };

    endpoint.lastTriggeredAt = delivery.deliveredAt;
    endpoint.lastStatus = delivery.status;
    endpoints.set(id, endpoint);

    deliveries.unshift(delivery);
    return delivery;
  }

  getDeliveryLog(endpointId?: string): WebhookDelivery[] {
    if (endpointId) {
      return deliveries.filter((d) => d.endpointId === endpointId);
    }
    return deliveries;
  }

  triggerWebhook(event: WebhookEventType, payload: any): WebhookDelivery[] {
    const triggered: WebhookDelivery[] = [];

    endpoints.forEach((endpoint) => {
      if (endpoint.isActive && endpoint.events.includes(event)) {
        const delivery: WebhookDelivery = {
          id: uuid(),
          endpointId: endpoint.id,
          event,
          payload,
          status: 200,
          responseBody: '{"received": true}',
          deliveredAt: new Date(),
          duration: Math.floor(Math.random() * 500) + 100,
        };

        endpoint.lastTriggeredAt = delivery.deliveredAt;
        endpoint.lastStatus = delivery.status;
        endpoints.set(endpoint.id, endpoint);

        deliveries.unshift(delivery);
        triggered.push(delivery);
      }
    });

    return triggered;
  }
}

export const webhooksService = new WebhooksService();
