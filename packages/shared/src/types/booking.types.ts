export enum BookingSource {
  DIRECT = 'DIRECT',
  AIRBNB = 'AIRBNB',
  BOOKING_COM = 'BOOKING_COM',
  VRBO = 'VRBO',
  ICAL = 'ICAL',
  MANUAL = 'MANUAL',
  WIDGET = 'WIDGET',
}

export enum BookingStatus {
  INQUIRY = 'INQUIRY',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export interface Booking {
  id: string;
  propertyId: string;
  unitId?: string;
  guestId: string;
  source: BookingSource;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  externalBookingId?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  nightlyRate: number;
  totalAccommodation: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  extraCharges: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paidAmount: number;
  balanceDue: number;
  guestNotes?: string;
  internalNotes?: string;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  propertyId: string;
  unitId?: string;
  guestId: string;
  source: BookingSource;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  nightlyRate: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes?: number;
  extraCharges?: number;
  discountAmount?: number;
  currency: string;
  guestNotes?: string;
  internalNotes?: string;
  specialRequests?: string;
  externalBookingId?: string;
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  id: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  cancellationReason?: string;
}
