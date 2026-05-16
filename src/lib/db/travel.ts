import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { defaultTravelProfile, defaultUser } from "@/lib/data/defaults";
import type { DestinationRecommendation, ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import { normalizeName, tripLength } from "@/lib/utils";

const primaryTripInclude = Prisma.validator<Prisma.TripInclude>()({
  destinationRecommendations: true,
  placeRecommendations: true,
  savedPlaces: { include: { placeRecommendation: true }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
  itineraryDays: { include: { items: { include: { placeRecommendation: true }, orderBy: { sortOrder: "asc" } } } },
  budgetCategories: true,
  expenses: true,
  bookings: true,
  documentNotes: true,
  memories: true,
  destinationIntel: true,
});

export function toDestinationIntel(trip: PrimaryTrip) {
  if (!trip.destinationIntel) return null;
  const intel = trip.destinationIntel;
  return {
    overview: intel.overview,
    neighborhoods: intel.neighborhoods ? intel.neighborhoods.split(", ") : [],
    culture: intel.culture,
    history: intel.history,
    practicalNotes: intel.practicalNotes ? intel.practicalNotes.split("\n") : [],
    source: intel.source
  };
}

export type PrimaryTrip = Prisma.TripGetPayload<{ include: typeof primaryTripInclude }>;

export async function getOrCreateUser() {
  const user = await prisma.user.upsert({
    where: { email: defaultUser.email },
    update: { name: defaultUser.name },
    create: defaultUser,
  });

  await prisma.travelProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { ...defaultTravelProfile, userId: user.id },
  });

  return user;
}

export async function getPrimaryTrip(): Promise<PrimaryTrip | null> {
  const user = await getOrCreateUser();
  const activeTrip = user.activeTripId
    ? await prisma.trip.findFirst({
        where: { id: user.activeTripId, userId: user.id },
        include: primaryTripInclude,
      })
    : null;
  const trip =
    activeTrip ??
    (await prisma.trip.findFirst({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: primaryTripInclude,
    }));

  if (!trip) return null;

  if (trip.id !== user.activeTripId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeTripId: trip.id },
    });
  }

  return {
    ...trip,
    itineraryDays: [...trip.itineraryDays].sort((a, b) => a.date.getTime() - b.date.getTime()),
    expenses: [...trip.expenses].sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime()),
    bookings: [...trip.bookings].sort((a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0)),
    documentNotes: [...trip.documentNotes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    memories: [...trip.memories].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}

export async function getUserTrips() {
  const user = await getOrCreateUser();
  return prisma.trip.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          savedPlaces: true,
          itineraryDays: true,
          bookings: true,
        },
      },
    },
  });
}

export async function getTravelProfile() {
  const user = await getOrCreateUser();
  return prisma.travelProfile.findUnique({ where: { userId: user.id } });
}

export function toTripDraft(trip: PrimaryTrip): TripDraft {
  return {
    name: trip.name,
    destination: trip.destination ?? undefined,
    destinationCountry: trip.destinationCountry ?? undefined,
    departureCity: trip.departureCity,
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    travelerCount: trip.travelerCount,
    budget: trip.budget,
    travelStyle: trip.travelStyle as TripDraft["travelStyle"],
    pace: trip.pace as TripDraft["pace"],
    interests: splitList(trip.interests),
    notes: trip.notes ?? undefined,
    status: trip.status,
    itineraryApprovedAt: trip.itineraryApprovedAt?.toISOString() ?? null,
  };
}

export function toDestinationRecommendations(trip: PrimaryTrip): DestinationRecommendation[] {
  const expectedCountry = trip.destinationCountry?.trim().toLowerCase();
  return trip.destinationRecommendations
    .filter((destination) => !expectedCountry || destination.country.trim().toLowerCase() === expectedCountry)
    .map((destination) => ({
      id: destination.id,
      name: destination.name,
      country: destination.country,
      whyItMatches: destination.whyItMatches,
      bestThingsToDo: splitList(destination.bestThingsToDo),
      estimatedCost: destination.estimatedCost,
      weatherSummary: destination.weatherSummary,
      flightEstimate: destination.flightEstimate ?? "Flight estimate pending",
      hotelEstimate: destination.hotelEstimate ?? "Hotel estimate pending",
      pros: splitList(destination.pros),
      cons: splitList(destination.cons),
      bestFor: splitList(destination.bestFor),
      suggestedTripDuration: destination.suggestedTripDuration,
      confidenceScore: destination.confidenceScore,
      source: {
        provider: destination.source,
        isMock: destination.source === "not-connected",
        note: destination.source === "not-connected" ? "Provider not connected." : "Live provider data.",
        classification: destination.source === "openai" ? "ai" : destination.source === "not-connected" ? "fallback" : "provider",
      },
    }));
}

export function toPlaceRecommendations(trip: PrimaryTrip): PlaceRecommendation[] {
  return trip.placeRecommendations.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    description: place.description,
    rating: place.rating ?? undefined,
    costLevel: normalizeCostLevel(place.costLevel),
    location: place.location,
    coordinates: place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : undefined,
    openingStatus: place.openingStatus ?? undefined,
    whyRecommended: place.whyRecommended,
    isHiddenGem: place.isHiddenGem,
    hiddenGemScore: place.hiddenGemScore,
      source: {
        provider: place.source,
        isMock: place.source === "not-connected",
        note: place.source === "not-connected" ? "Google Places not connected." : "Live places data.",
        classification: place.source === "not-connected" ? "fallback" : "provider",
    },
  }));
}

export function toSelectedPlaceRecommendations(trip: PrimaryTrip): PlaceRecommendation[] {
  return trip.savedPlaces.map((savedPlace) => {
    const place = savedPlace.placeRecommendation;
    if (place) {
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        description: place.description,
        rating: place.rating ?? undefined,
        costLevel: normalizeCostLevel(place.costLevel),
        location: place.location,
        coordinates: place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : undefined,
        openingStatus: place.openingStatus ?? undefined,
        whyRecommended: place.whyRecommended,
        isHiddenGem: place.isHiddenGem,
        hiddenGemScore: place.hiddenGemScore,
        source: {
          provider: place.source,
          isMock: place.source === "not-connected",
          note: place.source === "not-connected" ? "Google Places not connected." : "Live places data.",
          classification: place.source === "not-connected" ? "fallback" : "provider",
        },
      };
    }

    return {
      id: savedPlace.id,
      name: savedPlace.name,
      category: savedPlace.category,
      description: savedPlace.notes ?? "Saved for this trip plan.",
      costLevel: "$$",
      location: "",
      whyRecommended: savedPlace.notes ?? "Selected for itinerary planning.",
      isHiddenGem: savedPlace.priority === 1,
      hiddenGemScore: savedPlace.priority === 1 ? 70 : 40,
      source: {
        provider: "saved",
        isMock: false,
        note: "Saved from your trip plan.",
        classification: "manual",
      },
    };
  });
}

export function toItineraryDays(trip: PrimaryTrip): ItineraryDay[] {
  return trip.itineraryDays.map((day) => ({
    id: day.id,
    date: day.date.toISOString().slice(0, 10),
    theme: day.theme,
    morningPlan: day.morningPlan,
    afternoonPlan: day.afternoonPlan,
    eveningPlan: day.eveningPlan,
    placesIncluded: day.items.map((item) => item.title),
    restaurantIdeas: splitList(day.restaurantIdeas ?? ""),
    hiddenGem: day.hiddenGem ?? "",
    estimatedCost: day.estimatedCost > 0 ? day.estimatedCost : inferStoredDayCost(trip, day.items),
    transportNotes: day.transportNotes ?? "",
    backupOption: day.backupOption ?? "",
    notes: day.notes ?? "",
  }));
}

export function toRoutePlaceRecommendations(trip: PrimaryTrip): PlaceRecommendation[] {
  const selectedPlaces = toSelectedPlaceRecommendations(trip).filter(hasCoordinates);
  if (selectedPlaces.length >= 2) return selectedPlaces;

  const allPlaces = toPlaceRecommendations(trip);
  const placesByName = new Map(allPlaces.map((place) => [normalizeName(place.name), place]));
  const itineraryPlaces: PlaceRecommendation[] = [];
  const seen = new Set<string>();

  trip.itineraryDays.forEach((day) => {
    day.items.forEach((item) => {
      const place = placesByName.get(normalizeName(item.title));
      if (!place || !hasCoordinates(place) || seen.has(place.id)) return;
      seen.add(place.id);
      itineraryPlaces.push(place);
    });
  });

  if (itineraryPlaces.length >= 2) return itineraryPlaces;
  return allPlaces.filter(hasCoordinates);
}

function inferStoredDayCost(trip: PrimaryTrip, items: PrimaryTrip["itineraryDays"][number]["items"]) {
  const itemCost = items.reduce((sum, item) => sum + Math.max(0, item.estimatedCost), 0);
  const travelerCount = Math.max(1, trip.travelerCount);
  const days = Math.max(1, trip.itineraryDays.length || tripLength(trip.startDate, trip.endDate));
  const budgetGuided = trip.budget > 0 ? (trip.budget / days) * 0.38 : 0;
  const baseline = 62 * travelerCount + itemCost;
  return Math.round(Math.max(baseline, budgetGuided, 45 * travelerCount) / 5) * 5;
}

export function parseDateField(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(`${text}T12:00:00.000Z`) : new Date();
}

export function parseNumberField(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formString(formData: FormData, key: string, fallback = "") {
  const value = String(formData.get(key) ?? "").trim();
  return value || fallback;
}

function normalizeCostLevel(value: string | null): "$" | "$$" | "$$$" | "$$$$" {
  if (value === "$" || value === "$$" || value === "$$$" || value === "$$$$") return value;
  return "$$";
}

function hasCoordinates(place: PlaceRecommendation) {
  return Boolean(place.coordinates && Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng));
}

export async function createDefaultTripChildren(tripId: string) {
  const budgetData: Prisma.BudgetCategoryCreateManyInput[] = [
    { tripId, name: "Flights", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Hotel", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Food", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Activities", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Transport", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Shopping", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Emergency buffer", estimatedAmount: 0, actualAmount: 0 },
  ];
  await prisma.budgetCategory.createMany({ data: budgetData });
}
