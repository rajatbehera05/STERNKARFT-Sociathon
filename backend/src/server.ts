import http from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { verifyPrismaConnection, closePrisma } from './db/prisma.js';

async function startServer(): Promise<http.Server> {
  // 1. Initialize & verify PostgreSQL connection
  try {
    const dbTarget = env.DATABASE_URL.includes('@') ? env.DATABASE_URL.split('@')[1] : 'configured database';
    console.log(`[Database] Target: PostgreSQL (${dbTarget})`);
    const verification = await verifyPrismaConnection();
    if (verification.ok) {
      console.log(`[Database] PostgreSQL connected successfully (${verification.latency_ms}ms)`);
    } else {
      console.warn(`[Database] WARNING: PostgreSQL connection could not be established: ${verification.error}`);
      console.warn(`[Database] Standardized on PostgreSQL: SQLite fallback is completely disabled.`);
      console.warn(`[Database] Set your PostgreSQL password in .env and ensure database 'sternkraft_db' exists.`);
    }
  } catch (err) {
    console.error('[Database] Unexpected error during connection check:', err);
  }

  // 2. Start HTTP server
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`[Server] ${env.SERVICE_NAME} v${env.API_VERSION}`);
    console.log(`[Server] Listening on: http://localhost:${env.PORT}`);
    console.log(`[Server] Environment:  ${env.NODE_ENV}`);
    console.log(`[Server] CORS Origins: ${env.corsAllowedOrigins.join(', ')}`);
    console.log(`[Server] Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });

  // 3. Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closePrisma();
      console.log('[Database] PostgreSQL connection closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful close stalls
    setTimeout(() => {
      console.error('[Server] Forced exit after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

// Start if executed directly
startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

