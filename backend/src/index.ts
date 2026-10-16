import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(INCIDENTS_FILE)) {
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(EVENTS_FILE)) {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2));
}

// Helpers for reading and writing data
const readIncidents = (): any[] => {
  try {
    const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading incidents file:', err);
    return [];
  }
};

const writeIncidents = (incidents: any[]) => {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
  } catch (err) {
    console.error('Error writing incidents file:', err);
  }
};

const readEvents = (): any[] => {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading events file:', err);
    return [];
  }
};

const appendEvent = (event: {
  incident_id: string;
  event_type: string;
  details: string;
}) => {
  try {
    const events = readEvents();
    const newEvent = {
      id: `EVT-${String(events.length + 1).padStart(4, '0')}`,
      ...event,
      timestamp: new Date().toISOString(),
    };
    events.unshift(newEvent);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
    return newEvent;
  } catch (err) {
    console.error('Error logging event:', err);
  }
};

// Priority Triage Calculator as per PRD Section 8.4
const calculatePriority = (data: {
  has_critical_injuries?: boolean;
  water_level_rising?: boolean;
  has_infants_or_elderly?: boolean;
  headcount?: number;
  category: string;
}): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (data.has_critical_injuries || data.water_level_rising) {
    return 'CRITICAL';
  }
  if (data.has_infants_or_elderly || (data.headcount && data.headcount > 5)) {
    return 'HIGH';
  }
  if (data.category === 'TRAPPED_FLOOD') {
    return 'MEDIUM';
  }
  return 'LOW';
};

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.use(cors());
app.use(express.json());

// 1. Health check endpoint (indicates offline-local mode and gateway connection)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'sternkraft-backend',
    mode: 'OFFLINE_LOCAL',
    gateway_connected: true,
    timestamp: new Date().toISOString(),
  });
});

// 2. GET /api/incidents - list all persisted incidents (sorted newest first)
app.get('/api/incidents', (_req: Request, res: Response) => {
  const incidents = readIncidents();
  // Sort by created_at descending
  incidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.status(200).json(incidents);
});

// 3. GET /api/incidents/:id - get single incident
app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const incidents = readIncidents();
  const incident = incidents.find((inc: any) => inc.id === incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.status(200).json(incident);
});

// 4. POST /api/incidents - Ingestion endpoint
const CreateIncidentSchema = z.object({
  client_incident_id: z.string().optional(),
  category: z.enum([
    'TRAPPED_FLOOD',
    'MEDICAL_EMERGENCY',
    'COLLAPSE_HAZARD',
    'SUPPLIES_WATER',
    'OTHER',
  ]),
  description: z.string().max(500).optional(),
  sender_name: z.string().max(100).optional(),
  sender_phone: z.string().max(30).optional(),
  headcount: z.number().int().min(1).max(100).default(1),
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

// Helper for creating and persisting an incident (shared by /api/incidents and /api/sos)
const handleCreateIncident = (req: Request, res: Response) => {
  const parseResult = CreateIncidentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
  }

  const data = parseResult.data;
  const incidents = readIncidents();

  // Deduplication check using client_incident_id (PRD Section 8.1 & 8.3)
  if (data.client_incident_id) {
    const existing = incidents.find((i) => i.client_incident_id === data.client_incident_id);
    if (existing) {
      return res.status(200).json({
        success: true,
        incident_id: existing.id,
        client_incident_id: existing.client_incident_id,
        delivery_state: existing.delivery_state,
        priority_tier: existing.priority_tier,
        received_at: existing.created_at,
        deduplicated: true,
      });
    }
  }

  const newId = `INC-${String(incidents.length + 1).padStart(4, '0')}`;
  const now = new Date().toISOString();
  const priority_tier = calculatePriority(data);

  const newIncident = {
    id: newId,
    client_incident_id: data.client_incident_id || crypto.randomUUID(),
    category: data.category,
    description: data.description || '',
    sender_name: data.sender_name || 'Anonymous Civilian',
    sender_phone: data.sender_phone || '',
    headcount: data.headcount,
    has_critical_injuries: data.has_critical_injuries,
    has_infants_or_elderly: data.has_infants_or_elderly,
    water_level_rising: data.water_level_rising,
    location_manual: data.location_manual || '',
    location_geo: data.location_geo || null,
    priority_tier,
    status: 'NEW',
    delivery_state: 'PERSISTED_LOCALLY',
    created_at: now,
    updated_at: now,
  };

  incidents.unshift(newIncident);
  writeIncidents(incidents);

  // 1. Log Gateway Ingestion Event
  appendEvent({
    incident_id: newId,
    event_type: 'GATEWAY_RECEIVED',
    details: `Distress alert ingested via gateway receiver (Category: ${data.category}, Headcount: ${data.headcount}).`,
  });

  // 2. Log Non-Volatile Persistence Event
  appendEvent({
    incident_id: newId,
    event_type: 'PERSISTED_LOCALLY',
    details: `Incident ${newId} validated by Zod and persisted locally to ./data/incidents.json (${priority_tier} priority).`,
  });

  res.status(201).json({
    success: true,
    incident_id: newId,
    client_incident_id: newIncident.client_incident_id,
    delivery_state: newIncident.delivery_state,
    priority_tier: newIncident.priority_tier,
    received_at: now,
  });
};

// 4. POST /api/incidents and POST /api/sos - Ingestion endpoints
app.post('/api/incidents', handleCreateIncident);
app.post('/api/sos', handleCreateIncident);

// 5. PATCH /api/incidents/:id/status - Lifecycle transitions
const UpdateStatusSchema = z.object({
  status: z.enum(['NEW', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED']),
  operator_notes: z.string().optional(),
});

app.patch('/api/incidents/:id/status', (req: Request, res: Response) => {
  const parseResult = UpdateStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid status update', details: parseResult.error.format() });
  }

  const { status, operator_notes } = parseResult.data;
  const incidentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const incidents = readIncidents();
  const index = incidents.findIndex((inc: any) => inc.id === incidentId);

  if (index === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const now = new Date().toISOString();
  incidents[index].status = status;
  incidents[index].updated_at = now;
  if (status !== 'NEW') {
    incidents[index].delivery_state = 'OPERATOR_ACKNOWLEDGED';
  }
  if (operator_notes) {
    incidents[index].operator_notes = operator_notes;
  }

  writeIncidents(incidents);

  appendEvent({
    incident_id: incidentId,
    event_type: status === 'ACKNOWLEDGED' ? 'OPERATOR_ACKNOWLEDGED' : 'STATUS_CHANGED',
    details: `Status updated to ${status}${operator_notes ? `: "${operator_notes}"` : ''}`,
  });

  res.status(200).json(incidents[index]);
});

// 6. GET /api/events - Communication & Event log
app.get('/api/events', (_req: Request, res: Response) => {
  const events = readEvents();
  res.status(200).json(events);
});

app.listen(PORT, () => {
  console.log(`[STERNKRAFT Backend] Server listening on http://localhost:${PORT}`);
  console.log(`[STERNKRAFT Backend] Incidents file: ${INCIDENTS_FILE}`);
});
