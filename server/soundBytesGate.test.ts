/**
 * soundBytesGate.test.ts
 *
 * Tests for the per-category 1-video free gate logic in the SoundBytes router.
 *
 * The router tags the FIRST item in each category (by sort order) as isFree=true.
 * All other items in that category are isFree=false.
 *
 * This file tests:
 *   1. The isFree tagging logic (first per category)
 *   2. Category filter behaviour (when a category is active, first in filtered result is free)
 *   3. Edge cases: empty list, single item, single category, many categories
 *   4. Client-side gate logic: watchedCategories tracking and upgrade modal trigger
 */

import { describe, it, expect } from "vitest";

// ── Inline replica of the server-side isFree tagging logic ───────────────────
// Mirrors the logic in server/routers/soundBytesRouter.ts list procedure.

interface SoundByteRow {
  id: number;
  title: string;
  category: string;
  sortOrder: number;
}

function tagFreeItems(rows: SoundByteRow[]): Array<SoundByteRow & { isFree: boolean }> {
  const seenCategories = new Set<string>();
  return rows.map((r) => {
    const isFirstInCategory = !seenCategories.has(r.category);
    seenCategories.add(r.category);
    return { ...r, isFree: isFirstInCategory };
  });
}

// ── Inline replica of the client-side gate logic ─────────────────────────────
// Mirrors the handleFreeUserSelect logic in client/src/pages/SoundBytes.tsx.

function shouldShowUpgradeModal(
  item: { isFree: boolean; category: string },
  watchedCategories: Set<string>
): boolean {
  const itemIsFree = item.isFree;
  const alreadyWatchedCategory = watchedCategories.has(item.category);
  // Show upgrade modal if:
  //   - item is locked (not free), OR
  //   - item is free but user already watched this category
  return !itemIsFree || alreadyWatchedCategory;
}

function shouldAllowPlay(
  item: { isFree: boolean; category: string },
  watchedCategories: Set<string>
): boolean {
  return !shouldShowUpgradeModal(item, watchedCategories);
}

// ── Tests: server-side isFree tagging ────────────────────────────────────────

describe("tagFreeItems — first item per category is free", () => {
  it("marks the first item in a single category as free", () => {
    const rows: SoundByteRow[] = [
      { id: 1, title: "Video A", category: "adult_echo", sortOrder: 1 },
      { id: 2, title: "Video B", category: "adult_echo", sortOrder: 2 },
      { id: 3, title: "Video C", category: "adult_echo", sortOrder: 3 },
    ];
    const result = tagFreeItems(rows);
    expect(result[0].isFree).toBe(true);
    expect(result[1].isFree).toBe(false);
    expect(result[2].isFree).toBe(false);
  });

  it("marks the first item in each of multiple categories as free", () => {
    const rows: SoundByteRow[] = [
      { id: 1, title: "Adult A", category: "adult_echo", sortOrder: 1 },
      { id: 2, title: "Fetal A", category: "fetal_echo", sortOrder: 1 },
      { id: 3, title: "Adult B", category: "adult_echo", sortOrder: 2 },
      { id: 4, title: "Fetal B", category: "fetal_echo", sortOrder: 2 },
      { id: 5, title: "POCUS A", category: "pocus", sortOrder: 1 },
    ];
    const result = tagFreeItems(rows);
    // First adult_echo → free
    expect(result.find((r) => r.id === 1)?.isFree).toBe(true);
    // First fetal_echo → free
    expect(result.find((r) => r.id === 2)?.isFree).toBe(true);
    // Second adult_echo → not free
    expect(result.find((r) => r.id === 3)?.isFree).toBe(false);
    // Second fetal_echo → not free
    expect(result.find((r) => r.id === 4)?.isFree).toBe(false);
    // First pocus → free
    expect(result.find((r) => r.id === 5)?.isFree).toBe(true);
  });

  it("marks a single item as free", () => {
    const rows: SoundByteRow[] = [
      { id: 1, title: "Only Video", category: "acs", sortOrder: 1 },
    ];
    const result = tagFreeItems(rows);
    expect(result[0].isFree).toBe(true);
  });

  it("returns empty array unchanged", () => {
    expect(tagFreeItems([])).toEqual([]);
  });

  it("handles all 7 categories each with 3 items — exactly 7 free items", () => {
    const categories = ["acs", "adult_echo", "pediatric_echo", "fetal_echo", "pocus", "physics", "ecg"];
    const rows: SoundByteRow[] = [];
    let id = 1;
    for (const cat of categories) {
      for (let i = 1; i <= 3; i++) {
        rows.push({ id: id++, title: `${cat} ${i}`, category: cat, sortOrder: i });
      }
    }
    const result = tagFreeItems(rows);
    const freeItems = result.filter((r) => r.isFree);
    expect(freeItems).toHaveLength(7);
    // Each free item should be the first in its category
    for (const cat of categories) {
      const catItems = result.filter((r) => r.category === cat);
      expect(catItems[0].isFree).toBe(true);
      expect(catItems[1].isFree).toBe(false);
      expect(catItems[2].isFree).toBe(false);
    }
  });

  it("when category filter is active, first item in filtered result is free", () => {
    // Simulates filtering by adult_echo — only adult_echo items are in the result
    const rows: SoundByteRow[] = [
      { id: 10, title: "Adult Echo 1", category: "adult_echo", sortOrder: 1 },
      { id: 11, title: "Adult Echo 2", category: "adult_echo", sortOrder: 2 },
      { id: 12, title: "Adult Echo 3", category: "adult_echo", sortOrder: 3 },
    ];
    const result = tagFreeItems(rows);
    expect(result[0].isFree).toBe(true);
    expect(result[1].isFree).toBe(false);
    expect(result[2].isFree).toBe(false);
  });

  it("preserves all other fields on each row", () => {
    const rows: SoundByteRow[] = [
      { id: 42, title: "Test Video", category: "physics", sortOrder: 99 },
    ];
    const result = tagFreeItems(rows);
    expect(result[0].id).toBe(42);
    expect(result[0].title).toBe("Test Video");
    expect(result[0].category).toBe("physics");
    expect(result[0].sortOrder).toBe(99);
  });
});

// ── Tests: client-side gate logic ────────────────────────────────────────────

describe("shouldAllowPlay — free user gate", () => {
  it("allows play for first item in an unwatched category", () => {
    const item = { isFree: true, category: "adult_echo" };
    const watched = new Set<string>();
    expect(shouldAllowPlay(item, watched)).toBe(true);
  });

  it("blocks play for first item in an already-watched category", () => {
    const item = { isFree: true, category: "adult_echo" };
    const watched = new Set(["adult_echo"]);
    expect(shouldAllowPlay(item, watched)).toBe(false);
  });

  it("blocks play for a locked (non-free) item in an unwatched category", () => {
    const item = { isFree: false, category: "adult_echo" };
    const watched = new Set<string>();
    expect(shouldAllowPlay(item, watched)).toBe(false);
  });

  it("blocks play for a locked item in an already-watched category", () => {
    const item = { isFree: false, category: "adult_echo" };
    const watched = new Set(["adult_echo"]);
    expect(shouldAllowPlay(item, watched)).toBe(false);
  });

  it("allows play for free item in different unwatched category", () => {
    const item = { isFree: true, category: "fetal_echo" };
    const watched = new Set(["adult_echo"]); // adult_echo watched, fetal_echo not
    expect(shouldAllowPlay(item, watched)).toBe(true);
  });

  it("blocks play for free item when its category is in watched set", () => {
    const item = { isFree: true, category: "fetal_echo" };
    const watched = new Set(["adult_echo", "fetal_echo"]);
    expect(shouldAllowPlay(item, watched)).toBe(false);
  });
});

describe("shouldShowUpgradeModal — upgrade modal trigger", () => {
  it("does NOT show modal for first item in unwatched category", () => {
    const item = { isFree: true, category: "pocus" };
    const watched = new Set<string>();
    expect(shouldShowUpgradeModal(item, watched)).toBe(false);
  });

  it("shows modal when free item's category is already watched", () => {
    const item = { isFree: true, category: "pocus" };
    const watched = new Set(["pocus"]);
    expect(shouldShowUpgradeModal(item, watched)).toBe(true);
  });

  it("shows modal for any locked (non-free) item regardless of watched state", () => {
    const item = { isFree: false, category: "pocus" };
    const watched = new Set<string>();
    expect(shouldShowUpgradeModal(item, watched)).toBe(true);
  });

  it("shows modal for locked item even if category is not watched", () => {
    const item = { isFree: false, category: "ecg" };
    const watched = new Set<string>();
    expect(shouldShowUpgradeModal(item, watched)).toBe(true);
  });
});

// ── Tests: watchedCategories tracking ────────────────────────────────────────

describe("watchedCategories tracking", () => {
  it("starts empty for a new user", () => {
    const watched = new Set<string>();
    expect(watched.size).toBe(0);
  });

  it("adds a category after watching a video", () => {
    const watched = new Set<string>();
    watched.add("adult_echo");
    expect(watched.has("adult_echo")).toBe(true);
    expect(watched.size).toBe(1);
  });

  it("does not duplicate a category when watched twice", () => {
    const watched = new Set<string>();
    watched.add("adult_echo");
    watched.add("adult_echo");
    expect(watched.size).toBe(1);
  });

  it("tracks multiple categories independently", () => {
    const watched = new Set<string>();
    watched.add("adult_echo");
    watched.add("fetal_echo");
    watched.add("pocus");
    expect(watched.size).toBe(3);
    expect(watched.has("adult_echo")).toBe(true);
    expect(watched.has("fetal_echo")).toBe(true);
    expect(watched.has("pocus")).toBe(true);
    expect(watched.has("acs")).toBe(false);
  });

  it("can be serialized to and from JSON (localStorage persistence)", () => {
    const watched = new Set(["adult_echo", "fetal_echo"]);
    const serialized = JSON.stringify([...watched]);
    const restored = new Set(JSON.parse(serialized) as string[]);
    expect(restored.has("adult_echo")).toBe(true);
    expect(restored.has("fetal_echo")).toBe(true);
    expect(restored.size).toBe(2);
  });
});

// ── Integration: full free-user journey ──────────────────────────────────────

describe("Full free-user journey simulation", () => {
  it("user can watch first video in each category, then gets blocked on second", () => {
    const categories = ["adult_echo", "fetal_echo", "pocus"];
    const rows: SoundByteRow[] = [];
    let id = 1;
    for (const cat of categories) {
      for (let i = 1; i <= 3; i++) {
        rows.push({ id: id++, title: `${cat} ${i}`, category: cat, sortOrder: i });
      }
    }
    const tagged = tagFreeItems(rows);
    const watched = new Set<string>();

    // First video in each category should be playable
    for (const cat of categories) {
      const firstInCat = tagged.find((r) => r.category === cat && r.isFree)!;
      expect(shouldAllowPlay(firstInCat, watched)).toBe(true);
      // Simulate watching it
      watched.add(cat);
    }

    // Now all categories are watched — second video in each should show upgrade modal
    for (const cat of categories) {
      const secondInCat = tagged.filter((r) => r.category === cat)[1];
      expect(shouldShowUpgradeModal(secondInCat, watched)).toBe(true);
    }
  });

  it("watching a video in one category does not affect other categories", () => {
    const watched = new Set(["adult_echo"]);
    const fetalFirstItem = { isFree: true, category: "fetal_echo" };
    const adultSecondItem = { isFree: false, category: "adult_echo" };

    // Fetal echo first item still playable (not watched yet)
    expect(shouldAllowPlay(fetalFirstItem, watched)).toBe(true);
    // Adult echo second item still blocked (not free)
    expect(shouldAllowPlay(adultSecondItem, watched)).toBe(false);
  });
});
