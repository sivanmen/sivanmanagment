/**
 * PDF generation service — currently focused on owner statements.
 *
 * Built on `pdfkit` (zero external deps, no headless browser required).
 * Output is a Buffer that callers can stream to HTTP, attach to email,
 * or upload to R2 for later retrieval.
 *
 * Sivan Obsidian aesthetic translated to print:
 *   - Heading font: Helvetica-Bold (PDFKit built-in; Manrope would require font embedding)
 *   - Accent color: #6b38d4
 *   - Light grid: #f5f5f5 row backgrounds
 */

import PDFDocument from 'pdfkit';

const ACCENT = '#6b38d4';
const TEXT_DARK = '#1a1a1a';
const TEXT_MUTED = '#666666';
const ROW_BG = '#f5f5f5';

export interface OwnerStatementLineItem {
  propertyName: string;
  bookingsCount: number;
  grossRevenue: number;
  expenses: number;
  managementFee: number;
  netPayout: number;
}

export interface OwnerStatementPdfInput {
  /** "April 2026" or "Apr 1 – Apr 30, 2026" */
  periodLabel: string;
  ownerName: string;
  ownerEmail?: string;
  currency: string;
  lineItems: OwnerStatementLineItem[];
  totals: {
    grossRevenue: number;
    expenses: number;
    managementFee: number;
    netPayout: number;
  };
  /** Optional company info to print in footer. */
  company?: {
    name?: string;
    address?: string;
    taxNo?: string;
    bankName?: string;
    bankIban?: string;
  };
  /** Optional notes (free text) printed below the totals table. */
  notes?: string;
  /** Locale of the PDF — currently affects header strings only. */
  locale?: 'he' | 'en' | string;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Generate an owner statement PDF and return its bytes as a Buffer.
 * Never throws — wraps internal pdfkit errors and rejects with context.
 */
export async function generateOwnerStatementPdf(
  input: OwnerStatementPdfInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
        Title: `Owner Statement — ${input.periodLabel}`,
        Author: input.company?.name || 'Sivan Management',
        Subject: 'Owner Statement',
      } });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ──────────────────────────────────────────────────────
      doc
        .fillColor(ACCENT)
        .font('Helvetica-Bold')
        .fontSize(20)
        .text(input.company?.name || 'Sivan Management', { align: 'left' });

      doc
        .moveDown(0.2)
        .fillColor(TEXT_MUTED)
        .font('Helvetica')
        .fontSize(10)
        .text('Property Management — Crete, Greece', { align: 'left' });

      doc.moveDown(1.5);

      doc
        .fillColor(TEXT_DARK)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(`Owner Statement — ${input.periodLabel}`, { align: 'left' });

      doc
        .moveDown(0.3)
        .font('Helvetica')
        .fontSize(11)
        .fillColor(TEXT_MUTED)
        .text(`Owner: ${input.ownerName}`);
      if (input.ownerEmail) {
        doc.text(`Email: ${input.ownerEmail}`);
      }

      doc.moveDown(1.2);

      // ── Line items table ───────────────────────────────────────────
      const tableTop = doc.y;
      const colX = {
        property: 50,
        bookings: 230,
        gross: 290,
        expenses: 370,
        fee: 440,
        net: 510,
      };

      const drawRowBg = (y: number, height: number) => {
        doc.save();
        doc.fillColor(ROW_BG).rect(45, y - 2, 510, height).fill();
        doc.restore();
      };

      // Header row
      drawRowBg(tableTop, 18);
      doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(10);
      doc.text('Property', colX.property, tableTop + 2);
      doc.text('#', colX.bookings, tableTop + 2, { width: 50 });
      doc.text('Gross', colX.gross, tableTop + 2, { width: 70, align: 'right' });
      doc.text('Expenses', colX.expenses, tableTop + 2, { width: 60, align: 'right' });
      doc.text('Mgmt fee', colX.fee, tableTop + 2, { width: 60, align: 'right' });
      doc.text('Net payout', colX.net, tableTop + 2, { width: 70, align: 'right' });

      let y = tableTop + 22;
      doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK);

      for (const li of input.lineItems) {
        doc.text(li.propertyName, colX.property, y, { width: 170 });
        doc.text(String(li.bookingsCount), colX.bookings, y, { width: 50 });
        doc.text(formatMoney(li.grossRevenue, input.currency), colX.gross, y, { width: 70, align: 'right' });
        doc.text(formatMoney(li.expenses, input.currency), colX.expenses, y, { width: 60, align: 'right' });
        doc.text(formatMoney(li.managementFee, input.currency), colX.fee, y, { width: 60, align: 'right' });
        doc.text(formatMoney(li.netPayout, input.currency), colX.net, y, { width: 70, align: 'right' });
        y += 18;
      }

      if (input.lineItems.length === 0) {
        doc
          .fillColor(TEXT_MUTED)
          .text('No activity for this period.', colX.property, y);
        y += 18;
      }

      // ── Totals row ─────────────────────────────────────────────────
      y += 6;
      drawRowBg(y, 20);
      doc.font('Helvetica-Bold').fillColor(TEXT_DARK).fontSize(11);
      doc.text('TOTAL', colX.property, y + 4);
      doc.text(formatMoney(input.totals.grossRevenue, input.currency), colX.gross, y + 4, { width: 70, align: 'right' });
      doc.text(formatMoney(input.totals.expenses, input.currency), colX.expenses, y + 4, { width: 60, align: 'right' });
      doc.text(formatMoney(input.totals.managementFee, input.currency), colX.fee, y + 4, { width: 60, align: 'right' });
      doc.fillColor(ACCENT);
      doc.text(formatMoney(input.totals.netPayout, input.currency), colX.net, y + 4, { width: 70, align: 'right' });

      y += 36;

      // ── Notes (optional) ───────────────────────────────────────────
      if (input.notes) {
        doc
          .fillColor(TEXT_DARK)
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('Notes', 50, y);
        y += 16;
        doc.font('Helvetica').fontSize(10).fillColor(TEXT_MUTED).text(input.notes, 50, y, { width: 510 });
      }

      // ── Footer with company info ───────────────────────────────────
      const footerTop = doc.page.height - 90;
      doc
        .fontSize(9)
        .fillColor(TEXT_MUTED)
        .text(
          [
            input.company?.name,
            input.company?.address,
            input.company?.taxNo ? `Tax ID: ${input.company.taxNo}` : null,
            input.company?.bankName && input.company?.bankIban
              ? `Bank: ${input.company.bankName} · IBAN ${input.company.bankIban}`
              : null,
          ]
            .filter(Boolean)
            .join('  ·  '),
          50,
          footerTop,
          { align: 'center', width: 510 },
        );

      doc
        .fontSize(8)
        .fillColor(TEXT_MUTED)
        .text(`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`, 50, footerTop + 30, {
          align: 'center',
          width: 510,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
