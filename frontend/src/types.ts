export type AppRoute = '/' | '/sos' | '/dashboard';

export type GatewayConnectionState = 'checking' | 'connected' | 'offline';

export interface GatewayHealth {
  status: string;
  service?: string;
  mode?: string;
  gateway_connected?: boolean;
  timestamp?: string;
}
