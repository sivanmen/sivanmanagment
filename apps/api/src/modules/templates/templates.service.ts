import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ── Types ────────────────────────────────────────────────────────
export type TemplateChannel = 'email' | 'whatsapp' | 'sms';
export type TemplateCategory = 'booking' | 'payment' | 'maintenance' | 'system' | 'marketing' | 'guest';
export type Locale = 'en' | 'he' | 'de' | 'es' | 'fr' | 'ru';

export const ALL_LOCALES: Locale[] = ['en', 'he', 'de', 'es', 'fr', 'ru'];

interface TemplateFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Service ──────────────────────────────────────────────────────
export class TemplatesService {
  async getAll(filters: TemplateFilters = {}) {
    const {
      search,
      category,
      isActive,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.NotificationTemplateWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      slug: 'slug',
      category: 'category',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationTemplate.count({ where }),
    ]);

    return { templates, total, page, limit };
  }

  async getById(id: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw ApiError.notFound('NotificationTemplate');
    }

    return template;
  }

  async getBySlug(slug: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw ApiError.notFound('NotificationTemplate');
    }

    return template;
  }

  async create(data: {
    slug: string;
    category: string;
    name: Record<string, string>;
    description?: string;
    emailSubject?: Record<string, string>;
    emailBody?: Record<string, string>;
    whatsappBody?: Record<string, string>;
    smsBody?: Record<string, string>;
    variables?: string[];
    isActive?: boolean;
    isSystem?: boolean;
    metadata?: any;
    lastEditedBy?: string;
  }) {
    // Check slug uniqueness
    const existing = await prisma.notificationTemplate.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw ApiError.conflict(`Template with slug "${data.slug}" already exists`);
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        slug: data.slug,
        category: data.category,
        name: data.name as any,
        description: data.description,
        emailSubject: data.emailSubject as any,
        emailBody: data.emailBody as any,
        whatsappBody: data.whatsappBody as any,
        smsBody: data.smsBody as any,
        variables: data.variables as any,
        isActive: data.isActive ?? true,
        isSystem: data.isSystem ?? false,
        metadata: data.metadata,
        lastEditedBy: data.lastEditedBy,
      },
    });

    return template;
  }

  async update(
    id: string,
    data: {
      slug?: string;
      category?: string;
      name?: Record<string, string>;
      description?: string;
      emailSubject?: Record<string, string>;
      emailBody?: Record<string, string>;
      whatsappBody?: Record<string, string>;
      smsBody?: Record<string, string>;
      variables?: string[];
      isActive?: boolean;
      metadata?: any;
      lastEditedBy?: string;
    },
  ) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('NotificationTemplate');
    }

    // If slug is being changed, check uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.notificationTemplate.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        throw ApiError.conflict(`Template with slug "${data.slug}" already exists`);
      }
    }

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.name !== undefined && { name: data.name as any }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.emailSubject !== undefined && { emailSubject: data.emailSubject as any }),
        ...(data.emailBody !== undefined && { emailBody: data.emailBody as any }),
        ...(data.whatsappBody !== undefined && { whatsappBody: data.whatsappBody as any }),
        ...(data.smsBody !== undefined && { smsBody: data.smsBody as any }),
        ...(data.variables !== undefined && { variables: data.variables as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.lastEditedBy !== undefined && { lastEditedBy: data.lastEditedBy }),
        version: { increment: 1 },
      },
    });

    return template;
  }

  async remove(id: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('NotificationTemplate');
    }

    if (existing.isSystem) {
      throw ApiError.badRequest('System templates cannot be deleted', 'SYSTEM_TEMPLATE');
    }

    await prisma.notificationTemplate.delete({ where: { id } });
    return true;
  }

  async duplicate(id: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('NotificationTemplate');
    }

    const newSlug = `${existing.slug}_copy_${Date.now()}`;

    // Modify name to add (Copy) suffix
    const nameObj = (existing.name as Record<string, string>) || {};
    const newName: Record<string, string> = {};
    for (const [locale, value] of Object.entries(nameObj)) {
      newName[locale] = `${value} (Copy)`;
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        slug: newSlug,
        category: existing.category,
        name: newName as any,
        description: existing.description,
        emailSubject: existing.emailSubject as any,
        emailBody: existing.emailBody as any,
        whatsappBody: existing.whatsappBody as any,
        smsBody: existing.smsBody as any,
        variables: existing.variables as any,
        isActive: false,
        isSystem: false,
        metadata: existing.metadata as any,
      },
    });

    return template;
  }

  /**
   * Render a template with variable substitution for a specific locale and channel.
   */
  renderTemplate(
    template: {
      emailSubject?: any;
      emailBody?: any;
      whatsappBody?: any;
      smsBody?: any;
    },
    locale: Locale,
    channel: TemplateChannel,
    variables: Record<string, string>,
  ): { subject?: string; body: string } | null {
    const replace = (text: string): string =>
      text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);

    if (channel === 'email') {
      const subjectObj = template.emailSubject as Record<string, string> | null;
      const bodyObj = template.emailBody as Record<string, string> | null;

      if (!bodyObj || !bodyObj[locale]) return null;

      return {
        subject: subjectObj?.[locale] ? replace(subjectObj[locale]) : undefined,
        body: replace(bodyObj[locale]),
      };
    }

    if (channel === 'whatsapp') {
      const bodyObj = template.whatsappBody as Record<string, string> | null;
      if (!bodyObj || !bodyObj[locale]) return null;
      return { body: replace(bodyObj[locale]) };
    }

    if (channel === 'sms') {
      const bodyObj = template.smsBody as Record<string, string> | null;
      if (!bodyObj || !bodyObj[locale]) return null;
      return { body: replace(bodyObj[locale]) };
    }

    return null;
  }

  /**
   * Render a template by slug with full lookup.
   */
  async renderBySlug(
    slug: string,
    locale: Locale,
    channel: TemplateChannel,
    variables: Record<string, string>,
  ) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw ApiError.notFound('NotificationTemplate');
    }

    const rendered = this.renderTemplate(template, locale, channel, variables);
    if (!rendered) {
      throw ApiError.badRequest(
        `No content found for locale "${locale}" and channel "${channel}"`,
        'NO_CONTENT',
      );
    }

    return rendered;
  }
}

export const templatesService = new TemplatesService();
