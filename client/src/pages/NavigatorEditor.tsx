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
    {
      module: "pocus_cardiac", sectionId: "psax_mv", sortOrder: 4,
      sectionTitle: "Parasternal Short Axis — Mitral Valve Level",
      probeNote: "Phased array 2–4 MHz | Rotate 90° clockwise from PLAX | Tilt cephalad",
      items: [
        { id: "psax_mv_fish", label: "Mitral valve fish-mouth view", detail: "Planimetry of MVA if MS suspected. Normal MVA >4 cm². Severe MS: MVA <1.5 cm².", critical: true },
        { id: "psax_mv_wma", label: "Regional wall motion at MV level", detail: "6 segments: anteroseptal, anterior, lateral, posterior, inferior, inferoseptal." },
        { id: "psax_mv_color", label: "MR color Doppler at MV level", detail: "Eccentric jets best seen in PSAX. Assess jet direction and severity." },
      ],
    },
    {
      module: "pocus_cardiac", sectionId: "ivc", sortOrder: 5,
      sectionTitle: "Subcostal IVC",
      probeNote: "Phased array 2–4 MHz | Subxiphoid | Rotate to long axis of IVC",
      items: [
        { id: "ivc_diameter", label: "IVC diameter (normal ≤21 mm)", detail: "Measure 1–2 cm from RA-IVC junction in end-expiration.", critical: true },
        { id: "ivc_collapse", label: "Respiratory collapse (>50% = RAP 3 mmHg)", detail: "Sniff test or spontaneous breathing. Plethoric IVC (>21 mm, <50% collapse) = RAP 15 mmHg.", critical: true },
        { id: "ivc_hepatic_veins", label: "Hepatic vein dilation", detail: "Dilated hepatic veins = elevated RAP, TR, or cardiac tamponade." },
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
    {
      module: "hocm", sectionId: "provocation", sortOrder: 2,
      sectionTitle: "Provocation Manoeuvres",
      probeNote: "A5C or A3C — Doppler during and after provocation",
      items: [
        { id: "hocm_valsalva", label: "Valsalva manoeuvre (strain phase)", detail: "Ask patient to bear down for 10–15 seconds. Record CW Doppler during strain. Gradient increase ≥20 mmHg = significant provocation.", critical: true },
        { id: "hocm_standing", label: "Standing from squatting", detail: "Rapid standing reduces preload. Record CW Doppler immediately on standing. Alternative to Valsalva.", critical: true },
        { id: "hocm_amyl_nitrite", label: "Amyl nitrite provocation (if available)", detail: "Inhale amyl nitrite for 3–5 seconds. Reduces preload and afterload. Record CW Doppler at peak effect (30–60 s).", critical: false },
        { id: "hocm_exercise_gradient", label: "Post-exercise gradient (if resting gradient <50 mmHg)", detail: "Record CW Doppler immediately after treadmill or bicycle exercise. Provoked gradient ≥50 mmHg = significant obstruction.", critical: true },
      ],
    },
    {
      module: "hocm", sectionId: "mitral", sortOrder: 3,
      sectionTitle: "Mitral Valve Assessment",
      probeNote: "PLAX, A4C, A2C — colour Doppler and spectral Doppler",
      items: [
        { id: "hocm_mr_mechanism", label: "MR mechanism (SAM vs. intrinsic MV disease)", detail: "SAM-related MR: posterior jet, mid-to-late systolic. Intrinsic MV disease: central or anterior jet, holosystolic.", critical: true },
        { id: "hocm_mr_severity", label: "MR severity (colour Doppler, PISA, vena contracta)", detail: "Significant MR (grade ≥2+) in HOCM often improves after septal reduction therapy.", critical: true },
        { id: "hocm_mv_morphology", label: "MV leaflet morphology (elongated anterior leaflet?)", detail: "Elongated anterior MV leaflet predisposes to SAM. Measure AML length in PLAX.", critical: false },
        { id: "hocm_mv_prolapse", label: "MV prolapse or flail leaflet", detail: "Intrinsic MV disease may coexist with HOCM. Assess leaflet tips in PLAX and A4C." },
      ],
    },
    {
      module: "hocm", sectionId: "diastology", sortOrder: 4,
      sectionTitle: "Diastolic Function",
      probeNote: "A4C — mitral inflow PW Doppler and tissue Doppler",
      items: [
        { id: "hocm_mv_inflow", label: "Mitral inflow PW Doppler (E, A, DT)", detail: "HOCM: often impaired relaxation (E/A <1, prolonged DT). Advanced: pseudonormal or restrictive pattern.", critical: true },
        { id: "hocm_tdi_e_prime", label: "Tissue Doppler e' (septal and lateral)", detail: "Septal e' often reduced in HOCM due to hypertrophy. E/e' ratio for LV filling pressure estimation.", critical: true },
        { id: "hocm_la_volume", label: "LA volume index", detail: "Normal: ≤34 mL/m². Dilated LA in HOCM = chronic diastolic dysfunction, AF risk.", critical: true },
        { id: "hocm_tr_gradient", label: "TR CW Doppler (RVSP estimation)", detail: "Pulmonary hypertension may coexist. RVSP = 4 × TR Vmax² + RAP." },
      ],
    },
    {
      module: "hocm", sectionId: "rvstudy", sortOrder: 5,
      sectionTitle: "RV Assessment",
      probeNote: "A4C, subcostal — RV size and function",
      items: [
        { id: "hocm_rv_size", label: "RV size (basal diameter, normal ≤41 mm)", detail: "RV involvement uncommon in HOCM but may occur in biventricular HCM.", critical: false },
        { id: "hocm_rv_wall", label: "RV free wall thickness (normal ≤5 mm)", detail: "RV hypertrophy >5 mm = biventricular HCM or RV outflow obstruction.", critical: false },
        { id: "hocm_tapse", label: "TAPSE (normal ≥17 mm)", detail: "RV systolic dysfunction uncommon in early HOCM. TAPSE <17 mm = RV dysfunction.", critical: false },
        { id: "hocm_rvot_gradient", label: "RVOT gradient (CW Doppler)", detail: "RVOT obstruction may occur in biventricular HCM. Assess RVOT PW and CW Doppler.", critical: false },
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
    {
      module: "uea", sectionId: "psax_mv", sortOrder: 4,
      sectionTitle: "Parasternal Short Axis (PSAX) — Mitral Level",
      probeNote: "Parasternal window | Rotate 90° clockwise from PLAX | Low MI contrast mode",
      items: [
        { id: "psax_mv_lvo", label: "LV opacification at mitral valve level", detail: "All 6 segments at mitral level should opacify uniformly." },
        { id: "psax_mv_fish", label: "Mitral valve fish-mouth view with contrast", detail: "Contrast helps delineate MV leaflet tips and subvalvular apparatus.", critical: true },
        { id: "psax_mv_wma", label: "Regional wall motion at MV level", detail: "Anteroseptal, anterior, lateral, posterior, inferior, inferoseptal segments." },
      ],
    },
    {
      module: "uea", sectionId: "psax_pm", sortOrder: 5,
      sectionTitle: "Parasternal Short Axis (PSAX) — Mid-Papillary Level",
      probeNote: "Parasternal window | Tilt caudal from PSAX-MV | Low MI contrast mode",
      items: [
        { id: "psax_pap_lvo", label: "LV opacification at mid-papillary level", detail: "Critical level for myocardial perfusion imaging — 6 segments assessed.", critical: true },
        { id: "psax_pap_replenishment", label: "Contrast replenishment pattern (perfusion)", detail: "Delayed replenishment = ischaemia or scar. Absent replenishment = infarct.", critical: true },
        { id: "psax_pap_dsign", label: "D-sign assessment", detail: "Septal flattening with contrast enhancement aids RV pressure/volume overload assessment." },
      ],
    },
    {
      module: "uea", sectionId: "psax_apex", sortOrder: 6,
      sectionTitle: "Parasternal Short Axis (PSAX) — Apical Level",
      probeNote: "Parasternal window | Tilt caudal from PSAX-PM | Low MI contrast mode",
      items: [
        { id: "psax_apex_lvo", label: "LV opacification at apical level", detail: "Apical segments often most difficult to visualise — contrast most beneficial here.", critical: true },
        { id: "psax_apex_wma", label: "Apical wall motion assessment", detail: "Symmetric apical wall motion. Apical akinesis = LAD territory infarct." },
      ],
    },
    {
      module: "uea", sectionId: "subcostal", sortOrder: 7,
      sectionTitle: "Subcostal 4-Chamber",
      probeNote: "Subcostal window | Phased-array probe | Alternative when apical window poor",
      items: [
        { id: "sub_lvo", label: "LV opacification via subcostal window", detail: "Useful when apical window is suboptimal. Contrast fills LV from subcostal approach.", critical: true },
        { id: "sub_ivc_contrast", label: "IVC and hepatic veins (right-heart contrast)", detail: "Agitated saline or right-heart contrast for PFO/ASD shunt detection.", critical: false },
      ],
    },
  ],
  // ─── ICE Navigatorr ────────────────────────────────────────────────────────────
  ice: [
    {
      module: "ice", sectionId: "ice_home_view", sortOrder: 0,
      sectionTitle: "Home View (Tricuspid / Right Heart)",
      probeNote: "ICE catheter | Right atrium | 0° rotation | Anterior/neutral position",
      items: [
        { id: "ice_hv_tv", label: "Tricuspid valve morphology and motion", detail: "Assess leaflet coaptation, mobility, and regurgitation with color Doppler.", critical: true },
        { id: "ice_hv_ra", label: "Right atrium size and thrombus exclusion", detail: "Assess RA for thrombus or masses before any transseptal procedure.", critical: true },
        { id: "ice_hv_rv", label: "RV size and function", detail: "Assess RV free wall motion and TAPSE. Dilated RV may indicate elevated RV pressures.", critical: false },
        { id: "ice_hv_ivc", label: "IVC entry and hepatic veins", detail: "Confirm catheter position; assess IVC diameter for RA pressure estimation.", critical: false },
      ],
    },
    {
      module: "ice", sectionId: "ice_aortic_view", sortOrder: 1,
      sectionTitle: "Aortic / LVOT View",
      probeNote: "ICE catheter | RA | Clockwise rotation from home view | Anterior tilt",
      items: [
        { id: "ice_av_aorta", label: "Aortic valve morphology and function", detail: "Assess leaflet number, mobility, and any regurgitation or stenosis.", critical: false },
        { id: "ice_av_lvot", label: "LVOT and proximal ascending aorta", detail: "Assess for LVOT obstruction or subaortic membrane.", critical: false },
        { id: "ice_av_la", label: "Left atrium and LAA ostium", detail: "Assess LA size and LAA ostium. Exclude thrombus before LAA occlusion procedures.", critical: true },
        { id: "ice_av_pv", label: "Pulmonary veins (left-sided)", detail: "Identify LSPV and LIPV ostia. Confirm pulmonary vein anatomy before AF ablation.", critical: false },
      ],
    },
    {
      module: "ice", sectionId: "ice_fossa_view", sortOrder: 2,
      sectionTitle: "Fossa Ovalis / Interatrial Septum View",
      probeNote: "ICE catheter | RA | Further clockwise rotation | Posterior tilt toward IAS",
      items: [
        { id: "ice_fo_fossa", label: "Fossa ovalis identification", detail: "Identify thin membrane of fossa ovalis. Confirm location before transseptal puncture.", critical: true },
        { id: "ice_fo_tenting", label: "Needle tenting confirmation", detail: "Visualise needle tenting the fossa. Confirm superior-posterior position for AF ablation; inferior-posterior for structural procedures.", critical: true },
        { id: "ice_fo_entry", label: "LA entry confirmation", detail: "Agitated saline or contrast injection confirms LA position after transseptal crossing.", critical: true },
        { id: "ice_fo_shunt", label: "Residual shunt / PFO assessment", detail: "Color Doppler across IAS after device deployment. Agitated saline for PFO closure confirmation.", critical: false },
      ],
    },
    {
      module: "ice", sectionId: "ice_mitral_view", sortOrder: 3,
      sectionTitle: "Mitral / Left Heart View",
      probeNote: "ICE catheter | RA or transseptal to LA | Posterior rotation | Leftward tilt",
      items: [
        { id: "ice_mv_morphology", label: "Mitral valve leaflet morphology", detail: "Assess A2/P2 coaptation gap, flail segments, and prolapse. Identify target segments for TEER.", critical: true },
        { id: "ice_mv_mr", label: "Mitral regurgitation — severity and jet direction", detail: "Color Doppler: assess MR severity, jet origin, and direction. Eccentric jets require biplane guidance.", critical: true },
        { id: "ice_mv_clip", label: "Clip positioning and leaflet insertion", detail: "Confirm clip arms perpendicular to coaptation line. Verify both leaflets captured before deployment.", critical: true },
        { id: "ice_mv_gradient", label: "Post-clip mitral gradient", detail: "PW Doppler: mean gradient <5 mmHg acceptable. >5 mmHg: consider iatrogenic MS.", critical: false },
      ],
    },
    {
      module: "ice", sectionId: "ice_laa_view", sortOrder: 4,
      sectionTitle: "LAA Occlusion View",
      probeNote: "ICE catheter | RA or LA | Posterior/leftward rotation | Caudal tilt",
      items: [
        { id: "ice_laa_thrombus", label: "LAA thrombus exclusion (all lobes)", detail: "Assess all LAA lobes. If thrombus present, abort procedure. Slow-flow/spontaneous echo contrast is not thrombus.", critical: true },
        { id: "ice_laa_ostium", label: "LAA ostium diameter measurement", detail: "Measure at 0°, 45°, 90°, 135° equivalent planes. Use largest diameter for device sizing.", critical: true },
        { id: "ice_laa_depth", label: "Landing zone depth", detail: "Depth ≥10 mm from ostium to first lobe bifurcation required for device stability.", critical: true },
        { id: "ice_laa_pass", label: "PASS criteria confirmation", detail: "Position (at/just distal to ostium), Anchor (tug test), Size (80–92% compressed), Seal (color Doppler <5 mm leak).", critical: true },
      ],
    },
    {
      module: "ice", sectionId: "ice_pericardial_view", sortOrder: 5,
      sectionTitle: "Pericardial Monitoring View",
      probeNote: "ICE catheter | RV | Posterior withdrawal | Continuous monitoring during high-risk steps",
      items: [
        { id: "ice_peri_baseline", label: "Baseline pericardial assessment", detail: "Confirm no pericardial effusion at procedure start. Document baseline for comparison.", critical: true },
        { id: "ice_peri_monitor", label: "Continuous effusion monitoring", detail: "Monitor pericardial space during transseptal, device deployment, and energy delivery. Any new echo-free space warrants immediate alert.", critical: true },
        { id: "ice_peri_tamponade", label: "Tamponade signs", detail: "RA/RV diastolic collapse, IVC plethora, respiratory variation in mitral/tricuspid inflow. Immediate pericardiocentesis if haemodynamic compromise.", critical: true },
      ],
    },
  ],
  // ─── Diastology Navigator ─────────────────────────────────────────────────────
  diastology: [
    {
      module: "diastology", sectionId: "diast_tdi", sortOrder: 0,
      sectionTitle: "Tissue Doppler Imaging (TDI) — e' Velocity",
      probeNote: "Apical 4-chamber | Phased-array probe | Septal and lateral mitral annulus",
      items: [
        { id: "diast_tdi_septal", label: "Septal e' velocity (PW TDI)", detail: "Sample volume at septal mitral annulus. Normal septal e' ≥7 cm/s. Reduced e' = impaired relaxation.", critical: true },
        { id: "diast_tdi_lateral", label: "Lateral e' velocity (PW TDI)", detail: "Sample volume at lateral mitral annulus. Normal lateral e' ≥10 cm/s.", critical: true },
        { id: "diast_tdi_ratio", label: "E/e' ratio calculation", detail: "Use average e' (septal + lateral / 2). E/e' >14 = elevated LV filling pressures (Step 2 criterion per ASE 2025).", critical: true },
        { id: "diast_tdi_s_wave", label: "Systolic s' velocity", detail: "Systolic annular velocity. s' <5 cm/s suggests reduced LV systolic function.", critical: false },
      ],
    },
    {
      module: "diastology", sectionId: "diast_mitral_inflow", sortOrder: 1,
      sectionTitle: "Mitral Inflow — E/A Ratio & DT",
      probeNote: "Apical 4-chamber | PW Doppler | Sample volume at mitral leaflet tips at end-expiration",
      items: [
        { id: "diast_mi_e", label: "E wave velocity (early filling)", detail: "Peak E wave. Reduced E (<50 cm/s) with low e' = Grade I. Elevated E with high e' = Grade III.", critical: true },
        { id: "diast_mi_a", label: "A wave velocity (atrial contraction)", detail: "Peak A wave. E/A <0.8 = Grade I (impaired relaxation). E/A >2 = Grade III (restrictive).", critical: true },
        { id: "diast_mi_dt", label: "Deceleration time (DT)", detail: "DT <160 ms = restrictive pattern (Grade III). DT >200 ms = impaired relaxation (Grade I).", critical: true },
        { id: "diast_mi_ivrt", label: "IVRT (isovolumic relaxation time)", detail: "IVRT <60 ms = elevated filling pressures. IVRT >100 ms = impaired relaxation.", critical: false },
      ],
    },
    {
      module: "diastology", sectionId: "diast_tr_jet", sortOrder: 2,
      sectionTitle: "TR Jet — Peak Velocity & PASP",
      probeNote: "Apical 4-chamber or parasternal RV inflow | CW Doppler | Optimize jet alignment",
      items: [
        { id: "diast_tr_velocity", label: "TR peak velocity (CW Doppler)", detail: "TR velocity >2.8 m/s = elevated PASP = Step 2 criterion (ASE 2025). Try multiple windows for highest velocity.", critical: true },
        { id: "diast_tr_pasp", label: "PASP estimation (4v² + RAP)", detail: "PASP = 4 × (TR velocity)² + estimated RAP. RAP: 3 mmHg (IVC <2.1 cm, >50% collapse), 8 mmHg (intermediate), 15 mmHg (dilated, non-collapsing).", critical: false },
        { id: "diast_tr_contrast", label: "Agitated saline contrast if TR not visible", detail: "Right-heart contrast enhances TR jet for velocity measurement when TR is not well visualised.", critical: false },
      ],
    },
    {
      module: "diastology", sectionId: "diast_lars", sortOrder: 3,
      sectionTitle: "LA Reservoir Strain (LARS)",
      probeNote: "Dedicated apical 4C and 2C (LA-focused) | 50–70 fps | R-R gating | 3–5 cycles per view",
      items: [
        { id: "diast_lars_4c", label: "LA strain — apical 4-chamber (dedicated LA-focused view)", detail: "Ensure LA is maximally visualised. Avoid foreshortening. Track LA wall throughout cardiac cycle.", critical: true },
        { id: "diast_lars_2c", label: "LA strain — apical 2-chamber (dedicated LA-focused view)", detail: "Acquire at similar heart rate to 4C view. Average LARS from both views.", critical: true },
        { id: "diast_lars_threshold", label: "LARS threshold interpretation", detail: "LARS <18% = elevated LV filling pressures (Step 2 criterion per ASE 2025). Do NOT use in AF, significant MR, or heart transplant.", critical: true },
      ],
    },
    {
      module: "diastology", sectionId: "diast_lavi", sortOrder: 4,
      sectionTitle: "Left Atrial Volume Index (LAVI)",
      probeNote: "Apical 4C and 2C at end-systole (before MV opens) | Biplane disc summation method",
      items: [
        { id: "diast_lavi_measure", label: "LA volume — biplane disc summation (A4C + A2C)", detail: "Trace LA at end-systole (just before MV opens). Exclude pulmonary veins and LAA from tracing.", critical: true },
        { id: "diast_lavi_index", label: "Index to BSA", detail: "LAVI = LA volume / BSA. Normal <34 mL/m². LAVI >34 mL/m² = Step 2 criterion (ASE 2025).", critical: true },
        { id: "diast_lavi_pitfall", label: "Exclude confounders", detail: "AF, mitral stenosis, and significant MR cause LA enlargement independent of diastolic dysfunction. Do not use LAVI as a diastolic marker in these conditions.", critical: false },
      ],
    },
    {
      module: "diastology", sectionId: "diast_pv_flow", sortOrder: 5,
      sectionTitle: "Pulmonary Venous Flow",
      probeNote: "Apical 4-chamber | PW Doppler | Sample volume 1–2 cm into LSPV or RSPV",
      items: [
        { id: "diast_pv_s", label: "Systolic (S) wave", detail: "S wave dominant = normal or Grade I. S < D = elevated filling pressures.", critical: false },
        { id: "diast_pv_d", label: "Diastolic (D) wave", detail: "D wave dominant with E/A >1 = pseudonormal or restrictive pattern.", critical: false },
        { id: "diast_pv_ar", label: "Atrial reversal (Ar) wave", detail: "Ar >35 cm/s or Ar – A duration >30 ms = elevated LVEDP.", critical: false },
      ],
    },
    {
      module: "diastology", sectionId: "diast_algorithm", sortOrder: 6,
      sectionTitle: "ASE 2025 Two-Step Grading Algorithm",
      probeNote: "Integrate all measurements | Apply ASE 2025 algorithm (not 2016 Nagueh guidelines)",
      items: [
        { id: "diast_algo_step1", label: "Step 1: Is e' reduced? (Impaired relaxation)", detail: "Septal e' <7 cm/s OR lateral e' <10 cm/s = impaired relaxation present. Proceed to Step 2.", critical: true },
        { id: "diast_algo_step2", label: "Step 2: Count elevated LAP markers", detail: "Count: E/e' >14, TR velocity >2.8 m/s, LARS <18%, LAVI >34 mL/m². 0 of 4 = Grade I. ≥2 of 4 = Grade III. 1 of 4 = Grade II (indeterminate).", critical: true },
        { id: "diast_algo_grade", label: "Assign diastolic dysfunction grade", detail: "Grade I: impaired relaxation, normal LAP. Grade II: impaired relaxation, elevated LAP. Grade III: restrictive filling, elevated LAP.", critical: true },
        { id: "diast_algo_af", label: "AF / special populations", detail: "In AF: use E/e' and TR velocity only (LARS and LAVI unreliable). See DiastologySpecialPopulations page for HFpEF, HCM, constrictive pericarditis.", critical: false },
      ],
    },
  ],
  // ─── Pulmonary HTN Navigator ──────────────────────────────────────────────────
  pulm_htn: [
    {
      module: "pulm_htn", sectionId: "ph_tr_velocity", sortOrder: 0,
      sectionTitle: "TR Jet Velocity & PASP",
      probeNote: "Apical 4-chamber, parasternal RV inflow, subcostal | CW Doppler | Multiple windows",
      items: [
        { id: "ph_tr_cw", label: "TR peak velocity (CW Doppler) — multiple windows", detail: "Use apical 4C, parasternal RV inflow, and subcostal views. Report highest velocity obtained.", critical: true },
        { id: "ph_tr_pasp", label: "PASP = 4v² + RAP", detail: "TR velocity >2.8 m/s = intermediate probability. >3.4 m/s = high probability of PH (ESC/ERS 2022). Add estimated RAP (3, 8, or 15 mmHg).", critical: true },
        { id: "ph_tr_contrast", label: "Agitated saline if TR not visible", detail: "Right-heart contrast enhances TR jet. Mandatory if TR not well seen on colour Doppler.", critical: false },
      ],
    },
    {
      module: "pulm_htn", sectionId: "ph_rv_size", sortOrder: 1,
      sectionTitle: "RV Size & Function",
      probeNote: "Apical 4-chamber RV-focused view | Do NOT use standard LV-focused view for RV measurements",
      items: [
        { id: "ph_rv_basal", label: "RV basal diameter (RV-focused A4C)", detail: "Normal ≤41 mm. >41 mm = dilated RV. Measure at widest basal point perpendicular to RV long axis.", critical: true },
        { id: "ph_rv_mid", label: "RV mid-cavity diameter", detail: "Normal ≤35 mm. Measure at mid-level of RV.", critical: false },
        { id: "ph_rv_tapse", label: "TAPSE (tricuspid annular plane systolic excursion)", detail: "M-mode at lateral tricuspid annulus. TAPSE <17 mm = reduced RV systolic function.", critical: true },
        { id: "ph_rv_fac", label: "RV fractional area change (FAC)", detail: "FAC = (RV end-diastolic area − RV end-systolic area) / RV end-diastolic area × 100. FAC <35% = reduced RV function.", critical: true },
        { id: "ph_rv_s_wave", label: "RV free wall s' (TDI)", detail: "Lateral tricuspid annulus TDI. s' <9.5 cm/s = reduced RV systolic function.", critical: false },
      ],
    },
    {
      module: "pulm_htn", sectionId: "ph_rv_morphology", sortOrder: 2,
      sectionTitle: "RV Morphology & Septal Motion",
      probeNote: "Parasternal short-axis (mid-papillary level) | Apical 4-chamber",
      items: [
        { id: "ph_rv_d_sign", label: "D-sign (septal flattening) — PSAX", detail: "Flattened or D-shaped LV in PSAX at mid-papillary level = RV pressure or volume overload. Systolic D-sign = pressure overload.", critical: true },
        { id: "ph_rv_ecc", label: "LV eccentricity index", detail: "LV eccentricity index >1.1 in systole = RV pressure overload. Measure LV anterior-posterior / septal-lateral diameters in PSAX.", critical: false },
        { id: "ph_rv_ra", label: "RA size", detail: "RA area >18 cm² = dilated RA. Dilated RA with elevated TR velocity = high probability of PH.", critical: false },
        { id: "ph_rv_pericardial", label: "Pericardial effusion", detail: "Pericardial effusion in PH indicates severe disease and poor prognosis.", critical: false },
      ],
    },
    {
      module: "pulm_htn", sectionId: "ph_ivc", sortOrder: 3,
      sectionTitle: "IVC & RAP Estimation",
      probeNote: "Subcostal | Measure 1–2 cm from RA junction | Sniff test for collapsibility",
      items: [
        { id: "ph_ivc_diameter", label: "IVC diameter at end-expiration", detail: "Normal <2.1 cm. Dilated IVC (>2.1 cm) with <50% collapse = RAP 15 mmHg.", critical: true },
        { id: "ph_ivc_collapse", label: "IVC collapsibility (sniff test)", detail: ">50% collapse with sniff = RAP 3 mmHg. <50% collapse = RAP 8–15 mmHg.", critical: true },
        { id: "ph_ivc_rap", label: "Estimated RAP for PASP calculation", detail: "RAP 3 mmHg: IVC <2.1 cm, >50% collapse. RAP 8 mmHg: intermediate. RAP 15 mmHg: IVC >2.1 cm, <50% collapse.", critical: false },
      ],
    },
    {
      module: "pulm_htn", sectionId: "ph_pa_pressure", sortOrder: 4,
      sectionTitle: "PA Pressure — Additional Markers",
      probeNote: "Parasternal short-axis | RVOT PW Doppler | Pulmonary valve CW Doppler",
      items: [
        { id: "ph_pa_rvot_at", label: "RVOT acceleration time (AT)", detail: "PW Doppler in RVOT. AT <100 ms = elevated mPAP. AT <70 ms with mid-systolic notch = severe PH.", critical: true },
        { id: "ph_pa_pi", label: "Pulmonary regurgitation — end-diastolic velocity", detail: "CW Doppler: PR end-diastolic velocity. mPAP = 4 × (PR peak velocity)² + RAP.", critical: false },
        { id: "ph_pa_notch", label: "Mid-systolic notch in RVOT flow", detail: "Mid-systolic notch (flying W sign) in RVOT PW Doppler = severe PH with wave reflection.", critical: false },
      ],
    },
    {
      module: "pulm_htn", sectionId: "ph_probability", sortOrder: 5,
      sectionTitle: "PH Probability Assessment (ASE 2025 / ESC 2022)",
      probeNote: "Integrate all findings | Classify as low, intermediate, or high probability",
      items: [
        { id: "ph_prob_tr", label: "TR velocity classification", detail: "≤2.8 m/s + no other signs = low probability. ≤2.8 m/s + other signs, OR 2.9–3.4 m/s = intermediate. >3.4 m/s = high probability.", critical: true },
        { id: "ph_prob_signs", label: "Additional PH signs (A/B/C categories)", detail: "Category A: RV/RA enlargement, D-sign. Category B: RVOT AT <105 ms, PR end-diastolic velocity >2.2 m/s. Category C: TAPSE/PASP <0.55 mm/mmHg. ≥2 categories = high probability.", critical: true },
        { id: "ph_prob_referral", label: "Referral threshold", detail: "Intermediate or high probability: refer to PH specialist centre for right heart catheterisation. Low probability with clinical suspicion: repeat echo in 6–12 months.", critical: false },
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
  { id: "ice", label: "ICE Navigator" },
  { id: "diastology", label: "Diastology Navigator" },
  { id: "pulm_htn", label: "Pulmonary HTN Navigator" },
];

const BRAND = "#189aa1";

// ─── Sortable Checklist Item ─────────────────────────────────────────────────
function SortableChecklistItem({
  item,
  idx,
  editingItemIdx,
  setEditingItemIdx,
  updateItem,
  deleteItem,
}: {
  item: ChecklistItem;
  idx: number;
  editingItemIdx: number | null;
  setEditingItemIdx: (idx: number | null) => void;
  updateItem: (idx: number, patch: Partial<ChecklistItem>) => void;
  deleteItem: (idx: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isEditing = editingItemIdx === idx;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5"
        title="Drag to reorder"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      {isEditing ? (
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
          onClick={() => setEditingItemIdx(isEditing ? null : idx)}
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
  );
}

// ─── Sortable Section ─────────────────────────────────────────────────────────
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
  const itemSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingProbe, setEditingProbe] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<ChecklistItem>({ id: "", label: "", detail: "", critical: false });;

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
          <DndContext
            sensors={itemSensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const oldIdx = section.items.findIndex((it) => it.id === active.id);
              const newIdx = section.items.findIndex((it) => it.id === over.id);
              const reordered = arrayMove(section.items, oldIdx, newIdx);
              onUpdate({ ...section, items: reordered, dirty: true });
            }}
          >
            <SortableContext
              items={section.items.map((it) => it.id)}
              strategy={verticalListSortingStrategy}
            >
          {section.items.map((item, idx) => (
            <SortableChecklistItem
              key={item.id}
              item={item}
              idx={idx}
              editingItemIdx={editingItemIdx}
              setEditingItemIdx={setEditingItemIdx}
              updateItem={updateItem}
              deleteItem={deleteItem}
            />
          ))}
            </SortableContext>
          </DndContext>

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
    // Upsert ALL sections with their new sortOrder so reorder always persists
    // (sections with id=0 are static defaults that haven't been saved yet — upsert creates them)
    try {
      await Promise.all(
        reordered.map((s) =>
          upsertMutation.mutateAsync({
            module: selectedModule,
            sectionId: s.sectionId,
            sectionTitle: s.sectionTitle,
            probeNote: s.probeNote,
            items: s.items,
            sortOrder: s.sortOrder,
          })
        )
      );
      toast.success("Section order saved");
    } catch {
      toast.error("Failed to save order");
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
