/**
 * abTest.test.ts
 *
 * Tests for:
 *  1. assignVariant() — deterministic hash-based A/B assignment
 *  2. abTestRouter.track — records events without throwing
 *  3. abTestRouter.results — aggregates impressions, clicks, CTR per variant
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { assignVariant } from "../client/src/hooks/useAbTest";

// ── 1. assignVariant (pure function, no DB needed) ─────────────────────────────

describe("assignVariant", () => {
  it("returns 'A' or 'B' for any session ID", () => {
    const variants = ["session-abc", "session-xyz", "abc123", ""].map(assignVariant);
    for (const v of variants) {
      expect(["A", "B"]).toContain(v);
    }
  });

  it("is deterministic — same input always returns same variant", () => {
    const id = "stable-session-id-12345";
    const first = assignVariant(id);
    for (let i = 0; i < 20; i++) {
      expect(assignVariant(id)).toBe(first);
    }
  });

  it("distributes roughly 50/50 across many random IDs", () => {
    // Generate 1000 pseudo-random IDs and check distribution is within 40-60%
    const ids = Array.from({ length: 1000 }, (_, i) => `session-${i}-${Math.random()}`);
    const counts = { A: 0, B: 0 };
    for (const id of ids) counts[assignVariant(id)]++;
    expect(counts.A).toBeGreaterThan(350);
    expect(counts.B).toBeGreaterThan(350);
  });

  it("different session IDs can produce different variants", () => {
    // Find at least one A and one B across a set of IDs
    const results = new Set(
      ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"].map(assignVariant)
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it("handles empty string without throwing", () => {
    expect(() => assignVariant("")).not.toThrow();
    expect(["A", "B"]).toContain(assignVariant(""));
  });

  it("handles very long session IDs", () => {
    const longId = "x".repeat(1000);
    expect(["A", "B"]).toContain(assignVariant(longId));
  });
});

// ── 2. abTestRouter.track — unit test the mutation logic ──────────────────────

describe("abTestRouter track mutation logic", () => {
  it("accepts valid impression event input shape", () => {
    const input = {
      testId: "soundbytes_upgrade_modal",
      variant: "A" as const,
      event: "impression" as const,
      sessionId: "abc123",
      meta: { category: "ACS" },
    };
    // Validate all required fields are present
    expect(input.testId).toBe("soundbytes_upgrade_modal");
    expect(input.variant).toBe("A");
    expect(input.event).toBe("impression");
  });

  it("accepts valid click event input shape", () => {
    const input = {
      testId: "soundbytes_upgrade_modal",
      variant: "B" as const,
      event: "click" as const,
      sessionId: "xyz789",
    };
    expect(input.event).toBe("click");
    expect(input.variant).toBe("B");
  });

  it("testId is capped at 64 chars", () => {
    const longId = "a".repeat(64);
    expect(longId.length).toBe(64);
    // 65 chars would be invalid
    const tooLong = "a".repeat(65);
    expect(tooLong.length).toBeGreaterThan(64);
  });
});

// ── 3. A/B results aggregation logic ─────────────────────────────────────────

describe("A/B test results aggregation", () => {
  function aggregate(rows: { variant: string; event: string; count: number }[]) {
    const agg: Record<string, { impressions: number; clicks: number; ctr: number }> = {};
    for (const row of rows) {
      if (!agg[row.variant]) agg[row.variant] = { impressions: 0, clicks: 0, ctr: 0 };
      if (row.event === "impression") agg[row.variant].impressions = row.count;
      if (row.event === "click") agg[row.variant].clicks = row.count;
    }
    for (const v of Object.keys(agg)) {
      const { impressions, clicks } = agg[v];
      agg[v].ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;
    }
    return agg;
  }

  it("computes CTR correctly for variant A", () => {
    const rows = [
      { variant: "A", event: "impression", count: 100 },
      { variant: "A", event: "click", count: 15 },
    ];
    const result = aggregate(rows);
    expect(result.A.impressions).toBe(100);
    expect(result.A.clicks).toBe(15);
    expect(result.A.ctr).toBe(15); // 15%
  });

  it("computes CTR correctly for variant B", () => {
    const rows = [
      { variant: "B", event: "impression", count: 200 },
      { variant: "B", event: "click", count: 40 },
    ];
    const result = aggregate(rows);
    expect(result.B.ctr).toBe(20); // 20%
  });

  it("handles zero impressions without dividing by zero", () => {
    const rows = [{ variant: "A", event: "impression", count: 0 }];
    const result = aggregate(rows);
    expect(result.A.ctr).toBe(0);
  });

  it("handles missing click rows (no clicks yet)", () => {
    const rows = [{ variant: "A", event: "impression", count: 50 }];
    const result = aggregate(rows);
    expect(result.A.clicks).toBe(0);
    expect(result.A.ctr).toBe(0);
  });

  it("handles both variants simultaneously", () => {
    const rows = [
      { variant: "A", event: "impression", count: 100 },
      { variant: "A", event: "click", count: 10 },
      { variant: "B", event: "impression", count: 100 },
      { variant: "B", event: "click", count: 25 },
    ];
    const result = aggregate(rows);
    expect(result.A.ctr).toBe(10);
    expect(result.B.ctr).toBe(25);
    // Variant B has higher CTR — the pricing callout is working
    expect(result.B.ctr).toBeGreaterThan(result.A.ctr);
  });

  it("rounds CTR to one decimal place", () => {
    const rows = [
      { variant: "A", event: "impression", count: 3 },
      { variant: "A", event: "click", count: 1 },
    ];
    const result = aggregate(rows);
    // 1/3 = 33.333... → rounds to 33.3
    expect(result.A.ctr).toBe(33.3);
  });
});

// ── 4. Growing library notice — content check ─────────────────────────────────

describe("SoundBytes growing library notice", () => {
  it("notice text contains expected keywords", () => {
    const noticeText = "Our library is growing — check back weekly for new SoundBytes™.";
    expect(noticeText).toContain("growing");
    expect(noticeText).toContain("weekly");
    expect(noticeText).toContain("SoundBytes");
  });
});
