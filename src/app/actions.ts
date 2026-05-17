"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { recommendDestinations } from "@/lib/ai/openai";
import {
  createDefaultTripChildren,
  formString,
  getOrCreateUser,
  getPrimaryTrip,
  parseDateField,
  parseNumberField,
  toTripDraft,
} from "@/lib/db/travel";
import { TripDraftSchema } from "@/lib/validation/schemas";
import type { DestinationRecommendation, PlaceRecommendation } from "@/lib/types/travel";
import type { NormalizedPlace } from "@/lib/types/sources";

import { aggregateIntelligence } from "@/lib/api/placeSources/sourceAggregator";
import { getPlacesForTrip } from "@/lib/api/placesService";

const revalidateAll = () => {
  ["/", "/trips", "/discover", "/itinerary", "/map", "/stays", "/currency", "/budget", "/bookings", "/imports", "/documents", "/today", "/memories", "/profile"].forEach((path) => revalidatePath(path));
};

export async function createTrip(formData: FormData) {
  const user = await getOrCreateUser();
  const interestsList = formData.getAll("interests").map(String);
  const destinationMode = formString(formData, "destinationMode", "known");
  const destinationCountry = formString(formData, "destinationCountry");
  const destinationInput = formString(formData, "destination");
  const selectedDestination = destinationMode === "recommend" ? undefined : destinationInput || destinationCountry || undefined;

  const rawData = {
    name: formString(formData, "name", "Untitled trip"),
    destination: selectedDestination,
    destinationCountry: destinationCountry || undefined,
    departureCity: formString(formData, "departureCity", "Dubai"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate"),
    travelerCount: parseNumberField(formData.get("travelerCount"), 1),
    budget: parseNumberField(formData.get("budget"), 0),
    travelStyle: formString(formData, "travelStyle", "balanced"),
    pace: formString(formData, "pace", "medium"),
    interests: interestsList,
    notes: formString(formData, "notes"),
    status: "planning",
  };

  const validation = TripDraftSchema.safeParse(rawData);
  if (!validation.success) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.error.flatten().fieldErrors)}`);
  }

  const tripDraft = validation.data;
  const startDate = new Date(`${tripDraft.startDate}T12:00:00.000Z`);
  const endDate = new Date(`${tripDraft.endDate}T12:00:00.000Z`);

  if (endDate < startDate) {
    throw new Error("End date must be after start date.");
  }

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      name: tripDraft.name,
      destination: tripDraft.destination,
      destinationCountry: tripDraft.destinationCountry,
      departureCity: tripDraft.departureCity,
      startDate,
      endDate,
      travelerCount: tripDraft.travelerCount,
      budget: tripDraft.budget,
      travelStyle: tripDraft.travelStyle,
      pace: tripDraft.pace,
      interests: tripDraft.interests.join(", "),
      notes: tripDraft.notes,
      status: "planning",
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { activeTripId: trip.id } });
  const activeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeTripId: true },
  });
  if (activeUser?.activeTripId !== trip.id) {
    throw new Error("Trip was created, but active trip selection could not be confirmed.");
  }
  await createDefaultTripChildren(trip.id);

  // Background intelligence triggering
  void refreshPlacesFromProvider();

  await recommendDestinations(tripDraft);

  revalidateAll();
  redirect("/discover");
}

export async function saveProfile(formData: FormData) {
  const user = await getOrCreateUser();
  await prisma.travelProfile.upsert({
    where: { userId: user.id },
    update: {
      preferredHotelType: formString(formData, "preferredHotelType"),
      travelPace: formString(formData, "travelPace", "medium"),
      foodPreferences: formString(formData, "foodPreferences"),
      budgetStyle: formString(formData, "budgetStyle", "balanced"),
      favoriteActivities: formString(formData, "favoriteActivities"),
      thingsToAvoid: formString(formData, "thingsToAvoid"),
      homeAirport: formString(formData, "homeAirport"),
      passportNationality: formString(formData, "passportNationality"),
      hiddenGemInterest: formData.get("hiddenGemInterest") === "on",
      preferredTravelMonths: formString(formData, "preferredTravelMonths"),
      notes: formString(formData, "notes"),
    },
    create: {
      userId: user.id,
      preferredHotelType: formString(formData, "preferredHotelType"),
      travelPace: formString(formData, "travelPace", "medium"),
      foodPreferences: formString(formData, "foodPreferences"),
      budgetStyle: formString(formData, "budgetStyle", "balanced"),
      favoriteActivities: formString(formData, "favoriteActivities"),
      thingsToAvoid: formString(formData, "thingsToAvoid"),
      homeAirport: formString(formData, "homeAirport"),
      passportNationality: formString(formData, "passportNationality"),
      hiddenGemInterest: formData.get("hiddenGemInterest") === "on",
      preferredTravelMonths: formString(formData, "preferredTravelMonths"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/profile");
}

export async function addExpense(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const amount = parseNumberField(formData.get("amount"), 0);
  const category = formString(formData, "category", "Food");
  await prisma.expense.create({
    data: {
      tripId: trip.id,
      category,
      amount,
      currency: trip.currency,
      note: formString(formData, "note"),
      spentAt: parseDateField(formData.get("spentAt")),
    },
  });
  const updated = await prisma.budgetCategory.updateMany({
    where: { tripId: trip.id, name: category },
    data: { actualAmount: { increment: amount } },
  });
  if (updated.count === 0) {
    await prisma.budgetCategory.create({
      data: {
        tripId: trip.id,
        name: category,
        estimatedAmount: 0,
        actualAmount: amount,
      },
    });
  }
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function updateExpense(formData: FormData) {
  const trip = await getPrimaryTrip();
  const expenseId = formString(formData, "expenseId");
  if (!trip || !expenseId) return;

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: trip.id },
  });
  if (!existingExpense) return;

  const amount = parseNumberField(formData.get("amount"), existingExpense.amount);
  const category = formString(formData, "category", existingExpense.category);

  await prisma.$transaction(async (tx) => {
    await tx.expense.updateMany({
      where: { id: expenseId, tripId: trip.id },
      data: {
        category,
        amount,
        note: formString(formData, "note"),
        spentAt: parseDateField(formData.get("spentAt")),
      },
    });

    await tx.budgetCategory.updateMany({
      where: { tripId: trip.id, name: existingExpense.category },
      data: { actualAmount: { decrement: existingExpense.amount } },
    });

    const updated = await tx.budgetCategory.updateMany({
      where: { tripId: trip.id, name: category },
      data: { actualAmount: { increment: amount } },
    });

    if (updated.count === 0) {
      await tx.budgetCategory.create({
        data: {
          tripId: trip.id,
          name: category,
          estimatedAmount: 0,
          actualAmount: amount,
        },
      });
    }
  });

  revalidatePath("/budget");
  revalidatePath("/");
}

export async function deleteExpense(formData: FormData) {
  const trip = await getPrimaryTrip();
  const expenseId = formString(formData, "expenseId");
  if (!trip || !expenseId) return;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: trip.id },
  });
  if (!expense) return;

  await prisma.$transaction([
    prisma.expense.deleteMany({ where: { id: expenseId, tripId: trip.id } }),
    prisma.budgetCategory.updateMany({
      where: { tripId: trip.id, name: expense.category },
      data: { actualAmount: { decrement: expense.amount } },
    }),
  ]);

  revalidatePath("/budget");
  revalidatePath("/");
}

export async function addBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  await prisma.booking.create({
    data: {
      tripId: trip.id,
      type: formString(formData, "type", "Flight"),
      title: formString(formData, "title", "Untitled booking"),
      provider: formString(formData, "provider"),
      confirmationNumber: formString(formData, "confirmationNumber"),
      startAt: parseDateField(formData.get("startAt")),
      endAt: formString(formData, "endAt") ? parseDateField(formData.get("endAt")) : null,
      link: formString(formData, "link"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/bookings");
  revalidatePath("/today");
}

export async function updateBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  const bookingId = formString(formData, "bookingId");
  if (!trip || !bookingId) return;
  await prisma.booking.updateMany({
    where: { id: bookingId, tripId: trip.id },
    data: {
      type: formString(formData, "type", "Flight"),
      title: formString(formData, "title", "Untitled booking"),
      provider: formString(formData, "provider"),
      confirmationNumber: formString(formData, "confirmationNumber"),
      startAt: parseDateField(formData.get("startAt")),
      endAt: formString(formData, "endAt") ? parseDateField(formData.get("endAt")) : null,
      link: formString(formData, "link"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/bookings");
  revalidatePath("/documents");
  revalidatePath("/today");
}

export async function deleteBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  const bookingId = formString(formData, "bookingId");
  if (!trip || !bookingId) return;
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, tripId: trip.id } });
  if (!booking) return;
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { id: bookingId, tripId: trip.id } }),
    ...(booking.importGroupId
      ? [prisma.documentNote.deleteMany({ where: { tripId: trip.id, importGroupId: booking.importGroupId } })]
      : []),
  ]);
  revalidatePath("/bookings");
  revalidatePath("/documents");
  revalidatePath("/today");
}

export async function addDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const uploadedUrl = await saveUploadedFile(formData.get("file"));
  const referenceLink = formString(formData, "link");
  await prisma.documentNote.create({
    data: {
      tripId: trip.id,
      type: formString(formData, "type", "Journal note"),
      title: formString(formData, "title", "Untitled note"),
      content: formString(formData, "content"),
      link: uploadedUrl || referenceLink,
    },
  });
  revalidatePath("/documents");
}

export async function updateDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  const documentNoteId = formString(formData, "documentNoteId");
  if (!trip || !documentNoteId) return;
  const uploadedUrl = await saveUploadedFile(formData.get("file"));
  const referenceLink = formString(formData, "link");
  const link = uploadedUrl || referenceLink;
  await prisma.documentNote.updateMany({
    where: { id: documentNoteId, tripId: trip.id },
    data: {
      type: formString(formData, "type", "Journal note"),
      title: formString(formData, "title", "Untitled note"),
      content: formString(formData, "content"),
      ...(link ? { link } : {}),
    },
  });
  revalidatePath("/documents");
}

export async function deleteDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  const documentNoteId = formString(formData, "documentNoteId");
  if (!trip || !documentNoteId) return;
  const note = await prisma.documentNote.findFirst({ where: { id: documentNoteId, tripId: trip.id } });
  if (!note) return;
  await prisma.$transaction([
    prisma.documentNote.deleteMany({ where: { id: documentNoteId, tripId: trip.id } }),
    ...(note.importGroupId
      ? [prisma.booking.deleteMany({ where: { tripId: trip.id, importGroupId: note.importGroupId } })]
      : []),
  ]);
  revalidatePath("/documents");
  revalidatePath("/bookings");
  revalidatePath("/today");
}

export async function addMemory(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const uploadedUrl = await saveUploadedFile(formData.get("photo"));
  await prisma.memory.create({
    data: {
      tripId: trip.id,
      title: formString(formData, "title", "Trip memory"),
      favoriteMoments: formString(formData, "favoriteMoments"),
      placesVisited: formString(formData, "placesVisited"),
      notes: formString(formData, "notes"),
      photosPlaceholder: formString(formData, "photosPlaceholder") || uploadedUrl,
      nextTime: formString(formData, "nextTime"),
      rating: parseNumberField(formData.get("rating"), 0),
      favoriteRestaurants: formString(formData, "favoriteRestaurants"),
      favoriteHiddenGems: formString(formData, "favoriteHiddenGems"),
      placesToRevisit: formString(formData, "placesToRevisit"),
    },
  });
  revalidatePath("/memories");
}

async function saveUploadedFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size) return "";
  const bytes = Buffer.from(await value.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "travel");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = value.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "upload";
  const fileName = `${Date.now()}-${safeName}`;
  await writeFile(path.join(uploadsDir, fileName), bytes);
  return `/uploads/travel/${fileName}`;
}

export async function refreshPlacesFromProvider() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  
  const tripDraft = toTripDraft(trip);
  const [googlePlaces, aggregated] = await Promise.all([
    getPlacesForTrip(tripDraft),
    aggregateIntelligence(tripDraft),
  ]);
  const places = mergeDiscoveredPlaces(googlePlaces, aggregated.places);
  const { intelligence } = aggregated;
  
  const savedPlaces = await prisma.savedPlace.findMany({ where: { tripId: trip.id } });
  const existingPlaces = await prisma.placeRecommendation.findMany({ where: { tripId: trip.id } });
  
  await prisma.$transaction(async (tx) => {
    if (intelligence) {
      await tx.destinationIntel.upsert({
        where: { tripId: trip.id },
        update: {
          overview: intelligence.overview,
          neighborhoods: intelligence.neighborhoods?.join(", "),
          culture: intelligence.culture,
          history: intelligence.history,
          practicalNotes: intelligence.practicalNotes?.join("\n"),
          source: intelligence.source,
        },
        create: {
          tripId: trip.id,
          overview: intelligence.overview,
          neighborhoods: intelligence.neighborhoods?.join(", "),
          culture: intelligence.culture,
          history: intelligence.history,
          practicalNotes: intelligence.practicalNotes?.join("\n"),
          source: intelligence.source,
        }
      });
    }

    const existingByName = new Map(existingPlaces.map((place) => [normalizePlaceKey(place.name), place]));
    const refreshedIds = new Set<string>();

    for (const place of places) {
      const existing = existingByName.get(normalizePlaceKey(place.name));
      const data = toPersistedPlaceData(place);

      if (existing) {
        await tx.placeRecommendation.update({
          where: { id: existing.id },
          data,
        });
        refreshedIds.add(existing.id);
      } else {
        const created = await tx.placeRecommendation.create({
          data: {
            tripId: trip.id,
            ...data,
          },
        });
        refreshedIds.add(created.id);
      }
    }

    const savedRecommendationIds = new Set(
      savedPlaces
        .map((place) => place.placeRecommendationId)
        .filter((id): id is string => Boolean(id)),
    );
    await tx.placeRecommendation.deleteMany({
      where: {
        tripId: trip.id,
        id: {
          notIn: [...refreshedIds, ...savedRecommendationIds],
        },
      },
    });
  });
  revalidateAll();
}

export async function refreshDestinationsFromAi() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const result = await recommendDestinations(toTripDraft(trip));
  if (!result.ok) return;
  await prisma.destinationRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.destinationRecommendation.createMany({
    data: result.data.map((destination: DestinationRecommendation) => ({
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
  revalidateAll();
}

export async function deleteTrip() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  
  await prisma.trip.delete({ where: { id: trip.id } });
  const nextTrip = await prisma.trip.findFirst({
    where: { userId: trip.userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  await prisma.user.update({
    where: { id: trip.userId },
    data: { activeTripId: nextTrip?.id ?? null },
  });

  revalidateAll();
  redirect("/trips");
}

export async function selectTrip(formData: FormData) {
  const tripId = formString(formData, "tripId");
  if (!tripId) return;

  const user = await getOrCreateUser();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });

  if (!trip) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { activeTripId: trip.id },
  });

  revalidateAll();
}

export async function clearItinerary() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  await prisma.itineraryDay.deleteMany({ where: { tripId: trip.id } });
  revalidateAll();
}

export async function approveItinerary() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  
  if (trip.itineraryDays.length === 0) {
    throw new Error("Cannot approve an empty itinerary. Generate or add days first.");
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "itinerary_approved",
      itineraryApprovedAt: new Date(),
    },
  });

  revalidateAll();
  redirect("/stays");
}

export async function reopenItinerary() {
  const trip = await getPrimaryTrip();
  if (!trip) return;

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: "planning",
      itineraryApprovedAt: null,
    },
  });

  revalidateAll();
}

export async function planDestination(formData: FormData) {
  const trip = await getPrimaryTrip();
  const destinationId = formString(formData, "destinationId");
  if (!trip || !destinationId) return;

  const destination = await prisma.destinationRecommendation.findFirst({
    where: { id: destinationId, tripId: trip.id },
  });
  if (!destination) return;

  const destinationChanged =
    trip.destination !== destination.name ||
    trip.destinationCountry !== destination.country;

  await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        destination: destination.name,
        destinationCountry: destination.country,
        budget: destination.estimatedCost || trip.budget,
        status: "planning",
        notes: [trip.notes, `Selected destination: ${destination.name}, ${destination.country}.`].filter(Boolean).join("\n"),
      },
    }),
    ...(destinationChanged
      ? [
          prisma.savedPlace.deleteMany({ where: { tripId: trip.id } }),
          prisma.itineraryDay.deleteMany({ where: { tripId: trip.id } }),
        ]
      : []),
  ]);

  await refreshPlacesFromProvider();
  revalidateAll();
}

export async function savePlaceForLater(formData: FormData) {
  const trip = await getPrimaryTrip();
  const placeId = formString(formData, "placeId");
  if (!trip || !placeId) return;

  const place = await prisma.placeRecommendation.findFirst({ where: { id: placeId, tripId: trip.id } });
  if (!place) return;

  const existing = await prisma.savedPlace.findFirst({
    where: { tripId: trip.id, placeRecommendationId: place.id },
  });
  if (!existing) {
    await prisma.savedPlace.create({
      data: {
        tripId: trip.id,
        placeRecommendationId: place.id,
        name: place.name,
        category: place.category,
        notes: place.whyRecommended,
        priority: place.isHiddenGem ? 1 : 2,
      },
    });
  }

  revalidateAll();
}

export async function addPlaceToItinerary(formData: FormData) {
  await savePlaceForLater(formData);
  revalidateAll();
}

export async function removeSelectedPlace(formData: FormData) {
  const trip = await getPrimaryTrip();
  const placeId = formString(formData, "placeId");
  if (!trip || !placeId) return;

  const savedPlace = await prisma.savedPlace.findFirst({
    where: {
      tripId: trip.id,
      OR: [{ id: placeId }, { placeRecommendationId: placeId }],
    },
  });
  if (!savedPlace) return;

  await prisma.savedPlace.delete({ where: { id: savedPlace.id } });
  revalidateAll();
}

function normalizePlaceKey(value: string) {
  return value.trim().toLowerCase();
}

function mergeDiscoveredPlaces(
  googlePlaces: Awaited<ReturnType<typeof getPlacesForTrip>>,
  aggregatedPlaces: Awaited<ReturnType<typeof aggregateIntelligence>>["places"],
) {
  const merged = new Map<string, (typeof googlePlaces)[number] | (typeof aggregatedPlaces)[number]>();

  googlePlaces.forEach((place) => {
    merged.set(normalizePlaceKey(place.name), place);
  });

  aggregatedPlaces.forEach((place) => {
    const key = normalizePlaceKey(place.name);
    if (!merged.has(key)) merged.set(key, place);
  });

  return [...merged.values()];
}

function toPersistedPlaceData(place: PlaceRecommendation | NormalizedPlace): {
  name: string;
  category: string;
  description: string;
  rating?: number;
  costLevel: string;
  location: string;
  latitude?: number;
  longitude?: number;
  whyRecommended: string;
  hiddenGemScore: number;
  isHiddenGem: boolean;
  source: string;
} {
  if (!("sourceId" in place)) {
    return {
      name: place.name,
      category: place.category,
      description: place.description || "",
      rating: place.rating,
      costLevel: place.costLevel,
      location: place.location,
      latitude: place.coordinates?.lat,
      longitude: place.coordinates?.lng,
      whyRecommended: place.whyRecommended,
      hiddenGemScore: place.hiddenGemScore,
      isHiddenGem: place.isHiddenGem,
      source: place.source.provider,
    };
  }

  return {
    name: place.name,
    category: place.category,
    description: place.description || "",
    rating: place.rating,
    costLevel: "$$",
    location: place.address ?? "Local area",
    latitude: place.latitude,
    longitude: place.longitude,
    whyRecommended: `Discovered via ${place.source} intelligence pipeline.`,
    hiddenGemScore: place.hiddenGemScore || 0,
    isHiddenGem: (place.hiddenGemScore || 0) >= 75,
    source: place.source,
  };
}
