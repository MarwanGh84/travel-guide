import { PlaceRecommendation } from "@/lib/types/travel";

export type Cluster = {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  points: PlaceRecommendation[];
  weight: number; // based on number of days or visits
};

/**
 * Geographic POI Clustering logic.
 * Group itinerary points based on proximity to find logical stay zones.
 */
export function clusterItineraryPoints(points: PlaceRecommendation[]): Cluster[] {
  if (!points.length) return [];

  // Simple distance-based clustering (K-Means simplified or DBScan-lite)
  // For travel, usually 2-3km is a logical "neighborhood" cluster
  const CLUSTER_RADIUS_KM = 3;
  const clusters: Cluster[] = [];

  points.forEach((point) => {
    if (!point.coordinates) return;

    let joined = false;
    for (const cluster of clusters) {
      const dist = calculateDistance(
        point.coordinates.lat,
        point.coordinates.lng,
        cluster.center.lat,
        cluster.center.lng
      );

      if (dist <= CLUSTER_RADIUS_KM) {
        cluster.points.push(point);
        // Recalculate center
        cluster.center = {
          lat: cluster.points.reduce((sum, p) => sum + (p.coordinates?.lat || 0), 0) / cluster.points.length,
          lng: cluster.points.reduce((sum, p) => sum + (p.coordinates?.lng || 0), 0) / cluster.points.length,
        };
        cluster.weight = cluster.points.length;
        joined = true;
        break;
      }
    }

    if (!joined) {
      clusters.push({
        id: `cluster-${clusters.length + 1}`,
        name: point.category || "Discovery Zone",
        center: { lat: point.coordinates.lat, lng: point.coordinates.lng },
        points: [point],
        weight: 1,
      });
    }
  });

  return clusters.sort((a, b) => b.weight - a.weight);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
