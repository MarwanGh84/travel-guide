import { describe, it, expect, vi, beforeEach } from "vitest";
import { addSavedPlaceToDay } from "../src/app/actions";
import { prisma } from "../src/lib/db/prisma";
import { getPrimaryTrip } from "../src/lib/db/travel";

vi.mock("../src/lib/db/prisma", () => ({
  prisma: {
    placeRecommendation: {
      findFirst: vi.fn(),
    },
    itineraryItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    trip: {
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("../src/lib/db/travel", () => ({
  getPrimaryTrip: vi.fn(),
  formString: (formData: FormData, key: string) => formData.get(key) as string,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("addSavedPlaceToDay Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a saved place into a specific itinerary segment", async () => {
    const mockTrip = { id: "trip-1", status: "planning", currency: "USD" };
    const mockPlace = { id: "place-1", name: "Eiffel Tower", category: "Landmark" };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getPrimaryTrip as any).mockResolvedValue(mockTrip);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.placeRecommendation.findFirst as any).mockResolvedValue(mockPlace);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.itineraryItem.findFirst as any).mockResolvedValue(null); // No duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.itineraryItem.create as any).mockResolvedValue({ id: "item-1" });

    const formData = new FormData();
    formData.append("placeId", "place-1");
    formData.append("dayId", "day-1");
    formData.append("timeOfDay", "morning");

    await addSavedPlaceToDay(formData);

    expect(prisma.itineraryItem.create).toHaveBeenCalledWith({
      data: {
        itineraryDayId: "day-1",
        title: "Eiffel Tower",
        placeRecommendationId: "place-1",
        timeOfDay: "morning",
        description: "Manually added from discovery.",
        sortOrder: 0,
      },
    });
  });

  it("invalidates trip approval if itinerary is modified", async () => {
    const mockTrip = { id: "trip-1", status: "itinerary_approved", currency: "USD" };
    const mockPlace = { id: "place-1", name: "Eiffel Tower", category: "Landmark" };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getPrimaryTrip as any).mockResolvedValue(mockTrip);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.placeRecommendation.findFirst as any).mockResolvedValue(mockPlace);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.itineraryItem.findFirst as any).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("placeId", "place-1");
    formData.append("dayId", "day-1");
    formData.append("timeOfDay", "afternoon");

    await addSavedPlaceToDay(formData);

    expect(prisma.trip.update).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: { status: "planning", itineraryApprovedAt: null },
    });
  });

  it("prevents duplicate non-repeatable places across the itinerary", async () => {
    const mockTrip = { id: "trip-1", status: "planning", currency: "USD" };
    const mockPlace = { id: "place-1", name: "Eiffel Tower", category: "Landmark" };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getPrimaryTrip as any).mockResolvedValue(mockTrip);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.placeRecommendation.findFirst as any).mockResolvedValue(mockPlace);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.itineraryItem.findFirst as any).mockResolvedValue({ id: "existing-item" });

    const formData = new FormData();
    formData.append("placeId", "place-1");
    formData.append("dayId", "day-1");
    formData.append("timeOfDay", "evening");

    await expect(addSavedPlaceToDay(formData)).rejects.toThrow("Already in itinerary");
    expect(prisma.itineraryItem.create).not.toHaveBeenCalled();
  });
});
