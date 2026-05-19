# Travel Guide

A private personal vacation planner built with Next.js, TypeScript, Tailwind CSS, Prisma, SQLite, and API-ready service adapters.

## What It Does

- Dashboard for current, upcoming, and past trips
- Trip creation flow with destination recommendation mode
- Destination recommendations with confidence, cost, weather, pros, cons, and provider labels
- Places, restaurants, neighborhoods, rainy-day ideas, and hidden gems
- Simple hidden-gem scoring that can later use live crowding, popularity, distance, and opening-hours data
- AI itinerary generation endpoint with OpenAI support
- Editable-style itinerary UI with day actions for regenerate, relaxed, cheaper, hidden gem, and rain plan
- Google Static Maps-backed map view with Google Routes distance and duration
- Budget tracker with estimated and actual categories
- Manual booking organizer plus Gmail-style confirmation imports
- Structured travel documents notes
- On-demand AI packing list with weather context
- On-demand AI trip summary for saved memories
- Mobile-friendly Today mode with AI adjustment prompts that do not overwrite plans automatically
- Memories / trip journal page
- Travel profile and preferences page
- Local SQLite persistence for trips, expenses, bookings, documents, memories, profile, and saved AI itineraries

## Run Locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If that port is busy, Next.js will print the alternate local URL.

If the database already exists and you only want to re-seed starter data:

```bash
npm run db:seed
```

## Environment Variables

Copy `.env.example` to `.env` and add keys when you are ready:

```bash
OPENAI_API_KEY=""
GOOGLE_MAPS_API_KEY=""
GOOGLE_PLACES_API_KEY=""
MAPBOX_API_KEY=""
WEATHER_API_KEY=""
CURRENCY_API_KEY=""
VIATOR_API_KEY=""
GETYOURGUIDE_API_KEY=""
GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3000/api/gmail/callback"
```

## API-Ready Files

- `src/lib/api/placesService.ts`
- `src/lib/api/mapsService.ts`
- `src/lib/api/weatherService.ts`
- `src/lib/api/currencyService.ts`
- `src/lib/api/hotelsService.ts`
- `src/lib/api/activitiesService.ts`
- `src/lib/api/gmailService.ts`
- `src/lib/api/integrationStatus.ts`
- `src/lib/imports/travelEmailParser.ts`

Services with live providers return live typed data. Services without connected providers return empty results or unavailable states rather than invented travel data.

Google Places is wired for live place discovery. Add `GOOGLE_PLACES_API_KEY`, then use the Discover page's "Refresh places data" button or call:

```bash
curl -X POST http://localhost:3000/api/places/refresh
```

If the key is missing, the refresh path stores no places and logs that Google Places is not connected.

Google Static Maps is wired through a server-side image proxy. Google Routes is used for route distance, duration, and polyline when `GOOGLE_MAPS_API_KEY` is configured and Routes API is enabled.

Weather and currency currently work without keys through no-key public providers:

- Weather: Open-Meteo
- Currency: Frankfurter

Flights and hotel search use practical external provider links for the personal MVP:

- Flights: Google Flights and Skyscanner search shortcuts
- Hotels: Booking.com and Expedia search shortcuts
- Activities: GetYourGuide search shortcut

These do not require partner approval or API keys. The planner opens the provider with your trip destination, dates, and traveler count where the provider supports URL prefill. After booking, Gmail/manual imports bring the real confirmations back into Bookings and Documents.

GetYourGuide live activity search is API-ready through `GETYOURGUIDE_API_KEY` and `/api/activities/search`. GetYourGuide's Partner API uses the `X-ACCESS-TOKEN` header and requires partner-approved API access. Without an approved token, the app keeps the GetYourGuide external search shortcut available instead of showing fake live tours.

The Imports page supports Expedia and Booking.com confirmation parsing in two ways:

- Paste a confirmation email manually, preview extracted booking fields, then import selected results into Bookings and Documents.
- Connect Gmail with read-only OAuth, scan likely Booking.com and Expedia confirmations, preview matches, then import selected results.

To enable the Gmail button, create a Google OAuth client, add the redirect URI below, then set:

```bash
GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3000/api/gmail/callback"
```

Use the Integrations page at `/integrations` to confirm which providers are live and which still need credentials.

## AI Files

- `src/lib/ai/openai.ts`
- `src/app/api/ai/destinations/route.ts`
- `src/app/api/ai/itinerary/route.ts`
- `src/app/api/ai/adjust-day/route.ts`
- `src/app/api/ai/packing/route.ts`
- `src/app/api/ai/summary/route.ts`

AI calls use OpenAI when `OPENAI_API_KEY` is configured. Without it, the app reports that OpenAI is unavailable rather than showing generated sample content.

## Data Model

The Prisma schema includes:

- User
- TravelProfile
- Trip
- Traveler
- DestinationRecommendation
- PlaceRecommendation
- SavedPlace
- ItineraryDay
- ItineraryItem
- BudgetCategory
- Expense
- Booking
- DocumentNote
- Memory
- AiGenerationLog
- ApiProviderLog

Schema file: `prisma/schema.prisma`.

## What Uses Real Data Now

- OpenAI itinerary generation, day adjustments, packing helper, and memory summary when `OPENAI_API_KEY` is configured
- Google Places recommendations when `GOOGLE_PLACES_API_KEY` is configured
- Google Static Maps image when `GOOGLE_MAPS_API_KEY` is configured
- Open-Meteo weather summaries
- Frankfurter currency rates
- Expedia and Booking.com confirmation parsing from pasted email text
- Gmail read-only scanning when Gmail OAuth credentials are configured and connected
- Trip-aware external search shortcuts for Booking.com, Expedia, Google Flights, Skyscanner, and GetYourGuide

## Not Connected Yet

- Booking links and transaction flows

Flight and hotel API adapters can still be added later with Duffel, LiteAPI, SerpApi, Expedia Rapid, or Booking.com Demand API if approved credentials become available.

## Next Improvements

- Add authentication if this moves beyond local personal use
- Add Google Place Details for richer opening-hours/photos
- Add real flight/hotel search adapters
- Add itinerary item drag-and-drop editing
- Store confirmed AI adjustments back into the database
