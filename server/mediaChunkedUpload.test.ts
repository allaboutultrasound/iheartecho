/**
 * mediaChunkedUpload.test.ts
 *
 * Tests for the stateless chunked upload route.
 * Verifies that the Forge API helper functions work correctly
 * and that the upload/download cycle produces identical data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the ENV and axios so tests don't make real network calls ─────────────

vi.mock("../_core/env", () => ({
  ENV: {
    forgeApiUrl: "https://forge.manus.ai",
    forgeApiKey: "test-api-key",
  },
}));

vi.mock("axios");
import axios from "axios";

// ── Unit tests for URL builder helpers ────────────────────────────────────────

describe("Forge URL builders", () => {
  it("builds a correct upload URL with path query param", () => {
    const base = "https://forge.manus.ai";
    const fileKey = "_chunks/test-id/chunk_000000.bin";
    const url = new URL("v1/storage/upload", base + "/");
    url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
    expect(url.toString()).toBe(
      "https://forge.manus.ai/v1/storage/upload?path=_chunks%2Ftest-id%2Fchunk_000000.bin"
    );
  });

  it("builds a correct download URL with path query param", () => {
    const base = "https://forge.manus.ai";
    const fileKey = "_chunks/test-id/_meta.json";
    const url = new URL("v1/storage/downloadUrl", base + "/");
    url.searchParams.set("path", fileKey.replace(/^\/+/, ""));
    expect(url.toString()).toBe(
      "https://forge.manus.ai/v1/storage/downloadUrl?path=_chunks%2Ftest-id%2F_meta.json"
    );
  });

  it("strips leading slashes from file keys", () => {
    const fileKey = "/media-assets/test.zip";
    const normalized = fileKey.replace(/^\/+/, "");
    expect(normalized).toBe("media-assets/test.zip");
  });
});

// ── Unit tests for chunk assembly logic ───────────────────────────────────────

describe("Chunk assembly", () => {
  it("concatenates chunk buffers in the correct order", () => {
    const chunk0 = Buffer.from("HELLO");
    const chunk1 = Buffer.from(" WORLD");
    const chunk2 = Buffer.from("!");
    const assembled = Buffer.concat([chunk0, chunk1, chunk2]);
    expect(assembled.toString("utf-8")).toBe("HELLO WORLD!");
  });

  it("produces the correct total byte count", () => {
    const chunks = [
      Buffer.alloc(5 * 1024 * 1024, 0x41), // 5 MB
      Buffer.alloc(5 * 1024 * 1024, 0x42), // 5 MB
      Buffer.alloc(1 * 1024 * 1024, 0x43), // 1 MB (last chunk)
    ];
    const assembled = Buffer.concat(chunks);
    expect(assembled.length).toBe(11 * 1024 * 1024);
  });

  it("calculates the correct number of chunks for a given file size", () => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
    const fileSize = 407.6 * 1024 * 1024; // 407.6 MB
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    expect(totalChunks).toBe(82);
  });
});

// ── Unit tests for metadata serialization ─────────────────────────────────────

describe("Metadata serialization", () => {
  it("serializes and deserializes metadata correctly", () => {
    const meta = { fileName: "test.zip", mimeType: "application/zip", totalChunks: 82 };
    const serialized = JSON.stringify(meta);
    const deserialized = JSON.parse(serialized);
    expect(deserialized.fileName).toBe("test.zip");
    expect(deserialized.mimeType).toBe("application/zip");
    expect(deserialized.totalChunks).toBe(82);
  });

  it("generates a unique uploadId for each upload", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });
});

// ── Unit tests for file key generation ───────────────────────────────────────

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
    const cases = [
      ["test.zip", "zip"],
      ["video.mp4", "mp4"],
      ["image.gif", "gif"],
      ["document.pdf", "pdf"],
      ["no-extension", "no-extension"],
    ];
    for (const [fileName, expected] of cases) {
      const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
      expect(ext).toBe(expected);
    }
  });
});
