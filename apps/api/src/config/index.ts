import dotenv from 'dotenv';
dotenv.config();

/**
 * Sentinel values used as DEV defaults for secrets.
 * These are explicitly forbidden in production — the config will throw on boot
 * if NODE_ENV==='production' and any of these are still in effect.
 */
const DEV_DEFAULTS = {
  JWT_SECRET: 'dev-jwt-secret-change-me',
  JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
  ENCRYPTION_KEY: 'dev-encryption-key-32-bytes-long!',
} as const;

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

/**
 * Read a required secret. In production, throws if missing or equals a dev sentinel.
 * In dev/test, falls back to the sentinel so local development still works.
 */
function requireSecret(envVar: keyof typeof DEV_DEFAULTS): string {
  const value = process.env[envVar];
  if (!value || value === DEV_DEFAULTS[envVar]) {
    if (isProd) {
      throw new Error(
        `[CONFIG] FATAL: ${envVar} is missing or set to the dev default in production. ` +
          `Generate a new value (\`openssl rand -hex 32\`) and set it in Railway variables before boot. ` +
          `This is a hard failure — running with the dev default would allow JWT/session forgery.`
      );
    }
    // Dev/test: return the sentinel
    return DEV_DEFAULTS[envVar];
  }
  return value;
}

/**
 * Read an integration secret that must exist if and only if the integration is enabled.
 * Logs a warning at boot (production only) if missing, but does NOT throw — services
 * that depend on it must check and degrade gracefully.
 */
function optionalSecret(envVar: string, integration: string): string {
  const value = process.env[envVar] || '';
  if (isProd && !value) {
    // eslint-disable-next-line no-console
    console.warn(
      `[CONFIG] WARNING: ${envVar} is not set — ${integration} integration will run in mock/degraded mode.`
    );
  }
  return value;
}

export const config = {
  env: NODE_ENV,
  isProd,
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5174',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),

  db: {
    url: process.env.DATABASE_URL || 'postgresql://sivan:sivan_dev@localhost:5432/sivan_pms',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    // SECURITY: fail-fast in production if dev defaults still in use.
    secret: requireSecret('JWT_SECRET'),
    refreshSecret: requireSecret('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  encryption: {
    // SECURITY: fail-fast in production if dev defaults still in use.
    key: requireSecret('ENCRYPTION_KEY'),
  },

  storage: {
    accountId: optionalSecret('R2_ACCOUNT_ID', 'Cloudflare R2'),
    accessKeyId: optionalSecret('R2_ACCESS_KEY_ID', 'Cloudflare R2'),
    secretAccessKey: optionalSecret('R2_SECRET_ACCESS_KEY', 'Cloudflare R2'),
    bucketName: process.env.R2_BUCKET_NAME || 'sivan-pms',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    endpoint: process.env.R2_ENDPOINT || '', // Optional explicit endpoint (else derived from accountId)
  },

  email: {
    apiKey: optionalSecret('SENDGRID_API_KEY', 'SendGrid email'),
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@sivanmanagment.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Sivan Management',
  },

  whatsapp: {
    apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: optionalSecret('EVOLUTION_API_KEY', 'Evolution WhatsApp API'),
    defaultInstance: process.env.EVOLUTION_DEFAULT_INSTANCE || '',
  },

  ai: {
    anthropicKey: optionalSecret('ANTHROPIC_API_KEY', 'Anthropic Claude AI'),
    openaiKey: optionalSecret('OPENAI_API_KEY', 'OpenAI'),
    googleKey: optionalSecret('GOOGLE_AI_API_KEY', 'Google AI'),
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER || 'anthropic') as 'anthropic' | 'openai' | 'google',
  },

  stripe: {
    secretKey: optionalSecret('STRIPE_SECRET_KEY', 'Stripe payments'),
    /**
     * SECURITY: empty webhook secret means Stripe webhook signature verification is bypassed,
     * which would let anyone POST fake payment_intent.succeeded and mark bookings paid.
     * The webhook handler MUST refuse to process events when this is empty.
     * Warn loudly in production.
     */
    webhookSecret: optionalSecret('STRIPE_WEBHOOK_SECRET', 'Stripe webhook signature verification'),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  paypal: {
    clientId: optionalSecret('PAYPAL_CLIENT_ID', 'PayPal payments'),
    clientSecret: optionalSecret('PAYPAL_CLIENT_SECRET', 'PayPal payments'),
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678',
  },

  company: {
    name: process.env.COMPANY_NAME || 'Sivan Management',
    address: process.env.COMPANY_ADDRESS || '',
    taxNo: process.env.COMPANY_TAX_NO || '',
    bankName: process.env.COMPANY_BANK_NAME || '',
    bankBranch: process.env.COMPANY_BANK_BRANCH || '',
    bankSwift: process.env.COMPANY_BANK_SWIFT || '',
    bankIban: process.env.COMPANY_BANK_IBAN || '',
    bankAddress: process.env.COMPANY_BANK_ADDRESS || '',
  },

  admin: {
    whatsappPhone: process.env.ADMIN_WHATSAPP_PHONE || '',
  },

  observability: {
    sentryDsn: process.env.SENTRY_DSN || '',
  },
} as const;
