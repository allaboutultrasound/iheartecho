/*
  iHeartEcho — TEE/ICE ScanCoach™
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
  Covers: ME, TG, UE views for TEE; ICE views for structural procedures
*/
import { useState, useRef } from "react";
import { Link } from "wouter";
import { ChevronRight, Eye, Info, AlertTriangle, Microscope, Activity } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TEEView {
  id: string;
  name: string;
  abbr: string;
  section: "ME" | "TG" | "UE" | "ICE";
  angle: string;          // probe angle range
  depth: string;          // insertion depth
  color: string;
  description: string;
  probeManeuver: string;
  anatomy: string[];
  doppler: string[];
  clinicalUse: string[];
  normalFindings: string[];
  pitfalls: string[];
  imagePlaceholder: string; // descriptive text for placeholder
}

// ─── TEE View Data ─────────────────────────────────────────────────────────────
const teeViews: TEEView[] = [
  // ── Midesophageal (ME) ──
  {
    id: "me-4c",
    name: "ME Four-Chamber",
    abbr: "ME 4C",
    section: "ME",
    angle: "0–10°",
    depth: "30–35 cm",
    color: "#189aa1",
    description: "The standard starting view. Displays all four chambers simultaneously with the LV apex at the top of the image.",
    probeManeuver: "Advance probe to mid-esophagus; neutral flexion; rotate to 0–10°. Adjust anteflexion to bring apex into view.",
    anatomy: ["LV", "RV", "LA", "RA", "MV", "TV", "IAS", "IVS"],
    doppler: ["MV inflow (E/A, E/e')", "TV inflow", "Color over MV/TV for regurgitation", "PW at MV tips for diastolic function"],
    clinicalUse: ["Global LV/RV function", "Mitral and tricuspid valve assessment", "ASD/PFO screening (color Doppler)", "Pericardial effusion"],
    normalFindings: ["LV EF ≥55%", "No MV/TV regurgitation", "Intact IAS", "Normal RV size"],
    pitfalls: ["LV apex may be foreshortened — use deep transgastric view for true apex", "Gain too high obscures valve leaflets"],
    imagePlaceholder: "ME 4C view — all four chambers, MV and TV visible, LV apex at top",
  },
  {
    id: "me-2c",
    name: "ME Two-Chamber",
    abbr: "ME 2C",
    section: "ME",
    angle: "80–100°",
    depth: "30–35 cm",
    color: "#189aa1",
    description: "Shows LV and LA only. Best view for LV anterior and inferior wall assessment and LAA evaluation.",
    probeManeuver: "From ME 4C, rotate multiplane angle to 80–100°. Slight withdrawal may improve LAA visualisation.",
    anatomy: ["LV (anterior + inferior walls)", "LA", "LAA", "MV (anterior + posterior leaflets)"],
    doppler: ["MV color Doppler", "LAA PW Doppler (LAA emptying velocity)", "LV anterior/inferior wall motion"],
    clinicalUse: ["LV wall motion (anterior, inferior)", "LAA thrombus exclusion", "MV regurgitation jet direction", "Mitral annular calcification"],
    normalFindings: ["LAA emptying velocity >40 cm/s (sinus rhythm)", "No LAA thrombus", "Normal anterior/inferior wall motion"],
    pitfalls: ["LAA pectinate muscles can mimic thrombus — use agitated saline or 3D", "Rotate slowly from ME 4C to avoid losing orientation"],
    imagePlaceholder: "ME 2C view — LV and LA, LAA visible at left, anterior and inferior walls",
  },
  {
    id: "me-lac",
    name: "ME Long-Axis",
    abbr: "ME LAX",
    section: "ME",
    angle: "120–160°",
    depth: "30–35 cm",
    color: "#189aa1",
    description: "Equivalent to the parasternal long-axis TTE view. Best for LVOT, aortic valve, and proximal ascending aorta.",
    probeManeuver: "From ME 2C, continue rotating to 120–160°. Slight retroflexion may improve LVOT/AV alignment.",
    anatomy: ["LV (anterior septum + posterior wall)", "LVOT", "AV (NCC + LCC)", "Ascending aorta", "MV (AML + PML)"],
    doppler: ["LVOT PW (VTI for SV)", "AV CW (peak gradient, mean gradient, AVA)", "MV color Doppler (AMVL SAM in HOCM)", "Aortic root color (AR jet)"],
    clinicalUse: ["Aortic stenosis severity (LVOT VTI + AV CW)", "Aortic regurgitation (AR jet width/LVOT)", "LVOT obstruction (HOCM, SAM)", "Aortic root dilation"],
    normalFindings: ["LVOT diameter 1.8–2.2 cm", "AV peak velocity <2.0 m/s", "No AR", "Aortic root ≤4.0 cm"],
    pitfalls: ["LVOT angle to aorta must be <20° for accurate CW gradient", "NCC vs LCC orientation: NCC is posterior in this view"],
    imagePlaceholder: "ME LAX view — LVOT, aortic valve, proximal ascending aorta, MV in long axis",
  },
  {
    id: "me-asc-ao",
    name: "ME Ascending Aorta SAX",
    abbr: "ME Asc Ao SAX",
    section: "ME",
    angle: "0–30°",
    depth: "25–30 cm",
    color: "#189aa1",
    description: "Short-axis view of the ascending aorta. Used to assess aortic root, PA, and pulmonic valve.",
    probeManeuver: "Withdraw slightly from ME 4C to 25–30 cm; rotate to 0–30°. The circular aorta appears with PA wrapping around it.",
    anatomy: ["Ascending aorta (SAX)", "Main PA", "RPA", "Pulmonic valve", "RVOT"],
    doppler: ["PV CW (pulmonic stenosis)", "PA color (PR, PA dilation)", "RVOT PW (RVOT obstruction)"],
    clinicalUse: ["Aortic root diameter", "Pulmonic valve stenosis/regurgitation", "PA dilation (pulmonary HTN)", "RVOT assessment"],
    normalFindings: ["Aortic root ≤4.0 cm", "PV peak velocity <1.5 m/s", "No PR", "Normal PA size"],
    pitfalls: ["Ascending aorta may be partially obscured by trachea/bronchus — rotate and adjust depth", "Do not confuse PA with aorta — PA wraps anterior to aorta"],
    imagePlaceholder: "ME Asc Ao SAX — circular aorta with PA wrapping, pulmonic valve visible",
  },
  {
    id: "me-av-sax",
    name: "ME AV Short-Axis",
    abbr: "ME AV SAX",
    section: "ME",
    angle: "30–60°",
    depth: "30–35 cm",
    color: "#189aa1",
    description: "En-face view of the aortic valve. Allows direct planimetry of AVA and assessment of all three cusps.",
    probeManeuver: "From ME Asc Ao SAX, advance slightly and rotate to 30–60°. The three cusps (NCC, LCC, RCC) appear as a 'Mercedes-Benz' sign.",
    anatomy: ["AV (NCC, LCC, RCC)", "LA", "RA", "IAS", "TV"],
    doppler: ["Color Doppler over AV (stenotic jet, AR)", "IAS color (ASD/PFO)"],
    clinicalUse: ["AV planimetry (AVA direct measurement)", "Bicuspid AV identification", "ASD/PFO screening", "AV vegetation assessment"],
    normalFindings: ["Three equal cusps opening symmetrically", "AVA ≥2.0 cm²", "No calcification", "Intact IAS"],
    pitfalls: ["Calcification causes acoustic shadowing — planimetry unreliable in severe calcification", "Bicuspid AV: two cusps with raphe — do not confuse with tricuspid"],
    imagePlaceholder: "ME AV SAX — three aortic cusps in 'Mercedes-Benz' pattern, LA and RA visible",
  },
  {
    id: "me-bic",
    name: "ME Bicaval",
    abbr: "ME Bicaval",
    section: "ME",
    angle: "80–110°",
    depth: "25–30 cm",
    color: "#189aa1",
    description: "Shows both caval veins entering the RA. Critical for ASD/PFO assessment and catheter/device guidance.",
    probeManeuver: "Withdraw to 25–30 cm; rotate to 80–110°; slight rightward rotation of probe body. SVC appears at top, IVC at bottom.",
    anatomy: ["SVC", "IVC", "RA", "IAS", "LA", "Eustachian valve"],
    doppler: ["Color over IAS (ASD/PFO jet)", "PW in SVC/IVC (hepatic vein flow)", "Bubble study (agitated saline) for PFO"],
    clinicalUse: ["ASD sizing and location (sinus venosus vs secundum)", "PFO detection (bubble study)", "WATCHMAN/ASD device guidance", "Central line/IABP position"],
    normalFindings: ["Intact IAS", "No shunt on color Doppler", "Normal caval flow"],
    pitfalls: ["Sinus venosus ASD is near SVC — do not miss by focusing only on fossa ovalis", "Eustachian valve can be mistaken for IAS pathology"],
    imagePlaceholder: "ME Bicaval — SVC (top) and IVC (bottom) entering RA, IAS in centre",
  },
  {
    id: "me-mv-comm",
    name: "ME Mitral Commissural",
    abbr: "ME MV Comm",
    section: "ME",
    angle: "60–70°",
    depth: "30–35 cm",
    color: "#189aa1",
    description: "Displays all three scallops of the posterior mitral leaflet (P1, P2, P3) and the corresponding anterior leaflet segments.",
    probeManeuver: "From ME 4C, rotate to 60–70°. The MV appears in a 'fish-mouth' orientation showing both commissures.",
    anatomy: ["MV (A1/P1 at top, A2/P2 centre, A3/P3 at bottom)", "LA", "LV"],
    doppler: ["Color Doppler over MV (jet origin, direction)", "CW across MV (MR peak velocity, MVA pressure half-time)"],
    clinicalUse: ["MR jet origin (which scallop)", "Mitral stenosis commissural fusion", "MitraClip procedure guidance", "Prolapse/flail segment localisation"],
    normalFindings: ["All three scallops coapting normally", "No MR", "MVA ≥2.0 cm²"],
    pitfalls: ["Eccentric MR jets may be underestimated — always use multiple views", "P2 prolapse is most common — check all scallops systematically"],
    imagePlaceholder: "ME MV Commissural — 'fish-mouth' MV with P1/A1, P2/A2, P3/A3 visible",
  },
  // ── Transgastric (TG) ──
  {
    id: "tg-mid-sax",
    name: "TG Mid-Papillary SAX",
    abbr: "TG Mid SAX",
    section: "TG",
    angle: "0–20°",
    depth: "40–45 cm",
    color: "#0e7490",
    description: "Short-axis view of the LV at mid-papillary level. Gold standard for intraoperative LV function monitoring.",
    probeManeuver: "Advance probe into stomach (40–45 cm); anteflex to bring LV into view; rotate to 0–20°. Both papillary muscles should be visible.",
    anatomy: ["LV (all six wall segments at mid level)", "Anterolateral PM", "Posteromedial PM", "RV (crescent shape)"],
    doppler: ["Color Doppler over LV cavity (MR through MV)", "Not primary Doppler view — use for wall motion"],
    clinicalUse: ["Intraoperative LV monitoring (wall motion changes = ischaemia)", "Preload assessment (LV cavity size)", "Systolic function (EF estimation)", "Papillary muscle rupture"],
    normalFindings: ["Symmetric wall motion all segments", "Normal LV cavity size", "Both PMs visible and symmetric"],
    pitfalls: ["Off-axis view can make normal wall appear hypokinetic — ensure circular LV cross-section", "RV volume overload causes IVS flattening — do not misinterpret as ischaemia"],
    imagePlaceholder: "TG Mid SAX — circular LV with both papillary muscles, RV crescent at right",
  },
  {
    id: "tg-2c",
    name: "TG Two-Chamber",
    abbr: "TG 2C",
    section: "TG",
    angle: "80–100°",
    depth: "40–45 cm",
    color: "#0e7490",
    description: "Long-axis view of the LV from the transgastric position. Shows true LV apex — critical for apical pathology.",
    probeManeuver: "From TG Mid SAX, rotate to 80–100°. The LV apex should be at the top. Adjust anteflexion to maximise LV length.",
    anatomy: ["LV (true apex, anterior + inferior walls)", "LA", "MV"],
    doppler: ["MV inflow PW", "LV apex color (apical thrombus, hypertrabeculation)"],
    clinicalUse: ["True LV apex assessment (apical HCM, thrombus)", "LV length measurement", "Inferior wall motion (RCA territory)", "Anterior wall motion (LAD territory)"],
    normalFindings: ["Smooth LV apex", "Normal anterior and inferior wall motion", "No apical thrombus"],
    pitfalls: ["Foreshortening is common — ensure probe is fully advanced and antiflex maximally", "Apical trabeculations can mimic thrombus — use contrast if uncertain"],
    imagePlaceholder: "TG 2C — LV in long axis from stomach, true apex at top, MV at bottom",
  },
  {
    id: "tg-deep",
    name: "Deep TG Long-Axis",
    abbr: "Deep TG LAX",
    section: "TG",
    angle: "0–20°",
    depth: "45–50 cm",
    color: "#0e7490",
    description: "The only TEE view that allows CW Doppler alignment with LVOT/AV flow. Essential for accurate aortic valve gradients.",
    probeManeuver: "Advance probe fully into stomach (45–50 cm); anteflex maximally; rotate to 0–20°. The LVOT and AV should align with the Doppler beam.",
    anatomy: ["LV apex", "LVOT", "AV", "Proximal ascending aorta"],
    doppler: ["LVOT PW (VTI for SV, LVOT obstruction)", "AV CW (peak gradient, mean gradient — most accurate TEE view)", "Color over LVOT/AV (SAM, AR)"],
    clinicalUse: ["Aortic stenosis gradient (most accurate TEE position)", "LVOT obstruction (HOCM, SAM)", "Post-TAVR gradient assessment", "SV and CO calculation"],
    normalFindings: ["LVOT VTI 18–22 cm", "AV peak velocity <2.0 m/s", "No LVOT obstruction"],
    pitfalls: ["Requires deep probe insertion — may cause patient discomfort; ensure adequate sedation", "Beam-flow angle must be <20° for accurate gradients — adjust probe rotation"],
    imagePlaceholder: "Deep TG LAX — LV apex at bottom, LVOT and AV aligned with Doppler beam",
  },
  // ── Upper Esophageal (UE) ──
  {
    id: "ue-ao-arch",
    name: "UE Aortic Arch LAX",
    abbr: "UE Arch LAX",
    section: "UE",
    angle: "0°",
    depth: "20–25 cm",
    color: "#6366f1",
    description: "Long-axis view of the aortic arch. Used to assess arch atheroma, dissection, and coarctation.",
    probeManeuver: "Withdraw probe to 20–25 cm; rotate to 0°; slight leftward rotation. The arch appears as a curved structure with left subclavian origin.",
    anatomy: ["Aortic arch", "Left subclavian artery origin", "Descending aorta transition", "Left PA (posterior)"],
    doppler: ["Color Doppler over arch (dissection flap, coarctation jet)", "CW across coarctation (gradient)"],
    clinicalUse: ["Aortic arch atheroma grading (I–V)", "Type A dissection — arch involvement", "Coarctation assessment", "Cannulation site selection (cardiac surgery)"],
    normalFindings: ["Smooth intima", "No atheroma", "No dissection flap", "Normal arch diameter"],
    pitfalls: ["Left main bronchus causes acoustic dropout — rotate probe to avoid", "Atheroma grading: Grade IV (mobile) and V (ulcerated) are highest embolic risk"],
    imagePlaceholder: "UE Arch LAX — curved aortic arch, left subclavian origin, smooth intima",
  },
  {
    id: "ue-ao-arch-sax",
    name: "UE Aortic Arch SAX",
    abbr: "UE Arch SAX",
    section: "UE",
    angle: "90°",
    depth: "20–25 cm",
    color: "#6366f1",
    description: "Short-axis view of the aortic arch. Shows the main pulmonary artery and left pulmonary artery in cross-section.",
    probeManeuver: "From UE Arch LAX, rotate to 90°. The circular arch cross-section appears with PA anterior.",
    anatomy: ["Aortic arch (SAX)", "Main PA", "Left PA", "Left subclavian artery"],
    doppler: ["PA color Doppler (PA dilation, PE)", "PW in PA (pulmonary flow)"],
    clinicalUse: ["PA dilation assessment", "Pulmonary embolism (central PE in main PA)", "Arch diameter measurement", "Pulmonary HTN screening"],
    normalFindings: ["Main PA diameter ≤2.5 cm", "No intraluminal filling defect", "Normal arch diameter"],
    pitfalls: ["Central PE may be visible as echogenic filling defect — confirm with CT-PA", "PA and aorta can be confused — PA is anterior and has thinner walls"],
    imagePlaceholder: "UE Arch SAX — circular arch cross-section, main PA anterior with left PA bifurcation",
  },
  // ── ICE Views ──
  {
    id: "ice-home",
    name: "ICE Home View",
    abbr: "ICE Home",
    section: "ICE",
    angle: "0° (phased array)",
    depth: "Right atrium",
    color: "#d97706",
    description: "The starting position for ICE. Catheter in RA with beam pointing anteriorly. Shows RA, TV, RV, and RVOT.",
    probeManeuver: "Advance ICE catheter to RA; neutral position (no deflection). Rotate clockwise to move beam posteriorly toward IAS.",
    anatomy: ["RA", "TV", "RV", "RVOT", "Tricuspid annulus"],
    doppler: ["TV color (TR)", "RVOT color (RVOTO)", "TV CW (RVSP from TR Vmax)"],
    clinicalUse: ["Baseline RA/RV assessment", "TR severity", "RVSP estimation", "Catheter position confirmation"],
    normalFindings: ["Normal RA/RV size", "No TR or mild TR", "Normal RVOT"],
    pitfalls: ["Catheter position affects image — ensure stable position before measurements", "Near-field artifact from catheter tip can obscure TV"],
    imagePlaceholder: "ICE Home View — RA, TV, RV, RVOT from right atrium; catheter tip visible",
  },
  {
    id: "ice-ias",
    name: "ICE IAS View",
    abbr: "ICE IAS",
    section: "ICE",
    angle: "Clockwise rotation from home",
    depth: "Right atrium",
    color: "#d97706",
    description: "Posterior rotation from home view. Shows the interatrial septum, fossa ovalis, and left atrium. Primary view for ASD/PFO closure.",
    probeManeuver: "From home view, rotate catheter clockwise until IAS comes into view. The fossa ovalis appears as a thin membrane in the centre of the IAS.",
    anatomy: ["IAS", "Fossa ovalis", "LA", "MV (partially)", "LSPV (with further rotation)"],
    doppler: ["Color over IAS (ASD/PFO shunt)", "Bubble study (agitated saline) for PFO", "PW in LSPV (pulmonary venous flow)"],
    clinicalUse: ["ASD/PFO sizing and location", "Transseptal puncture guidance", "WATCHMAN device deployment", "ASD closure device guidance"],
    normalFindings: ["Intact IAS", "No shunt on color Doppler", "Fossa ovalis visible as thin membrane"],
    pitfalls: ["Fossa ovalis is the thinnest part of IAS — transseptal needle should target this area", "Lipomatous hypertrophy of IAS can mimic mass — spare fossa ovalis is characteristic"],
    imagePlaceholder: "ICE IAS View — IAS with fossa ovalis, LA behind, color Doppler for shunt detection",
  },
  {
    id: "ice-laa",
    name: "ICE LAA View",
    abbr: "ICE LAA",
    section: "ICE",
    angle: "Further clockwise from IAS",
    depth: "Right atrium or transseptal",
    color: "#d97706",
    description: "Shows the left atrial appendage. Used for LAA thrombus exclusion before cardioversion and WATCHMAN device sizing/deployment.",
    probeManeuver: "Continue clockwise rotation from IAS view. The LAA appears as a finger-like structure at the top-left. Transseptal access improves visualisation.",
    anatomy: ["LAA", "LA", "LSPV", "LIPV", "Mitral annulus"],
    doppler: ["LAA PW (emptying velocity >40 cm/s = low thrombus risk)", "Color over LAA (spontaneous echo contrast, thrombus)"],
    clinicalUse: ["LAA thrombus exclusion (pre-cardioversion, pre-ablation)", "WATCHMAN device sizing (LAA ostium diameter, depth)", "WATCHMAN deployment and leak assessment", "AF ablation guidance"],
    normalFindings: ["LAA emptying velocity >40 cm/s", "No thrombus", "No spontaneous echo contrast"],
    pitfalls: ["Pectinate muscles mimic thrombus — use multiple views and Doppler", "WATCHMAN leak: residual flow around device on color Doppler — acceptable if ≤5 mm"],
    imagePlaceholder: "ICE LAA View — finger-like LAA with LSPV, color Doppler for thrombus/SEC",
  },
  {
    id: "ice-aorta",
    name: "ICE Aortic Valve View",
    abbr: "ICE AV",
    section: "ICE",
    angle: "Anterior from IAS",
    depth: "Right atrium",
    color: "#d97706",
    description: "Shows the aortic valve and LVOT from the RA. Used during TAVR and structural procedures for valve positioning.",
    probeManeuver: "From IAS view, rotate counterclockwise (anteriorly). The aortic valve appears as a circular structure with three cusps.",
    anatomy: ["AV (NCC, LCC, RCC)", "LVOT", "Aortic root", "LA (behind AV)"],
    doppler: ["AV color (AR, paravalvular leak post-TAVR)", "CW across AV (gradient post-TAVR)"],
    clinicalUse: ["TAVR valve positioning and deployment", "Post-TAVR paravalvular leak assessment", "AV morphology (bicuspid)", "LVOT measurement"],
    normalFindings: ["Three equal cusps", "No AR", "Normal LVOT diameter"],
    pitfalls: ["ICE provides limited AV gradient accuracy — use TEE or TTE for haemodynamic assessment", "Paravalvular leak: circumferential color signal around prosthesis — quantify by circumference"],
    imagePlaceholder: "ICE AV View — aortic valve en-face from RA, three cusps, LVOT visible",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function ViewCard({ view, isSelected, onClick }: { view: TEEView; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all mb-1"
      style={isSelected
        ? { background: view.color, color: "white" }
        : { background: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold leading-tight">{view.name}</p>
          <p className="text-xs opacity-70 mt-0.5">{view.angle} · {view.depth}</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
      </div>
    </button>
  );
}

const SECTION_LABELS: Record<string, string> = {
  ME: "Midesophageal (ME)",
  TG: "Transgastric (TG)",
  UE: "Upper Esophageal (UE)",
  ICE: "Intracardiac Echo (ICE)",
};

const SECTION_COLORS: Record<string, string> = {
  ME: "#189aa1",
  TG: "#0e7490",
  UE: "#6366f1",
  ICE: "#d97706",
};

// ─── Main Export ───────────────────────────────────────────────────────────────
export function TEEIceScanCoachContent() {
  const [activeSection, setActiveSection] = useState<"ME" | "TG" | "UE" | "ICE">("ME");
  const [selectedView, setSelectedView] = useState<TEEView>(teeViews[0]);
  const detailRef = useRef<HTMLDivElement>(null);

  const sectionViews = teeViews.filter(v => v.section === activeSection);

  const handleViewSelect = (view: TEEView) => {
    setSelectedView(view);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <div>
      {/* Banner */}
      <div className="relative overflow-hidden mb-6" style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}>
        <div className="relative container py-8 md:py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
              <span className="text-xs text-white/80 font-medium">TEE & ICE Acquisition Guide</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              TEE/ICE ScanCoach™
            </h1>
            <p className="text-[#4ad9e0] font-semibold text-sm mb-3">Transesophageal & Intracardiac Echocardiography</p>
            <p className="text-white/70 text-sm leading-relaxed mb-3 max-w-lg">
              View-by-view probe manipulation, anatomy, Doppler technique, and clinical pearls for ME, TG, and UE TEE views — plus ICE views for structural heart procedures.
            </p>
            <p className="text-white/50 text-xs mb-4">
              <span className="font-semibold text-white/70">Patient Positioning:</span> Left lateral decubitus for TEE; supine for ICE (catheter-based). Ensure adequate sedation/anaesthesia and bite guard in place before probe insertion.
            </p>
            <Link href="/tee">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90" style={{ background: "#189aa1" }}>
                <Microscope className="w-4 h-4" />
                Open TEE Navigator™
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["ME", "TG", "UE", "ICE"] as const).map(s => (
          <button
            key={s}
            onClick={() => {
              setActiveSection(s);
              setSelectedView(teeViews.find(v => v.section === s)!);
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeSection === s
              ? { background: SECTION_COLORS[s], color: "white" }
              : { background: "white", color: SECTION_COLORS[s], border: `1px solid ${SECTION_COLORS[s]}40` }}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Detail panel */}
        <div ref={detailRef} className="lg:col-span-3 lg:order-2 order-1 space-y-4">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: selectedView.color + "30", background: selectedView.color + "08" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: selectedView.color }}>
                    {selectedView.abbr.split(" ")[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedView.name}</h2>
                    <p className="text-xs text-gray-500">{SECTION_LABELS[selectedView.section]} · {selectedView.angle} · {selectedView.depth}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white hidden sm:block"
                  style={{ background: selectedView.color }}>
                  {selectedView.section}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm text-gray-700 leading-relaxed">{selectedView.description}</p>
            </div>

            {/* Image placeholder */}
            <div className="px-5 py-4 border-b border-gray-50">
              <div className="rounded-xl flex items-center justify-center"
                style={{ background: selectedView.color + "08", border: `2px dashed ${selectedView.color}40`, minHeight: "160px" }}>
                <div className="text-center p-6">
                  <Eye className="w-8 h-8 mx-auto mb-2" style={{ color: selectedView.color + "80" }} />
                  <p className="text-xs font-semibold mb-1" style={{ color: selectedView.color }}>Reference Image / Clip</p>
                  <p className="text-xs text-gray-400 max-w-xs">{selectedView.imagePlaceholder}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Probe Maneuver */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: selectedView.color }}>
                <Activity className="w-3.5 h-3.5" />
              </div>
              Probe Maneuver
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{selectedView.probeManeuver}</p>
          </div>

          {/* Two-column: Anatomy + Doppler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: selectedView.color }}>
                  <Eye className="w-3.5 h-3.5" />
                </div>
                Anatomy Visible
              </h3>
              <ul className="space-y-1.5">
                {selectedView.anatomy.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedView.color }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: selectedView.color }}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                Doppler Applications
              </h3>
              <ul className="space-y-1.5">
                {selectedView.doppler.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedView.color }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Clinical Use + Normal Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: selectedView.color }}>
                  <Info className="w-3.5 h-3.5" />
                </div>
                Clinical Use
              </h3>
              <ul className="space-y-1.5">
                {selectedView.clinicalUse.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedView.color }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: "#16a34a" }}>
                  <Info className="w-3.5 h-3.5" />
                </div>
                Normal Findings
              </h3>
              <ul className="space-y-1.5">
                {selectedView.normalFindings.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-green-500" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pitfalls */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white bg-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              Pitfalls & Tips
            </h3>
            <ul className="space-y-2">
              {selectedView.pitfalls.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-400 text-center py-2">
            Clinical content © All About Ultrasound, Inc. / iHeartEcho. Educational use only. Based on ASE/SCA/EACVI TEE guidelines.
          </div>
        </div>

        {/* View list sidebar */}
        <div className="lg:col-span-1 lg:order-1 order-2 space-y-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
                {SECTION_LABELS[activeSection]}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{sectionViews.length} views</p>
            </div>
            <div className="p-3 space-y-0.5 max-h-[70vh] overflow-y-auto">
              {sectionViews.map(v => (
                <ViewCard key={v.id} view={v} isSelected={selectedView.id === v.id} onClick={() => handleViewSelect(v)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
