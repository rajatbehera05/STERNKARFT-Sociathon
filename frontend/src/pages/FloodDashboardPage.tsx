import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Waves,
  ArrowLeft,
  Radio,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Layers,
  History,
  Sliders,
  Check,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  WifiOff,
  Bell,
  Menu,
  X,
  Download,
  Trash2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { AppRoute } from '../types';
import {
  FloodRiskState,
  SensorReading,
  FloodAlert,
  ThresholdConfig,
  DemoPreset,
} from '../types/flood';
import {
  DEFAULT_THRESHOLDS,
  HARDWARE_PINS,
  evaluateRiskState,
  createInitialReadingsHistory,
  createInitialAlerts,
  generatePresetReading,
  floodApi,
} from '../services/floodService';

interface FloodDashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

type FloodTab = 'overview' | 'monitoring' | 'alerts' | 'history' | 'devices';

interface FloodNavItem {
  id: string;
  label: string;
  tabId?: FloodTab;
  route?: AppRoute;
  icon: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
  hasDividerBefore?: boolean;
}

const FLOOD_NAV_ITEMS: FloodNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    tabId: 'overview',
    icon: Layers,
  },
  {
    id: 'monitoring',
    label: 'Live Monitoring',
    tabId: 'monitoring',
    icon: Activity,
  },
  {
    id: 'alerts',
    label: 'Alerts',
    tabId: 'alerts',
    icon: Bell,
  },
  {
    id: 'history',
    label: 'History',
    tabId: 'history',
    icon: History,
  },
  {
    id: 'devices',
    label: 'Device Health',
    tabId: 'devices',
    icon: Cpu,
  },
  {
    id: 'rescue',
    label: 'Rescue Comms',
    route: '/rescue/dashboard',
    icon: Radio,
    isExternal: true,
    hasDividerBefore: true,
  },
  {
    id: 'platform',
    label: 'Back to Platform',
    route: '/dashboard',
    icon: ArrowLeft,
    isExternal: true,
  },
];

const TAB_META: Record<FloodTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Flood Monitoring Overview',
    subtitle: 'Real-time hydrological risk classification, water level gauge, and sensor telemetry',
  },
  monitoring: {
    title: 'Live Telemetry & Waveform',
    subtitle: 'High-frequency ultrasonic sensor telemetry, rate of change, and threshold projections',
  },
  alerts: {
    title: 'Threshold Alerts & Warnings',
    subtitle: 'Early warning trigger events, threshold crossing alerts, and operator response history',
  },
  history: {
    title: 'Hydrological Trends & History',
    subtitle: 'Multi-hour water level trajectory, peak analysis, and environmental correlation',
  },
  devices: {
    title: 'Hardware & Sensor Health',
    subtitle: 'ESP32 node diagnostics, HC-SR04 ultrasonic status, calibration, and pin mappings',
  },
};

export const FloodDashboardPage: React.FC<FloodDashboardPageProps> = ({
  onNavigate,
}) => {
  // Navigation tab & mobile sidebar state
  const [activeTab, setActiveTab] = useState<FloodTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const shouldReduceMotion = useReducedMotion();

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Core state
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [draftThresholds, setDraftThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [calibrationSuccess, setCalibrationSuccess] = useState<boolean>(false);

  const [readingsHistory, setReadingsHistory] = useState<SensorReading[]>(() =>
    createInitialReadingsHistory(DEFAULT_THRESHOLDS.reference_height_cm)
  );
  const [alerts, setAlerts] = useState<FloodAlert[]>(() => createInitialAlerts());
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'WATCH'>('ALL');
  const [confirmClearDemoAlerts, setConfirmClearDemoAlerts] = useState(false);

  // History series toggles
  const [showWaterDepth, setShowWaterDepth] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showSoilMoisture, setShowSoilMoisture] = useState(true);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const [activePreset, setActivePreset] = useState<DemoPreset>('NORMAL');
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Keep draftThresholds in sync if thresholds changes elsewhere
  useEffect(() => {
    setDraftThresholds(thresholds);
  }, [thresholds]);

  // Load authoritative configuration, readings history, and active alerts from backend
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [configData, readingsData, alertsData] = await Promise.all([
          floodApi.getConfig().catch(() => null),
          floodApi.getReadings({ limit: 30 }).catch(() => null),
          floodApi.getAlerts().catch(() => null),
        ]);

        if (!isMounted) return;

        if (configData && configData.reference_height_cm) {
          setThresholds(configData);
          setDraftThresholds(configData);
        }

        if (readingsData && Array.isArray(readingsData.readings) && readingsData.readings.length > 0) {
          const mapped: SensorReading[] = readingsData.readings
            .map((r: any) => ({
              reading_id: r.reading_id,
              node_id: 'NODE-ESP32-FL01',
              timestamp: r.timestamp,
              water_surface_distance_cm: r.water_surface_distance_cm,
              calculated_depth_cm: r.calculated_depth_cm,
              reference_height_cm: configData?.reference_height_cm ?? DEFAULT_THRESHOLDS.reference_height_cm,
              temperature_c: r.temperature_c,
              humidity_pct: r.humidity_pct,
              soil_moisture_pct: r.soil_moisture_pct,
              soil_moisture_raw: r.soil_moisture_pct ? Math.round(r.soil_moisture_pct * 40) : null,
              trend: r.trend || 'STABLE',
              data_source: r.data_source || 'SIMULATED',
              is_valid: r.is_valid !== undefined ? r.is_valid : true,
            }))
            .reverse();

          setReadingsHistory(mapped);
          setLastUpdated(new Date());
        }

        if (alertsData && Array.isArray(alertsData) && alertsData.length > 0) {
          const mappedAlerts: FloodAlert[] = alertsData.map((a: any) => ({
            id: a.id,
            node_id: 'NODE-ESP32-FL01',
            rule_name: a.headline || 'Hazard Threshold Alert',
            trigger_condition: a.action_text || 'Water depth threshold exceeded',
            severity: a.severity,
            measured_value: a.trigger_depth_cm ? `${a.trigger_depth_cm} cm` : 'Threshold Breached',
            threshold_value: `${configData?.watch_depth_cm ?? DEFAULT_THRESHOLDS.watch_depth_cm} cm`,
            created_at: a.timestamp,
            acknowledged: a.acknowledged,
            acknowledged_at: a.acknowledged_at,
            resolved: false,
            data_source: a.data_source || 'SIMULATED',
          }));
          setAlerts(mappedAlerts);
        }
      } catch (err) {
        // Fall back gracefully to local demo data
        console.warn('Backend flood telemetry not reachable, operating in local demo state:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Latest reading is the last element of readingsHistory
  const latestReading = useMemo(() => {
    return readingsHistory.length > 0
      ? readingsHistory[readingsHistory.length - 1]
      : null;
  }, [readingsHistory]);

  // Evaluate current risk state
  const currentRiskState: FloodRiskState = useMemo(() => {
    if (!latestReading) return 'OFFLINE_STALE';
    const isFresh =
      (Date.now() - new Date(latestReading.timestamp).getTime()) / 1000 <=
      thresholds.stale_timeout_sec;
    return evaluateRiskState(
      latestReading.calculated_depth_cm,
      latestReading.is_valid,
      isFresh,
      thresholds
    );
  }, [latestReading, thresholds]);

  // Data freshness calculation (deriving actual freshness honestly)
  const freshnessInfo = useMemo(() => {
    if (!latestReading || !latestReading.is_valid || latestReading.calculated_depth_cm === null) {
      return {
        label: 'TIMEOUT (>30s) — STALE / NO ECHO',
        seconds: null,
        isStale: true,
        source: 'SIMULATED (NO DATA)',
      };
    }
    const secondsOld = Math.max(
      0,
      +((Date.now() - new Date(latestReading.timestamp).getTime()) / 1000).toFixed(1)
    );
    const isStale = secondsOld > thresholds.stale_timeout_sec;
    return {
      label: isStale
        ? `${secondsOld}s (EXCEEDED TIMEOUT: STALE)`
        : `${secondsOld}s (NOMINAL FRESHNESS)`,
      seconds: secondsOld,
      isStale,
      source: latestReading.data_source === 'SIMULATED' ? 'SIMULATED' : 'HARDWARE_LIVE',
    };
  }, [latestReading, thresholds.stale_timeout_sec]);

  // Rate of rise & threshold ETA calculation (PRD FR-02)
  const rateOfRiseData = useMemo(() => {
    if (!latestReading || !latestReading.is_valid || latestReading.calculated_depth_cm === null) {
      return {
        rateCmPerMin: null,
        rateCmPerHour: null,
        etaMinutes: null,
        targetLabel: null,
        targetDepth: null,
        status: 'UNAVAILABLE_STALE' as const,
        reason: 'Telemetry is currently stale or sensor is offline',
      };
    }

    // Filter last 5 valid readings
    const validReadings = readingsHistory
      .filter((r) => r.is_valid && r.calculated_depth_cm !== null)
      .slice(-5);

    if (validReadings.length < 2) {
      return {
        rateCmPerMin: null,
        rateCmPerHour: null,
        etaMinutes: null,
        targetLabel: null,
        targetDepth: null,
        status: 'INSUFFICIENT_DATA' as const,
        reason: 'Awaiting minimum 2 valid consecutive telemetry samples',
      };
    }

    const oldest = validReadings[0];
    const newest = validReadings[validReadings.length - 1];

    const timeDiffMin =
      (new Date(newest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60);
    const depthDiffCm = (newest.calculated_depth_cm ?? 0) - (oldest.calculated_depth_cm ?? 0);

    if (timeDiffMin <= 0.01) {
      return {
        rateCmPerMin: 0,
        rateCmPerHour: 0,
        etaMinutes: null,
        targetLabel: null,
        targetDepth: null,
        status: 'STABLE' as const,
        reason: 'Water level stable across recent sample window',
      };
    }

    const rateCmPerMin = +(depthDiffCm / timeDiffMin).toFixed(2);
    const rateCmPerHour = +(rateCmPerMin * 60).toFixed(1);

    const currentDepth = newest.calculated_depth_cm ?? 0;
    let targetLabel: string | null = null;
    let targetDepth: number | null = null;

    if (currentDepth < thresholds.watch_depth_cm) {
      targetLabel = 'Watch Threshold';
      targetDepth = thresholds.watch_depth_cm;
    } else if (currentDepth < thresholds.warning_depth_cm) {
      targetLabel = 'Warning Threshold';
      targetDepth = thresholds.warning_depth_cm;
    } else if (currentDepth < thresholds.critical_depth_cm) {
      targetLabel = 'Critical Evacuation Threshold';
      targetDepth = thresholds.critical_depth_cm;
    } else {
      targetLabel = 'Channel Saturated (Critical Exceeded)';
      targetDepth = null;
    }

    let etaMinutes: number | null = null;
    let status: 'RISING' | 'RECEDING' | 'STABLE' | 'SATURATED' = 'STABLE';

    if (targetDepth !== null && rateCmPerMin > 0.05) {
      const diff = targetDepth - currentDepth;
      etaMinutes = Math.max(1, Math.round(diff / rateCmPerMin));
      status = 'RISING';
    } else if (targetDepth === null) {
      status = 'SATURATED';
    } else if (rateCmPerMin < -0.05) {
      status = 'RECEDING';
    } else {
      status = 'STABLE';
    }

    return {
      rateCmPerMin,
      rateCmPerHour,
      etaMinutes,
      targetLabel,
      targetDepth,
      status,
      reason:
        status === 'RISING' && etaMinutes !== null
          ? `Projected ~${etaMinutes} min to ${targetLabel}`
          : status === 'SATURATED'
          ? 'Current depth exceeds critical threshold'
          : status === 'RECEDING'
          ? 'Water level is actively receding'
          : 'Water level is steady (< 0.05 cm/min change)',
    };
  }, [readingsHistory, latestReading, thresholds]);

  // Filtered alerts for Screen 3
  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  // Clear demo alerts
  const handleClearDemoAlerts = () => {
    setAlerts((prev) => prev.filter((a) => a.data_source !== 'SIMULATED'));
    setConfirmClearDemoAlerts(false);

    // Sync clear action with backend database
    floodApi.clearDemoAlerts().catch((err) => {
      console.warn('Backend clear demo alerts failed:', err);
    });
  };

  // Calibration validation & save handler
  const handleSaveCalibration = () => {
    setCalibrationSuccess(false);
    setCalibrationError(null);

    const refHeight = Number(draftThresholds.reference_height_cm);
    const watch = Number(draftThresholds.watch_depth_cm);
    const warn = Number(draftThresholds.warning_depth_cm);
    const crit = Number(draftThresholds.critical_depth_cm);
    const stale = Number(draftThresholds.stale_timeout_sec);

    if (
      !Number.isFinite(refHeight) ||
      !Number.isFinite(watch) ||
      !Number.isFinite(warn) ||
      !Number.isFinite(crit) ||
      !Number.isFinite(stale)
    ) {
      setCalibrationError('All calibration values must be valid, finite numbers.');
      return;
    }

    if (refHeight <= 0) {
      setCalibrationError('Reference bed height must be positive (> 0 cm).');
      return;
    }

    if (watch <= 0) {
      setCalibrationError('Watch depth threshold must be positive (> 0 cm).');
      return;
    }

    if (watch >= warn) {
      setCalibrationError(`Watch depth (${watch} cm) must be strictly less than Warning depth (${warn} cm).`);
      return;
    }

    if (warn >= crit) {
      setCalibrationError(`Warning depth (${warn} cm) must be strictly less than Critical depth (${crit} cm).`);
      return;
    }

    if (crit >= refHeight) {
      setCalibrationError(`Critical depth (${crit} cm) must be strictly less than Reference Bed Height (${refHeight} cm).`);
      return;
    }

    if (stale < 5) {
      setCalibrationError('Stale timeout threshold must be at least 5 seconds.');
      return;
    }

    // Passed validation!
    const updated: ThresholdConfig = {
      reference_height_cm: refHeight,
      watch_depth_cm: watch,
      warning_depth_cm: warn,
      critical_depth_cm: crit,
      stale_timeout_sec: stale,
    };

    setThresholds(updated);
    setCalibrationSuccess(true);
    setTimeout(() => setCalibrationSuccess(false), 4000);

    // Persist authoritative thresholds to backend PostgreSQL database
    floodApi.updateConfig(updated).catch((err) => {
      console.warn('Failed to persist updated calibration to backend:', err);
    });
  };

  // Export handlers
  const handleExportCsv = () => {
    if (readingsHistory.length === 0) {
      setExportFeedback('No telemetry records available to export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }
    const headers = [
      'Reading ID',
      'Timestamp (ISO)',
      'Local Time',
      'Calculated Depth (cm)',
      'Ultrasonic Distance (cm)',
      'Reference Bed Height (cm)',
      'DHT11 Temperature (C)',
      'DHT11 Humidity (% RH)',
      'Capacitive Soil Moisture (% Sat)',
      'Trend',
      'Data Source',
      'Sensor Valid',
    ];
    const rows = readingsHistory.map((r) => [
      `"${r.reading_id}"`,
      `"${r.timestamp}"`,
      `"${new Date(r.timestamp).toLocaleString()}"`,
      r.calculated_depth_cm ?? 'N/A',
      r.water_surface_distance_cm ?? 'N/A',
      r.reference_height_cm,
      r.temperature_c ?? 'N/A',
      r.humidity_pct ?? 'N/A',
      r.soil_moisture_pct ?? 'N/A',
      `"${r.trend}"`,
      `"${r.data_source}"`,
      r.is_valid ? 'VALID' : 'INVALID',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `flood_telemetry_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportFeedback('CSV telemetry exported successfully.');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleExportJson = () => {
    if (readingsHistory.length === 0) {
      setExportFeedback('No telemetry records available to export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }
    const exportPayload = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      node_id: 'NODE-ESP32-FL01',
      data_source_mode: 'SIMULATED',
      total_records: readingsHistory.length,
      reference_height_cm: thresholds.reference_height_cm,
      thresholds,
      records: readingsHistory,
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flood_telemetry_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportFeedback('JSON telemetry exported successfully.');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  // Unacknowledged alerts count
  const unacknowledgedAlertsCount = useMemo(() => {
    return alerts.filter((a) => !a.acknowledged).length;
  }, [alerts]);

  // Handle Preset Trigger
  const handleApplyPreset = (preset: DemoPreset) => {
    setActivePreset(preset);
    const { reading, newAlert } = generatePresetReading(preset, thresholds);

    setReadingsHistory((prev) => [...prev.slice(-30), reading]);
    setLastUpdated(new Date());

    if (newAlert) {
      setAlerts((prev) => [newAlert, ...prev]);
    }

    // Persist simulated frame to backend database (clearly labelled SIMULATED)
    floodApi
      .submitTelemetry({
        reading_id: reading.reading_id,
        timestamp: reading.timestamp,
        water_surface_distance_cm: reading.water_surface_distance_cm,
        reference_height_cm: reading.reference_height_cm,
        temperature_c: reading.temperature_c,
        humidity_pct: reading.humidity_pct,
        soil_moisture_pct: reading.soil_moisture_pct,
        data_source: 'SIMULATED',
        is_valid: reading.is_valid,
      })
      .catch((err) => {
        console.warn('Backend telemetry persistence failed (offline demo continues):', err);
      });
  };

  // Auto-simulation interval ticker (if enabled)
  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(() => {
      setReadingsHistory((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.calculated_depth_cm === null) return prev;

        // Subtle dynamic wave motion (+/- 1 to 2 cm)
        const jitter = (Math.random() - 0.48) * 3;
        const newDepth = Math.max(
          15,
          Math.min(thresholds.reference_height_cm - 5, +(last.calculated_depth_cm + jitter).toFixed(1))
        );
        const newDistance = +(thresholds.reference_height_cm - newDepth).toFixed(1);
        const trend = newDepth > last.calculated_depth_cm ? 'RISING' : 'STABLE';

        const updated: SensorReading = {
          ...last,
          reading_id: `RDG-SIM-${Date.now().toString().slice(-5)}`,
          timestamp: new Date().toISOString(),
          calculated_depth_cm: newDepth,
          water_surface_distance_cm: newDistance,
          trend,
        };

        // Submit frame
        floodApi
          .submitTelemetry({
            reading_id: updated.reading_id,
            timestamp: updated.timestamp,
            water_surface_distance_cm: updated.water_surface_distance_cm,
            reference_height_cm: updated.reference_height_cm,
            temperature_c: updated.temperature_c,
            humidity_pct: updated.humidity_pct,
            soil_moisture_pct: updated.soil_moisture_pct,
            data_source: 'SIMULATED',
            is_valid: updated.is_valid,
          })
          .catch(() => {});

        return [...prev.slice(-30), updated];
      });
      setLastUpdated(new Date());
    }, 4000);

    return () => clearInterval(interval);
  }, [autoSimulate, thresholds]);

  // Acknowledge alert handler
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              acknowledged: true,
              acknowledged_at: new Date().toISOString(),
              acknowledged_by: 'Field Operator (Bench Station)',
            }
          : a
      )
    );

    // Sync acknowledgment with backend
    floodApi.acknowledgeAlert(alertId).catch((err) => {
      console.warn('Backend alert acknowledgment failed:', err);
    });
  };

  // Risk state badge styling & descriptive titles
  const getRiskBadge = (state: FloodRiskState) => {
    switch (state) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL EVACUATION',
          bg: 'bg-[#FDF2F2]',
          border: 'border-[#FCD8D9]',
          text: 'text-[#E53945]',
          icon: ShieldAlert,
          description:
            'Water depth has breached the critical threshold. Channel capacity is nearly exhausted. Immediate evacuation protocols recommended.',
        };
      case 'WARNING':
        return {
          label: 'WARNING LEVEL',
          bg: 'bg-[#FEF8ED]',
          border: 'border-[#FDE8BF]',
          text: 'text-[#D98A00]',
          icon: AlertTriangle,
          description:
            'Water depth has crossed the warning threshold. Rapid accumulation or high rate of rise detected in drainage channel.',
        };
      case 'WATCH':
        return {
          label: 'WATCH ADVISORY',
          bg: 'bg-[#FFFBEB]',
          border: 'border-[#FEE3A2]',
          text: 'text-[#B45309]',
          icon: Activity,
          description:
            'Water depth has exceeded 50% capacity. Environmental conditions warrant continued operator inspection.',
        };
      case 'NORMAL':
        return {
          label: 'NORMAL CAPACITY',
          bg: 'bg-[#ECFDF5]',
          border: 'border-[#A7F3D0]',
          text: 'text-[#0B9B73]',
          icon: CheckCircle2,
          description:
            'Measured water level is within safe baseline channel capacity (<50%). Sensors report nominal conditions.',
        };
      case 'OFFLINE_STALE':
      default:
        return {
          label: 'OFFLINE / DATA STALE',
          bg: 'bg-[#F1F5F9]',
          border: 'border-[#CBD5E1]',
          text: 'text-[#475569]',
          icon: WifiOff,
          description:
            'No valid sensor readings received within freshness window. Ultrasonic echo timed out or sensor node is disconnected.',
        };
    }
  };

  const riskBadge = getRiskBadge(currentRiskState);
  const RiskIcon = riskBadge.icon;

  const currentTabMeta = TAB_META[activeTab];

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#17243A] flex flex-col md:flex-row selection:bg-[#65C7FF] selection:text-[#111827]">
      {/* Mobile Top Header (Deep Graphite + Blue-grey surface) */}
      <div className="md:hidden bg-[#111827] text-[#F8FAFC] px-4 py-3.5 border-b border-[#1F2E44] flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="group flex items-center gap-2.5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] rounded-lg p-1 -m-1"
            title="Back to Platform Launchpad"
          >
            <div className="w-8 h-8 rounded-lg bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF] shadow-xs shrink-0 transition-colors duration-200 group-hover:border-[#65C7FF]/40">
              <Waves className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[15px] tracking-wider uppercase text-[#F8FAFC] leading-none">
                DisasterSense
              </span>
              <span className="text-[11px] text-[#94A3B8] font-medium leading-tight mt-0.5">
                Flood Monitoring
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentRiskState !== 'OFFLINE_STALE' ? (
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#34D399] ring-2 ring-[#34D399]/25 transition-colors"
              title="Sensor Node Online"
            />
          ) : (
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#EF4444] transition-colors"
              title="Sensor Node Offline / Stale"
            />
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#182638] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2F46] border border-[#1F2E44] transition-all duration-200 ease-out active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Deep Graphite Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#111827] text-[#F8FAFC] border-r border-[#1F2E44] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand & Module Header */}
        <div className="p-5 border-b border-[#1F2E44] flex flex-col gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="group flex items-center gap-3 text-left w-full rounded-xl p-1.5 -m-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] cursor-pointer"
            title="Back to Platform Launchpad"
          >
            <div className="w-9 h-9 rounded-xl bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF] shadow-xs shrink-0 transition-colors duration-200 group-hover:border-[#65C7FF]/40">
              <Waves className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-black tracking-wider uppercase text-[#F8FAFC] leading-none">
                DisasterSense
              </span>
              <span className="text-[12px] font-semibold text-[#65C7FF] mt-1 tracking-wide">
                Flood Monitoring
              </span>
            </div>
          </button>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-2 border-t border-[#1F2E44]">
            <span>ESP32 TELEMETRY NODE</span>
            {currentRiskState !== 'OFFLINE_STALE' ? (
              <span className="text-[#34D399] font-bold tracking-wider">ONLINE</span>
            ) : (
              <span className="text-[#F87171] font-bold tracking-wider">OFFLINE</span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {FLOOD_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isActionItem = item.isExternal;

            return (
              <React.Fragment key={item.id}>
                {item.hasDividerBefore && <div className="my-2 border-t border-[#1F2E44]" />}
                <button
                  onClick={() => {
                    if (item.route) {
                      onNavigate(item.route);
                    } else if (item.tabId) {
                      setActiveTab(item.tabId);
                    }
                  }}
                  className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium tracking-normal transition-colors duration-200 ease-out cursor-pointer relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] active:scale-[0.98] select-none ${
                    isActive
                      ? 'text-[#F8FAFC] font-semibold'
                      : isActionItem
                      ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                  }`}
                >
                  {/* Active selection background with smooth spring transition */}
                  {isActive && (
                    <motion.span
                      layoutId="floodNavBg"
                      className="absolute inset-0 bg-[#233750] rounded-xl shadow-xs"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 30 }
                      }
                    />
                  )}

                  {/* Narrow arctic-blue indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="floodNavIndicator"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#65C7FF] rounded-full shadow-[0_0_8px_rgba(101,199,255,0.45)]"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 30 }
                      }
                    />
                  )}

                  {/* Icon & Label */}
                  <div className="flex items-center gap-3 relative z-10 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-all duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none ${
                        isActive
                          ? 'text-[#65C7FF]'
                          : item.id === 'rescue'
                          ? 'text-[#E53945] group-hover:text-[#F87171]'
                          : isActionItem
                          ? 'text-[#A5B4FC] group-hover:text-[#C7D2FE]'
                          : 'text-[#64748B] group-hover:text-[#65C7FF]'
                      }`}
                    />
                    <span className="truncate transition-colors duration-200">
                      {item.label}
                    </span>
                  </div>

                  {/* Optional Alerts Badge */}
                  {item.id === 'alerts' && unacknowledgedAlertsCount > 0 && (
                    <span className="relative z-10 px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-mono font-bold leading-none">
                      {unacknowledgedAlertsCount}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer: Sensor Node State & Clock */}
        <div className="p-4 border-t border-[#1F2E44] bg-[#0E1522] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px] font-mono">
            <span className="text-[#94A3B8]">Sensor Node:</span>
            {currentRiskState !== 'OFFLINE_STALE' ? (
              <span className="text-[#34D399] font-bold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399] ring-2 ring-[#34D399]/25" />
                </span>
                ONLINE
              </span>
            ) : (
              <span className="text-[#F87171] font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#64748B] flex items-center justify-between">
            <span>NODE-ESP32-FL01</span>
            <span>{currentTime}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (When Open) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-40 bg-[#0F172A]/70 backdrop-blur-xs flex"
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 28, stiffness: 300 }
              }
              className="w-72 bg-[#111827] text-[#F8FAFC] h-full flex flex-col p-4 shadow-2xl border-r border-[#1F2E44]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1F2E44]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF]">
                    <Waves className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[14px] uppercase tracking-wider text-[#F8FAFC]">
                    Flood Navigation
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638] transition-colors duration-150"
                  aria-label="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow py-3 space-y-1 overflow-y-auto">
                {FLOOD_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isActionItem = item.isExternal;

                  return (
                    <React.Fragment key={item.id}>
                      {item.hasDividerBefore && <div className="my-2 border-t border-[#1F2E44]" />}
                      <button
                        key={item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (item.route) {
                            onNavigate(item.route);
                          } else if (item.tabId) {
                            setActiveTab(item.tabId);
                          }
                        }}
                        className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 active:scale-[0.98] ${
                          isActive
                            ? 'bg-[#233750] text-[#F8FAFC] font-semibold border-l-2 border-[#65C7FF]'
                            : isActionItem
                            ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                            : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                              isActive
                                ? 'text-[#65C7FF]'
                                : item.id === 'rescue'
                                ? 'text-[#E53945]'
                                : isActionItem
                                ? 'text-[#A5B4FC]'
                                : 'text-[#64748B] group-hover:text-[#65C7FF]'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.id === 'alerts' && unacknowledgedAlertsCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-mono font-bold leading-none">
                            {unacknowledgedAlertsCount}
                          </span>
                        )}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#1F2E44] text-[13px]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/');
                  }}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] block py-1.5 font-medium transition-colors duration-150"
                >
                  Exit to Public Portal
                </button>
              </div>
            </motion.div>
            <div className="flex-grow" onClick={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="bg-white border-b border-[#DCE6F1] px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#5D6F89] mb-1">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-[#17243A] hover:underline transition-colors duration-150 cursor-pointer"
                >
                  Platform
                </button>
                <span>/</span>
                <span className="text-[#0284C7] font-semibold">Flood Monitoring</span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#17243A] tracking-tight leading-snug">
                {currentTabMeta.title}
              </h1>
              <p className="text-[14px] text-[#5D6F89] mt-0.5 max-w-2xl">
                {currentTabMeta.subtitle}
              </p>
            </div>
          </div>
        </header>

        {/* Demonstration Dry-Run Presets Toolbar (FR-08) */}
        <div className="bg-white border-b border-[#DCE6F1] px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-cyan-700">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-extrabold text-[12px] sm:text-[13px] tracking-wide text-[#111827] uppercase">
                  Demonstration Dry-Run Presets:
                </span>
                <span className="text-[#64748B] text-xs font-medium">
                  (Interactive dry-run mode matching PRD Section 5 / FR-08)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  {
                    id: 'NORMAL',
                    label: 'Normal',
                    depth: '48cm',
                    dotColor: 'bg-emerald-500',
                    hoverBorder: 'hover:border-emerald-400',
                  },
                  {
                    id: 'RISING',
                    label: 'Rising',
                    depth: '118cm',
                    dotColor: 'bg-amber-500',
                    hoverBorder: 'hover:border-amber-400',
                  },
                  {
                    id: 'WARNING',
                    label: 'Warning',
                    depth: '148cm',
                    dotColor: 'bg-orange-500',
                    hoverBorder: 'hover:border-orange-400',
                  },
                  {
                    id: 'CRITICAL',
                    label: 'Critical',
                    depth: '184cm',
                    dotColor: 'bg-red-500',
                    pulse: true,
                    hoverBorder: 'hover:border-red-400',
                  },
                  {
                    id: 'SENSOR_STALE',
                    label: 'Sensor Stale',
                    depth: 'Offline',
                    dotColor: 'bg-slate-400',
                    hoverBorder: 'hover:border-slate-400',
                  },
                  {
                    id: 'RECOVERING',
                    label: 'Receding',
                    depth: '72cm',
                    dotColor: 'bg-sky-500',
                    hoverBorder: 'hover:border-sky-400',
                  },
                ] as const
              ).map((item) => {
                const isActive = activePreset === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => handleApplyPreset(item.id)}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer border shadow-xs outline-hidden ${
                      isActive
                        ? 'bg-[#111827] text-white border-[#111827] shadow-md shadow-[#111827]/20 ring-2 ring-[#65C7FF]/50'
                        : `bg-[#F8FAFC] text-[#475569] border-[#DCE6F1] hover:bg-white hover:text-[#111827] ${item.hoverBorder} hover:shadow-sm`
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125 ${
                        item.dotColor
                      }`}
                    />
                    <span className="font-semibold">{item.label}</span>
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md font-medium transition-colors ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'bg-[#E2E8F0]/70 text-[#64748B] group-hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {item.depth}
                    </span>
                  </motion.button>
                );
              })}

              <motion.button
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setAutoSimulate(!autoSimulate)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer border shadow-xs outline-hidden ${
                  autoSimulate
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/50'
                    : 'bg-white text-[#475569] border-[#DCE6F1] hover:bg-[#F8FAFC] hover:text-[#111827] hover:border-slate-300 hover:shadow-sm'
                }`}
                title="Toggle automatic reading jitter every 4 seconds"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    autoSimulate ? 'animate-spin text-white' : 'text-[#64748B]'
                  }`}
                />
                <span className="font-semibold">Live Tick</span>
                <span
                  className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md font-bold uppercase transition-colors ${
                    autoSimulate
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {autoSimulate ? 'ON' : 'OFF'}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW SCREEN */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Risk State Alert Banner */}
            <div
              className={`p-4 sm:p-5 rounded-xl border ${riskBadge.bg} ${riskBadge.border} ${riskBadge.text} shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-white/80 border border-current shrink-0 mt-0.5">
                  <RiskIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-widest uppercase">
                      SYSTEM RISK STATE
                    </span>
                    <span className="text-sm font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-white/80 border border-current">
                      {riskBadge.label}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] mt-1 font-medium leading-relaxed max-w-3xl opacity-90">
                    {riskBadge.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono opacity-80 block">
                  LAST UPDATE: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
                <span className="text-[11px] font-mono font-semibold bg-white/70 px-2 py-0.5 rounded border border-current mt-1 inline-block">
                  NODE-ESP32-FL01
                </span>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Calculated Water Depth */}
              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-2">
                  <span>CALCULATED DEPTH</span>
                  <span className="flex items-center gap-1 font-bold">
                    {!latestReading || !latestReading.is_valid || latestReading.calculated_depth_cm === null ? (
                      <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px] font-bold">
                        <WifiOff className="w-3.5 h-3.5" /> OFFLINE / DISCONNECTED
                      </span>
                    ) : latestReading?.trend === 'RISING' ? (
                      <span className="text-red-600 flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Rising
                      </span>
                    ) : latestReading?.trend === 'FALLING' ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> Receding
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <Minus className="w-3.5 h-3.5" /> Stable
                      </span>
                    )}
                  </span>
                </div>

                <div className="my-1">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#17243A] font-mono tracking-tight">
                    {latestReading?.calculated_depth_cm !== null
                      ? `${latestReading?.calculated_depth_cm} cm`
                      : 'N/A'}
                  </div>
                  <span className="text-xs text-[#5D6F89] mt-1 block">
                    Reference Height: {thresholds.reference_height_cm} cm bed
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE6F1] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#5D6F89]">Capacity Used:</span>
                  {latestReading?.calculated_depth_cm != null && latestReading.is_valid ? (
                    (() => {
                      const rawPct = Math.round(
                        (latestReading.calculated_depth_cm / thresholds.reference_height_cm) * 100
                      );
                      if (rawPct > 100) {
                        return (
                          <span className="text-red-600 font-extrabold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{rawPct}% (OVERTOPPING / OVER-RANGE)</span>
                          </span>
                        );
                      }
                      return (
                        <strong className="text-[#17243A]">
                          {Math.min(100, Math.max(0, rawPct))}% {rawPct === 100 ? '(Channel At Capacity)' : ''}
                        </strong>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400 font-semibold">Unavailable (Offline)</span>
                  )}
                </div>
              </div>

              {/* Metric 2: Ultrasonic Surface Distance */}
              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-2">
                  <span>ULTRASONIC DISTANCE</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                    HC-SR04 ECHO
                  </span>
                </div>

                <div className="my-1">
                  <div className="text-3xl sm:text-4xl font-extrabold text-cyan-700 font-mono tracking-tight">
                    {latestReading?.water_surface_distance_cm !== null
                      ? `${latestReading?.water_surface_distance_cm} cm`
                      : 'ECHO TIMEOUT'}
                  </div>
                  <span className="text-xs text-[#5D6F89] mt-1 block">
                    Sensor face to water surface
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE6F1] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#5D6F89]">Echo State:</span>
                  <strong className={latestReading?.is_valid ? 'text-emerald-700' : 'text-red-600'}>
                    {latestReading?.is_valid ? 'ECHO VALID' : 'OUT OF RANGE'}
                  </strong>
                </div>
              </div>

              {/* Metric 3: Ambient Temperature & Humidity (DHT11) */}
              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-2">
                  <span>DHT11 AMBIENT</span>
                  <span className="text-[10px] text-slate-500 font-bold">GPIO 4</span>
                </div>

                <div className="my-1 flex items-baseline gap-4">
                  <div>
                    <span className="text-2xl font-extrabold text-[#17243A] font-mono">
                      {latestReading?.temperature_c !== null
                        ? `${latestReading?.temperature_c}°C`
                        : '--'}
                    </span>
                    <span className="text-[11px] text-[#5D6F89] block">Temp</span>
                  </div>
                  <div className="border-l border-[#DCE6F1] pl-3">
                    <span className="text-2xl font-extrabold text-[#17243A] font-mono">
                      {latestReading?.humidity_pct !== null
                        ? `${latestReading?.humidity_pct}%`
                        : '--'}
                    </span>
                    <span className="text-[11px] text-[#5D6F89] block">Rel Humidity</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE6F1] text-[10px] text-[#5D6F89] leading-tight">
                  Note: DHT11 humidity indicates ambient air moisture, not rainfall rate.
                </div>
              </div>

              {/* Metric 4: Soil Moisture (Capacitive) */}
              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-2">
                  <span>SOIL MOISTURE</span>
                  <span className="text-[10px] text-slate-500 font-bold">GPIO 34 ADC</span>
                </div>

                <div className="my-1">
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#17243A] font-mono tracking-tight">
                    {latestReading?.soil_moisture_pct !== null
                      ? `${latestReading?.soil_moisture_pct}%`
                      : 'UNPLUGGED'}
                  </div>
                  <span className="text-xs text-[#5D6F89] mt-1 block">
                    Capacitive Saturation Index
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[#DCE6F1] text-[10px] text-[#5D6F89] leading-tight">
                  Supporting ground measurement; not standalone proof of flood hazard.
                </div>
              </div>
            </div>

            {/* Middle Section: Channel Depth Cross-Section & Active Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Channel Depth Visual Cross-Section (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE6F1] pb-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#17243A]">
                      Channel Water-Depth Geometry
                    </h3>
                    <p className="text-xs text-[#5D6F89] mt-0.5">
                      Visualizing calibrated reference height ({thresholds.reference_height_cm}cm) and active flood thresholds
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-[#F3F7FC] text-[#5D6F89] px-2.5 py-1 rounded border border-[#DCE6F1]">
                    HC-SR04 Mount: {thresholds.reference_height_cm}cm
                  </span>
                </div>

                {/* Vertical Gauge Simulation Bar */}
                <div className="py-2">
                  <div className="relative h-24 bg-slate-100 rounded-xl overflow-hidden border border-[#DCE6F1]">
                    {/* Water Fill */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((latestReading?.calculated_depth_cm || 0) /
                              thresholds.reference_height_cm) *
                              100
                          )
                        )}%`,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`h-full transition-colors ${
                        currentRiskState === 'CRITICAL'
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : currentRiskState === 'WARNING'
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : currentRiskState === 'WATCH'
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                    />

                    {/* Marker Lines */}
                    {/* Watch Line (50%) */}
                    <div
                      className="absolute top-0 bottom-0 border-r-2 border-dashed border-amber-600 z-10"
                      style={{
                        left: `${(thresholds.watch_depth_cm / thresholds.reference_height_cm) * 100}%`,
                      }}
                    >
                      <span className="absolute top-1 -translate-x-1/2 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Watch ({thresholds.watch_depth_cm}cm)
                      </span>
                    </div>

                    {/* Warning Line (70%) */}
                    <div
                      className="absolute top-0 bottom-0 border-r-2 border-dashed border-orange-600 z-10"
                      style={{
                        left: `${(thresholds.warning_depth_cm / thresholds.reference_height_cm) * 100}%`,
                      }}
                    >
                      <span className="absolute bottom-1 -translate-x-1/2 bg-orange-100 text-orange-900 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Warning ({thresholds.warning_depth_cm}cm)
                      </span>
                    </div>

                    {/* Critical Line (87.5%) */}
                    <div
                      className="absolute top-0 bottom-0 border-r-2 border-red-600 z-10"
                      style={{
                        left: `${(thresholds.critical_depth_cm / thresholds.reference_height_cm) * 100}%`,
                      }}
                    >
                      <span className="absolute top-1 -translate-x-1/2 bg-red-100 text-red-900 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Critical ({thresholds.critical_depth_cm}cm)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-[#5D6F89] mt-2">
                    <span>Bed Level: 0 cm</span>
                    <span>50% Watch: {thresholds.watch_depth_cm} cm</span>
                    <span>70% Warning: {thresholds.warning_depth_cm} cm</span>
                    <span>Max Capacity: {thresholds.reference_height_cm} cm</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#DCE6F1] text-xs text-[#5D6F89] flex items-center justify-between">
                  <span>Active Channel Profile: Urban Concrete Canal #4</span>
                  <button
                    onClick={() => setActiveTab('monitoring')}
                    className="text-cyan-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Configure Thresholds</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Alerts Panel (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE6F1] pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#E53945]" />
                    <h3 className="text-[15px] font-bold text-[#17243A]">
                      Active Flood Alerts
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    {unacknowledgedAlertsCount} Unacknowledged
                  </span>
                </div>

                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-50/40 border-red-200'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-yellow-50/30 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-[#17243A]">
                          {alert.id} • {alert.rule_name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-600 text-white'
                              : 'bg-yellow-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p className="text-xs text-[#5D6F89] leading-snug mb-2 font-medium">
                        {alert.trigger_condition}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200/80">
                        <span className="text-slate-500">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>

                        {alert.acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            ACKNOWLEDGED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 rounded bg-[#17243A] hover:bg-[#2E415E] text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="py-8 text-center text-[#5D6F89] text-xs">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5 opacity-60" />
                      <span>No active flood alerts. All measurements nominal.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="w-full py-2 rounded-lg bg-[#F3F7FC] hover:bg-slate-200 text-[#17243A] text-xs font-semibold text-center transition-colors cursor-pointer block"
                  >
                    View All Alert History ({alerts.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE MONITORING SCREEN */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-white border border-[#DCE6F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-[#17243A]">
                  Real-Time Depth vs. Time Telemetry
                </h3>
                <p className="text-xs text-[#5D6F89] mt-0.5">
                  High-frequency time-series curves plotting ultrasonic distance and calculated channel depth.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                  REF: {thresholds.reference_height_cm}cm
                </span>
                <span className="text-xs font-mono font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                  WARN: {thresholds.warning_depth_cm}cm
                </span>
                <span className="text-xs font-mono font-semibold bg-red-50 text-red-800 px-2.5 py-1 rounded border border-red-200">
                  CRIT: {thresholds.critical_depth_cm}cm
                </span>
              </div>
            </div>

            {/* SVG Live Telemetry Time-Series Chart */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] p-6 shadow-xs space-y-4">
              <div className="h-[280px] w-full relative">
                {/* SVG Polyline Graph */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240">
                  {/* Grid Lines */}
                  {[0, 60, 120, 180, 240].map((y) => (
                    <line
                      key={y}
                      x1="40"
                      y1={y}
                      x2="790"
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Threshold Line: Critical (175cm => 240 - (175/200)*240 = 30) */}
                  <line
                    x1="40"
                    y1={240 - (thresholds.critical_depth_cm / thresholds.reference_height_cm) * 240}
                    x2="790"
                    y2={240 - (thresholds.critical_depth_cm / thresholds.reference_height_cm) * 240}
                    stroke="#E53945"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <text
                    x="45"
                    y={240 - (thresholds.critical_depth_cm / thresholds.reference_height_cm) * 240 - 4}
                    fill="#E53945"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    CRITICAL ({thresholds.critical_depth_cm} cm)
                  </text>

                  {/* Threshold Line: Warning (140cm => 240 - (140/200)*240 = 72) */}
                  <line
                    x1="40"
                    y1={240 - (thresholds.warning_depth_cm / thresholds.reference_height_cm) * 240}
                    x2="790"
                    y2={240 - (thresholds.warning_depth_cm / thresholds.reference_height_cm) * 240}
                    stroke="#D98A00"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <text
                    x="45"
                    y={240 - (thresholds.warning_depth_cm / thresholds.reference_height_cm) * 240 - 4}
                    fill="#D98A00"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    WARNING ({thresholds.warning_depth_cm} cm)
                  </text>

                  {/* Threshold Line: Watch (100cm => 240 - (100/200)*240 = 120) */}
                  <line
                    x1="40"
                    y1={240 - (thresholds.watch_depth_cm / thresholds.reference_height_cm) * 240}
                    x2="790"
                    y2={240 - (thresholds.watch_depth_cm / thresholds.reference_height_cm) * 240}
                    stroke="#0284C7"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="45"
                    y={240 - (thresholds.watch_depth_cm / thresholds.reference_height_cm) * 240 - 4}
                    fill="#0284C7"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    WATCH ({thresholds.watch_depth_cm} cm)
                  </text>

                  {/* Graph Curve for Depth */}
                  {(() => {
                    const points = readingsHistory.map((r, i) => {
                      const x = 50 + (i / Math.max(1, readingsHistory.length - 1)) * 730;
                      const depth = r.calculated_depth_cm ?? 0;
                      const y = Math.max(
                        10,
                        Math.min(
                          235,
                          240 - (depth / thresholds.reference_height_cm) * 230
                        )
                      );
                      return `${x},${y}`;
                    });

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points.join(' ')}
                        />
                        {readingsHistory.map((r, i) => {
                          const x = 50 + (i / Math.max(1, readingsHistory.length - 1)) * 730;
                          const depth = r.calculated_depth_cm ?? 0;
                          const y = Math.max(
                            10,
                            Math.min(
                              235,
                              240 - (depth / thresholds.reference_height_cm) * 230
                            )
                          );
                          const isLast = i === readingsHistory.length - 1;
                          return (
                            <circle
                              key={r.reading_id}
                              cx={x}
                              cy={y}
                              r={isLast ? 5 : 2.5}
                              fill={isLast ? '#E53945' : '#0284C7'}
                              stroke="#ffffff"
                              strokeWidth={isLast ? '2' : '1'}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs text-[#5D6F89] font-mono pt-3 border-t border-[#DCE6F1]">
                <span>
                  {readingsHistory.length > 0
                    ? `FIRST: ${new Date(readingsHistory[0].timestamp).toLocaleTimeString()}`
                    : 'T-Start'}
                </span>
                <span className="hidden sm:inline">
                  {readingsHistory.length > 2
                    ? `MID: ${new Date(
                        readingsHistory[Math.floor(readingsHistory.length / 2)].timestamp
                      ).toLocaleTimeString()}`
                    : ''}
                </span>
                <span className="font-bold text-[#17243A]">
                  LATEST: {latestReading ? new Date(latestReading.timestamp).toLocaleTimeString() : 'N/A'} (SAMPLE)
                </span>
              </div>
            </div>

            {/* Rate of Rise & Threshold Projections (PRD FR-02) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-1">
                  <span>RATE OF RISE (dDepth/dt)</span>
                  <span className="text-[10px] font-bold bg-[#F3F7FC] px-1.5 py-0.5 rounded border border-[#DCE6F1]">
                    5 SAMPLES (SIMULATED)
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17243A]">
                    {rateOfRiseData.rateCmPerMin !== null ? (
                      <span
                        className={
                          rateOfRiseData.rateCmPerMin > 0.05
                            ? 'text-red-600'
                            : rateOfRiseData.rateCmPerMin < -0.05
                            ? 'text-emerald-600'
                            : 'text-slate-600'
                        }
                      >
                        {rateOfRiseData.rateCmPerMin > 0 ? `+${rateOfRiseData.rateCmPerMin}` : rateOfRiseData.rateCmPerMin} cm/min
                      </span>
                    ) : (
                      <span className="text-slate-400 text-lg font-sans font-medium">Unavailable</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#5D6F89] font-mono mt-1 block">
                    {rateOfRiseData.rateCmPerHour !== null
                      ? `${rateOfRiseData.rateCmPerHour > 0 ? `+${rateOfRiseData.rateCmPerHour}` : rateOfRiseData.rateCmPerHour} cm/hr trajectory`
                      : rateOfRiseData.reason}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DCE6F1] text-[10px] text-[#5D6F89]">
                  Evaluates 5-sample slope against channel capacity.
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-1">
                  <span>NEXT THRESHOLD TARGET</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    STAGE PROJECTION
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#17243A]">
                    {rateOfRiseData.targetLabel || 'No Imminent Threshold'}
                  </div>
                  <span className="text-[11px] text-[#5D6F89] font-mono mt-1 block">
                    {rateOfRiseData.targetDepth !== null
                      ? `Trigger level: ${rateOfRiseData.targetDepth} cm`
                      : 'Water level nominal or past critical'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DCE6F1] text-[10px] text-[#5D6F89]">
                  Watch: {thresholds.watch_depth_cm}cm • Warn: {thresholds.warning_depth_cm}cm • Crit: {thresholds.critical_depth_cm}cm
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono text-[#5D6F89] mb-1">
                  <span>ESTIMATED TIME TO TRIGGER</span>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                    ETA PROJECTION
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#17243A]">
                    {rateOfRiseData.etaMinutes !== null ? (
                      <span className="text-amber-600">~{rateOfRiseData.etaMinutes} mins</span>
                    ) : (
                      <span className="text-slate-400 text-lg font-sans font-medium">
                        {rateOfRiseData.status === 'SATURATED'
                          ? 'Past Critical'
                          : rateOfRiseData.status === 'RECEDING'
                          ? 'Receding'
                          : rateOfRiseData.status === 'STABLE'
                          ? 'Steady'
                          : 'Unavailable'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#5D6F89] font-mono mt-1 block">
                    {rateOfRiseData.reason}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DCE6F1] text-[10px] text-[#5D6F89]">
                  Only computed during active rise with valid rate.
                </div>
              </div>
            </div>

            {/* Ultrasonic Speed-of-Sound Temperature Compensation Note */}
            <div className="p-4 rounded-xl bg-white border border-[#DCE6F1] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#17243A]">
                    Acoustic Temperature Compensation Formula (HC-SR04)
                  </h4>
                  <p className="text-xs text-[#5D6F89] mt-0.5 font-mono">
                    v_sound = 331.3 + (0.606 × T_ambient) m/s
                    {latestReading?.temperature_c != null
                      ? ` → Adjusted v = ${(331.3 + 0.606 * latestReading.temperature_c).toFixed(1)} m/s at ${latestReading.temperature_c}°C`
                      : ' → Sensor Offline / Standard 343.0 m/s fallback'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200 shrink-0">
                DATA SOURCE: SIMULATED FORMULA
              </span>
            </div>

            {/* Raw Sensor Telemetry Stream Table */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE6F1] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17243A]">Recent Telemetry Packets</h3>
                  <p className="text-xs text-[#5D6F89] mt-0.5">High-frequency readings received from simulated node</p>
                </div>
                <span className="text-xs font-mono bg-[#F8FAFC] text-[#5D6F89] px-2 py-0.5 rounded border border-[#DCE6F1]">
                  Last {Math.min(8, readingsHistory.length)} Packets
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#DCE6F1] text-[#5D6F89] font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Packet ID</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Distance (Air)</th>
                      <th className="py-2.5 px-4">Calculated Depth</th>
                      <th className="py-2.5 px-4">DHT11 Temp</th>
                      <th className="py-2.5 px-4">Humidity</th>
                      <th className="py-2.5 px-4">Packet Validity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F1] font-mono text-[11px]">
                    {readingsHistory.slice(-8).reverse().map((r) => (
                      <tr key={r.reading_id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2 px-4 font-bold text-[#17243A]">{r.reading_id}</td>
                        <td className="py-2 px-4 text-[#5D6F89]">{new Date(r.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2 px-4 text-cyan-700">
                          {r.water_surface_distance_cm !== null ? `${r.water_surface_distance_cm} cm` : 'TIMEOUT'}
                        </td>
                        <td className="py-2 px-4 font-bold text-[#17243A]">
                          {r.calculated_depth_cm !== null ? `${r.calculated_depth_cm} cm` : 'N/A'}
                        </td>
                        <td className="py-2 px-4 text-[#5D6F89]">
                          {r.temperature_c !== null ? `${r.temperature_c}°C` : '--'}
                        </td>
                        <td className="py-2 px-4 text-[#5D6F89]">
                          {r.humidity_pct !== null ? `${r.humidity_pct}%` : '--'}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold ${r.is_valid ? 'text-emerald-700' : 'text-red-600'}`}>
                            {r.is_valid ? 'VALID_ECHO' : 'INVALID_STALE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALERTS SCREEN (FR-05) */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* PRD Operational Safety Rule Notice */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Operator Operational Guidance (PRD FR-05)</strong>
                <span>
                  Acknowledgement confirms that an operator has reviewed the alert conditions. It does not indicate that the physical flooding hazard has been resolved or that channel capacity has recovered.
                </span>
              </div>
            </div>

            {/* Alerts Table Card */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE6F1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A]">Alert Management Console</h3>
                  <p className="text-xs text-[#5D6F89] mt-0.5">
                    Chronological threshold-triggered alerts and operator acknowledgement status
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#DCE6F1] text-xs font-semibold">
                    {(['ALL', 'CRITICAL', 'WARNING', 'WATCH'] as const).map((sev) => {
                      const count = sev === 'ALL' ? alerts.length : alerts.filter((a) => a.severity === sev).length;
                      const isActive = severityFilter === sev;
                      return (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#111827] text-white shadow-xs font-bold'
                              : 'text-[#64748B] hover:text-[#111827] hover:bg-white'
                          }`}
                        >
                          {sev} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear Demo Alerts Action with Confirmation */}
                  {confirmClearDemoAlerts ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200 text-xs">
                      <span className="text-red-800 font-medium px-1">Clear simulated alerts?</span>
                      <button
                        onClick={handleClearDemoAlerts}
                        className="px-2 py-0.5 rounded bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmClearDemoAlerts(false)}
                        className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-300 font-medium hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClearDemoAlerts(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DCE6F1] text-xs font-semibold text-[#64748B] hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer shadow-2xs"
                      title="Clear simulated alerts for clean presentation demo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Demo Alerts</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#DCE6F1] text-[#5D6F89] font-mono text-[11px] uppercase">
                      <th className="py-3 px-4 font-semibold">Alert ID & Node</th>
                      <th className="py-3 px-4 font-semibold">Severity</th>
                      <th className="py-3 px-4 font-semibold">Trigger Condition</th>
                      <th className="py-3 px-4 font-semibold">Telemetry Reading</th>
                      <th className="py-3 px-4 font-semibold">Timestamp</th>
                      <th className="py-3 px-4 font-semibold">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F1]">
                    {filteredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#17243A]">
                          <div>{alert.id}</div>
                          <span className="text-[10px] text-[#5D6F89] font-normal">{alert.node_id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              alert.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : alert.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs font-medium text-[#17243A]">
                          {alert.trigger_condition}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#5D6F89]">
                          <div>{alert.measured_value}</div>
                          <span className="text-[10px] text-slate-400">Limit: {alert.threshold_value}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#5D6F89] whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {alert.acknowledged ? (
                            <div className="text-[11px] font-mono text-emerald-700">
                              <span className="font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> ACKNOWLEDGED
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {alert.acknowledged_at
                                  ? new Date(alert.acknowledged_at).toLocaleTimeString()
                                  : 'Acknowledged'}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#17243A] hover:bg-[#20314A] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAlerts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#5D6F89] text-xs">
                          <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-2 opacity-60" />
                          <span className="font-semibold block text-sm text-[#17243A]">No Alerts Found</span>
                          <span className="text-slate-500">
                            {severityFilter === 'ALL'
                              ? 'No alerts recorded. All sensor channels nominal.'
                              : `No alerts currently matching severity "${severityFilter}".`}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY SCREEN (FR-07) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white border border-[#DCE6F1] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-[#17243A]">
                  Monitoring History & Environmental Time-Series
                </h3>
                <p className="text-xs text-[#5D6F89] mt-0.5">
                  Historical sensor logs for ultrasonic depth, temperature, humidity, and capacitive ground moisture.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                  DATA SOURCE: SIMULATED HISTORY
                </span>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE6F1] bg-[#F8FAFC] hover:bg-[#EDF2F7] text-xs font-semibold text-[#17243A] transition-colors shadow-2xs"
                  title="Export actual historical records to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE6F1] bg-[#F8FAFC] hover:bg-[#EDF2F7] text-xs font-semibold text-[#17243A] transition-colors shadow-2xs"
                  title="Export actual historical records to JSON"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Export feedback toast / notification */}
            {exportFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {exportFeedback}
                </span>
                <button
                  type="button"
                  onClick={() => setExportFeedback(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Environmental & Hydrological Readings Curve */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#17243A] uppercase font-mono tracking-wider">
                    Hydrological & Environmental Time-Series Curves
                  </h4>
                  <p className="text-[11px] text-[#5D6F89] mt-0.5">
                    Dual-axis visualization: Primary Water Depth (cm) with optional Environmental Humidity (% RH) and Soil Moisture (% Sat).
                  </p>
                </div>

                {/* Series Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWaterDepth(!showWaterDepth)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      showWaterDepth
                        ? 'bg-sky-50 text-sky-700 border border-sky-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${showWaterDepth ? 'bg-[#0284C7]' : 'bg-gray-300'}`} />
                    Water Depth (cm) [Primary]
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHumidity(!showHumidity)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      showHumidity
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${showHumidity ? 'bg-[#6366F1]' : 'bg-gray-300'}`} />
                    Humidity (% RH)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSoilMoisture(!showSoilMoisture)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      showSoilMoisture
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${showSoilMoisture ? 'bg-[#059669]' : 'bg-gray-300'}`} />
                    Soil Moisture (% Sat)
                  </button>
                </div>
              </div>

              {readingsHistory.length === 0 ? (
                <div className="h-44 flex items-center justify-center border border-dashed border-[#DCE6F1] rounded-lg text-xs text-[#5D6F89] font-mono">
                  No historical telemetry records available.
                </div>
              ) : (
                <div className="relative">
                  {/* Axis scale indicators */}
                  <div className="flex justify-between text-[10px] font-mono text-[#5D6F89] mb-1 px-1">
                    <span className="text-sky-700 font-semibold">
                      ▲ Left Axis: Water Depth (0 – {thresholds.reference_height_cm} cm)
                    </span>
                    <span className="text-indigo-700 font-semibold">
                      Right Axis: Humidity & Soil Saturation (0 – 100%) ▲
                    </span>
                  </div>

                  <div className="h-44 w-full relative bg-[#F8FAFC]/50 rounded-lg border border-[#E9EFF6] p-2">
                    <svg className="w-full h-full" viewBox="0 0 800 140" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      {[20, 60, 100].map((y) => (
                        <line key={y} x1="30" y1={y} x2="770" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                      ))}

                      {/* Primary Series: Water Depth Line */}
                      {showWaterDepth && (
                        <polyline
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="2.5"
                          points={readingsHistory
                            .map((r, i) => {
                              const x = 35 + (i / Math.max(1, readingsHistory.length - 1)) * 730;
                              const depth = r.calculated_depth_cm ?? 0;
                              const clampedDepth = Math.max(0, Math.min(depth, thresholds.reference_height_cm));
                              const y = 130 - (clampedDepth / thresholds.reference_height_cm) * 115;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Optional Series: Relative Humidity Line */}
                      {showHumidity && (
                        <polyline
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="1.75"
                          strokeDasharray="4 3"
                          points={readingsHistory
                            .map((r, i) => {
                              const x = 35 + (i / Math.max(1, readingsHistory.length - 1)) * 730;
                              const pct = Math.max(0, Math.min(100, r.humidity_pct ?? 50));
                              const y = 130 - (pct / 100) * 115;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Optional Series: Soil Moisture Line */}
                      {showSoilMoisture && (
                        <polyline
                          fill="none"
                          stroke="#059669"
                          strokeWidth="2"
                          points={readingsHistory
                            .map((r, i) => {
                              const x = 35 + (i / Math.max(1, readingsHistory.length - 1)) * 730;
                              const pct = Math.max(0, Math.min(100, r.soil_moisture_pct ?? 30));
                              const y = 130 - (pct / 100) * 115;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}
                    </svg>
                  </div>

                  {/* Sample Timestamps on X-Axis */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#5D6F89] px-2 pt-1.5">
                    <span>
                      Start: {new Date(readingsHistory[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    {readingsHistory.length > 2 && (
                      <span>
                        Mid: {new Date(readingsHistory[Math.floor(readingsHistory.length / 2)].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    <span>
                      Latest: {new Date(readingsHistory[readingsHistory.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#5D6F89] pt-2 border-t border-[#DCE6F1]">
                <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                  <span className="w-3.5 h-1 bg-[#0284C7] rounded-full" /> Water Depth (cm, 0–{thresholds.reference_height_cm} cm)
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <span className="w-3.5 h-1 border-b-2 border-dashed border-[#6366F1]" /> Humidity (% RH, 0–100%)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-3.5 h-1 bg-[#059669] rounded-full" /> Soil Moisture (% Sat, 0–100%)
                </span>
              </div>
            </div>

            {/* Chronological Event Log Table */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE6F1] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#17243A]">Recent Sensor Ingestion Log</h4>
                  <p className="text-xs text-[#5D6F89]">Chronological buffer of decoded telemetry frames</p>
                </div>
                <span className="text-xs font-mono text-[#5D6F89]">
                  {readingsHistory.length} records in memory
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] sticky top-0 text-[#5D6F89] font-mono text-[11px]">
                    <tr className="border-b border-[#DCE6F1]">
                      <th className="py-2.5 px-4">Reading ID</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Distance (HC-SR04)</th>
                      <th className="py-2.5 px-4">Depth (Bed)</th>
                      <th className="py-2.5 px-4">DHT11 Temp</th>
                      <th className="py-2.5 px-4">Humidity</th>
                      <th className="py-2.5 px-4">Soil Moisture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F1] font-mono text-[11px]">
                    {readingsHistory
                      .slice()
                      .reverse()
                      .map((r) => (
                        <tr key={r.reading_id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2 px-4 font-bold text-[#17243A]">{r.reading_id}</td>
                          <td className="py-2 px-4 text-[#5D6F89]">
                            {new Date(r.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-4 text-cyan-800">
                            {r.water_surface_distance_cm !== null
                              ? `${r.water_surface_distance_cm} cm`
                              : 'TIMEOUT'}
                          </td>
                          <td className="py-2 px-4 font-bold text-[#17243A]">
                            {r.calculated_depth_cm !== null ? `${r.calculated_depth_cm} cm` : 'N/A'}
                          </td>
                          <td className="py-2 px-4 text-[#5D6F89]">
                            {r.temperature_c !== null ? `${r.temperature_c}°C` : '--'}
                          </td>
                          <td className="py-2 px-4 text-[#5D6F89]">
                            {r.humidity_pct !== null ? `${r.humidity_pct}%` : '--'}
                          </td>
                          <td className="py-2 px-4 text-[#5D6F89]">
                            {r.soil_moisture_pct !== null ? `${r.soil_moisture_pct}%` : '--'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DEVICE HEALTH SCREEN (FR-06 / Hardware Scope Section 4) */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            {/* Node Metadata Card */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE6F1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7FC] border border-[#DCE6F1] flex items-center justify-center text-[#17243A]">
                    <Cpu className="w-5 h-5 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#17243A]">
                      ESP32 Node: NODE-ESP32-FL01
                    </h3>
                    <span className="text-xs text-[#5D6F89]">
                      Firmware: v1.0.0-PROTOTYPE • ESP32 DevKit WROOM-32
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {freshnessInfo.isStale ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
                      <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                      {latestReading?.data_source === 'SIMULATED' ? 'SIMULATED NODE (STALE / TIMEOUT)' : 'HARDWARE DISCONNECTED'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                      <span className="w-2 h-2 rounded-full bg-[#0B9B73] animate-pulse" />
                      {latestReading?.data_source === 'SIMULATED' ? 'SIMULATED NODE ONLINE' : 'HARDWARE NODE ONLINE'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
                <div>
                  <span className="text-[#5D6F89] block">WIFI RSSI:</span>
                  <span className="font-bold text-[#17243A]">-64 dBm (Fair)</span>
                </div>
                <div>
                  <span className="text-[#5D6F89] block">IP ADDRESS:</span>
                  <span className="font-bold text-[#17243A]">192.168.4.15</span>
                </div>
                <div>
                  <span className="text-[#5D6F89] block">DATA FRESHNESS:</span>
                  <span
                    className={`font-bold ${
                      freshnessInfo.isStale ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {freshnessInfo.label}
                  </span>
                </div>
                <div>
                  <span className="text-[#5D6F89] block">TELEMETRY SOURCE:</span>
                  <span className="font-bold text-[#17243A]">{freshnessInfo.source}</span>
                </div>
              </div>
            </div>

            {/* Authoritative Bed Reference & Threshold Calibration Form (Moved here as single authoritative location) */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE6F1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17243A]">
                      Authoritative Sensor Calibration & Threshold Configuration
                    </h3>
                    <p className="text-xs text-[#5D6F89]">
                      Single authoritative configuration source controlling ultrasonic bed height, hazard thresholds, and timeout detection.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDraftThresholds(DEFAULT_THRESHOLDS);
                    setThresholds(DEFAULT_THRESHOLDS);
                    setCalibrationSuccess(true);
                    setCalibrationError(null);
                    setTimeout(() => setCalibrationSuccess(false), 3000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE6F1] bg-[#F8FAFC] hover:bg-[#EDF2F7] text-xs font-semibold text-[#5D6F89] hover:text-[#17243A] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
                </button>
              </div>

              {/* Inline Validation Error Banner */}
              {calibrationError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{calibrationError}</div>
                  <button
                    type="button"
                    onClick={() => setCalibrationError(null)}
                    className="text-rose-600 hover:text-rose-800 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Inline Save Success Banner */}
              {calibrationSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">
                    Calibration successfully saved! All thresholds, cross-sections, and alerts updated immediately.
                  </span>
                </div>
              )}

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono text-[#17243A] block">
                    Bed Ref Height (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={draftThresholds.reference_height_cm}
                    onChange={(e) =>
                      setDraftThresholds({
                        ...draftThresholds,
                        reference_height_cm: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-[#DCE6F1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-[#17243A]"
                  />
                  <span className="text-[10px] text-[#5D6F89] block">
                    Sensor mount distance to channel bed
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono text-amber-700 block">
                    Watch Stage (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={draftThresholds.watch_depth_cm}
                    onChange={(e) =>
                      setDraftThresholds({
                        ...draftThresholds,
                        watch_depth_cm: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-amber-300 rounded-lg bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500 text-[#17243A]"
                  />
                  <span className="text-[10px] text-[#5D6F89] block">
                    Yellow Stage 1 Advisory
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono text-orange-700 block">
                    Warning Stage (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={draftThresholds.warning_depth_cm}
                    onChange={(e) =>
                      setDraftThresholds({
                        ...draftThresholds,
                        warning_depth_cm: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-orange-300 rounded-lg bg-orange-50/30 focus:outline-none focus:ring-2 focus:ring-orange-500 text-[#17243A]"
                  />
                  <span className="text-[10px] text-[#5D6F89] block">
                    Orange Stage 2 Alert
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono text-rose-700 block">
                    Critical Stage (cm)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={draftThresholds.critical_depth_cm}
                    onChange={(e) =>
                      setDraftThresholds({
                        ...draftThresholds,
                        critical_depth_cm: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-rose-300 rounded-lg bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500 text-[#17243A]"
                  />
                  <span className="text-[10px] text-[#5D6F89] block">
                    Red Stage 3 Evacuation
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold font-mono text-[#17243A] block">
                    Timeout (sec)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="1"
                    value={draftThresholds.stale_timeout_sec}
                    onChange={(e) =>
                      setDraftThresholds({
                        ...draftThresholds,
                        stale_timeout_sec: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-[#DCE6F1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-[#17243A]"
                  />
                  <span className="text-[10px] text-[#5D6F89] block">
                    Stale telemetry threshold (≥5s)
                  </span>
                </div>
              </div>

              {/* Mathematical Hierarchy Guidance & Action Button */}
              <div className="pt-3 border-t border-[#DCE6F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-[#5D6F89]">
                  <span className="font-semibold text-[#17243A]">Mathematical Invariant: </span>
                  0 &lt; Watch ({draftThresholds.watch_depth_cm}cm) &lt; Warning ({draftThresholds.warning_depth_cm}cm) &lt; Critical ({draftThresholds.critical_depth_cm}cm) &lt; Bed Ref ({draftThresholds.reference_height_cm}cm)
                </div>

                <button
                  type="button"
                  onClick={handleSaveCalibration}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Authoritative Calibration
                </button>
              </div>
            </div>

            {/* Hardware Pinout Table matching PRD Section 4 Table */}
            <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE6F1] flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A]">
                    Hardware Pinout & Level Shifting Specifications
                  </h3>
                  <p className="text-xs text-[#5D6F89] mt-0.5">
                    Verified against PRD Section 4 electrical safety requirements before breadboard powering
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  ESP32 DevKit 3.3V Logic Safe
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#DCE6F1] text-[#5D6F89] font-mono text-[11px] uppercase">
                      <th className="py-3 px-4 font-semibold">Component</th>
                      <th className="py-3 px-4 font-semibold">Pin Label</th>
                      <th className="py-3 px-4 font-semibold">ESP32 GPIO</th>
                      <th className="py-3 px-4 font-semibold">Functional Role</th>
                      <th className="py-3 px-4 font-semibold">Electrical / Level Shifting Notes</th>
                      <th className="py-3 px-4 font-semibold">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F1] font-mono text-[11px]">
                    {HARDWARE_PINS.map((pin) => (
                      <tr key={pin.gpio} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-bold text-[#17243A]">{pin.component}</td>
                        <td className="py-3 px-4 text-cyan-700">{pin.pin_label}</td>
                        <td className="py-3 px-4 font-bold text-[#17243A]">{pin.gpio}</td>
                        <td className="py-3 px-4 text-[#5D6F89] font-sans">{pin.role}</td>
                        <td className="py-3 px-4 text-[#5D6F89] font-sans text-[11px]">{pin.notes}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold font-mono text-[10px]">
                            <Check className="w-3 h-3" /> {pin.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);
};
