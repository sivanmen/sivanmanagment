export enum PropertyType {
  VILLA = 'VILLA',
  APARTMENT = 'APARTMENT',
  STUDIO = 'STUDIO',
  HOUSE = 'HOUSE',
  BUILDING = 'BUILDING',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ONBOARDING = 'ONBOARDING',
  MAINTENANCE = 'MAINTENANCE',
  ARCHIVED = 'ARCHIVED',
}

export interface Property {
  id: string;
  ownerId: string;
  internalCode: string;
  name: string;
  slug: string;
  description: Record<string, string>; // multilingual JSON { en: "...", he: "...", ... }
  propertyType: PropertyType;
  status: PropertyStatus;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateRegion?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  areaSqm?: number;
  floor?: number;
  amenities: string[];
  houseRules: Record<string, string>; // multilingual JSON
  checkInTime: string;
  checkOutTime: string;
  minStayNights: number;
  baseNightlyRate: number;
  currency: string;
  cleaningFee: number;
  managementFeePercent: number;
  minimumMonthlyFee: number;
  propertyScore?: number;
  icalImportUrl?: string;
  wifiName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  caption?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface PropertyUnit {
  id: string;
  propertyId: string;
  unitCode: string;
  unitName: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  areaSqm?: number;
  baseNightlyRate: number;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyRequest {
  ownerId: string;
  internalCode: string;
  name: string;
  description?: Record<string, string>;
  propertyType: PropertyType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateRegion?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  areaSqm?: number;
  floor?: number;
  amenities?: string[];
  houseRules?: Record<string, string>;
  checkInTime?: string;
  checkOutTime?: string;
  minStayNights?: number;
  baseNightlyRate: number;
  currency: string;
  cleaningFee?: number;
  managementFeePercent?: number;
  minimumMonthlyFee?: number;
  icalImportUrl?: string;
  wifiName?: string;
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string;
}
