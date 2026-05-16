import type { PlaceRecommendation } from "@/lib/types/travel";

export function imageForDestination(destination?: string | null, country?: string | null, width = 1200, height = 800) {
  const query = [destination, country].filter(Boolean).join(", ").trim();
  return photoUrl(query || "scenic travel landscape", width, height);
}

export function imageForPlace(place?: Pick<PlaceRecommendation, "name" | "location"> | null, width = 800, height = 600) {
  const query = [place?.name, place?.location].filter(Boolean).join(", ").trim();
  return photoUrl(query || "scenic travel landscape", width, height);
}

function photoUrl(query: string, width: number, height: number) {
  const params = new URLSearchParams({
    query,
    width: String(width),
    height: String(height),
  });
  return `/api/media/photo?${params.toString()}`;
}
