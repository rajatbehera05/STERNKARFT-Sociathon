import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Radio,
  HardDrive,
  Clock,
  RefreshCw,
  XCircle,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { GatewayHealth, Incident, CommunicationEvent, AppRoute } from '../types';
import { api } from '../services/api';

interface DeviceStatusPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const DeviceStatusPage: React.FC<DeviceStatusPageProps> = ({ onNavigate }) => {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [backendError, setBackendError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const [healthData, incidentsData, eventsData] = await Promise.all([
        api.getHealth(),
        api.getIncidents().catch(() => []),
        api.getEvents().catch(() => []),
      ]);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setHealth(healthData);
      setIncidents(incidentsData);
      setEvents(eventsData);
      setBackendError(null);
      setLastCheckTime(new Date());
    } catch (err: any) {
      setHealth(null);
      setBackendError('Connection to local backend (http://localhost:5000) failed.');
      setLatencyMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 5000);
    return () => clearInterval(interval);
  }, []);

  const latestIncident = incidents.length > 0 ? incidents[0] : null;
  const isGatewayOnline = health?.status === 'ok' && (health.gateway_connected ?? true);
  const isBackendOnline = health?.status === 'ok';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Diagnostic Banner */}
      <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#17243A] tracking-tight">
              Hardware Connectivity & System Telemetry
            </h2>
            <span className="text-[11px] font-mono font-semibold bg-[#F3F7FC] text-[#5D6F89] px-2 py-0.5 rounded border border-[#DCE6F1]">
              Field Benchmark
            </span>
          </div>
          <p className="text-[14px] text-[#5D6F89] mt-0.5">
            Real-time diagnostic health checks for field consoles, ESP32 gateway links, and local non-volatile storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <span className="text-[11px] font-mono text-[#5D6F89] block">LAST AUDIT</span>
            <span className="text-[13px] font-mono font-bold text-[#17243A]">
              {lastCheckTime.toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={isPinging}
            className="flex items-center gap-2 px-4 py-2 bg-[#17243A] hover:bg-[#20314A] text-white rounded-lg text-[13px] font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>Run Probe</span>
          </button>
        </div>
      </div>

      {backendError && (
        <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#FCD8D9] text-[13px] text-[#E53945] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-[#E53945] shrink-0" />
            <span>{backendError}</span>
          </div>
          <span className="font-mono font-bold text-[11px] text-[#E53945]">PORT 5000 DOWN</span>
        </div>
      )}

      {/* 4 Core Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: ESP32 Field Gateway */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1685D1]">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A] leading-tight">
                    ESP32 Field Gateway
                  </h3>
                  <span className="text-[12px] text-[#5D6F89]">
                    Wi-Fi SoftAP / LoRa Mesh Link
                  </span>
                </div>
              </div>

              {isGatewayOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B9B73] animate-pulse" />
                  ONLINE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F2] text-[#E53945] border border-[#FCD8D9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E53945]" />
                  OFFLINE
                </span>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#DCE6F1] text-[13px] font-mono">
              <div className="flex justify-between py-1">
                <span className="text-[#5D6F89]">SSID Broadcast:</span>
                <span className="font-semibold text-[#17243A]">STERNKRAFT-RESCUE-AP</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Ingress Protocol:</span>
                <span className="font-semibold text-[#17243A]">HTTP REST / JSON POST</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Gateway State:</span>
                <span className="text-[#0B9B73] font-semibold">
                  {isGatewayOnline ? 'Connected & Relaying' : 'Standby / Not Configured'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE6F1] text-[12px] text-[#5D6F89]">
            Civilian SOS packets route via local Wi-Fi without internet or cellular connectivity.
          </div>
        </div>

        {/* Card 2: Local Station Backend */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#F3F7FC] border border-[#DCE6F1] flex items-center justify-center text-[#17243A]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A] leading-tight">
                    Local Station Backend
                  </h3>
                  <span className="text-[12px] text-[#5D6F89]">
                    Autonomous Express Server (Port 5000)
                  </span>
                </div>
              </div>

              {isBackendOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B9B73]" />
                  HEALTHY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FDF2F2] text-[#E53945] border border-[#FCD8D9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E53945]" />
                  UNREACHABLE
                </span>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-[#DCE6F1] text-[13px] font-mono">
              <div className="flex justify-between py-1">
                <span className="text-[#5D6F89]">Operational Mode:</span>
                <span className="font-semibold text-[#17243A]">{health?.mode || 'OFFLINE_LOCAL'}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Response Latency:</span>
                <span className="font-semibold text-[#17243A]">
                  {latencyMs !== null ? `${latencyMs} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Service Identifier:</span>
                <span className="font-semibold text-[#17243A]">{health?.service || 'sternkraft-backend'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE6F1] text-[12px] text-[#5D6F89]">
            Zero reliance on cloud servers, DNS, or public internet connectivity.
          </div>
        </div>

        {/* Card 3: Non-Volatile Persistence */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#F3F7FC] border border-[#DCE6F1] flex items-center justify-center text-[#1685D1]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A] leading-tight">
                    Local Disk Persistence
                  </h3>
                  <span className="text-[12px] text-[#5D6F89]">
                    Non-volatile JSON Datastore
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                COMMITTED
              </span>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#DCE6F1] text-[13px] font-mono">
              <div className="flex justify-between py-1">
                <span className="text-[#5D6F89]">Incidents File:</span>
                <span className="font-semibold text-[#17243A]">incidents.json ({incidents.length} items)</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Event Audit File:</span>
                <span className="font-semibold text-[#17243A]">events.json ({events.length} items)</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Write Policy:</span>
                <span className="font-semibold text-[#17243A]">Synchronous atomic flush</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE6F1] text-[12px] text-[#5D6F89]">
            All records persist across application restarts or laptop power cycles.
          </div>
        </div>

        {/* Card 4: Serial / Hardware Standby */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FEF8ED] border border-[#FDE8BF] flex items-center justify-center text-[#D98A00]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#17243A] leading-tight">
                    Serial / USB UART Bridge
                  </h3>
                  <span className="text-[12px] text-[#5D6F89]">
                    Physical Hardware Telemetry
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF8ED] text-[#D98A00] border border-[#FDE8BF]">
                STANDBY
              </span>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#DCE6F1] text-[13px] font-mono">
              <div className="flex justify-between py-1">
                <span className="text-[#5D6F89]">Serial Ingestion:</span>
                <span className="font-semibold text-[#17243A]">Standby (HTTP Active)</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">UART Baud Rate:</span>
                <span className="font-semibold text-[#17243A]">115200 8N1</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F3F7FC]">
                <span className="text-[#5D6F89]">Heartbeat State:</span>
                <span className="font-semibold text-[#17243A]">Polling Gateway Health</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE6F1] text-[12px] text-[#5D6F89]">
            Wi-Fi SoftAP is currently handling ingestion; USB serial port listener is available on demand.
          </div>
        </div>
      </div>

      {/* Latest Incident Reception Telemetry Panel */}
      <div className="bg-white rounded-xl border border-[#DCE6F1] p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
        <h3 className="text-[13px] font-bold text-[#17243A] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1685D1]" />
          <span>Last Ingested Distress Alert</span>
        </h3>

        {latestIncident ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#DCE6F1] text-[13px] font-mono">
            <div>
              <span className="font-bold text-[#17243A] block text-[14px]">
                {latestIncident.id} ({latestIncident.category})
              </span>
              <span className="text-[#5D6F89] text-[12px]">
                {latestIncident.location_manual || 'Location unspecified'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#5D6F89] block">RECEIVED AT</span>
                <span className="font-bold text-[#17243A]">
                  {new Date(latestIncident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => onNavigate('/rescue/incidents')}
                className="px-3 py-1.5 bg-white border border-[#DCE6F1] rounded-lg text-[#17243A] font-semibold hover:bg-[#F3F7FC] transition-colors cursor-pointer text-[12px] flex items-center gap-1"
              >
                <span>View Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#5D6F89] italic">
            No incidents recorded in backend storage yet.
          </p>
        )}
      </div>
    </motion.div>
  );
};
