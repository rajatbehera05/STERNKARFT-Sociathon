import { Incident, IncidentStatus, CommunicationEvent, GatewayHealth } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5001/api';

export interface RescueMessageDto {
  message_id: string;
  incident_id: string;
  sender_id?: string | null;
  sender_name: string;
  sender_type: string;
  content: string;
  delivery_status: string;
  timestamp: string;
}

export interface ResponderDto {
  responder_id: string;
  name: string;
  role: string;
  callsign: string;
  current_status: string;
  is_stale: boolean;
  last_seen_at: string;
  seconds_since_last_seen: number;
  location_geo?: { latitude: number; longitude: number } | null;
  battery_pct?: number | null;
}

export const api = {
  async getHealth(): Promise<GatewayHealth> {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Gateway health check failed');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/rescue/incidents`, { cache: 'no-store' });
    if (!res.ok) {
      // Fallback to alias if needed
      const fallback = await fetch(`${API_BASE}/incidents`, { cache: 'no-store' });
      if (!fallback.ok) throw new Error('Failed to fetch incidents');
      const data = await fallback.json();
      return Array.isArray(data) ? data : data.incidents || [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data.incidents || [];
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/rescue/incidents/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      const fallback = await fetch(`${API_BASE}/incidents/${id}`, { cache: 'no-store' });
      if (!fallback.ok) throw new Error(`Failed to fetch incident ${id}`);
      return fallback.json();
    }
    return res.json();
  },

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    operator_notes?: string
  ): Promise<Incident> {
    const res = await fetch(`${API_BASE}/rescue/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, operator_notes }),
    });
    if (!res.ok) throw new Error(`Failed to update status for incident ${id}`);
    const data = await res.json();
    return data.incident || data;
  },

  async acknowledgeIncident(id: string, operator_notes?: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/rescue/incidents/${id}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operator_notes }),
    });
    if (!res.ok) throw new Error(`Failed to acknowledge incident ${id}`);
    const data = await res.json();
    return data.incident;
  },

  async getIncidentMessages(id: string): Promise<RescueMessageDto[]> {
    const res = await fetch(`${API_BASE}/rescue/incidents/${id}/messages`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch messages for incident ${id}`);
    return res.json();
  },

  async submitIncidentMessage(
    id: string,
    content: string,
    sender_name: string,
    sender_type = 'OPERATOR'
  ): Promise<RescueMessageDto> {
    const res = await fetch(`${API_BASE}/rescue/incidents/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, sender_name, sender_type }),
    });
    if (!res.ok) throw new Error(`Failed to submit message for incident ${id}`);
    const data = await res.json();
    return data.message;
  },

  async getResponders(): Promise<ResponderDto[]> {
    const res = await fetch(`${API_BASE}/rescue/responders`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch responders');
    return res.json();
  },

  async updateResponderStatus(update: {
    responder_id: string;
    status: string;
    latitude?: number;
    longitude?: number;
    battery_pct?: number;
  }): Promise<ResponderDto> {
    const res = await fetch(`${API_BASE}/rescue/responders/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update responder status');
    const data = await res.json();
    return data.responder;
  },

  async getEvents(): Promise<CommunicationEvent[]> {
    const res = await fetch(`${API_BASE}/events`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch communication events');
    return res.json();
  },

  async submitSos(data: {
    client_incident_id?: string;
    category: string;
    description?: string;
    sender_name?: string;
    sender_phone?: string;
    headcount: number;
    has_critical_injuries: boolean;
    has_infants_or_elderly: boolean;
    water_level_rising: boolean;
    location_manual?: string;
    location_geo?: {
      latitude: number | null;
      longitude: number | null;
      accuracy_meters?: number | null;
    } | null;
  }): Promise<{
    success: boolean;
    incident_id: string;
    client_incident_id: string;
    delivery_state: string;
    priority_tier: string;
    received_at: string;
    deduplicated?: boolean;
  }> {
    const res = await fetch(`${API_BASE}/rescue/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Failed to submit emergency SOS');
    }
    const body = await res.json();
    const inc = body.incident;
    return {
      success: true,
      incident_id: inc.id,
      client_incident_id: inc.client_incident_id,
      delivery_state: inc.delivery_state,
      priority_tier: inc.priority_tier,
      received_at: inc.created_at,
      deduplicated: body.deduplicated,
    };
  },
};
