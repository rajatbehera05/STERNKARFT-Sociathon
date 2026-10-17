import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { closePrisma, isPrismaActive } from '../src/db/prisma.js';

describe('Flood Monitoring Module (/api/flood)', () => {
  afterAll(async () => {
    await closePrisma();
  });

  it('PUT /api/flood/config enforces 0 < Watch < Warning < Critical < RefHeight hierarchy', async () => {
    // 1. Invalid hierarchy: Watch (130) > Warning (120)
    const invalidRes1 = await request(app)
      .put('/api/flood/config')
      .send({
        reference_height_cm: 200,
        watch_depth_cm: 130,
        warning_depth_cm: 120,
        critical_depth_cm: 160,
        stale_timeout_sec: 30,
      });
    expect(invalidRes1.status).toBe(400);
    expect(invalidRes1.body.message).toContain('validation failed');

    // 2. Invalid hierarchy: Critical (210) > RefHeight (200)
    const invalidRes2 = await request(app)
      .put('/api/flood/config')
      .send({
        reference_height_cm: 200,
        watch_depth_cm: 80,
        warning_depth_cm: 120,
        critical_depth_cm: 210,
        stale_timeout_sec: 30,
      });
    expect(invalidRes2.status).toBe(400);

    // 3. Stale timeout < 5s rejection
    const invalidRes3 = await request(app)
      .put('/api/flood/config')
      .send({
        reference_height_cm: 200,
        watch_depth_cm: 80,
        warning_depth_cm: 120,
        critical_depth_cm: 160,
        stale_timeout_sec: 2,
      });
    expect(invalidRes3.status).toBe(400);
  });

  it('POST /api/flood/telemetry rejects out-of-bounds sensor values', async () => {
    // Humidity > 100%
    const invalidRes = await request(app)
      .post('/api/flood/telemetry')
      .send({
        water_surface_distance_cm: 50,
        humidity_pct: 125,
      });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.message).toContain('validation failed');
  });

  it('POST /api/flood/telemetry rejects invalid data_source enum', async () => {
    const invalidRes = await request(app)
      .post('/api/flood/telemetry')
      .send({
        water_surface_distance_cm: 50,
        data_source: 'FAKE_SENSOR',
      });
    expect(invalidRes.status).toBe(400);
  });

  it('POST /api/flood/alerts/:id/acknowledge rejects non-existent alert', async () => {
    if (isPrismaActive()) {
      const res = await request(app).post('/api/flood/alerts/NON_EXISTENT_ID/acknowledge');
      expect(res.status).toBe(404);
    }
  });

  it('DELETE /api/flood/alerts/demo handles request cleanly', async () => {
    if (isPrismaActive()) {
      const res = await request(app).delete('/api/flood/alerts/demo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('deleted_count');
    }
  });
});
