import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingExtrasService } from './booking-extras.service';
import { sendSuccess } from '../../utils/response';

// ── Schemas ─────────────────────────────────────────────────────────────────

const quoteStatuses = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED', 'DECLINED'] as const;
const folioItemTypes = ['ACCOMMODATION', 'CLEANING', 'UPSELL', 'DAMAGE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'TAX'] as const;
const folioCategories = ['CHARGE', 'PAYMENT', 'CREDIT'] as const;
const groupStatuses = ['TENTATIVE', 'CONFIRMED', 'CANCELLED'] as const;

const createQuoteSchema = z.object({
  propertyId: z.string().min(1),
  guestName: z.string().min(1).max(255),
  guestEmail: z.string().email(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().min(1),
  personalMessage: z.string().max(2000).optional(),
  expiresAt: z.string().optional(),
});

const updateQuoteStatusSchema = z.object({
  status: z.enum(quoteStatuses),
});

const addFolioItemSchema = z.object({
  type: z.enum(folioItemTypes),
  description: z.string().min(1).max(500),
  amount: z.number(),
  date: z.string().min(1),
  category: z.enum(folioCategories),
});

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  organizer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  propertyId: z.string().min(1),
  bookingIds: z.array(z.string()).optional(),
  totalGuests: z.number().min(1),
  totalAmount: z.number().min(0),
  notes: z.string().max(2000).optional(),
});

const addBookingToGroupSchema = z.object({
  bookingId: z.string().min(1),
});

const updateGroupStatusSchema = z.object({
  status: z.enum(groupStatuses),
});

// ── Controller ──────────────────────────────────────────────────────────────

export class BookingExtrasController {
  // ── Quotes ──────────────────────────────────────────────────────────

  async getQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
      const quotes = await bookingExtrasService.getQuotes({ status, propertyId });
      sendSuccess(res, quotes);
    } catch (error) {
      next(error);
    }
  }

  async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createQuoteSchema.parse(req.body);
      const quote = await bookingExtrasService.createQuote(data);
      sendSuccess(res, quote, 201);
    } catch (error) {
      next(error);
    }
  }

  async getQuoteById(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await bookingExtrasService.getQuoteById(req.params.id as string);
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await bookingExtrasService.sendQuote(req.params.id as string);
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  async updateQuoteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateQuoteStatusSchema.parse(req.body);
      const quote = await bookingExtrasService.updateQuoteStatus(
        req.params.id as string,
        data.status,
      );
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  async convertQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const quote = await bookingExtrasService.convertQuoteToBooking(req.params.id as string);
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  // ── Folio ───────────────────────────────────────────────────────────

  async getFolio(req: Request, res: Response, next: NextFunction) {
    try {
      const folio = await bookingExtrasService.getFolio(req.params.bookingId as string);
      sendSuccess(res, folio);
    } catch (error) {
      next(error);
    }
  }

  async addFolioItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addFolioItemSchema.parse(req.body);
      const folio = await bookingExtrasService.addFolioItem(
        req.params.bookingId as string,
        data,
      );
      sendSuccess(res, folio, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeFolioItem(req: Request, res: Response, next: NextFunction) {
    try {
      const folio = await bookingExtrasService.removeFolioItem(
        req.params.bookingId as string,
        req.params.itemId as string,
      );
      sendSuccess(res, folio);
    } catch (error) {
      next(error);
    }
  }

  // ── Groups ──────────────────────────────────────────────────────────

  async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
      const groups = await bookingExtrasService.getGroupReservations({ status, propertyId });
      sendSuccess(res, groups);
    } catch (error) {
      next(error);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createGroupSchema.parse(req.body);
      const group = await bookingExtrasService.createGroupReservation(data);
      sendSuccess(res, group, 201);
    } catch (error) {
      next(error);
    }
  }

  async getGroupById(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await bookingExtrasService.getGroupById(req.params.id as string);
      sendSuccess(res, group);
    } catch (error) {
      next(error);
    }
  }

  async addBookingToGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addBookingToGroupSchema.parse(req.body);
      const group = await bookingExtrasService.addBookingToGroup(
        req.params.id as string,
        data.bookingId,
      );
      sendSuccess(res, group);
    } catch (error) {
      next(error);
    }
  }

  async updateGroupStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateGroupStatusSchema.parse(req.body);
      const group = await bookingExtrasService.updateGroupStatus(
        req.params.id as string,
        data.status,
      );
      sendSuccess(res, group);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingExtrasController = new BookingExtrasController();
