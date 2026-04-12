/**
 * Stripe Payment Integration Service
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 * - STRIPE_WEBHOOK_SECRET: Webhook endpoint signing secret (whsec_...)
 * - STRIPE_PUBLISHABLE_KEY: Public key for frontend (pk_live_... or pk_test_...)
 */

import Stripe from 'stripe';
import { config } from '../../config';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!config.stripe.secretKey) {
      console.warn('[StripeService] STRIPE_SECRET_KEY not configured — Stripe calls will fail at runtime.');
    }
    this.stripe = new Stripe(config.stripe.secretKey);
  }

  // ==========================================
  // Payment Intents
  // ==========================================

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      return paymentIntent;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  // ==========================================
  // Payment Links (Checkout Sessions)
  // ==========================================

  async createPaymentLink(
    bookingId: string,
    amount: number,
    currency: string,
    description: string,
  ): Promise<string> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: { select: { name: true } },
        },
      });

      if (!booking) {
        throw ApiError.notFound('Booking');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Booking at ${booking.property.name}`,
                description: description || `${booking.guestName} - ${booking.nights} nights`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail || '',
          propertyName: booking.property.name,
        },
        customer_email: booking.guestEmail || undefined,
        success_url: `${config.clientUrl}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${config.clientUrl}/booking/payment-cancelled?booking_id=${bookingId}`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      });

      if (!session.url) {
        throw ApiError.internal('Failed to create Stripe Checkout session');
      }

      return session.url;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  // ==========================================
  // Customers
  // ==========================================

  async createOrGetCustomer(
    email: string,
    name: string,
    phone?: string,
  ): Promise<Stripe.Customer> {
    try {
      // Search for existing customer by email
      const existingCustomers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Update existing customer if needed
        const customer = existingCustomers.data[0];
        if (customer.name !== name || (phone && customer.phone !== phone)) {
          return await this.stripe.customers.update(customer.id, {
            name,
            ...(phone ? { phone } : {}),
          });
        }
        return customer;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        ...(phone ? { phone } : {}),
      });

      return customer;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe error: ${error.message}`, 'STRIPE_ERROR');
    }
  }

  // ==========================================
  // Refunds
  // ==========================================

  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      if (reason) {
        // Stripe accepts: duplicate, fraudulent, requested_by_customer
        const validReasons: Stripe.RefundCreateParams.Reason[] = [
          'duplicate',
          'fraudulent',
          'requested_by_customer',
        ];
        if (validReasons.includes(reason as Stripe.RefundCreateParams.Reason)) {
          refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
        } else {
          refundParams.metadata = { custom_reason: reason };
        }
      }

      const refund = await this.stripe.refunds.create(refundParams);
      return refund;
    } catch (error: any) {
      throw ApiError.badRequest(`Stripe refund error: ${error.message}`, 'STRIPE_REFUND_ERROR');
    }
  }

  // ==========================================
  // Webhooks
  // ==========================================

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret,
      );
    } catch (error: any) {
      throw ApiError.badRequest(`Webhook signature verification failed: ${error.message}`, 'WEBHOOK_SIGNATURE_FAILED');
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
    }
  }

  // ==========================================
  // Private Webhook Handlers
  // ==========================================

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    const amountInCurrency = paymentIntent.amount / 100;

    // Record the transaction
    await prisma.paymentTransaction.create({
      data: {
        bookingId: bookingId || undefined,
        type: 'BOOKING_PAYMENT',
        provider: 'STRIPE',
        providerTransactionId: paymentIntent.id,
        amount: amountInCurrency,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          stripeEventType: 'payment_intent.succeeded',
          paymentMethodType: paymentIntent.payment_method_types?.[0] || 'card',
        },
      },
    });

    if (bookingId) {
      // Update booking payment status
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { property: { select: { ownerId: true, id: true } } },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'PAID' },
        });

        // Create income record
        const now = new Date();
        await prisma.incomeRecord.create({
          data: {
            propertyId: booking.property.id,
            bookingId: booking.id,
            ownerId: booking.property.ownerId,
            category: 'RENTAL',
            amount: amountInCurrency,
            currency: paymentIntent.currency.toUpperCase(),
            description: `Stripe payment for booking ${booking.guestName}`,
            date: now,
            periodMonth: now.getMonth() + 1,
            periodYear: now.getFullYear(),
            metadata: {
              stripePaymentIntentId: paymentIntent.id,
              source: 'stripe_webhook',
            },
          },
        });
      }
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata?.bookingId;
    const amountInCurrency = paymentIntent.amount / 100;

    // Record the failed transaction
    await prisma.paymentTransaction.create({
      data: {
        bookingId: bookingId || undefined,
        type: 'BOOKING_PAYMENT',
        provider: 'STRIPE',
        providerTransactionId: paymentIntent.id,
        amount: amountInCurrency,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'FAILED',
        metadata: {
          stripeEventType: 'payment_intent.payment_failed',
          failureMessage: paymentIntent.last_payment_error?.message || 'Unknown failure',
          failureCode: paymentIntent.last_payment_error?.code || 'unknown',
        },
      },
    });

    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'FAILED' },
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    // Find the original transaction
    const originalTransaction = paymentIntentId
      ? await prisma.paymentTransaction.findFirst({
          where: { providerTransactionId: paymentIntentId, provider: 'STRIPE' },
        })
      : null;

    const refundedAmount = charge.amount_refunded / 100;

    await prisma.paymentTransaction.create({
      data: {
        bookingId: originalTransaction?.bookingId || undefined,
        ownerId: originalTransaction?.ownerId || undefined,
        type: 'REFUND',
        provider: 'STRIPE',
        providerTransactionId: charge.id,
        amount: refundedAmount,
        currency: charge.currency.toUpperCase(),
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          stripeEventType: 'charge.refunded',
          originalPaymentIntentId: paymentIntentId,
          originalTransactionId: originalTransaction?.id,
        },
      },
    });

    // If fully refunded, update booking
    if (originalTransaction?.bookingId && charge.refunded) {
      await prisma.booking.update({
        where: { id: originalTransaction.bookingId },
        data: { paymentStatus: 'REFUNDED' },
      });
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const bookingId = session.metadata?.bookingId;
    const amountTotal = (session.amount_total || 0) / 100;
    const currency = (session.currency || 'eur').toUpperCase();
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    // Check if we already have a transaction from payment_intent.succeeded for this PI
    if (paymentIntentId) {
      const existing = await prisma.paymentTransaction.findFirst({
        where: { providerTransactionId: paymentIntentId, provider: 'STRIPE', status: 'COMPLETED' },
      });
      if (existing) {
        // Already processed via payment_intent.succeeded
        return;
      }
    }

    // Record the transaction
    await prisma.paymentTransaction.create({
      data: {
        bookingId: bookingId || undefined,
        type: 'BOOKING_PAYMENT',
        provider: 'STRIPE',
        providerTransactionId: paymentIntentId || session.id,
        amount: amountTotal,
        currency,
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          stripeEventType: 'checkout.session.completed',
          sessionId: session.id,
          customerEmail: session.customer_email,
        },
      },
    });

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { property: { select: { ownerId: true, id: true } } },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'PAID' },
        });

        const now = new Date();
        await prisma.incomeRecord.create({
          data: {
            propertyId: booking.property.id,
            bookingId: booking.id,
            ownerId: booking.property.ownerId,
            category: 'RENTAL',
            amount: amountTotal,
            currency,
            description: `Stripe checkout payment for booking ${booking.guestName}`,
            date: now,
            periodMonth: now.getMonth() + 1,
            periodYear: now.getFullYear(),
            metadata: {
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              source: 'stripe_webhook',
            },
          },
        });
      }
    }
  }

  // ==========================================
  // Utility: Get Booking Payment Status
  // ==========================================

  async getBookingPaymentStatus(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestName: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
      },
    });

    if (!booking) {
      throw ApiError.notFound('Booking');
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    const totalPaid = transactions
      .filter((t) => t.type === 'BOOKING_PAYMENT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalRefunded = transactions
      .filter((t) => t.type === 'REFUND' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        totalAmount: Number(booking.totalAmount),
        currency: booking.currency,
        paymentStatus: booking.paymentStatus,
      },
      totalPaid,
      totalRefunded,
      netPaid: totalPaid - totalRefunded,
      outstanding: Number(booking.totalAmount) - (totalPaid - totalRefunded),
      transactions,
    };
  }
}

export const stripeService = new StripeService();
