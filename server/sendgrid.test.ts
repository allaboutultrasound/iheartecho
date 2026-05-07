/**
 * SendGrid API key validation test.
 *
 * This hits a live third-party API, so it is opt-in. Regular unit-test runs
 * should not fail just because local/CI secrets are absent or rotated.
 */
import { describe, expect, it } from "vitest";

const runLiveIntegrationTests = process.env.RUN_LIVE_INTEGRATION_TESTS === "true";
const liveIt = runLiveIntegrationTests ? it : it.skip;

describe("SendGrid API Key", () => {
  liveIt("should authenticate successfully with the SendGrid API", async () => {
    const key = process.env.SENDGRID_API_KEY;
    expect(key, "SENDGRID_API_KEY must be set for live integration tests").toBeTruthy();
    expect(key?.startsWith("SG."), "SENDGRID_API_KEY must start with SG.").toBe(true);

    const res = await fetch("https://api.sendgrid.com/v3/user/profile", {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });

    expect(res.status, `SendGrid API returned ${res.status} — check your API key`).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    // SendGrid user/profile returns first_name, last_name, company, etc.
    expect(data).toHaveProperty("first_name");
    console.log(`[SendGrid] Authenticated as: ${data.first_name} ${data.last_name} (${data.company})`);
  }, 15_000);
});
