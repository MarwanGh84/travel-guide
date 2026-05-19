/*
  Warnings:

  - You are about to drop the `MemoryAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TripMemorySource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MemoryAsset";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TripMemorySource";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DriveMemorySource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "folderName" TEXT,
    "folderUrl" TEXT NOT NULL,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DriveMemorySource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DriveMemoryAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
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
    CONSTRAINT "DriveMemoryAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DriveMemoryAsset_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DriveMemorySource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveMemorySource_userId_provider_folderId_key" ON "DriveMemorySource"("userId", "provider", "folderId");

-- CreateIndex
CREATE INDEX "DriveMemoryAsset_userId_sourceFolderId_idx" ON "DriveMemoryAsset"("userId", "sourceFolderId");

-- CreateIndex
CREATE INDEX "DriveMemoryAsset_sourceId_idx" ON "DriveMemoryAsset"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveMemoryAsset_provider_providerFileId_key" ON "DriveMemoryAsset"("provider", "providerFileId");
