// DisasterSense — Flood Monitoring Module Data Models (PRD v1.0)

export type FloodRiskState =
  | 'NORMAL'
  | 'WATCH'
  | 'WARNING'
  | 'CRITICAL'
  | 'OFFLINE_STALE';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'WATCH';

export type TrendDirection = 'RISING' | 'FALLING' | 'STABLE';

export type DataSource = 'SIMULATED' | 'HARDWARE_LIVE';

export interface SensorReading {
  reading_id: string;
  node_id: string;
  timestamp: string;
  water_surface_distance_cm: number | null; // Raw distance from ultrasonic sensor
  calculated_depth_cm: number | null; // Reference height - distance
  reference_height_cm: number; // Installation height of sensor above channel bed
  temperature_c: number | null; // DHT11 temperature
  humidity_pct: number | null; // DHT11 relative humidity
  soil_moisture_pct: number | null; // Capacitive soil moisture %
  soil_moisture_raw?: number | null; // Raw ADC reading (0-4095)
  trend: TrendDirection;
  data_source: DataSource;
  is_valid: boolean;
  invalid_reason?: string;
}

export interface FloodAlert {
  id: string;
  node_id: string;
  rule_name: string;
  severity: AlertSeverity;
  trigger_condition: string;
  measured_value: string;
  threshold_value: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved: boolean;
  resolved_at?: string;
  data_source: DataSource;
}

export interface PinMapping {
  component: string;
  pin_label: string;
  gpio: string;
  role: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DISCONNECTED' | 'UNAVAILABLE';
  notes: string;
}

export interface DeviceHealthInfo {
  node_id: string;
  firmware_version: string;
  connection_state: 'ONLINE' | 'OFFLINE' | 'STALE';
  last_seen_at: string;
  ip_address: string;
  wifi_rssi_dbm: number;
  battery_or_power: string;
  data_freshness_seconds: number;
  pin_mappings: PinMapping[];
}

export interface ThresholdConfig {
  reference_height_cm: number; // Total channel depth / sensor mount height (e.g. 200 cm)
  watch_depth_cm: number; // e.g. 100 cm (50%)
  warning_depth_cm: number; // e.g. 140 cm (70%)
  critical_depth_cm: number; // e.g. 175 cm (87.5%)
  stale_timeout_sec: number; // Data freshness limit (e.g. 30 seconds)
}

export type DemoPreset =
  | 'NORMAL'
  | 'RISING'
  | 'WARNING'
  | 'CRITICAL'
  | 'SENSOR_STALE'
  | 'RECOVERING';
