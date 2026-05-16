import { InteractiveMap } from "@/components/travel/interactive-map";
import { getMapRoute } from "@/lib/api/mapsService";
import { getPrimaryTrip, toPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const trip = await getPrimaryTrip();
  const placeRecommendations = trip ? toPlaceRecommendations(trip) : [];
  const route = await getMapRoute(placeRecommendations);
  const mapImageBaseUrl = route.provider === "google-maps" ? "/api/maps/static?width=920&height=540&markers=false&route=false" : null;

  return <InteractiveMap route={route} mapImageBaseUrl={mapImageBaseUrl} />;
}
