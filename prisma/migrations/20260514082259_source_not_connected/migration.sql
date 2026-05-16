-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DestinationRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "whyItMatches" TEXT NOT NULL,
    "bestThingsToDo" TEXT NOT NULL,
    "estimatedCost" REAL NOT NULL,
    "weatherSummary" TEXT NOT NULL,
    "flightEstimate" TEXT,
    "hotelEstimate" TEXT,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "bestFor" TEXT NOT NULL,
    "suggestedTripDuration" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'not-connected',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DestinationRecommendation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DestinationRecommendation" ("bestFor", "bestThingsToDo", "confidenceScore", "cons", "country", "createdAt", "estimatedCost", "flightEstimate", "hotelEstimate", "id", "name", "pros", "source", "suggestedTripDuration", "tripId", "weatherSummary", "whyItMatches") SELECT "bestFor", "bestThingsToDo", "confidenceScore", "cons", "country", "createdAt", "estimatedCost", "flightEstimate", "hotelEstimate", "id", "name", "pros", "source", "suggestedTripDuration", "tripId", "weatherSummary", "whyItMatches" FROM "DestinationRecommendation";
DROP TABLE "DestinationRecommendation";
ALTER TABLE "new_DestinationRecommendation" RENAME TO "DestinationRecommendation";
CREATE TABLE "new_PlaceRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" REAL,
    "costLevel" TEXT,
    "location" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "openingStatus" TEXT,
    "whyRecommended" TEXT NOT NULL,
    "hiddenGemScore" INTEGER NOT NULL DEFAULT 0,
    "isHiddenGem" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'not-connected',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaceRecommendation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlaceRecommendation" ("category", "costLevel", "createdAt", "description", "hiddenGemScore", "id", "isHiddenGem", "latitude", "location", "longitude", "name", "openingStatus", "rating", "source", "tripId", "whyRecommended") SELECT "category", "costLevel", "createdAt", "description", "hiddenGemScore", "id", "isHiddenGem", "latitude", "location", "longitude", "name", "openingStatus", "rating", "source", "tripId", "whyRecommended" FROM "PlaceRecommendation";
DROP TABLE "PlaceRecommendation";
ALTER TABLE "new_PlaceRecommendation" RENAME TO "PlaceRecommendation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
