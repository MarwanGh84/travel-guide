import { describe, expect, it } from "vitest";
import {
  extractDriveFolderId,
  filterAllowedDriveFiles,
  isPreviewableDriveImage,
  normalizeDriveFile,
} from "../src/lib/api/googleDriveService";

describe("google drive memory helpers", () => {
  it("extracts a folder id from a Drive folder URL", () => {
    expect(extractDriveFolderId("https://drive.google.com/drive/folders/abcDEF_123456789?usp=sharing")).toBe("abcDEF_123456789");
  });

  it("accepts a raw folder id", () => {
    expect(extractDriveFolderId("abcDEF_123456789")).toBe("abcDEF_123456789");
  });

  it("rejects unsupported URLs", () => {
    expect(extractDriveFolderId("https://example.com/drive/folders/abcDEF_123456789")).toBeNull();
  });

  it("filters to supported memory file types", () => {
    const files = filterAllowedDriveFiles([
      { id: "image", mimeType: "image/jpeg" },
      { id: "video", mimeType: "video/mp4" },
      { id: "pdf", mimeType: "application/pdf" },
      { id: "doc", mimeType: "application/vnd.google-apps.document" },
      { id: "zip", mimeType: "application/zip" },
    ]);

    expect(files.map((file) => file.id)).toEqual(["image", "video", "pdf", "doc"]);
  });

  it("normalizes complete file metadata and rejects invalid rows", () => {
    expect(normalizeDriveFile({
      id: "file-1",
      name: "passport.pdf",
      mimeType: "application/pdf",
      thumbnailLink: "https://example.com/thumb",
      webViewLink: "https://drive.google.com/file/d/file-1/view",
      createdTime: "2026-05-18T10:00:00.000Z",
    })).toMatchObject({
      provider: "google-drive",
      providerFileId: "file-1",
      name: "passport.pdf",
      mimeType: "application/pdf",
    });
    expect(normalizeDriveFile({ id: "missing-name", mimeType: "image/jpeg" })).toBeNull();
  });

  it("marks only image mime types as previewable in-app", () => {
    expect(isPreviewableDriveImage("image/jpeg")).toBe(true);
    expect(isPreviewableDriveImage("video/mp4")).toBe(false);
    expect(isPreviewableDriveImage("application/pdf")).toBe(false);
  });
});
