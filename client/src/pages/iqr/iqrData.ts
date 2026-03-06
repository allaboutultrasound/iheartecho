// ─── Image Quality Review — Form Data Constants ──────────────────────────────
// Derived from Formsite IMAGE-QUALITY-REVIEW API analysis

export const EXAM_TYPES = [
  "ADULT TTE",
  "ADULT TEE",
  "ADULT STRESS",
  "PEDIATRIC TTE",
  "PEDIATRIC TEE",
  "FETAL ECHO",
] as const;
export type ExamType = typeof EXAM_TYPES[number];

export const STRESS_TYPES = [
  "Treadmill/Bike Stress Echo with Doppler",
  "Treadmill/Bike Stress Echo without Doppler",
  "Dobutamine/Chemical Stress Echo with Doppler",
  "Dobutamine/Chemical Stress Echo without Doppler",
] as const;

export const INDICATION_OPTIONS = [
  "Appropriate A7",
  "Appropriate A8",
  "Appropriate A9",
  "Uncertain U4",
  "Uncertain U6",
  "Inappropriate I2",
];

export const GAIN_DEPTH_FOCAL_OPTIONS = ["Excellent", "Adequate", "Deficiencies Noted"];
export const COLORIZE_ZOOM_OPTIONS = ["Excellent", "Adequate", "Deficiencies Noted"];
export const YES_NO_NA = ["Yes", "No", "N/A"];
export const YES_NO = ["Yes", "No"];
export const ADEQUATE_DEFICIENT = ["Adequate", "Deficiencies Noted"];
export const COMPLETE_OPTIONS = [
  "Complete",
  "Minor Deficiencies Noted (all required images are present and in order, but missing measurements)",
  "Minor Deficiencies Noted (images/measurements are documented but taken out of protocol sequence)",
  "Moderate Deficiencies Noted (missing images, measurements and/or documentation)",
  "Major Deficiencies Noted (missing views, images and or measurements)",
];
export const PROTOCOL_SEQUENCE_OPTIONS = [
  "Complete (to BEST ability - if TDS study documents attempts at all views)",
  "Minor Deficiencies Noted (images/measurements are documented but taken out of protocol sequence)",
  "Minor Deficiencies Noted (all required images are present and in order, but missing measurements)",
  "Moderate Deficiencies Noted (missing images, measurements and/or documentation)",
  "Major Deficiencies Noted (missing views, images and or measurements)",
];
export const ON_AXIS_OPTIONS = [
  "Yes - On axis imaging with no foreshortening",
  "No - Foreshortening present",
];
export const EFFORT_SUBOPTIMAL_OPTIONS = [
  "Yes - Image optimization attempted",
  "No - No attempt to optimize suboptimal views",
  "N/A - All views were adequate",
];
export const CONTRAST_USE_OPTIONS = [
  "Yes (with appropriate use criteria and good image optimization/contrast UEA settings)",
  "No - Contrast/UAE was NOT used when it should have been",
  "N/A - Limited Exam/Contrast UEA Not Needed",
];
export const CONTRAST_SETTINGS_OPTIONS = ["Yes", "No", "N/A"];
export const PSAX_LV_OPTIONS = [
  "Complete - Includes MV, Pap, Apex Views",
  "Incomplete - Missing Apex",
  "Incomplete - Missing Pap",
  "N/A - Limited Exam",
];
export const VENTRICULAR_FUNCTION_OPTIONS = ["Yes", "Adequate", "Some Deficiencies", "Excellent"];
export const EF_MEASUREMENTS_OPTIONS = ["Yes", "No", "N/A"];
export const SIMPSONS_OPTIONS = ["Yes", "No", "N/A - Limited Exam or No Simpson's Performed"];
export const LA_VOLUME_OPTIONS = ["Yes", "No", "N/A - Limited Exam or No LA Volume Performed"];
export const DOPPLER_SETTINGS_OPTIONS = ["Excellent", "Adequate", "Deficiencies Noted"];
export const DOPPLER_MEASUREMENTS_OPTIONS = ["Excellent", "Adequate", "Deficiencies Noted"];
export const PEDOFF_OPTIONS = [
  "Yes",
  "No",
  "N/A (Limited Exam or No AS >2m/s)",
];
export const MR_EVAL_OPTIONS = [
  "Yes",
  "No (more than mild MR present & no PISA/ERO performed)",
  "N/A (limited exam, eccentric jet, no significant MR)",
];
export const PISA_OPTIONS = [
  "Yes",
  "No",
  "N/A (limited exam, eccentric jet, no significant MR)",
];
export const STRAIN_CORRECT_OPTIONS = [
  "Yes",
  "No",
  "N/A - Strain Not Performed",
];
export const IAC_OPTIONS = [
  "Accreditation Acceptable Case - ADULT: AS",
  "Accreditation Acceptable Case - ADULT: MR",
  "Accreditation Acceptable Case - ADULT: AR",
  "Accreditation Acceptable Case - ADULT: MS",
  "Accreditation Acceptable Case - ADULT: TR",
  "Accreditation Acceptable Case - ADULT: PR",
  "Accreditation Acceptable Case - ADULT: Cardiomyopathy",
  "Accreditation Acceptable Case - ADULT: Pericardial Disease",
  "Accreditation Acceptable Case - ADULT: Aortic Disease",
  "Accreditation Acceptable Case - ADULT: Cardiac Mass",
  "Not IAC Acceptable - No pathology to submit",
  "Not IAC Acceptable - Reporting Issues (not sonographer related)",
  "Not IAC Acceptable - Image Quality Issues",
];
export const REPORT_CONCORDANT_OPTIONS = [
  "Yes",
  "N/A - NOT COMPLETED",
  "N/A - UNABLE TO CONFIRM",
];
export const COMPARABLE_OPTIONS = ["Yes", "No", "N/A"];
export const IMAGE_OPT_SUMMARY_OPTIONS = ["Excellent", "Execellent", "Adequate", "Deficiencies Noted"];
export const DIASTOLOGY_OPTIONS = ["Yes", "Deficiencies Noted"];
export const RH_SYSTOLIC_OPTIONS = ["Yes", "Deficiencies Noted"];
export const ADDITIONAL_IMAGING_OPTIONS = [
  "None Performed",
  "2D Strain",
  "3D Imaging",
  "3D EF",
  "Other",
];
export const SCANNING_TIME_OPTIONS = ["Actual", "Estimated"];

// ─── Diastolic function multi-select options ──────────────────────────────────
export const DIASTOLIC_FUNCTION_OPTIONS = [
  "Mitral Inflow PW Performed",
  "Mitral Annulus TDI Performed (BOTH Lateral & Medial)",
  "Pulmonary Vein Inflow Performed",
  "Mitral Inflow PW with Valsalva Performed (if indicated)",
  "N/A - Limited Exam",
  "Not Fully Evaluated",
];

// ─── Right heart function multi-select options ────────────────────────────────
export const RIGHT_HEART_OPTIONS = [
  "Appropriate RV Focused View",
  "Tricuspid Inflow Performed",
  "Tricuspid Annulus TDI Performed",
  "TAPSE Performed",
  "RV1 and RV2 Diameter Measurements",
  "RA Volume Measurements",
  "Not Fully Evaluated",
];

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

// ─── Scoring weights per exam type ───────────────────────────────────────────
// Based on Formsite score calculations observed in real results
// Max possible score per exam type (used to normalize to 0-100)
export const SCORE_MAX: Record<ExamType, number> = {
  "ADULT TTE": 100,
  "ADULT TEE": 100,
  "ADULT STRESS": 100,
  "PEDIATRIC TTE": 100,
  "PEDIATRIC TEE": 100,
  "FETAL ECHO": 100,
};

// ─── Score calculation ────────────────────────────────────────────────────────
// Each question contributes points; "Yes"/"Excellent"/"Adequate"/"Complete" = full points
// "No"/"Deficiencies Noted"/"Incomplete" = 0 points
// "N/A" = excluded from denominator

export type IQRFormData = {
  // Header
  reviewType: string;
  organization: string;
  dateReviewCompleted: string;
  examDos: string;
  examIdentifier: string;
  dob: string;
  facilityLocation: string;
  // Staff — from Lab Admin (id) or free text
  performingSonographerId: string;
  performingSonographerText: string;
  interpretingPhysicianId: string;
  interpretingPhysicianText: string;
  referringPhysician: string;
  // Exam info
  examType: ExamType | "";
  examScope: string;
  stressType: string;
  examIndication: string;
  indicationAppropriateness: string;
  demographicsAccurate: string;
  // Required views (multi-select)
  requiredViews: string[];
  // Image quality
  gainSettings: string;
  depthSettings: string;
  focalZoneSettings: string;
  colorizeSettings: string;
  zoomSettings: string;
  ecgDisplay: string;
  contrastUseAppropriate: string;
  contrastSettingsAppropriate: string;
  onAxisImaging: string;
  effortSuboptimalViews: string;
  // Measurements
  measurements2dComplete: string;
  measurements2dAccurate: string;
  psaxLvComplete: string;
  ventricularFunctionAccurate: string;
  efMeasurementsAccurate: string;
  simpsonsEfAccurate: string;
  laVolumeAccurate: string;
  // Doppler
  dopplerMeasurementsComplete: string;
  dopplerMeasurementsAccurate: string;
  dopplerVentricularFunction: string;
  dopplerWaveformSettings: string;
  dopplerMeasurementAccuracy: string;
  forwardFlowSpectrum: string;
  pwDopplerPlacement: string;
  cwDopplerPlacement: string;
  spectralEnvelopePeaks: string;
  colorFlowInterrogation: string;
  colorDopplerIasIvs: string;
  // Diastolic function (multi-select)
  diastolicFunctionEval: string[];
  pulmonaryVeinInflow: string;
  // Right heart (multi-select)
  rightHeartFunctionEval: string[];
  tapseAccurate: string;
  tissueDopplerAdequate: string;
  // Peer review doppler fields
  dopplerWaveformSettingsPeer: string;
  dopplerSampleVolumesPeer: string;
  // Valves
  aorticValveDoppler: string;
  lvotDopplerPlacement: string;
  pedoffCwUtilized: string;
  pedoffCwEnvelope: string;
  pedoffCwLabelled: string;
  mitralValveDoppler: string;
  mrEvaluationMethods: string;
  pisaEroMeasurements: string;
  tricuspidValveDoppler: string;
  pulmonicValveDoppler: string;
  // Peer review valve fields
  aorticValvePeer: string;
  mitralValvePeer: string;
  tricuspidValvePeer: string;
  pulmonicValvePeer: string;
  diastologyPeer: string;
  rightHeartPeer: string;
  // Additional imaging
  additionalImagingMethods: string[];
  strainPerformed: string;
  strainCorrect: string;
  threeDPerformed: string;
  // Summary fields
  imageOptimizationSummary: string;
  measurementAccuracySummary: string;
  dopplerSettingsSummary: string;
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
  organization: "",
  dateReviewCompleted: new Date().toLocaleDateString("en-US"),
  examDos: "",
  examIdentifier: "",
  dob: "",
  facilityLocation: "",
  performingSonographerId: "",
  performingSonographerText: "",
  interpretingPhysicianId: "",
  interpretingPhysicianText: "",
  referringPhysician: "",
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
  dopplerMeasurementsComplete: "",
  dopplerMeasurementsAccurate: "",
  dopplerVentricularFunction: "",
  dopplerWaveformSettings: "",
  dopplerMeasurementAccuracy: "",
  forwardFlowSpectrum: "",
  pwDopplerPlacement: "",
  cwDopplerPlacement: "",
  spectralEnvelopePeaks: "",
  colorFlowInterrogation: "",
  colorDopplerIasIvs: "",
  diastolicFunctionEval: [],
  pulmonaryVeinInflow: "",
  rightHeartFunctionEval: [],
  tapseAccurate: "",
  tissueDopplerAdequate: "",
  dopplerWaveformSettingsPeer: "",
  dopplerSampleVolumesPeer: "",
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
  aorticValvePeer: "",
  mitralValvePeer: "",
  tricuspidValvePeer: "",
  pulmonicValvePeer: "",
  diastologyPeer: "",
  rightHeartPeer: "",
  additionalImagingMethods: [],
  strainPerformed: "",
  strainCorrect: "",
  threeDPerformed: "",
  imageOptimizationSummary: "",
  measurementAccuracySummary: "",
  dopplerSettingsSummary: "",
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

// ─── Score calculation helper ─────────────────────────────────────────────────
function score(val: string | string[], positiveVals: string[], weight = 1): { earned: number; possible: number } {
  if (Array.isArray(val)) {
    // Multi-select: N/A means excluded
    if (val.includes("N/A - Limited Exam")) return { earned: 0, possible: 0 };
    return { earned: weight, possible: weight }; // If any selection made, give credit
  }
  if (!val || val === "") return { earned: 0, possible: 0 };
  if (val.startsWith("N/A") || val === "N/A") return { earned: 0, possible: 0 };
  const isPositive = positiveVals.some(p => val.toLowerCase().includes(p.toLowerCase()));
  return { earned: isPositive ? weight : 0, possible: weight };
}

export function calculateQualityScore(form: IQRFormData): number {
  if (!form.examType) return 0;
  const et = form.examType as ExamType;
  let earned = 0;
  let possible = 0;

  const add = (val: string | string[], positiveVals: string[], weight = 1) => {
    const s = score(val, positiveVals, weight);
    earned += s.earned;
    possible += s.possible;
  };

  // Demographics (2pts)
  add(form.demographicsAccurate, ["yes"], 2);

  // Required views (5pts) — based on % of views checked
  const views = REQUIRED_VIEWS[et] || [];
  if (views.length > 0 && form.requiredViews.length > 0) {
    const pct = form.requiredViews.length / views.length;
    earned += Math.round(pct * 5);
    possible += 5;
  } else if (views.length > 0) {
    possible += 5;
  }

  // Image quality settings (3pts each)
  add(form.gainSettings, ["excellent", "adequate"], 3);
  add(form.depthSettings, ["excellent", "adequate"], 3);
  add(form.focalZoneSettings, ["excellent", "adequate"], 3);
  add(form.colorizeSettings, ["excellent", "adequate"], 2);
  add(form.zoomSettings, ["excellent", "adequate"], 2);
  add(form.ecgDisplay, ["yes"], 2);

  // Contrast (if applicable)
  add(form.contrastUseAppropriate, ["yes"], 2);
  add(form.contrastSettingsAppropriate, ["yes"], 1);

  // On-axis imaging
  add(form.onAxisImaging, ["yes - on axis"], 3);
  add(form.effortSuboptimalViews, ["yes - image optimization"], 2);

  // Measurements
  add(form.measurements2dComplete, ["complete"], 4);
  add(form.measurements2dAccurate, ["yes"], 3);
  if (et !== "ADULT TEE" && et !== "FETAL ECHO") {
    add(form.psaxLvComplete, ["complete"], 2);
  }
  add(form.ventricularFunctionAccurate, ["yes", "excellent", "adequate"], 4);
  add(form.efMeasurementsAccurate, ["yes"], 3);
  add(form.simpsonsEfAccurate, ["yes"], 2);
  add(form.laVolumeAccurate, ["yes"], 2);

  // Doppler
  add(form.dopplerWaveformSettings, ["excellent", "adequate"], 3);
  add(form.dopplerMeasurementAccuracy, ["excellent", "adequate"], 3);
  add(form.forwardFlowSpectrum, ["yes"], 2);
  add(form.pwDopplerPlacement, ["yes"], 2);
  add(form.cwDopplerPlacement, ["yes"], 2);
  add(form.spectralEnvelopePeaks, ["yes"], 2);
  add(form.colorFlowInterrogation, ["yes"], 2);
  add(form.colorDopplerIasIvs, ["yes"], 2);

  // Diastolic function
  if (form.diastolicFunctionEval.length > 0 && !form.diastolicFunctionEval.includes("N/A - Limited Exam")) {
    const hasCore = form.diastolicFunctionEval.some(v => v.includes("Mitral Inflow") || v.includes("TDI"));
    earned += hasCore ? 4 : 2;
    possible += 4;
  } else if (!form.diastolicFunctionEval.includes("N/A - Limited Exam")) {
    possible += 4;
  }

  // Right heart
  if (form.rightHeartFunctionEval.length > 0 && !form.rightHeartFunctionEval.includes("Not Fully Evaluated")) {
    earned += 3;
    possible += 3;
  } else if (form.rightHeartFunctionEval.length > 0) {
    possible += 3;
  } else {
    possible += 3;
  }
  add(form.tapseAccurate, ["yes"], 2);
  add(form.tissueDopplerAdequate, ["yes"], 2);

  // Valves
  add(form.aorticValveDoppler, ["yes"], 3);
  add(form.lvotDopplerPlacement, ["yes"], 2);
  add(form.pedoffCwUtilized, ["yes"], 2);
  add(form.pedoffCwEnvelope, ["yes"], 1);
  add(form.pedoffCwLabelled, ["yes"], 1);
  add(form.mitralValveDoppler, ["yes"], 3);
  add(form.mrEvaluationMethods, ["yes"], 2);
  add(form.pisaEroMeasurements, ["yes"], 2);
  add(form.tricuspidValveDoppler, ["yes"], 2);
  add(form.pulmonicValveDoppler, ["yes"], 2);

  // Protocol sequence
  add(form.protocolSequenceFollowed, ["complete"], 4);

  // Pathology
  add(form.pathologyDocumented, ["yes"], 3);
  add(form.clinicalQuestionAnswered, ["yes"], 3);

  // Report concordance
  add(form.reportConcordant, ["yes"], 2);

  // Comparable to previous
  add(form.comparableToPrevious, ["yes"], 1);

  if (possible === 0) return 0;
  return Math.min(100, Math.round((earned / possible) * 100));
}

export function getScoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: "Excellent", color: "#15803d", bg: "#dcfce7" };
  if (score >= 75) return { label: "Good", color: "#0369a1", bg: "#e0f2fe" };
  if (score >= 60) return { label: "Adequate", color: "#d97706", bg: "#fef3c7" };
  return { label: "Needs Improvement", color: "#dc2626", bg: "#fee2e2" };
}
