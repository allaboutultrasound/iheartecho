/**
 * Tests for IQR Lab Staff integration and iqrData scoring logic
 */
import { describe, it, expect } from "vitest";
import { calculateQualityScore, getScoreTier, REQUIRED_VIEWS, EMPTY_FORM } from "../client/src/pages/iqr/iqrData";
import type { IQRFormData } from "../client/src/pages/iqr/iqrData";

// ─── Score calculation tests ──────────────────────────────────────────────────
describe("calculateQualityScore", () => {
  it("returns 0 when no exam type selected", () => {
    const form = { ...EMPTY_FORM };
    expect(calculateQualityScore(form)).toBe(0);
  });

  it("returns a score between 0 and 100 for a partially filled ADULT TTE form", () => {
    const form: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      demographicsAccurate: "Yes",
      gainSettings: "Excellent",
      depthSettings: "Adequate",
      focalZoneSettings: "Excellent",
      onAxisImaging: "Yes - On axis imaging with no foreshortening",
      measurements2dComplete: "Complete",
      measurements2dAccurate: "Yes",
      ventricularFunctionAccurate: "Yes",
      efMeasurementsAccurate: "Yes",
      dopplerWaveformSettings: "Excellent",
      dopplerMeasurementAccuracy: "Adequate",
      aorticValveDoppler: "Yes",
      mitralValveDoppler: "Yes",
      tricuspidValveDoppler: "Yes",
      pulmonicValveDoppler: "Yes",
      protocolSequenceFollowed: "Complete",
      pathologyDocumented: "Yes",
      clinicalQuestionAnswered: "Yes",
    };
    const score = calculateQualityScore(form);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns a higher score when more fields are filled correctly", () => {
    const partial: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      demographicsAccurate: "Yes",
      gainSettings: "Excellent",
    };
    const full: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      demographicsAccurate: "Yes",
      gainSettings: "Excellent",
      depthSettings: "Excellent",
      focalZoneSettings: "Excellent",
      colorizeSettings: "Excellent",
      zoomSettings: "Excellent",
      ecgDisplay: "Yes",
      onAxisImaging: "Yes - On axis imaging with no foreshortening",
      measurements2dComplete: "Complete",
      measurements2dAccurate: "Yes",
      ventricularFunctionAccurate: "Yes",
      efMeasurementsAccurate: "Yes",
      simpsonsEfAccurate: "Yes",
      laVolumeAccurate: "Yes",
      dopplerWaveformSettings: "Excellent",
      dopplerMeasurementAccuracy: "Excellent",
      forwardFlowSpectrum: "Yes",
      pwDopplerPlacement: "Yes",
      cwDopplerPlacement: "Yes",
      spectralEnvelopePeaks: "Yes",
      colorFlowInterrogation: "Yes",
      colorDopplerIasIvs: "Yes",
      aorticValveDoppler: "Yes",
      mitralValveDoppler: "Yes",
      tricuspidValveDoppler: "Yes",
      pulmonicValveDoppler: "Yes",
      protocolSequenceFollowed: "Complete",
      pathologyDocumented: "Yes",
      clinicalQuestionAnswered: "Yes",
      reportConcordant: "Yes",
    };
    expect(calculateQualityScore(full)).toBeGreaterThan(calculateQualityScore(partial));
  });

  it("excludes N/A fields from denominator", () => {
    const withNA: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      demographicsAccurate: "Yes",
      pedoffCwUtilized: "N/A (Limited Exam or No AS >2m/s)",
      simpsonsEfAccurate: "N/A - Limited Exam or No Simpson's Performed",
    };
    const withoutNA: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      demographicsAccurate: "Yes",
    };
    // Both should have same score since N/A fields are excluded from denominator
    expect(calculateQualityScore(withNA)).toBe(calculateQualityScore(withoutNA));
  });

  it("accounts for required views percentage", () => {
    const views = REQUIRED_VIEWS["ADULT TTE"];
    const allViews: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      requiredViews: [...views],
    };
    const noViews: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT TTE",
      requiredViews: [],
    };
    expect(calculateQualityScore(allViews)).toBeGreaterThan(calculateQualityScore(noViews));
  });

  it("calculates score for FETAL ECHO exam type", () => {
    const form: IQRFormData = {
      ...EMPTY_FORM,
      examType: "FETAL ECHO",
      demographicsAccurate: "Yes",
      gainSettings: "Excellent",
      ventricularFunctionAccurate: "Yes",
      protocolSequenceFollowed: "Complete",
    };
    const score = calculateQualityScore(form);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("calculates score for ADULT STRESS exam type", () => {
    const form: IQRFormData = {
      ...EMPTY_FORM,
      examType: "ADULT STRESS",
      demographicsAccurate: "Yes",
      gainSettings: "Adequate",
      stressType: "Treadmill/Bike Stress Echo with Doppler",
      ventricularFunctionAccurate: "Yes",
      protocolSequenceFollowed: "Complete",
    };
    const score = calculateQualityScore(form);
    expect(score).toBeGreaterThan(0);
  });
});

// ─── Score tier tests ─────────────────────────────────────────────────────────
describe("getScoreTier", () => {
  it("returns Excellent for score >= 90", () => {
    expect(getScoreTier(90).label).toBe("Excellent");
    expect(getScoreTier(100).label).toBe("Excellent");
    expect(getScoreTier(95).label).toBe("Excellent");
  });

  it("returns Good for score 75-89", () => {
    expect(getScoreTier(75).label).toBe("Good");
    expect(getScoreTier(89).label).toBe("Good");
    expect(getScoreTier(80).label).toBe("Good");
  });

  it("returns Adequate for score 60-74", () => {
    expect(getScoreTier(60).label).toBe("Adequate");
    expect(getScoreTier(74).label).toBe("Adequate");
  });

  it("returns Needs Improvement for score < 60", () => {
    expect(getScoreTier(59).label).toBe("Needs Improvement");
    expect(getScoreTier(0).label).toBe("Needs Improvement");
    expect(getScoreTier(30).label).toBe("Needs Improvement");
  });

  it("returns correct colors for each tier", () => {
    expect(getScoreTier(95).color).toBe("#15803d");
    expect(getScoreTier(80).color).toBe("#0369a1");
    expect(getScoreTier(65).color).toBe("#d97706");
    expect(getScoreTier(40).color).toBe("#dc2626");
  });
});

// ─── Required views tests ─────────────────────────────────────────────────────
describe("REQUIRED_VIEWS", () => {
  it("has 14 views for ADULT TTE", () => {
    expect(REQUIRED_VIEWS["ADULT TTE"].length).toBe(14);
  });

  it("has 20 views for ADULT TEE", () => {
    expect(REQUIRED_VIEWS["ADULT TEE"].length).toBe(20);
  });

  it("has 9 views for ADULT STRESS", () => {
    expect(REQUIRED_VIEWS["ADULT STRESS"].length).toBe(9);
  });

  it("has 16 views for FETAL ECHO", () => {
    expect(REQUIRED_VIEWS["FETAL ECHO"].length).toBe(16);
  });

  it("has 20 views for PEDIATRIC TEE (same as adult TEE)", () => {
    expect(REQUIRED_VIEWS["PEDIATRIC TEE"].length).toBe(20);
  });
});
