import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPrimaryTrip } from "@/lib/db/travel";
import { fetchDriveFileContent, isPreviewableDriveImage } from "@/lib/api/googleDriveService";

export async function GET(_request: Request, context: RouteContext<"/api/memories/assets/[assetId]/content">) {
  const { assetId } = await context.params;
  const asset = await getLinkedDriveAsset(assetId);

  if (!asset || !isPreviewableDriveImage(asset.mimeType)) {
    return NextResponse.json({ ok: false, message: "Image unavailable." }, { status: 404 });
  }

  try {
    const response = await fetchDriveFileContent(asset.providerFileId);
    if (!response.ok || !response.body) {
      return NextResponse.json({ ok: false, message: "Image unavailable." }, { status: response.status || 404 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? asset.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Reconnect Google to open images." }, { status: 403 });
  }
}

async function getLinkedDriveAsset(assetId: string) {
  const trip = await getPrimaryTrip();
  if (!trip) return null;
  return prisma.memoryAsset.findFirst({
    where: {
      id: assetId,
      tripId: trip.id,
      provider: "google-drive",
      sourceFolderId: {
        in: trip.memorySources.filter((item) => item.provider === "google-drive").map((item) => item.folderId),
      },
    },
  });
}
