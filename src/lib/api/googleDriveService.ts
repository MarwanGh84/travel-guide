import { prisma } from "@/lib/db/prisma";
import { getUsableGoogleAccessToken, DRIVE_READ_SCOPE } from "@/lib/api/gmailService";

export const ALLOWED_DRIVE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
]);

export type GoogleDriveFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
};

type GoogleDriveListResponse = {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
};

export function extractDriveFolderId(input: string) {
  const value = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (!["drive.google.com", "docs.google.com"].includes(url.hostname)) return null;
    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return folderMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function filterAllowedDriveFiles(files: GoogleDriveFile[]) {
  return files.filter((file) => {
    const mimeType = file.mimeType ?? "";
    return mimeType.startsWith("image/") || mimeType.startsWith("video/") || ALLOWED_DRIVE_MIME_TYPES.has(mimeType);
  });
}

export function normalizeDriveFile(file: GoogleDriveFile) {
  if (!file.id || !file.name || !file.mimeType) return null;
  return {
    provider: "google-drive",
    providerFileId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    thumbnailLink: file.thumbnailLink ?? null,
    webViewLink: file.webViewLink ?? null,
    webContentLink: file.webContentLink ?? null,
    createdTime: parseOptionalDate(file.createdTime),
    modifiedTime: parseOptionalDate(file.modifiedTime),
    size: file.size ?? null,
  };
}

export async function getDriveFolderMetadata(folderId: string) {
  const token = await getUsableGoogleAccessToken(DRIVE_READ_SCOPE);
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${folderId}`);
  url.searchParams.set("fields", "id,name,webViewLink");
  url.searchParams.set("supportsAllDrives", "true");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Could not access Drive folder.");
  return data as { id: string; name?: string; webViewLink?: string };
}

export async function listFolderFiles(folderId: string) {
  const token = await getUsableGoogleAccessToken(DRIVE_READ_SCOPE);
  const files: GoogleDriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime,modifiedTime,size)");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? "Could not list Drive files.");

    const page = data as GoogleDriveListResponse;
    files.push(...(page.files ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return filterAllowedDriveFiles(files);
}

export function isPreviewableDriveImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export async function fetchDriveThumbnail(thumbnailLink: string) {
  const token = await getUsableGoogleAccessToken(DRIVE_READ_SCOPE);
  return fetch(thumbnailLink, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchDriveFileContent(fileId: string) {
  const token = await getUsableGoogleAccessToken(DRIVE_READ_SCOPE);
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function syncGlobalMemoryFolder(userId: string, folderId: string) {
  const files = await listFolderFiles(folderId);
  const normalized = files.map(normalizeDriveFile).filter((file): file is NonNullable<typeof file> => Boolean(file));
  
  const source = await prisma.driveMemorySource.findUnique({
    where: { userId_provider_folderId: { userId, provider: "google-drive", folderId } },
    select: { id: true },
  });
  if (!source) throw new Error("Memory source not found for this user.");

  await prisma.$transaction(async (tx) => {
    await tx.driveMemoryAsset.deleteMany({ where: { userId, provider: "google-drive", sourceFolderId: folderId } });
    for (const file of normalized) {
      await tx.driveMemoryAsset.upsert({
        where: { provider_providerFileId: { provider: "google-drive", providerFileId: file.providerFileId } },
        update: {
          ...file,
          userId,
          sourceId: source.id,
          sourceFolderId: folderId,
        },
        create: {
          ...file,
          userId,
          sourceId: source.id,
          sourceFolderId: folderId,
        },
      });
    }
    await tx.driveMemorySource.update({
      where: { id: source.id },
      data: { lastSyncedAt: new Date() },
    });
  });
  return normalized;
}

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
