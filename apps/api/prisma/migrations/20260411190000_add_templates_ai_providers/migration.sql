-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AiProviderType" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: notification_templates
CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" TEXT,
    "email_subject" JSONB,
    "email_body" JSONB,
    "whatsapp_body" JSONB,
    "sms_body" JSONB,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "last_edited_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_slug_key" ON "notification_templates"("slug");

-- CreateTable: ai_provider_configs
CREATE TABLE IF NOT EXISTS "ai_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" "AiProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_approval_requests
CREATE TABLE IF NOT EXISTS "expense_approval_requests" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_approval_requests_pkey" PRIMARY KEY ("id")
);
