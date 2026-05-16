import type { PlaceRecommendation } from "@/lib/types/travel";

export type MapPin = {
  id: string;
  label: string;
  category: string;
  location: string;
  isHiddenGem: boolean;
  isSaved?: boolean;
  lat: number;
  lng: number;
};

export type MapRoute = {
  center: { lat: number; lng: number };
  zoom: number;
  pins: MapPin[];
  routePins: MapPin[];
  routeNote: string;
  distanceMeters?: number;
  duration?: string;
  encodedPolyline?: string;
  isMock: boolean;
  provider: "google-maps" | "not-connected";
};

const fallbackCenter = { lat: 37.9838, lng: 23.7275 };

export async function getMapRoute(places: PlaceRecommendation[]): Promise<MapRoute> {
  const pins = places
    .map((place, index) => ({
      id: place.id,
      label: place.name,
      category: place.category,
      location: place.location,
      isHiddenGem: place.isHiddenGem,
      lat: place.coordinates?.lat ?? 38.72 + index * 0.012,
      lng: place.coordinates?.lng ?? -9.14 + index * 0.01,
    }))
    .filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng));

  const center = centerFromPins(pins);
  const zoom = zoomFromPins(pins);
  const routePins = selectRoutePins(pins);
  const route = await computeGoogleRoute(routePins);

  if (route) {
    return {
      center,
      zoom,
      pins,
      routePins,
      routeNote: `Live route estimate across ${routePins.length} nearby stops.`,
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      encodedPolyline: route.encodedPolyline,
      isMock: false,
      provider: "google-maps",
    };
  }

  const fallback = estimateRoute(routePins);

  return {
    center,
    zoom,
    pins,
    routePins,
    routeNote: process.env.GOOGLE_MAPS_API_KEY
      ? routePins.length > 1
        ? "Live pins are shown. Distance and duration are local estimates until Routes API is enabled."
        : "Live pins are shown. Route needs at least two nearby pins."
      : "Google Maps is not connected.",
    distanceMeters: fallback.distanceMeters,
    duration: fallback.duration,
    isMock: !process.env.GOOGLE_MAPS_API_KEY,
    provider: process.env.GOOGLE_MAPS_API_KEY ? "google-maps" : "not-connected",
  };
}

type StaticMapOptions = {
  markers?: boolean;
  routePath?: boolean;
  zoom?: number;
};

export function buildStaticMapUrl(route: MapRoute, size = "920x540", options: StaticMapOptions = {}) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !route.pins.length) return null;
  const { markers = true, routePath = true } = options;

  const params = new URLSearchParams({
    key,
    size,
    scale: "2",
    maptype: "roadmap",
    center: `${route.center.lat},${route.center.lng}`,
    zoom: String(options.zoom ?? route.zoom),
  });

  if (markers) {
    route.pins.slice(0, 18).forEach((pin, index) => {
      params.append("markers", `color:${markerColor(pin.category)}|label:${markerLabel(index)}|${pin.lat},${pin.lng}`);
    });
  }

  if (routePath && route.encodedPolyline) {
    params.append("path", `color:0x0f172aff|weight:4|enc:${route.encodedPolyline}`);
  } else if (routePath && route.routePins.length > 1) {
    params.append("path", `color:0x0f172aff|weight:4|${route.routePins.map((pin) => `${pin.lat},${pin.lng}`).join("|")}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function formatDistance(meters?: number) {
  if (!meters) return "Distance unavailable";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(duration?: string) {
  if (!duration) return "Duration unavailable";
  const seconds = Number(duration.replace("s", ""));
  if (!Number.isFinite(seconds)) return duration;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

async function computeGoogleRoute(pins: MapPin[]) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key || pins.length < 2) return null;

  const [origin, ...rest] = pins;
  const destination = rest.at(-1);
  if (!destination) return null;
  const intermediates = rest.slice(0, -1).slice(0, 4);

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        intermediates: intermediates.map(waypoint),
        travelMode: "WALK",
        computeAlternativeRoutes: false,
        languageCode: "en-US",
        units: "METRIC",
      }),
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      routes?: Array<{ distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }>;
    };
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      encodedPolyline: route.polyline?.encodedPolyline,
    };
  } catch {
    return null;
  }
}

function waypoint(pin: MapPin) {
  return {
    location: {
      latLng: {
        latitude: pin.lat,
        longitude: pin.lng,
      },
    },
  };
}

function estimateRoute(pins: MapPin[]) {
  if (pins.length < 2) return {};
  const straightLineMeters = pins.slice(1).reduce((sum, pin, index) => sum + haversineMeters(pins[index], pin), 0);
  const walkingMeters = Math.round(straightLineMeters * 1.28);
  const walkingSeconds = Math.round(walkingMeters / 1.25);
  return {
    distanceMeters: walkingMeters,
    duration: `${walkingSeconds}s`,
  };
}

function selectRoutePins(pins: MapPin[]) {
  if (pins.length <= 6) return pins;
  const radiusMeters = 35000;
  const clusters = pins.map((pin) => pins.filter((candidate) => haversineMeters(pin, candidate) <= radiusMeters));
  const bestCluster = clusters.sort((a, b) => b.length - a.length)[0] ?? [];
  const routeable = bestCluster.length >= 2 ? bestCluster : pins.slice(0, 2);
  return routeable
    .sort((a, b) => categoryPriority(a.category, a.isHiddenGem) - categoryPriority(b.category, b.isHiddenGem))
    .slice(0, 6);
}

function categoryPriority(category: string, hidden: boolean) {
  if (hidden) return 0;
  if (/museum|landmark|historical|attraction/i.test(category)) return 1;
  if (/restaurant|cafe|bar/i.test(category)) return 2;
  if (/park|garden|view|scenic/i.test(category)) return 3;
  return 4;
}

function haversineMeters(a: MapPin, b: MapPin) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function centerFromPins(pins: MapPin[]) {
  if (!pins.length) return fallbackCenter;
  const sum = pins.reduce(
    (acc, pin) => ({ lat: acc.lat + pin.lat, lng: acc.lng + pin.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / pins.length, lng: sum.lng / pins.length };
}

function zoomFromPins(pins: MapPin[]) {
  if (pins.length < 2) return 12;
  const latitudes = pins.map((pin) => pin.lat);
  const longitudes = pins.map((pin) => pin.lng);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lngSpan);
  if (span > 7) return 5;
  if (span > 3.5) return 6;
  if (span > 1.6) return 7;
  if (span > 0.8) return 8;
  if (span > 0.35) return 10;
  if (span > 0.15) return 11;
  return 12;
}

function markerColor(category: string) {
  if (/restaurant|cafe|food|bar/i.test(category)) return "orange";
  if (/scenic|view|observation/i.test(category)) return "blue";
  if (/garden|park|nature|beach/i.test(category)) return "green";
  if (/museum|culture|landmark/i.test(category)) return "purple";
  return "red";
}

function markerLabel(index: number) {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] ?? "";
}
