import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed solution (e.g., express-rate-limit + rate-limit-redis).
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs?: number; // Time window in ms (default: 15 min)
  max?: number; // Max requests per window (default: 100)
  keyGenerator?: (req: Request) => string;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function rateLimitMiddleware(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
      return `rl:${ip}`;
    },
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: resetSeconds,
      });
    }

    next();
  };
}

/**
 * Strict rate limit for auth endpoints (5 attempts per 15 minutes).
 */
export const authRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
    return `auth:${ip}`;
  },
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
});

/**
 * Standard API rate limit (200 requests per 15 minutes).
 */
export const apiRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

/**
 * Relaxed rate limit for read-heavy endpoints (500 per 15 minutes).
 */
export const readRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 500,
});
