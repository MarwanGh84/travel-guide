import { MapRoute } from "@/lib/api/mapsService";

export type RouteWarning = {
  message: string;
  type: "warning" | "error" | "info";
  action?: string;
};

export type RouteStatus = "Good" | "Needs review" | "Incomplete";

export function computeRouteRealityCheck(route: MapRoute): { warnings: RouteWarning[], status: RouteStatus } {
  const warnings: RouteWarning[] = [];
  
  // 1. Missing coordinates
  if (route.missingPlaces.length > 0) {
    warnings.push({ 
      message: `${route.missingPlaces.length} places are missing coordinates and cannot be mapped.`, 
      type: "error",
      action: "fix missing coordinates"
    });
  }

  // 2. Fewer than 2 points
  if (route.pins.length < 2) {
    warnings.push({ 
      message: "Fewer than 2 mapped points. Route path and segments cannot be computed.", 
      type: "error",
      action: "save more mapped places"
    });
  }

  // 3. Straight-line estimates
  if (route.metricSource === "computed" && route.pins.length >= 2) {
    warnings.push({ 
      message: "Google Routes unavailable. Using straight-line distance estimates.", 
      type: "warning",
      action: "open in Google Maps"
    });
  }

  // 4. Name-only matches
  const nameOnlyMatches = route.pins.filter(p => p.matchMethod === "matched-by-name");
  if (nameOnlyMatches.length > 0) {
    warnings.push({ 
      message: `${nameOnlyMatches.length} places matched by name only. Coordinates might be approximate.`, 
      type: "warning",
      action: "review itinerary"
    });
  }

  // 5. AI-only unlinked points
  const aiOnlyPoints = route.pins.filter(p => p.matchMethod === "unlinked-itinerary-item");
  if (aiOnlyPoints.length > 0) {
    warnings.push({ 
      message: `Itinerary has ${aiOnlyPoints.length} AI-only points not linked to real places.`, 
      type: "warning",
      action: "link to real places"
    });
  }

  // 6. Too many points
  if (route.pins.length > 12) {
    warnings.push({ 
      message: "Route has many points. Tactical view may be cluttered.", 
      type: "info"
    });
  }

  // 7. Route order check
  const isItineraryBased = route.pins.some(p => ["linked-record", "matched-by-name", "unlinked-itinerary-item"].includes(p.matchMethod || ""));
  if (!isItineraryBased && route.pins.length > 0) {
    warnings.push({ 
      message: "Route is based on saved order, not itinerary flow. Order may be incomplete.", 
      type: "info",
      action: "review itinerary"
    });
  }

  // Status computation
  const hasError = warnings.some(w => w.type === "error");
  const hasWarning = warnings.some(w => w.type === "warning");
  const status: RouteStatus = hasError ? "Incomplete" : hasWarning ? "Needs review" : "Good";

  return { warnings, status };
}
