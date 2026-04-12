import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Flag,
  Archive,
  BarChart3,
  Eye,
  Minus,
  Copy,
  Check,
  Edit3,
  Sparkles,
  Globe,
  MessageCircle,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import apiClient from '../lib/api-client';

// ── Types ───────────────────────────────────────────────────────────────────

type Platform = 'AIRBNB' | 'BOOKING_COM' | 'GOOGLE' | 'DIRECT' | 'VRBO' | 'TRIPADVISOR';
type ReviewStatus = 'PENDING_RESPONSE' | 'RESPONDED' | 'FLAGGED' | 'ARCHIVED';
type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
type ResponseTone = 'professional' | 'warm' | 'concise';

interface CategoryRatings {
  cleanliness?: number;
  communication?: number;
  checkIn?: number;
  accuracy?: number;
  location?: number;
  value?: number;
}

interface Review {
  id: string;
  propertyId: string;
  propertyName: string;
  bookingId?: string;
  guestName: string;
  guestEmail?: string;
  source: Platform;
  rating: number;
  categoryRatings?: CategoryRatings;
  title?: string;
  content: string;
  language: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsResponse {
  success: boolean;
  data: Review[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    totalReviews: number;
    averageRating: number;
    byRating: { rating: number; count: number }[];
    bySentiment: { positive: number; neutral: number; negative: number };
    bySource: Record<string, number>;
    byStatus: { pendingResponse: number; responded: number; flagged: number; archived: number };
    averageCategoryRatings: Record<string, number>;
  };
}

interface PropertyOption {
  id: string;
  name: string;
}

interface ResponseTemplate {
  id: string;
  name: string;
  scenario: string;
  content: string;
  tone: ResponseTone;
}

// ── Response Templates ─────────────────────────────────────────────────────

const responseTemplates: ResponseTemplate[] = [
  {
    id: 'tpl-001', name: 'Positive - Thank You', scenario: 'positive',
    content: 'Dear {guestName}, thank you so much for your wonderful review! We are thrilled that you enjoyed your stay at {propertyName}. Your kind words mean a lot to our team. We hope to welcome you back to Crete soon!',
    tone: 'warm',
  },
  {
    id: 'tpl-002', name: 'Positive - Professional', scenario: 'positive',
    content: 'Dear {guestName}, we appreciate you taking the time to share your experience at {propertyName}. We are pleased to know that our property and services met your expectations. We look forward to hosting you again in the future.',
    tone: 'professional',
  },
  {
    id: 'tpl-003', name: 'Negative - Apology', scenario: 'negative',
    content: 'Dear {guestName}, thank you for your honest feedback regarding your stay at {propertyName}. We sincerely apologize for the issues you experienced. We take all guest concerns seriously and have already begun addressing the points you raised. We would welcome the opportunity to make things right on a future visit.',
    tone: 'professional',
  },
  {
    id: 'tpl-004', name: 'Negative - Maintenance Issue', scenario: 'maintenance',
    content: 'Dear {guestName}, we are sorry to hear about the maintenance issues during your stay at {propertyName}. This falls below our standards and we have immediately scheduled repairs. We would like to offer you a discount on your next booking as a gesture of goodwill.',
    tone: 'professional',
  },
  {
    id: 'tpl-005', name: 'Neutral - Balanced', scenario: 'neutral',
    content: 'Dear {guestName}, thank you for sharing your balanced feedback about {propertyName}. We are glad you enjoyed certain aspects of your stay and appreciate your constructive suggestions. We are continuously working to improve our properties and your input helps us do that.',
    tone: 'professional',
  },
  {
    id: 'tpl-006', name: 'Positive - Concise', scenario: 'positive',
    content: 'Thank you for the great review, {guestName}! Glad you loved {propertyName}. See you next time!',
    tone: 'concise',
  },
  {
    id: 'tpl-007', name: 'Value Concern', scenario: 'value',
    content: 'Dear {guestName}, thank you for your feedback about {propertyName}. We understand that value for money is important and we regularly review our pricing to ensure it reflects the quality and experience we provide. We offer seasonal discounts and direct booking benefits that may interest you for future stays.',
    tone: 'professional',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const platformConfig: Record<Platform, { label: string; color: string; bg: string }> = {
  AIRBNB: { label: 'Airbnb', color: 'text-[#FF5A5F]', bg: 'bg-[#FF5A5F]/10' },
  BOOKING_COM: { label: 'Booking.com', color: 'text-[#003580]', bg: 'bg-[#003580]/10' },
  GOOGLE: { label: 'Google', color: 'text-[#4285F4]', bg: 'bg-[#4285F4]/10' },
  DIRECT: { label: 'Direct', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  VRBO: { label: 'VRBO', color: 'text-[#3B5998]', bg: 'bg-[#3B5998]/10' },
  TRIPADVISOR: { label: 'TripAdvisor', color: 'text-[#00AF87]', bg: 'bg-[#00AF87]/10' },
};

const statusConfig: Record<ReviewStatus, { label: string; badge: string }> = {
  PENDING_RESPONSE: { label: 'Needs Response', badge: 'bg-amber-500/10 text-amber-600' },
  RESPONDED: { label: 'Responded', badge: 'bg-success/10 text-success' },
  FLAGGED: { label: 'Flagged', badge: 'bg-error/10 text-error' },
  ARCHIVED: { label: 'Archived', badge: 'bg-outline-variant/20 text-on-surface-variant' },
};

const sentimentConfig: Record<Sentiment, { label: string; color: string; Icon: typeof ThumbsUp }> = {
  POSITIVE: { label: 'Positive', color: 'text-success', Icon: ThumbsUp },
  NEUTRAL: { label: 'Neutral', color: 'text-amber-500', Icon: Minus },
  NEGATIVE: { label: 'Negative', color: 'text-error', Icon: ThumbsDown },
};

const CHART_COLORS = {
  primary: '#7C5CFC',
  secondary: '#A78BFA',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  muted: '#6B7280',
};

const SENTIMENT_COLORS = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error];

const RATING_COLORS: Record<number, string> = {
  5: '#10B981',
  4: '#34D399',
  3: '#F59E0B',
  2: '#F97316',
  1: '#EF4444',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function getInitialsColor(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-outline-variant/30'}`}
        />
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = platformConfig[platform];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Globe className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  trend,
  trendLabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon: typeof Star;
  accent?: string;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <div className="glass-card rounded-xl p-5 ambient-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || 'bg-secondary/10'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-white' : 'text-secondary'}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-on-surface">{value}</span>
        {suffix && <span className="text-sm text-on-surface-variant">{suffix}</span>}
      </div>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
      {trendLabel && (
        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{trendLabel}</p>
      )}
    </div>
  );
}

// ── AI Response Modal ──────────────────────────────────────────────────────

function AiResponseModal({
  review,
  onClose,
  onSelectResponse,
}: {
  review: Review;
  onClose: () => void;
  onSelectResponse: (text: string) => void;
}) {
  const [generating, setGenerating] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generatedResponses = useMemo(() => {
    const name = review.guestName;
    const prop = review.propertyName;
    const sentiment = review.sentiment;

    const professional = sentiment === 'NEGATIVE'
      ? `Dear ${name},\n\nThank you for taking the time to share your experience at ${prop}. We sincerely apologize for the issues you encountered during your stay. Your feedback is invaluable and we have immediately taken action to address each concern you raised.\n\nWe have escalated the maintenance items to our property care team and implemented new quality checks to prevent similar issues. We would be grateful for the opportunity to demonstrate our improved standards on a future visit.\n\nPlease feel free to contact us directly to discuss any further concerns.\n\nWarm regards,\nSivan Property Management`
      : sentiment === 'NEUTRAL'
      ? `Dear ${name},\n\nThank you for your thoughtful review of ${prop}. We appreciate your balanced perspective and are glad you enjoyed several aspects of your stay.\n\nWe have noted your suggestions and are actively working on improvements, particularly in the areas you mentioned. Your constructive feedback helps us enhance the experience for all our guests.\n\nWe hope to welcome you back and exceed your expectations next time.\n\nBest regards,\nSivan Property Management`
      : `Dear ${name},\n\nThank you for your wonderful review of ${prop}! We are delighted to hear that your stay exceeded expectations.\n\nOur team takes great pride in providing exceptional hospitality, and your recognition of our efforts is truly appreciated. It was a pleasure hosting you.\n\nWe look forward to welcoming you back to Crete for another memorable experience.\n\nBest regards,\nSivan Property Management`;

    const warm = sentiment === 'NEGATIVE'
      ? `Hi ${name},\n\nFirst of all, we want to say how sorry we are about your experience at ${prop}. This is not the standard of hospitality we aim to provide, and we completely understand your frustration.\n\nWe have taken your feedback to heart and are already making changes. We would love the chance to make it up to you -- please reach out to us personally so we can discuss how to turn things around.\n\nThank you for helping us be better.\n\nWith warm regards,\nThe Sivan Team`
      : sentiment === 'NEUTRAL'
      ? `Hi ${name},\n\nThank you so much for sharing your experience at ${prop}! We are happy you enjoyed parts of your stay, and we really appreciate your honest feedback on where we can improve.\n\nWe are already looking into the points you mentioned. Your input genuinely helps us create better experiences.\n\nWe would love to have you back and show you the improvements!\n\nWarmly,\nThe Sivan Team`
      : `Hi ${name}!\n\nWow, your review made our day! We are so thrilled you loved your stay at ${prop}. It was such a pleasure having you as our guest.\n\nMoments like these remind us why we love what we do. You were wonderful guests and we genuinely hope to see you again soon!\n\nSending warm wishes from sunny Crete,\nThe Sivan Team`;

    const concise = sentiment === 'NEGATIVE'
      ? `Dear ${name}, thank you for your feedback on ${prop}. We apologize for the issues and have addressed them. We would welcome another chance to provide the experience you deserve.`
      : sentiment === 'NEUTRAL'
      ? `Thank you for your review, ${name}. We appreciate the balanced feedback on ${prop} and are working on the improvements you suggested. Hope to see you again!`
      : `Thank you for the amazing review, ${name}! So glad you loved ${prop}. We cannot wait to welcome you back!`;

    return [
      { tone: 'professional' as const, label: 'Professional', text: professional },
      { tone: 'warm' as const, label: 'Warm & Friendly', text: warm },
      { tone: 'concise' as const, label: 'Concise', text: concise },
    ];
  }, [review]);

  const [editedTexts, setEditedTexts] = useState<string[]>(generatedResponses.map((r) => r.text));

  // Simulate generation delay
  useState(() => {
    const timer = setTimeout(() => setGenerating(false), 1200);
    return () => clearTimeout(timer);
  });

  const handleCopy = (idx: number) => {
    navigator.clipboard.writeText(editedTexts[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface rounded-2xl ambient-shadow border border-outline-variant/10">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">AI Response Generator</h3>
              <p className="text-xs text-on-surface-variant">3 response styles for {review.guestName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Review context */}
        <div className="px-6 py-4 bg-surface-variant/30 border-b border-outline-variant/10">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} size="sm" />
            <PlatformBadge platform={review.source} />
            <span className={`text-xs font-medium ${sentimentConfig[review.sentiment].color}`}>
              {sentimentConfig[review.sentiment].label}
            </span>
          </div>
          <p className="text-sm text-on-surface line-clamp-2">&ldquo;{review.content}&rdquo;</p>
        </div>

        {/* Generated responses */}
        <div className="p-6 space-y-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-secondary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-secondary animate-spin" />
              </div>
              <p className="text-sm text-on-surface-variant">Generating AI responses...</p>
            </div>
          ) : (
            generatedResponses.map((resp, idx) => (
              <div
                key={resp.tone}
                className="glass-card rounded-xl border border-outline-variant/10 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-surface-variant/30 border-b border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-semibold text-on-surface">{resp.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      resp.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                      resp.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {resp.tone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      className="p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant hover:text-on-surface"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(idx)}
                      className="p-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors text-on-surface-variant hover:text-on-surface"
                      title="Copy"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {editingIdx === idx ? (
                    <textarea
                      value={editedTexts[idx]}
                      onChange={(e) => {
                        const updated = [...editedTexts];
                        updated[idx] = e.target.value;
                        setEditedTexts(updated);
                      }}
                      className="w-full min-h-[120px] bg-transparent text-sm text-on-surface resize-y outline-none"
                    />
                  ) : (
                    <p className="text-sm text-on-surface whitespace-pre-line">{editedTexts[idx]}</p>
                  )}
                </div>
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => onSelectResponse(editedTexts[idx])}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Use This Response
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Templates Panel ────────────────────────────────────────────────────────

function TemplatesPanel({
  review,
  onSelectTemplate,
  onClose,
}: {
  review: Review;
  onSelectTemplate: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface rounded-2xl ambient-shadow border border-outline-variant/10">
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">Response Templates</h3>
              <p className="text-xs text-on-surface-variant">{responseTemplates.length} templates available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-variant/50 transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {responseTemplates.map((tpl) => {
            const filled = tpl.content
              .replace(/{guestName}/g, review.guestName)
              .replace(/{propertyName}/g, review.propertyName);
            return (
              <div
                key={tpl.id}
                className="glass-card rounded-xl border border-outline-variant/10 p-4 hover:border-secondary/30 transition-colors cursor-pointer group"
                onClick={() => onSelectTemplate(filled)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-on-surface">{tpl.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    tpl.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                    tpl.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {tpl.tone}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{filled}</p>
                <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-secondary flex items-center gap-1">
                    <Check className="w-3 h-3" /> Use template
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

type ActiveTab = 'feed' | 'analytics' | 'templates';

export default function ReviewManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [filterProperty, setFilterProperty] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modals
  const [aiModalReview, setAiModalReview] = useState<Review | null>(null);
  const [templatesReview, setTemplatesReview] = useState<Review | null>(null);
  // Track which review card should receive injected text
  const [injectTarget, setInjectTarget] = useState<{ id: string; text: string } | null>(null);

  // ── API: Fetch reviews ─────────────────────────────────────────────

  const ratingMinMax = useMemo(() => {
    if (filterRating === 'all') return {};
    const [min, max] = filterRating.split('-').map(Number);
    return { ratingMin: min, ratingMax: max };
  }, [filterRating]);

  const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery<ReviewsResponse>({
    queryKey: [
      'reviews',
      {
        search: searchQuery || undefined,
        propertyId: filterProperty !== 'all' ? filterProperty : undefined,
        source: filterPlatform !== 'all' ? filterPlatform : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        ...ratingMinMax,
        page,
        limit: pageSize,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      },
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize, sortBy: 'publishedAt', sortOrder: 'desc' };
      if (searchQuery) params.search = searchQuery;
      if (filterProperty !== 'all') params.propertyId = filterProperty;
      if (filterPlatform !== 'all') params.source = filterPlatform;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (ratingMinMax.ratingMin !== undefined) params.ratingMin = ratingMinMax.ratingMin;
      if (ratingMinMax.ratingMax !== undefined) params.ratingMax = ratingMinMax.ratingMax;
      const res = await apiClient.get('/reviews', { params });
      return res.data;
    },
  });

  const reviews: Review[] = reviewsResponse?.data ?? [];
  const meta = reviewsResponse?.meta ?? { total: 0, page: 1, perPage: pageSize, totalPages: 1 };
  const totalPages = Math.max(1, meta.totalPages);

  // ── API: Fetch stats ──────────────────────────────────────────────

  const { data: statsResponse } = useQuery<StatsResponse>({
    queryKey: ['reviews-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/reviews/stats');
      return res.data;
    },
    staleTime: 30_000,
  });

  const stats = useMemo(() => {
    const s = statsResponse?.data;
    if (!s) {
      return {
        total: 0,
        avgRating: 0,
        responseRate: 0,
        responded: 0,
        byRating: [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: 0, pct: 0 })),
        byPlatform: {} as Record<string, number>,
        bySentiment: { positive: 0, neutral: 0, negative: 0 },
        averageCategoryRatings: {} as Record<string, number>,
      };
    }
    const total = s.totalReviews;
    const responded = s.byStatus.responded;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const byRating = [5, 4, 3, 2, 1].map((rating) => {
      const found = s.byRating.find((r) => r.rating === rating);
      const count = found?.count ?? 0;
      return { rating, count, pct: total > 0 ? (count / total) * 100 : 0 };
    });
    return {
      total,
      avgRating: s.averageRating,
      responseRate,
      responded,
      byRating,
      byPlatform: s.bySource,
      bySentiment: s.bySentiment,
      averageCategoryRatings: s.averageCategoryRatings,
    };
  }, [statsResponse]);

  const sentimentChartData = useMemo(() => [
    { name: 'Positive', value: stats.bySentiment.positive },
    { name: 'Neutral', value: stats.bySentiment.neutral },
    { name: 'Negative', value: stats.bySentiment.negative },
  ], [stats.bySentiment]);

  // ── API: Fetch properties for filter dropdown ─────────────────────

  const { data: propertiesData } = useQuery<{ data: PropertyOption[] }>({
    queryKey: ['properties-list-mini'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 60_000,
  });
  const properties: PropertyOption[] = (propertiesData?.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  // ── Mutations ─────────────────────────────────────────────────────

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      apiClient.post(`/reviews/${id}/respond`, { response }),
    onSuccess: () => {
      toast.success('Response sent successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
    },
    onError: () => {
      toast.error('Failed to send response');
    },
  });

  const flagMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.put(`/reviews/${id}/status`, { status: 'FLAGGED' }),
    onSuccess: () => {
      toast.success('Review flagged');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
    },
    onError: () => {
      toast.error('Failed to flag review');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.put(`/reviews/${id}/status`, { status: 'ARCHIVED' }),
    onSuccess: () => {
      toast.success('Review archived');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-stats'] });
    },
    onError: () => {
      toast.error('Failed to archive review');
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────

  const handleRespond = useCallback((id: string, text: string) => {
    respondMutation.mutate({ id, response: text });
  }, [respondMutation]);

  const handleFlag = useCallback((id: string) => {
    flagMutation.mutate(id);
  }, [flagMutation]);

  const handleArchive = useCallback((id: string) => {
    archiveMutation.mutate(id);
  }, [archiveMutation]);

  const handleAiSelect = useCallback((text: string) => {
    if (aiModalReview) {
      setInjectTarget({ id: aiModalReview.id, text });
      setAiModalReview(null);
    }
  }, [aiModalReview]);

  const handleTemplateSelect = useCallback((text: string) => {
    if (templatesReview) {
      setInjectTarget({ id: templatesReview.id, text });
      setTemplatesReview(null);
    }
  }, [templatesReview]);

  const clearFilters = () => {
    setFilterProperty('all');
    setFilterPlatform('all');
    setFilterRating('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = filterProperty !== 'all' || filterPlatform !== 'all' || filterRating !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo || searchQuery;

  const tabs: { key: ActiveTab; label: string; icon: typeof Star }[] = [
    { key: 'feed', label: 'Reviews Feed', icon: MessageSquare },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'templates', label: 'Templates', icon: FileText },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Review Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Monitor guest reviews, respond promptly, and track your reputation across platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'gradient-accent text-white'
                : 'glass-card ambient-shadow text-on-surface hover:bg-surface-variant/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white/80" />
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Reviews"
          value={stats.total}
          icon={MessageSquare}
          accent="gradient-accent"
        />
        <KpiCard
          label="Average Rating"
          value={stats.avgRating}
          suffix="/ 5"
          icon={Star}
        />
        <KpiCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={MessageCircle}
          trendLabel={`${stats.responded} responded`}
        />
        <KpiCard
          label="Positive Reviews"
          value={stats.bySentiment.positive}
          suffix={`/ ${stats.total}`}
          icon={ThumbsUp}
        />
        <div className="glass-card rounded-xl p-5 ambient-shadow col-span-2 md:col-span-4 lg:col-span-1">
          <p className="text-xs font-medium text-on-surface-variant mb-3">By Platform</p>
          <div className="space-y-2">
            {Object.entries(stats.byPlatform).map(([platform, count]) => {
              const cfg = platformConfig[platform as Platform];
              if (!cfg) return null;
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs font-bold text-on-surface">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="glass-card rounded-xl p-5 ambient-shadow">
        <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-secondary" />
          Rating Distribution
        </h3>
        <div className="space-y-2.5">
          {stats.byRating.map(({ rating, count, pct }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-20 flex-shrink-0">
                <span className="text-sm font-semibold text-on-surface w-3">{rating}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex-1 h-5 bg-surface-variant/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: RATING_COLORS[rating],
                  }}
                />
              </div>
              <span className="text-xs font-medium text-on-surface w-8 text-end">{count}</span>
              <span className="text-xs text-on-surface-variant w-10 text-end">{Math.round(pct)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-card rounded-xl p-5 ambient-shadow space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary" />
              Filter Reviews
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search reviews by guest, content, property..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Property */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Property</label>
              <select
                value={filterProperty}
                onChange={(e) => { setFilterProperty(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => { setFilterPlatform(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Platforms</option>
                {Object.entries(platformConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Rating</label>
              <select
                value={filterRating}
                onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Ratings</option>
                <option value="5-5">5 Stars</option>
                <option value="4-4">4 Stars</option>
                <option value="3-3">3 Stars</option>
                <option value="2-2">2 Stars</option>
                <option value="1-1">1 Star</option>
                <option value="4-5">4-5 Stars</option>
                <option value="1-3">1-3 Stars</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING_RESPONSE">Needs Response</option>
                <option value="RESPONDED">Responded</option>
                <option value="FLAGGED">Flagged</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface outline-none focus:border-secondary/40 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl glass-card ambient-shadow w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'gradient-accent text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {reviews.length} of {meta.total} reviews
              {meta.totalPages > 1 && ` (page ${meta.page} of ${totalPages})`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Loading state */}
          {reviewsLoading ? (
            <div className="glass-card rounded-xl p-12 ambient-shadow flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-secondary animate-spin mb-4" />
              <p className="text-sm font-medium text-on-surface-variant">Loading reviews...</p>
            </div>
          ) : (
            <>
              {/* Reviews list */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="glass-card rounded-xl p-12 ambient-shadow flex flex-col items-center justify-center">
                    <Eye className="w-12 h-12 text-on-surface-variant/30 mb-4" />
                    <p className="text-sm font-medium text-on-surface-variant">No reviews match your filters</p>
                    <button
                      onClick={clearFilters}
                      className="mt-3 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewCardWrapper
                      key={review.id}
                      review={review}
                      onRespond={handleRespond}
                      onFlag={handleFlag}
                      onArchive={handleArchive}
                      onOpenAi={setAiModalReview}
                      onOpenTemplates={setTemplatesReview}
                      injectTarget={injectTarget}
                      clearInject={() => setInjectTarget(null)}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg glass-card ambient-shadow text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          page === pageNum
                            ? 'gradient-accent text-white shadow-md'
                            : 'glass-card ambient-shadow text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg glass-card ambient-shadow text-on-surface-variant hover:text-on-surface disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Analysis */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-secondary" />
              Sentiment Analysis
            </h3>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                    paddingAngle={3}
                  >
                    {sentimentChartData.map((_, idx) => (
                      <Cell key={idx} fill={SENTIMENT_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string) => [`${value} reviews`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-secondary" />
              Reviews by Platform
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats.byPlatform).map(([source, count]) => ({
                  name: platformConfig[source as Platform]?.label ?? source,
                  count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" name="Reviews" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating Distribution Chart */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              Rating Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byRating.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `${v} star`} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value} reviews`]}
                  />
                  <Bar dataKey="count" name="Reviews" radius={[4, 4, 0, 0]}>
                    {stats.byRating.slice().reverse().map((entry) => (
                      <Cell key={entry.rating} fill={RATING_COLORS[entry.rating]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Averages */}
          <div className="glass-card rounded-xl p-5 ambient-shadow">
            <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              Category Averages
            </h3>
            <div className="space-y-3">
              {(['cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value'] as const).map((cat) => {
                const avg = stats.averageCategoryRatings[cat] ?? 0;
                const pct = (avg / 5) * 100;
                const label = cat === 'checkIn' ? 'Check-in' : cat.charAt(0).toUpperCase() + cat.slice(1);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-surface-variant/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary-container transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-on-surface w-8 text-end">{avg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              {responseTemplates.length} response templates for common scenarios
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {responseTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="glass-card rounded-xl p-5 ambient-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-on-surface">{tpl.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    tpl.tone === 'professional' ? 'bg-blue-500/10 text-blue-600' :
                    tpl.tone === 'warm' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {tpl.tone}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    tpl.scenario === 'positive' ? 'bg-success/10 text-success' :
                    tpl.scenario === 'negative' ? 'bg-error/10 text-error' :
                    tpl.scenario === 'maintenance' ? 'bg-amber-500/10 text-amber-600' :
                    tpl.scenario === 'value' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-outline-variant/20 text-on-surface-variant'
                  }`}>
                    {tpl.scenario}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {tpl.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Response Modal */}
      {aiModalReview && (
        <AiResponseModal
          review={aiModalReview}
          onClose={() => setAiModalReview(null)}
          onSelectResponse={handleAiSelect}
        />
      )}

      {/* Templates Modal */}
      {templatesReview && (
        <TemplatesPanel
          review={templatesReview}
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setTemplatesReview(null)}
        />
      )}
    </div>
  );
}

// ── Wrapper to handle injected text from AI/Templates ──────────────────────

function ReviewCardWrapper({
  review,
  onRespond,
  onFlag,
  onArchive,
  onOpenAi,
  onOpenTemplates,
  injectTarget,
  clearInject,
}: {
  review: Review;
  onRespond: (id: string, text: string) => void;
  onFlag: (id: string) => void;
  onArchive: (id: string) => void;
  onOpenAi: (review: Review) => void;
  onOpenTemplates: (review: Review) => void;
  injectTarget: { id: string; text: string } | null;
  clearInject: () => void;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sentimentCfg = sentimentConfig[review.sentiment];
  const SentimentIcon = sentimentCfg.Icon;
  const isLong = review.content.length > 200;

  // Handle injected text from AI or templates
  if (injectTarget && injectTarget.id === review.id && replyText !== injectTarget.text) {
    setReplyText(injectTarget.text);
    setShowReplyBox(true);
    clearInject();
  }

  const handleSend = () => {
    if (!replyText.trim()) return;
    setSending(true);
    onRespond(review.id, replyText);
    // Reset UI state after a short delay (mutation handles actual API call)
    setTimeout(() => {
      setShowReplyBox(false);
      setReplyText('');
      setSending(false);
    }, 600);
  };

  return (
    <div className="glass-card rounded-xl ambient-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getInitialsColor(review.guestName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {getInitials(review.guestName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-sm">{review.guestName}</span>
            <PlatformBadge platform={review.source} />
            <span className={`flex items-center gap-0.5 text-xs font-medium ${sentimentCfg.color}`}>
              <SentimentIcon className="w-3 h-3" />
              {sentimentCfg.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[review.status].badge}`}>
              {statusConfig[review.status].label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-on-surface-variant">{formatDate(review.publishedAt)}</span>
            <span className="text-xs text-on-surface-variant/60">|</span>
            <span className="text-xs text-on-surface-variant">{review.propertyName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {review.status !== 'FLAGGED' && (
            <button
              onClick={() => onFlag(review.id)}
              title="Flag review"
              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
          {review.status !== 'ARCHIVED' && (
            <button
              onClick={() => onArchive(review.id)}
              title="Archive review"
              className="p-1.5 rounded-lg hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        {review.title && (
          <p className="text-sm font-semibold text-on-surface mb-1">&ldquo;{review.title}&rdquo;</p>
        )}
        <p className={`text-sm text-on-surface-variant leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
          {review.content}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Response */}
      {review.response ? (
        <div className="mx-5 mb-4 p-4 rounded-xl bg-surface-variant/30 border-s-2 border-secondary/40">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold text-secondary">Your Response</span>
            {review.respondedAt && (
              <span className="text-[10px] text-on-surface-variant">{formatDate(review.respondedAt)}</span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{review.response}</p>
        </div>
      ) : (
        <div className="px-5 pb-4">
          {showReplyBox ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-secondary/40 transition-colors resize-y"
              />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAi(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assist
                  </button>
                  <button
                    onClick={() => onOpenTemplates(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-variant/50 text-on-surface-variant text-xs font-medium hover:bg-surface-variant transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Templates
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowReplyBox(false); setReplyText(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {sending ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReplyBox(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-4 h-4" />
                Respond
              </button>
              <button
                onClick={() => onOpenAi(review)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium hover:bg-secondary/20 transition-colors"
              >
                <Bot className="w-4 h-4" />
                AI Response
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
