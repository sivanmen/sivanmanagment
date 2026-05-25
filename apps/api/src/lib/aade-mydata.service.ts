/**
 * AADE myDATA integration — STUB.
 *
 * Greek law (since 2021) requires all business income to be reported to the
 * AADE (Greek tax authority) via the myDATA e-invoice platform. Every rental
 * income from a booking that has been paid must be:
 *   1. Submitted as a TYPE 1.1 (B2B) or TYPE 1.4 (B2C) e-invoice
 *   2. Stamped with a MARK + UID by AADE
 *   3. Optionally classified with income/expense categories
 *
 * This stub:
 *   - Provides the shape (`submitInvoice`, `cancelInvoice`, `pull`) the
 *     downstream code will call once we have credentials and the WSDL/REST
 *     endpoint of the production AADE myDATA service.
 *   - Returns `{ok:false, skipped:true}` until credentials are configured.
 *   - Records each submission attempt to `AccountingIntegration` so we
 *     have a paper trail for the auditor.
 *
 * To enable: set AADE_USER, AADE_SUBSCRIPTION_KEY, AADE_BASE_URL in
 * Railway. The full integration requires the AADE technical onboarding
 * process (test → production environment migration).
 *
 * Reference: https://www.aade.gr/mydata
 */

import { prisma } from '../prisma/client';

export interface AadeInvoiceInput {
  bookingId: string;
  invoiceType: '1.1' | '1.4' | '5.1' | '5.2';
  issueDate: Date;
  counterpart: {
    name: string;
    vatNumber?: string; // Required for B2B (TYPE 1.1)
    country: string;
  };
  lines: Array<{
    description: string;
    quantity: number;
    amount: number;
    vatPercent: number;
    classification?: {
      type: string; // e.g. E3_561_001 for rental income
      category: string;
    };
  }>;
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

export interface AadeInvoiceResult {
  ok: boolean;
  skipped?: boolean;
  mark?: string; // unique invoice ID stamped by AADE
  uid?: string; // AADE invoice UID
  error?: string;
}

function isConfigured(): boolean {
  return Boolean(process.env.AADE_USER && process.env.AADE_SUBSCRIPTION_KEY);
}

export class AadeMyDataService {
  isConfigured(): boolean {
    return isConfigured();
  }

  /**
   * Submit an invoice. Stub: records the intent in AccountingIntegration
   * and returns skipped=true until real WSDL/REST integration is wired.
   */
  async submitInvoice(input: AadeInvoiceInput): Promise<AadeInvoiceResult> {
    if (!isConfigured()) {
      await this.recordAttempt(input.bookingId, 'skipped', 'AADE credentials not configured');
      return { ok: false, skipped: true, error: 'AADE credentials not configured' };
    }

    // TODO: real implementation
    //  - Build SOAP envelope (AADE prefers SOAP for v1; REST emerging)
    //  - POST to https://mydatapi.aade.gr/myDATA/SendInvoices
    //  - Parse the response for invoiceMark + invoiceUid
    //  - Handle retryable errors (network) vs permanent (validation)
    await this.recordAttempt(input.bookingId, 'pending', 'Real AADE submit not implemented yet');
    return { ok: false, skipped: true, error: 'Implementation pending — credentials present but stub active' };
  }

  async cancelInvoice(mark: string): Promise<AadeInvoiceResult> {
    if (!isConfigured()) {
      return { ok: false, skipped: true, error: 'AADE credentials not configured' };
    }
    // TODO: POST to /myDATA/CancelInvoice with the MARK
    return { ok: false, skipped: true, error: `Cancel ${mark}: implementation pending` };
  }

  /** Pull incoming invoices (B2B suppliers) from AADE. */
  async pull(_since: Date): Promise<{ ok: boolean; skipped?: boolean; invoices: any[]; error?: string }> {
    if (!isConfigured()) {
      return { ok: false, skipped: true, invoices: [], error: 'AADE credentials not configured' };
    }
    return { ok: false, skipped: true, invoices: [], error: 'Implementation pending' };
  }

  private async recordAttempt(bookingId: string, status: string, message: string) {
    try {
      await prisma.accountingEntry.create({
        data: {
          entryType: 'CREDIT',
          accountCode: 'AADE.SUBMISSION.LOG',
          amount: 0,
          currency: 'EUR',
          description: `AADE myDATA submission for booking ${bookingId}: ${status} — ${message}`,
          referenceType: 'booking',
          referenceId: bookingId,
          periodMonth: new Date().getMonth() + 1,
          periodYear: new Date().getFullYear(),
        },
      });
    } catch (err: any) {
      console.warn('[AADE] could not record submission attempt:', err.message);
    }
  }
}

export const aadeMyDataService = new AadeMyDataService();
