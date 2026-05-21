import { describe, it, expect } from "vitest";
import { computeItineraryWeatherImpact, generatePackingSuggestions, getOutdoorSuitability } from "../src/lib/travel/weather-intelligence";
import type { WeatherSummary } from "../src/lib/api/weatherService";
import type { ItineraryDay } from "../src/lib/types/travel";

describe("Weather Intelligence", () => {
  const mockWeather: WeatherSummary = {
    destination: "Paris, France",
    summary: "Clear",
    temperatureRange: "15-25 C",
    rainRisk: "Low",
    daily: [
      { date: "2026-05-19", minC: 15, maxC: 25, rainChance: 10, windSpeedKmh: 15, weatherCode: 0, label: "Clear" },
      { date: "2026-05-20", minC: 18, maxC: 35, rainChance: 50, windSpeedKmh: 45, weatherCode: 61, label: "Rain" },
      { date: "2026-05-21", minC: 20, maxC: 40, rainChance: 80, windSpeedKmh: 60, weatherCode: 95, label: "Thunderstorms" },
    ],
    source: { provider: "open-meteo", isMock: false, classification: "provider", note: "Test note" },
  };

  const mockItinerary: ItineraryDay[] = [
    {
      id: "1",
      date: "2026-05-19",
      theme: "Park Day",
      placesIncluded: ["Eiffel Tower Park", "Tuileries Garden"],
      morningPlan: "", afternoonPlan: "", eveningPlan: "", restaurantIdeas: [], estimatedCost: 0,
      hiddenGem: "", transportNotes: "", backupOption: "", notes: ""
    },
    {
      id: "2",
      date: "2026-05-20",
      theme: "Museum Day",
      placesIncluded: ["Louvre Museum", "Orsay Gallery"],
      morningPlan: "", afternoonPlan: "", eveningPlan: "", restaurantIdeas: [], estimatedCost: 0,
      hiddenGem: "", transportNotes: "", backupOption: "", notes: ""
    }
  ];

  it("computes outdoor suitability correctly", () => {
    expect(getOutdoorSuitability(mockWeather.daily[0])).toBe("Good");
    expect(getOutdoorSuitability(mockWeather.daily[1])).toBe("Better indoors"); // Due to wind and rain
    expect(getOutdoorSuitability(mockWeather.daily[2])).toBe("Better indoors"); // Due to extreme heat
  });

  it("detects itinerary weather impact", () => {
    const impact = computeItineraryWeatherImpact(mockItinerary, mockWeather);
    
    expect(impact[0].isOutdoorHeavy).toBe(true);
    expect(impact[0].risk).toBe("low");
    
    expect(impact[1].isOutdoorHeavy).toBe(false);
    expect(impact[1].risk).toBe("high"); // Rain risk 50% + High wind
    expect(impact[1].warnings).toContain("High rain risk detected.");
  });

  it("generates packing suggestions from forecast", () => {
    const suggestions = generatePackingSuggestions(mockWeather, mockItinerary, 3);
    
    const items = suggestions.map(s => s.item);
    expect(items).toContain("Umbrella / Rain shell");
    expect(items).toContain("Breathable linen / Hat"); // Due to 40C day
    expect(items).toContain("Sunscreen / Sunglasses");
  });

  it("warns about outdoor-heavy days with weather risk", () => {
    const riskyOutdoorItinerary: ItineraryDay[] = [
      {
        id: "3",
        date: "2026-05-20",
        theme: "Extreme Hike",
        placesIncluded: ["Mountain Hike", "Nature Trail"],
        morningPlan: "", afternoonPlan: "", eveningPlan: "", restaurantIdeas: [], estimatedCost: 0,
        hiddenGem: "", transportNotes: "", backupOption: "", notes: ""
      }
    ];
    
    const impact = computeItineraryWeatherImpact(riskyOutdoorItinerary, mockWeather);
    expect(impact[0].risk).toBe("high");
    expect(impact[0].warnings).toContain("Outdoor-heavy day with weather risk.");
  });
});
