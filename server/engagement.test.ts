import { describe, expect, it } from "vitest";
import { aggregateDailyCounts } from "./routers/engagementRouter";

describe("aggregateDailyCounts", () => {
  it("groups events by UTC day and returns them sorted", () => {
    const rows = [
      { viewedAt: new Date("2026-04-09T23:59:00.000Z") },
      { viewedAt: "2026-04-08T12:00:00.000Z" },
      { viewedAt: new Date("2026-04-09T00:01:00.000Z") },
      { viewedAt: "not-a-date" },
      { viewedAt: null },
    ];

    expect(aggregateDailyCounts(rows, (row) => row.viewedAt)).toEqual([
      { day: "2026-04-08", total: 1 },
      { day: "2026-04-09", total: 2 },
    ]);
  });
});
