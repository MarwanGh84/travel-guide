import { describe, expect, it, vi, beforeEach } from "vitest";

const deps = vi.hoisted(() => ({
  prisma: {
    trip: {
      findFirst: vi.fn(),
    },
    bookingChecklistItem: {
      update: vi.fn(),
      createMany: vi.fn(),
    },
    budgetCategory: {
      createMany: vi.fn(),
    },
  },
  getPrimaryTrip: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("../src/lib/db/prisma", () => ({ prisma: deps.prisma }));
vi.mock("../src/lib/db/travel", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    getPrimaryTrip: deps.getPrimaryTrip,
  };
});
vi.mock("next/cache", () => ({ revalidatePath: deps.revalidatePath }));

import { updateChecklistItemStatus } from "../src/app/actions";
import { createDefaultTripChildren } from "../src/lib/db/travel";

describe("Booking Checklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes default checklist items for a new trip", async () => {
    await createDefaultTripChildren("trip-123");
    
    expect(deps.prisma.bookingChecklistItem.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { tripId: "trip-123", key: "flights", label: "Flights" },
        { tripId: "trip-123", key: "stay", label: "Hotel / Stay" },
      ])
    });
    
    // Should have 11 items total as per requirements
    const createManyMock = deps.prisma.bookingChecklistItem.createMany as { mock: { calls: { data: unknown[] }[][] } };
    const calledData = createManyMock.mock.calls[0][0].data;
    expect(calledData.length).toBe(11);
  });

  it("updates checklist item status via server action", async () => {
    deps.getPrimaryTrip.mockResolvedValue({ id: "trip-123" });
    
    const formData = new FormData();
    formData.set("itemId", "item-abc");
    formData.set("status", "done");

    await updateChecklistItemStatus(formData);

    expect(deps.prisma.bookingChecklistItem.update).toHaveBeenCalledWith({
      where: { id: "item-abc", tripId: "trip-123" },
      data: { status: "done" },
    });
    expect(deps.revalidatePath).toHaveBeenCalledWith("/bookings");
  });
});
