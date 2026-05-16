import type { PlaceRecommendation, TripDraft } from "@/lib/types/travel";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  regularOpeningHours?: { openNow?: boolean };
  primaryTypeDisplayName?: { text?: string };
  editorialSummary?: { text?: string };
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
};

const fieldMask = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.priceLevel",
  "places.types",
  "places.location",
  "places.regularOpeningHours",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
].join(",");

const categoryQueries = [
  "famous attractions",
  "hidden gems",
  "local neighborhoods",
  "restaurants",
  "cafes",
  "museums",
  "viewpoints",
  "nature spots",
  "shopping areas",
  "rainy day activities",
];

const interestQueryMap: Record<string, string[]> = {
  food: ["local restaurants", "food markets", "traditional food experiences"],
  beaches: ["beaches", "coastal viewpoints"],
  nature: ["gardens", "parks", "nature spots"],
  museums: ["museums", "galleries"],
  shopping: ["shopping streets", "local markets"],
  nightlife: ["nightlife areas", "live music bars"],
  history: ["historic sites", "old town landmarks"],
  photography: ["scenic viewpoints", "photo spots", "beautiful streets"],
  "hidden gems": ["hidden gems", "lesser known places", "local favorites"],
};

const blockedTypePattern =
  /photographer|photography_service|real_estate|store|doctor|dentist|lawyer|school|university|lodging|car_rental|travel_agency|gym|beauty_salon|hair_care|insurance_agency|bank|atm|gas_station|parking|association|organization/i;

const genericNamePattern =
  /^(viewpoint|restaurant|cafe|museum|garden)$/i;

const blockedNamePattern =
  /photographer|photoshoot|photo shoot|studio photographer|wedding photographer|portrait|corporate|real estate|agency/i;

export async function getPlacesForTrip(trip: TripDraft): Promise<PlaceRecommendation[]> {
  const destinationScope = placeDestinationScope(trip);
  if (!process.env.GOOGLE_PLACES_API_KEY || !destinationScope) {
    return [];
  }

  const queries = buildPlaceQueries(trip, destinationScope);
  const results = await Promise.allSettled(queries.map((query) => searchGooglePlaces(query)));
  const places = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const deduped = dedupePlaces(places);
  if (!deduped.length) {
    return [];
  }

  return diversifyPlaces(rankHiddenGems(deduped, trip.interests), 24);
}

export function rankHiddenGems(places: PlaceRecommendation[], interests: string[]) {
  return places
    .map((place) => {
      const interestBoost = interests.some((interest) =>
        `${place.category} ${place.description}`.toLowerCase().includes(interest.toLowerCase()),
      )
        ? 8
        : 0;
      const ratingBoost = place.rating ? Math.round((place.rating - 4.2) * 8) : 0;
      const uniquenessBoost = /local|quiet|lesser|unique|scenic|cultural|residential|authentic|independent|garden|viewpoint/i.test(
        `${place.category} ${place.description} ${place.whyRecommended}`,
      )
        ? 10
        : 0;
      const famePenalty = /tower|market|monastery|factory|palace|cathedral|aquarium/i.test(place.name) ? 12 : 0;
      const restaurantPenalty = /restaurant|cafe|bar/i.test(place.category) ? 8 : 0;
      const score = Math.max(
        0,
        Math.min(96, Math.round(place.hiddenGemScore * 0.68 + interestBoost + ratingBoost + uniquenessBoost - famePenalty - restaurantPenalty)),
      );
      return {
        ...place,
        hiddenGemScore: score,
        isHiddenGem: place.isHiddenGem || score >= 75,
      };
    })
    .sort((a, b) => b.hiddenGemScore - a.hiddenGemScore);
}

function buildPlaceQueries(trip: TripDraft, destination: string) {
  const interestQueries = trip.interests
    .slice(0, 6)
    .flatMap((interest) => interestQueryMap[interest.toLowerCase()] ?? [`${interest} travel spots`])
    .map((query) => `${query} in ${destination}`);
  const baselineQueries = categoryQueries.map((category) => `${category} in ${destination}`);
  return [...new Set([...interestQueries, ...baselineQueries])].slice(0, 12);
}

function placeDestinationScope(trip: TripDraft) {
  return [trip.destination, trip.destinationCountry].filter(Boolean).join(", ").trim();
}

async function searchGooglePlaces(query: string): Promise<PlaceRecommendation[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY is missing. Skipping search for:", query);
    return [];
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 8,
        languageCode: "en",
      }),
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API Error (${response.status}):`, errorText);
      return [];
    }

    const data = (await response.json()) as GoogleTextSearchResponse;
    return (data.places ?? []).filter(isTravelPlace).map((place) => mapGooglePlace(place, query));
  } catch (error) {
    console.error("Fetch error while calling Google Places:", error);
    return [];
  }
}

function isTravelPlace(place: GooglePlace) {
  const haystack = `${place.displayName?.text ?? ""} ${place.primaryTypeDisplayName?.text ?? ""} ${place.types?.join(" ") ?? ""}`;
  if (blockedNamePattern.test(haystack) || blockedTypePattern.test(haystack)) return false;
  if (genericNamePattern.test(place.displayName?.text?.trim() ?? "")) return false;
  return Boolean(place.displayName?.text && place.formattedAddress);
}

function mapGooglePlace(place: GooglePlace, query: string): PlaceRecommendation {
  const category = toTitleCase(place.primaryTypeDisplayName?.text ?? place.types?.[0]?.replaceAll("_", " ") ?? "Place");
  const description = place.editorialSummary?.text ?? `Recommended from Google Places for "${query}".`;
  const hiddenGemScore = initialHiddenGemScore(place, query, description);
  return {
    id: place.id ?? `${place.displayName?.text}-${place.formattedAddress}`,
    name: place.displayName?.text ?? "Unnamed place",
    category,
    description,
    rating: place.rating,
    costLevel: mapPriceLevel(place.priceLevel),
    location: place.formattedAddress ?? "Location available in Google Places",
    coordinates:
      place.location?.latitude && place.location?.longitude
        ? { lat: place.location.latitude, lng: place.location.longitude }
        : undefined,
    openingStatus:
      typeof place.regularOpeningHours?.openNow === "boolean"
        ? place.regularOpeningHours.openNow
          ? "Open now"
          : "Closed now"
        : "Opening hours unavailable",
    whyRecommended: `Matched "${query}" with rating, category, and location data from Google Places.`,
    isHiddenGem: hiddenGemScore >= 75,
    hiddenGemScore,
    source: {
      provider: "google-places",
      isMock: false,
      note: "Live Google Places Text Search result.",
    },
  };
}

function initialHiddenGemScore(place: GooglePlace, query: string, description: string) {
  const ratingScore = place.rating ? Math.round((place.rating - 4.1) * 10) : 0;
  const localScore = /hidden|local|neighborhood|authentic|quiet|viewpoint|garden|independent|cultural/i.test(
    `${query} ${description} ${place.types?.join(" ")}`,
  )
    ? 24
    : 8;
  const famousPenalty = /tourist_attraction|landmark|museum/i.test(place.types?.join(" ") ?? "") ? 8 : 0;
  const restaurantPenalty = /restaurant|cafe|bar/i.test(place.types?.join(" ") ?? "") ? 10 : 0;
  return Math.max(35, Math.min(88, 46 + ratingScore + localScore - famousPenalty - restaurantPenalty));
}

function mapPriceLevel(priceLevel?: string): "$" | "$$" | "$$$" | "$$$$" {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return "$$";
  }
}

function dedupePlaces(places: PlaceRecommendation[]) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.id || `${place.name}-${place.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diversifyPlaces(places: PlaceRecommendation[], limit: number) {
  const selected: PlaceRecommendation[] = [];
  const categoryCounts = new Map<string, number>();
  const firstPassLimit = 4;

  for (const place of places) {
    const normalizedCategory = normalizeCategory(place.category);
    const count = categoryCounts.get(normalizedCategory) ?? 0;
    if (count >= firstPassLimit) continue;
    selected.push(place);
    categoryCounts.set(normalizedCategory, count + 1);
    if (selected.length >= limit) return selected;
  }

  for (const place of places) {
    if (selected.some((selectedPlace) => selectedPlace.id === place.id)) continue;
    selected.push(place);
    if (selected.length >= limit) break;
  }

  return selected;
}

function normalizeCategory(category: string) {
  if (/restaurant|seafood|brunch|cafe|bar/i.test(category)) return "food";
  if (/scenic|viewpoint|observation/i.test(category)) return "viewpoint";
  if (/museum|gallery|cultural/i.test(category)) return "culture";
  if (/garden|park|beach|nature/i.test(category)) return "nature";
  return category.toLowerCase();
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
