import { Router, Request, Response, NextFunction } from 'express';
import { reliefService } from '../services/reliefService.js';
import { requireOperatorAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

export const reliefRouter = Router();

// Rate limiter for public relief submissions (max 15 submissions per minute per IP)
const publicReliefLimiter = createRateLimiter(60 * 1000, 15);

// ==============================================================================
// 1. PUBLIC CIVILIAN ENDPOINTS (Safe, No Operator Auth Required)
// ==============================================================================

/**
 * POST /api/relief/requests
 * Public emergency relief request intake
 */
reliefRouter.post(
  '/requests',
  publicReliefLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reliefService.createPublicRequest(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/relief/requests/track
 * Safe public tracking of emergency request status
 * Only returns high-level verification state and status summary;
 * never exposes full personal lists or coordinates to other citizens.
 */
reliefRouter.post(
  '/requests/track',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId, contactPhone } = req.body;
      if (!requestId || typeof requestId !== 'string') {
        throw new AppError('A valid Request ID is required to track emergency relief status.', 400);
      }
      const trackingInfo = await reliefService.trackPublicRequest(requestId, contactPhone);
      res.status(200).json(trackingInfo);
    } catch (err) {
      next(err);
    }
  }
);

// ==============================================================================
// 2. OPERATOR-ONLY ENDPOINTS (Strictly Requires Operator Authorization)
// ==============================================================================

/**
 * GET /api/relief/requests
 * Lists all requests with full coordinates and items for authorized operators
 */
reliefRouter.get(
  '/requests',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, urgency, locality } = req.query;
      const requests = await reliefService.getAllRequests({
        verificationStatus: status as string | undefined,
        urgency: urgency as string | undefined,
        locality: locality as string | undefined,
      });
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/relief/requests/:id/verification
 * Verifies or rejects a request with reason
 */
reliefRouter.patch(
  '/requests/:id/verification',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, reason, operatorNotes } = req.body;

      if (!status || !['PENDING', 'VERIFIED', 'REJECTED', 'CLARIFICATION_NEEDED'].includes(status)) {
        throw new AppError('Invalid verification status.', 400);
      }

      const updated = await reliefService.updateVerification(
        requestId,
        status,
        reason,
        operatorNotes
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/relief/requests/:id/urgency
 * Updates urgency level with recorded justification
 */
reliefRouter.patch(
  '/requests/:id/urgency',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { urgency, reason } = req.body;

      if (!urgency || !['IMMEDIATE', 'URGENT', 'ELEVATED', 'ROUTINE'].includes(urgency)) {
        throw new AppError('Invalid urgency level.', 400);
      }

      const updated = await reliefService.updateUrgency(requestId, urgency, reason);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/relief/inventory
 * Retrieves current depot inventory ledger
 */
reliefRouter.get(
  '/inventory',
  requireOperatorAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const inventory = await reliefService.getInventory();
      res.status(200).json(inventory);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/relief/inventory
 * Adds or updates stock in depot inventory
 */
reliefRouter.post(
  '/inventory',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await reliefService.addOrUpdateInventory(req.body);
      res.status(200).json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/relief/deliveries
 * Retrieves active relief delivery allocations
 */
reliefRouter.get(
  '/deliveries',
  requireOperatorAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveries = await reliefService.getDeliveries();
      res.status(200).json(deliveries);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/relief/deliveries
 * Allocates inventory stock to a request item
 */
reliefRouter.post(
  '/deliveries',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const delivery = await reliefService.createAllocation(req.body);
      res.status(201).json(delivery);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/relief/deliveries/:id/status
 * Advances delivery lifecycle status
 */
reliefRouter.patch(
  '/deliveries/:id/status',
  requireOperatorAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status } = req.body;

      if (!status || !['ASSIGNED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
        throw new AppError('Invalid delivery status.', 400);
      }

      const updated = await reliefService.updateDeliveryStatus(deliveryId, status);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);
