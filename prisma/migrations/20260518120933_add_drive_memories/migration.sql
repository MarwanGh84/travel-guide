-- CreateTable
CREATE TABLE "TripMemorySource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "folderName" TEXT,
    "folderUrl" TEXT NOT NULL,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripMemorySource_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemoryAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerFileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "thumbnailLink" TEXT,
    "webViewLink" TEXT,
    "webContentLink" TEXT,
    "sourceFolderId" TEXT NOT NULL,
    "createdTime" DATETIME,
    "modifiedTime" DATETIME,
    "size" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MemoryAsset_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TripMemorySource_tripId_provider_key" ON "TripMemorySource"("tripId", "provider");

-- CreateIndex
CREATE INDEX "MemoryAsset_tripId_sourceFolderId_idx" ON "MemoryAsset"("tripId", "sourceFolderId");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryAsset_provider_providerFileId_key" ON "MemoryAsset"("provider", "providerFileId");
