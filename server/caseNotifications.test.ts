/**
 * Case notification email template tests
 * Validates that buildCaseApprovedEmail and buildCaseRejectedEmail produce
 * correct subjects, preview text, and HTML content without making real API calls.
 */
import { describe, it, expect } from "vitest";
import { buildCaseApprovedEmail, buildCaseRejectedEmail } from "./_core/email";

describe("buildCaseApprovedEmail", () => {
  const opts = {
    firstName: "Sarah",
    caseTitle: "Severe AS with Low-Flow Low-Gradient Pattern",
    caseUrl: "https://app.iheartecho.com/case-library/42",
  };

  it("should return a subject containing the case title", () => {
    const { subject } = buildCaseApprovedEmail(opts);
    expect(subject).toContain(opts.caseTitle);
  });

  it("should return a subject indicating approval", () => {
    const { subject } = buildCaseApprovedEmail(opts);
    expect(subject.toLowerCase()).toContain("approved");
  });

  it("should include the user's first name in the HTML body", () => {
    const { htmlBody } = buildCaseApprovedEmail(opts);
    expect(htmlBody).toContain(opts.firstName);
  });

  it("should include the case title in the HTML body", () => {
    const { htmlBody } = buildCaseApprovedEmail(opts);
    expect(htmlBody).toContain(opts.caseTitle);
  });

  it("should include a link to the case URL in the HTML body", () => {
    const { htmlBody } = buildCaseApprovedEmail(opts);
    expect(htmlBody).toContain(opts.caseUrl);
  });

  it("should include a non-empty previewText", () => {
    const { previewText } = buildCaseApprovedEmail(opts);
    expect(previewText.length).toBeGreaterThan(10);
  });

  it("should produce valid HTML with doctype", () => {
    const { htmlBody } = buildCaseApprovedEmail(opts);
    expect(htmlBody.trim().toLowerCase()).toMatch(/^<!doctype html>/);
  });

  it("should include iHeartEcho branding in the HTML body", () => {
    const { htmlBody } = buildCaseApprovedEmail(opts);
    expect(htmlBody).toContain("iHeartEcho");
  });
});

describe("buildCaseRejectedEmail", () => {
  const opts = {
    firstName: "James",
    caseTitle: "Dilated Cardiomyopathy with Reduced EF",
    reason: "The submitted images do not clearly demonstrate the described findings. Please resubmit with higher quality clips.",
    submitUrl: "https://app.iheartecho.com/case-library/submit",
  };

  it("should return a subject containing the case title", () => {
    const { subject } = buildCaseRejectedEmail(opts);
    expect(subject).toContain(opts.caseTitle);
  });

  it("should include the user's first name in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain(opts.firstName);
  });

  it("should include the case title in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain(opts.caseTitle);
  });

  it("should include the rejection reason in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain(opts.reason);
  });

  it("should include a link to the submit URL in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain(opts.submitUrl);
  });

  it("should include a HIPAA reminder in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody.toLowerCase()).toContain("hipaa");
  });

  it("should include a non-empty previewText", () => {
    const { previewText } = buildCaseRejectedEmail(opts);
    expect(previewText.length).toBeGreaterThan(10);
  });

  it("should produce valid HTML with doctype", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody.trim().toLowerCase()).toMatch(/^<!doctype html>/);
  });

  it("should include iHeartEcho branding in the HTML body", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain("iHeartEcho");
  });

  it("should include a support contact email", () => {
    const { htmlBody } = buildCaseRejectedEmail(opts);
    expect(htmlBody).toContain("support@iheartecho.com");
  });
});
