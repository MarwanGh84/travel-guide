import { StaysWorkspace } from "@/components/travel/stays-workspace";
import { getPrimaryTrip } from "@/lib/db/travel";
import { getStayRecommendations } from "@/lib/stays/stayRecommendationService";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaysPage() {
  const trip = await getPrimaryTrip();
  
  if (!trip) {
    redirect("/trips");
  }
  if (trip.status !== "itinerary_approved" || !trip.itineraryApprovedAt) {
    redirect("/itinerary");
  }

  // Calculate stay recommendations based on itinerary clustering
  const { strategy, zones, searchSuggestions } = await getStayRecommendations(trip);

  return (
    <StaysWorkspace 
      strategy={strategy}
      zones={zones}
      searchSuggestions={searchSuggestions}
      destination={trip.destination || "Unknown"}
    />
  );
}
