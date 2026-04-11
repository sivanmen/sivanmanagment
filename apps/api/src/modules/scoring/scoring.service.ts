import { ApiError } from '../../utils/api-error';

// ── Types ───────────────────────────────────────────────────────────────────

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
export type Trend = 'UP' | 'DOWN' | 'STABLE';
export type FactorStatus = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR';
export type FactorImpact = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationEffort = 'EASY' | 'MODERATE' | 'SIGNIFICANT';
export type RecommendationStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';

export interface ScoreFactor {
  name: string;
  value: number;
  benchmark: number;
  status: FactorStatus;
  impact: FactorImpact;
}

export interface ScoreCategory {
  name: string;
  score: number;
  weight: number;
  factors: ScoreFactor[];
}

export interface ScoreRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  estimatedImpact: string;
  effort: RecommendationEffort;
  status: RecommendationStatus;
}

export interface PropertyScore {
  propertyId: string;
  propertyName: string;
  overallScore: number;
  grade: Grade;
  lastCalculated: Date;
  trend: Trend;
  trendPercent: number;
  categories: ScoreCategory[];
  recommendations: ScoreRecommendation[];
  history: { date: string; score: number }[];
}

export interface ScoreConfig {
  weights: { [category: string]: number };
  thresholds: { grade: string; minScore: number }[];
  benchmarks: { [metric: string]: number };
}

export interface PortfolioScore {
  averageScore: number;
  bestProperty: { propertyId: string; propertyName: string; score: number };
  worstProperty: { propertyId: string; propertyName: string; score: number };
  improvementPotential: number;
  totalProperties: number;
  gradeDistribution: { grade: string; count: number }[];
}

export interface ScoreFilters {
  ownerId?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getGrade(score: number): Grade {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 63) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getFactorStatus(value: number, benchmark: number): FactorStatus {
  const ratio = value / benchmark;
  if (ratio >= 1.20) return 'EXCELLENT';
  if (ratio >= 1.05) return 'GOOD';
  if (ratio >= 0.90) return 'AVERAGE';
  if (ratio >= 0.75) return 'BELOW_AVERAGE';
  return 'POOR';
}

function generateHistory(currentScore: number, months: number, trend: Trend, seed: number): { date: string; score: number }[] {
  const history: { date: string; score: number }[] = [];
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    let score: number;
    if (i === 0) {
      score = currentScore;
    } else {
      const progressRatio = (months - i) / months;
      let baseScore: number;

      if (trend === 'UP') {
        baseScore = currentScore - (15 + seededRandom(seed + i) * 10) * (1 - progressRatio);
      } else if (trend === 'DOWN') {
        baseScore = currentScore + (10 + seededRandom(seed + i) * 8) * (1 - progressRatio);
      } else {
        baseScore = currentScore + (seededRandom(seed + i) - 0.5) * 6;
      }

      score = Math.round(Math.min(100, Math.max(0, baseScore + (seededRandom(seed + i * 7) - 0.5) * 4)));
    }

    history.push({ date: dateStr, score });
  }

  return history;
}

// ── Demo Data ───────────────────────────────────────────────────────────────

interface PropertyDemoConfig {
  propertyId: string;
  propertyName: string;
  ownerId: string;
  overallScore: number;
  trend: Trend;
  trendPercent: number;
  categoryScores: {
    revenuePerformance: number;
    guestSatisfaction: number;
    occupancy: number;
    maintenance: number;
    listingQuality: number;
    responseTime: number;
    pricingOptimization: number;
  };
}

const PROPERTY_CONFIGS: PropertyDemoConfig[] = [
  {
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Royale',
    ownerId: 'owner-001',
    overallScore: 92,
    trend: 'UP',
    trendPercent: 4.2,
    categoryScores: {
      revenuePerformance: 95,
      guestSatisfaction: 96,
      occupancy: 88,
      maintenance: 93,
      listingQuality: 94,
      responseTime: 90,
      pricingOptimization: 89,
    },
  },
  {
    propertyId: 'prop-002',
    propertyName: 'Elounda Breeze Villa',
    ownerId: 'owner-001',
    overallScore: 84,
    trend: 'UP',
    trendPercent: 6.8,
    categoryScores: {
      revenuePerformance: 85,
      guestSatisfaction: 88,
      occupancy: 82,
      maintenance: 80,
      listingQuality: 86,
      responseTime: 84,
      pricingOptimization: 83,
    },
  },
  {
    propertyId: 'prop-003',
    propertyName: 'Chania Harbor Suite',
    ownerId: 'owner-002',
    overallScore: 78,
    trend: 'STABLE',
    trendPercent: 1.2,
    categoryScores: {
      revenuePerformance: 76,
      guestSatisfaction: 82,
      occupancy: 75,
      maintenance: 78,
      listingQuality: 80,
      responseTime: 77,
      pricingOptimization: 74,
    },
  },
  {
    propertyId: 'prop-004',
    propertyName: 'Rethymno Sunset Apartment',
    ownerId: 'owner-002',
    overallScore: 71,
    trend: 'DOWN',
    trendPercent: -3.5,
    categoryScores: {
      revenuePerformance: 68,
      guestSatisfaction: 74,
      occupancy: 70,
      maintenance: 65,
      listingQuality: 75,
      responseTime: 72,
      pricingOptimization: 70,
    },
  },
  {
    propertyId: 'prop-005',
    propertyName: 'Heraklion City Loft',
    ownerId: 'owner-003',
    overallScore: 66,
    trend: 'UP',
    trendPercent: 8.1,
    categoryScores: {
      revenuePerformance: 62,
      guestSatisfaction: 70,
      occupancy: 64,
      maintenance: 68,
      listingQuality: 65,
      responseTime: 66,
      pricingOptimization: 63,
    },
  },
  {
    propertyId: 'prop-006',
    propertyName: 'Agios Nikolaos Seaside',
    ownerId: 'owner-003',
    overallScore: 87,
    trend: 'UP',
    trendPercent: 3.0,
    categoryScores: {
      revenuePerformance: 89,
      guestSatisfaction: 92,
      occupancy: 84,
      maintenance: 85,
      listingQuality: 88,
      responseTime: 86,
      pricingOptimization: 84,
    },
  },
  {
    propertyId: 'prop-007',
    propertyName: 'Sitia Mountain Retreat',
    ownerId: 'owner-004',
    overallScore: 58,
    trend: 'DOWN',
    trendPercent: -5.2,
    categoryScores: {
      revenuePerformance: 52,
      guestSatisfaction: 60,
      occupancy: 48,
      maintenance: 55,
      listingQuality: 62,
      responseTime: 58,
      pricingOptimization: 56,
    },
  },
];

const CATEGORY_WEIGHTS: { [name: string]: number } = {
  'Revenue Performance': 20,
  'Guest Satisfaction': 20,
  'Occupancy': 18,
  'Maintenance': 12,
  'Listing Quality': 12,
  'Response Time': 10,
  'Pricing Optimization': 8,
};

const BENCHMARKS: { [metric: string]: number } = {
  occupancyRate: 65,
  adr: 175,
  revPAR: 115,
  guestRating: 4.5,
  responseTimeMinutes: 30,
  reviewCount: 25,
  photoCount: 20,
  descriptionLength: 800,
  cancellationRate: 8,
  repeatGuestRate: 18,
  maintenanceResolutionDays: 3,
  listingCompleteness: 85,
  pricingFlexibility: 70,
};

function buildCategories(config: PropertyDemoConfig): ScoreCategory[] {
  const seed = config.propertyId.charCodeAt(5) * 100;

  return [
    {
      name: 'Revenue Performance',
      score: config.categoryScores.revenuePerformance,
      weight: 20,
      factors: [
        {
          name: 'Revenue vs Target',
          value: Math.round(config.categoryScores.revenuePerformance * 1.1),
          benchmark: 100,
          status: getFactorStatus(config.categoryScores.revenuePerformance, 75),
          impact: 'HIGH',
        },
        {
          name: 'ADR vs Market',
          value: Math.round(BENCHMARKS.adr * (config.categoryScores.revenuePerformance / 80)),
          benchmark: BENCHMARKS.adr,
          status: getFactorStatus(config.categoryScores.revenuePerformance, 80),
          impact: 'HIGH',
        },
        {
          name: 'RevPAR',
          value: Math.round(BENCHMARKS.revPAR * (config.categoryScores.revenuePerformance / 78)),
          benchmark: BENCHMARKS.revPAR,
          status: getFactorStatus(config.categoryScores.revenuePerformance, 78),
          impact: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Guest Satisfaction',
      score: config.categoryScores.guestSatisfaction,
      weight: 20,
      factors: [
        {
          name: 'Average Rating',
          value: Math.round((config.categoryScores.guestSatisfaction / 20) * 10) / 10,
          benchmark: BENCHMARKS.guestRating,
          status: getFactorStatus(config.categoryScores.guestSatisfaction, 82),
          impact: 'HIGH',
        },
        {
          name: 'Review Count',
          value: Math.round(BENCHMARKS.reviewCount * (config.categoryScores.guestSatisfaction / 75)),
          benchmark: BENCHMARKS.reviewCount,
          status: getFactorStatus(config.categoryScores.guestSatisfaction, 75),
          impact: 'MEDIUM',
        },
        {
          name: 'Repeat Guest Rate',
          value: Math.round(BENCHMARKS.repeatGuestRate * (config.categoryScores.guestSatisfaction / 80)),
          benchmark: BENCHMARKS.repeatGuestRate,
          status: getFactorStatus(config.categoryScores.guestSatisfaction, 80),
          impact: 'LOW',
        },
      ],
    },
    {
      name: 'Occupancy',
      score: config.categoryScores.occupancy,
      weight: 18,
      factors: [
        {
          name: 'Occupancy Rate',
          value: Math.round(BENCHMARKS.occupancyRate * (config.categoryScores.occupancy / 72)),
          benchmark: BENCHMARKS.occupancyRate,
          status: getFactorStatus(config.categoryScores.occupancy, 72),
          impact: 'HIGH',
        },
        {
          name: 'Cancellation Rate',
          value: Math.round(BENCHMARKS.cancellationRate * (100 - config.categoryScores.occupancy) / 35),
          benchmark: BENCHMARKS.cancellationRate,
          status: getFactorStatus(100 - ((100 - config.categoryScores.occupancy) / 35) * 100, 80),
          impact: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Maintenance',
      score: config.categoryScores.maintenance,
      weight: 12,
      factors: [
        {
          name: 'Resolution Time (days)',
          value: Math.round(BENCHMARKS.maintenanceResolutionDays * (100 - config.categoryScores.maintenance + 70) / 70 * 10) / 10,
          benchmark: BENCHMARKS.maintenanceResolutionDays,
          status: getFactorStatus(config.categoryScores.maintenance, 75),
          impact: 'HIGH',
        },
        {
          name: 'Preventive Maintenance Score',
          value: config.categoryScores.maintenance,
          benchmark: 75,
          status: getFactorStatus(config.categoryScores.maintenance, 75),
          impact: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Listing Quality',
      score: config.categoryScores.listingQuality,
      weight: 12,
      factors: [
        {
          name: 'Photo Count',
          value: Math.round(BENCHMARKS.photoCount * (config.categoryScores.listingQuality / 75)),
          benchmark: BENCHMARKS.photoCount,
          status: getFactorStatus(config.categoryScores.listingQuality, 75),
          impact: 'HIGH',
        },
        {
          name: 'Description Completeness',
          value: Math.round(BENCHMARKS.listingCompleteness * (config.categoryScores.listingQuality / 78)),
          benchmark: BENCHMARKS.listingCompleteness,
          status: getFactorStatus(config.categoryScores.listingQuality, 78),
          impact: 'MEDIUM',
        },
      ],
    },
    {
      name: 'Response Time',
      score: config.categoryScores.responseTime,
      weight: 10,
      factors: [
        {
          name: 'Average Response (min)',
          value: Math.round(BENCHMARKS.responseTimeMinutes * (100 - config.categoryScores.responseTime + 60) / 60),
          benchmark: BENCHMARKS.responseTimeMinutes,
          status: getFactorStatus(config.categoryScores.responseTime, 78),
          impact: 'HIGH',
        },
      ],
    },
    {
      name: 'Pricing Optimization',
      score: config.categoryScores.pricingOptimization,
      weight: 8,
      factors: [
        {
          name: 'Dynamic Pricing Adoption',
          value: config.categoryScores.pricingOptimization,
          benchmark: BENCHMARKS.pricingFlexibility,
          status: getFactorStatus(config.categoryScores.pricingOptimization, 70),
          impact: 'MEDIUM',
        },
        {
          name: 'Seasonal Rate Adjustment',
          value: Math.round(config.categoryScores.pricingOptimization * 0.95),
          benchmark: 70,
          status: getFactorStatus(config.categoryScores.pricingOptimization * 0.95, 70),
          impact: 'LOW',
        },
      ],
    },
  ];
}

function buildRecommendations(config: PropertyDemoConfig): ScoreRecommendation[] {
  const recs: ScoreRecommendation[] = [];
  const seed = config.propertyId.charCodeAt(5);

  // Generate recommendations based on weak categories
  if (config.categoryScores.revenuePerformance < 80) {
    recs.push({
      id: `rec_${config.propertyId}_rev1`,
      category: 'Revenue Performance',
      title: 'Implement dynamic pricing strategy',
      description: 'Use market-based dynamic pricing to automatically adjust rates based on demand, seasonality, and competitor pricing. Properties with dynamic pricing see 12-18% higher revenue.',
      priority: 'HIGH',
      estimatedImpact: '+15% revenue',
      effort: 'MODERATE',
      status: 'NEW',
    });
    recs.push({
      id: `rec_${config.propertyId}_rev2`,
      category: 'Revenue Performance',
      title: 'Add premium upsell packages',
      description: 'Create add-on packages for airport transfers, grocery delivery, boat tours, and private chef experiences to increase per-booking revenue.',
      priority: 'MEDIUM',
      estimatedImpact: '+€80/booking',
      effort: 'EASY',
      status: 'NEW',
    });
  }

  if (config.categoryScores.guestSatisfaction < 85) {
    recs.push({
      id: `rec_${config.propertyId}_guest1`,
      category: 'Guest Satisfaction',
      title: 'Enhance welcome experience',
      description: 'Provide a personalized welcome basket with local products and a handwritten note. Guests who receive welcome packages rate 0.3 stars higher on average.',
      priority: 'MEDIUM',
      estimatedImpact: '+0.3 rating',
      effort: 'EASY',
      status: config.overallScore > 75 ? 'IN_PROGRESS' : 'NEW',
    });
    recs.push({
      id: `rec_${config.propertyId}_guest2`,
      category: 'Guest Satisfaction',
      title: 'Send pre-arrival communication',
      description: 'Implement automated pre-arrival messages with check-in instructions, local recommendations, and a digital guidebook 48 hours before arrival.',
      priority: 'HIGH',
      estimatedImpact: '+0.2 rating',
      effort: 'EASY',
      status: 'NEW',
    });
  }

  if (config.categoryScores.occupancy < 75) {
    recs.push({
      id: `rec_${config.propertyId}_occ1`,
      category: 'Occupancy',
      title: 'Optimize minimum stay requirements',
      description: 'Reduce minimum stay to 2 nights during shoulder season (Apr-May, Oct) to capture short-break demand. This can increase bookings by 20% in low season.',
      priority: 'HIGH',
      estimatedImpact: '+12% occupancy',
      effort: 'EASY',
      status: 'NEW',
    });
    recs.push({
      id: `rec_${config.propertyId}_occ2`,
      category: 'Occupancy',
      title: 'Expand to additional channels',
      description: 'List the property on VRBO and Google Vacation Rentals to reach new audience segments not present on Airbnb and Booking.com.',
      priority: 'MEDIUM',
      estimatedImpact: '+8% occupancy',
      effort: 'MODERATE',
      status: 'NEW',
    });
  }

  if (config.categoryScores.maintenance < 75) {
    recs.push({
      id: `rec_${config.propertyId}_maint1`,
      category: 'Maintenance',
      title: 'Create preventive maintenance schedule',
      description: 'Set up quarterly preventive maintenance checks for HVAC, plumbing, and electrical systems. This reduces emergency repairs by 40% and improves guest satisfaction.',
      priority: 'HIGH',
      estimatedImpact: '-40% emergency repairs',
      effort: 'MODERATE',
      status: 'NEW',
    });
  }

  if (config.categoryScores.listingQuality < 80) {
    recs.push({
      id: `rec_${config.propertyId}_list1`,
      category: 'Listing Quality',
      title: 'Professional photography update',
      description: 'Hire a professional photographer to capture updated photos with proper lighting and staging. High-quality photos increase booking rates by 20-30%.',
      priority: 'HIGH',
      estimatedImpact: '+25% booking rate',
      effort: 'MODERATE',
      status: config.overallScore > 70 ? 'COMPLETED' : 'NEW',
    });
    recs.push({
      id: `rec_${config.propertyId}_list2`,
      category: 'Listing Quality',
      title: 'Optimize listing description with SEO keywords',
      description: 'Rewrite listing descriptions to include popular search terms like "sea view", "pool", "walking distance to beach" in all supported languages.',
      priority: 'MEDIUM',
      estimatedImpact: '+15% views',
      effort: 'EASY',
      status: 'NEW',
    });
  }

  if (config.categoryScores.responseTime < 80) {
    recs.push({
      id: `rec_${config.propertyId}_resp1`,
      category: 'Response Time',
      title: 'Set up automated inquiry responses',
      description: 'Configure auto-reply templates for common guest questions (check-in time, parking, pet policy) to maintain sub-15-minute response times.',
      priority: 'MEDIUM',
      estimatedImpact: '-60% response time',
      effort: 'EASY',
      status: 'NEW',
    });
  }

  if (config.categoryScores.pricingOptimization < 75) {
    recs.push({
      id: `rec_${config.propertyId}_price1`,
      category: 'Pricing Optimization',
      title: 'Enable last-minute discounts',
      description: 'Automatically apply 15-25% discounts for bookings made within 3 days of check-in for unbooked dates. This recovers revenue from otherwise empty nights.',
      priority: 'MEDIUM',
      estimatedImpact: '+€150/month',
      effort: 'EASY',
      status: 'NEW',
    });
  }

  // Ensure at least 5 recommendations per property
  if (recs.length < 5) {
    const extraRecs: ScoreRecommendation[] = [
      {
        id: `rec_${config.propertyId}_extra1`,
        category: 'Revenue Performance',
        title: 'Implement weekly rate adjustments',
        description: 'Review and adjust rates weekly based on booking pace and competitor analysis for the upcoming 90 days.',
        priority: 'LOW',
        estimatedImpact: '+5% revenue',
        effort: 'EASY',
        status: 'NEW',
      },
      {
        id: `rec_${config.propertyId}_extra2`,
        category: 'Guest Satisfaction',
        title: 'Request reviews proactively',
        description: 'Send a personalized review request email 24 hours after checkout with specific prompts about their favorite aspects of the stay.',
        priority: 'LOW',
        estimatedImpact: '+40% review rate',
        effort: 'EASY',
        status: 'NEW',
      },
      {
        id: `rec_${config.propertyId}_extra3`,
        category: 'Listing Quality',
        title: 'Add virtual tour',
        description: 'Create a 360-degree virtual tour of the property to help guests better visualize the space before booking.',
        priority: 'LOW',
        estimatedImpact: '+10% conversion',
        effort: 'SIGNIFICANT',
        status: 'NEW',
      },
    ];

    for (const extra of extraRecs) {
      if (recs.length >= 8) break;
      if (!recs.find((r) => r.id === extra.id)) {
        recs.push(extra);
      }
    }
  }

  return recs.slice(0, 8);
}

function buildPropertyScore(config: PropertyDemoConfig): PropertyScore {
  const seed = config.propertyId.charCodeAt(5) * 100;

  return {
    propertyId: config.propertyId,
    propertyName: config.propertyName,
    overallScore: config.overallScore,
    grade: getGrade(config.overallScore),
    lastCalculated: new Date('2026-04-10T08:00:00Z'),
    trend: config.trend,
    trendPercent: config.trendPercent,
    categories: buildCategories(config),
    recommendations: buildRecommendations(config),
    history: generateHistory(config.overallScore, 6, config.trend, seed),
  };
}

// ── Service ────────────────────────────────────────────────────────────────

export class ScoringService {
  private scores: PropertyScore[] = PROPERTY_CONFIGS.map(buildPropertyScore);

  private config: ScoreConfig = {
    weights: { ...CATEGORY_WEIGHTS },
    thresholds: [
      { grade: 'A+', minScore: 93 },
      { grade: 'A', minScore: 85 },
      { grade: 'B+', minScore: 78 },
      { grade: 'B', minScore: 70 },
      { grade: 'C+', minScore: 63 },
      { grade: 'C', minScore: 55 },
      { grade: 'D', minScore: 40 },
      { grade: 'F', minScore: 0 },
    ],
    benchmarks: { ...BENCHMARKS },
  };

  // ── Get Single Property Score ─────────────────────────────────────────

  async getPropertyScore(propertyId: string): Promise<PropertyScore> {
    const score = this.scores.find((s) => s.propertyId === propertyId);
    if (!score) {
      throw ApiError.notFound('PropertyScore');
    }
    return score;
  }

  // ── Get All Scores ────────────────────────────────────────────────────

  async getAllScores(filters: ScoreFilters): Promise<PropertyScore[]> {
    let results = [...this.scores];

    if (filters.ownerId) {
      const ownerProperties = PROPERTY_CONFIGS
        .filter((c) => c.ownerId === filters.ownerId)
        .map((c) => c.propertyId);
      results = results.filter((s) => ownerProperties.includes(s.propertyId));
    }

    if (filters.minScore !== undefined) {
      results = results.filter((s) => s.overallScore >= filters.minScore!);
    }

    if (filters.maxScore !== undefined) {
      results = results.filter((s) => s.overallScore <= filters.maxScore!);
    }

    const sortBy = filters.sortBy || 'overallScore';
    results.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal;
      }
      return String(bVal).localeCompare(String(aVal));
    });

    return results;
  }

  // ── Recalculate Score ─────────────────────────────────────────────────

  async recalculateScore(propertyId: string): Promise<PropertyScore> {
    const idx = this.scores.findIndex((s) => s.propertyId === propertyId);
    if (idx === -1) {
      throw ApiError.notFound('PropertyScore');
    }

    const existing = this.scores[idx];

    // Simulate recalculation with small random change
    const seed = Date.now();
    const change = (seededRandom(seed) - 0.45) * 4; // slight upward bias
    const newScore = Math.round(Math.min(100, Math.max(0, existing.overallScore + change)));
    const prevScore = existing.overallScore;

    // Update categories with proportional changes
    const ratio = newScore / prevScore;
    const updatedCategories = existing.categories.map((cat) => ({
      ...cat,
      score: Math.round(Math.min(100, Math.max(0, cat.score * ratio + (seededRandom(seed + cat.name.length) - 0.5) * 2))),
      factors: cat.factors.map((f) => ({
        ...f,
        value: Math.round(f.value * ratio * 10) / 10,
        status: getFactorStatus(f.value * ratio, f.benchmark),
      })),
    }));

    // Update history
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const updatedHistory = [...existing.history];
    const existingToday = updatedHistory.findIndex((h) => h.date === todayStr);
    if (existingToday >= 0) {
      updatedHistory[existingToday] = { date: todayStr, score: newScore };
    } else {
      updatedHistory.push({ date: todayStr, score: newScore });
    }

    // Determine new trend
    let newTrend: Trend = 'STABLE';
    let newTrendPercent = 0;
    if (updatedHistory.length >= 2) {
      const prev = updatedHistory[updatedHistory.length - 2].score;
      const diff = newScore - prev;
      newTrendPercent = Math.round((diff / prev) * 100 * 10) / 10;
      if (diff > 2) newTrend = 'UP';
      else if (diff < -2) newTrend = 'DOWN';
    }

    this.scores[idx] = {
      ...existing,
      overallScore: newScore,
      grade: getGrade(newScore),
      lastCalculated: now,
      trend: newTrend,
      trendPercent: newTrendPercent,
      categories: updatedCategories,
      history: updatedHistory,
    };

    return this.scores[idx];
  }

  // ── Score History ─────────────────────────────────────────────────────

  async getScoreHistory(propertyId: string, months?: number): Promise<{ date: string; score: number }[]> {
    const score = this.scores.find((s) => s.propertyId === propertyId);
    if (!score) {
      throw ApiError.notFound('PropertyScore');
    }

    if (months && months > 0) {
      return score.history.slice(-months);
    }

    return score.history;
  }

  // ── Recommendations ───────────────────────────────────────────────────

  async getRecommendations(propertyId: string): Promise<ScoreRecommendation[]> {
    const score = this.scores.find((s) => s.propertyId === propertyId);
    if (!score) {
      throw ApiError.notFound('PropertyScore');
    }

    return score.recommendations;
  }

  async updateRecommendationStatus(
    propertyId: string,
    recommendationId: string,
    status: RecommendationStatus,
  ): Promise<ScoreRecommendation> {
    const scoreIdx = this.scores.findIndex((s) => s.propertyId === propertyId);
    if (scoreIdx === -1) {
      throw ApiError.notFound('PropertyScore');
    }

    const recIdx = this.scores[scoreIdx].recommendations.findIndex((r) => r.id === recommendationId);
    if (recIdx === -1) {
      throw ApiError.notFound('Recommendation');
    }

    this.scores[scoreIdx].recommendations[recIdx].status = status;
    return this.scores[scoreIdx].recommendations[recIdx];
  }

  // ── Score Config ──────────────────────────────────────────────────────

  async getScoreConfig(): Promise<ScoreConfig> {
    return { ...this.config };
  }

  async updateScoreConfig(updates: Partial<ScoreConfig>): Promise<ScoreConfig> {
    if (updates.weights) {
      const totalWeight = Object.values(updates.weights).reduce((s, w) => s + w, 0);
      if (totalWeight !== 100) {
        throw ApiError.badRequest(
          `Category weights must sum to 100 (got ${totalWeight})`,
          'INVALID_WEIGHTS',
        );
      }
      this.config.weights = updates.weights;
    }

    if (updates.thresholds) {
      this.config.thresholds = updates.thresholds;
    }

    if (updates.benchmarks) {
      this.config.benchmarks = { ...this.config.benchmarks, ...updates.benchmarks };
    }

    return { ...this.config };
  }

  // ── Portfolio Score ───────────────────────────────────────────────────

  async getPortfolioScore(ownerId?: string): Promise<PortfolioScore> {
    let scores = [...this.scores];

    if (ownerId) {
      const ownerProperties = PROPERTY_CONFIGS
        .filter((c) => c.ownerId === ownerId)
        .map((c) => c.propertyId);
      scores = scores.filter((s) => ownerProperties.includes(s.propertyId));
    }

    if (scores.length === 0) {
      throw ApiError.notFound('Portfolio scores');
    }

    const avgScore = Math.round(scores.reduce((s, sc) => s + sc.overallScore, 0) / scores.length * 10) / 10;

    const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Improvement potential: how many points the worst property could gain to match the best
    const improvementPotential = Math.round(
      scores.reduce((s, sc) => s + (100 - sc.overallScore), 0) / scores.length,
    );

    // Grade distribution
    const gradeCount = new Map<string, number>();
    for (const sc of scores) {
      gradeCount.set(sc.grade, (gradeCount.get(sc.grade) || 0) + 1);
    }

    const gradeDistribution = Array.from(gradeCount.entries()).map(([grade, count]) => ({
      grade,
      count,
    }));

    return {
      averageScore: avgScore,
      bestProperty: {
        propertyId: best.propertyId,
        propertyName: best.propertyName,
        score: best.overallScore,
      },
      worstProperty: {
        propertyId: worst.propertyId,
        propertyName: worst.propertyName,
        score: worst.overallScore,
      },
      improvementPotential,
      totalProperties: scores.length,
      gradeDistribution,
    };
  }

  // ── Compare Scores ────────────────────────────────────────────────────

  async compareScores(propertyIds: string[]): Promise<PropertyScore[]> {
    if (!propertyIds || propertyIds.length === 0) {
      throw ApiError.badRequest('At least one property ID is required', 'MISSING_PROPERTY_IDS');
    }

    if (propertyIds.length > 10) {
      throw ApiError.badRequest('Maximum 10 properties for comparison', 'TOO_MANY_PROPERTIES');
    }

    const results: PropertyScore[] = [];

    for (const pid of propertyIds) {
      const score = this.scores.find((s) => s.propertyId === pid);
      if (!score) {
        throw ApiError.notFound(`PropertyScore for ${pid}`);
      }
      results.push(score);
    }

    results.sort((a, b) => b.overallScore - a.overallScore);
    return results;
  }
}

export const scoringService = new ScoringService();
