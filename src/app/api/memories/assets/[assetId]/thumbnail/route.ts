import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateUser } from "@/lib/db/travel";
import { fetchDriveThumbnail, isPreviewableDriveImage } from "@/lib/api/googleDriveService";

export async function GET(_request: Request, context: RouteContext<"/api/memories/assets/[assetId]/thumbnail">) {
  const { assetId } = await context.params;
  const asset = await getLinkedDriveAsset(assetId);

  if (!asset || !isPreviewableDriveImage(asset.mimeType) || !asset.thumbnailLink) {
    return NextResponse.json({ ok: false, message: "Thumbnail unavailable." }, { status: 404 });
  }

  try {
    const response = await fetchDriveThumbnail(asset.thumbnailLink);
    if (!response.ok || !response.body) {
      return NextResponse.json({ ok: false, message: "Thumbnail unavailable." }, { status: response.status || 404 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Reconnect Google to load thumbnails." }, { status: 403 });
  }
}

async function getLinkedDriveAsset(assetId: string) {
  const user = await getOrCreateUser();
  const sources = await prisma.driveMemorySource.findMany({
    where: { userId: user.id, provider: "google-drive" },
    select: { folderId: true },
  });
  const folderIds = sources.map(s => s.folderId);

  return prisma.driveMemoryAsset.findFirst({
    where: {
      id: assetId,
      userId: user.id,
      provider: "google-drive",
      sourceFolderId: { in: folderIds },
    },
  });
}
