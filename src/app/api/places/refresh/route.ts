import { NextResponse } from "next/server";
import { getPlacesForTrip } from "@/lib/api/placesService";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function POST() {
  const trip = await getPrimaryTrip();
  if (!trip) {
    return NextResponse.json({ ok: false, message: "No trip found." }, { status: 404 });
  }

  const places = await getPlacesForTrip(toTripDraft(trip));
  await prisma.placeRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.placeRecommendation.createMany({
    data: places.map((place) => ({
      tripId: trip.id,
      name: place.name,
      category: place.category,
      description: place.description,
      rating: place.rating,
      costLevel: place.costLevel,
      location: place.location,
      latitude: place.coordinates?.lat,
      longitude: place.coordinates?.lng,
      openingStatus: place.openingStatus,
      whyRecommended: place.whyRecommended,
      hiddenGemScore: place.hiddenGemScore,
      isHiddenGem: place.isHiddenGem,
      source: place.source.provider,
    })),
  });

  await prisma.apiProviderLog.create({
    data: {
      tripId: trip.id,
      userId: trip.userId,
      provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
      endpoint: "places:searchText",
      status: "success",
      usedMock: !process.env.GOOGLE_PLACES_API_KEY,
      message: `Stored ${places.length} place recommendations.`,
    },
  });

  return NextResponse.json({
    ok: true,
    count: places.length,
    provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
  });
}
