import type { WeatherSummary } from "@/lib/api/weatherService";
import type { ItineraryDay } from "@/lib/types/travel";

export type WeatherRisk = "low" | "medium" | "high";
export type OutdoorSuitability = "Good" | "Caution" | "Better indoors" | "Unavailable";

export type ItineraryWeatherImpact = {
  date: string;
  theme: string;
  isOutdoorHeavy: boolean;
  risk: WeatherRisk;
  warnings: string[];
  suggestion?: string;
};

export interface ShuffleOption {
  targetDayId: string;
  candidateDayId: string;
  candidateTheme: string;
  reason: string;
}

export type PackingSuggestion = {
  item: string;
  reason: string;
};

const OUTDOOR_CATEGORIES = ["beach", "park", "viewpoint", "hiking", "landmark", "walking", "nature", "outdoor", "zoo", "garden"];
const INDOOR_CATEGORIES = ["museum", "gallery", "mall", "restaurant", "cafe", "hotel", "airport", "indoor", "cinema", "shopping"];

export function getOutdoorSuitability(dayForecast: WeatherSummary["daily"][number] | undefined): OutdoorSuitability {
  if (!dayForecast) return "Unavailable";

  const { maxC, rainChance, windSpeedKmh } = dayForecast;

  if (rainChance >= 50 || maxC >= 38 || maxC <= 5 || windSpeedKmh >= 45) {
    return "Better indoors";
  }

  if (rainChance >= 25 || maxC >= 32 || maxC <= 10 || windSpeedKmh >= 25) {
    return "Caution";
  }

  return "Good";
}

export function computeItineraryWeatherImpact(
  itineraryDays: ItineraryDay[],
  weather: WeatherSummary
): ItineraryWeatherImpact[] {
  return itineraryDays.map((day) => {
    const forecast = weather.daily.find((d) => d.date === day.date);
    const warnings: string[] = [];
    let risk: WeatherRisk = "low";

    const plans = `${day.theme} ${day.morningPlan} ${day.afternoonPlan} ${day.eveningPlan} ${day.placesIncluded.join(" ")}`.toLowerCase();
    
    // Check if it has outdoor keywords
    const hasOutdoorKeywords = OUTDOOR_CATEGORIES.some(cat => plans.includes(cat)) || 
                               (day.placesIncluded.filter(title => 
                                  OUTDOOR_CATEGORIES.some(cat => title.toLowerCase().includes(cat))
                               ).length >= 1);
                               
    // Check if it's explicitly indoor-heavy
    const hasIndoorKeywords = INDOOR_CATEGORIES.some(cat => plans.includes(cat)) ||
                              plans.includes("indoor");

    // If it has indoor keywords and NO outdoor keywords, it's safe. 
    // Otherwise, assume it might have outdoor exposure.
    const isOutdoorHeavy = hasOutdoorKeywords || !hasIndoorKeywords;

    if (forecast && isOutdoorHeavy) {
      if (forecast.rainChance > 40) {
        warnings.push("High rain risk detected.");
        risk = "high";
      } else if (forecast.rainChance > 20) {
        warnings.push("Moderate rain risk.");
        risk = "medium";
      }

      if (forecast.maxC > 33) {
        warnings.push("High heat risk. Stay hydrated.");
        if (risk !== "high") risk = "medium";
      }

      if (forecast.windSpeedKmh > 40) {
        warnings.push("High wind risk.");
        risk = "high";
      }
    }

    let suggestion = "";
    if (risk === "high") {
      suggestion = "Consider swapping with an indoor-heavy day or activating your backup indoor option.";
    } else if (risk === "medium") {
      suggestion = "Keep an eye on the hourly forecast and prepare accordingly.";
    }

    return {
      date: day.date,
      theme: day.theme,
      isOutdoorHeavy,
      risk,
      warnings,
      suggestion,
    };
  });
}

export function findShuffleCandidate(
  targetDayId: string,
  allDays: ItineraryDay[],
  impacts: ItineraryWeatherImpact[]
): ShuffleOption | null {
  const targetDay = allDays.find(d => d.id === targetDayId);
  const targetImpact = impacts.find(i => i.date === targetDay?.date);
  
  if (!targetDay || !targetImpact || targetImpact.risk === "low" || !targetImpact.isOutdoorHeavy) {
    return null;
  }

  // Look for a day that is NOT outdoor heavy and has LOW risk
  const candidate = allDays.find(d => {
    if (d.id === targetDayId) return false;
    const impact = impacts.find(i => i.date === d.date);
    return impact && !impact.isOutdoorHeavy && impact.risk === "low";
  });

  if (!candidate) return null;

  return {
    targetDayId,
    candidateDayId: candidate.id,
    candidateTheme: candidate.theme,
    reason: `Swap your outdoor plans on ${targetDay.theme} (${targetImpact.risk} risk) with the indoor plans on ${candidate.theme} (low risk).`
  };
}

export function generatePackingSuggestions(
  weather: WeatherSummary,
  itineraryDays: ItineraryDay[],
  durationDays: number
): PackingSuggestion[] {
  const suggestions: PackingSuggestion[] = [];
  const daily = weather.daily;

  const hasHighRain = daily.some(d => d.rainChance > 30);
  const hasCold = daily.some(d => d.minC < 12);
  const hasExtremeCold = daily.some(d => d.minC < 5);
  const hasHeat = daily.some(d => d.maxC > 28);
  const hasExtremeHeat = daily.some(d => d.maxC > 35);

  if (hasHighRain) {
    suggestions.push({ item: "Umbrella / Rain shell", reason: "Rain forecast during your stay." });
  }

  if (hasExtremeCold) {
    suggestions.push({ item: "Heavy jacket / Gloves", reason: "Temperatures expected to drop significantly." });
  }
  if (hasCold && !hasExtremeCold) {
    suggestions.push({ item: "Light layers / Sweater", reason: "Cool mornings or evenings forecast." });
  }

  if (hasExtremeHeat) {
    suggestions.push({ item: "Breathable linen / Hat", reason: "Extreme heat forecast; prioritize cooling." });
  }
  if (hasHeat) {
    suggestions.push({ item: "Sunscreen / Sunglasses", reason: "Warm and sunny conditions expected." });
  }

  const allTitles = itineraryDays.flatMap(d => d.placesIncluded).join(" ").toLowerCase();
  if (allTitles.includes("hike") || allTitles.includes("walking") || allTitles.includes("trek")) {
    suggestions.push({ item: "Comfortable walking shoes", reason: "Active itinerary with significant movement." });
  }

  if (durationDays > 7) {
    suggestions.push({ item: "Extra laundry allowance", reason: "Longer trip duration." });
  }

  return suggestions;
}
