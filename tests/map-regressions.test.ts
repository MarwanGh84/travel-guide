import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStaticMapUrl, getMapRoute } from "../src/lib/api/mapsService";
import type { RoutePlaceRecommendation } from "../src/lib/db/travel";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function makePlace(overrides: Partial<RoutePlaceRecommendation> = {}): RoutePlaceRecommendation {
  return {
    id: "place-1",
    name: "Unmapped place",
    category: "Culture",
    description: "Provider-backed place",
    costLevel: "$$",
    location: "Byblos",
    whyRecommended: "Historic",
    isHiddenGem: false,
    hiddenGemScore: 10,
    source: {
      provider: "google-places",
      isMock: false,
      note: "Provider",
      classification: "provider",
    },
    routeMatch: "linked-record",
    ...overrides,
  };
}

describe("map regressions", () => {
  it("lists missing-coordinate places instead of fabricating pins or a static map", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");

    const route = await getMapRoute([makePlace()]);

    expect(route.pins).toEqual([]);
    expect(route.missingPlaces).toEqual([
      expect.objectContaining({
        id: "place-1",
        reason: "No provider coordinates found.",
      }),
    ]);
    expect(route.center).toBeUndefined();
    expect(route.metricSource).toBe("unavailable");
    expect(buildStaticMapUrl(route)).toBeNull();
  });

  it("uses only real coordinates when building route pins", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");

    const route = await getMapRoute([
      makePlace({
        id: "mapped",
        name: "Byblos Castle",
        coordinates: { lat: 34.1201, lng: 35.6486 },
      }),
      makePlace({ id: "missing", name: "Unknown cafe" }),
    ]);

    expect(route.pins).toHaveLength(1);
    expect(route.pins[0]).toMatchObject({
      id: "mapped",
      coordinateSource: "place-record",
    });
    expect(route.missingPlaces).toHaveLength(1);
  });
});
