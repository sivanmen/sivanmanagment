export enum LoyaltyTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
  BONUS = 'BONUS',
}

export enum BenefitType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  FREE_NIGHT = 'FREE_NIGHT',
  UPGRADE = 'UPGRADE',
  EARLY_CHECKIN = 'EARLY_CHECKIN',
  LATE_CHECKOUT = 'LATE_CHECKOUT',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  CUSTOM = 'CUSTOM',
}

export interface StarsTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  multiplier: number;
  color: string;
  icon?: string;
  benefits: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyMember {
  id: string;
  guestId: string;
  tierId: string;
  currentPoints: number;
  lifetimePoints: number;
  tierExpiresAt?: string;
  enrolledAt: string;
  lastActivityAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  memberId: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  bookingId?: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

export interface LoyaltyBenefit {
  id: string;
  tierId: string;
  type: BenefitType;
  name: string;
  description: string;
  value?: number;
  pointsCost?: number;
  isAutoApplied: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRedemption {
  id: string;
  memberId: string;
  benefitId: string;
  bookingId?: string;
  pointsSpent: number;
  monetaryValue: number;
  currency: string;
  status: 'PENDING' | 'APPLIED' | 'CANCELLED';
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}
