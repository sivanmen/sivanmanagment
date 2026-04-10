import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class UnitsService {
  async getAllUnits(propertyId: string, userOwnerId?: string) {
    // Verify property exists and check access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw ApiError.notFound('Property');
    }

    if (userOwnerId && property.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this property');
    }

    const units = await prisma.propertyUnit.findMany({
      where: { propertyId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
            maintenanceRequests: true,
          },
        },
      },
      orderBy: { unitNumber: 'asc' },
    });

    return units;
  }

  async getUnitById(propertyId: string, unitId: string, userOwnerId?: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw ApiError.notFound('Property');
    }

    if (userOwnerId && property.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this property');
    }

    const unit = await prisma.propertyUnit.findFirst({
      where: { id: unitId, propertyId },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
            maintenanceRequests: true,
            tasks: true,
          },
        },
      },
    });

    if (!unit) {
      throw ApiError.notFound('Property Unit');
    }

    return unit;
  }

  async createUnit(
    propertyId: string,
    data: {
      unitNumber: string;
      unitType: string;
      floor?: number;
      areaSqm?: number;
      baseNightlyRate: number;
      maxGuests: number;
      status?: string;
      metadata?: any;
    },
  ) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw ApiError.notFound('Property');
    }

    // Check for duplicate unit number within property
    const existing = await prisma.propertyUnit.findFirst({
      where: { propertyId, unitNumber: data.unitNumber },
    });
    if (existing) {
      throw ApiError.conflict('Unit number already exists in this property', 'DUPLICATE_UNIT');
    }

    const unit = await prisma.propertyUnit.create({
      data: {
        propertyId,
        unitNumber: data.unitNumber,
        unitType: data.unitType as any,
        floor: data.floor,
        areaSqm: data.areaSqm,
        baseNightlyRate: data.baseNightlyRate,
        maxGuests: data.maxGuests,
        status: (data.status as any) || 'ACTIVE',
        metadata: data.metadata,
      },
      include: {
        images: true,
      },
    });

    return unit;
  }

  async updateUnit(
    propertyId: string,
    unitId: string,
    data: Partial<{
      unitNumber: string;
      unitType: string;
      floor: number | null;
      areaSqm: number | null;
      baseNightlyRate: number;
      maxGuests: number;
      status: string;
      metadata: any;
    }>,
  ) {
    const unit = await prisma.propertyUnit.findFirst({
      where: { id: unitId, propertyId },
    });

    if (!unit) {
      throw ApiError.notFound('Property Unit');
    }

    // Check duplicate unit number if changing
    if (data.unitNumber && data.unitNumber !== unit.unitNumber) {
      const existing = await prisma.propertyUnit.findFirst({
        where: { propertyId, unitNumber: data.unitNumber },
      });
      if (existing) {
        throw ApiError.conflict('Unit number already exists in this property', 'DUPLICATE_UNIT');
      }
    }

    const updated = await prisma.propertyUnit.update({
      where: { id: unitId },
      data: {
        ...data,
        unitType: data.unitType as any,
        status: data.status as any,
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return updated;
  }

  async deleteUnit(propertyId: string, unitId: string) {
    const unit = await prisma.propertyUnit.findFirst({
      where: { id: unitId, propertyId },
    });

    if (!unit) {
      throw ApiError.notFound('Property Unit');
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        unitId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      },
    });

    if (activeBookings > 0) {
      throw ApiError.badRequest(
        'Cannot delete unit with active bookings',
        'UNIT_HAS_ACTIVE_BOOKINGS',
      );
    }

    await prisma.propertyUnit.delete({
      where: { id: unitId },
    });

    return { message: 'Unit deleted successfully' };
  }
}

export const unitsService = new UnitsService();
