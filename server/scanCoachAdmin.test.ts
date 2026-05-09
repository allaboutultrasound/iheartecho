/**
 * scanCoachAdmin.test.ts
 * Tests for the ScanCoach WYSIWYG admin router.
 * Covers: auth guard, listOverrides, upsertOverride, deleteOverride, clearImageField.
 * Note: uploadImage is not tested here as it requires a live S3 connection.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type MockScanCoachOverride = Record<string, unknown> & {
  id: number;
  module: string;
  viewId: string;
};

const scanCoachDbState = vi.hoisted(() => ({
  rows: [] as MockScanCoachOverride[],
  nextId: 1,
}));

function extractWherePredicate(condition: unknown): (row: MockScanCoachOverride) => boolean {
  if (!condition || typeof condition !== "object") return () => true;

  const columns: string[] = [];
  const values: unknown[] = [];

  function walk(value: unknown) {
    if (!value || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    if (
      typeof record.name === "string" &&
      record.table &&
      record.config &&
      !columns.includes(record.name)
    ) {
      columns.push(record.name);
    }

    if ("value" in record && !Array.isArray(record.value)) {
      values.push(record.value);
    }

    for (const [key, child] of Object.entries(record)) {
      if (key === "table") continue;
      if (Array.isArray(child)) {
        child.forEach(walk);
      } else {
        walk(child);
      }
    }
  }

  walk(condition);

  const filters = columns
    .slice(0, values.length)
    .map((column, index) => [column, values[index]] as const);

  return (row) => filters.every(([column, value]) => row[column] === value);
}

function projectRow(
  row: MockScanCoachOverride,
  projection?: Record<string, unknown>
): Record<string, unknown> {
  if (!projection) return { ...row };
  return Object.fromEntries(Object.keys(projection).map((key) => [key, row[key]]));
}

function makeQueryResult(
  resolveRows: () => MockScanCoachOverride[],
  projection?: Record<string, unknown>
) {
  const materialize = () => resolveRows().map((row) => projectRow(row, projection));

  return {
    where(condition: unknown) {
      const predicate = extractWherePredicate(condition);
      return makeQueryResult(() => resolveRows().filter(predicate), projection);
    },
    limit(count: number) {
      return materialize().slice(0, count);
    },
    then<TResult1 = Record<string, unknown>[], TResult2 = never>(
      onfulfilled?: ((value: Record<string, unknown>[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(materialize()).then(onfulfilled, onrejected);
    },
  };
}

const mockDb = {
  select: (projection?: Record<string, unknown>) => ({
    from: () => makeQueryResult(() => scanCoachDbState.rows, projection),
  }),
  insert: () => ({
    values: async (payload: Omit<MockScanCoachOverride, "id">) => {
      const id = scanCoachDbState.nextId++;
      scanCoachDbState.rows.push({ id, ...payload });
      return [{ insertId: id }];
    },
  }),
  update: () => ({
    set: (payload: Partial<MockScanCoachOverride>) => ({
      where: async (condition: unknown) => {
        const predicate = extractWherePredicate(condition);
        scanCoachDbState.rows = scanCoachDbState.rows.map((row) =>
          predicate(row) ? { ...row, ...payload } : row
        );
        return [];
      },
    }),
  }),
  delete: () => ({
    where: async (condition: unknown) => {
      const predicate = extractWherePredicate(condition);
      scanCoachDbState.rows = scanCoachDbState.rows.filter((row) => !predicate(row));
      return [];
    },
  }),
};

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getDb: vi.fn(async () => mockDb),
    getUserRoles: vi.fn(async () => []),
  };
});

// ─── Context helpers ──────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    // Use a very high ID that will never exist in the DB (no DB roles)
    id: 999_999_001,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "imported",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

/** Admin context: role === "admin" bypasses the DB role check */
function makeAdminCtx(): TrpcContext {
  return makeCtx({ role: "admin" });
}

/** Regular user context: role === "user", no DB roles (high ID) */
function makeUserCtx(): TrpcContext {
  return makeCtx({ role: "user" });
}

function makeUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  scanCoachDbState.rows = [];
  scanCoachDbState.nextId = 1;
});

describe("scanCoachAdmin.listOverrides", () => {
  // listOverrides is a publicProcedure — accessible by all users including unauthenticated
  it("allows unauthenticated callers (public procedure)", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    const result = await caller.scanCoachAdmin.listOverrides({ module: "tte" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows non-admin users to read overrides (public procedure)", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.scanCoachAdmin.listOverrides({ module: "tte" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an array for admin users", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.scanCoachAdmin.listOverrides({ module: "tte" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts all valid module values", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const modules = ["tte", "tee", "ice", "uea", "strain"] as const;
    for (const mod of modules) {
      const result = await caller.scanCoachAdmin.listOverrides({ module: mod });
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it("returns all overrides when no module filter is provided", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.scanCoachAdmin.listOverrides({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("scanCoachAdmin.upsertOverride", () => {
  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.scanCoachAdmin.upsertOverride({
        module: "tte",
        viewId: "plax",
        description: "Test description",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a new override for admin", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.scanCoachAdmin.upsertOverride({
      module: "tte",
      viewId: `test-view-${Date.now()}`,
      viewName: "Test View",
      description: "Test override description",
      tips: JSON.stringify(["Tip 1", "Tip 2"]),
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    expect(result.created).toBe(true);
  });

  it("updates an existing override (upsert)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const viewId = `upsert-test-${Date.now()}`;

    // First insert
    const first = await caller.scanCoachAdmin.upsertOverride({
      module: "tee",
      viewId,
      description: "Initial description",
    });
    expect(first.created).toBe(true);
    expect(typeof first.id).toBe("number");

    // Second call should update, not create
    const second = await caller.scanCoachAdmin.upsertOverride({
      module: "tee",
      viewId,
      description: "Updated description",
    });
    expect(second.created).toBe(false);
    // The ID should match the first insert
    expect(second.id).toBe(first.id);
  });

  it("rejects invalid module values", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.scanCoachAdmin.upsertOverride({
        module: "invalid" as any,
        viewId: "plax",
      })
    ).rejects.toThrow();
  });
});

describe("scanCoachAdmin.deleteOverride", () => {
  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.scanCoachAdmin.deleteOverride({ id: 1 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("deletes an existing override", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const viewId = `delete-test-${Date.now()}`;

    // Create first
    const created = await caller.scanCoachAdmin.upsertOverride({
      module: "ice",
      viewId,
      description: "To be deleted",
    });
    expect(typeof created.id).toBe("number");

    // Delete it
    const result = await caller.scanCoachAdmin.deleteOverride({ id: created.id });
    expect(result.deleted).toBe(true);
  });

  it("succeeds silently when deleting a non-existent ID", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.scanCoachAdmin.deleteOverride({ id: 999999 });
    expect(result.deleted).toBe(true);
  });
});

describe("scanCoachAdmin.clearImageField", () => {
  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.scanCoachAdmin.clearImageField({ id: 1, field: "echoImageUrl" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("clears an image field on an existing override", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const viewId = `clear-test-${Date.now()}`;

    // Create with an image URL
    const created = await caller.scanCoachAdmin.upsertOverride({
      module: "uea",
      viewId,
      echoImageUrl: "https://example.com/image.png",
    });
    expect(typeof created.id).toBe("number");

    // Clear the echo image field
    const result = await caller.scanCoachAdmin.clearImageField({
      id: created.id,
      field: "echoImageUrl",
    });
    expect(result.cleared).toBe(true);
  });

  it("rejects invalid field names", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.scanCoachAdmin.clearImageField({
        id: 1,
        field: "invalidField" as any,
      })
    ).rejects.toThrow();
  });
});
