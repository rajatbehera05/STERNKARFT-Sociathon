import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate limiter
const ipRequests = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Creates an Express rate-limiting middleware for public endpoints.
 * @param windowMs Time window in milliseconds (default 1 minute)
 * @param maxRequests Maximum requests per IP per window (default 20)
 */
export function createRateLimiter(windowMs = 60 * 1000, maxRequests = 20) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Determine client IP
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-client';

    const now = Date.now();
    const record = ipRequests.get(clientIp);

    if (!record || now > record.resetTime) {
      ipRequests.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      throw new AppError(
        `Too many emergency requests from this network. Please wait ${waitSeconds} seconds before trying again to prevent flood abuse.`,
        429
      );
    }

    record.count += 1;
    next();
  };
}
