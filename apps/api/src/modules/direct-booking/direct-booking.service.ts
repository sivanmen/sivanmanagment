import { ApiError } from '../../utils/api-error';

interface BookableProperty {
  id: string;
  name: string;
  slug: string;
  type: 'VILLA' | 'APARTMENT' | 'HOUSE';
  location: string;
  city: string;
  country: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  images: string[];
  basePrice: number;
  cleaningFee: number;
  currency: string;
  minNights: number;
  maxNights: number;
  checkInTime: string;
  checkOutTime: string;
  instantBook: boolean;
  isActive: boolean;
}

interface Availability {
  propertyId: string;
  date: string;
  isAvailable: boolean;
  price: number;
  minNights: number;
}

interface DirectBooking {
  id: string;
  propertyId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country?: string;
  };
  pricing: {
    nightlyRate: number;
    nightsTotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };
  paymentIntentId?: string;
  paymentStatus: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  specialRequests?: string;
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
}

const properties: BookableProperty[] = [
  {
    id: 'prop-001',
    name: 'Villa Elounda Seafront',
    slug: 'villa-elounda-seafront',
    type: 'VILLA',
    location: 'Elounda, Lasithi',
    city: 'Elounda',
    country: 'Greece',
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    description: 'Stunning seafront villa with panoramic views of Mirabello Bay. Private pool, spacious terraces, and direct beach access. Perfect for families and groups seeking a luxurious Cretan getaway.',
    amenities: ['Pool', 'WiFi', 'AC', 'Parking', 'Beach Access', 'BBQ', 'Dishwasher', 'Washer', 'Sea View', 'Garden'],
    images: ['/images/elounda-1.jpg', '/images/elounda-2.jpg', '/images/elounda-3.jpg'],
    basePrice: 280,
    cleaningFee: 150,
    currency: 'EUR',
    minNights: 3,
    maxNights: 30,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    instantBook: true,
    isActive: true,
  },
  {
    id: 'prop-002',
    name: 'Chania Old Town Apt',
    slug: 'chania-old-town-apt',
    type: 'APARTMENT',
    location: 'Old Town, Chania',
    city: 'Chania',
    country: 'Greece',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    description: 'Charming apartment in the heart of Chania Old Town. Steps from the Venetian harbor, restaurants, and shops. Beautifully restored with traditional Cretan stone walls and modern amenities.',
    amenities: ['WiFi', 'AC', 'Kitchen', 'Washer', 'Balcony', 'City View', 'Historic Area'],
    images: ['/images/chania-1.jpg', '/images/chania-2.jpg'],
    basePrice: 120,
    cleaningFee: 80,
    currency: 'EUR',
    minNights: 2,
    maxNights: 21,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    instantBook: true,
    isActive: true,
  },
  {
    id: 'prop-003',
    name: 'Rethymno Beach House',
    slug: 'rethymno-beach-house',
    type: 'HOUSE',
    location: 'Rethymno Beach',
    city: 'Rethymno',
    country: 'Greece',
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    description: 'Beautiful beach house just 50m from the sandy shore. Open-plan living, fully equipped kitchen, and a lovely courtyard garden. Ideal for beach lovers and families.',
    amenities: ['WiFi', 'AC', 'Garden', 'Parking', 'Beach Nearby', 'BBQ', 'Outdoor Shower', 'Pets Allowed'],
    images: ['/images/rethymno-1.jpg', '/images/rethymno-2.jpg', '/images/rethymno-3.jpg'],
    basePrice: 180,
    cleaningFee: 100,
    currency: 'EUR',
    minNights: 3,
    maxNights: 28,
    checkInTime: '15:00',
    checkOutTime: '10:00',
    instantBook: false,
    isActive: true,
  },
];

// Generate availability for the next 90 days
function generateAvailability(): Availability[] {
  const avail: Availability[] = [];
  const now = new Date();
  for (const prop of properties) {
    for (let d = 0; d < 90; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      // Simulate some dates being booked
      const isBooked = (d >= 5 && d <= 9) || (d >= 25 && d <= 28);
      // Seasonal pricing: summer months get a premium
      const month = date.getMonth();
      const seasonMultiplier = (month >= 5 && month <= 8) ? 1.4 : (month >= 3 && month <= 4 || month >= 9 && month <= 10) ? 1.15 : 1.0;
      avail.push({
        propertyId: prop.id,
        date: dateStr,
        isAvailable: !isBooked,
        price: Math.round(prop.basePrice * seasonMultiplier),
        minNights: prop.minNights,
      });
    }
  }
  return avail;
}

const availability: Availability[] = generateAvailability();
const bookings: DirectBooking[] = [];
let bookingCounter = 1;

export class DirectBookingService {
  // ── Public endpoints (no auth) ──

  async searchProperties(filters: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    type?: string;
    amenities?: string[];
    page?: number;
    limit?: number;
  }) {
    const { city, checkIn, checkOut, guests, minPrice, maxPrice, type, amenities, page = 1, limit = 20 } = filters;

    let filtered = properties.filter((p) => p.isActive);
    if (city) filtered = filtered.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    if (guests) filtered = filtered.filter((p) => p.maxGuests >= guests);
    if (type) filtered = filtered.filter((p) => p.type === type);
    if (minPrice) filtered = filtered.filter((p) => p.basePrice >= minPrice);
    if (maxPrice) filtered = filtered.filter((p) => p.basePrice <= maxPrice);
    if (amenities && amenities.length > 0) {
      filtered = filtered.filter((p) =>
        amenities.every((a) => p.amenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))),
      );
    }

    // Check availability for date range
    if (checkIn && checkOut) {
      filtered = filtered.filter((p) => {
        const propAvail = availability.filter((a) => a.propertyId === p.id && a.date >= checkIn && a.date < checkOut);
        return propAvail.length > 0 && propAvail.every((a) => a.isAvailable);
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { properties: items, total, page, limit };
  }

  async getPropertyDetails(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId && p.isActive);
    if (!property) throw ApiError.notFound('Property');
    return property;
  }

  async checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) throw ApiError.notFound('Property');

    const dates = availability.filter(
      (a) => a.propertyId === propertyId && a.date >= checkIn && a.date < checkOut,
    );

    const allAvailable = dates.length > 0 && dates.every((d) => d.isAvailable);
    const nights = dates.length;

    if (nights < property.minNights) {
      return { available: false, reason: `Minimum stay is ${property.minNights} nights`, nights, dates };
    }

    return {
      available: allAvailable,
      nights,
      dates,
      minNights: property.minNights,
      checkInTime: property.checkInTime,
      checkOutTime: property.checkOutTime,
    };
  }

  async calculatePrice(propertyId: string, checkIn: string, checkOut: string, guests: number) {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) throw ApiError.notFound('Property');

    const dates = availability.filter(
      (a) => a.propertyId === propertyId && a.date >= checkIn && a.date < checkOut,
    );

    if (dates.length === 0) throw ApiError.badRequest('No dates in the selected range');

    const nightsTotal = dates.reduce((sum, d) => sum + d.price, 0);
    const cleaningFee = property.cleaningFee;
    const serviceFee = Math.round(nightsTotal * 0.08); // 8% service fee
    const subtotal = nightsTotal + cleaningFee + serviceFee;
    const taxAmount = Math.round(subtotal * 0.13); // 13% Greek accommodation tax
    const totalAmount = subtotal + taxAmount;

    return {
      propertyId,
      propertyName: property.name,
      checkIn,
      checkOut,
      nights: dates.length,
      guests,
      breakdown: {
        nightlyRates: dates.map((d) => ({ date: d.date, price: d.price })),
        nightsTotal,
        cleaningFee,
        serviceFee,
        taxAmount,
        totalAmount,
        currency: property.currency,
      },
    };
  }

  async createBooking(data: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country?: string;
    };
    specialRequests?: string;
  }) {
    const property = properties.find((p) => p.id === data.propertyId);
    if (!property) throw ApiError.notFound('Property');

    // Check availability
    const availCheck = await this.checkAvailability(data.propertyId, data.checkIn, data.checkOut);
    if (!availCheck.available) throw ApiError.badRequest('Selected dates are not available');
    if (data.guests > property.maxGuests) throw ApiError.badRequest(`Maximum ${property.maxGuests} guests allowed`);

    // Calculate pricing
    const priceCalc = await this.calculatePrice(data.propertyId, data.checkIn, data.checkOut, data.guests);

    const confirmationCode = `SVM-${String(bookingCounter).padStart(5, '0')}`;
    const booking: DirectBooking = {
      id: `db-${String(bookingCounter).padStart(3, '0')}`,
      propertyId: data.propertyId,
      propertyName: property.name,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: priceCalc.nights,
      guests: data.guests,
      guestDetails: data.guestDetails,
      pricing: {
        nightlyRate: Math.round(priceCalc.breakdown.nightsTotal / priceCalc.nights),
        nightsTotal: priceCalc.breakdown.nightsTotal,
        cleaningFee: priceCalc.breakdown.cleaningFee,
        serviceFee: priceCalc.breakdown.serviceFee,
        taxAmount: priceCalc.breakdown.taxAmount,
        totalAmount: priceCalc.breakdown.totalAmount,
        currency: priceCalc.breakdown.currency,
      },
      paymentStatus: 'PENDING',
      bookingStatus: property.instantBook ? 'CONFIRMED' : 'PENDING',
      specialRequests: data.specialRequests,
      confirmationCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookingCounter++;
    bookings.push(booking);

    // Mark dates as unavailable
    for (const a of availability) {
      if (a.propertyId === data.propertyId && a.date >= data.checkIn && a.date < data.checkOut) {
        a.isAvailable = false;
      }
    }

    return booking;
  }

  async createPaymentIntent(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw ApiError.notFound('Booking');
    if (booking.paymentStatus !== 'PENDING') throw ApiError.badRequest('Payment already processed');

    // Simulate Stripe payment intent creation
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    booking.paymentIntentId = paymentIntentId;
    booking.paymentStatus = 'AUTHORIZED';
    booking.updatedAt = new Date().toISOString();

    return {
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`,
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      bookingId: booking.id,
    };
  }

  async getBookingConfirmation(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw ApiError.notFound('Booking');

    const property = properties.find((p) => p.id === booking.propertyId);

    return {
      booking,
      property: property
        ? {
            name: property.name,
            location: property.location,
            checkInTime: property.checkInTime,
            checkOutTime: property.checkOutTime,
            amenities: property.amenities,
          }
        : null,
      receipt: {
        confirmationCode: booking.confirmationCode,
        guestName: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        email: booking.guestDetails.email,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        totalAmount: booking.pricing.totalAmount,
        currency: booking.pricing.currency,
        paymentStatus: booking.paymentStatus,
        issuedAt: new Date().toISOString(),
      },
    };
  }

  // ── Admin endpoints (auth required) ──

  async getAllBookings(filters: {
    propertyId?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { propertyId, status, paymentStatus, search, page = 1, limit = 20 } = filters;

    let filtered = [...bookings];
    if (propertyId) filtered = filtered.filter((b) => b.propertyId === propertyId);
    if (status) filtered = filtered.filter((b) => b.bookingStatus === status);
    if (paymentStatus) filtered = filtered.filter((b) => b.paymentStatus === paymentStatus);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.guestDetails.firstName.toLowerCase().includes(q) ||
          b.guestDetails.lastName.toLowerCase().includes(q) ||
          b.guestDetails.email.toLowerCase().includes(q) ||
          b.confirmationCode.toLowerCase().includes(q) ||
          b.propertyName.toLowerCase().includes(q),
      );
    }

    filtered.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { bookings: items, total, page, limit };
  }
}

export const directBookingService = new DirectBookingService();
