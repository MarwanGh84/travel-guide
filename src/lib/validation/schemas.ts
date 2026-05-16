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
  rawSnippet: z.string(),
});

export const SaveImportsSchema = z.object({
  imports: z.array(ParsedTravelEmailSchema),
});

export const AiItineraryRequestSchema = z.object({
  save: z.boolean().optional(),
  selectedPlaceIds: z.array(z.string()).optional(),
});
