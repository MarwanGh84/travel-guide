import type { PlaceRecommendation } from "@/lib/types/travel";
import { GoogleTextSearchResponseSchema } from "@/lib/validation/schemas";

export type MapPin = {
  id: string;
  label: string;
  category: string;
  location: string;
  isHiddenGem: boolean;
  isSaved?: boolean;
  lat: number;
  lng: number;
  coordinateSource: "place-record" | "google-places-geocoding";
};

export type MissingMapPlace = {
  id: string;
  label: string;
  location: string;
  reason: string;
};

export type MapRoute = {
  center: { lat: number; lng: number };
  zoom: number;
  pins: MapPin[];
  missingPlaces: MissingMapPlace[];
  routePins: MapPin[];
  segments: MapSegment[];
  routeNote: string;
  distanceMeters?: number;
  duration?: string;
  encodedPolyline?: string;
  metricSource: "google-routes" | "computed" | "unavailable";
  isMock: boolean;
  provider: "google-maps" | "not-connected";
};

export type MapSegment = {
  origin: string;
  destination: string;
  distanceMeters?: number;
  duration?: string;
  metricSource: "computed";
};

const fallbackCenter = { lat: 37.9838, lng: 23.7275 };

export async function getMapRoute(places: PlaceRecommendation[]): Promise<MapRoute> {
  const resolved = await Promise.all(places.map(resolvePin));
  const pins = resolved.filter((item): item is MapPin => "lat" in item);
  const missingPlaces = resolved.filter((item): item is MissingMapPlace => !("lat" in item));
  const center = centerFromPins(pins);
  const zoom = zoomFromPins(pins);
  const routePins = selectRoutePins(pins);
  const segments = buildRouteSegments(routePins);
  const route = await computeGoogleRoute(routePins);

  if (route) {
    return {
      center,
      zoom,
      pins,
      missingPlaces,
      routePins,
      segments,
      routeNote: `Google Routes total across ${routePins.length} mapped stops.`,
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      encodedPolyline: route.encodedPolyline,
      metricSource: "google-routes",
      isMock: false,
      provider: "google-maps",
    };
  }

  const fallback = estimateRoute(routePins);
  const hasRouteablePins = routePins.length > 1;
  return {
    center,
    zoom,
    pins,
    missingPlaces,
    routePins,
    segments,
    routeNote: process.env.GOOGLE_MAPS_API_KEY
      ? hasRouteablePins
        ? "Mapped pins are real. Total route distance is a computed estimate because Google Routes is unavailable."
        : "Mapped pins are real. Route unavailable until at least two places have coordinates."
      : hasRouteablePins
        ? "Mapped pins are real provider coordinates. Google Routes is not connected, so route totals are computed estimates."
        : "Route unavailable until at least two places have coordinates.",
    distanceMeters: fallback.distanceMeters,
    duration: fallback.duration,
    metricSource: hasRouteablePins ? "computed" : "unavailable",
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

async function resolvePin(place: PlaceRecommendation): Promise<MapPin | MissingMapPlace> {
  if (isCoordinate(place.coordinates?.lat) && isCoordinate(place.coordinates?.lng)) {
    return {
      id: place.id,
      label: place.name,
      category: place.category,
      location: place.location,
      isHiddenGem: place.isHiddenGem,
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      coordinateSource: "place-record",
    };
  }

  const geocoded = await geocodePlace(place);
  if (geocoded) {
    return {
      id: place.id,
      label: place.name,
      category: place.category,
      location: place.location,
      isHiddenGem: place.isHiddenGem,
      lat: geocoded.lat,
      lng: geocoded.lng,
      coordinateSource: "google-places-geocoding",
    };
  }

  return {
    id: place.id,
    label: place.name,
    location: place.location,
    reason: "No provider coordinates found.",
  };
}

async function geocodePlace(place: PlaceRecommendation) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({
        textQuery: `${place.name} ${place.location}`,
        maxResultCount: 1,
        languageCode: "en",
      }),
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return null;
    const data = GoogleTextSearchResponseSchema.parse(await response.json());
    const location = data.places[0]?.location;
    if (!isCoordinate(location?.latitude) || !isCoordinate(location?.longitude)) return null;
    return { lat: location.latitude, lng: location.longitude };
  } catch {
    return null;
  }
}

function isCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
  return routeable.slice(0, 6);
}

function buildRouteSegments(pins: MapPin[]): MapSegment[] {
  return pins.slice(1).map((destination, index) => {
    const origin = pins[index];
    const distanceMeters = Math.round(haversineMeters(origin, destination) * 1.28);
    const durationSeconds = Math.round(distanceMeters / 1.25);
    return {
      origin: origin.label,
      destination: destination.label,
      distanceMeters,
      duration: `${durationSeconds}s`,
      metricSource: "computed",
    };
  });
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
  const lats = pins.map((pin) => pin.lat);
  const lngs = pins.map((pin) => pin.lng);
  const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
  if (spread > 4) return 6;
  if (spread > 1) return 8;
  if (spread > 0.3) return 10;
  return 12;
}

function markerColor(category: string) {
  const lower = category.toLowerCase();
  if (/restaurant|cafe|food/.test(lower)) return "red";
  if (/hidden/.test(lower)) return "purple";
  if (/museum|culture|history/.test(lower)) return "blue";
  return "green";
}

function markerLabel(index: number) {
  return String.fromCharCode(65 + (index % 26));
}
