import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
} from 'lucide-react';
import { Incident, IncidentStatus, PriorityTier, AppRoute } from '../types';
import { api } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/StatusBadges';
import { IncidentDetailModal } from '../components/IncidentDetailModal';

interface MapPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Custom vector marker icon generator with priority colors and selection state
const createRescueMarkerIcon = (priority: PriorityTier, isSelected: boolean) => {
  const color =
    priority === 'CRITICAL'
      ? '#E53945'
      : priority === 'HIGH'
      ? '#D98A00'
      : priority === 'MEDIUM'
      ? '#1685D1'
      : '#5D6F89';

  const isCritical = priority === 'CRITICAL';
  const pulseRing = isCritical
    ? `<span style="position:absolute; inset:-5px; border-radius:9999px; background-color:${color}; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
    : '';

  const scale = isSelected ? 'scale(1.2)' : 'scale(1)';
  const ringColor = isSelected ? '#17243A' : '#FFFFFF';
  const ringWidth = isSelected ? '3px' : '2px';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; transform:${scale}; transition:transform 0.15s ease-out;">
        ${pulseRing}
        <div style="width:30px; height:30px; border-radius:50%; background-color:${color}; border:${ringWidth} solid ${ringColor}; box-shadow:0 3px 8px rgba(23,36,58,0.28); display:flex; align-items:center; justify-content:center; color:#ffffff;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
};

// Default map center: Nagpur, Maharashtra, India (PRD & Operator Command Post)
export const NAGPUR_CENTER: [number, number] = [21.1458, 79.0882];
export const DEFAULT_CITY_ZOOM = 12;

// Map controller for bounds fitting, Nagpur recentering, fly-to actions, and tile error monitoring
interface MapControllerProps {
  selectedIncident: Incident | null;
  mappedIncidents: Incident[];
  fitTrigger: number;
  centerNagpurTrigger: number;
  onTileError: () => void;
  onZoomChange: (zoom: number) => void;
}

const MapController: React.FC<MapControllerProps> = ({
  selectedIncident,
  mappedIncidents,
  fitTrigger,
  centerNagpurTrigger,
  onTileError,
  onZoomChange,
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

    return () => {
      map.off('tileerror', handleTileError);
      map.off('zoomend', handleZoom);
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

  // Pan / fly to selected incident when selection changes
  useEffect(() => {
    if (!selectedIncident?.location_geo) return;
    const { latitude, longitude } = selectedIncident.location_geo;
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
        duration: 1.0,
      });
    }
  }, [map, selectedIncident]);

  return null;
};

export const MapPage: React.FC<MapPageProps> = ({ onNavigate }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

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
      setBackendError('Connection to local backend (port 5000) unreachable.');
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

  const handleUpdateStatus = async (id: string, status: IncidentStatus, notes?: string) => {
    try {
      await api.updateIncidentStatus(id, status, notes);
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to update status from map modal:', err);
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

  // Center coordinate: Default to Nagpur, Maharashtra, India (latitude 21.1458, longitude 79.0882)
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
            </div>
            <p className="text-[13px] text-[#5D6F89] mt-0.5">
              Default Center: Nagpur, Maharashtra (21.1458° N, 79.0882° E) • Real OpenStreetMap tiles and GPS beacon telemetry.
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

          <button
            onClick={() => setCenterNagpurTrigger((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F7FC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-xs transition-colors cursor-pointer"
            title="Recenter view on Nagpur, Maharashtra, India"
          >
            <Compass className="w-3.5 h-3.5 text-[#1685D1]" />
            <span>Nagpur Center</span>
          </button>

          <button
            onClick={() => setFitTrigger((prev) => prev + 1)}
            disabled={mappedIncidents.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F7FC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Adjust viewport to fit all valid GPS incident markers"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#1685D1]" />
            <span>Fit All Markers</span>
          </button>
        </div>
      </div>

      {/* Offline Tile Notification (Non-blocking fallback banner per Section 4) */}
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
                <strong>Map tiles currently unavailable (Disaster Connectivity Blackout / Offline).</strong> Locally stored incidents, coordinates, and directory navigation remain 100% usable.
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Panel 1: Real Interactive Leaflet Map (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden flex flex-col h-[640px] relative">
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
                fitTrigger={fitTrigger}
                centerNagpurTrigger={centerNagpurTrigger}
                onTileError={() => setTilesUnavailable(true)}
                onZoomChange={(z) => setZoomLevel(z)}
              />

              {/* Render verified GPS incident markers */}
              {mappedIncidents.map((incident) => {
                const lat = incident.location_geo!.latitude!;
                const lon = incident.location_geo!.longitude!;
                const isSelected = selectedIncident?.id === incident.id;

                return (
                  <Marker
                    key={incident.id}
                    position={[lat, lon]}
                    icon={createRescueMarkerIcon(incident.priority_tier, isSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedIncident(incident);
                      },
                    }}
                  >
                    <Popup className="custom-rescue-popup">
                      <div className="p-3.5 space-y-2 min-w-[240px] max-w-[280px]">
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

                        {/* Review Button */}
                        <button
                          onClick={() => setSelectedIncident(incident)}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-[#17243A] hover:bg-[#20314A] text-white font-semibold text-[12px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Full Details</span>
                        </button>
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

            {/* Map In-Canvas Tile Unavailable Overlay */}
            {tilesUnavailable && (
              <div className="absolute top-14 left-3 right-3 z-[400] bg-white/95 backdrop-blur-sm border border-[#FDE8BF] rounded-xl p-3 shadow-md flex items-center justify-between text-[13px] text-[#D98A00]">
                <div className="flex items-center gap-2.5">
                  <WifiOff className="w-4 h-4 text-[#D98A00] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#17243A]">Internet Map Tiles Unavailable</span>
                    <span className="block text-[12px] text-[#5D6F89]">
                      Tile server unreachable (Offline / Blackout). Stored incidents, coordinates, and local directory remain fully operational.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setTilesUnavailable(false)}
                  className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-[#FEF8ED] text-[#D98A00] rounded border border-[#FDE8BF] hover:bg-[#FDE8BF] cursor-pointer shrink-0"
                >
                  Retry
                </button>
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

        {/* Panel 2: Synchronized Incident List & Details (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#DCE6F1] shadow-[0_1px_3px_0_rgba(23,36,58,0.03)] overflow-hidden flex flex-col h-[640px]">
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

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1685D1] bg-[#EFF6FF]/60 shadow-xs'
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

                    {/* Footer Meta */}
                    <div className="mt-2.5 pt-2 border-t border-[#DCE6F1] flex items-center justify-between text-[11px] text-[#5D6F89] font-mono">
                      <span>People: {incident.headcount}</span>
                      <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
        />
      )}
    </motion.div>
  );
};
