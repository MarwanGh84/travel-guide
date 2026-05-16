import { DiscoverWorkspace } from "@/components/travel/discover-workspace";
import { getPrimaryTrip, toDestinationRecommendations, toPlaceRecommendations, toTripDraft } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const destinations = dbTrip ? toDestinationRecommendations(dbTrip) : [];
  const places = dbTrip ? toPlaceRecommendations(dbTrip) : [];
  const selectedIds = new Set((dbTrip?.savedPlaces.map((place) => place.placeRecommendationId).filter(Boolean) as string[]) ?? []);

  return <DiscoverWorkspace trip={trip} places={places} destinations={destinations} selectedIds={selectedIds} />;
}
