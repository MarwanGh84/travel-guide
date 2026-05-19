DROP INDEX "TripMemorySource_tripId_provider_key";

CREATE UNIQUE INDEX "TripMemorySource_tripId_provider_folderId_key"
ON "TripMemorySource"("tripId", "provider", "folderId");
