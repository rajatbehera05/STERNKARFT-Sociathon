import {
  ReliefRequest,
  ResourceInventoryItem,
  DeliveryAllocation,
  VerificationStatus,
  UrgencyLevel,
  DeliveryStatus,
} from '../types/relief';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5001/api';

const TOKEN_KEY = 'sternx_operator_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage disabled
    }
  },
  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage disabled
    }
  },
  hasToken(): boolean {
    return Boolean(this.getToken());
  },
};

function getAuthHeaders(): HeadersInit {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface OperatorUser {
  id: string;
  username: string;
  role: string;
  name: string;
  badgeNumber?: string;
  station?: string;
}

export interface PublicReliefRequestInput {
  requesterName?: string;
  contactNumber?: string;
  organization?: string;
  locality: string;
  addressOrLandmark: string;
  latitude: number;
  longitude: number;
  peopleAffected: number;
  hasImmediateHealthThreat: boolean;
  situationDescription: string;
  items: Array<{
    category: string;
    name: string;
    requestedQty: number;
    unit: string;
    notes?: string;
  }>;
}

export interface PublicTrackResult {
  id: string;
  createdAt: string;
  updatedAt: string;
  locality: string;
  peopleAffected: number;
  verificationStatus: string;
  urgency: string;
  items: Array<{
    category: string;
    name: string;
    requestedQty: number;
    fulfilledQty: number;
    unit: string;
  }>;
  deliveries: Array<{
    resourceName: string;
    quantity: number;
    unit: string;
    deliveryStatus: string;
    assignedAt: string;
  }>;
}

export const reliefApi = {
  // --- Auth endpoints ---
  async loginOperator(username: string, password: string): Promise<{ token: string; user: OperatorUser }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    const data = await res.json();
    authStorage.setToken(data.token);
    return data;
  },

  async getOperatorMe(): Promise<{ authenticated: boolean; user?: OperatorUser }> {
    const token = authStorage.getToken();
    if (!token) return { authenticated: false };

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        authStorage.clearToken();
        return { authenticated: false };
      }
      const data = await res.json();
      return { authenticated: true, user: data.user };
    } catch {
      return { authenticated: false };
    }
  },

  async logoutOperator(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // ignore
    } finally {
      authStorage.clearToken();
    }
  },

  // --- Public Endpoints ---
  async submitPublicRequest(data: PublicReliefRequestInput): Promise<{
    success: boolean;
    trackingId: string;
    status: string;
    receivedAt: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/relief/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit emergency relief request');
    }

    const json = await res.json();
    return {
      success: true,
      trackingId: json.requestId || json.request?.id,
      status: json.status || 'PENDING',
      receivedAt: json.receivedAt || new Date().toISOString(),
      message: json.message || 'Request submitted successfully',
    };
  },

  async trackPublicRequest(requestId: string, phone?: string): Promise<PublicTrackResult> {
    const res = await fetch(`${API_BASE}/relief/requests/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, phone }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request not found or invalid credentials');
    }

    const json = await res.json();
    return json.request;
  },

  // --- Protected Operator Endpoints ---
  async getRequests(): Promise<ReliefRequest[]> {
    const res = await fetch(`${API_BASE}/relief/requests`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch relief requests');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.requests || [];
  },

  async verifyRequest(
    id: string,
    status: VerificationStatus,
    reason?: string
  ): Promise<ReliefRequest> {
    const res = await fetch(`${API_BASE}/relief/requests/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to verify request');
    }

    const data = await res.json();
    return data.request;
  },

  async updateUrgency(
    id: string,
    urgency: UrgencyLevel,
    reason?: string
  ): Promise<ReliefRequest> {
    const res = await fetch(`${API_BASE}/relief/requests/${id}/urgency`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ urgency, reason }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update urgency');
    }

    const data = await res.json();
    return data.request;
  },

  async getInventory(): Promise<ResourceInventoryItem[]> {
    const res = await fetch(`${API_BASE}/relief/inventory`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch inventory');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.inventory || [];
  },

  async addOrUpdateInventory(item: Partial<ResourceInventoryItem>): Promise<ResourceInventoryItem> {
    const res = await fetch(`${API_BASE}/relief/inventory`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update inventory');
    }

    const data = await res.json();
    return data.item;
  },

  async getDeliveries(): Promise<DeliveryAllocation[]> {
    const res = await fetch(`${API_BASE}/relief/deliveries`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch deliveries');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.deliveries || [];
  },

  async allocateResources(data: {
    requestId: string;
    requestItemId: string;
    resourceId: string;
    quantity: number;
    dispatchLocation?: string;
    notes?: string;
  }): Promise<{ delivery: DeliveryAllocation; updatedStock: ResourceInventoryItem }> {
    const res = await fetch(`${API_BASE}/relief/allocate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to allocate resource');
    }

    return res.json();
  },

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    notes?: string
  ): Promise<DeliveryAllocation> {
    const res = await fetch(`${API_BASE}/relief/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update delivery status');
    }

    const data = await res.json();
    return data.delivery;
  },
};
