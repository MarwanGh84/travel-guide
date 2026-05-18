import { PrimaryTrip, toSelectedPlaceRecommendations, toPlaceRecommendations } from "@/lib/db/travel";
import { StayZoneRecommendation, HotelSearchSuggestion } from "@/lib/types/stays";
import { clusterItineraryPoints, Cluster } from "./itineraryClustering";
import { normalizeName } from "@/lib/utils";
import { PlaceRecommendation } from "@/lib/types/travel";
import { searchLiveHotels } from "../api/hotelsService";

/**
 * Stay Recommendation Service.
 * Analyzes trip context and POI clusters to recommend logical stay areas.
 */
export async function getStayRecommendations(trip: PrimaryTrip): Promise<{
  strategy: string;
  zones: StayZoneRecommendation[];
  searchSuggestions: HotelSearchSuggestion[];
}> {
  // 1. Gather all potential points from Saved Places and the Itinerary itself
  const savedPlaces = toSelectedPlaceRecommendations(trip).filter(p => !!p.coordinates);
  
  // 2. Extract points mentioned in the itinerary by matching titles to available recommendations
  const allRecommendations = toPlaceRecommendations(trip);
  const recommendationsByName = new Map(allRecommendations.map(r => [normalizeName(r.name), r]));
  
  const itineraryPoints: PlaceRecommendation[] = [];
  const seenIds = new Set(savedPlaces.map(p => p.id));

  trip.itineraryDays.forEach((day) => {
    day.items.forEach((item) => {
      // Prioritize direct relation if present
      if (item.placeRecommendation?.latitude && item.placeRecommendation?.longitude) {
        const id = item.placeRecommendation.id;
        if (!seenIds.has(id)) {
          const p = item.placeRecommendation;
          itineraryPoints.push({
             id: p.id,
             name: p.name,
             category: p.category,
             description: p.description,
             rating: p.rating ?? undefined,
             costLevel: "$$",
             location: p.location,
             coordinates: { lat: p.latitude as number, lng: p.longitude as number },
             openingStatus: p.openingStatus ?? undefined,
             whyRecommended: p.whyRecommended,
             isHiddenGem: p.isHiddenGem,
             hiddenGemScore: p.hiddenGemScore,
             source: { provider: p.source, isMock: false, note: "" },
          });
          seenIds.add(id);
        }
        return;
      }

      // Fallback to name matching
      const match = recommendationsByName.get(normalizeName(item.title));
      if (match && match.coordinates && !seenIds.has(match.id)) {
        itineraryPoints.push(match);
        seenIds.add(match.id);
      }
    });
  });

  const combinedPoints = [...savedPlaces, ...itineraryPoints];
  const clusters = clusterItineraryPoints(combinedPoints);
  
  if (!clusters.length) {
    return {
      strategy: "No mapped itinerary points found to calculate stay strategy. Recommended staying near the city center for maximum accessibility.",
      zones: [],
      searchSuggestions: [
        { label: "Boutique hotels", query: `Boutique hotels in ${trip.destination}`, area: trip.destination || "" },
        { label: "Top rated stays", query: `Best hotels in ${trip.destination}`, area: trip.destination || "" },
      ]
    };
  }

  const mainCluster = clusters[0];
  const strategy = `Based on your ${trip.itineraryDays.length} planned days, we recommend staying in or near the ${mainCluster.points[0].name} area to minimize daily transit. This zone contains ${mainCluster.weight} mapped itinerary places.`;

  const checkin = trip.startDate.toISOString().slice(0, 10);
  const checkout = trip.endDate.toISOString().slice(0, 10);

  const zones: StayZoneRecommendation[] = await Promise.all(clusters.map(async (cluster, index) => {
    // For each cluster center, fetch live hotels
    const inventory = await searchLiveHotels(
      cluster.center.lat,
      cluster.center.lng,
      checkin,
      checkout,
      trip.travelerCount
    );
    const hotels = rankHotelsByItineraryFit(inventory.hotels, cluster);

    const averageDistanceKm = averageDistanceFromCenter(cluster);

    return {
      id: cluster.id,
      areaName: cluster.points[0].name || "Primary Cluster",
      destination: trip.destination || "",
      country: trip.destinationCountry || "",
      reason: index === 0 
        ? `${cluster.weight} mapped itinerary places in this zone.` 
        : `Secondary cluster providing access to ${cluster.points[0].name}.`,
      bestFor: inferBestFor(cluster, trip.travelStyle),
      nearbyPlaces: cluster.points.map(p => p.name),
      averageDistanceKm,
      budgetFit: inferBudgetFit(trip.budget, trip.itineraryDays.length),
      pros: [
        "Walkable to major planned spots",
        "Highly efficient for your pace",
      ],
      cons: index === 0 ? ["Can be busy/touristy"] : ["Further from some outliers"],
      confidenceScore: parseFloat((0.9 - (index * 0.1)).toFixed(2)),
      latitude: cluster.center.lat,
      longitude: cluster.center.lng,
      source: "itinerary-analysis",
      hotels,
      hotelInventoryStatus: inventory.status,
      hotelInventoryMessage: inventory.message,
    };
  }));

  const searchSuggestions: HotelSearchSuggestion[] = zones.flatMap((zone) => [
    {
      label: `Hotels near ${zone.areaName}`,
      query: `Hotels near ${zone.areaName} ${zone.destination}`,
      area: zone.areaName,
    },
    {
      label: `Boutique stays near ${zone.areaName}`,
      query: `Boutique stays near ${zone.areaName} ${zone.destination}`,
      area: zone.areaName,
    },
    {
      label: `Sea-view stays in ${zone.destination}`,
      query: `Sea-view stays in ${zone.destination}`,
      area: zone.areaName,
    },
  ]);

  return {
    strategy,
    zones,
    searchSuggestions
  };
}

function averageDistanceFromCenter(cluster: Cluster) {
  if (!cluster.points.length) return undefined;
  const distances = cluster.points
    .map((point) => point.coordinates)
    .filter((coordinates): coordinates is { lat: number; lng: number } => Boolean(coordinates))
    .map((coordinates) => haversineKm(cluster.center, coordinates));
  if (!distances.length) return undefined;
  return Number((distances.reduce((sum, value) => sum + value, 0) / distances.length).toFixed(1));
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function rankHotelsByItineraryFit(hotels: StayZoneRecommendation["hotels"], cluster: Cluster) {
  return hotels
    .map((hotel) => {
      if (!hotel.coordinates) return hotel;
      const pointDistances = cluster.points
        .filter((point) => point.coordinates)
        .map((point) => ({
          name: point.name,
          distanceKm: haversineKm(hotel.coordinates!, point.coordinates!),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      const averageItineraryDistanceKm = pointDistances.length
        ? Number((pointDistances.reduce((sum, point) => sum + point.distanceKm, 0) / pointDistances.length).toFixed(1))
        : undefined;
      return {
        ...hotel,
        distanceKm: Number(haversineKm(cluster.center, hotel.coordinates).toFixed(1)),
        averageItineraryDistanceKm,
        nearestItineraryPlace: pointDistances[0]?.name,
      };
    })
    .sort((a, b) => {
      const itineraryDistanceDelta =
        (a.averageItineraryDistanceKm ?? Number.POSITIVE_INFINITY) -
        (b.averageItineraryDistanceKm ?? Number.POSITIVE_INFINITY);
      if (itineraryDistanceDelta !== 0) return itineraryDistanceDelta;
      const distanceDelta = (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      if (distanceDelta !== 0) return distanceDelta;
      return (b.rating ?? -1) - (a.rating ?? -1);
    });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function inferBestFor(cluster: Cluster, style: string): string[] {
  const categories = cluster.points.map(p => p.category.toLowerCase());
  const bestFor = ["Walkability"];
  
  if (categories.some(c => /restaurant|cafe|food/i.test(c))) bestFor.push("Dining");
  if (categories.some(c => /museum|culture|historic/i.test(c))) bestFor.push("Culture");
  if (style === "luxury") bestFor.push("Premium services");
  if (style === "family") bestFor.push("Family friendly");
  
  return Array.from(new Set(bestFor));
}

function inferBudgetFit(totalBudget: number, days: number): "low" | "medium" | "high" | "luxury" {
  if (days === 0) return "medium";
  const daily = totalBudget / days;
  if (daily < 100) return "low";
  if (daily < 250) return "medium";
  if (daily < 600) return "high";
  return "luxury";
}
