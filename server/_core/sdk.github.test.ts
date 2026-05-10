import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

describe("GitHub OAuth SDK", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("exchanges a code as JSON and normalizes GitHub user info", async () => {
    const seen = {
      accept: "",
      tokenBody: "",
      authorization: "",
    };

    const server = createServer(async (req, res) => {
      if (req.url === "/token" && req.method === "POST") {
        seen.accept = req.headers.accept ?? "";
        seen.tokenBody = await readBody(req);
        writeJson(res, 200, {
          access_token: "github-access-token",
          token_type: "bearer",
          scope: "read:user user:email",
        });
        return;
      }

      if (req.url === "/user" && req.method === "GET") {
        seen.authorization = req.headers.authorization ?? "";
        writeJson(res, 200, {
          id: 123456,
          login: "octocat",
          name: "The Octocat",
          email: null,
        });
        return;
      }

      writeJson(res, 404, { error: "not found" });
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    try {
      process.env.JWT_SECRET = "test-secret";
      process.env.VITE_APP_ID = "test-app";
      process.env.OAUTH_TOKEN_URL = `http://127.0.0.1:${port}/token`;
      process.env.OAUTH_USERINFO_URL = `http://127.0.0.1:${port}/user`;
      process.env.OAUTH_CLIENT_ID = "github-client-id";
      process.env.OAUTH_CLIENT_SECRET = "github-client-secret";
      process.env.OAUTH_REDIRECT_URI = "https://app.iheartecho.com/api/oauth/callback";

      const { sdk } = await import("./sdk");
      const token = await sdk.exchangeCodeForToken("github-code", "state");
      const userInfo = await sdk.getUserInfo(token.access_token);

      expect(seen.accept).toContain("application/json");
      expect(Object.fromEntries(new URLSearchParams(seen.tokenBody))).toMatchObject({
        code: "github-code",
        client_id: "github-client-id",
        client_secret: "github-client-secret",
        redirect_uri: "https://app.iheartecho.com/api/oauth/callback",
      });
      expect(seen.authorization).toBe("Bearer github-access-token");
      expect(userInfo).toEqual({
        openId: "123456",
        name: "The Octocat",
        email: null,
        platform: null,
        loginMethod: null,
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
