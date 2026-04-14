import axios from 'axios';
import { prisma } from '../../prisma/client';
import { config } from '../../config';
import { ApiError } from '../../utils/api-error';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types matching what the controller / frontend expects
// ---------------------------------------------------------------------------

type TemplateType =
  | 'CHECK_IN'
  | 'CHECKOUT'
  | 'WELCOME'
  | 'REVIEW_REQUEST'
  | 'PAYMENT_REMINDER'
  | 'BOOKING_CONFIRMATION'
  | 'CUSTOM';

// ---------------------------------------------------------------------------
// Helper: get the default active MessagingInstance for sending
// ---------------------------------------------------------------------------

async function getDefaultInstance() {
  const instance = await prisma.messagingInstance.findFirst({
    where: { isDefault: true, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
  return instance;
}

// ---------------------------------------------------------------------------
// Helper: call Evolution API to send a text message
// Returns true on success, false on failure (never throws)
// ---------------------------------------------------------------------------

async function sendViaEvolutionApi(
  phone: string,
  text: string,
): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
  try {
    const instance = await getDefaultInstance();

    // Determine API URL and key: prefer per-instance values, fall back to global config
    const apiUrl = instance?.apiUrl || config.whatsapp.apiUrl;
    const apiKey = instance?.apiKey || config.whatsapp.apiKey;
    const instanceName = instance?.instanceName || 'default';

    if (!apiUrl || !apiKey) {
      console.error('[WhatsApp] Missing Evolution API URL or API key');
      return { success: false, error: 'Missing Evolution API configuration' };
    }

    const url = `${apiUrl}/message/sendText/${instanceName}`;

    const response = await axios.post(
      url,
      { number: phone, text },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        timeout: 15_000,
      },
    );

    // Increment messagesSent counter on the instance
    if (instance) {
      await prisma.messagingInstance.update({
        where: { id: instance.id },
        data: { messagesSent: { increment: 1 } },
      }).catch(() => { /* non-critical */ });
    }

    const externalId = response.data?.key?.id || response.data?.messageId || undefined;
    return { success: true, externalMessageId: externalId };
  } catch (err: any) {
    const errorMsg = err?.response?.data?.message || err?.message || 'Unknown Evolution API error';
    console.error('[WhatsApp] Evolution API send failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WhatsAppService {
  // ========================================================================
  // CONTACTS  (backed by GuestProfile)
  // ========================================================================

  async getContacts(filters: {
    tag?: string;
    search?: string;
    propertyId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { tag, search, propertyId, isActive, page = 1, limit = 20 } = filters;

    const where: Prisma.GuestProfileWhereInput = {
      deletedAt: null,
    };

    // Filter by phone existing (only contacts with phone are WhatsApp-relevant)
    where.phone = { not: null };

    // Tag filter: tags is a Json field storing string[]
    if (tag) {
      where.tags = { array_contains: [tag] };
    }

    // Search across name, phone, email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Property filter: guest must have at least one booking for that property
    if (propertyId) {
      where.bookings = { some: { propertyId } };
    }

    // isActive: treat deletedAt presence as inactive
    if (isActive === false) {
      where.deletedAt = { not: null };
      delete (where as any).deletedAt; // remove the null check we set above
      where.deletedAt = { not: null };
    }

    const [total, guests] = await Promise.all([
      prisma.guestProfile.count({ where }),
      prisma.guestProfile.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          bookings: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, propertyId: true, property: { select: { name: true } } },
          },
          messageThreads: {
            where: { channel: 'WHATSAPP' },
            take: 1,
            orderBy: { lastMessageAt: 'desc' },
            select: { lastMessageAt: true },
          },
        },
      }),
    ]);

    // Map GuestProfile to the Contact shape the frontend expects
    const contacts = guests.map((g) => {
      const latestBooking = g.bookings[0] || null;
      const latestThread = g.messageThreads[0] || null;
      return {
        id: g.id,
        name: `${g.firstName} ${g.lastName}`.trim(),
        phone: g.phone!,
        email: g.email || undefined,
        guestId: g.id,
        bookingId: latestBooking?.id || undefined,
        propertyId: latestBooking?.propertyId || undefined,
        propertyName: latestBooking?.property?.name || undefined,
        tags: (g.tags as string[]) || [],
        isActive: g.deletedAt === null,
        lastMessageAt: latestThread?.lastMessageAt?.toISOString() || undefined,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      };
    });

    return { contacts, total, page, limit };
  }

  async getContactById(id: string) {
    const g = await prisma.guestProfile.findUnique({
      where: { id },
      include: {
        bookings: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, propertyId: true, property: { select: { name: true } } },
        },
        messageThreads: {
          where: { channel: 'WHATSAPP' },
          take: 1,
          orderBy: { lastMessageAt: 'desc' },
          select: { lastMessageAt: true },
        },
      },
    });
    if (!g) throw ApiError.notFound('Contact');

    const latestBooking = g.bookings[0] || null;
    const latestThread = g.messageThreads[0] || null;

    return {
      id: g.id,
      name: `${g.firstName} ${g.lastName}`.trim(),
      phone: g.phone || '',
      email: g.email || undefined,
      guestId: g.id,
      bookingId: latestBooking?.id || undefined,
      propertyId: latestBooking?.propertyId || undefined,
      propertyName: latestBooking?.property?.name || undefined,
      tags: (g.tags as string[]) || [],
      isActive: g.deletedAt === null,
      lastMessageAt: latestThread?.lastMessageAt?.toISOString() || undefined,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    };
  }

  async createContact(data: {
    name: string;
    phone: string;
    email?: string;
    guestId?: string;
    bookingId?: string;
    propertyId?: string;
    propertyName?: string;
    tags?: string[];
  }) {
    // Check for duplicate phone
    const existing = await prisma.guestProfile.findFirst({ where: { phone: data.phone, deletedAt: null } });
    if (existing) throw ApiError.conflict('Contact with this phone number already exists');

    // Split name into first/last
    const parts = data.name.trim().split(/\s+/);
    const firstName = parts[0] || data.name;
    const lastName = parts.slice(1).join(' ') || '';

    const guest = await prisma.guestProfile.create({
      data: {
        firstName,
        lastName,
        phone: data.phone,
        email: data.email,
        tags: data.tags || [],
      },
    });

    return {
      id: guest.id,
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      phone: guest.phone!,
      email: guest.email || undefined,
      guestId: guest.id,
      bookingId: data.bookingId || undefined,
      propertyId: data.propertyId || undefined,
      propertyName: data.propertyName || undefined,
      tags: (guest.tags as string[]) || [],
      isActive: true,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
    };
  }

  async updateContact(id: string, data: Partial<{
    name: string;
    email: string;
    tags: string[];
    isActive: boolean;
    propertyId: string;
    propertyName: string;
  }>) {
    const existing = await prisma.guestProfile.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Contact');

    const updateData: Prisma.GuestProfileUpdateInput = {};

    if (data.name) {
      const parts = data.name.trim().split(/\s+/);
      updateData.firstName = parts[0];
      updateData.lastName = parts.slice(1).join(' ') || '';
    }
    if (data.email !== undefined) updateData.email = data.email;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive === false) updateData.deletedAt = new Date();
    if (data.isActive === true) updateData.deletedAt = null;

    const updated = await prisma.guestProfile.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      name: `${updated.firstName} ${updated.lastName}`.trim(),
      phone: updated.phone || '',
      email: updated.email || undefined,
      guestId: updated.id,
      tags: (updated.tags as string[]) || [],
      isActive: updated.deletedAt === null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ========================================================================
  // MESSAGES  (backed by MessageThread + GuestMessage)
  // ========================================================================

  async getMessageThread(contactId: string, filters: { page?: number; limit?: number }) {
    // contactId is a GuestProfile id
    const guest = await prisma.guestProfile.findUnique({ where: { id: contactId } });
    if (!guest) throw ApiError.notFound('Contact');

    const { page = 1, limit = 50 } = filters;

    // Find or create the WhatsApp thread for this guest
    let thread = await prisma.messageThread.findFirst({
      where: { guestId: contactId, channel: 'WHATSAPP' },
      orderBy: { lastMessageAt: 'desc' },
    });

    // If no thread exists, return empty
    const contact = {
      id: guest.id,
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      phone: guest.phone || '',
      email: guest.email || undefined,
      guestId: guest.id,
    };

    if (!thread) {
      return { contact, messages: [], total: 0, page, limit };
    }

    // Fetch all threads for this guest on WhatsApp and gather messages
    const threads = await prisma.messageThread.findMany({
      where: { guestId: contactId, channel: 'WHATSAPP' },
      select: { id: true },
    });
    const threadIds = threads.map((t) => t.id);

    const [total, dbMessages] = await Promise.all([
      prisma.guestMessage.count({ where: { threadId: { in: threadIds } } }),
      prisma.guestMessage.findMany({
        where: { threadId: { in: threadIds } },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          thread: {
            select: {
              bookingId: true,
              propertyId: true,
              property: { select: { name: true } },
            },
          },
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const messages = dbMessages.map((m) => ({
      id: m.id,
      contactId,
      contactName: `${guest.firstName} ${guest.lastName}`.trim(),
      contactPhone: guest.phone || '',
      direction: m.senderType === 'GUEST' ? 'INBOUND' as const : 'OUTBOUND' as const,
      templateType: m.contentType === 'TEMPLATE' ? ((m.metadata as any)?.templateType || undefined) : undefined,
      content: m.content,
      mediaUrl: m.attachments ? ((m.attachments as any)?.url || undefined) : undefined,
      status: this.deriveStatus(m),
      statusUpdatedAt: (m.readAt || m.deliveredAt || m.sentAt).toISOString(),
      bookingId: m.thread.bookingId || undefined,
      propertyId: m.thread.propertyId || undefined,
      sentBy: m.senderId || undefined,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.createdAt.toISOString(),
    }));

    return { contact, messages, total, page, limit };
  }

  async getMessageHistory(filters: {
    bookingId?: string;
    propertyId?: string;
    direction?: string;
    status?: string;
    templateType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { bookingId, propertyId, direction, status, templateType, search, page = 1, limit = 20 } = filters;

    const where: Prisma.GuestMessageWhereInput = {
      thread: { channel: 'WHATSAPP' },
    };

    if (bookingId) where.thread = { ...where.thread as any, bookingId };
    if (propertyId) where.thread = { ...where.thread as any, propertyId };

    if (direction === 'OUTBOUND') {
      where.senderType = { in: ['STAFF', 'SYSTEM', 'AI'] };
    } else if (direction === 'INBOUND') {
      where.senderType = 'GUEST';
    }

    // Status filter: map our status concepts to DB fields
    if (status === 'READ') where.readAt = { not: null };
    if (status === 'DELIVERED') {
      where.deliveredAt = { not: null };
      where.readAt = null;
    }
    if (status === 'SENT') {
      where.deliveredAt = null;
      where.readAt = null;
      where.senderType = { in: ['STAFF', 'SYSTEM', 'AI'] };
    }
    if (status === 'FAILED') {
      where.metadata = { path: ['status'], equals: 'FAILED' };
    }

    if (templateType) {
      where.contentType = 'TEMPLATE';
      where.metadata = { path: ['templateType'], equals: templateType };
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    const [total, dbMessages] = await Promise.all([
      prisma.guestMessage.count({ where }),
      prisma.guestMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          thread: {
            select: {
              guestId: true,
              bookingId: true,
              propertyId: true,
              guest: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
          sender: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const messages = dbMessages.map((m) => {
      const guest = m.thread.guest;
      const contactName = guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'Unknown';
      const contactPhone = guest?.phone || '';

      return {
        id: m.id,
        contactId: m.thread.guestId || '',
        contactName,
        contactPhone,
        direction: m.senderType === 'GUEST' ? 'INBOUND' as const : 'OUTBOUND' as const,
        templateType: m.contentType === 'TEMPLATE' ? ((m.metadata as any)?.templateType || undefined) : undefined,
        content: m.content,
        mediaUrl: m.attachments ? ((m.attachments as any)?.url || undefined) : undefined,
        status: this.deriveStatus(m),
        statusUpdatedAt: (m.readAt || m.deliveredAt || m.sentAt).toISOString(),
        bookingId: m.thread.bookingId || undefined,
        propertyId: m.thread.propertyId || undefined,
        sentBy: m.senderId || undefined,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.createdAt.toISOString(),
      };
    });

    return { messages, total, page, limit };
  }

  async sendMessage(
    data: {
      contactId: string;
      content: string;
      templateType?: TemplateType;
      bookingId?: string;
      propertyId?: string;
      mediaUrl?: string;
    },
    sentBy: string,
  ) {
    // Resolve the guest
    const guest = await prisma.guestProfile.findUnique({ where: { id: data.contactId } });
    if (!guest) throw ApiError.notFound('Contact');
    if (!guest.phone) throw ApiError.badRequest('Contact has no phone number');

    // Find or create a WhatsApp thread for this guest
    let thread = await prisma.messageThread.findFirst({
      where: {
        guestId: data.contactId,
        channel: 'WHATSAPP',
        ...(data.bookingId ? { bookingId: data.bookingId } : {}),
        status: { in: ['OPEN', 'AWAITING_REPLY'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          guestId: data.contactId,
          channel: 'WHATSAPP',
          bookingId: data.bookingId || null,
          propertyId: data.propertyId || null,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
      });
    }

    // Determine content type
    const contentType = data.templateType ? 'TEMPLATE' : 'TEXT';

    // Build metadata
    const metadata: Record<string, any> = {};
    if (data.templateType) metadata.templateType = data.templateType;

    // Actually send via Evolution API
    const apiResult = await sendViaEvolutionApi(guest.phone, data.content);

    if (!apiResult.success) {
      metadata.status = 'FAILED';
      metadata.errorMessage = apiResult.error;
    }

    // Save the message in DB regardless of API success/failure
    const message = await prisma.guestMessage.create({
      data: {
        threadId: thread.id,
        senderType: 'STAFF',
        senderId: sentBy,
        content: data.content,
        contentType: contentType as any,
        attachments: data.mediaUrl ? { url: data.mediaUrl } : undefined,
        externalMessageId: apiResult.externalMessageId || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        sentAt: new Date(),
        deliveredAt: apiResult.success ? new Date() : null,
      },
    });

    // Update thread's lastMessageAt and status
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        status: 'AWAITING_REPLY',
        propertyId: data.propertyId || thread.propertyId,
        bookingId: data.bookingId || thread.bookingId,
      },
    });

    // Return in the shape the controller/frontend expects
    return {
      id: message.id,
      contactId: data.contactId,
      contactName: `${guest.firstName} ${guest.lastName}`.trim(),
      contactPhone: guest.phone,
      direction: 'OUTBOUND' as const,
      templateType: data.templateType,
      content: data.content,
      mediaUrl: data.mediaUrl,
      status: apiResult.success ? 'SENT' : 'FAILED',
      statusUpdatedAt: new Date().toISOString(),
      bookingId: data.bookingId,
      propertyId: data.propertyId,
      sentBy,
      errorMessage: apiResult.error,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.createdAt.toISOString(),
    };
  }

  async sendTemplateMessage(
    data: {
      contactId: string;
      templateId: string;
      variables: Record<string, string>;
      bookingId?: string;
      propertyId?: string;
    },
    sentBy: string,
  ) {
    // Fetch the template from DB
    const template = await prisma.communicationTemplate.findUnique({
      where: { id: data.templateId },
      include: { variables: true },
    });
    if (!template) throw ApiError.notFound('Template');
    if (!template.isActive) throw ApiError.badRequest('Template is not active');

    // The body field is Json (multilingual). Extract the text content.
    // It may be a plain string or an object like { en: "...", el: "..." }
    let bodyText: string;
    if (typeof template.body === 'string') {
      bodyText = template.body;
    } else if (typeof template.body === 'object' && template.body !== null) {
      const bodyObj = template.body as Record<string, string>;
      // Prefer English, fall back to first available
      bodyText = bodyObj.en || bodyObj.default || Object.values(bodyObj)[0] || '';
    } else {
      bodyText = '';
    }

    // Replace variables in template content
    let content = bodyText;
    for (const [key, value] of Object.entries(data.variables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Determine the templateType from the triggerEvent or name
    const templateType = (template.triggerEvent || template.name || 'CUSTOM') as TemplateType;

    return this.sendMessage(
      {
        contactId: data.contactId,
        content,
        templateType,
        bookingId: data.bookingId,
        propertyId: data.propertyId,
      },
      sentBy,
    );
  }

  async updateMessageStatus(id: string, status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED') {
    const message = await prisma.guestMessage.findUnique({ where: { id } });
    if (!message) throw ApiError.notFound('Message');

    const updateData: Prisma.GuestMessageUpdateInput = {};
    const now = new Date();

    if (status === 'DELIVERED') {
      updateData.deliveredAt = now;
    } else if (status === 'READ') {
      updateData.readAt = now;
      updateData.isRead = true;
      if (!message.deliveredAt) updateData.deliveredAt = now;
    } else if (status === 'FAILED') {
      updateData.metadata = { ...(message.metadata as any || {}), status: 'FAILED' };
    }

    const updated = await prisma.guestMessage.update({
      where: { id },
      data: updateData,
      include: {
        thread: {
          select: {
            guestId: true,
            bookingId: true,
            propertyId: true,
            guest: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    const guest = updated.thread.guest;
    return {
      id: updated.id,
      contactId: updated.thread.guestId || '',
      contactName: guest ? `${guest.firstName} ${guest.lastName}`.trim() : 'Unknown',
      contactPhone: guest?.phone || '',
      direction: updated.senderType === 'GUEST' ? 'INBOUND' as const : 'OUTBOUND' as const,
      content: updated.content,
      status,
      statusUpdatedAt: now.toISOString(),
      bookingId: updated.thread.bookingId || undefined,
      propertyId: updated.thread.propertyId || undefined,
      sentBy: updated.senderId || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  // ========================================================================
  // TEMPLATES  (backed by CommunicationTemplate)
  // ========================================================================

  async getTemplates(filters: { type?: string; isActive?: boolean }) {
    const where: Prisma.CommunicationTemplateWhereInput = {
      channel: 'WHATSAPP',
    };

    if (filters.type) {
      where.triggerEvent = filters.type;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const templates = await prisma.communicationTemplate.findMany({
      where,
      include: { variables: true },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map((t) => {
      // Extract body text
      let content: string;
      if (typeof t.body === 'string') {
        content = t.body;
      } else if (typeof t.body === 'object' && t.body !== null) {
        const bodyObj = t.body as Record<string, string>;
        content = bodyObj.en || bodyObj.default || Object.values(bodyObj)[0] || '';
      } else {
        content = '';
      }

      return {
        id: t.id,
        type: t.triggerEvent || 'CUSTOM',
        name: t.name,
        language: 'en',
        content,
        variables: t.variables.map((v) => v.variableKey),
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });
  }

  async getTemplateById(id: string) {
    const t = await prisma.communicationTemplate.findUnique({
      where: { id },
      include: { variables: true },
    });
    if (!t) throw ApiError.notFound('Template');

    let content: string;
    if (typeof t.body === 'string') {
      content = t.body;
    } else if (typeof t.body === 'object' && t.body !== null) {
      const bodyObj = t.body as Record<string, string>;
      content = bodyObj.en || bodyObj.default || Object.values(bodyObj)[0] || '';
    } else {
      content = '';
    }

    return {
      id: t.id,
      type: t.triggerEvent || 'CUSTOM',
      name: t.name,
      language: 'en',
      content,
      variables: t.variables.map((v) => v.variableKey),
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  async createTemplate(data: {
    type: string;
    name: string;
    language: string;
    content: string;
    variables: string[];
    isActive: boolean;
  }) {
    const template = await prisma.communicationTemplate.create({
      data: {
        name: data.name,
        channel: 'WHATSAPP',
        triggerEvent: data.type,
        body: { [data.language || 'en']: data.content },
        isActive: data.isActive,
        variables: {
          create: data.variables.map((key) => ({
            variableKey: key,
            description: key,
          })),
        },
      },
      include: { variables: true },
    });

    return {
      id: template.id,
      type: data.type,
      name: template.name,
      language: data.language || 'en',
      content: data.content,
      variables: template.variables.map((v) => v.variableKey),
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async updateTemplate(id: string, data: Partial<{
    name: string;
    content: string;
    variables: string[];
    isActive: boolean;
  }>) {
    const existing = await prisma.communicationTemplate.findUnique({
      where: { id },
      include: { variables: true },
    });
    if (!existing) throw ApiError.notFound('Template');

    const updateData: Prisma.CommunicationTemplateUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.content !== undefined) {
      // Merge into existing body
      const oldBody = (typeof existing.body === 'object' && existing.body !== null)
        ? existing.body as Record<string, string>
        : {};
      updateData.body = { ...oldBody, en: data.content };
    }

    // Handle variables update: delete old, create new
    if (data.variables !== undefined) {
      updateData.variables = {
        deleteMany: {},
        create: data.variables.map((key) => ({
          variableKey: key,
          description: key,
        })),
      };
    }

    const updated = await prisma.communicationTemplate.update({
      where: { id },
      data: updateData,
      include: { variables: true },
    });

    let content: string;
    if (typeof updated.body === 'string') {
      content = updated.body;
    } else if (typeof updated.body === 'object' && updated.body !== null) {
      const bodyObj = updated.body as Record<string, string>;
      content = bodyObj.en || bodyObj.default || Object.values(bodyObj)[0] || '';
    } else {
      content = '';
    }

    return {
      id: updated.id,
      type: updated.triggerEvent || 'CUSTOM',
      name: updated.name,
      language: 'en',
      content,
      variables: updated.variables.map((v) => v.variableKey),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ========================================================================
  // STATS (aggregated from GuestMessage)
  // ========================================================================

  async getStats() {
    // Count messages by direction and status using DB aggregations
    const [
      totalMessages,
      outboundCount,
      inboundCount,
      deliveredCount,
      readCount,
      failedCount,
      activeContacts,
      totalContacts,
      templateMessages,
    ] = await Promise.all([
      // Total messages on WhatsApp threads
      prisma.guestMessage.count({
        where: { thread: { channel: 'WHATSAPP' } },
      }),
      // Outbound (STAFF, SYSTEM, AI)
      prisma.guestMessage.count({
        where: {
          thread: { channel: 'WHATSAPP' },
          senderType: { in: ['STAFF', 'SYSTEM', 'AI'] },
        },
      }),
      // Inbound (GUEST)
      prisma.guestMessage.count({
        where: {
          thread: { channel: 'WHATSAPP' },
          senderType: 'GUEST',
        },
      }),
      // Delivered (has deliveredAt but not readAt)
      prisma.guestMessage.count({
        where: {
          thread: { channel: 'WHATSAPP' },
          deliveredAt: { not: null },
          readAt: null,
          senderType: { in: ['STAFF', 'SYSTEM', 'AI'] },
        },
      }),
      // Read
      prisma.guestMessage.count({
        where: {
          thread: { channel: 'WHATSAPP' },
          readAt: { not: null },
          senderType: { in: ['STAFF', 'SYSTEM', 'AI'] },
        },
      }),
      // Failed
      prisma.guestMessage.count({
        where: {
          thread: { channel: 'WHATSAPP' },
          metadata: { path: ['status'], equals: 'FAILED' },
        },
      }),
      // Active contacts: guests with a phone and at least one WhatsApp thread
      prisma.guestProfile.count({
        where: {
          deletedAt: null,
          phone: { not: null },
          messageThreads: { some: { channel: 'WHATSAPP' } },
        },
      }),
      // Total contacts with phone
      prisma.guestProfile.count({
        where: {
          deletedAt: null,
          phone: { not: null },
        },
      }),
      // Template messages grouped by type
      prisma.guestMessage.findMany({
        where: {
          thread: { channel: 'WHATSAPP' },
          contentType: 'TEMPLATE',
        },
        select: { metadata: true },
      }),
    ]);

    // Derive "sent" = outbound - delivered - read - failed
    const sentCount = Math.max(0, outboundCount - deliveredCount - readCount - failedCount);

    const byStatus = {
      queued: 0,
      sent: sentCount,
      delivered: deliveredCount,
      read: readCount,
      failed: failedCount,
    };

    // Build templateType distribution
    const byTemplate: Record<string, number> = {};
    for (const m of templateMessages) {
      const tType = (m.metadata as any)?.templateType;
      if (tType) {
        byTemplate[tType] = (byTemplate[tType] || 0) + 1;
      }
    }

    const deliveryRate = outboundCount > 0
      ? Math.round(((deliveredCount + readCount) / outboundCount) * 100)
      : 0;
    const readRate = outboundCount > 0
      ? Math.round((readCount / outboundCount) * 100)
      : 0;

    return {
      totalMessages,
      outbound: outboundCount,
      inbound: inboundCount,
      byStatus,
      byTemplate,
      activeContacts,
      totalContacts,
      deliveryRate,
      readRate,
    };
  }

  // ========================================================================
  // Private helpers
  // ========================================================================

  private deriveStatus(msg: {
    readAt: Date | null;
    deliveredAt: Date | null;
    sentAt: Date;
    metadata: any;
  }): string {
    if ((msg.metadata as any)?.status === 'FAILED') return 'FAILED';
    if (msg.readAt) return 'READ';
    if (msg.deliveredAt) return 'DELIVERED';
    return 'SENT';
  }
}

export const whatsAppService = new WhatsAppService();
