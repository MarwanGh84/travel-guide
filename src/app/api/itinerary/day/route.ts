import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip } from "@/lib/db/travel";
import type { Prisma } from "@prisma/client";

export async function POST() {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "No trip found." }, { status: 404 });
  const latestDay = await prisma.itineraryDay.findFirst({
    where: { tripId: trip.id },
    orderBy: { date: "desc" },
  });
  const date = latestDay ? addDays(latestDay.date, 1) : trip.startDate;
  const dayNumber = trip.itineraryDays.length + 1;

  const day = await prisma.$transaction(async (tx) => {
    const createdDay = await tx.itineraryDay.create({
      data: {
        tripId: trip.id,
        date,
        theme: `Day ${dayNumber} plan`,
        morningPlan: "Add a morning idea or use AI to regenerate this day.",
        afternoonPlan: "Add an afternoon idea from Discover or your saved places.",
        eveningPlan: "Add dinner, sunset, or a low-effort evening plan.",
        restaurantIdeas: "",
        hiddenGem: "",
        estimatedCost: 0,
        transportNotes: "Add route notes after choosing places.",
        backupOption: "Keep one simple backup option for weather or low energy.",
        notes: "",
      },
      include: { items: { include: { placeRecommendation: true }, orderBy: { sortOrder: "asc" } } },
    });

    await invalidateApprovalIfNeeded(tx, trip.id, trip.status);
    return createdDay;
  });

  revalidateItinerary();
  return NextResponse.json({ ok: true, data: serializeDay(day) });
}

import { UpdateItineraryDaySchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const validation = UpdateItineraryDaySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ ok: false, message: "Invalid request format." }, { status: 400 });
  }
  const data = validation.data;

  const existingDay = await prisma.itineraryDay.findUnique({
    where: { id: data.id },
    include: { trip: true },
  });
  if (!existingDay) {
    return NextResponse.json({ ok: false, message: "Itinerary day not found." }, { status: 404 });
  }

  const day = await prisma.$transaction(async (tx) => {
    const updatedDay = await tx.itineraryDay.update({
      where: { id: data.id },
      data: {
        theme: data.theme,
        morningPlan: data.morningPlan,
        afternoonPlan: data.afternoonPlan,
        eveningPlan: data.eveningPlan,
        restaurantIdeas: Array.isArray(data.restaurantIdeas) ? data.restaurantIdeas.join(", ") : data.restaurantIdeas,
        hiddenGem: data.hiddenGem,
        estimatedCost: data.estimatedCost,
        transportNotes: data.transportNotes,
        backupOption: data.backupOption,
        notes: data.notes,
      },
      include: { items: { include: { placeRecommendation: true }, orderBy: { sortOrder: "asc" } } },
    });

    await invalidateApprovalIfNeeded(tx, existingDay.tripId, existingDay.trip.status);
    return updatedDay;
  });

  revalidateItinerary();

  return NextResponse.json({ ok: true, data: serializeDay(day) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Missing itinerary day id." }, { status: 400 });
  const existingDay = await prisma.itineraryDay.findUnique({
    where: { id },
    include: { trip: true },
  });
  if (!existingDay) {
    return NextResponse.json({ ok: false, message: "Itinerary day not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.itineraryDay.delete({ where: { id } });
    await invalidateApprovalIfNeeded(tx, existingDay.tripId, existingDay.trip.status);
  });
  revalidateItinerary();
  return NextResponse.json({ ok: true });
}

function splitList(value?: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function serializeDay(day: {
  id: string;
  date: Date;
  theme: string;
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  restaurantIdeas?: string | null;
  hiddenGem?: string | null;
  estimatedCost: number;
  transportNotes?: string | null;
  backupOption?: string | null;
  notes?: string | null;
  items?: {
    id: string;
    title: string;
    timeOfDay?: string | null;
    placeRecommendationId?: string | null;
    placeRecommendation?: {
      id: string;
      name: string;
      category: string;
      description: string;
      rating?: number | null;
      location: string;
      latitude?: number | null;
      longitude?: number | null;
      openingStatus?: string | null;
      whyRecommended: string;
      isHiddenGem: boolean;
      hiddenGemScore: number;
      source: string;
    } | null;
  }[];
}) {
  return {
    id: day.id,
    date: day.date.toISOString().slice(0, 10),
    theme: day.theme,
    morningPlan: day.morningPlan,
    afternoonPlan: day.afternoonPlan,
    eveningPlan: day.eveningPlan,
    restaurantIdeas: splitList(day.restaurantIdeas),
    hiddenGem: day.hiddenGem ?? "",
    estimatedCost: day.estimatedCost,
    transportNotes: day.transportNotes ?? "",
    backupOption: day.backupOption ?? "",
    notes: day.notes ?? "",
    placesIncluded: day.items?.map((item) => item.title) ?? [],
    places: day.items?.map((item) => ({
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
            costLevel: "$$" as const,
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
    })) ?? [],
  };
}

async function invalidateApprovalIfNeeded(
  tx: Prisma.TransactionClient,
  tripId: string,
  status: string,
) {
  if (status !== "itinerary_approved") return;
  await tx.trip.update({
    where: { id: tripId },
    data: {
      status: "planning",
      itineraryApprovedAt: null,
    },
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function revalidateItinerary() {
  revalidatePath("/");
  revalidatePath("/itinerary");
  revalidatePath("/today");
  revalidatePath("/map");
}
