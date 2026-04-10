import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface BookingFilters {
  search?: string;
  status?: string;
  propertyId?: string;
  source?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class BookingsService {
  async getAllBookings(filters: BookingFilters, userOwnerId?: string) {
    const {
      search,
      status,
      propertyId,
      source,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'checkIn',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.BookingWhereInput = {};

    // RLS: if user is OWNER, restrict to bookings for their properties
    if (userOwnerId) {
      where.property = { ownerId: userOwnerId };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status as any;
    }

    if (source) {
      where.source = source as any;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as any;
    }

    if (dateFrom || dateTo) {
      where.checkIn = {};
      if (dateFrom) {
        where.checkIn.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.checkIn.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      checkIn: 'checkIn',
      createdAt: 'createdAt',
      totalAmount: 'totalAmount',
      guestName: 'guestName',
      status: 'status',
    };

    const orderByField = allowedSortFields[sortBy] || 'checkIn';

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
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
          unit: {
            select: {
              id: true,
              unitNumber: true,
              unitType: true,
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
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total, page, limit };
  }

  async getBookingById(id: string, userOwnerId?: string) {
    const booking = await prisma.booking.findUnique({
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
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        guest: true,
        incomeRecords: true,
      },
    });

    if (!booking) {
      throw ApiError.notFound('Booking');
    }

    // RLS: owner can only view bookings for their own properties
    const bookingWithRelations = booking as typeof booking & {
      property: { ownerId: string };
    };
    if (userOwnerId && bookingWithRelations.property.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this booking');
    }

    return booking;
  }

  async createBooking(data: {
    propertyId: string;
    unitId?: string;
    guestId?: string;
    source?: string;
    externalId?: string;
    status?: string;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    adults?: number;
    children?: number;
    infants?: number;
    pets?: number;
    nightlyRate: number;
    cleaningFee?: number;
    serviceFee?: number;
    taxes?: number;
    currency?: string;
    paymentStatus?: string;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    specialRequests?: string;
    internalNotes?: string;
    icalUid?: string;
    metadata?: any;
  }) {
    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    if (checkOutDate <= checkInDate) {
      throw ApiError.badRequest('Check-out date must be after check-in date', 'INVALID_DATES');
    }

    // Calculate nights
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate amounts
    const subtotal = data.nightlyRate * nights;
    const cleaningFee = data.cleaningFee || 0;
    const serviceFee = data.serviceFee || 0;
    const taxes = data.taxes || 0;
    const totalAmount = subtotal + cleaningFee + serviceFee + taxes;

    // Check for date conflicts (overlapping bookings)
    const conflictWhere: Prisma.BookingWhereInput = {
      propertyId: data.propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    };

    if (data.unitId) {
      conflictWhere.unitId = data.unitId;
    } else {
      // If no unit specified, check property-level conflicts
      conflictWhere.unitId = null;
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: conflictWhere,
    });

    if (conflictingBooking) {
      throw ApiError.conflict(
        'Date conflict: another booking exists for these dates',
        'DATE_CONFLICT',
      );
    }

    // Check calendar block conflicts
    const blockConflictWhere: Prisma.CalendarBlockWhereInput = {
      propertyId: data.propertyId,
      startDate: { lt: checkOutDate },
      endDate: { gt: checkInDate },
    };

    if (data.unitId) {
      blockConflictWhere.unitId = data.unitId;
    } else {
      blockConflictWhere.unitId = null;
    }

    const conflictingBlock = await prisma.calendarBlock.findFirst({
      where: blockConflictWhere,
    });

    if (conflictingBlock) {
      throw ApiError.conflict(
        'Date conflict: a calendar block exists for these dates',
        'BLOCK_CONFLICT',
      );
    }

    // Auto-create GuestProfile if guestEmail provided and no existing profile
    let guestId = data.guestId;
    if (!guestId && data.guestEmail) {
      const existingGuest = await prisma.guestProfile.findFirst({
        where: { email: data.guestEmail, deletedAt: null },
      });

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Parse name for guest profile
        const nameParts = data.guestName.trim().split(/\s+/);
        const firstName = nameParts[0] || data.guestName;
        const lastName = nameParts.slice(1).join(' ') || '';

        const newGuest = await prisma.guestProfile.create({
          data: {
            firstName,
            lastName,
            email: data.guestEmail,
            phone: data.guestPhone,
          },
        });
        guestId = newGuest.id;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId,
        guestId,
        source: (data.source as any) || 'MANUAL',
        externalId: data.externalId,
        status: (data.status as any) || 'PENDING',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guestsCount: data.guestsCount,
        adults: data.adults ?? 1,
        children: data.children ?? 0,
        infants: data.infants ?? 0,
        pets: data.pets ?? 0,
        nightlyRate: data.nightlyRate,
        subtotal,
        cleaningFee,
        serviceFee,
        taxes,
        totalAmount,
        currency: data.currency || 'EUR',
        paymentStatus: (data.paymentStatus as any) || 'PENDING',
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        specialRequests: data.specialRequests,
        internalNotes: data.internalNotes,
        icalUid: data.icalUid,
        confirmedAt: data.status === 'CONFIRMED' ? new Date() : undefined,
        metadata: data.metadata,
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
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        guest: true,
      },
    });

    return booking;
  }

  async updateBooking(
    id: string,
    data: Partial<{
      unitId: string | null;
      guestId: string | null;
      source: string;
      externalId: string | null;
      status: string;
      checkIn: string;
      checkOut: string;
      guestsCount: number;
      adults: number;
      children: number;
      infants: number;
      pets: number;
      nightlyRate: number;
      cleaningFee: number;
      serviceFee: number;
      taxes: number;
      currency: string;
      paymentStatus: string;
      guestName: string;
      guestEmail: string | null;
      guestPhone: string | null;
      specialRequests: string | null;
      internalNotes: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Booking');
    }

    const updateData: any = { ...data };

    // Handle date changes
    let checkInDate = existing.checkIn;
    let checkOutDate = existing.checkOut;

    if (data.checkIn) {
      checkInDate = new Date(data.checkIn);
      updateData.checkIn = checkInDate;
    }
    if (data.checkOut) {
      checkOutDate = new Date(data.checkOut);
      updateData.checkOut = checkOutDate;
    }

    // If dates changed, recalculate nights and check conflicts
    if (data.checkIn || data.checkOut) {
      if (checkOutDate <= checkInDate) {
        throw ApiError.badRequest('Check-out date must be after check-in date', 'INVALID_DATES');
      }

      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      updateData.nights = nights;

      // Check for date conflicts (exclude current booking)
      const unitId = data.unitId !== undefined ? data.unitId : existing.unitId;

      const conflictWhere: Prisma.BookingWhereInput = {
        id: { not: id },
        propertyId: existing.propertyId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      };

      if (unitId) {
        conflictWhere.unitId = unitId;
      } else {
        conflictWhere.unitId = null;
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: conflictWhere,
      });

      if (conflictingBooking) {
        throw ApiError.conflict(
          'Date conflict: another booking exists for these dates',
          'DATE_CONFLICT',
        );
      }

      // Recalculate totals if nightlyRate is also changing or use existing
      const nightlyRate = data.nightlyRate ?? existing.nightlyRate.toNumber();
      const subtotal = nightlyRate * nights;
      const cleaningFee = data.cleaningFee ?? existing.cleaningFee.toNumber();
      const serviceFee = data.serviceFee ?? existing.serviceFee.toNumber();
      const taxes = data.taxes ?? existing.taxes.toNumber();

      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal + cleaningFee + serviceFee + taxes;
    } else if (data.nightlyRate !== undefined || data.cleaningFee !== undefined || data.serviceFee !== undefined || data.taxes !== undefined) {
      // Recalculate totals if any financial field changes
      const nightlyRate = data.nightlyRate ?? existing.nightlyRate.toNumber();
      const subtotal = nightlyRate * existing.nights;
      const cleaningFee = data.cleaningFee ?? existing.cleaningFee.toNumber();
      const serviceFee = data.serviceFee ?? existing.serviceFee.toNumber();
      const taxes = data.taxes ?? existing.taxes.toNumber();

      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal + cleaningFee + serviceFee + taxes;
    }

    // Handle status change to CANCELLED
    if (data.status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    // Handle status change to CONFIRMED
    if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED' && !existing.confirmedAt) {
      updateData.confirmedAt = new Date();
    }

    // Clean up string date fields - they should not go to Prisma as strings
    delete updateData.checkIn;
    delete updateData.checkOut;
    if (data.checkIn) updateData.checkIn = checkInDate;
    if (data.checkOut) updateData.checkOut = checkOutDate;

    const booking = await prisma.booking.update({
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
        unit: {
          select: {
            id: true,
            unitNumber: true,
            unitType: true,
          },
        },
        guest: true,
      },
    });

    return booking;
  }

  async cancelBooking(id: string, reason?: string) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Booking');
    }

    if (existing.status === 'CANCELLED') {
      throw ApiError.badRequest('Booking is already cancelled', 'ALREADY_CANCELLED');
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
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
        guest: true,
      },
    });

    return booking;
  }

  async deleteBooking(id: string) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Booking');
    }

    await prisma.booking.delete({ where: { id } });

    return { message: 'Booking deleted successfully' };
  }

  async getBookingStats(userOwnerId?: string) {
    const propertyWhere: Prisma.BookingWhereInput = {};
    if (userOwnerId) {
      propertyWhere.property = { ownerId: userOwnerId };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      byStatus,
      monthlyRevenue,
      upcomingCheckIns,
      upcomingCheckOuts,
    ] = await Promise.all([
      // Count by status
      prisma.booking.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { id: true },
      }),
      // Total revenue this month (confirmed/checked-in/checked-out bookings)
      prisma.booking.aggregate({
        where: {
          ...propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Upcoming check-ins (next 7 days)
      prisma.booking.count({
        where: {
          ...propertyWhere,
          status: { in: ['CONFIRMED', 'PENDING'] },
          checkIn: { gte: now, lte: sevenDaysFromNow },
        },
      }),
      // Upcoming check-outs (next 7 days)
      prisma.booking.count({
        where: {
          ...propertyWhere,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkOut: { gte: now, lte: sevenDaysFromNow },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      monthlyRevenue: monthlyRevenue._sum.totalAmount ?? 0,
      monthlyBookings: monthlyRevenue._count.id,
      upcomingCheckIns,
      upcomingCheckOuts,
    };
  }
}

export const bookingsService = new BookingsService();
