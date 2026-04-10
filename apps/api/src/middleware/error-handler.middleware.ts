import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
  }

  console.error('Unhandled error:', err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
