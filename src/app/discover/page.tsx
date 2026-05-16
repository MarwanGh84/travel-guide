import { DiscoverWorkspace } from "@/components/travel/discover-workspace";
import {
  getPrimaryTrip,
  toDestinationIntel,
  toDestinationRecommendations,
  toPlaceRecommendations,
  toSelectedPlaceRecommendations,
  toTripDraft,
} from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const destinations = dbTrip ? toDestinationRecommendations(dbTrip) : [];
  const livePlaces = dbTrip ? toPlaceRecommendations(dbTrip) : [];
  const selectedPlaces = dbTrip ? toSelectedPlaceRecommendations(dbTrip) : [];
  const intelligence = dbTrip ? toDestinationIntel(dbTrip) : null;
  const places = mergePlaces(livePlaces, selectedPlaces);
  const selectedIds = new Set(selectedPlaces.map((place) => place.id));

  return (
    <DiscoverWorkspace 
      trip={trip} 
      places={places} 
      destinations={destinations} 
      selectedIds={selectedIds} 
      intelligence={intelligence} 
    />
  );
}

function mergePlaces(
  livePlaces: ReturnType<typeof toPlaceRecommendations>,
  selectedPlaces: ReturnType<typeof toSelectedPlaceRecommendations>,
) {
  const merged = new Map(livePlaces.map((place) => [place.id, place]));
  selectedPlaces.forEach((place) => {
    if (!merged.has(place.id)) merged.set(place.id, place);
  });
  return [...merged.values()];
}
