import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { verifyPrismaConnection, isPrismaActive } from '../db/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Actively verify live round-trip to PostgreSQL
    const pgVerification = await verifyPrismaConnection();

    const dbStatus = {
      type: 'postgres' as const,
      connected: pgVerification.ok,
      ...(pgVerification.latency_ms !== undefined ? { latency_ms: pgVerification.latency_ms } : {}),
      ...(pgVerification.error ? { error: pgVerification.error } : {}),
    };

    const isHealthy = dbStatus.connected;

    const payload = {
      status: isHealthy ? 'healthy' : 'degraded',
      service: env.SERVICE_NAME,
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      database: dbStatus,
      mode: isPrismaActive() ? 'POSTGRESQL' : 'DISCONNECTED',
      gateway_connected: true,
      modules: {
        reqnet_rescue: isHealthy ? 'ready' : 'database_unavailable',
        disastersense_flood: isHealthy ? 'ready' : 'database_unavailable',
      },
    };

    res.status(isHealthy ? 200 : 503).json(payload);
  } catch (err) {
    next(err);
  }
});
