import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

let prismaClient: PrismaClient | null = null;
let isConnectionVerified = false;

/**
 * Returns the singleton PrismaClient instance for PostgreSQL.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
      log: env.isDevelopment ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaClient;
}

/**
 * Actively verifies database connectivity against local PostgreSQL on port 5433.
 * Executes an actual round-trip query. Does not assume connected merely because DATABASE_URL is defined.
 */
export async function verifyPrismaConnection(): Promise<{
  ok: boolean;
  error?: string;
  latency_ms?: number;
}> {
  const client = getPrismaClient();
  const start = Date.now();
  try {
    await client.$queryRaw`SELECT 1 as alive`;
    const latency_ms = Date.now() - start;
    isConnectionVerified = true;
    return { ok: true, latency_ms };
  } catch (err: any) {
    isConnectionVerified = false;
    return {
      ok: false,
      error:
        err.message ||
        'Failed to establish connection to PostgreSQL on localhost:5433 (sternkraft_db).',
    };
  }
}

/**
 * Returns true only when a live connection to PostgreSQL has been actively confirmed.
 */
export function isPrismaActive(): boolean {
  return isConnectionVerified && prismaClient !== null;
}

/**
 * Helper to programmatically set verification status in unit tests.
 */
export function setPrismaActiveForTest(active: boolean): void {
  isConnectionVerified = active;
}

/**
 * Safely disconnects the Prisma client.
 */
export async function closePrisma(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
    isConnectionVerified = false;
  }
}
