import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Lightbulb,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Minus,
  Trophy,
  Target,
  BarChart3,
  Bed,
  MessageCircle,
  Wrench,
  Camera,
  Clock,
  DollarSign,
  Building2,
  Zap,
  Filter,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// ── Types & Demo Data ──────────────────────────────────────────────────────

interface ScoreCategory {
  name: string;
  score: number;
  weight: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  factors: { name: string; value: number; benchmark: number; status: string }[];
}

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
  effort: 'EASY' | 'MODERATE' | 'SIGNIFICANT';
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
}

interface PropertyScore {
  id: string;
  name: string;
  score: number;
  grade: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercent: number;
  categories: ScoreCategory[];
  recommendations: Recommendation[];
  history: { month: string; score: number }[];
}

const demoScores: PropertyScore[] = [
  {
    id: 'prop1',
    name: 'Villa Elounda Royale',
    score: 92,
    grade: 'A+',
    trend: 'UP',
    trendPercent: 3.2,
    categories: [
      {
        name: 'Revenue', score: 95, weight: 25, icon: DollarSign, color: '#10b981',
        factors: [
          { name: 'ADR vs Market', value: 280, benchmark: 220, status: 'EXCELLENT' },
          { name: 'RevPAR', value: 258, benchmark: 170, status: 'EXCELLENT' },
          { name: 'Revenue Growth', value: 12, benchmark: 5, status: 'EXCELLENT' },
        ],
      },
      {
        name: 'Occupancy', score: 94, weight: 20, icon: Bed, color: '#6b38d4',
        factors: [
          { name: 'Annual Occupancy', value: 92, benchmark: 75, status: 'EXCELLENT' },
          { name: 'Off-Season Fill', value: 68, benchmark: 40, status: 'EXCELLENT' },
          { name: 'Booking Lead Time', value: 28, benchmark: 21, status: 'GOOD' },
        ],
      },
      {
        name: 'Guest Satisfaction', score: 96, weight: 20, icon: Star, color: '#f59e0b',
        factors: [
          { name: 'Average Rating', value: 4.9, benchmark: 4.5, status: 'EXCELLENT' },
          { name: 'Repeat Guest Rate', value: 35, benchmark: 15, status: 'EXCELLENT' },
          { name: 'Review Count', value: 127, benchmark: 50, status: 'EXCELLENT' },
        ],
      },
      {
        name: 'Listing Quality', score: 88, weight: 15, icon: Camera, color: '#06b6d4',
        factors: [
          { name: 'Photo Count', value: 42, benchmark: 20, status: 'EXCELLENT' },
          { name: 'Description Length', value: 850, benchmark: 500, status: 'GOOD' },
          { name: 'Amenity Coverage', value: 92, benchmark: 80, status: 'GOOD' },
        ],
      },
      {
        name: 'Response Time', score: 98, weight: 10, icon: Clock, color: '#8b5cf6',
        factors: [
          { name: 'Avg Response (min)', value: 12, benchmark: 60, status: 'EXCELLENT' },
          { name: 'Response Rate', value: 100, benchmark: 95, status: 'EXCELLENT' },
        ],
      },
      {
        name: 'Maintenance', score: 82, weight: 10, icon: Wrench, color: '#ef4444',
        factors: [
          { name: 'Open Issues', value: 1, benchmark: 3, status: 'GOOD' },
          { name: 'Avg Resolution (days)', value: 2.5, benchmark: 5, status: 'EXCELLENT' },
          { name: 'Preventive Score', value: 72, benchmark: 60, status: 'GOOD' },
        ],
      },
    ],
    recommendations: [
      { id: 'r1', category: 'Listing', title: 'Add virtual tour', description: 'Properties with virtual tours see 30% more bookings.', priority: 'HIGH', impact: '+15% bookings', effort: 'MODERATE', status: 'NEW' },
      { id: 'r2', category: 'Pricing', title: 'Increase winter rates', description: 'Your winter pricing is 18% below market for premium villas.', priority: 'MEDIUM', impact: '+€2,400/season', effort: 'EASY', status: 'IN_PROGRESS' },
      { id: 'r3', category: 'Maintenance', title: 'Schedule pool inspection', description: 'Preventive maintenance reduces emergency costs by 40%.', priority: 'LOW', impact: 'Cost savings', effort: 'EASY', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 85 }, { month: 'Nov', score: 86 }, { month: 'Dec', score: 87 },
      { month: 'Jan', score: 88 }, { month: 'Feb', score: 90 }, { month: 'Mar', score: 92 },
    ],
  },
  {
    id: 'prop2',
    name: 'Chania Harbor Suite',
    score: 84,
    grade: 'B+',
    trend: 'UP',
    trendPercent: 5.1,
    categories: [
      { name: 'Revenue', score: 82, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 88, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 90, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 75, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 92, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 78, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [
      { id: 'r4', category: 'Photos', title: 'Update listing photos', description: 'Photos are 14 months old. Fresh photos improve click-through by 25%.', priority: 'HIGH', impact: '+20% views', effort: 'MODERATE', status: 'NEW' },
      { id: 'r5', category: 'Amenities', title: 'Add workspace amenities', description: 'Digital nomad demand is growing 40% YoY in Crete.', priority: 'MEDIUM', impact: '+12% off-season', effort: 'EASY', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 76 }, { month: 'Nov', score: 78 }, { month: 'Dec', score: 79 },
      { month: 'Jan', score: 80 }, { month: 'Feb', score: 82 }, { month: 'Mar', score: 84 },
    ],
  },
  {
    id: 'prop3',
    name: 'Rethymno Beach House',
    score: 79,
    grade: 'B',
    trend: 'STABLE',
    trendPercent: 0.8,
    categories: [
      { name: 'Revenue', score: 78, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 85, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 82, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 70, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 88, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 72, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [
      { id: 'r6', category: 'Pricing', title: 'Enable dynamic pricing', description: 'Dynamic pricing can increase revenue by 15-25% with same occupancy.', priority: 'HIGH', impact: '+€8,000/year', effort: 'EASY', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 77 }, { month: 'Nov', score: 78 }, { month: 'Dec', score: 78 },
      { month: 'Jan', score: 78 }, { month: 'Feb', score: 79 }, { month: 'Mar', score: 79 },
    ],
  },
  {
    id: 'prop4',
    name: 'Heraklion City Loft',
    score: 72,
    grade: 'C+',
    trend: 'UP',
    trendPercent: 2.8,
    categories: [
      { name: 'Revenue', score: 68, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 82, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 75, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 62, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 80, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 68, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [
      { id: 'r7', category: 'Listing', title: 'Rewrite description', description: 'Your description is below average length and missing key selling points.', priority: 'HIGH', impact: '+18% conversion', effort: 'EASY', status: 'NEW' },
      { id: 'r8', category: 'Pricing', title: 'Lower minimum stay', description: 'Reducing minimum stay from 3 to 2 nights could fill 15+ more nights/year.', priority: 'MEDIUM', impact: '+€3,200/year', effort: 'EASY', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 66 }, { month: 'Nov', score: 67 }, { month: 'Dec', score: 68 },
      { month: 'Jan', score: 69 }, { month: 'Feb', score: 70 }, { month: 'Mar', score: 72 },
    ],
  },
  {
    id: 'prop5',
    name: 'Agios Nikolaos Villa',
    score: 68,
    grade: 'C',
    trend: 'DOWN',
    trendPercent: -1.4,
    categories: [
      { name: 'Revenue', score: 62, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 72, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 70, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 65, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 75, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 60, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [
      { id: 'r9', category: 'Maintenance', title: 'Address 4 open maintenance issues', description: 'Unresolved issues are impacting guest reviews and score.', priority: 'HIGH', impact: '+8 score points', effort: 'SIGNIFICANT', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 72 }, { month: 'Nov', score: 71 }, { month: 'Dec', score: 70 },
      { month: 'Jan', score: 70 }, { month: 'Feb', score: 69 }, { month: 'Mar', score: 68 },
    ],
  },
  {
    id: 'prop6',
    name: 'Plakias Seaside',
    score: 63,
    grade: 'C',
    trend: 'DOWN',
    trendPercent: -3.1,
    categories: [
      { name: 'Revenue', score: 55, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 68, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 65, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 58, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 72, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 60, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [],
    history: [
      { month: 'Oct', score: 68 }, { month: 'Nov', score: 67 }, { month: 'Dec', score: 66 },
      { month: 'Jan', score: 65 }, { month: 'Feb', score: 64 }, { month: 'Mar', score: 63 },
    ],
  },
  {
    id: 'prop7',
    name: 'Sitia Countryside',
    score: 55,
    grade: 'D',
    trend: 'UP',
    trendPercent: 4.2,
    categories: [
      { name: 'Revenue', score: 45, weight: 25, icon: DollarSign, color: '#10b981', factors: [] },
      { name: 'Occupancy', score: 58, weight: 20, icon: Bed, color: '#6b38d4', factors: [] },
      { name: 'Guest Satisfaction', score: 62, weight: 20, icon: Star, color: '#f59e0b', factors: [] },
      { name: 'Listing Quality', score: 48, weight: 15, icon: Camera, color: '#06b6d4', factors: [] },
      { name: 'Response Time', score: 65, weight: 10, icon: Clock, color: '#8b5cf6', factors: [] },
      { name: 'Maintenance', score: 52, weight: 10, icon: Wrench, color: '#ef4444', factors: [] },
    ],
    recommendations: [
      { id: 'r10', category: 'Listing', title: 'Complete listing overhaul', description: 'Full listing refresh including photos, description, and amenities could boost score by 15+ points.', priority: 'HIGH', impact: '+15 score points', effort: 'SIGNIFICANT', status: 'NEW' },
      { id: 'r11', category: 'Revenue', title: 'Launch direct booking page', description: 'Enable direct bookings to increase margins by 15-20%.', priority: 'MEDIUM', impact: '+€4,800/year', effort: 'MODERATE', status: 'NEW' },
    ],
    history: [
      { month: 'Oct', score: 48 }, { month: 'Nov', score: 49 }, { month: 'Dec', score: 50 },
      { month: 'Jan', score: 52 }, { month: 'Feb', score: 53 }, { month: 'Mar', score: 55 },
    ],
  },
];

// ── Helper Components ──────────────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-emerald-400 bg-emerald-500/15';
  if (grade.startsWith('B')) return 'text-blue-400 bg-blue-500/15';
  if (grade.startsWith('C')) return 'text-amber-400 bg-amber-500/15';
  return 'text-red-400 bg-red-500/15';
}

function scoreColor(score: number) {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#6b38d4';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function priorityBadge(priority: 'HIGH' | 'MEDIUM' | 'LOW') {
  const map = {
    HIGH: 'bg-red-500/15 text-red-400',
    MEDIUM: 'bg-amber-500/15 text-amber-400',
    LOW: 'bg-blue-500/15 text-blue-400',
  };
  return map[priority];
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    NEW: 'bg-blue-500/15 text-blue-400',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-400',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400',
    DISMISSED: 'bg-white/10 text-on-surface-variant',
  };
  return map[status] || 'bg-white/10';
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PropertyScoringPage() {
  const { t } = useTranslation();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'trend'>('score');

  const sorted = [...demoScores].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b.trendPercent - a.trendPercent;
  });

  const selectedProperty = selectedPropertyId
    ? demoScores.find((p) => p.id === selectedPropertyId)
    : null;

  const portfolioAvg = Math.round(demoScores.reduce((s, p) => s + p.score, 0) / demoScores.length);
  const bestProperty = demoScores.reduce((best, p) => (p.score > best.score ? p : best));
  const worstProperty = demoScores.reduce((worst, p) => (p.score < worst.score ? p : worst));
  const totalRecommendations = demoScores.reduce((s, p) => s + p.recommendations.filter((r) => r.status === 'NEW').length, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-secondary" />
            Property Scoring
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            AI-powered health scores with actionable recommendations
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90">
          <RefreshCw className="w-4 h-4" />
          Recalculate All
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Portfolio Score</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-headline font-bold" style={{ color: scoreColor(portfolioAvg) }}>
              {portfolioAvg}
            </span>
            <span className="text-sm text-on-surface-variant">/ 100</span>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Best Property</p>
          <p className="text-sm font-medium mt-1 truncate">{bestProperty.name}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(bestProperty.grade)}`}>
            {bestProperty.grade} — {bestProperty.score}
          </span>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Needs Attention</p>
          <p className="text-sm font-medium mt-1 truncate">{worstProperty.name}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(worstProperty.grade)}`}>
            {worstProperty.grade} — {worstProperty.score}
          </span>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Open Recommendations</p>
          <p className="text-3xl font-headline font-bold mt-1 text-amber-400">{totalRecommendations}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">All Properties</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs px-2 py-1 rounded border border-white/10 bg-surface"
            >
              <option value="score">By Score</option>
              <option value="name">By Name</option>
              <option value="trend">By Trend</option>
            </select>
          </div>

          {sorted.map((property) => (
            <button
              key={property.id}
              onClick={() => setSelectedPropertyId(property.id)}
              className={`w-full text-start p-4 rounded-xl transition-all hover:shadow-ambient-sm
                ${selectedPropertyId === property.id
                  ? 'glass-card ring-1 ring-secondary/40'
                  : 'glass-card hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium truncate flex-1 pe-2">{property.name}</h4>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(property.grade)}`}>
                  {property.grade}
                </span>
              </div>

              {/* Score Bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${property.score}%`, backgroundColor: scoreColor(property.score) }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(property.score) }}>
                  {property.score}
                </span>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">
                  {property.recommendations.filter((r) => r.status === 'NEW').length} recommendations
                </span>
                <span
                  className={`flex items-center gap-0.5 ${
                    property.trend === 'UP'
                      ? 'text-emerald-400'
                      : property.trend === 'DOWN'
                        ? 'text-red-400'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {property.trend === 'UP' && <ArrowUp className="w-3 h-3" />}
                  {property.trend === 'DOWN' && <ArrowDown className="w-3 h-3" />}
                  {property.trend === 'STABLE' && <Minus className="w-3 h-3" />}
                  {Math.abs(property.trendPercent)}%
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Property Detail */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProperty ? (
            <>
              {/* Score Header */}
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-headline font-bold">{selectedProperty.name}</h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">Last calculated: 2 hours ago</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                      style={{ borderColor: scoreColor(selectedProperty.score) }}
                    >
                      <div>
                        <span className="text-2xl font-headline font-bold" style={{ color: scoreColor(selectedProperty.score) }}>
                          {selectedProperty.score}
                        </span>
                      </div>
                    </div>
                    <span className={`mt-1 inline-block px-3 py-0.5 rounded-full text-sm font-bold ${gradeColor(selectedProperty.grade)}`}>
                      {selectedProperty.grade}
                    </span>
                  </div>
                </div>

                {/* Score History Mini Chart */}
                <div className="mt-4 flex items-end gap-1 h-12">
                  {selectedProperty.history.map((h) => (
                    <div key={h.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${(h.score / 100) * 40}px`,
                          backgroundColor: scoreColor(h.score),
                          opacity: 0.6,
                        }}
                      />
                      <span className="text-[9px] text-on-surface-variant">{h.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="text-sm font-semibold mb-4">Score Breakdown</h3>
                <div className="space-y-3">
                  {selectedProperty.categories.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.name} className="p-3 rounded-lg bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                              <CatIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-xs text-on-surface-variant">({cat.weight}% weight)</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: scoreColor(cat.score) }}>
                            {cat.score}/100
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                          />
                        </div>

                        {/* Factors */}
                        {cat.factors.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {cat.factors.map((f) => (
                              <div key={f.name} className="text-xs p-1.5 rounded bg-white/[0.03]">
                                <span className="text-on-surface-variant">{f.name}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="font-semibold">{f.value}</span>
                                  <span className="text-on-surface-variant">/ {f.benchmark} avg</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              {selectedProperty.recommendations.length > 0 && (
                <div className="glass-card p-5 rounded-xl">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Improvement Recommendations
                  </h3>
                  <div className="space-y-3">
                    {selectedProperty.recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge(rec.priority)}`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs text-on-surface-variant">{rec.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge(rec.status)}`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium">{rec.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">{rec.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-emerald-400 font-medium">{rec.impact}</span>
                          <span className="text-on-surface-variant">Effort: {rec.effort.toLowerCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center">
              <Target className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-on-surface-variant">Select a property to view its detailed score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
