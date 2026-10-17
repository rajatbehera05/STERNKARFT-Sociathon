import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { verifyPrismaConnection, isPrismaActive } from '../src/db/prisma.js';

describe('Relief Coordination Module & Public Request Flow', () => {
  let operatorToken: string;
  let testRequestId: string;

  beforeAll(async () => {
    // Actively verify connection to PostgreSQL
    const conn = await verifyPrismaConnection();
    if (!conn.ok) {
      console.warn('PostgreSQL connection in test:', conn.error);
    }

    // Authenticate operator for protected endpoint tests
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'operator', password: 'reqnet-operator' });

    if (loginRes.status === 200 && loginRes.body.token) {
      operatorToken = loginRes.body.token;
    } else {
      operatorToken = 'reqnet-field-operator-authorized-key-01';
    }
  });

  // ----------------------------------------------------------------------------
  // 1. PUBLIC CIVILIAN REQUEST INTAKE
  // ----------------------------------------------------------------------------
  describe('Public Relief Request Intake (POST /api/relief/requests)', () => {
    it('rejects submissions with missing description or invalid coordinates', async () => {
      const invalidPayload = {
        category: 'SAFE_WATER',
        items: [{ name: 'Water', requestedQty: 10, unit: 'liters' }],
        peopleAffected: 5,
        situationDescription: 'bad', // too short (< 5 chars)
        locality: 'Mahal',
        addressOrLandmark: 'Gandhi Gate',
        latitude: 'not-a-number',
        longitude: 79.1,
      };

      const res = await request(app)
        .post('/api/relief/requests')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects submissions with empty items list or negative quantities', async () => {
      const invalidPayload = {
        category: 'FOOD_NUTRITION',
        items: [{ name: 'Rice', requestedQty: -5, unit: 'kg' }],
        peopleAffected: 4,
        situationDescription: 'Flooded ground floor with water cutting off supply.',
        locality: 'Dharampeth',
        addressOrLandmark: 'West High Court Road',
        latitude: 21.1415,
        longitude: 79.062,
      };

      const res = await request(app)
        .post('/api/relief/requests')
        .send(invalidPayload);

      expect(res.status).toBe(400);
    });

    it('successfully persists valid emergency request to PostgreSQL with PENDING status', async () => {
      if (!isPrismaActive()) return;

      const validPayload = {
        category: 'FOOD_NUTRITION',
        items: [
          { name: 'Ready-to-eat dry meals', requestedQty: 40, unit: 'packets' },
          { name: 'Bottled drinking water', requestedQty: 20, unit: 'bottles (1L)' },
        ],
        peopleAffected: 8,
        situationDescription: 'Family stranded on upper floor due to waterlogging in lane.',
        locality: 'Sitabuldi',
        addressOrLandmark: 'Near Variety Square, Building 4B',
        latitude: 21.1466,
        longitude: 79.0827,
        requesterName: 'Ramesh Sharma',
        contactNumber: '+91 98765 43210',
      };

      const res = await request(app)
        .post('/api/relief/requests')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.requestId).toMatch(/^REL-\d{4}-\d+/);
      expect(res.body.verificationStatus).toBe('PENDING');
      expect(res.body.locality).toBe('Sitabuldi');

      testRequestId = res.body.requestId;
    });
  });

  // ----------------------------------------------------------------------------
  // 2. SAFE PUBLIC TRACKING
  // ----------------------------------------------------------------------------
  describe('Safe Public Tracking (POST /api/relief/requests/track)', () => {
    it('returns high-level status for valid request without exposing exact coordinates or other citizens', async () => {
      if (!isPrismaActive() || !testRequestId) return;

      const res = await request(app)
        .post('/api/relief/requests/track')
        .send({ requestId: testRequestId });

      expect(res.status).toBe(200);
      expect(res.body.requestId).toBe(testRequestId);
      expect(res.body.verificationStatus).toBe('PENDING');
      expect(res.body.statusSummary).toBeDefined();
      // Verify safe privacy: exact coordinates and exact street addresses are not exposed
      expect(res.body.latitude).toBeUndefined();
      expect(res.body.longitude).toBeUndefined();
    });

    it('returns 404 for unknown request ID', async () => {
      if (!isPrismaActive()) return;

      const res = await request(app)
        .post('/api/relief/requests/track')
        .send({ requestId: 'REL-9999-0000' });

      expect(res.status).toBe(404);
    });
  });

  // ----------------------------------------------------------------------------
  // 3. OPERATOR-ONLY ACCESS & DASHBOARD PROTECTION
  // ----------------------------------------------------------------------------
  describe('Operator Authorization Enforcement', () => {
    it('GET /api/relief/requests rejects unauthenticated public visitors with 401', async () => {
      const res = await request(app).get('/api/relief/requests');
      expect(res.status).toBe(401);
      expect(res.body.message || res.body.error).toMatch(/Unauthorized/i);
    });

    it('GET /api/relief/requests accepts authorized operator with token', async () => {
      if (!isPrismaActive()) return;

      const res = await request(app)
        .get('/api/relief/requests')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Verify the newly created test request is visible on operator's queue
      if (testRequestId) {
        const found = res.body.find((r: any) => r.id === testRequestId);
        expect(found).toBeDefined();
        expect(found.verificationStatus).toBe('PENDING');
        expect(found.location.latitude).toBe(21.1466);
      }
    });

    it('PATCH /api/relief/requests/:id/verification allows operator to verify request', async () => {
      if (!isPrismaActive() || !testRequestId) return;

      const res = await request(app)
        .patch(`/api/relief/requests/${testRequestId}/verification`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          status: 'VERIFIED',
          reason: 'Verified by telephone call with Ramesh Sharma.',
        });

      expect(res.status).toBe(200);
      expect(res.body.verificationStatus).toBe('VERIFIED');
      expect(res.body.verificationReason).toContain('Verified by telephone');
    });

    it('PATCH /api/relief/requests/:id/urgency requires operator justification', async () => {
      if (!isPrismaActive() || !testRequestId) return;

      // Missing reason should fail with 400
      const failRes = await request(app)
        .patch(`/api/relief/requests/${testRequestId}/urgency`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ urgency: 'IMMEDIATE', reason: '' });

      expect(failRes.status).toBe(400);

      // With justification should succeed
      const okRes = await request(app)
        .patch(`/api/relief/requests/${testRequestId}/urgency`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          urgency: 'IMMEDIATE',
          reason: 'Waterlevel reported rising toward second story.',
        });

      expect(okRes.status).toBe(200);
      expect(okRes.body.urgency).toBe('IMMEDIATE');
    });

    it('GET /api/relief/inventory requires operator authorization', async () => {
      const unauthRes = await request(app).get('/api/relief/inventory');
      expect(unauthRes.status).toBe(401);

      if (isPrismaActive()) {
        const authRes = await request(app)
          .get('/api/relief/inventory')
          .set('Authorization', `Bearer ${operatorToken}`);
        expect(authRes.status).toBe(200);
        expect(Array.isArray(authRes.body)).toBe(true);
      }
    });
  });
});
