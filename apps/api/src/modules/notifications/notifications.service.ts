import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class NotificationsService {
  async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { isRead, type, page = 1, limit = 20 } = filters;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw ApiError.notFound('Notification');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this notification');
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: any;
    channel: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        channel: data.channel as any,
        sentAt: new Date(),
      },
    });

    return notification;
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw ApiError.notFound('Notification');
    }

    if (notification.userId !== userId) {
      throw ApiError.forbidden('You do not have access to this notification');
    }

    await prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted successfully' };
  }
}

export const notificationsService = new NotificationsService();
