import { ItineraryWorkspace } from "@/components/travel/itinerary-workspace";
import { getPrimaryTrip, toItineraryDays, toSelectedPlaceRecommendations, toTripDraft } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function ItineraryPage() {
  const trip = await getPrimaryTrip();
  const days = trip ? toItineraryDays(trip) : [];
  const selectedPlaces = trip ? toSelectedPlaceRecommendations(trip) : [];
  const tripDraft = trip ? toTripDraft(trip) : null;
  const shouldAutoGenerate = selectedPlaces.length > 0 && (days.length === 0 || days.every((day) => day.theme === "Start with saved places" && day.notes.includes("Created automatically when a Discover place was added.")));

  return <ItineraryWorkspace trip={tripDraft} initialDays={days} selectedPlaces={selectedPlaces} shouldAutoGenerate={shouldAutoGenerate} />;
}
