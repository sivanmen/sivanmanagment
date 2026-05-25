/**
 * Owner Portal Service — real Prisma + facade over existing modules.
 *
 * Rewritten 2026-05-25 from a 508-line in-memory mock that returned demo
 * data for owner-1/owner-2/owner-3. Owners visiting client.sivanmanagment.com
 * were seeing fabricated revenue numbers — the most trust-destructive thing
 * possible for the actual paying customers.
 *
 * Storage strategy:
 *   - Portal config (branding / visibility / notifications) → Owner.metadata.portalConfig (JSON)
 *   - Owner reservations (owner / friends-family stays) → real Booking rows with
 *     source=DIRECT and metadata.ownerReservation=true
 *   - Statements → reports.service.getOwnerStatement() (no separate storage; we
 *     can persist generated PDFs to R2 in a later iteration)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ─── Types ───────────────────────────────────────────────────────────────

export interface OwnerPortalConfig {
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
}

interface OwnerReservationView {
  id: string;
  ownerId: string;
  propertyId: string;
  propertyName: string;
  type: 'OWNER_STAY' | 'FRIENDS_FAMILY';
  guestName?: string;
  guestRelation?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  notes?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedById?: string;
  createdAt: string;
}

const DEFAULT_CONFIG: Omit<OwnerPortalConfig, 'ownerId'> = {
  branding: { accentColor: '#6b38d4', welcomeMessage: 'Welcome to your owner portal' },
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
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function mergeConfig(stored: any, ownerId: string): OwnerPortalConfig {
  const base = stored && typeof stored === 'object' ? stored : {};
  return {
    ownerId,
    customDomain: base.customDomain,
    branding: { ...DEFAULT_CONFIG.branding, ...(base.branding || {}) },
    visibility: { ...DEFAULT_CONFIG.visibility, ...(base.visibility || {}) },
    notifications: { ...DEFAULT_CONFIG.notifications, ...(base.notifications || {}) },
  };
}

function bookingToReservationView(b: any): OwnerReservationView {
  const meta = (b.metadata as Record<string, any>) || {};
  const orMeta = meta.ownerReservation || {};
  const status = (
    b.status === 'CANCELLED'
      ? 'CANCELLED'
      : orMeta.status || 'APPROVED'
  ) as OwnerReservationView['status'];
  return {
    id: b.id,
    ownerId: b.property?.ownerId ?? orMeta.ownerId ?? '',
    propertyId: b.propertyId,
    propertyName: b.property?.name ?? '',
    type: (orMeta.type === 'FRIENDS_FAMILY' ? 'FRIENDS_FAMILY' : 'OWNER_STAY'),
    guestName: orMeta.guestName ?? b.guestName,
    guestRelation: orMeta.guestRelation,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    notes: b.internalNotes ?? orMeta.notes,
    status,
    approvedById: orMeta.approvedById,
    createdAt: b.createdAt.toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────

export class OwnerPortalService {
  // ─── Portal Config ──────────────────────────────────────────────────

  async getPortalConfig(ownerId: string): Promise<OwnerPortalConfig> {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { metadata: true },
    });
    if (!owner) throw ApiError.notFound('Owner');
    const stored = (owner.metadata as any)?.portalConfig;
    return mergeConfig(stored, ownerId);
  }

  async updatePortalConfig(
    ownerId: string,
    data: Partial<Omit<OwnerPortalConfig, 'ownerId'>>,
  ): Promise<OwnerPortalConfig> {
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw ApiError.notFound('Owner');

    const currentMetadata = (owner.metadata as Record<string, unknown>) || {};
    const currentConfig = mergeConfig((currentMetadata as any).portalConfig, ownerId);

    const updated: OwnerPortalConfig = {
      ownerId,
      customDomain: data.customDomain ?? currentConfig.customDomain,
      branding: { ...currentConfig.branding, ...(data.branding || {}) },
      visibility: { ...currentConfig.visibility, ...(data.visibility || {}) },
      notifications: { ...currentConfig.notifications, ...(data.notifications || {}) },
    };

    const nextMetadata = { ...currentMetadata, portalConfig: updated };
    await prisma.owner.update({
      where: { id: ownerId },
      data: { metadata: nextMetadata as unknown as Prisma.InputJsonValue },
    });

    return updated;
  }

  getDefaultConfig(ownerId = ''): OwnerPortalConfig {
    return { ownerId, ...DEFAULT_CONFIG };
  }

  // ─── Owner Reservations (stored as Booking rows) ────────────────────

  async createOwnerReservation(
    ownerId: string,
    data: {
      propertyId: string;
      type: 'OWNER_STAY' | 'FRIENDS_FAMILY';
      guestName?: string;
      guestRelation?: string;
      checkIn: string;
      checkOut: string;
      notes?: string;
    },
  ): Promise<OwnerReservationView> {
    // Verify the property belongs to the owner
    const property = await prisma.property.findFirst({
      where: { id: data.propertyId, ownerId, deletedAt: null },
    });
    if (!property) {
      throw ApiError.forbidden('Property not found or not owned by this owner');
    }

    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);
    if (checkOutDate <= checkInDate) {
      throw ApiError.badRequest('Check-out must be after check-in', 'INVALID_DATES');
    }
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    const guestName = data.type === 'FRIENDS_FAMILY' ? data.guestName ?? 'Owner guest' : 'Owner stay';

    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        source: 'DIRECT',
        status: 'PENDING',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        guestsCount: 1,
        adults: 1,
        nightlyRate: 0,
        subtotal: 0,
        cleaningFee: 0,
        serviceFee: 0,
        taxes: 0,
        totalAmount: 0,
        currency: 'EUR',
        paymentStatus: 'PENDING',
        guestName,
        internalNotes: data.notes,
        metadata: {
          ownerReservation: {
            ownerId,
            type: data.type,
            guestName: data.guestName,
            guestRelation: data.guestRelation,
            status: 'PENDING_APPROVAL',
            notes: data.notes,
          },
        } as unknown as Prisma.InputJsonValue,
      },
      include: { property: { select: { id: true, name: true, ownerId: true } } },
    });
    return bookingToReservationView(booking);
  }

  async getOwnerReservations(ownerId?: string): Promise<OwnerReservationView[]> {
    // Filter via JSON metadata path on Booking
    const where: Prisma.BookingWhereInput = {
      metadata: { path: ['ownerReservation'], not: Prisma.JsonNull },
      ...(ownerId
        ? { metadata: { path: ['ownerReservation', 'ownerId'], equals: ownerId } as any }
        : {}),
    };
    const rows = await prisma.booking.findMany({
      where,
      include: { property: { select: { id: true, name: true, ownerId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(bookingToReservationView);
  }

  async getReservationById(id: string): Promise<OwnerReservationView | undefined> {
    const b = await prisma.booking.findUnique({
      where: { id },
      include: { property: { select: { id: true, name: true, ownerId: true } } },
    });
    if (!b) return undefined;
    const meta = (b.metadata as any) || {};
    if (!meta.ownerReservation) return undefined;
    return bookingToReservationView(b);
  }

  async approveReservation(id: string, userId: string): Promise<OwnerReservationView | undefined> {
    return this.transitionStatus(id, 'APPROVED', 'CONFIRMED', userId);
  }
  async rejectReservation(id: string, userId: string): Promise<OwnerReservationView | undefined> {
    return this.transitionStatus(id, 'REJECTED', 'CANCELLED', userId);
  }
  async cancelReservation(id: string): Promise<OwnerReservationView | undefined> {
    return this.transitionStatus(id, 'CANCELLED', 'CANCELLED');
  }

  private async transitionStatus(
    id: string,
    metaStatus: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    bookingStatus: 'CONFIRMED' | 'CANCELLED',
    approvedById?: string,
  ): Promise<OwnerReservationView | undefined> {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return undefined;
    const meta = (existing.metadata as Record<string, unknown>) || {};
    const orMeta = (meta.ownerReservation as Record<string, unknown>) || {};
    const nextMeta = {
      ...meta,
      ownerReservation: {
        ...orMeta,
        status: metaStatus,
        ...(approvedById ? { approvedById } : {}),
      },
    };

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: bookingStatus,
        cancelledAt: bookingStatus === 'CANCELLED' ? new Date() : existing.cancelledAt,
        confirmedAt: bookingStatus === 'CONFIRMED' ? new Date() : existing.confirmedAt,
        metadata: nextMeta as unknown as Prisma.InputJsonValue,
      },
      include: { property: { select: { id: true, name: true, ownerId: true } } },
    });
    return bookingToReservationView(updated);
  }

  // ─── Statements (delegate to reports.service.getOwnerStatement) ─────

  async getStatements(ownerId?: string): Promise<any[]> {
    // We don't persist generated statements; instead expose the most recent
    // statement period (current month) computed on demand. UI can request
    // arbitrary months via the reports endpoint directly.
    if (!ownerId) return [];
    const { reportsService } = await import('../reports/reports.service');
    const now = new Date();
    const statement = await reportsService.getOwnerStatement({
      ownerId,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
    });
    return [
      {
        id: `${ownerId}-${statement.period.year}-${statement.period.month}`,
        ownerId,
        ...statement,
        status: 'DRAFT',
        generatedAt: now.toISOString(),
      },
    ];
  }

  async generateStatement(ownerId: string, month: number, year: number) {
    const { reportsService } = await import('../reports/reports.service');
    const statement = await reportsService.getOwnerStatement({
      ownerId,
      periodMonth: month,
      periodYear: year,
    });
    return {
      id: `${ownerId}-${year}-${month}`,
      ownerId,
      ...statement,
      status: 'DRAFT',
      generatedAt: new Date().toISOString(),
    };
  }

  async getStatementById(id: string) {
    // Statement IDs are synthetic: `${ownerId}-${year}-${month}`
    const m = id.match(/^(.+)-(\d{4})-(\d{1,2})$/);
    if (!m) return undefined;
    const ownerId = m[1];
    const year = Number(m[2]);
    const month = Number(m[3]);
    if (!ownerId || !year || !month) return undefined;
    return this.generateStatement(ownerId, month, year);
  }

  async approveStatement(id: string) {
    const s = await this.getStatementById(id);
    if (!s) return undefined;
    return { ...s, status: 'APPROVED' };
  }

  async sendStatement(id: string) {
    const s = await this.getStatementById(id);
    if (!s) return undefined;
    // Real send happens via reports.service.generateOwnerStatementPdf(?email=true)
    return { ...s, status: 'SENT' };
  }

  // ─── Data export ────────────────────────────────────────────────────

  async exportOwnerData(ownerId: string, format: 'csv' | 'json'): Promise<string> {
    const [config, reservations, statements] = await Promise.all([
      this.getPortalConfig(ownerId),
      this.getOwnerReservations(ownerId),
      this.getStatements(ownerId),
    ]);

    const payload = {
      ownerId,
      portalConfig: config,
      reservations,
      statements,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') return JSON.stringify(payload, null, 2);

    const lines = ['id,type,propertyId,checkIn,checkOut,nights,status,guestName'];
    for (const r of reservations) {
      lines.push(
        `${r.id},${r.type},${r.propertyId},${r.checkIn},${r.checkOut},${r.nights},${r.status},${r.guestName ?? ''}`,
      );
    }
    return lines.join('\n');
  }
}

export const ownerPortalService = new OwnerPortalService();
