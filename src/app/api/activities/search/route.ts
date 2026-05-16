import { NextResponse } from "next/server";
import { searchActivities } from "@/lib/api/activitiesService";
import { getPrimaryTrip } from "@/lib/db/travel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trip = await getPrimaryTrip();
  const destination =
    searchParams.get("destination") ||
    [trip?.destination, trip?.destinationCountry].filter(Boolean).join(", ");

  if (!destination) {
    return NextResponse.json({ ok: false, data: [], message: "Create a trip or provide a destination." }, { status: 400 });
  }

  try {
    const data = await searchActivities({
      destination,
      startDate: searchParams.get("startDate") || trip?.startDate.toISOString().slice(0, 10),
      endDate: searchParams.get("endDate") || trip?.endDate.toISOString().slice(0, 10),
      currency: searchParams.get("currency") || "USD",
      limit: Number(searchParams.get("limit") ?? 8),
    });

    return NextResponse.json({
      ok: true,
      data,
      source: data.length ? "getyourguide" : "not-configured",
      message: data.length ? "Live GetYourGuide activities loaded." : "GetYourGuide API key is not configured.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        data: [],
        source: "getyourguide",
        message: error instanceof Error ? error.message : "GetYourGuide activity search failed.",
      },
      { status: 502 },
    );
  }
}
