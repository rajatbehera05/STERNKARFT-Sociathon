import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertCircle,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { AppRoute } from '../types';
import { reliefApi, PublicTrackResult } from '../services/reliefApi';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface TrackReliefPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const TrackReliefPage: React.FC<TrackReliefPageProps> = ({ onNavigate }) => {
  const [requestId, setRequestId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<PublicTrackResult | null>(null);

  // Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam) {
      setRequestId(idParam);
      performSearch(idParam);
    }
  }, []);

  const performSearch = async (idToSearch: string, phoneToSearch?: string) => {
    if (!idToSearch.trim()) {
      setError('Please enter a valid Relief Request ID (e.g. REL-2026-0001).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackResult(null);

    try {
      const result = await reliefApi.trackPublicRequest(
        idToSearch.trim(),
        phoneToSearch?.trim() || undefined
      );
      setTrackResult(result);
    } catch (err: any) {
      setError(
        err?.message || 'Request not found. Please verify the ID or check if it was recently submitted.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(requestId, phone);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f4f9fd] via-[#eef6fc] to-[#f8fafc] text-slate-800 flex flex-col justify-between">
      <Navbar currentRoute="/track-relief" onNavigate={onNavigate} />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase mb-2">
            <Search className="w-3.5 h-3.5" />
            Public Relief Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Track Emergency Relief Status
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Check live verification, inventory allocation, and dispatch progress for your emergency
            relief request in Nagpur.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Request Tracking ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={requestId}
                    onChange={(e) => setRequestId(e.target.value.toUpperCase())}
                    placeholder="e.g. REL-2026-0001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone (Optional Verification)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98230 XXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Tracking IDs are provided on the confirmation screen when submitting a request.
              </span>
              <button
                type="submit"
                disabled={isLoading}
                className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Look Up Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-700 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* RESULTS CARD */}
        {trackResult && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden space-y-6 p-6 sm:p-8 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Request Reference
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
                  {trackResult.id}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Logged: {new Date(trackResult.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Area: {trackResult.locality}</span>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                    trackResult.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : trackResult.verificationStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      trackResult.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span>{trackResult.verificationStatus.replace(/_/g, ' ')}</span>
                </span>

                <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-100 text-red-800 border border-red-200">
                  {trackResult.urgency}
                </span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Coordination Lifecycle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div
                  className={`p-3 rounded-xl border text-center ${
                    trackResult.verificationStatus !== 'REJECTED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">1. Logged</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Intake Received</div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-center ${
                    trackResult.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : trackResult.verificationStatus === 'PENDING'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">2. Verification</div>
                  <div className="text-[10px] mt-0.5">
                    {trackResult.verificationStatus === 'VERIFIED'
                      ? 'Verified by Operator'
                      : 'Pending Triage'}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-center ${
                    trackResult.deliveries && trackResult.deliveries.length > 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">3. Allocation</div>
                  <div className="text-[10px] mt-0.5">
                    {trackResult.deliveries && trackResult.deliveries.length > 0
                      ? 'Stock Reserved'
                      : 'Awaiting Match'}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-xl border text-center ${
                    trackResult.deliveries &&
                    trackResult.deliveries.some((d) => d.deliveryStatus === 'DELIVERED')
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : trackResult.deliveries &&
                        trackResult.deliveries.some((d) => d.deliveryStatus === 'IN_TRANSIT')
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold">4. Delivery</div>
                  <div className="text-[10px] mt-0.5">
                    {trackResult.deliveries &&
                    trackResult.deliveries.some((d) => d.deliveryStatus === 'DELIVERED')
                      ? 'Delivered'
                      : trackResult.deliveries &&
                        trackResult.deliveries.some((d) => d.deliveryStatus === 'IN_TRANSIT')
                      ? 'En Route'
                      : 'Pending Dispatch'}
                  </div>
                </div>
              </div>
            </div>

            {/* Requested Items & Fulfillment */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Requested Supplies Status
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Requested</th>
                      <th className="py-2.5 px-3">Fulfilled</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trackResult.items.map((item, idx) => {
                      const isComplete = item.fulfilledQty >= item.requestedQty;
                      const isPartial = item.fulfilledQty > 0 && !isComplete;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {item.requestedQty} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.fulfilledQty} {item.unit}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isPartial
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isComplete
                                ? 'FULFILLED'
                                : isPartial
                                ? 'PARTIAL'
                                : 'QUEUED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deliveries Assigned */}
            {trackResult.deliveries && trackResult.deliveries.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Dispatched Consignments</span>
                </h3>
                <div className="space-y-2">
                  {trackResult.deliveries.map((del, dIdx) => (
                    <div
                      key={dIdx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{del.resourceName}</div>
                        <div className="text-slate-500 text-[11px]">
                          Quantity: {del.quantity} {del.unit} • Assigned:{' '}
                          {new Date(del.assignedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          del.deliveryStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800 animate-pulse'
                        }`}
                      >
                        {del.deliveryStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
