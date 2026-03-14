/**
 * Tests for EducatorAssist platform logic:
 *   - Role-based access control for educator procedures
 *   - Subscription tier limits
 *   - Assignment progress status filtering
 *   - Leaderboard aggregation logic
 *
 * All DB calls are mocked so no real database connection is needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Subscription tier limits ─────────────────────────────────────────────────

const TIER_LIMITS = {
  individual: { maxEducators: 1, maxStudents: 30 },
  school: { maxEducators: 10, maxStudents: 200 },
  hospital: { maxEducators: 25, maxStudents: 500 },
  enterprise: { maxEducators: 999, maxStudents: 9999 },
} as const;

type Tier = keyof typeof TIER_LIMITS;

function checkTierLimit(tier: Tier, currentCount: number, type: "educators" | "students"): boolean {
  const limits = TIER_LIMITS[tier];
  const max = type === "educators" ? limits.maxEducators : limits.maxStudents;
  return currentCount < max;
}

// ─── Role access logic ────────────────────────────────────────────────────────

type AppRole = "user" | "premium_user" | "diy_admin" | "diy_user" | "platform_admin"
  | "education_manager" | "education_admin" | "education_student";

function canAccessEducatorAdmin(roles: AppRole[]): boolean {
  return roles.some(r => ["education_admin", "education_manager", "platform_admin"].includes(r));
}

function canAccessStudentDashboard(roles: AppRole[]): boolean {
  return roles.some(r => ["education_student", "education_admin", "education_manager", "platform_admin"].includes(r));
}

function canAccessEducatorAssistMarketing(roles: AppRole[]): boolean {
  return roles.some(r => ["education_manager", "platform_admin"].includes(r));
}

function canUploadTemplates(roles: AppRole[]): boolean {
  return roles.some(r => ["education_manager", "platform_admin"].includes(r));
}

function canViewTemplates(roles: AppRole[]): boolean {
  return roles.some(r => ["education_admin", "education_manager", "platform_admin"].includes(r));
}

// ─── Assignment progress filtering logic ─────────────────────────────────────

type ProgressStatus = "not_started" | "in_progress" | "completed" | "failed";

function filterPendingAssignments(assignments: { myStatus: ProgressStatus }[]) {
  return assignments.filter(a => a.myStatus === "not_started" || a.myStatus === "in_progress");
}

function filterCompletedAssignments(assignments: { myStatus: ProgressStatus }[]) {
  return assignments.filter(a => a.myStatus === "completed" || a.myStatus === "failed");
}

// ─── Leaderboard aggregation logic ───────────────────────────────────────────

interface ProgressRow {
  userId: number;
  score: number | null;
  status: ProgressStatus;
}

function aggregateLeaderboard(userIds: number[], progressRows: ProgressRow[], nameMap: Map<number, string | null>) {
  const statsMap = new Map<number, { totalScore: number; count: number; completed: number }>();
  for (const row of progressRows) {
    if (!statsMap.has(row.userId)) {
      statsMap.set(row.userId, { totalScore: 0, count: 0, completed: 0 });
    }
    const s = statsMap.get(row.userId)!;
    if (row.score !== null) { s.totalScore += row.score; s.count++; }
    if (row.status === "completed") s.completed++;
  }
  const leaderboard = userIds.map(uid => {
    const stats = statsMap.get(uid);
    return {
      userId: uid,
      name: nameMap.get(uid) ?? null,
      avgScore: stats && stats.count > 0 ? Math.round(stats.totalScore / stats.count) : null,
      completedAssignments: stats?.completed ?? 0,
    };
  });
  leaderboard.sort((a, b) => {
    const scoreA = a.avgScore ?? -1;
    const scoreB = b.avgScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.completedAssignments - a.completedAssignments;
  });
  return leaderboard;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EducatorAssist — Subscription Tier Limits", () => {
  it("individual tier allows up to 1 educator", () => {
    expect(checkTierLimit("individual", 0, "educators")).toBe(true);
    expect(checkTierLimit("individual", 1, "educators")).toBe(false);
  });

  it("individual tier allows up to 30 students", () => {
    expect(checkTierLimit("individual", 29, "students")).toBe(true);
    expect(checkTierLimit("individual", 30, "students")).toBe(false);
  });

  it("school tier allows up to 10 educators and 200 students", () => {
    expect(checkTierLimit("school", 9, "educators")).toBe(true);
    expect(checkTierLimit("school", 10, "educators")).toBe(false);
    expect(checkTierLimit("school", 199, "students")).toBe(true);
    expect(checkTierLimit("school", 200, "students")).toBe(false);
  });

  it("enterprise tier allows effectively unlimited educators and students", () => {
    expect(checkTierLimit("enterprise", 998, "educators")).toBe(true);
    expect(checkTierLimit("enterprise", 9998, "students")).toBe(true);
  });
});

describe("EducatorAssist — Role-Based Access Control", () => {
  it("education_admin can access educator admin dashboard", () => {
    expect(canAccessEducatorAdmin(["education_admin"])).toBe(true);
  });

  it("education_manager can access educator admin dashboard", () => {
    expect(canAccessEducatorAdmin(["education_manager"])).toBe(true);
  });

  it("platform_admin can access educator admin dashboard", () => {
    expect(canAccessEducatorAdmin(["platform_admin"])).toBe(true);
  });

  it("regular user cannot access educator admin dashboard", () => {
    expect(canAccessEducatorAdmin(["user"])).toBe(false);
    expect(canAccessEducatorAdmin(["premium_user"])).toBe(false);
    expect(canAccessEducatorAdmin(["diy_admin"])).toBe(false);
  });

  it("education_student can access student dashboard", () => {
    expect(canAccessStudentDashboard(["education_student"])).toBe(true);
  });

  it("education_admin can also access student dashboard", () => {
    expect(canAccessStudentDashboard(["education_admin"])).toBe(true);
  });

  it("regular user cannot access student dashboard", () => {
    expect(canAccessStudentDashboard(["user"])).toBe(false);
  });

  it("only education_manager and platform_admin can access EducatorAssist marketing page", () => {
    expect(canAccessEducatorAssistMarketing(["education_manager"])).toBe(true);
    expect(canAccessEducatorAssistMarketing(["platform_admin"])).toBe(true);
    expect(canAccessEducatorAssistMarketing(["education_admin"])).toBe(false);
    expect(canAccessEducatorAssistMarketing(["education_student"])).toBe(false);
    expect(canAccessEducatorAssistMarketing(["user"])).toBe(false);
  });

  it("only education_manager and platform_admin can upload templates", () => {
    expect(canUploadTemplates(["education_manager"])).toBe(true);
    expect(canUploadTemplates(["platform_admin"])).toBe(true);
    expect(canUploadTemplates(["education_admin"])).toBe(false);
    expect(canUploadTemplates(["education_student"])).toBe(false);
  });

  it("education_admin can view templates (read-only)", () => {
    expect(canViewTemplates(["education_admin"])).toBe(true);
    expect(canViewTemplates(["education_manager"])).toBe(true);
    expect(canViewTemplates(["platform_admin"])).toBe(true);
    expect(canViewTemplates(["education_student"])).toBe(false);
  });
});

describe("EducatorAssist — Assignment Progress Filtering", () => {
  const assignments = [
    { id: 1, title: "Quiz 1", myStatus: "not_started" as ProgressStatus },
    { id: 2, title: "Quiz 2", myStatus: "in_progress" as ProgressStatus },
    { id: 3, title: "Quiz 3", myStatus: "completed" as ProgressStatus },
    { id: 4, title: "Quiz 4", myStatus: "failed" as ProgressStatus },
  ];

  it("filters pending assignments (not_started + in_progress)", () => {
    const pending = filterPendingAssignments(assignments);
    expect(pending).toHaveLength(2);
    expect(pending.map(a => a.id)).toEqual([1, 2]);
  });

  it("filters completed assignments (completed + failed)", () => {
    const completed = filterCompletedAssignments(assignments);
    expect(completed).toHaveLength(2);
    expect(completed.map(a => a.id)).toEqual([3, 4]);
  });

  it("returns empty array when no assignments match", () => {
    const allPending = [
      { myStatus: "not_started" as ProgressStatus },
      { myStatus: "in_progress" as ProgressStatus },
    ];
    expect(filterCompletedAssignments(allPending)).toHaveLength(0);
  });
});

describe("EducatorAssist — Leaderboard Aggregation", () => {
  const nameMap = new Map([
    [1, "Alice"],
    [2, "Bob"],
    [3, "Charlie"],
  ]);

  it("ranks students by average score descending", () => {
    const progressRows: ProgressRow[] = [
      { userId: 1, score: 80, status: "completed" },
      { userId: 1, score: 90, status: "completed" },
      { userId: 2, score: 70, status: "completed" },
      { userId: 3, score: 95, status: "completed" },
    ];
    const leaderboard = aggregateLeaderboard([1, 2, 3], progressRows, nameMap);
    expect(leaderboard[0].userId).toBe(3); // Charlie: 95
    expect(leaderboard[1].userId).toBe(1); // Alice: 85
    expect(leaderboard[2].userId).toBe(2); // Bob: 70
  });

  it("breaks ties by completed assignments count", () => {
    const progressRows: ProgressRow[] = [
      { userId: 1, score: 80, status: "completed" },
      { userId: 2, score: 80, status: "completed" },
      { userId: 2, score: 80, status: "completed" }, // Bob has 2 completions
    ];
    const leaderboard = aggregateLeaderboard([1, 2], progressRows, nameMap);
    expect(leaderboard[0].userId).toBe(2); // Bob: same score but more completions
    expect(leaderboard[1].userId).toBe(1);
  });

  it("places students with no progress at the bottom", () => {
    const progressRows: ProgressRow[] = [
      { userId: 1, score: 80, status: "completed" },
    ];
    const leaderboard = aggregateLeaderboard([1, 2, 3], progressRows, nameMap);
    expect(leaderboard[0].userId).toBe(1);
    expect(leaderboard[1].avgScore).toBeNull();
    expect(leaderboard[2].avgScore).toBeNull();
  });

  it("calculates average score correctly", () => {
    const progressRows: ProgressRow[] = [
      { userId: 1, score: 70, status: "completed" },
      { userId: 1, score: 90, status: "completed" },
      { userId: 1, score: 80, status: "completed" },
    ];
    const leaderboard = aggregateLeaderboard([1], progressRows, nameMap);
    expect(leaderboard[0].avgScore).toBe(80); // (70+90+80)/3 = 80
    expect(leaderboard[0].completedAssignments).toBe(3);
  });

  it("ignores null scores in average calculation", () => {
    const progressRows: ProgressRow[] = [
      { userId: 1, score: null, status: "in_progress" },
      { userId: 1, score: 80, status: "completed" },
    ];
    const leaderboard = aggregateLeaderboard([1], progressRows, nameMap);
    expect(leaderboard[0].avgScore).toBe(80); // Only scored row counted
    expect(leaderboard[0].completedAssignments).toBe(1);
  });
});
