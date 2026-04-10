import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface PropertyFilters {
  search?: string;
  status?: string;
  propertyType?: string;
  ownerId?: string;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PropertiesService {
  async getAllProperties(filters: PropertyFilters, userOwnerId?: string) {
    const {
      search,
      status,
      propertyType,
      ownerId,
      city,
      country,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
    };

    // RLS: if user is OWNER, restrict to their properties
    if (userOwnerId) {
      where.ownerId = userOwnerId;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { internalCode: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as any;
    }

    if (propertyType) {
      where.propertyType = propertyType as any;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (country) {
      where.country = country;
    }

    const allowedSortFields: Record<string, string> = {
      name: 'name',
      createdAt: 'createdAt',
      baseNightlyRate: 'baseNightlyRate',
      city: 'city',
      status: 'status',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          images: {
            where: { isCover: true },
            take: 1,
          },
          _count: {
            select: {
              units: true,
              bookings: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return { properties, total, page, limit };
  }

  async getPropertyById(id: string, userOwnerId?: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        units: {
          orderBy: { unitNumber: 'asc' },
        },
        customFieldValues: {
          include: { definition: true },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            maintenanceRequests: true,
            documents: true,
          },
        },
      },
    });

    if (!property || property.deletedAt) {
      throw ApiError.notFound('Property');
    }

    // RLS: owner can only view their own properties
    if (userOwnerId && property.ownerId !== userOwnerId) {
      throw ApiError.forbidden('You do not have access to this property');
    }

    return property;
  }

  async createProperty(data: {
    ownerId: string;
    managerId?: string;
    internalCode: string;
    name: string;
    slug: string;
    description?: any;
    propertyType: string;
    status?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateRegion: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    areaSqm?: number;
    floor?: number;
    amenities?: any;
    houseRules?: any;
    checkInTime?: string;
    checkOutTime?: string;
    minStayNights?: number;
    baseNightlyRate: number;
    currency?: string;
    cleaningFee?: number;
    managementFeePercent?: number;
    minimumMonthlyFee?: number;
    purchasePrice?: number;
    purchaseDate?: string;
    wifiName?: string;
    wifiPassword?: string;
    parkingInstructions?: any;
    emergencyContacts?: any;
    metadata?: any;
  }) {
    // Verify owner exists
    const owner = await prisma.owner.findUnique({ where: { id: data.ownerId } });
    if (!owner) {
      throw ApiError.badRequest('Owner not found', 'OWNER_NOT_FOUND');
    }

    // Check unique constraints
    const existingCode = await prisma.property.findUnique({
      where: { internalCode: data.internalCode },
    });
    if (existingCode) {
      throw ApiError.conflict('Internal code already exists', 'DUPLICATE_CODE');
    }

    const existingSlug = await prisma.property.findUnique({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      throw ApiError.conflict('Slug already exists', 'DUPLICATE_SLUG');
    }

    const property = await prisma.property.create({
      data: {
        ownerId: data.ownerId,
        managerId: data.managerId,
        internalCode: data.internalCode,
        name: data.name,
        slug: data.slug,
        description: data.description,
        propertyType: data.propertyType as any,
        status: (data.status as any) || 'ONBOARDING',
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        stateRegion: data.stateRegion,
        postalCode: data.postalCode,
        country: data.country || 'GR',
        latitude: data.latitude,
        longitude: data.longitude,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests,
        areaSqm: data.areaSqm,
        floor: data.floor,
        amenities: data.amenities,
        houseRules: data.houseRules,
        checkInTime: data.checkInTime || '15:00',
        checkOutTime: data.checkOutTime || '11:00',
        minStayNights: data.minStayNights || 1,
        baseNightlyRate: data.baseNightlyRate,
        currency: data.currency || 'EUR',
        cleaningFee: data.cleaningFee || 0,
        managementFeePercent: data.managementFeePercent ?? owner.defaultManagementFeePercent.toNumber(),
        minimumMonthlyFee: data.minimumMonthlyFee ?? owner.defaultMinimumMonthlyFee.toNumber(),
        purchasePrice: data.purchasePrice,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        wifiName: data.wifiName,
        wifiPassword: data.wifiPassword,
        parkingInstructions: data.parkingInstructions,
        emergencyContacts: data.emergencyContacts,
        metadata: data.metadata,
      },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return property;
  }

  async updateProperty(
    id: string,
    data: Partial<{
      ownerId: string;
      managerId: string | null;
      name: string;
      slug: string;
      description: any;
      propertyType: string;
      status: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      stateRegion: string;
      postalCode: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
      bedrooms: number;
      bathrooms: number;
      maxGuests: number;
      areaSqm: number | null;
      floor: number | null;
      amenities: any;
      houseRules: any;
      checkInTime: string;
      checkOutTime: string;
      minStayNights: number;
      baseNightlyRate: number;
      currency: string;
      cleaningFee: number;
      managementFeePercent: number;
      minimumMonthlyFee: number;
      purchasePrice: number | null;
      purchaseDate: string | null;
      wifiName: string | null;
      wifiPassword: string | null;
      parkingInstructions: any;
      emergencyContacts: any;
      metadata: any;
      publishedAt: string | null;
    }>,
  ) {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Property');
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await prisma.property.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw ApiError.conflict('Slug already exists', 'DUPLICATE_SLUG');
      }
    }

    const updateData: any = { ...data };

    // Convert date strings
    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        units: {
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    return property;
  }

  async deleteProperty(id: string) {
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Property');
    }

    // Soft delete
    await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    return { message: 'Property deleted successfully' };
  }

  async getPropertyStats(userOwnerId?: string) {
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
    };

    if (userOwnerId) {
      where.ownerId = userOwnerId;
    }

    const [byStatus, byType, total] = await Promise.all([
      prisma.property.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.property.groupBy({
        by: ['propertyType'],
        where,
        _count: { id: true },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byType: byType.map((t) => ({ type: t.propertyType, count: t._count.id })),
    };
  }
}

export const propertiesService = new PropertiesService();
