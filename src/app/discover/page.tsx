import { DiscoverWorkspace } from "@/components/travel/discover-workspace";
import {
  getPrimaryTrip,
  toDestinationIntel,
  toDestinationRecommendations,
  toPlaceRecommendations,
  toSelectedPlaceRecommendations,
  toTripDraft,
} from "@/lib/db/travel";
import { getWeatherSummary } from "@/lib/api/weatherService";

export const dynamic = "force-dynamic";

// refreshPlacesFromProvider (invoked as a Server Action from this page) runs
// ~20-30s of provider calls plus a multi-row save. Vercel Hobby's default
// function timeout is 10s, so this must be raised explicitly (60s is the
// Hobby max) or the action gets killed mid-refresh.
export const maxDuration = 60;

export default async function DiscoverPage() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const destinations = dbTrip ? toDestinationRecommendations(dbTrip) : [];
  const livePlaces = dbTrip ? toPlaceRecommendations(dbTrip) : [];
  const selectedPlaces = dbTrip ? toSelectedPlaceRecommendations(dbTrip) : [];
  const intelligence = dbTrip ? toDestinationIntel(dbTrip) : null;
  const places = mergePlaces(livePlaces, selectedPlaces);
  const selectedIds = new Set(selectedPlaces.map((place) => place.id));
  
  const itineraryDays = dbTrip ? dbTrip.itineraryDays.map(day => ({
    id: day.id,
    date: day.date.toISOString().slice(0, 10),
    theme: day.theme,
  })) : [];

  const usedPlaceRecommendationIds = new Set<string>();
  dbTrip?.itineraryDays.forEach(day => {
    day.items.forEach(item => {
      if (item.placeRecommendationId) usedPlaceRecommendationIds.add(item.placeRecommendationId);
    });
  });

  const destination = trip?.destination || trip?.destinationCountry || "";
  const weather = destination ? await getWeatherSummary(destination) : null;

  return (
    <DiscoverWorkspace 
      trip={trip} 
      places={places} 
      destinations={destinations} 
      selectedIds={selectedIds} 
      intelligence={intelligence} 
      itineraryDays={itineraryDays}
      usedPlaceRecommendationIds={usedPlaceRecommendationIds}
      weather={weather}
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
