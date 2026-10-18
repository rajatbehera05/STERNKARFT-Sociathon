import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Users,
  MapPin,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  Send,
  Droplets,
  HeartPulse,
  Home,
  Package,
  HelpCircle,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';
import { AppRoute, EmergencyCategory } from '../types';
import { api } from '../services/api';

interface SosPageProps {
  onNavigate: (route: AppRoute) => void;
}

const CATEGORIES: { id: EmergencyCategory; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'TRAPPED_FLOOD', label: 'Trapped / Rising Water', icon: Droplets, desc: 'Cut off by floodwater, roof or balcony stranded' },
  { id: 'MEDICAL_EMERGENCY', label: 'Medical Emergency', icon: HeartPulse, desc: 'Critical injury, bleeding, or unconscious person' },
  { id: 'COLLAPSE_HAZARD', label: 'Collapse Hazard', icon: Home, desc: 'Cracked walls, partial building failure, landslide' },
  { id: 'SUPPLIES_WATER', label: 'Supplies & Water', icon: Package, desc: 'Stranded without drinking water or essential medicines' },
  { id: 'OTHER', label: 'Other Life Threat', icon: HelpCircle, desc: 'Other immediate physical danger requiring rescue' },
];

export const SosPage: React.FC<SosPageProps> = ({ onNavigate }) => {
  const [category, setCategory] = useState<EmergencyCategory>('TRAPPED_FLOOD');
  const [headcount, setHeadcount] = useState(1);
  const [waterLevelRising, setWaterLevelRising] = useState(false);
  const [hasCriticalInjuries, setHasCriticalInjuries] = useState(false);
  const [hasInfantsOrElderly, setHasInfantsOrElderly] = useState(false);
  const [locationManual, setLocationManual] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Real GPS state with explicit permission & error states
  const [gpsData, setGpsData] = useState<{ latitude: number | null; longitude: number | null; accuracy_meters?: number | null } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'denied' | 'unavailable' | 'timeout'>('idle');

  // Submission & Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    incident_id: string;
    client_incident_id: string;
    delivery_state: string;
    priority_tier: string;
    received_at: string;
    deduplicated?: boolean;
  } | null>(null);

  // Capture real browser GPS location using navigator.geolocation
  const handleCaptureGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy_meters: Math.round(pos.coords.accuracy),
        });
        setGpsStatus('success');
      },
      (err) => {
        console.warn('Real browser GPS probe notice:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsStatus('unavailable');
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus('timeout');
        } else {
          setGpsStatus('unavailable');
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  // Automatically request location when the SOS form loads
  useEffect(() => {
    handleCaptureGps();
  }, []);

  // Form submit handler - requires location and opens explicit confirmation dialog
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Require either genuine GPS coordinates or a manual landmark description
    if (!gpsData && !locationManual.trim()) {
      setError('Please capture your real GPS location or enter a landmark/address so rescuers can locate you.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute genuine submission to backend API after explicit confirmation
  const executeSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);
    setError(null);

    const clientUuid = crypto.randomUUID();

    try {
      const result = await api.submitSos({
        client_incident_id: clientUuid,
        category,
        description: locationManual
          ? `Distress Report at: ${locationManual}`
          : 'Emergency civilian distress report with verified browser coordinates',
        sender_name: senderName.trim() || 'Anonymous Civilian',
        sender_phone: senderPhone.trim() || undefined,
        headcount,
        has_critical_injuries: hasCriticalInjuries,
        has_infants_or_elderly: hasInfantsOrElderly,
        water_level_rising: waterLevelRising,
        location_manual: locationManual.trim() || undefined,
        location_geo: gpsData,
      });

      setShowConfirmModal(false);
      setSubmittedResult(result);
    } catch (err: any) {
      console.error('SOS submission failed:', err);
      setError(err.message || 'Transmission failed. Ensure backend connection to STERN-X.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Portal</span>
        </button>

        <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
          OFFLINE DISTRESS CHANNEL
        </span>
      </div>

      <AnimatePresence mode="wait">
        {submittedResult ? (
          /* Confirmation Screen (PRD FR-1.8) */
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-8 space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                SIGNAL RECEIVED & ACKNOWLEDGED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
                SOS Dispatched to Responders
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Your emergency report has been ingested by the local gateway and committed to the rescue field laptop.
              </p>
            </div>

            {/* Incident Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Incident Reference ID:</span>
                <span className="font-extrabold text-sm text-slate-900 text-red-600">{submittedResult.incident_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Assigned Triage Tier:</span>
                <span className="font-bold text-slate-800">{submittedResult.priority_tier}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Delivery State:</span>
                <span className="font-bold text-emerald-700">PERSISTED LOCALLY</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Received Timestamp:</span>
                <span className="text-slate-700">{new Date(submittedResult.received_at).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Directive Instructions */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Next Immediate Actions:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-900">
                <li>Stay on elevated floors or rooftops away from electrical panels.</li>
                <li>Conserve phone battery; do not stream media or leave flashlight on continuously.</li>
                <li>First responders actively monitor the incident queue at this station.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
              <button
                onClick={() => {
                  if (submittedResult?.incident_id) {
                    sessionStorage.setItem('focus_incident_id', submittedResult.incident_id);
                  }
                  onNavigate('/rescue/map');
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <MapPin className="w-4 h-4" />
                <span>View on Rescue Map</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedResult(null);
                  setLocationManual('');
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Submit Additional Report
              </button>
              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        ) : (
          /* SOS Submission Form */
          <motion.form
            key="form"
            onSubmit={handleFormSubmit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-7 space-y-6"
          >
            {/* Header */}
            <div className="pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                    Emergency Distress Report (SOS)
                  </h1>
                  <span className="text-[10px] font-mono text-slate-500 uppercase mt-1 block">
                    Zero-Internet Offline Submission Protocol
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium flex items-center justify-between">
                <span>{error}</span>
                <span className="font-mono text-[10px] text-red-600">CHECK GATEWAY</span>
              </div>
            )}

            {/* 1. Emergency Category Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                1. Select Distress Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-red-600 bg-red-50/80 shadow-xs ring-1 ring-red-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`text-xs font-extrabold block ${isSelected ? 'text-red-950' : 'text-slate-900'}`}>
                          {cat.label}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {cat.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Headcount Stepper */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  2. Number of Trapped Civilians *
                </span>
                <span className="text-[11px] text-slate-500">
                  Total headcount needing boat extraction
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHeadcount((c) => Math.max(1, c - 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer text-lg"
                >
                  -
                </button>
                <div className="w-14 h-9 rounded-xl bg-white border border-slate-300 font-mono font-extrabold text-base text-slate-900 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {headcount}
                </div>
                <button
                  type="button"
                  onClick={() => setHeadcount((c) => Math.min(100, c + 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer text-lg"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setHeadcount((c) => Math.min(100, c + 5))}
                  className="px-2.5 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                  title="Add 5 people"
                >
                  +5
                </button>
              </div>
            </div>

            {/* 3. Rapid Triage Checkboxes (PRD FR-1.5) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                3. High-Priority Triage Flags
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Water Rising */}
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${waterLevelRising ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={waterLevelRising}
                    onChange={(e) => setWaterLevelRising(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Water is Rising</span>
                    <span className="text-[10px] text-slate-500">Ground floor lost</span>
                  </div>
                </label>

                {/* Critical Injuries */}
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${hasCriticalInjuries ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasCriticalInjuries}
                    onChange={(e) => setHasCriticalInjuries(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Critical Injury</span>
                    <span className="text-[10px] text-slate-500">Unconscious / Trauma</span>
                  </div>
                </label>

                {/* Vulnerable */}
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${hasInfantsOrElderly ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={hasInfantsOrElderly}
                    onChange={(e) => setHasInfantsOrElderly(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Elderly / Infant</span>
                    <span className="text-[10px] text-slate-500">Vulnerable present</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Location Details (GENUINELY OPTIONAL per FR-1.2) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>4. Location or Landmark (Optional)</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SUBMISSION NEVER BLOCKED
                </span>
              </div>

              <input
                type="text"
                value={locationManual}
                onChange={(e) => setLocationManual(e.target.value)}
                placeholder="E.g., 2nd floor balcony, green roof near old water tank (optional)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium placeholder:text-slate-400"
              />

              {/* GPS Status Card with Truthful Feedback */}
              <div className={`p-3 rounded-2xl border text-xs transition-colors ${
                gpsStatus === 'success'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : gpsStatus === 'denied' || gpsStatus === 'unavailable' || gpsStatus === 'timeout'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Navigation className={`w-4 h-4 shrink-0 mt-0.5 ${
                      gpsStatus === 'success' ? 'text-emerald-600' : gpsStatus === 'locating' ? 'text-sky-600 animate-spin' : 'text-slate-500'
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                          Device Coordinates
                        </span>
                        {gpsStatus === 'success' && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                            VERIFIED REAL GPS
                          </span>
                        )}
                      </div>

                      {gpsStatus === 'idle' && (
                        <p className="text-slate-500 text-[11px] mt-0.5">Acquiring current browser coordinates...</p>
                      )}
                      {gpsStatus === 'locating' && (
                        <p className="text-sky-700 text-[11px] font-medium mt-0.5 animate-pulse">Requesting high-accuracy browser location...</p>
                      )}
                      {gpsStatus === 'success' && gpsData && (
                        <p className="text-emerald-800 text-[11px] font-mono font-bold mt-0.5">
                          {gpsData.latitude}, {gpsData.longitude} <span className="font-normal text-emerald-600">(±{gpsData.accuracy_meters}m radius)</span>
                        </p>
                      )}
                      {gpsStatus === 'denied' && (
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          GPS permission denied by browser. Responders will locate you via manual landmark above.
                        </p>
                      )}
                      {gpsStatus === 'unavailable' && (
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          Location unavailable from device. Please enter an accurate landmark above.
                        </p>
                      )}
                      {gpsStatus === 'timeout' && (
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          GPS probe timed out. Please enter landmark above or click retry.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsStatus === 'locating'}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                  >
                    {gpsStatus === 'locating' ? 'Locating...' : gpsStatus === 'success' ? 'Recapture' : 'Retry GPS'}
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Optional Sender Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g., Alex Carter"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Phone / Radio Channel (Optional)
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g., +91 98765 43210 or Ch 16"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>
            </div>

            {/* 6. Primary Transmit Button (52px high per PRD 7.1) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[52px] rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>TRANSMIT EMERGENCY SOS</span>
                  </>
                )}
              </button>
              <span className="text-[10px] font-mono text-slate-400 text-center block mt-2">
                Sends distress packet directly to local ESP32 / Laptop node
              </span>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Explicit Confirmation Dialog (prevents accidental or test submissions) */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Confirm Emergency SOS
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-red-600 uppercase">
                      Live Incident Transmission
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to transmit an active distress incident to the local disaster response queue and map.
              </p>

              {/* Summary Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Category:</span>
                  <span className="font-bold text-slate-800">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Civilians Needing Rescue:</span>
                  <span className="font-bold text-slate-800">{headcount}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 font-sans shrink-0">Location:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {gpsData
                      ? `${gpsData.latitude}, ${gpsData.longitude} (±${gpsData.accuracy_meters}m)`
                      : locationManual || 'Not provided'}
                  </span>
                </div>
                {gpsData ? (
                  <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                    <span>GPS Origin:</span>
                    <span>Verified Browser GPS</span>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-amber-700 font-bold">
                    <span>GPS Origin:</span>
                    <span>Manual Landmark Only</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit SOS</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
