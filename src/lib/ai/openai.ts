import OpenAI from "openai";
import type { DestinationRecommendation, ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";
import { tripLength } from "@/lib/utils";
import { AiDestinationsResponseSchema, AiItineraryResponseSchema } from "@/lib/validation/schemas";

const model = "gpt-5.5";

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function structuredJson<T>(
  prompt: string,
  fallback: T,
  validate?: (value: unknown) => T,
): Promise<{ ok: boolean; data: T; raw: string; isMock: boolean }> {
  const openai = getClient();
  if (!openai) {
    return { ok: true, data: fallback, raw: "No API key configured.", isMock: true };
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Return valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content || "";
    const parsed = JSON.parse(raw);
    const data = validate ? validate(parsed) : (parsed as T);
    return { ok: true, data, raw, isMock: false };
  } catch (error) {
    console.error("OpenAI Error:", error);
    return { ok: false, data: fallback, raw: error instanceof Error ? error.message : "OpenAI Error", isMock: false };
  }
}

export async function generateFullItinerary(trip: TripDraft, savedPlaces: PlaceRecommendation[] = []) {
  const length = tripLength(trip.startDate, trip.endDate);
  const selectedPlaceNames = savedPlaces.map((place) => place.name);

  const result = await structuredJson<{ days: unknown[] }>(
    `Generate a high-density, professional day-by-day itinerary for exactly ${length} days as a JSON object with a "days" array.
Return each day with this exact shape: { "theme": string, "morningPlan": string, "afternoonPlan": string, "eveningPlan": string, "restaurantIdeas": string[], "hiddenGem": string, "estimatedCost": number, "transportNotes": string, "backupOption": string, "notes": string, "placesIncluded": string[] }.
The estimatedCost must be a realistic numeric daily out-of-pocket estimate for all travelers in USD.
The placesIncluded field must use only exact names from this provider-backed list: ${JSON.stringify(selectedPlaceNames)}.
Mention the chosen places by exact name inside the morningPlan, afternoonPlan, or eveningPlan text so the itinerary reads as a plan built from real selected locations, not generic prose.
Trip: ${JSON.stringify(trip)}`,
    { days: [] },
    (value) => AiItineraryResponseSchema.parse(value),
  );

  const rawDays = Array.isArray(result.data?.days) ? result.data.days : [];
  const normalized = normalizeItineraryDays(rawDays, length, trip);

  return {
    ...result,
    data: normalized,
  };
}

export function normalizeItineraryDays(rawDays: unknown[], expectedLength: number, trip: TripDraft): ItineraryDay[] {
  const normalized: ItineraryDay[] = [];
  const startDate = new Date(`${trip.startDate}T12:00:00.000Z`);

  for (let i = 0; i < expectedLength; i++) {
    const rawDay = (Array.isArray(rawDays) && isRecord(rawDays[i])) ? (rawDays[i] as Record<string, unknown>) : {};
    const currentDate = new Date(startDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + i);
    const dateStr = currentDate.toISOString().slice(0, 10);

    normalized.push({
      id: (rawDay.id as string) || `ai-day-${i + 1}`,
      date: dateStr,
      theme: stringValue(rawDay.theme) || `Day ${i + 1} exploration`,
      morningPlan: stringValue(rawDay.morningPlan) || "Explore the local neighborhood and find a nice breakfast spot.",
      afternoonPlan: stringValue(rawDay.afternoonPlan) || "Visit nearby points of interest or relax at a local cafe.",
      eveningPlan: stringValue(rawDay.eveningPlan) || "Enjoy a nice dinner and a walk through the city.",
      placesIncluded: stringArray(rawDay.placesIncluded),
      restaurantIdeas: stringArray(rawDay.restaurantIdeas),
      hiddenGem: stringValue(rawDay.hiddenGem) || "",
      estimatedCost: numberValue(rawDay.estimatedCost) || 50,
      transportNotes: stringValue(rawDay.transportNotes) || "Walking or local transit recommended.",
      backupOption: stringValue(rawDay.backupOption) || "Indoor museum or shopping center.",
      notes: stringValue(rawDay.notes) || "",
    });
  }

  return normalized;
}

export async function recommendDestinations(trip: TripDraft) {
  const sameCountryRule = trip.destinationCountry
    ? `Every recommendation must be inside ${trip.destinationCountry}. The "country" field must be exactly "${trip.destinationCountry}". Do not recommend nearby countries.`
    : "Recommend destinations that best fit the trip profile.";

  let result = await structuredJson<{ destinations: DestinationRecommendation[] }>(
    `Recommend 3 destinations for this trip profile: ${JSON.stringify(trip)}.
${sameCountryRule}
Return valid JSON as { "destinations": [...] }.
Each destination must include:
{ "name": string, "country": string, "whyItMatches": string, "bestThingsToDo": string[], "estimatedCost": number, "weatherSummary": string, "flightEstimate": string, "hotelEstimate": string, "pros": string[], "cons": string[], "bestFor": string[], "suggestedTripDuration": string, "confidenceScore": number }`,
    { destinations: [] },
    (value) => AiDestinationsResponseSchema.parse(value) as { destinations: DestinationRecommendation[] },
  );

  let destinations = normalizeDestinationsForTrip(result.data?.destinations, trip);

  if (trip.destinationCountry && result.ok && destinations.length === 0) {
    result = await structuredJson<{ destinations: DestinationRecommendation[] }>(
      `Return 3 destinations only inside ${trip.destinationCountry} for this trip profile: ${JSON.stringify(trip)}.
Do not include any other country. The "country" field for every item must be exactly "${trip.destinationCountry}".
Return valid JSON as { "destinations": [...] } using this exact shape:
{ "name": string, "country": string, "whyItMatches": string, "bestThingsToDo": string[], "estimatedCost": number, "weatherSummary": string, "flightEstimate": string, "hotelEstimate": string, "pros": string[], "cons": string[], "bestFor": string[], "suggestedTripDuration": string, "confidenceScore": number }`,
      { destinations: [] },
      (value) => AiDestinationsResponseSchema.parse(value) as { destinations: DestinationRecommendation[] },
    );
    destinations = normalizeDestinationsForTrip(result.data?.destinations, trip);
  }

  return {
    ...result,
    data: destinations,
  };
}

export async function regenerateOneDay(day: ItineraryDay, instruction: string) {
  return structuredJson<ItineraryDay>(
    `Regenerate this itinerary day as JSON based on the following instruction: "${instruction}". Original Day: ${JSON.stringify(day)}`,
    day,
  );
}

export async function generatePackingList(trip: TripDraft) {
  return structuredJson<string[]>(
    `Generate a practical packing list as a JSON string array. Trip: ${JSON.stringify(trip)}`,
    ["Comfortable walking shoes", "Light jacket", "Portable charger", "Travel adapter", "Passport and insurance copies"],
  );
}

export async function generateTripSummary(notes: string) {
  return structuredJson<{ summary: string; revisit: string[]; nextTime: string[] }>(
    `Generate a concise trip summary, a list of places to revisit, and ideas for next time as JSON based on these memories: ${notes}`,
    { summary: "A journey worth remembering.", revisit: [], nextTime: [] },
  );
}

export function getHiddenGemScore(name: string, category: string): number {
  const combined = `${name}${category}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean);
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeDestination(value: unknown, index: number): DestinationRecommendation {
  const destination = isRecord(value) ? value : {};
  return {
    id: stringValue(destination.id) || `ai-destination-${index + 1}`,
    name: stringValue(destination.name) || `Destination ${index + 1}`,
    country: stringValue(destination.country) || "Unknown",
    whyItMatches: stringValue(destination.whyItMatches) || "Matched to your trip profile.",
    bestThingsToDo: stringArray(destination.bestThingsToDo),
    estimatedCost: numberValue(destination.estimatedCost),
    weatherSummary: stringValue(destination.weatherSummary) || "Weather estimate unavailable.",
    flightEstimate: stringValue(destination.flightEstimate) || "Flight estimate pending.",
    hotelEstimate: stringValue(destination.hotelEstimate) || "Hotel estimate pending.",
    pros: stringArray(destination.pros),
    cons: stringArray(destination.cons),
    bestFor: stringArray(destination.bestFor),
    suggestedTripDuration: stringValue(destination.suggestedTripDuration) || "Flexible",
    confidenceScore: Math.round(numberValue(destination.confidenceScore)),
    source: {
      provider: "openai",
      isMock: false,
      classification: "ai",
      note: "AI-generated recommendation.",
    },
  };
}

function normalizeDestinationsForTrip(value: unknown, trip: TripDraft) {
  const expectedCountry = normalizeCountry(trip.destinationCountry);
  return Array.isArray(value)
    ? value
        .map((destination, index) => normalizeDestination(destination, index))
        .filter((destination) => !expectedCountry || normalizeCountry(destination.country) === expectedCountry)
    : [];
}

function normalizeCountry(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}
