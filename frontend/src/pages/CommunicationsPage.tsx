import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCheck,
  Activity,
  SlidersHorizontal,
  FileText,
  Eye
} from 'lucide-react';
import { CommunicationEvent, Incident, AppRoute } from '../types';
import { api } from '../services/api';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface CommunicationsPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const CommunicationsPage: React.FC<CommunicationsPageProps> = ({ onNavigate }) => {
  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [eventsData, incidentsData] = await Promise.all([
        api.getEvents(),
        api.getIncidents().catch(() => []),
      ]);
      setEvents(eventsData);
      setIncidents(incidentsData);
      setLastSyncTime(new Date());

      if (selectedIncident) {
        const fresh = incidentsData.find((i) => i.id === selectedIncident.id);
        if (fresh) setSelectedIncident(fresh);
      }
    } catch (err) {
      console.error('Failed to load communication events:', err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: any, notes?: string) => {
    try {
      await api.updateIncidentStatus(id, status, notes);
      await fetchData();
    } catch (err) {
      console.error('Failed to update status from modal:', err);
    }
  };

  const handleInspectIncident = (incidentId: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (inc) {
      setSelectedIncident(inc);
    } else {
      onNavigate('/rescue/incidents');
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Type filter
      if (selectedType !== 'ALL') {
        if (selectedType === 'GATEWAY' && evt.event_type !== 'GATEWAY_RECEIVED') return false;
        if (selectedType === 'PERSISTENCE' && evt.event_type !== 'PERSISTED_LOCALLY') return false;
        if (selectedType === 'OPERATOR' && evt.event_type !== 'OPERATOR_ACKNOWLEDGED') return false;
        if (selectedType === 'STATUS' && evt.event_type !== 'STATUS_CHANGED') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = evt.incident_id.toLowerCase().includes(q);
        const matchesEvtId = evt.id.toLowerCase().includes(q);
        const matchesDetails = evt.details.toLowerCase().includes(q);
        const matchesType = evt.event_type.toLowerCase().includes(q);
        if (!matchesId && !matchesEvtId && !matchesDetails && !matchesType) return false;
      }

      return true;
    });
  }, [events, selectedType, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Controls & Search Bar */}
      <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-7">
            <Search className="w-4 h-4 text-[#5D6F89] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Incident ID (INC-0001), Event ID, or keywords..."
              className="w-full pl-9 pr-8 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] placeholder:text-[#5D6F89]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5D6F89] hover:text-[#17243A] px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Event Type Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="GATEWAY">Gateway Receipts</option>
              <option value="PERSISTENCE">Local SSD Persisted</option>
              <option value="OPERATOR">Operator Acknowledgements</option>
              <option value="STATUS">Lifecycle Transitions</option>
            </select>
          </div>

          {/* Manual Sync Button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing || loading}
              title={`Last synced: ${lastSyncTime.toLocaleTimeString()}`}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-[#F3F7FC] text-[#17243A] rounded-lg text-[13px] font-semibold border border-[#DCE6F1] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#5D6F89] ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-[13px] text-[#5D6F89] pt-3 mt-3 border-t border-[#DCE6F1]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5D6F89]" />
            <span>
              Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> recorded audit events
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#5D6F89] hidden sm:inline">
            Persisted: backend/data/events.json
          </span>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#DCE6F1] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1685D1]" />
            <h2 className="text-[16px] font-bold text-[#17243A] tracking-tight">
              Chronological Communication & Dispatch Log
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0B9B73] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0]">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Hardware Verified</span>
          </div>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-[#DCE6F1]">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-[#5D6F89]">
              <FileText className="w-8 h-8 text-[#5D6F89] mx-auto mb-2" />
              <p className="font-semibold text-[#17243A]">No communication events found</p>
              <p className="text-[13px] text-[#5D6F89] mt-0.5">
                Adjust search queries or filters to view events.
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isGateway = evt.event_type === 'GATEWAY_RECEIVED';
              const isPersistence = evt.event_type === 'PERSISTED_LOCALLY';
              const isAck = evt.event_type === 'OPERATOR_ACKNOWLEDGED';
              const isStatus = evt.event_type === 'STATUS_CHANGED';

              return (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 hover:bg-[#F3F7FC]/70 transition-colors flex flex-col gap-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Event Type Badge */}
                      {isGateway && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#1685D1] border border-[#BFDBFE]">
                          GATEWAY RECEPTION
                        </span>
                      )}
                      {isPersistence && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                          LOCAL DISK PERSISTED
                        </span>
                      )}
                      {isAck && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F3F7FC] text-[#17243A] border border-[#DCE6F1]">
                          OPERATOR ACKNOWLEDGED
                        </span>
                      )}
                      {isStatus && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF8ED] text-[#D98A00] border border-[#FDE8BF]">
                          STATUS UPDATED
                        </span>
                      )}

                      {/* Event ID */}
                      <span className="font-mono text-[12px] text-[#5D6F89]">
                        {evt.id}
                      </span>

                      {/* Incident Link */}
                      <button
                        onClick={() => handleInspectIncident(evt.incident_id)}
                        className="font-mono text-[13px] font-bold text-[#1685D1] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Inspect Incident Telemetry"
                      >
                        <span>{evt.incident_id}</span>
                        <Eye className="w-3 h-3 text-[#1685D1]" />
                      </button>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#5D6F89]">
                      <Clock className="w-3.5 h-3.5 text-[#5D6F89]" />
                      <span>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="text-[#DCE6F1] hidden sm:inline">•</span>
                      <span className="text-[#5D6F89] hidden sm:inline">{new Date(evt.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Event Details Content */}
                  <p className="text-[14px] text-[#17243A] font-medium leading-relaxed">
                    {evt.details}
                  </p>

                  {/* Technical Payload Meta if present */}
                  {evt.payload && Object.keys(evt.payload).length > 0 && (
                    <div className="mt-1 pt-2 border-t border-[#DCE6F1] flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-mono text-[#5D6F89]">
                      {evt.payload.priority_tier && (
                        <span>Priority: <strong className="text-[#17243A]">{evt.payload.priority_tier}</strong></span>
                      )}
                      {evt.payload.category && (
                        <span>Category: <strong className="text-[#17243A]">{evt.payload.category}</strong></span>
                      )}
                      {evt.payload.new_status && (
                        <span>New Status: <strong className="text-[#17243A]">{evt.payload.new_status}</strong></span>
                      )}
                      {evt.payload.headcount !== undefined && (
                        <span>Headcount: <strong className="text-[#17243A]">{evt.payload.headcount}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Incident Detail Modal if an incident was clicked */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </motion.div>
  );
};
