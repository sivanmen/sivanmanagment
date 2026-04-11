import { ApiError } from '../../utils/api-error';
import { randomUUID } from 'crypto';
import { pricingService, PriceBreakdown } from '../pricing/pricing.service';

// ── Types ───────────────────────────────────────────────────────────────────

export interface GuestQuote {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricing: PriceBreakdown;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'EXPIRED' | 'DECLINED';
  expiresAt: string;
  personalMessage?: string;
  sentAt?: string;
  respondedAt?: string;
  convertedBookingId?: string;
  createdAt: Date;
}

export interface FolioItem {
  id: string;
  type: 'ACCOMMODATION' | 'CLEANING' | 'UPSELL' | 'DAMAGE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT' | 'TAX';
  description: string;
  amount: number;
  date: string;
  category: 'CHARGE' | 'PAYMENT' | 'CREDIT';
}

export interface GuestFolio {
  id: string;
  bookingId: string;
  guestName: string;
  items: FolioItem[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  currency: string;
}

export interface GroupReservation {
  id: string;
  name: string;
  organizer: { name: string; email: string; phone?: string };
  propertyId: string;
  bookingIds: string[];
  totalGuests: number;
  totalAmount: number;
  notes?: string;
  status: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
}

export type QuoteFilters = {
  status?: string;
  propertyId?: string;
};

export type GroupFilters = {
  status?: string;
  propertyId?: string;
};

// ── Seed data ───────────────────────────────────────────────────────────────

const seedQuotes: GuestQuote[] = [
  {
    id: randomUUID(),
    propertyId: 'prop-1',
    guestName: 'Anna Schmidt',
    guestEmail: 'anna.schmidt@gmail.com',
    checkIn: '2026-06-15',
    checkOut: '2026-06-22',
    guests: 4,
    pricing: {
      baseRate: 150,
      nights: 7,
      subtotal: 1050,
      adjustments: [
        { ruleName: 'Weekly Discount', ruleType: 'LENGTH_OF_STAY', adjustmentType: 'PERCENTAGE', amount: -105 },
      ],
      cleaningFee: 80,
      serviceFee: 47.25,
      taxes: 133.25,
      total: 1205.50,
    },
    status: 'SENT',
    expiresAt: '2026-04-20T23:59:59Z',
    personalMessage: 'We would love to host you at our villa in Elounda!',
    sentAt: '2026-04-08T10:00:00Z',
    createdAt: new Date('2026-04-08'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-2',
    guestName: 'James Wilson',
    guestEmail: 'jwilson@outlook.com',
    checkIn: '2026-07-01',
    checkOut: '2026-07-10',
    guests: 2,
    pricing: {
      baseRate: 150,
      nights: 9,
      subtotal: 1755,
      adjustments: [
        { ruleName: 'Summer Peak', ruleType: 'SEASONAL', adjustmentType: 'PERCENTAGE', amount: 405 },
        { ruleName: 'Weekly Discount', ruleType: 'LENGTH_OF_STAY', adjustmentType: 'PERCENTAGE', amount: -135 },
      ],
      cleaningFee: 80,
      serviceFee: 87.75,
      taxes: 238.55,
      total: 2161.30,
    },
    status: 'DRAFT',
    expiresAt: '2026-04-25T23:59:59Z',
    createdAt: new Date('2026-04-10'),
  },
  {
    id: randomUUID(),
    propertyId: 'prop-1',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    checkIn: '2026-05-20',
    checkOut: '2026-05-25',
    guests: 3,
    pricing: {
      baseRate: 150,
      nights: 5,
      subtotal: 750,
      adjustments: [],
      cleaningFee: 80,
      serviceFee: 37.50,
      taxes: 107.90,
      total: 975.40,
    },
    status: 'ACCEPTED',
    expiresAt: '2026-04-15T23:59:59Z',
    sentAt: '2026-04-05T09:00:00Z',
    respondedAt: '2026-04-06T14:30:00Z',
    convertedBookingId: 'bk-2026-0420',
    createdAt: new Date('2026-04-05'),
  },
];

const seedFolios: GuestFolio[] = [
  {
    id: randomUUID(),
    bookingId: 'bk-2026-0401',
    guestName: 'Hans Mueller',
    items: [
      { id: randomUUID(), type: 'ACCOMMODATION', description: '5 nights - Elounda Breeze Villa', amount: 750, date: '2026-04-01', category: 'CHARGE' },
      { id: randomUUID(), type: 'CLEANING', description: 'Cleaning fee', amount: 80, date: '2026-04-01', category: 'CHARGE' },
      { id: randomUUID(), type: 'TAX', description: 'VAT 13%', amount: 107.90, date: '2026-04-01', category: 'CHARGE' },
      { id: randomUUID(), type: 'PAYMENT', description: 'Credit card payment (deposit)', amount: -400, date: '2026-04-02', category: 'PAYMENT' },
      { id: randomUUID(), type: 'UPSELL', description: 'Airport transfer', amount: 65, date: '2026-04-05', category: 'CHARGE' },
      { id: randomUUID(), type: 'PAYMENT', description: 'Credit card payment (balance)', amount: -602.90, date: '2026-04-06', category: 'PAYMENT' },
    ],
    totalCharges: 1002.90,
    totalPayments: 1002.90,
    balance: 0,
    currency: 'EUR',
  },
  {
    id: randomUUID(),
    bookingId: 'bk-2026-0410',
    guestName: 'Sophie Laurent',
    items: [
      { id: randomUUID(), type: 'ACCOMMODATION', description: '3 nights - Rethymno Sunset Apartment', amount: 450, date: '2026-04-10', category: 'CHARGE' },
      { id: randomUUID(), type: 'CLEANING', description: 'Cleaning fee', amount: 80, date: '2026-04-10', category: 'CHARGE' },
      { id: randomUUID(), type: 'TAX', description: 'VAT 13%', amount: 68.90, date: '2026-04-10', category: 'CHARGE' },
      { id: randomUUID(), type: 'PAYMENT', description: 'Bank transfer (full)', amount: -598.90, date: '2026-04-10', category: 'PAYMENT' },
    ],
    totalCharges: 598.90,
    totalPayments: 598.90,
    balance: 0,
    currency: 'EUR',
  },
];

const seedGroups: GroupReservation[] = [
  {
    id: randomUUID(),
    name: 'Mueller Family Reunion',
    organizer: { name: 'Hans Mueller', email: 'hans.m@email.de', phone: '+49171234567' },
    propertyId: 'prop-1',
    bookingIds: ['bk-2026-0401', 'bk-2026-0402'],
    totalGuests: 8,
    totalAmount: 3200,
    notes: 'Family reunion, need two adjacent properties',
    status: 'CONFIRMED',
    createdAt: new Date('2026-03-15'),
  },
  {
    id: randomUUID(),
    name: 'Corporate Retreat - TechStart GmbH',
    organizer: { name: 'Lisa Weber', email: 'lisa@techstart.de' },
    propertyId: 'prop-2',
    bookingIds: ['bk-2026-0501', 'bk-2026-0502', 'bk-2026-0503'],
    totalGuests: 12,
    totalAmount: 5400,
    notes: 'Corporate retreat, need meeting space nearby',
    status: 'TENTATIVE',
    createdAt: new Date('2026-04-01'),
  },
];

// ── Service ─────────────────────────────────────────────────────────────────

export class BookingExtrasService {
  private quotes: GuestQuote[] = [...seedQuotes];
  private folios: GuestFolio[] = [...seedFolios];
  private groups: GroupReservation[] = [...seedGroups];

  // ── Quotes ──────────────────────────────────────────────────────────

  async createQuote(data: {
    propertyId: string;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    personalMessage?: string;
    expiresAt?: string;
  }): Promise<GuestQuote> {
    const pricing = await pricingService.calculatePrice(
      data.propertyId,
      data.checkIn,
      data.checkOut,
      data.guests,
    );

    const expiresAt =
      data.expiresAt ||
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const quote: GuestQuote = {
      id: randomUUID(),
      propertyId: data.propertyId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      pricing,
      status: 'DRAFT',
      expiresAt,
      personalMessage: data.personalMessage,
      createdAt: new Date(),
    };

    this.quotes.push(quote);
    return quote;
  }

  async getQuotes(filters?: QuoteFilters): Promise<GuestQuote[]> {
    let result = [...this.quotes];
    if (filters?.status) {
      result = result.filter((q) => q.status === filters.status);
    }
    if (filters?.propertyId) {
      result = result.filter((q) => q.propertyId === filters.propertyId);
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getQuoteById(id: string): Promise<GuestQuote> {
    const quote = this.quotes.find((q) => q.id === id);
    if (!quote) {
      throw ApiError.notFound('GuestQuote');
    }
    return quote;
  }

  async sendQuote(id: string): Promise<GuestQuote> {
    const idx = this.quotes.findIndex((q) => q.id === id);
    if (idx === -1) {
      throw ApiError.notFound('GuestQuote');
    }
    if (this.quotes[idx].status !== 'DRAFT') {
      throw ApiError.badRequest('Quote can only be sent from DRAFT status');
    }

    this.quotes[idx].status = 'SENT';
    this.quotes[idx].sentAt = new Date().toISOString();
    return this.quotes[idx];
  }

  async updateQuoteStatus(
    id: string,
    status: GuestQuote['status'],
  ): Promise<GuestQuote> {
    const idx = this.quotes.findIndex((q) => q.id === id);
    if (idx === -1) {
      throw ApiError.notFound('GuestQuote');
    }

    this.quotes[idx].status = status;
    if (['ACCEPTED', 'DECLINED', 'EXPIRED'].includes(status)) {
      this.quotes[idx].respondedAt = new Date().toISOString();
    }
    return this.quotes[idx];
  }

  async convertQuoteToBooking(id: string): Promise<GuestQuote> {
    const idx = this.quotes.findIndex((q) => q.id === id);
    if (idx === -1) {
      throw ApiError.notFound('GuestQuote');
    }

    this.quotes[idx].status = 'ACCEPTED';
    this.quotes[idx].respondedAt = new Date().toISOString();
    this.quotes[idx].convertedBookingId = `bk-${Date.now()}`;
    return this.quotes[idx];
  }

  // ── Folio ───────────────────────────────────────────────────────────

  async getFolio(bookingId: string): Promise<GuestFolio> {
    const folio = this.folios.find((f) => f.bookingId === bookingId);
    if (!folio) {
      // Return an empty folio
      return {
        id: randomUUID(),
        bookingId,
        guestName: 'Guest',
        items: [],
        totalCharges: 0,
        totalPayments: 0,
        balance: 0,
        currency: 'EUR',
      };
    }
    return folio;
  }

  async addFolioItem(
    bookingId: string,
    item: Omit<FolioItem, 'id'>,
  ): Promise<GuestFolio> {
    let folio = this.folios.find((f) => f.bookingId === bookingId);
    if (!folio) {
      folio = {
        id: randomUUID(),
        bookingId,
        guestName: 'Guest',
        items: [],
        totalCharges: 0,
        totalPayments: 0,
        balance: 0,
        currency: 'EUR',
      };
      this.folios.push(folio);
    }

    const newItem: FolioItem = {
      id: randomUUID(),
      ...item,
    };
    folio.items.push(newItem);
    this.recalculateFolio(folio);
    return folio;
  }

  async removeFolioItem(
    bookingId: string,
    itemId: string,
  ): Promise<GuestFolio> {
    const folio = this.folios.find((f) => f.bookingId === bookingId);
    if (!folio) {
      throw ApiError.notFound('GuestFolio');
    }

    const itemIdx = folio.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) {
      throw ApiError.notFound('FolioItem');
    }

    folio.items.splice(itemIdx, 1);
    this.recalculateFolio(folio);
    return folio;
  }

  async getFolioSummary(bookingId: string): Promise<{
    totalCharges: number;
    totalPayments: number;
    balance: number;
  }> {
    const folio = await this.getFolio(bookingId);
    return {
      totalCharges: folio.totalCharges,
      totalPayments: folio.totalPayments,
      balance: folio.balance,
    };
  }

  private recalculateFolio(folio: GuestFolio): void {
    folio.totalCharges = folio.items
      .filter((i) => i.category === 'CHARGE')
      .reduce((sum, i) => sum + i.amount, 0);
    folio.totalPayments = Math.abs(
      folio.items
        .filter((i) => i.category === 'PAYMENT')
        .reduce((sum, i) => sum + i.amount, 0),
    );
    const credits = folio.items
      .filter((i) => i.category === 'CREDIT')
      .reduce((sum, i) => sum + Math.abs(i.amount), 0);
    folio.balance = Math.round((folio.totalCharges - folio.totalPayments - credits) * 100) / 100;
  }

  // ── Group Reservations ──────────────────────────────────────────────

  async createGroupReservation(data: {
    name: string;
    organizer: { name: string; email: string; phone?: string };
    propertyId: string;
    bookingIds?: string[];
    totalGuests: number;
    totalAmount: number;
    notes?: string;
  }): Promise<GroupReservation> {
    const group: GroupReservation = {
      id: randomUUID(),
      name: data.name,
      organizer: data.organizer,
      propertyId: data.propertyId,
      bookingIds: data.bookingIds || [],
      totalGuests: data.totalGuests,
      totalAmount: data.totalAmount,
      notes: data.notes,
      status: 'TENTATIVE',
      createdAt: new Date(),
    };

    this.groups.push(group);
    return group;
  }

  async getGroupReservations(filters?: GroupFilters): Promise<GroupReservation[]> {
    let result = [...this.groups];
    if (filters?.status) {
      result = result.filter((g) => g.status === filters.status);
    }
    if (filters?.propertyId) {
      result = result.filter((g) => g.propertyId === filters.propertyId);
    }
    return result.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getGroupById(id: string): Promise<GroupReservation> {
    const group = this.groups.find((g) => g.id === id);
    if (!group) {
      throw ApiError.notFound('GroupReservation');
    }
    return group;
  }

  async addBookingToGroup(
    groupId: string,
    bookingId: string,
  ): Promise<GroupReservation> {
    const idx = this.groups.findIndex((g) => g.id === groupId);
    if (idx === -1) {
      throw ApiError.notFound('GroupReservation');
    }

    if (!this.groups[idx].bookingIds.includes(bookingId)) {
      this.groups[idx].bookingIds.push(bookingId);
    }
    return this.groups[idx];
  }

  async updateGroupStatus(
    id: string,
    status: GroupReservation['status'],
  ): Promise<GroupReservation> {
    const idx = this.groups.findIndex((g) => g.id === id);
    if (idx === -1) {
      throw ApiError.notFound('GroupReservation');
    }

    this.groups[idx].status = status;
    return this.groups[idx];
  }
}

export const bookingExtrasService = new BookingExtrasService();
