import { describe, expect, it } from "vitest";
import { buildPublicAppUrl, getPublicAppUrl } from "./_core/appUrl";

describe("public app URL helpers", () => {
  it("uses PUBLIC_APP_URL when configured", () => {
    expect(getPublicAppUrl({ PUBLIC_APP_URL: "https://example.com/" })).toBe("https://example.com");
  });

  it("normalizes Railway public domains without a protocol", () => {
    expect(getPublicAppUrl({ RAILWAY_PUBLIC_DOMAIN: "app.iheartecho.com" })).toBe(
      "https://app.iheartecho.com"
    );
  });

  it("falls back to the production app domain", () => {
    expect(getPublicAppUrl({})).toBe("https://app.iheartecho.com");
  });

  it("builds magic-link paths without duplicate slashes", () => {
    expect(
      buildPublicAppUrl("/auth/magic?token=abc", { APP_URL: "https://app.iheartecho.com/" })
    ).toBe("https://app.iheartecho.com/auth/magic?token=abc");
  });
});
