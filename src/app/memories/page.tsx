import { MemoriesWorkspace } from "@/components/travel/memories-workspace";
import { getPrimaryTrip } from "@/lib/db/travel";
import { getGmailConnectionStatus } from "@/lib/api/gmailService";
import { DRIVE_READ_SCOPE, hasGoogleScope } from "@/lib/api/gmailService";

export const dynamic = "force-dynamic";

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ drive?: string }>;
}) {
  const trip = await getPrimaryTrip();
  const google = await getGmailConnectionStatus();
  const params = await searchParams;
  return (
    <MemoriesWorkspace
      memories={trip?.memories ?? []}
      tripName={trip?.destination || "Global"}
      memorySources={trip?.memorySources.filter((source) => source.provider === "google-drive") ?? []}
      memoryAssets={trip?.memoryAssets.filter((asset) => asset.provider === "google-drive") ?? []}
      driveState={{
        connected: google.connected,
        configured: google.configured,
        hasDriveScope: hasGoogleScope(DRIVE_READ_SCOPE, await getGoogleScope()),
        status: params.drive,
      }}
    />
  );
}

async function getGoogleScope() {
  const { prisma } = await import("@/lib/db/prisma");
  const { getOrCreateUser } = await import("@/lib/db/travel");
  const user = await getOrCreateUser();
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId: user.id, provider: "gmail" } },
    select: { scope: true },
  });
  return account?.scope;
}
