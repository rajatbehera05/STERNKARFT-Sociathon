import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { rescueService } from '../src/services/rescueService.js';
import { closePrisma } from '../src/db/prisma.js';

describe('Rescue Operations Module (/api/rescue)', () => {
  afterAll(async () => {
    await closePrisma();
  });

  it('calculatePriority computes correct triage tier across all scenarios', () => {
    // Critical: rising water
    expect(
      rescueService.calculatePriority({
        category: 'TRAPPED_FLOOD',
        water_level_rising: true,
      })
    ).toBe('CRITICAL');

    // Critical: injuries
    expect(
      rescueService.calculatePriority({
        category: 'MEDICAL_EMERGENCY',
        has_critical_injuries: true,
      })
    ).toBe('CRITICAL');

    // High: vulnerable demographic (infants/elderly)
    expect(
      rescueService.calculatePriority({
        category: 'TRAPPED_FLOOD',
        has_infants_or_elderly: true,
      })
    ).toBe('HIGH');

    // High: large group headcount > 5
    expect(
      rescueService.calculatePriority({
        category: 'SUPPLIES_WATER',
        headcount: 8,
      })
    ).toBe('HIGH');

    // Medium: standard trapped flood
    expect(
      rescueService.calculatePriority({
        category: 'TRAPPED_FLOOD',
        headcount: 2,
      })
    ).toBe('MEDIUM');

    // Low: general supply request
    expect(
      rescueService.calculatePriority({
        category: 'SUPPLIES_WATER',
        headcount: 2,
      })
    ).toBe('LOW');
  });

  it('POST /api/rescue/incidents rejects invalid category enum', async () => {
    const res = await request(app)
      .post('/api/rescue/incidents')
      .send({
        category: 'INVALID_CATEGORY',
        headcount: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('validation failed');
  });

  it('POST /api/rescue/incidents rejects headcount > 500', async () => {
    const res = await request(app)
      .post('/api/rescue/incidents')
      .send({
        category: 'TRAPPED_FLOOD',
        headcount: 9999,
      });

    expect(res.status).toBe(400);
  });

  it('PATCH /api/rescue/incidents/:id/status rejects invalid status enum', async () => {
    const res = await request(app)
      .patch('/api/rescue/incidents/INC-0001/status')
      .send({
        status: 'NON_EXISTENT_STATUS',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/rescue/incidents/:id/messages rejects empty message body', async () => {
    const res = await request(app)
      .post('/api/rescue/incidents/INC-0001/messages')
      .send({
        content: '',
        sender_name: 'Operator',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('validation failed');
  });

  it('POST /api/rescue/responders/status rejects invalid responder status enum', async () => {
    const res = await request(app)
      .post('/api/rescue/responders/status')
      .send({
        responder_id: 'RESP-01',
        status: 'FLYING_AIRPLANE',
      });

    expect(res.status).toBe(400);
  });
});
