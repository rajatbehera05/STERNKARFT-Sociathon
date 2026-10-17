import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Maximize2,
  RotateCcw,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Users,
  WifiOff,
} from 'lucide-react';
import {
  ReliefRequest,
  UrgencyLevel,
  VerificationStatus,
} from '../../types/relief';
import {
  NAGPUR_CENTER,
  isCoordinateWithinNagpur,
} from '../../data/reliefDemoData';

interface NagpurReliefMapProps {
  requests: ReliefRequest[];
  selectedRequest: ReliefRequest | null;
  onSelectRequest: (request: ReliefRequest) => void;
  onOpenDetails?: (request: ReliefRequest) => void;
  // Picker mode for new request creation
  isPickerMode?: boolean;
  pickerCoords?: { lat: number; lng: number } | null;
  onPickCoords?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

// Generate custom SVG icon with urgency color and verification status badge
const createReliefMarkerIcon = (
  urgency: UrgencyLevel,
  verification: VerificationStatus,
  isSelected: boolean
) => {
  let mainColor = '#10B981'; // ROUTINE (green)
  let pulseRing = '';

  if (urgency === 'IMMEDIATE') {
    mainColor = '#E53945'; // crimson
    pulseRing = `<span style="position:absolute; inset:-8px; border-radius:9999px; background-color:#E53945; opacity:0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`;
  } else if (urgency === 'URGENT') {
    mainColor = '#EA580C'; // amber-orange
    pulseRing = `<span style="position:absolute; inset:-4px; border-radius:9999px; background-color:#EA580C; opacity:0.3; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`;
  } else if (urgency === 'ELEVATED') {
    mainColor = '#0284C7'; // arctic blue
  }

  // Verification mini-badge on top right
  let badgeColor = '#64748B';
  let badgeSvg = `<circle cx="6" cy="6" r="3" fill="#ffffff"/>`; // default dot

  if (verification === 'VERIFIED') {
    badgeColor = '#059669'; // emerald
    badgeSvg = `<path d="M3.5 6L5.5 8L8.5 4" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (verification === 'PENDING') {
    badgeColor = '#D97706'; // amber
    badgeSvg = `<circle cx="6" cy="4" r="1" fill="#ffffff"/><path d="M6 7V8.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (verification === 'CLARIFICATION_NEEDED') {
    badgeColor = '#9333EA'; // purple
    badgeSvg = `<path d="M6 3.5V6.5M6 8.5H6.01" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`;
  } else if (verification === 'REJECTED') {
    badgeColor = '#DC2626'; // red
    badgeSvg = `<path d="M4 4L8 8M8 4L4 8" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>`;
  }

  const scale = isSelected ? 'scale(1.22)' : 'scale(1)';
  const borderRing = isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF';
  const zIndex = isSelected ? 1000 : urgency === 'IMMEDIATE' ? 900 : 500;

  return L.divIcon({
    className: 'custom-relief-marker',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; transform:${scale}; transition:transform 0.18s ease-out; z-index:${zIndex};">
        ${pulseRing}
        <!-- Main Marker Pin -->
        <div style="width:32px; height:32px; border-radius:50%; background-color:${mainColor}; border:${borderRing}; box-shadow:0 4px 12px rgba(15,23,42,0.35); display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <!-- Verification Mini Badge -->
        <div style="position:absolute; top:-2px; right:-2px; width:16px; height:16px; border-radius:50%; background-color:${badgeColor}; border:1.5px solid #ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            ${badgeSvg}
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [0, -36],
  });
};

// Picker Marker Icon for interactive location selection
const createPickerIcon = (isValidNagpur: boolean) => {
  const color = isValidNagpur ? '#2563EB' : '#DC2626';
  return L.divIcon({
    className: 'picker-marker',
    html: `
      <div style="position:relative; width:42px; height:42px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; inset:-4px; border-radius:50%; background-color:${color}; opacity:0.35; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="width:34px; height:34px; border-radius:50%; background-color:${color}; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="22" y1="12" x2="18" y2="12"/>
            <line x1="6" y1="12" x2="2" y2="12"/>
            <line x1="12" y1="6" x2="12" y2="2"/>
            <line x1="12" y1="22" x2="12" y2="18"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

// Map controller for framing, pan-to-selected, fit bounds
const MapController: React.FC<{
  selectedRequest: ReliefRequest | null;
  requests: ReliefRequest[];
  fitTrigger: number;
  resetNagpurTrigger: number;
  onTileError: () => void;
}> = ({ selectedRequest, requests, fitTrigger, resetNagpurTrigger, onTileError }) => {
  const map = useMap();

  // Listen for tile load failures gracefully
  useEffect(() => {
    const handleTileError = () => {
      onTileError();
    };
    map.on('tileerror', handleTileError);
    return () => {
      map.off('tileerror', handleTileError);
    };
  }, [map, onTileError]);

  // Initial fit to available markers on load
  useEffect(() => {
    const validCoords = requests
      .filter((r) => r.location.isWithinNagpurBounds && r.location.latitude && r.location.longitude)
      .map((r) => [r.location.latitude, r.location.longitude] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      bounds.extend(NAGPUR_CENTER);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView(NAGPUR_CENTER, 12);
    }
  }, [map]);

  // "Fit all requests" trigger
  useEffect(() => {
    if (fitTrigger === 0) return;
    const validCoords = requests
      .filter((r) => r.location.latitude && r.location.longitude)
      .map((r) => [r.location.latitude, r.location.longitude] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [map, fitTrigger, requests]);

  // "Reset to Nagpur" trigger
  useEffect(() => {
    if (resetNagpurTrigger === 0) return;
    map.flyTo(NAGPUR_CENTER, 12, { duration: 0.8 });
  }, [map, resetNagpurTrigger]);

  // Focus selected request marker
  useEffect(() => {
    if (!selectedRequest?.location) return;
    const { latitude, longitude } = selectedRequest.location;
    if (latitude && longitude) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), {
        duration: 0.9,
      });
    }
  }, [map, selectedRequest]);

  return null;
};

// Click handler for picker mode
const LocationPickerEvents: React.FC<{
  onPick: (coords: { lat: number; lng: number }) => void;
}> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

export const NagpurReliefMap: React.FC<NagpurReliefMapProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  onOpenDetails,
  isPickerMode = false,
  pickerCoords = null,
  onPickCoords,
  className = '',
}) => {
  const [fitTrigger, setFitTrigger] = useState(0);
  const [resetNagpurTrigger, setResetNagpurTrigger] = useState(0);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Filter requests that have valid geographic coordinates
  const mappedRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.location &&
        typeof r.location.latitude === 'number' &&
        typeof r.location.longitude === 'number'
    );
  }, [requests]);

  const pickerInNagpur = useMemo(() => {
    if (!pickerCoords) return true;
    return isCoordinateWithinNagpur(pickerCoords.lat, pickerCoords.lng);
  }, [pickerCoords]);

  return (
    <div
      className={`relative w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col shadow-sm ${className}`}
      style={{ minHeight: isPickerMode ? '340px' : '480px' }}
    >
      {/* Offline Tiles Notification */}
      {tilesUnavailable && (
        <div className="absolute top-3 left-3 right-3 z-30 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Real OpenStreetMap tiles unreachable. Stored Nagpur coordinates and markers remain operational.
            </span>
          </div>
          <button
            onClick={() => setTilesUnavailable(false)}
            className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Picker Guidance Banner */}
      {isPickerMode && (
        <div className="absolute top-3 left-3 right-3 z-30 p-2.5 bg-blue-900/90 text-white backdrop-blur-xs rounded-xl text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-300 shrink-0" />
            <span>
              <strong>Click anywhere on Nagpur map</strong> or drag marker to set exact emergency location.
            </span>
          </div>
          {pickerCoords && !pickerInNagpur && (
            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
              Outside Nagpur Area
            </span>
          )}
        </div>
      )}

      {/* Map Action Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => setFitTrigger((prev) => prev + 1)}
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Fit bounds to all relief requests"
        >
          <Maximize2 className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">Fit All</span>
        </button>

        <button
          onClick={() => setResetNagpurTrigger((prev) => prev + 1)}
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          title="Reset to Nagpur center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Reset Nagpur</span>
        </button>

        {!isPickerMode && (
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Toggle legend"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{showLegend ? 'Hide Legend' : 'Legend'}</span>
          </button>
        )}
      </div>

      {/* Real OpenStreetMap Container */}
      <div className="relative w-full h-full flex-grow min-h-[340px] z-10">
        <MapContainer
          center={pickerCoords ? [pickerCoords.lat, pickerCoords.lng] : NAGPUR_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | Nagpur Emergency Command'
            maxZoom={19}
          />

          <MapController
            selectedRequest={selectedRequest}
            requests={mappedRequests}
            fitTrigger={fitTrigger}
            resetNagpurTrigger={resetNagpurTrigger}
            onTileError={() => setTilesUnavailable(true)}
          />

          {/* Location picker events & marker */}
          {isPickerMode && onPickCoords && (
            <>
              <LocationPickerEvents onPick={onPickCoords} />
              {pickerCoords && (
                <Marker
                  position={[pickerCoords.lat, pickerCoords.lng]}
                  icon={createPickerIcon(pickerInNagpur)}
                  draggable={true}
                  eventHandlers={{
                    dragend(e) {
                      const latlng = e.target.getLatLng();
                      onPickCoords({ lat: latlng.lat, lng: latlng.lng });
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>Selected Emergency Point</strong>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        {pickerCoords.lat.toFixed(5)}°N, {pickerCoords.lng.toFixed(5)}°E
                      </div>
                      {!pickerInNagpur && (
                        <div className="text-red-600 font-semibold text-[11px] mt-1">
                          Warning: Point is outside the standard Nagpur municipal bounds.
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </>
          )}

          {/* Request Markers */}
          {!isPickerMode &&
            mappedRequests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              const unmetCount = req.items.reduce(
                (sum, item) => sum + Math.max(0, item.requestedQty - item.fulfilledQty),
                0
              );

              return (
                <Marker
                  key={req.id}
                  position={[req.location.latitude, req.location.longitude]}
                  icon={createReliefMarkerIcon(req.urgency, req.verificationStatus, isSelected)}
                  eventHandlers={{
                    click: () => onSelectRequest(req),
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 min-w-[220px] max-w-[280px] text-slate-800">
                      {/* Popup Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {req.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            req.urgency === 'IMMEDIATE'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : req.urgency === 'URGENT'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : req.urgency === 'ELEVATED'
                              ? 'bg-sky-100 text-sky-700 border border-sky-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </div>

                      {/* Location & Locality */}
                      <div className="mt-1.5 flex items-start gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-slate-900">{req.location.locality}</div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {req.location.addressOrLandmark}
                          </div>
                        </div>
                      </div>

                      {/* Headcount & Verification */}
                      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.peopleAffected} Affected</span>
                        </div>
                        <div className="font-semibold text-right">
                          <span
                            className={
                              req.verificationStatus === 'VERIFIED'
                                ? 'text-emerald-700'
                                : req.verificationStatus === 'PENDING'
                                ? 'text-amber-700'
                                : req.verificationStatus === 'CLARIFICATION_NEEDED'
                                ? 'text-purple-700'
                                : 'text-red-700'
                            }
                          >
                            {req.verificationStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Requested Items preview */}
                      <div className="mt-2 text-[11px] space-y-1">
                        <div className="text-slate-500 font-medium">Requested Items:</div>
                        <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                          {req.items.map((item) => {
                            const remaining = Math.max(0, item.requestedQty - item.fulfilledQty);
                            return (
                              <li
                                key={item.id}
                                className="flex items-center justify-between text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-100"
                              >
                                <span className="truncate max-w-[130px]" title={item.name}>
                                  {item.name}
                                </span>
                                <span className="font-mono font-semibold text-[10px]">
                                  {remaining} / {item.requestedQty} {item.unit}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          {unmetCount > 0 ? `${unmetCount} total unmet items` : 'Fully delivered'}
                        </span>
                        {onOpenDetails && (
                          <button
                            onClick={() => onOpenDetails(req)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Triage & Match
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>

      {/* Floating Legend */}
      {!isPickerMode && showLegend && (
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-[11px] max-w-[280px] space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-900 text-xs border-b border-slate-100 pb-1">
            <span>Nagpur Map Legend</span>
            <span className="text-[10px] font-mono text-slate-400">Nagpur Urban Sector</span>
          </div>

          {/* Urgency Colors */}
          <div>
            <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              Urgency Tier
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53945] ring-2 ring-red-200" />
                <span className="text-slate-700">Immediate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                <span className="text-slate-700">Urgent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                <span className="text-slate-700">Elevated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="text-slate-700">Routine</span>
              </div>
            </div>
          </div>

          {/* Verification Badges */}
          <div>
            <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              Verification State (Top-Right Badge)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              <div className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1 text-amber-700">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1 text-purple-700">
                <HelpCircle className="w-3 h-3 text-purple-600" />
                <span>Clarify</span>
              </div>
              <div className="flex items-center gap-1 text-red-700">
                <XCircle className="w-3 h-3 text-red-600" />
                <span>Rejected</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Nagpur Service Bounds: active</span>
            <span className="font-mono">21.1458° N</span>
          </div>
        </div>
      )}
    </div>
  );
};
