// iqrData.ts — Image Quality Review field definitions
// Derived from FormSite form: https://fs23.formsite.com/allaboutultrasound/hmrmdywgzj/index
// Exam type prefix logic:
//   AETTE  = Adult TTE
//   AETEE  = Adult TEE
//   AE_STRESS = Adult Stress
//   PETTE  = Pediatric/Congenital TTE
//   PETEE  = Pediatric/Congenital TEE
//   FE     = Fetal
//   (no prefix) = all exam types

export const EXAM_TYPES = [
  "ADULT TTE",
  "ADULT TEE",
  "ADULT STRESS",
  "PEDIATRIC TTE",
  "PEDIATRIC TEE",
  "FETAL ECHO",
] as const;
export type ExamType = typeof EXAM_TYPES[number];

// ─── Exam-type helpers ────────────────────────────────────────────────────────
export function isAETTE(et: ExamType | "") { return et === "ADULT TTE"; }
export function isAETEE(et: ExamType | "") { return et === "ADULT TEE"; }
export function isAESTRESS(et: ExamType | "") { return et === "ADULT STRESS"; }
export function isPETTE(et: ExamType | "") { return et === "PEDIATRIC TTE"; }
export function isPETEE(et: ExamType | "") { return et === "PEDIATRIC TEE"; }
export function isFE(et: ExamType | "") { return et === "FETAL ECHO"; }
export function isTEE(et: ExamType | "") { return et === "ADULT TEE" || et === "PEDIATRIC TEE"; }
export function isTTE(et: ExamType | "") { return et === "ADULT TTE" || et === "PEDIATRIC TTE"; }
export function isPed(et: ExamType | "") { return et === "PEDIATRIC TTE" || et === "PEDIATRIC TEE"; }
export function isAdult(et: ExamType | "") { return et === "ADULT TTE" || et === "ADULT TEE" || et === "ADULT STRESS"; }

// ─── Option arrays (matching FormSite exactly) ────────────────────────────────

export const STRESS_TYPES = [
  "Treadmill/Bike Stress Echo with Doppler",
  "Treadmill/Bike Stress Echo without Doppler",
  "Dobutamine/Chemical Stress Echo with Doppler",
  "Dobutamine/Chemical Stress Echo without Doppler",
];

export const INDICATION_OPTIONS = [
  "Appropriate A9",
  "Appropriate A8",
  "Appropriate A7",
  "Uncertain U6",
  "Uncertain U5",
  "Uncertain U4",
  "Inappropriate I3",
  "Inappropriate I2",
  "Inappropriate I1",
];

// Image quality settings
export const GAIN_OPTIONS = ["Adequate", "Too Bright", "Too Dark", "Other"];
export const DEPTH_OPTIONS = ["Adequate", "Too Deep", "Too Shallow", "Other"];
export const FOCAL_OPTIONS = ["Adequate", "Deficiencies Noted"];
export const COLORIZE_OPTIONS = ["Adequate", "Over-Utilized", "Other"];
export const ZOOM_OPTIONS = ["Adequate", "Over-Utilized", "Not Utilized", "Other"];
export const ECG_OPTIONS = ["Yes", "N/A", "No", "Deficiencies in Display"];

// Contrast/UEA
export const CONTRAST_USE_OPTIONS = [
  "Yes (with appropriate use criteria and good image optimization/contrast UEA settings)",
  "Yes (with appropriate use criteria but deficient contrast settings/imaging)",
  "Contrast/UEA Not Available",
  "Patient Refused Contrast/UEA",
  "N/A - Limited Exam/Contrast UEA Not Needed",
  "No - Contrast/UEA not used when needed",
  "Contrast/UEA used in TDS. However, image optimization not performed - may have eliminated need for contrast use",
];
export const CONTRAST_SETTINGS_OPTIONS = ["Yes", "N/A", "No"];

// On-axis imaging
export const ON_AXIS_OPTIONS = [
  "Yes - On axis imaging with no foreshortening",
  "Some Deficiencies - No documentation of patient position/attempts to correct",
  "Some Deficiencies - Annotations noted with patient position/attempts to correct",
  "No - Off axis imaging with significant foreshortening",
];
export const EFFORT_SUBOPTIMAL_OPTIONS = ["Yes - Image optimization attempted", "N/A", "No"];

// Measurements
export const COMPLETE_OPTIONS = [
  "Complete",
  "Sufficient attempts made in a TDS",
  "Limited exam: all appropriate measurements performed",
  "Deficiencies Noted",
];
export const YES_NO_NA = ["Yes", "N/A", "No"];
export const YES_NO = ["Yes", "No"];
export const ADEQUATE_DEFICIENT = ["Adequate", "Deficiencies Noted"];

export const PSAX_LV_OPTIONS = [
  "Complete - Includes MV, Pap, Apex Views",
  "Apex Not Visualized",
  "N/A - Limited Exam",
  "Not Fully Visualized",
];
export const VENTRICULAR_FUNCTION_OPTIONS = ["Yes", "N/A", "No"];
export const EF_MEASUREMENTS_OPTIONS = ["Yes", "N/A - Limited Exam", "No"];
export const SIMPSONS_OPTIONS = ["Yes", "N/A", "No"];
export const LA_VOLUME_OPTIONS = ["Yes", "N/A", "No"];

// TEE measurements
export const TEE_MEASUREMENTS_COMPLETE_OPTIONS = [
  "Complete",
  "Sufficient attempts made in a TDS",
  "Limited exam: all appropriate measurements performed",
  "Deficiencies Noted",
];
export const TEE_MEASUREMENTS_ACCURATE_OPTIONS = [
  "Excellent",
  "Adequate",
  "Some Deficiencies",
  "N/A - Limited Exam",
  "No",
];
export const TEE_VENTRICULAR_OPTIONS = [
  "Excellent",
  "Adequate",
  "Some Deficiencies",
  "N/A - Limited Exam",
  "No",
];

// Doppler
export const DOPPLER_SETTINGS_OPTIONS = ["Adequate", "N/A - Limited Exam", "Deficiencies Noted"];
export const DOPPLER_MEASUREMENTS_OPTIONS = ["Adequate", "N/A - Limited Exam", "Deficiencies Noted"];
export const FORWARD_FLOW_OPTIONS = ["Yes", "N/A - Limited Exam", "No"];
export const PW_CW_OPTIONS = ["Yes", "N/A - Limited Exam", "No"];
export const SPECTRAL_OPTIONS = ["Yes", "N/A", "No"];
export const COLOR_FLOW_OPTIONS = ["Yes", "N/A - Limited Exam", "No"];

// TEE Doppler
export const TEE_DOPPLER_SETTINGS_OPTIONS = ["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"];
export const TEE_DOPPLER_SAMPLE_OPTIONS = ["Yes", "Some Deficiencies", "N/A - Limited Exam", "No"];

// Diastolic function (AETTE only)
export const DIASTOLIC_FUNCTION_OPTIONS = [
  "Not Fully Evaluated",
  "Mitral Annulus TDI Performed (BOTH Lateral & Medial)",
  "Mitral Inflow PW Performed",
  "TR RVSP/PASP",
  "Pulmonary Vein Inflow Performed",
  "LARS Performed when indicated",
  "E/SR IVRT",
  "Deceleration Time",
  "Mitral Inflow PW with Valsalva Performed (if indicated)",
  "N/A - Limited Exam",
];

// Right heart (AETTE + PETTE)
export const RIGHT_HEART_OPTIONS = [
  "Not Fully Evaluated",
  "Appropriate RV Focused View",
  "Tricuspid Inflow Performed",
  "Tricuspid Annulus TDI Performed",
  "TAPSE Performed",
  "RV1 and RV2 Diameter Measurements",
  "RA Volume Measurements",
  "N/A - Limited Exam",
];

// Valves
export const VALVE_OPTIONS = ["Yes", "N/A", "No"];
export const PEDOFF_OPTIONS = ["Yes", "N/A (Limited Exam or No AS >2m/s)", "No"];
export const MR_EVAL_OPTIONS = [
  "Yes",
  "N/A (limited exam, eccentric jet, no significant MR)",
  "No (more than mild MR present & no PISA/ERO performed)",
];
export const PISA_OPTIONS = [
  "Yes",
  "N/A (limited exam, eccentric jet, no significant MR)",
  "No",
];

// TEE valves
export const TEE_VALVE_OPTIONS = ["Yes", "N/A", "Deficiencies Noted"];

// Strain
export const STRAIN_CORRECT_OPTIONS = ["Yes", "N/A - Strain Not Performed", "No"];

// Additional imaging
export const ADDITIONAL_IMAGING_OPTIONS = [
  "None Performed",
  "2D Strain",
  "3D Imaging",
  "3D EF",
  "Other",
];

// TEE summary
export const TEE_IMAGE_OPT_OPTIONS = ["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"];
export const TEE_MEASUREMENT_SUMMARY_OPTIONS = ["Excellent", "Adequate", "N/A", "Deficiencies Noted"];
export const TEE_DOPPLER_SUMMARY_OPTIONS = ["Excellent", "Adequate", "N/A - Limited Exam", "Deficiencies Noted"];

// Protocol sequence
export const PROTOCOL_SEQUENCE_OPTIONS = [
  "Complete (to BEST ability)",
  "Minor Deficiencies Noted (all required images present but missing measurements)",
  "Minor Deficiencies Noted (images/measurements documented but out of protocol sequence)",
  "Minor Deficiencies Noted (see review comments)",
  "Moderate Deficiencies Noted (missing images, measurements and/or documentation)",
  "Major Deficiencies Noted (missing views, images and or measurements)",
];

export const REPORT_CONCORDANT_OPTIONS = [
  "Yes",
  "N/A - NOT COMPLETED",
  "N/A - UNABLE TO CONFIRM",
  "No",
];
export const COMPARABLE_OPTIONS = ["Yes", "N/A", "No"];

export const IAC_OPTIONS = [
  "Not IAC Acceptable - No pathology to submit",
  "Not IAC Acceptable - Case images not IAC acceptable",
  "Not IAC Acceptable - Reporting Issues (not sonographer related)",
  "Accreditation Acceptable Case - ADULT: AS",
  "Accreditation Acceptable Case - ADULT: LVDF/RWMA",
  "Accreditation Acceptable Case - PED: Simple Obstruction",
  "Accreditation Acceptable Case - PED: Shunt",
  "Accreditation Acceptable Case - PED: Complex Defect",
  "Accreditation Acceptable Case - FETAL: Arrhythmia",
  "Accreditation Acceptable Case - FETAL: Complex Defect",
  "Accreditation Acceptable Case - FETAL: Simple Obstruction",
  "Accreditation Acceptable Case - STRESS: Wall Motion at Rest",
  "Accreditation Acceptable Case - STRESS: Ischemia during Stress",
  "Accreditation Acceptable Case - STRESS: with Contrast",
  "Accreditation Acceptable Case - TEE: More than Mild MR",
  "Accreditation Acceptable Case - TEE: Source of emboli",
];

export const SCANNING_TIME_OPTIONS = ["Actual", "Estimated"];

// ─── Required views per exam type ────────────────────────────────────────────
export const REQUIRED_VIEWS: Record<ExamType, string[]> = {
  "ADULT TTE": [
    "Parasternal long axis view",
    "Parasternal long axis m-mode",
    "Parasternal short axis views (at all levels AV, basal, mid & apical)",
    "Right ventricular inflow view (from anteriorly directed PLAX view)",
    "Right ventricular outflow view (from both PLAX and PSAX with correct measurements of peak velocity and acceleration time)",
    "Apical four-chamber view",
    "Apical five-chamber view",
    "Apical two-chamber view",
    "Apical long-axis/three-chamber view",
    "Subcostal four-chamber view",
    "Subcostal short axis view (when indicated)",
    "Subcostal IVC/hepatic vein view",
    "Subcostal Abdominal Aorta view",
    "Suprasternal notch view (with Color & CW Doppler)",
    "Right Parasternal view (when indicated)",
    "If limited exam - all components obtained or attempted",
  ],
  "ADULT TEE": [
    "Mid Esophageal - Five Chamber View",
    "Mid Esophageal - Four Chamber View",
    "Mid Esophageal - Mitral Commissural View",
    "Mid Esophageal - Two Chamber View",
    "Mid Esophageal - LAX/AV",
    "Mid Esophageal - Asc AO/LAX",
    "Mid Esophageal - Asc AO/SAX",
    "Mid Esophageal - Pulm Veins",
    "Mid Esophageal - RV inflow/outflow",
    "Mid Esophageal - Bicaval View",
    "Mid Esophageal - LA Appendage View",
    "Transgastric - Basal SAX View",
    "Transgastric - Midpapillary SAX View",
    "Transgastric - Apical SAX View",
    "Transgastric - RV inflow/outflow View",
    "Deep Transgastric - Five Chamber View",
    "Transgastric - Two Chamber View",
    "Transgastric - LAX View",
    "Upper Esophageal - Aortic Arch/LAX View",
    "Upper Esophageal - Aortic Arch/SAX View",
  ],
  "ADULT STRESS": [
    "PRE Apical Four Chamber",
    "PRE Apical Two Chamber",
    "PRE PSAX at Mid Papillary Level",
    "PRE PLAX at Mid Ventricle",
    "IMPOST Apical Four Chamber (within 60 seconds of exercise cessation and/or peak target heart rate)",
    "IMPOST Apical Two Chamber",
    "IMPOST PSAX at Mid Papillary Level",
    "IMPOST PLAX at Mid Ventricle",
    "Side-By-Side View of PRE/IMPOST/STAGES Images",
  ],
  "PEDIATRIC TTE": [
    "Parasternal long axis view",
    "Parasternal short axis views (at all levels)",
    "Right ventricular inflow view",
    "Apical four-chamber view",
    "Apical five-chamber view",
    "Apical two-chamber view",
    "Subcostal four-chamber view",
    "Subcostal short axis view",
    "Subcostal IVC/hepatic vein view",
    "Suprasternal notch view (with Color & CW Doppler)",
    "Color Doppler interrogation of IAS & IVS",
    "Abdominal situs evaluation",
  ],
  "PEDIATRIC TEE": [
    "Mid Esophageal - Five Chamber View",
    "Mid Esophageal - Four Chamber View",
    "Mid Esophageal - Mitral Commissural View",
    "Mid Esophageal - Two Chamber View",
    "Mid Esophageal - LAX/AV",
    "Mid Esophageal - Asc AO/LAX",
    "Mid Esophageal - Asc AO/SAX",
    "Mid Esophageal - Pulm Veins",
    "Mid Esophageal - RV inflow/outflow",
    "Mid Esophageal - Bicaval View",
    "Mid Esophageal - LA Appendage View",
    "Transgastric - Basal SAX View",
    "Transgastric - Midpapillary SAX View",
    "Transgastric - Apical SAX View",
    "Transgastric - RV inflow/outflow View",
    "Deep Transgastric - Five Chamber View",
    "Transgastric - Two Chamber View",
    "Transgastric - LAX View",
    "Upper Esophageal - Aortic Arch/LAX View",
    "Upper Esophageal - Aortic Arch/SAX View",
  ],
  "FETAL ECHO": [
    "Presence of single or multiple gestations and the locations of fetus(s) relative to mother (and each other)",
    "Survey of fetal lie and position defining fetal orientation",
    "Measurement of biparietal diameter (BPD), head circumference or other measures for estimation of fetal size/gestational age",
    "Cardiac position and visceral situs",
    "Measurement of chest and heart circumference and area for calculation of size ratios",
    "Assessment of fetal heart rate and rhythm using appropriate M-Mode/Doppler techniques",
    "Short axis view of fetal umbilical cord vasculature with Doppler evaluation of flow in the fetal umbilical vessels and ductus venosus",
    "Imaging of the pericardial and pleural spaces, abdomen and skin for fluid or edema",
    "Imaging and Doppler/color flow Doppler interrogation of the systemic veins, their course and cardiac connection",
    "Imaging and Doppler/color flow Doppler interrogation of the pulmonary veins, their course and cardiac connection",
    "Multiple imaging planes of the atria, atrial septum, foramen ovale, ductus arteriosus and ventricular septum, with appropriate Doppler assessment of flow direction and velocity",
    "Multiple imaging planes of the atrioventricular (mitral and/or tricuspid) valves, with appropriate Doppler evaluation",
    "Four-chamber or equivalent and short axis views of the heart for assessment of cardiac chamber size and function",
    "Assessment of ventricular outflow and semilunar valves including the ventriculoarterial connections with appropriate Doppler/color flow",
    "Short & long axis views of the ascending, descending and transverse aortic arch and ductus arteriosus with appropriate Doppler/color flow",
    "Short & long axis views of the main pulmonary artery and proximal portions of the right and left pulmonary arteries",
  ],
};

// ─── IQRFormData type ─────────────────────────────────────────────────────────
export type IQRFormData = {
  // Header (all exam types)
  reviewType: string;
  dateReviewCompleted: string;
  examDos: string;
  examIdentifier: string;
  referringPhysician: string;
  facilityLocation: string;
  // Staff
  performingSonographerId: string;
  performingSonographerText: string;
  interpretingPhysicianId: string;
  interpretingPhysicianText: string;
  // Exam info
  examType: ExamType | "";
  examScope: string;
  stressType: string;         // AE_STRESS only
  examIndication: string;
  indicationAppropriateness: string;
  demographicsAccurate: string;
  // Required views (multi-select, per exam type)
  requiredViews: string[];
  // Image quality settings (all exam types)
  gainSettings: string;
  depthSettings: string;
  focalZoneSettings: string;
  colorizeSettings: string;
  zoomSettings: string;
  ecgDisplay: string;         // AETTE, AETEE, PETTE, PETEE only
  // Contrast (AETTE, AETEE, PETTE, PETEE only)
  contrastUseAppropriate: string;
  contrastSettingsAppropriate: string;
  // On-axis imaging (AETTE, PETTE only)
  onAxisImaging: string;
  effortSuboptimalViews: string;  // all exam types
  // Measurements (all exam types, some fields conditional)
  measurements2dComplete: string;
  measurements2dAccurate: string;
  psaxLvComplete: string;           // AETTE, PETTE only
  ventricularFunctionAccurate: string;
  efMeasurementsAccurate: string;   // AETTE, PETTE only
  simpsonsEfAccurate: string;       // AETTE, PTTE only
  laVolumeAccurate: string;         // AETTE only
  // TEE-specific measurements (AETEE, PETEE)
  teeMeasurementsComplete: string;
  teeMeasurementsAccurate: string;
  teeVentricularFunction: string;
  // Doppler (all exam types)
  dopplerWaveformSettings: string;
  dopplerMeasurementAccuracy: string;
  forwardFlowSpectrum: string;      // not for AE_STRESS
  pwDopplerPlacement: string;
  cwDopplerPlacement: string;
  spectralEnvelopePeaks: string;
  // Color Doppler (AETTE, PETTE, FE)
  colorFlowInterrogation: string;
  colorDopplerIasIvs: string;
  // TEE Doppler (AETEE, PETEE)
  teeDopplerSettings: string;
  teeDopplerSampleVolumes: string;
  // Diastolic function (AETTE only)
  diastolicFunctionEval: string[];
  // Pulmonary vein inflow (AETTE, PETTE, FE)
  pulmonaryVeinInflow: string;
  // Right heart (AETTE, PETTE)
  rightHeartFunctionEval: string[];
  tapseAccurate: string;            // AETTE only
  tissueDopplerAdequate: string;    // AETTE, PETTE
  // Valves (all exam types)
  aorticValveDoppler: string;
  lvotDopplerPlacement: string;
  pedoffCwUtilized: string;         // AETTE only
  pedoffCwEnvelope: string;         // AETTE only (conditional)
  pedoffCwLabelled: string;         // AETTE only (conditional)
  mitralValveDoppler: string;
  mrEvaluationMethods: string;      // AETTE only
  pisaEroMeasurements: string;      // AETTE only (conditional)
  tricuspidValveDoppler: string;
  pulmonicValveDoppler: string;
  // TEE valves (AETEE, PETEE)
  teeAorticValve: string;
  teeMitralValve: string;
  teeTricuspidValve: string;
  teePulmonicValve: string;
  // Additional imaging (all exam types)
  additionalImagingMethods: string[];
  strainPerformed: string;          // AETTE only
  strainCorrect: string;            // AETTE only (conditional)
  // TEE summary (AETEE, PETEE)
  teeImageOptSummary: string;
  teeMeasurementSummary: string;
  teeDopplerSummary: string;
  // Summary (all exam types)
  protocolSequenceFollowed: string;
  pathologyDocumented: string;
  clinicalQuestionAnswered: string;
  reportConcordant: string;
  comparableToPrevious: string;
  iacAcceptable: string;
  // Timing
  scanStartTime: string;
  scanEndTime: string;
  imagingTimeMinutes: string;
  scanningTimeType: string;
  // Review info
  reviewComments: string;
  reviewer: string;
  reviewerEmail: string;
  notifySonographer: string;
};

export const EMPTY_FORM: IQRFormData = {
  reviewType: "QUALITY REVIEW",
  dateReviewCompleted: new Date().toLocaleDateString("en-US"),
  examDos: "",
  examIdentifier: "",
  referringPhysician: "",
  facilityLocation: "",
  performingSonographerId: "",
  performingSonographerText: "",
  interpretingPhysicianId: "",
  interpretingPhysicianText: "",
  examType: "",
  examScope: "Complete Exam",
  stressType: "",
  examIndication: "",
  indicationAppropriateness: "",
  demographicsAccurate: "",
  requiredViews: [],
  gainSettings: "",
  depthSettings: "",
  focalZoneSettings: "",
  colorizeSettings: "",
  zoomSettings: "",
  ecgDisplay: "",
  contrastUseAppropriate: "",
  contrastSettingsAppropriate: "",
  onAxisImaging: "",
  effortSuboptimalViews: "",
  measurements2dComplete: "",
  measurements2dAccurate: "",
  psaxLvComplete: "",
  ventricularFunctionAccurate: "",
  efMeasurementsAccurate: "",
  simpsonsEfAccurate: "",
  laVolumeAccurate: "",
  teeMeasurementsComplete: "",
  teeMeasurementsAccurate: "",
  teeVentricularFunction: "",
  dopplerWaveformSettings: "",
  dopplerMeasurementAccuracy: "",
  forwardFlowSpectrum: "",
  pwDopplerPlacement: "",
  cwDopplerPlacement: "",
  spectralEnvelopePeaks: "",
  colorFlowInterrogation: "",
  colorDopplerIasIvs: "",
  teeDopplerSettings: "",
  teeDopplerSampleVolumes: "",
  diastolicFunctionEval: [],
  pulmonaryVeinInflow: "",
  rightHeartFunctionEval: [],
  tapseAccurate: "",
  tissueDopplerAdequate: "",
  aorticValveDoppler: "",
  lvotDopplerPlacement: "",
  pedoffCwUtilized: "",
  pedoffCwEnvelope: "",
  pedoffCwLabelled: "",
  mitralValveDoppler: "",
  mrEvaluationMethods: "",
  pisaEroMeasurements: "",
  tricuspidValveDoppler: "",
  pulmonicValveDoppler: "",
  teeAorticValve: "",
  teeMitralValve: "",
  teeTricuspidValve: "",
  teePulmonicValve: "",
  additionalImagingMethods: [],
  strainPerformed: "",
  strainCorrect: "",
  teeImageOptSummary: "",
  teeMeasurementSummary: "",
  teeDopplerSummary: "",
  protocolSequenceFollowed: "",
  pathologyDocumented: "",
  clinicalQuestionAnswered: "",
  reportConcordant: "",
  comparableToPrevious: "",
  iacAcceptable: "",
  scanStartTime: "",
  scanEndTime: "",
  imagingTimeMinutes: "",
  scanningTimeType: "Actual",
  reviewComments: "",
  reviewer: "",
  reviewerEmail: "",
  notifySonographer: "NO",
};

// ─── Quality score calculation ────────────────────────────────────────────────
// Scoring: "Excellent", "Yes", "Adequate", "Complete" (and starts-with variants) = 1 point
// "N/A" / empty = excluded from denominator
// Final score = (earned / possible) * 100, capped at 100

const POSITIVE_VALS = ["yes", "excellent", "adequate", "complete"];

function scoreField(val: string | string[]): { earned: number; possible: number } {
  if (Array.isArray(val)) {
    // Multi-select: skip if empty or only N/A entries
    const meaningful = val.filter(v => !v.startsWith("N/A") && v !== "Not Fully Evaluated");
    if (meaningful.length === 0) return { earned: 0, possible: 0 };
    return { earned: 1, possible: 1 };
  }
  if (!val || val === "") return { earned: 0, possible: 0 };
  if (val.startsWith("N/A") || val === "N/A") return { earned: 0, possible: 0 };
  const lower = val.toLowerCase();
  const isPositive = POSITIVE_VALS.some(p => lower.startsWith(p));
  return { earned: isPositive ? 1 : 0, possible: 1 };
}

export function calculateQualityScore(form: IQRFormData): number {
  if (!form.examType) return 0;
  const et = form.examType as ExamType;
  let earned = 0;
  let possible = 0;

  const add = (val: string | string[]) => {
    const s = scoreField(val);
    earned += s.earned;
    possible += s.possible;
  };

  // Demographics (all)
  add(form.demographicsAccurate);

  // Required views — score as fraction of views checked
  const views = REQUIRED_VIEWS[et] || [];
  if (views.length > 0) {
    const checked = form.requiredViews.length;
    if (checked > 0) {
      const pct = Math.min(1, checked / views.length);
      earned += pct;
    }
    possible += 1;
  }

  // Image quality settings (all)
  add(form.gainSettings);
  add(form.depthSettings);
  add(form.focalZoneSettings);
  add(form.colorizeSettings);
  add(form.zoomSettings);

  // ECG display (AETTE, AETEE, PETTE, PETEE)
  if (!isAESTRESS(et) && !isFE(et)) add(form.ecgDisplay);

  // Contrast (AETTE, AETEE, PETTE, PETEE)
  if (!isAESTRESS(et) && !isFE(et)) {
    add(form.contrastUseAppropriate);
    if (form.contrastUseAppropriate?.startsWith("Yes")) add(form.contrastSettingsAppropriate);
  }

  // On-axis imaging (AETTE, PETTE)
  if (isTTE(et)) add(form.onAxisImaging);

  // Effort suboptimal (all)
  add(form.effortSuboptimalViews);

  // Measurements
  if (isTEE(et)) {
    add(form.teeMeasurementsComplete);
    add(form.teeMeasurementsAccurate);
    add(form.teeVentricularFunction);
  } else {
    add(form.measurements2dComplete);
    add(form.measurements2dAccurate);
    if (isTTE(et)) add(form.psaxLvComplete);
    add(form.ventricularFunctionAccurate);
    if (isTTE(et)) {
      add(form.efMeasurementsAccurate);
      add(form.simpsonsEfAccurate);
    }
    if (isAETTE(et)) add(form.laVolumeAccurate);
  }

  // Doppler (all)
  if (isTEE(et)) {
    add(form.teeDopplerSettings);
    add(form.teeDopplerSampleVolumes);
  } else {
    add(form.dopplerWaveformSettings);
    add(form.dopplerMeasurementAccuracy);
    if (!isAESTRESS(et)) add(form.forwardFlowSpectrum);
    add(form.pwDopplerPlacement);
    add(form.cwDopplerPlacement);
    add(form.spectralEnvelopePeaks);
  }

  // Color Doppler (AETTE, PETTE, FE)
  if (isAETTE(et) || isPETTE(et) || isFE(et)) {
    add(form.colorFlowInterrogation);
    add(form.colorDopplerIasIvs);
  }

  // Diastolic function (AETTE only)
  if (isAETTE(et)) {
    add(form.diastolicFunctionEval);
  }

  // Pulmonary vein inflow (AETTE, PETTE, FE)
  if (isAETTE(et) || isPETTE(et) || isFE(et)) add(form.pulmonaryVeinInflow);

  // Right heart (AETTE, PETTE)
  if (isAETTE(et) || isPETTE(et)) {
    add(form.rightHeartFunctionEval);
    if (isAETTE(et)) add(form.tapseAccurate);
    add(form.tissueDopplerAdequate);
  }

  // Valves
  if (isTEE(et)) {
    add(form.teeAorticValve);
    add(form.teeMitralValve);
    add(form.teeTricuspidValve);
    add(form.teePulmonicValve);
  } else {
    add(form.aorticValveDoppler);
    add(form.lvotDopplerPlacement);
    if (isAETTE(et)) {
      add(form.pedoffCwUtilized);
      if (form.pedoffCwUtilized === "Yes") {
        add(form.pedoffCwEnvelope);
        add(form.pedoffCwLabelled);
      }
    }
    add(form.mitralValveDoppler);
    if (isAETTE(et)) {
      add(form.mrEvaluationMethods);
      if (form.mrEvaluationMethods === "Yes") add(form.pisaEroMeasurements);
    }
    add(form.tricuspidValveDoppler);
    add(form.pulmonicValveDoppler);
  }

  // Strain (AETTE only)
  if (isAETTE(et)) {
    add(form.strainPerformed);
    if (form.strainPerformed === "Yes") add(form.strainCorrect);
  }

  // TEE summary (AETEE, PETEE)
  if (isTEE(et)) {
    add(form.teeImageOptSummary);
    add(form.teeMeasurementSummary);
    add(form.teeDopplerSummary);
  }

  // Summary (all)
  add(form.protocolSequenceFollowed);
  add(form.pathologyDocumented);
  add(form.clinicalQuestionAnswered);
  add(form.reportConcordant);
  add(form.comparableToPrevious);

  if (possible === 0) return 0;
  return Math.min(100, Math.round((earned / possible) * 100));
}

export function getScoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: "Excellent", color: "#15803d", bg: "#dcfce7" };
  if (score >= 75) return { label: "Good", color: "#0369a1", bg: "#e0f2fe" };
  if (score >= 60) return { label: "Adequate", color: "#d97706", bg: "#fef3c7" };
  return { label: "Needs Improvement", color: "#dc2626", bg: "#fee2e2" };
}
