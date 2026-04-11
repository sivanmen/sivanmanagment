import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Sun,
  Clock,
  Users,
  Percent,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type PricingRuleType =
  | 'SEASONAL'
  | 'DAY_OF_WEEK'
  | 'LENGTH_OF_STAY'
  | 'LAST_MINUTE'
  | 'EARLY_BIRD'
  | 'OCCUPANCY'
  | 'CUSTOM';

interface PricingCondition {
  dateRange?: { start: string; end: string };
  daysOfWeek?: number[];
  minNights?: number;
  maxNights?: number;
  minDaysBeforeCheckin?: number;
  maxDaysBeforeCheckin?: number;
  minOccupancyPercent?: number;
  maxOccupancyPercent?: number;
}

interface PricingAdjustment {
  type: 'PERCENTAGE' | 'FIXED' | 'OVERRIDE';
  value: number;
  applyTo: 'NIGHTLY_RATE' | 'TOTAL' | 'CLEANING_FEE';
}

interface PricingRule {
  id: string;
  propertyId?: string;
  name: string;
  type: PricingRuleType;
  priority: number;
  isActive: boolean;
  conditions: PricingCondition;
  adjustment: PricingAdjustment;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
}

interface PriceAdjustmentDetail {
  ruleName: string;
  ruleType: PricingRuleType;
  adjustmentType: string;
  amount: number;
}

interface DailyPrice {
  date: string;
  price: number;
  appliedRules: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const BASE_RATE = 150;
const CLEANING_FEE = 80;

const typeConfig: Record<PricingRuleType, { label: string; color: string; icon: typeof Sun }> = {
  SEASONAL: { label: 'Seasonal', color: 'bg-amber-500/10 text-amber-600', icon: Sun },
  DAY_OF_WEEK: { label: 'Day of Week', color: 'bg-blue-500/10 text-blue-600', icon: Calendar },
  LENGTH_OF_STAY: { label: 'Length of Stay', color: 'bg-secondary/10 text-secondary', icon: Clock },
  LAST_MINUTE: { label: 'Last Minute', color: 'bg-error/10 text-error', icon: Zap },
  EARLY_BIRD: { label: 'Early Bird', color: 'bg-success/10 text-success', icon: TrendingDown },
  OCCUPANCY: { label: 'Occupancy', color: 'bg-warning/10 text-warning', icon: Users },
  CUSTOM: { label: 'Custom', color: 'bg-outline-variant/20 text-on-surface-variant', icon: Percent },
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const demoProperties = [
  { id: 'prop-1', name: 'Elounda Breeze Villa' },
  { id: 'prop-2', name: 'Rethymno Sunset Apartment' },
  { id: 'prop-3', name: 'Chania Harbor Studio' },
];

// ── Seed Rules ──────────────────────────────────────────────────────────────

const seedRules: PricingRule[] = [
  {
    id: 'pr-1',
    name: 'Summer Peak',
    type: 'SEASONAL',
    priority: 100,
    isActive: true,
    conditions: { dateRange: { start: '07-01', end: '08-31' } },
    adjustment: { type: 'PERCENTAGE', value: 30, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-01-15',
  },
  {
    id: 'pr-2',
    name: 'Winter Low',
    type: 'SEASONAL',
    priority: 90,
    isActive: true,
    conditions: { dateRange: { start: '11-01', end: '02-28' } },
    adjustment: { type: 'PERCENTAGE', value: -20, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-01-15',
  },
  {
    id: 'pr-3',
    name: 'Weekend Premium',
    type: 'DAY_OF_WEEK',
    priority: 80,
    isActive: true,
    conditions: { daysOfWeek: [5, 6] },
    adjustment: { type: 'PERCENTAGE', value: 15, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-01-20',
  },
  {
    id: 'pr-4',
    name: 'Weekly Discount',
    type: 'LENGTH_OF_STAY',
    priority: 70,
    isActive: true,
    conditions: { minNights: 7 },
    adjustment: { type: 'PERCENTAGE', value: -10, applyTo: 'TOTAL' },
    createdAt: '2026-02-01',
  },
  {
    id: 'pr-5',
    name: 'Monthly Discount',
    type: 'LENGTH_OF_STAY',
    priority: 75,
    isActive: true,
    conditions: { minNights: 28 },
    adjustment: { type: 'PERCENTAGE', value: -25, applyTo: 'TOTAL' },
    createdAt: '2026-02-01',
  },
  {
    id: 'pr-6',
    name: 'Last Minute',
    type: 'LAST_MINUTE',
    priority: 60,
    isActive: true,
    conditions: { maxDaysBeforeCheckin: 3 },
    adjustment: { type: 'PERCENTAGE', value: -15, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-02-10',
  },
  {
    id: 'pr-7',
    name: 'Early Bird',
    type: 'EARLY_BIRD',
    priority: 50,
    isActive: true,
    conditions: { minDaysBeforeCheckin: 60 },
    adjustment: { type: 'PERCENTAGE', value: -5, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-02-10',
  },
  {
    id: 'pr-8',
    name: 'High Occupancy',
    type: 'OCCUPANCY',
    priority: 40,
    isActive: true,
    conditions: { minOccupancyPercent: 80 },
    adjustment: { type: 'PERCENTAGE', value: 10, applyTo: 'NIGHTLY_RATE' },
    createdAt: '2026-03-01',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getConditionSummary(rule: PricingRule): string {
  const parts: string[] = [];
  const c = rule.conditions;
  if (c.dateRange) parts.push(`${c.dateRange.start} to ${c.dateRange.end}`);
  if (c.daysOfWeek?.length) parts.push(c.daysOfWeek.map((d) => dayLabels[d]).join(', '));
  if (c.minNights) parts.push(`${c.minNights}+ nights`);
  if (c.maxNights) parts.push(`max ${c.maxNights} nights`);
  if (c.maxDaysBeforeCheckin !== undefined) parts.push(`<${c.maxDaysBeforeCheckin} days before`);
  if (c.minDaysBeforeCheckin !== undefined) parts.push(`>${c.minDaysBeforeCheckin} days before`);
  if (c.minOccupancyPercent !== undefined) parts.push(`>${c.minOccupancyPercent}% occupancy`);
  return parts.join(', ') || 'No conditions';
}

function getAdjustmentLabel(adj: PricingAdjustment): string {
  const sign = adj.value > 0 ? '+' : '';
  if (adj.type === 'PERCENTAGE') return `${sign}${adj.value}%`;
  if (adj.type === 'FIXED') return `${sign}${adj.value} EUR`;
  return `Override: ${adj.value} EUR`;
}

function parseMonthDay(md: string): { month: number; day: number } {
  const [m, d] = md.split('-').map(Number);
  return { month: m, day: d };
}

function dateInRange(date: Date, rangeStart: string, rangeEnd: string): boolean {
  const d = { month: date.getMonth() + 1, day: date.getDate() };
  const start = parseMonthDay(rangeStart);
  const end = parseMonthDay(rangeEnd);
  if (start.month < end.month || (start.month === end.month && start.day <= end.day)) {
    return (d.month > start.month || (d.month === start.month && d.day >= start.day)) &&
      (d.month < end.month || (d.month === end.month && d.day <= end.day));
  }
  return d.month > start.month || (d.month === start.month && d.day >= start.day) ||
    d.month < end.month || (d.month === end.month && d.day <= end.day);
}

function computeDailyPrice(date: Date, rules: PricingRule[]): { price: number; appliedRules: string[] } {
  let price = BASE_RATE;
  const applied: string[] = [];
  const active = rules
    .filter((r) => r.isActive && r.adjustment.applyTo === 'NIGHTLY_RATE')
    .sort((a, b) => b.priority - a.priority);

  for (const rule of active) {
    const c = rule.conditions;
    let matches = true;
    if (c.dateRange && !dateInRange(date, c.dateRange.start, c.dateRange.end)) matches = false;
    if (c.daysOfWeek?.length && !c.daysOfWeek.includes(date.getDay())) matches = false;
    if (!matches) continue;
    if (rule.adjustment.type === 'PERCENTAGE') price += price * (rule.adjustment.value / 100);
    else if (rule.adjustment.type === 'FIXED') price += rule.adjustment.value;
    else if (rule.adjustment.type === 'OVERRIDE') price = rule.adjustment.value;
    applied.push(rule.name);
  }
  return { price: Math.round(price), appliedRules: applied };
}

function simulatePrice(
  checkIn: string,
  checkOut: string,
  guests: number,
  rules: PricingRule[],
): { subtotal: number; adjustments: PriceAdjustmentDetail[]; cleaningFee: number; serviceFee: number; taxes: number; total: number; nights: number } {
  const ciDate = new Date(checkIn);
  const coDate = new Date(checkOut);
  const nights = Math.round((coDate.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return { subtotal: 0, adjustments: [], cleaningFee: 0, serviceFee: 0, taxes: 0, total: 0, nights: 0 };

  const daysBeforeCheckin = Math.round((ciDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const activeRules = rules.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
  const adjMap: Record<string, number> = {};
  let totalNightly = 0;

  for (let i = 0; i < nights; i++) {
    const d = new Date(ciDate);
    d.setDate(d.getDate() + i);
    let rate = BASE_RATE;
    for (const rule of activeRules) {
      if (rule.adjustment.applyTo !== 'NIGHTLY_RATE') continue;
      const c = rule.conditions;
      let ok = true;
      if (c.dateRange && !dateInRange(d, c.dateRange.start, c.dateRange.end)) ok = false;
      if (c.daysOfWeek?.length && !c.daysOfWeek.includes(d.getDay())) ok = false;
      if (c.maxDaysBeforeCheckin !== undefined && daysBeforeCheckin > c.maxDaysBeforeCheckin) ok = false;
      if (c.minDaysBeforeCheckin !== undefined && daysBeforeCheckin < c.minDaysBeforeCheckin) ok = false;
      if (!ok) continue;
      let adj = 0;
      if (rule.adjustment.type === 'PERCENTAGE') { adj = rate * (rule.adjustment.value / 100); rate += adj; }
      else if (rule.adjustment.type === 'FIXED') { adj = rule.adjustment.value; rate += adj; }
      else { adj = rule.adjustment.value - rate; rate = rule.adjustment.value; }
      if (adj !== 0) adjMap[rule.name] = (adjMap[rule.name] || 0) + adj;
    }
    totalNightly += rate;
  }

  const adjustments: PriceAdjustmentDetail[] = Object.entries(adjMap).map(([name, amount]) => {
    const rule = activeRules.find((r) => r.name === name);
    return { ruleName: name, ruleType: rule?.type || 'CUSTOM', adjustmentType: rule?.adjustment.type || 'PERCENTAGE', amount: Math.round(amount * 100) / 100 };
  });

  let subtotal = totalNightly;

  // Total adjustments (length of stay)
  for (const rule of activeRules) {
    if (rule.adjustment.applyTo !== 'TOTAL') continue;
    const c = rule.conditions;
    if (c.minNights !== undefined && nights < c.minNights) continue;
    if (c.maxNights !== undefined && nights > c.maxNights) continue;
    let adj = 0;
    if (rule.adjustment.type === 'PERCENTAGE') { adj = subtotal * (rule.adjustment.value / 100); subtotal += adj; }
    else if (rule.adjustment.type === 'FIXED') { adj = rule.adjustment.value; subtotal += adj; }
    if (adj !== 0) adjustments.push({ ruleName: rule.name, ruleType: rule.type, adjustmentType: rule.adjustment.type, amount: Math.round(adj * 100) / 100 });
  }

  const cleaningFee = CLEANING_FEE;
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const taxes = Math.round((subtotal + cleaningFee) * 0.13 * 100) / 100;
  const total = Math.round((subtotal + cleaningFee + serviceFee + taxes) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, adjustments, cleaningFee, serviceFee, taxes, total, nights };
}

// ── Component ──────────────────────────────────────────────────────────────

type ViewMode = 'rules' | 'simulator' | 'calendar';

export default function PricingPage() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<PricingRule[]>(seedRules);
  const [view, setView] = useState<ViewMode>('rules');
  const [editingRule, setEditingRule] = useState<Partial<PricingRule> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Simulator state
  const [simPropertyId, setSimPropertyId] = useState('prop-1');
  const [simCheckIn, setSimCheckIn] = useState('2026-07-15');
  const [simCheckOut, setSimCheckOut] = useState('2026-07-22');
  const [simGuests, setSimGuests] = useState(2);

  // Calendar state
  const [calMonth, setCalMonth] = useState(7); // July
  const [calYear, setCalYear] = useState(2026);
  const [hoveredDay, setHoveredDay] = useState<DailyPrice | null>(null);

  // Stats
  const activeRules = rules.filter((r) => r.isActive).length;
  const avgAdjustment = rules.length > 0
    ? Math.round(rules.reduce((s, r) => s + Math.abs(r.adjustment.value), 0) / rules.length)
    : 0;
  const highestPremium = Math.max(...rules.filter((r) => r.adjustment.value > 0).map((r) => r.adjustment.value), 0);

  // Calendar data
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
    const prices: DailyPrice[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calYear, calMonth - 1, day);
      const { price, appliedRules } = computeDailyPrice(date, rules);
      prices.push({
        date: `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        price,
        appliedRules,
      });
    }
    return { prices, firstDayOfWeek, daysInMonth };
  }, [calMonth, calYear, rules]);

  const priceRange = useMemo(() => {
    const prices = calendarData.prices.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [calendarData]);

  // Simulator result
  const simResult = useMemo(() => {
    return simulatePrice(simCheckIn, simCheckOut, simGuests, rules);
  }, [simCheckIn, simCheckOut, simGuests, rules]);

  const simWithoutRules = useMemo(() => {
    const nights = simResult.nights;
    if (nights <= 0) return null;
    const subtotal = BASE_RATE * nights;
    const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
    const taxes = Math.round((subtotal + CLEANING_FEE) * 0.13 * 100) / 100;
    return { subtotal, cleaningFee: CLEANING_FEE, serviceFee, taxes, total: Math.round((subtotal + CLEANING_FEE + serviceFee + taxes) * 100) / 100 };
  }, [simResult]);

  // Handlers
  const handleToggle = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
    toast.success(t('pricing.ruleToggled', 'Rule toggled'));
  }, [t]);

  const handleDelete = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success(t('pricing.ruleDeleted', 'Rule deleted'));
  }, [t]);

  const handleEdit = useCallback((rule: PricingRule) => {
    setEditingRule({ ...rule });
    setEditingId(rule.id);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRule({
      name: '',
      type: 'SEASONAL',
      priority: 50,
      isActive: true,
      conditions: {},
      adjustment: { type: 'PERCENTAGE', value: 0, applyTo: 'NIGHTLY_RATE' },
    });
    setEditingId(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingRule?.name?.trim()) {
      toast.error(t('pricing.nameRequired', 'Name is required'));
      return;
    }
    if (editingId) {
      setRules((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...editingRule } as PricingRule : r)));
      toast.success(t('pricing.ruleUpdated', 'Rule updated'));
    } else {
      const newRule: PricingRule = {
        id: `pr-${Date.now()}`,
        name: editingRule.name || '',
        type: editingRule.type || 'CUSTOM',
        priority: editingRule.priority || 50,
        isActive: editingRule.isActive ?? true,
        conditions: editingRule.conditions || {},
        adjustment: editingRule.adjustment || { type: 'PERCENTAGE', value: 0, applyTo: 'NIGHTLY_RATE' },
        propertyId: editingRule.propertyId,
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
      toast.success(t('pricing.ruleCreated', 'Rule created'));
    }
    setEditingRule(null);
    setEditingId(null);
  }, [editingRule, editingId, t]);

  const handleCancelEdit = useCallback(() => {
    setEditingRule(null);
    setEditingId(null);
  }, []);

  // ── Styles ────────────────────────────────────────────────────────────

  const inputClass = 'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const stats = [
    { label: t('pricing.activeRules', 'Active Rules'), value: activeRules, icon: Zap, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('pricing.avgAdjustment', 'Avg Adjustment'), value: `${avgAdjustment}%`, icon: Percent, color: 'bg-blue-500/10', iconColor: 'text-blue-600' },
    { label: t('pricing.highestPremium', 'Highest Premium'), value: `+${highestPremium}%`, icon: TrendingUp, color: 'bg-success/10', iconColor: 'text-success' },
  ];

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getPriceColor(price: number): string {
    if (priceRange.max === priceRange.min) return 'bg-success/20 text-success';
    const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min);
    if (ratio < 0.33) return 'bg-success/20 text-success';
    if (ratio < 0.66) return 'bg-amber-500/20 text-amber-600';
    return 'bg-error/20 text-error';
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-headline font-semibold text-on-surface">
            {t('pricing.title', 'Revenue Management')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('pricing.subtitle', 'Dynamic pricing rules and rate optimization')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['rules', 'simulator', 'calendar'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === v
                  ? 'bg-secondary text-on-secondary shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {v === 'rules' && t('pricing.rules', 'Rules')}
              {v === 'simulator' && t('pricing.simulator', 'Simulator')}
              {v === 'calendar' && t('pricing.calendar', 'Calendar')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface-container rounded-2xl p-5 ambient-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                  <p className="mt-1 text-2xl font-headline font-semibold text-on-surface">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Rules View ─────────────────────────────────────────────────── */}
      {view === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t('pricing.addRule', 'Add Pricing Rule')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.sort((a, b) => b.priority - a.priority).map((rule) => {
              const cfg = typeConfig[rule.type];
              const TypeIcon = cfg.icon;
              return (
                <div
                  key={rule.id}
                  className={`bg-surface-container rounded-2xl p-5 ambient-shadow border-s-4 transition-all ${
                    rule.isActive ? 'border-s-secondary' : 'border-s-outline-variant opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${cfg.color}`}>
                        <TypeIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-on-surface">{rule.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            Priority: {rule.priority}
                          </span>
                          {rule.propertyId ? (
                            <span className="text-xs text-on-surface-variant">
                              {demoProperties.find((p) => p.id === rule.propertyId)?.name || rule.propertyId}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-outline-variant/20 text-on-surface-variant">
                              Global
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high transition-all"
                        title={rule.isActive ? 'Disable' : 'Enable'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-5 h-5 text-secondary" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-outline-variant" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 rounded-lg hover:bg-surface-container-high transition-all"
                      >
                        <Edit3 className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                    <span className="text-sm text-on-surface-variant">{getConditionSummary(rule)}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      rule.adjustment.value > 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                    }`}>
                      {getAdjustmentLabel(rule.adjustment)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Simulator View ─────────────────────────────────────────────── */}
      {view === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="bg-surface-container rounded-2xl p-6 ambient-shadow">
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-secondary" />
              {t('pricing.priceSimulator', 'Price Simulator')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Property</label>
                <select
                  value={simPropertyId}
                  onChange={(e) => setSimPropertyId(e.target.value)}
                  className={inputClass + ' w-full'}
                >
                  {demoProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Check-in</label>
                  <input type="date" value={simCheckIn} onChange={(e) => setSimCheckIn(e.target.value)} className={inputClass + ' w-full'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Check-out</label>
                  <input type="date" value={simCheckOut} onChange={(e) => setSimCheckOut(e.target.value)} className={inputClass + ' w-full'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Guests</label>
                <input type="number" min={1} max={20} value={simGuests} onChange={(e) => setSimGuests(parseInt(e.target.value) || 1)} className={inputClass + ' w-full'} />
              </div>
            </div>
          </div>

          {/* Results panel */}
          <div className="bg-surface-container rounded-2xl p-6 ambient-shadow">
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              {t('pricing.breakdown', 'Price Breakdown')}
            </h2>
            {simResult.nights > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Base rate x {simResult.nights} nights</span>
                  <span className="text-on-surface font-medium">{(BASE_RATE * simResult.nights).toFixed(2)} EUR</span>
                </div>

                {simResult.adjustments.map((adj, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className={adj.amount > 0 ? 'text-error' : 'text-success'}>
                      {adj.ruleName}
                    </span>
                    <span className={`font-medium ${adj.amount > 0 ? 'text-error' : 'text-success'}`}>
                      {adj.amount > 0 ? '+' : ''}{adj.amount.toFixed(2)} EUR
                    </span>
                  </div>
                ))}

                <div className="border-t border-outline-variant/20 pt-2 flex justify-between text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="text-on-surface font-medium">{simResult.subtotal.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Cleaning fee</span>
                  <span className="text-on-surface font-medium">{simResult.cleaningFee.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Service fee (5%)</span>
                  <span className="text-on-surface font-medium">{simResult.serviceFee.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Taxes (13%)</span>
                  <span className="text-on-surface font-medium">{simResult.taxes.toFixed(2)} EUR</span>
                </div>
                <div className="border-t-2 border-secondary/30 pt-3 flex justify-between">
                  <span className="font-semibold text-on-surface">Total</span>
                  <span className="text-xl font-headline font-bold text-secondary">{simResult.total.toFixed(2)} EUR</span>
                </div>

                {/* Comparison */}
                {simWithoutRules && (
                  <div className="mt-4 p-4 rounded-xl bg-surface-container-high">
                    <h4 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Without Rules Comparison</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Without rules</span>
                      <span className="text-on-surface font-medium">{simWithoutRules.total.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-on-surface-variant">With rules</span>
                      <span className="text-on-surface font-medium">{simResult.total.toFixed(2)} EUR</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-on-surface-variant">Difference</span>
                      <span className={`font-semibold ${simResult.total > simWithoutRules.total ? 'text-success' : 'text-error'}`}>
                        {simResult.total > simWithoutRules.total ? '+' : ''}{(simResult.total - simWithoutRules.total).toFixed(2)} EUR
                        ({simWithoutRules.total > 0 ? ((simResult.total / simWithoutRules.total - 1) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Enter valid dates to see the price breakdown.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Calendar View ─────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="bg-surface-container rounded-2xl p-6 ambient-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-headline font-semibold text-on-surface flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              {t('pricing.seasonalCalendar', 'Seasonal Calendar')}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
                  else setCalMonth(calMonth - 1);
                }}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
              </button>
              <span className="text-sm font-semibold text-on-surface min-w-[140px] text-center">
                {monthNames[calMonth - 1]} {calYear}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
                  else setCalMonth(calMonth + 1);
                }}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
              >
                <ChevronRight className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-success/30" />
              <span className="text-xs text-on-surface-variant">Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500/30" />
              <span className="text-xs text-on-surface-variant">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-error/30" />
              <span className="text-xs text-on-surface-variant">High</span>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-on-surface-variant py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 rounded-lg" />
            ))}
            {calendarData.prices.map((dp) => {
              const day = parseInt(dp.date.split('-')[2]);
              return (
                <div
                  key={dp.date}
                  className={`relative p-2 rounded-lg cursor-pointer transition-all hover:ring-2 hover:ring-secondary/40 ${getPriceColor(dp.price)}`}
                  onMouseEnter={() => setHoveredDay(dp)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="text-xs font-medium">{day}</div>
                  <div className="text-xs font-bold mt-0.5">{dp.price} EUR</div>
                </div>
              );
            })}
          </div>

          {/* Hover tooltip */}
          {hoveredDay && (
            <div className="mt-4 p-4 rounded-xl bg-surface-container-high">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-secondary" />
                <span className="text-sm font-semibold text-on-surface">{hoveredDay.date}</span>
                <span className="text-sm font-bold text-secondary ms-auto">{hoveredDay.price} EUR</span>
              </div>
              {hoveredDay.appliedRules.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {hoveredDay.appliedRules.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {r}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-on-surface-variant">Base rate - no rules applied</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Edit/Create Modal ────────────────────────────────────────────── */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ambient-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-headline font-semibold text-on-surface">
                {editingId ? t('pricing.editRule', 'Edit Rule') : t('pricing.addRule', 'Add Pricing Rule')}
              </h2>
              <button onClick={handleCancelEdit} className="p-1.5 rounded-lg hover:bg-surface-container-high">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Name</label>
                <input
                  value={editingRule.name || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g. Summer Peak"
                  className={inputClass + ' w-full'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Type</label>
                  <select
                    value={editingRule.type || 'SEASONAL'}
                    onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as PricingRuleType })}
                    className={inputClass + ' w-full'}
                  >
                    {Object.entries(typeConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Priority</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editingRule.priority ?? 50}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                    className={inputClass + ' w-full'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Property</label>
                <select
                  value={editingRule.propertyId || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, propertyId: e.target.value || undefined })}
                  className={inputClass + ' w-full'}
                >
                  <option value="">Global (all properties)</option>
                  {demoProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Conditions */}
              <div className="border-t border-outline-variant/20 pt-4">
                <h3 className="text-sm font-semibold text-on-surface mb-3">Conditions</h3>

                {(editingRule.type === 'SEASONAL' || editingRule.type === 'CUSTOM') && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Date Range Start (MM-DD)</label>
                      <input
                        value={editingRule.conditions?.dateRange?.start || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          conditions: { ...editingRule.conditions, dateRange: { start: e.target.value, end: editingRule.conditions?.dateRange?.end || '' } },
                        })}
                        placeholder="07-01"
                        className={inputClass + ' w-full'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Date Range End (MM-DD)</label>
                      <input
                        value={editingRule.conditions?.dateRange?.end || ''}
                        onChange={(e) => setEditingRule({
                          ...editingRule,
                          conditions: { ...editingRule.conditions, dateRange: { ...editingRule.conditions?.dateRange, start: editingRule.conditions?.dateRange?.start || '', end: e.target.value } },
                        })}
                        placeholder="08-31"
                        className={inputClass + ' w-full'}
                      />
                    </div>
                  </div>
                )}

                {(editingRule.type === 'DAY_OF_WEEK' || editingRule.type === 'CUSTOM') && (
                  <div className="mb-3">
                    <label className="block text-xs text-on-surface-variant mb-1">Days of Week</label>
                    <div className="flex gap-1 flex-wrap">
                      {dayLabels.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const current = editingRule.conditions?.daysOfWeek || [];
                            const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i];
                            setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, daysOfWeek: next } });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            editingRule.conditions?.daysOfWeek?.includes(i)
                              ? 'bg-secondary text-on-secondary'
                              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(editingRule.type === 'LENGTH_OF_STAY' || editingRule.type === 'CUSTOM') && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Min Nights</label>
                      <input
                        type="number"
                        min={1}
                        value={editingRule.conditions?.minNights || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, minNights: parseInt(e.target.value) || undefined } })}
                        className={inputClass + ' w-full'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Max Nights</label>
                      <input
                        type="number"
                        min={1}
                        value={editingRule.conditions?.maxNights || ''}
                        onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, maxNights: parseInt(e.target.value) || undefined } })}
                        className={inputClass + ' w-full'}
                      />
                    </div>
                  </div>
                )}

                {(editingRule.type === 'LAST_MINUTE' || editingRule.type === 'CUSTOM') && (
                  <div className="mb-3">
                    <label className="block text-xs text-on-surface-variant mb-1">Max Days Before Check-in</label>
                    <input
                      type="number"
                      min={0}
                      value={editingRule.conditions?.maxDaysBeforeCheckin ?? ''}
                      onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, maxDaysBeforeCheckin: parseInt(e.target.value) } })}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                )}

                {(editingRule.type === 'EARLY_BIRD' || editingRule.type === 'CUSTOM') && (
                  <div className="mb-3">
                    <label className="block text-xs text-on-surface-variant mb-1">Min Days Before Check-in</label>
                    <input
                      type="number"
                      min={0}
                      value={editingRule.conditions?.minDaysBeforeCheckin ?? ''}
                      onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, minDaysBeforeCheckin: parseInt(e.target.value) } })}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                )}

                {(editingRule.type === 'OCCUPANCY' || editingRule.type === 'CUSTOM') && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Min Occupancy %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingRule.conditions?.minOccupancyPercent ?? ''}
                        onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, minOccupancyPercent: parseInt(e.target.value) } })}
                        className={inputClass + ' w-full'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Max Occupancy %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingRule.conditions?.maxOccupancyPercent ?? ''}
                        onChange={(e) => setEditingRule({ ...editingRule, conditions: { ...editingRule.conditions, maxOccupancyPercent: parseInt(e.target.value) } })}
                        className={inputClass + ' w-full'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Adjustment */}
              <div className="border-t border-outline-variant/20 pt-4">
                <h3 className="text-sm font-semibold text-on-surface mb-3">Adjustment</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Type</label>
                    <select
                      value={editingRule.adjustment?.type || 'PERCENTAGE'}
                      onChange={(e) => setEditingRule({ ...editingRule, adjustment: { ...editingRule.adjustment!, type: e.target.value as 'PERCENTAGE' | 'FIXED' | 'OVERRIDE' } })}
                      className={inputClass + ' w-full'}
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed</option>
                      <option value="OVERRIDE">Override</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Value</label>
                    <input
                      type="number"
                      value={editingRule.adjustment?.value ?? 0}
                      onChange={(e) => setEditingRule({ ...editingRule, adjustment: { ...editingRule.adjustment!, value: parseFloat(e.target.value) || 0 } })}
                      className={inputClass + ' w-full'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Apply To</label>
                    <select
                      value={editingRule.adjustment?.applyTo || 'NIGHTLY_RATE'}
                      onChange={(e) => setEditingRule({ ...editingRule, adjustment: { ...editingRule.adjustment!, applyTo: e.target.value as 'NIGHTLY_RATE' | 'TOTAL' | 'CLEANING_FEE' } })}
                      className={inputClass + ' w-full'}
                    >
                      <option value="NIGHTLY_RATE">Nightly Rate</option>
                      <option value="TOTAL">Total</option>
                      <option value="CLEANING_FEE">Cleaning Fee</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-all"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:bg-secondary/90 transition-all shadow-md"
                >
                  {t('common.save', 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
