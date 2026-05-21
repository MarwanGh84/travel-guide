-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DocumentNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "documentType" TEXT,
    "expiryDate" DATETIME,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "travelerName" TEXT,
    "issuingCountry" TEXT,
    "importGroupId" TEXT,
    "importFingerprint" TEXT,
    "sourceMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentNote_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DocumentNote" ("content", "createdAt", "id", "importFingerprint", "importGroupId", "link", "sourceMessageId", "title", "tripId", "type") SELECT "content", "createdAt", "id", "importFingerprint", "importGroupId", "link", "sourceMessageId", "title", "tripId", "type" FROM "DocumentNote";
DROP TABLE "DocumentNote";
ALTER TABLE "new_DocumentNote" RENAME TO "DocumentNote";
CREATE INDEX "DocumentNote_tripId_importFingerprint_idx" ON "DocumentNote"("tripId", "importFingerprint");
CREATE INDEX "DocumentNote_tripId_importGroupId_idx" ON "DocumentNote"("tripId", "importGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
