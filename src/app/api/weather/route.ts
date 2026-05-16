import { NextResponse } from "next/server";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  const destination = [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(destination);
  return NextResponse.json(weather);
}
