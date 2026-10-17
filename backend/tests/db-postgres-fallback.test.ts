import { describe, it, expect } from 'vitest';
import { floodService } from '../src/services/floodService.js';
import { rescueService } from '../src/services/rescueService.js';
import { setPrismaActiveForTest } from '../src/db/prisma.js';

describe('PostgreSQL Exclusivity & Zero-Fallback Enforcement', () => {
  it('floodService fails with 503 error when PostgreSQL is disconnected and does not silently fall back to SQLite', async () => {
    // Force unverified connection state
    setPrismaActiveForTest(false);

    await expect(floodService.getCurrentThresholds()).rejects.toThrow(
      /PostgreSQL database is currently unavailable/
    );

    await expect(
      floodService.ingestTelemetry({
        water_surface_distance_cm: 50,
      })
    ).rejects.toThrow(/PostgreSQL database is currently unavailable/);
  });

  it('rescueService fails with 503 error when PostgreSQL is disconnected and does not silently fall back to SQLite', async () => {
    // Force unverified connection state
    setPrismaActiveForTest(false);

    await expect(
      rescueService.createIncident({
        category: 'TRAPPED_FLOOD',
      })
    ).rejects.toThrow(/PostgreSQL database is currently unavailable/);

    await expect(rescueService.getIncidents({})).rejects.toThrow(
      /PostgreSQL database is currently unavailable/
    );
  });
});
