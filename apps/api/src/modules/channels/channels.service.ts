import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface ChannelFilters {
  propertyId?: string;
  channel?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ChannelsService {
  async getAllChannels(filters: ChannelFilters) {
    const {
      propertyId,
      channel,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ChannelConnectionWhereInput = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (channel) {
      where.channel = channel as any;
    }

    if (status) {
      where.status = status as any;
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      channel: 'channel',
      status: 'status',
      lastSyncedAt: 'lastSyncedAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [channels, total] = await Promise.all([
      prisma.channelConnection.findMany({
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
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.channelConnection.count({ where }),
    ]);

    return { channels, total, page, limit };
  }

  async getChannelById(id: string) {
    const channel = await prisma.channelConnection.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            internalCode: true,
          },
        },
      },
    });

    if (!channel) {
      throw ApiError.notFound('Channel connection');
    }

    return channel;
  }

  async createChannel(data: {
    propertyId: string;
    channel: string;
    externalListingId?: string;
    credentials?: any;
    settings?: any;
  }) {
    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    // Check for duplicate channel connection
    const existing = await prisma.channelConnection.findUnique({
      where: {
        propertyId_channel: {
          propertyId: data.propertyId,
          channel: data.channel as any,
        },
      },
    });

    if (existing) {
      throw ApiError.conflict(
        'Channel connection already exists for this property',
        'CHANNEL_EXISTS',
      );
    }

    const channel = await prisma.channelConnection.create({
      data: {
        propertyId: data.propertyId,
        channel: data.channel as any,
        externalListingId: data.externalListingId,
        credentials: data.credentials,
        settings: data.settings,
        status: 'CHANNEL_PENDING',
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
      },
    });

    return channel;
  }

  async updateChannel(
    id: string,
    data: Partial<{
      status: string;
      externalListingId: string | null;
      credentials: any;
      settings: any;
      syncError: string | null;
    }>,
  ) {
    const existing = await prisma.channelConnection.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Channel connection');
    }

    const updateData: any = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.externalListingId !== undefined) updateData.externalListingId = data.externalListingId;
    if (data.credentials !== undefined) updateData.credentials = data.credentials;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.syncError !== undefined) updateData.syncError = data.syncError;

    const channel = await prisma.channelConnection.update({
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
      },
    });

    return channel;
  }

  async deleteChannel(id: string) {
    const existing = await prisma.channelConnection.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Channel connection');
    }

    await prisma.channelConnection.delete({ where: { id } });

    return { message: 'Channel connection deleted successfully' };
  }

  async syncChannel(id: string) {
    const existing = await prisma.channelConnection.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Channel connection');
    }

    if (existing.status !== 'CONNECTED') {
      throw ApiError.badRequest(
        'Channel must be connected before syncing',
        'CHANNEL_NOT_CONNECTED',
      );
    }

    // Placeholder: In production, this would trigger the actual sync process
    // (e.g., fetch availability from Airbnb, push rates to Booking.com, etc.)
    const channel = await prisma.channelConnection.update({
      where: { id },
      data: {
        lastSyncedAt: new Date(),
        syncError: null,
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
      },
    });

    return { message: 'Sync initiated successfully', channel };
  }

  async getChannelStats() {
    const [byChannel, byStatus, totalConnections] = await Promise.all([
      prisma.channelConnection.groupBy({
        by: ['channel'],
        _count: { id: true },
      }),
      prisma.channelConnection.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.channelConnection.count(),
    ]);

    return {
      totalConnections,
      byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count.id })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    };
  }
}

export const channelsService = new ChannelsService();
