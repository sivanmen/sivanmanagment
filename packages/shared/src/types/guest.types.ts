export enum ScreeningStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

export interface GuestProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  idNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  preferredLanguage?: string;
  notes?: string;
  totalBookings: number;
  totalSpent: number;
  averageRating?: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestScreening {
  id: string;
  guestId: string;
  bookingId: string;
  status: ScreeningStatus;
  idVerified: boolean;
  idDocumentUrl?: string;
  selfieUrl?: string;
  riskScore?: number;
  flags: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
