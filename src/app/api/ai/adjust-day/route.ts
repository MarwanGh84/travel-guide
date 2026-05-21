import { NextResponse } from "next/server";
import { regenerateOneDay } from "@/lib/ai/openai";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { day, instruction, save } = body;
  
  if (!day) return NextResponse.json({ suggestion: "", isMock: true, raw: "No itinerary day provided." }, { status: 400 });
  
  const result = await regenerateOneDay(day, instruction ?? "Make today easier.");
  
  if (save && result.ok && result.data) {
    await prisma.itineraryDay.update({
      where: { id: day.id },
      data: {
        theme: result.data.theme,
        morningPlan: result.data.morningPlan,
        afternoonPlan: result.data.afternoonPlan,
        eveningPlan: result.data.eveningPlan,
        estimatedCost: result.data.estimatedCost,
        transportNotes: result.data.transportNotes ?? "",
        backupOption: result.data.backupOption ?? "",
        notes: result.data.notes ?? "",
        items: { deleteMany: {} }, // Clear old tactical points as the plan context has changed
      },
    });
    revalidatePath("/itinerary");
  }

  const suggestion = [
    result.data?.theme ? `Theme: ${result.data.theme}` : "",
    result.data?.morningPlan ? `Morning: ${result.data.morningPlan}` : "",
    result.data?.afternoonPlan ? `Afternoon: ${result.data.afternoonPlan}` : "",
    result.data?.eveningPlan ? `Evening: ${result.data.eveningPlan}` : "",
    result.data?.backupOption ? `Backup: ${result.data.backupOption}` : "",
  ].filter(Boolean).join("\n\n");

  return NextResponse.json({ ...result, suggestion });
}
