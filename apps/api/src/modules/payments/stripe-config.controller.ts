import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { sendSuccess } from '../../utils/response';
import { stripeService } from './stripe.service';

class StripeConfigController {
  // Public endpoint - returns publishable key for frontend Stripe initialization
  async getPublicConfig(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, {
        publishableKey: config.stripe.publishableKey,
        isConfigured: !!config.stripe.secretKey && !!config.stripe.publishableKey,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin only - returns connection status and account info
  async getConnectionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.stripe.secretKey) {
        sendSuccess(res, {
          connected: false,
          message: 'Stripe secret key not configured',
        });
        return;
      }

      // Import Stripe and try to fetch account info
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(config.stripe.secretKey);

      const account = await stripe.accounts.retrieve();

      sendSuccess(res, {
        connected: true,
        account: {
          id: account.id,
          businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || 'N/A',
          country: account.country,
          defaultCurrency: account.default_currency?.toUpperCase(),
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          email: account.email,
        },
        publishableKey: config.stripe.publishableKey ? `${config.stripe.publishableKey.substring(0, 20)}...` : '',
        webhookConfigured: !!config.stripe.webhookSecret,
        companyInfo: {
          name: config.company.name,
          address: config.company.address,
          taxNo: config.company.taxNo,
          bankName: config.company.bankName,
          bankIban: config.company.bankIban ? `${config.company.bankIban.substring(0, 8)}...${config.company.bankIban.slice(-4)}` : '',
          bankSwift: config.company.bankSwift,
        },
      });
    } catch (error: any) {
      sendSuccess(res, {
        connected: false,
        message: error.message || 'Failed to connect to Stripe',
      });
    }
  }

  // Admin only - test Stripe connection by creating a small test
  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!config.stripe.secretKey) {
        sendSuccess(res, {
          success: false,
          message: 'Stripe secret key not configured',
        });
        return;
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(config.stripe.secretKey);

      // Test by retrieving balance (lightweight call)
      const balance = await stripe.balance.retrieve();

      sendSuccess(res, {
        success: true,
        message: 'Successfully connected to Stripe',
        balance: {
          available: balance.available.map(b => ({
            amount: b.amount / 100,
            currency: b.currency.toUpperCase(),
          })),
          pending: balance.pending.map(b => ({
            amount: b.amount / 100,
            currency: b.currency.toUpperCase(),
          })),
        },
      });
    } catch (error: any) {
      sendSuccess(res, {
        success: false,
        message: error.message || 'Failed to connect to Stripe',
      });
    }
  }

  // Client-side: create payment intent for a booking (authenticated user, not just admin)
  async createGuestPaymentIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        res.status(400).json({ error: 'bookingId is required' });
        return;
      }

      const { prisma } = await import('../../prisma/client');

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          property: { select: { name: true, ownerId: true } },
          guest: { select: { email: true, firstName: true, lastName: true } },
        },
      });

      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      if (booking.paymentStatus === 'PAID') {
        res.status(400).json({ error: 'Booking is already paid' });
        return;
      }

      const amount = Number(booking.totalAmount);
      const currency = booking.currency || 'EUR';

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(config.stripe.secretKey);

      // Create or get Stripe customer
      const guestEmail = booking.guest?.email || booking.guestEmail || '';
      const guestName = booking.guest
        ? `${booking.guest.firstName} ${booking.guest.lastName}`.trim()
        : booking.guestName;

      let customerId: string | undefined;
      if (guestEmail) {
        const customers = await stripe.customers.list({ email: guestEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: guestEmail,
            name: guestName,
          });
          customerId = customer.id;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata: {
          bookingId: booking.id,
          guestName: guestName,
          propertyName: booking.property.name,
        },
        automatic_payment_methods: { enabled: true },
        description: `Booking at ${booking.property.name} - ${booking.guestName} (${booking.nights} nights)`,
      });

      // Record pending transaction
      await prisma.paymentTransaction.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKING_PAYMENT',
          provider: 'STRIPE',
          providerTransactionId: paymentIntent.id,
          amount,
          currency: currency.toUpperCase(),
          status: 'PENDING',
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
          } as any,
        },
      });

      sendSuccess(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: currency.toUpperCase(),
        booking: {
          id: booking.id,
          guestName,
          propertyName: booking.property.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get company billing info (public for invoices/receipts)
  async getCompanyInfo(req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, {
        name: config.company.name,
        address: config.company.address,
        taxNo: config.company.taxNo,
        bank: {
          name: config.company.bankName,
          branch: config.company.bankBranch,
          swift: config.company.bankSwift,
          iban: config.company.bankIban,
          address: config.company.bankAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const stripeConfigController = new StripeConfigController();
