import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rescueService } from '../services/rescueService.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const rescueRouter = Router();

// Validation Schemas
const CreateIncidentSchema = z.object({
  client_incident_id: z.string().optional(),
  category: z.enum([
    'TRAPPED_FLOOD',
    'MEDICAL_EMERGENCY',
    'COLLAPSE_HAZARD',
    'SUPPLIES_WATER',
    'OTHER',
  ]),
  description: z.string().max(1000).optional(),
  sender_name: z.string().max(100).optional(),
  sender_phone: z.string().max(30).optional(),
  headcount: z.number().int().min(1).max(500).default(1),
  has_critical_injuries: z.boolean().default(false),
  has_infants_or_elderly: z.boolean().default(false),
  water_level_rising: z.boolean().default(false),
  location_manual: z.string().max(300).optional(),
  location_geo: z
    .object({
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      accuracy_meters: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED']),
  operator_notes: z.string().max(500).optional(),
});

const AcknowledgeSchema = z.object({
  operator_notes: z.string().max(500).optional(),
});

const MessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
  sender_name: z.string().min(1).max(100),
  sender_id: z.string().max(50).optional(),
  sender_type: z.enum(['CIVILIAN', 'OPERATOR', 'RESPONDER', 'SYSTEM']).default('CIVILIAN'),
});

const ResponderStatusSchema = z.object({
  responder_id: z.string().min(1).max(50),
  name: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  callsign: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'EN_ROUTE', 'ON_SCENE', 'RESTING', 'OFFLINE']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  battery_pct: z.number().int().min(0).max(100).optional(),
});

// 1. POST /api/rescue/incidents — create an SOS/rescue incident
rescueRouter.post(
  '/incidents',
  validateBody(CreateIncidentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rescueService.createIncident(req.body);
      res.status(result.deduplicated ? 200 : 201).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. GET /api/rescue/incidents — list incidents with filtering and pagination
rescueRouter.get('/incidents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await rescueService.getIncidents({ status, priority, limit, offset });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/rescue/incidents/:id — retrieve incident details
rescueRouter.get('/incidents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const incident = await rescueService.getIncidentById(incidentId);
    if (!incident) {
      throw new AppError(`Rescue incident ${incidentId} not found`, 404);
    }
    res.status(200).json(incident);
  } catch (err) {
    next(err);
  }
});

// 4. PATCH /api/rescue/incidents/:id/status — update incident status
rescueRouter.patch(
  '/incidents/:id/status',
  validateBody(UpdateStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, operator_notes } = req.body;
      const updated = await rescueService.updateIncidentStatus(incidentId, status, operator_notes);
      if (!updated) {
        throw new AppError(`Rescue incident ${incidentId} not found`, 404);
      }
      res.status(200).json({
        success: true,
        incident: updated,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid status transition')) {
        next(new AppError(err.message, 400));
      } else {
        next(err);
      }
    }
  }
);

// 5. POST /api/rescue/incidents/:id/acknowledge — acknowledge an incident without resolving it
rescueRouter.post(
  '/incidents/:id/acknowledge',
  validateBody(AcknowledgeSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { operator_notes } = req.body;
      const updated = await rescueService.acknowledgeIncident(incidentId, operator_notes);
      if (!updated) {
        throw new AppError(`Rescue incident ${incidentId} not found`, 404);
      }
      res.status(200).json({
        success: true,
        message: 'Incident acknowledged by operator. Incident remains active for responder dispatch.',
        incident: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 6. POST /api/rescue/incidents/:id/messages — submit message associated with incident
rescueRouter.post(
  '/incidents/:id/messages',
  validateBody(MessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const message = await rescueService.addMessage(incidentId, req.body);
      if (!message) {
        throw new AppError(`Rescue incident ${incidentId} not found`, 404);
      }
      res.status(201).json({
        success: true,
        message,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 7. GET /api/rescue/incidents/:id/messages — retrieve chronological messages
rescueRouter.get('/incidents/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const messages = await rescueService.getMessages(incidentId);
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

// 8. POST /api/rescue/responders/status — submit responder update
rescueRouter.post(
  '/responders/status',
  validateBody(ResponderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const responder = await rescueService.updateResponderStatus(req.body);
      res.status(200).json({
        success: true,
        responder,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 9. GET /api/rescue/responders — list responders with freshness
rescueRouter.get('/responders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const responders = await rescueService.getResponders();
    res.status(200).json(responders);
  } catch (err) {
    next(err);
  }
});
