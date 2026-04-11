import { ApiError } from '../../utils/api-error';

type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
type MessageDirection = 'OUTBOUND' | 'INBOUND';
type TemplateType = 'CHECK_IN' | 'CHECKOUT' | 'WELCOME' | 'REVIEW_REQUEST' | 'PAYMENT_REMINDER' | 'BOOKING_CONFIRMATION' | 'CUSTOM';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  guestId?: string;
  bookingId?: string;
  propertyId?: string;
  propertyName?: string;
  tags: string[];
  isActive: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  direction: MessageDirection;
  templateType?: TemplateType;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  statusUpdatedAt: string;
  bookingId?: string;
  propertyId?: string;
  sentBy?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplate {
  id: string;
  type: TemplateType;
  name: string;
  language: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const contacts: Contact[] = [
  {
    id: 'wc-001', name: 'Hans Mueller', phone: '+491761234567', email: 'hans.m@email.de',
    guestId: 'g-001', bookingId: 'book-040', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    tags: ['guest', 'vip'], isActive: true, lastMessageAt: '2026-04-09T14:00:00Z',
    createdAt: '2026-03-25T10:00:00Z', updatedAt: '2026-04-09T14:00:00Z',
  },
  {
    id: 'wc-002', name: 'Sophie Laurent', phone: '+33612345678', email: 'sophie.l@email.fr',
    guestId: 'g-002', bookingId: 'book-042', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    tags: ['guest'], isActive: true, lastMessageAt: '2026-04-07T10:00:00Z',
    createdAt: '2026-03-28T12:00:00Z', updatedAt: '2026-04-07T10:00:00Z',
  },
  {
    id: 'wc-003', name: 'James Wilson', phone: '+447911123456', email: 'j.wilson@email.com',
    guestId: 'g-003', bookingId: 'book-044', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    tags: ['guest'], isActive: true, lastMessageAt: '2026-04-10T08:00:00Z',
    createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-10T08:00:00Z',
  },
  {
    id: 'wc-004', name: 'Yannis Plumbing', phone: '+302810234567',
    tags: ['vendor', 'maintenance'], isActive: true, lastMessageAt: '2026-04-05T11:00:00Z',
    createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'wc-005', name: 'Maria Ivanova', phone: '+79161234567', email: 'maria.i@email.ru',
    guestId: 'g-004', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    tags: ['guest', 'returning'], isActive: true, lastMessageAt: '2026-03-20T16:00:00Z',
    createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-20T16:00:00Z',
  },
];

const messages: Message[] = [
  // Thread 1: Hans Mueller - Check-in & Welcome
  {
    id: 'wm-001', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'OUTBOUND', templateType: 'BOOKING_CONFIRMATION',
    content: 'Hello Hans! Your booking at Villa Elounda Seafront is confirmed. Check-in: April 1, 2026. Confirmation code: SVM-00040. We look forward to welcoming you!',
    status: 'READ', statusUpdatedAt: '2026-03-25T11:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-03-25T10:30:00Z', updatedAt: '2026-03-25T11:00:00Z',
  },
  {
    id: 'wm-002', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'INBOUND',
    content: 'Thank you! Can you please send me the directions to the villa?',
    status: 'READ', statusUpdatedAt: '2026-03-25T12:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001',
    createdAt: '2026-03-25T11:30:00Z', updatedAt: '2026-03-25T12:00:00Z',
  },
  {
    id: 'wm-003', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'OUTBOUND',
    content: 'Of course! Here are the directions to Villa Elounda Seafront: Take the national road from Heraklion airport towards Agios Nikolaos. After 60km, take the Elounda exit. The villa is on the coastal road, 500m past the Elounda Beach Hotel. GPS: 35.2612, 25.7312. We will also send you a Google Maps pin closer to your arrival.',
    status: 'READ', statusUpdatedAt: '2026-03-25T13:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001', sentBy: 'u-002',
    createdAt: '2026-03-25T12:15:00Z', updatedAt: '2026-03-25T13:00:00Z',
  },
  {
    id: 'wm-004', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'OUTBOUND', templateType: 'CHECK_IN',
    content: 'Hi Hans! Welcome to Crete! Your villa is ready for you. Check-in is at 15:00. The lockbox code is 4821. WiFi: EloundaVilla / Password: crete2026. Enjoy your stay!',
    status: 'READ', statusUpdatedAt: '2026-04-01T14:30:00Z',
    bookingId: 'book-040', propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-01T14:30:00Z',
  },
  {
    id: 'wm-005', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'INBOUND',
    content: 'We arrived safely! The villa is beautiful, thank you!',
    status: 'READ', statusUpdatedAt: '2026-04-01T16:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001',
    createdAt: '2026-04-01T15:30:00Z', updatedAt: '2026-04-01T16:00:00Z',
  },
  {
    id: 'wm-006', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'OUTBOUND', templateType: 'CHECKOUT',
    content: 'Hi Hans! We hope you had a wonderful stay at Villa Elounda. Checkout is at 11:00 tomorrow. Please leave the keys in the lockbox. Safe travels home!',
    status: 'READ', statusUpdatedAt: '2026-04-09T10:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-04-08T18:00:00Z', updatedAt: '2026-04-09T10:00:00Z',
  },
  {
    id: 'wm-007', contactId: 'wc-001', contactName: 'Hans Mueller', contactPhone: '+491761234567',
    direction: 'OUTBOUND', templateType: 'REVIEW_REQUEST',
    content: 'Hi Hans! Thank you for staying at Villa Elounda Seafront. We hope you had an amazing time in Crete! Would you mind leaving us a review? It helps other guests discover our properties. Here is the link: https://sivanmanagement.com/review/book-040',
    status: 'DELIVERED', statusUpdatedAt: '2026-04-09T14:00:00Z',
    bookingId: 'book-040', propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-04-09T14:00:00Z', updatedAt: '2026-04-09T14:00:00Z',
  },
  // Thread 2: Sophie Laurent - Chania apt
  {
    id: 'wm-008', contactId: 'wc-002', contactName: 'Sophie Laurent', contactPhone: '+33612345678',
    direction: 'OUTBOUND', templateType: 'BOOKING_CONFIRMATION',
    content: 'Bonjour Sophie! Your booking at Chania Old Town Apt is confirmed. Check-in: April 5, 2026. Confirmation code: SVM-00042. See you in Chania!',
    status: 'READ', statusUpdatedAt: '2026-03-28T13:00:00Z',
    bookingId: 'book-042', propertyId: 'prop-002', sentBy: 'u-001',
    createdAt: '2026-03-28T12:00:00Z', updatedAt: '2026-03-28T13:00:00Z',
  },
  {
    id: 'wm-009', contactId: 'wc-002', contactName: 'Sophie Laurent', contactPhone: '+33612345678',
    direction: 'OUTBOUND', templateType: 'CHECK_IN',
    content: 'Bonjour Sophie! Your apartment in Chania Old Town is ready. Check-in at 14:00. Access code: 7293. WiFi: ChaniaOldTown / Password: welcome2026. The Venetian harbor is just 2 minutes walk!',
    status: 'READ', statusUpdatedAt: '2026-04-05T13:00:00Z',
    bookingId: 'book-042', propertyId: 'prop-002', sentBy: 'u-001',
    createdAt: '2026-04-05T08:00:00Z', updatedAt: '2026-04-05T13:00:00Z',
  },
  {
    id: 'wm-010', contactId: 'wc-002', contactName: 'Sophie Laurent', contactPhone: '+33612345678',
    direction: 'INBOUND',
    content: 'Merci! Quick question - is there a washing machine in the apartment?',
    status: 'READ', statusUpdatedAt: '2026-04-06T10:00:00Z',
    bookingId: 'book-042', propertyId: 'prop-002',
    createdAt: '2026-04-06T09:30:00Z', updatedAt: '2026-04-06T10:00:00Z',
  },
  {
    id: 'wm-011', contactId: 'wc-002', contactName: 'Sophie Laurent', contactPhone: '+33612345678',
    direction: 'OUTBOUND',
    content: 'Yes Sophie! There is a washing machine in the bathroom closet. Detergent pods are on the shelf above. Let us know if you need anything else!',
    status: 'READ', statusUpdatedAt: '2026-04-06T11:00:00Z',
    bookingId: 'book-042', propertyId: 'prop-002', sentBy: 'u-002',
    createdAt: '2026-04-06T10:15:00Z', updatedAt: '2026-04-06T11:00:00Z',
  },
  // Thread 3: James Wilson - Rethymno
  {
    id: 'wm-012', contactId: 'wc-003', contactName: 'James Wilson', contactPhone: '+447911123456',
    direction: 'OUTBOUND', templateType: 'CHECK_IN',
    content: 'Hi James! Your Beach House in Rethymno is ready for you. Check-in is at 15:00. The key is in the lockbox by the front door, code: 5518. WiFi: BeachHouseReth / Password: summer2026. Enjoy the beach!',
    status: 'READ', statusUpdatedAt: '2026-04-08T14:00:00Z',
    bookingId: 'book-044', propertyId: 'prop-003', sentBy: 'u-001',
    createdAt: '2026-04-08T09:00:00Z', updatedAt: '2026-04-08T14:00:00Z',
  },
  {
    id: 'wm-013', contactId: 'wc-003', contactName: 'James Wilson', contactPhone: '+447911123456',
    direction: 'INBOUND',
    content: 'Hi, the pool filter seems to not be working properly. The water looks a bit cloudy.',
    status: 'READ', statusUpdatedAt: '2026-04-09T09:00:00Z',
    bookingId: 'book-044', propertyId: 'prop-003',
    createdAt: '2026-04-09T08:30:00Z', updatedAt: '2026-04-09T09:00:00Z',
  },
  {
    id: 'wm-014', contactId: 'wc-003', contactName: 'James Wilson', contactPhone: '+447911123456',
    direction: 'OUTBOUND',
    content: 'Hi James, sorry about that! We are sending our maintenance team over today. They should be there by 14:00. Thank you for letting us know!',
    status: 'READ', statusUpdatedAt: '2026-04-09T10:00:00Z',
    bookingId: 'book-044', propertyId: 'prop-003', sentBy: 'u-002',
    createdAt: '2026-04-09T09:15:00Z', updatedAt: '2026-04-09T10:00:00Z',
  },
  {
    id: 'wm-015', contactId: 'wc-003', contactName: 'James Wilson', contactPhone: '+447911123456',
    direction: 'INBOUND',
    content: 'Thanks for the quick response. The maintenance guy just fixed it, pool looks great now!',
    status: 'READ', statusUpdatedAt: '2026-04-09T16:00:00Z',
    bookingId: 'book-044', propertyId: 'prop-003',
    createdAt: '2026-04-09T15:30:00Z', updatedAt: '2026-04-09T16:00:00Z',
  },
  // Thread 4: Vendor
  {
    id: 'wm-016', contactId: 'wc-004', contactName: 'Yannis Plumbing', contactPhone: '+302810234567',
    direction: 'OUTBOUND',
    content: 'Hi Yannis, we need an urgent plumbing check at Chania Old Town Apt (Kanevaro 15). There is a minor bathroom leak. Can you come this week?',
    status: 'READ', statusUpdatedAt: '2026-04-05T11:30:00Z',
    propertyId: 'prop-002', sentBy: 'u-001',
    createdAt: '2026-04-05T11:00:00Z', updatedAt: '2026-04-05T11:30:00Z',
  },
  {
    id: 'wm-017', contactId: 'wc-004', contactName: 'Yannis Plumbing', contactPhone: '+302810234567',
    direction: 'INBOUND',
    content: 'Hi! I can come Wednesday morning around 10:00. Will that work?',
    status: 'READ', statusUpdatedAt: '2026-04-05T12:00:00Z',
    propertyId: 'prop-002',
    createdAt: '2026-04-05T11:45:00Z', updatedAt: '2026-04-05T12:00:00Z',
  },
  // Thread 5: Maria Ivanova - returning guest
  {
    id: 'wm-018', contactId: 'wc-005', contactName: 'Maria Ivanova', contactPhone: '+79161234567',
    direction: 'OUTBOUND', templateType: 'REVIEW_REQUEST',
    content: 'Hi Maria! Thank you for your recent stay at Villa Elounda Seafront. We loved having you! Would you mind sharing your experience with a review? https://sivanmanagement.com/review/g-004',
    status: 'READ', statusUpdatedAt: '2026-03-20T17:00:00Z',
    propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-03-20T16:00:00Z', updatedAt: '2026-03-20T17:00:00Z',
  },
  {
    id: 'wm-019', contactId: 'wc-005', contactName: 'Maria Ivanova', contactPhone: '+79161234567',
    direction: 'INBOUND',
    content: 'Of course! I already left a 5-star review on Google. The villa was amazing, we will definitely come back next summer!',
    status: 'READ', statusUpdatedAt: '2026-03-20T18:00:00Z',
    propertyId: 'prop-001',
    createdAt: '2026-03-20T17:30:00Z', updatedAt: '2026-03-20T18:00:00Z',
  },
  {
    id: 'wm-020', contactId: 'wc-005', contactName: 'Maria Ivanova', contactPhone: '+79161234567',
    direction: 'OUTBOUND', templateType: 'WELCOME',
    content: 'Thank you so much Maria! We saw your Google review - it means the world to us! We would love to offer you a 10% returning guest discount for your next booking. Just mention code RETURN10 when booking!',
    status: 'DELIVERED', statusUpdatedAt: '2026-03-20T18:30:00Z',
    propertyId: 'prop-001', sentBy: 'u-001',
    createdAt: '2026-03-20T18:15:00Z', updatedAt: '2026-03-20T18:30:00Z',
  },
];

const templates: MessageTemplate[] = [
  {
    id: 'wt-001', type: 'BOOKING_CONFIRMATION', name: 'Booking Confirmation',
    language: 'en',
    content: 'Hello {{guestName}}! Your booking at {{propertyName}} is confirmed. Check-in: {{checkInDate}}. Confirmation code: {{confirmationCode}}. We look forward to welcoming you!',
    variables: ['guestName', 'propertyName', 'checkInDate', 'confirmationCode'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wt-002', type: 'CHECK_IN', name: 'Check-in Instructions',
    language: 'en',
    content: 'Hi {{guestName}}! Your {{propertyName}} is ready for you. Check-in is at {{checkInTime}}. Access code: {{accessCode}}. WiFi: {{wifiName}} / Password: {{wifiPassword}}. Enjoy your stay!',
    variables: ['guestName', 'propertyName', 'checkInTime', 'accessCode', 'wifiName', 'wifiPassword'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wt-003', type: 'CHECKOUT', name: 'Checkout Reminder',
    language: 'en',
    content: 'Hi {{guestName}}! We hope you had a wonderful stay at {{propertyName}}. Checkout is at {{checkOutTime}} tomorrow. Please leave the keys in the lockbox. Safe travels home!',
    variables: ['guestName', 'propertyName', 'checkOutTime'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wt-004', type: 'REVIEW_REQUEST', name: 'Review Request',
    language: 'en',
    content: 'Hi {{guestName}}! Thank you for staying at {{propertyName}}. We hope you had an amazing time! Would you mind leaving us a review? {{reviewLink}}',
    variables: ['guestName', 'propertyName', 'reviewLink'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wt-005', type: 'WELCOME', name: 'Welcome / Follow-up',
    language: 'en',
    content: 'Hello {{guestName}}! Welcome to {{propertyName}}. If you need anything during your stay, do not hesitate to message us. We are happy to help with restaurant recommendations, activities, or any questions!',
    variables: ['guestName', 'propertyName'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wt-006', type: 'PAYMENT_REMINDER', name: 'Payment Reminder',
    language: 'en',
    content: 'Hi {{guestName}}, this is a friendly reminder that your balance of {{amount}} for {{propertyName}} ({{checkInDate}} - {{checkOutDate}}) is due. Please complete your payment at: {{paymentLink}}',
    variables: ['guestName', 'amount', 'propertyName', 'checkInDate', 'checkOutDate', 'paymentLink'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
];

let msgCounter = 21;

export class WhatsAppService {
  // ── Contacts ──

  async getContacts(filters: {
    tag?: string;
    search?: string;
    propertyId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { tag, search, propertyId, isActive, page = 1, limit = 20 } = filters;

    let filtered = [...contacts];
    if (tag) filtered = filtered.filter((c) => c.tags.includes(tag));
    if (propertyId) filtered = filtered.filter((c) => c.propertyId === propertyId);
    if (isActive !== undefined) filtered = filtered.filter((c) => c.isActive === isActive);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)),
      );
    }

    filtered.sort((a, b) => ((b.lastMessageAt || '') > (a.lastMessageAt || '') ? 1 : -1));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { contacts: items, total, page, limit };
  }

  async getContactById(id: string) {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) throw ApiError.notFound('Contact');
    return contact;
  }

  async createContact(data: Omit<Contact, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) {
    const existing = contacts.find((c) => c.phone === data.phone);
    if (existing) throw ApiError.conflict('Contact with this phone number already exists');

    const contact: Contact = {
      ...data,
      id: `wc-${String(contacts.length + 1).padStart(3, '0')}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contacts.push(contact);
    return contact;
  }

  async updateContact(id: string, data: Partial<Contact>) {
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx === -1) throw ApiError.notFound('Contact');

    contacts[idx] = { ...contacts[idx], ...data, updatedAt: new Date().toISOString() };
    return contacts[idx];
  }

  // ── Messages ──

  async getMessageThread(contactId: string, filters: { page?: number; limit?: number }) {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) throw ApiError.notFound('Contact');

    const { page = 1, limit = 50 } = filters;
    let thread = messages.filter((m) => m.contactId === contactId);
    thread.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

    const total = thread.length;
    const start = (page - 1) * limit;
    const items = thread.slice(start, start + limit);

    return { contact, messages: items, total, page, limit };
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

    let filtered = [...messages];
    if (bookingId) filtered = filtered.filter((m) => m.bookingId === bookingId);
    if (propertyId) filtered = filtered.filter((m) => m.propertyId === propertyId);
    if (direction) filtered = filtered.filter((m) => m.direction === direction);
    if (status) filtered = filtered.filter((m) => m.status === status);
    if (templateType) filtered = filtered.filter((m) => m.templateType === templateType);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.contactName.toLowerCase().includes(q) ||
          m.contactPhone.includes(q),
      );
    }

    filtered.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { messages: items, total, page, limit };
  }

  async sendMessage(data: {
    contactId: string;
    content: string;
    templateType?: TemplateType;
    bookingId?: string;
    propertyId?: string;
    mediaUrl?: string;
  }, sentBy: string) {
    const contact = contacts.find((c) => c.id === data.contactId);
    if (!contact) throw ApiError.notFound('Contact');

    const message: Message = {
      id: `wm-${String(msgCounter).padStart(3, '0')}`,
      contactId: data.contactId,
      contactName: contact.name,
      contactPhone: contact.phone,
      direction: 'OUTBOUND',
      templateType: data.templateType,
      content: data.content,
      mediaUrl: data.mediaUrl,
      status: 'SENT',
      statusUpdatedAt: new Date().toISOString(),
      bookingId: data.bookingId,
      propertyId: data.propertyId,
      sentBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    msgCounter++;
    messages.push(message);

    // Update contact's lastMessageAt
    const cIdx = contacts.findIndex((c) => c.id === data.contactId);
    if (cIdx !== -1) {
      contacts[cIdx].lastMessageAt = message.createdAt;
      contacts[cIdx].updatedAt = message.createdAt;
    }

    return message;
  }

  async sendTemplateMessage(data: {
    contactId: string;
    templateId: string;
    variables: Record<string, string>;
    bookingId?: string;
    propertyId?: string;
  }, sentBy: string) {
    const template = templates.find((t) => t.id === data.templateId);
    if (!template) throw ApiError.notFound('Template');
    if (!template.isActive) throw ApiError.badRequest('Template is not active');

    // Replace variables in template content
    let content = template.content;
    for (const [key, value] of Object.entries(data.variables)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return this.sendMessage({
      contactId: data.contactId,
      content,
      templateType: template.type,
      bookingId: data.bookingId,
      propertyId: data.propertyId,
    }, sentBy);
  }

  async updateMessageStatus(id: string, status: MessageStatus) {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) throw ApiError.notFound('Message');

    messages[idx].status = status;
    messages[idx].statusUpdatedAt = new Date().toISOString();
    messages[idx].updatedAt = new Date().toISOString();

    return messages[idx];
  }

  // ── Templates ──

  async getTemplates(filters: { type?: string; isActive?: boolean }) {
    let filtered = [...templates];
    if (filters.type) filtered = filtered.filter((t) => t.type === filters.type);
    if (filters.isActive !== undefined) filtered = filtered.filter((t) => t.isActive === filters.isActive);
    return filtered;
  }

  async getTemplateById(id: string) {
    const template = templates.find((t) => t.id === id);
    if (!template) throw ApiError.notFound('Template');
    return template;
  }

  async createTemplate(data: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const template: MessageTemplate = {
      ...data,
      id: `wt-${String(templates.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(template);
    return template;
  }

  async updateTemplate(id: string, data: Partial<MessageTemplate>) {
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) throw ApiError.notFound('Template');

    templates[idx] = { ...templates[idx], ...data, updatedAt: new Date().toISOString() };
    return templates[idx];
  }

  // ── Stats ──

  async getStats() {
    const totalMessages = messages.length;
    const outbound = messages.filter((m) => m.direction === 'OUTBOUND').length;
    const inbound = messages.filter((m) => m.direction === 'INBOUND').length;

    const byStatus = {
      queued: messages.filter((m) => m.status === 'QUEUED').length,
      sent: messages.filter((m) => m.status === 'SENT').length,
      delivered: messages.filter((m) => m.status === 'DELIVERED').length,
      read: messages.filter((m) => m.status === 'READ').length,
      failed: messages.filter((m) => m.status === 'FAILED').length,
    };

    const byTemplate: Record<string, number> = {};
    for (const m of messages) {
      if (m.templateType) {
        byTemplate[m.templateType] = (byTemplate[m.templateType] || 0) + 1;
      }
    }

    const activeContacts = contacts.filter((c) => c.isActive).length;
    const deliveryRate = outbound > 0
      ? Math.round(((byStatus.delivered + byStatus.read) / outbound) * 100)
      : 0;
    const readRate = outbound > 0
      ? Math.round((byStatus.read / outbound) * 100)
      : 0;

    return {
      totalMessages,
      outbound,
      inbound,
      byStatus,
      byTemplate,
      activeContacts,
      totalContacts: contacts.length,
      deliveryRate,
      readRate,
    };
  }
}

export const whatsAppService = new WhatsAppService();
