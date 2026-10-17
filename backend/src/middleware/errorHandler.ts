import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request payload validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle Malformed JSON body parser syntax errors
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      error: 'Malformed JSON',
      message: 'The request body could not be parsed as valid JSON',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle explicit AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unhandled internal server errors
  const statusCode = err.status || err.statusCode || 500;
  const isProd = env.isProduction;

  console.error('[Unhandled Error]:', err);

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: isProd ? 'An unexpected error occurred' : err.message || 'Unknown error',
    ...(!isProd && err.stack ? { stack: err.stack } : {}),
    timestamp: new Date().toISOString(),
  });
}
