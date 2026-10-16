import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Waves,
  ArrowLeft,
  Radio,
  HardDrive,
  Info,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';
import { AppRoute } from '../types';

interface FloodDashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const FloodDashboardPage: React.FC<FloodDashboardPageProps> = ({ onNavigate }) => {
  const [showSimulatedData, setShowSimulatedData] = useState(false);
  const [simulatedLevel, setSimulatedLevel] = useState<number>(45); // Bench simulation %

  // Calculate tier based on PRD Section 16.1 thresholds
  const getWarningTier = (pct: number) => {
    if (pct >= 95) return { tier: 'CRITICAL / EVACUATE', color: 'red', desc: 'Mandatory civilian evacuation' };
    if (pct >= 80) return { tier: 'WARNING', color: 'amber', desc: 'Roadway inundation expected' };
    if (pct >= 60) return { tier: 'ADVISORY', color: 'yellow', desc: 'Moderate rate of rise' };
    return { tier: 'NORMAL', color: 'emerald', desc: 'Safe channel capacity (<60%)' };
  };

  const currentTier = getWarningTier(simulatedLevel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f9fd] via-[#eef6fc] to-[#f8fafc] text-slate-800 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full bg-[#0f172a] text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Module Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
                title="Return to Platform Launchpad"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-500 shadow-inner group-hover:border-amber-500 transition-colors">
                  <Waves className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold tracking-wider uppercase text-white leading-none">
                      STERNKRAFT
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">
                      FLOOD MONITORING
                    </span>
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                    HYDROLOGICAL SENSOR NETWORK
                  </span>
                </div>
              </button>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Platform Launchpad</span>
              </button>

              <button
                onClick={() => onNavigate('/rescue/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rescue Communication</span>
                <span className="sm:hidden">Rescue</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Honest Operational Notice Banner */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-amber-950">
                      Module Entry & Prepared Architecture (Phase 2)
                    </h2>
                    <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                      COMING SOON
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 mt-1 max-w-3xl leading-relaxed">
                    Per STERNKRAFT truthful reporting protocols, live environmental water measurements are not claimed without active river gauge hardware. This module entry establishes the complete data schemas, 4-tier warning thresholds, and liquid-free bench calibration protocols ready for upcoming sensor integration.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setShowSimulatedData(!showSimulatedData)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showSimulatedData ? 'Hide Bench Simulator' : 'Preview Bench Simulation'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4-Tier Flood Warning Thresholds (PRD Section 16.1) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  PRD 4-Tier Alerting Thresholds
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Specification v2.2.0 (Section 16.1)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tier 1: Normal */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block mb-2">
                    TIER 1 • NORMAL
                  </span>
                  <div className="text-xl font-mono font-black text-emerald-950">
                    &lt; 60%
                  </div>
                  <span className="text-xs font-bold text-emerald-900 block mt-1">
                    Nominal Capacity
                  </span>
                  <p className="text-[11px] text-emerald-800/80 mt-1 leading-snug">
                    Standard stream flow. Regular hydrological short-polling at 60s intervals.
                  </p>
                </div>
              </div>

              {/* Tier 2: Advisory */}
              <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300 inline-block mb-2">
                    TIER 2 • ADVISORY
                  </span>
                  <div className="text-xl font-mono font-black text-yellow-950">
                    60% – 79%
                  </div>
                  <span className="text-xs font-bold text-yellow-900 block mt-1">
                    Moderate Rise
                  </span>
                  <p className="text-[11px] text-yellow-800/80 mt-1 leading-snug">
                    Catchment inflow alert. First responders and boat squads notified of potential surge.
                  </p>
                </div>
              </div>

              {/* Tier 3: Warning */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block mb-2">
                    TIER 3 • WARNING
                  </span>
                  <div className="text-xl font-mono font-black text-amber-950">
                    80% – 94%
                  </div>
                  <span className="text-xs font-bold text-amber-900 block mt-1">
                    Roadway Inundation
                  </span>
                  <p className="text-[11px] text-amber-800/80 mt-1 leading-snug">
                    Low-lying access routes cut off. Rescue boat staging commands initiated.
                  </p>
                </div>
              </div>

              {/* Tier 4: Critical */}
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-300 inline-block mb-2">
                    TIER 4 • CRITICAL
                  </span>
                  <div className="text-xl font-mono font-black text-red-950">
                    &ge; 95%
                  </div>
                  <span className="text-xs font-bold text-red-900 block mt-1">
                    Civilian Evacuation
                  </span>
                  <p className="text-[11px] text-red-800/80 mt-1 leading-snug">
                    Over-topping imminent. Mandatory roof-level evacuation protocols enforced.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Bench Calibration Simulator (When enabled) */}
          {showSimulatedData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Liquid-Free Bench Distance Transducer Simulator
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  DEVELOPMENT BENCH SIMULATION
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">
                  Liquid-Free Testing Protocol (PRD Section 12):
                </span>
                In hackathon demo conditions, no water or liquid containers are used. The ultrasonic sensor measures the physical distance to a movable cardboard target on the table, translating relative displacement into simulated reservoir fill level.
              </div>

              {/* Slider for Bench Target Distance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-slate-700">Simulate Target Proximity / Fill Level:</span>
                  <span className="font-extrabold text-base text-slate-900">{simulatedLevel}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={simulatedLevel}
                  onChange={(e) => setSimulatedLevel(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>10% (Target Far / Nominal)</span>
                  <span>60% (Advisory)</span>
                  <span>80% (Warning)</span>
                  <span>95%+ (Critical Evacuation)</span>
                </div>
              </div>

              {/* Computed Tier Output */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">CURRENT TRIGGERED TIER</span>
                  <span className={`text-base font-black ${currentTier.color === 'red' ? 'text-red-700' : currentTier.color === 'amber' ? 'text-amber-700' : currentTier.color === 'yellow' ? 'text-yellow-700' : 'text-emerald-700'}`}>
                    {currentTier.tier}
                  </span>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    {currentTier.desc}
                  </span>
                </div>

                <div className="text-right text-xs font-mono text-slate-500">
                  <span>Calculated Depth: <strong>{(simulatedLevel * 1.5).toFixed(1)} cm</strong></span>
                  <span className="block mt-0.5">Rate of Rise: <strong>+{(simulatedLevel * 0.08).toFixed(1)} cm/hr</strong></span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Architecture & Telemetry Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telemetry Schema Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-500" />
                <span>Hydrological Sensor Telemetry Schema</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Planned telemetry payload contract for ESP32 UART / LoRa ingestion:
              </p>

              <pre className="p-3.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`{
  "sensor_id": "HYDRO-NODE-01",
  "water_level_cm": 142.5,
  "rate_of_rise_cm_per_hr": 14.2,
  "warning_tier": "ADVISORY",
  "battery_mv": 3980,
  "signal_rssi": -68,
  "timestamp": "2026-10-16T18:45:00Z"
}`}
              </pre>
            </div>

            {/* Transition to Rescue Communication */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Radio className="w-4 h-4 text-red-600" />
                  <span>Primary Implementation: Rescue Communication</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The primary focus of this overnight sprint is civilian SOS reception, gateway bridging, local SSD persistence, and live rescue incident dispatch.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-950 font-medium">
                  Rescue Communication workspace is fully operational with live polling, incident triage, and tactical map plotting.
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('/rescue/dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
                >
                  <span>Launch Rescue Communication</span>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
