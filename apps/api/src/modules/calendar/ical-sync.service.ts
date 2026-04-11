import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

// ============================================================
// Simple iCal Parser — no external libraries needed
// ============================================================

interface IcalEvent {
  uid: string;
  dtstart: Date;
  dtend: Date;
  summary: string;
  description?: string;
  location?: string;
  status?: string;
}

function parseIcalDate(value: string): Date {
  // Handle DATE-only format: 20240315
  if (/^\d{8}$/.test(value)) {
    const y = parseInt(value.slice(0, 4), 10);
    const m = parseInt(value.slice(4, 6), 10) - 1;
    const d = parseInt(value.slice(6, 8), 10);
    return new Date(Date.UTC(y, m, d));
  }

  // Handle DATETIME format: 20240315T140000Z or 20240315T140000
  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    const y = parseInt(value.slice(0, 4), 10);
    const m = parseInt(value.slice(4, 6), 10) - 1;
    const d = parseInt(value.slice(6, 8), 10);
    const h = parseInt(value.slice(9, 11), 10);
    const min = parseInt(value.slice(11, 13), 10);
    const s = parseInt(value.slice(13, 15), 10);
    if (value.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    // No Z — treat as UTC anyway (Airbnb convention)
    return new Date(Date.UTC(y, m, d, h, min, s));
  }

  // Fallback — try native parsing
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Cannot parse iCal date: ${value}`);
  }
  return parsed;
}

function unfoldIcalLines(raw: string): string[] {
  // iCal "folding": continuation lines start with a single space or tab
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      // Continuation of previous line
      if (unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

function parseIcal(icsText: string): IcalEvent[] {
  const lines = unfoldIcalLines(icsText);
  const events: IcalEvent[] = [];
  let inEvent = false;
  let currentEvent: Partial<IcalEvent> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.uid && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as IcalEvent);
      }
      continue;
    }

    if (!inEvent) continue;

    // Parse property: NAME;PARAMS:VALUE  or  NAME:VALUE
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const propPart = trimmed.slice(0, colonIdx); // e.g. "DTSTART;VALUE=DATE"
    const value = trimmed.slice(colonIdx + 1);

    // Extract just the property name (before any ;params)
    const semiIdx = propPart.indexOf(';');
    const propName = semiIdx === -1 ? propPart : propPart.slice(0, semiIdx);

    switch (propName.toUpperCase()) {
      case 'UID':
        currentEvent.uid = value;
        break;
      case 'DTSTART':
        try {
          currentEvent.dtstart = parseIcalDate(value);
        } catch {
          // Skip events with unparseable dates
        }
        break;
      case 'DTEND':
        try {
          currentEvent.dtend = parseIcalDate(value);
        } catch {
          // Skip events with unparseable dates
        }
        break;
      case 'SUMMARY':
        currentEvent.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'DESCRIPTION':
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'LOCATION':
        currentEvent.location = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'STATUS':
        currentEvent.status = value;
        break;
    }
  }

  return events;
}

/**
 * Extract guest name from various iCal SUMMARY formats:
 * - Airbnb: "Reserved - Guest Name" or "Reservation - Guest Name"
 * - Booking.com: "CLOSED - Guest Name" or just "Guest Name"
 * - VRBO: "Reserved - Guest Name"
 * - Generic: "Not available" / "Blocked" / just a name
 */
function extractGuestName(summary: string): string {
  if (!summary) return 'iCal Guest';

  // Common patterns: "Reserved - Name", "Reservation - Name", "CLOSED - Name"
  const dashMatch = summary.match(/^(?:Reserved|Reservation|CLOSED|Blocked)\s*[-–]\s*(.+)$/i);
  if (dashMatch) {
    return dashMatch[1].trim();
  }

  // If summary looks like a status/block, return generic name
  const blockPatterns = /^(not available|blocked|airbnb|unavailable|closed)$/i;
  if (blockPatterns.test(summary.trim())) {
    return 'iCal Guest';
  }

  return summary.trim() || 'iCal Guest';
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
}

function channelToBookingSource(channelName: string): string {
  const lower = channelName.toLowerCase();
  if (lower.includes('airbnb')) return 'AIRBNB';
  if (lower.includes('booking')) return 'BOOKING_COM';
  if (lower.includes('vrbo') || lower.includes('homeaway')) return 'VRBO';
  return 'ICAL';
}

// ============================================================
// iCal Sync Service
// ============================================================

export class IcalSyncService {
  /**
   * Sync a single iCal feed: fetch the .ics file, parse events, upsert bookings.
   */
  async syncFeed(feedId: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
    conflicts: string[];
    errors: string[];
  }> {
    const feed = await prisma.icalFeed.findUnique({ where: { id: feedId } });
    if (!feed) {
      throw ApiError.notFound('IcalFeed');
    }

    const result = { created: 0, updated: 0, deleted: 0, conflicts: [] as string[], errors: [] as string[] };

    try {
      // 1. Fetch the .ics file
      const response = await fetch(feed.importUrl, {
        headers: {
          'User-Agent': 'SivanPMS/1.0 iCal-Sync',
          'Accept': 'text/calendar, text/plain, */*',
        },
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icsText = await response.text();

      // 2. Parse iCal events
      const events = parseIcal(icsText);

      // 3. Get existing bookings from this feed (matched by icalUid)
      const existingBookings = await prisma.booking.findMany({
        where: {
          propertyId: feed.propertyId,
          icalUid: { not: null },
          source: channelToBookingSource(feed.channelName) as any,
        },
        select: {
          id: true,
          icalUid: true,
          checkIn: true,
          checkOut: true,
          guestName: true,
          status: true,
        },
      });

      const existingByUid = new Map(existingBookings.map(b => [b.icalUid!, b]));
      const incomingUids = new Set<string>();

      // 4. Process each event
      for (const event of events) {
        incomingUids.add(event.uid);

        const checkIn = event.dtstart;
        const checkOut = event.dtend;

        if (checkOut <= checkIn) {
          result.errors.push(`Skipped event ${event.uid}: checkOut <= checkIn`);
          continue;
        }

        const nights = calculateNights(checkIn, checkOut);
        const guestName = extractGuestName(event.summary || '');
        const source = channelToBookingSource(feed.channelName) as any;

        const existing = existingByUid.get(event.uid);

        if (existing) {
          // Update existing booking if dates or guest changed
          const existingCheckIn = new Date(existing.checkIn);
          const existingCheckOut = new Date(existing.checkOut);

          const datesChanged =
            existingCheckIn.getTime() !== checkIn.getTime() ||
            existingCheckOut.getTime() !== checkOut.getTime();
          const nameChanged = existing.guestName !== guestName;

          if (datesChanged || nameChanged) {
            // Check for conflicts with other bookings (not this one)
            const conflicts = await this.findConflicts(
              feed.propertyId,
              feed.unitId,
              checkIn,
              checkOut,
              existing.id,
            );

            if (conflicts.length > 0) {
              result.conflicts.push(
                `Conflict updating ${event.uid}: overlaps with booking ${conflicts.map(c => c.id).join(', ')}`,
              );
              continue;
            }

            await prisma.booking.update({
              where: { id: existing.id },
              data: {
                checkIn,
                checkOut,
                nights,
                guestName,
              },
            });
            result.updated++;
          }
        } else {
          // Check for conflicts before creating
          const conflicts = await this.findConflicts(
            feed.propertyId,
            feed.unitId,
            checkIn,
            checkOut,
          );

          if (conflicts.length > 0) {
            result.conflicts.push(
              `Conflict creating ${event.uid} (${guestName}, ${checkIn.toISOString().slice(0, 10)} - ${checkOut.toISOString().slice(0, 10)}): overlaps with booking ${conflicts.map(c => c.id).join(', ')}`,
            );
            continue;
          }

          // Create new booking
          await prisma.booking.create({
            data: {
              propertyId: feed.propertyId,
              unitId: feed.unitId,
              source,
              status: 'CONFIRMED',
              checkIn,
              checkOut,
              nights,
              guestsCount: 1,
              adults: 1,
              children: 0,
              infants: 0,
              pets: 0,
              nightlyRate: 0,
              subtotal: 0,
              cleaningFee: 0,
              serviceFee: 0,
              taxes: 0,
              totalAmount: 0,
              currency: 'EUR',
              paymentStatus: 'PENDING',
              guestName,
              icalUid: event.uid,
              confirmedAt: new Date(),
              internalNotes: `Imported from ${feed.channelName} iCal feed`,
            },
          });
          result.created++;
        }
      }

      // 5. Delete bookings whose UID is no longer in the feed
      //    (only for bookings from this source that have an icalUid)
      const toDelete = existingBookings.filter(
        b => b.icalUid && !incomingUids.has(b.icalUid) && b.status !== 'CHECKED_IN' && b.status !== 'CHECKED_OUT',
      );

      for (const booking of toDelete) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED', cancellationReason: 'Removed from iCal feed' },
        });
        result.deleted++;
      }

      // 6. Update feed status
      await prisma.icalFeed.update({
        where: { id: feedId },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'OK',
          syncError: null,
        },
      });
    } catch (error: any) {
      // Mark feed as failed
      const errorMessage = error.message || 'Unknown sync error';
      await prisma.icalFeed.update({
        where: { id: feedId },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'ERROR',
          syncError: errorMessage.slice(0, 2000),
        },
      });

      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Find booking conflicts for a date range (excluding a specific booking id).
   */
  private async findConflicts(
    propertyId: string,
    unitId: string | null,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ) {
    const where: Prisma.BookingWhereInput = {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    };

    if (unitId) {
      where.unitId = unitId;
    }

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    return prisma.booking.findMany({
      where,
      select: { id: true, guestName: true, checkIn: true, checkOut: true },
    });
  }

  /**
   * Sync all active iCal feeds.
   */
  async syncAllFeeds(): Promise<{
    total: number;
    synced: number;
    failed: number;
    results: Array<{ feedId: string; channelName: string; result: any }>;
  }> {
    const feeds = await prisma.icalFeed.findMany({
      where: { isActive: true },
      select: {
        id: true,
        channelName: true,
        lastSyncedAt: true,
        syncIntervalMinutes: true,
      },
    });

    const now = Date.now();
    const summary = { total: feeds.length, synced: 0, failed: 0, results: [] as any[] };

    for (const feed of feeds) {
      // Check if enough time has elapsed since last sync
      if (feed.lastSyncedAt) {
        const elapsed = now - feed.lastSyncedAt.getTime();
        const intervalMs = feed.syncIntervalMinutes * 60 * 1000;
        if (elapsed < intervalMs) {
          continue; // Skip — too soon
        }
      }

      try {
        const result = await this.syncFeed(feed.id);
        summary.synced++;
        summary.results.push({ feedId: feed.id, channelName: feed.channelName, result });
      } catch (error: any) {
        summary.failed++;
        summary.results.push({
          feedId: feed.id,
          channelName: feed.channelName,
          result: { error: error.message },
        });
      }
    }

    return summary;
  }

  /**
   * Generate an iCal (.ics) export for a property.
   * Public — used by Airbnb/Booking.com to import our availability.
   */
  async generateFeed(propertyId: string, unitId?: string): Promise<string> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true },
    });

    if (!property) {
      throw ApiError.notFound('Property');
    }

    const bookingWhere: Prisma.BookingWhereInput = {
      propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    };

    const blockWhere: Prisma.CalendarBlockWhereInput = {
      propertyId,
    };

    if (unitId) {
      bookingWhere.unitId = unitId;
      blockWhere.unitId = unitId;
    }

    const [bookings, blocks] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          nights: true,
          guestName: true,
          status: true,
          source: true,
          icalUid: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { checkIn: 'asc' },
      }),
      prisma.calendarBlock.findMany({
        where: blockWhere,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          blockType: true,
          reason: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const formatDateOnly = (date: Date): string => {
      return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    const formatDateTime = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeText = (text: string): string => {
      return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sivan Management PMS//Calendar//EN',
      `X-WR-CALNAME:${escapeText(property.name)}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    // Bookings as VEVENTs
    for (const booking of bookings) {
      const uid = booking.icalUid || `booking-${booking.id}@sivan-pms`;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(booking.checkIn)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(booking.checkOut)}`);
      lines.push(`SUMMARY:${escapeText(booking.guestName)} (${booking.status})`);
      lines.push(`DESCRIPTION:${escapeText(`Source: ${booking.source} | Nights: ${booking.nights}`)}`);
      lines.push(`DTSTAMP:${formatDateTime(booking.updatedAt)}`);
      lines.push(`CREATED:${formatDateTime(booking.createdAt)}`);
      lines.push(`LAST-MODIFIED:${formatDateTime(booking.updatedAt)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:OPAQUE');
      lines.push('END:VEVENT');
    }

    // Calendar blocks as VEVENTs
    for (const block of blocks) {
      const uid = `block-${block.id}@sivan-pms`;
      const summary = block.reason
        ? `${block.blockType} - ${block.reason}`
        : block.blockType;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(block.startDate)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(block.endDate)}`);
      lines.push(`SUMMARY:${escapeText(summary)}`);
      lines.push(`DTSTAMP:${formatDateTime(block.updatedAt)}`);
      lines.push(`CREATED:${formatDateTime(block.createdAt)}`);
      lines.push(`LAST-MODIFIED:${formatDateTime(block.updatedAt)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:OPAQUE');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n') + '\r\n';
  }
}

export const icalSyncService = new IcalSyncService();
