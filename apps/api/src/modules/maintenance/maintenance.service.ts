import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface MaintenanceFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  propertyId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MaintenanceService {
  async getAllRequests(filters: MaintenanceFilters, userOwnerId?: string) {
    const {
      search,
      status,
      priority,
      category,
      propertyId,
      assignedToId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.MaintenanceRequestWhereInput = {};

    // RLS: if user is OWNER, restrict to their properties
    if (userOwnerId) {
      where.property = { ownerId: userOwnerId };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status as any;
    }

    if (priority) {
      where.priority = priority as any;
    }

    if (category) {
      where.category = category as any;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      priority: 'priority',
      status: 'status',
      title: 'title',
      scheduledDate: 'scheduledDate',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
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
          reportedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return { requests, total, page, limit };
  }

  async getRequestById(id: string, userOwnerId?: string) {
    const request = await prisma.maintenanceRequest.findUnique({
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
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
        expense: true,
      },
    });

    if (!request) {
      throw ApiError.notFound('Maintenance request');
    }

    // RLS: owner can only view requests for their own properties
    if (userOwnerId) {
      const requestProperty = request.property as typeof request.property & { ownerId: string };
      if (requestProperty.ownerId !== userOwnerId) {
        throw ApiError.forbidden('You do not have access to this maintenance request');
      }
    }

    return request;
  }

  async createRequest(data: {
    propertyId: string;
    unitId?: string;
    reportedById: string;
    title: string;
    description: string;
    priority: string;
    category: string;
    estimatedCost?: number;
    images?: any;
    scheduledDate?: string;
    metadata?: any;
  }) {
    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property || property.deletedAt) {
      throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
    }

    // Verify unit exists if provided
    if (data.unitId) {
      const unit = await prisma.propertyUnit.findUnique({
        where: { id: data.unitId },
      });
      if (!unit) {
        throw ApiError.badRequest('Unit not found', 'UNIT_NOT_FOUND');
      }
      if (unit.propertyId !== data.propertyId) {
        throw ApiError.badRequest('Unit does not belong to the specified property', 'UNIT_MISMATCH');
      }
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId,
        reportedById: data.reportedById,
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        category: data.category as any,
        estimatedCost: data.estimatedCost !== undefined ? new Prisma.Decimal(data.estimatedCost) : undefined,
        images: data.images,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
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
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return request;
  }

  async updateRequest(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: string;
      status: string;
      category: string;
      estimatedCost: number | null;
      actualCost: number | null;
      images: any;
      scheduledDate: string | null;
      completionNotes: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Maintenance request');
    }

    const updateData: any = { ...data };

    // Handle Decimal fields
    if (data.estimatedCost !== undefined) {
      updateData.estimatedCost = data.estimatedCost !== null
        ? new Prisma.Decimal(data.estimatedCost)
        : null;
    }
    if (data.actualCost !== undefined) {
      updateData.actualCost = data.actualCost !== null
        ? new Prisma.Decimal(data.actualCost)
        : null;
    }

    // Handle scheduledDate
    if (data.scheduledDate !== undefined) {
      updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    }

    // Handle status transitions
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const request = await prisma.maintenanceRequest.update({
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
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
      },
    });

    return request;
  }

  async assignRequest(id: string, assignedToId: string) {
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Maintenance request');
    }

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw ApiError.badRequest(
        'Cannot assign a completed or cancelled request',
        'INVALID_STATUS',
      );
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!assignee) {
      throw ApiError.badRequest('Assignee user not found', 'ASSIGNEE_NOT_FOUND');
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        assignedToId,
        status: existing.status === 'OPEN' ? 'ASSIGNED' : existing.status,
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
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
      },
    });

    return request;
  }

  async completeRequest(
    id: string,
    data: {
      completionNotes?: string;
      actualCost?: number;
      createExpense?: boolean;
    },
  ) {
    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!existing) {
      throw ApiError.notFound('Maintenance request');
    }

    if (existing.status === 'COMPLETED') {
      throw ApiError.badRequest('Request is already completed', 'ALREADY_COMPLETED');
    }

    if (existing.status === 'CANCELLED') {
      throw ApiError.badRequest('Cannot complete a cancelled request', 'INVALID_STATUS');
    }

    const updateData: any = {
      status: 'COMPLETED',
      completedAt: new Date(),
    };

    if (data.completionNotes !== undefined) {
      updateData.completionNotes = data.completionNotes;
    }

    if (data.actualCost !== undefined) {
      updateData.actualCost = new Prisma.Decimal(data.actualCost);
    }

    // Optionally create an expense record
    if (data.createExpense && data.actualCost !== undefined && data.actualCost > 0) {
      const now = new Date();
      const expense = await prisma.expenseRecord.create({
        data: {
          propertyId: existing.propertyId,
          ownerId: (existing.property as any).ownerId || undefined,
          category: 'MAINTENANCE',
          amount: new Prisma.Decimal(data.actualCost),
          currency: 'EUR',
          description: `Maintenance: ${existing.title}`,
          date: now,
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      });
      updateData.expenseId = expense.id;
    }

    const request = await prisma.maintenanceRequest.update({
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
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
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
        expense: true,
      },
    });

    return request;
  }

  async deleteRequest(id: string) {
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Maintenance request');
    }

    await prisma.maintenanceRequest.delete({ where: { id } });

    return { message: 'Maintenance request deleted successfully' };
  }

  async getMaintenanceStats(userOwnerId?: string) {
    const propertyWhere: Prisma.MaintenanceRequestWhereInput = {};
    if (userOwnerId) {
      propertyWhere.property = { ownerId: userOwnerId };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      byStatus,
      byPriority,
      byCategory,
      monthlyCount,
      totalEstimatedCost,
      totalActualCost,
      overdue,
    ] = await Promise.all([
      // Count by status
      prisma.maintenanceRequest.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { id: true },
      }),
      // Count by priority
      prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where: propertyWhere,
        _count: { id: true },
      }),
      // Count by category
      prisma.maintenanceRequest.groupBy({
        by: ['category'],
        where: propertyWhere,
        _count: { id: true },
      }),
      // Monthly requests
      prisma.maintenanceRequest.count({
        where: {
          ...propertyWhere,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // Total estimated cost (open/in-progress)
      prisma.maintenanceRequest.aggregate({
        where: {
          ...propertyWhere,
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
        _sum: { estimatedCost: true },
      }),
      // Total actual cost (completed this month)
      prisma.maintenanceRequest.aggregate({
        where: {
          ...propertyWhere,
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { actualCost: true },
      }),
      // Overdue (scheduled date passed, not completed/cancelled)
      prisma.maintenanceRequest.count({
        where: {
          ...propertyWhere,
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS'] },
          scheduledDate: { lt: now },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      monthlyRequests: monthlyCount,
      pendingEstimatedCost: totalEstimatedCost._sum.estimatedCost ?? 0,
      monthlyActualCost: totalActualCost._sum.actualCost ?? 0,
      overdueCount: overdue,
    };
  }
}

export const maintenanceService = new MaintenanceService();
