import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface TaskFilters {
  search?: string;
  propertyId?: string;
  status?: string;
  type?: string;
  priority?: string;
  assignedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  bookingId?: string;
  maintenanceId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TasksService {
  async getAllTasks(filters: TaskFilters, userOwnerId?: string) {
    const {
      search,
      propertyId,
      status,
      type,
      priority,
      assignedTo,
      dueDateFrom,
      dueDateTo,
      bookingId,
      maintenanceId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.TaskWhereInput = {};

    // RLS: if user is OWNER, restrict to tasks for their properties
    if (userOwnerId) {
      where.property = { ownerId: userOwnerId };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status as any;
    }

    if (type) {
      where.type = type as any;
    }

    if (priority) {
      where.priority = priority as any;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (maintenanceId) {
      where.maintenanceId = maintenanceId;
    }

    if (assignedTo) {
      where.assignments = {
        some: { userId: assignedTo },
      };
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      dueDate: 'dueDate',
      priority: 'priority',
      status: 'status',
      title: 'title',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
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
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total, page, limit };
  }

  async getTaskById(id: string, userOwnerId?: string) {
    const task = await prisma.task.findUnique({
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
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound('Task');
    }

    // RLS: owner can only view tasks for their own properties
    if (userOwnerId && task.property) {
      const taskWithRelations = task as typeof task & {
        property: { ownerId: string };
      };
      if (taskWithRelations.property.ownerId !== userOwnerId) {
        throw ApiError.forbidden('You do not have access to this task');
      }
    }

    return task;
  }

  async createTask(
    data: {
      propertyId?: string;
      unitId?: string;
      bookingId?: string;
      maintenanceId?: string;
      title: string;
      description?: string;
      type: string;
      priority?: string;
      status?: string;
      dueDate?: string;
      estimatedDurationMin?: number;
      checklist?: any;
      notes?: string;
      assignments?: Array<{
        userId: string;
        role?: string;
      }>;
    },
    createdById: string,
  ) {
    // Verify property exists if provided
    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (!property || property.deletedAt) {
        throw ApiError.badRequest('Property not found', 'PROPERTY_NOT_FOUND');
      }
    }

    const task = await prisma.task.create({
      data: {
        propertyId: data.propertyId,
        unitId: data.unitId,
        bookingId: data.bookingId,
        maintenanceId: data.maintenanceId,
        title: data.title,
        description: data.description,
        type: data.type as any,
        priority: (data.priority as any) || 'TASK_MEDIUM',
        status: (data.status as any) || 'TASK_PENDING',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedDurationMin: data.estimatedDurationMin,
        checklist: data.checklist,
        notes: data.notes,
        createdById,
        assignments: data.assignments?.length
          ? {
              create: data.assignments.map((a) => ({
                userId: a.userId,
                role: (a.role as any) || 'ASSIGNEE',
              })),
            }
          : undefined,
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
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // If assignments were created, update task status to ASSIGNED
    if (data.assignments?.length && task.status === 'TASK_PENDING') {
      return prisma.task.update({
        where: { id: task.id },
        data: { status: 'ASSIGNED' },
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
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    }

    return task;
  }

  async updateTask(
    id: string,
    data: Partial<{
      propertyId: string | null;
      unitId: string | null;
      bookingId: string | null;
      maintenanceId: string | null;
      title: string;
      description: string | null;
      type: string;
      priority: string;
      status: string;
      dueDate: string | null;
      estimatedDurationMin: number | null;
      actualDurationMin: number | null;
      checklist: any;
      notes: string | null;
    }>,
  ) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Task');
    }

    const updateData: any = { ...data };

    // Handle date conversion
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Handle status change to completed
    if (data.status === 'TASK_COMPLETED' && existing.status !== 'TASK_COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Cast enum fields
    if (data.type) updateData.type = data.type as any;
    if (data.priority) updateData.priority = data.priority as any;
    if (data.status) updateData.status = data.status as any;

    const task = await prisma.task.update({
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
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  async assignTask(
    taskId: string,
    data: {
      userId: string;
      role?: string;
    },
  ) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw ApiError.notFound('Task');
    }

    // Check if assignment already exists
    const existing = await prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId: data.userId } },
    });

    if (existing) {
      throw ApiError.conflict('User is already assigned to this task', 'ALREADY_ASSIGNED');
    }

    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        userId: data.userId,
        role: (data.role as any) || 'ASSIGNEE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Update task status to ASSIGNED if it's still pending
    if (task.status === 'TASK_PENDING') {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'ASSIGNED' },
      });
    }

    return assignment;
  }

  async updateAssignment(
    assignmentId: string,
    data: {
      status: string;
      notes?: string;
    },
  ) {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw ApiError.notFound('TaskAssignment');
    }

    const updateData: any = {
      status: data.status as any,
      respondedAt: new Date(),
    };

    if (data.notes !== undefined) {
      // notes field doesn't exist on TaskAssignment per schema, skip
    }

    const updated = await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return updated;
  }

  async completeTask(id: string, data?: { actualDurationMin?: number; notes?: string }) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Task');
    }

    if (existing.status === 'TASK_COMPLETED') {
      throw ApiError.badRequest('Task is already completed', 'ALREADY_COMPLETED');
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'TASK_COMPLETED',
        completedAt: new Date(),
        actualDurationMin: data?.actualDurationMin,
        notes: data?.notes !== undefined ? data.notes : existing.notes,
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
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  async deleteTask(id: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Task');
    }

    await prisma.task.delete({ where: { id } });

    return { message: 'Task deleted successfully' };
  }

  async getTaskStats(userOwnerId?: string) {
    const propertyWhere: Prisma.TaskWhereInput = {};
    if (userOwnerId) {
      propertyWhere.property = { ownerId: userOwnerId };
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [byStatus, byType, byPriority, overdue, dueSoon] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: propertyWhere,
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['type'],
        where: propertyWhere,
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: propertyWhere,
        _count: { id: true },
      }),
      prisma.task.count({
        where: {
          ...propertyWhere,
          status: { notIn: ['TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          ...propertyWhere,
          status: { notIn: ['TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED'] },
          dueDate: { gte: now, lte: sevenDaysFromNow },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
      overdue,
      dueSoon,
    };
  }

  async getUpcomingTasks(filters: { days?: number; propertyId?: string }, userOwnerId?: string) {
    const days = filters.days || 7;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const where: Prisma.TaskWhereInput = {
      status: { notIn: ['TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED'] },
      dueDate: { gte: now, lte: futureDate },
    };

    if (userOwnerId) {
      where.property = { ownerId: userOwnerId };
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    const tasks = await prisma.task.findMany({
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
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    return tasks;
  }
}

export const tasksService = new TasksService();
