import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/error-handler.middleware';
import { localeMiddleware } from './middleware/locale.middleware';
import { auditMiddleware } from './middleware/audit.middleware';
import authRoutes from './modules/auth/auth.routes';
import propertiesRoutes from './modules/properties/properties.routes';
import ownersRoutes from './modules/owners/owners.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import guestsRoutes from './modules/guests/guests.routes';
import financeRoutes from './modules/finance/finance.routes';
import feesRoutes from './modules/fees/fees.routes';
import documentsRoutes from './modules/documents/documents.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import communicationsRoutes from './modules/communications/communications.routes';
import channelsRoutes from './modules/channels/channels.routes';
import reportsRoutes from './modules/reports/reports.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import affiliatesRoutes from './modules/affiliates/affiliates.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import portfolioRoutes from './modules/portfolio/portfolio.routes';
import marketingRoutes from './modules/marketing/marketing.routes';
import adminRoutes from './modules/admin/admin.routes';
import templatesRoutes from './modules/templates/templates.routes';
import automationsRoutes from './modules/automations/automations.routes';
import guestExperienceRoutes from './modules/guest-experience/guest-experience.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import bookingExtrasRoutes from './modules/bookings/booking-extras.routes';
import ownerPortalRoutes from './modules/owner-portal/owner-portal.routes';
import webhooksRoutes from './modules/webhooks/webhooks.routes';
import bulkRoutes from './modules/bulk/bulk.routes';
import teamsRoutes from './modules/teams/teams.routes';
import bookingEngineRoutes from './modules/booking-engine/booking-engine.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import scoringRoutes from './modules/scoring/scoring.routes';
import usersRoutes from './modules/users/users.routes';
import iotRoutes from './modules/iot/iot.routes';
import aiRoutes from './modules/ai/ai.routes';
import auditRoutes from './modules/audit/audit.routes';
import translationsRoutes from './modules/translations/translations.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import accountingRoutes from './modules/accounting/accounting.routes';
import directBookingRoutes from './modules/direct-booking/direct-booking.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';
import messagingInstancesRoutes from './modules/messaging-instances/messaging-instances.routes';
import systemSettingsRoutes from './modules/system-settings/system-settings.routes';
import whatsappWebhookRoutes from './modules/whatsapp/whatsapp-webhook.routes';
import { stripeWebhookHandler } from './modules/payments/stripe-webhook.controller';
import { requestLogger } from './middleware/request-logger.middleware';
import { apiRateLimit, authRateLimit } from './middleware/rate-limit.middleware';
import { securityHeaders, sanitizeRequest, requestId } from './middleware/security.middleware';

const app = express();

// Trust proxy (Railway / reverse proxy)
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(securityHeaders);
app.use(requestId);
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Admin-Secret', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  }),
);

// Request logging
app.use(requestLogger);

// Stripe webhook needs raw body for signature verification — must be BEFORE express.json()
app.post('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize request payloads
app.use(sanitizeRequest);

// Rate limiting
app.use('/api/v1/auth', authRateLimit);
app.use('/api/v1', apiRateLimit);

// Locale detection
app.use(localeMiddleware);

// Audit logging
app.use(auditMiddleware);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: config.env,
    uptime: process.uptime(),
  });
});

// Deep health check — verifies DB + Redis connectivity
app.get('/api/v1/health/deep', async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  const start = Date.now();

  // Database check
  try {
    const dbStart = Date.now();
    const { prisma } = require('./prisma/client');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    checks.database = { status: 'error', error: err.message };
  }

  // Redis check
  try {
    const redisStart = Date.now();
    const { getRedisClient } = require('./lib/redis');
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
    } else {
      checks.redis = { status: 'not_configured' };
    }
  } catch (err: any) {
    checks.redis = { status: 'error', error: err.message };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok' || c.status === 'not_configured');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: config.env,
    uptime: process.uptime(),
    totalLatencyMs: Date.now() - start,
    checks,
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

// System stats endpoint (admin-only, secured by header)
app.get('/api/v1/system/stats', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== config.jwt.secret) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { prisma } = require('./prisma/client');
    const [
      userCount,
      propertyCount,
      bookingCount,
      guestCount,
      ownerCount,
      maintenanceCount,
      taskCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.booking.count(),
      prisma.guest.count(),
      prisma.owner.count(),
      prisma.maintenanceRequest.count(),
      prisma.task.count(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        properties: propertyCount,
        bookings: bookingCount,
        guests: guestCount,
        owners: ownerCount,
        maintenanceRequests: maintenanceCount,
        tasks: taskCount,
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      api: {
        version: '1.0.0',
        env: config.env,
        modules: 45,
        routes: 198,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// One-time admin setup endpoint (secured by JWT secret)
app.post('/api/v1/setup/admin', async (req, res) => {
  try {
    const { secret, email, password, firstName, lastName } = req.body;
    if (secret !== config.jwt.secret) {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    const bcrypt = require('bcryptjs');
    const { prisma } = require('./prisma/client');
    const passwordHash = await bcrypt.hash(password || 'Admin123!@#', 12);
    const user = await prisma.user.upsert({
      where: { email: email || 'admin@sivanmanagment.com' },
      update: { passwordHash, role: 'SUPER_ADMIN', firstName: firstName || 'Sivan', lastName: lastName || 'Admin' },
      create: {
        email: email || 'admin@sivanmanagment.com',
        passwordHash,
        firstName: firstName || 'Sivan',
        lastName: lastName || 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        preferredLocale: 'he',
        timezone: 'Europe/Athens',
        emailVerifiedAt: new Date(),
      },
    });
    res.json({ success: true, message: `Admin ${user.email} configured`, id: user.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only reseed endpoint — triggers the full database seed via API
// Uses /api/v1/setup/reseed path to avoid conflict with /api/v1/admin routes
app.post('/api/v1/setup/reseed', async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (!adminSecret || adminSecret !== config.jwt.secret) {
      return res.status(403).json({ error: 'Invalid or missing X-Admin-Secret header' });
    }

    console.log('[RESEED] Reseed triggered via API...');
    const { main: seedMain } = require('./prisma/seed');
    const { prisma } = require('./prisma/client');

    const result = await seedMain(prisma);
    console.log('[RESEED] Reseed completed.', result);

    res.json({
      success: result.success,
      message: result.success
        ? 'Database reseeded successfully'
        : `Reseeded with ${result.errors.length} error(s)`,
      errors: result.errors || [],
    });
  } catch (error: any) {
    console.error('[RESEED] Reseed failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp webhook (no auth — called by Evolution API, must be before auth-protected routes)
app.use('/api/v1/webhooks/whatsapp', whatsappWebhookRoutes);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertiesRoutes);
app.use('/api/v1/owners', ownersRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/guests', guestsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/communications', communicationsRoutes);
app.use('/api/v1/channels', channelsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/affiliates', affiliatesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/marketing', marketingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/automations', automationsRoutes);
app.use('/api/v1/guest-experience', guestExperienceRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/booking-extras', bookingExtrasRoutes);
app.use('/api/v1/owner-portal', ownerPortalRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/bulk', bulkRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/booking-engine', bookingEngineRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/scoring', scoringRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/iot', iotRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/translations', translationsRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/accounting', accountingRoutes);
app.use('/api/v1/direct-booking', directBookingRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/messaging-instances', messagingInstancesRoutes);
app.use('/api/v1/system-settings', systemSettingsRoutes);

// API Documentation
const apiDocumentation = {
  title: 'Sivan Management PMS API',
  version: '1.0.0',
  description: 'Complete Property Management System API for Sivan Management',
  baseUrl: '/api/v1',
  modules: [
    {
      name: 'Auth',
      basePath: '/auth',
      endpoints: [
        { method: 'POST', path: '/login', description: 'Authenticate user and get JWT token', auth: false },
        { method: 'POST', path: '/register', description: 'Register a new user', auth: false },
        { method: 'POST', path: '/refresh', description: 'Refresh JWT token', auth: true },
        { method: 'POST', path: '/logout', description: 'Log out and invalidate token', auth: true },
        { method: 'GET', path: '/me', description: 'Get current user profile', auth: true },
      ],
    },
    {
      name: 'Properties',
      basePath: '/properties',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all properties with filters', auth: true, params: ['search', 'status', 'type', 'ownerId', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get property details', auth: true },
        { method: 'POST', path: '/', description: 'Create a new property', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update a property', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Soft-delete a property', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Owners',
      basePath: '/owners',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all owners', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id', description: 'Get owner details', auth: true },
        { method: 'POST', path: '/', description: 'Create a new owner', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update an owner', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Soft-delete an owner', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id/financial-summary', description: 'Get owner financial summary', auth: true },
      ],
    },
    {
      name: 'Bookings',
      basePath: '/bookings',
      endpoints: [
        { method: 'GET', path: '/', description: 'List bookings with filters', auth: true, params: ['status', 'propertyId', 'source', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get booking details', auth: true },
        { method: 'POST', path: '/', description: 'Create a new booking', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update a booking', auth: true },
        { method: 'PUT', path: '/:id/status', description: 'Update booking status', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Cancel a booking', auth: true },
      ],
    },
    {
      name: 'Calendar',
      basePath: '/calendar',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get calendar events for date range', auth: true, params: ['start', 'end', 'propertyId'] },
      ],
    },
    {
      name: 'Guests',
      basePath: '/guests',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all guests', auth: true },
        { method: 'GET', path: '/:id', description: 'Get guest details', auth: true },
        { method: 'POST', path: '/', description: 'Create a guest', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update a guest', auth: true },
      ],
    },
    {
      name: 'Finance',
      basePath: '/finance',
      endpoints: [
        { method: 'GET', path: '/income', description: 'List income records', auth: true },
        { method: 'POST', path: '/income', description: 'Create income record', auth: true },
        { method: 'GET', path: '/expenses', description: 'List expense records', auth: true },
        { method: 'POST', path: '/expenses', description: 'Create expense record', auth: true },
        { method: 'GET', path: '/summary', description: 'Get financial summary', auth: true },
      ],
    },
    {
      name: 'Fees',
      basePath: '/fees',
      endpoints: [
        { method: 'GET', path: '/', description: 'List management fee calculations', auth: true },
        { method: 'POST', path: '/calculate', description: 'Calculate fees for period', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Documents',
      basePath: '/documents',
      endpoints: [
        { method: 'GET', path: '/', description: 'List documents', auth: true },
        { method: 'POST', path: '/', description: 'Upload a document', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Delete a document', auth: true },
      ],
    },
    {
      name: 'Maintenance',
      basePath: '/maintenance',
      endpoints: [
        { method: 'GET', path: '/', description: 'List maintenance requests', auth: true },
        { method: 'GET', path: '/:id', description: 'Get request details', auth: true },
        { method: 'POST', path: '/', description: 'Create maintenance request', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update maintenance request', auth: true },
      ],
    },
    {
      name: 'Tasks',
      basePath: '/tasks',
      endpoints: [
        { method: 'GET', path: '/', description: 'List tasks', auth: true },
        { method: 'POST', path: '/', description: 'Create a task', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update a task', auth: true },
      ],
    },
    {
      name: 'Communications',
      basePath: '/communications',
      endpoints: [
        { method: 'GET', path: '/threads', description: 'List message threads', auth: true },
        { method: 'POST', path: '/threads', description: 'Create a thread', auth: true },
        { method: 'POST', path: '/threads/:id/messages', description: 'Send a message', auth: true },
      ],
    },
    {
      name: 'Channels',
      basePath: '/channels',
      endpoints: [
        { method: 'GET', path: '/', description: 'List connected channels', auth: true },
        { method: 'POST', path: '/:id/sync', description: 'Trigger channel sync', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Reports',
      basePath: '/reports',
      endpoints: [
        { method: 'GET', path: '/occupancy', description: 'Get occupancy report', auth: true },
        { method: 'GET', path: '/revenue', description: 'Get revenue report', auth: true },
        { method: 'GET', path: '/bookings', description: 'Get bookings report', auth: true },
        { method: 'GET', path: '/maintenance', description: 'Get maintenance report', auth: true },
        { method: 'GET', path: '/owner-statement', description: 'Get owner statement report', auth: true },
      ],
    },
    {
      name: 'Loyalty',
      basePath: '/loyalty',
      endpoints: [
        { method: 'GET', path: '/members', description: 'List loyalty members', auth: true },
        { method: 'POST', path: '/points', description: 'Award or deduct points', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Affiliates',
      basePath: '/affiliates',
      endpoints: [
        { method: 'GET', path: '/', description: 'List affiliates', auth: true },
        { method: 'POST', path: '/', description: 'Create an affiliate', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Notifications',
      basePath: '/notifications',
      endpoints: [
        { method: 'GET', path: '/', description: 'List notifications', auth: true },
        { method: 'GET', path: '/unread-count', description: 'Get unread count', auth: true },
        { method: 'PUT', path: '/:id/read', description: 'Mark notification as read', auth: true },
        { method: 'PUT', path: '/read-all', description: 'Mark all as read', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Delete a notification', auth: true },
        { method: 'GET', path: '/channels', description: 'List configured notification channels', auth: true, role: 'admin' },
        { method: 'POST', path: '/channels', description: 'Create/configure a notification channel', auth: true, role: 'admin' },
        { method: 'PUT', path: '/channels/:id', description: 'Update channel config', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/channels/:id', description: 'Remove a channel', auth: true, role: 'admin' },
        { method: 'POST', path: '/channels/:id/test', description: 'Test a channel connection', auth: true, role: 'admin' },
        { method: 'GET', path: '/users/:userId/preferences', description: 'Get user notification preferences', auth: true, role: 'admin' },
        { method: 'PUT', path: '/users/:userId/preferences', description: 'Update user notification preferences', auth: true, role: 'admin' },
        { method: 'POST', path: '/send', description: 'Send a notification via configured channels', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Payments',
      basePath: '/payments',
      endpoints: [
        { method: 'POST', path: '/create-intent', description: 'Create Stripe payment intent for a booking', auth: true },
        { method: 'POST', path: '/create-link', description: 'Generate Stripe payment link for guest', auth: true },
        { method: 'POST', path: '/stripe-refund', description: 'Process Stripe refund', auth: true },
        { method: 'GET', path: '/booking/:bookingId', description: 'Get payment status for a booking', auth: true },
        { method: 'POST', path: '/stripe/webhook', description: 'Stripe webhook endpoint (raw body)', auth: false },
        { method: 'GET', path: '/transactions', description: 'List all payment transactions', auth: true },
        { method: 'GET', path: '/transactions/:id', description: 'Get transaction by ID', auth: true },
        { method: 'POST', path: '/transactions', description: 'Create manual transaction', auth: true },
        { method: 'PUT', path: '/transactions/:id/status', description: 'Update transaction status', auth: true },
        { method: 'GET', path: '/methods', description: 'Get user payment methods', auth: true },
        { method: 'POST', path: '/methods', description: 'Add payment method', auth: true },
        { method: 'DELETE', path: '/methods/:id', description: 'Remove payment method', auth: true },
        { method: 'POST', path: '/refund', description: 'Process refund (legacy)', auth: true },
      ],
    },
    {
      name: 'Portfolio',
      basePath: '/portfolio',
      endpoints: [
        { method: 'GET', path: '/overview', description: 'Get portfolio overview', auth: true },
        { method: 'GET', path: '/performance', description: 'Get property performance metrics', auth: true },
      ],
    },
    {
      name: 'Templates',
      basePath: '/templates',
      endpoints: [
        { method: 'GET', path: '/', description: 'List message templates', auth: true },
        { method: 'POST', path: '/', description: 'Create a template', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update a template', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Delete a template', auth: true },
      ],
    },
    {
      name: 'Automations',
      basePath: '/automations',
      endpoints: [
        { method: 'GET', path: '/', description: 'List automation rules', auth: true },
        { method: 'POST', path: '/', description: 'Create automation rule', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update automation rule', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Delete automation rule', auth: true },
        { method: 'POST', path: '/:id/toggle', description: 'Toggle rule active state', auth: true },
        { method: 'POST', path: '/:id/test', description: 'Test automation rule', auth: true },
      ],
    },
    {
      name: 'Owner Portal',
      basePath: '/owner-portal',
      endpoints: [
        { method: 'GET', path: '/config/:ownerId', description: 'Get owner portal configuration', auth: true },
        { method: 'PUT', path: '/config/:ownerId', description: 'Update owner portal configuration', auth: true, role: 'admin' },
        { method: 'GET', path: '/reservations', description: 'List owner reservations (RLS for owners)', auth: true },
        { method: 'POST', path: '/reservations', description: 'Create an owner/F&F reservation', auth: true },
        { method: 'PUT', path: '/reservations/:id/approve', description: 'Approve an owner reservation', auth: true, role: 'admin' },
        { method: 'PUT', path: '/reservations/:id/reject', description: 'Reject an owner reservation', auth: true, role: 'admin' },
        { method: 'PUT', path: '/reservations/:id/cancel', description: 'Cancel an owner reservation', auth: true },
        { method: 'POST', path: '/statements/generate', description: 'Generate owner statement for period', auth: true, role: 'admin' },
        { method: 'GET', path: '/statements', description: 'List owner statements (RLS for owners)', auth: true },
        { method: 'GET', path: '/statements/:id', description: 'Get statement details', auth: true },
        { method: 'POST', path: '/statements/:id/approve', description: 'Approve a statement', auth: true, role: 'admin' },
        { method: 'POST', path: '/statements/:id/send', description: 'Send statement to owner', auth: true, role: 'admin' },
        { method: 'GET', path: '/export/:ownerId', description: 'Export all owner data (CSV/JSON)', auth: true, role: 'admin', params: ['format'] },
      ],
    },
    {
      name: 'Webhooks',
      basePath: '/webhooks',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all webhook endpoints', auth: true, role: 'admin' },
        { method: 'POST', path: '/', description: 'Create a webhook endpoint', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update a webhook endpoint', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Delete a webhook endpoint', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/toggle', description: 'Toggle webhook active state', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/test', description: 'Send test webhook delivery', auth: true, role: 'admin' },
        { method: 'GET', path: '/deliveries', description: 'Get webhook delivery log', auth: true, role: 'admin', params: ['endpointId'] },
      ],
    },
    {
      name: 'Bulk Actions',
      basePath: '/bulk',
      endpoints: [
        { method: 'POST', path: '/actions', description: 'Execute a bulk action', auth: true, role: 'admin' },
        { method: 'GET', path: '/actions', description: 'List bulk action history', auth: true, role: 'admin', params: ['entity', 'status'] },
        { method: 'GET', path: '/actions/:id', description: 'Get bulk action details', auth: true, role: 'admin' },
        { method: 'POST', path: '/export', description: 'Export entity data as CSV/JSON', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Pricing',
      basePath: '/pricing',
      endpoints: [
        { method: 'GET', path: '/:propertyId', description: 'Get pricing rules for property', auth: true },
        { method: 'PUT', path: '/:propertyId', description: 'Update pricing rules', auth: true },
      ],
    },
    {
      name: 'Guest Experience',
      basePath: '/guest-experience',
      endpoints: [
        { method: 'GET', path: '/checkin/:bookingId', description: 'Get online check-in data', auth: false },
        { method: 'POST', path: '/checkin/:bookingId', description: 'Submit online check-in', auth: false },
      ],
    },
    {
      name: 'Teams',
      basePath: '/teams',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all teams', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id', description: 'Get team details', auth: true, role: 'admin' },
        { method: 'POST', path: '/', description: 'Create a team', auth: true, role: 'super_admin' },
        { method: 'PUT', path: '/:id', description: 'Update a team', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Delete a team', auth: true, role: 'super_admin' },
        { method: 'POST', path: '/:id/members', description: 'Add team member', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id/members/:userId', description: 'Remove team member', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id/members/:userId', description: 'Update member role', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id/properties', description: 'Assign properties to team', auth: true, role: 'admin' },
        { method: 'GET', path: '/user/:userId', description: 'Get teams by user', auth: true },
      ],
    },
    {
      name: 'Booking Engine',
      basePath: '/booking-engine',
      endpoints: [
        { method: 'GET', path: '/config/:propertyId', description: 'Get booking engine config', auth: true, role: 'admin' },
        { method: 'PUT', path: '/config/:propertyId', description: 'Update booking engine config', auth: true, role: 'admin' },
        { method: 'GET', path: '/promotions/:propertyId', description: 'List promotions for property', auth: true, role: 'admin' },
        { method: 'POST', path: '/promotions/:propertyId', description: 'Create a promotion', auth: true, role: 'admin' },
        { method: 'PUT', path: '/promotions/:promoId', description: 'Update a promotion', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/promotions/:promoId', description: 'Delete a promotion', auth: true, role: 'admin' },
        { method: 'GET', path: '/public/search', description: 'Search available properties', auth: false, params: ['city', 'checkIn', 'checkOut', 'guests', 'minPrice', 'maxPrice'] },
        { method: 'GET', path: '/public/property/:propertyId', description: 'Get public property info', auth: false },
        { method: 'GET', path: '/public/availability/:propertyId', description: 'Check availability', auth: false, params: ['checkIn', 'checkOut'] },
        { method: 'POST', path: '/public/quote', description: 'Calculate booking quote', auth: false },
        { method: 'POST', path: '/public/book', description: 'Create a direct booking', auth: false },
        { method: 'POST', path: '/public/validate-promo', description: 'Validate promotion code', auth: false },
      ],
    },
    {
      name: 'Analytics',
      basePath: '/analytics',
      endpoints: [
        { method: 'GET', path: '/overview', description: 'Revenue overview with date/property filters', auth: true, params: ['startDate', 'endDate', 'propertyId', 'groupBy'] },
        { method: 'GET', path: '/properties', description: 'Property performance ranking', auth: true },
        { method: 'GET', path: '/channels', description: 'Channel distribution analytics', auth: true },
        { method: 'GET', path: '/occupancy/:propertyId', description: 'Occupancy heatmap for property', auth: true },
        { method: 'GET', path: '/forecast', description: 'Revenue forecast', auth: true },
        { method: 'GET', path: '/owners', description: 'Owner financial reports', auth: true },
        { method: 'GET', path: '/kpi', description: 'KPI dashboard summary', auth: true },
        { method: 'GET', path: '/comparison', description: 'Side-by-side property comparison', auth: true, params: ['propertyIds'] },
        { method: 'GET', path: '/seasonal', description: 'Seasonal trend analysis', auth: true },
        { method: 'GET', path: '/export', description: 'Export report data', auth: true, params: ['type', 'format'] },
      ],
    },
    {
      name: 'Property Scoring',
      basePath: '/scoring',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get all property scores', auth: true },
        { method: 'GET', path: '/portfolio', description: 'Portfolio score summary', auth: true },
        { method: 'GET', path: '/config', description: 'Get scoring configuration', auth: true, role: 'admin' },
        { method: 'PUT', path: '/config', description: 'Update scoring configuration', auth: true, role: 'admin' },
        { method: 'GET', path: '/:propertyId', description: 'Get single property score', auth: true },
        { method: 'POST', path: '/:propertyId/recalculate', description: 'Trigger score recalculation', auth: true },
        { method: 'GET', path: '/:propertyId/history', description: 'Get score history', auth: true },
        { method: 'GET', path: '/:propertyId/recommendations', description: 'Get improvement recommendations', auth: true },
        { method: 'PUT', path: '/:propertyId/recommendations/:recId', description: 'Update recommendation status', auth: true },
        { method: 'POST', path: '/compare', description: 'Compare property scores', auth: true, params: ['propertyIds'] },
      ],
    },
    {
      name: 'Users',
      basePath: '/users',
      endpoints: [
        { method: 'GET', path: '/', description: 'List all users', auth: true, role: 'admin', params: ['search', 'role', 'isActive', 'page', 'limit', 'sortBy', 'sortOrder'] },
        { method: 'GET', path: '/:id', description: 'Get user details', auth: true, role: 'admin' },
        { method: 'POST', path: '/', description: 'Create a user', auth: true, role: 'super_admin' },
        { method: 'PUT', path: '/:id', description: 'Update a user', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Deactivate a user', auth: true, role: 'super_admin' },
      ],
    },
    {
      name: 'IoT',
      basePath: '/iot',
      endpoints: [
        { method: 'GET', path: '/dashboard', description: 'IoT devices dashboard', auth: true },
        { method: 'GET', path: '/', description: 'List all IoT devices', auth: true, params: ['propertyId', 'type', 'status', 'isActive', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get device details', auth: true },
        { method: 'GET', path: '/:id/events', description: 'Get device event log', auth: true },
        { method: 'POST', path: '/', description: 'Register a device', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update a device', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/command', description: 'Send command to device', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Deactivate a device', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'AI',
      basePath: '/ai',
      endpoints: [
        { method: 'GET', path: '/sessions', description: 'List chat sessions', auth: true },
        { method: 'GET', path: '/sessions/:id', description: 'Get session messages', auth: true },
        { method: 'POST', path: '/chat', description: 'Send a chat message', auth: true },
        { method: 'DELETE', path: '/sessions/:id', description: 'Delete a session', auth: true },
        { method: 'GET', path: '/recommendations', description: 'Get AI recommendations', auth: true, params: ['propertyId', 'type', 'status', 'impact'] },
        { method: 'PUT', path: '/recommendations/:id', description: 'Accept or dismiss recommendation', auth: true },
      ],
    },
    {
      name: 'Audit',
      basePath: '/audit',
      endpoints: [
        { method: 'GET', path: '/', description: 'Get audit log', auth: true, role: 'admin', params: ['userId', 'action', 'entity', 'entityId', 'startDate', 'endDate', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/stats', description: 'Get audit statistics', auth: true, role: 'admin' },
        { method: 'GET', path: '/user/:userId', description: 'Get user activity', auth: true, role: 'admin' },
        { method: 'GET', path: '/entity/:entity/:entityId', description: 'Get entity change history', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id', description: 'Get audit entry details', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Translations',
      basePath: '/translations',
      endpoints: [
        { method: 'GET', path: '/namespaces', description: 'List translation namespaces', auth: true },
        { method: 'GET', path: '/stats', description: 'Get translation completeness stats', auth: true },
        { method: 'GET', path: '/export', description: 'Export namespace translations', auth: true, params: ['namespace', 'language'] },
        { method: 'GET', path: '/', description: 'List translation keys', auth: true, params: ['namespace', 'language', 'search', 'isVerified', 'missing', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get translation key details', auth: true },
        { method: 'POST', path: '/', description: 'Create translation key', auth: true, role: 'admin' },
        { method: 'POST', path: '/import', description: 'Bulk import translations', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update translation key', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Delete translation key', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Integrations',
      basePath: '/integrations',
      endpoints: [
        { method: 'GET', path: '/dashboard', description: 'Integrations dashboard', auth: true, role: 'admin' },
        { method: 'GET', path: '/', description: 'List all integrations', auth: true, role: 'admin', params: ['type', 'status', 'isActive', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get integration details', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id/sync-logs', description: 'Get sync history', auth: true, role: 'admin' },
        { method: 'POST', path: '/', description: 'Add an integration', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id', description: 'Update integration config', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/sync', description: 'Trigger manual sync', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/test', description: 'Test connection', auth: true, role: 'admin' },
        { method: 'DELETE', path: '/:id', description: 'Disconnect integration', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'Reviews',
      basePath: '/reviews',
      endpoints: [
        { method: 'GET', path: '/stats', description: 'Get review statistics', auth: true, params: ['propertyId'] },
        { method: 'GET', path: '/', description: 'List guest reviews', auth: true, params: ['propertyId', 'source', 'status', 'sentiment', 'ratingMin', 'ratingMax', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get review details', auth: true },
        { method: 'POST', path: '/:id/respond', description: 'Respond to a review', auth: true, role: 'admin' },
        { method: 'PUT', path: '/:id/status', description: 'Update review status', auth: true, role: 'admin' },
        { method: 'GET', path: '/:id/suggest-response', description: 'Get AI-suggested response', auth: true },
      ],
    },
    {
      name: 'Accounting',
      basePath: '/accounting',
      endpoints: [
        { method: 'GET', path: '/accounts', description: 'List chart of accounts', auth: true, params: ['type', 'subType', 'isActive', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/accounts/:id', description: 'Get account details', auth: true },
        { method: 'POST', path: '/accounts', description: 'Create a new account', auth: true, role: 'admin' },
        { method: 'PUT', path: '/accounts/:id', description: 'Update an account', auth: true, role: 'admin' },
        { method: 'GET', path: '/journal', description: 'List journal entries', auth: true, params: ['propertyId', 'ownerId', 'status', 'startDate', 'endDate', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/journal/:id', description: 'Get journal entry details', auth: true },
        { method: 'POST', path: '/journal', description: 'Create journal entry', auth: true, role: 'admin' },
        { method: 'POST', path: '/journal/:id/post', description: 'Post a draft journal entry', auth: true, role: 'admin' },
        { method: 'POST', path: '/journal/:id/void', description: 'Void a journal entry', auth: true, role: 'admin' },
        { method: 'GET', path: '/trial-balance', description: 'Get trial balance report', auth: true },
        { method: 'GET', path: '/profit-and-loss', description: 'Get P&L report', auth: true, params: ['propertyId', 'ownerId', 'startDate', 'endDate'] },
        { method: 'GET', path: '/balance-sheet', description: 'Get balance sheet summary', auth: true },
        { method: 'GET', path: '/tax-report', description: 'Get tax reporting data', auth: true, params: ['year'] },
      ],
    },
    {
      name: 'Direct Booking',
      basePath: '/direct-booking',
      endpoints: [
        { method: 'GET', path: '/public/search', description: 'Search available properties', auth: false, params: ['city', 'checkIn', 'checkOut', 'guests', 'minPrice', 'maxPrice', 'type', 'amenities'] },
        { method: 'GET', path: '/public/property/:propertyId', description: 'Get public property details', auth: false },
        { method: 'GET', path: '/public/availability/:propertyId', description: 'Check availability by dates', auth: false, params: ['checkIn', 'checkOut'] },
        { method: 'GET', path: '/public/price/:propertyId', description: 'Calculate price with fees', auth: false, params: ['checkIn', 'checkOut', 'guests'] },
        { method: 'POST', path: '/public/book', description: 'Create a booking with guest details', auth: false },
        { method: 'POST', path: '/public/payment/:bookingId', description: 'Create payment intent', auth: false },
        { method: 'GET', path: '/public/confirmation/:bookingId', description: 'Get booking confirmation and receipt', auth: false },
        { method: 'GET', path: '/bookings', description: 'List all direct bookings (admin)', auth: true, role: 'admin', params: ['propertyId', 'status', 'paymentStatus', 'search', 'page', 'limit'] },
      ],
    },
    {
      name: 'Expenses',
      basePath: '/expenses',
      endpoints: [
        { method: 'GET', path: '/stats', description: 'Get expense statistics', auth: true, params: ['propertyId', 'startDate', 'endDate'] },
        { method: 'GET', path: '/recurring', description: 'List recurring expenses', auth: true, params: ['propertyId'] },
        { method: 'GET', path: '/budget', description: 'Get budget vs actual tracking', auth: true, params: ['propertyId', 'year', 'month'] },
        { method: 'GET', path: '/', description: 'List expenses with filters', auth: true, params: ['propertyId', 'category', 'approvalStatus', 'isRecurring', 'startDate', 'endDate', 'vendor', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/:id', description: 'Get expense details', auth: true },
        { method: 'POST', path: '/', description: 'Create an expense', auth: true },
        { method: 'PUT', path: '/:id', description: 'Update an expense', auth: true },
        { method: 'DELETE', path: '/:id', description: 'Delete an expense', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/approve', description: 'Approve an expense', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/reject', description: 'Reject an expense', auth: true, role: 'admin' },
        { method: 'POST', path: '/:id/pay', description: 'Mark expense as paid', auth: true, role: 'admin' },
      ],
    },
    {
      name: 'WhatsApp',
      basePath: '/whatsapp',
      endpoints: [
        { method: 'GET', path: '/stats', description: 'Get messaging statistics', auth: true },
        { method: 'GET', path: '/contacts', description: 'List WhatsApp contacts', auth: true, params: ['tag', 'search', 'propertyId', 'isActive', 'page', 'limit'] },
        { method: 'GET', path: '/contacts/:id', description: 'Get contact details', auth: true },
        { method: 'POST', path: '/contacts', description: 'Create a contact', auth: true },
        { method: 'PUT', path: '/contacts/:id', description: 'Update a contact', auth: true },
        { method: 'GET', path: '/messages', description: 'Get message history', auth: true, params: ['bookingId', 'propertyId', 'direction', 'status', 'templateType', 'search', 'page', 'limit'] },
        { method: 'GET', path: '/messages/thread/:contactId', description: 'Get message thread for a contact', auth: true },
        { method: 'POST', path: '/messages/send', description: 'Send a custom message', auth: true },
        { method: 'POST', path: '/messages/send-template', description: 'Send a template message', auth: true },
        { method: 'PUT', path: '/messages/:id/status', description: 'Update message status', auth: true },
        { method: 'GET', path: '/templates', description: 'List message templates', auth: true, params: ['type', 'isActive'] },
        { method: 'GET', path: '/templates/:id', description: 'Get template details', auth: true },
        { method: 'POST', path: '/templates', description: 'Create a message template', auth: true, role: 'admin' },
        { method: 'PUT', path: '/templates/:id', description: 'Update a message template', auth: true, role: 'admin' },
      ],
    },
  ],
  webhookEvents: [
    'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.updated',
    'guest.created', 'guest.updated',
    'payment.received', 'payment.failed',
    'checkin.submitted', 'checkout.completed',
    'maintenance.created', 'maintenance.completed',
    'owner.statement.generated',
  ],
};

app.get('/api/v1/docs', (_req, res) => {
  res.json(apiDocumentation);
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
