import { ItineraryWorkspace } from "@/components/travel/itinerary-workspace";
import {
  getPrimaryTrip,
  toItineraryDays,
  toPlaceRecommendations,
  toSelectedPlaceRecommendations,
  toTripDraft,
} from "@/lib/db/travel";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { computeItineraryWeatherImpact } from "@/lib/travel/weather-intelligence";

export const dynamic = "force-dynamic";

export default async function ItineraryPage() {
  const trip = await getPrimaryTrip();
  const days = trip ? toItineraryDays(trip) : [];
  const selectedPlaces = trip ? toSelectedPlaceRecommendations(trip) : [];
  const allPlaces = trip ? toPlaceRecommendations(trip) : [];
  const tripDraft = trip ? toTripDraft(trip) : null;
  const shouldAutoGenerate = selectedPlaces.length > 0 && (days.length === 0 || days.every((day) => day.theme === "Start with saved places" && day.notes.includes("Created automatically when a Discover place was added.")));

  const destination = trip?.destination || trip?.destinationCountry || "";
  const weather = destination ? await getWeatherSummary(destination) : null;
  const weatherImpact = weather ? computeItineraryWeatherImpact(days, weather) : [];

  return (
    <ItineraryWorkspace
      trip={tripDraft}
      initialDays={days}
      selectedPlaces={selectedPlaces}
      allPlaces={allPlaces}
      shouldAutoGenerate={shouldAutoGenerate}
      weather={weather}
      weatherImpact={weatherImpact}
    />
  );
}
