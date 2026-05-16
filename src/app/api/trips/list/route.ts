import { NextResponse } from "next/server";
import { getUserTrips } from "@/lib/db/travel";

export async function GET() {
  try {
    const trips = await getUserTrips();
    return NextResponse.json({ ok: true, data: trips });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not fetch library." }, { status: 500 });
  }
}
