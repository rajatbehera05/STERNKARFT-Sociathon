import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Package,
  Phone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ReliefRequest,
  UrgencyLevel,
  VerificationStatus,
} from '../../types/relief';

interface RequestDetailModalProps {
  request: ReliefRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateVerification: (
    requestId: string,
    status: VerificationStatus,
    reason?: string
  ) => void;
  onUpdateUrgency: (
    requestId: string,
    urgency: UrgencyLevel,
    reason: string
  ) => void;
  onOpenMatching?: (request: ReliefRequest) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateVerification,
  onUpdateUrgency,
  onOpenMatching,
}) => {
  if (!isOpen || !request) return null;

  // Local state for reason inputs
  const [operatorReason, setOperatorReason] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(request.urgency);
  const [showUrgencyForm, setShowUrgencyForm] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const totalRequested = request.items.reduce((acc, i) => acc + i.requestedQty, 0);
  const totalFulfilled = request.items.reduce((acc, i) => acc + i.fulfilledQty, 0);
  const totalAllocated = request.items.reduce((acc, i) => acc + i.allocatedQty, 0);
  const totalRemaining = request.items.reduce(
    (acc, i) => acc + Math.max(0, i.requestedQty - i.fulfilledQty),
    0
  );

  const handleVerify = () => {
    const reason = operatorReason.trim() || 'Verified via field verification protocol.';
    onUpdateVerification(request.id, 'VERIFIED', reason);
    setActionNotice('Request verified successfully.');
    setOperatorReason('');
  };

  const handleReject = () => {
    if (!operatorReason.trim()) {
      alert('Please provide a reason for rejecting this request.');
      return;
    }
    onUpdateVerification(request.id, 'REJECTED', operatorReason.trim());
    setActionNotice('Request rejected.');
    setOperatorReason('');
  };

  const handleClarify = () => {
    const reason = operatorReason.trim() || 'Additional location or contact clarification required.';
    onUpdateVerification(request.id, 'CLARIFICATION_NEEDED', reason);
    setActionNotice('Marked for clarification.');
    setOperatorReason('');
  };

  const handleSaveUrgency = () => {
    if (!operatorReason.trim()) {
      alert('Please record an operator reason for modifying the urgency tier.');
      return;
    }
    onUpdateUrgency(request.id, selectedUrgency, operatorReason.trim());
    setActionNotice(`Urgency updated to ${selectedUrgency}.`);
    setShowUrgencyForm(false);
    setOperatorReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-wide text-white">
                  {request.id}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    request.urgency === 'IMMEDIATE'
                      ? 'bg-red-600 text-white'
                      : request.urgency === 'URGENT'
                      ? 'bg-amber-600 text-white'
                      : request.urgency === 'ELEVATED'
                      ? 'bg-sky-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {request.urgency}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    request.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : request.verificationStatus === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : request.verificationStatus === 'CLARIFICATION_NEEDED'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {request.verificationStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reported {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Nagpur Response Grid
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {actionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
              <span>{actionNotice}</span>
              <button
                onClick={() => setActionNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Unverified Warning Banner if Pending */}
          {request.verificationStatus === 'PENDING' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold">
                  Awaiting Operator Verification
                </strong>
                This report is currently unverified. Review contact, situation, and location before allocating emergency municipal inventory.
              </div>
            </div>
          )}

          {/* Out of bounds banner if applicable */}
          {!request.location.isWithinNagpurBounds && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-red-950 font-bold">
                  Geographic Location Outside Nagpur Service Area
                </strong>
                Coordinates ({request.location.latitude.toFixed(4)}°N, {request.location.longitude.toFixed(4)}°E) fall outside the standard Nagpur municipal bounds. Verify jurisdiction.
              </div>
            </div>
          )}

          {/* Grid: Requester & Location Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Requester Information */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Requester Details
              </div>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-900">
                  {request.requesterName || 'Anonymous Citizen / Caller'}
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium">
                    {request.requesterType.replace('_', ' ')}
                  </span>
                  {request.organization && (
                    <span className="truncate text-slate-700" title={request.organization}>
                      • {request.organization}
                    </span>
                  )}
                </div>
                {request.contactNumber && (
                  <div className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{request.contactNumber}</span>
                  </div>
                )}
                <div className="text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>
                    <strong>{request.peopleAffected}</strong> people affected
                  </span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Nagpur Geographic Location
              </div>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{request.location.locality}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  {request.location.addressOrLandmark}
                </div>
                <div className="font-mono text-[10.5px] text-slate-500 bg-white p-1 rounded border border-slate-200 mt-1">
                  GPS: {request.location.latitude.toFixed(5)}°N, {request.location.longitude.toFixed(5)}°E
                </div>
              </div>
            </div>
          </div>

          {/* Situation Description & Health Threat */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Reported Circumstances & Safety
              </span>
              {request.hasImmediateHealthThreat && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  Immediate Health Threat Flagged
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {request.situationDescription}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center gap-1">
              <strong>Urgency Rationale:</strong>
              <span>{request.urgencyReason}</span>
            </div>
          </div>

          {/* Requested Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Requested Supplies ({request.items.length} items)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {totalFulfilled} fulfilled / {totalAllocated} allocated / {totalRemaining} of {totalRequested} remaining unmet
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Item / Category</th>
                    <th className="py-2 px-2 text-center">Requested</th>
                    <th className="py-2 px-2 text-center">Fulfilled</th>
                    <th className="py-2 px-2 text-center">Remaining</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {request.items.map((item) => {
                    const remaining = Math.max(0, item.requestedQty - item.fulfilledQty);
                    const isFullyFulfilled = remaining === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.category.replace('_', ' ')}
                            {item.notes && ` • ${item.notes}`}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-medium">
                          {item.requestedQty} {item.unit}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-emerald-700 font-medium">
                          {item.fulfilledQty}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-red-600">
                          {remaining}
                        </td>
                        <td className="py-2 px-3">
                          {isFullyFulfilled ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Delivered
                            </span>
                          ) : item.allocatedQty > 0 ? (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              In Progress
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Unmet Need
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Operator Triage & Lifecycle Controls */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operator Triage Actions
              </span>
              <button
                type="button"
                onClick={() => setShowUrgencyForm(!showUrgencyForm)}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                {showUrgencyForm ? 'Cancel Urgency Edit' : 'Adjust Urgency Tier'}
              </button>
            </div>

            {/* Urgency adjustment form */}
            {showUrgencyForm && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      New Urgency Level
                    </label>
                    <select
                      value={selectedUrgency}
                      onChange={(e) => setSelectedUrgency(e.target.value as UrgencyLevel)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 font-semibold"
                    >
                      <option value="IMMEDIATE">IMMEDIATE (Threat to Life)</option>
                      <option value="URGENT">URGENT (Essential Need Soon)</option>
                      <option value="ELEVATED">ELEVATED (Timely Fulfilment)</option>
                      <option value="ROUTINE">ROUTINE (Standard Queue)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Operator Reason *
                    </label>
                    <input
                      type="text"
                      value={operatorReason}
                      onChange={(e) => setOperatorReason(e.target.value)}
                      placeholder="e.g., Hospital triage verified severe trauma"
                      className="w-full text-xs rounded-lg border border-slate-300 p-2"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveUrgency}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Save Urgency Adjustment
                </button>
              </div>
            )}

            {/* Operator Notes & Reason Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Operator Verification Notes / Rejection Reason
              </label>
              <input
                type="text"
                value={operatorReason}
                onChange={(e) => setOperatorReason(e.target.value)}
                placeholder="Record physical verification findings, callback confirmation, or reason..."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {request.verificationStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={handleVerify}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Request</span>
                </button>
              )}

              {request.verificationStatus !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Request</span>
                </button>
              )}

              {request.verificationStatus !== 'CLARIFICATION_NEEDED' && (
                <button
                  type="button"
                  onClick={handleClarify}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Request Clarification</span>
                </button>
              )}

              {/* Direct matching button if verified */}
              {request.verificationStatus === 'VERIFIED' && onOpenMatching && totalRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMatching(request);
                    onClose();
                  }}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Match Inventory Resources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Demonstration record • Nagpur Disaster Response System
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};
