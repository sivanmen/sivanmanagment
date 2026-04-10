export enum OTAChannel {
  AIRBNB = 'AIRBNB',
  BOOKING_COM = 'BOOKING_COM',
  VRBO = 'VRBO',
  EXPEDIA = 'EXPEDIA',
  DIRECT = 'DIRECT',
  CUSTOM = 'CUSTOM',
}

export interface ChannelConnection {
  id: string;
  propertyId: string;
  channel: OTAChannel;
  externalPropertyId?: string;
  externalListingUrl?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  syncError?: string;
  apiKey?: string;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  baseRate: number;
  currency: string;
  minStay: number;
  maxStay?: number;
  isDefault: boolean;
  channels: OTAChannel[];
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonalRate {
  id: string;
  propertyId: string;
  ratePlanId?: string;
  name: string;
  startDate: string;
  endDate: string;
  nightlyRate: number;
  minimumStay: number;
  currency: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
