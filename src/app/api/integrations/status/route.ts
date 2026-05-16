import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/api/integrationStatus";

export async function GET() {
  const statuses = await getIntegrationStatuses();
  return NextResponse.json({ ok: true, data: statuses });
}
