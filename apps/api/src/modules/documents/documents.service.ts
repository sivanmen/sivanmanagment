import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface DocumentFilters {
  search?: string;
  category?: string;
  propertyId?: string;
  ownerId?: string;
  bookingId?: string;
  accessLevel?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class DocumentsService {
  async getAllDocuments(filters: DocumentFilters, userOwnerId?: string) {
    const {
      search,
      category,
      propertyId,
      ownerId,
      bookingId,
      accessLevel,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
    };

    // RLS: owners see only OWNER_VISIBLE + PUBLIC for their properties
    if (userOwnerId) {
      where.accessLevel = { in: ['OWNER_VISIBLE', 'PUBLIC'] };
      where.OR = [
        { property: { ownerId: userOwnerId } },
        { ownerId: userOwnerId },
      ];
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (category) {
      where.category = category as any;
    }

    if (accessLevel && !userOwnerId) {
      where.accessLevel = accessLevel as any;
    }

    if (search) {
      const searchCondition: Prisma.DocumentWhereInput[] = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        // Combine RLS OR with search OR using AND
        where.AND = [
          { OR: where.OR },
          { OR: searchCondition },
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      title: 'title',
      category: 'category',
      fileSize: 'fileSize',
      updatedAt: 'updatedAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              internalCode: true,
            },
          },
          owner: {
            select: {
              id: true,
              companyName: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return { documents, total, page, limit };
  }

  async getDocumentById(id: string, userOwnerId?: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
            ownerId: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          where: { deletedAt: null },
          select: {
            id: true,
            version: true,
            title: true,
            fileUrl: true,
            createdAt: true,
          },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!document || document.deletedAt) {
      throw ApiError.notFound('Document');
    }

    // RLS: owner can only view OWNER_VISIBLE or PUBLIC documents for their entities
    if (userOwnerId) {
      if (document.accessLevel === 'ADMIN_ONLY') {
        throw ApiError.forbidden('You do not have access to this document');
      }
      const docPropertyOwnerId = document.property?.ownerId;
      const isOwnerOfProperty = !!docPropertyOwnerId && docPropertyOwnerId === userOwnerId;
      const isDocumentOwner = document.ownerId === userOwnerId;
      if (!isOwnerOfProperty && !isDocumentOwner) {
        throw ApiError.forbidden('You do not have access to this document');
      }
    }

    return document;
  }

  async createDocument(data: {
    propertyId?: string;
    ownerId?: string;
    bookingId?: string;
    uploadedById: string;
    title: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    category: string;
    tags?: any;
    parentId?: string;
    accessLevel?: string;
    expiresAt?: string;
    metadata?: any;
  }) {
    // If parentId provided, increment version from parent
    let version = 1;
    if (data.parentId) {
      const parent = await prisma.document.findUnique({
        where: { id: data.parentId },
      });
      if (!parent || parent.deletedAt) {
        throw ApiError.badRequest('Parent document not found', 'PARENT_NOT_FOUND');
      }
      // Find max version among siblings
      const maxVersion = await prisma.document.aggregate({
        where: { parentId: data.parentId, deletedAt: null },
        _max: { version: true },
      });
      version = (maxVersion._max.version || parent.version) + 1;
    }

    // Verify property exists if provided
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (!property || property.deletedAt) {
        throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
      }
    }

    // Verify owner exists if provided
    if (data.ownerId) {
      const owner = await prisma.owner.findUnique({
        where: { id: data.ownerId },
      });
      if (!owner || owner.deletedAt) {
        throw ApiError.badRequest('Owner not found', 'OWNER_NOT_FOUND');
      }
    }

    const document = await prisma.document.create({
      data: {
        propertyId: data.propertyId,
        ownerId: data.ownerId,
        bookingId: data.bookingId,
        uploadedById: data.uploadedById,
        title: data.title,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        category: data.category as any,
        tags: data.tags,
        version,
        parentId: data.parentId,
        accessLevel: (data.accessLevel as any) || 'OWNER_VISIBLE',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        metadata: data.metadata,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  async updateDocument(
    id: string,
    data: Partial<{
      title: string;
      category: string;
      tags: any;
      accessLevel: string;
      expiresAt: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Document');
    }

    const updateData: any = { ...data };

    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  async deleteDocument(id: string) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Document');
    }

    // Soft delete
    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Document deleted successfully' };
  }

  async getDocumentsByEntity(
    entityType: 'property' | 'owner',
    entityId: string,
    userOwnerId?: string,
  ) {
    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
    };

    if (entityType === 'property') {
      where.propertyId = entityId;

      // RLS: owner can only see their own property's documents
      if (userOwnerId) {
        const property = await prisma.property.findUnique({
          where: { id: entityId },
        });
        if (!property || property.deletedAt) {
          throw ApiError.notFound('Property');
        }
        if (property.ownerId !== userOwnerId) {
          throw ApiError.forbidden('You do not have access to this property\'s documents');
        }
        where.accessLevel = { in: ['OWNER_VISIBLE', 'PUBLIC'] };
      }
    } else {
      where.ownerId = entityId;

      // RLS: owner can only see their own documents
      if (userOwnerId && entityId !== userOwnerId) {
        throw ApiError.forbidden('You do not have access to this owner\'s documents');
      }
      if (userOwnerId) {
        where.accessLevel = { in: ['OWNER_VISIBLE', 'PUBLIC'] };
      }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            internalCode: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }
}

export const documentsService = new DocumentsService();
