import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Activity,
  Server,
  Users,
  MapPin,
  Radio,
  CheckCheck,
  Compass,
  ChevronRight,
  Route
} from 'lucide-react';
import { Incident, IncidentStatus, CommunicationEvent, GatewayHealth, AppRoute } from '../types';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/StatusBadges';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll incidents, events, and health at 2.0s fixed interval (PRD FR-4.1)
  const fetchData = async () => {
    try {
      const [incidentsData, eventsData, healthData] = await Promise.all([
        api.getIncidents(),
        api.getEvents().catch(() => []),
        api.getHealth().catch(() => null),
      ]);
      setIncidents(incidentsData);
      setEvents(eventsData);
      setHealth(healthData);
      setError(null);

      // If an incident is open in the modal, update its local data
      if (selectedIncident) {
        const updated = incidentsData.find((i) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err: any) {
      console.error('Polling error:', err);
      setError('Local backend unreachable on localhost:5001');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: IncidentStatus, notes?: string) => {
    try {
      await api.updateIncidentStatus(id, status, notes);
      await fetchData();
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  // Metrics computation from real persisted data
  const incomingCount = incidents.filter((i) => i.status === 'NEW').length;
  const activeCount = incidents.filter((i) => i.status === 'NEW' || i.status === 'ACKNOWLEDGED' || i.status === 'RESPONDING').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const criticalCount = incidents.filter((i) => i.priority_tier === 'CRITICAL' && i.status !== 'RESOLVED').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <span className="font-mono text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
            DISCONNECTED • PORT 5001
          </span>
        </div>
      )}

      {/* 1. Overview Metric Cards: Refined Smart-IoT Benchmark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Incoming SOS Alerts */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] hover:shadow-[0_4px_12px_rgba(23,36,58,0.06)] transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#5D6F89]">
              Incoming SOS
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] border border-[#FCD8D9] flex items-center justify-center text-[#E53945]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5 my-1">
            <span className="text-[28px] sm:text-[32px] font-bold text-[#17243A] font-mono tracking-tight leading-none">
              {incomingCount}
            </span>
            {criticalCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FDF2F2] text-[#E53945] border border-[#FCD8D9]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E53945] animate-pulse" />
                {criticalCount} Critical
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F7FC] text-[#5D6F89] border border-[#DCE6F1]">
                Queue Clear
              </span>
            )}
          </div>

          <div className="text-[13px] text-[#5D6F89] flex items-center justify-between">
            <span>Awaiting triage</span>
            <span className="font-mono text-[11px] text-[#5D6F89]">P1 Priority</span>
          </div>
        </div>

        {/* Card 2: Active Incidents */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] hover:shadow-[0_4px_12px_rgba(23,36,58,0.06)] transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#5D6F89]">
              Active Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1685D1]">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5 my-1">
            <span className="text-[28px] sm:text-[32px] font-bold text-[#17243A] font-mono tracking-tight leading-none">
              {activeCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#1685D1] border border-[#BFDBFE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1685D1]" />
              In Progress
            </span>
          </div>

          <div className="text-[13px] text-[#5D6F89] flex items-center justify-between">
            <span>Rescue units assigned</span>
            <span className="font-mono text-[11px] text-[#1685D1]">Active</span>
          </div>
        </div>

        {/* Card 3: Resolved Cases */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] hover:shadow-[0_4px_12px_rgba(23,36,58,0.06)] transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#5D6F89]">
              Resolved Cases
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#0B9B73]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2.5 my-1">
            <span className="text-[28px] sm:text-[32px] font-bold text-[#17243A] font-mono tracking-tight leading-none">
              {resolvedCount}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
              Evacuated
            </span>
          </div>

          <div className="text-[13px] text-[#5D6F89] flex items-center justify-between">
            <span>Successfully closed</span>
            <span className="font-mono text-[11px] text-[#0B9B73] font-semibold">Verified</span>
          </div>
        </div>

        {/* Card 4: Gateway & Backend Status */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] hover:shadow-[0_4px_12px_rgba(23,36,58,0.06)] transition-all flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#5D6F89]">
              Gateway & Backend
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F3F7FC] border border-[#DCE6F1] flex items-center justify-center text-[#17243A]">
              <Server className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            {health?.status === 'ok' ? (
              <div className="flex items-center gap-2 text-[#0B9B73] font-mono text-[24px] sm:text-[28px] font-bold tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B9B73] animate-pulse" />
                <span>ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#E53945] font-mono text-[24px] sm:text-[28px] font-bold tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53945]" />
                <span>OFFLINE</span>
              </div>
            )}
            <span className="text-[11px] font-mono font-medium text-[#5D6F89] bg-[#F3F7FC] px-1.5 py-0.5 rounded border border-[#DCE6F1]">
              Port 5000
            </span>
          </div>

          <div className="text-[13px] text-[#5D6F89] font-mono truncate flex items-center justify-between">
            <span>Mode: {health?.mode || 'OFFLINE_LOCAL'}</span>
            <span className="text-[#17243A] font-semibold">115200 baud</span>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Panels: Responsive IoT Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start min-w-0">
        {/* Left Panel: Recent Incident Queue */}
        <div className="xl:col-span-8 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:px-5 sm:py-4 border-b border-[#DCE6F1] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-bold text-[#17243A] tracking-tight">
                Recent Incident Queue
              </h2>
              <span className="text-[11px] font-mono font-semibold bg-[#F3F7FC] text-[#5D6F89] px-2 py-0.5 rounded border border-[#DCE6F1]">
                {incidents.length} Records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/rescue/map')}
                className="px-3 py-1.5 text-[13px] font-semibold text-[#1685D1] hover:bg-[#EFF6FF] rounded-lg border border-[#BFDBFE] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-[#1685D1]" />
                <span>Map View</span>
              </button>
              <button
                onClick={() => onNavigate('/rescue/incidents')}
                className="px-3 py-1.5 text-[13px] font-semibold text-[#17243A] hover:bg-[#F3F7FC] bg-white rounded-lg border border-[#DCE6F1] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>All Incidents</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Container with fluid responsive column layout */}
          <div className="overflow-x-auto flex-grow min-w-0">
            {incidents.length === 0 ? (
              <div className="p-12 text-center text-[#5D6F89] text-[14px]">
                No incidents reported yet. Gateway queue is currently clear.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-[13px] sm:text-[14px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#DCE6F1] text-[#5D6F89] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">Incident ID</th>
                    <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Priority</th>
                    <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Category</th>
                    <th className="py-3 px-3 sm:px-4 min-w-[150px]">Location / Landmark</th>
                    <th className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">People</th>
                    <th className="py-3 px-2 sm:px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F1] text-[#17243A]">
                  {incidents.slice(0, 6).map((inc) => {
                    const isCritical = inc.priority_tier === 'CRITICAL' && inc.status !== 'RESOLVED';
                    return (
                      <tr
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`hover:bg-[#F3F7FC]/70 transition-colors cursor-pointer group ${
                          isCritical ? 'bg-[#FDF2F2]/30' : ''
                        }`}
                      >
                        {/* ID and Received Time */}
                        <td className="py-3.5 px-3 sm:px-4 font-mono align-top whitespace-nowrap">
                          <span className={`font-bold text-[13px] block group-hover:text-[#1685D1] transition-colors ${
                            isCritical ? 'text-[#E53945] font-extrabold' : 'text-[#17243A]'
                          }`}>
                            {inc.id}
                          </span>
                          <span className="text-[12px] text-[#5D6F89]">
                            {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>

                        {/* Priority Tier */}
                        <td className="py-3.5 px-2 sm:px-3 align-top whitespace-nowrap">
                          <PriorityBadge priority={inc.priority_tier} />
                        </td>

                        {/* Emergency Category */}
                        <td className="py-3.5 px-2 sm:px-3 font-medium text-[#17243A] text-[13px] align-top capitalize whitespace-nowrap">
                          {inc.category.replace(/_/g, ' ').toLowerCase()}
                        </td>

                        {/* Location: Manual vs GPS */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="flex items-start gap-1.5 text-[#17243A]">
                            <MapPin className="w-4 h-4 text-[#5D6F89] shrink-0 mt-0.5" />
                            <span className="text-[13px] leading-snug break-words">
                              {inc.location_manual || (inc.location_geo ? `Lat ${inc.location_geo.latitude?.toFixed(4)}, Lon ${inc.location_geo.longitude?.toFixed(4)}` : 'Location unspecified')}
                            </span>
                          </div>
                        </td>

                        {/* Headcount */}
                        <td className="py-3.5 px-2 sm:px-3 font-mono font-semibold text-center align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F7FC] border border-[#DCE6F1] text-[#17243A] text-[12px]">
                            <Users className="w-3.5 h-3.5 text-[#5D6F89]" />
                            {inc.headcount}
                          </span>
                        </td>

                        {/* Lifecycle Status */}
                        <td className="py-3.5 px-2 sm:px-3 align-top whitespace-nowrap">
                          <StatusBadge status={inc.status} />
                        </td>

                        {/* Action Button */}
                        <td className="py-3.5 px-3 sm:px-4 text-right align-top whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {inc.location_geo && inc.location_geo.latitude !== null && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sessionStorage.setItem('active_rescue_route_id', inc.id);
                                  onNavigate('/rescue/map');
                                }}
                                className="px-2 py-1 rounded-lg text-[12px] font-semibold text-[#1685D1] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors border border-[#BFDBFE] cursor-pointer shadow-xs flex items-center gap-1"
                                title="View rescue route on live map"
                              >
                                <Route className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Path</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIncident(inc);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[12px] font-semibold text-[#17243A] hover:bg-[#F3F7FC] bg-white transition-colors border border-[#DCE6F1] cursor-pointer shadow-xs"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Panel: IoT Timeline Stream */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] p-5 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE6F1] mb-3.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1685D1]" />
                <h2 className="text-[16px] font-bold text-[#17243A] tracking-tight">
                  Communication Events
                </h2>
              </div>
              <button
                onClick={() => onNavigate('/rescue/communications')}
                className="text-[13px] font-semibold text-[#1685D1] hover:underline cursor-pointer"
              >
                View Log
              </button>
            </div>

            {/* Vertical Timeline Track with naturally wrapped details */}
            {events.length === 0 ? (
              <div className="py-8 text-center text-[#5D6F89] text-[13px] italic">
                No events recorded yet.
              </div>
            ) : (
              <div className="relative pl-3 space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE6F1]">
                {events.slice(0, 6).map((evt) => {
                  const isGateway = evt.event_type === 'GATEWAY_RECEIVED';
                  const isPersistence = evt.event_type === 'PERSISTED_LOCALLY';
                  const isAck = evt.event_type === 'OPERATOR_ACKNOWLEDGED';

                  const dotColor = isGateway
                    ? 'bg-[#1685D1]'
                    : isPersistence
                    ? 'bg-[#0B9B73]'
                    : isAck
                    ? 'bg-[#17243A]'
                    : 'bg-[#D98A00]';

                  return (
                    <div key={evt.id} className="relative pl-6 group">
                      {/* Timeline Node Dot */}
                      <span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${dotColor}`} />

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#17243A] hover:text-[#1685D1] transition-colors">
                          {evt.incident_id}
                        </span>
                        <span className="text-[#5D6F89]">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#5D6F89] font-medium leading-relaxed mt-1 break-words">
                        {evt.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-[#DCE6F1] mt-5 flex items-center justify-between text-[12px] font-mono text-[#5D6F89]">
            <span>Local Persistence</span>
            <span className="text-[#0B9B73] font-semibold flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4" />
              <span>COMMITTED</span>
            </span>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateStatus}
          onNavigate={onNavigate}
        />
      )}
    </motion.div>
  );
};
