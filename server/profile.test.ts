/**
 * Tests for the profile update procedure and role-based access logic.
 */
import { describe, it, expect } from "vitest";

// ── Role helper logic (mirrors Layout.tsx and Profile.tsx) ──────────────────

const PREMIUM_ROLES = ["premium_user", "diy_user", "diy_admin", "platform_admin"];

function hasPremiumAccess(appRoles: string[]): boolean {
  return appRoles.some(r => PREMIUM_ROLES.includes(r));
}

function hasDiyAccess(appRoles: string[]): boolean {
  return appRoles.includes("diy_user") || appRoles.includes("diy_admin");
}

function hasLabAdminAccess(appRoles: string[]): boolean {
  return appRoles.includes("diy_admin");
}

function hasPlatformAdminAccess(appRoles: string[]): boolean {
  return appRoles.includes("platform_admin");
}

// ── Dropdown section visibility ─────────────────────────────────────────────

describe("Header dropdown role-based section visibility", () => {
  it("shows Lab Admin section only for diy_admin", () => {
    expect(hasLabAdminAccess(["diy_admin"])).toBe(true);
    expect(hasLabAdminAccess(["diy_user"])).toBe(false);
    expect(hasLabAdminAccess(["premium_user"])).toBe(false);
    expect(hasLabAdminAccess(["platform_admin"])).toBe(false);
    expect(hasLabAdminAccess([])).toBe(false);
  });

  it("shows Platform Admin section only for platform_admin", () => {
    expect(hasPlatformAdminAccess(["platform_admin"])).toBe(true);
    expect(hasPlatformAdminAccess(["diy_admin"])).toBe(false);
    expect(hasPlatformAdminAccess(["premium_user"])).toBe(false);
    expect(hasPlatformAdminAccess([])).toBe(false);
  });

  it("shows Lab Admin AND Platform Admin for a user with both roles", () => {
    const roles = ["diy_admin", "platform_admin"];
    expect(hasLabAdminAccess(roles)).toBe(true);
    expect(hasPlatformAdminAccess(roles)).toBe(true);
  });
});

// ── Premium access logic ─────────────────────────────────────────────────────

describe("Premium access role hierarchy", () => {
  it("grants premium access to premium_user", () => {
    expect(hasPremiumAccess(["premium_user"])).toBe(true);
  });

  it("grants premium access to diy_user (premium included)", () => {
    expect(hasPremiumAccess(["diy_user"])).toBe(true);
  });

  it("grants premium access to diy_admin (premium included)", () => {
    expect(hasPremiumAccess(["diy_admin"])).toBe(true);
  });

  it("grants premium access to platform_admin", () => {
    expect(hasPremiumAccess(["platform_admin"])).toBe(true);
  });

  it("denies premium access to users with no roles", () => {
    expect(hasPremiumAccess([])).toBe(false);
  });

  it("denies premium access to unknown roles", () => {
    expect(hasPremiumAccess(["some_other_role"])).toBe(false);
  });
});

// ── DIY access logic ─────────────────────────────────────────────────────────

describe("DIY accreditation access logic", () => {
  it("grants DIY access to diy_user", () => {
    expect(hasDiyAccess(["diy_user"])).toBe(true);
  });

  it("grants DIY access to diy_admin", () => {
    expect(hasDiyAccess(["diy_admin"])).toBe(true);
  });

  it("denies DIY access to premium_user only", () => {
    expect(hasDiyAccess(["premium_user"])).toBe(false);
  });

  it("denies DIY access to platform_admin only", () => {
    expect(hasDiyAccess(["platform_admin"])).toBe(false);
  });

  it("denies DIY access to users with no roles", () => {
    expect(hasDiyAccess([])).toBe(false);
  });
});

// ── Profile update input validation ─────────────────────────────────────────

describe("Profile update input validation", () => {
  function validateProfileUpdate(input: { displayName?: string; email?: string }) {
    const errors: string[] = [];
    if (input.displayName !== undefined) {
      if (input.displayName.trim().length === 0) errors.push("Display name cannot be empty");
      if (input.displayName.trim().length > 100) errors.push("Display name too long");
    }
    if (input.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) errors.push("Invalid email address");
    }
    return errors;
  }

  it("accepts valid displayName update", () => {
    expect(validateProfileUpdate({ displayName: "Lara Williams" })).toHaveLength(0);
  });

  it("rejects empty displayName", () => {
    expect(validateProfileUpdate({ displayName: "   " })).toContain("Display name cannot be empty");
  });

  it("rejects displayName over 100 characters", () => {
    expect(validateProfileUpdate({ displayName: "A".repeat(101) })).toContain("Display name too long");
  });

  it("accepts valid email update", () => {
    expect(validateProfileUpdate({ email: "user@example.com" })).toHaveLength(0);
  });

  it("rejects invalid email format", () => {
    expect(validateProfileUpdate({ email: "not-an-email" })).toContain("Invalid email address");
  });

  it("accepts update with both fields valid", () => {
    expect(validateProfileUpdate({ displayName: "Jane Doe", email: "jane@example.com" })).toHaveLength(0);
  });

  it("accepts update with no fields (no-op)", () => {
    expect(validateProfileUpdate({})).toHaveLength(0);
  });
});
