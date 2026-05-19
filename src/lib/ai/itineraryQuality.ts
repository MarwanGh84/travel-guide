import { normalizeName } from "@/lib/utils";
import type { QualitySummary, ItineraryDay, PlaceRecommendation } from "@/lib/types/travel";

export const REPEATABLE_CATEGORIES = ["hotel", "stay", "accommodation", "airport", "station", "base", "transport"];

export function canonicalizeDayWithQuality(
  day: ItineraryDay,
  planningPlaces: PlaceRecommendation[],
  recommendationsById: Map<string, PlaceRecommendation>,
  recommendationsByName: Map<string, PlaceRecommendation>,
  usedNonRepeatableIds: Set<string>,
  qualitySummary: QualitySummary,
  pace: string
) {
  const matchedPlaces: PlaceRecommendation[] = [];
  const duplicateIdsThisDay = new Set<string>();
  
  // 1. Map by ID first (strongest link)
  const ids = day.placeIds || [];
  for (const id of ids) {
    const place = recommendationsById.get(id);
    if (place) {
      const isRepeatable = REPEATABLE_CATEGORIES.some(c => place.category.toLowerCase().includes(c));
      if (!isRepeatable && usedNonRepeatableIds.has(place.id)) {
        if (!duplicateIdsThisDay.has(place.id)) {
          qualitySummary.duplicateCount++;
          qualitySummary.repairedDuplicateCount++;
          duplicateIdsThisDay.add(place.id);
        }
        continue; // Skip duplicate
      }
      if (!isRepeatable) usedNonRepeatableIds.add(place.id);
      matchedPlaces.push(place);
      qualitySummary.mappedPlaceCount++;
    }
  }

  // 2. Map by Name (second strongest link, only if ID not already matched)
  const names = day.placesIncluded || [];
  for (const name of names) {
    const place = recommendationsByName.get(normalizeName(name));
    if (place && !matchedPlaces.some(p => p.id === place.id)) {
      const isRepeatable = REPEATABLE_CATEGORIES.some(c => place.category.toLowerCase().includes(c));
      if (!isRepeatable && usedNonRepeatableIds.has(place.id)) {
        if (!duplicateIdsThisDay.has(place.id)) {
          qualitySummary.duplicateCount++;
          qualitySummary.repairedDuplicateCount++;
          duplicateIdsThisDay.add(place.id);
        }
        continue; // Skip duplicate
      }
      if (!isRepeatable) usedNonRepeatableIds.add(place.id);
      matchedPlaces.push(place);
      qualitySummary.mappedPlaceCount++;
    }
  }

  // 3. AI-only points (no match)
  const totalProvided = (day.placeIds?.length ?? 0) + (day.placesIncluded?.length ?? 0);
  if (matchedPlaces.length < totalProvided) {
    qualitySummary.aiOnlyPointCount += (totalProvided - matchedPlaces.length);
  }

  // 4. Pace limit
  const maxPlaces = pace === "relaxed" ? 3 : pace === "medium" ? 5 : 8;
  if (matchedPlaces.length > maxPlaces) {
    matchedPlaces.splice(maxPlaces);
    qualitySummary.warnings.push(`Day ${day.date} exceeded pace limit for "${pace}".`);
  }

  // 5. Fallback if empty and we have planning places
  if (matchedPlaces.length === 0 && planningPlaces.length > 0) {
     const available = planningPlaces.filter(p => !usedNonRepeatableIds.has(p.id) || REPEATABLE_CATEGORIES.some(c => p.category.toLowerCase().includes(c)));
     if (available.length > 0) {
        const fallback = available.slice(0, 3);
        fallback.forEach(f => {
          const isRepeatable = REPEATABLE_CATEGORIES.some(c => f.category.toLowerCase().includes(c));
          if (!isRepeatable) usedNonRepeatableIds.add(f.id);
          matchedPlaces.push(f);
        });
        qualitySummary.warnings.push(`Day ${day.date} was empty. Added fallback places.`);
     }
  }

  return matchedPlaces;
}
