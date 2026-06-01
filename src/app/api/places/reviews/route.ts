import { NextResponse } from "next/server";
import { getPlaceReviews } from "@/lib/api/placeReviewsService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const location = searchParams.get("location") ?? "";

  if (!name) {
    return NextResponse.json({ ok: false, note: "Missing place name.", reviews: [] }, { status: 400 });
  }

  const result = await getPlaceReviews(name, location);
  return NextResponse.json(result);
}
