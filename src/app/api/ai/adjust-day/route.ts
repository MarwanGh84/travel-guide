import { NextResponse } from "next/server";
import { regenerateOneDay } from "@/lib/ai/openai";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.day) return NextResponse.json({ suggestion: "", isMock: true, raw: "No itinerary day provided." }, { status: 400 });
  const result = await regenerateOneDay(body.day, body.instruction ?? "Make today easier.");
  const suggestion = [
    result.data?.theme ? `Theme: ${result.data.theme}` : "",
    result.data?.morningPlan ? `Morning: ${result.data.morningPlan}` : "",
    result.data?.afternoonPlan ? `Afternoon: ${result.data.afternoonPlan}` : "",
    result.data?.eveningPlan ? `Evening: ${result.data.eveningPlan}` : "",
    result.data?.backupOption ? `Backup: ${result.data.backupOption}` : "",
  ].filter(Boolean).join("\n\n");
  return NextResponse.json({ ...result, suggestion });
}
