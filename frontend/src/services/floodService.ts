import {
  FloodRiskState,
  SensorReading,
  FloodAlert,
  DeviceHealthInfo,
  ThresholdConfig,
  DemoPreset,
} from '../types/flood';

// Default Prototype Threshold Configuration (PRD Section 5 / FR-03)
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  reference_height_cm: 200, // Distance from ultrasonic sensor face to channel bed
  watch_depth_cm: 100, // Watch advisory threshold (50% channel capacity)
  warning_depth_cm: 140, // Warning threshold (70% channel capacity)
  critical_depth_cm: 175, // Critical evacuation threshold (87.5% channel capacity)
  stale_timeout_sec: 30, // Readings older than 30s are marked STALE
};

// Hardware Pinout Scope (PRD Section 4 Table)
export const HARDWARE_PINS: DeviceHealthInfo['pin_mappings'] = [
  {
    component: 'HC-SR04 Ultrasonic (TRIG)',
    pin_label: 'TRIG',
    gpio: 'GPIO 5',
    role: 'Sensor trigger pulse (10µs TTL)',
    status: 'OPERATIONAL',
    notes: 'Direct 3.3V logic trigger to transducer',
  },
  {
    component: 'HC-SR04 Ultrasonic (ECHO)',
    pin_label: 'ECHO',
    gpio: 'GPIO 18',
    role: 'Sensor pulse-width echo return',
    status: 'OPERATIONAL',
    notes: 'Level-shifted via 1kΩ/2kΩ voltage divider to 3.3V',
  },
  {
    component: 'DHT11 Environmental Sensor',
    pin_label: 'DATA',
    gpio: 'GPIO 4',
    role: 'Temperature (°C) & relative humidity (% RH)',
    status: 'OPERATIONAL',
    notes: 'Single-bus protocol with 10kΩ pull-up resistor',
  },
  {
    component: 'Capacitive Soil Moisture Sensor',
    pin_label: 'AOUT',
    gpio: 'GPIO 34',
    role: 'Analog ADC soil moisture measurement',
    status: 'OPERATIONAL',
    notes: 'ADC1 channel input (0-3.3V analog input range)',
  },
  {
    component: 'Local Active Piezo Buzzer',
    pin_label: 'BUZZ',
    gpio: 'GPIO 23',
    role: 'Audible local alarm on threshold breach',
    status: 'OPERATIONAL',
    notes: 'Transistor-buffered drive for critical warning',
  },
  {
    component: 'Status LED — Critical Red',
    pin_label: 'RED',
    gpio: 'GPIO 19',
    role: 'Critical water level visual warning',
    status: 'OPERATIONAL',
    notes: 'Current-limited through 330Ω resistor',
  },
  {
    component: 'Status LED — Warning Amber',
    pin_label: 'YEL',
    gpio: 'GPIO 21',
    role: 'Watch & Warning condition indication',
    status: 'OPERATIONAL',
    notes: 'Current-limited through 330Ω resistor',
  },
  {
    component: 'Status LED — Normal Green',
    pin_label: 'GRN',
    gpio: 'GPIO 22',
    role: 'Normal channel capacity indication',
    status: 'OPERATIONAL',
    notes: 'Active when depth < Watch threshold',
  },
];

// Helper to calculate risk state from depth and validity
export const evaluateRiskState = (
  depthCm: number | null,
  isValid: boolean,
  isFresh: boolean,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): FloodRiskState => {
  if (!isValid || !isFresh || depthCm === null) {
    return 'OFFLINE_STALE';
  }
  if (depthCm >= thresholds.critical_depth_cm) {
    return 'CRITICAL';
  }
  if (depthCm >= thresholds.warning_depth_cm) {
    return 'WARNING';
  }
  if (depthCm >= thresholds.watch_depth_cm) {
    return 'WATCH';
  }
  return 'NORMAL';
};

// Initial deterministic readings history
export const createInitialReadingsHistory = (
  referenceHeight: number = 200
): SensorReading[] => {
  const baseTime = Date.now();
  const history: SensorReading[] = [];
  const baseDepths = [
    32, 34, 35, 36, 38, 40, 42, 45, 48, 52, 58, 65, 75, 88, 98, 108, 118, 126,
    134, 142, 146,
  ];

  baseDepths.forEach((depth, idx) => {
    const timestamp = new Date(baseTime - (baseDepths.length - idx) * 90000).toISOString();
    const distance = Math.max(0, referenceHeight - depth);
    const trend = idx > 0 && depth > baseDepths[idx - 1] ? 'RISING' : 'STABLE';

    history.push({
      reading_id: `RDG-SIM-${1000 + idx}`,
      node_id: 'NODE-ESP32-FL01',
      timestamp,
      water_surface_distance_cm: distance,
      calculated_depth_cm: depth,
      reference_height_cm: referenceHeight,
      temperature_c: +(27.4 + (idx % 3) * 0.4).toFixed(1),
      humidity_pct: Math.min(95, Math.round(62 + idx * 1.2)),
      soil_moisture_pct: Math.min(92, Math.round(34 + idx * 2.2)),
      soil_moisture_raw: Math.round(1800 + idx * 80),
      trend,
      data_source: 'SIMULATED',
      is_valid: true,
    });
  });

  return history;
};

// Initial sample alerts matching PRD requirements
export const createInitialAlerts = (): FloodAlert[] => {
  const now = Date.now();
  return [
    {
      id: 'ALT-FL-002',
      node_id: 'NODE-ESP32-FL01',
      rule_name: 'Warning Threshold Crossed',
      severity: 'WARNING',
      trigger_condition: 'Calculated depth exceeded configured Warning threshold (140 cm)',
      measured_value: '146 cm (Distance: 54 cm)',
      threshold_value: '140 cm (70% channel capacity)',
      created_at: new Date(now - 180000).toISOString(),
      acknowledged: false,
      resolved: false,
      data_source: 'SIMULATED',
    },
    {
      id: 'ALT-FL-001',
      node_id: 'NODE-ESP32-FL01',
      rule_name: 'Watch Threshold Exceeded',
      severity: 'WATCH',
      trigger_condition: 'Calculated depth exceeded configured Watch threshold (100 cm)',
      measured_value: '108 cm (Distance: 92 cm)',
      threshold_value: '100 cm (50% channel capacity)',
      created_at: new Date(now - 900000).toISOString(),
      acknowledged: true,
      acknowledged_at: new Date(now - 840000).toISOString(),
      acknowledged_by: 'Operator (Bench Station)',
      resolved: false,
      data_source: 'SIMULATED',
    },
  ];
};

// Generate preset reading based on demonstration mode selection
export const generatePresetReading = (
  preset: DemoPreset,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): { reading: SensorReading; newAlert?: FloodAlert } => {
  const nowIso = new Date().toISOString();
  let depth: number | null = 45;
  let distance: number | null = thresholds.reference_height_cm - depth;
  let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
  let isValid = true;
  let invalidReason: string | undefined = undefined;
  let temp: number | null = 27.8;
  let humidity: number | null = 64;
  let soilMoisture: number | null = 38;
  let newAlert: FloodAlert | undefined = undefined;

  switch (preset) {
    case 'NORMAL':
      depth = 48;
      distance = thresholds.reference_height_cm - depth;
      trend = 'STABLE';
      temp = 28.1;
      humidity = 61;
      soilMoisture = 35;
      break;

    case 'RISING':
      depth = 118;
      distance = thresholds.reference_height_cm - depth;
      trend = 'RISING';
      temp = 26.5;
      humidity = 78;
      soilMoisture = 55;
      break;

    case 'WARNING':
      depth = 148;
      distance = thresholds.reference_height_cm - depth;
      trend = 'RISING';
      temp = 25.8;
      humidity = 88;
      soilMoisture = 76;
      newAlert = {
        id: `ALT-FL-${Date.now().toString().slice(-4)}`,
        node_id: 'NODE-ESP32-FL01',
        rule_name: 'Warning Threshold Crossed',
        severity: 'WARNING',
        trigger_condition: `Calculated depth ${depth} cm exceeded Warning threshold (${thresholds.warning_depth_cm} cm)`,
        measured_value: `${depth} cm (Distance: ${distance} cm)`,
        threshold_value: `${thresholds.warning_depth_cm} cm (70% capacity)`,
        created_at: nowIso,
        acknowledged: false,
        resolved: false,
        data_source: 'SIMULATED',
      };
      break;

    case 'CRITICAL':
      depth = 184;
      distance = thresholds.reference_height_cm - depth;
      trend = 'RISING';
      temp = 25.2;
      humidity = 94;
      soilMoisture = 89;
      newAlert = {
        id: `ALT-FL-${Date.now().toString().slice(-4)}`,
        node_id: 'NODE-ESP32-FL01',
        rule_name: 'Critical Evacuation Threshold Crossed',
        severity: 'CRITICAL',
        trigger_condition: `Calculated depth ${depth} cm breached Critical threshold (${thresholds.critical_depth_cm} cm). Mandatory alert.`,
        measured_value: `${depth} cm (Distance: ${distance} cm)`,
        threshold_value: `${thresholds.critical_depth_cm} cm (87.5% capacity)`,
        created_at: nowIso,
        acknowledged: false,
        resolved: false,
        data_source: 'SIMULATED',
      };
      break;

    case 'SENSOR_STALE':
      depth = null;
      distance = null;
      isValid = false;
      invalidReason = 'HC-SR04 Echo Timeout (Out of Range or Transducer Disconnected)';
      trend = 'STABLE';
      temp = null;
      humidity = null;
      soilMoisture = null;
      break;

    case 'RECOVERING':
      depth = 72;
      distance = thresholds.reference_height_cm - depth;
      trend = 'FALLING';
      temp = 27.2;
      humidity = 68;
      soilMoisture = 50;
      break;
  }

  const reading: SensorReading = {
    reading_id: `RDG-SIM-${Date.now().toString().slice(-5)}`,
    node_id: 'NODE-ESP32-FL01',
    timestamp: nowIso,
    water_surface_distance_cm: distance,
    calculated_depth_cm: depth,
    reference_height_cm: thresholds.reference_height_cm,
    temperature_c: temp,
    humidity_pct: humidity,
    soil_moisture_pct: soilMoisture,
    soil_moisture_raw: soilMoisture ? Math.round(soilMoisture * 40) : null,
    trend,
    data_source: 'SIMULATED',
    is_valid: isValid,
    invalid_reason: invalidReason,
  };

  return { reading, newAlert };
};

// ------------------------------------------------------------------------------
// DisasterSense Flood Monitoring Backend API Integration
// ------------------------------------------------------------------------------

const FLOOD_API_BASE = (import.meta as any).env?.VITE_FLOOD_API_BASE_URL || 'http://localhost:5001/api/flood';

export const floodApi = {
  /**
   * Fetches latest telemetry status, computed risk level, and freshness.
   */
  async getStatus() {
    const res = await fetch(`${FLOOD_API_BASE}/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch flood status');
    return res.json();
  },

  /**
   * Fetches persisted telemetry history with optional pagination.
   */
  async getReadings(params?: { limit?: number; offset?: number; dataSource?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.dataSource) query.set('dataSource', params.dataSource);
    const res = await fetch(`${FLOOD_API_BASE}/readings?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch telemetry history');
    return res.json();
  },

  /**
   * Fetches alerts ledger with optional severity filter.
   */
  async getAlerts(params?: { severity?: string; acknowledged?: boolean }) {
    const query = new URLSearchParams();
    if (params?.severity) query.set('severity', params.severity);
    if (params?.acknowledged !== undefined) query.set('acknowledged', String(params.acknowledged));
    const res = await fetch(`${FLOOD_API_BASE}/alerts?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch flood alerts');
    return res.json();
  },

  /**
   * Acknowledges an active hazard alert.
   */
  async acknowledgeAlert(id: string) {
    const res = await fetch(`${FLOOD_API_BASE}/alerts/${id}/acknowledge`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  /**
   * Purges simulated demo alerts, protecting real hardware alerts.
   */
  async clearDemoAlerts() {
    const res = await fetch(`${FLOOD_API_BASE}/alerts/demo`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear demo alerts');
    return res.json();
  },

  /**
   * Fetches authoritative threshold configuration.
   */
  async getConfig(): Promise<ThresholdConfig> {
    const res = await fetch(`${FLOOD_API_BASE}/config`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch threshold config');
    return res.json();
  },

  /**
   * Updates and saves authoritative threshold configuration.
   */
  async updateConfig(config: ThresholdConfig) {
    const res = await fetch(`${FLOOD_API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update threshold configuration');
    }
    return res.json();
  },

  /**
   * Fetches node diagnostics, pin mapping, and actual freshness.
   */
  async getDeviceHealth() {
    const res = await fetch(`${FLOOD_API_BASE}/device-health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch device health diagnostics');
    return res.json();
  },

  /**
   * Ingests a telemetry packet into the backend database.
   */
  async submitTelemetry(reading: Partial<SensorReading>) {
    const res = await fetch(`${FLOOD_API_BASE}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });
    if (!res.ok) throw new Error('Failed to ingest telemetry');
    return res.json();
  },
};

