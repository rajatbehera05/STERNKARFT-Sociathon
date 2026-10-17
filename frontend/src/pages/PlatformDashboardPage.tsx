import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Waves,
  ArrowRight,
  ShieldAlert,
  Server,
  HardDrive,
  Clock,
  Info,
  X,
  Layers,
  Activity,
  UserCheck,
  CheckCircle2,
  Smartphone,
  Cpu,
  Laptop,
  Gauge,
  HeartHandshake
} from 'lucide-react';
import { AppRoute, GatewayHealth } from '../types';
import { api } from '../services/api';

interface PlatformDashboardProps {
  onNavigate: (route: AppRoute) => void;
}

export const PlatformDashboardPage: React.FC<PlatformDashboardProps> = ({ onNavigate }) => {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [activeIncidentCount, setActiveIncidentCount] = useState<number | null>(null);
  const [showFloodPreview, setShowFloodPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live health and metrics check
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const [healthData, incidentsData] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getIncidents().catch(() => []),
        ]);
        if (isMounted) {
          setHealth(healthData);
          const active = incidentsData.filter((i) => i.status !== 'RESOLVED').length;
          setActiveIncidentCount(active);
        }
      } catch {
        if (isMounted) {
          setHealth(null);
          setActiveIncidentCount(null);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isGatewayOperational = health?.status === 'ok';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-red-600 selection:text-white">
      {/* 1. Top Platform Bar */}
      <header className="w-full bg-[#0f172a] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15">
            {/* Brand Logo & Wordmark */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/')}
                className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
                title="Return to Public Civilian Portal"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-red-500 shadow-inner group-hover:border-red-500 transition-colors">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold tracking-wider uppercase text-white leading-none">
                      ReQNet
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                      Platform
                    </span>
                  </div>
                  <span className="text-[9px] font-medium tracking-wider text-slate-400 uppercase mt-0.5">
                    Disaster Operations Console
                  </span>
                </div>
              </button>
            </div>

            {/* Right Status & Profile Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Local Clock */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/80">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentTime}</span>
              </div>

              {/* Verified Gateway State */}
              {isGatewayOperational ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-mono font-medium text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Gateway Online</span>
                  <span className="sm:hidden">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/70 border border-red-800/80 text-[11px] font-mono font-medium text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="hidden sm:inline">Gateway Offline</span>
                  <span className="sm:hidden">Offline</span>
                </div>
              )}

              {/* Operator Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">Field Operator</span>
                  <span className="text-[10px] text-slate-400 leading-none">Command Node #1</span>
                </div>
              </div>

              {/* Public Portal Exit */}
              <button
                onClick={() => onNavigate('/')}
                className="text-xs font-medium text-slate-400 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800/70 transition-colors cursor-pointer"
                title="Return to Public Civilian Landing Page"
              >
                Public Portal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Platform Launchpad Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <span>ReQNet</span>
                <span className="text-slate-300">/</span>
                <span className="text-sky-700 font-semibold">Operations Launchpad</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Disaster Operations Launchpad
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Central command console. Select an operational module to coordinate offline emergency alerts or access hydrological monitoring.
              </p>
            </div>

            {/* Compact Secondary Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
              <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>Local Storage: JSON</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-2xs">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Mode: Standalone Offline</span>
              </div>
            </div>
          </div>

          {/* Module Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Operational Modules
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              2 Operational • 1 Planned
            </span>
          </div>

          {/* 3. The Module Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card A: Rescue Communication */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="h-1 w-full bg-gradient-to-r from-red-600 via-sky-600 to-sky-500" />

              <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between">
                <div>
                  {/* Tier 1: Header (Icon, Module Name, Single Status Label) */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          Rescue Communication
                        </h3>
                        <span className="text-xs text-sky-700 font-medium">
                          Emergency SOS & Dispatch
                        </span>
                      </div>
                    </div>

                    {isGatewayOperational ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        OPERATIONAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-red-800 bg-red-50 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Tier 2: Description (1-2 Concise Lines) */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 mb-5">
                    Offline emergency alert reception and incident coordination. Stranded civilians connect to local Wi-Fi to submit distress reports directly to field responders.
                  </p>

                  {/* Tier 3: Visual (Simplified, Clean Communication Sequence) */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 my-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                      Offline Message Pipeline
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      {/* Step 1: Civilian Phone */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-1.5">
                          <Smartphone className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">Civilian Phone</span>
                        <span className="text-[10px] text-slate-500">Wi-Fi SOS Form</span>
                      </div>

                      {/* Step 2: ESP32 Gateway */}
                      <div className="flex flex-col items-center text-center relative">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 shadow-2xs flex items-center justify-center text-sky-700 mb-1.5 relative">
                          <Cpu className="w-5 h-5" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">ESP32 Gateway</span>
                        <span className="text-[10px] text-slate-500">Serial Bridge</span>
                      </div>

                      {/* Step 3: Command Station */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-1.5">
                          <Laptop className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">Rescue Station</span>
                        <span className="text-[10px] text-slate-500">Local SSD Triage</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 4: Footer (Relevant Metric & Full-Width Action) */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Active Incidents in Queue</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {activeIncidentCount !== null ? `${activeIncidentCount} active` : 'Connecting...'}
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('/rescue/dashboard')}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all cursor-pointer group"
                  >
                    <span>Open Rescue Communication</span>
                    <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card B: Flood Monitoring */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />

              <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between">
                <div>
                  {/* Tier 1: Header (Icon, Module Name, Single Status Label) */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                        <Waves className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          DisasterSense Flood Monitoring
                        </h3>
                        <span className="text-xs text-amber-700 font-medium">
                          Hydrological Telemetry & Early Warning
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                      OPERATIONAL PROTOTYPE
                    </span>
                  </div>

                  {/* Tier 2: Description (1-2 Concise Lines) */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 mb-5">
                    ESP32-based ultrasonic water-level monitoring, HC-SR04 distance telemetry, threshold early warnings, and supporting environmental measurements.
                  </p>

                  {/* Tier 3: Visual (Simplified, Clean Sensor Sequence) */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 my-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-3">
                      DisasterSense Hardware Telemetry Flow
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      {/* Step 1: Ultrasonic Sensor */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs flex items-center justify-center text-amber-700 mb-1.5">
                          <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">Ultrasonic Sensor</span>
                        <span className="text-[10px] text-slate-500">HC-SR04 (GPIO 5/18)</span>
                      </div>

                      {/* Step 2: Water-Level Reading */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 shadow-2xs flex items-center justify-center text-cyan-700 mb-1.5">
                          <Gauge className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">Calculated Depth</span>
                        <span className="text-[10px] text-slate-500">200cm Bed Ref</span>
                      </div>

                      {/* Step 3: Warning System */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-1.5">
                          <Server className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900">Warning System</span>
                        <span className="text-[10px] text-slate-500">5-State Matrix</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 4: Footer (Capability & Full-Width Action) */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Architecture Status</span>
                    <span className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Phase 1 Frontend & Demonstration Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('/flood/dashboard')}
                      className="flex-grow flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all cursor-pointer group"
                    >
                      <span>Open Flood Monitoring</span>
                      <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => setShowFloodPreview(true)}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      title="View Architecture Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card C: Relief Coordination */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

              <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between">
                <div>
                  {/* Tier 1: Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          Relief Coordination
                        </h3>
                        <span className="text-xs text-emerald-700 font-medium">
                          Nagpur Request & Resource Matching
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                      OPERATIONAL
                    </span>
                  </div>

                  {/* Tier 2: Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 mb-5">
                    Real geographic Nagpur OpenStreetMap triage, verified civilian request intake, emergency supply reservation, and live delivery tracking.
                  </p>

                  {/* Tier 3: Feature Highlights */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 my-2 space-y-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Core Capabilities
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Real Nagpur street map with urgency markers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span>Request-to-depot matching (zero over-allocation)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Urgent unmet needs & dispatch tracking</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier 4: Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Location Scope</span>
                    <span className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      Nagpur, Maharashtra
                    </span>
                  </div>

                  <button
                    onClick={() => onNavigate('/rescue/relief')}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all cursor-pointer group"
                  >
                    <span>Open Relief Coordination</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Architecture Summary Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Modular Emergency Architecture
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ReQNet decouples civilian reporting from operations. Modules operate independently on local hardware to guarantee survival during telecom blackout.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('/rescue/dashboard')}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Launch Rescue Ops</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Flood Architecture Preview Modal */}
      <AnimatePresence>
        {showFloodPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-none">
                       Flood Monitoring Module
                    </h3>
                    <span className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 mt-1 inline-block">
                      STATUS: COMING SOON
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowFloodPreview(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-900">
                  <p className="font-semibold text-xs mb-1">
                    System Architecture Notice
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    This module is scheduled for Phase 2 implementation. In accordance with ReQNet's strict truthful operational reporting policy, synthetic telemetry or simulated river water-level gauges are not displayed as active measurements.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Upcoming Sensor Integration Scope
                  </h4>
                  <ul className="space-y-2 text-[11px]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Ultrasonic hydrological depth sensors deployed on bridges and river gauges.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Direct LoRa packet ingestion via ESP32 mesh transceiver gateways.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Automated flash flood crest warnings with predictive rising-rate triggers.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Target: Sensor Node Firmware v2.0
                </span>
                <button
                  onClick={() => setShowFloodPreview(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
