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

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  }),
);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertiesRoutes);
app.use('/api/v1/owners', ownersRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/guests', guestsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/fees', feesRoutes);

// TODO: Add more routes as modules are built
// app.use('/api/v1/documents', documentsRoutes);
// app.use('/api/v1/maintenance', maintenanceRoutes);
// app.use('/api/v1/tasks', tasksRoutes);
// app.use('/api/v1/communications', communicationsRoutes);
// app.use('/api/v1/channels', channelsRoutes);
// app.use('/api/v1/reports', reportsRoutes);
// app.use('/api/v1/ai', aiRoutes);
// app.use('/api/v1/whatsapp', whatsappRoutes);
// app.use('/api/v1/loyalty', loyaltyRoutes);
// app.use('/api/v1/affiliates', affiliatesRoutes);
// app.use('/api/v1/marketing', marketingRoutes);
// app.use('/api/v1/portfolio', portfolioRoutes);
// app.use('/api/v1/payments', paymentsRoutes);
// app.use('/api/v1/iot', iotRoutes);
// app.use('/api/v1/notifications', notificationsRoutes);
// app.use('/api/v1/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
