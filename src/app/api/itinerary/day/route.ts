import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function POST() {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "No trip found." }, { status: 404 });
  const latestDay = await prisma.itineraryDay.findFirst({
    where: { tripId: trip.id },
    orderBy: { date: "desc" },
  });
  const date = latestDay ? addDays(latestDay.date, 1) : trip.startDate;
  const dayNumber = trip.itineraryDays.length + 1;

  const day = await prisma.itineraryDay.create({
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

  const day = await prisma.itineraryDay.update({
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
  });

  revalidateItinerary();

  return NextResponse.json({ ok: true, data: serializeDay(day) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Missing itinerary day id." }, { status: 400 });
  await prisma.itineraryDay.delete({ where: { id } });
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
    placesIncluded: [],
  };
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
