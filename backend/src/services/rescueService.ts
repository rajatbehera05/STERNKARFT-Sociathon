import crypto from 'crypto';
import { getPrismaClient, isPrismaActive } from '../db/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PrismaClient } from '@prisma/client';

function getPrismaOrThrow(): PrismaClient {
  if (!isPrismaActive()) {
    throw new AppError(
      'PostgreSQL database is currently unavailable. Please verify your local PostgreSQL connection on port 5433 to database sternkraft_db.',
      503
    );
  }
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AppError(
      'Prisma client could not be initialized for configured PostgreSQL database.',
      503
    );
  }
  return prisma;
}

export type IncidentCategory =
  | 'TRAPPED_FLOOD'
  | 'MEDICAL_EMERGENCY'
  | 'COLLAPSE_HAZARD'
  | 'SUPPLIES_WATER'
  | 'OTHER';

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
export type DeliveryState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'GATEWAY_RECEIVED'
  | 'PERSISTED_LOCALLY'
  | 'OPERATOR_ACKNOWLEDGED';

export interface CreateIncidentInput {
  client_incident_id?: string;
  category: IncidentCategory;
  description?: string;
  sender_name?: string;
  sender_phone?: string;
  headcount?: number;
  has_critical_injuries?: boolean;
  has_infants_or_elderly?: boolean;
  water_level_rising?: boolean;
  location_manual?: string;
  location_geo?: {
    latitude: number | null;
    longitude: number | null;
    accuracy_meters?: number | null;
  } | null;
}

export const rescueService = {
  /**
   * Evaluates priority tier using triage criteria (injuries, rising water, vulnerable persons).
   */
  calculatePriority(data: {
    has_critical_injuries?: boolean;
    water_level_rising?: boolean;
    has_infants_or_elderly?: boolean;
    headcount?: number;
    category: IncidentCategory;
  }): PriorityTier {
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
  },

  /**
   * Ingests an SOS incident, performing deduplication and transactional persistence in PostgreSQL.
   */
  async createIncident(input: CreateIncidentInput) {
    const clientIncidentId = input.client_incident_id || crypto.randomUUID();
    const prisma = getPrismaOrThrow();

    // 1. Deduplication check via client_incident_id
    const existing = await prisma.rescueIncident.findUnique({
      where: { clientIncidentId },
    });

    if (existing) {
      return {
        incident: this.formatPrismaIncident(existing),
        deduplicated: true,
      };
    }

    // 2. Generate sequential incident identifier
    const totalCount = await prisma.rescueIncident.count();
    const incidentId = `INC-${String(totalCount + 1).padStart(4, '0')}`;
    const priorityTier = this.calculatePriority({
      has_critical_injuries: input.has_critical_injuries,
      water_level_rising: input.water_level_rising,
      has_infants_or_elderly: input.has_infants_or_elderly,
      headcount: input.headcount,
      category: input.category,
    });

    const lat = input.location_geo?.latitude ?? null;
    const lng = input.location_geo?.longitude ?? null;
    const accuracy = input.location_geo?.accuracy_meters ?? null;

    const created = await prisma.rescueIncident.create({
      data: {
        id: incidentId,
        clientIncidentId,
        category: input.category,
        description: input.description || '',
        senderName: input.sender_name || 'Anonymous Civilian',
        senderPhone: input.sender_phone || null,
        headcount: input.headcount || 1,
        hasCriticalInjuries: Boolean(input.has_critical_injuries),
        hasInfantsOrElderly: Boolean(input.has_infants_or_elderly),
        waterLevelRising: Boolean(input.water_level_rising),
        locationManual: input.location_manual || null,
        latitude: lat,
        longitude: lng,
        accuracyMeters: accuracy,
        priorityTier: priorityTier as any,
        status: 'OPEN',
        deliveryState: 'PERSISTED_LOCALLY',
        acknowledged: false,
        statusHistory: {
          create: {
            previousStatus: 'OPEN',
            newStatus: 'OPEN',
            operatorNotes: 'Distress alert ingested via gateway receiver.',
          },
        },
      },
    });

    return {
      incident: this.formatPrismaIncident(created),
      deduplicated: false,
    };
  },

  /**
   * Retrieves paginated incidents with priority and status filters.
   */
  async getIncidents(params: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(Math.max(1, params.limit || 50), 200);
    const offset = Math.max(0, params.offset || 0);

    const prisma = getPrismaOrThrow();
    const whereClause: any = {};
    if (params.status && params.status !== 'ALL') {
      whereClause.status = params.status;
    }
    if (params.priority && params.priority !== 'ALL') {
      whereClause.priorityTier = params.priority;
    }

    const [total, rows] = await Promise.all([
      prisma.rescueIncident.count({ where: whereClause }),
      prisma.rescueIncident.findMany({
        where: whereClause,
        orderBy: [{ priorityTier: 'asc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      incidents: rows.map((r) => this.formatPrismaIncident(r)),
    };
  },

  /**
   * Retrieves an incident by its ID.
   */
  async getIncidentById(id: string) {
    const prisma = getPrismaOrThrow();
    const incident = await prisma.rescueIncident.findUnique({
      where: { id },
    });

    if (!incident) return null;
    return this.formatPrismaIncident(incident);
  },

  /**
   * Updates status obeying the operational lifecycle state machine.
   * OPEN -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED.
   */
  async updateIncidentStatus(
    id: string,
    newStatus: IncidentStatus,
    operatorNotes?: string
  ) {
    const prisma = getPrismaOrThrow();
    const existing = await prisma.rescueIncident.findUnique({
      where: { id },
    });

    if (!existing) return null;

    if (existing.status === 'RESOLVED') {
      throw new Error(`Incident ${id} is already RESOLVED. Status cannot be modified.`);
    }

    const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
      OPEN: ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'],
      ACKNOWLEDGED: ['IN_PROGRESS', 'RESOLVED'],
      IN_PROGRESS: ['RESOLVED'],
      RESOLVED: [],
    };

    if (!validTransitions[existing.status as IncidentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${newStatus}.`);
    }

    const now = new Date();
    const isAcknowledging = newStatus !== 'OPEN' && !existing.acknowledged;

    const [updated] = await prisma.$transaction([
      prisma.rescueIncident.update({
        where: { id },
        data: {
          status: newStatus,
          acknowledged: isAcknowledging ? true : existing.acknowledged,
          acknowledgedAt: isAcknowledging ? now : existing.acknowledgedAt,
          operatorNotes: operatorNotes !== undefined ? operatorNotes : existing.operatorNotes,
        },
      }),
      prisma.incidentStatusHistory.create({
        data: {
          incidentId: id,
          previousStatus: existing.status as any,
          newStatus: newStatus as any,
          operatorNotes: operatorNotes || null,
        },
      }),
    ]);

    return this.formatPrismaIncident(updated);
  },

  /**
   * Express helper for operator acknowledgement.
   */
  async acknowledgeIncident(id: string, operatorNotes?: string) {
    return this.updateIncidentStatus(
      id,
      'ACKNOWLEDGED',
      operatorNotes || 'Incident acknowledged by field operator.'
    );
  },

  /**
   * Adds a message to an incident thread.
   */
  async addMessage(
    incidentIdOrInput:
      | string
      | {
          incident_id: string;
          sender_name: string;
          sender_id?: string;
          sender_type?: 'CIVILIAN' | 'OPERATOR' | 'RESPONDER' | 'SYSTEM';
          content: string;
        },
    body?: {
      sender_name: string;
      sender_id?: string;
      sender_type?: 'CIVILIAN' | 'OPERATOR' | 'RESPONDER' | 'SYSTEM';
      content: string;
    }
  ) {
    const input =
      typeof incidentIdOrInput === 'string'
        ? { incident_id: incidentIdOrInput, ...body! }
        : incidentIdOrInput;
    const prisma = getPrismaOrThrow();
    const messageId = `MSG-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const created = await prisma.rescueMessage.create({
      data: {
        messageId,
        incidentId: input.incident_id,
        senderName: input.sender_name,
        senderId: input.sender_id || null,
        senderType: input.sender_type || 'CIVILIAN',
        content: input.content,
        deliveryStatus: 'TRANSMITTED',
        timestamp: now,
      },
    });

    return {
      message_id: created.messageId,
      incident_id: created.incidentId,
      sender_id: created.senderId,
      sender_name: created.senderName,
      sender_type: created.senderType,
      content: created.content,
      delivery_status: created.deliveryStatus,
      timestamp: created.timestamp.toISOString(),
    };
  },

  /**
   * Retrieves messages for an incident in chronological order.
   */
  async getMessages(id: string) {
    const prisma = getPrismaOrThrow();
    const rows = await prisma.rescueMessage.findMany({
      where: { incidentId: id },
      orderBy: { timestamp: 'asc' },
    });

    return rows.map((m) => ({
      message_id: m.messageId,
      incident_id: m.incidentId,
      sender_id: m.senderId,
      sender_name: m.senderName,
      sender_type: m.senderType,
      content: m.content,
      delivery_status: m.deliveryStatus,
      timestamp: m.timestamp.toISOString(),
    }));
  },

  /**
   * Submits a responder status and GPS update.
   */
  async updateResponderStatus(input: {
    responder_id: string;
    name?: string;
    role?: string;
    callsign?: string;
    status: 'ACTIVE' | 'EN_ROUTE' | 'ON_SCENE' | 'RESTING' | 'OFFLINE';
    latitude?: number;
    longitude?: number;
    battery_pct?: number;
  }) {
    const prisma = getPrismaOrThrow();
    const now = new Date();

    const responder = await prisma.responder.upsert({
      where: { responderId: input.responder_id },
      create: {
        responderId: input.responder_id,
        name: input.name || `Responder ${input.responder_id}`,
        role: input.role || 'PARAMEDIC',
        callsign: input.callsign || `UNIT-${input.responder_id}`,
        currentStatus: input.status,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        batteryPct: input.battery_pct ?? null,
        lastSeenAt: now,
        updates: {
          create: {
            status: input.status,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            batteryPct: input.battery_pct ?? null,
            timestamp: now,
          },
        },
      },
      update: {
        currentStatus: input.status,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
        batteryPct: input.battery_pct ?? undefined,
        lastSeenAt: now,
        updates: {
          create: {
            status: input.status,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            batteryPct: input.battery_pct ?? null,
            timestamp: now,
          },
        },
      },
    });

    return this.formatPrismaResponder(responder);
  },

  /**
   * Retrieves responders with calculated freshness flags (derives stale/offline status).
   */
  async getResponders() {
    const prisma = getPrismaOrThrow();
    const rows = await prisma.responder.findMany({
      orderBy: { lastSeenAt: 'desc' },
    });
    return rows.map((r) => this.formatPrismaResponder(r));
  },

  // Helper formatting methods for Prisma rows
  formatPrismaIncident(r: any) {
    return {
      id: r.id,
      client_incident_id: r.clientIncidentId,
      category: r.category,
      description: r.description,
      sender_name: r.senderName,
      sender_phone: r.senderPhone,
      headcount: r.headcount,
      has_critical_injuries: r.hasCriticalInjuries,
      has_infants_or_elderly: r.hasInfantsOrElderly,
      water_level_rising: r.waterLevelRising,
      location_manual: r.locationManual,
      location_geo:
        r.latitude !== null && r.longitude !== null
          ? {
              latitude: r.latitude,
              longitude: r.longitude,
              accuracy_meters: r.accuracyMeters,
            }
          : null,
      priority_tier: r.priorityTier,
      status: r.status,
      delivery_state: r.deliveryState,
      acknowledged: r.acknowledged,
      acknowledged_at: r.acknowledgedAt?.toISOString() || null,
      operator_notes: r.operatorNotes,
      created_at: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
      updated_at: r.updatedAt?.toISOString ? r.updatedAt.toISOString() : r.updatedAt,
    };
  },

  formatPrismaResponder(r: any) {
    const lastSeenTime = r.lastSeenAt ? new Date(r.lastSeenAt).getTime() : Date.now();
    const secondsSinceLastSeen = Math.max(0, Math.floor((Date.now() - lastSeenTime) / 1000));
    const isStale = secondsSinceLastSeen > 120; // 2 minutes stale threshold

    return {
      responder_id: r.responderId,
      name: r.name,
      role: r.role,
      callsign: r.callsign,
      current_status: isStale ? 'OFFLINE' : r.currentStatus,
      is_stale: isStale,
      last_seen_at: r.lastSeenAt?.toISOString ? r.lastSeenAt.toISOString() : r.lastSeenAt,
      seconds_since_last_seen: secondsSinceLastSeen,
      location_geo:
        r.latitude !== null && r.longitude !== null
          ? {
              latitude: r.latitude,
              longitude: r.longitude,
            }
          : null,
      battery_pct: r.batteryPct,
    };
  },
};
