import React, { useState } from 'react';
import { X, CheckCircle, Navigation, Users, AlertTriangle, Baby, Droplets, Clock, Send, ShieldCheck, MapPin, Route } from 'lucide-react';
import { Incident, IncidentStatus, AppRoute } from '../types';
import { PriorityBadge, StatusBadge, DeliveryStateBadge } from './StatusBadges';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: IncidentStatus, notes?: string) => Promise<void>;
  onNavigate?: (route: AppRoute) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateStatus,
  onNavigate,
}) => {
  const [notes, setNotes] = useState(incident?.operator_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!incident) return null;

  const handleStatusChange = async (nextStatus: IncidentStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(incident.id, nextStatus, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(incident.id, incident.status, notes);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#17243A]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DCE6F1] w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#DCE6F1] flex items-center justify-between bg-[#F8FAFC] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-[18px] font-mono font-bold text-[#17243A]">
              {incident.id}
            </span>
            {!incident.client_incident_id?.startsWith('seed-') ? (
              <span className="text-[10px] font-mono font-black bg-red-600 text-white px-2 py-0.5 rounded border border-red-700 animate-pulse">
                REAL CIVILIAN SOS (LIVE GPS)
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-300">
                SEEDED DEMO INCIDENT
              </span>
            )}
            <PriorityBadge priority={incident.priority_tier} />
            <StatusBadge status={incident.status} />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Triage Alert Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                incident.has_critical_injuries
                  ? 'bg-[#FDF2F2] border-[#FCD8D9] text-[#E53945] font-semibold'
                  : 'bg-[#F3F7FC] border-[#DCE6F1] text-[#5D6F89]'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${incident.has_critical_injuries ? 'text-[#E53945]' : 'text-[#5D6F89]'}`} />
              <span className="text-[12px]">
                {incident.has_critical_injuries ? 'Critical Injuries' : 'No Critical Injuries'}
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                incident.has_infants_or_elderly
                  ? 'bg-[#FEF8ED] border-[#FDE8BF] text-[#D98A00] font-semibold'
                  : 'bg-[#F3F7FC] border-[#DCE6F1] text-[#5D6F89]'
              }`}
            >
              <Baby className={`w-4 h-4 ${incident.has_infants_or_elderly ? 'text-[#D98A00]' : 'text-[#5D6F89]'}`} />
              <span className="text-[12px]">
                {incident.has_infants_or_elderly ? 'Vulnerable Present' : 'Standard Demographic'}
              </span>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center gap-2.5 ${
                incident.water_level_rising
                  ? 'bg-[#FDF2F2] border-[#FCD8D9] text-[#E53945] font-semibold'
                  : 'bg-[#F3F7FC] border-[#DCE6F1] text-[#5D6F89]'
              }`}
            >
              <Droplets className={`w-4 h-4 ${incident.water_level_rising ? 'text-[#E53945]' : 'text-[#5D6F89]'}`} />
              <span className="text-[12px]">
                {incident.water_level_rising ? 'Water Rising' : 'Water Level Stable'}
              </span>
            </div>
          </div>

          {/* Description & Sender */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#DCE6F1]">
            <h4 className="text-[12px] font-bold text-[#5D6F89] uppercase tracking-wider mb-2">
              Distress Report Message
            </h4>
            <p className="text-[14px] text-[#17243A] leading-relaxed font-medium">
              {incident.description || 'No additional narrative description provided.'}
            </p>

            <div className="mt-4 pt-3 border-t border-[#DCE6F1] flex flex-wrap items-center justify-between text-[13px] text-[#5D6F89] gap-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5D6F89]" />
                <span>Sender: <strong className="text-[#17243A]">{incident.sender_name || 'Anonymous'}</strong></span>
                {incident.sender_phone && <span className="text-[#5D6F89]">({incident.sender_phone})</span>}
              </div>
              <div className="font-semibold text-[#17243A]">
                Headcount: {incident.headcount} {incident.headcount === 1 ? 'person' : 'people'}
              </div>
            </div>
          </div>

          {/* Location Details (GPS vs Manual Landmark) */}
          <div className="bg-white rounded-xl p-4 border border-[#DCE6F1] space-y-3">
            <h4 className="text-[12px] font-bold text-[#5D6F89] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1685D1]" />
              Location Information
            </h4>

            {incident.location_manual && (
              <div className="text-[14px] text-[#17243A]">
                <span className="text-[12px] text-[#5D6F89] block mb-0.5">Reported Landmark / Instructions:</span>
                <p className="font-semibold bg-[#EFF6FF] p-2.5 rounded-lg border border-[#BFDBFE] text-[#17243A]">
                  {incident.location_manual}
                </p>
              </div>
            )}

            {incident.location_geo && incident.location_geo.latitude !== null ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-[13px] font-mono bg-[#F3F7FC] p-2.5 rounded-lg border border-[#DCE6F1] text-[#17243A]">
                  <Navigation className="w-4 h-4 text-[#1685D1] shrink-0" />
                  <span>Lat: {incident.location_geo.latitude.toFixed(6)}</span>
                  <span>Lon: {incident.location_geo.longitude?.toFixed(6)}</span>
                  {incident.location_geo.accuracy_meters && (
                    <span className="text-[#5D6F89]">±{incident.location_geo.accuracy_meters}m</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    sessionStorage.setItem('active_rescue_route_id', incident.id);
                    onClose();
                    if (onNavigate) {
                      onNavigate('/rescue/map');
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#1685D1] hover:bg-[#1270B0] text-white font-semibold text-[13px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Route className="w-4 h-4" />
                  <span>View Rescue Path on Live Map</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#FEF8ED] border border-[#FDE8BF] text-[13px] text-[#D98A00] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D98A00]" />
                <span>No GPS fix provided — landmark-only report. Road routing requires geographic coordinates.</span>
              </div>
            )}
          </div>

          {/* Telemetry and Delivery Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE6F1]">
              <span className="text-[#5D6F89] block mb-1 text-[12px]">Truthful Delivery State</span>
              <DeliveryStateBadge state={incident.delivery_state} />
              <span className="text-[11px] text-[#5D6F89] block mt-1 font-mono">
                Client ID: {incident.client_incident_id.slice(0, 18)}...
              </span>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE6F1]">
              <span className="text-[#5D6F89] block mb-1 text-[12px]">Timestamps</span>
              <div className="flex items-center gap-1.5 text-[#17243A] font-mono text-[12px]">
                <Clock className="w-3.5 h-3.5 text-[#5D6F89]" />
                <span>Received: {new Date(incident.created_at).toLocaleTimeString()}</span>
              </div>
              <span className="text-[11px] text-[#5D6F89] block mt-1 font-mono">
                Updated: {new Date(incident.updated_at).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Operator Internal Notes */}
          <div className="space-y-2">
            <label htmlFor="op-notes" className="text-[12px] font-bold text-[#17243A] uppercase tracking-wider block">
              Rescue Operator Log & Dispatch Notes
            </label>
            <textarea
              id="op-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Assigned Rescue Boat Unit Charlie; evacuation in progress..."
              rows={2}
              className="w-full text-[14px] p-3 rounded-lg border border-[#DCE6F1] focus:outline-none focus:border-[#1685D1] bg-white text-[#17243A]"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isUpdating}
                className="px-3.5 py-1.5 rounded-lg bg-[#17243A] hover:bg-[#20314A] text-white text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Lifecycle State Action Buttons */}
        <div className="p-5 sm:p-6 border-t border-[#DCE6F1] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] text-[#5D6F89] font-medium">
            Current Stage: <strong className="text-[#17243A]">{incident.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            {incident.status === 'NEW' && (
              <button
                onClick={() => handleStatusChange('ACKNOWLEDGED')}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg bg-[#D98A00] hover:bg-[#B87500] text-white font-semibold text-[13px] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Acknowledge</span>
              </button>
            )}

            {incident.status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('RESPONDING')}
                disabled={isUpdating || incident.status === 'RESPONDING'}
                className="px-4 py-2 rounded-lg bg-[#1685D1] hover:bg-[#1270B0] text-white font-semibold text-[13px] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch / Responding</span>
              </button>
            )}

            {incident.status !== 'RESOLVED' ? (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg bg-[#0B9B73] hover:bg-[#09805F] text-white font-semibold text-[13px] transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('RESPONDING')}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg bg-[#17243A] hover:bg-[#20314A] text-white font-semibold text-[13px] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                Reopen Incident
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
