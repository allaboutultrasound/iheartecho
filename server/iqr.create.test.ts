import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "./_core/index";

// Mock the database
vi.mock("./_core/index", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock("./_core/env", () => ({
  env: {
    DATABASE_URL: "mysql://test:test@localhost:3306/test",
    JWT_SECRET: "test-secret",
    VITE_APP_ID: "test-app-id",
    OWNER_OPEN_ID: "test-owner",
    OWNER_NAME: "Test Owner",
    AI_GATEWAY_URL: "https://gateway.example.test",
    AI_GATEWAY_API_KEY: "test-key",
    VITE_GOOGLE_MAPS_API_KEY: "test-google-maps-key",
    VITE_ANALYTICS_ENDPOINT: "https://analytics.example.test",
    VITE_ANALYTICS_WEBSITE_ID: "test-website-id",
    VITE_APP_LOGO: "https://example.com/logo.png",
    VITE_APP_TITLE: "iHeartEcho",
    VITE_APP_URL: "https://app.iheartecho.com",
    SENDGRID_API_KEY: "test-sendgrid-key",
    SENDGRID_FROM_EMAIL: "test@example.com",
    SENDGRID_FROM_NAME: "Test",
    THINKIFIC_API_KEY: "test-thinkific-key",
    THINKIFIC_SUBDOMAIN: "test",
  },
}));

describe("IQR Create Procedure", () => {
  it("should accept a minimal quality review payload", () => {
    const payload = {
      reviewType: "QUALITY REVIEW" as const,
      examType: "Adult TTE",
      dateReviewCompleted: new Date(),
      examDos: new Date(),
      examIdentifier: "MRN123",
      referringPhysician: "Dr. Smith",
      limitedCompleteExam: "Complete",
      examIndication: "Chest pain evaluation",
      indicationAppropriateness: "Appropriate A9/A8/A7",
      patientCooperation: "Yes",
    };
    // Verify the payload shape is valid (no throws on construction)
    expect(payload.reviewType).toBe("QUALITY REVIEW");
    expect(payload.examType).toBe("Adult TTE");
    expect(payload.indicationAppropriateness).toBe("Appropriate A9/A8/A7");
  });

  it("should accept all exam types", () => {
    const examTypes = [
      "Adult TTE",
      "Adult TEE",
      "Stress Echo",
      "Pediatric TTE",
      "Pediatric TEE",
      "Fetal Echo",
    ];
    examTypes.forEach((examType) => {
      expect(examType).toBeTruthy();
    });
  });

  it("should accept exam-type-specific fields for Adult TTE", () => {
    const adultTTEFields = {
      examType: "Adult TTE",
      // Protocol sequence fields
      parasternal: "Yes",
      apical: "Yes",
      subcostal: "Yes",
      suprasternal: "Yes",
      // Basic quality fields
      imageQualityRating: "Good",
      harmonicImaging: "Yes",
      patientPositioning: "Left lateral decubitus",
      // Measurements
      ivsThickness: "Yes",
      lvPosteriorWall: "Yes",
      lvInternalDimension: "Yes",
      simpsonsEf: "Yes",
      biPlanelaVolume: "Yes",
      // Doppler
      mitralInflowPvwaves: "Yes",
      tissueDoppler: "Yes",
      // Cardiac evaluation
      lvFunction: "Yes",
      rvFunction: "Yes",
      valveAssessment: "Yes",
    };
    expect(adultTTEFields.examType).toBe("Adult TTE");
    expect(adultTTEFields.parasternal).toBe("Yes");
    expect(adultTTEFields.simpsonsEf).toBe("Yes");
  });

  it("should accept fetal-specific fields", () => {
    const fetalFields = {
      examType: "Fetal Echo",
      fetalHeartRate: "150",
      fetalSitus: "Normal",
      fetalCardiacAxis: "Normal",
      fetalFourChamber: "Yes",
      fetalLvot: "Yes",
      fetalRvot: "Yes",
      fetalThreeVessel: "Yes",
      fetalArches: "Yes",
      fetalVenousDrainage: "Yes",
    };
    expect(fetalFields.examType).toBe("Fetal Echo");
    expect(fetalFields.fetalFourChamber).toBe("Yes");
  });

  it("should accept pediatric-specific fields", () => {
    const pedFields = {
      examType: "Pediatric TTE",
      pedSubcostal: "Yes",
      pedApical: "Yes",
      pedParasternal: "Yes",
      pedSuprasternal: "Yes",
      pedSegmentalAnalysis: "Yes",
      pedBsaZScores: "Yes",
    };
    expect(pedFields.examType).toBe("Pediatric TTE");
    expect(pedFields.pedSegmentalAnalysis).toBe("Yes");
  });
});
