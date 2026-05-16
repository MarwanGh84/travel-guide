import { DocumentsWorkspace } from "@/components/travel/documents-workspace";
import { getPrimaryTrip } from "@/lib/db/travel";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const trip = await getPrimaryTrip();
  const notes = trip?.documentNotes ?? [];

  return <DocumentsWorkspace notes={notes} tripName={trip?.destination || "Global"} />;
}
