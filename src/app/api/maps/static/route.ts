import { NextResponse } from "next/server";
import { buildStaticMapUrl, getMapRoute } from "@/lib/api/mapsService";
import { getPrimaryTrip, toRoutePlaceRecommendations } from "@/lib/db/travel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const width = Number(searchParams.get("width") ?? 920);
  const height = Number(searchParams.get("height") ?? 540);
  const markers = searchParams.get("markers") !== "false";
  const routePath = searchParams.get("route") !== "false";
  const zoomParam = Number(searchParams.get("zoom"));
  const latParam = Number(searchParams.get("lat"));
  const lngParam = Number(searchParams.get("lng"));
  const trip = await getPrimaryTrip();
  const places = trip ? toRoutePlaceRecommendations(trip) : [];
  const route = await getMapRoute(places);
  const zoom = Number.isFinite(zoomParam) ? Math.min(18, Math.max(3, Math.round(zoomParam))) : undefined;
  const center = Number.isFinite(latParam) && Number.isFinite(lngParam)
    ? { lat: latParam, lng: lngParam }
    : undefined;
  const url = buildStaticMapUrl(route, `${Math.min(width, 1200)}x${Math.min(height, 1200)}`, { markers, routePath, zoom, center });

  if (!url) {
    return NextResponse.json({ ok: false, message: "No map key or pins available." }, { status: 404 });
  }

  let response = await fetch(url, { next: { revalidate: 60 * 60 * 6 } });

  // Google can reject a generated route overlay even when the base static map is valid.
  // Keep the map useful by retrying without the path layer before surfacing an error.
  if (!response.ok && routePath) {
    const fallbackUrl = buildStaticMapUrl(route, `${Math.min(width, 1200)}x${Math.min(height, 1200)}`, {
      markers,
      routePath: false,
      zoom,
      center,
    });
    if (fallbackUrl) {
      response = await fetch(fallbackUrl, { next: { revalidate: 60 * 60 * 6 } });
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: "Google Maps Static API is unavailable or not enabled for this key." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
