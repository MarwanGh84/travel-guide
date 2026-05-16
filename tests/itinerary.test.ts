import { describe, it, expect } from "vitest";
import { normalizeItineraryDays } from "../src/lib/ai/openai";
import type { TripDraft } from "../src/lib/types/travel";

const mockTrip: TripDraft = {
  name: "Test Trip",
  departureCity: "Dubai",
  startDate: "2026-05-15",
  endDate: "2026-05-17", // 3 days
  travelerCount: 1,
  budget: 1000,
  travelStyle: "balanced",
  pace: "medium",
  interests: [],
};

describe("Itinerary Generation", () => {
  it("enforces exact trip length by padding missing days", () => {
    const rawDays = [{ theme: "Day 1" }]; // Only 1 day returned by AI
    const normalized = normalizeItineraryDays(rawDays, 3, mockTrip);
    
    expect(normalized).toHaveLength(3);
    expect(normalized[0].theme).toBe("Day 1");
    expect(normalized[1].theme).toBe("Day 2 exploration");
    expect(normalized[2].theme).toBe("Day 3 exploration");
    expect(normalized[1].date).toBe("2026-05-16");
    expect(normalized[2].date).toBe("2026-05-17");
  });

  it("enforces exact trip length by trimming extra days", () => {
    const rawDays = [
      { theme: "Day 1" },
      { theme: "Day 2" },
      { theme: "Day 3" },
      { theme: "Day 4" }, // Extra day
    ];
    const normalized = normalizeItineraryDays(rawDays, 3, mockTrip);
    
    expect(normalized).toHaveLength(3);
    expect(normalized[2].theme).toBe("Day 3");
  });

  it("handles empty AI response gracefully", () => {
    const normalized = normalizeItineraryDays([], 3, mockTrip);
    expect(normalized).toHaveLength(3);
    expect(normalized[0].theme).toBe("Day 1 exploration");
  });
});
