-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "importGroupId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "importFingerprint" TEXT;
ALTER TABLE "Booking" ADD COLUMN "sourceMessageId" TEXT;

-- AlterTable
ALTER TABLE "DocumentNote" ADD COLUMN "importGroupId" TEXT;
ALTER TABLE "DocumentNote" ADD COLUMN "importFingerprint" TEXT;
ALTER TABLE "DocumentNote" ADD COLUMN "sourceMessageId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_tripId_importFingerprint_idx" ON "Booking"("tripId", "importFingerprint");
CREATE INDEX "Booking_tripId_importGroupId_idx" ON "Booking"("tripId", "importGroupId");
CREATE INDEX "DocumentNote_tripId_importFingerprint_idx" ON "DocumentNote"("tripId", "importFingerprint");
CREATE INDEX "DocumentNote_tripId_importGroupId_idx" ON "DocumentNote"("tripId", "importGroupId");
