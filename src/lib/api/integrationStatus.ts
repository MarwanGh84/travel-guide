import { checkGetYourGuideConnection } from "@/lib/api/activitiesService";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getGmailConnectionStatus, gmailRedirectUri } from "@/lib/api/gmailService";
import { getWeatherSummary } from "@/lib/api/weatherService";

export type IntegrationStatus = {
  id: string;
  name: string;
  category: "AI" | "Maps" | "Places" | "Weather" | "Currency" | "Email" | "Flights" | "Hotels" | "Activities";
  state: "live" | "ready" | "missing" | "failing";
  configured: boolean;
  message: string;
  env: string[];
  nextStep?: string;
};

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const [openai, places, maps, routes, weather, currency, gmail, getYourGuide] = await Promise.all([
    checkOpenAI(),
    checkGooglePlaces(),
    checkGoogleStaticMaps(),
    checkGoogleRoutes(),
    checkWeather(),
    checkCurrency(),
    checkGmail(),
    checkGetYourGuide(),
  ]);

  return [
    openai,
    places,
    maps,
    routes,
    weather,
    currency,
    gmail,
    externalSearchIntegration({
      id: "skyscanner",
      name: "Skyscanner",
      category: "Flights",
      message: "No partner API needed. The app now creates trip-aware Skyscanner flight-search shortcuts.",
      nextStep: "Use the external search buttons from Bookings or Budget, then import the confirmation email through Gmail after booking.",
    }),
    externalSearchIntegration({
      id: "booking",
      name: "Booking.com",
      category: "Hotels",
      message: "No partner API needed. The app now creates trip-aware Booking.com hotel-search shortcuts, while Gmail imports handle real confirmations.",
      nextStep: "Search externally, book normally, then scan Gmail or paste the confirmation into Imports.",
    }),
    externalSearchIntegration({
      id: "expedia",
      name: "Expedia",
      category: "Hotels",
      message: "No Rapid API approval needed for the MVP. The app now creates trip-aware Expedia hotel-search shortcuts, while Gmail imports handle real confirmations.",
      nextStep: "Search externally, book normally, then scan Gmail or paste the confirmation into Imports.",
    }),
    getYourGuide,
    keyedFutureIntegration({
      id: "viator",
      name: "Viator",
      category: "Activities",
      env: ["VIATOR_API_KEY"],
      adapter: "Activities adapter is scaffolded; add API access before enabling live tours.",
    }),
    keyedFutureIntegration({
      id: "mapbox",
      name: "Mapbox",
      category: "Maps",
      env: ["MAPBOX_API_KEY"],
      adapter: "Optional only. The app already uses Google Maps when configured.",
    }),
  ];
}

async function checkGetYourGuide(): Promise<IntegrationStatus> {
  const status = await checkGetYourGuideConnection();
  if (status.ok) {
    return live("getyourguide", "GetYourGuide", "Activities", ["GETYOURGUIDE_API_KEY"], status.message);
  }
  if (status.configured) {
    return failing("getyourguide", "GetYourGuide", "Activities", ["GETYOURGUIDE_API_KEY"], status.message);
  }
  return {
    id: "getyourguide",
    name: "GetYourGuide",
    category: "Activities",
    state: "ready",
    configured: true,
    env: ["GETYOURGUIDE_API_KEY"],
    message: "Partner API token is not configured, but trip-aware GetYourGuide activity-search shortcuts are available now.",
    nextStep: "Use the GetYourGuide search shortcut for tours. Add GETYOURGUIDE_API_KEY only if GetYourGuide approves Partner API access.",
  };
}

async function checkOpenAI(): Promise<IntegrationStatus> {
  const configured = hasEnv("OPENAI_API_KEY");
  if (!configured) return missing("openai", "OpenAI", "AI", ["OPENAI_API_KEY"], "Add this key for AI planning and summaries.");
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      cache: "no-store",
    });
    if (!response.ok) return failing("openai", "OpenAI", "AI", ["OPENAI_API_KEY"], `OpenAI returned ${response.status}. Check the key or project access.`);
    return live("openai", "OpenAI", "AI", ["OPENAI_API_KEY"], "Connected. AI itinerary, adjustment, packing, summary, and destination flows can use OpenAI.");
  } catch (error) {
    return failing("openai", "OpenAI", "AI", ["OPENAI_API_KEY"], errorMessage(error, "OpenAI check failed."));
  }
}

async function checkGooglePlaces(): Promise<IntegrationStatus> {
  const configured = hasEnv("GOOGLE_PLACES_API_KEY");
  if (!configured) return missing("google-places", "Google Places", "Places", ["GOOGLE_PLACES_API_KEY"], "Add this key for live places, restaurants, and hidden gems.");
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({ textQuery: "Athens Greece museum", maxResultCount: 1, languageCode: "en" }),
      cache: "no-store",
    });
    if (!response.ok) return failing("google-places", "Google Places", "Places", ["GOOGLE_PLACES_API_KEY"], `Google Places returned ${response.status}. Confirm Places API and billing.`);
    return live("google-places", "Google Places", "Places", ["GOOGLE_PLACES_API_KEY"], "Connected. Discover refresh can pull live places and hidden gems.");
  } catch (error) {
    return failing("google-places", "Google Places", "Places", ["GOOGLE_PLACES_API_KEY"], errorMessage(error, "Google Places check failed."));
  }
}

async function checkGoogleStaticMaps(): Promise<IntegrationStatus> {
  const configured = hasEnv("GOOGLE_MAPS_API_KEY");
  if (!configured) return missing("google-static-maps", "Google Static Maps", "Maps", ["GOOGLE_MAPS_API_KEY"], "Add this key for live map imagery.");
  try {
    const params = new URLSearchParams({
      key: process.env.GOOGLE_MAPS_API_KEY ?? "",
      center: "37.9838,23.7275",
      zoom: "12",
      size: "320x180",
      scale: "1",
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return failing("google-static-maps", "Google Static Maps", "Maps", ["GOOGLE_MAPS_API_KEY"], `Static Maps returned ${response.status}. Confirm Maps Static API and billing.`);
    return live("google-static-maps", "Google Static Maps", "Maps", ["GOOGLE_MAPS_API_KEY"], "Connected. Map imagery is available server-side.");
  } catch (error) {
    return failing("google-static-maps", "Google Static Maps", "Maps", ["GOOGLE_MAPS_API_KEY"], errorMessage(error, "Static Maps check failed."));
  }
}

async function checkGoogleRoutes(): Promise<IntegrationStatus> {
  const configured = hasEnv("GOOGLE_MAPS_API_KEY");
  if (!configured) return missing("google-routes", "Google Routes", "Maps", ["GOOGLE_MAPS_API_KEY"], "Add this key for route distance and duration.");
  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY ?? "",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: 37.9838, longitude: 23.7275 } } },
        destination: { location: { latLng: { latitude: 37.9715, longitude: 23.7257 } } },
        travelMode: "WALK",
      }),
      cache: "no-store",
    });
    if (!response.ok) return failing("google-routes", "Google Routes", "Maps", ["GOOGLE_MAPS_API_KEY"], `Routes returned ${response.status}. Confirm Routes API and billing.`);
    return live("google-routes", "Google Routes", "Maps", ["GOOGLE_MAPS_API_KEY"], "Connected. Map routes can use live Google distance and duration.");
  } catch (error) {
    return failing("google-routes", "Google Routes", "Maps", ["GOOGLE_MAPS_API_KEY"], errorMessage(error, "Routes check failed."));
  }
}

async function checkWeather(): Promise<IntegrationStatus> {
  const weather = await getWeatherSummary("Athens");
  if (weather.source.isMock) return failing("open-meteo", "Open-Meteo Weather", "Weather", [], weather.source.note);
  return live("open-meteo", "Open-Meteo Weather", "Weather", [], "Connected through no-key Open-Meteo forecast data.");
}

async function checkCurrency(): Promise<IntegrationStatus> {
  const rate = await getExchangeRate("USD", "EUR");
  if (rate.source.isMock) return failing("frankfurter", "Frankfurter Currency", "Currency", [], rate.source.note);
  return live("frankfurter", "Frankfurter Currency", "Currency", [], `Connected. USD/EUR is ${rate.rate.toFixed(4)}.`);
}

async function checkGmail(): Promise<IntegrationStatus> {
  const status = await getGmailConnectionStatus();
  if (status.connected) {
    return live("gmail", "Gmail OAuth", "Email", ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI"], status.message);
  }
  if (status.configured) {
    return {
      id: "gmail",
      name: "Gmail OAuth",
      category: "Email",
      state: "ready",
      configured: true,
      env: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI"],
      message: `OAuth credentials are present. Connect Gmail from Imports. Redirect URI: ${gmailRedirectUri()}`,
      nextStep: "Open Imports and click Connect Gmail.",
    };
  }
  return missing("gmail", "Gmail OAuth", "Email", ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REDIRECT_URI"], `Create a Google OAuth client and add this redirect URI: ${gmailRedirectUri()}`);
}

function externalSearchIntegration(input: {
  id: string;
  name: string;
  category: IntegrationStatus["category"];
  message: string;
  nextStep: string;
}): IntegrationStatus {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    state: "ready",
    configured: true,
    env: [],
    message: input.message,
    nextStep: input.nextStep,
  };
}

function keyedFutureIntegration(input: {
  id: string;
  name: string;
  category: IntegrationStatus["category"];
  env: string[];
  adapter: string;
}): IntegrationStatus {
  const configured = input.env.every(hasEnv);
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    state: configured ? "ready" : "missing",
    configured,
    env: input.env,
    message: configured ? `${input.adapter} Credentials are present.` : input.adapter,
    nextStep: configured ? "Add the live provider request mapping for this account's API plan." : `Add ${input.env.join(" and ")} when you have provider access.`,
  };
}

function hasEnv(key: string) {
  return Boolean(process.env[key]?.trim());
}

function live(id: string, name: string, category: IntegrationStatus["category"], env: string[], message: string): IntegrationStatus {
  return { id, name, category, state: "live", configured: true, env, message };
}

function missing(id: string, name: string, category: IntegrationStatus["category"], env: string[], nextStep: string): IntegrationStatus {
  return { id, name, category, state: "missing", configured: false, env, message: "Credentials are not configured.", nextStep };
}

function failing(id: string, name: string, category: IntegrationStatus["category"], env: string[], message: string): IntegrationStatus {
  return { id, name, category, state: "failing", configured: true, env, message, nextStep: "Check provider dashboard, enabled APIs, billing, and key restrictions." };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
