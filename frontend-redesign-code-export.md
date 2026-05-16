# Frontend Redesign Code Export

Generated from current workspace: /Users/marwanghostine/Desktop/Travel Guide

Excluded: .env, client_secret_*.json, prisma/dev.db, node_modules, .next, .git, package-lock.json.

## `package.json`

```json
{
  "name": "travel-guide",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "node prisma/seed.mjs"
  },
  "dependencies": {
    "@prisma/client": "^6.19.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.14.0",
    "next": "16.2.6",
    "openai": "^6.37.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "prisma": "^6.19.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## `.env.example`

```example
DATABASE_URL="file:./dev.db"
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

## `AGENTS.md`

```md
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

```

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                String             @id @default(cuid())
  email             String?            @unique
  name              String             @default("Marwan")
  profile           TravelProfile?
  trips             Trip[]
  connectedAccounts ConnectedAccount[]
  aiLogs            AiGenerationLog[]
  apiLogs           ApiProviderLog[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model ConnectedAccount {
  id           String    @id @default(cuid())
  userId       String
  provider     String
  providerUser String?
  email        String?
  accessToken  String
  refreshToken String?
  scope        String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
}

model TravelProfile {
  id                    String   @id @default(cuid())
  userId                String   @unique
  preferredHotelType    String?
  travelPace            String   @default("medium")
  foodPreferences       String?
  budgetStyle           String   @default("balanced")
  favoriteActivities    String?
  thingsToAvoid         String?
  homeAirport           String?
  passportNationality   String?
  hiddenGemInterest     Boolean  @default(true)
  preferredTravelMonths String?
  notes                 String?
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Trip {
  id                         String                      @id @default(cuid())
  userId                     String
  name                       String
  destination                String?
  destinationCountry         String?
  departureCity              String
  startDate                  DateTime
  endDate                    DateTime
  travelerCount              Int                         @default(1)
  budget                     Float
  currency                   String                      @default("USD")
  travelStyle                String
  pace                       String
  interests                  String
  notes                      String?
  status                     String                      @default("planning")
  user                       User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  travelers                  Traveler[]
  destinationRecommendations DestinationRecommendation[]
  placeRecommendations       PlaceRecommendation[]
  savedPlaces                SavedPlace[]
  itineraryDays              ItineraryDay[]
  budgetCategories           BudgetCategory[]
  expenses                   Expense[]
  bookings                   Booking[]
  documentNotes              DocumentNote[]
  memories                   Memory[]
  aiLogs                     AiGenerationLog[]
  apiLogs                    ApiProviderLog[]
  createdAt                  DateTime                    @default(now())
  updatedAt                  DateTime                    @updatedAt
}

model Traveler {
  id        String   @id @default(cuid())
  tripId    String
  name      String
  role      String?
  notes     String?
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model DestinationRecommendation {
  id                    String   @id @default(cuid())
  tripId                String?
  name                  String
  country               String
  whyItMatches          String
  bestThingsToDo        String
  estimatedCost         Float
  weatherSummary        String
  flightEstimate        String?
  hotelEstimate         String?
  pros                  String
  cons                  String
  bestFor               String
  suggestedTripDuration String
  confidenceScore       Int
  source                String   @default("not-connected")
  trip                  Trip?    @relation(fields: [tripId], references: [id], onDelete: SetNull)
  createdAt             DateTime @default(now())
}

model PlaceRecommendation {
  id                 String   @id @default(cuid())
  tripId             String
  name               String
  category           String
  description        String
  rating             Float?
  costLevel          String?
  location           String
  latitude           Float?
  longitude          Float?
  openingStatus      String?
  whyRecommended     String
  hiddenGemScore     Int      @default(0)
  isHiddenGem        Boolean  @default(false)
  source             String   @default("not-connected")
  trip               Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  savedPlaces        SavedPlace[]
  itineraryItems     ItineraryItem[]
  createdAt          DateTime @default(now())
}

model SavedPlace {
  id                    String               @id @default(cuid())
  tripId                String
  placeRecommendationId String?
  name                  String
  category              String
  notes                 String?
  priority              Int                  @default(2)
  trip                  Trip                 @relation(fields: [tripId], references: [id], onDelete: Cascade)
  placeRecommendation   PlaceRecommendation? @relation(fields: [placeRecommendationId], references: [id], onDelete: SetNull)
  createdAt             DateTime             @default(now())
}

model ItineraryDay {
  id              String          @id @default(cuid())
  tripId          String
  date            DateTime
  theme           String
  morningPlan     String
  afternoonPlan   String
  eveningPlan     String
  restaurantIdeas String?
  hiddenGem       String?
  estimatedCost   Float          @default(0)
  transportNotes  String?
  backupOption    String?
  notes           String?
  trip            Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  items           ItineraryItem[]
}

model ItineraryItem {
  id                    String               @id @default(cuid())
  itineraryDayId        String
  placeRecommendationId String?
  title                 String
  timeOfDay             String
  description           String
  estimatedCost         Float                @default(0)
  sortOrder             Int                  @default(0)
  itineraryDay          ItineraryDay         @relation(fields: [itineraryDayId], references: [id], onDelete: Cascade)
  placeRecommendation   PlaceRecommendation? @relation(fields: [placeRecommendationId], references: [id], onDelete: SetNull)
}

model BudgetCategory {
  id              String  @id @default(cuid())
  tripId          String
  name            String
  estimatedAmount Float
  actualAmount    Float   @default(0)
  trip            Trip    @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model Expense {
  id        String   @id @default(cuid())
  tripId    String
  category  String
  amount    Float
  currency  String   @default("USD")
  note      String?
  spentAt   DateTime @default(now())
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model Booking {
  id                 String   @id @default(cuid())
  tripId             String
  type               String
  title              String
  provider           String?
  confirmationNumber String?
  importGroupId      String?
  importFingerprint  String?
  sourceMessageId    String?
  startAt            DateTime?
  endAt              DateTime?
  link               String?
  notes              String?
  trip               Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId, importFingerprint])
  @@index([tripId, importGroupId])
}

model DocumentNote {
  id                String   @id @default(cuid())
  tripId            String
  type              String
  title             String
  content           String
  link              String?
  importGroupId     String?
  importFingerprint String?
  sourceMessageId   String?
  trip              Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdAt         DateTime @default(now())

  @@index([tripId, importFingerprint])
  @@index([tripId, importGroupId])
}

model Memory {
  id                 String   @id @default(cuid())
  tripId             String
  title              String
  favoriteMoments    String?
  placesVisited      String?
  notes              String?
  photosPlaceholder  String?
  finalSummary       String?
  nextTime           String?
  rating             Int?
  favoriteRestaurants String?
  favoriteHiddenGems String?
  placesToRevisit    String?
  trip               Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdAt          DateTime @default(now())
}

model AiGenerationLog {
  id        String   @id @default(cuid())
  userId    String?
  tripId    String?
  type      String
  prompt    String
  response  String
  provider  String   @default("openai")
  model     String?
  isMock    Boolean  @default(false)
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  trip      Trip?    @relation(fields: [tripId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}

model ApiProviderLog {
  id          String   @id @default(cuid())
  userId      String?
  tripId      String?
  provider    String
  endpoint    String
  status      String
  usedMock    Boolean  @default(false)
  message     String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  trip        Trip?    @relation(fields: [tripId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
}

```

## `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/travel/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Guide",
  description: "A personal AI vacation planner for trips, itineraries, budgets, and memories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

```

## `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #050914;
  --foreground: #f7fbff;
  --surface: rgba(9, 17, 31, 0.86);
  --surface-strong: rgba(11, 22, 39, 0.94);
  --surface-soft: rgba(18, 31, 51, 0.72);
  --line: rgba(135, 166, 207, 0.18);
  --line-strong: rgba(125, 211, 252, 0.34);
  --muted: #91a4c0;
  --muted-strong: #c5d4e8;
  --accent: #38bdf8;
  --accent-strong: #7dd3fc;
  --warm: #f5c85c;
  --green: #36d38a;
  --danger: #fb7185;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  min-height: 100vh;
  background:
    linear-gradient(115deg, rgba(56, 189, 248, 0.10), transparent 32%),
    linear-gradient(245deg, rgba(54, 211, 138, 0.055), transparent 38%),
    linear-gradient(135deg, #050914 0%, #07101f 48%, #030712 100%);
  color: var(--foreground);
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

::selection {
  background: rgba(125, 211, 252, 0.36);
  color: #ffffff;
}

html {
  color-scheme: dark;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(125, 211, 252, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.04) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent 72%);
}

* {
  scrollbar-color: rgba(125, 211, 252, 0.42) rgba(8, 16, 30, 0.7);
}

.premium-panel {
  border: 1px solid var(--line);
  background:
    linear-gradient(145deg, rgba(12, 23, 42, 0.94), rgba(6, 12, 24, 0.86)),
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 22rem);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.premium-panel-soft {
  border: 1px solid var(--line);
  background: rgba(13, 25, 44, 0.66);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.premium-glow {
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.24), 0 16px 48px rgba(56, 189, 248, 0.12);
}

.route-pulse {
  position: relative;
}

.route-pulse::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px solid rgba(125, 211, 252, 0.4);
  animation: route-pulse 2.2s ease-in-out infinite;
}

.text-slate-950,
.text-slate-900,
.text-slate-800 {
  color: #f7fbff !important;
}

.text-slate-700 {
  color: #d6e2f2 !important;
}

.text-slate-600,
.text-slate-500 {
  color: #91a4c0 !important;
}

.text-slate-400 {
  color: #6f83a0 !important;
}

.bg-slate-50,
.bg-slate-100 {
  background-color: rgba(17, 31, 52, 0.72) !important;
}

.bg-sky-50,
.bg-sky-100 {
  background-color: rgba(14, 116, 144, 0.16) !important;
}

.bg-emerald-100 {
  background-color: rgba(16, 185, 129, 0.16) !important;
}

.bg-amber-100 {
  background-color: rgba(245, 158, 11, 0.16) !important;
}

.border-slate-100,
.border-slate-200,
.border-slate-200\/80 {
  border-color: var(--line) !important;
}

.ring-slate-100 {
  --tw-ring-color: var(--line) !important;
}

@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes soft-pulse {
  0%, 100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}

@keyframes route-pulse {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  70% {
    opacity: 0;
    transform: scale(1.08);
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}

.animate-float-in {
  animation: float-in 520ms ease both;
}

.animate-soft-pulse {
  animation: soft-pulse 2.8s ease-in-out infinite;
}

.dashboard-shell {
  display: grid;
  gap: 1.25rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  padding-bottom: 3rem;
}

.dashboard-hero,
.dashboard-intro,
.dashboard-selected,
.dashboard-itinerary,
.dashboard-map-card,
.dashboard-weather,
.dashboard-mini-panel,
.dashboard-rail-action {
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(12, 23, 42, 0.96), rgba(6, 12, 24, 0.9)),
    linear-gradient(90deg, rgba(56, 189, 248, 0.06), transparent 45%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.035);
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
  gap: 1.25rem;
  align-items: end;
  min-height: 17.5rem;
  padding: 1.75rem;
  overflow: hidden;
}

.dashboard-intro {
  min-width: 0;
  min-height: 10rem;
  padding: 1.5rem;
}

.dashboard-intro .dashboard-kicker {
  margin-bottom: 0.8rem;
}

.dashboard-intro .dashboard-title {
  max-width: 34rem;
  font-size: clamp(2rem, 3.2vw, 3rem);
  line-height: 0.98;
}

.dashboard-intro .dashboard-subtitle {
  max-width: 34rem;
  margin-top: 0.85rem;
}

.dashboard-kicker {
  margin-bottom: 1rem;
  color: var(--accent-strong);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dashboard-title {
  max-width: 100%;
  color: #f8fbff;
  font-size: clamp(2.6rem, 6vw, 5.75rem);
  font-weight: 850;
  letter-spacing: 0;
  line-height: 0.9;
  overflow-wrap: break-word;
}

.dashboard-subtitle {
  max-width: 44rem;
  margin-top: 1.1rem;
  color: var(--muted-strong);
  font-size: clamp(1.05rem, 1.35vw, 1.25rem);
  line-height: 1.65;
}

.dashboard-trip-card {
  display: grid;
  gap: 1.05rem;
  padding: 1.1rem;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 8px;
  background: rgba(7, 17, 33, 0.78);
}

.dashboard-label,
.dashboard-card-label,
.dashboard-stat-label,
.dashboard-day-label {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.dashboard-trip-card h2 {
  color: #f8fbff;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
}

.dashboard-trip-card p {
  margin-top: 0.3rem;
  color: var(--muted-strong);
}

.dashboard-readiness {
  display: grid;
  gap: 0.5rem;
}

.dashboard-readiness-row {
  display: flex;
  justify-content: space-between;
  color: var(--muted-strong);
  font-size: 0.9rem;
  font-weight: 700;
}

.dashboard-readiness > span {
  color: var(--muted-strong);
  font-size: 0.9rem;
  font-weight: 850;
  text-align: right;
}

.dashboard-readiness > div,
.dashboard-readiness-bar,
.dashboard-confidence-bar {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.1);
}

.dashboard-readiness > div i,
.dashboard-readiness-bar i,
.dashboard-confidence-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), #5eead4, #86efac);
  box-shadow: 0 0 22px rgba(56, 189, 248, 0.38);
}

.dashboard-trip-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.dashboard-trip-meta div {
  padding: 0.85rem;
  border: 1px solid rgba(135, 166, 207, 0.14);
  border-radius: 8px;
  background: rgba(15, 29, 49, 0.78);
}

.dashboard-trip-meta strong {
  display: block;
  margin-top: 0.35rem;
  color: #f8fbff;
}

.dashboard-layout {
  display: flex;
  gap: 1.25rem;
  align-items: start;
  width: 100%;
  max-width: 100%;
}

.dashboard-main,
.dashboard-rail,
.dashboard-stack {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.dashboard-main {
  flex: 1 1 0;
  max-width: calc(100% - 25.75rem);
}

.dashboard-rail {
  flex: 0 0 min(24.5rem, 100%);
}

.dashboard-rail {
  position: sticky;
  top: 1rem;
}

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.dashboard-action {
  position: relative;
  display: grid;
  min-height: 7rem;
  gap: 1rem;
  align-content: space-between;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(12, 24, 43, 0.74);
  color: #f8fbff;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.dashboard-action:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.45);
  background: rgba(14, 33, 58, 0.9);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.dashboard-action.primary {
  border-color: rgba(245, 200, 92, 0.36);
  background: linear-gradient(145deg, rgba(76, 48, 8, 0.38), rgba(10, 21, 39, 0.82));
}

.dashboard-action > span {
  display: grid;
  width: 2.7rem;
  height: 2.7rem;
  place-items: center;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 8px;
  background: rgba(18, 35, 58, 0.86);
  color: var(--accent-strong);
}

.dashboard-action h3,
.dashboard-action strong {
  display: block;
  color: #f8fbff;
  font-size: 1rem;
  font-weight: 800;
}

.dashboard-action p,
.dashboard-action small {
  display: block;
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.dashboard-action > svg:last-child {
  position: absolute;
  right: 1rem;
  top: 1rem;
  color: rgba(197, 212, 232, 0.64);
}

.dashboard-selected,
.dashboard-itinerary {
  padding: 1.1rem;
}

.dashboard-section-head {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.dashboard-section-head h2 {
  color: #f8fbff;
  font-size: 1.25rem;
  font-weight: 850;
}

.dashboard-section-head p {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.95rem;
}

.dashboard-section-head a,
.dashboard-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.4rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 8px;
  color: var(--accent-strong);
  font-weight: 800;
  transition: background 160ms ease, border-color 160ms ease;
}

.dashboard-link:hover {
  border-color: rgba(125, 211, 252, 0.5);
  background: rgba(14, 116, 144, 0.14);
}

.dashboard-place-strip {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.dashboard-place-pill {
  display: grid;
  grid-template-columns: 3rem minmax(9rem, 1fr);
  gap: 0.8rem;
  align-items: center;
  min-width: min(22rem, 75vw);
  padding: 0.75rem;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 8px;
  background: rgba(14, 29, 50, 0.78);
}

.dashboard-thumb {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(54, 211, 138, 0.16));
  color: #f8fbff;
  font-size: 0.86rem;
  font-weight: 900;
}

.dashboard-place-pill strong,
.dashboard-empty-row strong {
  display: block;
  color: #f8fbff;
  line-height: 1.25;
}

.dashboard-place-pill span:not(.dashboard-thumb),
.dashboard-empty-row span {
  display: block;
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.86rem;
}

.dashboard-place-pill small {
  display: block;
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.86rem;
}

.dashboard-empty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px dashed rgba(125, 211, 252, 0.28);
  border-radius: 8px;
  background: rgba(14, 29, 50, 0.45);
}

.dashboard-empty-row svg {
  color: var(--accent-strong);
}

.dashboard-day {
  display: grid;
  gap: 0.8rem;
}

.dashboard-day-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-day-head h3 {
  margin-top: 0.2rem;
  color: #f8fbff;
  font-size: 1.35rem;
  font-weight: 850;
}

.dashboard-cost-badge,
.dashboard-live-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0 0.75rem;
  border-radius: 8px;
  background: rgba(54, 211, 138, 0.14);
  color: #b8f7d8;
  font-weight: 850;
}

.dashboard-timeline {
  display: grid;
  gap: 0.65rem;
}

.dashboard-timeline-block {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.95rem;
  border: 1px solid rgba(135, 166, 207, 0.14);
  border-radius: 8px;
  background: rgba(11, 23, 41, 0.74);
}

.dashboard-timeline-block.cyan {
  background: rgba(10, 31, 49, 0.78);
}

.dashboard-timeline-block.emerald,
.dashboard-timeline-block.accent-afternoon {
  background: rgba(12, 33, 49, 0.74);
}

.dashboard-timeline-block.violet,
.dashboard-timeline-block.accent-evening {
  background: rgba(20, 24, 47, 0.78);
}

.dashboard-timeline-block span {
  color: var(--accent-strong);
  font-weight: 850;
}

.dashboard-timeline-block p {
  color: var(--muted-strong);
  line-height: 1.55;
}

.dashboard-day-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.dashboard-day-footer > div,
.dashboard-day-footer > span {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  padding: 0.95rem;
  border: 1px solid rgba(135, 166, 207, 0.14);
  border-radius: 8px;
  background: rgba(15, 29, 49, 0.62);
  color: var(--muted-strong);
  line-height: 1.45;
}

.dashboard-day-footer p {
  margin-top: 0.35rem;
  color: var(--muted-strong);
  line-height: 1.5;
}

.dashboard-map-card {
  padding: 0.85rem;
}

.dashboard-map-preview {
  position: relative;
  min-height: 15rem;
  overflow: hidden;
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(13, 46, 54, 0.72), rgba(10, 21, 39, 0.92));
}

.dashboard-map-preview img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 15rem;
  object-fit: cover;
  opacity: 0.78;
}

.dashboard-map-fallback,
.dashboard-map-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dashboard-map-fallback span,
.dashboard-map-overlay span {
  position: absolute;
  display: grid;
  width: 1.9rem;
  height: 1.9rem;
  place-items: center;
  border: 3px solid rgba(248, 251, 255, 0.9);
  border-radius: 999px;
  background: var(--accent);
  color: #020617;
  font-size: 0.76rem;
  font-weight: 900;
  box-shadow: 0 0 0 7px rgba(56, 189, 248, 0.18);
}

.dashboard-map-overlay span:nth-child(1) {
  left: 22%;
  top: 34%;
}

.dashboard-map-overlay span:nth-child(2) {
  left: 54%;
  top: 48%;
  background: var(--green);
}

.dashboard-map-overlay span:nth-child(3) {
  left: 72%;
  top: 28%;
  background: var(--warm);
}

.dashboard-map-overlay span:nth-child(4) {
  left: 41%;
  top: 68%;
}

.dashboard-route-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  margin-top: 0.75rem;
}

.dashboard-route-stats div,
.dashboard-route-stats span {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(15, 29, 49, 0.72);
  color: #f8fbff;
  font-size: 0.86rem;
  font-weight: 850;
}

.dashboard-route-stats div span {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.dashboard-route-stats strong {
  display: block;
  margin-top: 0.25rem;
  color: #f8fbff;
  font-size: 0.96rem;
}

.dashboard-weather {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
}

.dashboard-weather svg {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--warm);
}

.dashboard-weather h2 {
  color: #f8fbff;
  font-size: 1.2rem;
  font-weight: 850;
}

.dashboard-weather p {
  margin-top: 0.25rem;
  color: var(--muted-strong);
  line-height: 1.45;
}

.dashboard-weather span {
  display: inline-block;
  margin-top: 0.65rem;
  color: var(--accent-strong);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-mini-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.dashboard-mini-panel {
  padding: 0.95rem;
}

.dashboard-mini-panel strong {
  display: block;
  margin-top: 0.8rem;
  color: #f8fbff;
  font-size: 1.35rem;
}

.dashboard-mini-panel small {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-mini-panel p,
.dashboard-mini-panel span {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.dashboard-empty-plan {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px dashed rgba(125, 211, 252, 0.28);
  border-radius: 8px;
  background: rgba(14, 29, 50, 0.45);
}

.dashboard-empty-plan > svg {
  width: 2.25rem;
  height: 2.25rem;
  color: var(--accent-strong);
}

.dashboard-empty-plan strong {
  display: block;
  color: #f8fbff;
  font-size: 1.05rem;
}

.dashboard-empty-plan p {
  margin-top: 0.2rem;
  color: var(--muted);
}

.dashboard-empty-plan a {
  display: inline-flex;
  align-items: center;
  min-height: 2.6rem;
  padding: 0 1rem;
  border: 1px solid rgba(245, 200, 92, 0.38);
  border-radius: 8px;
  background: rgba(245, 200, 92, 0.12);
  color: #fde68a;
  font-weight: 850;
}

.dashboard-rail-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  color: #f8fbff;
  transition: transform 180ms ease, border-color 180ms ease;
}

.dashboard-rail-action:hover {
  transform: translateX(3px);
  border-color: rgba(125, 211, 252, 0.45);
}

.dashboard-rail-action > span:first-child {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  margin: 0;
  place-items: center;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 8px;
  background: rgba(18, 35, 58, 0.86);
  color: var(--accent-strong);
}

.dashboard-rail-action strong {
  display: block;
  font-weight: 850;
}

.dashboard-rail-action span {
  display: block;
  margin-top: 0.2rem;
  color: var(--muted);
  font-size: 0.9rem;
}

@media (max-width: 1400px) {
  .dashboard-hero,
  .dashboard-layout {
    flex-direction: column;
  }

  .dashboard-main,
  .dashboard-rail {
    flex-basis: auto;
    max-width: 100%;
    width: 100%;
  }

  .dashboard-rail {
    position: static;
  }

}

@media (max-width: 980px) {
  .dashboard-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1540px) {
  .dashboard-actions {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .dashboard-shell {
    width: calc(100vw - 292px);
    max-width: calc(100vw - 292px);
  }
}

@media (max-width: 760px) {
  .dashboard-hero,
  .dashboard-selected,
  .dashboard-itinerary {
    padding: 1rem;
  }

  .dashboard-title {
    font-size: clamp(2.35rem, 15vw, 3.6rem);
  }

  .dashboard-actions,
  .dashboard-trip-meta,
  .dashboard-day-footer,
  .dashboard-mini-grid,
  .dashboard-route-stats,
  .dashboard-empty-plan {
    grid-template-columns: 1fr;
  }

  .dashboard-section-head,
  .dashboard-empty-row,
  .dashboard-day-head {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-timeline-block {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

```

## `src/app/actions.ts`

```ts
"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { recommendDestinations } from "@/lib/ai/openai";
import { getPlacesForTrip } from "@/lib/api/placesService";
import {
  createDefaultTripChildren,
  formString,
  getOrCreateUser,
  getPrimaryTrip,
  parseDateField,
  parseNumberField,
  toTripDraft,
} from "@/lib/db/travel";

const revalidateAll = () => {
  ["/", "/trips", "/discover", "/itinerary", "/map", "/budget", "/bookings", "/imports", "/documents", "/today", "/memories", "/profile"].forEach((path) => revalidatePath(path));
};

export async function createTrip(formData: FormData) {
  const user = await getOrCreateUser();
  const interests = formData.getAll("interests").map(String).join(", ");
  const destinationMode = formString(formData, "destinationMode", "known");
  const destinationCountry = formString(formData, "destinationCountry");
  const destinationInput = formString(formData, "destination");
  const selectedDestination = destinationMode === "recommend" ? undefined : destinationInput || destinationCountry || undefined;
  const tripDraft = {
    name: formString(formData, "name", "Untitled trip"),
    destination: selectedDestination,
    destinationCountry: destinationCountry || undefined,
    departureCity: formString(formData, "departureCity", "Dubai"),
    startDate: parseDateField(formData.get("startDate")).toISOString().slice(0, 10),
    endDate: parseDateField(formData.get("endDate")).toISOString().slice(0, 10),
    travelerCount: parseNumberField(formData.get("travelerCount"), 1),
    budget: parseNumberField(formData.get("budget"), 0),
    travelStyle: formString(formData, "travelStyle", "balanced") as "relaxed" | "balanced" | "adventure" | "luxury" | "family" | "romantic" | "cultural",
    pace: formString(formData, "pace", "medium") as "slow" | "medium" | "packed",
    interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
    notes: formString(formData, "notes"),
  };
  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      name: tripDraft.name,
      destination: tripDraft.destination,
      destinationCountry,
      departureCity: tripDraft.departureCity,
      startDate: parseDateField(formData.get("startDate")),
      endDate: parseDateField(formData.get("endDate")),
      travelerCount: tripDraft.travelerCount,
      budget: tripDraft.budget,
      travelStyle: tripDraft.travelStyle,
      pace: tripDraft.pace,
      interests,
      notes: tripDraft.notes,
      status: "planning",
    },
  });
  await createDefaultTripChildren(trip.id);

  const destinations = await recommendDestinations(tripDraft);
  if (destinations.data.length) {
    await prisma.destinationRecommendation.createMany({
      data: destinations.data.map((destination) => ({
        tripId: trip.id,
        name: destination.name,
        country: destination.country,
        whyItMatches: destination.whyItMatches,
        bestThingsToDo: destination.bestThingsToDo.join(", "),
        estimatedCost: destination.estimatedCost,
        weatherSummary: destination.weatherSummary,
        flightEstimate: destination.flightEstimate,
        hotelEstimate: destination.hotelEstimate,
        pros: destination.pros.join(", "),
        cons: destination.cons.join(", "),
        bestFor: destination.bestFor.join(", "),
        suggestedTripDuration: destination.suggestedTripDuration,
        confidenceScore: destination.confidenceScore,
        source: destinations.isMock ? "not-connected" : "openai",
      })),
    });
  }
  await prisma.aiGenerationLog.create({
    data: {
      tripId: trip.id,
      userId: user.id,
      type: "create_trip_destination_recommendations",
      prompt: JSON.stringify(tripDraft),
      response: destinations.raw,
      provider: "openai",
      model: "gpt-5.5",
      isMock: destinations.isMock,
    },
  });

  if (tripDraft.destination) {
    const places = await getPlacesForTrip(tripDraft);
    if (places.length) {
      await prisma.placeRecommendation.createMany({
        data: places.map((place) => ({
          tripId: trip.id,
          name: place.name,
          category: place.category,
          description: place.description,
          rating: place.rating,
          costLevel: place.costLevel,
          location: place.location,
          latitude: place.coordinates?.lat,
          longitude: place.coordinates?.lng,
          openingStatus: place.openingStatus,
          whyRecommended: place.whyRecommended,
          hiddenGemScore: place.hiddenGemScore,
          isHiddenGem: place.isHiddenGem,
          source: place.source.provider,
        })),
      });
    }
    await prisma.apiProviderLog.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
        endpoint: "places:searchText",
        status: "success",
        usedMock: !process.env.GOOGLE_PLACES_API_KEY,
        message: process.env.GOOGLE_PLACES_API_KEY ? `Stored ${places.length} Google Places results while creating the trip.` : "Google Places is not connected.",
      },
    });
  }

  revalidateAll();
  redirect("/discover");
}

export async function saveProfile(formData: FormData) {
  const user = await getOrCreateUser();
  await prisma.travelProfile.upsert({
    where: { userId: user.id },
    update: {
      preferredHotelType: formString(formData, "preferredHotelType"),
      travelPace: formString(formData, "travelPace", "medium"),
      foodPreferences: formString(formData, "foodPreferences"),
      budgetStyle: formString(formData, "budgetStyle", "balanced"),
      favoriteActivities: formString(formData, "favoriteActivities"),
      thingsToAvoid: formString(formData, "thingsToAvoid"),
      homeAirport: formString(formData, "homeAirport"),
      passportNationality: formString(formData, "passportNationality"),
      hiddenGemInterest: formData.get("hiddenGemInterest") === "on",
      preferredTravelMonths: formString(formData, "preferredTravelMonths"),
      notes: formString(formData, "notes"),
    },
    create: {
      userId: user.id,
      preferredHotelType: formString(formData, "preferredHotelType"),
      travelPace: formString(formData, "travelPace", "medium"),
      foodPreferences: formString(formData, "foodPreferences"),
      budgetStyle: formString(formData, "budgetStyle", "balanced"),
      favoriteActivities: formString(formData, "favoriteActivities"),
      thingsToAvoid: formString(formData, "thingsToAvoid"),
      homeAirport: formString(formData, "homeAirport"),
      passportNationality: formString(formData, "passportNationality"),
      hiddenGemInterest: formData.get("hiddenGemInterest") === "on",
      preferredTravelMonths: formString(formData, "preferredTravelMonths"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/profile");
}

export async function addExpense(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const amount = parseNumberField(formData.get("amount"), 0);
  const category = formString(formData, "category", "Food");
  await prisma.expense.create({
    data: {
      tripId: trip.id,
      category,
      amount,
      currency: trip.currency,
      note: formString(formData, "note"),
      spentAt: parseDateField(formData.get("spentAt")),
    },
  });
  await prisma.budgetCategory.updateMany({
    where: { tripId: trip.id, name: category },
    data: { actualAmount: { increment: amount } },
  });
  revalidatePath("/budget");
  revalidatePath("/");
}

export async function addBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  await prisma.booking.create({
    data: {
      tripId: trip.id,
      type: formString(formData, "type", "Flight"),
      title: formString(formData, "title", "Untitled booking"),
      provider: formString(formData, "provider"),
      confirmationNumber: formString(formData, "confirmationNumber"),
      startAt: parseDateField(formData.get("startAt")),
      link: formString(formData, "link"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/bookings");
  revalidatePath("/today");
}

export async function updateBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  const bookingId = formString(formData, "bookingId");
  if (!trip || !bookingId) return;
  await prisma.booking.updateMany({
    where: { id: bookingId, tripId: trip.id },
    data: {
      type: formString(formData, "type", "Flight"),
      title: formString(formData, "title", "Untitled booking"),
      provider: formString(formData, "provider"),
      confirmationNumber: formString(formData, "confirmationNumber"),
      startAt: parseDateField(formData.get("startAt")),
      endAt: formString(formData, "endAt") ? parseDateField(formData.get("endAt")) : null,
      link: formString(formData, "link"),
      notes: formString(formData, "notes"),
    },
  });
  revalidatePath("/bookings");
  revalidatePath("/documents");
  revalidatePath("/today");
}

export async function deleteBooking(formData: FormData) {
  const trip = await getPrimaryTrip();
  const bookingId = formString(formData, "bookingId");
  if (!trip || !bookingId) return;
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, tripId: trip.id } });
  if (!booking) return;
  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { id: bookingId, tripId: trip.id } }),
    ...(booking.importGroupId
      ? [prisma.documentNote.deleteMany({ where: { tripId: trip.id, importGroupId: booking.importGroupId } })]
      : []),
  ]);
  revalidatePath("/bookings");
  revalidatePath("/documents");
  revalidatePath("/today");
}

export async function addDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const uploadedUrl = await saveUploadedFile(formData.get("file"));
  await prisma.documentNote.create({
    data: {
      tripId: trip.id,
      type: formString(formData, "type", "Travel note"),
      title: formString(formData, "title", "Travel note"),
      content: formString(formData, "content"),
      link: formString(formData, "link") || uploadedUrl,
    },
  });
  revalidatePath("/documents");
}

export async function updateDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  const documentNoteId = formString(formData, "documentNoteId");
  if (!trip || !documentNoteId) return;
  const uploadedUrl = await saveUploadedFile(formData.get("file"));
  const link = formString(formData, "link") || uploadedUrl;
  await prisma.documentNote.updateMany({
    where: { id: documentNoteId, tripId: trip.id },
    data: {
      type: formString(formData, "type", "Travel note"),
      title: formString(formData, "title", "Travel note"),
      content: formString(formData, "content"),
      ...(link ? { link } : {}),
    },
  });
  revalidatePath("/documents");
}

export async function deleteDocumentNote(formData: FormData) {
  const trip = await getPrimaryTrip();
  const documentNoteId = formString(formData, "documentNoteId");
  if (!trip || !documentNoteId) return;
  const note = await prisma.documentNote.findFirst({ where: { id: documentNoteId, tripId: trip.id } });
  if (!note) return;
  await prisma.$transaction([
    prisma.documentNote.deleteMany({ where: { id: documentNoteId, tripId: trip.id } }),
    ...(note.importGroupId
      ? [prisma.booking.deleteMany({ where: { tripId: trip.id, importGroupId: note.importGroupId } })]
      : []),
  ]);
  revalidatePath("/documents");
  revalidatePath("/bookings");
  revalidatePath("/today");
}

export async function addMemory(formData: FormData) {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const uploadedUrl = await saveUploadedFile(formData.get("photo"));
  await prisma.memory.create({
    data: {
      tripId: trip.id,
      title: formString(formData, "title", "Trip memory"),
      favoriteMoments: formString(formData, "favoriteMoments"),
      placesVisited: formString(formData, "placesVisited"),
      notes: formString(formData, "notes"),
      photosPlaceholder: formString(formData, "photosPlaceholder") || uploadedUrl,
      nextTime: formString(formData, "nextTime"),
      rating: parseNumberField(formData.get("rating"), 0),
      favoriteRestaurants: formString(formData, "favoriteRestaurants"),
      favoriteHiddenGems: formString(formData, "favoriteHiddenGems"),
      placesToRevisit: formString(formData, "placesToRevisit"),
    },
  });
  revalidatePath("/memories");
}

async function saveUploadedFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size) return "";
  const bytes = Buffer.from(await value.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "travel");
  await mkdir(uploadsDir, { recursive: true });
  const safeName = value.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "upload";
  const fileName = `${Date.now()}-${safeName}`;
  await writeFile(path.join(uploadsDir, fileName), bytes);
  return `/uploads/travel/${fileName}`;
}

export async function refreshPlacesFromProvider() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const tripDraft = toTripDraft(trip);
  const places = await getPlacesForTrip(tripDraft);
  await prisma.placeRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.placeRecommendation.createMany({
    data: places.map((place) => ({
      tripId: trip.id,
      name: place.name,
      category: place.category,
      description: place.description,
      rating: place.rating,
      costLevel: place.costLevel,
      location: place.location,
      latitude: place.coordinates?.lat,
      longitude: place.coordinates?.lng,
      openingStatus: place.openingStatus,
      whyRecommended: place.whyRecommended,
      hiddenGemScore: place.hiddenGemScore,
      isHiddenGem: place.isHiddenGem,
      source: place.source.provider,
    })),
  });
  await prisma.apiProviderLog.create({
    data: {
      tripId: trip.id,
      userId: trip.userId,
      provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
      endpoint: "places:searchText",
      status: "success",
      usedMock: !process.env.GOOGLE_PLACES_API_KEY,
      message: process.env.GOOGLE_PLACES_API_KEY
        ? `Stored ${places.length} Google Places results.`
        : "No GOOGLE_PLACES_API_KEY configured; no places were stored.",
    },
  });
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/map");
  revalidatePath("/today");
}

export async function refreshDestinationsFromAi() {
  const trip = await getPrimaryTrip();
  if (!trip) return;
  const tripDraft = toTripDraft(trip);
  const result = await recommendDestinations(tripDraft);
  await prisma.destinationRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.destinationRecommendation.createMany({
    data: result.data.map((destination) => ({
      tripId: trip.id,
      name: destination.name,
      country: destination.country,
      whyItMatches: destination.whyItMatches,
      bestThingsToDo: destination.bestThingsToDo.join(", "),
      estimatedCost: destination.estimatedCost,
      weatherSummary: destination.weatherSummary,
      flightEstimate: destination.flightEstimate,
      hotelEstimate: destination.hotelEstimate,
      pros: destination.pros.join(", "),
      cons: destination.cons.join(", "),
      bestFor: destination.bestFor.join(", "),
      suggestedTripDuration: destination.suggestedTripDuration,
      confidenceScore: destination.confidenceScore,
      source: result.isMock ? "not-connected" : "openai",
    })),
  });
  await prisma.aiGenerationLog.create({
    data: {
      tripId: trip.id,
      userId: trip.userId,
      type: "destination_recommendations",
      prompt: JSON.stringify(tripDraft),
      response: result.raw,
      provider: "openai",
      model: "gpt-5.5",
      isMock: result.isMock,
    },
  });
  revalidatePath("/");
  revalidatePath("/discover");
}

export async function planDestination(formData: FormData) {
  const trip = await getPrimaryTrip();
  const destinationId = formString(formData, "destinationId");
  if (!trip || !destinationId) return;

  const destination = await prisma.destinationRecommendation.findFirst({
    where: { id: destinationId, tripId: trip.id },
  });
  if (!destination) return;

  const updatedTrip = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      destination: destination.name,
      destinationCountry: destination.country,
      budget: destination.estimatedCost || trip.budget,
      status: "planning",
      notes: [trip.notes, `Selected destination: ${destination.name}, ${destination.country}.`].filter(Boolean).join("\n"),
    },
  });

  const refreshedPlaces = await getPlacesForTrip({
    name: updatedTrip.name,
    destination: updatedTrip.destination ?? undefined,
    destinationCountry: updatedTrip.destinationCountry ?? undefined,
    departureCity: updatedTrip.departureCity,
    startDate: updatedTrip.startDate.toISOString().slice(0, 10),
    endDate: updatedTrip.endDate.toISOString().slice(0, 10),
    travelerCount: updatedTrip.travelerCount,
    budget: updatedTrip.budget,
    travelStyle: updatedTrip.travelStyle as "relaxed" | "balanced" | "adventure" | "luxury" | "family" | "romantic" | "cultural",
    pace: updatedTrip.pace as "slow" | "medium" | "packed",
    interests: updatedTrip.interests.split(",").map((item) => item.trim()).filter(Boolean),
    notes: updatedTrip.notes ?? undefined,
  });

  await prisma.placeRecommendation.deleteMany({ where: { tripId: trip.id } });
  if (refreshedPlaces.length) {
    await prisma.placeRecommendation.createMany({
      data: refreshedPlaces.map((place) => ({
        tripId: trip.id,
        name: place.name,
        category: place.category,
        description: place.description,
        rating: place.rating,
        costLevel: place.costLevel,
        location: place.location,
        latitude: place.coordinates?.lat,
        longitude: place.coordinates?.lng,
        openingStatus: place.openingStatus,
        whyRecommended: place.whyRecommended,
        hiddenGemScore: place.hiddenGemScore,
        isHiddenGem: place.isHiddenGem,
        source: place.source.provider,
      })),
    });
  }

  await prisma.apiProviderLog.create({
    data: {
      tripId: trip.id,
      userId: trip.userId,
      provider: destination.source,
      endpoint: "destination:plan",
      status: "success",
      usedMock: destination.source === "not-connected",
      message: `Trip destination set to ${destination.name}. Refreshed ${refreshedPlaces.length} places.`,
    },
  });

  revalidateAll();
}

export async function savePlaceForLater(formData: FormData) {
  const trip = await getPrimaryTrip();
  const placeId = formString(formData, "placeId");
  if (!trip || !placeId) return;

  const place = await prisma.placeRecommendation.findFirst({ where: { id: placeId, tripId: trip.id } });
  if (!place) return;

  const existing = await prisma.savedPlace.findFirst({
    where: { tripId: trip.id, placeRecommendationId: place.id },
  });
  if (!existing) {
    await prisma.savedPlace.create({
      data: {
        tripId: trip.id,
        placeRecommendationId: place.id,
        name: place.name,
        category: place.category,
        notes: place.whyRecommended,
        priority: place.isHiddenGem ? 1 : 2,
      },
    });
  }

  revalidateAll();
}

export async function addPlaceToItinerary(formData: FormData) {
  await savePlaceForLater(formData);
  revalidateAll();
}

export async function removeSelectedPlace(formData: FormData) {
  const trip = await getPrimaryTrip();
  const placeId = formString(formData, "placeId");
  if (!trip || !placeId) return;

  const savedPlace = await prisma.savedPlace.findFirst({
    where: {
      tripId: trip.id,
      OR: [{ id: placeId }, { placeRecommendationId: placeId }],
    },
  });
  if (!savedPlace) return;

  await prisma.savedPlace.delete({ where: { id: savedPlace.id } });
  if (savedPlace.placeRecommendationId) {
    await prisma.itineraryItem.deleteMany({
      where: {
        placeRecommendationId: savedPlace.placeRecommendationId,
        itineraryDay: { tripId: trip.id },
      },
    });
  }

  revalidateAll();
}

```

## `src/app/page.tsx`

```tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CloudSun,
  Compass,
  Download,
  ExternalLink,
  Heart,
  Map,
  MapPin,
  Plane,
  Route,
  Sparkles,
  Ticket,
  Umbrella,
  WalletCards,
} from "lucide-react";
import { getMapRoute, formatDistance, formatDuration } from "@/lib/api/mapsService";
import { getWeatherSummary } from "@/lib/api/weatherService";
import {
  getPrimaryTrip,
  toDestinationRecommendations,
  toItineraryDays,
  toPlaceRecommendations,
  toSelectedPlaceRecommendations,
  toTripDraft,
} from "@/lib/db/travel";
import { getExternalSearchLinks, withHotelAreaHint } from "@/lib/travel/externalSearchLinks";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dbTrip = await getPrimaryTrip();
  const trip = dbTrip ? toTripDraft(dbTrip) : null;
  const places = dbTrip ? toPlaceRecommendations(dbTrip) : [];
  const selectedPlaces = dbTrip ? toSelectedPlaceRecommendations(dbTrip) : [];
  const itineraryDays = dbTrip ? toItineraryDays(dbTrip) : [];
  const destinations = dbTrip ? toDestinationRecommendations(dbTrip) : [];
  const route = await getMapRoute(places);
  const weatherDestination = [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(weatherDestination);
  const searchLinks = getExternalSearchLinks(withHotelAreaHint(dbTrip, dbTrip?.placeRecommendations));
  const actualSpent = dbTrip ? dbTrip.budgetCategories.reduce((sum, item) => sum + item.actualAmount, 0) : 0;
  const estimatedBudget = dbTrip ? dbTrip.budgetCategories.reduce((sum, item) => sum + item.estimatedAmount, 0) : 0;
  const firstDay = itineraryDays[0];
  const readiness = Math.min(
    100,
    (trip ? 20 : 0) +
      (destinations.length ? 15 : 0) +
      (selectedPlaces.length ? 20 : 0) +
      (itineraryDays.length ? 25 : 0) +
      (dbTrip?.bookings.length ? 10 : 0) +
      (dbTrip?.documentNotes.length ? 10 : 0),
  );
  const tripTiming = trip ? daysUntilText(trip.startDate) : "Create a trip to begin";

  return (
    <div className="dashboard-shell">
      <section className="dashboard-layout">
        <main className="dashboard-main">
          <section className="dashboard-intro">
            <div>
              <p className="dashboard-kicker">Private trip studio</p>
              <h1 className="dashboard-title">{trip ? `Good to go for ${trip.destination ?? trip.name}` : "Plan your next personal escape"}</h1>
              <p className="dashboard-subtitle">
                {trip
                  ? `${trip.departureCity} to ${trip.destination ?? "destination open"} · ${trip.startDate} to ${trip.endDate} · ${trip.travelerCount} travelers`
                  : "Create one trip, compare ideas, select places, and build the day-by-day plan from here."}
              </p>
            </div>
          </section>

          <div className="dashboard-actions">
            <ActionCard href="/itinerary" icon={Sparkles} title="AI itinerary" text={selectedPlaces.length ? "Generate from selected places" : "Generate from trip profile"} primary />
            <ActionCard href="/discover" icon={Compass} title="Discover places" text="Select hidden gems and restaurants" />
            <ActionCard href="/integrations" icon={Ticket} title="Tours" text="Open GetYourGuide and activity tools" />
            <ActionCard href="/map" icon={Map} title="View map" text="Check route and saved pins" />
          </div>

          <section className="dashboard-selected">
            <div className="dashboard-section-head">
              <div>
                <p className="dashboard-label">Selected places</p>
                <h2>{selectedPlaces.length ? `${selectedPlaces.length} ready for planning` : "Choose places for the plan"}</h2>
              </div>
              <Link href="/discover">Manage selections <ArrowRight /></Link>
            </div>
            <div className="dashboard-place-strip">
              {selectedPlaces.slice(0, 6).map((place, index) => (
                <Link href="/discover" key={place.id} className="dashboard-place-pill">
                  <span className="dashboard-thumb">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{place.name}</strong>
                    <small>{place.category}</small>
                  </span>
                </Link>
              ))}
              {!selectedPlaces.length ? (
                <div className="dashboard-empty-row">
                  <MapPin />
                  Select places in Discover, then generate a complete itinerary from those choices.
                </div>
              ) : null}
            </div>
          </section>

          <section className="dashboard-itinerary">
            <div className="dashboard-section-head">
              <div>
                <p className="dashboard-label">Itinerary preview</p>
                <h2>{firstDay?.theme ?? "No generated itinerary yet"}</h2>
              </div>
              <Link href="/itinerary">Open builder <ArrowRight /></Link>
            </div>
            {firstDay ? (
              <div className="dashboard-day">
                <TimelineBlock accent="cyan" label="Morning" text={firstDay.morningPlan} />
                <TimelineBlock accent="emerald" label="Afternoon" text={firstDay.afternoonPlan} />
                <TimelineBlock accent="violet" label="Evening" text={firstDay.eveningPlan} />
                <div className="dashboard-day-footer">
                  <span><WalletCards /> Estimated day cost: {formatCurrency(firstDay.estimatedCost)}</span>
                  <span><Umbrella /> Backup: {firstDay.backupOption || "Add backup option"}</span>
                </div>
              </div>
            ) : (
              <div className="dashboard-empty-plan">
                <Sparkles />
                <div>
                  <strong>Generate your first itinerary</strong>
                  <p>Use selected places from Discover, or let OpenAI build from your trip profile.</p>
                </div>
                <Link href="/itinerary">Generate plan</Link>
              </div>
            )}
          </section>
        </main>

        <aside className="dashboard-rail">
          <section className="dashboard-trip-card">
            <div>
              <p className="dashboard-label">Active trip</p>
              <h2>{trip?.name ?? "No trip yet"}</h2>
              <p>{tripTiming}</p>
            </div>
            <div className="dashboard-readiness">
              <span>{readiness}% ready</span>
              <div>
                <i style={{ width: `${readiness}%` }} />
              </div>
            </div>
          </section>

          <section className="dashboard-map-card">
            <div className="dashboard-section-head compact">
              <div>
                <p className="dashboard-label">Trip overview</p>
                <h2>{route.pins.length} map pins</h2>
              </div>
              <Link href="/map">Full map</Link>
            </div>
            <div className="dashboard-map-preview">
              <img src="/api/maps/static?width=620&height=260&markers=true&route=true" alt="Map preview for saved and recommended places" />
              <div className="dashboard-map-fallback">
                {route.routePins.slice(0, 5).map((pin, index) => (
                  <span key={pin.id} style={{ left: `${18 + index * 15}%`, top: `${62 - (index % 3) * 18}%` }}>{index + 1}</span>
                ))}
              </div>
            </div>
            <div className="dashboard-route-stats">
              <span><Route /> {formatDistance(route.distanceMeters)}</span>
              <span><CalendarDays /> {formatDuration(route.duration)}</span>
            </div>
          </section>

          <section className="dashboard-weather">
            <div>
              <p className="dashboard-label">Weather</p>
              <h2>{weather.summary}</h2>
              <p>{weather.temperatureRange} · rain risk: {weather.rainRisk}</p>
            </div>
            <CloudSun />
          </section>

          <section className="dashboard-mini-grid">
            <MiniPanel title="Budget" value={formatCurrency(actualSpent)} detail={`${formatCurrency(estimatedBudget)} estimated`} href="/budget" />
            <MiniPanel title="Bookings" value={`${dbTrip?.bookings.length ?? 0}`} detail="Confirmations saved" href="/bookings" />
          </section>

          <section className="dashboard-stack">
            <RailAction icon={Download} href="/imports" title="Import reminders" text="Scan Gmail or paste booking confirmations." />
            <RailAction icon={Heart} href="/memories" title="Memory prompt" text="Save highlights after the trip." />
            <RailAction icon={Plane} href={searchLinks.find((link) => link.id === "google-flights")?.href ?? "/bookings"} title="Compare flights" text="Open trip-aware flight search." external />
          </section>
        </aside>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  text,
  primary,
}: {
  href: string;
  icon: typeof Sparkles;
  title: string;
  text: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={cn("dashboard-action", primary && "primary")}>
      <span><Icon /></span>
      <strong>{title}</strong>
      <small>{text}</small>
      <ArrowRight />
    </Link>
  );
}

function TimelineBlock({ accent, label, text }: { accent: "cyan" | "emerald" | "violet"; label: string; text: string }) {
  return (
    <div className={cn("dashboard-timeline-block", accent)}>
      <span>{label}</span>
      <p>{text}</p>
    </div>
  );
}

function MiniPanel({ title, value, detail, href }: { title: string; value: string; detail: string; href: string }) {
  return (
    <Link href={href} className="dashboard-mini-panel">
      <small>{title}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </Link>
  );
}

function RailAction({
  icon: Icon,
  href,
  title,
  text,
  external,
}: {
  icon: typeof Download;
  href: string;
  title: string;
  text: string;
  external?: boolean;
}) {
  return (
    <Link href={href} target={external ? "_blank" : undefined} className="dashboard-rail-action">
      <span><Icon /></span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      {external ? <ExternalLink /> : <ArrowRight />}
    </Link>
  );
}

function daysUntilText(startDate: string) {
  const today = new Date();
  const start = new Date(`${startDate}T12:00:00.000Z`);
  const days = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
  if (days > 1) return `Starts in ${days} days`;
  if (days === 1) return "Starts tomorrow";
  if (days === 0) return "Starts today";
  return "Trip is active or completed";
}

```

## `src/app/bookings/page.tsx`

```tsx
import Link from "next/link";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ExternalSearchLinks } from "@/components/travel/external-search-links";
import { StudioGrid, StudioHero, StudioPanel, StudioRail, StudioStat } from "@/components/travel/studio";
import { addBooking, deleteBooking, updateBooking } from "@/app/actions";
import { getPrimaryTrip } from "@/lib/db/travel";
import { withHotelAreaHint } from "@/lib/travel/externalSearchLinks";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const trip = await getPrimaryTrip();
  const bookings = trip
    ? trip.bookings.map((booking) => ({
        id: booking.id,
        title: booking.title,
        type: booking.type,
        provider: booking.provider,
        confirmationNumber: booking.confirmationNumber,
        importGroupId: booking.importGroupId,
        date: booking.startAt?.toISOString().slice(0, 10),
        endDate: booking.endAt?.toISOString().slice(0, 10),
        link: booking.link,
        notes: booking.notes,
      }))
    : [];

  return (
    <>
      <StudioHero
        label="Bookings"
        title="Keep every confirmation close to the plan."
        description="Add records manually or import Booking.com and Expedia confirmations from Gmail into Bookings and Documents."
      >
        <div className="grid gap-3">
          <StudioStat label="Saved bookings" value={`${bookings.length}`} />
          <Link className={buttonVariants({ variant: "warm" })} href="/imports">Open imports</Link>
        </div>
      </StudioHero>
      <StudioGrid>
        <div className="space-y-5">
          <StudioPanel title="Saved bookings" eyebrow="Trip records">
            <div className="grid gap-5">
              {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader className="flex-row items-start justify-between gap-3">
                      <CardTitle>{booking.title}</CardTitle>
                      <form action={deleteBooking}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-rose-300 hover:bg-rose-400/10" title={booking.importGroupId ? "Deletes the matching imported document too" : "Delete booking"}>
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </form>
                    </CardHeader>
                    <CardContent className="text-sm leading-6 text-slate-400">
                      <p><strong className="text-white">{booking.type}</strong>{booking.date ? ` · ${booking.date}` : ""}</p>
                      <p>Provider: {booking.provider || "Not added yet"}</p>
                      <p>Confirmation: {booking.confirmationNumber || "Not added yet"}</p>
                      {booking.importGroupId ? <p className="font-semibold text-slate-500">Imported pair: deleting this also removes the matching document.</p> : null}
                      <p>{booking.notes}</p>
                      <form action={updateBooking} className="mt-4 grid gap-3 rounded-[8px] bg-slate-50 p-4">
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <Select name="type" defaultValue={booking.type}>
                          <option>Flight</option>
                          <option>Hotel</option>
                          <option>Restaurant</option>
                          <option>Tour</option>
                          <option>Car rental</option>
                          <option>Travel</option>
                        </Select>
                        <Input name="title" defaultValue={booking.title} placeholder="Booking title" required />
                        <Input name="provider" defaultValue={booking.provider ?? ""} placeholder="Provider" />
                        <Input name="confirmationNumber" defaultValue={booking.confirmationNumber ?? ""} placeholder="Confirmation number" />
                        <div className="grid gap-3 md:grid-cols-2">
                          <Input name="startAt" type="date" defaultValue={booking.date ?? ""} />
                          <Input name="endAt" type="date" defaultValue={booking.endDate ?? ""} />
                        </div>
                        <Input name="link" defaultValue={booking.link ?? ""} placeholder="Link" />
                        <Textarea name="notes" defaultValue={booking.notes ?? ""} placeholder="Notes" />
                        <Button type="submit" variant="outline" size="sm" className="justify-self-start">
                          <Save size={16} />
                          Save changes
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
              ))}
              {!bookings.length ? (
                <Card>
                  <CardContent className="p-5 text-sm font-semibold text-slate-400">No bookings saved yet. Add your real confirmations when you have them.</CardContent>
                </Card>
              ) : null}
            </div>
          </StudioPanel>
        </div>
        <StudioRail>
          <StudioPanel title="Add booking note">
            <form action={addBooking} className="grid gap-4">
              <Select name="type"><option>Flight</option><option>Hotel</option><option>Restaurant</option><option>Tour</option><option>Car rental</option></Select>
              <Input name="title" placeholder="Booking title" required />
              <Input name="provider" placeholder="Provider" />
              <Input name="confirmationNumber" placeholder="Confirmation number" />
              <Input name="startAt" type="date" />
              <Input name="link" placeholder="Link" />
              <Textarea name="notes" placeholder="Notes" />
              <Button><Plus /> Add booking</Button>
            </form>
          </StudioPanel>
          <StudioPanel title="Find travel options">
            <ExternalSearchLinks trip={withHotelAreaHint(trip, trip?.placeRecommendations)} compact />
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

```

## `src/app/budget/page.tsx`

```tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ExternalSearchLinks } from "@/components/travel/external-search-links";
import { StudioGrid, StudioHero, StudioPanel, StudioRail, StudioStat } from "@/components/travel/studio";
import { addExpense } from "@/app/actions";
import { getExchangeRate } from "@/lib/api/currencyService";
import { getPrimaryTrip } from "@/lib/db/travel";
import { withHotelAreaHint } from "@/lib/travel/externalSearchLinks";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const trip = await getPrimaryTrip();
  const budgetCategories = trip
    ? trip.budgetCategories.map((item) => ({ name: item.name, estimated: item.estimatedAmount, actual: item.actualAmount }))
    : [];
  const estimated = budgetCategories.reduce((sum, item) => sum + item.estimated, 0);
  const actual = budgetCategories.reduce((sum, item) => sum + item.actual, 0);
  const remaining = (trip?.budget ?? 0) - actual;
  const eurRate = await getExchangeRate("USD", "EUR");

  return (
    <>
      <StudioHero
        label="Budget"
        title="Know the estimate, track the real spend."
        description="Keep manual estimates, live currency context, and actual expenses in one calm workspace."
      >
        <div className="grid gap-3">
          <StudioStat label="Remaining" value={formatCurrency(remaining)} tone={remaining >= 0 ? "emerald" : "rose"} />
          <StudioStat label="Actual spend" value={formatCurrency(actual)} tone="amber" />
        </div>
      </StudioHero>
      <StudioGrid>
        <div className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-3">
            <StudioStat label="Estimated total" value={formatCurrency(estimated)} />
            <StudioStat label="Actual spend" value={formatCurrency(actual)} tone="amber" />
            <StudioStat label="Remaining budget" value={formatCurrency(remaining)} tone={remaining >= 0 ? "emerald" : "rose"} />
          </section>

          <StudioPanel title="Category breakdown" eyebrow="Spend health">
            <div className="flex flex-col gap-4">
              {budgetCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-200">{category.name}</span>
                    <span className="text-slate-500">{formatCurrency(category.actual)} / {formatCurrency(category.estimated)}</span>
                  </div>
                  <Progress value={category.estimated ? (category.actual / category.estimated) * 100 : 0} />
                </div>
              ))}
              {!budgetCategories.length ? <p className="text-sm font-semibold text-slate-400">Create a trip to initialize budget categories.</p> : null}
            </div>
          </StudioPanel>
        </div>
        <StudioRail>
          <StudioPanel title="Add actual expense">
            <form action={addExpense} className="grid gap-3">
              <Select name="category">{budgetCategories.map((category) => <option key={category.name}>{category.name}</option>)}</Select>
              <Input name="amount" placeholder="Amount" type="number" step="0.01" required />
              <Input name="spentAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              <Textarea name="note" placeholder="Note" />
              <Button><Plus /> Add expense</Button>
            </form>
          </StudioPanel>
          <StudioPanel title="Live exchange rate">
            <p className="text-lg font-bold text-white">{eurRate.rate ? `1 USD = ${eurRate.rate.toFixed(3)} EUR` : "Exchange rate unavailable"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{eurRate.source.provider}: {eurRate.source.note}</p>
          </StudioPanel>
          <StudioPanel title="Search current prices">
            <ExternalSearchLinks trip={withHotelAreaHint(trip, trip?.placeRecommendations)} compact />
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

```

## `src/app/discover/page.tsx`

```tsx
import Link from "next/link";
import { Compass, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { ActivitySection } from "@/components/travel/activity-section";
import { DestinationCard } from "@/components/travel/destination-card";
import { PlaceCard } from "@/components/travel/place-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { refreshDestinationsFromAi, refreshPlacesFromProvider } from "@/app/actions";
import { StudioChip, StudioGrid, StudioHero, StudioPanel, StudioRail, StudioStat } from "@/components/travel/studio";
import { getPrimaryTrip, toDestinationRecommendations, toPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const trip = await getPrimaryTrip();
  const destinationRecommendations = trip ? toDestinationRecommendations(trip) : [];
  const placeRecommendations = trip ? toPlaceRecommendations(trip) : [];
  const hiddenGems = placeRecommendations.filter((place) => place.isHiddenGem);
  const restaurants = placeRecommendations.filter((place) => /restaurant|cafe|bar|food/i.test(place.category));
  const otherPlaces = placeRecommendations.filter((place) => !place.isHiddenGem && !restaurants.includes(place));
  const selectedPlaceIds = new Set(trip?.savedPlaces.map((place) => place.placeRecommendationId).filter((id): id is string => Boolean(id)) ?? []);
  const selectedCount = selectedPlaceIds.size;
  const tripDestination = destinationLabel(trip?.destination, trip?.destinationCountry);
  const destinationSource = sourceSummary(destinationRecommendations.map((destination) => destination.source.provider));
  const placeSource = sourceSummary(placeRecommendations.map((place) => place.source.provider));

  return (
    <>
      <StudioHero
        label="Discover"
        title={tripDestination ? `Curate the best version of ${tripDestination}.` : "Choose the places that deserve a day in the plan."}
        description="Select and unselect places here without being redirected. When your basket feels right, open the itinerary builder and generate the full plan."
      >
        <div className="premium-panel-soft rounded-[8px] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Selection basket</p>
          <p className="mt-2 text-5xl font-black tracking-[-0.06em] text-white">{selectedCount}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">places ready for itinerary generation</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCount ? (
              <Link className={buttonVariants()} href="/itinerary">
                <Sparkles />
                Open itinerary builder
              </Link>
            ) : (
              <Link className={buttonVariants({ variant: "outline" })} href="/itinerary">
                Generate with OpenAI
              </Link>
            )}
          </div>
        </div>
      </StudioHero>

      <StudioGrid>
        <div className="space-y-5">
          <section className="grid gap-3 md:grid-cols-3">
            <StudioStat icon={Compass} label="Destination source" value={destinationSource} tone={destinationSource === "not-connected" ? "amber" : "emerald"} />
            <StudioStat icon={MapPin} label="Place source" value={placeSource} tone={placeSource === "not-connected" ? "amber" : "emerald"} />
            <StudioStat icon={Sparkles} label="Available places" value={`${placeRecommendations.length}`} />
          </section>

          <StudioPanel
            title="Refresh live context"
            eyebrow="Provider actions"
            action={
              <div className="flex flex-wrap gap-2">
                <form action={refreshDestinationsFromAi}>
                  <Button type="submit" variant="outline">
                    <RefreshCw />
                    Destinations
                  </Button>
                </form>
                <form action={refreshPlacesFromProvider}>
                  <Button type="submit">
                    <RefreshCw />
                    Places data
                  </Button>
                </form>
              </div>
            }
          >
            <p className="text-sm leading-6 text-slate-400">
              Destination ideas stay scoped to the active trip. Place cards use Google Places when configured and remain selectable in this workspace.
            </p>
          </StudioPanel>

          <ActivitySection trip={trip} />

          <StudioPanel title="Destination ideas" eyebrow="Plan direction">
            <div className="grid gap-5 lg:grid-cols-3">
              {destinationRecommendations.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}
              {!destinationRecommendations.length ? (
                <div className="premium-panel-soft rounded-[8px] p-5 text-sm font-semibold text-slate-400 lg:col-span-3">
                  No destination ideas yet. Refresh destinations or create a trip with recommendation mode.
                </div>
              ) : null}
            </div>
          </StudioPanel>

          <PlaceSection title="Hidden gems" eyebrow="Local layer" places={hiddenGems} selectedPlaceIds={selectedPlaceIds} />
          <PlaceSection title="Restaurants and cafes" eyebrow="Food layer" places={restaurants} selectedPlaceIds={selectedPlaceIds} />
          <PlaceSection title="Places to visit" eyebrow="Plan candidates" places={otherPlaces} selectedPlaceIds={selectedPlaceIds} />
        </div>

        <StudioRail className="xl:sticky xl:top-5 xl:self-start">
          <StudioPanel title="Selected for itinerary">
            <div className="flex flex-wrap gap-2">
              {trip?.savedPlaces.length ? (
                trip.savedPlaces.map((place) => (
                  <StudioChip key={place.id} tone="selected">
                    <MapPin size={14} />
                    {place.name}
                  </StudioChip>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-400">Choose places from the cards. The page will stay here and show selected state immediately after the action completes.</p>
              )}
            </div>
          </StudioPanel>

          <StudioPanel title="How this page behaves">
            <div className="grid gap-3 text-sm leading-6 text-slate-400">
              <p>Place actions add or remove selections only. They do not redirect to Itinerary.</p>
              <p>When you open Itinerary, the builder can generate from selected places. If none are selected, it can still generate with OpenAI from all recommendations.</p>
              <p>Use Tours for GetYourGuide searches tied to the active destination.</p>
            </div>
          </StudioPanel>

          <Link href="/integrations" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
            View travel tools
          </Link>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

function PlaceSection({
  title,
  eyebrow,
  places,
  selectedPlaceIds,
}: {
  title: string;
  eyebrow: string;
  places: ReturnType<typeof toPlaceRecommendations>;
  selectedPlaceIds: Set<string>;
}) {
  if (!places.length) return null;
  return (
    <StudioPanel title={title} eyebrow={eyebrow}>
      <div className="grid gap-5 lg:grid-cols-3">
        {places.map((place) => <PlaceCard key={place.id} place={place} selected={selectedPlaceIds.has(place.id)} />)}
      </div>
    </StudioPanel>
  );
}

function sourceSummary(sources: string[]) {
  const uniqueSources = [...new Set(sources)];
  if (!uniqueSources.length) return "not-connected";
  if (uniqueSources.length === 1) return uniqueSources[0];
  return "mixed";
}

function destinationLabel(destination?: string | null, country?: string | null) {
  const cleanDestination = String(destination ?? "").trim();
  const cleanCountry = String(country ?? "").trim();
  if (cleanDestination && cleanCountry && cleanDestination.toLowerCase() === cleanCountry.toLowerCase()) return cleanDestination;
  return [cleanDestination, cleanCountry].filter(Boolean).join(", ");
}

```

## `src/app/documents/page.tsx`

```tsx
import Link from "next/link";
import { FileUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { StudioGrid, StudioHero, StudioPanel, StudioRail, StudioChip } from "@/components/travel/studio";
import { PackingListCard } from "@/components/travel/packing-list-card";
import { addDocumentNote, deleteDocumentNote, updateDocumentNote } from "@/app/actions";
import { getPrimaryTrip } from "@/lib/db/travel";

const docs = ["Passport reminder", "Visa details", "Insurance", "Tickets", "Hotel confirmation", "Emergency contacts", "Embassy info", "Local SIM/eSIM info"];

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const trip = await getPrimaryTrip();
  return (
    <>
      <StudioHero
        label="Documents"
        title="Keep the important trip details close."
        description="Save confirmations, tickets, insurance, emergency contacts, local files, and practical notes for before and during the trip."
      >
        <div className="grid gap-2">
          <StudioChip>{trip?.documentNotes.length ?? 0} saved notes</StudioChip>
          <StudioChip tone="warm">Files save locally</StudioChip>
        </div>
      </StudioHero>
      <StudioGrid>
        <div className="space-y-5">
          <StudioPanel title="Saved document notes" eyebrow="Trip vault">
            <div className="grid gap-5">
              {trip?.documentNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3">
                    <CardTitle>{note.title}</CardTitle>
                    <form action={deleteDocumentNote}>
                      <input type="hidden" name="documentNoteId" value={note.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-rose-300 hover:bg-rose-400/10" title={note.importGroupId ? "Deletes the matching imported booking too" : "Delete document"}>
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </form>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-slate-400">
                    {note.importGroupId ? <p className="mb-2 font-semibold text-slate-500">Imported pair: deleting this also removes the matching booking.</p> : null}
                    <p>{note.content}</p>
                    {note.link ? (
                      <Link href={note.link} className="mt-2 inline-flex font-semibold text-sky-200" target={note.link.startsWith("http") ? "_blank" : undefined}>
                        Open saved reference
                      </Link>
                    ) : null}
                    <form action={updateDocumentNote} className="mt-4 grid gap-3 rounded-[8px] bg-slate-50 p-4">
                      <input type="hidden" name="documentNoteId" value={note.id} />
                      <Input name="type" defaultValue={note.type} placeholder="Type" />
                      <Input name="title" defaultValue={note.title} placeholder="Title" required />
                      <Input name="link" defaultValue={note.link ?? ""} placeholder="Link or file reference" />
                      <label className="grid gap-2 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-300">
                        <span className="flex items-center gap-2"><FileUp size={18} /> Replace or add file</span>
                        <input name="file" type="file" className="text-sm font-medium file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#17243a] file:px-4 file:py-2 file:font-semibold file:text-slate-100" />
                      </label>
                      <Textarea name="content" defaultValue={note.content} placeholder="Details" />
                      <Button type="submit" variant="outline" size="sm" className="justify-self-start">
                        <Save size={16} />
                        Save changes
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
              {!trip?.documentNotes.length ? <Card><CardContent className="p-5 text-sm font-semibold text-slate-400">No saved document notes yet.</CardContent></Card> : null}
            </div>
          </StudioPanel>
        </div>
        <StudioRail>
          <StudioPanel title="Add document note">
            <form action={addDocumentNote} className="grid gap-3">
              <Input name="type" placeholder="Type, e.g. Insurance" />
              <Input name="title" placeholder="Title" required />
              <Input name="link" placeholder="Link or file reference" />
              <label className="grid gap-2 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-300">
                <span className="flex items-center gap-2"><FileUp size={18} /> Upload PDF, image, or confirmation file</span>
                <input name="file" type="file" className="text-sm font-medium file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#17243a] file:px-4 file:py-2 file:font-semibold file:text-slate-100" />
              </label>
              <Textarea name="content" placeholder="Details" />
              <Button>Save note</Button>
            </form>
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
      <PackingListCard />
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        {docs.map((doc) => (
          <Card key={doc}>
            <CardHeader><CardTitle>{doc}</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <form action={addDocumentNote} className="grid gap-3">
                <input type="hidden" name="type" value={doc} />
                <input type="hidden" name="title" value={doc} />
                <Input name="link" placeholder={`${doc} link or reference`} />
                <Textarea name="content" placeholder={`Add ${doc.toLowerCase()} notes`} />
                <Button>Save {doc}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

```

## `src/app/imports/page.tsx`

```tsx
import { ImportWorkspace } from "@/components/travel/import-workspace";
import { StudioHero } from "@/components/travel/studio";

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  return (
    <>
      <StudioHero
        label="Imports"
        title="Pull confirmations into the trip plan."
        description="Scan Gmail or paste Booking.com and Expedia emails, preview the extracted booking, then import selected records into Bookings and Documents."
      />
      <ImportWorkspace />
    </>
  );
}

```

## `src/app/integrations/page.tsx`

```tsx
import { AlertCircle, CheckCircle2, CircleDashed, KeyRound, PlugZap } from "lucide-react";
import { getIntegrationStatuses, type IntegrationStatus } from "@/lib/api/integrationStatus";
import { StudioHero, StudioStat } from "@/components/travel/studio";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const statuses = await getIntegrationStatuses();
  const liveApis = statuses.filter((status) => ["openai", "google-places", "google-static-maps", "google-routes", "open-meteo", "frankfurter", "gmail"].includes(status.id) || (status.id === "getyourguide" && status.state === "live"));
  const travelTools = statuses.filter((status) => ["booking", "expedia", "skyscanner"].includes(status.id) || (status.id === "getyourguide" && status.state !== "live"));
  const optionalLater = statuses.filter((status) => !liveApis.includes(status) && !travelTools.includes(status));
  const liveCount = liveApis.filter((status) => status.state === "live").length;
  const toolCount = travelTools.filter((status) => status.state === "ready").length;
  const missingCount = optionalLater.filter((status) => status.state === "missing").length;
  const failingCount = statuses.filter((status) => status.state === "failing").length;

  return (
    <>
      <StudioHero
        label="Integrations"
        title="Live data, shortcuts, and optional providers."
        description="See what is connected, what works through external search, and what can stay optional until provider access is worth the effort."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-4">
        <StudioStat label="Live APIs" value={`${liveCount}`} tone="emerald" />
        <StudioStat label="Search tools" value={`${toolCount}`} />
        <StudioStat label="Optional later" value={`${missingCount}`} tone="amber" />
        <StudioStat label="Failing" value={`${failingCount}`} tone="rose" />
      </section>

      <IntegrationGroup
        title="Live now"
        description="These services are already connected or available through no-key public providers."
        statuses={liveApis}
      />
      <IntegrationGroup
        title="Travel search tools"
        description="These are practical external searches for personal use, not blocked partner APIs."
        statuses={travelTools}
      />
      <IntegrationGroup
        title="Optional later"
        description="These can stay manual until you truly need live tours or an alternate map provider."
        statuses={optionalLater}
      />
    </>
  );
}

function IntegrationGroup({ title, description, statuses }: { title: string; description: string; statuses: IntegrationStatus[] }) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {statuses.map((status) => (
          <IntegrationCard key={status.id} status={status} />
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({ status }: { status: IntegrationStatus }) {
  const Icon = status.state === "live" ? CheckCircle2 : status.state === "failing" ? AlertCircle : status.state === "ready" ? PlugZap : CircleDashed;
  const badgeVariant = status.state === "live" ? "live" : status.state === "ready" ? "blue" : status.state === "failing" ? "mock" : "secondary";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon className={status.state === "failing" ? "text-amber-700" : status.state === "live" ? "text-emerald-700" : "text-slate-500"} />
            {status.name}
          </CardTitle>
          <p className="mt-1 text-sm font-semibold text-slate-500">{status.category}</p>
        </div>
        <Badge variant={badgeVariant}>{status.state}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-6 text-slate-600">{status.message}</p>
        {status.nextStep ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <span className="font-bold text-slate-950">Next step: </span>
            {status.nextStep}
          </div>
        ) : null}
        {status.env.length ? (
          <div className="flex flex-wrap gap-2">
            {status.env.map((key) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-100">
                <KeyRound size={13} />
                {key}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-slate-400">No API key needed.</p>
        )}
      </CardContent>
    </Card>
  );
}

```

## `src/app/itinerary/page.tsx`

```tsx
import { ItineraryWorkspace } from "@/components/travel/itinerary-workspace";
import { getPrimaryTrip, toItineraryDays, toSelectedPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function ItineraryPage() {
  const trip = await getPrimaryTrip();
  const days = trip ? toItineraryDays(trip) : [];
  const selectedPlaces = trip ? toSelectedPlaceRecommendations(trip) : [];
  const shouldAutoGenerate = selectedPlaces.length > 0 && (days.length === 0 || days.every((day) => day.theme === "Start with saved places" && day.notes.includes("Created automatically when a Discover place was added.")));
  return (
    <main>
      <ItineraryWorkspace initialDays={days} selectedPlaces={selectedPlaces} shouldAutoGenerate={shouldAutoGenerate} />
    </main>
  );
}

```

## `src/app/map/page.tsx`

```tsx
import { InteractiveMap } from "@/components/travel/interactive-map";
import { StudioHero, StudioStat } from "@/components/travel/studio";
import { getMapRoute } from "@/lib/api/mapsService";
import { getPrimaryTrip, toPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const trip = await getPrimaryTrip();
  const placeRecommendations = trip ? toPlaceRecommendations(trip) : [];
  const route = await getMapRoute(placeRecommendations);
  const mapImageBaseUrl = route.provider === "google-maps" ? "/api/maps/static?width=920&height=540&markers=false&route=false" : null;

  return (
    <>
      <StudioHero
        label="Map"
        title="Plan routes with pins you can actually use."
        description="Click pins, zoom the planning canvas, toggle layers, and open places in Google Maps when you need real navigation."
      >
        <div className="grid gap-3">
          <StudioStat label="Pins" value={`${placeRecommendations.length}`} />
          <StudioStat label="Route source" value={route.provider} tone={route.provider === "google-maps" ? "emerald" : "amber"} />
        </div>
      </StudioHero>
      <InteractiveMap route={route} mapImageBaseUrl={mapImageBaseUrl} />
    </>
  );
}

```

## `src/app/memories/page.tsx`

```tsx
import Link from "next/link";
import { Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { MemorySummaryCard } from "@/components/travel/memory-summary-card";
import { StudioGrid, StudioHero, StudioPanel, StudioRail, StudioStat } from "@/components/travel/studio";
import { addMemory } from "@/app/actions";
import { getPrimaryTrip } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const trip = await getPrimaryTrip();
  return (
    <>
      <StudioHero
        label="Memories"
        title="Turn the finished trip into a useful journal."
        description="Save favorite moments, restaurants, hidden gems, photos, final summary, and what you would change next time."
      >
        <StudioStat label="Saved memories" value={`${trip?.memories.length ?? 0}`} tone="emerald" />
      </StudioHero>
      <StudioGrid>
        <div className="space-y-5">
          <StudioPanel title="Trip journal" eyebrow="After the trip">
            <form action={addMemory} className="grid gap-4">
              <Input name="title" placeholder="Journal title" />
              <Input name="rating" placeholder="Rating 1-5" type="number" min="1" max="5" />
              <Textarea name="favoriteMoments" placeholder="Favorite moments" />
              <Textarea name="placesVisited" placeholder="Places visited" />
              <Textarea name="favoriteRestaurants" placeholder="Favorite restaurants" />
              <Textarea name="favoriteHiddenGems" placeholder="Favorite hidden gems" />
              <Textarea name="placesToRevisit" placeholder="Places to revisit" />
              <Textarea name="nextTime" placeholder="What I would do differently next time" />
              <Textarea name="notes" placeholder="Final trip notes" />
              <Input name="photosPlaceholder" placeholder="Photos folder or album link" />
              <label className="grid gap-2 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-300">
                <span className="flex items-center gap-2"><Camera size={18} /> Upload one favorite photo</span>
                <input name="photo" type="file" accept="image/*" className="text-sm font-medium file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#17243a] file:px-4 file:py-2 file:font-semibold file:text-slate-100" />
              </label>
              <Button><Heart /> Save memory</Button>
            </form>
          </StudioPanel>
        </div>
        <StudioRail>
          <MemorySummaryCard />
          {trip?.memories.map((memory) => (
            <Card key={memory.id}>
              <CardHeader><CardTitle>{memory.title}</CardTitle></CardHeader>
              <CardContent className="text-sm leading-6 text-slate-600">
                {memory.rating ? <p>Rating: {memory.rating}/5</p> : null}
                {memory.favoriteMoments ? <p>{memory.favoriteMoments}</p> : null}
                {memory.notes ? <p>{memory.notes}</p> : null}
                {memory.photosPlaceholder ? (
                  <Link href={memory.photosPlaceholder} className="mt-2 inline-flex font-semibold text-sky-200" target={memory.photosPlaceholder.startsWith("http") ? "_blank" : undefined}>
                    Open photo or album
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </StudioRail>
      </StudioGrid>
    </>
  );
}

```

## `src/app/profile/page.tsx`

```tsx
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StudioHero, StudioPanel } from "@/components/travel/studio";
import { saveProfile } from "@/app/actions";
import { getTravelProfile } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getTravelProfile();
  return (
    <>
      <StudioHero
        label="Preferences"
        title="Teach the planner your travel taste."
        description="Save the preferences that should influence destination ideas, hidden-gem ranking, itinerary generation, packing lists, and trip summaries."
      />
      <StudioPanel title="Travel profile" eyebrow="Personal defaults">
        <form action={saveProfile}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Preferred hotel type"><Input name="preferredHotelType" defaultValue={profile?.preferredHotelType ?? ""} placeholder="Boutique, resort, apartment, ryokan..." /></Field>
            <Field label="Travel pace"><Select name="travelPace" defaultValue={profile?.travelPace ?? "medium"}><option>slow</option><option>medium</option><option>packed</option></Select></Field>
            <Field label="Food preferences"><Input name="foodPreferences" defaultValue={profile?.foodPreferences ?? ""} placeholder="Seafood, street food, vegetarian, fine dining..." /></Field>
            <Field label="Budget style"><Select name="budgetStyle" defaultValue={profile?.budgetStyle ?? "balanced"}><option>budget</option><option>balanced</option><option>comfort</option><option>luxury</option></Select></Field>
            <Field label="Favorite activities"><Input name="favoriteActivities" defaultValue={profile?.favoriteActivities ?? ""} placeholder="Museums, beaches, hiking, local markets..." /></Field>
            <Field label="Things to avoid"><Input name="thingsToAvoid" defaultValue={profile?.thingsToAvoid ?? ""} placeholder="Crowds, nightlife, long drives..." /></Field>
            <Field label="Home airport"><Input name="homeAirport" defaultValue={profile?.homeAirport ?? ""} placeholder="DXB" /></Field>
            <Field label="Passport nationality optional"><Input name="passportNationality" defaultValue={profile?.passportNationality ?? ""} placeholder="Optional" /></Field>
            <Field label="Preferred travel months"><Input name="preferredTravelMonths" defaultValue={profile?.preferredTravelMonths ?? ""} placeholder="March, April, October..." /></Field>
            <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
              <input name="hiddenGemInterest" type="checkbox" defaultChecked={profile?.hiddenGemInterest ?? true} />
              Prioritize hidden gems
            </label>
            <Field label="Notes for future trips" className="md:col-span-2"><Textarea name="notes" defaultValue={profile?.notes ?? ""} placeholder="Anything the AI should remember when planning." /></Field>
            <div className="md:col-span-2"><Button><Save /> Save preferences</Button></div>
          </div>
        </form>
      </StudioPanel>
    </>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`flex flex-col gap-2 text-sm font-semibold text-slate-700 ${className ?? ""}`}>{label}{children}</label>;
}

```

## `src/app/today/page.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { NearbyIdeasCard } from "@/components/travel/nearby-ideas-card";
import { StudioGrid, StudioHero, StudioPanel, StudioRail } from "@/components/travel/studio";
import { TodayWorkspace } from "@/components/travel/today-workspace";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip, toItineraryDays, toPlaceRecommendations } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const trip = await getPrimaryTrip();
  const days = trip ? toItineraryDays(trip) : [];
  const places = trip ? toPlaceRecommendations(trip) : [];
  const bookings = trip
    ? trip.bookings.map((booking) => ({
        title: booking.title,
        date: booking.startAt?.toISOString().slice(0, 10),
      }))
    : [];
  const today = days[0];
  const weatherDestination = [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(weatherDestination);

  return (
    <>
      <StudioHero
        label="Today"
        title="A travel-day view with only what matters."
        description="Check the current plan, weather, nearby ideas, bookings, expenses, emergency info, and AI adjustments without overwriting the itinerary."
      />
      <StudioGrid>
        <div className="space-y-5">
          <Card className="premium-glow text-white">
            <CardHeader><CardTitle className="text-white">{today?.theme ?? "No itinerary for today yet"}</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <TodayBlock title="Morning" text={today?.morningPlan ?? "Generate an itinerary first."} />
              <TodayBlock title="Afternoon" text={today?.afternoonPlan ?? "Generate an itinerary first."} />
              <TodayBlock title="Evening" text={today?.eveningPlan ?? "Generate an itinerary first."} />
            </CardContent>
          </Card>
          {today ? <TodayWorkspace today={today} places={places.slice(0, 8)} /> : null}
        </div>
        <StudioRail>
          <StudioPanel title="Weather">
            <div className="text-sm leading-6 text-slate-400">
              <p className="font-semibold text-slate-950">{weather.summary}</p>
              <p>{weather.temperatureRange} · rain risk: {weather.rainRisk}</p>
              <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{weather.source.provider}</p>
            </div>
          </StudioPanel>
          <StudioPanel title="Nearby ideas">
            <NearbyIdeasCard places={places.slice(0, 4)} />
          </StudioPanel>
          <StudioPanel title="Important bookings">
            <div className="text-sm leading-6 text-slate-400">
            {bookings[0]?.title ?? "No booking added yet"}<br />
            {bookings[0]?.date ?? "Add dates in Bookings"}
            </div>
          </StudioPanel>
          <StudioPanel title="Quick expense">
            <Link href="/budget">
              <Button variant="outline">Add expense</Button>
            </Link>
          </StudioPanel>
          <StudioPanel title="Emergency info">
            <p className="text-sm leading-6 text-slate-400">Embassy, insurance, contacts, and local emergency numbers live in Documents.</p>
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

function TodayBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[8px] bg-white/[0.07] p-4"><p className="font-bold">{title}</p><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div>;
}

```

## `src/app/trips/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StudioGrid, StudioHero, StudioPanel, StudioRail, StudioListItem } from "@/components/travel/studio";
import { createTrip } from "@/app/actions";

const interests = ["food", "beaches", "nature", "museums", "shopping", "nightlife", "history", "photography", "hidden gems"];

export default function TripsPage() {
  const [destinationMode, setDestinationMode] = useState<"known" | "recommend">("known");
  return (
    <>
      <StudioHero
        label="Trips"
        title="Start with the shape of the trip, then let the planner explore."
        description="Enter what you know, or ask the destination engine to recommend a destination from your dates, budget, style, and interests."
      />
      <StudioGrid>
        <StudioPanel title="Trip details" eyebrow="Create or update">
          <form action={createTrip}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Trip name"><Input name="name" placeholder="Summer city break" /></Field>
            <input type="hidden" name="destinationMode" value={destinationMode} />
            <Field label="Destination mode">
              <Select value={destinationMode} onChange={(event) => setDestinationMode(event.target.value as "known" | "recommend")}>
                <option value="known">I know where I want to go</option>
                <option value="recommend">Recommend a destination for me</option>
              </Select>
            </Field>
            <Field label="Destination"><Input name="destination" disabled={destinationMode === "recommend"} placeholder="Lisbon, Kyoto, Bali..." /></Field>
            <Field label="Destination country"><Input name="destinationCountry" /></Field>
            <Field label="Departure city"><Input name="departureCity" placeholder="Dubai" /></Field>
            <Field label="Start date"><Input name="startDate" type="date" /></Field>
            <Field label="End date"><Input name="endDate" type="date" /></Field>
            <Field label="Travelers"><Input name="travelerCount" type="number" defaultValue={1} /></Field>
            <Field label="Budget"><Input name="budget" type="number" /></Field>
            <Field label="Travel style">
              <Select name="travelStyle" defaultValue="balanced">
                {["relaxed", "balanced", "adventure", "luxury", "family", "romantic", "cultural"].map((style) => <option key={style}>{style}</option>)}
              </Select>
            </Field>
            <Field label="Preferred pace">
              <Select name="pace" defaultValue="medium">
                {["slow", "medium", "packed"].map((pace) => <option key={pace}>{pace}</option>)}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-semibold text-slate-700">Interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <label
                    key={interest}
                    className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#32435d] bg-[#111f34] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/50 hover:bg-sky-400/10"
                  >
                    <input
                      name="interests"
                      value={interest}
                      type="checkbox"
                      className="size-4 rounded border border-slate-400 bg-[#050914] accent-sky-300"
                    />
                    {interest}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Notes or special requests" className="md:col-span-2"><Textarea name="notes" /></Field>
            <div className="md:col-span-2">
              <Button>
                <WandSparkles />
                Save and generate ideas
              </Button>
            </div>
          </div>
          </form>
        </StudioPanel>
        <StudioRail>
          <StudioPanel title="What happens next">
            <div className="grid gap-3">
              <StudioListItem title="Trip is saved locally" text="Your private planner stores the trip in SQLite." />
              <StudioListItem title="Destination ideas refresh" text="OpenAI ranks ideas against your profile and trip constraints." />
              <StudioListItem title="Places are loaded" text="Google Places fills Discover when the destination is known." />
            </div>
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`flex flex-col gap-2 text-sm font-semibold text-slate-700 ${className ?? ""}`}>{label}{children}</label>;
}

```

## `src/components/travel/activity-section.tsx`

```tsx
import { Clock, ExternalLink, Star, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchActivities, type ActivityResult } from "@/lib/api/activitiesService";
import { getExternalSearchLinks, getExternalSearchSummary, type TravelSearchContext } from "@/lib/travel/externalSearchLinks";
import { cn, formatCurrency } from "@/lib/utils";

type ActivitySectionProps = {
  trip: TravelSearchContext | null;
};

export async function ActivitySection({ trip }: ActivitySectionProps) {
  const summary = getExternalSearchSummary(trip);
  const getYourGuideLink = getExternalSearchLinks(trip).find((link) => link.id === "getyourguide-activities");
  let activities: ActivityResult[] = [];
  let error = "";

  try {
    activities = await searchActivities({
      destination: summary.destination,
      startDate: typeof trip?.startDate === "string" ? trip.startDate : trip?.startDate?.toISOString().slice(0, 10),
      endDate: typeof trip?.endDate === "string" ? trip.endDate : trip?.endDate?.toISOString().slice(0, 10),
      currency: "USD",
      limit: 6,
    });
  } catch (activityError) {
    error = activityError instanceof Error ? activityError.message : "GetYourGuide activities could not be loaded.";
  }

  const hasLiveActivities = activities.length > 0;

  return (
    <Card className="mt-6">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="text-sky-700" />
            Tours & activities
          </CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            GetYourGuide ideas scoped to {summary.destination}. Use this for tours, tickets, day trips, and guided activities.
          </p>
        </div>
        <Badge variant={hasLiveActivities ? "live" : "blue"}>{hasLiveActivities ? "Live" : "Shortcut"}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error ? (
          <div className="rounded-[8px] bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-200">
            {error} The external GetYourGuide search still works below.
          </div>
        ) : null}

        {hasLiveActivities ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard key={activity.id ?? activity.title} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] bg-slate-50 p-5 ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-950">Search GetYourGuide for {summary.destination}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Live Partner API tours need approved GetYourGuide access. Until then, this opens a destination-specific GetYourGuide search using your trip details.
            </p>
          </div>
        )}

        {getYourGuideLink ? (
          <a className={cn(buttonVariants({ variant: "secondary" }), "justify-self-start")} href={getYourGuideLink.href} target="_blank" rel="noreferrer">
            {hasLiveActivities ? "Open more tours" : getYourGuideLink.label}
            <ExternalLink size={16} />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: ActivityResult }) {
  return (
    <article className="flex min-h-64 flex-col justify-between rounded-[8px] bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:bg-sky-50">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950">{activity.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{activity.category}</p>
          </div>
          <Badge variant="live">GetYourGuide</Badge>
        </div>
        {activity.description ? (
          <p className="line-clamp-4 text-sm leading-6 text-slate-600">{activity.description}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <MiniMetric label="Price" value={activity.estimatedPrice ? formatCurrency(activity.estimatedPrice) : "Varies"} />
          <MiniMetric label="Duration" value={activity.duration} />
        </div>
        {activity.rating ? (
          <p className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-500">
            <Star size={14} className="fill-amber-300 text-amber-500" />
            {activity.rating.toFixed(1)}
            {activity.reviewCount ? ` · ${activity.reviewCount} reviews` : ""}
          </p>
        ) : null}
      </div>
      {activity.bookingLink ? (
        <a className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 w-full")} href={activity.bookingLink} target="_blank" rel="noreferrer">
          <Clock size={15} />
          View tour
          <ExternalLink size={15} />
        </a>
      ) : null}
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white/5 p-2 ring-1 ring-slate-100">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

```

## `src/components/travel/app-shell.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Compass,
  CreditCard,
  Download,
  FileText,
  Heart,
  Home,
  LifeBuoy,
  Map,
  Plane,
  PlugZap,
  Plus,
  Search,
  Sparkles,
  SunMedium,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioChip } from "@/components/travel/studio";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/itinerary", label: "Itinerary", icon: CalendarDays },
  { href: "/map", label: "Map", icon: Map },
  { href: "/budget", label: "Budget", icon: CreditCard },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/imports", label: "Imports", icon: Download },
  { href: "/integrations", label: "Integrations", icon: PlugZap },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/today", label: "Today", icon: SunMedium },
  { href: "/memories", label: "Memories", icon: Heart },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen text-white">
      <div className="fixed inset-x-0 top-0 z-20 border-b border-slate-200/80 bg-[#07101f]/88 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-base font-bold">
            <span className="flex size-9 items-center justify-center rounded-[8px] border border-sky-300/35 bg-sky-400/14 text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
              <Sparkles />
            </span>
            Travel Guide
          </Link>
          <Link href="/trips" className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] bg-amber-300 px-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
            <Plus />
            Trip
          </Link>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] overflow-y-auto border-r border-[#24344f] bg-[#050914]/88 px-3 py-4 backdrop-blur-2xl md:block">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex size-11 items-center justify-center rounded-[8px] border border-sky-300/35 bg-sky-400/14 text-sky-200 shadow-[0_0_28px_rgba(56,189,248,0.24)]">
            <Sparkles />
          </span>
          <span>
            <span className="block text-lg font-black tracking-[-0.035em]">Travel Guide</span>
            <span className="text-xs font-medium text-slate-500">Personal vacation planner</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-white/[0.07] hover:text-slate-100",
                  active && "bg-sky-400/12 text-sky-100 shadow-[inset_3px_0_0_rgba(56,189,248,0.95),0_10px_30px_rgba(56,189,248,0.08)]",
                )}
              >
                <Icon className={cn("text-slate-500 transition group-hover:text-sky-200", active && "text-sky-200")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="premium-panel mt-6 rounded-[8px] p-4 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <LifeBuoy className="text-sky-200" />
            Next useful move
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Generate a fresh itinerary, then adjust each day without overwriting until you confirm.
          </p>
          <Link href="/itinerary">
            <Button className="mt-4 w-full" variant="warm" size="sm">
              Open itinerary
            </Button>
          </Link>
        </div>
      </aside>

      <main className="px-4 pb-28 pt-20 md:ml-[252px] md:px-5 md:py-4">
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-4 hidden items-center justify-between gap-4 md:flex">
            <div className="premium-panel-soft flex min-w-[290px] items-center gap-3 rounded-[8px] px-3 py-2">
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-[8px] bg-sky-400/12 text-sky-200">
                <Map />
              </span>
              <span>
                <span className="block text-sm font-black tracking-[-0.02em] text-white">Trip Studio</span>
                <span className="block text-xs font-semibold text-emerald-200">Private planning mode</span>
              </span>
            </div>
            <div className="premium-panel-soft flex w-full max-w-lg items-center gap-3 rounded-[8px] px-3 py-2 text-slate-500">
              <Search />
              <span className="text-sm">Search places, notes, bookings, documents</span>
              <StudioChip className="ml-auto px-2 py-0.5 text-[11px]">CMD K</StudioChip>
            </div>
            <Link href="/profile" className="premium-panel-soft flex items-center gap-3 rounded-[8px] px-3 py-2">
              <span className="flex size-9 items-center justify-center rounded-[8px] bg-amber-300 text-slate-950">
                <UserRound />
              </span>
              <span className="text-sm font-bold">Marwan</span>
            </Link>
          </div>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200/80 bg-[#07101f]/88 px-2 py-2 backdrop-blur md:hidden">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-1 rounded-[8px] py-1.5 text-[11px] font-semibold text-slate-500", active && "bg-sky-400/14 text-sky-100")}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

```

## `src/components/travel/copy-trip-search-details.tsx`

```tsx
"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyTripSearchDetails({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyDetails}>
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "Copied" : "Copy trip search details"}
    </Button>
  );
}

```

## `src/components/travel/destination-card.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { planDestination } from "@/app/actions";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency } from "@/lib/utils";
import type { DestinationRecommendation } from "@/lib/types/travel";

export function DestinationCard({ destination, compact = false }: { destination: DestinationRecommendation; compact?: boolean }) {
  return (
    <Card className={cn("flex h-full flex-col", compact && "bg-white/[0.04]")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{destination.name}</CardTitle>
            <p className="text-sm font-medium text-slate-500">{destination.country}</p>
          </div>
          <Badge variant={destination.source.isMock ? "mock" : "live"}>
            {destination.source.isMock ? "Not connected" : "Live"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn("flex flex-1 flex-col gap-4", compact && "gap-3")}>
        <p className="text-sm leading-6 text-slate-600">{destination.whyItMatches}</p>
        <div className={cn("grid gap-3 text-sm sm:grid-cols-2", compact && "hidden")}>
          <Info label="Est. cost" value={formatCurrency(destination.estimatedCost)} />
          <Info label="Trip length" value={destination.suggestedTripDuration} />
          <Info label="Weather" value={destination.weatherSummary} />
          <Info label="Flight" value={destination.flightEstimate} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Confidence</span>
            <span>{destination.confidenceScore}%</span>
          </div>
          <Progress value={destination.confidenceScore} />
        </div>
        <div className="flex flex-wrap gap-2">
          {destination.bestFor.map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className={compact ? "pt-0" : undefined}>
        <form action={planDestination} className="w-full">
          <input type="hidden" name="destinationId" value={destination.id} />
          <Button className="w-full" variant="secondary" type="submit">Plan this destination</Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 leading-5 text-slate-700">{value}</p>
    </div>
  );
}

```

## `src/components/travel/external-search-links.tsx`

```tsx
import { BedDouble, ExternalLink, Plane, Search, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CopyTripSearchDetails } from "@/components/travel/copy-trip-search-details";
import { cn } from "@/lib/utils";
import { getExternalSearchLinks, getExternalSearchSummary, type TravelSearchContext } from "@/lib/travel/externalSearchLinks";

type ExternalSearchLinksProps = {
  trip: TravelSearchContext | null;
  compact?: boolean;
};

export function ExternalSearchLinks({ trip, compact = false }: ExternalSearchLinksProps) {
  const links = getExternalSearchLinks(trip);
  const summary = getExternalSearchSummary(trip);
  const hasTripDestination = Boolean(trip?.destination || trip?.destinationCountry);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Travel search shortcuts
          </CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Search outside the app, then import the real confirmation from Gmail.
          </p>
        </div>
        <CopyTripSearchDetails text={summary.text} />
      </CardHeader>
      <CardContent className="grid gap-4">
        {!hasTripDestination ? (
          <div className="rounded-[8px] bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-200">
            Create a trip with a destination to make these shortcuts precise. For now they open generic provider searches.
          </div>
        ) : null}
        <div className={cn("grid gap-3", compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4")}>
        {links.map((link) => (
          <article key={link.id} className="flex min-h-48 flex-col justify-between rounded-[8px] bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:bg-sky-50">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-[8px] bg-white/5 text-slate-900 ring-1 ring-slate-100">
                  {link.category === "Flights" ? <Plane size={18} /> : link.category === "Hotels" ? <BedDouble size={18} /> : <Ticket size={18} />}
                </span>
                <Badge variant={link.category === "Flights" || link.category === "Activities" ? "blue" : "secondary"}>{link.category}</Badge>
              </div>
              <p className="text-sm font-bold text-slate-950">{link.provider}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{link.note}</p>
            </div>
            <a className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 w-full")} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
              <ExternalLink size={15} />
            </a>
          </article>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}

```

## `src/components/travel/import-workspace.tsx`

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardPaste, Download, Link2, LogOut, Mail, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { ParsedTravelEmail } from "@/lib/imports/travelEmailParser";

type GmailStatus = {
  connected: boolean;
  configured: boolean;
  provider: "gmail";
  email?: string;
  message: string;
  searchQuery: string;
  connectUrl?: string;
};

export function ImportWorkspace() {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [gmailQuery, setGmailQuery] = useState("");
  const [parsed, setParsed] = useState<ParsedTravelEmail[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const selectedImports = useMemo(() => parsed.filter((item, index) => selected[itemKey(item, index)]), [parsed, selected]);

  useEffect(() => {
    refreshStatus();
  }, []);

  async function refreshStatus() {
    fetch("/api/imports/preview").then((response) => response.json()).then((nextStatus: GmailStatus) => {
      setStatus(nextStatus);
      setGmailQuery((current) => current || nextStatus.searchQuery);
    }).catch(() => {
      setStatus({ connected: false, configured: false, provider: "gmail", message: "Could not read Gmail import status.", searchQuery: "" });
    });
  }

  async function previewEmail() {
    setMessage("Parsing confirmation email...");
    const response = await fetch("/api/imports/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, subject, body }),
    });
    const result = await response.json();
    const next = result.data ?? [];
    setParsed(next);
    setSelected(Object.fromEntries(next.map((item: ParsedTravelEmail, index: number) => [itemKey(item, index), true])));
    setMessage(next.length ? "Review the parsed booking before importing." : "No booking details found. Paste the full confirmation email.");
  }

  async function scanGmail() {
    setMessage("Scanning Gmail for Booking.com and Expedia confirmations...");
    const response = await fetch("/api/imports/gmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gmailQuery, maxResults: 10 }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.message ?? "Could not scan Gmail.");
      return;
    }

    const next = result.data ?? [];
    setParsed(next);
    setSelected(Object.fromEntries(next.map((item: ParsedTravelEmail, index: number) => [itemKey(item, index), true])));
    setMessage(next.length ? `Scanned ${result.scanned} email${result.scanned === 1 ? "" : "s"}. Review before importing.` : "Gmail scan finished, but no importable confirmations were found.");
  }

  async function disconnectGmail() {
    setMessage("Disconnecting Gmail...");
    const response = await fetch("/api/gmail/disconnect", { method: "POST" });
    if (response.ok) {
      await refreshStatus();
      setMessage("Gmail disconnected. Existing imported bookings stay in your trip.");
      return;
    }
    setMessage("Could not disconnect Gmail.");
  }

  async function saveSelected() {
    setMessage("Importing selected bookings...");
    const response = await fetch("/api/imports/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imports: selectedImports }),
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const importedText = `Imported ${result.count} booking${result.count === 1 ? "" : "s"} into Bookings and Documents.`;
    const skippedText = result.skipped ? ` Skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}.` : "";
    setMessage(`${importedText}${skippedText}`);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle><Mail /> Gmail travel import</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-[8px] bg-slate-50 p-4 text-sm leading-6 text-slate-400">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-bold text-slate-950">Gmail connection</span>
              <Badge variant={status?.connected ? "live" : undefined}>{status?.connected ? "Connected" : "Manual import"}</Badge>
            </div>
            <p>{status?.message ?? "Checking Gmail status..."}</p>
            {status?.email ? <p className="mt-2 text-xs font-bold text-slate-500">{status.email}</p> : null}
          </div>

          <div className="grid gap-3 rounded-[8px] bg-white/5 p-4 ring-1 ring-slate-100">
            <div className="flex flex-wrap gap-3">
              {status?.connected ? (
                <>
                  <Button type="button" onClick={scanGmail}>
                    <Search />
                    Scan Gmail
                  </Button>
                  <Button type="button" variant="outline" onClick={disconnectGmail}>
                    <LogOut />
                    Disconnect
                  </Button>
                </>
              ) : status?.configured && status.connectUrl ? (
                <a className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-sky-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-sky-300" href={status.connectUrl}>
                  <Link2 size={18} />
                  Connect Gmail
                </a>
              ) : (
                <Button type="button" variant="outline" disabled>
                  <Link2 />
                  Add Gmail OAuth keys first
                </Button>
              )}
            </div>
            <Input value={gmailQuery} onChange={(event) => setGmailQuery(event.target.value)} placeholder="Gmail search query" />
            <p className="text-xs leading-5 text-slate-500">
              Gmail scans are read-only. The app previews matches first, then imports only the selected bookings.
            </p>
          </div>

          <Input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="From, e.g. noreply@booking.com" />
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject, e.g. Your Booking.com confirmation" />
          <Textarea className="min-h-72" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Paste the full Expedia or Booking.com confirmation email here." />
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={previewEmail}>
              <ClipboardPaste />
              Preview import
            </Button>
            <Button type="button" variant="outline" onClick={saveSelected} disabled={!selectedImports.length}>
              <Download />
              Import selected
            </Button>
          </div>
          {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle><Search /> Preview found bookings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {parsed.map((item, index) => {
              const key = itemKey(item, index);
              return (
                <label key={key} className="grid cursor-pointer gap-3 rounded-[8px] bg-white/5 p-4 ring-1 ring-slate-100 transition hover:bg-sky-400/10">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-base font-bold text-slate-950">{item.title}</span>
                      <span className="mt-1 block text-sm text-slate-500">{item.provider} · {item.bookingType} · {item.confidenceScore}% confidence</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[key])}
                      onChange={(event) => setSelected((current) => ({ ...current, [key]: event.target.checked }))}
                    />
                  </span>
                  <span className="grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
                    <Info label="Confirmation" value={item.confirmationNumber ?? "Not found"} />
                    <Info label="Import ID" value={item.importFingerprint ? item.importFingerprint.slice(0, 34) : "Generated on import"} />
                    <Info label="Dates" value={[item.startDate, item.endDate].filter(Boolean).join(" to ") || "Not found"} />
                    <Info label="Address" value={item.address ?? "Not found"} />
                    <Info label="Price" value={item.price ?? "Not found"} />
                  </span>
                  {selected[key] ? <span className="flex items-center gap-2 text-xs font-bold text-emerald-700"><Check size={14} /> Ready to import</span> : null}
                </label>
              );
            })}
            {!parsed.length ? (
              <div className="rounded-[8px] bg-slate-50 p-5 text-sm leading-6 text-slate-400">
                Paste a real confirmation email, click Preview, then choose what to import. Imported bookings are saved to both Bookings and Documents.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-[8px] bg-slate-50 p-3">
      <span className="block text-xs font-bold uppercase text-slate-400">{label}</span>
      <span className="mt-1 block font-semibold text-slate-700">{value}</span>
    </span>
  );
}

function itemKey(item: ParsedTravelEmail, index: number) {
  return `${index}-${item.provider}-${item.bookingType}-${item.title}-${item.confirmationNumber ?? item.sourceSubject ?? ""}`;
}

```

## `src/components/travel/interactive-map.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Clock3, Eye, EyeOff, MapPin, Milestone, Minus, Navigation, Plus, RotateCcw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance, formatDuration, type MapPin as RoutePin, type MapRoute } from "@/lib/api/mapsService";

type InteractiveMapProps = {
  route: MapRoute;
  mapImageBaseUrl: string | null;
};

type LayerKey = "recommended" | "restaurants" | "hiddenGems" | "route";

const layerLabels: Record<LayerKey, string> = {
  recommended: "Recommended places",
  restaurants: "Restaurants and cafes",
  hiddenGems: "Hidden gems",
  route: "Daily route",
};

export function InteractiveMap({ route, mapImageBaseUrl }: InteractiveMapProps) {
  const [selectedPinId, setSelectedPinId] = useState(route.pins[0]?.id ?? "");
  const [zoom, setZoom] = useState(route.zoom);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    recommended: true,
    restaurants: true,
    hiddenGems: true,
    route: true,
  });

  const visiblePins = useMemo(() => route.pins.filter((pin) => isPinVisible(pin, layers)), [route.pins, layers]);
  const selectedPin = visiblePins.find((pin) => pin.id === selectedPinId) ?? visiblePins[0] ?? null;
  const visibleRoute = useMemo(() => ({ ...route, zoom }), [route, zoom]);
  const mapImageUrl = mapImageBaseUrl ? `${mapImageBaseUrl}&zoom=${zoom}` : null;
  const positions = useMemo(() => projectPins(visiblePins, visibleRoute), [visiblePins, visibleRoute]);
  const routePositions = useMemo(() => projectPins(route.routePins.filter((pin) => visiblePins.some((visible) => visible.id === pin.id)), visibleRoute), [route, visiblePins, visibleRoute]);

  function toggleLayer(layer: LayerKey) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
      <Card className="overflow-hidden premium-glow">
        <div className="relative min-h-[540px] overflow-hidden bg-[#071626]">
          {mapImageUrl ? (
            <Image
              src={mapImageUrl}
              alt="Google map for the active trip"
              fill
              loading="eager"
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(90deg, rgba(125,211,252,.12) 1px, transparent 1px), linear-gradient(rgba(125,211,252,.12) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          )}

          {layers.route && routePositions.length > 1 ? (
            <svg className="pointer-events-none absolute inset-0 z-10 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={routePositions.map((item) => `${item.left},${item.top}`).join(" ")}
                fill="none"
                stroke="#7dd3fc"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="0.7"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}

          {positions.map(({ pin, left, top }, index) => (
            <button
              key={pin.id}
              type="button"
              aria-label={`Select ${pin.label}`}
              onClick={() => setSelectedPinId(pin.id)}
              className={`absolute z-20 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold shadow-lg ring-2 ring-white transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-sky-300 ${
                selectedPin?.id === pin.id ? "bg-sky-300 text-slate-950" : "bg-[#050914] text-white"
              }`}
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {String.fromCharCode(65 + index)}
            </button>
          ))}

          <div className="absolute right-5 top-5 z-30 flex flex-col gap-2 rounded-[8px] border border-slate-200 bg-[#07101f]/88 p-2 shadow-sm backdrop-blur">
            <Button type="button" size="icon" variant="ghost" title="Zoom in" onClick={() => setZoom((current) => Math.min(18, current + 1))}>
              <Plus size={18} />
            </Button>
            <div className="px-2 text-center text-xs font-bold text-slate-500">{zoom}</div>
            <Button type="button" size="icon" variant="ghost" title="Zoom out" onClick={() => setZoom((current) => Math.max(3, current - 1))}>
              <Minus size={18} />
            </Button>
            <Button type="button" size="icon" variant="ghost" title="Reset zoom" onClick={() => setZoom(route.zoom)}>
              <RotateCcw size={17} />
            </Button>
          </div>

          <div className="absolute bottom-5 left-5 right-5 z-30 grid gap-3 md:grid-cols-[1fr_300px]">
            <div className="rounded-[8px] border border-slate-200 bg-[#07101f]/88 p-4 shadow-sm backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Navigation />
                {route.provider === "google-maps" ? "Live Google map" : "Map not connected"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{layers.route ? route.routeNote : "Daily route layer is off. Pins remain selectable."}</p>
            </div>
            {selectedPin ? (
              <div className="rounded-[8px] border border-slate-200 bg-[#07101f]/92 p-4 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{selectedPin.label}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <MapPin />
                      {selectedPin.location}
                    </p>
                  </div>
                  <Badge variant={selectedPin.isHiddenGem ? "blue" : undefined}>{selectedPin.isHiddenGem ? "Hidden gem" : selectedPin.category}</Badge>
                </div>
                <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => window.open(googleMapsUrl(selectedPin), "_blank", "noopener,noreferrer")}>
                  <Star />
                  Open in Google Maps
                </Button>
              </div>
            ) : (
              <div className="rounded-[8px] border border-slate-200 bg-[#07101f]/92 p-4 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur">Turn on a layer to show pins.</div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardHeader><CardTitle>Route summary</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <SummaryRow icon={MapPin} label="Visible pins" value={`${visiblePins.length} places`} />
            <SummaryRow icon={Milestone} label="Route distance" value={layers.route ? formatDistance(route.distanceMeters) : "Layer off"} />
            <SummaryRow icon={Clock3} label="Route duration" value={layers.route ? formatDuration(route.duration) : "Layer off"} />
            <div className="rounded-[8px] bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              Route estimates now use a nearby cluster of up to six pins, not every result across the whole country.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Map layers</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(Object.keys(layerLabels) as LayerKey[]).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => toggleLayer(layer)}
                className="flex items-center justify-between rounded-[8px] bg-slate-50 p-3 text-left transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  {layers[layer] ? <Eye /> : <EyeOff />}
                  {layerLabels[layer]}
                </span>
                <Badge variant={layers[layer] ? "blue" : undefined}>{layers[layer] ? "On" : "Off"}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Visible pins</CardTitle></CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {visiblePins.slice(0, 18).map((pin, index) => (
                <button
                  type="button"
                  key={pin.id}
                  onClick={() => setSelectedPinId(pin.id)}
                  className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 p-3 text-left transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <span className="text-sm font-semibold text-slate-700">{String.fromCharCode(65 + index)}. {pin.label}</span>
                  <Badge>{pin.category}</Badge>
                </button>
              ))}
              {!visiblePins.length ? <p className="rounded-[8px] bg-slate-50 p-3 text-sm font-semibold text-slate-600">No pins visible with the current layers.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[8px] bg-slate-50 p-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Icon /> {label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

function isPinVisible(pin: RoutePin, layers: Record<LayerKey, boolean>) {
  const isRestaurant = /restaurant|cafe|bar|food|bakery/i.test(pin.category);
  if (pin.isHiddenGem) return layers.hiddenGems;
  if (isRestaurant) return layers.restaurants;
  return layers.recommended;
}

function projectPins(pins: RoutePin[], route: MapRoute) {
  return pins.slice(0, 18).map((pin) => {
    const projected = projectMercator(pin, route.center, route.zoom);
    return { pin, ...projected };
  }).filter((item) => item.left >= -5 && item.left <= 105 && item.top >= -5 && item.top <= 105);
}

function projectMercator(pin: RoutePin, center: { lat: number; lng: number }, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const mapWidth = 920;
  const mapHeight = 540;
  const pinPoint = latLngToWorld(pin.lat, pin.lng);
  const centerPoint = latLngToWorld(center.lat, center.lng);
  const left = 50 + ((pinPoint.x - centerPoint.x) * scale / mapWidth) * 100;
  const top = 50 + ((pinPoint.y - centerPoint.y) * scale / mapHeight) * 100;
  return { left, top };
}

function latLngToWorld(lat: number, lng: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: (lng + 180) / 360,
    y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI),
  };
}

function googleMapsUrl(pin: RoutePin) {
  const query = encodeURIComponent(`${pin.label} ${pin.lat},${pin.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

```

## `src/components/travel/itinerary-day-card.tsx`

```tsx
"use client";

import { useState } from "react";
import { Calendar, Check, Coins, Edit3, MapPin, RefreshCw, Trash2, Umbrella } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { ItineraryDay } from "@/lib/types/travel";

type ItineraryDayCardProps = {
  day: ItineraryDay;
  onChange?: (day: ItineraryDay) => void;
  onDelete?: () => void;
};

export function ItineraryDayCard({ day, onChange, onDelete }: ItineraryDayCardProps) {
  const [currentDay, setCurrentDay] = useState(day);
  const [draft, setDraft] = useState(day);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState("");
  const [suggestion, setSuggestion] = useState<ItineraryDay | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function saveDay(nextDay = draft) {
    setBusyAction("save");
    setStatus("Saving itinerary day...");
    const response = await fetch("/api/itinerary/day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextDay),
    });
    const result = await response.json();
    setBusyAction(null);
    if (!response.ok || !result.data) {
      setStatus(result.message ?? "Could not save this day.");
      return;
    }
    setCurrentDay(result.data);
    setDraft(result.data);
    setSuggestion(null);
    setEditMode(false);
    setStatus("Saved.");
    onChange?.(result.data);
  }

  async function adjustDay(label: string, instruction: string) {
    setBusyAction(label);
    setStatus(`Asking AI to ${label.toLowerCase()}...`);
    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: currentDay, instruction }),
    });
    const result = await response.json();
    setBusyAction(null);
    if (!response.ok || !result.data) {
      setStatus(result.raw ?? "AI could not adjust this day.");
      return;
    }
    setSuggestion({ ...currentDay, ...result.data, id: currentDay.id, date: currentDay.date });
    setStatus("Review the AI suggestion, then apply it if you like it.");
  }

  const visibleDay = editMode ? draft : currentDay;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Calendar />
              {new Date(visibleDay.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
            {editMode ? (
              <Input className="mt-2 text-lg font-bold" value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })} />
            ) : (
              <CardTitle className="mt-2">{visibleDay.theme}</CardTitle>
            )}
          </div>
          <Badge variant="blue">
            <Coins />
            Est. {formatCurrency(visibleDay.estimatedCost)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        {editMode ? (
          <>
            <EditBlock title="Morning" value={draft.morningPlan} onChange={(value) => setDraft({ ...draft, morningPlan: value })} />
            <EditBlock title="Afternoon" value={draft.afternoonPlan} onChange={(value) => setDraft({ ...draft, afternoonPlan: value })} />
            <EditBlock title="Evening" value={draft.eveningPlan} onChange={(value) => setDraft({ ...draft, eveningPlan: value })} />
            <div className="grid gap-3 rounded-[8px] bg-slate-50 p-4 lg:col-span-3 md:grid-cols-[1fr_1fr_150px]">
              <EditBlock title="Backup option" value={draft.backupOption} onChange={(value) => setDraft({ ...draft, backupOption: value })} />
              <EditBlock title="Transport notes" value={draft.transportNotes} onChange={(value) => setDraft({ ...draft, transportNotes: value })} />
              <label className="text-sm font-bold text-slate-950">
                Cost
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  value={draft.estimatedCost}
                  onChange={(event) => setDraft({ ...draft, estimatedCost: Number(event.target.value) })}
                />
              </label>
            </div>
          </>
        ) : (
          <>
            <PlanBlock title="Morning" text={visibleDay.morningPlan} />
            <PlanBlock title="Afternoon" text={visibleDay.afternoonPlan} />
            <PlanBlock title="Evening" text={visibleDay.eveningPlan} />
            <div className="rounded-[8px] bg-slate-50 p-4 lg:col-span-3">
              <p className="text-sm font-semibold text-slate-800">Backup and notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{visibleDay.backupOption}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{visibleDay.transportNotes}</p>
              {visibleDay.placesIncluded.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleDay.placesIncluded.map((place, index) => (
                    <Badge key={`${place}-${index}`} variant="secondary">
                      <MapPin size={13} />
                      {place}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Estimated daily cost</p>
              <p className="mt-1 text-sm font-bold text-sky-100">{formatCurrency(visibleDay.estimatedCost)}</p>
            </div>
          </>
        )}
        {suggestion ? (
          <div className="rounded-[8px] border border-sky-300/25 bg-sky-400/10 p-4 lg:col-span-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-950">AI suggestion</p>
                <p className="mt-1 text-sm text-slate-600">{suggestion.theme}</p>
              </div>
              <Button size="sm" onClick={() => saveDay(suggestion)} disabled={busyAction === "save"}>
                <Check />
                Apply suggestion
              </Button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <PlanBlock title="Morning" text={suggestion.morningPlan} />
              <PlanBlock title="Afternoon" text={suggestion.afternoonPlan} />
              <PlanBlock title="Evening" text={suggestion.eveningPlan} />
            </div>
          </div>
        ) : null}
        {status ? <p className="text-sm font-semibold text-slate-500 lg:col-span-3">{status}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap">
        {editMode ? (
          <>
            <Button variant="outline" size="sm" onClick={() => saveDay()} disabled={busyAction === "save"}>Save changes</Button>
            <Button variant="ghost" size="sm" onClick={() => { setDraft(currentDay); setEditMode(false); }}>Cancel</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            <Edit3 />
            Edit
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => adjustDay("Regenerate", "Regenerate this day with the same destination, interests, and budget. Keep it practical.")} disabled={Boolean(busyAction)}>
          <RefreshCw />
          Regenerate
        </Button>
        <Button variant="ghost" size="sm" onClick={() => adjustDay("More relaxed", "Make this day more relaxed with fewer moves and more breathing room.")} disabled={Boolean(busyAction)}>More relaxed</Button>
        <Button variant="ghost" size="sm" onClick={() => adjustDay("Cheaper", "Make this day cheaper with more free activities and lower-cost food.")} disabled={Boolean(busyAction)}>Cheaper</Button>
        <Button variant="ghost" size="sm" onClick={() => adjustDay("Rain plan", "Replace outdoor activities with indoor rainy-day alternatives.")} disabled={Boolean(busyAction)}>
          <Umbrella />
          Rain plan
        </Button>
        {onDelete ? (
          <Button variant="ghost" size="sm" className="text-rose-300 hover:bg-rose-400/10" onClick={onDelete} disabled={Boolean(busyAction)}>
            <Trash2 />
            Delete day
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function EditBlock({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-bold text-slate-950">
      {title}
      <Textarea className="mt-2 min-h-32" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PlanBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[8px] bg-white/5 p-4 ring-1 ring-slate-100">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

```

## `src/components/travel/itinerary-workspace.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItineraryDayCard } from "@/components/travel/itinerary-day-card";
import { StudioChip, StudioGrid, StudioHero, StudioPanel, StudioRail, StudioStat } from "@/components/travel/studio";
import { removeSelectedPlace } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";
import type { ItineraryDay, PlaceRecommendation } from "@/lib/types/travel";

export function ItineraryWorkspace({
  initialDays,
  selectedPlaces,
  shouldAutoGenerate,
}: {
  initialDays: ItineraryDay[];
  selectedPlaces: PlaceRecommendation[];
  shouldAutoGenerate: boolean;
}) {
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const hasSelectedPlaces = selectedPlaces.length > 0;
  const [status, setStatus] = useState(
    hasSelectedPlaces
      ? `${selectedPlaces.length} selected places are ready for itinerary generation.`
      : "No places selected. You can still generate an OpenAI itinerary from the recommended places for this trip.",
  );
  const autoGenerateStarted = useRef(false);
  const totalCost = days.reduce((sum, day) => sum + Math.max(0, day.estimatedCost), 0);

  const generate = useCallback(async () => {
    setStatus(hasSelectedPlaces ? "Generating itinerary from your selected Discover places..." : "Generating OpenAI itinerary from all recommended places...");
    const response = await fetch("/api/ai/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: true, selectedPlaceIds: selectedPlaces.map((place) => place.id) }),
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.message ?? "Could not generate the itinerary.");
      return;
    }
    setDays(result.data ?? initialDays);
    setStatus(result.isMock ? "OpenAI was unavailable, so the existing itinerary stayed in place." : "Generated with OpenAI and saved locally.");
  }, [hasSelectedPlaces, initialDays, selectedPlaces]);

  useEffect(() => {
    if (autoGenerateStarted.current || !shouldAutoGenerate) return;
    autoGenerateStarted.current = true;
    void generate();
  }, [generate, shouldAutoGenerate]);

  async function addDay() {
    setStatus("Adding a new itinerary day...");
    const response = await fetch("/api/itinerary/day", { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.data) {
      setStatus(result.message ?? "Could not add a day.");
      return;
    }
    setDays((current) => [...current, result.data]);
    setStatus("Added a new editable day.");
  }

  async function deleteDay(id: string) {
    setStatus("Deleting itinerary day...");
    const response = await fetch(`/api/itinerary/day?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setStatus(result.message ?? "Could not delete this day.");
      return;
    }
    setDays((current) => current.filter((day) => day.id !== id));
    setStatus("Deleted the itinerary day.");
  }

  return (
    <>
      <StudioHero
        label="Itinerary builder"
        title="Turn selected places into complete travel days."
        description="Generate from Discover selections, or let OpenAI create a complete itinerary from all recommendations when nothing is selected."
      >
        <div className="premium-panel-soft rounded-[8px] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Builder status</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{status}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StudioStat label="Days" value={`${days.length}`} />
            <StudioStat label="Est. cost" value={formatCurrency(totalCost)} tone="amber" />
          </div>
        </div>
      </StudioHero>

      <StudioGrid>
        <div className="space-y-5">
          <StudioPanel
            title={hasSelectedPlaces ? "Selected place basket" : "OpenAI generation"}
            eyebrow="Plan inputs"
            action={
              <div className="flex flex-wrap gap-2">
                <Button onClick={addDay} variant="outline">
                  <Plus />
                  Add day
                </Button>
                <Button onClick={generate}>
                  <Sparkles />
                  {hasSelectedPlaces ? "Generate from selected places" : "Generate with OpenAI"}
                </Button>
              </div>
            }
          >
            {hasSelectedPlaces ? (
              <div className="flex flex-wrap gap-2">
                {selectedPlaces.map((place) => (
                  <form key={place.id} action={removeSelectedPlace} className="inline-flex">
                    <input type="hidden" name="placeId" value={place.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-[8px] border border-sky-300/35 bg-sky-400/12 px-3 py-1.5 text-xs font-bold text-sky-100 transition hover:border-rose-300/45 hover:bg-rose-400/12 hover:text-rose-100"
                      title={`Remove ${place.name} from selected places`}
                    >
                      <MapPin size={13} />
                      {place.name}
                      <X size={13} aria-hidden="true" />
                      <span className="sr-only">Remove {place.name}</span>
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 text-sm leading-6 text-slate-400">
                <p>No Discover places are selected. You can still generate a full itinerary from all recommended places and your trip profile.</p>
                <Link className={buttonVariants({ variant: "outline", className: "justify-self-start" })} href="/discover">Choose places in Discover</Link>
              </div>
            )}
          </StudioPanel>

          {days.length ? (
            <section className="flex flex-col gap-5">
              {days.map((day) => (
                <ItineraryDayCard
                  key={day.id}
                  day={day}
                  onChange={(updatedDay) => setDays((current) => current.map((item) => item.id === updatedDay.id ? updatedDay : item))}
                  onDelete={() => deleteDay(day.id)}
                />
              ))}
            </section>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm font-semibold text-slate-400">No itinerary saved yet. Generate one with OpenAI or choose places in Discover.</CardContent>
            </Card>
          )}
        </div>

        <StudioRail>
          <StudioPanel title="Generation rules">
            <div className="grid gap-3 text-sm leading-6 text-slate-400">
              <p>Selected places are distributed across the trip instead of creating empty single-place days.</p>
              <p>Every generated day must include morning, afternoon, evening, restaurants, hidden gems, transport notes, backup options, and an estimated daily cost.</p>
              <p>You can remove selected places here or in Discover before generating again.</p>
            </div>
          </StudioPanel>
          <StudioPanel title="Cost summary">
            <div className="grid gap-3">
              <StudioChip tone="warm">Estimated trip plan: {formatCurrency(totalCost)}</StudioChip>
              <StudioChip>{days.length ? `${Math.round(totalCost / Math.max(1, days.length))} average per day` : "No days yet"}</StudioChip>
            </div>
          </StudioPanel>
        </StudioRail>
      </StudioGrid>
    </>
  );
}

```

## `src/components/travel/memory-summary-card.tsx`

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SummaryResult = {
  summary: string;
  revisit: string[];
  nextTime: string[];
};

export function MemorySummaryCard() {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [status, setStatus] = useState("Generate a final trip summary from saved journal notes.");

  async function generate() {
    setStatus("Generating trip summary...");
    try {
      const response = await fetch("/api/ai/summary");
      const result = await response.json();
      setSummary(result.data);
      setStatus(result.isMock ? "OpenAI was unavailable. Try again in a moment." : "Generated with OpenAI.");
    } catch {
      setSummary(null);
      setStatus("OpenAI was unavailable. Try again in a moment.");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle><Sparkles /> Final trip summary</CardTitle></CardHeader>
      <CardContent className="grid gap-4 text-sm leading-6 text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="font-bold text-slate-950">{status}</p>
          {summary ? <p className="mt-2">{summary.summary}</p> : null}
        </div>
        {summary?.revisit.length ? (
          <div>
            <p className="font-bold text-slate-950">Places to revisit</p>
            <p>{summary.revisit.join(", ")}</p>
          </div>
        ) : null}
        {summary?.nextTime.length ? (
          <div>
            <p className="font-bold text-slate-950">Next time</p>
            <p>{summary.nextTime.join(", ")}</p>
          </div>
        ) : null}
        <Button type="button" onClick={generate}><Sparkles /> Generate summary</Button>
      </CardContent>
    </Card>
  );
}

```

## `src/components/travel/nearby-ideas-card.tsx`

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlaceRecommendation } from "@/lib/types/travel";

export function NearbyIdeasCard({ places }: { places: PlaceRecommendation[] }) {
  const [selected, setSelected] = useState(places[0] ?? null);

  if (!places.length) {
    return <p className="rounded-[8px] bg-slate-50 p-3 font-semibold text-slate-600">Refresh places data in Discover.</p>;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {places.slice(0, 4).map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => setSelected(place)}
            className="rounded-[8px] bg-slate-50 p-3 text-left font-semibold text-slate-700 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <span className="flex items-center justify-between gap-3">
              <span>{place.name}</span>
              <Badge>{place.category}</Badge>
            </span>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="rounded-[8px] border border-sky-300/25 bg-sky-400/10 p-3">
          <p className="text-sm font-bold text-slate-950">{selected.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
            <MapPin />
            {selected.location}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{selected.whyRecommended}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <Star />
              {selected.rating?.toFixed(1) ?? "N/A"}
            </span>
            <Link href="/map">
              <Button size="sm" variant="secondary">View on map</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

```

## `src/components/travel/packing-list-card.tsx`

```tsx
"use client";

import { useState } from "react";
import { Backpack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PackingListCard() {
  const [items, setItems] = useState<string[]>([]);
  const [status, setStatus] = useState("Generate a weather-aware packing list when you need it.");

  async function generate() {
    setStatus("Generating packing list...");
    try {
      const response = await fetch("/api/ai/packing");
      const result = await response.json();
      setItems(Array.isArray(result.data) ? result.data : []);
      setStatus(result.isMock ? "OpenAI was unavailable. Try again in a moment." : `Generated with OpenAI using ${result.weather?.source?.provider ?? "weather"} context.`);
    } catch {
      setItems([]);
      setStatus("OpenAI was unavailable. Try again in a moment.");
    }
  }

  return (
    <Card className="mt-5">
      <CardHeader><CardTitle><Backpack /> AI packing list</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm leading-6 text-slate-600">{status}</p>
          <Button type="button" onClick={generate}>Generate packing list</Button>
        </div>
        {items.length ? (
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {items.map((item) => <div key={item} className="rounded-xl bg-slate-50 p-3 font-semibold">{item}</div>)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

```

## `src/components/travel/page-header.tsx`

```tsx
import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {badge ? <Badge variant="blue">{badge}</Badge> : null}
        <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-[0.95] tracking-[-0.04em] text-slate-950 md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
      </div>
    </div>
  );
}

```

## `src/components/travel/place-card.tsx`

```tsx
import { Check, MapPin, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { addPlaceToItinerary, removeSelectedPlace } from "@/app/actions";
import type { PlaceRecommendation } from "@/lib/types/travel";
import { cn } from "@/lib/utils";

export function PlaceCard({ place, selected = false }: { place: PlaceRecommendation; selected?: boolean }) {
  return (
    <Card className={cn("flex h-full flex-col transition duration-200 hover:-translate-y-1 hover:border-sky-300/30", selected && "border-sky-300/60 bg-sky-400/10 ring-2 ring-sky-300/20")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{place.name}</CardTitle>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin />
              {place.location}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {selected ? <Badge variant="blue">Selected</Badge> : null}
            {place.isHiddenGem ? <Badge variant="blue">Hidden gem</Badge> : <Badge>{place.category}</Badge>}
            <Badge variant={place.source.isMock ? "mock" : "live"}>{place.source.isMock ? "Not connected" : "Live"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm leading-6 text-slate-600">{place.description}</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Metric label="Rating" value={place.rating ? place.rating.toFixed(1) : "N/A"} />
          <Metric label="Cost" value={place.costLevel} />
          <Metric label="Gem" value={`${place.hiddenGemScore}`} />
        </div>
        <p className="rounded-[8px] bg-sky-50 p-3 text-sm leading-6 text-slate-700">{place.whyRecommended}</p>
      </CardContent>
      <CardFooter>
        <form action={selected ? removeSelectedPlace : addPlaceToItinerary} className="w-full">
          <input type="hidden" name="placeId" value={place.id} />
          <Button variant={selected ? "secondary" : "outline"} className="w-full" type="submit" title={selected ? "Remove this place from itinerary selection" : "Add this place to itinerary selection"}>
            {selected ? <X /> : <Plus />}
            {selected ? "Remove from plan" : "Add to plan"}
          </Button>
          {selected ? (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-sky-100">
              <Check size={13} />
              Selected in Discover
            </p>
          ) : null}
        </form>
      </CardFooter>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-slate-50 p-2 text-center">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

```

## `src/components/travel/studio.tsx`

```tsx
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StudioHero({
  label,
  title,
  description,
  children,
  className,
}: {
  label?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("premium-panel relative mb-6 overflow-hidden rounded-[8px] p-5 md:p-7", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.10),transparent_34%,rgba(54,211,138,0.045)_72%,transparent)] opacity-80" />
      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
        <div>
          {label ? <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-sky-200/80">{label}</p> : null}
          <h1 className="max-w-5xl text-[clamp(2.35rem,4.8vw,4.8rem)] font-black leading-[0.92] tracking-[-0.06em] text-white">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{description}</p>
        </div>
        {children ? <div className="relative">{children}</div> : null}
      </div>
    </section>
  );
}

export function StudioGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]", className)}>{children}</section>;
}

export function StudioRail({ children, className }: { children: React.ReactNode; className?: string }) {
  return <aside className={cn("space-y-5", className)}>{children}</aside>;
}

export function StudioPanel({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("premium-panel rounded-[8px] p-5", className)}>
      {title || action ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-200/70">{eyebrow}</p> : null}
            {title ? <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StudioStat({
  icon: Icon,
  label,
  value,
  tone = "cyan",
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  tone?: "cyan" | "amber" | "emerald" | "rose";
}) {
  const tones = {
    cyan: "bg-sky-400/12 text-sky-200",
    amber: "bg-amber-300/14 text-amber-200",
    emerald: "bg-emerald-400/14 text-emerald-200",
    rose: "bg-rose-400/14 text-rose-200",
  };
  return (
    <div className="premium-panel-soft rounded-[8px] p-4">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={cn("flex size-10 items-center justify-center rounded-[8px]", tones[tone])}>
            <Icon />
          </span>
        ) : null}
        <span>
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</span>
          <span className="mt-1 block text-xl font-black tracking-[-0.035em] text-white">{value}</span>
        </span>
      </div>
    </div>
  );
}

export function StudioAction({
  href,
  title,
  text,
  icon: Icon,
  active,
}: {
  href: string;
  title: string;
  text: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[132px] flex-col justify-between rounded-[8px] border border-[#22324b] bg-[#0d192d]/78 p-4 transition duration-200 hover:-translate-y-1 hover:border-sky-300/45 hover:bg-sky-400/10",
        active && "border-sky-300/55 bg-sky-400/12 shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_18px_52px_rgba(56,189,248,0.14)]",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-[8px] bg-sky-400/12 text-sky-200">
          <Icon />
        </span>
        <ArrowRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-200" />
      </span>
      <span>
        <span className="block text-base font-black tracking-[-0.025em] text-white">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-400">{text}</span>
      </span>
    </Link>
  );
}

export function StudioListItem({
  title,
  text,
  meta,
}: {
  title: string;
  text?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[8px] border border-[#1b2a42] bg-[#0d192d]/72 p-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-emerald-400/12 text-emerald-200">
        <CheckCircle2 />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{title}</span>
        {text ? <span className="mt-1 block text-sm leading-6 text-slate-400">{text}</span> : null}
        {meta}
      </span>
    </div>
  );
}

export function StudioChip({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "selected" | "warm" | "live";
  className?: string;
}) {
  const tones = {
    default: "border-[#30435e] bg-[#132238] text-slate-200",
    selected: "border-sky-300/50 bg-sky-400/14 text-sky-100 shadow-[0_0_22px_rgba(56,189,248,0.12)]",
    warm: "border-amber-200/35 bg-amber-300/12 text-amber-100",
    live: "border-emerald-300/35 bg-emerald-400/12 text-emerald-100",
  };
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-[8px] border px-3 py-1.5 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

```

## `src/components/travel/today-workspace.tsx`

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ItineraryDay, PlaceRecommendation } from "@/lib/types/travel";

const prompts = [
  "Make today more relaxed",
  "Suggest a restaurant nearby",
  "It is raining, adjust the day",
  "I am tired, shorten today’s plan",
  "Find a hidden gem near me",
  "Replace this activity with something indoors",
];

export function TodayWorkspace({ today, places }: { today: ItineraryDay; places: PlaceRecommendation[] }) {
  const [reply, setReply] = useState("AI suggestions will appear here and will not overwrite your itinerary unless you confirm manually.");
  const [customPrompt, setCustomPrompt] = useState("");

  async function ask(prompt: string) {
    setReply("Thinking through an adjustment...");
    const response = await fetch("/api/ai/adjust-day", {
      method: "POST",
      body: JSON.stringify({ day: today, places, instruction: prompt }),
    });
    const result = await response.json();
    setReply(result.suggestion ?? result.data?.notes ?? "Suggestion ready. Review before saving.");
  }

  return (
    <Card className="mt-5">
      <CardHeader><CardTitle><Sparkles /> Quick AI assistant</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => <Button key={prompt} variant="outline" size="sm" onClick={() => ask(prompt)}>{prompt}</Button>)}
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} placeholder="Ask for a change, nearby restaurant, indoor swap, or shorter day" />
          <Button onClick={() => ask(customPrompt || "Make today easier")}>Ask</Button>
        </div>
        <p className="rounded-[8px] bg-sky-50 p-4 text-sm leading-6 text-slate-700">{reply}</p>
      </CardContent>
    </Card>
  );
}

```

## `src/components/ui/badge.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-xs font-semibold tracking-[-0.01em]",
  {
    variants: {
      variant: {
        default: "border border-[#32435d] bg-[#17243a] text-[#d7e5f8]",
        secondary: "border border-[#32435d] bg-[#17243a] text-[#d7e5f8]",
        live: "border border-emerald-300/25 bg-emerald-400/14 text-emerald-200",
        mock: "border border-amber-300/25 bg-amber-300/14 text-amber-200",
        blue: "border border-sky-300/25 bg-sky-400/14 text-sky-100",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

```

## `src/components/ui/button.tsx`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sky-400 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.24)] hover:-translate-y-0.5 hover:bg-sky-300",
        secondary: "border border-sky-300/30 bg-sky-400/12 text-sky-100 hover:-translate-y-0.5 hover:bg-sky-400/20",
        outline: "border border-slate-200 bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-sky-400/10",
        ghost: "text-slate-300 hover:bg-white/[0.07] hover:text-white",
        warm: "bg-amber-300 text-slate-950 shadow-[0_0_24px_rgba(245,200,92,0.18)] hover:-translate-y-0.5 hover:bg-amber-200",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };

```

## `src/components/ui/card.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "premium-panel rounded-[8px] backdrop-blur-xl transition-colors duration-300",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold tracking-[-0.01em] text-slate-950", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />;
}

```

## `src/components/ui/input.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[8px] border border-slate-200 bg-white/5 px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-[8px] border border-slate-200 bg-white/5 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

```

## `src/components/ui/progress.tsx`

```tsx
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 shadow-[0_0_16px_rgba(56,189,248,0.45)] transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

```

## `src/components/ui/select.tsx`

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[8px] border border-slate-200 bg-white/5 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

```

## `src/lib/ai/openai.ts`

```ts
import OpenAI from "openai";
import type { DestinationRecommendation, ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";

const model = "gpt-5.5";

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function structuredJson<T>(prompt: string, fallback: T): Promise<{ data: T; isMock: boolean; raw: string }> {
  const client = getClient();
  if (!client) {
    return {
      data: fallback,
      isMock: true,
      raw: JSON.stringify(fallback),
    };
  }

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are a personal travel-planning assistant. Return concise, practical, structured JSON only. Mark any uncertain travel data as an estimate.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = response.output_text;
  try {
    return { data: JSON.parse(text) as T, isMock: false, raw: text };
  } catch {
    return { data: fallback, isMock: false, raw: text };
  }
}

export async function recommendDestinations(trip: TripDraft) {
  const selectedDestination = [trip.destination, trip.destinationCountry].filter(Boolean).join(", ");
  const scopeInstruction = selectedDestination
    ? `The user already selected this destination scope: "${selectedDestination}". Recommend 3 destination ideas, areas, neighborhoods, islands, day-trip bases, or nearby sub-regions ONLY inside or directly attached to that selected destination scope. Do not recommend other countries or unrelated destinations.`
    : "The user has not selected a destination. Recommend 3 diverse vacation destination alternatives from different countries or regions.";
  const result = await structuredJson<unknown>(
    `${scopeInstruction}

Return JSON matching this exact shape: [{ "name": string, "country": string, "whyItMatches": string, "bestThingsToDo": string[], "estimatedCost": number, "weatherSummary": string, "flightEstimate": string, "hotelEstimate": string, "pros": string[], "cons": string[], "bestFor": string[], "suggestedTripDuration": string, "confidenceScore": number }].

Important: If a destination scope is selected, every returned item must be related to that exact destination scope. Use estimates when live travel price data is unavailable.

Trip: ${JSON.stringify(trip)}`,
    [],
  );
  return {
    ...result,
    data: filterDestinationsByScope(normalizeDestinationRecommendations(result.data, [], result.isMock), trip),
  };
}

export async function recommendPlaces(trip: TripDraft) {
  return structuredJson<PlaceRecommendation[]>(
    `Recommend places, restaurants, neighborhoods, hidden gems, rainy-day options, and free activities as JSON. Trip: ${JSON.stringify(trip)}`,
    [],
  );
}

export async function recommendHiddenGems(trip: TripDraft) {
  return structuredJson<PlaceRecommendation[]>(
    `Recommend hidden gems only. Use a hiddenGemScore from 0-100 and explain local value. Trip: ${JSON.stringify(trip)}`,
    [],
  );
}

export async function generateFullItinerary(trip: TripDraft, savedPlaces: PlaceRecommendation[] = []) {
  const selectedPlaceNames = savedPlaces.map((place) => place.name);
  const result = await structuredJson<unknown>(
    `Generate a day-by-day itinerary as JSON. Use either a top-level array or { "itinerary": [...] }.
Return each day with this exact shape where possible: { "date": "YYYY-MM-DD", "theme": string, "morningPlan": string, "afternoonPlan": string, "eveningPlan": string, "restaurantIdeas": string[], "hiddenGem": string, "estimatedCost": number, "transportNotes": string, "backupOption": string, "notes": string, "placesIncluded": string[] }.
The estimatedCost must be a realistic numeric daily out-of-pocket estimate for all travelers in USD. Include meals, activities, local transport, and tours for that day. Do not return 0 unless the whole day is intentionally free and explicitly marked in notes.
The placesIncluded field must be a string array containing the exact names of selected places used that day.
Prioritize these selected place names and distribute them naturally across the trip: ${JSON.stringify(selectedPlaceNames)}.
Trip: ${JSON.stringify(trip)} Places: ${JSON.stringify(savedPlaces)}`,
    [],
  );
  return {
    ...result,
    data: normalizeItineraryDays(result.data, [], trip, savedPlaces),
  };
}

export async function regenerateOneDay(day: ItineraryDay, instruction: string) {
  return structuredJson<ItineraryDay>(
    `Regenerate this itinerary day as JSON. Instruction: ${instruction}. Day: ${JSON.stringify(day)}`,
    {
      ...day,
      notes: `${day.notes} Suggested adjustment: ${instruction}. Confirm before saving over the itinerary.`,
    },
  );
}

export async function suggestCheaperVersion(day: ItineraryDay) {
  return regenerateOneDay(day, "Make this day cheaper with more free activities and lower-cost restaurants.");
}

export async function suggestMoreRelaxedVersion(day: ItineraryDay) {
  return regenerateOneDay(day, "Make this day more relaxed with fewer moves and longer breaks.");
}

export async function suggestRainyDayAlternative(day: ItineraryDay) {
  return regenerateOneDay(day, "It is raining. Replace exposed outdoor activities with indoor or covered alternatives.");
}

export async function generatePackingList(trip: TripDraft) {
  return structuredJson<string[]>(
    `Generate a practical packing list as a JSON string array. Trip: ${JSON.stringify(trip)}`,
    ["Comfortable walking shoes", "Light jacket", "Portable charger", "Travel adapter", "Passport and insurance copies"],
  );
}

export async function generateTripSummary(notes: string) {
  const fallback = {
      summary: "A balanced trip with strong food, scenic walks, and a few slower neighborhood discoveries.",
      revisit: ["Campo de Ourique", "Sintra gardens"],
      nextTime: ["Book fewer fixed dinners", "Leave one fully open morning"],
    };
  const result = await structuredJson<unknown>(
    `Summarize this trip journal as JSON. Return exactly { "summary": string, "revisit": string[], "nextTime": string[] }. Notes: ${notes}`,
    fallback,
  );
  return {
    ...result,
    data: normalizeTripSummary(result.data, fallback),
  };
}

function normalizeItineraryDays(value: unknown, fallback: ItineraryDay[], trip?: TripDraft, places: PlaceRecommendation[] = []): ItineraryDay[] {
  const rawDays = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.itinerary)
      ? value.itinerary
      : isRecord(value) && Array.isArray(value.days)
        ? value.days
        : null;

  if (!rawDays) return fallback;

  const normalized = rawDays
    .map((day, index) => normalizeItineraryDay(day, index, trip, places))
    .filter((day): day is ItineraryDay => Boolean(day));

  return normalized.length ? normalized : fallback;
}

function normalizeTripSummary(value: unknown, fallback: { summary: string; revisit: string[]; nextTime: string[] }) {
  if (!isRecord(value)) return fallback;
  const summary =
    stringValue(value.summary) ||
    stringValue(value.trip_summary) ||
    stringValue(value.finalSummary) ||
    stringValue(value.note) ||
    fallback.summary;
  const revisit =
    stringArray(value.revisit).length ? stringArray(value.revisit) : stringArray(value.places_to_revisit ?? value.would_do_again);
  const nextTime =
    stringArray(value.nextTime).length ? stringArray(value.nextTime) : stringArray(value.next_time ?? value.lessons_learned ?? value.would_skip_next_time);

  return {
    summary,
    revisit,
    nextTime,
  };
}

function normalizeDestinationRecommendations(value: unknown, fallback: DestinationRecommendation[], isMock: boolean) {
  const rawDestinations = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.destinations)
      ? value.destinations
      : isRecord(value) && Array.isArray(value.recommendations)
        ? value.recommendations
        : null;

  if (!rawDestinations) return fallback;

  const normalized = rawDestinations
    .map((destination, index) => normalizeDestinationRecommendation(destination, index, isMock))
    .filter((destination): destination is DestinationRecommendation => Boolean(destination));

  return normalized.length ? normalized : fallback;
}

function normalizeDestinationRecommendation(value: unknown, index: number, isMock: boolean): DestinationRecommendation | null {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name) || stringValue(value.destination) || stringValue(value.destinationName);
  if (!name) return null;

  return {
    id: stringValue(value.id) || `destination-${index + 1}-${slugify(name)}`,
    name,
    country: stringValue(value.country) || stringValue(value.destinationCountry) || "Country estimate",
    whyItMatches: stringValue(value.whyItMatches) || stringValue(value.why) || stringValue(value.reason) || "Strong match for this trip profile.",
    bestThingsToDo: stringArray(value.bestThingsToDo ?? value.thingsToDo ?? value.activities),
    estimatedCost: numericCost(value.estimatedCost ?? value.costEstimate ?? value.totalCost) || 0,
    weatherSummary: stringValue(value.weatherSummary) || stringValue(value.weather) || "Weather estimate should be checked before booking.",
    flightEstimate: stringValue(value.flightEstimate) || stringValue(value.flight) || "Flight estimate pending live flight API.",
    hotelEstimate: stringValue(value.hotelEstimate) || stringValue(value.hotel) || "Hotel estimate pending live hotel API.",
    pros: stringArray(value.pros),
    cons: stringArray(value.cons),
    bestFor: stringArray(value.bestFor ?? value.best_for).length ? stringArray(value.bestFor ?? value.best_for) : ["culture", "food"],
    suggestedTripDuration: stringValue(value.suggestedTripDuration) || stringValue(value.tripDuration) || "5-7 days",
    confidenceScore: confidenceScore(value.confidenceScore ?? value.confidence),
    source: {
      provider: isMock ? "not-connected" : "openai",
      isMock,
      note: isMock ? "OpenAI not connected." : "AI destination estimate using your trip profile.",
    },
  };
}

function filterDestinationsByScope(destinations: DestinationRecommendation[], trip: TripDraft) {
  const destination = trip.destination?.toLowerCase().trim();
  const country = trip.destinationCountry?.toLowerCase().trim();
  if (!destination && !country) return destinations;

  return destinations.filter((item) => {
    const haystack = `${item.name} ${item.country} ${item.whyItMatches} ${item.bestThingsToDo.join(" ")}`.toLowerCase();
    if (country && haystack.includes(country)) return true;
    if (destination && haystack.includes(destination)) return true;
    return false;
  });
}

function normalizeItineraryDay(value: unknown, index: number, trip?: TripDraft, places: PlaceRecommendation[] = []): ItineraryDay | null {
  if (!isRecord(value)) return null;
  const date = stringValue(value.date) || dateFromOffset(index);
  const morning = planText(value.morning) || stringValue(value.morningPlan);
  const afternoon = planText(value.afternoon) || stringValue(value.afternoonPlan);
  const evening = planText(value.evening) || stringValue(value.eveningPlan);
  const theme = stringValue(value.theme) || `Day ${index + 1}`;
  const placesIncluded = stringArray(value.placesIncluded ?? value.places_included ?? value.includedPlaces ?? value.places);
  const cost = dailyCost(value);
  const estimatedCost = cost > 0 ? cost : estimateGeneratedDayCost(index, trip, places, placesIncluded);
  const inferredCostNote =
    cost > 0
      ? ""
      : " Daily cost inferred from selected places, traveler count, and trip budget because the AI did not return a usable estimate.";

  if (!morning && !afternoon && !evening) return null;

  return {
    id: stringValue(value.id) || `ai-day-${index + 1}`,
    date,
    theme,
    morningPlan: morning || "Flexible morning plan.",
    afternoonPlan: afternoon || "Flexible afternoon plan.",
    eveningPlan: evening || "Flexible evening plan.",
    placesIncluded,
    restaurantIdeas: stringArray(value.restaurantIdeas ?? value.restaurants),
    hiddenGem: stringArray(value.hiddenGems).join(", ") || stringValue(value.hiddenGem),
    estimatedCost,
    transportNotes: stringValue(value.transportNotes),
    backupOption: stringValue(value.backupOption),
    notes: `${stringValue(value.notes) || (hasEstimate(value) ? "Costs are estimates and should be checked before booking." : "Costs are estimated and should be checked before booking.")}${inferredCostNote}`.trim(),
  };
}

function estimateGeneratedDayCost(index: number, trip?: TripDraft, places: PlaceRecommendation[] = [], placesIncluded: string[] = []) {
  const travelerCount = Math.max(1, trip?.travelerCount ?? 1);
  const tripDays = trip ? tripLength(trip.startDate, trip.endDate) : 4;
  const dailyBudget = trip?.budget ? Math.max(0, trip.budget / tripDays) : 0;
  const includedNames = new Set(placesIncluded.map(normalizeName));
  const matchedPlaces = places.filter((place) => includedNames.has(normalizeName(place.name)));
  const placeCost = matchedPlaces.reduce((sum, place) => sum + placeCostEstimate(place, travelerCount), 0);
  const mealBase = {
    relaxed: 58,
    balanced: 72,
    adventure: 64,
    luxury: 145,
    family: 86,
    romantic: 122,
    cultural: 68,
  }[trip?.travelStyle ?? "balanced"] * travelerCount;
  const paceMultiplier = trip?.pace === "packed" ? 1.22 : trip?.pace === "slow" ? 0.86 : 1;
  const budgetGuidedCost = dailyBudget > 0 ? dailyBudget * 0.38 : 0;
  const inferred = Math.max((mealBase + placeCost) * paceMultiplier, budgetGuidedCost, 48 * travelerCount);
  const varied = inferred * (1 + (index % 3) * 0.06);
  return Math.max(20, Math.round(varied / 5) * 5);
}

function placeCostEstimate(place: PlaceRecommendation, travelerCount: number) {
  const base = {
    "$": 12,
    "$$": 32,
    "$$$": 68,
    "$$$$": 125,
  }[place.costLevel] ?? 28;
  const categoryBoost = /restaurant|cafe|tour|activity|museum|beach club|viewpoint/i.test(place.category) ? 1 : 0.65;
  return Math.round(base * categoryBoost * travelerCount);
}

function tripLength(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T12:00:00.000Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 4;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function dailyCost(value: Record<string, unknown>) {
  const direct = numericCost(value.estimatedCost ?? value.estimatedDailyCost ?? value.dailyCost ?? value.dailyCostFor2);
  if (direct > 0) return direct;
  const segmentCost =
    numericCost(nestedCost(value.morning)) +
    numericCost(nestedCost(value.afternoon)) +
    numericCost(nestedCost(value.evening));
  return segmentCost;
}

function nestedCost(value: unknown) {
  if (!isRecord(value)) return value;
  return value.costFor2 ?? value.estimatedCost ?? value.cost ?? value.price;
}

function planText(value: unknown) {
  if (typeof value === "string") return value;
  if (isRecord(value)) return stringValue(value.plan);
  return "";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) return stringValue(item.name) || stringValue(item.title) || stringValue(item.plan);
      return "";
    })
    .filter(Boolean);
}

function numericCost(value: unknown) {
  if (typeof value === "number") return value;
  if (isRecord(value)) return numericCost(value.cost ?? value.amount ?? value.estimate);
  if (typeof value !== "string") return 0;
  const matches = value.match(/\d+/g);
  if (!matches?.length) return 0;
  const numbers = matches.map(Number);
  return Math.round(numbers.reduce((sum, number) => sum + number, 0) / numbers.length);
}

function confidenceScore(value: unknown) {
  if (typeof value === "number") {
    return Math.round(value <= 1 ? value * 100 : Math.min(100, value));
  }
  if (typeof value === "string") {
    const match = value.match(/\d+(\.\d+)?/);
    if (!match) return 75;
    const number = Number(match[0]);
    return Math.round(number <= 1 ? number * 100 : Math.min(100, number));
  }
  return 75;
}

function hasEstimate(value: unknown) {
  return isRecord(value) && Object.values(value).some((entry) => isRecord(entry) && entry.isEstimate === true);
}

function dateFromOffset(index: number) {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

```

## `src/lib/api/activitiesService.ts`

```ts
import type { DataSource } from "@/lib/types/travel";

export type ActivityResult = {
  id?: string;
  title: string;
  category: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  estimatedPrice: number;
  duration: string;
  bookingLink?: string;
  source: DataSource;
};

export type ActivitySearchParams = {
  destination: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  limit?: number;
};

const getYourGuideApiBase = "https://api.getyourguide.com";
const getYourGuideApiVersion = "1";

export async function searchActivities(params: ActivitySearchParams | string): Promise<ActivityResult[]> {
  const normalized = typeof params === "string" ? { destination: params } : params;
  const token = process.env.GETYOURGUIDE_API_KEY?.trim();
  if (!token) return [];

  const query = new URLSearchParams({
    q: normalized.destination,
    cnt_language: "en",
    currency: normalized.currency ?? "USD",
    limit: String(normalizeLimit(normalized.limit)),
    sortfield: "rating",
    sortdirection: "DESC",
    preformatted: "teaser",
  });

  const dateRange = getDateRange(normalized.startDate, normalized.endDate);
  dateRange.forEach((date) => query.append("date[]", date));

  const response = await fetch(`${getYourGuideApiBase}/${getYourGuideApiVersion}/tours?${query.toString()}`, {
    headers: {
      "X-ACCESS-TOKEN": token,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GetYourGuide returned ${response.status}. Check API token access and partner permissions.`);
  }

  const payload = await response.json();
  const tours = Array.isArray(payload?.data?.tours) ? payload.data.tours : [];
  return tours.map(toActivityResult).filter(Boolean).slice(0, normalizeLimit(normalized.limit));
}

export async function checkGetYourGuideConnection() {
  if (!process.env.GETYOURGUIDE_API_KEY?.trim()) {
    return {
      ok: false,
      configured: false,
      message: "No GetYourGuide partner API token configured.",
    };
  }

  try {
    const results = await searchActivities({ destination: "Berlin", currency: "USD", limit: 1 });
    return {
      ok: true,
      configured: true,
      message: `Connected. Sample search returned ${results.length} tour${results.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : "GetYourGuide connection check failed.",
    };
  }
}

function toActivityResult(tour: Record<string, unknown>): ActivityResult {
  const price = getPrice(tour.price);
  const duration = getDuration(tour.durations);
  const category = Array.isArray(tour.categories) && tour.categories[0] && typeof tour.categories[0] === "object"
    ? String((tour.categories[0] as Record<string, unknown>).name ?? "Tour")
    : "Tour";

  return {
    id: tour.tour_id ? String(tour.tour_id) : undefined,
    title: String(tour.title ?? "GetYourGuide activity"),
    category,
    description: String(tour.abstract ?? tour.description ?? ""),
    rating: typeof tour.overall_rating === "number" ? tour.overall_rating : undefined,
    reviewCount: typeof tour.number_of_ratings === "number" ? tour.number_of_ratings : undefined,
    estimatedPrice: price,
    duration,
    bookingLink: typeof tour.url === "string" ? tour.url : undefined,
    source: {
      provider: "getyourguide",
      isMock: false,
      note: "Live GetYourGuide Partner API data.",
    },
  };
}

function getDateRange(startDate?: string, endDate?: string) {
  const dates = [];
  if (startDate) dates.push(`${startDate.slice(0, 10)}T00:00:00`);
  if (endDate) dates.push(`${endDate.slice(0, 10)}T23:59:59`);
  return dates;
}

function getPrice(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const price = value as Record<string, unknown>;
  return numberValue(price.values ?? price.value ?? price.amount ?? price.price);
}

function getDuration(value: unknown) {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return "Duration varies";
  const duration = value[0] as Record<string, unknown>;
  const min = numberValue(duration.duration ?? duration.min ?? duration.min_duration);
  const max = numberValue(duration.max_duration ?? duration.max);
  const minutes = max || min;
  if (!minutes) return "Duration varies";
  if (minutes >= 1440) return `${Math.round(minutes / 1440)} day${Math.round(minutes / 1440) === 1 ? "" : "s"}`;
  if (minutes >= 60) return `${Math.round(minutes / 60)} hr`;
  return `${minutes} min`;
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value)) return numberValue(value[0]);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return numberValue(record.amount ?? record.value ?? record.original ?? record.from);
  }
  return 0;
}

function normalizeLimit(value: number | undefined) {
  const limit = Number(value ?? 8);
  return Number.isFinite(limit) ? Math.min(Math.max(Math.round(limit), 1), 20) : 8;
}

```

## `src/lib/api/currencyService.ts`

```ts
import type { DataSource } from "@/lib/types/travel";

export type ExchangeRate = {
  base: string;
  quote: string;
  rate: number;
  source: DataSource;
};

export async function getExchangeRate(base = "USD", quote = "EUR"): Promise<ExchangeRate> {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${quote}`, {
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!response.ok) return fallbackRate(base, quote, `Frankfurter failed with ${response.status}.`);
    const data = (await response.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[quote];
    if (!rate) return fallbackRate(base, quote, "Frankfurter did not return this currency pair.");
    return {
      base,
      quote,
      rate,
      source: {
        provider: "frankfurter",
        isMock: false,
        note: "Live no-key Frankfurter exchange rate.",
      },
    };
  } catch (error) {
    return fallbackRate(base, quote, error instanceof Error ? error.message : "Currency lookup failed.");
  }
}

function fallbackRate(base: string, quote: string, note: string): ExchangeRate {
  return {
    base,
    quote,
    rate: 0,
    source: {
      provider: "currency-unavailable",
      isMock: true,
      note,
    },
  };
}

```

## `src/lib/api/flightsService.ts`

```ts
import type { FlightResult, FlightSearchParams } from "@/lib/types/travel";

export async function searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  void params;
  return [];
}

```

## `src/lib/api/gmailService.ts`

```ts
import { prisma } from "@/lib/db/prisma";
import { getOrCreateUser } from "@/lib/db/travel";
import type { RawEmailForImport } from "@/lib/imports/travelEmailParser";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email";
const REQUIRED_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const DEFAULT_SEARCH_QUERY = "newer_than:2y (from:booking.com OR from:expedia.com OR subject:Booking.com OR subject:Expedia)";
const DEFAULT_REDIRECT_URI = "http://localhost:3000/api/gmail/callback";

export type GmailConnectionStatus = {
  connected: boolean;
  configured: boolean;
  provider: "gmail";
  email?: string;
  message: string;
  searchQuery: string;
  connectUrl?: string;
};

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
};

type GmailMessageResponse = {
  id: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailPayloadPart;
};

type GmailPayloadPart = {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPayloadPart[];
};

export function hasGmailOAuthConfig() {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET);
}

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus> {
  const user = await getOrCreateUser();
  const configured = hasGmailOAuthConfig();
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
  });

  if (account) {
    const hasRequiredScope = account.scope?.split(/\s+/).includes(REQUIRED_GMAIL_SCOPE);
    return {
      connected: Boolean(hasRequiredScope),
      configured,
      provider: "gmail",
      email: account.email ?? undefined,
      searchQuery: DEFAULT_SEARCH_QUERY,
      connectUrl: configured ? "/api/gmail/connect" : undefined,
      message: hasRequiredScope
        ? `Connected to Gmail${account.email ? ` as ${account.email}` : ""}. Scans are read-only and imported only after preview.`
        : "Gmail account is authorized, but Google did not grant the read-only Gmail scope. Update OAuth consent scopes, then reconnect Gmail.",
    };
  }

  return {
    connected: false,
    configured,
    provider: "gmail",
    searchQuery: DEFAULT_SEARCH_QUERY,
    connectUrl: configured ? "/api/gmail/connect" : undefined,
    message: configured
      ? "Gmail OAuth is configured. Connect Gmail to scan Booking.com and Expedia confirmations directly."
      : "Gmail OAuth is not configured yet. Add Gmail OAuth client credentials, then connect Gmail here.",
  };
}

export function getGmailAuthorizationUrl(state: string) {
  if (!hasGmailOAuthConfig()) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GMAIL_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", gmailRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeGmailCode(code: string) {
  if (!hasGmailOAuthConfig()) throw new Error("Gmail OAuth is not configured.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GMAIL_CLIENT_ID ?? "",
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? "",
      redirect_uri: gmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const token = await response.json();
  if (!response.ok) {
    throw new Error(token.error_description ?? token.error ?? "Could not connect Gmail.");
  }

  const profile = await fetchGoogleProfile(token.access_token);
  const user = await getOrCreateUser();
  await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
    update: {
      providerUser: profile.id,
      email: profile.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? undefined,
      scope: token.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined,
    },
    create: {
      userId: user.id,
      provider: "gmail",
      providerUser: profile.id,
      email: profile.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      scope: token.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : undefined,
    },
  });
}

export function gmailRedirectUri() {
  return process.env.GMAIL_REDIRECT_URI || DEFAULT_REDIRECT_URI;
}

export async function disconnectGmail() {
  const user = await getOrCreateUser();
  await prisma.connectedAccount.deleteMany({ where: { userId: user.id, provider: "gmail" } });
}

export async function searchTravelEmailsFromGmail(options: { query?: string; maxResults?: number } = {}): Promise<RawEmailForImport[]> {
  const token = await getUsableGmailAccessToken();
  const query = options.query?.trim() || DEFAULT_SEARCH_QUERY;
  const maxResults = Math.min(Math.max(options.maxResults ?? 10, 1), 25);
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", String(maxResults));

  const list = await gmailFetch<GmailListResponse>(listUrl.toString(), token);
  const messages = list.messages ?? [];
  if (!messages.length) return [];

  return Promise.all(messages.map(async (message) => {
    const detailUrl = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`);
    detailUrl.searchParams.set("format", "full");
    const detail = await gmailFetch<GmailMessageResponse>(detailUrl.toString(), token);
    return toRawEmail(detail);
  }));
}

async function getUsableGmailAccessToken() {
  const user = await getOrCreateUser();
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
  });
  if (!account) throw new Error("Gmail is not connected.");
  if (!account.scope?.split(/\s+/).includes(REQUIRED_GMAIL_SCOPE)) {
    throw new Error("Gmail is connected without the required read-only Gmail scope. Reconnect after adding the Gmail readonly scope in Google Cloud.");
  }
  if (!account.expiresAt || account.expiresAt.getTime() > Date.now() + 60_000) return account.accessToken;
  if (!account.refreshToken) throw new Error("Gmail access expired. Reconnect Gmail.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID ?? "",
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? "",
      refresh_token: account.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const token = await response.json();
  if (!response.ok) throw new Error(token.error_description ?? token.error ?? "Could not refresh Gmail access.");

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessToken: token.access_token,
      scope: token.scope ?? account.scope,
      expiresAt: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000) : account.expiresAt,
    },
  });
  return token.access_token as string;
}

async function gmailFetch<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Gmail request failed.");
  return data as T;
}

async function fetchGoogleProfile(accessToken: string): Promise<{ id?: string; email?: string }> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return {};
  return response.json();
}

function toRawEmail(message: GmailMessageResponse): RawEmailForImport {
  const headers = message.payload?.headers ?? [];
  const subject = headerValue(headers, "subject");
  const from = headerValue(headers, "from");
  const body = extractBody(message.payload) || message.snippet || "";
  return { id: message.id, threadId: message.threadId, from, subject, body };
}

function headerValue(headers: { name: string; value: string }[], name: string) {
  return headers.find((header) => header.name.toLowerCase() === name)?.value;
}

function extractBody(part?: GmailPayloadPart): string {
  if (!part) return "";
  if (part.body?.data && (part.mimeType === "text/plain" || part.mimeType === "text/html")) {
    return decodeBase64Url(part.body.data);
  }
  return (part.parts ?? []).map(extractBody).filter(Boolean).join("\n\n");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8").replace(/<[^>]*>/g, " ");
}

```

## `src/lib/api/hotelsService.ts`

```ts
import type { HotelResult, HotelSearchParams } from "@/lib/types/travel";

export async function searchHotels(params: HotelSearchParams): Promise<HotelResult[]> {
  void params;
  return [];
}

```

## `src/lib/api/integrationStatus.ts`

```ts
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

```

## `src/lib/api/mapsService.ts`

```ts
import type { PlaceRecommendation } from "@/lib/types/travel";

export type MapPin = {
  id: string;
  label: string;
  category: string;
  location: string;
  isHiddenGem: boolean;
  isSaved?: boolean;
  lat: number;
  lng: number;
};

export type MapRoute = {
  center: { lat: number; lng: number };
  zoom: number;
  pins: MapPin[];
  routePins: MapPin[];
  routeNote: string;
  distanceMeters?: number;
  duration?: string;
  encodedPolyline?: string;
  isMock: boolean;
  provider: "google-maps" | "not-connected";
};

const fallbackCenter = { lat: 37.9838, lng: 23.7275 };

export async function getMapRoute(places: PlaceRecommendation[]): Promise<MapRoute> {
  const pins = places
    .map((place, index) => ({
      id: place.id,
      label: place.name,
      category: place.category,
      location: place.location,
      isHiddenGem: place.isHiddenGem,
      lat: place.coordinates?.lat ?? 38.72 + index * 0.012,
      lng: place.coordinates?.lng ?? -9.14 + index * 0.01,
    }))
    .filter((pin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng));

  const center = centerFromPins(pins);
  const zoom = zoomFromPins(pins);
  const routePins = selectRoutePins(pins);
  const route = await computeGoogleRoute(routePins);

  if (route) {
    return {
      center,
      zoom,
      pins,
      routePins,
      routeNote: `Live route estimate across ${routePins.length} nearby stops.`,
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      encodedPolyline: route.encodedPolyline,
      isMock: false,
      provider: "google-maps",
    };
  }

  const fallback = estimateRoute(routePins);

  return {
    center,
    zoom,
    pins,
    routePins,
    routeNote: process.env.GOOGLE_MAPS_API_KEY
      ? routePins.length > 1
        ? "Live pins are shown. Distance and duration are local estimates until Routes API is enabled."
        : "Live pins are shown. Route needs at least two nearby pins."
      : "Google Maps is not connected.",
    distanceMeters: fallback.distanceMeters,
    duration: fallback.duration,
    isMock: !process.env.GOOGLE_MAPS_API_KEY,
    provider: process.env.GOOGLE_MAPS_API_KEY ? "google-maps" : "not-connected",
  };
}

type StaticMapOptions = {
  markers?: boolean;
  routePath?: boolean;
  zoom?: number;
};

export function buildStaticMapUrl(route: MapRoute, size = "920x540", options: StaticMapOptions = {}) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !route.pins.length) return null;
  const { markers = true, routePath = true } = options;

  const params = new URLSearchParams({
    key,
    size,
    scale: "2",
    maptype: "roadmap",
    center: `${route.center.lat},${route.center.lng}`,
    zoom: String(options.zoom ?? route.zoom),
  });

  if (markers) {
    route.pins.slice(0, 18).forEach((pin, index) => {
      params.append("markers", `color:${markerColor(pin.category)}|label:${markerLabel(index)}|${pin.lat},${pin.lng}`);
    });
  }

  if (routePath && route.encodedPolyline) {
    params.append("path", `color:0x0f172aff|weight:4|enc:${route.encodedPolyline}`);
  } else if (routePath && route.routePins.length > 1) {
    params.append("path", `color:0x0f172aff|weight:4|${route.routePins.map((pin) => `${pin.lat},${pin.lng}`).join("|")}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function formatDistance(meters?: number) {
  if (!meters) return "Distance unavailable";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(duration?: string) {
  if (!duration) return "Duration unavailable";
  const seconds = Number(duration.replace("s", ""));
  if (!Number.isFinite(seconds)) return duration;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

async function computeGoogleRoute(pins: MapPin[]) {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key || pins.length < 2) return null;

  const [origin, ...rest] = pins;
  const destination = rest.at(-1);
  if (!destination) return null;
  const intermediates = rest.slice(0, -1).slice(0, 4);

  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        intermediates: intermediates.map(waypoint),
        travelMode: "WALK",
        computeAlternativeRoutes: false,
        languageCode: "en-US",
        units: "METRIC",
      }),
      next: { revalidate: 60 * 60 * 6 },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      routes?: Array<{ distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }>;
    };
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      distanceMeters: route.distanceMeters,
      duration: route.duration,
      encodedPolyline: route.polyline?.encodedPolyline,
    };
  } catch {
    return null;
  }
}

function waypoint(pin: MapPin) {
  return {
    location: {
      latLng: {
        latitude: pin.lat,
        longitude: pin.lng,
      },
    },
  };
}

function estimateRoute(pins: MapPin[]) {
  if (pins.length < 2) return {};
  const straightLineMeters = pins.slice(1).reduce((sum, pin, index) => sum + haversineMeters(pins[index], pin), 0);
  const walkingMeters = Math.round(straightLineMeters * 1.28);
  const walkingSeconds = Math.round(walkingMeters / 1.25);
  return {
    distanceMeters: walkingMeters,
    duration: `${walkingSeconds}s`,
  };
}

function selectRoutePins(pins: MapPin[]) {
  if (pins.length <= 6) return pins;
  const radiusMeters = 35000;
  const clusters = pins.map((pin) => pins.filter((candidate) => haversineMeters(pin, candidate) <= radiusMeters));
  const bestCluster = clusters.sort((a, b) => b.length - a.length)[0] ?? [];
  const routeable = bestCluster.length >= 2 ? bestCluster : pins.slice(0, 2);
  return routeable
    .sort((a, b) => categoryPriority(a.category, a.isHiddenGem) - categoryPriority(b.category, b.isHiddenGem))
    .slice(0, 6);
}

function categoryPriority(category: string, hidden: boolean) {
  if (hidden) return 0;
  if (/museum|landmark|historical|attraction/i.test(category)) return 1;
  if (/restaurant|cafe|bar/i.test(category)) return 2;
  if (/park|garden|view|scenic/i.test(category)) return 3;
  return 4;
}

function haversineMeters(a: MapPin, b: MapPin) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function centerFromPins(pins: MapPin[]) {
  if (!pins.length) return fallbackCenter;
  const sum = pins.reduce(
    (acc, pin) => ({ lat: acc.lat + pin.lat, lng: acc.lng + pin.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / pins.length, lng: sum.lng / pins.length };
}

function zoomFromPins(pins: MapPin[]) {
  if (pins.length < 2) return 12;
  const latitudes = pins.map((pin) => pin.lat);
  const longitudes = pins.map((pin) => pin.lng);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lngSpan);
  if (span > 7) return 5;
  if (span > 3.5) return 6;
  if (span > 1.6) return 7;
  if (span > 0.8) return 8;
  if (span > 0.35) return 10;
  if (span > 0.15) return 11;
  return 12;
}

function markerColor(category: string) {
  if (/restaurant|cafe|food|bar/i.test(category)) return "orange";
  if (/scenic|view|observation/i.test(category)) return "blue";
  if (/garden|park|nature|beach/i.test(category)) return "green";
  if (/museum|culture|landmark/i.test(category)) return "purple";
  return "red";
}

function markerLabel(index: number) {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index] ?? "";
}

```

## `src/lib/api/placesService.ts`

```ts
import type { PlaceRecommendation, TripDraft } from "@/lib/types/travel";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  regularOpeningHours?: { openNow?: boolean };
  primaryTypeDisplayName?: { text?: string };
  editorialSummary?: { text?: string };
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
};

const fieldMask = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.priceLevel",
  "places.types",
  "places.location",
  "places.regularOpeningHours",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
].join(",");

const categoryQueries = [
  "famous attractions",
  "hidden gems",
  "local neighborhoods",
  "restaurants",
  "cafes",
  "museums",
  "viewpoints",
  "nature spots",
  "shopping areas",
  "rainy day activities",
];

const interestQueryMap: Record<string, string[]> = {
  food: ["local restaurants", "food markets", "traditional food experiences"],
  beaches: ["beaches", "coastal viewpoints"],
  nature: ["gardens", "parks", "nature spots"],
  museums: ["museums", "galleries"],
  shopping: ["shopping streets", "local markets"],
  nightlife: ["nightlife areas", "live music bars"],
  history: ["historic sites", "old town landmarks"],
  photography: ["scenic viewpoints", "photo spots", "beautiful streets"],
  "hidden gems": ["hidden gems", "lesser known places", "local favorites"],
};

const blockedTypePattern =
  /photographer|photography_service|real_estate|store|doctor|dentist|lawyer|school|university|lodging|car_rental|travel_agency|gym|beauty_salon|hair_care|insurance_agency|bank|atm|gas_station|parking|association|organization/i;

const genericNamePattern =
  /^(viewpoint|restaurant|cafe|museum|garden)$/i;

const blockedNamePattern =
  /photographer|photoshoot|photo shoot|studio photographer|wedding photographer|portrait|corporate|real estate|agency/i;

export async function getPlacesForTrip(trip: TripDraft): Promise<PlaceRecommendation[]> {
  const destinationScope = placeDestinationScope(trip);
  if (!process.env.GOOGLE_PLACES_API_KEY || !destinationScope) {
    return [];
  }

  const queries = buildPlaceQueries(trip, destinationScope);
  const results = await Promise.allSettled(queries.map((query) => searchGooglePlaces(query)));
  const places = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const deduped = dedupePlaces(places);
  if (!deduped.length) {
    return [];
  }

  return diversifyPlaces(rankHiddenGems(deduped, trip.interests), 24);
}

export function rankHiddenGems(places: PlaceRecommendation[], interests: string[]) {
  return places
    .map((place) => {
      const interestBoost = interests.some((interest) =>
        `${place.category} ${place.description}`.toLowerCase().includes(interest.toLowerCase()),
      )
        ? 8
        : 0;
      const ratingBoost = place.rating ? Math.round((place.rating - 4.2) * 8) : 0;
      const uniquenessBoost = /local|quiet|lesser|unique|scenic|cultural|residential|authentic|independent|garden|viewpoint/i.test(
        `${place.category} ${place.description} ${place.whyRecommended}`,
      )
        ? 10
        : 0;
      const famePenalty = /tower|market|monastery|factory|palace|cathedral|aquarium/i.test(place.name) ? 12 : 0;
      const restaurantPenalty = /restaurant|cafe|bar/i.test(place.category) ? 8 : 0;
      const score = Math.max(
        0,
        Math.min(96, Math.round(place.hiddenGemScore * 0.68 + interestBoost + ratingBoost + uniquenessBoost - famePenalty - restaurantPenalty)),
      );
      return {
        ...place,
        hiddenGemScore: score,
        isHiddenGem: place.isHiddenGem || score >= 75,
      };
    })
    .sort((a, b) => b.hiddenGemScore - a.hiddenGemScore);
}

function buildPlaceQueries(trip: TripDraft, destination: string) {
  const interestQueries = trip.interests
    .slice(0, 6)
    .flatMap((interest) => interestQueryMap[interest.toLowerCase()] ?? [`${interest} travel spots`])
    .map((query) => `${query} in ${destination}`);
  const baselineQueries = categoryQueries.map((category) => `${category} in ${destination}`);
  return [...new Set([...interestQueries, ...baselineQueries])].slice(0, 12);
}

function placeDestinationScope(trip: TripDraft) {
  return [trip.destination, trip.destinationCountry].filter(Boolean).join(", ").trim();
}

async function searchGooglePlaces(query: string): Promise<PlaceRecommendation[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 8,
      languageCode: "en",
    }),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Google Places search failed: ${response.status}`);
  }

  const data = (await response.json()) as GoogleTextSearchResponse;
  return (data.places ?? []).filter(isTravelPlace).map((place) => mapGooglePlace(place, query));
}

function isTravelPlace(place: GooglePlace) {
  const haystack = `${place.displayName?.text ?? ""} ${place.primaryTypeDisplayName?.text ?? ""} ${place.types?.join(" ") ?? ""}`;
  if (blockedNamePattern.test(haystack) || blockedTypePattern.test(haystack)) return false;
  if (genericNamePattern.test(place.displayName?.text?.trim() ?? "")) return false;
  return Boolean(place.displayName?.text && place.formattedAddress);
}

function mapGooglePlace(place: GooglePlace, query: string): PlaceRecommendation {
  const category = toTitleCase(place.primaryTypeDisplayName?.text ?? place.types?.[0]?.replaceAll("_", " ") ?? "Place");
  const description = place.editorialSummary?.text ?? `Recommended from Google Places for "${query}".`;
  const hiddenGemScore = initialHiddenGemScore(place, query, description);
  return {
    id: place.id ?? `${place.displayName?.text}-${place.formattedAddress}`,
    name: place.displayName?.text ?? "Unnamed place",
    category,
    description,
    rating: place.rating,
    costLevel: mapPriceLevel(place.priceLevel),
    location: place.formattedAddress ?? "Location available in Google Places",
    coordinates:
      place.location?.latitude && place.location?.longitude
        ? { lat: place.location.latitude, lng: place.location.longitude }
        : undefined,
    openingStatus:
      typeof place.regularOpeningHours?.openNow === "boolean"
        ? place.regularOpeningHours.openNow
          ? "Open now"
          : "Closed now"
        : "Opening hours unavailable",
    whyRecommended: `Matched "${query}" with rating, category, and location data from Google Places.`,
    isHiddenGem: hiddenGemScore >= 75,
    hiddenGemScore,
    source: {
      provider: "google-places",
      isMock: false,
      note: "Live Google Places Text Search result.",
    },
  };
}

function initialHiddenGemScore(place: GooglePlace, query: string, description: string) {
  const ratingScore = place.rating ? Math.round((place.rating - 4.1) * 10) : 0;
  const localScore = /hidden|local|neighborhood|authentic|quiet|viewpoint|garden|independent|cultural/i.test(
    `${query} ${description} ${place.types?.join(" ")}`,
  )
    ? 24
    : 8;
  const famousPenalty = /tourist_attraction|landmark|museum/i.test(place.types?.join(" ") ?? "") ? 8 : 0;
  const restaurantPenalty = /restaurant|cafe|bar/i.test(place.types?.join(" ") ?? "") ? 10 : 0;
  return Math.max(35, Math.min(88, 46 + ratingScore + localScore - famousPenalty - restaurantPenalty));
}

function mapPriceLevel(priceLevel?: string): "$" | "$$" | "$$$" | "$$$$" {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return "$$";
  }
}

function dedupePlaces(places: PlaceRecommendation[]) {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.id || `${place.name}-${place.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diversifyPlaces(places: PlaceRecommendation[], limit: number) {
  const selected: PlaceRecommendation[] = [];
  const categoryCounts = new Map<string, number>();
  const firstPassLimit = 4;

  for (const place of places) {
    const normalizedCategory = normalizeCategory(place.category);
    const count = categoryCounts.get(normalizedCategory) ?? 0;
    if (count >= firstPassLimit) continue;
    selected.push(place);
    categoryCounts.set(normalizedCategory, count + 1);
    if (selected.length >= limit) return selected;
  }

  for (const place of places) {
    if (selected.some((selectedPlace) => selectedPlace.id === place.id)) continue;
    selected.push(place);
    if (selected.length >= limit) break;
  }

  return selected;
}

function normalizeCategory(category: string) {
  if (/restaurant|seafood|brunch|cafe|bar/i.test(category)) return "food";
  if (/scenic|viewpoint|observation/i.test(category)) return "viewpoint";
  if (/museum|gallery|cultural/i.test(category)) return "culture";
  if (/garden|park|beach|nature/i.test(category)) return "nature";
  return category.toLowerCase();
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

```

## `src/lib/api/weatherService.ts`

```ts
import type { DataSource } from "@/lib/types/travel";

export type WeatherSummary = {
  destination: string;
  summary: string;
  temperatureRange: string;
  rainRisk: string;
  daily: Array<{
    date: string;
    minC: number;
    maxC: number;
    rainChance: number;
    weatherCode: number;
    label: string;
  }>;
  source: DataSource;
};

type GeocodeResponse = {
  results?: Array<{ name: string; country?: string; latitude: number; longitude: number; timezone?: string }>;
};

type ForecastResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
  };
};

export async function getWeatherSummary(destination: string): Promise<WeatherSummary> {
  try {
    const place = await geocode(destination);
    if (!place) return fallbackWeather(destination, "Open-Meteo geocoding did not find this destination.");

    const params = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      forecast_days: "7",
      timezone: place.timezone ?? "auto",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) return fallbackWeather(destination, `Open-Meteo forecast failed with ${response.status}.`);
    const data = (await response.json()) as ForecastResponse;
    const daily = normalizeDaily(data);
    if (!daily.length) return fallbackWeather(destination, "Open-Meteo returned no daily forecast rows.");

    const min = Math.round(Math.min(...daily.map((day) => day.minC)));
    const max = Math.round(Math.max(...daily.map((day) => day.maxC)));
    const rain = Math.round(daily.reduce((sum, day) => sum + day.rainChance, 0) / daily.length);

    return {
      destination: `${place.name}${place.country ? `, ${place.country}` : ""}`,
      summary: `${daily[0].label} today, averaging ${rain}% rain risk across the next week.`,
      temperatureRange: `${min}-${max} C`,
      rainRisk: rain < 25 ? "Low" : rain < 55 ? "Medium" : "High",
      daily,
      source: {
        provider: "open-meteo",
        isMock: false,
        note: "Live no-key Open-Meteo forecast.",
      },
    };
  } catch (error) {
    return fallbackWeather(destination, error instanceof Error ? error.message : "Weather lookup failed.");
  }
}

async function geocode(destination: string) {
  for (const candidate of geocodeCandidates(destination)) {
    const params = new URLSearchParams({ name: candidate, count: "1", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) continue;
    const data = (await response.json()) as GeocodeResponse;
    const place = data.results?.[0];
    if (place) return place;
  }
  return null;
}

function geocodeCandidates(destination: string) {
  const raw = destination.trim();
  const withoutSymbols = raw.replace(/[+|/]/g, " ").replace(/\s+/g, " ").trim();
  const beforeComma = withoutSymbols.split(",")[0]?.trim();
  const beforeAnd = beforeComma?.split(/\s+(?:and|&)\s+/i)[0]?.trim();
  const firstWords = beforeComma?.split(/\s+/).slice(0, 2).join(" ").trim();
  const firstWord = beforeComma?.split(/\s+/)[0]?.trim();

  return [...new Set([raw, withoutSymbols, beforeComma, beforeAnd, firstWords, firstWord].filter((item): item is string => Boolean(item)))];
}

function normalizeDaily(data: ForecastResponse): WeatherSummary["daily"] {
  const daily = data.daily;
  if (!daily?.time?.length) return [];
  return daily.time.map((date, index) => {
    const weatherCode = daily.weather_code?.[index] ?? 0;
    return {
      date,
      minC: Math.round(daily.temperature_2m_min?.[index] ?? 0),
      maxC: Math.round(daily.temperature_2m_max?.[index] ?? 0),
      rainChance: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
      weatherCode,
      label: weatherLabel(weatherCode),
    };
  });
}

function fallbackWeather(destination: string, note: string): WeatherSummary {
  return {
    destination,
    summary: "Weather unavailable.",
    temperatureRange: "Unavailable",
    rainRisk: "Unavailable",
    daily: [],
    source: {
      provider: "weather-unavailable",
      isMock: true,
      note,
    },
  };
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Variable";
}

```

## `src/lib/data/defaults.ts`

```ts
export const defaultUser = {
  email: "local@travel-guide.app",
  name: "Marwan",
};

export const defaultTravelProfile = {
  preferredHotelType: "Boutique hotel in a walkable area",
  travelPace: "medium",
  foodPreferences: "Local restaurants, casual tasting menus, good coffee",
  budgetStyle: "balanced",
  favoriteActivities: "food, history, photography, hidden gems, nature",
  thingsToAvoid: "Overpacked days, avoidable crowds, long transfers",
  homeAirport: "DXB",
  passportNationality: "",
  hiddenGemInterest: true,
  preferredTravelMonths: "March, April, May, October, November",
  notes: "Prefer scenic neighborhoods, relaxed dinners, and authentic local places.",
};

```

## `src/lib/db/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

```

## `src/lib/db/travel.ts`

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { defaultTravelProfile, defaultUser } from "@/lib/data/defaults";
import type { DestinationRecommendation, ItineraryDay, PlaceRecommendation, TripDraft } from "@/lib/types/travel";

const primaryTripInclude = Prisma.validator<Prisma.TripInclude>()({
  destinationRecommendations: true,
  placeRecommendations: true,
  savedPlaces: { include: { placeRecommendation: true }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] },
  itineraryDays: { include: { items: { orderBy: { sortOrder: "asc" } } } },
  budgetCategories: true,
  expenses: true,
  bookings: true,
  documentNotes: true,
  memories: true,
});

export type PrimaryTrip = Prisma.TripGetPayload<{ include: typeof primaryTripInclude }>;

export async function getOrCreateUser() {
  const user = await prisma.user.upsert({
    where: { email: defaultUser.email },
    update: { name: defaultUser.name },
    create: defaultUser,
  });

  await prisma.travelProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { ...defaultTravelProfile, userId: user.id },
  });

  return user;
}

export async function getPrimaryTrip(): Promise<PrimaryTrip | null> {
  const user = await getOrCreateUser();
  return prisma.trip.findFirst({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: primaryTripInclude,
  }).then((trip) => {
    if (!trip) return null;
    return {
      ...trip,
      itineraryDays: [...trip.itineraryDays].sort((a, b) => a.date.getTime() - b.date.getTime()),
      expenses: [...trip.expenses].sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime()),
      bookings: [...trip.bookings].sort((a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0)),
      documentNotes: [...trip.documentNotes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      memories: [...trip.memories].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  });
}

export async function getTravelProfile() {
  const user = await getOrCreateUser();
  return prisma.travelProfile.findUnique({ where: { userId: user.id } });
}

export function toTripDraft(trip: PrimaryTrip): TripDraft {
  return {
    name: trip.name,
    destination: trip.destination ?? undefined,
    destinationCountry: trip.destinationCountry ?? undefined,
    departureCity: trip.departureCity,
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    travelerCount: trip.travelerCount,
    budget: trip.budget,
    travelStyle: trip.travelStyle as TripDraft["travelStyle"],
    pace: trip.pace as TripDraft["pace"],
    interests: splitList(trip.interests),
    notes: trip.notes ?? undefined,
  };
}

export function toDestinationRecommendations(trip: PrimaryTrip): DestinationRecommendation[] {
  return trip.destinationRecommendations.map((destination) => ({
    id: destination.id,
    name: destination.name,
    country: destination.country,
    whyItMatches: destination.whyItMatches,
    bestThingsToDo: splitList(destination.bestThingsToDo),
    estimatedCost: destination.estimatedCost,
    weatherSummary: destination.weatherSummary,
    flightEstimate: destination.flightEstimate ?? "Flight estimate pending",
    hotelEstimate: destination.hotelEstimate ?? "Hotel estimate pending",
    pros: splitList(destination.pros),
    cons: splitList(destination.cons),
    bestFor: splitList(destination.bestFor),
    suggestedTripDuration: destination.suggestedTripDuration,
    confidenceScore: destination.confidenceScore,
    source: {
      provider: destination.source,
      isMock: destination.source === "not-connected",
      note: destination.source === "not-connected" ? "Provider not connected." : "Live provider data.",
    },
  }));
}

export function toPlaceRecommendations(trip: PrimaryTrip): PlaceRecommendation[] {
  return trip.placeRecommendations.map((place) => ({
    id: place.id,
    name: place.name,
    category: place.category,
    description: place.description,
    rating: place.rating ?? undefined,
    costLevel: normalizeCostLevel(place.costLevel),
    location: place.location,
    coordinates: place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : undefined,
    openingStatus: place.openingStatus ?? undefined,
    whyRecommended: place.whyRecommended,
    isHiddenGem: place.isHiddenGem,
    hiddenGemScore: place.hiddenGemScore,
    source: {
      provider: place.source,
      isMock: place.source === "not-connected",
      note: place.source === "not-connected" ? "Google Places not connected." : "Live places data.",
    },
  }));
}

export function toSelectedPlaceRecommendations(trip: PrimaryTrip): PlaceRecommendation[] {
  return trip.savedPlaces.map((savedPlace) => {
    const place = savedPlace.placeRecommendation;
    if (place) {
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        description: place.description,
        rating: place.rating ?? undefined,
        costLevel: normalizeCostLevel(place.costLevel),
        location: place.location,
        coordinates: place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : undefined,
        openingStatus: place.openingStatus ?? undefined,
        whyRecommended: place.whyRecommended,
        isHiddenGem: place.isHiddenGem,
        hiddenGemScore: place.hiddenGemScore,
        source: {
          provider: place.source,
          isMock: place.source === "not-connected",
          note: place.source === "not-connected" ? "Google Places not connected." : "Live places data.",
        },
      };
    }

    return {
      id: savedPlace.id,
      name: savedPlace.name,
      category: savedPlace.category,
      description: savedPlace.notes ?? "Saved for this trip plan.",
      costLevel: "$$",
      location: "",
      whyRecommended: savedPlace.notes ?? "Selected for itinerary planning.",
      isHiddenGem: savedPlace.priority === 1,
      hiddenGemScore: savedPlace.priority === 1 ? 70 : 40,
      source: {
        provider: "saved",
        isMock: false,
        note: "Saved from your trip plan.",
      },
    };
  });
}

export function toItineraryDays(trip: PrimaryTrip): ItineraryDay[] {
  return trip.itineraryDays.map((day) => ({
    id: day.id,
    date: day.date.toISOString().slice(0, 10),
    theme: day.theme,
    morningPlan: day.morningPlan,
    afternoonPlan: day.afternoonPlan,
    eveningPlan: day.eveningPlan,
    placesIncluded: day.items.map((item) => item.title),
    restaurantIdeas: splitList(day.restaurantIdeas ?? ""),
    hiddenGem: day.hiddenGem ?? "",
    estimatedCost: day.estimatedCost > 0 ? day.estimatedCost : inferStoredDayCost(trip, day.items),
    transportNotes: day.transportNotes ?? "",
    backupOption: day.backupOption ?? "",
    notes: day.notes ?? "",
  }));
}

function inferStoredDayCost(trip: PrimaryTrip, items: PrimaryTrip["itineraryDays"][number]["items"]) {
  const itemCost = items.reduce((sum, item) => sum + Math.max(0, item.estimatedCost), 0);
  const travelerCount = Math.max(1, trip.travelerCount);
  const days = Math.max(1, trip.itineraryDays.length || tripLength(trip.startDate, trip.endDate));
  const budgetGuided = trip.budget > 0 ? (trip.budget / days) * 0.38 : 0;
  const baseline = 62 * travelerCount + itemCost;
  return Math.round(Math.max(baseline, budgetGuided, 45 * travelerCount) / 5) * 5;
}

function tripLength(startDate: Date, endDate: Date) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 4;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function parseDateField(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(`${text}T12:00:00.000Z`) : new Date();
}

export function parseNumberField(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formString(formData: FormData, key: string, fallback = "") {
  const value = String(formData.get(key) ?? "").trim();
  return value || fallback;
}

function normalizeCostLevel(value: string | null): "$" | "$$" | "$$$" | "$$$$" {
  if (value === "$" || value === "$$" || value === "$$$" || value === "$$$$") return value;
  return "$$";
}

export async function createDefaultTripChildren(tripId: string) {
  const budgetData: Prisma.BudgetCategoryCreateManyInput[] = [
    { tripId, name: "Flights", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Hotel", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Food", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Activities", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Transport", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Shopping", estimatedAmount: 0, actualAmount: 0 },
    { tripId, name: "Emergency buffer", estimatedAmount: 0, actualAmount: 0 },
  ];
  await prisma.budgetCategory.createMany({ data: budgetData });
}

```

## `src/lib/imports/travelEmailParser.ts`

```ts
export type ParsedTravelEmail = {
  sourceId?: string;
  provider: "Booking.com" | "Expedia" | "Unknown";
  bookingType: "Hotel" | "Flight" | "Tour" | "Car rental" | "Restaurant" | "Travel";
  title: string;
  confirmationNumber?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  link?: string;
  price?: string;
  guestName?: string;
  cancellationNotes?: string;
  sourceSubject?: string;
  sourceFrom?: string;
  importFingerprint: string;
  confidenceScore: number;
  rawSnippet: string;
};

export type RawEmailForImport = {
  id?: string;
  threadId?: string;
  from?: string;
  subject?: string;
  body: string;
};

const confirmationPatterns = [
  /confirmation(?: number| no\.?| #)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /booking(?: number| reference| id)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /itinerary(?: number| #)?[ \t:#-]+([A-Z0-9-]{5,})/i,
  /reservation(?: number| code)?[ \t:#-]+([A-Z0-9-]{5,})/i,
];

const datePatterns = [
  /(?:check-?in|arrival|depart(?:ure)?|from)[ \t:]+([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i,
  /(?:check-?out|return|to)[ \t:]+([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i,
];

export function parseTravelEmail(email: RawEmailForImport): ParsedTravelEmail {
  const text = normalizeText(`${email.subject ?? ""}\n${email.body}`);
  const provider = detectProvider(text, email.from);
  const bookingType = detectBookingType(text);
  const title = detectTitle(text, provider, bookingType);
  const confirmationNumber = firstMatch(text, confirmationPatterns);
  const dates = extractDates(text);
  const address = extractAddress(text);
  const link = extractLink(email.body);
  const price = firstMatch(text, [/(?:total|price|amount|paid)\s*:?\s*((?:USD|AED|EUR|GBP|\$|€|£)\s?[0-9,]+(?:\.\d{2})?)/i]);
  const guestName = firstMatch(text, [/(?:guest|traveler|passenger)[ \t:]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){0,3})/i]);
  const cancellationNotes = extractCancellation(text);
  const importFingerprint = buildImportFingerprint({ email, provider, bookingType, title, confirmationNumber, dates });

  return {
    sourceId: email.id,
    provider,
    bookingType,
    title,
    confirmationNumber,
    startDate: dates[0],
    endDate: dates[1],
    address,
    link,
    price,
    guestName,
    cancellationNotes,
    sourceSubject: email.subject,
    sourceFrom: email.from,
    importFingerprint,
    confidenceScore: scoreParse({ provider, title, confirmationNumber, dates, address, link }),
    rawSnippet: text.slice(0, 900),
  };
}

export function parseManyTravelEmails(emails: RawEmailForImport[]) {
  return emails.map(parseTravelEmail).sort((a, b) => b.confidenceScore - a.confidenceScore);
}

function detectProvider(text: string, from?: string): ParsedTravelEmail["provider"] {
  const source = `${from ?? ""} ${text}`.toLowerCase();
  if (source.includes("booking.com")) return "Booking.com";
  if (source.includes("expedia")) return "Expedia";
  return "Unknown";
}

function detectBookingType(text: string): ParsedTravelEmail["bookingType"] {
  if (/flight|airline|airport|departing|return flight/i.test(text)) return "Flight";
  if (/hotel|property|room|check-?in|check-?out|accommodation/i.test(text)) return "Hotel";
  if (/tour|activity|experience|ticket/i.test(text)) return "Tour";
  if (/car rental|rental car|pickup location/i.test(text)) return "Car rental";
  if (/restaurant|reservation time|table for/i.test(text)) return "Restaurant";
  return "Travel";
}

function detectTitle(text: string, provider: ParsedTravelEmail["provider"], bookingType: ParsedTravelEmail["bookingType"]) {
  const hotel = firstMatch(text, [
    /(?:booking at|reservation at|booked at)\s+([A-Z0-9][^\n]{3,100}?)(?:\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready)|[.!?\n]|$)/i,
    /(?:hotel|property|accommodation)\s+name[ \t:]+([A-Z0-9][^\n]{3,100})/i,
    /(?:property|hotel|accommodation)[ \t:]+([A-Z0-9][^\n]{3,80})/i,
    /(?:you(?:'|’)re booked at|booking at|reservation at)\s+([A-Z0-9][^\n]{3,80})/i,
  ]);
  if (hotel) return cleanTitle(hotel);

  const subjectTitle = firstMatch(text, [
    /(?:booking|reservation)\s+(?:at|for)\s+([A-Z0-9][^\n]{3,100}?)(?:\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready)|[.!?\n]|$)/i,
    /(?:confirmed|confirmation|itinerary|reservation)[^\n:]*:\s*([A-Z0-9][^\n]{3,80})/i,
  ]);
  if (subjectTitle) return cleanTitle(subjectTitle);

  return `${provider === "Unknown" ? "" : `${provider} `}${bookingType} booking`.trim();
}

function extractDates(text: string) {
  const dates = datePatterns
    .map((pattern) => firstMatch(text, [pattern]))
    .filter((date): date is string => Boolean(date))
    .map(toIsoDate)
    .filter((date): date is string => Boolean(date));

  const genericDates = [...text.matchAll(/\b([A-Z][a-z]{2,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b/g)]
    .map((match) => toIsoDate(match[1]))
    .filter((date): date is string => Boolean(date));

  return [...new Set([...dates, ...genericDates])].slice(0, 2);
}

function extractAddress(text: string) {
  return firstMatch(text, [
    /(?:address|location)\s*:?\s*([^\n]{8,140})/i,
    /\b([0-9]{1,5}\s+[A-Za-z0-9 .,'-]{8,100}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd)[^\n]*)/i,
  ]);
}

function extractLink(body: string) {
  return body.match(/https?:\/\/[^\s<>"']+/i)?.[0];
}

function extractCancellation(text: string) {
  return firstMatch(text, [
    /(free cancellation[^\n.]{0,140})/i,
    /(non-?refundable[^\n.]{0,140})/i,
    /(cancel(?:lation)? policy[^\n.]{0,160})/i,
  ]);
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)?.[1]?.trim();
    if (match) return cleanTitle(match);
  }
  return undefined;
}

function scoreParse(value: {
  provider: ParsedTravelEmail["provider"];
  title: string;
  confirmationNumber?: string;
  dates: string[];
  address?: string;
  link?: string;
}) {
  let score = 30;
  if (value.provider !== "Unknown") score += 20;
  if (value.title && !/booking$/i.test(value.title)) score += 15;
  if (value.confirmationNumber) score += 15;
  if (value.dates.length) score += 10;
  if (value.address) score += 5;
  if (value.link) score += 5;
  return Math.min(95, score);
}

function normalizeText(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^(?:your\s+)?(?:booking\.com|expedia)?\s*(?:booking|reservation|itinerary|confirmation)(?:\s+confirmation)?\s*:\s*/i, "")
    .replace(/\s+(?:is|has been|was)\s+(?:confirmed|now confirmed|ready).*$/i, "")
    .replace(/\s+is now$/i, "")
    .replace(/[|•].*$/, "")
    .trim()
    .slice(0, 110);
}

function buildImportFingerprint(value: {
  email: RawEmailForImport;
  provider: ParsedTravelEmail["provider"];
  bookingType: ParsedTravelEmail["bookingType"];
  title: string;
  confirmationNumber?: string;
  dates: string[];
}) {
  const base = [
    value.provider,
    value.bookingType,
    value.confirmationNumber || value.email.id || value.email.subject || value.title,
    value.dates.join(":"),
  ].join("|");
  return normalizeFingerprint(base);
}

function normalizeFingerprint(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9|:-]+/g, "-").replace(/-+/g, "-").slice(0, 180);
}

function toIsoDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return value;

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const month = slash[1].padStart(2, "0");
    const day = slash[2].padStart(2, "0");
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${month}-${day}`;
  }

  const named = value.match(/^([A-Z][a-z]{2,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!named) return undefined;
  const month = monthNumber(named[1]);
  if (!month) return undefined;
  return `${named[3]}-${month}-${named[2].padStart(2, "0")}`;
}

function monthNumber(month: string) {
  const index = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month.toLowerCase());
  return index >= 0 ? String(index + 1).padStart(2, "0") : undefined;
}

```

## `src/lib/travel/externalSearchLinks.ts`

```ts
export type TravelSearchContext = {
  destination?: string | null;
  destinationCountry?: string | null;
  departureCity?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  travelerCount?: number | null;
  hotelAreaHint?: string | null;
};

export type ExternalSearchLink = {
  id: string;
  label: string;
  provider: string;
  category: "Flights" | "Hotels" | "Activities";
  href: string;
  description: string;
  note: string;
};

export type ExternalSearchSummary = {
  destination: string;
  departureCity: string;
  dates: string;
  travelers: number;
  hotelAreaHint: string;
  text: string;
};

export type HotelAreaPlace = {
  name?: string | null;
  category?: string | null;
  isHiddenGem?: boolean | null;
};

export function getExternalSearchLinks(context: TravelSearchContext | null | undefined): ExternalSearchLink[] {
  const summary = getExternalSearchSummary(context);
  const startDate = formatDate(context?.startDate);
  const endDate = formatDate(context?.endDate);

  return [
    {
      id: "booking-hotels",
      label: "Find hotels",
      provider: "Booking.com",
      category: "Hotels",
      href: bookingUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Hotel search for ${summary.destination}. ${summary.hotelAreaHint}`,
      note: "Book on Booking.com, then import the confirmation from Gmail.",
    },
    {
      id: "expedia-hotels",
      label: "Find hotels",
      provider: "Expedia",
      category: "Hotels",
      href: expediaHotelUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Hotel search for ${summary.destination}. ${summary.hotelAreaHint}`,
      note: "Book on Expedia, then import the confirmation from Gmail.",
    },
    {
      id: "google-flights",
      label: "Compare flights",
      provider: "Google Flights",
      category: "Flights",
      href: googleFlightsUrl(summary.departureCity, summary.destination, startDate, endDate, summary.travelers),
      description: `Flight search from ${summary.departureCity} to ${summary.destination}.`,
      note: "If dates or airports do not prefill perfectly, use the copied trip details.",
    },
    {
      id: "skyscanner-flights",
      label: "Compare flights",
      provider: "Skyscanner",
      category: "Flights",
      href: skyscannerUrl(summary.departureCity, summary.destination, startDate, endDate),
      description: `Flight comparison shortcut for ${summary.destination}.`,
      note: "Skyscanner may ask you to confirm airport codes on the opened page.",
    },
    {
      id: "getyourguide-activities",
      label: "Find tours",
      provider: "GetYourGuide",
      category: "Activities",
      href: getYourGuideUrl(summary.destination, startDate, endDate, summary.travelers),
      description: `Tours, tickets, and activities search for ${summary.destination}.`,
      note: "Book on GetYourGuide, then import the confirmation from Gmail.",
    },
  ];
}

export function getExternalSearchSummary(context: TravelSearchContext | null | undefined): ExternalSearchSummary {
  const destination = destinationLabel(context);
  const departureCity = cleanText(context?.departureCity) || "your departure city";
  const startDate = formatDate(context?.startDate);
  const endDate = formatDate(context?.endDate);
  const travelers = Math.max(1, Number(context?.travelerCount ?? 1) || 1);
  const dates = startDate && endDate ? `${startDate} to ${endDate}` : "dates not set";
  const hotelAreaHint = cleanText(context?.hotelAreaHint) || "Use your saved places on the map to choose a walkable hotel area.";
  const text = [
    `Destination: ${destination}`,
    `Departure city: ${departureCity}`,
    `Dates: ${dates}`,
    `Travelers: ${travelers}`,
    `Hotel area hint: ${hotelAreaHint}`,
  ].join("\n");

  return { destination, departureCity, dates, travelers, hotelAreaHint, text };
}

export function getHotelAreaHintFromPlaces(places: HotelAreaPlace[] | null | undefined) {
  const list = places ?? [];
  const area = list.find((place) => /neighbou?rhood|district|area|quarter|old town|downtown|center|centre/i.test(place.category ?? place.name ?? ""));
  if (area?.name) return `Good hotel-area starting point: ${area.name}.`;

  const hiddenGem = list.find((place) => place.isHiddenGem);
  if (hiddenGem?.name) return `Consider staying within easy reach of saved places like ${hiddenGem.name}.`;

  const firstPlace = list[0];
  if (firstPlace?.name) return `Use saved places like ${firstPlace.name} to choose a convenient hotel area.`;

  return "Use your saved places on the map to choose a walkable hotel area.";
}

export function withHotelAreaHint<T extends TravelSearchContext | null | undefined>(
  context: T,
  places: HotelAreaPlace[] | null | undefined,
): TravelSearchContext | null {
  if (!context) return null;
  return { ...context, hotelAreaHint: getHotelAreaHintFromPlaces(places) };
}

function bookingUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const params = new URLSearchParams({
    ss: destination,
    group_adults: String(travelers),
    no_rooms: "1",
    group_children: "0",
  });
  if (startDate) params.set("checkin", startDate);
  if (endDate) params.set("checkout", endDate);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function expediaHotelUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const params = new URLSearchParams({
    destination,
    rooms: `1_${travelers}`,
  });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return `https://www.expedia.com/Hotel-Search?${params.toString()}`;
}

function googleFlightsUrl(departureCity: string, destination: string, startDate: string, endDate: string, travelers: number) {
  const dateText = startDate && endDate ? ` from ${startDate} to ${endDate}` : "";
  const passengerText = travelers > 1 ? ` for ${travelers} travelers` : "";
  const params = new URLSearchParams({
    q: `Flights from ${departureCity} to ${destination}${dateText}${passengerText}`,
  });
  return `https://www.google.com/travel/flights?${params.toString()}`;
}

function skyscannerUrl(departureCity: string, destination: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({
    from: departureCity,
    to: destination,
  });
  if (startDate) params.set("depart", startDate);
  if (endDate) params.set("return", endDate);
  return `https://www.skyscanner.com/transport/flights?${params.toString()}`;
}

function getYourGuideUrl(destination: string, startDate: string, endDate: string, travelers: number) {
  const query = [destination, "tours activities tickets"].filter(Boolean).join(" ");
  const params = new URLSearchParams({ q: query });
  if (startDate) params.set("date_from", startDate);
  if (endDate) params.set("date_to", endDate);
  params.set("participants", String(travelers));
  return `https://www.getyourguide.com/s/?${params.toString()}`;
}

function destinationLabel(context: TravelSearchContext | null | undefined) {
  const destination = cleanText(context?.destination);
  const country = cleanText(context?.destinationCountry);
  if (destination && country && destination.toLowerCase() === country.toLowerCase()) return destination;
  return [destination, country].filter(Boolean).join(", ") || "your destination";
}

function cleanText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

```

## `src/lib/types/travel.ts`

```ts
export type TravelStyle =
  | "relaxed"
  | "balanced"
  | "adventure"
  | "luxury"
  | "family"
  | "romantic"
  | "cultural";

export type TravelPace = "slow" | "medium" | "packed";

export type DataSource = {
  provider: string;
  isMock: boolean;
  note: string;
};

export type TripDraft = {
  name: string;
  destination?: string;
  destinationCountry?: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  budget: number;
  travelStyle: TravelStyle;
  pace: TravelPace;
  interests: string[];
  notes?: string;
};

export type DestinationRecommendation = {
  id: string;
  name: string;
  country: string;
  whyItMatches: string;
  bestThingsToDo: string[];
  estimatedCost: number;
  weatherSummary: string;
  flightEstimate: string;
  hotelEstimate: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  suggestedTripDuration: string;
  confidenceScore: number;
  source: DataSource;
};

export type PlaceRecommendation = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating?: number;
  costLevel: "$" | "$$" | "$$$" | "$$$$";
  location: string;
  coordinates?: { lat: number; lng: number };
  openingStatus?: string;
  whyRecommended: string;
  isHiddenGem: boolean;
  hiddenGemScore: number;
  source: DataSource;
};

export type ItineraryDay = {
  id: string;
  date: string;
  theme: string;
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  placesIncluded: string[];
  restaurantIdeas: string[];
  hiddenGem: string;
  estimatedCost: number;
  transportNotes: string;
  backupOption: string;
  notes: string;
};

export type BudgetCategory = {
  name: string;
  estimated: number;
  actual: number;
};

export type Booking = {
  type: string;
  title: string;
  provider?: string;
  confirmationNumber?: string;
  time?: string;
  link?: string;
  notes?: string;
};

export type FlightSearchParams = {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  cabinClass?: string;
};

export type FlightResult = {
  airline: string;
  estimatedPrice: number;
  duration: string;
  stops: number;
  bookingLink?: string;
  source: DataSource;
};

export type HotelSearchParams = {
  destination: string;
  startDate: string;
  endDate: string;
  guests: number;
  budgetLevel: string;
};

export type HotelResult = {
  name: string;
  area: string;
  rating: number;
  estimatedPricePerNight: number;
  amenities: string[];
  bookingLink?: string;
  source: DataSource;
};

```

## `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function providerLabel(isMock: boolean) {
  return isMock ? "Not connected" : "Live data";
}

```

## `src/app/api/activities/search/route.ts`

```ts
import { NextResponse } from "next/server";
import { searchActivities } from "@/lib/api/activitiesService";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trip = await getPrimaryTrip();
  const destination =
    searchParams.get("destination") ||
    [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");

  if (!destination) {
    return NextResponse.json({ ok: false, data: [], message: "Create a trip or provide a destination." }, { status: 400 });
  }

  try {
    const data = await searchActivities({
      destination,
      startDate: searchParams.get("startDate") || trip?.startDate.toISOString().slice(0, 10),
      endDate: searchParams.get("endDate") || trip?.endDate.toISOString().slice(0, 10),
      currency: searchParams.get("currency") || "USD",
      limit: Number(searchParams.get("limit") ?? 8),
    });

    return NextResponse.json({
      ok: true,
      data,
      source: data.length ? "getyourguide" : "not-configured",
      message: data.length ? "Live GetYourGuide activities loaded." : "GetYourGuide API key is not configured.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        data: [],
        source: "getyourguide",
        message: error instanceof Error ? error.message : "GetYourGuide activity search failed.",
      },
      { status: 502 },
    );
  }
}

```

## `src/app/api/ai/adjust-day/route.ts`

```ts
import { NextResponse } from "next/server";
import { regenerateOneDay } from "@/lib/ai/openai";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.day) return NextResponse.json({ suggestion: "", isMock: true, raw: "No itinerary day provided." }, { status: 400 });
  const result = await regenerateOneDay(body.day, body.instruction ?? "Make today easier.");
  const suggestion = [
    result.data?.theme ? `Theme: ${result.data.theme}` : "",
    result.data?.morningPlan ? `Morning: ${result.data.morningPlan}` : "",
    result.data?.afternoonPlan ? `Afternoon: ${result.data.afternoonPlan}` : "",
    result.data?.eveningPlan ? `Evening: ${result.data.eveningPlan}` : "",
    result.data?.backupOption ? `Backup: ${result.data.backupOption}` : "",
  ].filter(Boolean).join("\n\n");
  return NextResponse.json({ ...result, suggestion });
}

```

## `src/app/api/ai/destinations/route.ts`

```ts
import { NextResponse } from "next/server";
import { recommendDestinations } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ data: [], isMock: true, raw: "No trip found." }, { status: 404 });
  const body = await request.json().catch(() => toTripDraft(trip));
  const tripDraft = { ...toTripDraft(trip), ...body };
  const result = await recommendDestinations(tripDraft);

  if (url.searchParams.get("save") === "true" && trip) {
    await prisma.destinationRecommendation.deleteMany({ where: { tripId: trip.id } });
    await prisma.destinationRecommendation.createMany({
      data: result.data.map((destination) => ({
        tripId: trip.id,
        name: destination.name,
        country: destination.country,
        whyItMatches: destination.whyItMatches,
        bestThingsToDo: destination.bestThingsToDo.join(", "),
        estimatedCost: destination.estimatedCost,
        weatherSummary: destination.weatherSummary,
        flightEstimate: destination.flightEstimate,
        hotelEstimate: destination.hotelEstimate,
        pros: destination.pros.join(", "),
        cons: destination.cons.join(", "),
        bestFor: destination.bestFor.join(", "),
        suggestedTripDuration: destination.suggestedTripDuration,
        confidenceScore: destination.confidenceScore,
        source: result.isMock ? "not-connected" : "openai",
      })),
    });
  }

  return NextResponse.json(result);
}

```

## `src/app/api/ai/itinerary/route.ts`

```ts
import { NextResponse } from "next/server";
import { generateFullItinerary } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toPlaceRecommendations, toSelectedPlaceRecommendations, toTripDraft } from "@/lib/db/travel";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ data: [], isMock: true, raw: "No trip found." }, { status: 404 });
  const tripDraft = toTripDraft(trip);
  const selectedPlaces = toSelectedPlaceRecommendations(trip);
  const planningPlaces = selectedPlaces.length ? selectedPlaces : toPlaceRecommendations(trip);
  const requestedSelection = Array.isArray(body.selectedPlaceIds) ? body.selectedPlaceIds.map(String).sort() : null;
  const activeTripDraft = { ...tripDraft, ...body.trip };
  const result = await generateFullItinerary(activeTripDraft, body.places ?? planningPlaces);
  const generatedDays = distributePlanningPlaces(result.data, planningPlaces.map((place) => place.name));
  if (body.save && trip) {
    if (requestedSelection) {
      const currentSelection = await prisma.savedPlace.findMany({
        where: { tripId: trip.id },
        select: { id: true, placeRecommendationId: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });
      const currentSelectionIds = currentSelection.map((place) => place.placeRecommendationId ?? place.id).sort();
      if (currentSelectionIds.join("|") !== requestedSelection.join("|")) {
        return NextResponse.json(
          {
            data: [],
            isMock: true,
            raw: "Selected places changed while the itinerary was generating.",
            message: "Selected places changed. Generate again when your selection is final.",
          },
          { status: 409 },
        );
      }
    }

    await prisma.itineraryDay.deleteMany({ where: { tripId: trip.id } });
    for (const [dayIndex, day] of generatedDays.entries()) {
      const createdDay = await prisma.itineraryDay.create({
        data: {
        tripId: trip.id,
        date: new Date(`${day.date}T12:00:00.000Z`),
        theme: day.theme,
        morningPlan: day.morningPlan,
        afternoonPlan: day.afternoonPlan,
        eveningPlan: day.eveningPlan,
        restaurantIdeas: day.restaurantIdeas.join(", "),
        hiddenGem: day.hiddenGem,
        estimatedCost: estimateDayCost(day, activeTripDraft, planningPlaces),
        transportNotes: day.transportNotes,
        backupOption: day.backupOption,
        notes: day.notes,
        },
      });

      const includedPlaces = day.placesIncluded;
      if (includedPlaces.length) {
        await prisma.itineraryItem.createMany({
          data: includedPlaces.map((placeName, index) => {
            const matchedPlace = planningPlaces.find((place) => normalizeName(place.name) === normalizeName(placeName));
            const persistedPlace = trip.placeRecommendations.find((place) => normalizeName(place.name) === normalizeName(matchedPlace?.name ?? placeName));
            return {
              itineraryDayId: createdDay.id,
              placeRecommendationId: persistedPlace?.id ?? null,
              title: matchedPlace?.name ?? placeName,
              timeOfDay: index === 0 ? "morning" : index === 1 ? "afternoon" : index === 2 ? "evening" : `day-${dayIndex + 1}`,
              description: matchedPlace?.whyRecommended ?? "Included in the generated itinerary.",
              estimatedCost: matchedPlace ? estimatePlaceCost(matchedPlace, activeTripDraft.travelerCount) : estimateTextCost(placeName, activeTripDraft.travelerCount),
              sortOrder: index + 1,
            };
          }),
        });
      }
    }
  }
  return NextResponse.json({ ...result, data: generatedDays });
}

function estimateDayCost(
  day: { estimatedCost: number; placesIncluded: string[] },
  trip: { travelerCount: number; budget: number; startDate: string; endDate: string },
  places: { name: string; costLevel: string; category: string }[],
) {
  if (day.estimatedCost > 0) return day.estimatedCost;
  const travelerCount = Math.max(1, trip.travelerCount);
  const dayCount = tripLength(trip.startDate, trip.endDate);
  const dailyBudget = trip.budget > 0 ? trip.budget / dayCount : 0;
  const included = new Set(day.placesIncluded.map(normalizeName));
  const placeCost = places
    .filter((place) => included.has(normalizeName(place.name)))
    .reduce((sum, place) => sum + estimatePlaceCost(place, travelerCount), 0);
  return Math.max(45 * travelerCount, Math.round(Math.max(placeCost + 70 * travelerCount, dailyBudget * 0.38) / 5) * 5);
}

function estimatePlaceCost(place: { costLevel: string; category: string }, travelerCount: number) {
  const baseByLevel: Record<string, number> = {
    "$": 12,
    "$$": 32,
    "$$$": 68,
    "$$$$": 125,
  };
  const base = baseByLevel[place.costLevel] ?? 28;
  const categoryFactor = /restaurant|cafe|tour|activity|museum|club|spa/i.test(place.category) ? 1 : 0.6;
  return Math.max(0, Math.round(base * categoryFactor * Math.max(1, travelerCount)));
}

function estimateTextCost(placeName: string, travelerCount: number) {
  const isFreeLean = /walk|view|park|beach|market|neighborhood|village/i.test(placeName);
  return Math.round((isFreeLean ? 10 : 28) * Math.max(1, travelerCount));
}

function tripLength(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T12:00:00.000Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 4;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function inferPlacesFromDay(day: { morningPlan: string; afternoonPlan: string; eveningPlan: string }, placeNames: string[]) {
  const dayText = `${day.morningPlan} ${day.afternoonPlan} ${day.eveningPlan}`.toLowerCase();
  return placeNames.filter((placeName) => dayText.includes(placeName.toLowerCase())).slice(0, 6);
}

function distributePlanningPlaces<T extends { placesIncluded: string[]; morningPlan: string; afternoonPlan: string; eveningPlan: string }>(days: T[], placeNames: string[]) {
  if (!days.length || !placeNames.length) return days;

  const dayPlaceNames = days.map((day) => uniqueNames([...day.placesIncluded, ...inferPlacesFromDay(day, placeNames)]));
  const assigned = new Set(dayPlaceNames.flat().map(normalizeName));
  const unassigned = placeNames.filter((placeName) => !assigned.has(normalizeName(placeName)));

  unassigned.forEach((placeName, index) => {
    const targetIndex = days.length > 1 ? Math.min(index + 1, days.length - 1) : 0;
    dayPlaceNames[targetIndex] = uniqueNames([...dayPlaceNames[targetIndex], placeName]);
  });

  return days.map((day, index) => ({ ...day, placesIncluded: dayPlaceNames[index] }));
}

function uniqueNames(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalizeName(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

```

## `src/app/api/ai/packing/route.ts`

```ts
import { NextResponse } from "next/server";
import { generatePackingList } from "@/lib/ai/openai";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ data: [], isMock: true, raw: "No trip found." }, { status: 404 });
  const tripDraft = toTripDraft(trip);
  const weather = await getWeatherSummary(tripDraft.destination ?? "");
  const fallback = {
    data: [],
    isMock: true,
    raw: "OpenAI request timed out.",
  };
  const result = await withTimeout(
    generatePackingList({
    ...tripDraft,
    notes: `${tripDraft.notes ?? ""}\nWeather: ${weather.summary}; ${weather.temperatureRange}; rain risk ${weather.rainRisk}`,
    }),
    fallback,
    12000,
  );
  return NextResponse.json({ ...result, weather });
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

```

## `src/app/api/ai/summary/route.ts`

```ts
import { NextResponse } from "next/server";
import { generateTripSummary } from "@/lib/ai/openai";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  const notes = trip?.memories.length
    ? trip.memories
        .map((memory) =>
          [
            memory.title,
            memory.favoriteMoments,
            memory.placesVisited,
            memory.favoriteRestaurants,
            memory.favoriteHiddenGems,
            memory.placesToRevisit,
            memory.nextTime,
            memory.notes,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "No saved memories yet. Create a gentle starter summary for a personal vacation journal.";

  const result = await withTimeout(
    generateTripSummary(notes),
    {
      data: {
        summary: "",
        revisit: [],
        nextTime: [],
      },
      isMock: true,
      raw: "OpenAI request timed out.",
    },
    12000,
  );

  return NextResponse.json(result);
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

```

## `src/app/api/currency/route.ts`

```ts
import { NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/api/currencyService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? "USD";
  const quote = searchParams.get("quote") ?? "EUR";
  const rate = await getExchangeRate(base, quote);
  return NextResponse.json(rate);
}

```

## `src/app/api/gmail/callback/route.ts`

```ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/api/gmailService";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToImports(request.url, "invalid-state");
  }

  try {
    await exchangeGmailCode(code);
    const response = redirectToImports(request.url, "connected");
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (error) {
    console.error("Gmail OAuth callback failed", error);
    return redirectToImports(request.url, "connect-failed");
  }
}

function redirectToImports(requestUrl: string, status: string) {
  const url = new URL("/imports", requestUrl);
  url.searchParams.set("gmail", status);
  return NextResponse.redirect(url);
}

```

## `src/app/api/gmail/connect/route.ts`

```ts
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getGmailAuthorizationUrl } from "@/lib/api/gmailService";

export async function GET() {
  const state = randomBytes(24).toString("hex");
  const authorizationUrl = getGmailAuthorizationUrl(state);
  if (!authorizationUrl) {
    return NextResponse.redirect(new URL("/imports?gmail=missing-config", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}

```

## `src/app/api/gmail/disconnect/route.ts`

```ts
import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/api/gmailService";

export async function POST() {
  await disconnectGmail();
  return NextResponse.json({ ok: true });
}

```

## `src/app/api/imports/gmail/route.ts`

```ts
import { NextResponse } from "next/server";
import { searchTravelEmailsFromGmail } from "@/lib/api/gmailService";
import { parseManyTravelEmails } from "@/lib/imports/travelEmailParser";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : undefined;
  const maxResults = typeof body.maxResults === "number" ? body.maxResults : 10;

  try {
    const emails = await searchTravelEmailsFromGmail({ query, maxResults });
    const parsed = parseManyTravelEmails(emails);
    return NextResponse.json({ ok: true, data: parsed, scanned: emails.length });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not scan Gmail.",
    }, { status: 400 });
  }
}

```

## `src/app/api/imports/preview/route.ts`

```ts
import { NextResponse } from "next/server";
import { getGmailConnectionStatus } from "@/lib/api/gmailService";
import { parseManyTravelEmails, type RawEmailForImport } from "@/lib/imports/travelEmailParser";

export async function GET() {
  return NextResponse.json(await getGmailConnectionStatus());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const emails = normalizeInput(body);
  const parsed = parseManyTravelEmails(emails);
  return NextResponse.json({ ok: true, data: parsed });
}

function normalizeInput(body: Record<string, unknown>): RawEmailForImport[] {
  if (Array.isArray(body.emails)) {
    const emails: RawEmailForImport[] = [];
    body.emails
      .map((email) => {
        if (!email || typeof email !== "object") return null;
        const value = email as Record<string, unknown>;
        return {
          id: typeof value.id === "string" ? value.id : undefined,
          threadId: typeof value.threadId === "string" ? value.threadId : undefined,
          from: typeof value.from === "string" ? value.from : undefined,
          subject: typeof value.subject === "string" ? value.subject : undefined,
          body: typeof value.body === "string" ? value.body : "",
        };
      })
      .forEach((email) => {
        if (email?.body) emails.push(email);
      });
    return emails;
  }

  const bodyText = typeof body.body === "string" ? body.body : "";
  const from = typeof body.from === "string" ? body.from : undefined;
  const subject = typeof body.subject === "string" ? body.subject : undefined;
  const id = typeof body.id === "string" ? body.id : undefined;
  const threadId = typeof body.threadId === "string" ? body.threadId : undefined;
  if (!bodyText) return [];
  return [{ id, threadId, from, subject, body: bodyText }];
}

```

## `src/app/api/imports/save/route.ts`

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, parseDateField } from "@/lib/db/travel";
import type { ParsedTravelEmail } from "@/lib/imports/travelEmailParser";

export async function POST(request: Request) {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "Create a trip before importing bookings." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const imports = Array.isArray(body.imports) ? body.imports : [];
  const selected = imports.filter(isParsedTravelEmail);
  if (!selected.length) {
    return NextResponse.json({ ok: false, message: "No valid parsed bookings selected." }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const seen = new Set<string>();

  for (const item of selected) {
    const fingerprint = importFingerprint(item);
    if (seen.has(fingerprint)) {
      skipped += 1;
      continue;
    }
    seen.add(fingerprint);

    const duplicate = await findDuplicateImport(trip.id, item, fingerprint);
    if (duplicate) {
      skipped += 1;
      continue;
    }

    const importGroupId = `import:${fingerprint}`;
    const booking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          tripId: trip.id,
          type: item.bookingType,
          title: item.title,
          provider: item.provider,
          confirmationNumber: item.confirmationNumber,
          importGroupId,
          importFingerprint: fingerprint,
          sourceMessageId: item.sourceId,
          startAt: item.startDate ? parseDateField(item.startDate) : undefined,
          endAt: item.endDate ? parseDateField(item.endDate) : undefined,
          link: item.link,
          notes: bookingNotes(item),
        },
      });

      await tx.documentNote.create({
        data: {
          tripId: trip.id,
          type: "Imported confirmation",
          title: `${item.provider} confirmation - ${item.title}`,
          content: documentContent(item),
          link: item.link,
          importGroupId,
          importFingerprint: fingerprint,
          sourceMessageId: item.sourceId,
        },
      });

      return createdBooking;
    });
    imported += 1;

    await prisma.apiProviderLog.create({
      data: {
        tripId: trip.id,
        userId: trip.userId,
        provider: "gmail-import",
        endpoint: "imports:save",
        status: "success",
        usedMock: false,
        message: `Imported ${booking.title} from ${item.provider}.`,
      },
    });
  }

  return NextResponse.json({ ok: true, count: imported, skipped });
}

function isParsedTravelEmail(value: unknown): value is ParsedTravelEmail {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.title === "string" && typeof record.provider === "string" && typeof record.bookingType === "string";
}

async function findDuplicateImport(tripId: string, item: ParsedTravelEmail, fingerprint: string) {
  return prisma.booking.findFirst({
    where: {
      tripId,
      OR: [
        { importFingerprint: fingerprint },
        ...(item.sourceId ? [{ sourceMessageId: item.sourceId }] : []),
        ...(item.confirmationNumber
          ? [{ provider: item.provider, confirmationNumber: item.confirmationNumber }]
          : []),
      ],
    },
    select: { id: true },
  });
}

function importFingerprint(item: ParsedTravelEmail) {
  return item.importFingerprint || [
    item.provider,
    item.bookingType,
    item.confirmationNumber || item.sourceId || item.sourceSubject || item.title,
    item.startDate ?? "",
    item.endDate ?? "",
  ].join("|").toLowerCase().replace(/[^a-z0-9|:-]+/g, "-").slice(0, 180);
}

function bookingNotes(item: ParsedTravelEmail) {
  return [
    item.address ? `Address: ${item.address}` : "",
    item.price ? `Price: ${item.price}` : "",
    item.guestName ? `Guest: ${item.guestName}` : "",
    item.cancellationNotes ? `Cancellation: ${item.cancellationNotes}` : "",
    item.sourceSubject ? `Source subject: ${item.sourceSubject}` : "",
    item.sourceId ? `Gmail message: ${item.sourceId}` : "",
  ].filter(Boolean).join("\n");
}

function documentContent(item: ParsedTravelEmail) {
  return [
    `Provider: ${item.provider}`,
    `Type: ${item.bookingType}`,
    item.confirmationNumber ? `Confirmation: ${item.confirmationNumber}` : "",
    item.startDate ? `Start: ${item.startDate}` : "",
    item.endDate ? `End: ${item.endDate}` : "",
    item.address ? `Address: ${item.address}` : "",
    item.price ? `Price: ${item.price}` : "",
    item.cancellationNotes ? `Cancellation: ${item.cancellationNotes}` : "",
    item.sourceId ? `Gmail message: ${item.sourceId}` : "",
    `Import fingerprint: ${importFingerprint(item)}`,
    "",
    "Imported from email preview.",
    item.rawSnippet,
  ].filter(Boolean).join("\n");
}

```

## `src/app/api/integrations/status/route.ts`

```ts
import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/api/integrationStatus";

export async function GET() {
  const statuses = await getIntegrationStatuses();
  return NextResponse.json({ ok: true, data: statuses });
}

```

## `src/app/api/itinerary/day/route.ts`

```ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function POST() {
  const trip = await getPrimaryTrip();
  if (!trip) return NextResponse.json({ ok: false, message: "No trip found." }, { status: 404 });
  const latestDay = await prisma.itineraryDay.findFirst({
    where: { tripId: trip.id },
    orderBy: { date: "desc" },
  });
  const date = latestDay ? addDays(latestDay.date, 1) : trip.startDate;
  const dayNumber = trip.itineraryDays.length + 1;

  const day = await prisma.itineraryDay.create({
    data: {
      tripId: trip.id,
      date,
      theme: `Day ${dayNumber} plan`,
      morningPlan: "Add a morning idea or use AI to regenerate this day.",
      afternoonPlan: "Add an afternoon idea from Discover or your saved places.",
      eveningPlan: "Add dinner, sunset, or a low-effort evening plan.",
      restaurantIdeas: "",
      hiddenGem: "",
      estimatedCost: 0,
      transportNotes: "Add route notes after choosing places.",
      backupOption: "Keep one simple backup option for weather or low energy.",
      notes: "",
    },
  });

  revalidateItinerary();
  return NextResponse.json({ ok: true, data: serializeDay(day) });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return NextResponse.json({ ok: false, message: "Missing itinerary day id." }, { status: 400 });
  }

  const day = await prisma.itineraryDay.update({
    where: { id: String(body.id) },
    data: {
      theme: String(body.theme ?? ""),
      morningPlan: String(body.morningPlan ?? ""),
      afternoonPlan: String(body.afternoonPlan ?? ""),
      eveningPlan: String(body.eveningPlan ?? ""),
      restaurantIdeas: Array.isArray(body.restaurantIdeas) ? body.restaurantIdeas.join(", ") : String(body.restaurantIdeas ?? ""),
      hiddenGem: String(body.hiddenGem ?? ""),
      estimatedCost: Number(body.estimatedCost ?? 0),
      transportNotes: String(body.transportNotes ?? ""),
      backupOption: String(body.backupOption ?? ""),
      notes: String(body.notes ?? ""),
    },
  });

  revalidateItinerary();

  return NextResponse.json({ ok: true, data: serializeDay(day) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Missing itinerary day id." }, { status: 400 });
  await prisma.itineraryDay.delete({ where: { id } });
  revalidateItinerary();
  return NextResponse.json({ ok: true });
}

function splitList(value?: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function serializeDay(day: {
  id: string;
  date: Date;
  theme: string;
  morningPlan: string;
  afternoonPlan: string;
  eveningPlan: string;
  restaurantIdeas?: string | null;
  hiddenGem?: string | null;
  estimatedCost: number;
  transportNotes?: string | null;
  backupOption?: string | null;
  notes?: string | null;
}) {
  return {
    id: day.id,
    date: day.date.toISOString().slice(0, 10),
    theme: day.theme,
    morningPlan: day.morningPlan,
    afternoonPlan: day.afternoonPlan,
    eveningPlan: day.eveningPlan,
    restaurantIdeas: splitList(day.restaurantIdeas),
    hiddenGem: day.hiddenGem ?? "",
    estimatedCost: day.estimatedCost,
    transportNotes: day.transportNotes ?? "",
    backupOption: day.backupOption ?? "",
    notes: day.notes ?? "",
    placesIncluded: [],
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function revalidateItinerary() {
  revalidatePath("/");
  revalidatePath("/itinerary");
  revalidatePath("/today");
  revalidatePath("/map");
}

```

## `src/app/api/maps/static/route.ts`

```ts
import { NextResponse } from "next/server";
import { buildStaticMapUrl, getMapRoute } from "@/lib/api/mapsService";
import { getPrimaryTrip, toPlaceRecommendations } from "@/lib/db/travel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("width") ?? 920);
  const height = Number(searchParams.get("height") ?? 540);
  const markers = searchParams.get("markers") !== "false";
  const routePath = searchParams.get("route") !== "false";
  const zoomParam = Number(searchParams.get("zoom"));
  const trip = await getPrimaryTrip();
  const places = trip ? toPlaceRecommendations(trip) : [];
  const route = await getMapRoute(places);
  const zoom = Number.isFinite(zoomParam) ? Math.min(18, Math.max(3, Math.round(zoomParam))) : undefined;
  const url = buildStaticMapUrl(route, `${Math.min(width, 1200)}x${Math.min(height, 1200)}`, { markers, routePath, zoom });

  if (!url) {
    return NextResponse.json({ ok: false, message: "No map key or pins available." }, { status: 404 });
  }

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });
  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: "Google Maps Static API is unavailable or not enabled for this key." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

```

## `src/app/api/places/refresh/route.ts`

```ts
import { NextResponse } from "next/server";
import { getPlacesForTrip } from "@/lib/api/placesService";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip, toTripDraft } from "@/lib/db/travel";

export async function POST() {
  const trip = await getPrimaryTrip();
  if (!trip) {
    return NextResponse.json({ ok: false, message: "No trip found." }, { status: 404 });
  }

  const places = await getPlacesForTrip(toTripDraft(trip));
  await prisma.placeRecommendation.deleteMany({ where: { tripId: trip.id } });
  await prisma.placeRecommendation.createMany({
    data: places.map((place) => ({
      tripId: trip.id,
      name: place.name,
      category: place.category,
      description: place.description,
      rating: place.rating,
      costLevel: place.costLevel,
      location: place.location,
      latitude: place.coordinates?.lat,
      longitude: place.coordinates?.lng,
      openingStatus: place.openingStatus,
      whyRecommended: place.whyRecommended,
      hiddenGemScore: place.hiddenGemScore,
      isHiddenGem: place.isHiddenGem,
      source: place.source.provider,
    })),
  });

  await prisma.apiProviderLog.create({
    data: {
      tripId: trip.id,
      userId: trip.userId,
      provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
      endpoint: "places:searchText",
      status: "success",
      usedMock: !process.env.GOOGLE_PLACES_API_KEY,
      message: `Stored ${places.length} place recommendations.`,
    },
  });

  return NextResponse.json({
    ok: true,
    count: places.length,
    provider: process.env.GOOGLE_PLACES_API_KEY ? "google-places" : "not-connected",
  });
}

```

## `src/app/api/weather/route.ts`

```ts
import { NextResponse } from "next/server";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  const destination = [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");
  const weather = await getWeatherSummary(destination);
  return NextResponse.json(weather);
}

```

