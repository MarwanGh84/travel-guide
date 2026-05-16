"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getHiddenGemScore, recommendDestinations } from "@/lib/ai/openai";
import { getPlacesForTrip } from "@/lib/api/placesService";
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

const revalidateAll = () => {
  ["/", "/trips", "/discover", "/itinerary", "/map", "/budget", "/bookings", "/imports", "/documents", "/today", "/memories", "/profile"].forEach((path) => revalidatePath(path));
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
  await createDefaultTripChildren(trip.id);

  const destinations = await recommendDestinations(tripDraft);
  if (destinations.data.length) {
    await prisma.destinationRecommendation.createMany({
      data: destinations.data.map((destination: DestinationRecommendation) => ({
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
        source: destinations.isMock ? "not-connected" : "openai",
      })),
    });
  }

  if (tripDraft.destination) {
    const places = await getPlacesForTrip(tripDraft);
    if (places.length) {
      await prisma.placeRecommendation.createMany({
        data: places.map((place: PlaceRecommendation) => ({
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
          hiddenGemScore: getHiddenGemScore(place.name, place.category),
          isHiddenGem: place.isHiddenGem,
          source: place.source.provider,
        })),
      });
    }
  }

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
  await prisma.budgetCategory.updateMany({
    where: { tripId: trip.id, name: category },
    data: { actualAmount: { increment: amount } },
  });
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
  await prisma.documentNote.create({
    data: {
      tripId: trip.id,
      type: formString(formData, "type", "Journal note"),
      title: formString(formData, "title", "Untitled note"),
      content: formString(formData, "content"),
      link: formString(formData, "link") || uploadedUrl,
    },
  });
  revalidatePath("/documents");
}

export async function updateDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  const documentNoteId = formString(formData, "documentNoteId");
  if (!trip || !documentNoteId) return;
  const uploadedUrl = await saveUploadedFile(formData.get("file"));
  const link = formString(formData, "link") || uploadedUrl;
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
  const places = await getPlacesForTrip(toTripDraft(trip));
  await prisma.placeRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.placeRecommendation.createMany({
    data: places.map((place: PlaceRecommendation) => ({
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
      hiddenGemScore: getHiddenGemScore(place.name, place.category),
      isHiddenGem: place.isHiddenGem,
      source: place.source.provider,
    })),
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
  revalidateAll();
  redirect("/trips");
}

export async function clearItinerary() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  await prisma.itineraryDay.deleteMany({ where: { tripId: trip.id } });
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
