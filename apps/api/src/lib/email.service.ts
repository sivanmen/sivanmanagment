/**
 * Email service — thin wrapper around @sendgrid/mail with graceful degradation.
 *
 * Design:
 *   - Single SendGrid client, lazy-initialized.
 *   - `isConfigured()` lets callers (health checks, status page, integration
 *     pages) tell the user clearly that emails won't go out yet.
 *   - All sends return a structured result instead of throwing on missing
 *     config — letting business code log the failure but continue (e.g. a
 *     booking is still created even if the confirmation email can't be sent).
 *   - Hebrew + English template helpers for the most common transactional
 *     emails (booking confirmation, payment receipt, owner statement).
 */

import sgMail from '@sendgrid/mail';
import { config } from '../config';

export interface EmailSendInput {
  to: string;
  subject: string;
  /** HTML body. If `text` is omitted, SendGrid will auto-generate a plain-text version. */
  html: string;
  text?: string;
  /** Optional reply-to address. Defaults to the configured from address. */
  replyTo?: string;
  /** Free-form metadata stored as SendGrid custom args (per-event tracking). */
  metadata?: Record<string, string>;
  /** Optional ISO-639-1 language code. Used only for SendGrid categorization. */
  locale?: string;
}

export interface EmailSendResult {
  ok: boolean;
  /** SendGrid message id when successful. */
  messageId?: string;
  /** True when the integration is not configured (intentional skip, not an error). */
  skipped?: boolean;
  /** Error message when ok is false. */
  error?: string;
  statusCode?: number;
}

class EmailService {
  private initialized = false;

  isConfigured(): boolean {
    return Boolean(config.email.apiKey);
  }

  private init(): void {
    if (this.initialized) return;
    if (!this.isConfigured()) return;
    sgMail.setApiKey(config.email.apiKey);
    this.initialized = true;
  }

  /**
   * Send a single transactional email. Never throws — returns a result object.
   * Caller is responsible for logging / retrying / queueing as appropriate.
   */
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    if (!this.isConfigured()) {
      console.warn(
        `[Email] SKIP send to=${input.to} subject="${input.subject}" — SENDGRID_API_KEY not configured`,
      );
      return { ok: false, skipped: true, error: 'SENDGRID_API_KEY not configured' };
    }

    this.init();

    try {
      const [response] = await sgMail.send({
        to: input.to,
        from: { email: config.email.fromEmail, name: config.email.fromName },
        replyTo: input.replyTo || config.email.fromEmail,
        subject: input.subject,
        html: input.html,
        text: input.text,
        customArgs: input.metadata,
        categories: input.locale ? [`locale:${input.locale}`] : undefined,
      });

      const messageId =
        (response.headers?.['x-message-id'] as string | undefined) || undefined;
      console.log(`[Email] OK ${input.to} "${input.subject}" → ${messageId ?? 'queued'}`);
      return { ok: true, messageId, statusCode: response.statusCode };
    } catch (err: any) {
      const message = err?.response?.body?.errors?.[0]?.message || err?.message || 'unknown';
      const statusCode = err?.code || err?.response?.statusCode;
      console.error(`[Email] FAIL ${input.to} "${input.subject}" → ${message}`);
      return { ok: false, error: message, statusCode };
    }
  }

  // ─── Convenience templates ───────────────────────────────────────────

  /**
   * Booking confirmation — sent after Stripe payment_intent.succeeded.
   * Bilingual (Hebrew first for guests writing Hebrew, then English).
   */
  async sendBookingConfirmation(args: {
    to: string;
    guestName: string;
    propertyName: string;
    checkIn: Date | string;
    checkOut: Date | string;
    nights: number;
    totalAmount: number;
    currency: string;
    bookingId: string;
    locale?: 'he' | 'en' | string;
  }): Promise<EmailSendResult> {
    const inDate = formatDate(args.checkIn);
    const outDate = formatDate(args.checkOut);
    const isHebrew = (args.locale ?? 'en').startsWith('he');

    const subject = isHebrew
      ? `אישור הזמנה — ${args.propertyName}`
      : `Booking confirmed — ${args.propertyName}`;

    const html = isHebrew
      ? renderBookingConfirmationHTML_he(args, inDate, outDate)
      : renderBookingConfirmationHTML_en(args, inDate, outDate);

    return this.send({
      to: args.to,
      subject,
      html,
      metadata: { bookingId: args.bookingId, type: 'booking_confirmation' },
      locale: args.locale,
    });
  }

  /**
   * Payment receipt — companion to the confirmation, focused on the money.
   */
  async sendPaymentReceipt(args: {
    to: string;
    guestName: string;
    propertyName: string;
    amount: number;
    currency: string;
    bookingId: string;
    paymentIntentId: string;
    locale?: 'he' | 'en' | string;
  }): Promise<EmailSendResult> {
    const isHebrew = (args.locale ?? 'en').startsWith('he');
    const subject = isHebrew
      ? `קבלה על תשלום — ${formatMoney(args.amount, args.currency)}`
      : `Payment receipt — ${formatMoney(args.amount, args.currency)}`;
    const greeting = isHebrew
      ? `שלום ${args.guestName},`
      : `Hello ${args.guestName},`;
    const body = isHebrew
      ? `קיבלנו את התשלום שלך עבור ${args.propertyName}. תודה!`
      : `We received your payment for ${args.propertyName}. Thank you!`;

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
        <h2 style="font-family:Manrope,sans-serif;color:#6b38d4;">${subject}</h2>
        <p>${greeting}</p>
        <p>${body}</p>
        <table style="margin:16px 0;border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;background:#f5f5f5;">Amount</td><td style="padding:8px;"><b>${formatMoney(args.amount, args.currency)}</b></td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;">Booking ID</td><td style="padding:8px;font-family:monospace;">${args.bookingId}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;">Payment Ref</td><td style="padding:8px;font-family:monospace;">${args.paymentIntentId}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:24px;">Sivan Management — Crete, Greece</p>
      </div>
    `;
    return this.send({
      to: args.to,
      subject,
      html,
      metadata: { bookingId: args.bookingId, type: 'payment_receipt' },
      locale: args.locale,
    });
  }

  /**
   * Owner statement — monthly summary email with PDF attached (the PDF is
   * generated by the reports module and passed in as base64).
   */
  async sendOwnerStatement(args: {
    to: string;
    ownerName: string;
    periodLabel: string; // e.g. "April 2026"
    grossRevenue: number;
    netPayout: number;
    currency: string;
    pdfBuffer?: Buffer;
    pdfFilename?: string;
    locale?: 'he' | 'en' | string;
  }): Promise<EmailSendResult> {
    if (!this.isConfigured()) {
      return { ok: false, skipped: true, error: 'SENDGRID_API_KEY not configured' };
    }
    this.init();

    const isHebrew = (args.locale ?? 'en').startsWith('he');
    const subject = isHebrew
      ? `דו"ח בעלים — ${args.periodLabel}`
      : `Owner statement — ${args.periodLabel}`;
    const greeting = isHebrew ? `שלום ${args.ownerName},` : `Hello ${args.ownerName},`;
    const body = isHebrew
      ? `מצורף הדו"ח החודשי שלך לתקופה ${args.periodLabel}.`
      : `Attached is your monthly statement for ${args.periodLabel}.`;

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
        <h2 style="font-family:Manrope,sans-serif;color:#6b38d4;">${subject}</h2>
        <p>${greeting}</p>
        <p>${body}</p>
        <table style="margin:16px 0;border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;background:#f5f5f5;">Gross revenue</td><td style="padding:8px;">${formatMoney(args.grossRevenue, args.currency)}</td></tr>
          <tr><td style="padding:8px;background:#f5f5f5;">Net payout</td><td style="padding:8px;"><b>${formatMoney(args.netPayout, args.currency)}</b></td></tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:24px;">Sivan Management</p>
      </div>
    `;

    try {
      const msg: any = {
        to: args.to,
        from: { email: config.email.fromEmail, name: config.email.fromName },
        subject,
        html,
        categories: [`statement`, args.locale ? `locale:${args.locale}` : undefined].filter(Boolean),
      };
      if (args.pdfBuffer) {
        msg.attachments = [
          {
            content: args.pdfBuffer.toString('base64'),
            filename: args.pdfFilename || `statement-${args.periodLabel.replace(/\s+/g, '-')}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ];
      }
      const [response] = await sgMail.send(msg);
      const messageId =
        (response.headers?.['x-message-id'] as string | undefined) || undefined;
      console.log(`[Email] OK statement → ${args.to} (${args.periodLabel}) → ${messageId ?? 'queued'}`);
      return { ok: true, messageId, statusCode: response.statusCode };
    } catch (err: any) {
      const message = err?.response?.body?.errors?.[0]?.message || err?.message || 'unknown';
      console.error(`[Email] FAIL statement → ${args.to} → ${message}`);
      return { ok: false, error: message };
    }
  }

  /**
   * Lightweight health check — verify the API key looks valid by listing
   * one categorical stat. We don't actually call SendGrid here because the
   * stats endpoint costs a request per check; we simply confirm the key is
   * present and the SDK is initialized.
   */
  ping(): { ok: boolean; configured: boolean } {
    return { ok: this.isConfigured(), configured: this.isConfigured() };
  }
}

// ─── HTML template helpers ─────────────────────────────────────────────

function renderBookingConfirmationHTML_he(
  args: {
    guestName: string;
    propertyName: string;
    nights: number;
    totalAmount: number;
    currency: string;
    bookingId: string;
  },
  inDate: string,
  outDate: string,
): string {
  return `
    <div dir="rtl" style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <h2 style="font-family:Manrope,sans-serif;color:#6b38d4;">ההזמנה שלך אושרה</h2>
      <p>שלום ${args.guestName},</p>
      <p>אנחנו שמחים לאשר את ההזמנה שלך ב-<b>${args.propertyName}</b>.</p>
      <table style="margin:16px 0;border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;background:#f5f5f5;">צ'ק-אין</td><td style="padding:8px;">${inDate}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">צ'ק-אאוט</td><td style="padding:8px;">${outDate}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">לילות</td><td style="padding:8px;">${args.nights}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">סכום ששולם</td><td style="padding:8px;"><b>${formatMoney(args.totalAmount, args.currency)}</b></td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">מספר הזמנה</td><td style="padding:8px;font-family:monospace;">${args.bookingId}</td></tr>
      </table>
      <p>פרטי הגעה והנחיות הצ'ק-אין יישלחו אליך בנפרד.</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Sivan Management — Crete, Greece</p>
    </div>
  `;
}

function renderBookingConfirmationHTML_en(
  args: {
    guestName: string;
    propertyName: string;
    nights: number;
    totalAmount: number;
    currency: string;
    bookingId: string;
  },
  inDate: string,
  outDate: string,
): string {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <h2 style="font-family:Manrope,sans-serif;color:#6b38d4;">Your booking is confirmed</h2>
      <p>Hi ${args.guestName},</p>
      <p>We're delighted to confirm your stay at <b>${args.propertyName}</b>.</p>
      <table style="margin:16px 0;border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;background:#f5f5f5;">Check-in</td><td style="padding:8px;">${inDate}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">Check-out</td><td style="padding:8px;">${outDate}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">Nights</td><td style="padding:8px;">${args.nights}</td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">Total paid</td><td style="padding:8px;"><b>${formatMoney(args.totalAmount, args.currency)}</b></td></tr>
        <tr><td style="padding:8px;background:#f5f5f5;">Booking ID</td><td style="padding:8px;font-family:monospace;">${args.bookingId}</td></tr>
      </table>
      <p>Arrival details and check-in instructions will follow in a separate email.</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Sivan Management — Crete, Greece</p>
    </div>
  `;
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
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

export const emailService = new EmailService();
