import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { tasksService } from './tasks.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createTaskSchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  maintenanceId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['CLEANING', 'INSPECTION', 'CHECK_IN', 'CHECK_OUT', 'TASK_MAINTENANCE', 'LAUNDRY', 'SUPPLY_RESTOCK', 'CUSTOM']),
  priority: z.enum(['TASK_LOW', 'TASK_MEDIUM', 'TASK_HIGH', 'TASK_URGENT']).optional(),
  status: z.enum(['TASK_PENDING', 'ASSIGNED', 'TASK_IN_PROGRESS', 'TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED']).optional(),
  dueDate: z.string().optional(),
  estimatedDurationMin: z.number().int().min(0).optional(),
  checklist: z.any().optional(),
  notes: z.string().optional(),
  assignments: z.array(z.object({
    userId: z.string().uuid(),
    role: z.enum(['ASSIGNEE', 'REVIEWER']).optional(),
  })).optional(),
});

const updateTaskSchema = z.object({
  propertyId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  maintenanceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['CLEANING', 'INSPECTION', 'CHECK_IN', 'CHECK_OUT', 'TASK_MAINTENANCE', 'LAUNDRY', 'SUPPLY_RESTOCK', 'CUSTOM']).optional(),
  priority: z.enum(['TASK_LOW', 'TASK_MEDIUM', 'TASK_HIGH', 'TASK_URGENT']).optional(),
  status: z.enum(['TASK_PENDING', 'ASSIGNED', 'TASK_IN_PROGRESS', 'TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED']).optional(),
  dueDate: z.string().nullable().optional(),
  estimatedDurationMin: z.number().int().min(0).nullable().optional(),
  actualDurationMin: z.number().int().min(0).nullable().optional(),
  checklist: z.any().optional(),
  notes: z.string().nullable().optional(),
});

const assignTaskSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ASSIGNEE', 'REVIEWER']).optional(),
});

const updateAssignmentSchema = z.object({
  status: z.enum(['ASSIGN_PENDING', 'ACCEPTED', 'DECLINED']),
  notes: z.string().optional(),
});

const completeTaskSchema = z.object({
  actualDurationMin: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  propertyId: z.string().uuid().optional(),
  status: z.enum(['TASK_PENDING', 'ASSIGNED', 'TASK_IN_PROGRESS', 'TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED']).optional(),
  type: z.enum(['CLEANING', 'INSPECTION', 'CHECK_IN', 'CHECK_OUT', 'TASK_MAINTENANCE', 'LAUNDRY', 'SUPPLY_RESTOCK', 'CUSTOM']).optional(),
  priority: z.enum(['TASK_LOW', 'TASK_MEDIUM', 'TASK_HIGH', 'TASK_URGENT']).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  bookingId: z.string().uuid().optional(),
  maintenanceId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  propertyId: z.string().uuid().optional(),
});

export class TasksController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { tasks, total, page, limit } = await tasksService.getAllTasks(
        filters,
        userOwnerId,
      );

      sendPaginated(res, tasks, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const task = await tasksService.getTaskById(req.params.id as string, userOwnerId);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTaskSchema.parse(req.body);
      const task = await tasksService.createTask(data, req.user!.userId);
      sendSuccess(res, task, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTaskSchema.parse(req.body);
      const task = await tasksService.updateTask(req.params.id as string, data);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const data = assignTaskSchema.parse(req.body);
      const assignment = await tasksService.assignTask(req.params.id as string, data);
      sendSuccess(res, assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAssignmentSchema.parse(req.body);
      const assignment = await tasksService.updateAssignment(req.params.id as string, data);
      sendSuccess(res, assignment);
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = completeTaskSchema.parse(req.body);
      const task = await tasksService.completeTask(req.params.id as string, data);
      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.deleteTask(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const stats = await tasksService.getTaskStats(userOwnerId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = upcomingQuerySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const tasks = await tasksService.getUpcomingTasks(filters, userOwnerId);
      sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController();
