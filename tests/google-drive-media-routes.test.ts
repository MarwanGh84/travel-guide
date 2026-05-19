import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const findMany = vi.fn();
const getOrCreateUser = vi.fn();
const fetchDriveThumbnail = vi.fn();
const fetchDriveFileContent = vi.fn();

vi.mock("../src/lib/db/prisma", () => ({
  prisma: {
    driveMemoryAsset: { findFirst },
    driveMemorySource: { findMany },
  },
}));

vi.mock("../src/lib/db/travel", () => ({
  getOrCreateUser,
  getPrimaryTrip: vi.fn(),
}));

vi.mock("../src/lib/api/googleDriveService", () => ({
  fetchDriveThumbnail,
  fetchDriveFileContent,
  isPreviewableDriveImage: (mimeType: string) => mimeType.startsWith("image/"),
}));

describe("google drive media routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrCreateUser.mockResolvedValue({ id: "user-1" });
    findMany.mockResolvedValue([{ folderId: "folder-1" }]);
  });

  it("streams a linked image thumbnail", async () => {
    findFirst.mockResolvedValue({
      id: "asset-1",
      userId: "user-1",
      provider: "google-drive",
      sourceFolderId: "folder-1",
      mimeType: "image/jpeg",
      thumbnailLink: "https://drive.example/thumb",
    });
    fetchDriveThumbnail.mockResolvedValue(
      new Response("thumb", {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const { GET } = await import("../src/app/api/memories/assets/[assetId]/thumbnail/route");
    const response = await GET(new Request("http://localhost/api"), { params: Promise.resolve({ assetId: "asset-1" }) } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });

  it("rejects full-image requests for assets outside the linked folder", async () => {
    findFirst.mockResolvedValue(null);
    const { GET } = await import("../src/app/api/memories/assets/[assetId]/content/route");
    const response = await GET(new Request("http://localhost/api"), { params: Promise.resolve({ assetId: "foreign-asset" }) } as never);

    expect(response.status).toBe(404);
    expect(fetchDriveFileContent).not.toHaveBeenCalled();
  });
});
