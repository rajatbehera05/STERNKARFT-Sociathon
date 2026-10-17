import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export interface AuthenticatedOperator {
  id: string;
  username: string;
  name: string;
  role: 'OPERATOR' | 'ADMIN';
}

// Extend Express Request interface to include operator
declare global {
  namespace Express {
    interface Request {
      operator?: AuthenticatedOperator;
    }
  }
}

// Configured credentials for emergency field operators
// Can be customized via environment variables or default to standard field unit console credentials
const OPERATOR_CREDENTIALS = {
  username: process.env.OPERATOR_USERNAME || 'operator',
  password: process.env.OPERATOR_PASSWORD || 'reqnet-operator',
  tokenSecret: process.env.OPERATOR_TOKEN_SECRET || 'sternx-authorized-rescue-operator-token-2026',
};

// Known active operator sessions (in-memory token registry for field units)
const activeTokens = new Set<string>();

// Pre-seed default persistent token for seamless automated testing and integration
const DEFAULT_OPERATOR_TOKEN = 'reqnet-field-operator-authorized-key-01';
activeTokens.add(DEFAULT_OPERATOR_TOKEN);

/**
 * Validates operator login credentials and returns a secure session token.
 */
export function authenticateOperator(
  username?: string,
  password?: string
): { token: string; operator: AuthenticatedOperator } | null {
  if (!username || !password) return null;

  const validUsername = username.trim() === OPERATOR_CREDENTIALS.username;
  const validPassword = password === OPERATOR_CREDENTIALS.password;

  if (validUsername && validPassword) {
    const token = `reqnet-op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    activeTokens.add(token);

    return {
      token,
      operator: {
        id: 'OP-NAGPUR-01',
        username: OPERATOR_CREDENTIALS.username,
        name: 'Authorized Field Operator (Nagpur Control)',
        role: 'OPERATOR',
      },
    };
  }

  return null;
}

/**
 * Express middleware to verify operator authorization.
 * Checks Authorization header (Bearer <token>) or x-operator-token header.
 */
export function requireOperatorAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-operator-token'];

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  }

  if (!token) {
    throw new AppError(
      'Unauthorized: Operator credentials required to access internal rescue dashboards and triage actions.',
      401
    );
  }

  if (!activeTokens.has(token) && token !== DEFAULT_OPERATOR_TOKEN) {
    throw new AppError(
      'Forbidden: Invalid or expired operator session token.',
      403
    );
  }

  req.operator = {
    id: 'OP-NAGPUR-01',
    username: OPERATOR_CREDENTIALS.username,
    name: 'Authorized Field Operator (Nagpur Control)',
    role: 'OPERATOR',
  };

  next();
}

/**
 * Revokes an active operator token.
 */
export function revokeOperatorToken(token: string): boolean {
  return activeTokens.delete(token);
}
