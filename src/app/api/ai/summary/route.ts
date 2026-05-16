import { NextResponse } from "next/server";
import { generateTripSummary } from "@/lib/ai/openai";
import { getPrimaryTrip } from "@/lib/db/travel";
import { getWeatherSummary } from "@/lib/api/weatherService";
import { tripLength } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ai = searchParams.get("ai") === "true";
    
    const dbTrip = await getPrimaryTrip();
    if (!dbTrip) {
      return NextResponse.json({ ok: false, message: "No active trip." }, { status: 404 });
    }

    const weather = await getWeatherSummary([dbTrip.destination, dbTrip.destinationCountry].filter(Boolean).join(", "));
    
    const tripStatus = {
      id: dbTrip.id,
      name: dbTrip.name,
      destination: dbTrip.destination,
      country: dbTrip.destinationCountry,
      startDate: dbTrip.startDate.toISOString().slice(0, 10),
      endDate: dbTrip.endDate.toISOString().slice(0, 10),
      duration: tripLength(dbTrip.startDate, dbTrip.endDate),
      travelerCount: dbTrip.travelerCount,
      budget: dbTrip.budget,
      pace: dbTrip.pace,
      travelStyle: dbTrip.travelStyle,
      interests: dbTrip.interests,
      status: dbTrip.status,
      savedPlacesCount: dbTrip.savedPlaces.length,
      bookingCount: dbTrip.bookings.length,
      itineraryStatus: dbTrip.itineraryDays.length > 0 ? "Generated" : "Not generated",
      weather: weather.daily.length > 0 ? {
        temp: `${weather.daily[0].maxC}°`,
        label: weather.daily[0].label
      } : null
    };

    let aiData = null;
    if (ai) {
      const notes = dbTrip.memories.map(m => m.notes).filter(Boolean).join("\n") || "No notes yet.";
      const result = await generateTripSummary(notes);
      aiData = result.data;
    }

    return NextResponse.json({ 
      ok: true, 
      data: aiData,
      trip: tripStatus
    });
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      message: error instanceof Error ? error.message : "Telemetry failed." 
    }, { status: 500 });
  }
}
