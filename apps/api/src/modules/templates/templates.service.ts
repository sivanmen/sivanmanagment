import { v4 as uuid } from 'uuid';

// ── Types ────────────────────────────────────────────────────────
export type TemplateChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type TemplateCategory = 'BOOKING' | 'PAYMENT' | 'MAINTENANCE' | 'MARKETING' | 'SYSTEM';

export interface MessageTemplate {
  id: string;
  name: string;
  slug: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  variables: string[];
  category: TemplateCategory;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── In-Memory Store with Seed Data ───────────────────────────────
const templates: Map<string, MessageTemplate> = new Map();

function seed() {
  const now = new Date();
  const seedData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Booking Confirmed',
      slug: 'booking_confirmed',
      channel: 'EMAIL',
      subject: 'Your booking at {{property_name}} is confirmed!',
      body: 'Dear {{guest_name}},\n\nYour booking at {{property_name}} is confirmed!\n\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nTotal: €{{total_amount}}\n\nWe look forward to welcoming you!\n\nBest regards,\nSivan Management',
      variables: ['guest_name', 'property_name', 'check_in_date', 'check_out_date', 'total_amount'],
      category: 'BOOKING',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Booking Cancelled',
      slug: 'booking_cancelled',
      channel: 'EMAIL',
      subject: 'Booking at {{property_name}} has been cancelled',
      body: 'Dear {{guest_name}},\n\nWe are sorry to inform you that your booking at {{property_name}} ({{check_in_date}} - {{check_out_date}}) has been cancelled.\n\nIf you have any questions about the refund, please contact us.\n\nBest regards,\nSivan Management',
      variables: ['guest_name', 'property_name', 'check_in_date', 'check_out_date'],
      category: 'BOOKING',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Check-in Reminder',
      slug: 'check_in_reminder',
      channel: 'WHATSAPP',
      body: 'Hi {{guest_name}}! 👋 Your stay at {{property_name}} starts tomorrow. Check-in: {{check_in_time}}. WiFi: {{wifi_name}}/{{wifi_password}}',
      variables: ['guest_name', 'property_name', 'check_in_time', 'wifi_name', 'wifi_password'],
      category: 'BOOKING',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Check-out Reminder',
      slug: 'check_out_reminder',
      channel: 'WHATSAPP',
      body: 'Hi {{guest_name}}, checkout is today by {{check_out_time}}. Thank you for staying at {{property_name}}!',
      variables: ['guest_name', 'check_out_time', 'property_name'],
      category: 'BOOKING',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Welcome Back Guest',
      slug: 'welcome_back',
      channel: 'WHATSAPP',
      body: 'Welcome back, {{guest_name}}! 🌟 As a returning guest, enjoy a special rate at {{property_name}}. Contact us for exclusive offers!',
      variables: ['guest_name', 'property_name'],
      category: 'MARKETING',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Payment Received',
      slug: 'payment_received',
      channel: 'EMAIL',
      subject: 'Payment of €{{amount}} received',
      body: 'Dear {{guest_name}},\n\nWe have received your payment of €{{amount}} for your booking at {{property_name}}.\n\nThank you!\nSivan Management',
      variables: ['guest_name', 'amount', 'property_name'],
      category: 'PAYMENT',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Owner Payout',
      slug: 'owner_payout',
      channel: 'EMAIL',
      subject: 'Your monthly payout of €{{net_amount}} has been processed',
      body: 'Dear {{owner_name}},\n\nYour monthly payout of €{{net_amount}} for {{property_name}} has been processed and should arrive within 2-3 business days.\n\nBest regards,\nSivan Management',
      variables: ['owner_name', 'net_amount', 'property_name'],
      category: 'PAYMENT',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Maintenance Reported',
      slug: 'maintenance_reported',
      channel: 'EMAIL',
      subject: 'New maintenance request: {{title}}',
      body: 'A new maintenance request has been submitted:\n\nTitle: {{title}}\nProperty: {{property_name}}\n\nPlease review and assign this request.',
      variables: ['title', 'property_name'],
      category: 'MAINTENANCE',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Maintenance Completed',
      slug: 'maintenance_completed',
      channel: 'WHATSAPP',
      body: 'Maintenance for "{{title}}" at {{property_name}} has been completed. If you have further issues, please let us know.',
      variables: ['title', 'property_name'],
      category: 'MAINTENANCE',
      language: 'en',
      isActive: true,
    },
    {
      name: 'Welcome Owner',
      slug: 'welcome_owner',
      channel: 'EMAIL',
      subject: 'Welcome to Sivan Management, {{owner_name}}!',
      body: 'Dear {{owner_name}},\n\nWelcome to Sivan Management! Your portal is ready.\n\nYou can log in at any time to view your properties, financial reports, and booking calendar.\n\nBest regards,\nThe Sivan Team',
      variables: ['owner_name'],
      category: 'SYSTEM',
      language: 'en',
      isActive: true,
    },
  ];

  for (const data of seedData) {
    const id = uuid();
    templates.set(id, { id, ...data, createdAt: now, updatedAt: now });
  }
}

// Seed on module load
seed();

// ── Service Class ────────────────────────────────────────────────
export class TemplatesService {
  getAllTemplates(filters?: {
    channel?: TemplateChannel;
    category?: TemplateCategory;
    language?: string;
    isActive?: boolean;
  }): MessageTemplate[] {
    let result = Array.from(templates.values());

    if (filters?.channel) {
      result = result.filter((t) => t.channel === filters.channel);
    }
    if (filters?.category) {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters?.language) {
      result = result.filter((t) => t.language === filters.language);
    }
    if (filters?.isActive !== undefined) {
      result = result.filter((t) => t.isActive === filters.isActive);
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  getTemplateById(id: string): MessageTemplate | undefined {
    return templates.get(id);
  }

  getTemplateBySlug(slug: string): MessageTemplate | undefined {
    return Array.from(templates.values()).find((t) => t.slug === slug);
  }

  createTemplate(
    data: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  ): MessageTemplate {
    const id = uuid();
    const now = new Date();
    const tpl: MessageTemplate = { id, ...data, createdAt: now, updatedAt: now };
    templates.set(id, tpl);
    return tpl;
  }

  updateTemplate(
    id: string,
    data: Partial<Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>>,
  ): MessageTemplate | undefined {
    const existing = templates.get(id);
    if (!existing) return undefined;

    const updated: MessageTemplate = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    return templates.delete(id);
  }

  previewTemplate(
    id: string,
    sampleData: Record<string, string>,
  ): { subject?: string; body: string } | undefined {
    const tpl = templates.get(id);
    if (!tpl) return undefined;

    const replace = (text: string) =>
      text.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleData[key] || `{{${key}}}`);

    return {
      subject: tpl.subject ? replace(tpl.subject) : undefined,
      body: replace(tpl.body),
    };
  }

  duplicateTemplate(id: string): MessageTemplate | undefined {
    const existing = templates.get(id);
    if (!existing) return undefined;

    const newId = uuid();
    const now = new Date();
    const duplicate: MessageTemplate = {
      ...existing,
      id: newId,
      name: `${existing.name} (Copy)`,
      slug: `${existing.slug}_copy_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    templates.set(newId, duplicate);
    return duplicate;
  }
}

export const templatesService = new TemplatesService();
