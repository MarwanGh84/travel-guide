import { NextResponse } from "next/server";
import { generatePackingList } from "@/lib/ai/openai";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ data: [], isMock: true, raw: "No trip found." }, { status: 404 });
  const tripDraft = toTripDraft(trip);
  const weather = await getWeatherSummary(tripDraft.destination ?? "");
  const fallback = {
    ok: false,
    data: [],
    isMock: true,
    raw: "OpenAI request timed out.",
  };
  const result = await withTimeout(
    generatePackingList({
    ...tripDraft,
    notes: `${tripDraft.notes ?? ""}\nWeather: ${weather.summary}; ${weather.temperatureRange}; rain risk ${weather.rainRisk}`,
    }),
    fallback,
    12000,
  );
  return NextResponse.json({ ...result, weather });
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}
