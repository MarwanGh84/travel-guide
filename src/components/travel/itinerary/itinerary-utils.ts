import type { PlaceRecommendation } from "@/lib/types/travel";

export function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }).toUpperCase();
}

export function buildPlaceMapsUrl(place: PlaceRecommendation) {
  if (place.coordinates) {
    const query = `${place.coordinates.lat},${place.coordinates.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

export function buildPlaceDirectionsUrl(place: PlaceRecommendation) {
  if (place.coordinates) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.coordinates.lat},${place.coordinates.lng}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}

export function markerFromLabel(label: string) {
  if (label === "MORNING") return "08:00";
  if (label === "AFTERNOON") return "13:00";
  if (label === "EVENING") return "19:00";
  return "--:--";
}
