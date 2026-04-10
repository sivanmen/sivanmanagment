import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { unitsService } from './units.service';
import { sendSuccess } from '../../utils/response';

const createUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  unitType: z.enum(['STUDIO', 'ONE_BED', 'TWO_BED', 'PENTHOUSE', 'OTHER']),
  floor: z.number().int().optional(),
  areaSqm: z.number().positive().optional(),
  baseNightlyRate: z.number().positive(),
  maxGuests: z.number().int().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ONBOARDING', 'MAINTENANCE', 'ARCHIVED']).optional(),
  metadata: z.any().optional(),
});

const updateUnitSchema = createUnitSchema.partial();

export class UnitsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const units = await unitsService.getAllUnits(req.params.propertyId as string, userOwnerId);
      sendSuccess(res, units);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const unit = await unitsService.getUnitById(
        req.params.propertyId as string,
        req.params.unitId as string,
        userOwnerId,
      );
      sendSuccess(res, unit);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUnitSchema.parse(req.body);
      const unit = await unitsService.createUnit(req.params.propertyId as string, data);
      sendSuccess(res, unit, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUnitSchema.parse(req.body);
      const unit = await unitsService.updateUnit(req.params.propertyId as string, req.params.unitId as string, data);
      sendSuccess(res, unit);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitsService.deleteUnit(req.params.propertyId as string, req.params.unitId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const unitsController = new UnitsController();
