import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCheck,
  Eye,
  SlidersHorizontal,
  Route,
} from 'lucide-react';
import {
  Incident,
  IncidentStatus,
  AppRoute,
} from '../types';
import { api } from '../services/api';
import {
  IncidentStatusBadge,
  DeliveryBadge,
} from '../components/StatusBadges';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface IncidentsPageProps {
  onNavigate?: (route: AppRoute) => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ onNavigate }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filters, Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');

  // Load Data
  const fetchData = async () => {
    try {
      const incidentsData = await api.getIncidents();
      setIncidents(incidentsData);

      // If an incident was selected, keep it updated with fresh backend state
      if (selectedIncident) {
        const updated = incidentsData.find((i) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Failed to load incident management data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selectedIncident?.id]);

  // Handle Lifecycle Status Updates
  const handleUpdateStatus = async (
    incidentId: string,
    newStatus: IncidentStatus,
    notes?: string
  ) => {
    setUpdatingId(incidentId);
    try {
      const updated = await api.updateIncidentStatus(incidentId, newStatus, notes);
      setIncidents((prev) =>
        prev.map((item) => (item.id === incidentId ? updated : item))
      );
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(updated);
      }
    } catch (err) {
      console.error('Failed to update incident status:', err);
      alert('Failed to update incident status. Verify local backend connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered and Sorted incidents
  const filteredIncidents = useMemo(() => {
    const list = incidents.filter((incident) => {
      // Search matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = incident.id.toLowerCase().includes(query);
        const matchesSender = (incident.sender_name || '').toLowerCase().includes(query);
        const matchesDesc = (incident.description || '').toLowerCase().includes(query);
        const matchesLandmark = (incident.location_manual || '').toLowerCase().includes(query);
        const matchesCat = incident.category.toLowerCase().includes(query);
        if (!matchesId && !matchesSender && !matchesDesc && !matchesLandmark && !matchesCat) {
          return false;
        }
      }

      // Status matching
      if (selectedStatus !== 'ALL') {
        if (incident.status !== selectedStatus) return false;
      }

      // Priority matching
      if (selectedPriority !== 'ALL') {
        if (incident.priority_tier !== selectedPriority) return false;
      }

      // Category matching
      if (selectedCategory !== 'ALL') {
        if (incident.category !== selectedCategory) return false;
      }

      return true;
    });

    const priorityRank: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return list.sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'PRIORITY') {
        const diff = (priorityRank[b.priority_tier] || 0) - (priorityRank[a.priority_tier] || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });
  }, [incidents, searchQuery, selectedStatus, selectedPriority, selectedCategory, sortBy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Search and Filters Bar */}
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search input */}
            <div className="relative md:col-span-4">
              <Search className="w-4 h-4 text-[#5D6F89] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, sender, details, landmark..."
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

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] cursor-pointer"
              >
                <option value="ALL">Status: All</option>
                <option value="NEW">Submitted (New)</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESPONDING">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] cursor-pointer"
              >
                <option value="ALL">Priority: All</option>
                <option value="CRITICAL">Critical (P1)</option>
                <option value="HIGH">High (P2)</option>
                <option value="MEDIUM">Medium (P3)</option>
                <option value="LOW">Low (P4)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] cursor-pointer"
              >
                <option value="ALL">Category: All</option>
                <option value="MEDICAL_EMERGENCY">Medical</option>
                <option value="TRAPPED_FLOOD">Flood</option>
                <option value="COLLAPSE_HAZARD">Collapse</option>
                <option value="SUPPLIES_WATER">Supplies</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-[14px] bg-[#F3F7FC] border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] cursor-pointer"
              >
                <option value="NEWEST">Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="PRIORITY">Sort: Priority</option>
              </select>
            </div>
          </div>

          {/* Filter summary bar if active */}
          {(searchQuery || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedCategory !== 'ALL') && (
            <div className="flex items-center justify-between text-[13px] text-[#5D6F89] pt-3 mt-3 border-t border-[#DCE6F1]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#5D6F89]" />
                <span>
                  Showing <strong>{filteredIncidents.length}</strong> of <strong>{incidents.length}</strong> records
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                  setSelectedPriority('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-[#1685D1] hover:underline font-semibold cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Incidents Table - Fluid responsive column sizing with natural text wrapping */}
        <div className="bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden min-w-0">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse text-[13px] sm:text-[14px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#DCE6F1] text-[12px] font-semibold uppercase tracking-wider text-[#5D6F89]">
                  <th className="py-3.5 px-3 sm:px-4 whitespace-nowrap min-w-[140px]">Incident ID & Time</th>
                  <th className="py-3.5 px-3 sm:px-4 min-w-[180px]">Reported Location</th>
                  <th className="py-3.5 px-3 sm:px-4 min-w-[200px]">People & Situation</th>
                  <th className="py-3.5 px-3 sm:px-4 min-w-[170px]">Lifecycle Status</th>
                  <th className="py-3.5 px-3 sm:px-4 min-w-[140px] whitespace-nowrap">Delivery State</th>
                  <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap min-w-[110px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F1]">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#5D6F89]">
                      <AlertTriangle className="w-8 h-8 text-[#D98A00] mx-auto mb-2" />
                      <p className="font-semibold text-[#17243A]">No matching incidents found</p>
                      <p className="text-[13px] text-[#5D6F89] mt-0.5">
                        Adjust your search terms or filters to view records.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => {
                    const isBusy = updatingId === incident.id;
                    const isCritical = incident.priority_tier === 'CRITICAL' && incident.status !== 'RESOLVED';

                    return (
                      <tr
                        key={incident.id}
                        className={`hover:bg-[#F3F7FC]/70 transition-colors ${
                          isCritical ? 'bg-[#FDF2F2]/30' : ''
                        }`}
                      >
                        {/* ID & Time with Type Tag */}
                        <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                          <span className="font-bold text-[#17243A] block font-mono text-[13px]">
                            {incident.id}
                          </span>
                          <span className="inline-block text-[11px] font-semibold text-[#5D6F89] bg-[#F3F7FC] px-1.5 py-0.5 rounded border border-[#DCE6F1] capitalize mt-1">
                            {incident.category.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#5D6F89] mt-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#5D6F89] shrink-0" />
                            <span>{new Date(incident.created_at || (incident as any).received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 text-[#5D6F89] shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-semibold text-[#17243A] block break-words leading-snug">
                                {incident.location_manual || 'Location unspecified'}
                              </span>
                              {incident.location_geo && incident.location_geo.latitude !== null && incident.location_geo.longitude !== null ? (
                                <span className="inline-block text-[11px] font-mono text-[#0B9B73] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0] mt-1">
                                  GPS: {incident.location_geo.latitude.toFixed(4)}, {incident.location_geo.longitude.toFixed(4)}
                                </span>
                              ) : (
                                <span className="inline-block text-[11px] font-mono text-[#5D6F89] bg-[#F3F7FC] px-1.5 py-0.5 rounded border border-[#DCE6F1] mt-1">
                                  GPS: Landmark only
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* People & Situation */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#17243A] bg-[#F3F7FC] border border-[#DCE6F1] px-2 py-0.5 rounded text-[12px]">
                              <Users className="w-3.5 h-3.5 text-[#5D6F89]" />
                              <span>{incident.headcount}</span>
                            </span>
                            <span className="text-[#17243A] font-semibold text-[13px] truncate">
                              {incident.sender_name || 'Anonymous'}
                            </span>
                          </div>
                          <p className="text-[#5D6F89] text-[13px] leading-snug break-words">
                            {incident.description || 'No additional narrative provided.'}
                          </p>
                        </td>

                        {/* Lifecycle Status - Text wraps cleanly without colliding with Delivery State */}
                        <td className="py-3.5 px-3 sm:px-4 align-top min-w-[170px]">
                          <div>
                            <IncidentStatusBadge status={incident.status} />
                          </div>
                          {incident.operator_notes && (
                            <p className="text-[11px] text-[#5D6F89] italic mt-1.5 leading-snug whitespace-normal break-words max-w-[210px]">
                              "{incident.operator_notes}"
                            </p>
                          )}
                        </td>

                        {/* Delivery State - Isolated and consistently styled */}
                        <td className="py-3.5 px-3 sm:px-4 align-top min-w-[140px] whitespace-nowrap">
                          <DeliveryBadge state={incident.delivery_state} />
                          <span className="block text-[11px] text-[#5D6F89] mt-1 font-mono">
                            Local NVMe
                          </span>
                        </td>

                        {/* Operational Actions */}
                        <td className="py-3.5 px-3 sm:px-4 text-right align-top whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Rescue Path button if GPS present */}
                            {incident.location_geo && incident.location_geo.latitude !== null && onNavigate && (
                              <button
                                onClick={() => {
                                  sessionStorage.setItem('active_rescue_route_id', incident.id);
                                  onNavigate('/rescue/map');
                                }}
                                className="px-2 py-1 rounded-lg border border-[#BFDBFE] text-[#1685D1] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Calculate and view rescue route on map"
                              >
                                <Route className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Route</span>
                              </button>
                            )}

                            {/* Inspect button */}
                            <button
                              onClick={() => setSelectedIncident(incident)}
                              className="p-1.5 rounded-lg border border-[#DCE6F1] text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                              title="Review Telemetry and Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Lifecycle buttons */}
                            {incident.status === 'NEW' && (
                              <button
                                onClick={() => handleUpdateStatus(incident.id, 'ACKNOWLEDGED')}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-lg bg-[#1685D1] text-white font-semibold text-[12px] hover:bg-[#1270B0] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title="Acknowledge incoming report"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Ack</span>
                              </button>
                            )}

                            {incident.status === 'ACKNOWLEDGED' && (
                              <button
                                onClick={() => handleUpdateStatus(incident.id, 'RESPONDING')}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-lg bg-[#17243A] text-white font-semibold text-[12px] hover:bg-[#20314A] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title="Dispatch rescue units and mark In Progress"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Dispatch</span>
                              </button>
                            )}

                            {incident.status === 'RESPONDING' && (
                              <button
                                onClick={() => handleUpdateStatus(incident.id, 'RESOLVED')}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded-lg bg-[#0B9B73] text-white font-semibold text-[12px] hover:bg-[#09805F] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title="Mark incident as resolved"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            )}

                            {incident.status === 'RESOLVED' && (
                              <button
                                onClick={() => handleUpdateStatus(incident.id, 'RESPONDING')}
                                disabled={isBusy}
                                className="px-2 py-1 rounded-lg border border-[#DCE6F1] text-[#5D6F89] hover:bg-[#F3F7FC] hover:text-[#17243A] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                title="Reopen incident"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reopen</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Incident Telemetry & Detail Modal */}
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
