import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  WifiOff,
  Compass,
  Search,
  Users,
  Crosshair,
  ArrowRight,
  Layers,
  AlertCircle,
  Eye,
  Route,
  RotateCcw,
  X,
  ChevronDown,
  Navigation,
  Square,
  LocateFixed,
  CheckCircle2,
  CornerUpRight,
  ShieldAlert,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Incident, IncidentStatus, PriorityTier, AppRoute } from '../types';
import { api } from '../services/api';
import {
  fetchRescueRoute,
  getBrowserGeolocation,
  calculateHaversineDistance,
  RESCUE_BASE_COORDINATES,
  RESCUE_BASE_LABEL,
  RescueRoute,
} from '../services/routingService';
import { PriorityBadge, StatusBadge } from '../components/StatusBadges';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface MapPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Custom vector marker icon generator with priority colors and selection state
const createRescueMarkerIcon = (
  priority: PriorityTier,
  isSelected: boolean,
  isRoutedDestination: boolean
) => {
  const color =
    priority === 'CRITICAL'
      ? '#E53945'
      : priority === 'HIGH'
      ? '#D98A00'
      : priority === 'MEDIUM'
      ? '#1685D1'
      : '#5D6F89';

  const isCritical = priority === 'CRITICAL';
  const pulseRing = isRoutedDestination
    ? `<span style="position:absolute; inset:-8px; border-radius:9999px; background-color:#1685D1; opacity:0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : isCritical
    ? `<span style="position:absolute; inset:-5px; border-radius:9999px; background-color:${color}; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  const scale = isRoutedDestination ? 'scale(1.25)' : isSelected ? 'scale(1.15)' : 'scale(1)';
  const ringColor = isRoutedDestination ? '#65C7FF' : isSelected ? '#17243A' : '#FFFFFF';
  const ringWidth = isRoutedDestination ? '3.5px' : isSelected ? '3px' : '2px';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; transform:${scale}; transition:transform 0.15s ease-out;">
        ${pulseRing}
        <div style="width:30px; height:30px; border-radius:50%; background-color:${color}; border:${ringWidth} solid ${ringColor}; box-shadow:0 3px 10px rgba(23,36,58,0.35); display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
  });
};

// Operator Origin vector marker generator
const createOriginMarkerIcon = (isBase: boolean) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; inset:-4px; border-radius:50%; background-color:#1685D1; opacity:0.35; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="width:32px; height:32px; border-radius:50%; background-color:#17243A; border:3px solid #65C7FF; box-shadow:0 3px 10px rgba(23,36,58,0.4); display:flex; align-items:center; justify-content:center; color:#65C7FF;">
          ${
            isBase
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>'
          }
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Live Rescuer vector marker generator
const createRescuerLiveMarkerIcon = (hasLiveGps: boolean) => {
  const color = hasLiveGps ? '#0284C7' : '#5D6F89';
  const pulse = hasLiveGps
    ? `<span style="position:absolute; inset:-6px; border-radius:50%; background-color:#38BDF8; opacity:0.45; animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : '';

  return L.divIcon({
    className: 'custom-rescuer-live-marker',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
        ${pulse}
        <div style="width:32px; height:32px; border-radius:50%; background-color:${color}; border:3.5px solid #FFFFFF; box-shadow:0 3px 12px rgba(2,132,199,0.55); display:flex; align-items:center; justify-content:center; color:#FFFFFF;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

// Default map center: Nagpur, Maharashtra, India (PRD & Operator Command Post)
export const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];
export const DEFAULT_CITY_ZOOM = 12;

// Map controller for bounds fitting, Nagpur recentering, route framing, and resize monitoring
interface MapControllerProps {
  selectedIncident: Incident | null;
  mappedIncidents: Incident[];
  activeRescueRoute: RescueRoute | null;
  fitTrigger: number;
  centerNagpurTrigger: number;
  fitRouteTrigger: number;
  onTileError: () => void;
  onZoomChange: (zoom: number) => void;
  isNavigating: boolean;
  navCurrentPosition: [number, number] | null;
  navAutoCenter: boolean;
}

const MapController: React.FC<MapControllerProps> = ({
  selectedIncident,
  mappedIncidents,
  activeRescueRoute,
  fitTrigger,
  centerNagpurTrigger,
  fitRouteTrigger,
  onTileError,
  onZoomChange,
  isNavigating,
  navCurrentPosition,
  navAutoCenter,
}) => {
  const map = useMap();

  // Monitor tile loading errors & zoom level
  useEffect(() => {
    const handleTileError = () => {
      onTileError();
    };

    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('tileerror', handleTileError);
    map.on('zoomend', handleZoom);

    // Invalidate map size on window/container resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      map.off('tileerror', handleTileError);
      map.off('zoomend', handleZoom);
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, onTileError, onZoomChange]);

  // Fit bounds to all valid GPS markers when fitTrigger is invoked
  useEffect(() => {
    if (fitTrigger === 0 || mappedIncidents.length === 0) return;

    const bounds = L.latLngBounds(
      mappedIncidents.map((i) => [
        i.location_geo!.latitude!,
        i.location_geo!.longitude!,
      ])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [map, fitTrigger, mappedIncidents]);

  // Recenter to Nagpur command post when trigger is activated
  useEffect(() => {
    if (centerNagpurTrigger === 0) return;
    map.flyTo(NAGPUR_CENTER, DEFAULT_CITY_ZOOM, {
      duration: 1.0,
    });
  }, [map, centerNagpurTrigger]);

  // Fit bounds to active rescue route (origin, road path, destination)
  useEffect(() => {
    if (!activeRescueRoute || activeRescueRoute.coordinates.length === 0) return;

    const bounds = L.latLngBounds(activeRescueRoute.coordinates);
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [map, activeRescueRoute, fitRouteTrigger]);

  // Follow rescuer's live position during active navigation
  useEffect(() => {
    if (isNavigating && navCurrentPosition && navAutoCenter) {
      map.panTo(navCurrentPosition, {
        animate: true,
        duration: 0.6,
      });
    }
  }, [map, isNavigating, navCurrentPosition, navAutoCenter]);

  // Pan to selected incident when selection changes and no active route is being framed
  useEffect(() => {
    if (activeRescueRoute || isNavigating) return; // Keep route framing / navigation prioritized
    if (!selectedIncident?.location_geo) return;
    const { latitude, longitude } = selectedIncident.location_geo;
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
        duration: 1.0,
      });
    }
  }, [map, selectedIncident, activeRescueRoute, isNavigating]);

  return null;
};

export const MapPage: React.FC<MapPageProps> = ({ onNavigate }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  // Rescue Routing State
  const [activeRescueRoute, setActiveRescueRoute] = useState<RescueRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [originPreference, setOriginPreference] = useState<'AUTO' | 'BASE'>('AUTO');
  const [routingErrorNotice, setRoutingErrorNotice] = useState<string | null>(null);
  const [showRouteSteps, setShowRouteSteps] = useState(false);
  const [fitRouteTrigger, setFitRouteTrigger] = useState(0);

  // Active Live Navigation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [navCurrentPosition, setNavCurrentPosition] = useState<[number, number] | null>(null);
  const [navAccuracyMeters, setNavAccuracyMeters] = useState<number | null>(null);
  const [navHeading, setNavHeading] = useState<number | null>(null);
  const [navSpeedKmh, setNavSpeedKmh] = useState<number | null>(null);
  const [navDistanceRemainingMeters, setNavDistanceRemainingMeters] = useState<number | null>(null);
  const [navHasArrived, setNavHasArrived] = useState(false);
  const [navGpsError, setNavGpsError] = useState<string | null>(null);
  const [navAutoCenter, setNavAutoCenter] = useState(true);
  const [navStepIndex, setNavStepIndex] = useState(0);
  const [isRoutePanelMinimized, setIsRoutePanelMinimized] = useState(false);

  const watchIdRef = React.useRef<number | null>(null);

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Cleanup geolocation watch on component unmount
  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, []);

  const handleStartNavigation = () => {
    if (!activeRescueRoute) return;

    setIsNavigating(true);
    setIsRoutePanelMinimized(false);
    setNavHasArrived(false);
    setNavGpsError(null);
    setNavStepIndex(0);
    setNavAutoCenter(true);

    const destCoord = activeRescueRoute.destination;
    setNavDistanceRemainingMeters(activeRescueRoute.distanceKm * 1000);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNavGpsError('Geolocation is not supported by this browser. Displaying planned static route.');
      setNavCurrentPosition(activeRescueRoute.origin);
      return;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const posTuple: [number, number] = [lat, lon];

          setNavCurrentPosition(posTuple);
          setNavAccuracyMeters(pos.coords.accuracy || null);
          setNavHeading(pos.coords.heading || null);
          if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
            setNavSpeedKmh(Math.round(pos.coords.speed * 3.6));
          } else {
            setNavSpeedKmh(null);
          }
          setNavGpsError(null);

          // Calculate remaining straight-line distance to destination
          const remainingM = Math.round(calculateHaversineDistance(posTuple, destCoord) * 1000);
          setNavDistanceRemainingMeters(remainingM);

          // Check arrival threshold (within 45 meters)
          if (remainingM <= 45) {
            setNavHasArrived(true);
          }

          // Advance step index along route
          if (activeRescueRoute.steps && activeRescueRoute.steps.length > 0) {
            const totalDistM = activeRescueRoute.distanceKm * 1000;
            const progressRatio = Math.max(0, Math.min(1, 1 - remainingM / (totalDistM || 1)));
            let running = 0;
            let activeIdx = 0;
            for (let i = 0; i < activeRescueRoute.steps.length; i++) {
              running += activeRescueRoute.steps[i].distanceMeters;
              if (running >= progressRatio * totalDistM) {
                activeIdx = i;
                break;
              }
            }
            setNavStepIndex(activeIdx);
          }
        },
        (err) => {
          console.warn('Live navigation geolocation error:', err);
          let message = 'Live GPS unavailable.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission was denied. Displaying static route from origin without live movement tracking.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'GPS signal unavailable. Displaying static route from origin.';
          } else if (err.code === err.TIMEOUT) {
            message = 'GPS request timed out. Displaying static route from origin.';
          }
          setNavGpsError(message);
          setNavCurrentPosition(activeRescueRoute.origin);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );
      watchIdRef.current = id;
    } catch (e: any) {
      console.warn('Geolocation invocation error:', e);
      setNavGpsError('Could not initialize geolocation sensor. Displaying static route.');
      setNavCurrentPosition(activeRescueRoute.origin);
    }
  };

  const handleStopNavigation = () => {
    stopLiveTracking();
    setIsNavigating(false);
    setNavCurrentPosition(null);
    setNavGpsError(null);
    setNavHasArrived(false);
    setFitRouteTrigger((prev) => prev + 1);
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'mapped' | 'manual'>('all');

  // Map state
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_CITY_ZOOM);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [centerNagpurTrigger, setCenterNagpurTrigger] = useState(0);

  // Fetch real incidents from backend
  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      setBackendError(null);

      // Keep selected incident synchronized with fresh backend status
      if (selectedIncident) {
        const fresh = data.find((i) => i.id === selectedIncident.id);
        if (fresh) setSelectedIncident(fresh);
      }
    } catch (err) {
      console.error('Failed to fetch map incidents:', err);
      setBackendError('Connection to local backend (port 5001) unreachable.');
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3500);

    // Check browser offline state
    const handleOnline = () => setTilesUnavailable(false);
    const handleOffline = () => setTilesUnavailable(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setTilesUnavailable(true);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedIncident?.id]);

  // Handle cross-page route navigation via session storage
  useEffect(() => {
    const pendingRouteId = sessionStorage.getItem('active_rescue_route_id');
    if (pendingRouteId && incidents.length > 0) {
      sessionStorage.removeItem('active_rescue_route_id');
      const target = incidents.find((i) => i.id === pendingRouteId);
      if (target) {
        handleViewRescuePath(target);
      }
    }
  }, [incidents]);

  const handleUpdateStatus = async (id: string, status: IncidentStatus, notes?: string) => {
    try {
      await api.updateIncidentStatus(id, status, notes);
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to update status from map modal:', err);
    }
  };

  // Calculate & display road rescue route to a particular incident
  const handleViewRescuePath = async (incident: Incident, overrideOriginPref?: 'AUTO' | 'BASE') => {
    const pref = overrideOriginPref || originPreference;

    // Validate that destination has true GPS coordinates (Truth in Operations)
    if (
      !incident.location_geo ||
      incident.location_geo.latitude === null ||
      incident.location_geo.longitude === null
    ) {
      setRoutingErrorNotice(
        `Incident ${incident.id} is a landmark-only report without verified GPS. Road dispatch requires numeric coordinates.`
      );
      setSelectedIncident(incident);
      return;
    }

    setSelectedIncident(incident);
    setIsCalculatingRoute(true);
    setRoutingErrorNotice(null);

    let origin: [number, number] = RESCUE_BASE_COORDINATES;
    let originType: 'BROWSER_GPS' | 'RESCUE_BASE' = 'RESCUE_BASE';
    let originLabel = RESCUE_BASE_LABEL;

    if (pref === 'AUTO') {
      try {
        const browserCoords = await getBrowserGeolocation();
        origin = browserCoords;
        originType = 'BROWSER_GPS';
        originLabel = 'Operator Browser GPS';
      } catch (geoErr) {
        console.warn('Browser GPS permission denied or unavailable, falling back to Rescue Base:', geoErr);
        origin = RESCUE_BASE_COORDINATES;
        originType = 'RESCUE_BASE';
        originLabel = 'Nagpur Command Base (GPS unavailable)';
      }
    } else {
      origin = RESCUE_BASE_COORDINATES;
      originType = 'RESCUE_BASE';
      originLabel = RESCUE_BASE_LABEL;
    }

    const destination: [number, number] = [
      incident.location_geo.latitude,
      incident.location_geo.longitude,
    ];

    const route = await fetchRescueRoute(
      origin,
      destination,
      incident.id,
      originType,
      originLabel
    );

    setActiveRescueRoute(route);
    setIsRoutePanelMinimized(false);
    setIsCalculatingRoute(false);
    setFitRouteTrigger((prev) => prev + 1);
  };

  // Clear route and return to overall all-incidents map view
  const handleClearRescueRoute = () => {
    handleStopNavigation();
    setActiveRescueRoute(null);
    setRoutingErrorNotice(null);
    setShowRouteSteps(false);
    setIsRoutePanelMinimized(false);
  };

  // Switch origin between Browser GPS and Nagpur Rescue Base
  const handleSwitchOrigin = (newPref: 'AUTO' | 'BASE') => {
    setOriginPreference(newPref);
    if (selectedIncident) {
      handleViewRescuePath(selectedIncident, newPref);
    }
  };

  // Separate incidents into with GPS vs landmark only (PRD Truthful Rules)
  const mappedIncidents = useMemo(() => {
    return incidents.filter(
      (i) => i.location_geo && i.location_geo.latitude !== null && i.location_geo.longitude !== null
    );
  }, [incidents]);

  const manualOnlyIncidents = useMemo(() => {
    return incidents.filter(
      (i) => !i.location_geo || i.location_geo.latitude === null || i.location_geo.longitude === null
    );
  }, [incidents]);

  // Center coordinate: Default to Nagpur, Maharashtra, India
  const defaultCenter: [number, number] = NAGPUR_CENTER;

  // Filtered list for the side panel
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Tab matching
      if (activeTab === 'mapped') {
        if (!incident.location_geo || incident.location_geo.latitude === null) return false;
      } else if (activeTab === 'manual') {
        if (incident.location_geo && incident.location_geo.latitude !== null) return false;
      }

      // Status / Priority Filter
      if (activeFilter === 'CRITICAL' && incident.priority_tier !== 'CRITICAL') return false;
      if (activeFilter === 'ACTIVE' && incident.status === 'RESOLVED') return false;
      if (activeFilter === 'RESOLVED' && incident.status !== 'RESOLVED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = incident.id.toLowerCase().includes(q);
        const matchesLandmark = (incident.location_manual || '').toLowerCase().includes(q);
        const matchesSender = (incident.sender_name || '').toLowerCase().includes(q);
        const matchesDesc = (incident.description || '').toLowerCase().includes(q);
        const matchesCat = incident.category.toLowerCase().includes(q);
        if (!matchesId && !matchesLandmark && !matchesSender && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, activeTab, activeFilter, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-5"
    >
      {/* Backend Disconnection Banner */}
      {backendError && (
        <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#FCD8D9] text-[13px] text-[#E53945] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E53945] shrink-0" />
            <span className="font-semibold">{backendError}</span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-[#FDF2F2] text-[#E53945] px-2 py-0.5 rounded border border-[#FCD8D9]">
            LOCAL BACKEND OFFLINE
          </span>
        </div>
      )}

      {/* Top Banner: Geographic & Operational Overview */}
      <div className="p-4 rounded-xl bg-white border border-[#DCE6F1] text-[13px] text-[#17243A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1685D1] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[14px] text-[#17243A]">Live Rescue Geographic Map</span>
              <span className="text-[11px] font-mono font-semibold bg-[#ECFDF5] text-[#0B9B73] px-2 py-0.5 rounded border border-[#A7F3D0]">
                OpenStreetMap Real Tiles
              </span>
              {activeRescueRoute && (
                <span className="text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#1685D1] px-2 py-0.5 rounded border border-[#BFDBFE] flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  <span>Route Active ({activeRescueRoute.incidentId})</span>
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#5D6F89] mt-0.5">
              Default Center: Nagpur, Maharashtra (21.1458° N, 79.0882° E) • OpenStreetMap real tiles and road-following dispatch routing.
            </p>
          </div>
        </div>

        {/* Telemetry Stats & Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#5D6F89] bg-[#F3F7FC] px-3 py-1.5 rounded-lg border border-[#DCE6F1]">
            <span>GPS Plotted: <strong className="text-[#0B9B73]">{mappedIncidents.length}</strong></span>
            <span className="text-[#DCE6F1]">•</span>
            <span>Landmarks: <strong className="text-[#D98A00]">{manualOnlyIncidents.length}</strong></span>
          </div>

          {activeRescueRoute ? (
            <button
              onClick={handleClearRescueRoute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F7FC] hover:bg-[#E2E8F0] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-xs transition-colors cursor-pointer"
              title="Remove rescue route and return to all incidents"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5D6F89]" />
              <span>Clear Route</span>
            </button>
          ) : (
            <button
              onClick={() => setFitTrigger((prev) => prev + 1)}
              disabled={mappedIncidents.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F7FC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Adjust viewport to fit all valid GPS incident markers"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#1685D1]" />
              <span>Fit All Markers</span>
            </button>
          )}

          <button
            onClick={() => setCenterNagpurTrigger((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F7FC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-xs transition-colors cursor-pointer"
            title="Recenter view on Nagpur, Maharashtra, India"
          >
            <Compass className="w-3.5 h-3.5 text-[#1685D1]" />
            <span>Nagpur Center</span>
          </button>
        </div>
      </div>

      {/* Routing Notice / Validation Banner */}
      <AnimatePresence>
        {routingErrorNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-[#FEF8ED] border border-[#FDE8BF] text-[#D98A00] text-[13px] flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D98A00] shrink-0" />
              <span>{routingErrorNotice}</span>
            </div>
            <button
              onClick={() => setRoutingErrorNotice(null)}
              className="p-1 text-[#D98A00] hover:text-[#17243A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Tile Notification */}
      <AnimatePresence>
        {tilesUnavailable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-[#FEF8ED] border border-[#FDE8BF] text-[#D98A00] text-[13px] flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-4 h-4 text-[#D98A00] shrink-0" />
              <span>
                <strong>Map tiles currently unavailable (Disaster Connectivity Blackout / Offline).</strong> Stored incidents, coordinates, and navigation remain 100% usable.
              </span>
            </div>
            <button
              onClick={() => setTilesUnavailable(false)}
              className="text-[11px] font-mono font-semibold bg-white/90 hover:bg-white text-[#D98A00] px-2.5 py-1 rounded border border-[#FDE8BF] cursor-pointer transition-colors shrink-0"
            >
              RETRY TILES
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Two-Panel Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0">
        {/* Panel 1: Real Interactive Leaflet Map (7-8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden flex flex-col h-[520px] sm:h-[600px] lg:h-[calc(100vh-220px)] min-h-[480px] max-h-[850px] relative min-w-0">
          {/* Leaflet MapContainer */}
          <div className="relative w-full h-full z-10">
            <MapContainer
              center={defaultCenter}
              zoom={DEFAULT_CITY_ZOOM}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                maxZoom={19}
              />

              <MapController
                selectedIncident={selectedIncident}
                mappedIncidents={mappedIncidents}
                activeRescueRoute={activeRescueRoute}
                fitTrigger={fitTrigger}
                centerNagpurTrigger={centerNagpurTrigger}
                fitRouteTrigger={fitRouteTrigger}
                onTileError={() => setTilesUnavailable(true)}
                onZoomChange={(z) => setZoomLevel(z)}
                isNavigating={isNavigating}
                navCurrentPosition={navCurrentPosition}
                navAutoCenter={navAutoCenter}
              />

              {/* Render route polyline if an incident route is active */}
              {activeRescueRoute && activeRescueRoute.coordinates.length > 0 && (
                <>
                  {/* Outer casing halo for high contrast visibility */}
                  <Polyline
                    positions={activeRescueRoute.coordinates}
                    pathOptions={{
                      color: '#ffffff',
                      weight: isNavigating ? 8 : 7,
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  {/* Road route line */}
                  <Polyline
                    positions={activeRescueRoute.coordinates}
                    pathOptions={{
                      color: isNavigating ? '#0284C7' : activeRescueRoute.status === 'ERROR' ? '#D98A00' : '#1685D1',
                      weight: isNavigating ? 5.5 : 4.5,
                      opacity: 0.98,
                      dashArray: activeRescueRoute.status === 'ERROR' ? '8, 8' : undefined,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />

                  {/* Origin Marker (Operator GPS or Nagpur Rescue Base) */}
                  <Marker
                    position={activeRescueRoute.origin}
                    icon={createOriginMarkerIcon(activeRescueRoute.originType === 'RESCUE_BASE')}
                  >
                    <Popup>
                      <div className="p-2.5 text-[12px] font-mono">
                        <span className="font-bold text-[#17243A] block">{activeRescueRoute.originLabel}</span>
                        <span className="text-[#5D6F89]">
                          Origin Coordinates: {activeRescueRoute.origin[0].toFixed(4)}, {activeRescueRoute.origin[1].toFixed(4)}
                        </span>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Rescuer Live Position Marker & Accuracy Halo (When Navigating) */}
                  {isNavigating && navCurrentPosition && (
                    <>
                      {navAccuracyMeters && navAccuracyMeters <= 250 && !navGpsError && (
                        <Circle
                          center={navCurrentPosition}
                          radius={navAccuracyMeters}
                          pathOptions={{
                            color: '#0284C7',
                            fillColor: '#38BDF8',
                            fillOpacity: 0.15,
                            weight: 1.5,
                            dashArray: '4, 4',
                          }}
                        />
                      )}
                      <Marker
                        position={navCurrentPosition}
                        icon={createRescuerLiveMarkerIcon(!navGpsError)}
                        zIndexOffset={1000}
                      >
                        <Popup>
                          <div className="p-2.5 text-[12px] font-mono">
                            <span className="font-bold text-[#0284C7] block">
                              {navGpsError ? 'Planned Route Origin (Live GPS Offline)' : 'Rescuer Current Position'}
                            </span>
                            <span className="text-[#5D6F89]">
                              {navCurrentPosition[0].toFixed(5)}, {navCurrentPosition[1].toFixed(5)}
                            </span>
                            {navAccuracyMeters && !navGpsError && (
                              <span className="block text-[11px] text-[#0B9B73] mt-0.5">
                                GPS Accuracy: ±{Math.round(navAccuracyMeters)}m
                              </span>
                            )}
                            {navSpeedKmh !== null && (
                              <span className="block text-[11px] text-[#17243A] font-bold">
                                Speed: {navSpeedKmh} km/h
                              </span>
                            )}
                            {navHeading !== null && !isNaN(navHeading) && (
                              <span className="block text-[10px] text-[#5D6F89]">
                                Bearing: {Math.round(navHeading)}°
                              </span>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    </>
                  )}
                </>
              )}

              {/* Render ALL verified GPS incident markers (Unconditionally visible) */}
              {mappedIncidents.map((incident) => {
                const lat = incident.location_geo!.latitude!;
                const lon = incident.location_geo!.longitude!;
                const isSelected = selectedIncident?.id === incident.id;
                const isRoutedDestination = activeRescueRoute?.incidentId === incident.id;

                return (
                  <Marker
                    key={incident.id}
                    position={[lat, lon]}
                    icon={createRescueMarkerIcon(incident.priority_tier, isSelected, isRoutedDestination)}
                    eventHandlers={{
                      click: () => {
                        setSelectedIncident(incident);
                      },
                    }}
                  >
                    <Popup className="custom-rescue-popup">
                      <div className="p-3.5 space-y-2 min-w-[250px] max-w-[290px]">
                        {/* Popup Header */}
                        <div className="flex items-center justify-between border-b border-[#DCE6F1] pb-2">
                          <span className="font-mono font-bold text-[13px] text-[#17243A]">
                            {incident.id}
                          </span>
                          <PriorityBadge priority={incident.priority_tier} />
                        </div>

                        {/* Category & Status */}
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-semibold text-[#17243A] capitalize">
                            {incident.category.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <StatusBadge status={incident.status} />
                        </div>

                        {/* Location Details */}
                        <div className="text-[12px] text-[#5D6F89] leading-snug">
                          <div className="flex items-start gap-1 text-[#17243A] font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#5D6F89] mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{incident.location_manual || 'GPS Position'}</span>
                          </div>
                          <span className="block font-mono text-[11px] text-[#0B9B73] mt-1 bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                            GPS: {lat.toFixed(4)}, {lon.toFixed(4)}
                          </span>
                        </div>

                        {/* People & Reporter */}
                        <div className="flex items-center justify-between text-[11px] text-[#5D6F89] pt-1 border-t border-[#DCE6F1]">
                          <span className="flex items-center gap-1 font-semibold text-[#17243A]">
                            <Users className="w-3 h-3 text-[#5D6F89]" />
                            {incident.headcount} {incident.headcount === 1 ? 'person' : 'people'}
                          </span>
                          <span className="truncate max-w-[120px]">
                            {incident.sender_name || 'Anonymous'}
                          </span>
                        </div>

                        {/* Actions in Popup */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#DCE6F1]">
                          <button
                            onClick={() => handleViewRescuePath(incident)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-[#1685D1] hover:bg-[#1270B0] text-white font-semibold text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Calculate road route from current position"
                          >
                            <Route className="w-3.5 h-3.5" />
                            <span>{isRoutedDestination ? 'Active Route' : 'Rescue Path'}</span>
                          </button>

                          {isRoutedDestination && (
                            <button
                              onClick={() => {
                                if (isNavigating) {
                                  handleStopNavigation();
                                } else {
                                  handleStartNavigation();
                                }
                              }}
                              className={`py-1.5 px-2.5 rounded-lg text-white font-semibold text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                isNavigating ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B9B73] hover:bg-[#09805F]'
                              }`}
                              title={isNavigating ? 'Stop active navigation' : 'Start live turn-by-turn navigation'}
                            >
                              {isNavigating ? (
                                <>
                                  <Square className="w-3 h-3 fill-current" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Navigation className="w-3 h-3 fill-current" />
                                  <span>Start</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedIncident(incident)}
                            className="py-1.5 px-2.5 rounded-lg bg-[#17243A] hover:bg-[#20314A] text-white font-semibold text-[12px] transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            title="Review full incident record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Overlay: Top-Left Tactical Coordinates Widget */}
            <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-[#DCE6F1] rounded-lg px-3 py-1.5 shadow-sm text-[12px] font-mono text-[#17243A]">
              <Compass className="w-3.5 h-3.5 text-[#1685D1]" />
              <span>Nagpur, MH (21.1458, 79.0882)</span>
              <span className="text-[#DCE6F1]">|</span>
              <span>Zoom: {zoomLevel}x</span>
              <span className="text-[#DCE6F1]">|</span>
              <span className="text-[#0B9B73] font-semibold">{mappedIncidents.length} GPS Mapped</span>
            </div>

            {/* Map Overlay: Minimized Floating Pill (Top-Right Corner) */}
            {activeRescueRoute && isRoutePanelMinimized && (
              <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#BFDBFE] rounded-xl px-3 py-1.5 shadow-md text-[12px] font-mono text-[#17243A]">
                <Route className="w-4 h-4 text-[#1685D1] shrink-0" />
                <span className="font-bold">{activeRescueRoute.incidentId}</span>
                <span className="text-[#5D6F89] text-[11px]">
                  {isNavigating && navDistanceRemainingMeters !== null
                    ? navDistanceRemainingMeters >= 1000
                      ? `${(navDistanceRemainingMeters / 1000).toFixed(1)}km`
                      : `${navDistanceRemainingMeters}m`
                    : `${activeRescueRoute.distanceKm}km`}
                </span>

                {!isNavigating ? (
                  <button
                    onClick={handleStartNavigation}
                    className="px-2 py-0.5 rounded bg-[#1685D1] hover:bg-[#1270B0] text-white font-sans font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Start live navigation"
                  >
                    <Navigation className="w-3 h-3 fill-current" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopNavigation}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-sans font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Stop navigation (keeps blue route line)"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  onClick={() => setIsRoutePanelMinimized(false)}
                  className="p-1 text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] rounded transition-colors cursor-pointer"
                  title="Expand Route Panel"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleClearRescueRoute}
                  className="p-1 text-[#5D6F89] hover:text-red-600 hover:bg-[#F3F7FC] rounded transition-colors cursor-pointer"
                  title="Clear Route Lines from Map"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Map Overlay: Active Rescue Route Information Panel (Top-Right Corner Docked) */}
            {activeRescueRoute && !isNavigating && !isRoutePanelMinimized && (
              <div className="absolute top-3 right-3 z-[400] w-[calc(100%-24px)] sm:w-[350px] max-w-full bg-white/95 backdrop-blur-md rounded-xl border border-[#BFDBFE] p-3.5 shadow-lg text-[#17243A]">
                <div className="flex items-center justify-between border-b border-[#DCE6F1] pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#1685D1]">
                      <Route className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[13px] text-[#17243A]">
                          Route to {activeRescueRoute.incidentId}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-[#ECFDF5] text-[#0B9B73] border border-[#A7F3D0]">
                          LIVE PATH
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5D6F89] block truncate max-w-[180px]">
                        From: {activeRescueRoute.originLabel}
                      </span>
                    </div>
                  </div>

                  {/* Header actions: Minimize & Close panel (preserves route on map) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsRoutePanelMinimized(true)}
                      className="p-1 rounded-md text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                      title="Minimize panel (keeps blue route line visible on map)"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsRoutePanelMinimized(true)}
                      className="p-1 rounded-md text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                      title="Close panel (keeps blue route line visible on map)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics: Road Distance & Est. Drive Time */}
                <div className="grid grid-cols-2 gap-2 text-center mb-2">
                  <div className="bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#5D6F89] block">Road Distance</span>
                    <span className="text-[15px] font-mono font-extrabold text-[#1685D1]">
                      {activeRescueRoute.distanceKm} km
                    </span>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#5D6F89] block">Est. Drive Time</span>
                    <span className="text-[15px] font-mono font-extrabold text-[#0B9B73]">
                      {activeRescueRoute.durationMinutes > 0 ? `~${activeRescueRoute.durationMinutes} min` : 'Direct Bearing'}
                    </span>
                  </div>
                </div>

                {/* Prominent Start Navigation Button */}
                <div className="mb-2">
                  <button
                    onClick={handleStartNavigation}
                    className="w-full py-2 px-3 rounded-lg bg-[#1685D1] hover:bg-[#1270B0] text-white font-bold text-[12px] flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                    title="Enter active live navigation mode along this route"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    <span>Start Navigation</span>
                  </button>
                </div>

                {/* Fallback Notice if routing service had network issues */}
                {activeRescueRoute.status === 'ERROR' && (
                  <div className="mb-2 p-1.5 rounded-lg bg-[#FEF8ED] border border-[#FDE8BF] text-[10px] text-[#D98A00] flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-[#D98A00] shrink-0" />
                    <span className="line-clamp-2">{activeRescueRoute.errorMessage}</span>
                  </div>
                )}

                {/* Origin Selector: Toggle between Browser GPS and Nagpur Base */}
                <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[#DCE6F1]">
                  <span className="text-[#5D6F89]">Origin:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSwitchOrigin('AUTO')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        activeRescueRoute.originType === 'BROWSER_GPS'
                          ? 'bg-[#1685D1] text-white shadow-2xs'
                          : 'bg-[#F3F7FC] text-[#5D6F89] hover:text-[#17243A] border border-[#DCE6F1]'
                      }`}
                    >
                      Browser GPS
                    </button>
                    <button
                      onClick={() => handleSwitchOrigin('BASE')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        activeRescueRoute.originType === 'RESCUE_BASE'
                          ? 'bg-[#17243A] text-white shadow-2xs'
                          : 'bg-[#F3F7FC] text-[#5D6F89] hover:text-[#17243A] border border-[#DCE6F1]'
                      }`}
                    >
                      Nagpur Base
                    </button>
                  </div>
                </div>

                {/* Turn-by-Turn Collapsible Directions */}
                {activeRescueRoute.steps && activeRescueRoute.steps.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-[#DCE6F1]">
                    <button
                      onClick={() => setShowRouteSteps(!showRouteSteps)}
                      className="w-full flex items-center justify-between text-[10px] font-semibold text-[#1685D1] hover:underline cursor-pointer"
                    >
                      <span>{showRouteSteps ? 'Hide Directions' : `Show Turn-by-Turn (${activeRescueRoute.steps.length} maneuvers)`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRouteSteps ? 'rotate-180' : ''}`} />
                    </button>

                    {showRouteSteps && (
                      <div className="mt-1.5 max-h-28 overflow-y-auto space-y-1 pr-1 text-[10px] text-[#17243A]">
                        {activeRescueRoute.steps.map((st, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-1.5 p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                            <span className="leading-snug">{idx + 1}. {st.instruction}</span>
                            {st.distanceMeters > 0 && (
                              <span className="font-mono text-[#5D6F89] shrink-0 text-[9px]">
                                {st.distanceMeters >= 1000 ? `${(st.distanceMeters / 1000).toFixed(1)}km` : `${st.distanceMeters}m`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Route Controls */}
                <div className="mt-2 pt-1.5 border-t border-[#DCE6F1] flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setFitRouteTrigger((prev) => prev + 1)}
                    className="text-[#1685D1] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Fit Bounds</span>
                  </button>

                  <button
                    onClick={handleClearRescueRoute}
                    className="px-2 py-0.5 text-[10px] font-semibold text-[#5D6F89] hover:text-[#17243A] bg-[#F3F7FC] hover:bg-[#E2E8F0] rounded border border-[#DCE6F1] transition-colors cursor-pointer flex items-center gap-1"
                    title="Remove route lines from map"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Clear Route</span>
                  </button>
                </div>
              </div>
            )}

            {/* Map Overlay: Active Live Navigation HUD (Top-Right Corner Docked) */}
            {activeRescueRoute && isNavigating && !isRoutePanelMinimized && (
              <div className="absolute top-3 right-3 z-[400] w-[calc(100%-24px)] sm:w-[360px] max-w-full bg-white/95 backdrop-blur-md rounded-xl border-2 border-[#1685D1] p-3.5 shadow-xl text-[#17243A]">
                {/* Mode Header with Live Pulse and Stop Button */}
                <div className="flex items-center justify-between border-b border-[#DCE6F1] pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1685D1]"></span>
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[12px] uppercase tracking-wide text-[#17243A]">
                          Navigating
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-[#EFF6FF] text-[#1685D1] border border-[#BFDBFE]">
                          {activeRescueRoute.incidentId}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5D6F89] block font-mono">
                        {navGpsError
                          ? 'GPS Offline (Showing planned route)'
                          : navCurrentPosition
                          ? `GPS Active ${navAccuracyMeters ? `(±${Math.round(navAccuracyMeters)}m)` : ''}`
                          : 'Connecting to GPS...'}
                      </span>
                    </div>
                  </div>

                  {/* Header controls: Stop Navigation & Minimize (both keep blue lines on map) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleStopNavigation}
                      className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Stop active navigation (keeps blue route line on map)"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop Nav</span>
                    </button>
                    <button
                      onClick={() => setIsRoutePanelMinimized(true)}
                      className="p-1 rounded-md text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                      title="Minimize HUD (keeps navigation active)"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleStopNavigation}
                      className="p-1 rounded-md text-[#5D6F89] hover:text-red-600 hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                      title="Close navigation (keeps blue route line on map)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arrival Status Banner */}
                {navHasArrived && (
                  <div className="mb-2 p-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-start gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#0B9B73] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[11px] block">Arrived at Incident Scene</span>
                      <span className="text-[10px] leading-snug">
                        Within on-scene proximity of {activeRescueRoute.incidentId}.
                      </span>
                    </div>
                  </div>
                )}

                {/* GPS Notice / Fallback Banner */}
                {navGpsError && (
                  <div className="mb-2 p-1.5 rounded-lg bg-[#FEF8ED] border border-[#FDE8BF] text-[#9A6B00] text-[10px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D98A00] shrink-0 mt-0.5" />
                    <div className="leading-snug">{navGpsError}</div>
                  </div>
                )}

                {/* Primary Maneuver Guidance Box */}
                {activeRescueRoute.steps && activeRescueRoute.steps.length > 0 ? (
                  <div className="mb-2 bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] rounded-lg p-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#1685D1] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <CornerUpRight className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#0369A1] font-bold block">
                          Next Maneuver
                        </span>
                        <span className="font-semibold text-[12px] text-[#0C4A6E] leading-snug block">
                          {activeRescueRoute.steps[navStepIndex]?.instruction || 'Proceed along designated route'}
                        </span>
                        {activeRescueRoute.steps[navStepIndex]?.distanceMeters > 0 && (
                          <span className="text-[10px] font-mono text-[#0284C7] font-bold block mt-0.5">
                            for {activeRescueRoute.steps[navStepIndex].distanceMeters >= 1000
                              ? `${(activeRescueRoute.steps[navStepIndex].distanceMeters / 1000).toFixed(1)} km`
                              : `${activeRescueRoute.steps[navStepIndex].distanceMeters} m`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-2 text-[11px] text-[#5D6F89] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#1685D1]" />
                    <span>Follow direct bearing line towards incident destination</span>
                  </div>
                )}

                {/* Live Navigation Metrics: Remaining Distance, Time, Speed */}
                <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
                  <div className="bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-1.5">
                    <span className="text-[9px] font-mono uppercase text-[#5D6F89] block">Remaining</span>
                    <span className="text-[14px] font-mono font-extrabold text-[#1685D1]">
                      {navDistanceRemainingMeters !== null
                        ? navDistanceRemainingMeters >= 1000
                          ? `${(navDistanceRemainingMeters / 1000).toFixed(1)}km`
                          : `${navDistanceRemainingMeters}m`
                        : `${activeRescueRoute.distanceKm}km`}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-1.5">
                    <span className="text-[9px] font-mono uppercase text-[#5D6F89] block">Est. Time</span>
                    <span className="text-[14px] font-mono font-extrabold text-[#0B9B73]">
                      {activeRescueRoute.durationMinutes > 0
                        ? navDistanceRemainingMeters !== null && activeRescueRoute.distanceKm > 0
                          ? `~${Math.max(1, Math.round((navDistanceRemainingMeters / (activeRescueRoute.distanceKm * 1000)) * activeRescueRoute.durationMinutes))} min`
                          : `~${activeRescueRoute.durationMinutes} min`
                        : 'Bearing'}
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] border border-[#DCE6F1] rounded-lg p-1.5">
                    <span className="text-[9px] font-mono uppercase text-[#5D6F89] block">Speed</span>
                    <span className="text-[14px] font-mono font-extrabold text-[#17243A]">
                      {navSpeedKmh !== null ? `${navSpeedKmh}km/h` : 'Tracking'}
                    </span>
                  </div>
                </div>

                {/* Target Incident Context */}
                {selectedIncident && (
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] mb-2 text-[10px] leading-snug">
                    <div className="flex items-center justify-between text-[#17243A] font-semibold mb-0.5">
                      <span className="truncate max-w-[200px]">Target: {selectedIncident.location_manual || 'GPS Destination'}</span>
                      <PriorityBadge priority={selectedIncident.priority_tier} />
                    </div>
                    <div className="text-[#5D6F89] flex items-center justify-between text-[9px]">
                      <span>Headcount: {selectedIncident.headcount} {selectedIncident.headcount === 1 ? 'person' : 'people'}</span>
                      <span className="capitalize">{selectedIncident.category.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Map Controls */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#DCE6F1] text-[10px]">
                  <button
                    onClick={() => setNavAutoCenter(!navAutoCenter)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      navAutoCenter
                        ? 'bg-[#1685D1] text-white shadow-2xs'
                        : 'bg-[#F3F7FC] text-[#5D6F89] hover:text-[#17243A] border border-[#DCE6F1]'
                    }`}
                    title="Toggle automatic map following as your position updates"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>{navAutoCenter ? 'Auto-Following' : 'Follow Off'}</span>
                  </button>

                  <button
                    onClick={() => setFitRouteTrigger((prev) => prev + 1)}
                    className="text-[#1685D1] hover:underline font-semibold cursor-pointer"
                  >
                    Fit Route
                  </button>
                </div>

                {/* Truthful Operational Disclaimer */}
                <div className="mt-1.5 pt-1.5 border-t border-[#DCE6F1] flex items-start gap-1 text-[9px] text-[#5D6F89] leading-tight">
                  <ShieldAlert className="w-3 h-3 text-[#D98A00] shrink-0 mt-0.5" />
                  <span>
                    Navigation aid for rescue teams — not a guarantee of safe passage.
                  </span>
                </div>
              </div>
            )}

            {/* Map Overlay: Bottom-Left Priority Legend */}
            <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-xs border border-[#DCE6F1] rounded-lg px-3 py-2 shadow-sm text-[11px] font-semibold text-[#17243A]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E53945]" />
                Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D98A00]" />
                High
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1685D1]" />
                Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5D6F89]" />
                Low
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Synchronized Incident List & Details (4-5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden flex flex-col h-[520px] sm:h-[600px] lg:h-[calc(100vh-220px)] min-h-[480px] max-h-[850px] min-w-0">
          {/* Panel Header */}
          <div className="p-4 border-b border-[#DCE6F1] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-[#17243A]">Incident Directory</h3>
                <span className="text-[11px] font-mono font-semibold bg-[#F3F7FC] text-[#5D6F89] px-2 py-0.5 rounded border border-[#DCE6F1]">
                  {filteredIncidents.length} of {incidents.length}
                </span>
              </div>
              <button
                onClick={() => onNavigate('/rescue/incidents')}
                className="text-[12px] font-semibold text-[#1685D1] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-[#5D6F89] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ID, landmark, or category..."
                className="w-full pl-8 pr-4 py-1.5 text-[13px] bg-white border border-[#DCE6F1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1685D1]/20 focus:border-[#1685D1] font-medium text-[#17243A] placeholder:text-[#5D6F89]"
              />
            </div>

            {/* Quick Status / Priority Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[12px]">
              {(['ALL', 'CRITICAL', 'ACTIVE', 'RESOLVED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                    activeFilter === filter
                      ? 'bg-[#17243A] text-white shadow-xs'
                      : 'bg-white text-[#5D6F89] hover:text-[#17243A] border border-[#DCE6F1]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Type Tabs (All / GPS Plotted / Landmarks Only) */}
          <div className="px-3 py-2 border-b border-[#DCE6F1] bg-[#F8FAFC] flex items-center gap-1 text-[12px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer text-center ${
                activeTab === 'all'
                  ? 'bg-white text-[#17243A] shadow-xs border border-[#DCE6F1]'
                  : 'text-[#5D6F89] hover:text-[#17243A]'
              }`}
            >
              All ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('mapped')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer text-center ${
                activeTab === 'mapped'
                  ? 'bg-white text-[#17243A] shadow-xs border border-[#DCE6F1]'
                  : 'text-[#5D6F89] hover:text-[#17243A]'
              }`}
            >
              GPS ({mappedIncidents.length})
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer text-center ${
                activeTab === 'manual'
                  ? 'bg-white text-[#17243A] shadow-xs border border-[#DCE6F1]'
                  : 'text-[#5D6F89] hover:text-[#17243A]'
              }`}
            >
              Landmarks ({manualOnlyIncidents.length})
            </button>
          </div>

          {/* Selected Incident Notice if Landmark-only selected */}
          {selectedIncident && (!selectedIncident.location_geo || selectedIncident.location_geo.latitude === null) && (
            <div className="p-3 bg-[#FEF8ED] border-b border-[#FDE8BF] text-[#D98A00] text-[12px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D98A00] shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>{selectedIncident.id} is a landmark-only report.</strong> Coordinates are withheld to prevent inaccurate positioning; navigate using the manual landmark description.
              </div>
            </div>
          )}

          {/* Incident Cards Scrollable Container */}
          <div className="p-3 overflow-y-auto flex-grow space-y-2.5">
            {filteredIncidents.length === 0 ? (
              <div className="py-12 text-center text-[#5D6F89] text-[13px]">
                <MapPin className="w-8 h-8 text-[#5D6F89] mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-[#17243A]">No matching incidents</p>
                <p className="text-[12px] text-[#5D6F89] mt-0.5">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const hasGps = incident.location_geo && incident.location_geo.latitude !== null;
                const isSelected = selectedIncident?.id === incident.id;
                const isRouted = activeRescueRoute?.incidentId === incident.id;

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isRouted
                        ? 'border-[#1685D1] bg-[#EFF6FF]/70 shadow-xs ring-1 ring-[#1685D1]/30'
                        : isSelected
                        ? 'border-[#1685D1] bg-[#EFF6FF]/40 shadow-xs'
                        : 'border-[#DCE6F1] hover:border-[#BFDBFE] bg-white'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-[#17243A]">
                          {incident.id}
                        </span>
                        <PriorityBadge priority={incident.priority_tier} />
                      </div>
                      <StatusBadge status={incident.status} />
                    </div>

                    {/* Landmark / Location */}
                    <div className="text-[13px] text-[#17243A] font-medium mb-2 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#5D6F89] mt-0.5 shrink-0" />
                      <span className="line-clamp-2 leading-snug">
                        {incident.location_manual || 'Location unspecified'}
                      </span>
                    </div>

                    {/* GPS Coordinates or Landmark Fallback Notice */}
                    {hasGps ? (
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#1685D1] bg-[#EFF6FF] px-2 py-1 rounded border border-[#BFDBFE]">
                        <span>Lat {incident.location_geo?.latitude?.toFixed(4)}, Lon {incident.location_geo?.longitude?.toFixed(4)}</span>
                        <span>±{incident.location_geo?.accuracy_meters || 15}m</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#D98A00] bg-[#FEF8ED] px-2 py-1 rounded border border-[#FDE8BF]">
                        <AlertTriangle className="w-3 h-3 text-[#D98A00] shrink-0" />
                        <span>LANDMARK ONLY • NO GPS FIX</span>
                      </div>
                    )}

                    {/* Action Row & Footer */}
                    <div className="mt-2.5 pt-2 border-t border-[#DCE6F1] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-[#5D6F89] font-mono">
                        <span>People: {incident.headcount}</span>
                        <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasGps ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRescuePath(incident);
                              }}
                              disabled={isCalculatingRoute && isRouted}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isRouted
                                  ? 'bg-[#1685D1] text-white shadow-xs'
                                  : 'bg-[#EFF6FF] text-[#1685D1] hover:bg-[#DBEAFE] border border-[#BFDBFE]'
                              }`}
                              title={isRouted ? 'Rescue route is active' : 'Calculate road rescue route'}
                            >
                              <Route className="w-3.5 h-3.5" />
                              <span>{isRouted ? 'Route Active' : 'View Path'}</span>
                            </button>

                            {isRouted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isNavigating) {
                                    handleStopNavigation();
                                  } else {
                                    handleStartNavigation();
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer text-white shadow-xs ${
                                  isNavigating
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-[#0B9B73] hover:bg-[#09805F]'
                                }`}
                                title={isNavigating ? 'Stop active navigation' : 'Start live turn-by-turn navigation'}
                              >
                                {isNavigating ? (
                                  <>
                                    <Square className="w-3 h-3 fill-current" />
                                    <span>Stop Nav</span>
                                  </>
                                ) : (
                                  <>
                                    <Navigation className="w-3 h-3 fill-current" />
                                    <span>Start Nav</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono text-[#D98A00] bg-[#FEF8ED] border border-[#FDE8BF]"
                            title="No coordinates available for road routing"
                          >
                            No GPS Fix
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(incident);
                          }}
                          className="p-1 rounded-lg border border-[#DCE6F1] text-[#5D6F89] hover:text-[#17243A] hover:bg-[#F3F7FC] transition-colors"
                          title="Open full incident record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Incident Detail Modal for Review and Operator Actions */}
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
