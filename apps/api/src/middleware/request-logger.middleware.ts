import type { Request, Response, NextFunction } from 'express';

/**
 * HTTP Request Logger Middleware.
 * Logs method, URL, status, response time, and content length.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Skip health check spam
  if (originalUrl === '/api/v1/health') {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const contentLength = res.getHeader('content-length') || '-';

    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';

    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;

    console.log(
      `${statusColor}${method.padEnd(7)}${reset} ${originalUrl} ${statusColor}${status}${reset} ${duration}ms ${contentLength}b [${ip}]`,
    );

    // Log slow requests (>2s)
    if (duration > 2000) {
      console.warn(`[SLOW] ${method} ${originalUrl} took ${duration}ms`);
    }
  });

  next();
}
