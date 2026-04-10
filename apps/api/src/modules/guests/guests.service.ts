import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface GuestFilters {
  search?: string;
  screeningStatus?: string;
  nationality?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GuestsService {
  async getAllGuests(filters: GuestFilters) {
    const {
      search,
      screeningStatus,
      nationality,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.GuestProfileWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (screeningStatus) {
      where.screeningStatus = screeningStatus as any;
    }

    if (nationality) {
      where.nationality = nationality;
    }

    const allowedSortFields: Record<string, string> = {
      name: 'firstName',
      firstName: 'firstName',
      lastName: 'lastName',
      totalStays: 'totalStays',
      totalRevenue: 'totalRevenue',
      createdAt: 'createdAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [guests, total] = await Promise.all([
      prisma.guestProfile.findMany({
        where,
        include: {
          _count: {
            select: {
              bookings: true,
              screenings: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.guestProfile.count({ where }),
    ]);

    return { guests, total, page, limit };
  }

  async getGuestById(id: string) {
    const guest = await prisma.guestProfile.findUnique({
      where: { id },
      include: {
        bookings: {
          select: {
            id: true,
            propertyId: true,
            checkIn: true,
            checkOut: true,
            nights: true,
            status: true,
            totalAmount: true,
            currency: true,
            source: true,
            property: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
          orderBy: { checkIn: 'desc' },
          take: 50,
        },
        screenings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!guest || guest.deletedAt) {
      throw ApiError.notFound('Guest');
    }

    return guest;
  }

  async createGuest(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    nationality?: string;
    language?: string;
    idType?: string;
    idNumber?: string;
    idExpiry?: string;
    dateOfBirth?: string;
    address?: any;
    tags?: any;
    notes?: string;
    screeningStatus?: string;
    metadata?: any;
  }) {
    // Check for duplicate email if provided
    if (data.email) {
      const existing = await prisma.guestProfile.findFirst({
        where: { email: data.email, deletedAt: null },
      });
      if (existing) {
        throw ApiError.conflict('A guest with this email already exists', 'DUPLICATE_EMAIL');
      }
    }

    const guest = await prisma.guestProfile.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        nationality: data.nationality,
        language: data.language,
        idType: data.idType,
        idNumber: data.idNumber,
        idExpiry: data.idExpiry ? new Date(data.idExpiry) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address,
        tags: data.tags,
        notes: data.notes,
        screeningStatus: data.screeningStatus as any,
        metadata: data.metadata,
      },
    });

    return guest;
  }

  async updateGuest(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      nationality: string | null;
      language: string | null;
      idType: string | null;
      idNumber: string | null;
      idExpiry: string | null;
      dateOfBirth: string | null;
      address: any;
      tags: any;
      notes: string | null;
      screeningStatus: string | null;
      totalStays: number;
      totalRevenue: number;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.guestProfile.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Guest');
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== existing.email) {
      const duplicate = await prisma.guestProfile.findFirst({
        where: { email: data.email, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        throw ApiError.conflict('A guest with this email already exists', 'DUPLICATE_EMAIL');
      }
    }

    const updateData: any = { ...data };

    // Convert date strings
    if (data.idExpiry !== undefined) {
      updateData.idExpiry = data.idExpiry ? new Date(data.idExpiry) : null;
    }
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    const guest = await prisma.guestProfile.update({
      where: { id },
      data: updateData,
    });

    return guest;
  }

  async deleteGuest(id: string) {
    const existing = await prisma.guestProfile.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Guest');
    }

    // Soft delete
    await prisma.guestProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Guest deleted successfully' };
  }

  async mergeGuests(primaryId: string, duplicateId: string) {
    if (primaryId === duplicateId) {
      throw ApiError.badRequest('Cannot merge a guest with itself', 'SAME_GUEST');
    }

    const [primary, duplicate] = await Promise.all([
      prisma.guestProfile.findUnique({ where: { id: primaryId } }),
      prisma.guestProfile.findUnique({ where: { id: duplicateId } }),
    ]);

    if (!primary || primary.deletedAt) {
      throw ApiError.notFound('Primary guest');
    }
    if (!duplicate || duplicate.deletedAt) {
      throw ApiError.notFound('Duplicate guest');
    }

    // Merge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reassign all bookings from duplicate to primary
      await tx.booking.updateMany({
        where: { guestId: duplicateId },
        data: { guestId: primaryId },
      });

      // Reassign screenings
      await tx.guestScreening.updateMany({
        where: { guestId: duplicateId },
        data: { guestId: primaryId },
      });

      // Sum totalStays and totalRevenue
      const newTotalStays = primary.totalStays + duplicate.totalStays;
      const newTotalRevenue = primary.totalRevenue.toNumber() + duplicate.totalRevenue.toNumber();

      // Update primary guest with merged data
      const merged = await tx.guestProfile.update({
        where: { id: primaryId },
        data: {
          totalStays: newTotalStays,
          totalRevenue: newTotalRevenue,
          // Fill in missing fields from duplicate
          phone: primary.phone || duplicate.phone,
          nationality: primary.nationality || duplicate.nationality,
          language: primary.language || duplicate.language,
          notes: primary.notes
            ? (duplicate.notes ? `${primary.notes}\n---\n${duplicate.notes}` : primary.notes)
            : duplicate.notes,
        },
      });

      // Soft delete the duplicate
      await tx.guestProfile.update({
        where: { id: duplicateId },
        data: { deletedAt: new Date() },
      });

      return merged;
    });

    return result;
  }
}

export const guestsService = new GuestsService();
