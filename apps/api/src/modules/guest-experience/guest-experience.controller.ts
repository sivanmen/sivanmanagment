import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { guestExperienceService } from './guest-experience.service';
import { sendSuccess } from '../../utils/response';

// ── Validation Schemas ──────────────────────────────────────────────────────

const submitCheckInSchema = z.object({
  guestName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  arrivalTime: z.string().optional(),
  numberOfGuests: z.number().int().positive().optional(),
  idDocument: z
    .object({
      type: z.string(),
      number: z.string(),
      expiryDate: z.string().optional(),
      frontUrl: z.string().optional(),
      backUrl: z.string().optional(),
    })
    .optional(),
  specialRequests: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relation: z.string(),
    })
    .optional(),
  vehicleInfo: z
    .object({
      plateNumber: z.string(),
      model: z.string(),
    })
    .optional(),
  agreements: z
    .object({
      termsAccepted: z.boolean(),
      houseRulesAccepted: z.boolean(),
      privacyAccepted: z.boolean(),
    })
    .optional(),
});

const createGuidebookSchema = z.object({
  propertyId: z.string().min(1),
  welcomeMessage: z.object({
    en: z.string().min(1),
    he: z.string().optional(),
  }),
  sections: z
    .array(
      z.object({
        title: z.string(),
        icon: z.string(),
        content: z.string(),
        images: z.array(z.string()).optional(),
      }),
    )
    .optional()
    .default([]),
  houseRules: z.array(z.string()).optional().default([]),
  checkInInstructions: z.string().optional().default(''),
  checkOutInstructions: z.string().optional().default(''),
  wifiName: z.string().optional().default(''),
  wifiPassword: z.string().optional().default(''),
  emergencyNumbers: z
    .object({
      police: z.string(),
      ambulance: z.string(),
      fire: z.string(),
      manager: z.string(),
    })
    .optional()
    .default({ police: '', ambulance: '', fire: '', manager: '' }),
  nearbyPlaces: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum([
          'RESTAURANT',
          'BEACH',
          'SUPERMARKET',
          'PHARMACY',
          'HOSPITAL',
          'ATM',
          'GAS_STATION',
          'ATTRACTION',
        ]),
        distance: z.string(),
        description: z.string().optional(),
        mapUrl: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  transportInfo: z.string().optional().default(''),
  isPublished: z.boolean().optional().default(false),
});

const updateGuidebookSchema = createGuidebookSchema.partial().omit({
  propertyId: true,
});

const createContractSchema = z.object({
  propertyId: z.string().min(1),
  bookingId: z.string().min(1),
  guestName: z.string().min(1),
  contractType: z.enum([
    'RENTAL_AGREEMENT',
    'DAMAGE_WAIVER',
    'HOUSE_RULES',
    'CANCELLATION_POLICY',
  ]),
  templateContent: z.string().min(1),
  status: z
    .enum(['DRAFT', 'SENT', 'VIEWED', 'SIGNED'])
    .optional()
    .default('DRAFT'),
  expiresAt: z.string().optional(),
});

const signContractSchema = z.object({
  signatureData: z.string().min(1),
});

const createUpsellSchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum([
    'EARLY_CHECKIN',
    'LATE_CHECKOUT',
    'AIRPORT_TRANSFER',
    'CLEANING',
    'BREAKFAST',
    'TOUR',
    'EQUIPMENT',
    'PET_FEE',
    'BABY_PACKAGE',
    'CUSTOM',
  ]),
  price: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
  isPerNight: z.boolean().default(false),
  isPerGuest: z.boolean().default(false),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
  maxQuantity: z.number().int().positive().default(1),
  availability: z.enum(['ALWAYS', 'PRE_ARRIVAL', 'DURING_STAY']).default('ALWAYS'),
});

const updateUpsellSchema = createUpsellSchema.partial();

const orderUpsellSchema = z.object({
  bookingId: z.string().min(1),
  upsellId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ── Controller ──────────────────────────────────────────────────────────────

export class GuestExperienceController {
  // ── Check-in Forms ────────────────────────────────────────────────────

  async getCheckInForms(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        propertyId: req.query.propertyId as string | undefined,
        search: req.query.search as string | undefined,
      };
      const forms = await guestExperienceService.getCheckInForms(filters);
      sendSuccess(res, forms);
    } catch (error) {
      next(error);
    }
  }

  async getCheckInForm(req: Request, res: Response, next: NextFunction) {
    try {
      const form = await guestExperienceService.getCheckInForm(
        req.params.id as string,
      );
      sendSuccess(res, form);
    } catch (error) {
      next(error);
    }
  }

  async createCheckInForm(req: Request, res: Response, next: NextFunction) {
    try {
      const form = await guestExperienceService.createCheckInForm(
        req.params.bookingId as string,
      );
      sendSuccess(res, form, 201);
    } catch (error) {
      next(error);
    }
  }

  async submitCheckInForm(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitCheckInSchema.parse(req.body);
      const form = await guestExperienceService.submitCheckInForm(
        req.params.id as string,
        data,
      );
      sendSuccess(res, form);
    } catch (error) {
      next(error);
    }
  }

  async verifyCheckInForm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'system';
      const form = await guestExperienceService.verifyCheckInForm(
        req.params.id as string,
        userId,
      );
      sendSuccess(res, form);
    } catch (error) {
      next(error);
    }
  }

  // ── Guidebooks ────────────────────────────────────────────────────────

  async getGuidebook(req: Request, res: Response, next: NextFunction) {
    try {
      const guidebook = await guestExperienceService.getGuidebook(
        req.params.propertyId as string,
      );
      sendSuccess(res, guidebook);
    } catch (error) {
      next(error);
    }
  }

  async getAllGuidebooks(_req: Request, res: Response, next: NextFunction) {
    try {
      const guidebooks = await guestExperienceService.getAllGuidebooks();
      sendSuccess(res, guidebooks);
    } catch (error) {
      next(error);
    }
  }

  async createGuidebook(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createGuidebookSchema.parse(req.body);
      const guidebook = await guestExperienceService.createGuidebook(data);
      sendSuccess(res, guidebook, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateGuidebook(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateGuidebookSchema.parse(req.body);
      const guidebook = await guestExperienceService.updateGuidebook(
        req.params.propertyId as string,
        data,
      );
      sendSuccess(res, guidebook);
    } catch (error) {
      next(error);
    }
  }

  async publishGuidebook(req: Request, res: Response, next: NextFunction) {
    try {
      const guidebook = await guestExperienceService.publishGuidebook(
        req.params.propertyId as string,
      );
      sendSuccess(res, guidebook);
    } catch (error) {
      next(error);
    }
  }

  async getPublicGuidebook(req: Request, res: Response, next: NextFunction) {
    try {
      const guidebook = await guestExperienceService.getPublicGuidebook(
        req.params.propertyId as string,
      );
      if (!guidebook) {
        return sendSuccess(res, null);
      }
      sendSuccess(res, guidebook);
    } catch (error) {
      next(error);
    }
  }

  // ── Contracts ─────────────────────────────────────────────────────────

  async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        propertyId: req.query.propertyId as string | undefined,
        bookingId: req.query.bookingId as string | undefined,
        contractType: req.query.contractType as string | undefined,
      };
      const contracts = await guestExperienceService.getContracts(filters);
      sendSuccess(res, contracts);
    } catch (error) {
      next(error);
    }
  }

  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createContractSchema.parse(req.body);
      const contract = await guestExperienceService.createContract(data);
      sendSuccess(res, contract, 201);
    } catch (error) {
      next(error);
    }
  }

  async sendContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await guestExperienceService.sendContract(
        req.params.id as string,
      );
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  }

  async signContract(req: Request, res: Response, next: NextFunction) {
    try {
      const data = signContractSchema.parse(req.body);
      const contract = await guestExperienceService.signContract(
        req.params.id as string,
        data.signatureData,
      );
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  }

  async getContractsByBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const contracts = await guestExperienceService.getContractByBooking(
        req.params.bookingId as string,
      );
      sendSuccess(res, contracts);
    } catch (error) {
      next(error);
    }
  }

  // ── Upsells ───────────────────────────────────────────────────────────

  async getUpsells(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyId = req.query.propertyId as string | undefined;
      const upsells = await guestExperienceService.getUpsells(propertyId);
      sendSuccess(res, upsells);
    } catch (error) {
      next(error);
    }
  }

  async createUpsell(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUpsellSchema.parse(req.body);
      const upsell = await guestExperienceService.createUpsell(data);
      sendSuccess(res, upsell, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUpsell(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUpsellSchema.parse(req.body);
      const upsell = await guestExperienceService.updateUpsell(
        req.params.id as string,
        data,
      );
      sendSuccess(res, upsell);
    } catch (error) {
      next(error);
    }
  }

  async deleteUpsell(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await guestExperienceService.deleteUpsell(
        req.params.id as string,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async orderUpsell(req: Request, res: Response, next: NextFunction) {
    try {
      const data = orderUpsellSchema.parse(req.body);
      const order = await guestExperienceService.orderUpsell(
        data.bookingId,
        data.upsellId,
        data.quantity,
        data.notes,
      );
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  async getUpsellOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await guestExperienceService.getUpsellOrders(
        req.params.bookingId as string,
      );
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }
}

export const guestExperienceController = new GuestExperienceController();
