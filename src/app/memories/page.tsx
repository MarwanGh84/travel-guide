import { MemoriesWorkspace } from "@/components/travel/memories-workspace";
import { getPrimaryTrip, getOrCreateUser } from "@/lib/db/travel";
import { getGmailConnectionStatus } from "@/lib/api/gmailService";
import { DRIVE_READ_SCOPE, hasGoogleScope } from "@/lib/api/gmailService";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ drive?: string }>;
}) {
  const trip = await getPrimaryTrip();
  const user = await getOrCreateUser();
  const google = await getGmailConnectionStatus();
  const params = await searchParams;

  const memorySources = await (prisma as any).driveMemorySource?.findMany({
    where: { userId: user.id, provider: "google-drive" },
  }) ?? [];
  const memoryAssets = await (prisma as any).driveMemoryAsset?.findMany({
    where: { userId: user.id, provider: "google-drive" },
  }) ?? [];

  return (
    <MemoriesWorkspace
      memories={trip?.memories ?? []}
      tripName={trip?.destination || "Global"}
      memorySources={memorySources}
      memoryAssets={memoryAssets}
      driveState={{
        connected: google.connected,
        configured: google.configured,
        hasDriveScope: hasGoogleScope(DRIVE_READ_SCOPE, await getGoogleScope(user.id)),
        status: params.drive,
      }}
    />
  );
}

async function getGoogleScope(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  const account = await prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId, provider: "gmail" } },
    select: { scope: true },
  });
  return account?.scope;
}
