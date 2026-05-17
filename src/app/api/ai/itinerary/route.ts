import { NextResponse } from "next/server";
import { generateFullItinerary } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toPlaceRecommendations, toSelectedPlaceRecommendations, toTripDraft } from "@/lib/db/travel";
import { AiItineraryRequestSchema } from "@/lib/validation/schemas";
import { normalizeName } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const validation = AiItineraryRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ ok: false, message: "Invalid request format." }, { status: 400 });
  }
  const { save, selectedPlaceIds } = validation.data;

  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "No active trip found." }, { status: 404 });

  const tripDraft = toTripDraft(trip);
  const selectedPlaces = toSelectedPlaceRecommendations(trip);
  const places = await prisma.placeRecommendation.findMany({
    where: { tripId: trip.id, id: { in: selectedPlaceIds || [] } },
  });
  
  const planningPlaces = places.length ? places : (selectedPlaces.length ? selectedPlaces : toPlaceRecommendations(trip));

  // @ts-expect-error - Complex type mapping between Trip and OpenAI request
  const result = await generateFullItinerary(tripDraft, planningPlaces);

  if (save && result.ok) {
    const allRecommendations = await prisma.placeRecommendation.findMany({ where: { tripId: trip.id } });
    const recommendationsByName = new Map(allRecommendations.map(r => [normalizeName(r.name), r.id]));

    await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({ where: { tripId: trip.id } });
      for (const day of result.data) {
        await tx.itineraryDay.create({
          data: {
            tripId: trip.id,
            date: new Date(`${day.date}T12:00:00.000Z`),
            theme: day.theme,
            morningPlan: day.morningPlan,
            afternoonPlan: day.afternoonPlan,
            eveningPlan: day.eveningPlan,
            restaurantIdeas: day.restaurantIdeas.join(", "),
            hiddenGem: day.hiddenGem,
            estimatedCost: day.estimatedCost,
            transportNotes: day.transportNotes,
            backupOption: day.backupOption,
            notes: day.notes,
            items: {
              create: day.placesIncluded.map((title, index) => ({
                title,
                placeRecommendationId: recommendationsByName.get(normalizeName(title)) ?? null,
                timeOfDay: index === 0 ? "morning" : index === 1 ? "afternoon" : "evening",
                description: "Selected for itinerary planning.",
                sortOrder: index,
              })),
            },
          },
        });
      }
      if (trip.status === "itinerary_approved") {
        await tx.trip.update({
          where: { id: trip.id },
          data: {
            status: "planning",
            itineraryApprovedAt: null,
          },
        });
      }
    });

    const savedDays = await prisma.itineraryDay.findMany({
      where: { tripId: trip.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      ...result,
      data: savedDays.map((day) => ({
        id: day.id,
        date: day.date.toISOString().slice(0, 10),
        theme: day.theme,
        morningPlan: day.morningPlan,
        afternoonPlan: day.afternoonPlan,
        eveningPlan: day.eveningPlan,
        placesIncluded: day.items.map((item) => item.title),
        restaurantIdeas: day.restaurantIdeas?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
        hiddenGem: day.hiddenGem ?? "",
        estimatedCost: day.estimatedCost,
        transportNotes: day.transportNotes ?? "",
        backupOption: day.backupOption ?? "",
        notes: day.notes ?? "",
      })),
    });
  }

  return NextResponse.json(result);
}
