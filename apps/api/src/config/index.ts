import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
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
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-bytes-long!',
  },

  storage: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'sivan-pms',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  },

  email: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@sivanmanagment.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Sivan Management',
  },

  whatsapp: {
    apiUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
  },

  ai: {
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    googleKey: process.env.GOOGLE_AI_API_KEY || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
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
} as const;
