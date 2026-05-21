import { describe, expect, it, vi, beforeEach } from "vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */

const mocks = vi.hoisted(() => ({
  getPrimaryTrip: vi.fn(),
  getOrCreateUser: vi.fn(),
  getWeatherSummary: vi.fn(),
  getExchangeRate: vi.fn(),
  prisma: {
    driveMemorySource: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../src/lib/db/travel", () => ({
  getPrimaryTrip: mocks.getPrimaryTrip,
  getOrCreateUser: mocks.getOrCreateUser,
}));

vi.mock("../src/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../src/lib/api/weatherService", () => ({
  getWeatherSummary: mocks.getWeatherSummary,
}));

vi.mock("../src/lib/api/currencyService", () => ({
  getExchangeRate: mocks.getExchangeRate,
}));

vi.mock("../src/components/travel/trip-pack-view", () => ({
  TripPackView: ({ trip, weather, exchangeRate }: any) => {
    if (!trip) return "No Trip Rendered";
    return `Trip Pack: ${trip.name}, Weather: ${weather?.summary}, Rate: ${exchangeRate?.rate}`;
  },
}));

import TripPackPage from "../src/app/trip-pack/page";

describe("Trip Pack Page Smoke Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrCreateUser.mockResolvedValue({ id: "user-1" });
    mocks.getWeatherSummary.mockResolvedValue({ summary: "Sunny" });
    mocks.getExchangeRate.mockResolvedValue({ rate: 1.2, base: "USD", quote: "EUR", source: { note: "Mock" } });
    mocks.prisma.driveMemorySource.findMany.mockResolvedValue([{ id: "drive-1", folderName: "Photos" }]);
  });

  it("renders the trip pack with all sections", async () => {
    mocks.getPrimaryTrip.mockResolvedValue({
      id: "trip-1",
      name: "Paris Summer",
      destination: "Paris",
      destinationCountry: "France",
      currency: "USD",
      itineraryDays: [],
      bookings: [],
      documentNotes: [],
      bookingChecklist: [],
    });

    const result: any = await TripPackPage();
    expect(result).toBeDefined();
    expect(result.props.trip.name).toBe("Paris Summer");
    expect(result.props.weather.summary).toBe("Sunny");
    expect(result.props.exchangeRate.rate).toBe(1.2);
  });

  it("handles missing trip gracefully", async () => {
    mocks.getPrimaryTrip.mockResolvedValue(null);
    const result: any = await TripPackPage();
    expect(result.props.trip).toBeNull();
  });
});
