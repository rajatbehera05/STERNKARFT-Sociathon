import { Router, Request, Response, NextFunction } from 'express';
import {
  authenticateOperator,
  requireOperatorAuth,
  revokeOperatorToken,
} from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Authenticates an authorized emergency rescue operator
 */
authRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const authResult = authenticateOperator(username, password);

    if (!authResult) {
      throw new AppError('Invalid operator username or password.', 401);
    }

    res.status(200).json({
      success: true,
      token: authResult.token,
      operator: authResult.operator,
      message: 'Operator authorization granted. Tactical dashboards unlocked.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Verifies current operator session
 */
authRouter.get(
  '/me',
  requireOperatorAuth,
  (req: Request, res: Response) => {
    res.status(200).json({
      authenticated: true,
      operator: req.operator,
    });
  }
);

/**
 * POST /api/auth/logout
 * Logs out and invalidates operator token
 */
authRouter.post(
  '/logout',
  (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      revokeOperatorToken(token);
    }
    res.status(200).json({ success: true, message: 'Operator session logged out.' });
  }
);
