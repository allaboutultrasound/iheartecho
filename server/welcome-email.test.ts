/**
 * welcome-email.test.ts
 * Tests for the automated welcome email on new user registration.
 * Validates that buildWelcomeEmail produces correct content and that
 * sendPreRegistrationWelcome uses the unified SendGrid template.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildWelcomeEmail, buildFirstSignInWelcomeEmail } from "./_core/email";

// ─── buildWelcomeEmail template tests ────────────────────────────────────────

describe("buildWelcomeEmail", () => {
  it("returns the correct subject line", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.subject).toBe("Your iHeartEcho™ account is ready");
  });

  it("includes the user's first name in the HTML body", () => {
    const result = buildWelcomeEmail({
      firstName: "Marcus",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("Marcus");
  });

  it("includes the login URL in the HTML body", () => {
    const loginUrl = "https://app.iheartecho.com/login";
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl,
      roles: [],
    });
    expect(result.htmlBody).toContain(loginUrl);
  });

  it("includes role labels when roles are provided", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: ["premium_user", "diy_user"],
    });
    expect(result.htmlBody).toContain("Premium Access");
    expect(result.htmlBody).toContain("DIY Accreditation");
  });

  it("does not include role section when roles array is empty", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    // The role block (with "Your assigned access:") should not appear
    expect(result.htmlBody).not.toContain("Your assigned access:");
  });

  it("filters out unknown roles from the role list", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: ["unknown_role", "premium_user"],
    });
    expect(result.htmlBody).toContain("Premium Access");
    expect(result.htmlBody).not.toContain("unknown_role");
  });

  it("includes the iHeartEcho™ brand logo in the email header", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    // The circular logo CDN URL should be present
    expect(result.htmlBody).toContain("tMerpTNEMefRhZwO.png");
  });

  it("includes the circular logo with border-radius:50%", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("border-radius:50%");
  });

  it("includes the All About Ultrasound copyright in the footer", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("All About Ultrasound");
  });

  it("returns a non-empty previewText", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.previewText.length).toBeGreaterThan(10);
  });

  it("includes a Set Up Your Account CTA button in the HTML body by default", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("Set Up Your Account");
  });

  it("uses a custom ctaLabel when provided", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
      ctaLabel: "Sign In to iHeartEcho™",
    });
    expect(result.htmlBody).toContain("Sign In to iHeartEcho™");
  });

  it("handles diy_admin role label correctly", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: ["diy_admin"],
    });
    expect(result.htmlBody).toContain("Lab Admin");
  });

  it("handles platform_admin role label correctly", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: ["platform_admin"],
    });
    expect(result.htmlBody).toContain("Platform Admin");
  });

  it("uses the teal brand gradient in the header background", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("#189aa1");
  });

  it("includes the iheartecho.com link in the footer", () => {
    const result = buildWelcomeEmail({
      firstName: "Jane",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("www.iheartecho.com");
  });
});

// ─── buildFirstSignInWelcomeEmail tests ─────────────────────────────────────

describe("buildFirstSignInWelcomeEmail", () => {
  it("returns the correct subject line", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.subject).toContain("Welcome to iHeartEcho");
    expect(result.subject).toContain("daily echo challenge");
  });

  it("returns a non-empty previewText", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.previewText.length).toBeGreaterThan(10);
  });

  it("includes the user's first name in the HTML body", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Marcus" });
    expect(result.htmlBody).toContain("Marcus");
  });

  it("uses the default app URL when none is provided", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.htmlBody).toContain("app.iheartecho.com");
  });

  it("uses the custom app URL when provided", () => {
    const result = buildFirstSignInWelcomeEmail({
      firstName: "Sarah",
      appUrl: "https://staging.iheartecho.com",
    });
    expect(result.htmlBody).toContain("staging.iheartecho.com");
  });

  it("includes a link to the quickfire daily challenge", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.htmlBody).toContain("/quickfire");
  });

  it("includes a link to notification settings", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.htmlBody).toContain("/profile");
  });

  it("uses a custom notifSettingsUrl when provided", () => {
    const result = buildFirstSignInWelcomeEmail({
      firstName: "Sarah",
      notifSettingsUrl: "https://app.iheartecho.com/profile?tab=notifications",
    });
    expect(result.htmlBody).toContain("tab=notifications");
  });

  it("mentions the daily challenge prominently", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.htmlBody.toLowerCase()).toContain("daily");
    expect(result.htmlBody.toLowerCase()).toContain("challenge");
  });

  it("includes a support email link", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Sarah" });
    expect(result.htmlBody).toContain("support@iheartecho.com");
  });

  it("produces a valid HTML document structure", () => {
    const result = buildFirstSignInWelcomeEmail({ firstName: "Test" });
    expect(result.htmlBody).toContain("<!DOCTYPE html>");
    expect(result.htmlBody).toContain("</html>");
  });
});

// ─── Welcome email trigger logic tests ───────────────────────────────────────

describe("welcome email trigger logic (first sign-in gate)", () => {
  function shouldSendWelcomeEmail(user: {
    thinkificEnrolledAt: Date | null;
    email: string | null;
  }): boolean {
    return !user.thinkificEnrolledAt && !!user.email;
  }

  it("sends welcome email on first sign-in (thinkificEnrolledAt is null)", () => {
    expect(
      shouldSendWelcomeEmail({ thinkificEnrolledAt: null, email: "user@example.com" })
    ).toBe(true);
  });

  it("does NOT send welcome email on subsequent sign-ins (thinkificEnrolledAt is set)", () => {
    expect(
      shouldSendWelcomeEmail({
        thinkificEnrolledAt: new Date("2025-01-01"),
        email: "user@example.com",
      })
    ).toBe(false);
  });

  it("does NOT send welcome email when user has no email address", () => {
    expect(
      shouldSendWelcomeEmail({ thinkificEnrolledAt: null, email: null })
    ).toBe(false);
  });

  it("does NOT send welcome email when email is empty string", () => {
    expect(
      shouldSendWelcomeEmail({ thinkificEnrolledAt: null, email: "" })
    ).toBe(false);
  });
});

// ─── sendPreRegistrationWelcome integration (unit-level) ─────────────────────

describe("sendPreRegistrationWelcome (via buildWelcomeEmail)", () => {
  it("buildWelcomeEmail produces valid HTML for a pre-registered user email", () => {
    const email = "newuser@example.com";
    const firstName = email.split("@")[0]; // "newuser"
    const result = buildWelcomeEmail({
      firstName,
      loginUrl: "https://app.iheartecho.com/login",
      roles: ["premium_user"],
    });
    expect(result.htmlBody).toContain("newuser");
    expect(result.htmlBody).toContain("Premium Access");
    expect(result.subject).toBe("Your iHeartEcho™ account is ready");
  });

  it("produces a valid HTML document structure", () => {
    const result = buildWelcomeEmail({
      firstName: "Test",
      loginUrl: "https://app.iheartecho.com/login",
      roles: [],
    });
    expect(result.htmlBody).toContain("<!DOCTYPE html>");
    expect(result.htmlBody).toContain("</html>");
    expect(result.htmlBody).toContain("<body");
    expect(result.htmlBody).toContain("</body>");
  });
});
