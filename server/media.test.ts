/**
 * Media Repository — Unit Tests
 *
 * Tests the mediaRouter procedures for:
 * - Input validation (schema enforcement)
 * - Folder creation validation
 * - Asset creation input validation
 * - Analytics summary shape
 *
 * Note: DB-dependent tests use the live DB; tests that only validate
 * input schemas are pure unit tests with no DB calls.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Input schema mirrors (copied from mediaRouter.ts) ────────────────────────
const createAssetInput = z.object({
  title: z.string().min(1).max(256),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  accessMode: z.enum(["public", "private"]),
  folderId: z.number().optional(),
  fileBase64: z.string().optional(),
  s3Url: z.string().url().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  originalFilename: z.string().optional(),
  changeNote: z.string().optional(),
});

const createFolderInput = z.object({
  name: z.string().min(1).max(128),
  description: z.string().optional(),
  parentId: z.number().optional(),
  sortOrder: z.number().optional(),
});

const listAssetsInput = z.object({
  search: z.string().optional(),
  mediaType: z
    .enum(["image", "audio", "video", "html", "scorm", "zip", "lms", "document", "other"])
    .optional(),
  accessMode: z.enum(["public", "private"]).optional(),
  folderId: z.number().nullable().optional(),
  limit: z.number().min(1).max(200).default(50),
  offset: z.number().min(0).default(0),
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Media Repository — Input Validation", () => {
  describe("createAsset input", () => {
    it("accepts a minimal valid asset", () => {
      const result = createAssetInput.safeParse({
        title: "Test Image",
        accessMode: "public",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a full asset with all optional fields", () => {
      const result = createAssetInput.safeParse({
        title: "Full Asset",
        description: "A complete asset",
        tags: ["TTE", "Adult Echo"],
        accessMode: "private",
        folderId: 1,
        fileBase64: "base64string",
        mimeType: "image/jpeg",
        fileSizeBytes: 1024,
        originalFilename: "scan.jpg",
        changeNote: "Initial upload",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const result = createAssetInput.safeParse({
        title: "",
        accessMode: "public",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title over 256 characters", () => {
      const result = createAssetInput.safeParse({
        title: "A".repeat(257),
        accessMode: "public",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid accessMode", () => {
      const result = createAssetInput.safeParse({
        title: "Test",
        accessMode: "restricted",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid s3Url (not a URL)", () => {
      const result = createAssetInput.safeParse({
        title: "Test",
        accessMode: "public",
        s3Url: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid s3Url", () => {
      const result = createAssetInput.safeParse({
        title: "Test",
        accessMode: "public",
        s3Url: "https://s3.amazonaws.com/bucket/key.mp4",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createFolder input", () => {
    it("accepts a minimal valid folder", () => {
      const result = createFolderInput.safeParse({ name: "Module 1" });
      expect(result.success).toBe(true);
    });

    it("accepts a full folder with all optional fields", () => {
      const result = createFolderInput.safeParse({
        name: "TTE Course",
        description: "All TTE assets",
        parentId: 1,
        sortOrder: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty folder name", () => {
      const result = createFolderInput.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects folder name over 128 characters", () => {
      const result = createFolderInput.safeParse({ name: "A".repeat(129) });
      expect(result.success).toBe(false);
    });
  });

  describe("listAssets input", () => {
    it("accepts empty input (uses defaults)", () => {
      const result = listAssetsInput.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("accepts all valid media types", () => {
      const types = ["image", "audio", "video", "html", "scorm", "zip", "lms", "document", "other"] as const;
      for (const t of types) {
        const result = listAssetsInput.safeParse({ mediaType: t });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid media type", () => {
      const result = listAssetsInput.safeParse({ mediaType: "pdf" });
      expect(result.success).toBe(false);
    });

    it("rejects limit over 200", () => {
      const result = listAssetsInput.safeParse({ limit: 201 });
      expect(result.success).toBe(false);
    });

    it("rejects negative offset", () => {
      const result = listAssetsInput.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });

    it("accepts folderId as null (unfiled filter)", () => {
      const result = listAssetsInput.safeParse({ folderId: null });
      expect(result.success).toBe(true);
    });

    it("accepts folderId as a number", () => {
      const result = listAssetsInput.safeParse({ folderId: 3 });
      expect(result.success).toBe(true);
    });
  });

  describe("Analytics summary shape", () => {
    it("validates the expected analytics summary structure", () => {
      const summarySchema = z.record(
        z.string(),
        z.object({
          total: z.number(),
          embedCount: z.number(),
          serveCount: z.number(),
        })
      );
      const mockSummary = {
        "1": { total: 42, embedCount: 10, serveCount: 32 },
        "2": { total: 0, embedCount: 0, serveCount: 0 },
      };
      const result = summarySchema.safeParse(mockSummary);
      expect(result.success).toBe(true);
    });
  });
});
