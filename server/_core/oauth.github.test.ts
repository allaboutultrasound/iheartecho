import express from "express";
import type { AddressInfo } from "node:net";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../../shared/const";

const mocks = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  activatePendingUser: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  ensureUserRole: vi.fn(),
  enrollInFreeMembership: vi.fn(),
  sendEmail: vi.fn(),
  buildFirstSignInWelcomeEmail: vi.fn(() => ({
    subject: "Welcome",
    htmlBody: "<p>Welcome</p>",
    previewText: "Welcome",
  })),
}));

vi.mock("./sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));

vi.mock("../db", () => ({
  activatePendingUser: mocks.activatePendingUser,
  upsertUser: mocks.upsertUser,
  getUserByOpenId: mocks.getUserByOpenId,
  ensureUserRole: mocks.ensureUserRole,
}));

vi.mock("../thinkific", () => ({
  enrollInFreeMembership: mocks.enrollInFreeMembership,
}));

vi.mock("./email", () => ({
  sendEmail: mocks.sendEmail,
  buildFirstSignInWelcomeEmail: mocks.buildFirstSignInWelcomeEmail,
}));

const { registerOAuthRoutes } = await import("./oauth");

function createApp() {
  const app = express();
  registerOAuthRoutes(app);
  return app;
}

async function request(app: express.Express, path: string) {
  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, {
      redirect: "manual",
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("GitHub OAuth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForToken.mockResolvedValue({
      access_token: "github-access-token",
      token_type: "bearer",
      scope: "read:user user:email",
    });
    mocks.getUserInfo.mockResolvedValue({
      openId: "123456",
      name: "octocat",
      email: "octocat@example.com",
    });
    mocks.createSessionToken.mockResolvedValue("signed-session-token");
    mocks.activatePendingUser.mockResolvedValue(false);
    mocks.upsertUser.mockResolvedValue(undefined);
    mocks.getUserByOpenId.mockResolvedValue({
      id: 1,
      openId: "123456",
      email: "octocat@example.com",
      name: "octocat",
      loginMethod: "github",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      thinkificEnrolledAt: new Date(),
      isPending: false,
    });
    mocks.ensureUserRole.mockResolvedValue(undefined);
  });

  it("uses GitHub's access_token field to fetch user info and set a session", async () => {
    const response = await request(createApp(), "/api/oauth/callback?code=code-123&state=state-456");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain(`${COOKIE_NAME}=signed-session-token`);
    expect(mocks.exchangeCodeForToken).toHaveBeenCalledWith("code-123", "state-456");
    expect(mocks.getUserInfo).toHaveBeenCalledWith("github-access-token");
    expect(mocks.upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "123456",
        name: "octocat",
        email: "octocat@example.com",
      })
    );
    expect(mocks.ensureUserRole).toHaveBeenCalledWith(1);
  });

  it("rejects token responses that do not include access_token", async () => {
    mocks.exchangeCodeForToken.mockResolvedValueOnce({
      token_type: "bearer",
    });

    const response = await request(createApp(), "/api/oauth/callback?code=code-123&state=state-456");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "access_token missing from OAuth token response" });
    expect(mocks.getUserInfo).not.toHaveBeenCalled();
  });
});
