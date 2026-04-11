import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ownerPortalService } from './owner-portal.service';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/api-error';

const updateConfigSchema = z.object({
  customDomain: z.string().optional(),
  branding: z.object({
    logoUrl: z.string().optional(),
    accentColor: z.string().optional(),
    welcomeMessage: z.string().optional(),
  }).optional(),
  visibility: z.object({
    showFinancials: z.boolean().optional(),
    showGuestContacts: z.boolean().optional(),
    showBookingDetails: z.boolean().optional(),
    showMaintenanceRequests: z.boolean().optional(),
    showDocuments: z.boolean().optional(),
    showOccupancyMetrics: z.boolean().optional(),
    showRevenueCharts: z.boolean().optional(),
    allowOwnerReservations: z.boolean().optional(),
    allowFriendsAndFamily: z.boolean().optional(),
    maxOwnerBlockDaysPerMonth: z.number().min(0).max(31).optional(),
  }).optional(),
  notifications: z.object({
    newBooking: z.boolean().optional(),
    cancellation: z.boolean().optional(),
    checkIn: z.boolean().optional(),
    checkOut: z.boolean().optional(),
    monthlyReport: z.boolean().optional(),
    maintenanceUpdate: z.boolean().optional(),
  }).optional(),
});

const createReservationSchema = z.object({
  propertyId: z.string().min(1),
  type: z.enum(['OWNER_STAY', 'FRIENDS_FAMILY']),
  guestName: z.string().optional(),
  guestRelation: z.string().optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  notes: z.string().optional(),
});

const generateStatementSchema = z.object({
  ownerId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
});

export class OwnerPortalController {
  // Portal Config
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.params.ownerId as string;

      // Owner can only view their own config
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        req.user!.ownerId !== ownerId
      ) {
        throw ApiError.forbidden('You can only view your own portal config');
      }

      const config = ownerPortalService.getPortalConfig(ownerId);
      if (!config) {
        const defaultCfg = ownerPortalService.getDefaultConfig();
        defaultCfg.ownerId = ownerId;
        return sendSuccess(res, defaultCfg);
      }
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.params.ownerId as string;
      const data = updateConfigSchema.parse(req.body);
      const config = ownerPortalService.updatePortalConfig(ownerId, data as any);
      sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  }

  // Owner Reservations
  async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      let ownerId: string | undefined;
      if (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') {
        ownerId = req.user!.ownerId;
      } else {
        ownerId = req.query.ownerId as string | undefined;
      }
      const reservations = ownerPortalService.getOwnerReservations(ownerId);
      sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  async createReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReservationSchema.parse(req.body);
      const ownerId = req.user!.ownerId || (req.body.ownerId as string);
      if (!ownerId) {
        throw ApiError.badRequest('Owner ID is required');
      }
      const reservation = ownerPortalService.createOwnerReservation(ownerId, data);
      sendSuccess(res, reservation, 201);
    } catch (error) {
      next(error);
    }
  }

  async approveReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const reservation = ownerPortalService.approveReservation(id, req.user!.userId);
      if (!reservation) {
        throw ApiError.notFound('Reservation');
      }
      sendSuccess(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  async rejectReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const reservation = ownerPortalService.rejectReservation(id, req.user!.userId);
      if (!reservation) {
        throw ApiError.notFound('Reservation');
      }
      sendSuccess(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const reservation = ownerPortalService.cancelReservation(id);
      if (!reservation) {
        throw ApiError.notFound('Reservation');
      }
      sendSuccess(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  // Statements
  async generateStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateStatementSchema.parse(req.body);
      const statement = ownerPortalService.generateStatement(data.ownerId, data.month, data.year);
      sendSuccess(res, statement, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStatements(req: Request, res: Response, next: NextFunction) {
    try {
      let ownerId: string | undefined;
      if (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') {
        ownerId = req.user!.ownerId;
      } else {
        ownerId = req.query.ownerId as string | undefined;
      }
      const statements = ownerPortalService.getStatements(ownerId);
      sendSuccess(res, statements);
    } catch (error) {
      next(error);
    }
  }

  async getStatementById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const statement = ownerPortalService.getStatementById(id);
      if (!statement) {
        throw ApiError.notFound('Statement');
      }

      // Owner can only view their own statements
      if (
        (req.user!.role === 'OWNER' || req.user!.role === 'VIP_STAR') &&
        req.user!.ownerId !== statement.ownerId
      ) {
        throw ApiError.forbidden('You can only view your own statements');
      }

      sendSuccess(res, statement);
    } catch (error) {
      next(error);
    }
  }

  async approveStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const statement = ownerPortalService.approveStatement(id);
      if (!statement) {
        throw ApiError.notFound('Statement');
      }
      sendSuccess(res, statement);
    } catch (error) {
      next(error);
    }
  }

  async sendStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const statement = ownerPortalService.sendStatement(id);
      if (!statement) {
        throw ApiError.notFound('Statement');
      }
      sendSuccess(res, statement);
    } catch (error) {
      next(error);
    }
  }

  // Export
  async exportOwnerData(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.params.ownerId as string;
      const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
      const data = ownerPortalService.exportOwnerData(ownerId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=owner-${ownerId}-export.csv`);
        return res.send(data);
      }

      sendSuccess(res, JSON.parse(data));
    } catch (error) {
      next(error);
    }
  }
}

export const ownerPortalController = new OwnerPortalController();
