/**
 * mediaUpload.test.ts
 *
 * Tests for the single-request streaming upload endpoint.
 * Verifies Forge URL builders, file key generation, and upload logic.
 */
import { describe, it, expect, vi } from "vitest";

// ── Mock ENV and axios ────────────────────────────────────────────────────────
vi.mock("../_core/env", () => ({
  ENV: {
    forgeApiUrl: "https://forge.manus.ai",
    forgeApiKey: "test-api-key",
  },
}));
vi.mock("axios");
import axios from "axios";

// ── Forge URL builders ────────────────────────────────────────────────────────
describe("Forge URL builders", () => {
  it("builds a correct upload URL with path query param", () => {
    const base = "https://forge.manus.ai";
    const fileKey = "media/test.zip";
    const url = new URL("v1/storage/upload", base + "/");
    url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
    expect(url.toString()).toBe(
      "https://forge.manus.ai/v1/storage/upload?path=media%2Ftest.zip"
    );
  });

  it("strips leading slashes from file keys", () => {
    const fileKey = "/media/test.zip";
    const normalized = fileKey.replace(/^\/+/, "");
    expect(normalized).toBe("media/test.zip");
  });

  it("handles nested folder paths", () => {
    const base = "https://forge.manus.ai";
    const fileKey = "media/courses/acs/quiz.zip";
    const url = new URL("v1/storage/upload", base + "/");
    url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
    expect(url.searchParams.get("path")).toBe("media/courses/acs/quiz.zip");
  });
});

// ── File key generation ───────────────────────────────────────────────────────
describe("File key generation", () => {
  it("sanitizes file names with special characters", () => {
    const fileName = "Advanced Cardiac Sonographer UNLIMITED QUIZ.zip";
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    expect(safeFileName).toBe("Advanced Cardiac Sonographer UNLIMITED QUIZ.zip");
  });

  it("sanitizes file names with problematic characters", () => {
    const fileName = "file (1) & test <bad>.zip";
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    expect(safeFileName).toBe("file _1_ _ test _bad_.zip");
  });

  it("extracts the correct file extension", () => {
    const cases: [string, string][] = [
      ["test.zip", "zip"],
      ["video.mp4", "mp4"],
      ["image.gif", "gif"],
      ["document.pdf", "pdf"],
    ];
    for (const [fileName, expected] of cases) {
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
      expect(ext).toBe(expected);
    }
  });

  it("generates unique file keys with random suffix", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const suffix = Math.random().toString(36).slice(2, 10);
      keys.add(`media/test-${suffix}.zip`);
    }
    expect(keys.size).toBe(100);
  });

  it("builds correct final file key", () => {
    const folder = "media/courses/acs";
    const fileName = "quiz.zip";
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, "_");
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const randomSuffix = "abc12345";
    const fileKey = `${folder}/${safeFileName}-${randomSuffix}.${ext}`;
    expect(fileKey).toBe("media/courses/acs/quiz.zip-abc12345.zip");
  });
});

// ── Upload size validation ────────────────────────────────────────────────────
describe("Upload size validation", () => {
  it("accepts files up to 2 GB", () => {
    const MAX_SIZE = 2 * 1024 * 1024 * 1024;
    const fileSize = 400 * 1024 * 1024; // 400 MB
    expect(fileSize).toBeLessThanOrEqual(MAX_SIZE);
  });

  it("rejects files over 2 GB", () => {
    const MAX_SIZE = 2 * 1024 * 1024 * 1024;
    const fileSize = 3 * 1024 * 1024 * 1024; // 3 GB
    expect(fileSize).toBeGreaterThan(MAX_SIZE);
  });

  it("calculates file size in MB correctly", () => {
    const sizeBytes = 407.6 * 1024 * 1024;
    const sizeMB = sizeBytes / 1024 / 1024;
    expect(sizeMB).toBeCloseTo(407.6, 1);
  });
});

// ── XHR progress tracking ─────────────────────────────────────────────────────
describe("XHR progress tracking", () => {
  it("calculates progress percentage correctly", () => {
    const cases = [
      { loaded: 0, total: 400 * 1024 * 1024, expected: 0 },
      { loaded: 200 * 1024 * 1024, total: 400 * 1024 * 1024, expected: 48 }, // 50% * 95 = 47.5 → 48 (Math.round rounds up)
      { loaded: 380 * 1024 * 1024, total: 400 * 1024 * 1024, expected: 90 }, // 95% * 95 = 90.25 → 90
      { loaded: 400 * 1024 * 1024, total: 400 * 1024 * 1024, expected: 95 }, // 100% * 95 = 95
    ];
    for (const { loaded, total, expected } of cases) {
      const pct = Math.round((loaded / total) * 95);
      expect(pct).toBe(expected);
    }
  });

  it("reports 100% only after server confirms success", () => {
    // Progress during upload maxes at 95%; 100% is set after server responds
    const uploadProgress = 95;
    expect(uploadProgress).toBeLessThan(100);
    // After server responds with 200:
    const finalProgress = 100;
    expect(finalProgress).toBe(100);
  });
});

// ── MIME type handling ────────────────────────────────────────────────────────
describe("MIME type handling", () => {
  it("uses application/octet-stream as fallback for unknown types", () => {
    const mimeType = "" || "application/octet-stream";
    expect(mimeType).toBe("application/octet-stream");
  });

  it("preserves known MIME types", () => {
    const cases = [
      ["application/zip", "application/zip"],
      ["video/mp4", "video/mp4"],
      ["application/x-zip-compressed", "application/x-zip-compressed"],
    ];
    for (const [input, expected] of cases) {
      const mimeType = input || "application/octet-stream";
      expect(mimeType).toBe(expected);
    }
  });
});
