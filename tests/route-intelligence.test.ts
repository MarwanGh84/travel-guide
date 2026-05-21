import { describe, it, expect } from "vitest";
import { computeRouteRealityCheck } from "../src/lib/travel/route-intelligence";
import { MapRoute } from "../src/lib/api/mapsService";

const baseRoute: MapRoute = {
  zoom: 12,
  pins: [],
  missingPlaces: [],
  routePins: [],
  segments: [],
  routeNote: "Test",
  metricSource: "google-routes",
  isMock: false,
  provider: "google-maps",
};

describe("Route Intelligence", () => {
  it("detects missing coordinates", () => {
    const route: MapRoute = {
      ...baseRoute,
      missingPlaces: [{ id: "1", label: "Place 1", location: "Loc 1", reason: "No coords" }],
    };
    const { warnings, status } = computeRouteRealityCheck(route);
    expect(warnings.some(w => w.message.includes("missing coordinates"))).toBe(true);
    expect(status).toBe("Incomplete");
  });

  it("detects fewer than 2 mapped points", () => {
    const route: MapRoute = {
      ...baseRoute,
      pins: [{ id: "1", label: "Place 1", category: "Cat 1", location: "Loc 1", isHiddenGem: false, lat: 0, lng: 0, coordinateSource: "place-record", matchMethod: "linked-record" }],
    };
    const { warnings, status } = computeRouteRealityCheck(route);
    expect(warnings.some(w => w.message.includes("Fewer than 2 mapped points"))).toBe(true);
    expect(status).toBe("Incomplete");
  });

  it("detects straight-line estimates", () => {
    const route: MapRoute = {
      ...baseRoute,
      metricSource: "computed",
      pins: [
        { id: "1", label: "Place 1", category: "Cat 1", location: "Loc 1", isHiddenGem: false, lat: 0, lng: 0, coordinateSource: "place-record", matchMethod: "linked-record" },
        { id: "2", label: "Place 2", category: "Cat 2", location: "Loc 2", isHiddenGem: false, lat: 1, lng: 1, coordinateSource: "place-record", matchMethod: "linked-record" },
      ],
    };
    const { warnings, status } = computeRouteRealityCheck(route);
    expect(warnings.some(w => w.message.includes("straight-line distance estimates"))).toBe(true);
    expect(status).toBe("Needs review");
  });

  it("detects AI-only unlinked points", () => {
    const route: MapRoute = {
      ...baseRoute,
      pins: [
        { id: "1", label: "AI Point", category: "Cat 1", location: "Loc 1", isHiddenGem: false, lat: 0, lng: 0, coordinateSource: "place-record", matchMethod: "unlinked-itinerary-item" },
        { id: "2", label: "Real Point", category: "Cat 2", location: "Loc 2", isHiddenGem: false, lat: 1, lng: 1, coordinateSource: "place-record", matchMethod: "linked-record" },
      ],
    };
    const { warnings, status } = computeRouteRealityCheck(route);
    expect(warnings.some(w => w.message.includes("AI-only points"))).toBe(true);
    expect(status).toBe("Needs review");
  });

  it("verifies clean route", () => {
    const route: MapRoute = {
      ...baseRoute,
      pins: [
        { id: "1", label: "Real Point 1", category: "Cat 1", location: "Loc 1", isHiddenGem: false, lat: 0, lng: 0, coordinateSource: "place-record", matchMethod: "linked-record" },
        { id: "2", label: "Real Point 2", category: "Cat 2", location: "Loc 2", isHiddenGem: false, lat: 1, lng: 1, coordinateSource: "place-record", matchMethod: "linked-record" },
      ],
    };
    const { warnings, status } = computeRouteRealityCheck(route);
    expect(warnings.length).toBe(0);
    expect(status).toBe("Good");
  });
});
