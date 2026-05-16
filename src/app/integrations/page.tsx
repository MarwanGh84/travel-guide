import { IntegrationsWorkspace } from "@/components/travel/integrations-workspace";
import { getIntegrationStatuses } from "@/lib/api/integrationStatus";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const statuses = await getIntegrationStatuses();
  return <IntegrationsWorkspace statuses={statuses} />;
}
