import { Incident, IncidentStatus, CommunicationEvent, GatewayHealth } from '../types';

const API_BASE = 'http://localhost:5000/api';

export const api = {
  async getHealth(): Promise<GatewayHealth> {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Gateway health check failed');
    return res.json();
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  async updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    operator_notes?: string
  ): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, operator_notes }),
    });
    if (!res.ok) throw new Error(`Failed to update status for incident ${id}`);
    return res.json();
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
    const res = await fetch(`${API_BASE}/sos`, {
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
    return res.json();
  },
};
