import { beforeEach, describe, expect, it, vi } from "vitest";

const routeDeps = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  prisma: {
    itineraryDay: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    trip: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: routeDeps.revalidatePath }));
vi.mock("../src/lib/db/prisma", () => ({ prisma: routeDeps.prisma }));
vi.mock("../src/lib/db/travel", () => ({ getPrimaryTrip: vi.fn() }));

import { PATCH } from "../src/app/api/itinerary/day/route";

describe("itinerary route regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeDeps.prisma.$transaction.mockImplementation(async (callback: (tx: typeof routeDeps.prisma) => unknown) =>
      callback(routeDeps.prisma),
    );
  });

  it("invalidates itinerary approval when an approved day is edited", async () => {
    routeDeps.prisma.itineraryDay.findUnique.mockResolvedValue({
      id: "day-1",
      tripId: "trip-1",
      trip: { status: "itinerary_approved" },
    });
    routeDeps.prisma.itineraryDay.update.mockResolvedValue({
      id: "day-1",
      date: new Date("2026-05-18T12:00:00.000Z"),
      theme: "Updated",
      morningPlan: "Morning",
      afternoonPlan: "Afternoon",
      eveningPlan: "Evening",
      restaurantIdeas: "",
      hiddenGem: "",
      estimatedCost: 120,
      transportNotes: "",
      backupOption: "",
      notes: "",
      items: [],
    });

    const response = await PATCH(
      new Request("http://localhost/api/itinerary/day", {
        method: "PATCH",
        body: JSON.stringify({
          id: "day-1",
          date: "2026-05-18",
          theme: "Updated",
          morningPlan: "Morning",
          afternoonPlan: "Afternoon",
          eveningPlan: "Evening",
          restaurantIdeas: [],
          hiddenGem: "",
          estimatedCost: 120,
          transportNotes: "",
          backupOption: "",
          notes: "",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(routeDeps.prisma.trip.update).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: {
        status: "planning",
        itineraryApprovedAt: null,
      },
    });
  });
});
