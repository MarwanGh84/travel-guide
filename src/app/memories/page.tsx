import { MemoriesWorkspace } from "@/components/travel/memories-workspace";
import { getPrimaryTrip } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const trip = await getPrimaryTrip();
  return <MemoriesWorkspace memories={trip?.memories ?? []} tripName={trip?.destination || "Global"} />;
}
