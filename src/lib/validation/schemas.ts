import { z } from "zod";

export const TravelStyleSchema = z.enum([
  "relaxed",
  "balanced",
  "adventure",
  "luxury",
  "family",
  "romantic",
  "cultural",
]);

export const TravelPaceSchema = z.enum(["slow", "medium", "packed"]);

export const TripDraftSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100),
  destination: z.string().optional(),
  destinationCountry: z.string().optional(),
  departureCity: z.string().min(1, "Departure city is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format"),
  travelerCount: z.coerce.number().int().min(1),
  budget: z.coerce.number().min(0),
  travelStyle: TravelStyleSchema,
  pace: TravelPaceSchema,
  interests: z.array(z.string()).or(z.string().transform((s) => (s ? [s] : []))),
  notes: z.string().optional(),
  status: z.string().optional().default("planning"),
});

export const ItineraryDaySchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string().min(1),
  morningPlan: z.string(),
  afternoonPlan: z.string(),
  eveningPlan: z.string(),
  placesIncluded: z.array(z.string()),
  restaurantIdeas: z.array(z.string()).or(z.string().transform((s) => s.split(",").map(i => i.trim()).filter(Boolean))),
  hiddenGem: z.string().optional(),
  estimatedCost: z.coerce.number().min(0),
  transportNotes: z.string().optional(),
  backupOption: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateItineraryDaySchema = ItineraryDaySchema.partial().extend({
  id: z.string().min(1),
});

export const ParsedTravelEmailSchema = z.object({
  sourceId: z.string().optional(),
  provider: z.enum(["Booking.com", "Expedia", "Unknown"]),
  bookingType: z.enum(["Hotel", "Flight", "Tour", "Car rental", "Restaurant", "Travel"]),
  title: z.string().min(1),
  confirmationNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  address: z.string().optional(),
  link: z.string().optional(),
  price: z.string().optional(),
  guestName: z.string().optional(),
  cancellationNotes: z.string().optional(),
  sourceSubject: z.string().optional(),
  sourceFrom: z.string().optional(),
  importFingerprint: z.string(),
  confidenceScore: z.number(),
  confidenceLabel: z.enum(["high-confidence", "possible", "rejected"]),
  autoSelect: z.boolean(),
  rejectionReasons: z.array(z.string()),
  rawSnippet: z.string(),
});

export const SaveImportsSchema = z.object({
  imports: z.array(ParsedTravelEmailSchema),
});

export const AiItineraryRequestSchema = z.object({
  save: z.boolean().optional(),
  selectedPlaceIds: z.array(z.string()).optional(),
});

export const AiDestinationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  country: z.string().min(1),
  whyItMatches: z.string().default(""),
  bestThingsToDo: z.array(z.string()).default([]),
  estimatedCost: z.coerce.number().min(0).default(0),
  weatherSummary: z.string().default(""),
  flightEstimate: z.string().default(""),
  hotelEstimate: z.string().default(""),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  bestFor: z.array(z.string()).default([]),
  suggestedTripDuration: z.string().default("Flexible"),
  confidenceScore: z.coerce.number().min(0).max(100).default(0),
});

export const AiDestinationsResponseSchema = z.object({
  destinations: z.array(AiDestinationSchema).default([]),
});

export const AiItineraryDayResponseSchema = z.object({
  id: z.string().optional(),
  theme: z.string().optional(),
  morningPlan: z.string().optional(),
  afternoonPlan: z.string().optional(),
  eveningPlan: z.string().optional(),
  restaurantIdeas: z.array(z.string()).optional(),
  hiddenGem: z.string().optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  transportNotes: z.string().optional(),
  backupOption: z.string().optional(),
  notes: z.string().optional(),
  placesIncluded: z.array(z.string()).optional(),
  placeIds: z.array(z.string()).optional(),
});

export const AiItineraryResponseSchema = z.object({
  days: z.array(AiItineraryDayResponseSchema).default([]),
});

export const GoogleTextSearchResponseSchema = z.object({
  places: z.array(z.object({
    id: z.string().optional(),
    displayName: z.object({ text: z.string().optional() }).optional(),
    formattedAddress: z.string().optional(),
    rating: z.number().optional(),
    priceLevel: z.string().optional(),
    types: z.array(z.string()).optional(),
    location: z.object({ latitude: z.number().optional(), longitude: z.number().optional() }).optional(),
    regularOpeningHours: z.object({ openNow: z.boolean().optional() }).optional(),
    primaryTypeDisplayName: z.object({ text: z.string().optional() }).optional(),
    editorialSummary: z.object({ text: z.string().optional() }).optional(),
    websiteUri: z.string().optional(),
    userRatingCount: z.number().optional(),
  })).default([]),
});

export const GoogleRoutesResponseSchema = z.object({
  routes: z.array(z.object({
    distanceMeters: z.number().optional(),
    duration: z.string().optional(),
    polyline: z.object({ encodedPolyline: z.string().optional() }).optional(),
  })).optional(),
});

export const RapidHotelItemSchema = z.object({
  hotel_name: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  review_score: z.number().optional(),
  review_score_word: z.string().optional(),
  composite_price_breakdown: z.object({
    gross_amount_per_night: z.object({
      value: z.number().optional(),
      currency: z.string().optional(),
    }).optional(),
  }).optional(),
  min_total_price: z.number().optional(),
  currency_code: z.string().optional(),
  main_photo_url: z.string().url().optional(),
  checkin: z.object({ from: z.string().optional() }).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  distance_to_cc: z.string().optional(),
  url: z.string().url().optional(),
}).passthrough();

export const RapidHotelSearchResponseSchema = z.object({
  status: z.boolean().optional(),
  message: z.union([
    z.string(),
    z.array(z.record(z.string(), z.string())),
  ]).optional(),
  data: z.object({
    result: z.array(RapidHotelItemSchema).optional(),
  }).optional(),
  result: z.array(RapidHotelItemSchema).optional(),
}).passthrough();

export const GeocodeResponseSchema = z.object({
  results: z.array(z.object({
    name: z.string(),
    country: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string().optional(),
  })).optional(),
});

export const ForecastResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.string()).optional(),
    temperature_2m_max: z.array(z.number()).optional(),
    temperature_2m_min: z.array(z.number()).optional(),
    precipitation_probability_max: z.array(z.number()).optional(),
    weather_code: z.array(z.number()).optional(),
  }).optional(),
});

export const FrankfurterResponseSchema = z.object({
  rates: z.record(z.string(), z.number()).optional(),
});

export const OverpassResponseSchema = z.object({
  elements: z.array(z.object({
    type: z.enum(["node", "way", "relation"]),
    id: z.number(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    center: z.object({ lat: z.number(), lon: z.number() }).optional(),
    tags: z.record(z.string(), z.string()).optional(),
  })).default([]),
});

export const DestinationIntelligenceSchema = z.object({
  name: z.string(),
  country: z.string(),
  overview: z.string().optional(),
  neighborhoods: z.array(z.string()).optional(),
  culture: z.string().optional(),
  history: z.string().optional(),
  practicalNotes: z.array(z.string()).optional(),
  source: z.enum(["google", "osm", "wikivoyage", "wikidata"]),
});
