import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  OAuthTokenResponse,
  OAuthUserInfoResponse,
} from "./types/oauthTypes";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class OAuthService {
  constructor() {
    console.log("[OAuth] Initialized with token URL:", ENV.oAuthTokenUrl);
    if (!ENV.oAuthTokenUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_TOKEN_URL is not configured! Set OAUTH_TOKEN_URL environment variable."
      );
    }
    if (!ENV.oAuthUserInfoUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_USERINFO_URL is not configured! Set OAUTH_USERINFO_URL environment variable."
      );
    }
  }

  async getTokenByCode(
    code: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: ENV.oAuthClientId,
      client_secret: ENV.oAuthClientSecret,
    });

    const { data } = await axios.post<OAuthTokenResponse>(
      ENV.oAuthTokenUrl,
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: AXIOS_TIMEOUT_MS,
      }
    );

    return data;
  }

  async getUserInfoByToken(accessToken: string): Promise<OAuthUserInfoResponse> {
    const { data } = await axios.get<Record<string, unknown>>(
      ENV.oAuthUserInfoUrl,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: AXIOS_TIMEOUT_MS,
      }
    );

    // Normalise provider-specific fields into our common shape.
    // Google uses "sub", GitHub uses "id" or "login", others may use "sub" or "id".
    const rawId =
      (data["sub"] as string | undefined) ??
      String(data["id"] ?? "") ??
      "";

    const name =
      (data["name"] as string | undefined) ??
      (data["login"] as string | undefined) ??
      "";

    const email =
      (data["email"] as string | null | undefined) ?? null;

    return {
      openId: rawId,
      name,
      email,
      platform: null,
      loginMethod: null,
    };
  }
}

class SDKServer {
  private readonly oauthService: OAuthService;

  constructor() {
    this.oauthService = new OAuthService();
  }

  /**
   * Exchange OAuth authorization code for access token.
   * The redirect_uri is taken from OAUTH_REDIRECT_URI; the state parameter
   * is accepted for API compatibility but is not used for redirect resolution
   * (the redirect URI is configured statically via env var).
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    _state: string
  ): Promise<OAuthTokenResponse> {
    return this.oauthService.getTokenByCode(code, ENV.oAuthRedirectUri);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<OAuthUserInfoResponse> {
    return this.oauthService.getUserInfoByToken(accessToken);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    const isEmailPasswordUser = sessionUserId.startsWith("email:");
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update lastSignedIn — skip upsertUser for email/password users since it
    // requires openId to be non-null and the update path is simpler via direct DB.
    if (!isEmailPasswordUser && user.openId) {
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
      });
    } else {
      // For email/password users, update lastSignedIn directly
      const { getDb } = await import("../db");
      const database = await getDb();
      if (database) {
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await database.update(users).set({ lastSignedIn: signedInAt }).where(eq(users.id, user.id));
      }
    }

    return user;
  }
}

export const sdk = new SDKServer();
