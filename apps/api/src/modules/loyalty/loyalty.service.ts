import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class LoyaltyService {
  async getLoyaltyProfile(userId: string) {
    const member = await prisma.loyaltyMember.findUnique({
      where: { userId },
      include: {
        tier: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        redemptions: {
          include: { benefit: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!member) {
      throw ApiError.notFound('Loyalty member');
    }

    return member;
  }

  async getTransactions(
    userId: string,
    filters: {
      type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { type, page = 1, limit = 20 } = filters;

    const member = await prisma.loyaltyMember.findUnique({
      where: { userId },
    });

    if (!member) {
      throw ApiError.notFound('Loyalty member');
    }

    const where: Prisma.LoyaltyTransactionWhereInput = {
      memberId: member.id,
    };

    if (type) {
      where.type = type as any;
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({ where }),
    ]);

    return { transactions, total, page, limit };
  }

  async earnPoints(data: {
    userId: string;
    points: number;
    description: string;
    bookingId?: string;
  }) {
    const member = await prisma.loyaltyMember.findUnique({
      where: { userId: data.userId },
      include: { tier: true },
    });

    if (!member) {
      throw ApiError.notFound('Loyalty member');
    }

    // Apply tier multiplier
    const multiplier = Number(member.tier.multiplier);
    const earnedPoints = Math.floor(data.points * multiplier);
    const newBalance = member.currentPoints + earnedPoints;
    const newTotal = member.totalPointsEarned + earnedPoints;

    const [transaction] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          memberId: member.id,
          type: 'EARN',
          points: earnedPoints,
          balanceAfter: newBalance,
          description: data.description,
          bookingId: data.bookingId,
          expiresAt: new Date(Date.now() + member.pointsExpiryDays * 24 * 60 * 60 * 1000),
        },
      }),
      prisma.loyaltyMember.update({
        where: { id: member.id },
        data: {
          currentPoints: newBalance,
          totalPointsEarned: newTotal,
        },
      }),
    ]);

    // Check tier upgrade
    await this.checkTierUpgrade(member.id, newTotal);

    return transaction;
  }

  async redeemPoints(data: {
    userId: string;
    benefitId: string;
    bookingId?: string;
  }) {
    const member = await prisma.loyaltyMember.findUnique({
      where: { userId: data.userId },
    });

    if (!member) {
      throw ApiError.notFound('Loyalty member');
    }

    const benefit = await prisma.loyaltyBenefit.findUnique({
      where: { id: data.benefitId },
    });

    if (!benefit || !benefit.isActive) {
      throw ApiError.notFound('Loyalty benefit');
    }

    // Check if member's tier qualifies for this benefit
    if (benefit.tierId !== member.tierId) {
      // Check if member's tier is higher
      const memberTier = await prisma.loyaltyTier.findUnique({
        where: { id: member.tierId },
      });
      const benefitTier = await prisma.loyaltyTier.findUnique({
        where: { id: benefit.tierId },
      });

      if (!memberTier || !benefitTier || memberTier.sortOrder < benefitTier.sortOrder) {
        throw ApiError.forbidden('Your tier does not qualify for this benefit');
      }
    }

    // Determine points cost based on benefit value or a default
    const pointsCost = Number(benefit.value ?? 0);
    if (pointsCost <= 0) {
      throw ApiError.badRequest('Invalid benefit value', 'INVALID_BENEFIT');
    }

    if (member.currentPoints < pointsCost) {
      throw ApiError.badRequest(
        `Insufficient points. You have ${member.currentPoints} but need ${pointsCost}`,
        'INSUFFICIENT_POINTS',
      );
    }

    const newBalance = member.currentPoints - pointsCost;

    const [transaction, redemption] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          memberId: member.id,
          type: 'REDEEM',
          points: -pointsCost,
          balanceAfter: newBalance,
          description: `Redeemed: ${benefit.benefitType}`,
          bookingId: data.bookingId,
        },
      }),
      prisma.loyaltyRedemption.create({
        data: {
          memberId: member.id,
          benefitId: data.benefitId,
          bookingId: data.bookingId,
          pointsUsed: pointsCost,
          status: 'REDEMPTION_PENDING',
        },
      }),
      prisma.loyaltyMember.update({
        where: { id: member.id },
        data: { currentPoints: newBalance },
      }),
    ]);

    return { transaction, redemption };
  }

  async checkTierUpgrade(memberId: string, totalPoints: number) {
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { sortOrder: 'desc' },
    });

    // Find the highest tier the member qualifies for
    const qualifiedTier = tiers.find((t) => totalPoints >= t.minPoints);

    if (!qualifiedTier) return null;

    const member = await prisma.loyaltyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) return null;

    if (member.tierId !== qualifiedTier.id) {
      await prisma.loyaltyMember.update({
        where: { id: memberId },
        data: {
          tierId: qualifiedTier.id,
          tierAchievedAt: new Date(),
        },
      });

      return qualifiedTier;
    }

    return null;
  }

  async getAllMembers(filters: {
    tierId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      tierId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'joinedAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.LoyaltyMemberWhereInput = {};

    if (tierId) where.tierId = tierId;

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const allowedSortFields: Record<string, string> = {
      joinedAt: 'joinedAt',
      currentPoints: 'currentPoints',
      totalPointsEarned: 'totalPointsEarned',
      createdAt: 'createdAt',
    };

    const orderByField = allowedSortFields[sortBy] || 'joinedAt';

    const [members, total] = await Promise.all([
      prisma.loyaltyMember.findMany({
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
          tier: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { [orderByField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyMember.count({ where }),
    ]);

    return { members, total, page, limit };
  }

  async getAvailableRewards(userId: string) {
    const member = await prisma.loyaltyMember.findUnique({
      where: { userId },
      include: { tier: true },
    });

    if (!member) {
      throw ApiError.notFound('Loyalty member');
    }

    // Get the member's tier and all lower-tier benefits
    const qualifiedTiers = await prisma.loyaltyTier.findMany({
      where: { sortOrder: { lte: member.tier.sortOrder } },
      select: { id: true },
    });

    const tierIds = qualifiedTiers.map((t) => t.id);

    const benefits = await prisma.loyaltyBenefit.findMany({
      where: {
        tierId: { in: tierIds },
        isActive: true,
      },
      include: {
        tier: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { tierId: 'asc' },
    });

    return {
      currentPoints: member.currentPoints,
      tier: member.tier,
      benefits: benefits.map((b) => ({
        ...b,
        canRedeem: member.currentPoints >= Number(b.value ?? 0),
      })),
    };
  }
}

export const loyaltyService = new LoyaltyService();
