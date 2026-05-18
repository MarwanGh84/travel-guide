import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.connectedAccount.deleteMany();
  await prisma.aiGenerationLog.deleteMany();
  await prisma.apiProviderLog.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.documentNote.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.itineraryItem.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.savedPlace.deleteMany();
  await prisma.placeRecommendation.deleteMany();
  await prisma.destinationRecommendation.deleteMany();
  await prisma.destinationIntel.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.travelProfile.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "local@travel-guide.app",
      name: "E2E User",
      profile: {
        create: {
          travelPace: "medium",
          budgetStyle: "balanced",
          hiddenGemInterest: true,
        },
      },
    },
  });

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      name: "E2E Byblos",
      destination: "Byblos",
      destinationCountry: "Lebanon",
      departureCity: "Dubai",
      startDate: new Date("2026-05-18T12:00:00.000Z"),
      endDate: new Date("2026-05-20T12:00:00.000Z"),
      travelerCount: 2,
      budget: 1200,
      travelStyle: "balanced",
      pace: "medium",
      interests: "history, food",
      status: "itinerary_approved",
      itineraryApprovedAt: new Date("2026-05-18T12:00:00.000Z"),
      budgetCategories: {
        create: [
          { name: "Food", estimatedAmount: 300, actualAmount: 0 },
          { name: "Activities", estimatedAmount: 200, actualAmount: 0 },
        ],
      },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeTripId: trip.id },
  });

  const byblosCastle = await prisma.placeRecommendation.create({
    data: {
      tripId: trip.id,
      name: "Byblos Castle",
      category: "Historic site",
      description: "Crusader castle",
      rating: 4.7,
      costLevel: "$$",
      location: "Byblos, Lebanon",
      latitude: 34.1201,
      longitude: 35.6486,
      whyRecommended: "Core historic stop",
      hiddenGemScore: 20,
      isHiddenGem: false,
      source: "google-places",
    },
  });

  const oldSouk = await prisma.placeRecommendation.create({
    data: {
      tripId: trip.id,
      name: "Byblos Old Souk",
      category: "Market",
      description: "Historic market lanes",
      rating: 4.6,
      costLevel: "$$",
      location: "Byblos, Lebanon",
      latitude: 34.1208,
      longitude: 35.6474,
      whyRecommended: "Walkable local stop",
      hiddenGemScore: 35,
      isHiddenGem: false,
      source: "google-places",
    },
  });

  const unmappedCafe = await prisma.placeRecommendation.create({
    data: {
      tripId: trip.id,
      name: "Unmapped Cafe",
      category: "Cafe",
      description: "No coordinates",
      costLevel: "$$",
      location: "Byblos, Lebanon",
      whyRecommended: "Useful missing-coordinate fixture",
      hiddenGemScore: 10,
      isHiddenGem: false,
      source: "google-places",
    },
  });

  await prisma.savedPlace.create({
    data: {
      tripId: trip.id,
      placeRecommendationId: byblosCastle.id,
      name: byblosCastle.name,
      category: byblosCastle.category,
      notes: byblosCastle.whyRecommended,
      priority: 2,
    },
  });

  const firstDay = await prisma.itineraryDay.create({
    data: {
      tripId: trip.id,
      date: new Date("2026-05-18T12:00:00.000Z"),
      theme: "Historic Byblos",
      morningPlan: "Visit Byblos Castle",
      afternoonPlan: "Walk the old souk",
      eveningPlan: "Dinner by the harbor",
      estimatedCost: 120,
      items: {
        create: [
          {
            placeRecommendationId: byblosCastle.id,
            title: byblosCastle.name,
            timeOfDay: "morning",
            description: "Castle visit",
            estimatedCost: 20,
            sortOrder: 0,
          },
          {
            placeRecommendationId: oldSouk.id,
            title: oldSouk.name,
            timeOfDay: "afternoon",
            description: "Souk walk",
            estimatedCost: 10,
            sortOrder: 1,
          },
          {
            placeRecommendationId: unmappedCafe.id,
            title: unmappedCafe.name,
            timeOfDay: "evening",
            description: "Cafe stop",
            estimatedCost: 15,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.destinationRecommendation.create({
    data: {
      tripId: trip.id,
      name: "Byblos",
      country: "Lebanon",
      whyItMatches: "Historic coast",
      bestThingsToDo: "Old souk, castle",
      estimatedCost: 1200,
      weatherSummary: "AI estimate",
      flightEstimate: "AI estimate",
      hotelEstimate: "AI estimate",
      pros: "Walkable",
      cons: "Busy weekends",
      bestFor: "culture",
      suggestedTripDuration: "3 days",
      confidenceScore: 95,
      source: "openai",
    },
  });

  await prisma.booking.create({
    data: {
      tripId: trip.id,
      type: "Hotel",
      title: "Seed Hotel",
      provider: "Manual",
      confirmationNumber: "SEED-1",
      startAt: firstDay.date,
      endAt: new Date("2026-05-20T12:00:00.000Z"),
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
