import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { affiliatesService } from './affiliates.service';
import { sendSuccess, sendPaginated } from '../../utils/response';

const createAffiliateSchema = z.object({
  userId: z.string().uuid(),
  affiliateCode: z.string().min(3).max(50),
  commissionPercent: z.number().min(0).max(100).optional(),
  commissionType: z.enum(['PERCENTAGE_OF_BOOKING', 'FLAT_PER_BOOKING', 'PERCENTAGE_OF_FIRST_YEAR']).optional(),
  payoutMethod: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).optional(),
  payoutDetails: z.any().optional(),
  minPayoutThreshold: z.number().min(0).optional(),
  websiteUrl: z.string().url().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateAffiliateSchema = z.object({
  commissionPercent: z.number().min(0).max(100).optional(),
  commissionType: z.enum(['PERCENTAGE_OF_BOOKING', 'FLAT_PER_BOOKING', 'PERCENTAGE_OF_FIRST_YEAR']).optional(),
  status: z.enum(['AFFILIATE_ACTIVE', 'AFFILIATE_SUSPENDED', 'AFFILIATE_PENDING']).optional(),
  payoutMethod: z.enum(['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'APPLE_PAY', 'GOOGLE_PAY']).optional(),
  payoutDetails: z.any().optional(),
  minPayoutThreshold: z.number().min(0).optional(),
  websiteUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

const querySchema = z.object({
  status: z.enum(['AFFILIATE_ACTIVE', 'AFFILIATE_SUSPENDED', 'AFFILIATE_PENDING']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'totalReferrals', 'totalEarnings', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const referralsQuerySchema = z.object({
  status: z.enum(['REFERRAL_PENDING', 'QUALIFIED', 'REFERRAL_PAID', 'REFERRAL_REJECTED']).optional(),
  type: z.enum(['OWNER_SIGNUP', 'BOOKING']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const trackReferralSchema = z.object({
  affiliateCode: z.string().min(1),
  referralType: z.enum(['OWNER_SIGNUP', 'BOOKING']),
  referredOwnerId: z.string().uuid().optional(),
  referredBookingId: z.string().uuid().optional(),
});

export class AffiliatesController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await affiliatesService.getAffiliateProfile(req.user!.userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = querySchema.parse(req.query);
      const { affiliates, total, page, limit } = await affiliatesService.getAllAffiliates(filters);
      sendPaginated(res, affiliates, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAffiliateSchema.parse(req.body);
      const affiliate = await affiliatesService.createAffiliate(data);
      sendSuccess(res, affiliate, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAffiliateSchema.parse(req.body);
      const affiliate = await affiliatesService.updateAffiliate(req.params.id as string, data);
      sendSuccess(res, affiliate);
    } catch (error) {
      next(error);
    }
  }

  async getReferrals(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = referralsQuerySchema.parse(req.query);

      // If not admin, verify the affiliate belongs to the requesting user
      if (!['SUPER_ADMIN', 'PROPERTY_MANAGER'].includes(req.user!.role)) {
        const profile = await affiliatesService.getAffiliateProfile(req.user!.userId);
        if (profile.id !== (req.params.id as string)) {
          return next(new Error('Forbidden'));
        }
      }

      const { referrals, total, page, limit } = await affiliatesService.getReferrals(
        req.params.id as string,
        filters,
      );
      sendPaginated(res, referrals, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      // If not admin, verify the affiliate belongs to the requesting user
      if (!['SUPER_ADMIN', 'PROPERTY_MANAGER'].includes(req.user!.role)) {
        const profile = await affiliatesService.getAffiliateProfile(req.user!.userId);
        if (profile.id !== (req.params.id as string)) {
          return next(new Error('Forbidden'));
        }
      }

      const stats = await affiliatesService.getAffiliateStats(req.params.id as string);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async trackReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const data = trackReferralSchema.parse(req.body);
      const referral = await affiliatesService.trackReferral(data);
      sendSuccess(res, referral, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const affiliatesController = new AffiliatesController();
