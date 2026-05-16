import { NormalizedPlace } from "@/lib/types/sources";
import { GoogleTextSearchResponseSchema } from "@/lib/validation/schemas";

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
  websiteUri?: string;
  userRatingCount?: number;
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
  "places.websiteUri",
  "places.userRatingCount",
].join(",");

const blockedTypePattern =
  /photographer|photography_service|real_estate|store|doctor|dentist|lawyer|school|university|lodging|car_rental|travel_agency|gym|beauty_salon|hair_care|insurance_agency|bank|atm|gas_station|parking|association|organization/i;

const genericNamePattern =
  /^(viewpoint|restaurant|cafe|museum|garden)$/i;

const blockedNamePattern =
  /photographer|photoshoot|photo shoot|studio photographer|wedding photographer|portrait|corporate|real estate|agency/i;

export async function searchGooglePlaces(query: string): Promise<NormalizedPlace[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

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
        maxResultCount: 10,
        languageCode: "en",
      }),
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      console.error(`Google Places API Error (${response.status})`);
      return [];
    }

    const data = GoogleTextSearchResponseSchema.parse(await response.json());
    return (data.places ?? []).filter(isTravelPlace).map(mapGooglePlace);
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

function mapGooglePlace(place: GooglePlace): NormalizedPlace {
  const category = place.primaryTypeDisplayName?.text ?? place.types?.[0]?.replaceAll("_", " ") ?? "Place";
  const name = place.displayName?.text ?? "Unnamed place";
  const description = place.editorialSummary?.text;
  
  return {
    source: "google",
    sourceId: place.id || `${name}-${place.formattedAddress}`,
    name,
    category,
    description,
    address: place.formattedAddress,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    website: place.websiteUri,
    confidenceScore: 0.95,
    hiddenGemScore: initialHiddenGemScore(place, description || ""),
    raw: place
  };
}

function initialHiddenGemScore(place: GooglePlace, description: string) {
  const ratingScore = place.rating ? Math.round((place.rating - 4.1) * 10) : 0;
  const localScore = /hidden|local|neighborhood|authentic|quiet|viewpoint|garden|independent|cultural/i.test(
    `${description} ${place.types?.join(" ")}`,
  ) ? 24 : 8;
  const famousPenalty = /tourist_attraction|landmark|museum/i.test(place.types?.join(" ") ?? "") ? 12 : 0;
  const restaurantPenalty = /restaurant|cafe|bar/i.test(place.types?.join(" ") ?? "") ? 5 : 0;
  return Math.max(30, Math.min(92, 40 + ratingScore + localScore - famousPenalty - restaurantPenalty));
}
