import type { PlaceReview } from "@/lib/types/travel";

/**
 * On-demand Google Place reviews. We don't persist the original Google place ID,
 * so we re-resolve the venue by name + location via Text Search (which can return
 * reviews in a single call) instead of a separate Place Details lookup.
 */

type GoogleReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
  relativePublishTimeDescription?: string;
};

type GoogleReviewsResponse = {
  places?: Array<{
    rating?: number;
    userRatingCount?: number;
    reviews?: GoogleReview[];
  }>;
};

export type PlaceReviewsResult = {
  ok: boolean;
  note: string;
  rating?: number;
  totalRatings?: number;
  reviews: PlaceReview[];
};

export async function getPlaceReviews(name: string, location?: string): Promise<PlaceReviewsResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { ok: false, note: "Google Places not connected.", reviews: [] };
  }
  if (!name) {
    return { ok: false, note: "Missing place name.", reviews: [] };
  }

  const query = [name, location].filter(Boolean).join(", ");

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.reviews",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1, languageCode: "en" }),
      next: { revalidate: 60 * 60 * 12 },
    });

    if (!response.ok) {
      console.error(`Google Reviews API Error (${response.status})`);
      return { ok: false, note: `Google error ${response.status}.`, reviews: [] };
    }

    const data = (await response.json()) as GoogleReviewsResponse;
    const place = data.places?.[0];
    if (!place) {
      return { ok: true, note: "No matching place found.", reviews: [] };
    }

    const reviews: PlaceReview[] = (place.reviews ?? [])
      .map((review) => ({
        author: review.authorAttribution?.displayName,
        rating: review.rating,
        text: review.text?.text ?? review.originalText?.text ?? "",
        relativeTime: review.relativePublishTimeDescription,
      }))
      .filter((review) => review.text.length > 0)
      .slice(0, 5);

    return {
      ok: true,
      note: "Live Google reviews.",
      rating: place.rating,
      totalRatings: place.userRatingCount,
      reviews,
    };
  } catch (error) {
    console.error("Fetch error while calling Google reviews:", error);
    return { ok: false, note: "Reviews request failed.", reviews: [] };
  }
}
