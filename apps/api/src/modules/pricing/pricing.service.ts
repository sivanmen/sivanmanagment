import { ApiError } from '../../utils/api-error';
import { randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export type PricingRuleType =
  | 'SEASONAL'
  | 'DAY_OF_WEEK'
  | 'LENGTH_OF_STAY'
  | 'LAST_MINUTE'
  | 'EARLY_BIRD'
  | 'OCCUPANCY'
  | 'CUSTOM';

export interface PricingCondition {
  dateRange?: { start: string; end: string };
  daysOfWeek?: number[]; // 0=Sunday
  minNights?: number;
  maxNights?: number;
  minDaysBeforeCheckin?: number;
  maxDaysBeforeCheckin?: number;
  minOccupancyPercent?: number;
  maxOccupancyPercent?: number;
}

export interface PricingAdjustment {
  type: 'PERCENTAGE' | 'FIXED' | 'OVERRIDE';
  value: number; // positive = increase, negative = discount
  applyTo: 'NIGHTLY_RATE' | 'TOTAL' | 'CLEANING_FEE';
}

export interface PricingRule {
  id: string;
  propertyId?: string; // null = global
  name: string;
  type: PricingRuleType;
  priority: number; // higher = applied first
  isActive: boolean;
  conditions: PricingCondition;
  adjustment: PricingAdjustment;
  validFrom?: string;
  validTo?: string;
  createdAt: Date;
}

export interface PriceAdjustmentDetail {
  ruleName: string;
  ruleType: PricingRuleType;
  adjustmentType: string;
  amount: number;
}

export interface PriceBreakdown {
  baseRate: number;
  nights: number;
  subtotal: number;
  adjustments: PriceAdjustmentDetail[];
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
}

export interface DailyPrice {
  date: string;
  price: number;
  appliedRules: string[];
}

export interface SimulationScenario {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  withRules: PriceBreakdown;
  withoutRules: PriceBreakdown;
}

export type CreatePricingRuleInput = Omit<PricingRule, 'id' | 'createdAt'>;
export type UpdatePricingRuleInput = Partial<Omit<PricingRule, 'id' | 'createdAt'>>;

// ── Seed data ───────────────────────────────────────────────────────────────

const seedRules: PricingRule[] = [
  {
    id: randomUUID(),
    name: 'Summer Peak',
    type: 'SEASONAL',
    priority: 100,
    isActive: true,
    conditions: { dateRange: { start: '07-01', end: '08-31' } },
    adjustment: { type: 'PERCENTAGE', value: 30, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-01-15'),
  },
  {
    id: randomUUID(),
    name: 'Winter Low',
    type: 'SEASONAL',
    priority: 90,
    isActive: true,
    conditions: { dateRange: { start: '11-01', end: '02-28' } },
    adjustment: { type: 'PERCENTAGE', value: -20, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-01-15'),
  },
  {
    id: randomUUID(),
    name: 'Weekend Premium',
    type: 'DAY_OF_WEEK',
    priority: 80,
    isActive: true,
    conditions: { daysOfWeek: [5, 6] }, // Friday, Saturday
    adjustment: { type: 'PERCENTAGE', value: 15, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-01-20'),
  },
  {
    id: randomUUID(),
    name: 'Weekly Discount',
    type: 'LENGTH_OF_STAY',
    priority: 70,
    isActive: true,
    conditions: { minNights: 7 },
    adjustment: { type: 'PERCENTAGE', value: -10, applyTo: 'TOTAL' },
    createdAt: new Date('2026-02-01'),
  },
  {
    id: randomUUID(),
    name: 'Monthly Discount',
    type: 'LENGTH_OF_STAY',
    priority: 75,
    isActive: true,
    conditions: { minNights: 28 },
    adjustment: { type: 'PERCENTAGE', value: -25, applyTo: 'TOTAL' },
    createdAt: new Date('2026-02-01'),
  },
  {
    id: randomUUID(),
    name: 'Last Minute',
    type: 'LAST_MINUTE',
    priority: 60,
    isActive: true,
    conditions: { maxDaysBeforeCheckin: 3 },
    adjustment: { type: 'PERCENTAGE', value: -15, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-02-10'),
  },
  {
    id: randomUUID(),
    name: 'Early Bird',
    type: 'EARLY_BIRD',
    priority: 50,
    isActive: true,
    conditions: { minDaysBeforeCheckin: 60 },
    adjustment: { type: 'PERCENTAGE', value: -5, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-02-10'),
  },
  {
    id: randomUUID(),
    name: 'High Occupancy',
    type: 'OCCUPANCY',
    priority: 40,
    isActive: true,
    conditions: { minOccupancyPercent: 80 },
    adjustment: { type: 'PERCENTAGE', value: 10, applyTo: 'NIGHTLY_RATE' },
    createdAt: new Date('2026-03-01'),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const BASE_NIGHTLY_RATE = 150; // EUR default
const CLEANING_FEE = 80;
const SERVICE_FEE_PERCENT = 0.05;
const TAX_PERCENT = 0.13;
const DEFAULT_OCCUPANCY = 65; // simulated occupancy %

function parseMonthDay(md: string): { month: number; day: number } {
  const [m, d] = md.split('-').map(Number);
  return { month: m, day: d };
}

function dateInRange(date: Date, rangeStart: string, rangeEnd: string): boolean {
  const d = { month: date.getMonth() + 1, day: date.getDate() };
  const start = parseMonthDay(rangeStart);
  const end = parseMonthDay(rangeEnd);

  if (
    start.month < end.month ||
    (start.month === end.month && start.day <= end.day)
  ) {
    // Same-year range (e.g. 07-01 to 08-31)
    return (
      (d.month > start.month || (d.month === start.month && d.day >= start.day)) &&
      (d.month < end.month || (d.month === end.month && d.day <= end.day))
    );
  } else {
    // Cross-year range (e.g. 11-01 to 02-28)
    return (
      d.month > start.month ||
      (d.month === start.month && d.day >= start.day) ||
      d.month < end.month ||
      (d.month === end.month && d.day <= end.day)
    );
  }
}

function daysBetween(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ── Service ─────────────────────────────────────────────────────────────────

export class PricingService {
  private rules: PricingRule[] = [...seedRules];

  // ── CRUD ────────────────────────────────────────────────────────────────

  async getAllRules(propertyId?: string): Promise<PricingRule[]> {
    let result = [...this.rules];
    if (propertyId) {
      result = result.filter(
        (r) => !r.propertyId || r.propertyId === propertyId,
      );
    }
    return result.sort((a, b) => b.priority - a.priority);
  }

  async getRuleById(id: string): Promise<PricingRule> {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) {
      throw ApiError.notFound('PricingRule');
    }
    return rule;
  }

  async createRule(data: CreatePricingRuleInput): Promise<PricingRule> {
    const rule: PricingRule = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.rules.push(rule);
    return rule;
  }

  async updateRule(id: string, data: UpdatePricingRuleInput): Promise<PricingRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('PricingRule');
    }

    this.rules[idx] = {
      ...this.rules[idx],
      ...data,
    };
    return this.rules[idx];
  }

  async deleteRule(id: string): Promise<{ message: string }> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('PricingRule');
    }
    this.rules.splice(idx, 1);
    return { message: 'Pricing rule deleted successfully' };
  }

  async toggleRule(id: string): Promise<PricingRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('PricingRule');
    }

    this.rules[idx].isActive = !this.rules[idx].isActive;
    return this.rules[idx];
  }

  // ── Price Calculation ─────────────────────────────────────────────────

  async calculatePrice(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
  ): Promise<PriceBreakdown> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = daysBetween(checkInDate, checkOutDate);

    if (nights <= 0) {
      throw ApiError.badRequest('Check-out must be after check-in');
    }

    const daysBeforeCheckin = daysBetween(new Date(), checkInDate);

    // Get applicable rules sorted by priority (highest first)
    const applicableRules = this.rules
      .filter((r) => r.isActive)
      .filter((r) => !r.propertyId || r.propertyId === propertyId)
      .sort((a, b) => b.priority - a.priority);

    // Calculate nightly rates for each day
    let totalNightlyAmount = 0;
    const adjustments: PriceAdjustmentDetail[] = [];
    const nightlyAdjustmentTotals: Record<string, number> = {};

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      let nightRate = BASE_NIGHTLY_RATE;

      for (const rule of applicableRules) {
        if (rule.adjustment.applyTo !== 'NIGHTLY_RATE') continue;
        if (!this.ruleApplies(rule, currentDate, nights, daysBeforeCheckin, guests)) continue;

        let adj = 0;
        if (rule.adjustment.type === 'PERCENTAGE') {
          adj = nightRate * (rule.adjustment.value / 100);
          nightRate += adj;
        } else if (rule.adjustment.type === 'FIXED') {
          adj = rule.adjustment.value;
          nightRate += adj;
        } else if (rule.adjustment.type === 'OVERRIDE') {
          adj = rule.adjustment.value - nightRate;
          nightRate = rule.adjustment.value;
        }

        if (adj !== 0) {
          nightlyAdjustmentTotals[rule.name] = (nightlyAdjustmentTotals[rule.name] || 0) + adj;
        }
      }

      totalNightlyAmount += nightRate;
    }

    // Build nightly adjustments
    for (const [name, amount] of Object.entries(nightlyAdjustmentTotals)) {
      const rule = applicableRules.find((r) => r.name === name);
      if (rule) {
        adjustments.push({
          ruleName: name,
          ruleType: rule.type,
          adjustmentType: rule.adjustment.type,
          amount: Math.round(amount * 100) / 100,
        });
      }
    }

    let subtotal = totalNightlyAmount;

    // Cleaning fee adjustments
    let cleaningFee = CLEANING_FEE;
    for (const rule of applicableRules) {
      if (rule.adjustment.applyTo !== 'CLEANING_FEE') continue;
      if (!this.ruleApplies(rule, checkInDate, nights, daysBeforeCheckin, guests)) continue;

      let adj = 0;
      if (rule.adjustment.type === 'PERCENTAGE') {
        adj = cleaningFee * (rule.adjustment.value / 100);
        cleaningFee += adj;
      } else if (rule.adjustment.type === 'FIXED') {
        adj = rule.adjustment.value;
        cleaningFee += adj;
      } else if (rule.adjustment.type === 'OVERRIDE') {
        adj = rule.adjustment.value - cleaningFee;
        cleaningFee = rule.adjustment.value;
      }

      if (adj !== 0) {
        adjustments.push({
          ruleName: rule.name,
          ruleType: rule.type,
          adjustmentType: rule.adjustment.type,
          amount: Math.round(adj * 100) / 100,
        });
      }
    }

    // Total adjustments (e.g. length-of-stay discounts)
    for (const rule of applicableRules) {
      if (rule.adjustment.applyTo !== 'TOTAL') continue;
      if (!this.ruleApplies(rule, checkInDate, nights, daysBeforeCheckin, guests)) continue;

      let adj = 0;
      if (rule.adjustment.type === 'PERCENTAGE') {
        adj = subtotal * (rule.adjustment.value / 100);
        subtotal += adj;
      } else if (rule.adjustment.type === 'FIXED') {
        adj = rule.adjustment.value;
        subtotal += adj;
      }

      if (adj !== 0) {
        adjustments.push({
          ruleName: rule.name,
          ruleType: rule.type,
          adjustmentType: rule.adjustment.type,
          amount: Math.round(adj * 100) / 100,
        });
      }
    }

    const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENT * 100) / 100;
    const taxes = Math.round((subtotal + cleaningFee) * TAX_PERCENT * 100) / 100;
    const total = Math.round((subtotal + cleaningFee + serviceFee + taxes) * 100) / 100;

    return {
      baseRate: BASE_NIGHTLY_RATE,
      nights,
      subtotal: Math.round(subtotal * 100) / 100,
      adjustments,
      cleaningFee: Math.round(cleaningFee * 100) / 100,
      serviceFee,
      taxes,
      total,
    };
  }

  // ── Seasonal Calendar ────────────────────────────────────────────────

  async getSeasonalCalendar(
    propertyId: string,
    month: number,
    year: number,
  ): Promise<DailyPrice[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const dailyPrices: DailyPrice[] = [];

    const applicableRules = this.rules
      .filter((r) => r.isActive)
      .filter((r) => !r.propertyId || r.propertyId === propertyId)
      .filter((r) => r.adjustment.applyTo === 'NIGHTLY_RATE')
      .sort((a, b) => b.priority - a.priority);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const daysBeforeCheckin = daysBetween(today, date);
      let price = BASE_NIGHTLY_RATE;
      const appliedRules: string[] = [];

      for (const rule of applicableRules) {
        if (!this.ruleApplies(rule, date, 1, daysBeforeCheckin, 2)) continue;

        if (rule.adjustment.type === 'PERCENTAGE') {
          price += price * (rule.adjustment.value / 100);
        } else if (rule.adjustment.type === 'FIXED') {
          price += rule.adjustment.value;
        } else if (rule.adjustment.type === 'OVERRIDE') {
          price = rule.adjustment.value;
        }

        appliedRules.push(rule.name);
      }

      dailyPrices.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        price: Math.round(price * 100) / 100,
        appliedRules,
      });
    }

    return dailyPrices;
  }

  // ── Simulate Pricing ────────────────────────────────────────────────

  async simulatePricing(
    propertyId: string,
    scenarios: SimulationScenario[],
  ): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const scenario of scenarios) {
      const withRules = await this.calculatePrice(
        propertyId,
        scenario.checkIn,
        scenario.checkOut,
        scenario.guests,
      );

      // Calculate without rules
      const checkInDate = new Date(scenario.checkIn);
      const checkOutDate = new Date(scenario.checkOut);
      const nights = daysBetween(checkInDate, checkOutDate);
      const subtotal = BASE_NIGHTLY_RATE * nights;
      const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENT * 100) / 100;
      const taxes = Math.round((subtotal + CLEANING_FEE) * TAX_PERCENT * 100) / 100;

      const withoutRules: PriceBreakdown = {
        baseRate: BASE_NIGHTLY_RATE,
        nights,
        subtotal,
        adjustments: [],
        cleaningFee: CLEANING_FEE,
        serviceFee,
        taxes,
        total: Math.round((subtotal + CLEANING_FEE + serviceFee + taxes) * 100) / 100,
      };

      results.push({ scenario, withRules, withoutRules });
    }

    return results;
  }

  // ── Private Helpers ─────────────────────────────────────────────────

  private ruleApplies(
    rule: PricingRule,
    date: Date,
    nights: number,
    daysBeforeCheckin: number,
    _guests: number,
  ): boolean {
    const c = rule.conditions;

    // Date range (seasonal)
    if (c.dateRange) {
      if (!dateInRange(date, c.dateRange.start, c.dateRange.end)) {
        return false;
      }
    }

    // Day of week
    if (c.daysOfWeek && c.daysOfWeek.length > 0) {
      if (!c.daysOfWeek.includes(date.getDay())) {
        return false;
      }
    }

    // Length of stay
    if (c.minNights !== undefined && nights < c.minNights) {
      return false;
    }
    if (c.maxNights !== undefined && nights > c.maxNights) {
      return false;
    }

    // Days before checkin
    if (c.minDaysBeforeCheckin !== undefined && daysBeforeCheckin < c.minDaysBeforeCheckin) {
      return false;
    }
    if (c.maxDaysBeforeCheckin !== undefined && daysBeforeCheckin > c.maxDaysBeforeCheckin) {
      return false;
    }

    // Occupancy (simulated)
    if (c.minOccupancyPercent !== undefined && DEFAULT_OCCUPANCY < c.minOccupancyPercent) {
      return false;
    }
    if (c.maxOccupancyPercent !== undefined && DEFAULT_OCCUPANCY > c.maxOccupancyPercent) {
      return false;
    }

    return true;
  }
}

export const pricingService = new PricingService();
