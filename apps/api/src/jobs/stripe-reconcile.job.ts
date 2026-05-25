/**
 * Stripe → DB reconciliation job.
 *
 * Why: webhooks can be lost (network blip, deploy mid-event, container OOM).
 * Without reconciliation, a paid booking can stay marked PENDING and the
 * income record is never created. This job runs daily, pulls Stripe payment
 * intents from the last 48 hours, and patches any booking whose paymentStatus
 * doesn't match Stripe's truth.
 *
 * Runs at 02:00 UTC daily (low-traffic window).
 *
 * No-ops when STRIPE_SECRET_KEY is unset (graceful degradation).
 */

import cron from 'node-cron';
import Stripe from 'stripe';
import { config } from '../config';
import { prisma } from '../prisma/client';

const LOG_PREFIX = '[JOB:Stripe-Reconcile]';
let isRunning = false;

interface ReconcileSummary {
  scanned: number;
  paidPatched: number;
  failedPatched: number;
  ignored: number;
  errors: string[];
}

async function reconcile(hoursBack = 48): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = {
    scanned: 0,
    paidPatched: 0,
    failedPatched: 0,
    ignored: 0,
    errors: [],
  };

  if (!config.stripe.secretKey) {
    summary.errors.push('STRIPE_SECRET_KEY not configured — skipping');
    return summary;
  }

  const stripe = new Stripe(config.stripe.secretKey);
  const since = Math.floor(Date.now() / 1000) - hoursBack * 60 * 60;

  // Stripe paginates — fetch up to 5 pages of 100 for safety
  let startingAfter: string | undefined;
  for (let page = 0; page < 5; page++) {
    let listResp;
    try {
      listResp = await stripe.paymentIntents.list({
        created: { gte: since },
        limit: 100,
        starting_after: startingAfter,
      });
    } catch (err: any) {
      summary.errors.push(`Stripe list failed on page ${page}: ${err.message}`);
      break;
    }

    for (const pi of listResp.data) {
      summary.scanned++;

      const bookingId = pi.metadata?.bookingId;
      if (!bookingId) {
        summary.ignored++;
        continue;
      }

      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: {
            id: true,
            paymentStatus: true,
            propertyId: true,
            currency: true,
            property: { select: { ownerId: true, id: true } },
            guestName: true,
          },
        });
        if (!booking) {
          summary.ignored++;
          continue;
        }

        // SUCCEEDED → mark PAID + ensure income record exists
        if (pi.status === 'succeeded' && booking.paymentStatus !== 'PAID') {
          // providerTransactionId is not unique in the schema — find-or-create manually.
          const existingTxn = await prisma.paymentTransaction.findFirst({
            where: { providerTransactionId: pi.id },
          });

          await prisma.$transaction([
            prisma.booking.update({
              where: { id: booking.id },
              data: { paymentStatus: 'PAID' },
            }),
            existingTxn
              ? prisma.paymentTransaction.update({
                  where: { id: existingTxn.id },
                  data: { status: 'COMPLETED', completedAt: new Date() },
                })
              : prisma.paymentTransaction.create({
                  data: {
                    bookingId: booking.id,
                    type: 'BOOKING_PAYMENT',
                    provider: 'STRIPE',
                    providerTransactionId: pi.id,
                    amount: pi.amount / 100,
                    currency: pi.currency.toUpperCase(),
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    metadata: { reconciledBy: 'stripe_reconcile_job' },
                  },
                }),
          ]);

          // Idempotent income record (avoid duplicate if webhook later wins)
          const existingIncome = await prisma.incomeRecord.findFirst({
            where: {
              bookingId: booking.id,
              metadata: { path: ['stripePaymentIntentId'], equals: pi.id },
            },
          });
          if (!existingIncome) {
            const now = new Date();
            await prisma.incomeRecord.create({
              data: {
                propertyId: booking.property.id,
                bookingId: booking.id,
                ownerId: booking.property.ownerId,
                category: 'RENTAL',
                amount: pi.amount / 100,
                currency: pi.currency.toUpperCase(),
                description: `Stripe payment for booking ${booking.guestName} (reconciled)`,
                date: now,
                periodMonth: now.getMonth() + 1,
                periodYear: now.getFullYear(),
                metadata: {
                  stripePaymentIntentId: pi.id,
                  source: 'reconcile_job',
                },
              },
            });
          }

          summary.paidPatched++;
          console.log(`${LOG_PREFIX} PATCH booking=${booking.id} PENDING→PAID via ${pi.id}`);
        }

        // FAILED / CANCELED → mark FAILED if booking still says PENDING
        if (
          (pi.status === 'requires_payment_method' || pi.status === 'canceled') &&
          booking.paymentStatus === 'PENDING'
        ) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { paymentStatus: 'FAILED' },
          });
          summary.failedPatched++;
          console.log(`${LOG_PREFIX} PATCH booking=${booking.id} PENDING→FAILED via ${pi.id}`);
        }
      } catch (err: any) {
        summary.errors.push(`booking=${bookingId} pi=${pi.id}: ${err.message}`);
      }
    }

    if (!listResp.has_more) break;
    startingAfter = listResp.data[listResp.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  return summary;
}

async function runOnce(): Promise<void> {
  if (isRunning) {
    console.log(`${LOG_PREFIX} Already running, skipping`);
    return;
  }
  isRunning = true;
  const start = Date.now();
  try {
    console.log(`${LOG_PREFIX} Starting daily reconcile...`);
    const summary = await reconcile();
    const durationMs = Date.now() - start;
    console.log(
      `${LOG_PREFIX} DONE ${durationMs}ms scanned=${summary.scanned} ` +
        `paidPatched=${summary.paidPatched} failedPatched=${summary.failedPatched} ` +
        `ignored=${summary.ignored} errors=${summary.errors.length}`,
    );
    if (summary.errors.length > 0) {
      for (const e of summary.errors.slice(0, 5)) console.error(`${LOG_PREFIX}   ${e}`);
    }
  } catch (err: any) {
    console.error(`${LOG_PREFIX} FATAL ${err.message}`);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the daily Stripe reconcile job at 02:00 UTC.
 * No-op if Stripe is not configured.
 */
export function startStripeReconcileJob(): void {
  if (!config.stripe.secretKey) {
    console.log(`${LOG_PREFIX} STRIPE_SECRET_KEY not set — job disabled`);
    return;
  }
  cron.schedule('0 2 * * *', () => {
    runOnce().catch((err) => console.error(`${LOG_PREFIX} Uncaught:`, err));
  });
  console.log(`${LOG_PREFIX} Scheduled (daily 02:00 UTC)`);
}

// Expose for manual invocation (e.g. admin "run now" button or test)
export const _internal = { reconcile, runOnce };
