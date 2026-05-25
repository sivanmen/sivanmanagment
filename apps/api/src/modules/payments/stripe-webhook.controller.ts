import { Request, Response, NextFunction } from 'express';
import { stripeService } from './stripe.service';
import { config } from '../../config';

/**
 * Stripe Webhook Controller
 *
 * POST /api/v1/payments/stripe/webhook
 *
 * This endpoint receives raw body (not JSON parsed) because Stripe requires
 * the raw payload for signature verification. The raw body middleware is
 * configured in app.ts BEFORE express.json().
 */
export async function stripeWebhookHandler(req: Request, res: Response, _next: NextFunction) {
  // SECURITY: Refuse to process any webhook if signing secret is not configured.
  // Without verification, any attacker could POST a fake payment_intent.succeeded
  // and mark bookings as paid.
  if (!config.stripe.webhookSecret) {
    console.error('[StripeWebhook] REFUSING webhook — STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(503).json({
      success: false,
      error: {
        code: 'WEBHOOK_NOT_CONFIGURED',
        message: 'Webhook signing secret is not configured on the server',
      },
    });
  }

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' },
    });
  }

  try {
    // req.body is a raw Buffer because of express.raw() middleware
    const event = stripeService.constructWebhookEvent(req.body as Buffer, signature);

    console.log(`[StripeWebhook] Received event: ${event.type} (${event.id})`);

    // Process the event asynchronously but respond immediately
    // Stripe expects a 200 response within a few seconds
    stripeService.handleWebhookEvent(event).catch((error) => {
      console.error(`[StripeWebhook] Error handling event ${event.type}:`, error);
    });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[StripeWebhook] Signature verification failed:', error.message);
    return res.status(400).json({
      success: false,
      error: { code: 'WEBHOOK_ERROR', message: error.message },
    });
  }
}
