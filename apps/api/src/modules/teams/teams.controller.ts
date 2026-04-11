import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamsService } from './teams.service';
import { sendSuccess } from '../../utils/response';

const memberRoleEnum = z.enum(['LEAD', 'MEMBER', 'VIEWER']);

const permissionSchema = z.object({
  module: z.string().min(1),
  actions: z.array(z.enum(['read', 'create', 'update', 'delete'])).min(1),
});

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  leaderId: z.string().min(1),
  members: z.array(z.object({
    userId: z.string().min(1),
    role: memberRoleEnum,
    joinedAt: z.coerce.date().optional(),
  })).optional(),
  permissions: z.array(permissionSchema).optional(),
  properties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(1000).optional(),
  leaderId: z.string().min(1).optional(),
  permissions: z.array(permissionSchema).optional(),
  properties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: memberRoleEnum,
});

const updateMemberRoleSchema = z.object({
  role: memberRoleEnum,
});

const assignPropertiesSchema = z.object({
  propertyIds: z.array(z.string().min(1)),
});

const querySchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

const checkPermissionSchema = z.object({
  module: z.string().min(1),
  action: z.enum(['read', 'create', 'update', 'delete']),
});

export class TeamsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const teams = teamsService.getAllTeams(filters);
      sendSuccess(res, teams);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const team = teamsService.getTeamById(req.params.id as string);
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTeamSchema.parse(req.body);
      const team = teamsService.createTeam(data as any);
      sendSuccess(res, team, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTeamSchema.parse(req.body);
      const team = teamsService.updateTeam(req.params.id as string, data);
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = teamsService.deleteTeam(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = addMemberSchema.parse(req.body);
      const team = teamsService.addMember(req.params.id as string, userId, role);
      sendSuccess(res, team, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const team = teamsService.removeMember(
        req.params.id as string,
        req.params.userId as string,
      );
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = updateMemberRoleSchema.parse(req.body);
      const team = teamsService.updateMemberRole(
        req.params.id as string,
        req.params.userId as string,
        role,
      );
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async assignProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyIds } = assignPropertiesSchema.parse(req.body);
      const team = teamsService.assignProperties(req.params.id as string, propertyIds);
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async getTeamsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const teams = teamsService.getTeamsByUser(req.params.userId as string);
      sendSuccess(res, teams);
    } catch (error) {
      next(error);
    }
  }

  async checkPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { module, action } = checkPermissionSchema.parse(req.query);
      const result = teamsService.checkPermission(req.params.id as string, module, action);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const teamsController = new TeamsController();
