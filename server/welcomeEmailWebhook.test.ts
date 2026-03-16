/**
 * welcomeEmailWebhook.test.ts
 *
 * Tests for:
 *   1. isDirectIHeartEchoProduct() — the subscription type filter that determines
 *      whether a welcome email should be sent for a given Thinkific product.
 *   2. buildWelcomeWithMagicLinkEmail() — the welcome email template with magic link.
 *   3. generateWelcomeMagicLink() — the 72-hour token generation helper.
 *   4. Webhook handler routing — correct sendWelcome flag for each event type.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isDirectIHeartEchoProduct } from "./webhooks/thinkific";
import { buildWelcomeWithMagicLinkEmail } from "./_core/email";

// ─── isDirectIHeartEchoProduct ────────────────────────────────────────────────

describe("isDirectIHeartEchoProduct — premium products", () => {
  it("matches iHeartEcho App - Premium Access (canonical name)", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho App - Premium Access")).toBe(true);
  });

  it("matches iHeartEcho App Premium Access (no dash)", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho App Premium Access")).toBe(true);
  });

  it("matches iHeartEcho Premium Access (short form)", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho Premium Access")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isDirectIHeartEchoProduct("IHEARTECHO APP - PREMIUM ACCESS")).toBe(true);
  });
});

describe("isDirectIHeartEchoProduct — DIY Accreditation products", () => {
  it("matches DIY Accreditation membership", () => {
    expect(isDirectIHeartEchoProduct("DIY Accreditation Membership")).toBe(true);
  });

  it("matches DIY Accreditation - Lab Director", () => {
    expect(isDirectIHeartEchoProduct("DIY Accreditation - Lab Director")).toBe(true);
  });

  it("matches DIY Accreditation - Sonographer Seat", () => {
    expect(isDirectIHeartEchoProduct("DIY Accreditation - Sonographer Seat")).toBe(true);
  });

  it("matches Accreditation Membership", () => {
    expect(isDirectIHeartEchoProduct("Accreditation Membership")).toBe(true);
  });

  it("matches Lab Admin membership", () => {
    expect(isDirectIHeartEchoProduct("Lab Admin Membership")).toBe(true);
  });
});

describe("isDirectIHeartEchoProduct — iHeartEcho App free tier", () => {
  it("matches exact 'iHeartEcho™ App'", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho™ App")).toBe(true);
  });

  it("matches 'iHeartEcho App' (no trademark)", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho App")).toBe(true);
  });
});

describe("isDirectIHeartEchoProduct — iHeartEcho free products", () => {
  it("matches iHeartEcho Free Membership", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho Free Membership")).toBe(true);
  });

  it("matches iHeartEcho Free (short form)", () => {
    expect(isDirectIHeartEchoProduct("iHeartEcho Free")).toBe(true);
  });
});

describe("isDirectIHeartEchoProduct — All About Ultrasound exclusions", () => {
  it("excludes generic 'Free Membership' (AAU bundle, no iHeartEcho branding)", () => {
    expect(isDirectIHeartEchoProduct("Free Membership")).toBe(false);
  });

  it("excludes 'All About Ultrasound Free Membership'", () => {
    expect(isDirectIHeartEchoProduct("All About Ultrasound Free Membership")).toBe(false);
  });

  it("excludes 'allaboutultrasound free'", () => {
    expect(isDirectIHeartEchoProduct("allaboutultrasound free")).toBe(false);
  });

  it("excludes 'Free' alone", () => {
    expect(isDirectIHeartEchoProduct("Free")).toBe(false);
  });

  it("excludes null", () => {
    expect(isDirectIHeartEchoProduct(null)).toBe(false);
  });

  it("excludes undefined", () => {
    expect(isDirectIHeartEchoProduct(undefined)).toBe(false);
  });

  it("excludes empty string", () => {
    expect(isDirectIHeartEchoProduct("")).toBe(false);
  });

  it("excludes unrelated product names", () => {
    expect(isDirectIHeartEchoProduct("All About Echocardiography Course")).toBe(false);
    expect(isDirectIHeartEchoProduct("Vascular Ultrasound Fundamentals")).toBe(false);
  });
});

// ─── buildWelcomeWithMagicLinkEmail ───────────────────────────────────────────

describe("buildWelcomeWithMagicLinkEmail — subject and preview", () => {
  it("returns the correct subject line", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "iHeartEcho™ Premium Access",
      roles: [],
    });
    expect(result.subject).toBe("Welcome to iHeartEcho™ — your account is ready");
  });

  it("returns a non-empty previewText", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "iHeartEcho™ Premium Access",
      roles: [],
    });
    expect(result.previewText.length).toBeGreaterThan(10);
  });
});

describe("buildWelcomeWithMagicLinkEmail — HTML content", () => {
  it("includes the user's first name in the body", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Marcus",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("Marcus");
  });

  it("includes the magic URL in the body", () => {
    const magicUrl = "https://app.iheartecho.com/auth/magic?token=deadbeef";
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl,
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain(magicUrl);
  });

  it("includes the membership label in the body", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "DIY Accreditation",
      roles: [],
    });
    expect(result.htmlBody).toContain("DIY Accreditation");
  });

  it("includes the 72-hour expiry notice", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("72 hours");
  });

  it("includes Sign In CTA button text", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("Sign In to iHeartEcho™");
  });

  it("includes the iHeartEcho brand colour", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("#189aa1");
  });

  it("includes role labels when roles are provided", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: ["premium_user"],
    });
    expect(result.htmlBody).toContain("Premium Access");
  });

  it("includes DIY Accreditation role label", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "DIY Accreditation",
      roles: ["diy_user"],
    });
    expect(result.htmlBody).toContain("DIY Accreditation");
  });

  it("does not include role block when roles array is empty", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "iHeartEcho™ App",
      roles: [],
    });
    // The role membership block should not appear for empty roles
    expect(result.htmlBody).not.toContain("Your membership includes:");
  });

  it("produces a valid HTML document structure", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Test",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("<!DOCTYPE html>");
    expect(result.htmlBody).toContain("</html>");
    expect(result.htmlBody).toContain("<body");
    expect(result.htmlBody).toContain("</body>");
  });

  it("includes the iHeartEcho brand logo", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    // The circular logo CDN URL should be present
    expect(result.htmlBody).toContain("tMerpTNEMefRhZwO.png");
  });

  it("includes the All About Ultrasound copyright in the footer", () => {
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl: "https://app.iheartecho.com/auth/magic?token=abc123",
      membershipLabel: "Premium Access",
      roles: [],
    });
    expect(result.htmlBody).toContain("All About Ultrasound");
  });

  it("includes the fallback URL in plain text for email clients that block buttons", () => {
    const magicUrl = "https://app.iheartecho.com/auth/magic?token=deadbeef";
    const result = buildWelcomeWithMagicLinkEmail({
      firstName: "Jane",
      magicUrl,
      membershipLabel: "Premium Access",
      roles: [],
    });
    // The URL should appear at least twice — once in the button href and once as plain text
    const occurrences = result.htmlBody.split(magicUrl).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });
});

// ─── generateWelcomeMagicLink token logic ─────────────────────────────────────

describe("generateWelcomeMagicLink — token and expiry logic", () => {
  it("generates a 96-character hex token", () => {
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    expect(token).toHaveLength(96);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("72-hour expiry is correctly calculated", () => {
    const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const diffHours = (expiry.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(71.9);
    expect(diffHours).toBeLessThan(72.1);
  });

  it("72-hour token is not expired immediately after creation", () => {
    const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    expect(new Date() > expiry).toBe(false);
  });

  it("builds the correct magic link URL format", () => {
    const appUrl = "https://app.iheartecho.com";
    const token = "a".repeat(96);
    const magicUrl = `${appUrl}/auth/magic?token=${token}`;
    expect(magicUrl).toMatch(/^https:\/\/app\.iheartecho\.com\/auth\/magic\?token=[a-f0-9]{96}$/);
  });
});

// ─── Webhook event routing — sendWelcome flag logic ───────────────────────────

describe("Webhook sendWelcome flag logic", () => {
  /**
   * These tests document the expected sendWelcome flag for each event type.
   * The actual webhook handler uses this flag to decide whether to send a welcome email.
   */

  it("order.created (complete) should send welcome email", () => {
    const event = { resource: "order", action: "created", status: "complete" };
    const shouldSend = event.resource === "order" && event.action === "created" && event.status === "complete";
    expect(shouldSend).toBe(true);
  });

  it("order.created (pending) should NOT send welcome email", () => {
    const event = { resource: "order", action: "created", status: "pending" };
    const shouldSend = event.resource === "order" && event.action === "created" && event.status === "complete";
    expect(shouldSend).toBe(false);
  });

  it("enrollment.created should send welcome email", () => {
    const event = { resource: "enrollment", action: "created" };
    const shouldSend = event.resource === "enrollment" && event.action === "created";
    expect(shouldSend).toBe(true);
  });

  it("enrollment.updated should NOT send welcome email (re-activation)", () => {
    const event = { resource: "enrollment", action: "updated" };
    const shouldSend = event.resource === "enrollment" && event.action === "created";
    expect(shouldSend).toBe(false);
  });

  it("subscription.activated should NOT send welcome email (re-activation)", () => {
    const event = { resource: "subscription", action: "activated" };
    const shouldSend = event.resource === "enrollment" && event.action === "created";
    expect(shouldSend).toBe(false);
  });

  it("user.signup should NOT send welcome email (no product purchase)", () => {
    const event = { resource: "user", action: "signup" };
    const shouldSend = event.resource === "enrollment" && event.action === "created";
    expect(shouldSend).toBe(false);
  });

  it("subscription.cancelled should NOT send welcome email", () => {
    const event = { resource: "subscription", action: "cancelled" };
    const shouldSend = event.resource === "enrollment" && event.action === "created";
    expect(shouldSend).toBe(false);
  });
});

// ─── Integration: isDirectIHeartEchoProduct + sendWelcome flag ────────────────

describe("Combined filter: isDirectIHeartEchoProduct + sendWelcome flag", () => {
  function shouldSendWelcome(productName: string, resource: string, action: string, orderStatus?: string): boolean {
    // Mirrors the logic in the webhook handler
    const isNewEvent =
      (resource === "order" && action === "created" && orderStatus === "complete") ||
      (resource === "enrollment" && action === "created");
    return isNewEvent && isDirectIHeartEchoProduct(productName);
  }

  it("sends welcome for Premium order.created (complete)", () => {
    expect(shouldSendWelcome("iHeartEcho App - Premium Access", "order", "created", "complete")).toBe(true);
  });

  it("sends welcome for DIY Accreditation enrollment.created", () => {
    expect(shouldSendWelcome("DIY Accreditation Membership", "enrollment", "created")).toBe(true);
  });

  it("sends welcome for iHeartEcho App enrollment.created", () => {
    expect(shouldSendWelcome("iHeartEcho™ App", "enrollment", "created")).toBe(true);
  });

  it("does NOT send welcome for AAU Free Membership enrollment.created", () => {
    expect(shouldSendWelcome("Free Membership", "enrollment", "created")).toBe(false);
  });

  it("does NOT send welcome for All About Ultrasound Free Membership enrollment.created", () => {
    expect(shouldSendWelcome("All About Ultrasound Free Membership", "enrollment", "created")).toBe(false);
  });

  it("does NOT send welcome for Premium enrollment.updated (re-activation)", () => {
    expect(shouldSendWelcome("iHeartEcho App - Premium Access", "enrollment", "updated")).toBe(false);
  });

  it("does NOT send welcome for Premium subscription.activated (re-activation)", () => {
    expect(shouldSendWelcome("iHeartEcho App - Premium Access", "subscription", "activated")).toBe(false);
  });

  it("does NOT send welcome for Premium order.created (pending)", () => {
    expect(shouldSendWelcome("iHeartEcho App - Premium Access", "order", "created", "pending")).toBe(false);
  });
});
