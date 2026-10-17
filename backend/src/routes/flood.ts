import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { floodService } from '../services/floodService.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const floodRouter = Router();

// Validation Schemas
const TelemetryInputSchema = z.object({
  reading_id: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  water_surface_distance_cm: z.number().nullable(),
  reference_height_cm: z.number().positive().optional(),
  temperature_c: z.number().nullable().optional(),
  humidity_pct: z.number().min(0).max(100).nullable().optional(),
  soil_moisture_pct: z.number().min(0).max(100).nullable().optional(),
  data_source: z.enum(['HARDWARE_LIVE', 'SIMULATED']).default('SIMULATED'),
  is_valid: z.boolean().default(true),
});

const ThresholdConfigSchema = z
  .object({
    reference_height_cm: z.number().positive('Reference height must be positive (> 0 cm).'),
    watch_depth_cm: z.number().positive('Watch depth must be positive (> 0 cm).'),
    warning_depth_cm: z.number().positive('Warning depth must be positive (> 0 cm).'),
    critical_depth_cm: z.number().positive('Critical depth must be positive (> 0 cm).'),
    stale_timeout_sec: z.number().int().min(5, 'Stale timeout must be at least 5 seconds.'),
  })
  .refine((data) => data.watch_depth_cm < data.warning_depth_cm, {
    message: 'Watch depth must be strictly less than Warning depth.',
    path: ['watch_depth_cm'],
  })
  .refine((data) => data.warning_depth_cm < data.critical_depth_cm, {
    message: 'Warning depth must be strictly less than Critical depth.',
    path: ['warning_depth_cm'],
  })
  .refine((data) => data.critical_depth_cm < data.reference_height_cm, {
    message: 'Critical depth must be strictly less than Bed Reference Height.',
    path: ['critical_depth_cm'],
  });

// 1. POST /api/flood/telemetry — validate and store sensor readings; calculate water depth
floodRouter.post(
  '/telemetry',
  validateBody(TelemetryInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reading = await floodService.ingestTelemetry(req.body);
      res.status(201).json({
        success: true,
        reading,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. GET /api/flood/status — latest reading, risk level, and data freshness
floodRouter.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await floodService.getLatestStatus();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/flood/readings — persisted history with pagination
floodRouter.get('/readings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const dataSource = req.query.dataSource as string | undefined;

    const result = await floodService.getReadings({ limit, offset, dataSource });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 4. GET /api/flood/alerts — alert ledger
floodRouter.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const severity = req.query.severity as string | undefined;
    const acknowledged =
      req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : undefined;

    const alerts = await floodService.getAlerts({ severity, acknowledged });
    res.status(200).json(alerts);
  } catch (err) {
    next(err);
  }
});

// 4b. POST /api/flood/alerts/:id/acknowledge — acknowledge alert
floodRouter.post('/alerts/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await floodService.acknowledgeAlert(alertId);
    if (!updated) {
      throw new AppError('Alert not found', 404);
    }
    res.status(200).json({
      success: true,
      message: 'Alert acknowledged by operator. Note: hazard state remains active until water level recedes.',
      alert: updated,
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /api/flood/alerts/demo — delete simulated alerts only
floodRouter.delete('/alerts/demo', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await floodService.clearDemoAlerts();
    res.status(200).json({
      success: true,
      message: `Cleared ${result.deleted_count} simulated demo alerts. Live hardware alerts preserved.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// 6. GET /api/flood/config — current thresholds
floodRouter.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await floodService.getCurrentThresholds();
    res.status(200).json(config);
  } catch (err) {
    next(err);
  }
});

// 6b. PUT /api/flood/config — update thresholds with strict hierarchy enforcement
floodRouter.put(
  '/config',
  validateBody(ThresholdConfigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await floodService.updateThresholds(req.body);
      res.status(200).json({
        success: true,
        message: 'Authoritative calibration updated and propagated across flood monitoring systems.',
        config: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 7. GET /api/flood/device-health — actual data freshness and source status
floodRouter.get('/device-health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await floodService.getDeviceHealth();
    res.status(200).json(health);
  } catch (err) {
    next(err);
  }
});
