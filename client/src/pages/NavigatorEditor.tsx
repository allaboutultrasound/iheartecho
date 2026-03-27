/*
  NavigatorEditor.tsx — iHeartEcho™ Platform Admin
  Allows admins to edit Navigator protocol checklist sections for all modules.
  Features:
    • Module selector (TTE, TEE, HOCM, Fetal, POCUS Cardiac, UEA, Stress)
    • "Load from static defaults" button to seed DB from hardcoded content
    • Drag-to-reorder sections
    • Inline section editing: title, probe note, add/edit/delete/reorder items
    • Mark items as critical
    • Save individual sections or all at once
  Access: platform_admin or owner role only.
*/
import React, { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronLeft, ChevronDown, ChevronUp, GripVertical,
  Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle2,
  RotateCcw, Edit3, X, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChecklistItem = {
  id: string;
  label: string;
  detail?: string;
  critical?: boolean;
};

type Section = {
  id: number; // DB id (0 = unsaved)
  module: string;
  sectionId: string;
  sectionTitle: string;
  probeNote: string;
  items: ChecklistItem[];
  sortOrder: number;
  dirty: boolean; // has unsaved changes
};

// ─── Static Defaults ─────────────────────────────────────────────────────────
// Normalized from each Navigator page's hardcoded protocol arrays.
const STATIC_DEFAULTS: Record<string, Omit<Section, "id" | "dirty">[]> = {
  tte: [
    {
      module: "tte", sectionId: "plax", sortOrder: 0,
      sectionTitle: "Parasternal Long Axis (PLAX)",
      probeNote: "2nd–4th ICS, left sternal border | Notch: 10–11 o'clock",
      items: [
        { id: "plax_lv_size", label: "LV size (EDD, ESD)", detail: "Normal EDD: ≤58 mm (M), ≤52 mm (F)" },
        { id: "plax_lv_wall", label: "LV wall thickness (IVS, PW)", detail: "Normal: 6–11 mm. Hypertrophy: >11 mm (M), >10 mm (F)" },
        { id: "plax_ef", label: "LV systolic function (visual EF)", detail: "Normal EF ≥55%" },
        { id: "plax_mv", label: "Mitral valve morphology (leaflets, tips, chordae)", detail: "Assess for prolapse, thickening, calcification, restricted motion" },
        { id: "plax_av", label: "Aortic valve morphology (leaflets, opening)", detail: "Bicuspid? Calcification? Restricted opening?" },
        { id: "plax_aortic_root", label: "Aortic root and ascending aorta diameter", detail: "Normal: ≤40 mm (root), ≤38 mm (ascending). Dilated: >45 mm" },
        { id: "plax_la", label: "Left atrial size (AP diameter)", detail: "Normal: ≤40 mm. Dilated: >40 mm" },
        { id: "plax_rv", label: "RV size (qualitative)", detail: "RV should be <2/3 LV size in PLAX" },
        { id: "plax_pericardium", label: "Pericardium (effusion?)", detail: "Measure in diastole. Posterior effusion most visible here" },
        { id: "plax_mr_color", label: "MR color Doppler", detail: "Assess jet origin, direction, extent", critical: true },
        { id: "plax_ar_color", label: "AR color Doppler (LVOT)", detail: "Assess jet width relative to LVOT", critical: true },
      ],
    },
    {
      module: "tte", sectionId: "psax", sortOrder: 1,
      sectionTitle: "Parasternal Short Axis (PSAX)",
      probeNote: "Rotate 90° clockwise from PLAX | Notch: 1–2 o'clock",
      items: [
        { id: "psax_av", label: "AV level: tricuspid/bicuspid, leaflet morphology", detail: "Assess for bicuspid AV, commissural fusion, calcification" },
        { id: "psax_rv", label: "RV outflow tract (RVOT) at AV level", detail: "RVOT dilation? PR color Doppler" },
        { id: "psax_pv", label: "Pulmonary valve (PV) morphology and PR", detail: "PV stenosis? PR severity?" },
        { id: "psax_tv", label: "Tricuspid valve (TV) at AV level", detail: "TV morphology, TR color Doppler" },
        { id: "psax_ra", label: "Right atrium size", detail: "RA area: normal <18 cm²" },
        { id: "psax_mv", label: "MV level: leaflet morphology (fish-mouth view)", detail: "Planimetry of MVA if MS suspected" },
        { id: "psax_pm", label: "Papillary muscle level: LV wall motion", detail: "All 6 segments: anteroseptal, anterior, lateral, posterior, inferior, inferoseptal" },
        { id: "psax_apex", label: "Apical level: LV wall motion", detail: "Anterior, lateral, inferior, septal apex segments" },
        { id: "psax_rvot_vti", label: "RVOT VTI (PW Doppler)", detail: "Normal: 15–25 cm. Reduced in RV dysfunction or PAH" },
      ],
    },
    {
      module: "tte", sectionId: "a4c", sortOrder: 2,
      sectionTitle: "Apical 4-Chamber (A4C)",
      probeNote: "Cardiac apex, 5th–6th ICS, mid-clavicular | Notch: 3 o'clock",
      items: [
        { id: "a4c_lv_size", label: "LV volumes (biplane Simpson's) and EF", detail: "EDV, ESV, EF. Most accurate for EF measurement", critical: true },
        { id: "a4c_lv_wall", label: "LV wall motion (all apical segments)", detail: "Septal, lateral, anterior, inferior walls" },
        { id: "a4c_rv_size", label: "RV size (basal, mid, longitudinal)", detail: "Normal: basal ≤41 mm, mid ≤35 mm, longitudinal ≤83 mm" },
        { id: "a4c_rv_func", label: "RV function: TAPSE, RV S' (TDI)", detail: "TAPSE ≥17 mm, S' ≥9.5 cm/s", critical: true },
        { id: "a4c_la_vol", label: "LA volume index (biplane)", detail: "Normal: ≤34 mL/m². Dilated: >34 mL/m²", critical: true },
        { id: "a4c_ra_size", label: "RA size (area or volume)", detail: "Normal RA area: <18 cm²" },
        { id: "a4c_mv_doppler", label: "Mitral inflow Doppler (E, A, DT)", detail: "E/A ratio, deceleration time (normal DT: 150–220 ms)" },
        { id: "a4c_tdi", label: "Tissue Doppler (e' septal and lateral)", detail: "Septal e' normal ≥7 cm/s, Lateral e' ≥10 cm/s", critical: true },
        { id: "a4c_mr_color", label: "MR color Doppler (A4C)", detail: "Assess jet area, vena contracta, PISA" },
        { id: "a4c_tr_color", label: "TR color Doppler + CW Doppler", detail: "TR Vmax for RVSP estimation", critical: true },
      ],
    },
    {
      module: "tte", sectionId: "a5c", sortOrder: 3,
      sectionTitle: "Apical 5-Chamber (A5C)",
      probeNote: "Tilt anteriorly from A4C | Same position",
      items: [
        { id: "a5c_lvot", label: "LVOT diameter measurement (2D)", detail: "Measure in systole, inner edge to inner edge, 0.5–1 cm below AV" },
        { id: "a5c_lvot_pw", label: "LVOT PW Doppler (VTI)", detail: "Sample volume 0.5–1 cm below AV. Normal VTI: 18–25 cm" },
        { id: "a5c_av_cw", label: "AV CW Doppler (Vmax, mean gradient)", detail: "Align parallel to flow. Severe AS: Vmax ≥4 m/s, MG ≥40 mmHg", critical: true },
        { id: "a5c_ar_cw", label: "AR CW Doppler (PHT if AR present)", detail: "PHT ≤200 ms = severe AR" },
      ],
    },
    {
      module: "tte", sectionId: "a2c", sortOrder: 4,
      sectionTitle: "Apical 2-Chamber (A2C)",
      probeNote: "Rotate 60° CCW from A4C | Notch: 12 o'clock",
      items: [
        { id: "a2c_lv_vol", label: "LV volumes (biplane — second plane)", detail: "Required for accurate biplane Simpson's EF" },
        { id: "a2c_wall", label: "Anterior and inferior wall motion", detail: "Anterior (LAD territory), inferior (RCA territory)" },
        { id: "a2c_mv", label: "Mitral valve (anterior/posterior leaflets)", detail: "Prolapse? Flail leaflet? Restricted motion?" },
        { id: "a2c_la", label: "LA (second plane for volume)", detail: "Required for biplane LA volume index" },
      ],
    },
    {
      module: "tte", sectionId: "aplax", sortOrder: 5,
      sectionTitle: "Apical 3-Chamber / APLAX",
      probeNote: "Rotate 30–40° CCW from A2C | Notch: 10–11 o'clock",
      items: [
        { id: "aplax_lvot", label: "LVOT (alternative view)", detail: "Useful if A5C suboptimal" },
        { id: "aplax_av", label: "Aortic valve (alternative CW alignment)", detail: "Use if A5C alignment poor" },
        { id: "aplax_posterior", label: "Posterior wall and inferolateral segments", detail: "Inferolateral wall (LCx territory)" },
      ],
    },
    {
      module: "tte", sectionId: "subcostal", sortOrder: 6,
      sectionTitle: "Subcostal",
      probeNote: "Subxiphoid, angled toward heart | Notch: 3 o'clock",
      items: [
        { id: "sub_ivc", label: "IVC diameter and respiratory variation", detail: "≤21 mm + >50% collapse = RAP 3 mmHg. >21 mm + <50% = RAP 15 mmHg", critical: true },
        { id: "sub_rv", label: "RV free wall thickness", detail: "Normal ≤5 mm. Hypertrophy: >5 mm" },
        { id: "sub_4ch", label: "Subcostal 4-chamber view (RV/LV relationship)", detail: "Useful in poor acoustic windows" },
        { id: "sub_asd", label: "Interatrial septum (ASD/PFO screening)", detail: "Best view for IAS. Color Doppler for shunt" },
        { id: "sub_pericardium", label: "Pericardial effusion assessment", detail: "Circumferential? RV diastolic collapse?" },
      ],
    },
    {
      module: "tte", sectionId: "suprasternal", sortOrder: 7,
      sectionTitle: "Suprasternal Notch",
      probeNote: "Suprasternal notch | Notch: 12 o'clock",
      items: [
        { id: "supra_arch", label: "Aortic arch (transverse, isthmus)", detail: "Assess for coarctation, dilation. Normal arch ≤28 mm" },
        { id: "supra_desc", label: "Descending aorta (CW Doppler)", detail: "Diastolic flow reversal = significant AR" },
        { id: "supra_coarc", label: "Coarctation screening (Doppler)", detail: "Continuous diastolic flow = significant coarctation" },
        { id: "supra_pulm_veins", label: "Pulmonary veins (if accessible)", detail: "Pulmonary vein Doppler for diastolic function" },
      ],
    },
  ],
  tee: [
    {
      module: "tee", sectionId: "me4c", sortOrder: 0,
      sectionTitle: "ME 4-Chamber (0°)",
      probeNote: "Mid-esophageal | 0° | 30–35 cm | LV/RV function, MV/TV, ASD/PFO",
      items: [
        { id: "me4c_lv", label: "LV size and systolic function", detail: "Biplane EF if needed. Assess all walls", critical: true },
        { id: "me4c_rv", label: "RV size and function", detail: "RV should be <2/3 LV size. TAPSE not feasible — use FAC or S'" },
        { id: "me4c_mv", label: "Mitral valve morphology (A4C equivalent)", detail: "Leaflet coaptation, prolapse, restriction, calcification", critical: true },
        { id: "me4c_tv", label: "Tricuspid valve morphology", detail: "TR severity, leaflet morphology" },
        { id: "me4c_la", label: "Left atrium size and LAA", detail: "LA dilation? Spontaneous echo contrast (SEC)?" },
        { id: "me4c_ias", label: "Interatrial septum (ASD/PFO)", detail: "Color Doppler + bubble study if PFO suspected", critical: true },
        { id: "me4c_mr_color", label: "MR color Doppler", detail: "Jet origin, direction, extent. Vena contracta", critical: true },
        { id: "me4c_tr_color", label: "TR color Doppler + CW", detail: "TR Vmax for RVSP estimation" },
      ],
    },
    {
      module: "tee", sectionId: "me2c", sortOrder: 1,
      sectionTitle: "ME 2-Chamber (90°)",
      probeNote: "Mid-esophageal | 90° | 30–35 cm | LV anterior/inferior walls, MV, LAA",
      items: [
        { id: "me2c_lv", label: "LV anterior and inferior wall motion", detail: "LAD (anterior) and RCA (inferior) territories" },
        { id: "me2c_mv", label: "MV anterior and posterior leaflets", detail: "A1/A2/A3 and P1/P2/P3 segments visible" },
        { id: "me2c_la", label: "Left atrium and LAA", detail: "LAA thrombus? SEC? LAA flow velocity <20 cm/s = stasis" },
        { id: "me2c_laa_doppler", label: "LAA Doppler (emptying velocity)", detail: "Normal LAA emptying: >40 cm/s. <20 cm/s = high thrombus risk", critical: true },
      ],
    },
    {
      module: "tee", sectionId: "melax", sortOrder: 2,
      sectionTitle: "ME Long Axis (LAX) (120–135°)",
      probeNote: "Mid-esophageal | 120–135° | 30–35 cm | LVOT, AV, aortic root, MV",
      items: [
        { id: "melax_av", label: "Aortic valve morphology (3 cusps visible)", detail: "Bicuspid? Calcification? Restricted opening?" },
        { id: "melax_lvot", label: "LVOT diameter (for SV calculation)", detail: "Measure in systole, 0.5–1 cm below AV" },
        { id: "melax_aortic_root", label: "Aortic root and proximal ascending aorta", detail: "Sinus of Valsalva, STJ, ascending aorta diameters", critical: true },
        { id: "melax_ar_color", label: "AR color Doppler (LVOT)", detail: "Jet width/LVOT width. Severe: >65% LVOT width" },
        { id: "melax_mv", label: "MV (PLAX equivalent)", detail: "Posterior leaflet prolapse best seen here" },
      ],
    },
    {
      module: "tee", sectionId: "meavsax", sortOrder: 3,
      sectionTitle: "ME AV SAX (30–60°)",
      probeNote: "Mid-esophageal | 30–60° | 28–32 cm | AV leaflet morphology, coronary ostia",
      items: [
        { id: "meavsax_av", label: "AV leaflet morphology (tricuspid vs bicuspid)", detail: "R, L, N cusps. Commissural fusion? Calcification?", critical: true },
        { id: "meavsax_coronary", label: "Coronary ostia (LMCA and RCA)", detail: "LMCA from left cusp, RCA from right cusp. Dissection? Occlusion?" },
        { id: "meavsax_rvot", label: "RVOT and pulmonary valve", detail: "RVOT dilation? PV morphology?" },
        { id: "meavsax_ra_rv", label: "RA and RV (at AV level)", detail: "RA size, TV, coronary sinus" },
        { id: "meavsax_ar_color", label: "AR color Doppler (SAX)", detail: "Identify which cusp is prolapsing/perforated" },
      ],
    },
    {
      module: "tee", sectionId: "mebicaval", sortOrder: 4,
      sectionTitle: "ME Bicaval (90–110°)",
      probeNote: "Mid-esophageal | 90–110° | 28–32 cm | IAS, SVC/IVC, ASD sizing",
      items: [
        { id: "mebicaval_ias", label: "Interatrial septum (full length)", detail: "Secundum ASD, sinus venosus ASD, PFO", critical: true },
        { id: "mebicaval_svc", label: "Superior vena cava", detail: "SVC flow, sinus venosus ASD near SVC" },
        { id: "mebicaval_ivc", label: "Inferior vena cava", detail: "IVC entry into RA. Eustachian valve?" },
        { id: "mebicaval_color", label: "Color Doppler across IAS", detail: "Shunt direction and size. Bubble study if PFO" },
      ],
    },
    {
      module: "tee", sectionId: "mervio", sortOrder: 5,
      sectionTitle: "ME RV Inflow-Outflow (60–90°)",
      probeNote: "Mid-esophageal | 60–90° | 28–32 cm | TV, RVOT, PV",
      items: [
        { id: "mervio_tv", label: "Tricuspid valve (all leaflets)", detail: "Anterior, posterior, septal leaflets. TR mechanism" },
        { id: "mervio_rvot", label: "RVOT and pulmonary valve", detail: "RVOT obstruction? PV stenosis/regurgitation?" },
        { id: "mervio_tr_cw", label: "TR CW Doppler (RVSP)", detail: "TR Vmax for RVSP. Severe TR: EROA ≥0.4 cm²" },
        { id: "mervio_pr", label: "PR color Doppler", detail: "PR severity. PHT of PR jet" },
      ],
    },
    {
      module: "tee", sectionId: "tg_mid_sax", sortOrder: 6,
      sectionTitle: "TG Mid SAX (0°)",
      probeNote: "Transgastric | 0° | 40–45 cm | Continuous LV monitoring, wall motion",
      items: [
        { id: "tgmidsax_wma", label: "LV wall motion (all 6 segments)", detail: "Anteroseptal, anterior, anterolateral, inferolateral, inferior, inferoseptal", critical: true },
        { id: "tgmidsax_rv", label: "RV free wall and D-sign", detail: "Septal flattening = RV pressure/volume overload" },
        { id: "tgmidsax_volume", label: "LV end-diastolic area (volume status)", detail: "Kissing papillary muscles = hypovolemia. Dilated LV = volume overload" },
        { id: "tgmidsax_pap", label: "Papillary muscle morphology", detail: "Papillary muscle rupture? Hypertrophy?" },
      ],
    },
    {
      module: "tee", sectionId: "tglax", sortOrder: 7,
      sectionTitle: "TG LAX / TG 2-Chamber (90–120°)",
      probeNote: "Transgastric | 90–120° | 40–45 cm | LVOT/AV Doppler alignment",
      items: [
        { id: "tglax_lvot_pw", label: "LVOT PW Doppler", detail: "Best Doppler alignment for LVOT VTI in intraop TEE" },
        { id: "tglax_av_cw", label: "AV CW Doppler (TG LAX)", detail: "Parallel alignment. Use for AS gradient in intraop TEE" },
      ],
    },
    {
      module: "tee", sectionId: "deep_tg", sortOrder: 8,
      sectionTitle: "Deep TG LAX",
      probeNote: "Deep transgastric | 0° (anteflexed) | 45–50 cm | Best Doppler for LVOT/AV",
      items: [
        { id: "dtg_lvot_pw", label: "LVOT PW Doppler (best alignment)", detail: "Used for SV calculation in intraop TEE" },
        { id: "dtg_av_cw", label: "AV CW Doppler (best alignment for AS)", detail: "Most parallel to flow — preferred for intraop AS gradient", critical: true },
      ],
    },
  ],
  pocus_cardiac: [
    {
      module: "pocus_cardiac", sectionId: "plax", sortOrder: 0,
      sectionTitle: "Parasternal Long Axis (PLAX)",
      probeNote: "Phased array 2–4 MHz | 2nd–4th ICS, left sternal border | Notch: 10 o'clock",
      items: [
        { id: "plax_lv_ef", label: "LV systolic function (visual EF)", detail: "Hyperdynamic (>70%), normal (55–70%), mildly reduced (40–55%), severely reduced (<40%)", critical: true },
        { id: "plax_epss", label: "E-point septal separation (EPSS)", detail: "EPSS >10 mm correlates with EF <40%. Measure in M-mode at MV tip level." },
        { id: "plax_pericardium", label: "Pericardial effusion", detail: "Posterior effusion first visible in PLAX. Larger = more significant.", critical: true },
        { id: "plax_mv", label: "Mitral valve — gross morphology", detail: "Restricted opening (MS), prolapse, flail leaflet. EPSS >10 mm = reduced LV function." },
        { id: "plax_aortic_root", label: "Aortic root diameter (normal < 3.7 cm)", detail: "Aortic root dilation = aortic aneurysm, Marfan's." },
        { id: "plax_rv", label: "RV — qualitative size assessment", detail: "Dilated RV in PLAX = RV strain. Normal RV smaller than LV." },
      ],
    },
    {
      module: "pocus_cardiac", sectionId: "psax_pm", sortOrder: 1,
      sectionTitle: "Parasternal Short Axis — Papillary Muscle Level",
      probeNote: "Phased array 2–4 MHz | Rotate 90° clockwise from PLAX | Tilt caudal",
      items: [
        { id: "psax_pm_wma", label: "Regional wall motion — 6 segments", detail: "Akinetic or hypokinetic segments = ACS. Inferior/inferolateral = RCA. Anterior/anteroseptal = LAD.", critical: true },
        { id: "psax_pm_dsign", label: "D-sign — septal flattening", detail: "Systolic D-sign = RV pressure overload (PE, PH). Diastolic D-sign = RV volume overload.", critical: true },
        { id: "psax_pm_rv_size", label: "RV free wall thickness and size", detail: "RV free wall >5 mm = chronic RV hypertrophy. Acute dilation without hypertrophy = acute PE." },
      ],
    },
    {
      module: "pocus_cardiac", sectionId: "a4c", sortOrder: 2,
      sectionTitle: "Apical 4-Chamber (A4C)",
      probeNote: "Phased array 2–4 MHz | Cardiac apex, 5th–6th ICS | Marker toward left (3 o'clock)",
      items: [
        { id: "a4c_lv_ef", label: "LV systolic function — biplane or visual EF", detail: "Biplane Simpson's preferred. Hyperdynamic vs. reduced.", critical: true },
        { id: "a4c_rv_size", label: "RV size — basal diameter (normal ≤41 mm)", detail: "RV:LV ratio >1 = RV dilation. RV:LV ratio >1.5 = severe dilation (PE, RV infarct).", critical: true },
        { id: "a4c_rv_function", label: "RV systolic function — TAPSE (normal ≥17 mm)", detail: "TAPSE <17 mm = RV dysfunction. McConnell's sign = PE.", critical: true },
        { id: "a4c_pericardium", label: "Pericardial effusion — RA/RV systolic collapse", detail: "RA systolic collapse = early tamponade. RV diastolic collapse = tamponade physiology.", critical: true },
        { id: "a4c_mv_e", label: "Mitral E-wave — gross assessment", detail: "Qualitative assessment of MV inflow." },
        { id: "a4c_la_size", label: "Left atrium — qualitative size", detail: "Dilated LA = chronic LV dysfunction, AF, MS." },
      ],
    },
    {
      module: "pocus_cardiac", sectionId: "subcostal", sortOrder: 3,
      sectionTitle: "Subcostal 4-Chamber",
      probeNote: "Phased array 2–4 MHz | Subxiphoid | Marker toward left (3 o'clock)",
      items: [
        { id: "sub_4ch_rv", label: "RV size and function (subcostal)", detail: "Alternative window when apical views poor.", critical: true },
        { id: "sub_4ch_pericardium", label: "Pericardial effusion (circumferential)", detail: "Subcostal is the best view for tamponade assessment.", critical: true },
        { id: "sub_ivc", label: "IVC diameter and respiratory variation", detail: "≤21 mm + >50% collapse = RAP 3 mmHg. >21 mm + <50% = RAP 15 mmHg.", critical: true },
      ],
    },
  ],
  hocm: [
    {
      module: "hocm", sectionId: "morphology", sortOrder: 0,
      sectionTitle: "LV Morphology & Wall Thickness",
      probeNote: "PLAX, PSAX, A4C, A2C — standard TTE windows",
      items: [
        { id: "hocm_mwt", label: "Maximal wall thickness (MWT)", detail: "Measure at end-diastole in thickest segment. HOCM: MWT ≥15 mm (or ≥13 mm with family history). Measure in PLAX and PSAX.", critical: true },
        { id: "hocm_distribution", label: "Distribution of hypertrophy", detail: "Classify: asymmetric septal (ASH), apical HCM, concentric, mid-ventricular, sigmoid septum." },
        { id: "hocm_basal_septum", label: "Basal septal thickness", detail: "Measure IVS at basal level in PLAX. Sigmoid septum vs. true HCM." },
        { id: "hocm_lv_cavity", label: "LV cavity size", detail: "HOCM often has small, hyperdynamic LV. End-stage HCM: dilated LV with EF <50%." },
        { id: "hocm_ef", label: "LV systolic function (EF)", detail: "Biplane Simpson's. HOCM typically hyperdynamic (EF >65%). EF <50% = burned-out HCM.", critical: true },
        { id: "hocm_apical", label: "Apical HCM screening", detail: "Use A4C with contrast if apical wall not clearly seen. Apical wall ≥15 mm = apical HCM.", critical: true },
      ],
    },
    {
      module: "hocm", sectionId: "lvot", sortOrder: 1,
      sectionTitle: "LVOT Assessment & SAM",
      probeNote: "PLAX, A5C, A3C — Doppler alignment critical",
      items: [
        { id: "hocm_sam_2d", label: "SAM identification (2D)", detail: "PLAX and A3C/A5C: anterior motion of MV leaflet toward IVS in systole. Grade SAM 0–3.", critical: true },
        { id: "hocm_sam_contact", label: "SAM-septal contact point", detail: "Identify contact level: basal, mid, or apical septum. Guides septal reduction therapy planning.", critical: true },
        { id: "hocm_lvot_diameter", label: "LVOT diameter measurement", detail: "Measure in PLAX at end-systole, 1 cm below AV, inner edge to inner edge." },
        { id: "hocm_lvot_gradient", label: "Resting LVOT gradient (CW Doppler)", detail: "From A5C or A3C. Dagger-shaped late-peaking signal. Significant: ≥30 mmHg; severe: ≥50 mmHg.", critical: true },
        { id: "hocm_lvot_vti", label: "LVOT VTI (PW Doppler)", detail: "Sample volume 5 mm proximal to AV. Normal LVOT VTI: 18–22 cm." },
      ],
    },
  ],
  fetal: [
    {
      module: "fetal", sectionId: "situs", sortOrder: 0,
      sectionTitle: "Situs & Cardiac Position",
      probeNote: "Transabdominal or transvaginal | Standard fetal cardiac views",
      items: [
        { id: "fetal_situs", label: "Situs solitus / inversus / ambiguus", detail: "Stomach and cardiac apex should both be on the left. Situs inversus: both on right. Ambiguus: discordant.", critical: true },
        { id: "fetal_position", label: "Cardiac position (levocardia / dextrocardia / mesocardia)", detail: "Levocardia = normal. Dextrocardia with situs inversus = mirror image (usually normal). Dextrocardia with situs solitus = structural CHD.", critical: true },
        { id: "fetal_axis", label: "Cardiac axis (normal 45° ± 20° to left)", detail: "Abnormal axis: CHD, lung lesions, diaphragmatic hernia. Measure from anterior chest wall to interventricular septum." },
        { id: "fetal_size", label: "Cardiac size (cardiothoracic ratio)", detail: "Normal CT ratio: 0.25–0.35 (area method). CT ratio >0.35 = cardiomegaly. CT ratio <0.25 = small heart." },
      ],
    },
    {
      module: "fetal", sectionId: "four_chamber", sortOrder: 1,
      sectionTitle: "Four-Chamber View",
      probeNote: "Transverse view of fetal chest at level of cardiac apex",
      items: [
        { id: "fetal_4ch_symmetry", label: "Ventricular symmetry (LV ≈ RV size)", detail: "Asymmetry: HLHS (small LV), HRHS (small RV), coarctation (small LV). Measure ventricular dimensions.", critical: true },
        { id: "fetal_4ch_av_valves", label: "AV valve morphology (MV and TV)", detail: "Offset of AV valves (TV more apical = normal). AVSD: common AV valve. Ebstein's: apically displaced TV.", critical: true },
        { id: "fetal_4ch_ias", label: "Interatrial septum (foramen ovale)", detail: "Foramen ovale flap should open toward LA. Absent flap = TAPVR. Restrictive FO = HLHS.", critical: true },
        { id: "fetal_4ch_ivs", label: "Interventricular septum (VSD screening)", detail: "Intact IVS = normal. Perimembranous VSD: defect below aortic valve. Muscular VSD: within muscular septum." },
        { id: "fetal_4ch_pericardium", label: "Pericardial effusion", detail: "Small physiologic effusion (<2 mm) may be normal. Larger effusion = hydrops, arrhythmia, structural CHD." },
      ],
    },
    {
      module: "fetal", sectionId: "outflow_tracts", sortOrder: 2,
      sectionTitle: "Outflow Tracts",
      probeNote: "Tilt probe cephalad from 4-chamber view",
      items: [
        { id: "fetal_lvot", label: "LVOT — aorta arising from LV", detail: "Aorta should arise from posterior (left) ventricle. Continuity between IVS and anterior aortic wall. Overriding aorta = ToF.", critical: true },
        { id: "fetal_rvot", label: "RVOT — pulmonary artery arising from RV", detail: "PA should arise from anterior (right) ventricle and cross the aorta. PA larger than aorta at this level.", critical: true },
        { id: "fetal_great_vessel_cross", label: "Great vessel crossing (PA crosses aorta)", detail: "Normal: PA and aorta cross each other. Parallel great vessels = TGA (D-TGA or L-TGA).", critical: true },
        { id: "fetal_outflow_size", label: "Great vessel size comparison", detail: "Normal: PA slightly larger than aorta. Aorta > PA = pulmonary stenosis/atresia. PA > aorta = AS/HLHS." },
      ],
    },
    {
      module: "fetal", sectionId: "arches", sortOrder: 3,
      sectionTitle: "Arches & Ductal View",
      probeNote: "Sagittal and coronal views of fetal chest",
      items: [
        { id: "fetal_ductal_arch", label: "Ductal arch (hockey stick shape)", detail: "Ductus arteriosus connects PA to descending aorta. Hockey stick shape = normal. Absent = ductal constriction.", critical: true },
        { id: "fetal_aortic_arch", label: "Aortic arch (candy cane shape)", detail: "Aortic arch: head and neck vessels arise from top. Candy cane shape = normal. Coarctation: narrowing at isthmus.", critical: true },
        { id: "fetal_arch_sidedness", label: "Arch sidedness (left vs. right aortic arch)", detail: "Left aortic arch = normal. Right aortic arch: associated with TOF, truncus, 22q11 deletion." },
        { id: "fetal_isthmus", label: "Aortic isthmus (CoA screening)", detail: "Isthmus should be ≥ 2/3 of ascending aorta diameter. Hypoplastic isthmus = coarctation risk." },
      ],
    },
  ],
  uea: [
    {
      module: "uea", sectionId: "plax", sortOrder: 0,
      sectionTitle: "Parasternal Long Axis (PLAX)",
      probeNote: "Parasternal window | Phased-array probe | Low MI contrast mode",
      items: [
        { id: "plax_lvo", label: "LV opacification — anterior septum and posterior wall", detail: "Confirm contrast fills LV cavity uniformly. Assess septal and posterior wall thickness.", critical: true },
        { id: "plax_mv", label: "Mitral valve and subvalvular apparatus", detail: "Contrast helps delineate chordae, papillary muscles, and subvalvular structures." },
        { id: "plax_aorta", label: "Aortic root and proximal ascending aorta", detail: "Contrast may enhance aortic root dimensions and identify dissection flap." },
        { id: "plax_pericardium", label: "Pericardial effusion", detail: "Contrast outlines LV epicardium — helps differentiate effusion from artifact." },
      ],
    },
    {
      module: "uea", sectionId: "a4c", sortOrder: 1,
      sectionTitle: "Apical 4-Chamber (A4C)",
      probeNote: "Apical window | Lateral decubitus position | Low MI mode",
      items: [
        { id: "a4c_lvo", label: "LV opacification — all 4 apical segments", detail: "Apical segments most commonly non-visualised. Confirm apical cap is filled.", critical: true },
        { id: "a4c_apex", label: "Apical thrombus screening", detail: "Contrast fills LV cavity — thrombus appears as filling defect. Sensitivity >90% vs. unenhanced echo.", critical: true },
        { id: "a4c_ef", label: "Visual EF estimation", detail: "Contrast allows accurate visual EF in previously non-diagnostic studies." },
        { id: "a4c_rv", label: "RV opacification (if indicated)", detail: "High-dose UEA or right-heart contrast may opacify RV for RVEF or ARVC assessment." },
      ],
    },
    {
      module: "uea", sectionId: "a2c", sortOrder: 2,
      sectionTitle: "Apical 2-Chamber (A2C)",
      probeNote: "Apical window | Rotate 90° CCW from A4C",
      items: [
        { id: "a2c_anterior", label: "Anterior wall opacification", detail: "LAD territory. Anterior wall perfusion defects most visible in A2C.", critical: true },
        { id: "a2c_inferior", label: "Inferior wall opacification", detail: "RCA territory. Inferior wall and inferior apex." },
        { id: "a2c_apex", label: "Apical segment — anterior and inferior", detail: "Confirm apical filling. Apical HCM: spade-shaped cavity with contrast." },
      ],
    },
    {
      module: "uea", sectionId: "aplax", sortOrder: 3,
      sectionTitle: "Apical 3-Chamber / Long Axis (A3C/APLAX)",
      probeNote: "Apical window | Rotate 30–40° CCW from A2C",
      items: [
        { id: "aplax_inferolateral", label: "Inferolateral wall opacification", detail: "LCx territory. Posterolateral wall and inferolateral apex.", critical: true },
        { id: "aplax_anteroseptal", label: "Anteroseptal wall opacification", detail: "LAD territory. Anterior septum and anteroseptal apex." },
        { id: "aplax_lvot", label: "LVOT and aortic valve", detail: "Contrast outlines LVOT. Useful for SAM assessment in HCM." },
      ],
    },
  ],
};

// ─── Module List ──────────────────────────────────────────────────────────────
const MODULES = [
  { id: "tte", label: "TTE Navigator" },
  { id: "tee", label: "TEE Navigator" },
  { id: "pocus_cardiac", label: "POCUS Cardiac Navigator" },
  { id: "hocm", label: "HOCM Navigator" },
  { id: "fetal", label: "Fetal Navigator" },
  { id: "uea", label: "UEA (Contrast Echo) Navigator" },
];

const BRAND = "#189aa1";

// ─── Sortable Section Component ───────────────────────────────────────────────
function SortableSection({
  section,
  onUpdate,
  onDelete,
  onSave,
  saving,
}: {
  section: Section;
  onUpdate: (updated: Section) => void;
  onDelete: (id: string) => void;
  onSave: (section: Section) => void;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.sectionId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingProbe, setEditingProbe] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<ChecklistItem>({ id: "", label: "", detail: "", critical: false });

  const updateItem = (idx: number, patch: Partial<ChecklistItem>) => {
    const items = [...section.items];
    items[idx] = { ...items[idx], ...patch };
    onUpdate({ ...section, items, dirty: true });
  };

  const deleteItem = (idx: number) => {
    const items = section.items.filter((_, i) => i !== idx);
    onUpdate({ ...section, items, dirty: true });
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    const id = newItem.id.trim() || `${section.sectionId}_${Date.now()}`;
    const items = [...section.items, { ...newItem, id }];
    onUpdate({ ...section, items, dirty: true });
    setNewItem({ id: "", label: "", detail: "", critical: false });
    setAddingItem(false);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const items = [...section.items];
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    [items[idx], items[target]] = [items[target], items[idx]];
    onUpdate({ ...section, items, dirty: true });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border ${section.dirty ? "border-amber-300" : "border-gray-200"} shadow-sm overflow-hidden`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {editingTitle ? (
          <Input
            className="flex-1 h-7 text-sm font-semibold"
            value={section.sectionTitle}
            autoFocus
            onChange={(e) => onUpdate({ ...section, sectionTitle: e.target.value, dirty: true })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
          />
        ) : (
          <button
            className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-[#189aa1] transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {section.sectionTitle}
          </button>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="outline" className="text-xs">{section.items.length} items</Badge>
          {section.dirty && (
            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-300">Unsaved</Badge>
          )}
          {section.id > 0 && !section.dirty && (
            <Badge className="text-xs bg-green-50 text-green-700 border-green-200">Saved</Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => onSave(section)}
            disabled={saving || !section.dirty}
            title="Save this section"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-red-400 hover:text-red-600"
            onClick={() => onDelete(section.sectionId)}
            title="Delete section"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Probe note */}
      {expanded && (
        <div className="px-4 pb-1">
          {editingProbe ? (
            <Input
              className="h-7 text-xs text-gray-500"
              value={section.probeNote}
              autoFocus
              placeholder="Probe note / position hint"
              onChange={(e) => onUpdate({ ...section, probeNote: e.target.value, dirty: true })}
              onBlur={() => setEditingProbe(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingProbe(false)}
            />
          ) : (
            <button
              className="text-xs text-gray-400 hover:text-[#189aa1] text-left w-full"
              onClick={() => setEditingProbe(true)}
            >
              {section.probeNote || <span className="italic">Click to add probe note…</span>}
            </button>
          )}
        </div>
      )}

      {/* Items */}
      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 mt-2">
          {section.items.map((item, idx) => (
            <div key={item.id} className="group flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2">
              {/* Move buttons */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                <button
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === section.items.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {editingItemIdx === idx ? (
                <div className="flex-1 space-y-1.5">
                  <Input
                    className="h-7 text-xs"
                    value={item.label}
                    placeholder="Item label"
                    autoFocus
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                  />
                  <Textarea
                    className="text-xs min-h-[50px] resize-none"
                    value={item.detail ?? ""}
                    placeholder="Detail / clinical note (optional)"
                    onChange={(e) => updateItem(idx, { detail: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!item.critical}
                        onChange={(e) => updateItem(idx, { critical: e.target.checked })}
                        className="w-3 h-3"
                      />
                      <span className="text-amber-600 font-medium">Critical item</span>
                    </label>
                    <Button size="sm" variant="ghost" className="h-6 px-2 ml-auto" onClick={() => setEditingItemIdx(null)}>
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    {item.critical && (
                      <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-medium text-gray-800 leading-snug">{item.label}</span>
                  </div>
                  {item.detail && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.detail}</p>
                  )}
                </div>
              )}

              <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditingItemIdx(editingItemIdx === idx ? null : idx)}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                  onClick={() => deleteItem(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add item */}
          {addingItem ? (
            <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-1.5 border border-blue-200">
              <Input
                className="h-7 text-xs"
                value={newItem.label}
                placeholder="Item label (required)"
                autoFocus
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
              <Textarea
                className="text-xs min-h-[50px] resize-none"
                value={newItem.detail ?? ""}
                placeholder="Detail / clinical note (optional)"
                onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!newItem.critical}
                    onChange={(e) => setNewItem({ ...newItem, critical: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <span className="text-amber-600 font-medium">Critical item</span>
                </label>
                <div className="flex gap-1 ml-auto">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-gray-500" onClick={() => setAddingItem(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                  <Button size="sm" className="h-6 px-2 text-xs" style={{ background: BRAND }} onClick={addItem}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#189aa1] py-1.5 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-dashed border-gray-200 hover:border-[#189aa1]"
              onClick={() => setAddingItem(true)}
            >
              <Plus className="w-3 h-3" />
              Add checklist item
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NavigatorEditor() {
  const { user, loading: authLoading } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string>("tte");
  const [sections, setSections] = useState<Section[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const trpcUtils = trpc.useUtils();

  const sectionsQuery = trpc.navigatorAdmin.getModuleSections.useQuery(
    { module: selectedModule },
    { enabled: !!user }
  );

  const upsertMutation = trpc.navigatorAdmin.upsertSection.useMutation();
  const deleteMutation = trpc.navigatorAdmin.deleteSection.useMutation();
  const reorderMutation = trpc.navigatorAdmin.reorderSections.useMutation();
  const seedMutation = trpc.navigatorAdmin.seedFromStatic.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load sections: always start from static defaults, then overlay any DB overrides.
  // This ensures saving one section never hides the other static sections in the editor.
  useEffect(() => {
    if (!sectionsQuery.data) return;
    const defaults = STATIC_DEFAULTS[selectedModule] ?? [];
    if (sectionsQuery.data.length > 0) {
      // Build a lookup of DB rows by sectionId
      const dbMap = new Map(sectionsQuery.data.map((s) => [s.sectionId, s]));
      // Merge: for each static default, use DB row if one exists, else show static (unsaved)
      const merged: Section[] = defaults.map((d) => {
        const dbRow = dbMap.get(d.sectionId);
        if (dbRow) {
          return {
            id: dbRow.id,
            module: dbRow.module,
            sectionId: dbRow.sectionId,
            sectionTitle: dbRow.sectionTitle,
            probeNote: dbRow.probeNote,
            items: dbRow.items,
            sortOrder: dbRow.sortOrder,
            dirty: false,
          };
        }
        // No DB override for this section — show static default (not yet saved)
        return { ...d, id: 0, dirty: false };
      });
      setSections(merged);
    } else {
      // No DB data at all — load all static defaults (none saved yet)
      setSections(
        defaults.map((d) => ({
          ...d,
          id: 0,
          dirty: false,
        }))
      );
    }
  }, [sectionsQuery.data, selectedModule]);

  const handleModuleChange = (mod: string) => {
    setSelectedModule(mod);
    setSections([]);
  };

  const handleUpdate = useCallback((updated: Section) => {
    setSections((prev) => prev.map((s) => (s.sectionId === updated.sectionId ? updated : s)));
  }, []);

  const handleDelete = useCallback(
    async (sectionId: string) => {
      const section = sections.find((s) => s.sectionId === sectionId);
      if (!section) return;
      if (section.id > 0) {
        try {
          await deleteMutation.mutateAsync({ id: section.id });
          toast.success("Section deleted");
        } catch {
          toast.error("Failed to delete section");
          return;
        }
      }
      setSections((prev) => prev.filter((s) => s.sectionId !== sectionId));
      trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    },
    [sections, deleteMutation, trpcUtils, selectedModule]
  );

  const handleSaveSection = useCallback(
    async (section: Section) => {
      setSavingId(section.sectionId);
      try {
        await upsertMutation.mutateAsync({
          module: section.module,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          probeNote: section.probeNote,
          items: section.items,
          sortOrder: section.sortOrder,
        });
        setSections((prev) =>
          prev.map((s) => (s.sectionId === section.sectionId ? { ...s, dirty: false } : s))
        );
        toast.success(`"${section.sectionTitle}" saved`);
        trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
      } catch {
        toast.error("Failed to save section");
      } finally {
        setSavingId(null);
      }
    },
    [upsertMutation, trpcUtils, selectedModule]
  );

  const handleSaveAll = async () => {
    const dirty = sections.filter((s) => s.dirty);
    if (dirty.length === 0) { toast.info("No unsaved changes"); return; }
    setSavingAll(true);
    let saved = 0;
    for (const section of dirty) {
      try {
        await upsertMutation.mutateAsync({
          module: section.module,
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle,
          probeNote: section.probeNote,
          items: section.items,
          sortOrder: section.sortOrder,
        });
        saved++;
      } catch {
        // continue
      }
    }
    setSections((prev) => prev.map((s) => ({ ...s, dirty: false })));
    toast.success(`${saved} section${saved !== 1 ? "s" : ""} saved`);
    trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    setSavingAll(false);
  };

  const handleReloadDefaults = async () => {
    const defaults = STATIC_DEFAULTS[selectedModule] ?? [];
    if (defaults.length === 0) { toast.info("No static defaults for this module"); return; }
    try {
      await seedMutation.mutateAsync({
        module: selectedModule,
        sections: defaults.map((d) => ({ ...d, module: selectedModule })),
        force: true,
      });
      toast.success("Reloaded from static defaults");
      trpcUtils.navigatorAdmin.getModuleSections.invalidate({ module: selectedModule });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reload defaults");
    }
  };

  const handleAddSection = () => {
    const newSectionId = `section_${Date.now()}`;
    const newSection: Section = {
      id: 0,
      module: selectedModule,
      sectionId: newSectionId,
      sectionTitle: "New Section",
      probeNote: "",
      items: [],
      sortOrder: sections.length,
      dirty: true,
    };
    setSections((prev) => [...prev, newSection]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.sectionId === active.id);
    const newIdx = sections.findIndex((s) => s.sectionId === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({
      ...s,
      sortOrder: i,
    }));
    setSections(reordered);
    // Persist reorder for saved sections
    const toReorder = reordered.filter((s) => s.id > 0).map((s) => ({ id: s.id, sortOrder: s.sortOrder }));
    if (toReorder.length > 0) {
      try {
        await reorderMutation.mutateAsync(toReorder);
      } catch {
        toast.error("Failed to save order");
      }
    }
  };

  // Auth guard
  if (authLoading) return null;
  const isAdmin = user?.role === "admin" || user?.appRoles?.includes("platform_admin");
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-gray-500">Admin access required.</p>
          <Link href="/"><Button className="mt-4" variant="outline">Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  const dirtyCount = sections.filter((s) => s.dirty).length;

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/platform-admin">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
              Navigator Protocol Editor
            </h1>
            <p className="text-sm text-gray-500">Edit checklist sections for each Navigator module</p>
          </div>
        </div>

        {/* Module Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => handleModuleChange(mod.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedModule === mod.id
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={selectedModule === mod.id ? { background: BRAND } : {}}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            size="sm"
            className="gap-1.5 text-white"
            style={{ background: BRAND }}
            onClick={handleSaveAll}
            disabled={savingAll || dirtyCount === 0}
          >
            {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save All {dirtyCount > 0 && `(${dirtyCount})`}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleAddSection}>
            <Plus className="w-3.5 h-3.5" /> Add Section
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-gray-500 ml-auto"
            onClick={handleReloadDefaults}
            disabled={seedMutation.isPending}
            title="Reset this module to the built-in static defaults (overwrites DB)"
          >
            {seedMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reload Defaults
          </Button>
        </div>

        {/* Loading */}
        {sectionsQuery.isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading sections…</span>
          </div>
        )}

        {/* Sections */}
        {!sectionsQuery.isLoading && (
          <>
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="mb-3">No sections yet for this module.</p>
                <Button size="sm" variant="outline" onClick={handleAddSection} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add First Section
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={sections.map((s) => s.sectionId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <SortableSection
                        key={section.sectionId}
                        section={section}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onSave={handleSaveSection}
                        saving={savingId === section.sectionId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {dirtyCount > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {dirtyCount} unsaved section{dirtyCount !== 1 ? "s" : ""} — click <strong>Save All</strong> to persist changes.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
