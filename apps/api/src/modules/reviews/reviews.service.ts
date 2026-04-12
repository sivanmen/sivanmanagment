import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

export class ReviewsService {
  async getAllReviews(filters: {
    propertyId?: string;
    source?: string;
    status?: string;
    sentiment?: string;
    ratingMin?: number;
    ratingMax?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      propertyId, source, status, sentiment,
      ratingMin, ratingMax, search,
      page = 1, limit = 20, sortBy = 'publishedAt', sortOrder = 'desc',
    } = filters;

    const where: Prisma.ReviewWhereInput = {};

    if (propertyId) where.propertyId = propertyId;
    if (source) where.source = source as Prisma.EnumReviewSourceFilter['equals'];
    if (status) where.status = status as Prisma.EnumReviewStatusFilter['equals'];
    if (sentiment) where.sentiment = sentiment as Prisma.EnumReviewSentimentFilter['equals'];

    if (ratingMin !== undefined || ratingMax !== undefined) {
      where.rating = {};
      if (ratingMin !== undefined) where.rating.gte = ratingMin;
      if (ratingMax !== undefined) where.rating.lte = ratingMax;
    }

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields = [
      'publishedAt', 'rating', 'createdAt', 'updatedAt', 'guestName', 'source', 'status', 'sentiment',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'publishedAt';

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { property: { select: { id: true, name: true } } },
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const mapped = reviews.map((r) => ({
      ...r,
      propertyName: r.property.name,
      property: undefined,
    }));

    return { reviews: mapped, total, page, limit };
  }

  async getReviewById(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { property: { select: { id: true, name: true } } },
    });
    if (!review) throw ApiError.notFound('Review');

    return { ...review, propertyName: review.property.name, property: undefined };
  }

  async respondToReview(id: string, data: { response: string }, respondedBy: string) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Review');

    const updated = await prisma.review.update({
      where: { id },
      data: {
        response: data.response,
        respondedAt: new Date(),
        respondedBy,
        status: 'RESPONDED',
      },
      include: { property: { select: { id: true, name: true } } },
    });

    return { ...updated, propertyName: updated.property.name, property: undefined };
  }

  async updateReviewStatus(id: string, data: { status: string }) {
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Review');

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: data.status as 'PENDING_RESPONSE' | 'RESPONDED' | 'FLAGGED' | 'ARCHIVED',
      },
      include: { property: { select: { id: true, name: true } } },
    });

    return { ...updated, propertyName: updated.property.name, property: undefined };
  }

  async getStats(filters: { propertyId?: string }) {
    const where: Prisma.ReviewWhereInput = {};
    if (filters.propertyId) where.propertyId = filters.propertyId;

    const [
      totalReviews,
      avgResult,
      ratingGroups,
      sentimentGroups,
      sourceGroups,
      statusGroups,
      reviewsWithCategories,
    ] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.groupBy({ by: ['rating'], where, _count: true }),
      prisma.review.groupBy({ by: ['sentiment'], where, _count: true }),
      prisma.review.groupBy({ by: ['source'], where, _count: true }),
      prisma.review.groupBy({ by: ['status'], where, _count: true }),
      prisma.review.findMany({ where, select: { categoryRatings: true } }),
    ]);

    const byRating = [1, 2, 3, 4, 5].map((rating) => {
      const group = ratingGroups.find((g) => g.rating === rating);
      return { rating, count: group?._count ?? 0 };
    });

    const bySentiment = {
      positive: sentimentGroups.find((g) => g.sentiment === 'POSITIVE')?._count ?? 0,
      neutral: sentimentGroups.find((g) => g.sentiment === 'NEUTRAL')?._count ?? 0,
      negative: sentimentGroups.find((g) => g.sentiment === 'NEGATIVE')?._count ?? 0,
    };

    const bySource: Record<string, number> = {};
    for (const g of sourceGroups) {
      bySource[g.source] = g._count;
    }

    const byStatus = {
      pendingResponse: statusGroups.find((g) => g.status === 'PENDING_RESPONSE')?._count ?? 0,
      responded: statusGroups.find((g) => g.status === 'RESPONDED')?._count ?? 0,
      flagged: statusGroups.find((g) => g.status === 'FLAGGED')?._count ?? 0,
      archived: statusGroups.find((g) => g.status === 'ARCHIVED')?._count ?? 0,
    };

    // Average category ratings from JSON field
    const categoryKeys = ['cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value'] as const;
    const avgCategories: Record<string, number> = {};
    for (const cat of categoryKeys) {
      const values: number[] = [];
      for (const r of reviewsWithCategories) {
        const cats = r.categoryRatings as Record<string, number> | null;
        if (cats && cats[cat] !== undefined) values.push(cats[cat]);
      }
      if (values.length > 0) {
        avgCategories[cat] = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
      }
    }

    return {
      totalReviews,
      averageRating: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
      byRating,
      bySentiment,
      bySource,
      byStatus,
      averageCategoryRatings: avgCategories,
    };
  }

  async generateResponseSuggestion(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { property: { select: { name: true } } },
    });
    if (!review) throw ApiError.notFound('Review');

    const propertyName = review.property.name;
    let suggestion: string;

    if (review.sentiment === 'POSITIVE') {
      suggestion = `Dear ${review.guestName}, thank you so much for your wonderful review! We are thrilled that you enjoyed your stay at ${propertyName}. Your kind words about our property mean a lot to us. We hope to welcome you back to Crete soon!`;
    } else if (review.sentiment === 'NEGATIVE') {
      suggestion = `Dear ${review.guestName}, thank you for taking the time to share your feedback. We sincerely apologize for the issues you experienced during your stay at ${propertyName}. We take all concerns seriously and have already addressed the points you raised. We would love the opportunity to provide you with a better experience on your next visit.`;
    } else {
      suggestion = `Dear ${review.guestName}, thank you for your review of ${propertyName}. We appreciate your balanced feedback and are glad you enjoyed certain aspects of your stay. We are continuously working to improve our properties and will take your suggestions into account. We hope to see you again in Crete!`;
    }

    return { reviewId: id, suggestion };
  }
}

export const reviewsService = new ReviewsService();
