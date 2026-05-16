-- CreateTable
CREATE TABLE "DestinationIntel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "overview" TEXT,
    "neighborhoods" TEXT,
    "culture" TEXT,
    "history" TEXT,
    "practicalNotes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'wikivoyage',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DestinationIntel_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationIntel_tripId_key" ON "DestinationIntel"("tripId");
