import { ApiError } from '../../utils/api-error';

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  source: 'AIRBNB' | 'BOOKING_COM' | 'VRBO' | 'GOOGLE' | 'DIRECT' | 'TRIPADVISOR';
  rating: number;
  categoryRatings?: {
    cleanliness?: number;
    communication?: number;
    checkIn?: number;
    accuracy?: number;
    location?: number;
    value?: number;
  };
  title?: string;
  content: string;
  language: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  status: 'PENDING_RESPONSE' | 'RESPONDED' | 'FLAGGED' | 'ARCHIVED';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const reviews: Review[] = [
  {
    id: 'rev-001',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    bookingId: 'book-040',
    guestName: 'Hans Mueller',
    guestEmail: 'hans.m@email.de',
    source: 'AIRBNB',
    rating: 5,
    categoryRatings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 4 },
    title: 'Perfekter Urlaub in Kreta!',
    content: 'Wunderschone Villa mit atemberaubendem Meerblick. Alles war sauber und gut organisiert. Die Kommunikation mit dem Team war hervorragend. Wir kommen definitiv wieder!',
    language: 'de',
    response: 'Thank you, Hans! We are so happy you enjoyed your stay at Villa Elounda. We look forward to welcoming you back to Crete!',
    respondedAt: '2026-04-02T10:00:00Z',
    respondedBy: 'u-001',
    status: 'RESPONDED',
    sentiment: 'POSITIVE',
    publishedAt: '2026-04-01T08:00:00Z',
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'rev-002',
    propertyId: 'prop-002',
    propertyName: 'Chania Old Town Apt',
    bookingId: 'book-042',
    guestName: 'Sophie Laurent',
    guestEmail: 'sophie.l@email.fr',
    source: 'BOOKING_COM',
    rating: 4,
    categoryRatings: { cleanliness: 4, communication: 5, checkIn: 4, accuracy: 4, location: 5, value: 4 },
    title: 'Charmant appartement',
    content: 'Tres bel appartement dans la vieille ville de Chania. Emplacement parfait pour explorer la ville. Le seul bemol: la climatisation etait un peu bruyante la nuit.',
    language: 'fr',
    status: 'PENDING_RESPONSE',
    sentiment: 'POSITIVE',
    publishedAt: '2026-04-05T12:00:00Z',
    createdAt: '2026-04-05T12:00:00Z',
    updatedAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'rev-003',
    propertyId: 'prop-003',
    propertyName: 'Rethymno Beach House',
    bookingId: 'book-044',
    guestName: 'James Wilson',
    guestEmail: 'j.wilson@email.com',
    source: 'AIRBNB',
    rating: 3,
    categoryRatings: { cleanliness: 3, communication: 4, checkIn: 3, accuracy: 3, location: 4, value: 3 },
    title: 'Decent but needs improvements',
    content: 'The location is great but the house needs some maintenance work. The pool filter was not working properly and there was a minor leak in the bathroom. The team fixed the pool issue quickly once reported.',
    language: 'en',
    status: 'FLAGGED',
    sentiment: 'NEUTRAL',
    publishedAt: '2026-04-08T15:00:00Z',
    createdAt: '2026-04-08T15:00:00Z',
    updatedAt: '2026-04-08T15:00:00Z',
  },
  {
    id: 'rev-004',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    guestName: 'Maria Ivanova',
    guestEmail: 'maria.i@email.ru',
    source: 'GOOGLE',
    rating: 5,
    title: 'Zamechatelnoye mesto!',
    content: 'Prekrasnaya villa s vidom na more. Vse bylo idealno - chistota, komfort, obsluzhivanie. Osobenno ponravilsya bassein i terassa dlya zavtraka. Rekomenduyu vsem!',
    language: 'ru',
    response: 'Spasibo, Maria! We appreciate your wonderful review. Hope to see you again in Crete!',
    respondedAt: '2026-03-20T09:00:00Z',
    respondedBy: 'u-002',
    status: 'RESPONDED',
    sentiment: 'POSITIVE',
    publishedAt: '2026-03-18T10:00:00Z',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-20T09:00:00Z',
  },
  {
    id: 'rev-005',
    propertyId: 'prop-002',
    propertyName: 'Chania Old Town Apt',
    bookingId: 'book-038',
    guestName: 'Erik Johansson',
    source: 'VRBO',
    rating: 2,
    categoryRatings: { cleanliness: 2, communication: 3, checkIn: 2, accuracy: 2, location: 4, value: 2 },
    title: 'Not as expected',
    content: 'The apartment looked much better in the photos. The furniture was worn and the bathroom needed renovation. Also had trouble with the check-in process as the lockbox code did not work at first.',
    language: 'en',
    status: 'FLAGGED',
    sentiment: 'NEGATIVE',
    publishedAt: '2026-03-25T16:00:00Z',
    createdAt: '2026-03-25T16:00:00Z',
    updatedAt: '2026-03-25T16:00:00Z',
  },
];

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

    let filtered = [...reviews];

    if (propertyId) filtered = filtered.filter((r) => r.propertyId === propertyId);
    if (source) filtered = filtered.filter((r) => r.source === source);
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (sentiment) filtered = filtered.filter((r) => r.sentiment === sentiment);
    if (ratingMin !== undefined) filtered = filtered.filter((r) => r.rating >= ratingMin);
    if (ratingMax !== undefined) filtered = filtered.filter((r) => r.rating <= ratingMax);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.guestName.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          (r.title && r.title.toLowerCase().includes(q)) ||
          r.propertyName.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { reviews: items, total, page, limit };
  }

  async getReviewById(id: string) {
    const review = reviews.find((r) => r.id === id);
    if (!review) throw ApiError.notFound('Review');
    return review;
  }

  async respondToReview(id: string, data: { response: string }, respondedBy: string) {
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) throw ApiError.notFound('Review');

    reviews[idx].response = data.response;
    reviews[idx].respondedAt = new Date().toISOString();
    reviews[idx].respondedBy = respondedBy;
    reviews[idx].status = 'RESPONDED';
    reviews[idx].updatedAt = new Date().toISOString();

    return reviews[idx];
  }

  async updateReviewStatus(id: string, data: { status: string }) {
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) throw ApiError.notFound('Review');

    reviews[idx].status = data.status as Review['status'];
    reviews[idx].updatedAt = new Date().toISOString();

    return reviews[idx];
  }

  async getStats(filters: { propertyId?: string }) {
    let filtered = [...reviews];
    if (filters.propertyId) filtered = filtered.filter((r) => r.propertyId === filters.propertyId);

    const total = filtered.length;
    const avgRating = total > 0 ? filtered.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    const byRating = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: filtered.filter((r) => r.rating === rating).length,
    }));

    const bySentiment = {
      positive: filtered.filter((r) => r.sentiment === 'POSITIVE').length,
      neutral: filtered.filter((r) => r.sentiment === 'NEUTRAL').length,
      negative: filtered.filter((r) => r.sentiment === 'NEGATIVE').length,
    };

    const bySource = filtered.reduce(
      (acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = {
      pendingResponse: filtered.filter((r) => r.status === 'PENDING_RESPONSE').length,
      responded: filtered.filter((r) => r.status === 'RESPONDED').length,
      flagged: filtered.filter((r) => r.status === 'FLAGGED').length,
      archived: filtered.filter((r) => r.status === 'ARCHIVED').length,
    };

    // Average category ratings
    const categoryKeys = ['cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value'] as const;
    const avgCategories: Record<string, number> = {};
    for (const cat of categoryKeys) {
      const withCategory = filtered.filter((r) => r.categoryRatings?.[cat] !== undefined);
      if (withCategory.length > 0) {
        avgCategories[cat] = Math.round(
          (withCategory.reduce((sum, r) => sum + (r.categoryRatings![cat] || 0), 0) / withCategory.length) * 10,
        ) / 10;
      }
    }

    return {
      totalReviews: total,
      averageRating: Math.round(avgRating * 10) / 10,
      byRating,
      bySentiment,
      bySource,
      byStatus,
      averageCategoryRatings: avgCategories,
    };
  }

  async generateResponseSuggestion(id: string) {
    const review = reviews.find((r) => r.id === id);
    if (!review) throw ApiError.notFound('Review');

    let suggestion: string;
    if (review.sentiment === 'POSITIVE') {
      suggestion = `Dear ${review.guestName}, thank you so much for your wonderful review! We are thrilled that you enjoyed your stay at ${review.propertyName}. Your kind words about our property mean a lot to us. We hope to welcome you back to Crete soon!`;
    } else if (review.sentiment === 'NEGATIVE') {
      suggestion = `Dear ${review.guestName}, thank you for taking the time to share your feedback. We sincerely apologize for the issues you experienced during your stay at ${review.propertyName}. We take all concerns seriously and have already addressed the points you raised. We would love the opportunity to provide you with a better experience on your next visit.`;
    } else {
      suggestion = `Dear ${review.guestName}, thank you for your review of ${review.propertyName}. We appreciate your balanced feedback and are glad you enjoyed certain aspects of your stay. We are continuously working to improve our properties and will take your suggestions into account. We hope to see you again in Crete!`;
    }

    return { reviewId: id, suggestion };
  }
}

export const reviewsService = new ReviewsService();
