import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { closePrisma, setPrismaActiveForTest } from '../src/db/prisma.js';

describe('Backend Foundation & Health Endpoint (PostgreSQL Standardized)', () => {
  afterAll(async () => {
    await closePrisma();
  });

  it('GET /api/health reports postgres as the sole database engine with no SQLite fallback', async () => {
    const res = await request(app).get('/api/health');

    // Either 200 (if connected to local PG) or 503 (if disconnected/unauthenticated)
    expect([200, 503]).toContain(res.status);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('service');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');

    // Must be postgres ONLY - never sqlite
    expect(res.body.database.type).toBe('postgres');
    expect(res.body.database).not.toHaveProperty('schema_version'); // SQLite migration field
    expect(res.body.mode).toMatch(/POSTGRESQL|DISCONNECTED/);
  });

  it('GET /api/health responds with 503 when PostgreSQL connection is unverified', async () => {
    setPrismaActiveForTest(false);
    const res = await request(app).get('/api/health');

    // When connection is not verified, must report degraded status and 503
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database.connected).toBe(false);
    expect(res.body.database.type).toBe('postgres');
  });

  it('GET /api/unknown-endpoint returns 404 with structured JSON', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
    expect(res.body.message).toContain('/api/unknown-endpoint');
  });

  it('CORS allows authorized development origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect([200, 503]).toContain(res.status);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('CORS rejects unauthorized origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://malicious-site.com');

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('CORS Error');
  });
});
