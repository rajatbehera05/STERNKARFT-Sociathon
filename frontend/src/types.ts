export type AppRoute =
  | '/'
  | '/sos'
  | '/request-relief'
  | '/track-relief'
  | '/dashboard'
  | '/rescue/dashboard'
  | '/rescue/incidents'
  | '/rescue/map'
  | '/rescue/communications'
  | '/rescue/devices'
  | '/flood/dashboard'
  | '/flood'
  | '/map'
  | '/incidents'
  | '/relief'
  | '/rescue/relief';

export type EmergencyCategory =
  | 'TRAPPED_FLOOD'
  | 'MEDICAL_EMERGENCY'
  | 'COLLAPSE_HAZARD'
  | 'SUPPLIES_WATER'
  | 'OTHER';

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED';

export type DeliveryState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'GATEWAY_RECEIVED'
  | 'PERSISTED_LOCALLY'
  | 'OPERATOR_ACKNOWLEDGED';

export interface GeoLocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy_meters?: number | null;
}

export interface Incident {
  id: string;
  client_incident_id: string;
  category: EmergencyCategory;
  description?: string;
  sender_name?: string;
  sender_phone?: string;
  headcount: number;
  has_critical_injuries: boolean;
  has_infants_or_elderly: boolean;
  water_level_rising: boolean;
  location_manual?: string;
  location_geo?: GeoLocationData | null;
  priority_tier: PriorityTier;
  status: IncidentStatus;
  delivery_state: DeliveryState;
  created_at: string;
  updated_at: string;
  operator_notes?: string;
}

export interface CommunicationEvent {
  id: string;
  incident_id: string;
  event_type: 'GATEWAY_RECEIVED' | 'PERSISTED_LOCALLY' | 'STATUS_CHANGED' | 'OPERATOR_ACKNOWLEDGED' | string;
  details: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export type GatewayConnectionState = 'checking' | 'connected' | 'offline';

export interface GatewayHealth {
  status: string;
  service?: string;
  mode?: string;
  gateway_connected?: boolean;
  timestamp?: string;
}
