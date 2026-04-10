export enum Channel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  AIRBNB_MESSAGE = 'AIRBNB_MESSAGE',
  BOOKING_COM_MESSAGE = 'BOOKING_COM_MESSAGE',
}

export enum MessageStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export enum SenderType {
  SYSTEM = 'SYSTEM',
  MANAGER = 'MANAGER',
  GUEST = 'GUEST',
  OWNER = 'OWNER',
  BOT = 'BOT',
}

export interface MessageThread {
  id: string;
  bookingId?: string;
  propertyId: string;
  guestId: string;
  subject?: string;
  channel: Channel;
  isArchived: boolean;
  isStarred: boolean;
  lastMessageAt: string;
  unreadCount: number;
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestMessage {
  id: string;
  threadId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  htmlContent?: string;
  attachments: string[];
  status: MessageStatus;
  channel: Channel;
  externalMessageId?: string;
  isAutoReply: boolean;
  translatedContent?: Record<string, string>;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  channel: Channel;
  subject?: Record<string, string>; // multilingual
  body: Record<string, string>; // multilingual
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
