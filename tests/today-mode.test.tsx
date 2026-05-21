import { describe, expect, it, vi, beforeEach } from "vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */

const mocks = vi.hoisted(() => ({
  getPrimaryTrip: vi.fn(),
  getWeatherSummary: vi.fn(),
  toItineraryDays: vi.fn(),
  toPlaceRecommendations: vi.fn(),
}));

vi.mock("../src/lib/db/travel", () => ({
  getPrimaryTrip: mocks.getPrimaryTrip,
  toItineraryDays: mocks.toItineraryDays,
  toPlaceRecommendations: mocks.toPlaceRecommendations,
}));

vi.mock("../src/lib/api/weatherService", () => ({
  getWeatherSummary: mocks.getWeatherSummary,
}));

// Mock components that might cause issues in a server component test
vi.mock("../src/components/travel/nearby-ideas-card", () => ({
  NearbyIdeasCard: () => "NearbyIdeasCard",
}));

vi.mock("../src/components/travel/today-workspace", () => ({
  TodayWorkspace: () => "TodayWorkspace",
}));

import TodayPage from "../src/app/today/page";

describe("Today Mode Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default weather
    mocks.getWeatherSummary.mockResolvedValue({ 
      summary: "Sunny", 
      destination: "Paris",
      daily: [{ date: "2026-05-19", maxC: 25, minC: 15, label: "Sunny", rainChance: 0 }]
    });
    mocks.toPlaceRecommendations.mockReturnValue([]);
  });

  it("renders before trip state", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 5);

    mocks.getPrimaryTrip.mockResolvedValue({
      id: "trip-1",
      name: "Paris 2026",
      destination: "Paris",
      startDate: tomorrow,
      endDate: dayAfterTomorrow,
      bookings: [],
      documentNotes: [],
      bookingChecklist: [
        { id: "1", key: "flights", label: "Flights", status: "needed" },
        { id: "2", key: "stay", label: "Hotel", status: "needed" }
      ],
      expenses: [],
    });
    mocks.toItineraryDays.mockReturnValue([]);

    const result: any = await TodayPage();
    expect(result).toBeDefined();
    // Since it's a server component returning JSX, we check props or children if needed
    // But for smoke tests, we just want to ensure it doesn't crash and returns something
    expect(result.type).toBeDefined();
  });

  it("renders during trip state", async () => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    mocks.getPrimaryTrip.mockResolvedValue({
      id: "trip-1",
      name: "Paris 2026",
      destination: "Paris",
      startDate: today,
      endDate: today,
      bookings: [],
      documentNotes: [],
      bookingChecklist: [],
      expenses: [],
    });
    mocks.toItineraryDays.mockReturnValue([
      { date: todayStr, theme: "Eiffel Day", morningPlan: "Walk", afternoonPlan: "Eat", eveningPlan: "Sleep", places: [] }
    ]);

    const result: any = await TodayPage();
    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
  });

  it("renders after trip state", async () => {
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 10);
    const shortAgo = new Date();
    shortAgo.setDate(shortAgo.getDate() - 5);

    mocks.getPrimaryTrip.mockResolvedValue({
      id: "trip-1",
      name: "Paris 2026",
      destination: "Paris",
      startDate: longAgo,
      endDate: shortAgo,
      bookings: [],
      documentNotes: [],
      bookingChecklist: [],
      expenses: [{ amount: 100 }],
      currency: "USD",
    });
    mocks.toItineraryDays.mockReturnValue([]);

    const result: any = await TodayPage();
    expect(result).toBeDefined();
    expect(result.type).toBeDefined();
  });
});
