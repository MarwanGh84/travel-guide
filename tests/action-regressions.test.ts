import { beforeEach, describe, expect, it, vi } from "vitest";

const actionDeps = vi.hoisted(() => ({
  prisma: {
    trip: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
  getOrCreateUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("../src/lib/db/prisma", () => ({ prisma: actionDeps.prisma }));
vi.mock("../src/lib/db/travel", () => ({
  getOrCreateUser: actionDeps.getOrCreateUser,
  getPrimaryTrip: vi.fn(),
  parseDateField: vi.fn(),
  parseNumberField: vi.fn(),
  formString: (formData: FormData, key: string, fallback = "") => String(formData.get(key) ?? "").trim() || fallback,
  createDefaultTripChildren: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: actionDeps.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../src/lib/ai/openai", () => ({
  recommendDestinations: vi.fn(),
}));
vi.mock("../src/lib/api/placesService", () => ({
  getPlacesForTrip: vi.fn(),
}));
vi.mock("../src/lib/api/placeSources/sourceAggregator", () => ({
  aggregateIntelligence: vi.fn(),
}));

import { deleteTripById } from "../src/app/actions";

describe("trip deletion regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a non-active trip without changing the active trip pointer", async () => {
    actionDeps.getOrCreateUser.mockResolvedValue({ id: "user-1", activeTripId: "active-trip" });
    actionDeps.prisma.trip.findFirst.mockResolvedValueOnce({ id: "old-trip" });

    const formData = new FormData();
    formData.set("tripId", "old-trip");

    await deleteTripById(formData);

    expect(actionDeps.prisma.trip.delete).toHaveBeenCalledWith({ where: { id: "old-trip" } });
    expect(actionDeps.prisma.user.update).not.toHaveBeenCalled();
  });

  it("promotes the next newest trip after deleting the active trip", async () => {
    actionDeps.getOrCreateUser.mockResolvedValue({ id: "user-1", activeTripId: "active-trip" });
    actionDeps.prisma.trip.findFirst
      .mockResolvedValueOnce({ id: "active-trip" })
      .mockResolvedValueOnce({ id: "next-trip" });

    const formData = new FormData();
    formData.set("tripId", "active-trip");

    await deleteTripById(formData);

    expect(actionDeps.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeTripId: "next-trip" },
    });
  });
});
