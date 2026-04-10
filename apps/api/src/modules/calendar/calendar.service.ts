import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class CalendarService {
  async getCalendarData(
    propertyId: string,
    startDate: string,
    endDate: string,
    unitId?: string,
    userOwnerId?: string,
  ) {
    // Verify property exists and RLS check
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!property) {
      throw ApiError.notFound('Property');
    }

    if (userOwnerId && property.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this property');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const bookingWhere: Prisma.BookingWhereInput = {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    };

    const blockWhere: Prisma.CalendarBlockWhereInput = {
      propertyId,
      startDate: { lt: end },
      endDate: { gt: start },
    };

    if (unitId) {
      bookingWhere.unitId = unitId;
      blockWhere.unitId = unitId;
    }

    const [bookings, blocks] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          status: true,
          source: true,
          guestName: true,
          guestsCount: true,
          totalAmount: true,
          currency: true,
          paymentStatus: true,
          unitId: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              unitType: true,
            },
          },
        },
        orderBy: { checkIn: 'asc' },
      }),
      prisma.calendarBlock.findMany({
        where: blockWhere,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          blockType: true,
          reason: true,
          unitId: true,
          unit: {
            select: {
              id: true,
              unitNumber: true,
              unitType: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    return { property, bookings, blocks };
  }

  async createBlock(
    data: {
      propertyId: string;
      unitId?: string;
      startDate: string;
      endDate: string;
      blockType: string;
      reason?: string;
    },
    userId: string,
  ) {
    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw ApiError.badRequest('End date must be after start date', 'INVALID_DATES');
    }

    // Check for booking conflicts
    const conflictWhere: Prisma.BookingWhereInput = {
      propertyId: data.propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      checkIn: { lt: endDate },
      checkOut: { gt: startDate },
    };

    if (data.unitId) {
      conflictWhere.unitId = data.unitId;
    } else {
      conflictWhere.unitId = null;
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: conflictWhere,
    });

    if (conflictingBooking) {
      throw ApiError.conflict(
        'Date conflict: a booking exists for these dates',
        'BOOKING_CONFLICT',
      );
    }

    const block = await prisma.calendarBlock.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId,
        startDate,
        endDate,
        blockType: data.blockType as any,
        reason: data.reason,
        createdById: userId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return block;
  }

  async updateBlock(
    id: string,
    data: Partial<{
      startDate: string;
      endDate: string;
      blockType: string;
      reason: string | null;
    }>,
  ) {
    const existing = await prisma.calendarBlock.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('CalendarBlock');
    }

    const updateData: any = {};

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    if (data.blockType) {
      updateData.blockType = data.blockType;
    }
    if (data.reason !== undefined) {
      updateData.reason = data.reason;
    }

    // If dates are changing, validate them
    const startDate = updateData.startDate || existing.startDate;
    const endDate = updateData.endDate || existing.endDate;

    if (endDate <= startDate) {
      throw ApiError.badRequest('End date must be after start date', 'INVALID_DATES');
    }

    const block = await prisma.calendarBlock.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return block;
  }

  async deleteBlock(id: string) {
    const existing = await prisma.calendarBlock.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('CalendarBlock');
    }

    await prisma.calendarBlock.delete({ where: { id } });

    return { message: 'Calendar block deleted successfully' };
  }

  async getIcalFeeds(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const feeds = await prisma.icalFeed.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    return feeds;
  }

  async createIcalFeed(data: {
    propertyId: string;
    unitId?: string;
    channelName: string;
    importUrl: string;
    syncIntervalMinutes?: number;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    const feed = await prisma.icalFeed.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId,
        channelName: data.channelName,
        importUrl: data.importUrl,
        syncIntervalMinutes: data.syncIntervalMinutes ?? 15,
      },
    });

    return feed;
  }

  async deleteIcalFeed(id: string) {
    const existing = await prisma.icalFeed.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('IcalFeed');
    }

    await prisma.icalFeed.delete({ where: { id } });

    return { message: 'iCal feed deleted successfully' };
  }

  async generateIcalExport(propertyId: string, unitId?: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });
    if (!property) {
      throw ApiError.notFound('Property');
    }

    const bookingWhere: Prisma.BookingWhereInput = {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    };

    const blockWhere: Prisma.CalendarBlockWhereInput = {
      propertyId,
    };

    if (unitId) {
      bookingWhere.unitId = unitId;
      blockWhere.unitId = unitId;
    }

    const [bookings, blocks] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guestName: true,
          status: true,
          icalUid: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { checkIn: 'asc' },
      }),
      prisma.calendarBlock.findMany({
        where: blockWhere,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          blockType: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    // Generate iCal format
    const now = new Date();
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    const formatDateOnly = (date: Date) => {
      return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += `PRODID:-//Sivan Management PMS//EN\r\n`;
    ical += `X-WR-CALNAME:${property.name}\r\n`;
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';

    // Add bookings as events
    for (const booking of bookings) {
      const uid = booking.icalUid || `booking-${booking.id}@sivan-pms`;
      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${uid}\r\n`;
      ical += `DTSTART;VALUE=DATE:${formatDateOnly(booking.checkIn)}\r\n`;
      ical += `DTEND;VALUE=DATE:${formatDateOnly(booking.checkOut)}\r\n`;
      ical += `SUMMARY:${booking.guestName} (${booking.status})\r\n`;
      ical += `DTSTAMP:${formatDate(booking.updatedAt)}\r\n`;
      ical += `CREATED:${formatDate(booking.createdAt)}\r\n`;
      ical += `LAST-MODIFIED:${formatDate(booking.updatedAt)}\r\n`;
      ical += 'STATUS:CONFIRMED\r\n';
      ical += 'END:VEVENT\r\n';
    }

    // Add blocks as events
    for (const block of blocks) {
      const uid = `block-${block.id}@sivan-pms`;
      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${uid}\r\n`;
      ical += `DTSTART;VALUE=DATE:${formatDateOnly(block.startDate)}\r\n`;
      ical += `DTEND;VALUE=DATE:${formatDateOnly(block.endDate)}\r\n`;
      ical += `SUMMARY:${block.blockType}${block.reason ? ` - ${block.reason}` : ''}\r\n`;
      ical += `DTSTAMP:${formatDate(block.updatedAt)}\r\n`;
      ical += `CREATED:${formatDate(block.createdAt)}\r\n`;
      ical += `LAST-MODIFIED:${formatDate(block.updatedAt)}\r\n`;
      ical += 'STATUS:CONFIRMED\r\n';
      ical += 'END:VEVENT\r\n';
    }

    ical += 'END:VCALENDAR\r\n';

    return ical;
  }
}

export const calendarService = new CalendarService();
