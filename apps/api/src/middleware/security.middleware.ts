import type { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware.
 * Adds additional security headers beyond what helmet provides.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection (modern browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );

  next();
}

/**
 * Request sanitization middleware.
 * Strips dangerous patterns from query strings and body fields.
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  // Remove __proto__ and constructor from body (prototype pollution prevention)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query as Record<string, unknown>);
  }
  next();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of Object.keys(obj)) {
    if (dangerousKeys.includes(key)) {
      delete obj[key];
    } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key] as Record<string, unknown>);
    }
  }
}

/**
 * Request ID middleware.
 * Adds a unique request ID header for tracing.
 */
let requestCounter = 0;
export function requestId(req: Request, res: Response, next: NextFunction) {
  requestCounter++;
  const id = `${Date.now().toString(36)}-${requestCounter.toString(36)}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
}
