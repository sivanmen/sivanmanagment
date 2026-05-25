/**
 * Observability wiring: Sentry for error tracking.
 *
 * Initialized once at boot via `initObservability()`. Graceful no-op when
 * SENTRY_DSN is missing. Captures uncaught exceptions, unhandled promise
 * rejections, and any error passed through Express via the error handler.
 *
 * Express integration:
 *   - For Express v4 + @sentry/node v10, the SDK no longer ships pre-built
 *     middleware. We instead capture errors manually from our errorHandler.
 *   - `captureError()` is the simple façade — call from anywhere.
 */

import * as Sentry from '@sentry/node';
import { config } from '../config';

let initialized = false;

export function initObservability(): void {
  if (initialized) return;
  if (!config.observability.sentryDsn) {
    console.log('[Observability] SENTRY_DSN not set — Sentry disabled');
    return;
  }
  Sentry.init({
    dsn: config.observability.sentryDsn,
    environment: config.env,
    // Conservative sample rate; can be tuned via SENTRY_TRACES_SAMPLE_RATE later
    tracesSampleRate: 0.1,
    // Server name aids debugging when running multiple Railway services
    serverName: 'sivan-pms-api',
  });
  initialized = true;
  console.log(`[Observability] Sentry initialized (env=${config.env})`);
}

export function captureError(err: unknown, ctx?: Record<string, unknown>): void {
  if (!initialized) {
    console.error('[captureError]', err, ctx);
    return;
  }
  Sentry.withScope((scope) => {
    if (ctx) {
      for (const [k, v] of Object.entries(ctx)) scope.setExtra(k, v);
    }
    Sentry.captureException(err);
  });
}

export function isSentryActive(): boolean {
  return initialized;
}
