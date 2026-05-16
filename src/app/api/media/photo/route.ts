import { NextResponse } from "next/server";

type GooglePhotoPlace = {
  photos?: Array<{ name?: string }>;
};

type GooglePhotoSearchResponse = {
  places?: GooglePhotoPlace[];
};

const photoSearchFieldMask = "places.photos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const width = clampDimension(searchParams.get("width"), 900);
  const height = clampDimension(searchParams.get("height"), 600);
  const key = process.env.GOOGLE_PLACES_API_KEY;

  if (!query || !key) {
    return NextResponse.json({ ok: false, message: "Photo query or Google Places key missing." }, { status: 404 });
  }

  const searchResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": photoSearchFieldMask,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      languageCode: "en",
    }),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!searchResponse.ok) {
    return NextResponse.json({ ok: false, message: "Could not search Google Places photos." }, { status: searchResponse.status });
  }

  const searchData = (await searchResponse.json()) as GooglePhotoSearchResponse;
  const photoName = searchData.places?.[0]?.photos?.[0]?.name;
  if (!photoName) {
    return NextResponse.json({ ok: false, message: "No place photo found." }, { status: 404 });
  }

  const mediaResponse = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?key=${key}&maxWidthPx=${width}&maxHeightPx=${height}`,
    { next: { revalidate: 60 * 60 * 24 } },
  );

  if (!mediaResponse.ok) {
    return NextResponse.json({ ok: false, message: "Could not load place photo." }, { status: mediaResponse.status });
  }

  return new NextResponse(mediaResponse.body, {
    headers: {
      "Content-Type": mediaResponse.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function clampDimension(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(1600, Math.round(parsed)));
}
