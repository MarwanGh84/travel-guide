import { InteractiveMap } from "@/components/travel/interactive-map";
import { getMapRoute, type MapPin } from "@/lib/api/mapsService";
import { getPrimaryTrip, toPlaceRecommendations, toRoutePlaceRecommendations, toSelectedPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const trip = await getPrimaryTrip();
  const placeRecommendations = trip ? toRoutePlaceRecommendations(trip) : [];
  const route = await getMapRoute(placeRecommendations);
  const mapImageBaseUrl = route.provider === "google-maps" ? "/api/maps/static?width=920&height=540&markers=false&route=false" : null;
  const browserMapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ?? null;

  // Map-first discovery: every recommended place with coordinates can be shown on
  // the map and saved directly from a pin, not just the ones already on the route.
  const routePinIds = new Set(route.pins.map((pin) => pin.id));
  const allPlaces = trip ? toPlaceRecommendations(trip) : [];
  const discoverPins: MapPin[] = allPlaces
    .filter((place) => place.coordinates && !routePinIds.has(place.id))
    .map((place) => ({
      id: place.id,
      label: place.name,
      category: place.category,
      location: place.location,
      isHiddenGem: place.isHiddenGem,
      lat: place.coordinates!.lat,
      lng: place.coordinates!.lng,
      photoUrl: place.photoUrl,
      coordinateSource: "place-record" as const,
      matchMethod: "recommendation" as const,
    }));

  const savedPlaceIds = trip
    ? toSelectedPlaceRecommendations(trip).map((place) => place.id)
    : [];

  return (
    <InteractiveMap
      route={route}
      mapImageBaseUrl={mapImageBaseUrl}
      browserMapApiKey={browserMapApiKey}
      discoverPins={discoverPins}
      savedPlaceIds={savedPlaceIds}
    />
  );
}
