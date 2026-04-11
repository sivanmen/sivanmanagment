import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface ThreadFilters {
  search?: string;
  status?: string;
  channel?: string;
  propertyId?: string;
  guestId?: string;
  bookingId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CommunicationsService {
  async getAllThreads(filters: ThreadFilters, userOwnerId?: string) {
    const {
      search,
      status,
      channel,
      propertyId,
      guestId,
      bookingId,
      assignedToId,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.MessageThreadWhereInput = {};

    // RLS: if user is OWNER, restrict to threads for their properties
    if (userOwnerId) {
      where.OR = [
        { property: { ownerId: userOwnerId } },
        { ownerId: userOwnerId },
      ];
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status as any;
    }

    if (channel) {
      where.channel = channel as any;
    }

    if (guestId) {
      where.guestId = guestId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      const searchConditions: Prisma.MessageThreadWhereInput[] = [
        { subject: { contains: search, mode: 'insensitive' } },
      ];

      // If there's already an OR for owner RLS, we need to combine with AND
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      lastMessageAt: 'lastMessageAt',
      status: 'status',
      channel: 'channel',
    };

    const orderByField = allowedSortFields[sortBy] || 'updatedAt';

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              internalCode: true,
            },
          },
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
            },
          },
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          owner: {
            select: {
              id: true,
              companyName: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.messageThread.count({ where }),
    ]);

    return { threads, total, page, limit };
  }

  async getThreadById(id: string, userOwnerId?: string) {
    const thread = await prisma.messageThread.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
            ownerId: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw ApiError.notFound('MessageThread');
    }

    // RLS: owner can only view threads for their own properties or their own threads
    if (userOwnerId) {
      const isPropertyOwner = thread.property
        ? (thread.property as any).ownerId === userOwnerId
        : false;
      const isThreadOwner = thread.ownerId === userOwnerId;
      if (!isPropertyOwner && !isThreadOwner) {
        throw ApiError.forbidden('You do not have access to this thread');
      }
    }

    return thread;
  }

  async createThread(data: {
    propertyId?: string;
    bookingId?: string;
    guestId?: string;
    ownerId?: string;
    channel: string;
    subject?: string;
    status?: string;
    assignedToId?: string;
    metadata?: any;
    initialMessage?: {
      content: string;
      senderType: string;
      senderId?: string;
      contentType?: string;
      attachments?: any;
    };
  }) {
    // Verify property exists if provided
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (!property || property.deletedAt) {
        throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
      }
    }

    const thread = await prisma.messageThread.create({
      data: {
        propertyId: data.propertyId,
        bookingId: data.bookingId,
        guestId: data.guestId,
        ownerId: data.ownerId,
        channel: data.channel as any,
        subject: data.subject,
        status: (data.status as any) || 'OPEN',
        assignedToId: data.assignedToId,
        lastMessageAt: data.initialMessage ? new Date() : undefined,
        unreadCount: data.initialMessage ? 1 : 0,
        metadata: data.metadata,
        messages: data.initialMessage
          ? {
              create: {
                content: data.initialMessage.content,
                senderType: data.initialMessage.senderType as any,
                senderId: data.initialMessage.senderId,
                contentType: (data.initialMessage.contentType as any) || 'TEXT',
                attachments: data.initialMessage.attachments,
              },
            }
          : undefined,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return thread;
  }

  async updateThread(
    id: string,
    data: Partial<{
      propertyId: string | null;
      bookingId: string | null;
      guestId: string | null;
      ownerId: string | null;
      channel: string;
      subject: string | null;
      status: string;
      assignedToId: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.messageThread.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('MessageThread');
    }

    const updateData: any = { ...data };

    // Cast enum fields
    if (data.channel) updateData.channel = data.channel as any;
    if (data.status) updateData.status = data.status as any;

    const thread = await prisma.messageThread.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return thread;
  }

  async addMessage(
    threadId: string,
    data: {
      content: string;
      senderType: string;
      senderId?: string;
      contentType?: string;
      attachments?: any;
      externalMessageId?: string;
      metadata?: any;
    },
  ) {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      throw ApiError.notFound('MessageThread');
    }

    const [message] = await Promise.all([
      prisma.guestMessage.create({
        data: {
          threadId,
          content: data.content,
          senderType: data.senderType as any,
          senderId: data.senderId,
          contentType: (data.contentType as any) || 'TEXT',
          attachments: data.attachments,
          externalMessageId: data.externalMessageId,
          metadata: data.metadata,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      // Update thread's lastMessageAt and unreadCount
      prisma.messageThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
          // If thread was resolved/closed and a new message comes in, reopen it
          status: thread.status === 'RESOLVED' || thread.status === 'CLOSED'
            ? 'OPEN'
            : thread.status === 'OPEN' && data.senderType === 'STAFF'
              ? 'AWAITING_REPLY'
              : undefined,
        },
      }),
    ]);

    return message;
  }

  async markMessageRead(messageId: string) {
    const message = await prisma.guestMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      throw ApiError.notFound('Message');
    }

    const updated = await prisma.guestMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Decrement unread count on thread
    await prisma.messageThread.update({
      where: { id: message.threadId },
      data: {
        unreadCount: { decrement: 1 },
      },
    });

    return updated;
  }

  async assignThread(threadId: string, data: { assignedToId: string }) {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      throw ApiError.notFound('MessageThread');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!user) {
      throw ApiError.badRequest('User not found', 'USER_NOT_FOUND');
    }

    const updated = await prisma.messageThread.update({
      where: { id: threadId },
      data: { assignedToId: data.assignedToId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return updated;
  }

  async resolveThread(threadId: string) {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      throw ApiError.notFound('MessageThread');
    }

    if (thread.status === 'RESOLVED') {
      throw ApiError.badRequest('Thread is already resolved', 'ALREADY_RESOLVED');
    }

    const updated = await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        status: 'RESOLVED',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return updated;
  }

  async getThreadStats(userOwnerId?: string) {
    const propertyWhere: Prisma.MessageThreadWhereInput = {};
    if (userOwnerId) {
      propertyWhere.OR = [
        { property: { ownerId: userOwnerId } },
        { ownerId: userOwnerId },
      ];
    }

    const [byStatus, byChannel, unreadTotal, unassigned] = await Promise.all([
      prisma.messageThread.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { id: true },
      }),
      prisma.messageThread.groupBy({
        by: ['channel'],
        where: propertyWhere,
        _count: { id: true },
      }),
      prisma.messageThread.aggregate({
        where: {
          ...propertyWhere,
          status: { in: ['OPEN', 'AWAITING_REPLY'] },
        },
        _sum: { unreadCount: true },
      }),
      prisma.messageThread.count({
        where: {
          ...propertyWhere,
          status: { in: ['OPEN', 'AWAITING_REPLY'] },
          assignedToId: null,
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count.id })),
      totalUnread: unreadTotal._sum.unreadCount ?? 0,
      unassigned,
    };
  }
}

export const communicationsService = new CommunicationsService();
