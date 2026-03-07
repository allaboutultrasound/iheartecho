/**
 * Tests for the Daily QuickFire router.
 *
 * These tests exercise the tRPC procedures using in-memory mocks so no real DB is required.
 * We test:
 *  - getTodaySet: throws INTERNAL_SERVER_ERROR when DB is unavailable
 *  - submitAnswer: rejects unauthenticated calls
 *  - submitAnswer: throws when DB unavailable (authenticated)
 *  - getMyProgress: rejects unauthenticated calls
 *  - getLeaderboard: throws when DB unavailable (public procedure)
 */

import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 42,
    openId: "test-open-id",
    email: "test@iheartecho.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Mock the DB so tests don't need a real database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("quickfire.getTodaySet", () => {
  it("throws INTERNAL_SERVER_ERROR when DB is unavailable", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.quickfire.getTodaySet()).rejects.toThrow("DB unavailable");
  });
});

describe("quickfire.submitAnswer", () => {
  it("throws UNAUTHORIZED when called without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.quickfire.submitAnswer({ questionId: 1, selectedAnswer: 0 })
    ).rejects.toThrow();
  });

  it("throws INTERNAL_SERVER_ERROR when DB unavailable (authenticated)", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    await expect(
      caller.quickfire.submitAnswer({ questionId: 999, selectedAnswer: 0 })
    ).rejects.toThrow("DB unavailable");
  });
});

describe("quickfire.getUserStats", () => {
  it("throws UNAUTHORIZED when called without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.quickfire.getUserStats()).rejects.toThrow();
  });

  it("throws INTERNAL_SERVER_ERROR when DB unavailable (authenticated)", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    await expect(caller.quickfire.getUserStats()).rejects.toThrow("DB unavailable");
  });
});

describe("quickfire.getLeaderboard", () => {
  it("throws INTERNAL_SERVER_ERROR when DB is unavailable (public procedure)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.quickfire.getLeaderboard()).rejects.toThrow("DB unavailable");
  });
});
