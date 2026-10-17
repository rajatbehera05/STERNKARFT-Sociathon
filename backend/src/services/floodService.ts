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

export interface FloodThresholdDto {
  id: string;
  reference_height_cm: number;
  watch_depth_cm: number;
  warning_depth_cm: number;
  critical_depth_cm: number;
  stale_timeout_sec: number;
}

export interface IngestTelemetryInput {
  reading_id?: string;
  timestamp?: string;
  water_surface_distance_cm: number | null;
  reference_height_cm?: number;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  soil_moisture_pct?: number | null;
  data_source?: 'HARDWARE_LIVE' | 'SIMULATED';
  is_valid?: boolean;
}

export const floodService = {
  /**
   * Retrieves the current authoritative threshold configuration.
   * Standardized on Prisma ORM targeting PostgreSQL.
   */
  async getCurrentThresholds(): Promise<FloodThresholdDto> {
    const prisma = getPrismaOrThrow();
    const row = await prisma.floodThreshold.findFirst({
      where: { isCurrent: true },
      orderBy: { createdAt: 'desc' },
    });

    if (row) {
      return {
        id: row.id,
        reference_height_cm: row.referenceHeightCm,
        watch_depth_cm: row.watchDepthCm,
        warning_depth_cm: row.warningDepthCm,
        critical_depth_cm: row.criticalDepthCm,
        stale_timeout_sec: row.staleTimeoutSec,
      };
    }

    // If empty in PostgreSQL, seed default authoritative configuration
    const created = await prisma.floodThreshold.create({
      data: {
        referenceHeightCm: 200,
        watchDepthCm: 80,
        warningDepthCm: 120,
        criticalDepthCm: 160,
        staleTimeoutSec: 30,
        isCurrent: true,
      },
    });

    return {
      id: created.id,
      reference_height_cm: created.referenceHeightCm,
      watch_depth_cm: created.watchDepthCm,
      warning_depth_cm: created.warningDepthCm,
      critical_depth_cm: created.criticalDepthCm,
      stale_timeout_sec: created.staleTimeoutSec,
    };
  },

  /**
   * Updates and persists the authoritative threshold configuration.
   */
  async updateThresholds(input: {
    reference_height_cm: number;
    watch_depth_cm: number;
    warning_depth_cm: number;
    critical_depth_cm: number;
    stale_timeout_sec: number;
  }): Promise<FloodThresholdDto> {
    const prisma = getPrismaOrThrow();
    await prisma.$transaction([
      prisma.floodThreshold.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      }),
      prisma.floodThreshold.create({
        data: {
          referenceHeightCm: input.reference_height_cm,
          watchDepthCm: input.watch_depth_cm,
          warningDepthCm: input.warning_depth_cm,
          criticalDepthCm: input.critical_depth_cm,
          staleTimeoutSec: input.stale_timeout_sec,
          isCurrent: true,
        },
      }),
    ]);
    return this.getCurrentThresholds();
  },

  /**
   * Ingests sensor telemetry reading, calculates depth, determines trend, and triggers alerts.
   */
  async ingestTelemetry(input: IngestTelemetryInput) {
    const thresholds = await this.getCurrentThresholds();
    const readingId = input.reading_id || `TEL-${Date.now().toString().slice(-6)}`;
    const nowIso = input.timestamp || new Date().toISOString();
    const timestampDate = new Date(nowIso);
    const dataSource = input.data_source || 'SIMULATED';
    const isValid = input.is_valid ?? true;

    let calculatedDepthCm: number | null = null;
    if (isValid && input.water_surface_distance_cm !== null && input.water_surface_distance_cm >= 0) {
      calculatedDepthCm = Math.max(0, +(thresholds.reference_height_cm - input.water_surface_distance_cm).toFixed(1));
    }

    const prisma = getPrismaOrThrow();
    const previous = await prisma.floodTelemetry.findFirst({
      where: { isValid: true },
      orderBy: { timestamp: 'desc' },
      select: { calculatedDepthCm: true },
    });

    let trend = 'STABLE';
    if (calculatedDepthCm !== null && previous && previous.calculatedDepthCm !== null) {
      const delta = calculatedDepthCm - previous.calculatedDepthCm;
      if (delta > 0.5) trend = 'RISING';
      else if (delta < -0.5) trend = 'RECEDING';
    }

    const created = await prisma.floodTelemetry.create({
      data: {
        readingId,
        timestamp: timestampDate,
        waterDistanceCm: input.water_surface_distance_cm,
        calculatedDepthCm,
        temperatureC: input.temperature_c ?? null,
        humidityPct: input.humidity_pct ?? null,
        soilMoisturePct: input.soil_moisture_pct ?? null,
        trend,
        dataSource,
        isValid,
      },
    });

    // Alert Evaluation
    if (calculatedDepthCm !== null) {
      if (calculatedDepthCm >= thresholds.critical_depth_cm) {
        await this.createAlertIfNewPrisma(prisma, {
          severity: 'CRITICAL',
          headline: `Critical Flood Inundation (${calculatedDepthCm} cm)`,
          actionText: 'Execute immediate evacuation; sound audible alarms and notify rescue command.',
          triggerDepthCm: calculatedDepthCm,
          dataSource,
        });
      } else if (calculatedDepthCm >= thresholds.warning_depth_cm) {
        await this.createAlertIfNewPrisma(prisma, {
          severity: 'WARNING',
          headline: `Stage 2 Warning Level Breached (${calculatedDepthCm} cm)`,
          actionText: 'Dispatch field inspection teams and prepare flood mitigation gates.',
          triggerDepthCm: calculatedDepthCm,
          dataSource,
        });
      } else if (calculatedDepthCm >= thresholds.watch_depth_cm) {
        await this.createAlertIfNewPrisma(prisma, {
          severity: 'WATCH',
          headline: `Stage 1 Watch Advisory Active (${calculatedDepthCm} cm)`,
          actionText: 'Continuous hydrological monitoring advised; verify channel egress.',
          triggerDepthCm: calculatedDepthCm,
          dataSource,
        });
      }
    }

    return {
      id: created.id,
      reading_id: created.readingId,
      timestamp: created.timestamp.toISOString(),
      water_surface_distance_cm: created.waterDistanceCm,
      calculated_depth_cm: created.calculatedDepthCm,
      reference_height_cm: thresholds.reference_height_cm,
      temperature_c: created.temperatureC,
      humidity_pct: created.humidityPct,
      soil_moisture_pct: created.soilMoisturePct,
      trend: created.trend,
      data_source: created.dataSource,
      is_valid: created.isValid,
    };
  },

  async createAlertIfNewPrisma(prisma: PrismaClient, alert: {
    severity: string;
    headline: string;
    actionText: string;
    triggerDepthCm: number;
    dataSource: string;
  }) {
    const existing = await prisma.floodAlert.findFirst({
      where: { severity: alert.severity, acknowledged: false },
    });

    if (!existing) {
      await prisma.floodAlert.create({
        data: {
          alertId: `ALT-${Date.now().toString().slice(-6)}`,
          timestamp: new Date(),
          severity: alert.severity,
          headline: alert.headline,
          actionText: alert.actionText,
          triggerDepthCm: alert.triggerDepthCm,
          dataSource: alert.dataSource,
        },
      });
    }
  },

  /**
   * Returns latest telemetry reading, risk state, and data freshness.
   */
  async getLatestStatus() {
    const thresholds = await this.getCurrentThresholds();
    const prisma = getPrismaOrThrow();
    const latest = await prisma.floodTelemetry.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latest) {
      return {
        has_reading: false,
        risk_level: 'NORMAL',
        freshness: {
          seconds_old: null,
          is_stale: true,
          status_label: 'NO TELEMETRY RECORDED',
          source: 'NONE',
        },
        thresholds,
        latest_reading: null,
      };
    }

    const secondsOld = Math.max(0, +((Date.now() - latest.timestamp.getTime()) / 1000).toFixed(1));
    const isStale = secondsOld > thresholds.stale_timeout_sec;
    const depth = latest.calculatedDepthCm;

    let riskLevel = 'NORMAL';
    if (depth !== null && latest.isValid) {
      if (depth >= thresholds.critical_depth_cm) riskLevel = 'CRITICAL';
      else if (depth >= thresholds.warning_depth_cm) riskLevel = 'WARNING';
      else if (depth >= thresholds.watch_depth_cm) riskLevel = 'WATCH';
    }

    return {
      has_reading: true,
      risk_level: isStale ? 'UNKNOWN_STALE' : riskLevel,
      freshness: {
        seconds_old: secondsOld,
        is_stale: isStale,
        status_label: isStale ? `${secondsOld}s (EXCEEDED TIMEOUT: STALE)` : `${secondsOld}s (NOMINAL FRESHNESS)`,
        source: latest.dataSource,
      },
      thresholds,
      latest_reading: {
        reading_id: latest.readingId,
        timestamp: latest.timestamp.toISOString(),
        water_surface_distance_cm: latest.waterDistanceCm,
        calculated_depth_cm: latest.calculatedDepthCm,
        reference_height_cm: thresholds.reference_height_cm,
        temperature_c: latest.temperatureC,
        humidity_pct: latest.humidityPct,
        soil_moisture_pct: latest.soilMoisturePct,
        trend: isStale ? 'OFFLINE' : latest.trend,
        data_source: latest.dataSource,
        is_valid: latest.isValid,
      },
    };
  },

  /**
   * Retrieves persisted telemetry history with pagination and source filtering.
   */
  async getReadings(params: { limit?: number; offset?: number; dataSource?: string }) {
    const limit = Math.min(Math.max(1, params.limit || 50), 200);
    const offset = Math.max(0, params.offset || 0);

    const prisma = getPrismaOrThrow();
    const whereClause: any = {};
    if (params.dataSource && params.dataSource !== 'ALL') {
      whereClause.dataSource = params.dataSource;
    }

    const [total, rows] = await Promise.all([
      prisma.floodTelemetry.count({ where: whereClause }),
      prisma.floodTelemetry.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      total,
      limit,
      offset,
      readings: rows.map((r) => ({
        reading_id: r.readingId,
        timestamp: r.timestamp.toISOString(),
        water_surface_distance_cm: r.waterDistanceCm,
        calculated_depth_cm: r.calculatedDepthCm,
        temperature_c: r.temperatureC,
        humidity_pct: r.humidityPct,
        soil_moisture_pct: r.soilMoisturePct,
        trend: r.trend,
        data_source: r.dataSource,
        is_valid: r.isValid,
      })),
    };
  },

  /**
   * Retrieves alerts ledger with optional severity and acknowledgement filtering.
   */
  async getAlerts(params: { severity?: string; acknowledged?: boolean }) {
    const prisma = getPrismaOrThrow();
    const whereClause: any = {};
    if (params.severity && params.severity !== 'ALL') {
      whereClause.severity = params.severity;
    }
    if (params.acknowledged !== undefined) {
      whereClause.acknowledged = params.acknowledged;
    }

    const rows = await prisma.floodAlert.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      alert_id: r.alertId,
      timestamp: r.timestamp.toISOString(),
      severity: r.severity,
      headline: r.headline,
      action_text: r.actionText,
      trigger_depth_cm: r.triggerDepthCm,
      acknowledged: r.acknowledged,
      acknowledged_at: r.acknowledgedAt?.toISOString() || null,
      data_source: r.dataSource,
    }));
  },

  /**
   * Acknowledges an alert by unique ID.
   */
  async acknowledgeAlert(id: string) {
    const prisma = getPrismaOrThrow();
    const now = new Date();

    const existing = await prisma.floodAlert.findFirst({
      where: { OR: [{ id }, { alertId: id }] },
    });

    if (!existing) return null;

    const updated = await prisma.floodAlert.update({
      where: { id: existing.id },
      data: { acknowledged: true, acknowledgedAt: now },
    });

    return {
      id: updated.id,
      alert_id: updated.alertId,
      timestamp: updated.timestamp.toISOString(),
      severity: updated.severity,
      headline: updated.headline,
      action_text: updated.actionText,
      trigger_depth_cm: updated.triggerDepthCm,
      acknowledged: updated.acknowledged,
      acknowledged_at: updated.acknowledgedAt?.toISOString() || null,
      data_source: updated.dataSource,
    };
  },

  /**
   * Deletes simulated demo alerts only, protecting live hardware alerts.
   */
  async clearDemoAlerts(): Promise<{ deleted_count: number }> {
    const prisma = getPrismaOrThrow();
    const res = await prisma.floodAlert.deleteMany({
      where: { dataSource: 'SIMULATED' },
    });
    return { deleted_count: res.count };
  },

  /**
   * Retrieves authoritative node health, actual freshness, and source status.
   */
  async getDeviceHealth() {
    const status = await this.getLatestStatus();
    return {
      node_id: 'NODE-ESP32-FL01',
      hardware_model: 'ESP32 DevKit WROOM-32',
      firmware_version: 'v1.0.0-PROTOTYPE',
      telemetry_freshness: status.freshness,
      telemetry_source: status.freshness.source,
      is_online: !status.freshness.is_stale,
      thresholds: status.thresholds,
      sensor_specifications: [
        {
          name: 'HC-SR04',
          role: 'Ultrasonic Water Level Measurement',
          pins: 'TRIG: GPIO 5, ECHO: GPIO 18 (with 1k/2k voltage divider to 3.3V)',
          status: status.freshness.is_stale ? 'TIMEOUT' : 'HEALTHY',
        },
        {
          name: 'DHT11',
          role: 'Ambient Air Temperature & Humidity',
          pins: 'DATA: GPIO 4',
          status: 'HEALTHY',
        },
        {
          name: 'Capacitive Soil Moisture v1.2',
          role: 'Ground Saturation Level',
          pins: 'AOUT: GPIO 34 (ADC1)',
          status: 'HEALTHY',
        },
      ],
    };
  },
};
