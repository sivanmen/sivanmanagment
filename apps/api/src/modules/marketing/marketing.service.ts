import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface WidgetFilters {
  settingsId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface BookingPageFilters {
  propertyId?: string;
  isEnabled?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MarketingService {
  // ---- Booking Widgets ----

  async getWidgets(filters: WidgetFilters) {
    const {
      settingsId,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.BookingWidgetWhereInput = {};

    if (settingsId) {
      where.settingsId = settingsId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      viewsCount: 'viewsCount',
      bookingsCount: 'bookingsCount',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [widgets, total] = await Promise.all([
      prisma.bookingWidget.findMany({
        where,
        include: {
          settings: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  internalCode: true,
                  city: true,
                },
              },
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookingWidget.count({ where }),
    ]);

    return { widgets, total, page, limit };
  }

  async getWidgetById(id: string) {
    const widget = await prisma.bookingWidget.findUnique({
      where: { id },
      include: {
        settings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                internalCode: true,
                city: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!widget) {
      throw ApiError.notFound('BookingWidget');
    }

    return widget;
  }

  async createWidget(data: {
    settingsId: string;
    embedCode: string;
    domainWhitelist?: string[];
    isActive?: boolean;
  }) {
    // Verify settings exist
    const settings = await prisma.directBookingSetting.findUnique({
      where: { id: data.settingsId },
    });
    if (!settings) {
      throw ApiError.badRequest('Direct booking settings not found', 'SETTINGS_NOT_FOUND');
    }

    const widget = await prisma.bookingWidget.create({
      data: {
        settingsId: data.settingsId,
        embedCode: data.embedCode,
        domainWhitelist: data.domainWhitelist ?? undefined,
        isActive: data.isActive ?? true,
      },
      include: {
        settings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                internalCode: true,
              },
            },
          },
        },
      },
    });

    return widget;
  }

  async updateWidget(
    id: string,
    data: Partial<{
      embedCode: string;
      domainWhitelist: string[] | null;
      isActive: boolean;
    }>,
  ) {
    const existing = await prisma.bookingWidget.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('BookingWidget');
    }

    const widget = await prisma.bookingWidget.update({
      where: { id },
      data: {
        embedCode: data.embedCode,
        domainWhitelist: data.domainWhitelist === null
          ? Prisma.JsonNull
          : data.domainWhitelist !== undefined
            ? data.domainWhitelist
            : undefined,
        isActive: data.isActive,
      },
      include: {
        settings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                internalCode: true,
              },
            },
          },
        },
      },
    });

    return widget;
  }

  async deleteWidget(id: string) {
    const existing = await prisma.bookingWidget.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('BookingWidget');
    }

    await prisma.bookingWidget.delete({ where: { id } });

    return { message: 'Widget deleted successfully' };
  }

  async getWidgetStats(id: string) {
    const widget = await prisma.bookingWidget.findUnique({
      where: { id },
      include: {
        settings: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!widget) {
      throw ApiError.notFound('BookingWidget');
    }

    const conversionRate =
      widget.viewsCount > 0
        ? (widget.bookingsCount / widget.viewsCount) * 100
        : 0;

    return {
      widgetId: widget.id,
      propertyName: widget.settings.property.name,
      viewsCount: widget.viewsCount,
      bookingsCount: widget.bookingsCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
      isActive: widget.isActive,
    };
  }

  // ---- Direct Booking Pages (Settings) ----

  async getBookingPages(filters: BookingPageFilters) {
    const {
      propertyId,
      isEnabled,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.DirectBookingSettingWhereInput = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [pages, total] = await Promise.all([
      prisma.directBookingSetting.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              internalCode: true,
              city: true,
              slug: true,
            },
          },
          widgets: {
            select: {
              id: true,
              isActive: true,
              viewsCount: true,
              bookingsCount: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.directBookingSetting.count({ where }),
    ]);

    return { pages, total, page, limit };
  }

  async createBookingPage(data: {
    propertyId: string;
    isEnabled?: boolean;
    widgetConfig?: any;
    minAdvanceDays?: number;
    maxAdvanceDays?: number;
    requireDeposit?: boolean;
    depositPercent?: number;
    termsUrl?: string;
  }) {
    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    // Check if settings already exist for this property
    const existing = await prisma.directBookingSetting.findUnique({
      where: { propertyId: data.propertyId },
    });
    if (existing) {
      throw ApiError.conflict(
        'Direct booking settings already exist for this property',
        'SETTINGS_EXIST',
      );
    }

    const page = await prisma.directBookingSetting.create({
      data: {
        propertyId: data.propertyId,
        isEnabled: data.isEnabled ?? false,
        widgetConfig: data.widgetConfig,
        minAdvanceDays: data.minAdvanceDays ?? 1,
        maxAdvanceDays: data.maxAdvanceDays ?? 365,
        requireDeposit: data.requireDeposit ?? true,
        depositPercent: data.depositPercent ?? 30,
        termsUrl: data.termsUrl,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
          },
        },
      },
    });

    return page;
  }

  async updateBookingPage(
    id: string,
    data: Partial<{
      isEnabled: boolean;
      widgetConfig: any;
      minAdvanceDays: number;
      maxAdvanceDays: number;
      requireDeposit: boolean;
      depositPercent: number;
      termsUrl: string | null;
    }>,
  ) {
    const existing = await prisma.directBookingSetting.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('DirectBookingSetting');
    }

    const page = await prisma.directBookingSetting.update({
      where: { id },
      data: {
        isEnabled: data.isEnabled,
        widgetConfig: data.widgetConfig,
        minAdvanceDays: data.minAdvanceDays,
        maxAdvanceDays: data.maxAdvanceDays,
        requireDeposit: data.requireDeposit,
        depositPercent: data.depositPercent,
        termsUrl: data.termsUrl,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
          },
        },
      },
    });

    return page;
  }
}

export const marketingService = new MarketingService();
