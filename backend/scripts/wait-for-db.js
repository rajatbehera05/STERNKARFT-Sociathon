import { PrismaClient } from '@prisma/client';

const maxRetries = parseInt(process.env.DB_WAIT_RETRIES || '30', 10);
const retryIntervalMs = parseInt(process.env.DB_WAIT_INTERVAL_MS || '2000', 10);

async function waitForDatabase() {
  const prisma = new PrismaClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1 as alive`;
      console.log('[STERN-X Entrypoint] Database connection verified successfully.');
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[STERN-X Entrypoint] Timed out waiting for database after ${maxRetries} attempts.`);
        console.error(`[STERN-X Entrypoint] Last error: ${err?.message || err}`);
        await prisma.$disconnect().catch(() => {});
        process.exit(1);
      }
      console.log(`[STERN-X Entrypoint] Database not ready yet (attempt ${attempt}/${maxRetries}). Retrying in ${retryIntervalMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }
  }
}

waitForDatabase();
