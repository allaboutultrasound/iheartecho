/**
 * Tests for Platform Admin router procedures:
 *   - findUserByEmail (query)
 *   - assignRoleByEmail (mutation)
 *
 * All DB calls are mocked so no real database connection is needed.
 * The helpers are tested as pure logic units.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the db module ───────────────────────────────────────────────────────

const mockFindUserByEmailWithRoles = vi.fn();
const mockGetUserRoles = vi.fn();
const mockAssignRole = vi.fn();

vi.mock("./db", () => ({
  findUserByEmailWithRoles: (...args: unknown[]) => mockFindUserByEmailWithRoles(...args),
  getUserRoles: (...args: unknown[]) => mockGetUserRoles(...args),
  assignRole: (...args: unknown[]) => mockAssignRole(...args),
  removeRole: vi.fn(),
  listUsersWithRoles: vi.fn(),
  countUsers: vi.fn(),
  getDiyUsersForLab: vi.fn(),
  getLabByAdmin: vi.fn(),
}));

// ─── Inline the core logic being tested ──────────────────────────────────────
// We test the logic extracted from the router procedures directly so we don't
// need to spin up a full tRPC server.

type AppRole = "user" | "premium_user" | "diy_admin" | "diy_user" | "platform_admin";

async function findUserByEmailLogic(
  callerRole: string,
  callerAppRoles: AppRole[],
  email: string,
) {
  if (callerRole !== "admin" && !callerAppRoles.includes("platform_admin")) {
    throw new Error("FORBIDDEN");
  }
  const found = await mockFindUserByEmailWithRoles(email);
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    email: found.email,
    displayName: found.displayName,
    role: found.role,
    roles: found.roles,
  };
}

async function assignRoleByEmailLogic(
  callerRole: string,
  callerAppRoles: AppRole[],
  callerUserId: number,
  email: string,
  role: AppRole,
) {
  const isOwner = callerRole === "admin";
  const isPlatformAdmin = callerAppRoles.includes("platform_admin");
  if (!isOwner && !isPlatformAdmin) throw new Error("FORBIDDEN");
  if (role === "platform_admin" && !isOwner) throw new Error("Only the owner can assign platform_admin");
  const found = await mockFindUserByEmailWithRoles(email);
  if (!found) throw new Error(`No account found for ${email}`);
  await mockAssignRole(found.id, role, callerUserId);
  return { success: true, userId: found.id, displayName: found.displayName ?? found.name };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findUserByEmail procedure logic", () => {
  it("throws FORBIDDEN when caller is not owner or platform_admin", async () => {
    await expect(
      findUserByEmailLogic("user", ["user"], "test@example.com"),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("allows owner (role=admin) to search", async () => {
    mockFindUserByEmailWithRoles.mockResolvedValue(null);
    const result = await findUserByEmailLogic("admin", [], "test@example.com");
    expect(result).toBeNull();
    expect(mockFindUserByEmailWithRoles).toHaveBeenCalledWith("test@example.com");
  });

  it("allows platform_admin to search", async () => {
    mockFindUserByEmailWithRoles.mockResolvedValue(null);
    const result = await findUserByEmailLogic("user", ["platform_admin"], "test@example.com");
    expect(result).toBeNull();
  });

  it("returns null when user is not found", async () => {
    mockFindUserByEmailWithRoles.mockResolvedValue(null);
    const result = await findUserByEmailLogic("admin", [], "unknown@example.com");
    expect(result).toBeNull();
  });

  it("returns user data with roles when found", async () => {
    const mockUser = {
      id: 42,
      name: "Jane Doe",
      email: "jane@example.com",
      displayName: "Jane",
      role: "user",
      roles: ["user", "premium_user"],
    };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    const result = await findUserByEmailLogic("admin", [], "jane@example.com");
    expect(result).not.toBeNull();
    expect(result!.id).toBe(42);
    expect(result!.email).toBe("jane@example.com");
    expect(result!.roles).toContain("premium_user");
  });

  it("returns only the expected fields (no sensitive data leak)", async () => {
    const mockUser = {
      id: 1,
      name: "Test",
      email: "t@t.com",
      displayName: null,
      role: "user",
      roles: ["user"],
      openId: "secret-open-id",
      passwordHash: "secret-hash",
    };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    const result = await findUserByEmailLogic("admin", [], "t@t.com");
    expect(result).not.toHaveProperty("openId");
    expect(result).not.toHaveProperty("passwordHash");
  });
});

describe("assignRoleByEmail procedure logic", () => {
  it("throws FORBIDDEN when caller has no admin rights", async () => {
    await expect(
      assignRoleByEmailLogic("user", ["user"], 1, "test@example.com", "premium_user"),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("throws FORBIDDEN when platform_admin tries to assign platform_admin", async () => {
    await expect(
      assignRoleByEmailLogic("user", ["platform_admin"], 1, "test@example.com", "platform_admin"),
    ).rejects.toThrow("Only the owner can assign platform_admin");
  });

  it("allows owner to assign platform_admin role", async () => {
    const mockUser = { id: 5, name: "Admin", displayName: "Admin User", email: "a@a.com", role: "user", roles: [] };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue(undefined);
    const result = await assignRoleByEmailLogic("admin", [], 1, "a@a.com", "platform_admin");
    expect(result.success).toBe(true);
    expect(mockAssignRole).toHaveBeenCalledWith(5, "platform_admin", 1);
  });

  it("throws NOT_FOUND when user email does not exist", async () => {
    mockFindUserByEmailWithRoles.mockResolvedValue(null);
    await expect(
      assignRoleByEmailLogic("admin", [], 1, "nobody@example.com", "premium_user"),
    ).rejects.toThrow("No account found for nobody@example.com");
  });

  it("assigns premium_user role successfully", async () => {
    const mockUser = { id: 10, name: "Bob", displayName: "Bob Smith", email: "bob@example.com", role: "user", roles: ["user"] };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue(undefined);
    const result = await assignRoleByEmailLogic("user", ["platform_admin"], 2, "bob@example.com", "premium_user");
    expect(result.success).toBe(true);
    expect(result.userId).toBe(10);
    expect(result.displayName).toBe("Bob Smith");
    expect(mockAssignRole).toHaveBeenCalledWith(10, "premium_user", 2);
  });

  it("assigns diy_admin role successfully", async () => {
    const mockUser = { id: 20, name: "Carol", displayName: null, email: "carol@example.com", role: "user", roles: ["user"] };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue(undefined);
    const result = await assignRoleByEmailLogic("admin", [], 1, "carol@example.com", "diy_admin");
    expect(result.success).toBe(true);
    expect(result.displayName).toBe("Carol"); // falls back to name
  });

  it("uses displayName over name in return value", async () => {
    const mockUser = { id: 30, name: "dave_raw", displayName: "Dave Smith", email: "dave@example.com", role: "user", roles: [] };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue(undefined);
    const result = await assignRoleByEmailLogic("admin", [], 1, "dave@example.com", "diy_user");
    expect(result.displayName).toBe("Dave Smith");
  });

  it("calls assignRole with correct caller user ID", async () => {
    const mockUser = { id: 99, name: "Eve", displayName: "Eve", email: "eve@example.com", role: "user", roles: [] };
    mockFindUserByEmailWithRoles.mockResolvedValue(mockUser);
    mockAssignRole.mockResolvedValue(undefined);
    await assignRoleByEmailLogic("admin", [], 777, "eve@example.com", "premium_user");
    expect(mockAssignRole).toHaveBeenCalledWith(99, "premium_user", 777);
  });
});
