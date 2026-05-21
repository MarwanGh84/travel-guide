import { NextResponse } from "next/server";
import { generateFullItinerary } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toPlaceRecommendations, toSelectedPlaceRecommendations, toTripDraft } from "@/lib/db/travel";
import { AiItineraryRequestSchema } from "@/lib/validation/schemas";
import { normalizeName } from "@/lib/utils";
import type { QualitySummary, PlaceRecommendation } from "@/lib/types/travel";
import { canonicalizeDayWithQuality } from "@/lib/ai/itineraryQuality";
import { getWeatherSummary } from "@/lib/api/weatherService";

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
  
  const planningPlaces = (places.length ? places : (selectedPlaces.length ? selectedPlaces : toPlaceRecommendations(trip))) as unknown as PlaceRecommendation[];

  const destination = trip.destination || trip.destinationCountry || "";
  const weather = destination ? await getWeatherSummary(destination) : null;
  const result = await generateFullItinerary(tripDraft, planningPlaces, weather);

  if (save && result.ok) {
    const allRecommendations = (await prisma.placeRecommendation.findMany({ where: { tripId: trip.id } })) as unknown as PlaceRecommendation[];
    const recommendationsById = new Map(allRecommendations.map(r => [r.id, r]));
    const recommendationsByName = new Map(allRecommendations.map(r => [normalizeName(r.name), r]));

    const qualitySummary: QualitySummary = {
      duplicateCount: 0,
      repairedDuplicateCount: 0,
      mappedPlaceCount: 0,
      aiOnlyPointCount: 0,
      warnings: [],
    };

    const usedNonRepeatableIds = new Set<string>();

    await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({ where: { tripId: trip.id } });
      for (const day of result.data) {
        const canonicalPlaces = canonicalizeDayWithQuality(
          day,
          planningPlaces,
          recommendationsById,
          recommendationsByName,
          usedNonRepeatableIds,
          qualitySummary,
          tripDraft.pace
        );

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
              create: canonicalPlaces.map((place, index) => ({
                title: place.name,
                placeRecommendationId: place.id,
                timeOfDay: index === 0 ? "morning" : index === 1 ? "afternoon" : "evening",
                description: "Provider-backed place selected for itinerary planning.",
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
      include: { items: { include: { placeRecommendation: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      ...result,
      quality: qualitySummary,
      data: savedDays.map((day) => ({
        id: day.id,
        date: day.date.toISOString().slice(0, 10),
        theme: day.theme,
        morningPlan: day.morningPlan,
        afternoonPlan: day.afternoonPlan,
        eveningPlan: day.eveningPlan,
        placesIncluded: day.items.map((item) => item.title),
        places: day.items.map((item) => ({
          id: item.id,
          title: item.title,
          timeOfDay: item.timeOfDay ?? undefined,
          placeRecommendationId: item.placeRecommendationId ?? undefined,
          place: item.placeRecommendation
            ? {
                id: item.placeRecommendation.id,
                name: item.placeRecommendation.name,
                category: item.placeRecommendation.category,
                description: item.placeRecommendation.description,
                rating: item.placeRecommendation.rating ?? undefined,
                costLevel: "$$",
                location: item.placeRecommendation.location,
                coordinates:
                  typeof item.placeRecommendation.latitude === "number" &&
                  typeof item.placeRecommendation.longitude === "number"
                    ? { lat: item.placeRecommendation.latitude, lng: item.placeRecommendation.longitude }
                    : undefined,
                openingStatus: item.placeRecommendation.openingStatus ?? undefined,
                whyRecommended: item.placeRecommendation.whyRecommended,
                isHiddenGem: item.placeRecommendation.isHiddenGem,
                hiddenGemScore: item.placeRecommendation.hiddenGemScore,
                source: {
                  provider: item.placeRecommendation.source,
                  isMock: false,
                  note: "Linked itinerary place.",
                  classification: "provider" as const,
                },
              }
            : undefined,
        })),
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
