import { HotelResult } from "./travel";

export type HotelInventoryStatus = "live" | "empty" | "missing-credentials" | "provider-error";

export type StayZoneRecommendation = {
  id: string;
  areaName: string;
  destination: string;
  country: string;
  reason: string;
  bestFor: string[];
  nearbyPlaces: string[];
  averageDistanceKm?: number;
  estimatedTravelTime?: string;
  budgetFit: "low" | "medium" | "high" | "luxury" | "unknown";
  pros: string[];
  cons: string[];
  confidenceScore: number;
  latitude?: number;
  longitude?: number;
  source: "itinerary-analysis" | "google-places" | "osm" | "ai";
  hotels: HotelResult[];
  hotelInventoryStatus: HotelInventoryStatus;
  hotelInventoryMessage: string;
};

export type HotelSearchSuggestion = {
  label: string;
  query: string;
  area: string;
};
