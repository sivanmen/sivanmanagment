import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

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

// ── Constants ─────────────────────────────────────────────────────────────

const SERVICE_FEE_PERCENT = 0.05;
const TAX_PERCENT = 0.13;

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── SystemSetting key for pricing rules ────────────────────────────────────
// We store complex pricing rules (with conditions, adjustments, type)
// in SystemSetting as JSON, keyed by "pricing_rules.{ruleId}".
// SeasonalRate + RatePlan from DB are also loaded and merged.

const PRICING_RULES_KEY = 'pricing_rules.all';

/**
 * Load custom pricing rules stored in SystemSetting.
 * These cover advanced types: DAY_OF_WEEK, LENGTH_OF_STAY, LAST_MINUTE,
 * EARLY_BIRD, OCCUPANCY, CUSTOM, and SEASONAL rules with month-day ranges.
 */
async function loadCustomRules(): Promise<PricingRule[]> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: PRICING_RULES_KEY },
  });
  if (!row) return [];
  try {
    return JSON.parse(row.value) as PricingRule[];
  } catch {
    return [];
  }
}

async function saveCustomRules(rules: PricingRule[]): Promise<void> {
  const value = JSON.stringify(rules);
  await prisma.systemSetting.upsert({
    where: { key: PRICING_RULES_KEY },
    create: {
      key: PRICING_RULES_KEY,
      value,
      category: 'pricing',
      label: 'Custom pricing rules',
    },
    update: { value },
  });
}

/**
 * Convert DB SeasonalRate records into PricingRule shape so they
 * can be used uniformly in the calculation engine.
 */
function seasonalRatesToPricingRules(
  rates: {
    id: string;
    propertyId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    nightlyRate: Prisma.Decimal;
    minStay: number | null;
    priority: number;
    createdAt: Date;
  }[],
): PricingRule[] {
  return rates.map((sr) => ({
    id: sr.id,
    propertyId: sr.propertyId,
    name: sr.name,
    type: 'SEASONAL' as PricingRuleType,
    priority: sr.priority,
    isActive: true,
    conditions: {
      dateRange: {
        start: `${String(sr.startDate.getMonth() + 1).padStart(2, '0')}-${String(sr.startDate.getDate()).padStart(2, '0')}`,
        end: `${String(sr.endDate.getMonth() + 1).padStart(2, '0')}-${String(sr.endDate.getDate()).padStart(2, '0')}`,
      },
    },
    adjustment: {
      type: 'OVERRIDE' as const,
      value: Number(sr.nightlyRate),
      applyTo: 'NIGHTLY_RATE' as const,
    },
    validFrom: sr.startDate.toISOString().split('T')[0],
    validTo: sr.endDate.toISOString().split('T')[0],
    createdAt: sr.createdAt,
  }));
}

/**
 * Convert DB RatePlan records into PricingRule shape.
 */
function ratePlansToPricingRules(
  plans: {
    id: string;
    propertyId: string;
    name: string;
    type: string;
    baseRate: Prisma.Decimal;
    minStay: number;
    maxStay: number | null;
    isActive: boolean;
    validFrom: Date | null;
    validTo: Date | null;
    createdAt: Date;
  }[],
): PricingRule[] {
  return plans
    .filter((p) => p.isActive)
    .map((rp) => {
      let ruleType: PricingRuleType = 'CUSTOM';
      const conditions: PricingCondition = {};

      switch (rp.type) {
        case 'WEEKEND':
          ruleType = 'DAY_OF_WEEK';
          conditions.daysOfWeek = [5, 6]; // Friday, Saturday
          break;
        case 'WEEKLY':
          ruleType = 'LENGTH_OF_STAY';
          conditions.minNights = 7;
          break;
        case 'MONTHLY':
          ruleType = 'LENGTH_OF_STAY';
          conditions.minNights = 28;
          break;
        case 'LAST_MINUTE':
          ruleType = 'LAST_MINUTE';
          conditions.maxDaysBeforeCheckin = 3;
          break;
        case 'EARLY_BIRD':
          ruleType = 'EARLY_BIRD';
          conditions.minDaysBeforeCheckin = 30;
          break;
        default:
          ruleType = 'CUSTOM';
      }

      if (rp.minStay > 1) conditions.minNights = rp.minStay;
      if (rp.maxStay) conditions.maxNights = rp.maxStay;

      return {
        id: rp.id,
        propertyId: rp.propertyId,
        name: rp.name,
        type: ruleType,
        priority: 50,
        isActive: rp.isActive,
        conditions,
        adjustment: {
          type: 'OVERRIDE' as const,
          value: Number(rp.baseRate),
          applyTo: 'NIGHTLY_RATE' as const,
        },
        validFrom: rp.validFrom?.toISOString().split('T')[0],
        validTo: rp.validTo?.toISOString().split('T')[0],
        createdAt: rp.createdAt,
      };
    });
}

/**
 * Load all pricing rules: custom rules from SystemSetting + SeasonalRate + RatePlan from DB.
 */
async function loadAllRules(propertyId?: string): Promise<PricingRule[]> {
  const customRules = await loadCustomRules();

  // Fetch SeasonalRate records from DB
  const srWhere: Prisma.SeasonalRateWhereInput = {};
  if (propertyId) srWhere.propertyId = propertyId;

  const seasonalRates = await prisma.seasonalRate.findMany({ where: srWhere });
  const srRules = seasonalRatesToPricingRules(seasonalRates);

  // Fetch RatePlan records from DB
  const rpWhere: Prisma.RatePlanWhereInput = { isActive: true };
  if (propertyId) rpWhere.propertyId = propertyId;

  const ratePlans = await prisma.ratePlan.findMany({ where: rpWhere });
  const rpRules = ratePlansToPricingRules(ratePlans);

  // Merge: custom rules, then DB-sourced rules
  // De-duplicate by id
  const allRules = [...customRules, ...srRules, ...rpRules];
  const seen = new Set<string>();
  const deduped: PricingRule[] = [];
  for (const rule of allRules) {
    if (!seen.has(rule.id)) {
      seen.add(rule.id);
      deduped.push(rule);
    }
  }

  // Filter by propertyId if needed
  let result = deduped;
  if (propertyId) {
    result = result.filter((r) => !r.propertyId || r.propertyId === propertyId);
  }

  return result.sort((a, b) => b.priority - a.priority);
}

/**
 * Get the base nightly rate and cleaning fee for a property.
 */
async function getPropertyRates(propertyId: string): Promise<{
  baseRate: number;
  cleaningFee: number;
}> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { baseNightlyRate: true, cleaningFee: true },
  });
  if (property) {
    return {
      baseRate: Number(property.baseNightlyRate),
      cleaningFee: Number(property.cleaningFee),
    };
  }
  // Fallback defaults
  return { baseRate: 150, cleaningFee: 80 };
}

/**
 * Estimate current occupancy % for a property (last 30 days).
 */
async function getOccupancyPercent(propertyId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      checkIn: { lte: now },
      checkOut: { gte: thirtyDaysAgo },
    },
    select: { checkIn: true, checkOut: true },
  });

  let occupiedDays = 0;
  for (const b of bookings) {
    const start = b.checkIn > thirtyDaysAgo ? b.checkIn : thirtyDaysAgo;
    const end = b.checkOut < now ? b.checkOut : now;
    const days = daysBetween(start, end);
    if (days > 0) occupiedDays += days;
  }

  return Math.round((occupiedDays / 30) * 100);
}

// ── Service ─────────────────────────────────────────────────────────────────

export class PricingService {
  // ── CRUD ────────────────────────────────────────────────────────────────

  async getAllRules(propertyId?: string): Promise<PricingRule[]> {
    return loadAllRules(propertyId);
  }

  async getRuleById(id: string): Promise<PricingRule> {
    // Check custom rules first
    const customRules = await loadCustomRules();
    const custom = customRules.find((r) => r.id === id);
    if (custom) return custom;

    // Check SeasonalRate
    const sr = await prisma.seasonalRate.findUnique({ where: { id } });
    if (sr) {
      return seasonalRatesToPricingRules([sr])[0];
    }

    // Check RatePlan
    const rp = await prisma.ratePlan.findUnique({ where: { id } });
    if (rp) {
      return ratePlansToPricingRules([rp])[0];
    }

    throw ApiError.notFound('PricingRule');
  }

  async createRule(data: CreatePricingRuleInput): Promise<PricingRule> {
    // For SEASONAL type with full date range (YYYY-MM-DD), create a SeasonalRate in DB
    if (
      data.type === 'SEASONAL' &&
      data.adjustment.applyTo === 'NIGHTLY_RATE' &&
      data.adjustment.type === 'OVERRIDE' &&
      data.validFrom &&
      data.validTo &&
      data.propertyId
    ) {
      const sr = await prisma.seasonalRate.create({
        data: {
          propertyId: data.propertyId,
          name: data.name,
          startDate: new Date(data.validFrom),
          endDate: new Date(data.validTo),
          nightlyRate: data.adjustment.value,
          minStay: data.conditions.minNights || null,
          priority: data.priority,
        },
      });
      return seasonalRatesToPricingRules([sr])[0];
    }

    // For everything else, store as a custom rule in SystemSetting
    const customRules = await loadCustomRules();
    const rule: PricingRule = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    customRules.push(rule);
    await saveCustomRules(customRules);
    return rule;
  }

  async updateRule(id: string, data: UpdatePricingRuleInput): Promise<PricingRule> {
    // Try custom rules first
    const customRules = await loadCustomRules();
    const customIdx = customRules.findIndex((r) => r.id === id);

    if (customIdx !== -1) {
      customRules[customIdx] = { ...customRules[customIdx], ...data };
      await saveCustomRules(customRules);
      return customRules[customIdx];
    }

    // Try SeasonalRate
    const sr = await prisma.seasonalRate.findUnique({ where: { id } });
    if (sr) {
      const updateData: Prisma.SeasonalRateUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.conditions?.minNights !== undefined) updateData.minStay = data.conditions.minNights;
      if (data.validFrom) updateData.startDate = new Date(data.validFrom);
      if (data.validTo) updateData.endDate = new Date(data.validTo);
      if (data.adjustment?.value !== undefined) updateData.nightlyRate = data.adjustment.value;

      const updated = await prisma.seasonalRate.update({
        where: { id },
        data: updateData,
      });
      return seasonalRatesToPricingRules([updated])[0];
    }

    // Try RatePlan
    const rp = await prisma.ratePlan.findUnique({ where: { id } });
    if (rp) {
      const updateData: Prisma.RatePlanUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.adjustment?.value !== undefined) updateData.baseRate = data.adjustment.value;
      if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
      if (data.validTo) updateData.validTo = new Date(data.validTo);
      if (data.conditions?.minNights !== undefined) updateData.minStay = data.conditions.minNights;
      if (data.conditions?.maxNights !== undefined) updateData.maxStay = data.conditions.maxNights;

      const updated = await prisma.ratePlan.update({
        where: { id },
        data: updateData,
      });
      return ratePlansToPricingRules([updated])[0];
    }

    throw ApiError.notFound('PricingRule');
  }

  async deleteRule(id: string): Promise<{ message: string }> {
    // Try custom rules first
    const customRules = await loadCustomRules();
    const customIdx = customRules.findIndex((r) => r.id === id);

    if (customIdx !== -1) {
      customRules.splice(customIdx, 1);
      await saveCustomRules(customRules);
      return { message: 'Pricing rule deleted successfully' };
    }

    // Try SeasonalRate
    const sr = await prisma.seasonalRate.findUnique({ where: { id } });
    if (sr) {
      await prisma.seasonalRate.delete({ where: { id } });
      return { message: 'Pricing rule deleted successfully' };
    }

    // Try RatePlan
    const rp = await prisma.ratePlan.findUnique({ where: { id } });
    if (rp) {
      await prisma.ratePlan.delete({ where: { id } });
      return { message: 'Pricing rule deleted successfully' };
    }

    throw ApiError.notFound('PricingRule');
  }

  async toggleRule(id: string): Promise<PricingRule> {
    // Try custom rules first
    const customRules = await loadCustomRules();
    const customIdx = customRules.findIndex((r) => r.id === id);

    if (customIdx !== -1) {
      customRules[customIdx].isActive = !customRules[customIdx].isActive;
      await saveCustomRules(customRules);
      return customRules[customIdx];
    }

    // Try RatePlan (has isActive field)
    const rp = await prisma.ratePlan.findUnique({ where: { id } });
    if (rp) {
      const updated = await prisma.ratePlan.update({
        where: { id },
        data: { isActive: !rp.isActive },
      });
      return ratePlansToPricingRules([updated])[0];
    }

    // SeasonalRate doesn't have isActive, so we handle it via custom rules:
    // If found, we copy it into custom rules where isActive can be toggled
    const sr = await prisma.seasonalRate.findUnique({ where: { id } });
    if (sr) {
      // Convert to custom rule with isActive = false and remove from DB
      const asRule = seasonalRatesToPricingRules([sr])[0];
      asRule.isActive = false;
      customRules.push(asRule);
      await saveCustomRules(customRules);
      await prisma.seasonalRate.delete({ where: { id } });
      return asRule;
    }

    throw ApiError.notFound('PricingRule');
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

    const { baseRate, cleaningFee: propertyCleaningFee } = await getPropertyRates(propertyId);
    const daysBeforeCheckin = daysBetween(new Date(), checkInDate);
    const occupancyPercent = await getOccupancyPercent(propertyId);

    // Get applicable rules sorted by priority (highest first)
    const allRules = await loadAllRules(propertyId);
    const applicableRules = allRules.filter((r) => r.isActive);

    // Calculate nightly rates for each day
    let totalNightlyAmount = 0;
    const adjustments: PriceAdjustmentDetail[] = [];
    const nightlyAdjustmentTotals: Record<string, number> = {};

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(currentDate.getDate() + i);
      let nightRate = baseRate;

      for (const rule of applicableRules) {
        if (rule.adjustment.applyTo !== 'NIGHTLY_RATE') continue;
        if (!this.ruleApplies(rule, currentDate, nights, daysBeforeCheckin, guests, occupancyPercent))
          continue;

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
          nightlyAdjustmentTotals[rule.name] =
            (nightlyAdjustmentTotals[rule.name] || 0) + adj;
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
    let cleaningFee = propertyCleaningFee;
    for (const rule of applicableRules) {
      if (rule.adjustment.applyTo !== 'CLEANING_FEE') continue;
      if (
        !this.ruleApplies(rule, checkInDate, nights, daysBeforeCheckin, guests, occupancyPercent)
      )
        continue;

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
      if (
        !this.ruleApplies(rule, checkInDate, nights, daysBeforeCheckin, guests, occupancyPercent)
      )
        continue;

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
      baseRate,
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

    const { baseRate } = await getPropertyRates(propertyId);
    const occupancyPercent = await getOccupancyPercent(propertyId);

    const allRules = await loadAllRules(propertyId);
    const applicableRules = allRules
      .filter((r) => r.isActive)
      .filter((r) => r.adjustment.applyTo === 'NIGHTLY_RATE');

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const daysBeforeCheckin = daysBetween(today, date);
      let price = baseRate;
      const appliedRules: string[] = [];

      for (const rule of applicableRules) {
        if (!this.ruleApplies(rule, date, 1, daysBeforeCheckin, 2, occupancyPercent)) continue;

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
    const { baseRate, cleaningFee } = await getPropertyRates(propertyId);

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
      const subtotal = baseRate * nights;
      const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENT * 100) / 100;
      const taxes = Math.round((subtotal + cleaningFee) * TAX_PERCENT * 100) / 100;

      const withoutRules: PriceBreakdown = {
        baseRate,
        nights,
        subtotal,
        adjustments: [],
        cleaningFee,
        serviceFee,
        taxes,
        total: Math.round((subtotal + cleaningFee + serviceFee + taxes) * 100) / 100,
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
    occupancyPercent: number = 65,
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

    // Occupancy (real data from DB)
    if (c.minOccupancyPercent !== undefined && occupancyPercent < c.minOccupancyPercent) {
      return false;
    }
    if (c.maxOccupancyPercent !== undefined && occupancyPercent > c.maxOccupancyPercent) {
      return false;
    }

    return true;
  }
}

export const pricingService = new PricingService();
