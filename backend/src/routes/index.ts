import { Router, Request, Response, NextFunction } from 'express';
import { healthRouter } from './health.js';
import { floodRouter } from './flood.js';
import { rescueRouter } from './rescue.js';
import { reliefRouter } from './relief.js';
import { authRouter } from './auth.js';
import { rescueService } from '../services/rescueService.js';
import { isPrismaActive, getPrismaClient } from '../db/prisma.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

export const apiRouter = Router();

// 1. Health check & system diagnostics
apiRouter.use('/health', healthRouter);

// 2. Operator Authentication
apiRouter.use('/auth', authRouter);

// 3. DisasterSense Flood Monitoring Domain
apiRouter.use('/flood', floodRouter);

// 4. ReQNet Rescue Communication Domain
apiRouter.use('/rescue', rescueRouter);

// 5. Relief Coordination Domain (Public submission & Protected operator triage)
apiRouter.use('/relief', reliefRouter);

// Rate limiter for public SOS submissions (max 15 submissions per minute per IP)
const publicSosLimiter = createRateLimiter(60 * 1000, 15);

// ------------------------------------------------------------------------------
// Top-level aliases for existing frontend API service compatibility
// ------------------------------------------------------------------------------

// GET /api/incidents
apiRouter.get('/incidents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const result = await rescueService.getIncidents({ status, priority, limit, offset });
    res.status(200).json(result.incidents);
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id
apiRouter.get('/incidents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const incident = await rescueService.getIncidentById(incidentId);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.status(200).json(incident);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/incidents/:id/status
apiRouter.patch('/incidents/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, operator_notes } = req.body;
    // Map NEW to OPEN if needed
    const mappedStatus = status === 'NEW' ? 'OPEN' : status;
    const updated = await rescueService.updateIncidentStatus(incidentId, mappedStatus, operator_notes);
    if (!updated) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/sos
apiRouter.post('/sos', publicSosLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await rescueService.createIncident(req.body);
    const inc = result.incident;
    res.status(201).json({
      success: true,
      incident_id: inc.id,
      client_incident_id: inc.client_incident_id,
      delivery_state: inc.delivery_state,
      priority_tier: inc.priority_tier,
      received_at: inc.created_at,
      deduplicated: result.deduplicated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events (Communication & Incident event logs)
apiRouter.get('/events', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isPrismaActive()) {
      throw new AppError('PostgreSQL database is currently unavailable.', 503);
    }
    const prisma = getPrismaClient();
    const rows = await prisma.incidentStatusHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: 100,
    });

    return res.status(200).json(
      rows.map((r: any) => ({
        id: `EVT-${r.id.slice(0, 8)}`,
        incident_id: r.incidentId,
        event_type: r.newStatus === 'OPEN' ? 'GATEWAY_RECEIVED' : 'STATUS_CHANGED',
        details: r.operatorNotes || `Status transitioned to ${r.newStatus}`,
        timestamp: r.changedAt.toISOString(),
      }))
    );
  } catch (err) {
    next(err);
  }
});
