/**
 * ReQNet Rescue Routing Service
 * Provides real road-following routing via Open Source Routing Machine (OSRM)
 * with robust fallbacks, truthful distance calculation, and step-by-step navigation instructions.
 */

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RescueRoute {
  incidentId: string;
  origin: [number, number]; // [lat, lon]
  originType: 'BROWSER_GPS' | 'RESCUE_BASE';
  originLabel: string;
  destination: [number, number]; // [lat, lon]
  destinationLabel: string;
  coordinates: [number, number][]; // Array of [lat, lon] coordinates for Leaflet Polyline
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
  provider: 'OSRM_ROUTING_SERVICE' | 'DIRECT_BEARING_FALLBACK';
  status: 'SUCCESS' | 'NO_ROUTE' | 'ERROR';
  errorMessage?: string;
}

// Verified Nagpur Rescue Command Post (PRD Baseline)
export const RESCUE_BASE_COORDINATES: [number, number] = [21.1458, 79.0882];
export const RESCUE_BASE_LABEL = 'Nagpur Rescue Command Post';

/**
 * Calculates straight-line Haversine distance in kilometers.
 * Used for accurate mathematical reference when road routing is unavailable.
 */
export function calculateHaversineDistance(
  p1: [number, number],
  p2: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates a genuine road-following rescue route using OSRM.
 * Never fabricates routes or travel times if coordinates are invalid or service is down.
 */
export async function fetchRescueRoute(
  origin: [number, number],
  destination: [number, number],
  incidentId: string,
  originType: 'BROWSER_GPS' | 'RESCUE_BASE' = 'BROWSER_GPS',
  originLabel = 'Operator Position'
): Promise<RescueRoute> {
  const [originLat, originLon] = origin;
  const [destLat, destLon] = destination;

  // Validate coordinates
  if (
    isNaN(originLat) ||
    isNaN(originLon) ||
    isNaN(destLat) ||
    isNaN(destLon) ||
    (originLat === 0 && originLon === 0) ||
    (destLat === 0 && destLon === 0)
  ) {
    return {
      incidentId,
      origin,
      originType,
      originLabel,
      destination,
      destinationLabel: `Incident ${incidentId}`,
      coordinates: [],
      distanceKm: 0,
      durationMinutes: 0,
      steps: [],
      provider: 'DIRECT_BEARING_FALLBACK',
      status: 'ERROR',
      errorMessage: 'Invalid or missing geographic coordinates for route calculation.',
    };
  }

  // OSRM Public Driving Endpoint: format {lon},{lat};{lon},{lat}
  const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7-second network timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Routing provider responded with status ${res.status}`);
    }

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      return {
        incidentId,
        origin,
        originType,
        originLabel,
        destination,
        destinationLabel: `Incident ${incidentId}`,
        coordinates: [origin, destination],
        distanceKm: parseFloat(calculateHaversineDistance(origin, destination).toFixed(2)),
        durationMinutes: 0,
        steps: [],
        provider: 'DIRECT_BEARING_FALLBACK',
        status: 'NO_ROUTE',
        errorMessage: 'No passable road route found between origin and destination coordinates.',
      };
    }

    const primaryRoute = data.routes[0];

    // Convert GeoJSON [lon, lat] pairs to Leaflet [lat, lon]
    const leafletCoords: [number, number][] = primaryRoute.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon]
    );

    // Extract turn-by-turn directions if provided by OSRM
    const steps: RouteStep[] = [];
    if (primaryRoute.legs && primaryRoute.legs[0]?.steps) {
      for (const step of primaryRoute.legs[0].steps) {
        if (step.maneuver) {
          const type = step.maneuver.type || 'proceed';
          const modifier = step.maneuver.modifier ? ` (${step.maneuver.modifier})` : '';
          const street = step.name ? ` onto ${step.name}` : '';
          const instruction = `${type.charAt(0).toUpperCase() + type.slice(1)}${modifier}${street}`;

          // Avoid duplicating zero-distance final arrival steps
          if (step.distance > 0 || type === 'arrive') {
            steps.push({
              instruction,
              distanceMeters: Math.round(step.distance || 0),
              durationSeconds: Math.round(step.duration || 0),
            });
          }
        }
      }
    }

    const distanceKm = parseFloat((primaryRoute.distance / 1000).toFixed(2));
    const durationMinutes = Math.max(1, Math.round(primaryRoute.duration / 60));

    return {
      incidentId,
      origin,
      originType,
      originLabel,
      destination,
      destinationLabel: `Incident ${incidentId}`,
      coordinates: leafletCoords,
      distanceKm,
      durationMinutes,
      steps,
      provider: 'OSRM_ROUTING_SERVICE',
      status: 'SUCCESS',
    };
  } catch (err: any) {
    const directKm = parseFloat(calculateHaversineDistance(origin, destination).toFixed(2));
    return {
      incidentId,
      origin,
      originType,
      originLabel,
      destination,
      destinationLabel: `Incident ${incidentId}`,
      coordinates: [origin, destination], // Direct bearing fallback
      distanceKm: directKm,
      durationMinutes: 0, // Honest: do not invent duration when road routing is offline
      steps: [],
      provider: 'DIRECT_BEARING_FALLBACK',
      status: 'ERROR',
      errorMessage:
        'Online road routing service is unreachable (Offline/Disaster blackout). Direct geographic bearing line displayed.',
    };
  }
}

/**
 * Request operator's current browser location with timeout.
 */
export function getBrowserGeolocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15000,
      }
    );
  });
}
