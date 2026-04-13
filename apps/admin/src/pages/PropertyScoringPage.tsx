import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
} from 'lucide-react';
import apiClient from '../lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────

interface ScoreCategory {
  name: string;
  score: number;
  weight: number;
  icon: string;
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

interface ScoringOverview {
  portfolioAvg: number;
  bestProperty: { name: string; grade: string; score: number };
  worstProperty: { name: string; grade: string; score: number };
  totalRecommendations: number;
}

// ── Icon map (API returns string name, we map to component) ──────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign, Bed, Star, Camera, Clock, Wrench,
};

function resolveIcon(name: string): React.ComponentType<{ className?: string }> {
  return iconMap[name] || DollarSign;
}

// ── Helper Components ──────────────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────

export default function PropertyScoringPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'trend'>('score');

  // ── API Queries ──────────────────────────────────────────────
  const { data: scores, isLoading, isError, error } = useQuery<PropertyScore[]>({
    queryKey: ['scoring'],
    queryFn: async () => {
      const res = await apiClient.get('/scoring');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: overviewData } = useQuery<ScoringOverview>({
    queryKey: ['scoring-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/scoring/overview');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['scoring'] });
    queryClient.invalidateQueries({ queryKey: ['scoring-overview'] });
  };

  const scoresList = scores ?? [];

  const sorted = [...scoresList].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b.trendPercent - a.trendPercent;
  });

  const selectedProperty = selectedPropertyId
    ? scoresList.find((p) => p.id === selectedPropertyId)
    : null;

  const portfolioAvg = overviewData?.portfolioAvg ?? (scoresList.length ? Math.round(scoresList.reduce((s, p) => s + p.score, 0) / scoresList.length) : 0);
  const bestProperty = overviewData?.bestProperty ?? (scoresList.length ? scoresList.reduce((best, p) => (p.score > best.score ? p : best)) : { name: '-', grade: '-', score: 0 });
  const worstProperty = overviewData?.worstProperty ?? (scoresList.length ? scoresList.reduce((worst, p) => (p.score < worst.score ? p : worst)) : { name: '-', grade: '-', score: 0 });
  const totalRecommendations = overviewData?.totalRecommendations ?? scoresList.reduce((s, p) => s + p.recommendations.filter((r) => r.status === 'NEW').length, 0);

  // ── Error State ──────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" />
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Failed to load scoring data
          </h2>
          <p className="text-sm text-on-surface-variant text-center max-w-md">
            {(error as any)?.message || 'An unexpected error occurred while loading property scores.'}
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-secondary" />
              Property Scoring
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
              <div className="h-3 w-20 bg-white/10 rounded mb-2" />
              <div className="h-8 w-12 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-2 w-full bg-white/10 rounded" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 glass-card p-12 rounded-xl animate-pulse">
            <div className="h-40 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

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
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90"
        >
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

          {sorted.length === 0 && (
            <div className="glass-card p-8 rounded-xl text-center">
              <p className="text-on-surface-variant">No properties found</p>
            </div>
          )}
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
                    const CatIcon = resolveIcon(cat.icon);
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
