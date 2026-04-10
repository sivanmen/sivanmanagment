import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { propertiesService } from './properties.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createPropertySchema = z.object({
  ownerId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  internalCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.any().optional(),
  propertyType: z.enum(['VILLA', 'APARTMENT', 'STUDIO', 'HOUSE', 'BUILDING']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ONBOARDING', 'MAINTENANCE', 'ARCHIVED']).optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  stateRegion: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  maxGuests: z.number().int().min(1),
  areaSqm: z.number().positive().optional(),
  floor: z.number().int().optional(),
  amenities: z.any().optional(),
  houseRules: z.any().optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  minStayNights: z.number().int().min(1).optional(),
  baseNightlyRate: z.number().positive(),
  currency: z.string().length(3).optional(),
  cleaningFee: z.number().min(0).optional(),
  managementFeePercent: z.number().min(0).max(100).optional(),
  minimumMonthlyFee: z.number().min(0).optional(),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  parkingInstructions: z.any().optional(),
  emergencyContacts: z.any().optional(),
  metadata: z.any().optional(),
});

const updatePropertySchema = createPropertySchema.partial().omit({ internalCode: true });

const querySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ONBOARDING', 'MAINTENANCE', 'ARCHIVED']).optional(),
  propertyType: z.enum(['VILLA', 'APARTMENT', 'STUDIO', 'HOUSE', 'BUILDING']).optional(),
  ownerId: z.string().uuid().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'baseNightlyRate', 'city', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class PropertiesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const { properties, total, page, limit } = await propertiesService.getAllProperties(
        filters,
        userOwnerId,
      );

      sendPaginated(res, properties, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userOwnerId = req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR'
        ? req.user!.ownerId
        : undefined;

      const property = await propertiesService.getPropertyById(req.params.id as string, userOwnerId);
      sendSuccess(res, property);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPropertySchema.parse(req.body);
      const property = await propertiesService.createProperty(data);
      sendSuccess(res, property, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updatePropertySchema.parse(req.body);
      const property = await propertiesService.updateProperty(req.params.id as string, data);
      sendSuccess(res, property);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertiesService.deleteProperty(req.params.id as string);
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

      const stats = await propertiesService.getPropertyStats(userOwnerId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const propertiesController = new PropertiesController();
