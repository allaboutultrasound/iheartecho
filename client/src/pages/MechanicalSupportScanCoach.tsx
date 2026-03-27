/*
  MechanicalSupportAssist™ ScanCoach — iHeartEcho™
  Premium module: Imaging acquisition guide for mechanical circulatory support devices
  Devices: LVAD, ECMO, Impella (all versions), LifeVest, ICD
  Brand: Teal #189aa1, Aqua #4ad9e0
*/

import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { PremiumOverlay } from "@/components/PremiumOverlay";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  Ruler,
  Scan,
  Shield,
  Target,
  Zap,
} from "lucide-react";

const BRAND = "#189aa1";
const AQUA = "#4ad9e0";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ScanView = {
  id: string;
  name: string;
  window: string;
  patientPosition: string;
  probe: string;
  depth: string;
  acquisition: string[];
  whatToSee: string[];
  doppler?: string[];
  pitfalls?: string[];
  tips?: string[];
  critical?: boolean;
};

type DeviceScanCoach = {
  id: string;
  label: string;
  subtitle: string;
  color: string;
  icon: React.ElementType;
  views: ScanView[];
};

// ─── LVAD SCAN VIEWS ──────────────────────────────────────────────────────────

const lvadViews: ScanView[] = [
  {
    id: "lvad_plax",
    name: "PLAX — Inflow Cannula Assessment",
    window: "Parasternal",
    patientPosition: "Left lateral decubitus, 30–45°",
    probe: "2nd–4th ICS, left sternal border | Notch: 10–11 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain standard PLAX view with LV, MV, AV, and aortic root visible.",
      "Identify the LVAD inflow cannula as a hyperechoic structure in the LV cavity.",
      "Measure the distance from the inflow cannula tip to the aortic valve (inner edge to inner edge).",
      "Confirm the cannula is parallel to the interventricular septum.",
      "Apply color Doppler over the inflow cannula to assess flow direction.",
    ],
    whatToSee: [
      "Inflow cannula: hyperechoic tubular structure, ideally pointing toward the mitral valve.",
      "Cannula tip should be 3.5–4.5 cm below the aortic valve.",
      "LV should be decompressed (smaller than pre-implant).",
      "Aortic valve: assess opening frequency (every 2–4 beats is optimal).",
      "Interventricular septum: should be midline.",
    ],
    doppler: [
      "PW Doppler at inflow cannula: normal velocity 1.0–2.0 m/s.",
      "Velocity >2.0 m/s: suspect obstruction (suction, thrombus, malposition).",
      "Color Doppler: confirm laminar flow into cannula.",
      "AR color Doppler in LVOT: assess for new or worsening AR.",
    ],
    pitfalls: [
      "Acoustic shadowing from the cannula may obscure posterior structures — adjust gain and TGC.",
      "Cannula too shallow (<3.5 cm from AV): suction risk — notify team.",
      "Cannula too deep (>5 cm): mitral valve entrapment risk.",
    ],
    tips: [
      "PLAX is the primary view for inflow cannula distance measurement.",
      "Reduce depth to 12–14 cm to better visualize the cannula tip.",
      "If cannula is not visible in PLAX, try slight probe rotation or lateral angulation.",
    ],
    critical: true,
  },
  {
    id: "lvad_a5c",
    name: "Apical 5-Chamber — Inflow Confirmation",
    window: "Apical",
    patientPosition: "Left lateral decubitus, steep (60–90°)",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain A4C view then tilt anteriorly to bring LVOT and aortic valve into view.",
      "Identify the inflow cannula in the LV cavity — appears as a bright echogenic structure.",
      "Confirm the cannula is in the central LV cavity, not impinging on the septum or lateral wall.",
      "Apply PW Doppler at the cannula inlet for velocity measurement.",
    ],
    whatToSee: [
      "Inflow cannula in central LV cavity, pointing toward the mitral valve.",
      "LV adequately decompressed — smaller than pre-implant baseline.",
      "Septal position: midline (not deviated right or left).",
      "Aortic valve opening frequency.",
    ],
    doppler: [
      "PW Doppler at inflow cannula: 1.0–2.0 m/s normal.",
      "Continuous wave Doppler across AV: assess for AR.",
      "Mitral inflow: E/A ratio — assess LV filling.",
    ],
    pitfalls: [
      "Foreshortened apical view may make cannula appear closer to MV than it is — ensure true apex.",
      "Gain artifacts may mimic cannula thrombus — reduce gain and use harmonic imaging.",
    ],
    tips: [
      "A5C complements PLAX for confirming cannula position in two orthogonal planes.",
      "Steep left lateral decubitus position improves apical window.",
    ],
    critical: true,
  },
  {
    id: "lvad_a4c",
    name: "Apical 4-Chamber — RV Assessment",
    window: "Apical",
    patientPosition: "Left lateral decubitus, steep (60–90°)",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain standard A4C view with all four chambers visible.",
      "Focus on RV size and function — LVAD increases RV preload and may cause RV failure.",
      "Measure TAPSE with M-mode at the tricuspid annulus.",
      "Apply PW TDI at tricuspid annulus for RV S'.",
      "Assess TR severity with color Doppler and CW for RVSP estimation.",
    ],
    whatToSee: [
      "RV size: basal diameter (normal ≤41 mm), mid diameter (≤35 mm).",
      "Septal position: midline. Rightward shift = LV over-decompression. Leftward shift = RV failure.",
      "TR: color Doppler jet area and direction.",
      "LA size: should decrease with adequate LVAD unloading.",
    ],
    doppler: [
      "TAPSE: ≥17 mm normal; <10 mm = severe RV dysfunction post-LVAD.",
      "RV S' (TDI): ≥9.5 cm/s normal.",
      "TR CW: RVSP = 4v² + RAP. Monitor trend.",
      "Mitral inflow E/A: assess LV filling pressures.",
    ],
    pitfalls: [
      "RV failure post-LVAD can be subtle — compare to pre-implant baseline.",
      "Leftward septal shift with RV dilation = RV failure, not adequate LV unloading.",
    ],
    tips: [
      "RV assessment is the most critical post-LVAD echo parameter.",
      "Serial TAPSE and RVSP monitoring detects early RV decompensation.",
    ],
    critical: true,
  },
  {
    id: "lvad_subcostal",
    name: "Subcostal — IVC and Pericardium",
    window: "Subcostal",
    patientPosition: "Supine, knees flexed",
    probe: "Subxiphoid, angled toward left shoulder | Notch: 3 o'clock",
    depth: "16–20 cm",
    acquisition: [
      "Obtain subcostal 4-chamber view.",
      "Rotate to IVC long axis view — IVC entering RA.",
      "Measure IVC diameter at 1–2 cm from RA junction.",
      "Assess IVC collapsibility with sniff test.",
      "Assess for pericardial effusion — circumferential or loculated.",
    ],
    whatToSee: [
      "IVC diameter and collapsibility for RAP estimation.",
      "Pericardial effusion: any new effusion post-LVAD requires urgent assessment.",
      "RA size: enlarged RA suggests elevated RAP or RV failure.",
    ],
    doppler: [
      "IVC ≤21 mm + >50% collapse = RAP 0–5 mmHg.",
      "IVC >21 mm + <50% collapse = RAP 10–20 mmHg.",
    ],
    pitfalls: [
      "Loculated pericardial effusion may be missed in standard views — sweep carefully.",
      "Hepatic veins may be mistaken for IVC — follow vessel to RA junction.",
    ],
    tips: [
      "Post-LVAD pericardial effusion is common — always assess subcostal view.",
      "Hepatic vein flow reversal in systole suggests elevated RAP/RV failure.",
    ],
  },
];

// ─── ECMO SCAN VIEWS ──────────────────────────────────────────────────────────

const ecmoViews: ScanView[] = [
  {
    id: "ecmo_plax",
    name: "PLAX — LV Distension & AV Opening",
    window: "Parasternal",
    patientPosition: "Left lateral decubitus, 30–45°",
    probe: "2nd–4th ICS, left sternal border | Notch: 10–11 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain standard PLAX view.",
      "Measure LVEDD and LVESD — compare to pre-ECMO baseline.",
      "Observe AV opening: does it open with each beat?",
      "Apply color Doppler to assess AR (retrograde aortic flow from ECMO increases AR).",
      "Assess for pericardial effusion.",
    ],
    whatToSee: [
      "LV distension: LVEDD >70 mm or LVESD >60 mm = venting required.",
      "AV opening: must open with each beat. Continuous closure = thrombus risk.",
      "AR: any new or worsening AR on VA-ECMO.",
      "Pericardial effusion: new effusion = urgent assessment.",
    ],
    doppler: [
      "AR color Doppler: assess jet width relative to LVOT.",
      "AR CW: PHT <200 ms = significant AR.",
      "AV CW: assess for any forward flow.",
    ],
    pitfalls: [
      "LV distension may develop gradually — serial assessment every 4–6 hours on VA-ECMO.",
      "AV non-opening may be intermittent — observe for at least 10 cardiac cycles.",
    ],
    tips: [
      "LV distension on VA-ECMO is a medical emergency — call team immediately.",
      "Reduce ECMO flow temporarily if LV distension develops while arranging venting.",
    ],
    critical: true,
  },
  {
    id: "ecmo_a4c",
    name: "Apical 4-Chamber — Biventricular Function",
    window: "Apical",
    patientPosition: "Left lateral decubitus, steep (60–90°)",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain standard A4C view.",
      "Assess LV EF by visual estimation or biplane Simpson's.",
      "Assess RV size and function: TAPSE, RV S'.",
      "Look for LV thrombus — especially apical regions with poor AV opening.",
      "Assess TR severity and estimate RVSP.",
    ],
    whatToSee: [
      "LV EF: improving EF suggests myocardial recovery on VA-ECMO.",
      "LV thrombus: high risk when AV does not open — assess apical segments carefully.",
      "RV function: TAPSE, RV S', FAC.",
      "Septal position: midline preferred.",
    ],
    doppler: [
      "TAPSE: ≥17 mm normal; <10 mm = severe RV dysfunction.",
      "TR CW: RVSP estimation.",
      "Mitral inflow: E/A, DT — assess LV filling.",
    ],
    pitfalls: [
      "LV thrombus may be subtle — use contrast echo if apical views are suboptimal.",
      "EF assessment on VA-ECMO reflects native cardiac function — ECMO reduces LV preload.",
    ],
    tips: [
      "Serial EF assessment is the primary weaning criterion for VA-ECMO.",
      "EF >20–25% with AV opening = consider weaning trial.",
    ],
    critical: true,
  },
  {
    id: "ecmo_tee_cannula",
    name: "TEE — Venous Cannula Position (Preferred)",
    window: "Transesophageal",
    patientPosition: "Supine (intubated) or left lateral decubitus (awake TEE)",
    probe: "Mid-esophageal, bicaval view (90–100°)",
    depth: "N/A (TEE)",
    acquisition: [
      "Advance probe to mid-esophagus.",
      "Rotate to bicaval view (90–100°) to visualize SVC, RA, and IVC.",
      "Identify venous cannula tip — should be at RA/IVC junction.",
      "For bicaval dual-lumen VV-ECMO (Avalon): confirm return jet directed toward tricuspid valve.",
      "Assess for RA thrombus at cannula tip.",
    ],
    whatToSee: [
      "Venous cannula tip: RA/IVC junction.",
      "Avalon cannula: return jet (color Doppler) directed toward tricuspid valve.",
      "RA thrombus: hyperechoic mass at cannula tip.",
      "IVC and SVC: assess for cannula-related obstruction.",
    ],
    doppler: [
      "Color Doppler: confirm return jet direction (toward TV for Avalon).",
      "PW Doppler at cannula: assess flow velocity.",
    ],
    pitfalls: [
      "Cannula tip may be difficult to visualize in all patients — use multiple views.",
      "Misdirected return jet (away from TV) = recirculation — reposition cannula.",
    ],
    tips: [
      "TEE is preferred over TTE for cannula position assessment.",
      "Bicaval view at 90–100° is the optimal TEE view for venous cannula.",
    ],
    critical: true,
  },
];

// ─── IMPELLA SCAN VIEWS ───────────────────────────────────────────────────────

const impellaViews: ScanView[] = [
  {
    id: "imp_plax_position",
    name: "PLAX — Inlet-to-AV Distance (Primary)",
    window: "Parasternal",
    patientPosition: "Left lateral decubitus, 30–45°",
    probe: "2nd–4th ICS, left sternal border | Notch: 10–11 o'clock",
    depth: "12–16 cm",
    acquisition: [
      "Obtain standard PLAX view with AV and LV cavity clearly visible.",
      "Identify the Impella device: hyperechoic structure crossing the aortic valve.",
      "Measure from the inlet area (pigtail/cage) to the aortic valve plane: should be 3.5–4.5 cm.",
      "Confirm the outlet area is in the ascending aorta (above AV).",
      "Apply color Doppler to assess for new or worsened AR.",
    ],
    whatToSee: [
      "Impella device crossing the aortic valve — hyperechoic structure.",
      "Inlet area (pigtail) in LV cavity: 3.5–4.5 cm below AV.",
      "Outlet area in ascending aorta: above AV plane.",
      "AV leaflets: not impinged by device.",
      "AR: color Doppler in LVOT.",
    ],
    doppler: [
      "AR color Doppler: assess jet width in LVOT.",
      "AR CW: PHT — significant AR causes recirculation.",
      "Color Doppler around device: confirm no obstruction.",
    ],
    pitfalls: [
      "Inlet too shallow (<3.5 cm): device in LVOT → suction alarms and reduced support.",
      "Inlet too deep (>5 cm): pigtail entanglement in MV apparatus.",
      "Acoustic shadowing from device may obscure posterior structures.",
    ],
    tips: [
      "PLAX is the gold standard view for Impella positioning.",
      "Reduce depth to 10–12 cm to better visualize the inlet-to-AV distance.",
      "If device is too shallow, advance catheter — if too deep, withdraw slightly.",
    ],
    critical: true,
  },
  {
    id: "imp_a5c_position",
    name: "Apical 5-Chamber — Inlet Confirmation",
    window: "Apical",
    patientPosition: "Left lateral decubitus, steep (60–90°)",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain A4C view then tilt anteriorly to bring LVOT and AV into view.",
      "Identify the Impella device in the LVOT crossing the AV.",
      "Confirm inlet area is in the LV cavity (below AV).",
      "Confirm outlet area is in the ascending aorta (above AV).",
      "Assess for MV impingement — new MR suggests pigtail entanglement.",
    ],
    whatToSee: [
      "Impella device in LVOT crossing AV.",
      "Inlet area in LV, outlet in ascending aorta.",
      "MV: no new regurgitation from pigtail entanglement.",
      "LV size: should be decompressed with adequate P-level.",
    ],
    doppler: [
      "MR color Doppler: new MR = pigtail entanglement.",
      "AR color Doppler: assess recirculation risk.",
    ],
    pitfalls: [
      "Foreshortened apical view may give false impression of inlet position.",
      "New MR in A4C with Impella = pigtail entanglement — urgent repositioning.",
    ],
    tips: [
      "A5C confirms inlet position in a second orthogonal plane to PLAX.",
      "If new MR develops after Impella placement, check inlet depth immediately.",
    ],
    critical: true,
  },
  {
    id: "imp_tee_positioning",
    name: "TEE ME LAX — Gold Standard Positioning",
    window: "Transesophageal",
    patientPosition: "Supine (intubated) or left lateral decubitus",
    probe: "Mid-esophageal long axis (120–135°)",
    depth: "N/A (TEE)",
    acquisition: [
      "Advance probe to mid-esophagus.",
      "Rotate to ME LAX view (120–135°) — equivalent to PLAX.",
      "Identify Impella device crossing the AV.",
      "Measure inlet-to-AV distance: 3.5–4.5 cm.",
      "Confirm outlet in ascending aorta.",
      "Assess AV leaflets for impingement.",
    ],
    whatToSee: [
      "Impella device crossing AV in ME LAX view.",
      "Inlet 3.5–4.5 cm below AV.",
      "Outlet in ascending aorta.",
      "AV leaflets free from device impingement.",
    ],
    doppler: [
      "AR color Doppler: assess for new AR.",
      "Color Doppler around device: confirm flow.",
    ],
    pitfalls: [
      "TEE probe may be difficult to advance past the device in some patients.",
      "Acoustic shadowing from device — use multiple imaging planes.",
    ],
    tips: [
      "TEE ME LAX is the gold standard for Impella positioning in the cath lab.",
      "Real-time TEE guidance during repositioning is preferred over fluoroscopy alone.",
    ],
    critical: true,
  },
  {
    id: "imp_rp_subcostal",
    name: "Subcostal / PSAX — Impella RP Assessment",
    window: "Subcostal + Parasternal",
    patientPosition: "Supine (subcostal) or left lateral decubitus (PSAX)",
    probe: "Subcostal: subxiphoid | PSAX: 2nd–4th ICS, left sternal border",
    depth: "16–20 cm (subcostal), 12–16 cm (PSAX)",
    acquisition: [
      "Subcostal IVC view: confirm Impella RP inlet at IVC/RA junction.",
      "PSAX at AV level: identify outlet in main pulmonary artery.",
      "Apply color Doppler in RVOT/PA: confirm forward flow from RP outlet.",
      "Assess RV size and function: TAPSE in A4C.",
    ],
    whatToSee: [
      "RP inlet: IVC/RA junction (subcostal view).",
      "RP outlet: main pulmonary artery (PSAX at AV level).",
      "RV: improving size and function with RP support.",
    ],
    doppler: [
      "Color Doppler in PA: confirm forward flow from RP outlet.",
      "PW Doppler at RP outlet: assess flow velocity.",
      "TAPSE: monitor RV function improvement.",
    ],
    pitfalls: [
      "RP outlet in RVOT (not main PA) = device too shallow — reposition.",
      "RP inlet in RA (not IVC) = recirculation risk.",
    ],
    tips: [
      "TEE is preferred for Impella RP positioning — bicaval and RVOT views.",
      "Confirm both inlet and outlet positions before initiating support.",
    ],
    critical: true,
  },
];

// ─── LIFEVEST SCAN VIEWS ──────────────────────────────────────────────────────

const lifevestViews: ScanView[] = [
  {
    id: "lv_ef_biplane",
    name: "Biplane Simpson's EF — Standard Protocol",
    window: "Apical",
    patientPosition: "Left lateral decubitus, 45–60°",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain true A4C view — apex at top, all four chambers visible, no foreshortening.",
      "Trace LV endocardium in end-diastole (largest LV frame) — exclude papillary muscles.",
      "Trace LV endocardium in end-systole (smallest LV frame).",
      "Rotate to A2C view (60° counterclockwise from A4C).",
      "Repeat end-diastolic and end-systolic tracings in A2C.",
      "Software calculates biplane EDV, ESV, and EF.",
    ],
    whatToSee: [
      "True apical view: apex at top, no foreshortening.",
      "Clear endocardial definition in both A4C and A2C.",
      "End-diastole: largest LV cavity frame (just after MV closure).",
      "End-systole: smallest LV cavity frame (just before MV opening).",
    ],
    doppler: [
      "Not required for EF measurement.",
      "Mitral inflow E/A, DT: assess diastolic function.",
      "TDI e' septal and lateral: E/e' ratio for filling pressures.",
    ],
    pitfalls: [
      "Foreshortened apex = underestimation of LV volumes and EF — ensure true apex.",
      "Poor endocardial definition = use contrast echo (Definity/Lumason).",
      "Papillary muscle inclusion in tracing = overestimation of LV mass, underestimation of EF.",
    ],
    tips: [
      "Biplane Simpson's is the only acceptable method for LifeVest/ICD EF decisions.",
      "Use harmonic imaging to improve endocardial definition.",
      "If EF is borderline (30–40%), use contrast echo for accuracy.",
    ],
    critical: true,
  },
  {
    id: "lv_lv_dimensions",
    name: "PLAX — LV Dimensions and Volumes",
    window: "Parasternal",
    patientPosition: "Left lateral decubitus, 30–45°",
    probe: "2nd–4th ICS, left sternal border | Notch: 10–11 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain standard PLAX view.",
      "M-mode at the level of the mitral valve leaflet tips — perpendicular to LV walls.",
      "Measure LVEDD (inner edge to inner edge in diastole).",
      "Measure LVESD (inner edge to inner edge in systole).",
      "Measure IVS and PW thickness.",
      "Calculate fractional shortening (FS) = (LVEDD − LVESD) / LVEDD × 100.",
    ],
    whatToSee: [
      "LVEDD: normal ≤58 mm (M), ≤52 mm (F). Dilated cardiomyopathy: >60 mm.",
      "LVESD: normal ≤40 mm (M), ≤35 mm (F).",
      "IVS and PW: normal 6–11 mm. Hypertrophy: >11 mm.",
      "FS: normal ≥25%. Reduced = LV systolic dysfunction.",
    ],
    doppler: [
      "AR color Doppler: assess for AR in LVOT.",
      "MR color Doppler: assess MR severity.",
    ],
    pitfalls: [
      "M-mode not perpendicular to LV walls = inaccurate measurements.",
      "Foreshortened PLAX = oblique M-mode cut = overestimation of dimensions.",
    ],
    tips: [
      "Document LVEDD and LVESD at each follow-up for serial comparison.",
      "Positive remodeling: ↓ LVEDD and LVESD over time on GDMT.",
    ],
  },
];

// ─── ICD SCAN VIEWS ───────────────────────────────────────────────────────────

const icdViews: ScanView[] = [
  {
    id: "icd_ef_biplane",
    name: "Biplane EF — ICD Decision Standard",
    window: "Apical",
    patientPosition: "Left lateral decubitus, 45–60°",
    probe: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
    depth: "14–18 cm",
    acquisition: [
      "Obtain true A4C view — no foreshortening.",
      "Trace LV endocardium in end-diastole and end-systole in A4C.",
      "Rotate to A2C view.",
      "Repeat tracings in A2C.",
      "Calculate biplane EF.",
      "If EF borderline: use contrast echo for accuracy.",
    ],
    whatToSee: [
      "EF ≤35% on GDMT ≥3 months = ICD indication (Class I).",
      "EF 36–40%: ICD Class IIb — shared decision-making.",
      "EF >40%: ICD not indicated for primary prevention.",
    ],
    doppler: [
      "Mitral inflow E/A, DT: diastolic function.",
      "TDI e' septal and lateral: E/e' ratio.",
      "TR CW: RVSP estimation.",
    ],
    pitfalls: [
      "Visual EF estimation is not acceptable for ICD decision — must use biplane Simpson's.",
      "Single-plane (A4C only) underestimates EF in asymmetric LV — always use biplane.",
    ],
    tips: [
      "EF must be measured on optimized GDMT for ≥3 months before ICD decision.",
      "Contrast echo is recommended when ≥2 endocardial segments are not visualized.",
    ],
    critical: true,
  },
  {
    id: "icd_crt_dyssynchrony",
    name: "Dyssynchrony Assessment — CRT Eligibility",
    window: "Apical + Parasternal",
    patientPosition: "Left lateral decubitus, 45–60°",
    probe: "Apical: cardiac apex | Parasternal: 2nd–4th ICS",
    depth: "14–18 cm",
    acquisition: [
      "PLAX M-mode: measure SPWMD (septal-to-posterior wall motion delay). Normal <130 ms.",
      "A4C: PW Doppler at LVOT for aortic pre-ejection time.",
      "PSAX: PW Doppler at RVOT for pulmonary pre-ejection time.",
      "Calculate IVMD = aortic pre-ejection time − pulmonary pre-ejection time. Normal <40 ms.",
      "TDI at septal and lateral walls: assess timing of peak systolic velocity.",
    ],
    whatToSee: [
      "SPWMD >130 ms: significant intraventricular dyssynchrony.",
      "IVMD >40 ms: significant interventricular dyssynchrony.",
      "LBBB pattern: early septal contraction, late lateral wall contraction.",
    ],
    doppler: [
      "PW Doppler LVOT: aortic pre-ejection time (onset QRS to aortic flow).",
      "PW Doppler RVOT: pulmonary pre-ejection time.",
      "TDI septal and lateral: timing of peak systolic velocity.",
    ],
    pitfalls: [
      "Dyssynchrony assessment is supplementary — QRS duration and morphology are primary CRT criteria.",
      "RBBB pattern: dyssynchrony less predictable — CRT benefit less certain.",
    ],
    tips: [
      "CRT primary criteria: EF ≤35% + LBBB + QRS ≥150 ms — echo dyssynchrony is supplementary.",
      "Post-CRT: dyssynchrony should resolve — SPWMD and IVMD should normalize.",
    ],
  },
  {
    id: "icd_post_lead",
    name: "Post-Implant Lead Assessment",
    window: "Apical + Subcostal",
    patientPosition: "Left lateral decubitus (apical) or supine (subcostal)",
    probe: "Apical: cardiac apex | Subcostal: subxiphoid",
    depth: "14–18 cm (apical), 16–20 cm (subcostal)",
    acquisition: [
      "A4C: identify RV lead at RV apex or RVOT septum.",
      "Subcostal 4-chamber: assess for pericardial effusion post-implant.",
      "Subcostal IVC: assess for hemodynamic compromise if effusion present.",
      "Assess for new wall motion abnormalities (lead perforation).",
    ],
    whatToSee: [
      "RV lead: hyperechoic structure at RV apex or RVOT septum.",
      "Pericardial effusion: any new effusion post-implant = cardiac perforation excluded.",
      "LV lead (CRT): not directly visualized by TTE — in coronary sinus.",
    ],
    doppler: [
      "TR: new TR may indicate lead impingement on TV.",
      "IVC: assess collapsibility for RAP if effusion present.",
    ],
    pitfalls: [
      "Lead perforation may cause only small pericardial effusion — assess carefully.",
      "New TR after ICD implant: RV lead may be impinging on TV leaflets.",
    ],
    tips: [
      "Subcostal view is most useful for pericardial effusion assessment post-implant.",
      "Any new effusion post-ICD implant: assess for tamponade physiology.",
    ],
    critical: true,
  },
];

// ─── DEVICE SCAN COACHES ──────────────────────────────────────────────────────

const DEVICE_SCAN_COACHES: DeviceScanCoach[] = [
  {
    id: "lvad",
    label: "LVAD",
    subtitle: "Left Ventricular Assist Device",
    color: "#189aa1",
    icon: Heart,
    views: lvadViews,
  },
  {
    id: "ecmo",
    label: "ECMO",
    subtitle: "Extracorporeal Membrane Oxygenation",
    color: "#0e7490",
    icon: Activity,
    views: ecmoViews,
  },
  {
    id: "impella",
    label: "Impella",
    subtitle: "Percutaneous Ventricular Support",
    color: "#0f766e",
    icon: Zap,
    views: impellaViews,
  },
  {
    id: "lifevest",
    label: "LifeVest",
    subtitle: "Wearable Cardioverter-Defibrillator",
    color: "#b45309",
    icon: Shield,
    views: lifevestViews,
  },
  {
    id: "icd",
    label: "ICD / CRT-D",
    subtitle: "Implantable Cardioverter-Defibrillator",
    color: "#7c3aed",
    icon: Layers,
    views: icdViews,
  },
];

// ─── VIEW CARD COMPONENT ──────────────────────────────────────────────────────

function ScanViewCard({ view, deviceColor }: { view: ScanView; deviceColor: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"acquisition" | "whatToSee" | "doppler" | "tips">("acquisition");

  const tabs = [
    { id: "acquisition" as const, label: "Acquisition", icon: Camera },
    { id: "whatToSee" as const, label: "What to See", icon: Eye },
    ...(view.doppler ? [{ id: "doppler" as const, label: "Doppler", icon: Activity }] : []),
    ...(view.tips ? [{ id: "tips" as const, label: "Tips", icon: Lightbulb }] : []),
  ];

  const activeContent = {
    acquisition: view.acquisition,
    whatToSee: view.whatToSee,
    doppler: view.doppler ?? [],
    tips: view.tips ?? [],
  }[activeTab];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <button
        className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: deviceColor + "18" }}>
            <Scan className="w-4 h-4" style={{ color: deviceColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800 text-sm leading-snug" style={{ fontFamily: "Merriweather, serif" }}>{view.name}</h3>
              {view.critical && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <AlertTriangle className="w-2.5 h-2.5" /> Critical
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {view.window}
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Depth: {view.depth}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Positioning info */}
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-50">
            <div className="rounded-lg p-3" style={{ background: deviceColor + "08", border: `1px solid ${deviceColor}20` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: deviceColor }}>Patient Position</p>
              <p className="text-xs text-gray-700">{view.patientPosition}</p>
            </div>
            <div className="rounded-lg p-3 bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Probe Position</p>
              <p className="text-xs text-gray-700">{view.probe}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
                  style={{
                    borderBottomColor: isActive ? deviceColor : "transparent",
                    color: isActive ? deviceColor : "#9ca3af",
                    background: isActive ? deviceColor + "08" : "transparent",
                  }}
                >
                  <TabIcon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-4">
            <ul className="space-y-2">
              {activeContent.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{ background: deviceColor }}>
                    {i + 1}
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            {/* Pitfalls */}
            {activeTab === "acquisition" && view.pitfalls && view.pitfalls.length > 0 && (
              <div className="mt-4 rounded-lg p-3 bg-amber-50 border border-amber-200">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Common Pitfalls
                </p>
                <ul className="space-y-1.5">
                  {view.pitfalls.map((p, i) => (
                    <li key={i} className="text-xs text-amber-800 leading-relaxed flex items-start gap-1.5">
                      <span className="text-amber-500 flex-shrink-0">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MechanicalSupportScanCoach() {
  const [activeDevice, setActiveDevice] = useState("lvad");
  const device = DEVICE_SCAN_COACHES.find(d => d.id === activeDevice)!;

  return (
    <Layout>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <Scan className="w-3 h-3 text-[#4ad9e0]" />
                  <span className="text-[11px] text-white/80 font-medium uppercase tracking-wider">ScanCoach™ — Premium</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                MechanicalSupportAssist™ ScanCoach
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-sm mb-2">Imaging Acquisition Guide for MCS Devices</p>
              <p className="text-white/60 text-xs max-w-xl leading-relaxed">
                View-by-view acquisition protocols, probe positioning, Doppler guidance, and critical pitfalls for echo assessment of LVAD, ECMO, Impella, LifeVest, and ICD/CRT-D.
              </p>
            </div>
            <Link href="/mechanical-support-navigator">
              <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                <Target className="w-3.5 h-3.5" />
                Navigator
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Device Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container">
          <div className="flex overflow-x-auto gap-0 scrollbar-hide">
            {DEVICE_SCAN_COACHES.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeDevice === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDevice(tab.id)}
                  className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0"
                  style={{
                    borderBottomColor: isActive ? tab.color : "transparent",
                    color: isActive ? tab.color : "#6b7280",
                    background: isActive ? tab.color + "08" : "transparent",
                  }}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <PremiumOverlay featureName="MechanicalSupportAssist™ ScanCoach">
        <div className="container py-6">
          {/* Device subtitle */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{device.label} ScanCoach</h2>
              <p className="text-sm text-gray-500">{device.subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ color: device.color, borderColor: device.color + "40", background: device.color + "10" }}>
              <device.icon className="w-3.5 h-3.5" />
              {device.views.length} views
            </div>
          </div>

          {/* Views */}
          <div className="space-y-4 mb-8">
            {device.views.map(view => (
              <ScanViewCard key={view.id} view={view} deviceColor={device.color} />
            ))}
          </div>

          {/* Navigator CTA */}
          <div className="mt-6 rounded-xl p-4 flex items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
            <div>
              <p className="text-xs font-semibold text-[#4ad9e0] mb-0.5">Protocol Checklists</p>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                MechanicalSupportAssist™ Navigator
              </p>
              <p className="text-white/60 text-xs mt-0.5">Pre-implant, post-implant, and weaning checklists with reference values</p>
            </div>
            <Link href="/mechanical-support-navigator">
              <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#189aa1" }}>
                <Target className="w-3.5 h-3.5" />
                Open Navigator
                <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>
      </PremiumOverlay>
    </Layout>
  );
}
