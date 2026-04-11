import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { propertiesService } from './properties.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import {
  uploadService,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from '../uploads/upload.service';

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

  /**
   * POST /api/v1/properties/:id/images
   * Upload images for a property using multer + R2 upload service.
   */
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.params.id as string;

      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, deletedAt: true },
      });

      if (!property || property.deletedAt) {
        throw ApiError.notFound('Property');
      }

      // Extract files from multer
      const files: Express.Multer.File[] = [];
      if (req.files && Array.isArray(req.files)) {
        files.push(...req.files);
      } else if (req.file) {
        files.push(req.file);
      }

      if (files.length === 0) {
        throw ApiError.badRequest('No image files provided', 'NO_FILES');
      }

      // Parse optional body params
      const unitId = req.body.unitId as string | undefined;
      const captionJson = req.body.caption ? JSON.parse(req.body.caption) : undefined;

      // Get current max sort order for this property
      const lastImage = await prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      let sortOrder = (lastImage?.sortOrder ?? -1) + 1;

      const results = [];

      for (const file of files) {
        // Validate type
        if (!uploadService.validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES)) {
          throw ApiError.badRequest(
            `Invalid image type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE',
          );
        }

        // Validate size
        if (file.size > MAX_IMAGE_SIZE) {
          throw ApiError.badRequest(
            `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
            'FILE_TOO_LARGE',
          );
        }

        // Upload to R2
        const key = uploadService.generateKey(`properties/${propertyId}`, file.originalname);
        const uploaded = await uploadService.uploadFile(file.buffer, key, file.mimetype);

        // Create PropertyImage record
        const image = await prisma.propertyImage.create({
          data: {
            propertyId,
            unitId: unitId || null,
            url: uploaded.url,
            caption: captionJson,
            sortOrder: sortOrder++,
            isCover: sortOrder === 1, // First image is cover by default
          },
        });

        results.push(image);
      }

      sendSuccess(res, results, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const propertiesController = new PropertiesController();
