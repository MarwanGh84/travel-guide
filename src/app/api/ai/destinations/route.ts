import { NextResponse } from "next/server";
import { recommendDestinations } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ data: [], isMock: true, raw: "No trip found." }, { status: 404 });
  const body = await request.json().catch(() => toTripDraft(trip));
  const tripDraft = { ...toTripDraft(trip), ...body };
  const result = await recommendDestinations(tripDraft);

  if (url.searchParams.get("save") === "true" && trip && result.ok) {
    await prisma.destinationRecommendation.deleteMany({ where: { tripId: trip.id } });
    await prisma.destinationRecommendation.createMany({
      data: result.data.map((destination) => ({
        tripId: trip.id,
        name: destination.name,
        country: destination.country,
        whyItMatches: destination.whyItMatches,
        bestThingsToDo: destination.bestThingsToDo.join(", "),
        estimatedCost: destination.estimatedCost,
        weatherSummary: destination.weatherSummary,
        flightEstimate: destination.flightEstimate,
        hotelEstimate: destination.hotelEstimate,
        pros: destination.pros.join(", "),
        cons: destination.cons.join(", "),
        bestFor: destination.bestFor.join(", "),
        suggestedTripDuration: destination.suggestedTripDuration,
        confidenceScore: destination.confidenceScore,
        source: result.isMock ? "not-connected" : "openai",
      })),
    });
  }

  return NextResponse.json(result);
}
