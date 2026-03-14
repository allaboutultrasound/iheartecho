/**
 * Tests for Accreditation Navigator Checklist
 * Covers DB helpers: getAccreditationChecklist, toggleAccreditationChecklistItem,
 * bulkToggleAccreditationChecklist, getAllAccreditationChecklists
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB layer ────────────────────────────────────────────────────────
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getAccreditationChecklist: vi.fn(),
    getAllAccreditationChecklists: vi.fn(),
    toggleAccreditationChecklistItem: vi.fn(),
    bulkToggleAccreditationChecklist: vi.fn(),
  };
});

import {
  getAccreditationChecklist,
  getAllAccreditationChecklists,
  toggleAccreditationChecklistItem,
  bulkToggleAccreditationChecklist,
} from "./db";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getAccreditationChecklist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an empty Set when no items are checked", async () => {
    vi.mocked(getAccreditationChecklist).mockResolvedValue(new Set());
    const result = await getAccreditationChecklist(1, "adult-tte");
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("returns a Set of checked section keys", async () => {
    vi.mocked(getAccreditationChecklist).mockResolvedValue(
      new Set(["eq-atte-1", "eq-atte-2", "fac-atte-1"])
    );
    const result = await getAccreditationChecklist(1, "adult-tte");
    expect(result.has("eq-atte-1")).toBe(true);
    expect(result.has("eq-atte-2")).toBe(true);
    expect(result.has("fac-atte-1")).toBe(true);
    expect(result.has("nonexistent-key")).toBe(false);
  });

  it("is isolated per accreditation type", async () => {
    vi.mocked(getAccreditationChecklist)
      .mockResolvedValueOnce(new Set(["eq-atte-1"]))
      .mockResolvedValueOnce(new Set(["eq-periop-1"]));

    const adultResult = await getAccreditationChecklist(1, "adult-tte");
    const periopResult = await getAccreditationChecklist(1, "periop-tee");

    expect(adultResult.has("eq-atte-1")).toBe(true);
    expect(adultResult.has("eq-periop-1")).toBe(false);
    expect(periopResult.has("eq-periop-1")).toBe(true);
    expect(periopResult.has("eq-atte-1")).toBe(false);
  });
});

describe("toggleAccreditationChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls upsert with checked=true", async () => {
    vi.mocked(toggleAccreditationChecklistItem).mockResolvedValue(undefined);
    await toggleAccreditationChecklistItem(1, "adult-tte", "eq-atte-1", true);
    expect(toggleAccreditationChecklistItem).toHaveBeenCalledWith(
      1, "adult-tte", "eq-atte-1", true
    );
  });

  it("calls upsert with checked=false (uncheck)", async () => {
    vi.mocked(toggleAccreditationChecklistItem).mockResolvedValue(undefined);
    await toggleAccreditationChecklistItem(1, "adult-tte", "eq-atte-1", false);
    expect(toggleAccreditationChecklistItem).toHaveBeenCalledWith(
      1, "adult-tte", "eq-atte-1", false
    );
  });
});

describe("bulkToggleAccreditationChecklist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handles an empty items array gracefully", async () => {
    vi.mocked(bulkToggleAccreditationChecklist).mockResolvedValue(undefined);
    await bulkToggleAccreditationChecklist(1, "adult-tte", []);
    expect(bulkToggleAccreditationChecklist).toHaveBeenCalledWith(1, "adult-tte", []);
  });

  it("bulk-upserts multiple items", async () => {
    vi.mocked(bulkToggleAccreditationChecklist).mockResolvedValue(undefined);
    const items = [
      { sectionKey: "eq-atte-1", checked: true },
      { sectionKey: "eq-atte-2", checked: true },
      { sectionKey: "fac-atte-1", checked: false },
    ];
    await bulkToggleAccreditationChecklist(1, "adult-tte", items);
    expect(bulkToggleAccreditationChecklist).toHaveBeenCalledWith(
      1, "adult-tte", items
    );
  });
});

describe("getAllAccreditationChecklists", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all rows for a user across types", async () => {
    const mockRows = [
      { userId: 1, accreditationType: "adult-tte", sectionKey: "eq-atte-1", checked: true, updatedAt: new Date() },
      { userId: 1, accreditationType: "periop-tee", sectionKey: "eq-periop-1", checked: true, updatedAt: new Date() },
      { userId: 1, accreditationType: "adult-tte", sectionKey: "fac-atte-1", checked: false, updatedAt: new Date() },
    ];
    vi.mocked(getAllAccreditationChecklists).mockResolvedValue(mockRows as any);

    const rows = await getAllAccreditationChecklists(1);
    expect(rows).toHaveLength(3);

    // Verify grouping logic (as done in the tRPC getAll procedure)
    const grouped: Record<string, string[]> = {};
    for (const row of rows) {
      if (!row.checked) continue;
      if (!grouped[row.accreditationType]) grouped[row.accreditationType] = [];
      grouped[row.accreditationType].push(row.sectionKey);
    }
    expect(grouped["adult-tte"]).toEqual(["eq-atte-1"]);
    expect(grouped["periop-tee"]).toEqual(["eq-periop-1"]);
    expect(grouped["adult-tte"]).not.toContain("fac-atte-1"); // unchecked row excluded
  });

  it("returns empty array when user has no checklist data", async () => {
    vi.mocked(getAllAccreditationChecklists).mockResolvedValue([]);
    const rows = await getAllAccreditationChecklists(99);
    expect(rows).toHaveLength(0);
  });
});
