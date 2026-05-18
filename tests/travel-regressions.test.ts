import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrimaryTrip,
  toDestinationRecommendations,
  toSelectedPlaceRecommendations,
} from "../src/lib/db/travel";
import { getCurrencyForCountry } from "../src/lib/travel/currencies";
import type { PrimaryTrip } from "../src/lib/db/travel";

const prismaMock = vi.hoisted(() => ({
  user: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  travelProfile: {
    upsert: vi.fn(),
  },
  trip: {
    findFirst: vi.fn(),
  },
}));

vi.mock("../src/lib/db/prisma", () => ({ prisma: prismaMock }));

function makeTrip(overrides: Partial<PrimaryTrip> = {}): PrimaryTrip {
  return {
    id: "trip-1",
    userId: "user-1",
    name: "Byblos trip",
    destination: "Byblos",
    destinationCountry: "Lebanon",
    departureCity: "Dubai",
    startDate: new Date("2026-05-15T12:00:00.000Z"),
    endDate: new Date("2026-05-18T12:00:00.000Z"),
    travelerCount: 2,
    budget: 1200,
    currency: "USD",
    travelStyle: "balanced",
    pace: "medium",
    interests: "history, food",
    notes: null,
    status: "planning",
    itineraryApprovedAt: null,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-02T12:00:00.000Z"),
    travelers: [],
    destinationRecommendations: [],
    placeRecommendations: [],
    savedPlaces: [],
    itineraryDays: [],
    budgetCategories: [],
    expenses: [],
    bookings: [],
    documentNotes: [],
    memories: [],
    aiLogs: [],
    apiLogs: [],
    destinationIntel: null,
    ...overrides,
  } as PrimaryTrip;
}

describe("travel regression helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.upsert.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      activeTripId: "active-trip",
    });
    prismaMock.travelProfile.upsert.mockResolvedValue({});
  });

  it("prefers the explicit active trip over a newer fallback trip", async () => {
    const activeTrip = makeTrip({ id: "active-trip" });
    prismaMock.trip.findFirst.mockResolvedValueOnce(activeTrip);

    await expect(getPrimaryTrip()).resolves.toMatchObject({ id: "active-trip" });
    expect(prismaMock.trip.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("falls back to the newest trip and repairs activeTripId when the explicit active trip is missing", async () => {
    const fallbackTrip = makeTrip({ id: "fallback-trip" });
    prismaMock.trip.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(fallbackTrip);

    await expect(getPrimaryTrip()).resolves.toMatchObject({ id: "fallback-trip" });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeTripId: "fallback-trip" },
    });
  });

  it("keeps only destination ideas inside the selected trip country", () => {
    const trip = makeTrip({
      destinationRecommendations: [
        {
          id: "lebanon-1",
          tripId: "trip-1",
          name: "Byblos",
          country: "Lebanon",
          whyItMatches: "Historic coast",
          bestThingsToDo: "Old souk",
          estimatedCost: 900,
          weatherSummary: "Mild",
          flightEstimate: null,
          hotelEstimate: null,
          pros: "Historic",
          cons: "Busy weekends",
          bestFor: "culture",
          suggestedTripDuration: "3 days",
          confidenceScore: 90,
          source: "openai",
          createdAt: new Date(),
        },
        {
          id: "cyprus-1",
          tripId: "trip-1",
          name: "Paphos",
          country: "Cyprus",
          whyItMatches: "Nearby",
          bestThingsToDo: "Harbor",
          estimatedCost: 850,
          weatherSummary: "Sunny",
          flightEstimate: null,
          hotelEstimate: null,
          pros: "Coast",
          cons: "Outside selected country",
          bestFor: "relaxation",
          suggestedTripDuration: "3 days",
          confidenceScore: 80,
          source: "openai",
          createdAt: new Date(),
        },
      ],
    });

    expect(toDestinationRecommendations(trip).map((item) => item.country)).toEqual(["Lebanon"]);
  });

  it("maps saved places through their linked provider record and preserves manual saved places", () => {
    const trip = makeTrip({
      savedPlaces: [
        {
          id: "saved-linked",
          tripId: "trip-1",
          placeRecommendationId: "place-1",
          name: "Provider copy",
          category: "Museum",
          notes: "Provider-backed",
          priority: 1,
          createdAt: new Date(),
          placeRecommendation: {
            id: "place-1",
            tripId: "trip-1",
            name: "Byblos Castle",
            category: "Historic site",
            description: "Castle",
            rating: 4.7,
            costLevel: "$$",
            location: "Byblos",
            latitude: 34.1201,
            longitude: 35.6486,
            openingStatus: "Open",
            whyRecommended: "Historic",
            hiddenGemScore: 50,
            isHiddenGem: false,
            source: "google-places",
            createdAt: new Date(),
          },
        },
        {
          id: "saved-manual",
          tripId: "trip-1",
          placeRecommendationId: null,
          name: "Family lunch",
          category: "Restaurant",
          notes: "Manual note",
          priority: 2,
          createdAt: new Date(),
          placeRecommendation: null,
        },
      ],
    });

    const selected = toSelectedPlaceRecommendations(trip);
    expect(selected[0]).toMatchObject({
      id: "place-1",
      name: "Byblos Castle",
      coordinates: { lat: 34.1201, lng: 35.6486 },
      source: { classification: "provider" },
    });
    expect(selected[1]).toMatchObject({
      id: "saved-manual",
      name: "Family lunch",
      source: { classification: "manual" },
    });
  });

  it("returns null instead of inventing a currency for an unknown country", () => {
    expect(getCurrencyForCountry("Atlantis")).toBeNull();
  });
});
