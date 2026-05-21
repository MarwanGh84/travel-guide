import { describe, it, expect } from "vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { computeBudgetIntelligence } from "../src/lib/travel/budget-intelligence";
import { PrimaryTrip } from "../src/lib/db/travel";

describe("Budget Intelligence", () => {
  const mockTrip: any = {
    id: "trip-1",
    budget: 1000,
    currency: "USD",
    status: "planning",
    startDate: new Date("2026-05-19T00:00:00Z"),
    endDate: new Date("2026-05-21T00:00:00Z"),
    travelerCount: 1,
    pace: "medium",
    itineraryDays: [],
    bookings: [],
    expenses: [],
  };

  it("warns when itinerary is not approved", () => {
    const intelligence = computeBudgetIntelligence(mockTrip as PrimaryTrip);
    expect(intelligence.itineraryApproved).toBe(false);
    expect(intelligence.warnings).toContain("No approved itinerary, auto budget unavailable.");
  });

  it("generates estimate categories for approved itinerary", () => {
    const approvedTrip = {
      ...mockTrip,
      status: "itinerary_approved",
      itineraryDays: [
        { id: "d1", items: [{ id: "i1", title: "Eiffel Tower", placeRecommendationId: "p1" }] },
        { id: "d2", items: [{ id: "i2", title: "Louvre", placeRecommendationId: "p2" }] },
      ]
    };
    const intelligence = computeBudgetIntelligence(approvedTrip as PrimaryTrip);
    expect(intelligence.itineraryApproved).toBe(true);
    expect(intelligence.estimates.some(e => e.category === "food")).toBe(true);
    expect(intelligence.estimates.some(e => e.category === "activities")).toBe(true);
    expect(intelligence.totalEstimatedMid).toBeGreaterThan(0);
  });

  it("lowers confidence when AI-only points exist", () => {
    const approvedTrip = {
      ...mockTrip,
      status: "itinerary_approved",
      itineraryDays: [
        { id: "d1", items: [{ id: "i1", title: "Unknown Park", placeRecommendationId: null }] },
      ]
    };
    const intelligence = computeBudgetIntelligence(approvedTrip as PrimaryTrip);
    const activityEst = intelligence.estimates.find(e => e.category === "activities");
    expect(activityEst?.confidence).toBe("low");
    expect(intelligence.warnings.some(w => w.includes("AI-only points"))).toBe(true);
  });

  it("detects hotel expenses and uses them as high confidence accommodation estimate", () => {
    const approvedTrip = {
      ...mockTrip,
      status: "itinerary_approved",
      expenses: [{ id: "e1", category: "Hotel", amount: 500 }],
    };
    const intelligence = computeBudgetIntelligence(approvedTrip as PrimaryTrip);
    const hotelEst = intelligence.estimates.find(e => e.category === "accommodation");
    expect(hotelEst?.estimatedMid).toBe(500);
    expect(hotelEst?.source).toBe("booking");
    expect(hotelEst?.confidence).toBe("high");
  });

  it("warns when budget is exceeded", () => {
    const brokenTrip = {
      ...mockTrip,
      expenses: [{ id: "e1", category: "General", amount: 1500 }],
    };
    const intelligence = computeBudgetIntelligence(brokenTrip as PrimaryTrip);
    expect(intelligence.warnings).toContain("Actual spend exceeds trip budget!");
  });

  it("applies cost multiplier for low-cost destinations (e.g. Thailand)", () => {
    const thailandTrip = {
      ...mockTrip,
      status: "itinerary_approved",
      destinationCountry: "Thailand",
      itineraryDays: [{ id: "d1", items: [{ id: "i1", title: "Temple", placeRecommendationId: "p1" }] }]
    };
    const intelligence = computeBudgetIntelligence(thailandTrip as PrimaryTrip);
    const foodEst = intelligence.estimates.find(e => e.category === "food");
    // Base is 40, Thailand is 0.4. 40 * 0.4 = 16.
    // 3 meals * 16 * 3 days * 1 traveler = 144.
    expect(foodEst?.estimatedMid).toBe(144);
    expect(foodEst?.explanation).toContain("0.4x");
  });

  it("applies cost multiplier for high-cost destinations (e.g. Switzerland)", () => {
    const swissTrip = {
      ...mockTrip,
      status: "itinerary_approved",
      destinationCountry: "Switzerland",
      itineraryDays: [{ id: "d1", items: [{ id: "i1", title: "Mountain", placeRecommendationId: "p1" }] }]
    };
    const intelligence = computeBudgetIntelligence(swissTrip as PrimaryTrip);
    const foodEst = intelligence.estimates.find(e => e.category === "food");
    // Base is 40, Switzerland is 1.5. 40 * 1.5 = 60.
    // 3 meals * 60 * 3 days * 1 traveler = 540.
    expect(foodEst?.estimatedMid).toBe(540);
    expect(foodEst?.explanation).toContain("1.5x");
  });
});
