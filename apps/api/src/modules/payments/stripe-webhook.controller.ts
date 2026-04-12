import { Request, Response, NextFunction } from 'express';
import { stripeService } from './stripe.service';

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
