import { NormalizedPlace } from "@/lib/types/sources";

/**
 * Foursquare Places as an additional discovery source.
 *
 * Foursquare venue data and user "tips" are genuinely different from Google's
 * editorial summaries — tips are short notes from real visitors, which is much
 * closer to hidden-gem intelligence. Requires FOURSQUARE_API_KEY; without it
 * this source returns nothing (no fake data), matching the rest of the pipeline.
 */

type FoursquarePlace = {
  fsq_id?: string;
  name?: string;
  rating?: number; // 0-10 scale
  price?: number;
  categories?: Array<{ name?: string }>;
  location?: { formatted_address?: string; locality?: string };
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  description?: string;
  popularity?: number;
};

type FoursquareSearchResponse = {
  results?: FoursquarePlace[];
};

const FSQ_BASE = "https://api.foursquare.com/v3/places";

export function isFoursquareConfigured() {
  return Boolean(process.env.FOURSQUARE_API_KEY);
}

export async function searchFoursquarePlaces(destination: string, interests: string[] = []): Promise<NormalizedPlace[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey || !destination) return [];

  const query = interests.length > 0 ? interests.slice(0, 3).join(" ") : "things to do";

  try {
    const params = new URLSearchParams({
      query,
      near: destination,
      limit: "20",
      sort: "RATING",
    });
    const response = await fetch(`${FSQ_BASE}/search?${params.toString()}`, {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      console.error(`Foursquare API Error (${response.status})`);
      return [];
    }

    const data = (await response.json()) as FoursquareSearchResponse;
    return (data.results ?? [])
      .filter((place) => Boolean(place.name && place.geocodes?.main))
      .map(mapFoursquarePlace);
  } catch (error) {
    console.error("Fetch error while calling Foursquare:", error);
    return [];
  }
}

function mapFoursquarePlace(place: FoursquarePlace): NormalizedPlace {
  const category = place.categories?.[0]?.name ?? "Place";
  const rating = typeof place.rating === "number" ? Math.round((place.rating / 2) * 10) / 10 : undefined;
  return {
    source: "foursquare",
    sourceId: place.fsq_id || `${place.name}`,
    name: place.name ?? "Unnamed place",
    category,
    description: place.description,
    address: place.location?.formatted_address ?? place.location?.locality,
    latitude: place.geocodes?.main?.latitude,
    longitude: place.geocodes?.main?.longitude,
    rating,
    confidenceScore: 0.8,
    hiddenGemScore: foursquareGemScore(place),
    raw: place,
  };
}

function foursquareGemScore(place: FoursquarePlace): number {
  const rating = typeof place.rating === "number" ? place.rating : 0; // 0-10
  const ratingScore = rating > 0 ? Math.round((rating - 8) * 6) : 0;
  // Lower popularity = more of a local secret; popularity is 0-1.
  const popularity = typeof place.popularity === "number" ? place.popularity : 0.5;
  const lowProfileBoost = popularity < 0.6 ? 18 : 6;
  return Math.max(40, Math.min(90, 60 + ratingScore + lowProfileBoost));
}
