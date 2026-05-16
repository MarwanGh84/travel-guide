import type { DataSource } from "@/lib/types/travel";
import { ForecastResponseSchema, GeocodeResponseSchema } from "@/lib/validation/schemas";

export type WeatherSummary = {
  destination: string;
  summary: string;
  temperatureRange: string;
  rainRisk: string;
  daily: Array<{
    date: string;
    minC: number;
    maxC: number;
    rainChance: number;
    weatherCode: number;
    label: string;
  }>;
  source: DataSource;
};

type ForecastResponse = ReturnType<typeof ForecastResponseSchema.parse>;

export async function getWeatherSummary(destination: string): Promise<WeatherSummary> {
  try {
    const place = await geocode(destination);
    if (!place) return fallbackWeather(destination, "Open-Meteo geocoding did not find this destination.");

    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      forecast_days: "7",
      timezone: place.timezone ?? "auto",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) return fallbackWeather(destination, `Open-Meteo forecast failed with ${response.status}.`);
    const data = ForecastResponseSchema.parse(await response.json());
    const daily = normalizeDaily(data);
    if (!daily.length) return fallbackWeather(destination, "Open-Meteo returned no daily forecast rows.");

    const min = Math.round(Math.min(...daily.map((day) => day.minC)));
    const max = Math.round(Math.max(...daily.map((day) => day.maxC)));
    const rain = Math.round(daily.reduce((sum, day) => sum + day.rainChance, 0) / daily.length);

    return {
      destination: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      summary: `${daily[0].label} today, averaging ${rain}% rain risk across the next week.`,
      temperatureRange: `${min}-${max} C`,
      rainRisk: rain < 25 ? "Low" : rain < 55 ? "Medium" : "High",
      daily,
      source: {
        provider: "open-meteo",
        isMock: false,
        classification: "provider",
        note: "Live no-key Open-Meteo forecast.",
      },
    };
  } catch (error) {
    return fallbackWeather(destination, error instanceof Error ? error.message : "Weather lookup failed.");
  }
}

async function geocode(destination: string) {
  for (const candidate of geocodeCandidates(destination)) {
    const params = new URLSearchParams({ name: candidate, count: "1", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) continue;
    const data = GeocodeResponseSchema.parse(await response.json());
    const place = data.results?.[0];
    if (place) return place;
  }
  return null;
}

function geocodeCandidates(destination: string) {
  const raw = destination.trim();
  const withoutSymbols = raw.replace(/[+|/]/g, " ").replace(/\s+/g, " ").trim();
  const beforeComma = withoutSymbols.split(",")[0]?.trim();
  const beforeAnd = beforeComma?.split(/\s+(?:and|&)\s+/i)[0]?.trim();
  const firstWords = beforeComma?.split(/\s+/).slice(0, 2).join(" ").trim();
  const firstWord = beforeComma?.split(/\s+/)[0]?.trim();

  return [...new Set([raw, withoutSymbols, beforeComma, beforeAnd, firstWords, firstWord].filter((item): item is string => Boolean(item)))];
}

function normalizeDaily(data: ForecastResponse): WeatherSummary["daily"] {
  const daily = data.daily;
  if (!daily?.time?.length) return [];
  return daily.time.map((date, index) => {
    const weatherCode = daily.weather_code?.[index] ?? 0;
    return {
      date,
      minC: Math.round(daily.temperature_2m_min?.[index] ?? 0),
      maxC: Math.round(daily.temperature_2m_max?.[index] ?? 0),
      rainChance: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
      weatherCode,
      label: weatherLabel(weatherCode),
    };
  });
}

function fallbackWeather(destination: string, note: string): WeatherSummary {
  return {
    destination,
    summary: "Weather unavailable.",
    temperatureRange: "Unavailable",
    rainRisk: "Unavailable",
    daily: [],
    source: {
      provider: "weather-unavailable",
      isMock: true,
      classification: "fallback",
      note,
    },
  };
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Variable";
}
