import { describe, it, expect, beforeEach } from "vitest";
import { canonicalizeDayWithQuality } from "../src/lib/ai/itineraryQuality";
import type { QualitySummary, ItineraryDay, PlaceRecommendation } from "../src/lib/types/travel";

describe("Itinerary Quality Engine", () => {
  let qualitySummary: QualitySummary;
  let usedNonRepeatableIds: Set<string>;
  const planningPlaces: PlaceRecommendation[] = [
    { id: "1", name: "Eiffel Tower", category: "landmark", description: "", costLevel: "$$", location: "", whyRecommended: "", isHiddenGem: false, hiddenGemScore: 0, source: { provider: "google", isMock: false, note: "" } },
    { id: "2", name: "Louvre", category: "museum", description: "", costLevel: "$$", location: "", whyRecommended: "", isHiddenGem: false, hiddenGemScore: 0, source: { provider: "google", isMock: false, note: "" } },
    { id: "3", name: "Hotel Ritz", category: "hotel", description: "", costLevel: "$$", location: "", whyRecommended: "", isHiddenGem: false, hiddenGemScore: 0, source: { provider: "google", isMock: false, note: "" } },
    { id: "4", name: "Charles de Gaulle", category: "airport", description: "", costLevel: "$$", location: "", whyRecommended: "", isHiddenGem: false, hiddenGemScore: 0, source: { provider: "google", isMock: false, note: "" } },
  ];
  const recommendationsById = new Map(planningPlaces.map(p => [p.id, p]));
  const recommendationsByName = new Map(planningPlaces.map(p => [p.name.toLowerCase(), p]));

  beforeEach(() => {
    qualitySummary = {
      duplicateCount: 0,
      repairedDuplicateCount: 0,
      mappedPlaceCount: 0,
      aiOnlyPointCount: 0,
      warnings: [],
    };
    usedNonRepeatableIds = new Set<string>();
  });

  it("prevents duplicate non-repeatable places across days", () => {
    const day1: ItineraryDay = {
      id: "d1", date: "2026-05-15", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: ["Eiffel Tower"], placeIds: ["1"], restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };
    const day2: ItineraryDay = {
      id: "d2", date: "2026-05-16", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: ["Eiffel Tower"], placeIds: ["1"], restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };

    const res1 = canonicalizeDayWithQuality(day1, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "medium");
    expect(res1).toHaveLength(1);
    expect(usedNonRepeatableIds.has("1")).toBe(true);

    const res2 = canonicalizeDayWithQuality(day2, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "medium");
    expect(res2.length).toBeGreaterThan(0); // Fallback kicked in
    expect(res2.some(p => p.id === "1")).toBe(false); // Original duplicate is gone
    expect(qualitySummary.duplicateCount).toBe(1);
    expect(qualitySummary.repairedDuplicateCount).toBe(1);
    expect(qualitySummary.warnings.some(w => w.includes("was empty"))).toBe(true);
  });

  it("allows repeating repeatable places (hotels, airports)", () => {
    const day1: ItineraryDay = {
      id: "d1", date: "2026-05-15", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: ["Hotel Ritz"], placeIds: ["3"], restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };
    const day2: ItineraryDay = {
      id: "d2", date: "2026-05-16", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: ["Hotel Ritz"], placeIds: ["3"], restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };

    const res1 = canonicalizeDayWithQuality(day1, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "medium");
    expect(res1).toHaveLength(1);

    const res2 = canonicalizeDayWithQuality(day2, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "medium");
    expect(res2).toHaveLength(1); // Repeat allowed
    expect(qualitySummary.duplicateCount).toBe(0);
  });

  it("enforces pace limits", () => {
    const day: ItineraryDay = {
      id: "d1", date: "2026-05-15", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: ["Eiffel Tower", "Louvre", "Hotel Ritz", "Charles de Gaulle"],
      placeIds: ["1", "2", "3", "4"],
      restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };
    
    // Relaxed pace limit is 3
    const res = canonicalizeDayWithQuality(day, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "relaxed");
    expect(res).toHaveLength(3);
    expect(qualitySummary.warnings).toHaveLength(1);
    expect(qualitySummary.warnings[0]).toContain("exceeded pace limit");
  });

  it("adds fallback places if day is empty", () => {
    const day: ItineraryDay = {
      id: "d1", date: "2026-05-15", theme: "Theme", morningPlan: "", afternoonPlan: "", eveningPlan: "",
      placesIncluded: [], placeIds: [], restaurantIdeas: [], hiddenGem: "", estimatedCost: 0, transportNotes: "", backupOption: "", notes: ""
    };

    const res = canonicalizeDayWithQuality(day, planningPlaces, recommendationsById, recommendationsByName, usedNonRepeatableIds, qualitySummary, "medium");
    expect(res.length).toBeGreaterThan(0);
    expect(qualitySummary.warnings[0]).toContain("was empty. Added fallback places");
  });
});
