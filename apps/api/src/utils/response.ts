import { Response } from 'express';

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  perPage: number,
) {
  return sendSuccess(res, data, 200, {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  });
}
