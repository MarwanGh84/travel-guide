import { NextResponse } from "next/server";
import { generateTripSummary } from "@/lib/ai/openai";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET() {
  const trip = await getPrimaryTrip();
  const notes = trip?.memories.length
    ? trip.memories
        .map((memory) =>
          [
            memory.title,
            memory.favoriteMoments,
            memory.placesVisited,
            memory.favoriteRestaurants,
            memory.favoriteHiddenGems,
            memory.placesToRevisit,
            memory.nextTime,
            memory.notes,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "No saved memories yet. Create a gentle starter summary for a personal vacation journal.";

  const result = await withTimeout(
    generateTripSummary(notes),
    {
      ok: false,
      data: {
        summary: "",
        revisit: [],
        nextTime: [],
      },
      isMock: true,
      raw: "OpenAI request timed out.",
    },
    12000,
  );

  return NextResponse.json(result);
}

function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}
