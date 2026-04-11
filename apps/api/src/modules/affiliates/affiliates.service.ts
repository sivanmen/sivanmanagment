import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface AffiliateFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AffiliatesService {
  async getAffiliateProfile(userId: string) {
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        referrals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!affiliate) {
      throw ApiError.notFound('Affiliate profile');
    }

    return affiliate;
  }

  async getAllAffiliates(filters: AffiliateFilters) {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.AffiliateProfileWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const allowedSortFields: Record<string, string> = {
      createdAt: 'createdAt',
      totalReferrals: 'totalReferrals',
      totalEarnings: 'totalEarnings',
      status: 'status',
    };

    const orderByField = allowedSortFields[sortBy] || 'createdAt';

    const [affiliates, total] = await Promise.all([
      prisma.affiliateProfile.findMany({
        where,
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
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliateProfile.count({ where }),
    ]);

    return { affiliates, total, page, limit };
  }

  async createAffiliate(data: {
    userId: string;
    affiliateCode: string;
    commissionPercent?: number;
    commissionType?: string;
    payoutMethod?: string;
    payoutDetails?: any;
    minPayoutThreshold?: number;
    websiteUrl?: string;
    notes?: string;
    metadata?: any;
  }) {
    // Check if user already has an affiliate profile
    const existing = await prisma.affiliateProfile.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      throw ApiError.conflict('User already has an affiliate profile', 'AFFILIATE_EXISTS');
    }

    // Check if affiliate code is unique
    const existingCode = await prisma.affiliateProfile.findUnique({
      where: { affiliateCode: data.affiliateCode },
    });

    if (existingCode) {
      throw ApiError.conflict('Affiliate code already in use', 'CODE_EXISTS');
    }

    const affiliate = await prisma.affiliateProfile.create({
      data: {
        userId: data.userId,
        affiliateCode: data.affiliateCode,
        commissionPercent: data.commissionPercent ?? 10,
        commissionType: (data.commissionType as any) ?? 'PERCENTAGE_OF_FIRST_YEAR',
        status: 'AFFILIATE_PENDING',
        payoutMethod: (data.payoutMethod as any) ?? 'BANK_TRANSFER',
        payoutDetails: data.payoutDetails,
        minPayoutThreshold: data.minPayoutThreshold ?? 50,
        websiteUrl: data.websiteUrl,
        notes: data.notes,
        metadata: data.metadata,
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
      },
    });

    return affiliate;
  }

  async updateAffiliate(
    id: string,
    data: Partial<{
      commissionPercent: number;
      commissionType: string;
      status: string;
      payoutMethod: string;
      payoutDetails: any;
      minPayoutThreshold: number;
      websiteUrl: string | null;
      notes: string | null;
      metadata: any;
    }>,
  ) {
    const existing = await prisma.affiliateProfile.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Affiliate profile');
    }

    const updateData: any = {};

    if (data.commissionPercent !== undefined) updateData.commissionPercent = data.commissionPercent;
    if (data.commissionType !== undefined) updateData.commissionType = data.commissionType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.payoutMethod !== undefined) updateData.payoutMethod = data.payoutMethod;
    if (data.payoutDetails !== undefined) updateData.payoutDetails = data.payoutDetails;
    if (data.minPayoutThreshold !== undefined) updateData.minPayoutThreshold = data.minPayoutThreshold;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const affiliate = await prisma.affiliateProfile.update({
      where: { id },
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
      },
    });

    return affiliate;
  }

  async getReferrals(
    affiliateId: string,
    filters: {
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, type, page = 1, limit = 20 } = filters;

    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw ApiError.notFound('Affiliate profile');
    }

    const where: Prisma.AffiliateReferralWhereInput = {
      affiliateId,
    };

    if (status) where.status = status as any;
    if (type) where.referralType = type as any;

    const [referrals, total] = await Promise.all([
      prisma.affiliateReferral.findMany({
        where,
        include: {
          referredOwner: {
            select: {
              id: true,
              companyName: true,
            },
          },
          referredBooking: {
            select: {
              id: true,
              guestName: true,
              totalAmount: true,
              checkIn: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliateReferral.count({ where }),
    ]);

    return { referrals, total, page, limit };
  }

  async getAffiliateStats(affiliateId: string) {
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw ApiError.notFound('Affiliate profile');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReferrals,
      qualifiedReferrals,
      paidReferrals,
      pendingReferrals,
      monthlyReferrals,
      totalEarnings,
      pendingEarnings,
    ] = await Promise.all([
      prisma.affiliateReferral.count({ where: { affiliateId } }),
      prisma.affiliateReferral.count({
        where: { affiliateId, status: 'QUALIFIED' },
      }),
      prisma.affiliateReferral.count({
        where: { affiliateId, status: 'REFERRAL_PAID' },
      }),
      prisma.affiliateReferral.count({
        where: { affiliateId, status: 'REFERRAL_PENDING' },
      }),
      prisma.affiliateReferral.count({
        where: {
          affiliateId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.affiliateReferral.aggregate({
        where: { affiliateId, status: 'REFERRAL_PAID' },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateReferral.aggregate({
        where: { affiliateId, status: { in: ['REFERRAL_PENDING', 'QUALIFIED'] } },
        _sum: { commissionAmount: true },
      }),
    ]);

    return {
      affiliateId,
      affiliateCode: affiliate.affiliateCode,
      totalReferrals,
      qualifiedReferrals,
      paidReferrals,
      pendingReferrals,
      monthlyReferrals,
      totalEarnings: Number(totalEarnings._sum.commissionAmount ?? 0),
      pendingEarnings: Number(pendingEarnings._sum.commissionAmount ?? 0),
      conversionRate:
        totalReferrals > 0
          ? Math.round((qualifiedReferrals / totalReferrals) * 10000) / 100
          : 0,
    };
  }

  async trackReferral(data: {
    affiliateCode: string;
    referralType: string;
    referredOwnerId?: string;
    referredBookingId?: string;
  }) {
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { affiliateCode: data.affiliateCode },
    });

    if (!affiliate) {
      throw ApiError.notFound('Affiliate');
    }

    if (affiliate.status !== 'AFFILIATE_ACTIVE') {
      throw ApiError.badRequest('Affiliate is not active', 'AFFILIATE_INACTIVE');
    }

    // Calculate commission based on type
    let commissionAmount: number | undefined;

    if (data.referredBookingId && affiliate.commissionType === 'PERCENTAGE_OF_BOOKING') {
      const booking = await prisma.booking.findUnique({
        where: { id: data.referredBookingId },
      });
      if (booking) {
        commissionAmount =
          Number(booking.totalAmount) * (Number(affiliate.commissionPercent) / 100);
      }
    } else if (affiliate.commissionType === 'FLAT_PER_BOOKING') {
      commissionAmount = Number(affiliate.commissionPercent);
    }

    const referral = await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        referralType: data.referralType as any,
        referredOwnerId: data.referredOwnerId,
        referredBookingId: data.referredBookingId,
        commissionAmount,
        status: 'REFERRAL_PENDING',
      },
    });

    // Update affiliate stats
    await prisma.affiliateProfile.update({
      where: { id: affiliate.id },
      data: {
        totalReferrals: { increment: 1 },
      },
    });

    return referral;
  }
}

export const affiliatesService = new AffiliatesService();
