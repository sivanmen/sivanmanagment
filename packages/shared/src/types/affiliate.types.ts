export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  TIERED = 'TIERED',
}

export enum AffiliateStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  CONVERTED = 'CONVERTED',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface AffiliateProfile {
  id: string;
  userId: string;
  affiliateCode: string;
  status: AffiliateStatus;
  commissionType: CommissionType;
  commissionRate: number;
  payoutThreshold: number;
  currency: string;
  totalReferrals: number;
  totalConversions: number;
  totalEarnings: number;
  pendingEarnings: number;
  website?: string;
  socialMedia?: Record<string, string>;
  notes?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referralCode: string;
  status: ReferralStatus;
  guestId?: string;
  bookingId?: string;
  clickedAt: string;
  convertedAt?: string;
  bookingAmount?: number;
  commissionAmount?: number;
  currency: string;
  paidAt?: string;
  paymentReference?: string;
  ipAddress?: string;
  userAgent?: string;
  landingPage?: string;
  createdAt: string;
  updatedAt: string;
}
