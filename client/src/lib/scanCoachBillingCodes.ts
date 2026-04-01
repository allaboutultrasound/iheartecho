/**
 * ScanCoach Billing Codes — CPT Procedure Codes Only
 *
 * CPT codes relevant to each ScanCoach view/module.
 * Only applied to billable exam modules: TTE, TEE, Strain.
 * NOT applied to: HOCM-Assist™, Diastology, Fetal, Pediatric/CHD, POCUS, MCS.
 *
 * CPT reference (2025 AMA):
 *   93306 — TTE complete with spectral + color Doppler (M-mode, 2D, Doppler)
 *   93307 — TTE without Doppler
 *   93308 — TTE follow-up / limited
 *   93312 — TEE diagnostic (probe placement + image acquisition + interpretation)
 *   93313 — TEE probe placement only
 *   93314 — TEE image acquisition only
 *   93315 — TEE congenital cardiac anomalies
 *   93316 — TEE congenital probe placement only
 *   93317 — TEE congenital image acquisition only
 *   93318 — TEE intraoperative monitoring
 *   93319 — 3D echocardiography add-on (real-time volumetric)
 *   76376 — 3D rendering without post-processing (add-on)
 *   76377 — 3D rendering with post-processing (add-on)
 *   93320 — Doppler echocardiography PW and/or CW (add-on)
 *   93321 — Doppler echocardiography follow-up (add-on)
 *   93325 — Doppler color flow velocity mapping (add-on)
 *   93356 — Myocardial strain imaging (speckle tracking) add-on
 */

export interface CptCode {
  code: string;
  description: string;
  type: "base" | "addon" | "alternative";
  note?: string;
}

export interface BillingSection {
  codes: CptCode[];
  clinicalNote?: string;
}

// ─── TTE Billing Codes by View ID ─────────────────────────────────────────────

export const TTE_BILLING: Record<string, BillingSection> = {
  plax: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93307", description: "TTE without Doppler", type: "alternative", note: "Use only if Doppler not performed" },
      { code: "93308", description: "TTE follow-up or limited study", type: "alternative", note: "Use for repeat/limited exams" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "PLAX is typically part of a complete TTE (93306). Use 93308 only when a limited study is medically necessary and documented.",
  },

  psax_av: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For AV CW Doppler / RVOT PW" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "PSAX-AV is used for AV planimetry, RVOT assessment, and PA evaluation. Add 93320 when CW/PW Doppler is performed.",
  },

  psax_mv: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "PSAX-MV is used for MV planimetry in mitral stenosis and regional wall motion assessment.",
  },

  psax_pm: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
    ],
    clinicalNote: "PSAX-PM is the primary view for 6-segment regional wall motion assessment and papillary muscle evaluation.",
  },

  a4c: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For mitral inflow, TR CW, TV Doppler" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93356", description: "Myocardial strain imaging — speckle tracking (add-on)", type: "addon", note: "When GLS is performed from A4C" },
    ],
    clinicalNote: "A4C is required for biventricular function, MV/TV assessment, and GLS acquisition. Add 93356 when speckle-tracking strain is performed.",
  },

  a5c: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For LVOT PW VTI and AV CW Doppler" },
    ],
    clinicalNote: "A5C is used for LVOT PW Doppler (stroke volume/VTI) and CW Doppler for aortic stenosis severity.",
  },

  a2c: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93356", description: "Myocardial strain imaging — speckle tracking (add-on)", type: "addon", note: "When GLS is performed from A2C" },
    ],
    clinicalNote: "A2C provides inferior and anterior wall segments and is required for biplane EF and GLS acquisition.",
  },

  a3c: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For AR CW Doppler and PHT" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93356", description: "Myocardial strain imaging — speckle tracking (add-on)", type: "addon", note: "When GLS is performed from A3C" },
    ],
    clinicalNote: "A3C (APLAX) is used for AR CW Doppler, PHT calculation, and inferolateral/anteroseptal wall motion.",
  },

  subcostal: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93308", description: "TTE follow-up or limited study", type: "alternative", note: "If only subcostal window available" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "Subcostal is essential for IVC collapsibility (RA pressure), pericardial effusion, and ASD/VSD with agitated saline contrast.",
  },

  suprasternal: {
    codes: [
      { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For coarctation gradient and descending aorta diastolic reversal" },
    ],
    clinicalNote: "Suprasternal notch view is used for aortic arch assessment, coarctation gradient, and descending aorta diastolic reversal in AR.",
  },

};

// ─── TEE Billing Codes by View ID ─────────────────────────────────────────────

export const TEE_BILLING: Record<string, BillingSection> = {
  "me-4c": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93319", description: "3D echocardiography add-on (real-time volumetric)", type: "addon", note: "If 3D acquisition performed" },
    ],
    clinicalNote: "ME 4-Chamber is the primary TEE view for biventricular function, MV/TV morphology, and LA/LAA assessment.",
  },

  "me-2c": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "ME 2-Chamber provides inferior and anterior wall segments (RCA/LAD territory) and is used for biplane EF.",
  },

  "me-lax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "For LVOT PW VTI and AR CW Doppler" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93319", description: "3D echocardiography add-on", type: "addon", note: "For 3D MV/AV assessment" },
    ],
    clinicalNote: "ME LAX (120–135°) is the primary TEE view for AV/MV morphology, LVOT measurement, and proximal ascending aorta.",
  },

  "me-asc-ao-sax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
    ],
    clinicalNote: "ME Ascending Aorta SAX (0°) is used for true vs. false lumen identification in aortic dissection and ascending aorta diameter.",
  },

  "me-av-sax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93319", description: "3D echocardiography add-on", type: "addon", note: "For 3D en-face AV assessment" },
    ],
    clinicalNote: "ME AV SAX (30–45°) provides en-face view of the aortic valve for leaflet morphology, planimetry, and vegetation assessment.",
  },

  "me-bicaval": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93315", description: "TEE for congenital cardiac anomalies", type: "alternative", note: "Use when primary indication is congenital (ASD, etc.)" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
    ],
    clinicalNote: "ME Bicaval (90–110°) is the primary view for ASD sizing, SVC/IVC assessment, and device guidance (ASD closure, ECMO cannula, Impella RP).",
  },

  "me-mv-comm": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
      { code: "93319", description: "3D echocardiography add-on", type: "addon", note: "For 3D en-face MV commissural assessment" },
    ],
    clinicalNote: "ME Mitral Commissural (60–70°) provides en-face view of both commissures for MV prolapse localization and MitraClip guidance.",
  },

  "tg-mid-sax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93318", description: "TEE intraoperative monitoring", type: "alternative", note: "Use for intraoperative cardiac surgery monitoring" },
    ],
    clinicalNote: "TG Mid SAX is the primary intraoperative view for real-time LV filling and regional wall motion monitoring during cardiac surgery.",
  },

  "tg-2c": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93318", description: "TEE intraoperative monitoring", type: "alternative", note: "Use for intraoperative monitoring" },
    ],
    clinicalNote: "TG 2-Chamber provides inferior and anterior wall assessment and is used for LV volume estimation in the TG plane.",
  },

  "tg-deep-lax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
      { code: "93320", description: "Doppler PW and/or CW (add-on)", type: "addon", note: "Required for CW Doppler alignment with LVOT/AV" },
    ],
    clinicalNote: "TG Deep LAX is the only TEE view allowing CW Doppler alignment with the LVOT/AV for aortic stenosis severity quantification.",
  },

  "ue-arch-lax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
    ],
    clinicalNote: "UE Arch LAX (0°) provides the aortic arch in long axis for dissection flap, aneurysm, and atheroma assessment.",
  },

  "ue-arch-sax": {
    codes: [
      { code: "93312", description: "TEE diagnostic — probe placement, acquisition + interpretation", type: "base" },
    ],
    clinicalNote: "UE Arch SAX (90°) provides the main pulmonary artery and arch in short axis — useful for PA thrombus and arch anatomy.",
  },
};

// ─── Strain ScanCoach Billing Codes ───────────────────────────────────────────

export const STRAIN_BILLING: BillingSection = {
  codes: [
    { code: "93306", description: "TTE complete — M-mode, 2D, spectral + color Doppler (base code)", type: "base" },
    { code: "93356", description: "Myocardial strain imaging — speckle tracking echocardiography (add-on)", type: "addon", note: "Must be billed with 93306" },
    { code: "93325", description: "Doppler color flow velocity mapping (add-on)", type: "addon" },
  ],
  clinicalNote: "CPT 93356 (myocardial strain imaging) is an add-on code and must be billed with the base TTE code 93306. Requires documentation of clinical indication and interpretation of segmental and global strain values in the final report.",
};
