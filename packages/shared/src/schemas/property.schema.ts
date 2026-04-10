import { z } from 'zod';
import { PropertyType, PropertyStatus } from '../types/property.types';

export const createPropertySchema = z.object({
  ownerId: z.string().uuid('Invalid owner ID'),
  internalCode: z.string().min(1, 'Internal code is required').max(50),
  name: z.string().min(1, 'Property name is required').max(200),
  description: z.record(z.string(), z.string()).optional(),
  propertyType: z.nativeEnum(PropertyType),
  addressLine1: z.string().min(1, 'Address is required').max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(1, 'City is required').max(200),
  stateRegion: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(2, 'Country is required').max(2),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  maxGuests: z.number().int().min(1).max(100),
  areaSqm: z.number().positive().optional(),
  floor: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  houseRules: z.record(z.string(), z.string()).optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format').default('15:00'),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:MM format').default('11:00'),
  minStayNights: z.number().int().min(1).default(1),
  baseNightlyRate: z.number().positive('Nightly rate must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  cleaningFee: z.number().min(0).default(0),
  managementFeePercent: z.number().min(0).max(100).optional(),
  minimumMonthlyFee: z.number().min(0).optional(),
  icalImportUrl: z.string().url().optional(),
  wifiName: z.string().max(200).optional(),
});

export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().uuid('Invalid property ID'),
  status: z.nativeEnum(PropertyStatus).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
