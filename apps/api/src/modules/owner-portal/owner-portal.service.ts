import { v4 as uuid } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OwnerPortalConfig {
  id: string;
  ownerId: string;
  customDomain?: string;
  branding: { logoUrl?: string; accentColor?: string; welcomeMessage?: string };
  visibility: {
    showFinancials: boolean;
    showGuestContacts: boolean;
    showBookingDetails: boolean;
    showMaintenanceRequests: boolean;
    showDocuments: boolean;
    showOccupancyMetrics: boolean;
    showRevenueCharts: boolean;
    allowOwnerReservations: boolean;
    allowFriendsAndFamily: boolean;
    maxOwnerBlockDaysPerMonth: number;
  };
  notifications: {
    newBooking: boolean;
    cancellation: boolean;
    checkIn: boolean;
    checkOut: boolean;
    monthlyReport: boolean;
    maintenanceUpdate: boolean;
  };
  createdAt: Date;
}

interface OwnerReservation {
  id: string;
  ownerId: string;
  propertyId: string;
  type: 'OWNER_STAY' | 'FRIENDS_FAMILY';
  guestName?: string;
  guestRelation?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  notes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedById?: string;
  createdAt: Date;
}

interface OwnerStatementProperty {
  propertyId: string;
  propertyName: string;
  bookings: { guestName: string; checkIn: string; checkOut: string; nights: number; revenue: number }[];
  totalRevenue: number;
  expenses: { category: string; description: string; amount: number }[];
  totalExpenses: number;
  managementFee: number;
  feeType: string;
  netIncome: number;
}

interface OwnerStatement {
  id: string;
  ownerId: string;
  periodMonth: number;
  periodYear: number;
  properties: OwnerStatementProperty[];
  totalIncome: number;
  totalExpenses: number;
  totalManagementFees: number;
  netPayout: number;
  currency: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT';
  generatedAt: Date;
}

// ─── In-memory stores ────────────────────────────────────────────────────────

const portalConfigs: Map<string, OwnerPortalConfig> = new Map();
const ownerReservations: Map<string, OwnerReservation> = new Map();
const ownerStatements: Map<string, OwnerStatement> = new Map();

// ─── Seed demo data ─────────────────────────────────────────────────────────

const ownerIds = ['owner-1', 'owner-2', 'owner-3'];
const ownerNames: Record<string, string> = {
  'owner-1': 'Dimitris Papadopoulos',
  'owner-2': 'Maria Konstantinou',
  'owner-3': 'Yannis Alexiou',
};

function getDefaultConfig(): OwnerPortalConfig {
  return {
    id: '',
    ownerId: '',
    customDomain: undefined,
    branding: { accentColor: '#6C5CE7', welcomeMessage: 'Welcome to your owner portal' },
    visibility: {
      showFinancials: true,
      showGuestContacts: false,
      showBookingDetails: true,
      showMaintenanceRequests: true,
      showDocuments: true,
      showOccupancyMetrics: true,
      showRevenueCharts: true,
      allowOwnerReservations: true,
      allowFriendsAndFamily: true,
      maxOwnerBlockDaysPerMonth: 7,
    },
    notifications: {
      newBooking: true,
      cancellation: true,
      checkIn: true,
      checkOut: false,
      monthlyReport: true,
      maintenanceUpdate: true,
    },
    createdAt: new Date(),
  };
}

// Seed portal configs
ownerIds.forEach((ownerId) => {
  const cfg = getDefaultConfig();
  cfg.id = uuid();
  cfg.ownerId = ownerId;
  portalConfigs.set(ownerId, cfg);
});

// Seed owner reservations
const demoReservations: OwnerReservation[] = [
  {
    id: uuid(),
    ownerId: 'owner-1',
    propertyId: 'prop-1',
    type: 'OWNER_STAY',
    checkIn: '2026-05-10',
    checkOut: '2026-05-17',
    nights: 7,
    notes: 'Summer vacation with family',
    status: 'APPROVED',
    approvedById: 'admin-1',
    createdAt: new Date('2026-04-01'),
  },
  {
    id: uuid(),
    ownerId: 'owner-1',
    propertyId: 'prop-2',
    type: 'FRIENDS_FAMILY',
    guestName: 'Nikos Papadopoulos',
    guestRelation: 'Brother',
    checkIn: '2026-06-01',
    checkOut: '2026-06-05',
    nights: 4,
    notes: 'Brother visiting from Athens',
    status: 'PENDING_APPROVAL',
    createdAt: new Date('2026-04-05'),
  },
  {
    id: uuid(),
    ownerId: 'owner-2',
    propertyId: 'prop-3',
    type: 'OWNER_STAY',
    checkIn: '2026-04-20',
    checkOut: '2026-04-25',
    nights: 5,
    status: 'APPROVED',
    approvedById: 'admin-1',
    createdAt: new Date('2026-03-28'),
  },
  {
    id: uuid(),
    ownerId: 'owner-3',
    propertyId: 'prop-5',
    type: 'FRIENDS_FAMILY',
    guestName: 'Eleni Alexiou',
    guestRelation: 'Sister',
    checkIn: '2026-07-01',
    checkOut: '2026-07-08',
    nights: 7,
    status: 'REJECTED',
    createdAt: new Date('2026-04-02'),
  },
];

demoReservations.forEach((r) => ownerReservations.set(r.id, r));

// Seed owner statements
const demoStatements: OwnerStatement[] = [
  {
    id: uuid(),
    ownerId: 'owner-1',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-1',
        propertyName: 'Santorini Sunset Villa',
        bookings: [
          { guestName: 'Marcus Lindqvist', checkIn: '2026-03-01', checkOut: '2026-03-08', nights: 7, revenue: 1960 },
          { guestName: 'Sophie Dubois', checkIn: '2026-03-14', checkOut: '2026-03-21', nights: 7, revenue: 1820 },
        ],
        totalRevenue: 3780,
        expenses: [
          { category: 'Cleaning', description: 'Professional cleaning x2', amount: 180 },
          { category: 'Utilities', description: 'Electricity + Water', amount: 120 },
        ],
        totalExpenses: 300,
        managementFee: 378,
        feeType: '10%',
        netIncome: 3102,
      },
      {
        propertyId: 'prop-2',
        propertyName: 'Athens Central Loft',
        bookings: [
          { guestName: 'James Richardson', checkIn: '2026-03-05', checkOut: '2026-03-12', nights: 7, revenue: 980 },
        ],
        totalRevenue: 980,
        expenses: [
          { category: 'Cleaning', description: 'Deep clean', amount: 120 },
          { category: 'Maintenance', description: 'Plumbing repair', amount: 85 },
        ],
        totalExpenses: 205,
        managementFee: 400,
        feeType: 'Minimum (12%=117.60)',
        netIncome: 375,
      },
    ],
    totalIncome: 4760,
    totalExpenses: 505,
    totalManagementFees: 778,
    netPayout: 3477,
    currency: 'EUR',
    status: 'SENT',
    generatedAt: new Date('2026-04-02'),
  },
  {
    id: uuid(),
    ownerId: 'owner-2',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-3',
        propertyName: 'Mykonos Beach House',
        bookings: [
          { guestName: 'Hans Weber', checkIn: '2026-03-10', checkOut: '2026-03-17', nights: 7, revenue: 2100 },
          { guestName: 'Anna Kowalski', checkIn: '2026-03-20', checkOut: '2026-03-27', nights: 7, revenue: 2100 },
        ],
        totalRevenue: 4200,
        expenses: [
          { category: 'Cleaning', description: 'Professional cleaning x2', amount: 200 },
          { category: 'Supplies', description: 'Guest amenities restock', amount: 75 },
        ],
        totalExpenses: 275,
        managementFee: 420,
        feeType: '10%',
        netIncome: 3505,
      },
    ],
    totalIncome: 4200,
    totalExpenses: 275,
    totalManagementFees: 420,
    netPayout: 3505,
    currency: 'EUR',
    status: 'APPROVED',
    generatedAt: new Date('2026-04-03'),
  },
  {
    id: uuid(),
    ownerId: 'owner-3',
    periodMonth: 3,
    periodYear: 2026,
    properties: [
      {
        propertyId: 'prop-5',
        propertyName: 'Rhodes Old Town Apt',
        bookings: [
          { guestName: 'Oliver Bennett', checkIn: '2026-03-08', checkOut: '2026-03-15', nights: 7, revenue: 1050 },
        ],
        totalRevenue: 1050,
        expenses: [
          { category: 'Cleaning', description: 'Standard cleaning', amount: 80 },
        ],
        totalExpenses: 80,
        managementFee: 300,
        feeType: 'Minimum (10%=105)',
        netIncome: 670,
      },
      {
        propertyId: 'prop-6',
        propertyName: 'Paros Seaside Studio',
        bookings: [],
        totalRevenue: 0,
        expenses: [
          { category: 'Maintenance', description: 'Window repair', amount: 150 },
        ],
        totalExpenses: 150,
        managementFee: 350,
        feeType: 'Minimum (no bookings)',
        netIncome: -500,
      },
    ],
    totalIncome: 1050,
    totalExpenses: 230,
    totalManagementFees: 650,
    netPayout: 170,
    currency: 'EUR',
    status: 'DRAFT',
    generatedAt: new Date('2026-04-05'),
  },
];

demoStatements.forEach((s) => ownerStatements.set(s.id, s));

// ─── Service ─────────────────────────────────────────────────────────────────

export class OwnerPortalService {
  // Portal Config
  getPortalConfig(ownerId: string): OwnerPortalConfig | undefined {
    return portalConfigs.get(ownerId);
  }

  updatePortalConfig(ownerId: string, data: Partial<OwnerPortalConfig>): OwnerPortalConfig {
    let config = portalConfigs.get(ownerId);
    if (!config) {
      config = getDefaultConfig();
      config.id = uuid();
      config.ownerId = ownerId;
    }
    const updated: OwnerPortalConfig = {
      ...config,
      ...data,
      branding: { ...config.branding, ...(data.branding || {}) },
      visibility: { ...config.visibility, ...(data.visibility || {}) },
      notifications: { ...config.notifications, ...(data.notifications || {}) },
      ownerId,
      id: config.id,
      createdAt: config.createdAt,
    };
    portalConfigs.set(ownerId, updated);
    return updated;
  }

  getDefaultConfig(): OwnerPortalConfig {
    return getDefaultConfig();
  }

  // Owner Reservations
  createOwnerReservation(ownerId: string, data: {
    propertyId: string;
    type: 'OWNER_STAY' | 'FRIENDS_FAMILY';
    guestName?: string;
    guestRelation?: string;
    checkIn: string;
    checkOut: string;
    notes?: string;
  }): OwnerReservation {
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const reservation: OwnerReservation = {
      id: uuid(),
      ownerId,
      propertyId: data.propertyId,
      type: data.type,
      guestName: data.guestName,
      guestRelation: data.guestRelation,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights,
      notes: data.notes,
      status: 'PENDING_APPROVAL',
      createdAt: new Date(),
    };
    ownerReservations.set(reservation.id, reservation);
    return reservation;
  }

  getOwnerReservations(ownerId?: string): OwnerReservation[] {
    const all = Array.from(ownerReservations.values());
    if (ownerId) {
      return all.filter((r) => r.ownerId === ownerId);
    }
    return all;
  }

  getReservationById(id: string): OwnerReservation | undefined {
    return ownerReservations.get(id);
  }

  approveReservation(id: string, userId: string): OwnerReservation | undefined {
    const reservation = ownerReservations.get(id);
    if (!reservation) return undefined;
    reservation.status = 'APPROVED';
    reservation.approvedById = userId;
    ownerReservations.set(id, reservation);
    return reservation;
  }

  rejectReservation(id: string, _userId: string): OwnerReservation | undefined {
    const reservation = ownerReservations.get(id);
    if (!reservation) return undefined;
    reservation.status = 'REJECTED';
    ownerReservations.set(id, reservation);
    return reservation;
  }

  cancelReservation(id: string): OwnerReservation | undefined {
    const reservation = ownerReservations.get(id);
    if (!reservation) return undefined;
    reservation.status = 'CANCELLED';
    ownerReservations.set(id, reservation);
    return reservation;
  }

  // Statements
  generateStatement(ownerId: string, month: number, year: number): OwnerStatement {
    const ownerName = ownerNames[ownerId] || 'Unknown Owner';
    const statement: OwnerStatement = {
      id: uuid(),
      ownerId,
      periodMonth: month,
      periodYear: year,
      properties: [
        {
          propertyId: 'prop-auto',
          propertyName: `${ownerName} - Property A`,
          bookings: [
            { guestName: 'Demo Guest', checkIn: `${year}-${String(month).padStart(2, '0')}-05`, checkOut: `${year}-${String(month).padStart(2, '0')}-12`, nights: 7, revenue: 1400 },
          ],
          totalRevenue: 1400,
          expenses: [{ category: 'Cleaning', description: 'Standard clean', amount: 90 }],
          totalExpenses: 90,
          managementFee: 140,
          feeType: '10%',
          netIncome: 1170,
        },
      ],
      totalIncome: 1400,
      totalExpenses: 90,
      totalManagementFees: 140,
      netPayout: 1170,
      currency: 'EUR',
      status: 'DRAFT',
      generatedAt: new Date(),
    };
    ownerStatements.set(statement.id, statement);
    return statement;
  }

  getStatements(ownerId?: string): OwnerStatement[] {
    const all = Array.from(ownerStatements.values());
    if (ownerId) {
      return all.filter((s) => s.ownerId === ownerId);
    }
    return all;
  }

  getStatementById(id: string): OwnerStatement | undefined {
    return ownerStatements.get(id);
  }

  approveStatement(id: string): OwnerStatement | undefined {
    const statement = ownerStatements.get(id);
    if (!statement) return undefined;
    statement.status = 'APPROVED';
    ownerStatements.set(id, statement);
    return statement;
  }

  sendStatement(id: string): OwnerStatement | undefined {
    const statement = ownerStatements.get(id);
    if (!statement) return undefined;
    statement.status = 'SENT';
    ownerStatements.set(id, statement);
    return statement;
  }

  // Data export
  exportOwnerData(ownerId: string, format: 'csv' | 'json'): string {
    const config = portalConfigs.get(ownerId);
    const reservations = this.getOwnerReservations(ownerId);
    const statements = this.getStatements(ownerId);

    const data = {
      ownerId,
      portalConfig: config || null,
      reservations,
      statements,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV: flatten reservations
    const csvLines = ['id,type,propertyId,checkIn,checkOut,nights,status,guestName'];
    reservations.forEach((r) => {
      csvLines.push(`${r.id},${r.type},${r.propertyId},${r.checkIn},${r.checkOut},${r.nights},${r.status},${r.guestName || ''}`);
    });
    return csvLines.join('\n');
  }
}

export const ownerPortalService = new OwnerPortalService();
