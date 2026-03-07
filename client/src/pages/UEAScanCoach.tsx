/*
  UEA ScanCoach™ — iHeartEcho
  Ultrasound Enhancing Agents — Contrast Echo Acquisition Guide
  View-by-view probe guidance, machine optimisation, injection technique,
  artefact recognition, and pitfall avoidance.
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import {
  Droplets, ChevronDown, ChevronUp, Info, AlertTriangle,
  Target, CheckCircle, RotateCcw, ArrowRight, Stethoscope,
  Zap, Eye, Activity, Shield, BookOpen
} from "lucide-react";

const BRAND = "#189aa1";
const AQUA  = "#4ad9e0";

// ─── VIEW DATA ────────────────────────────────────────────────────────────────

const UEA_VIEWS = [
  {
    id: "plax",
    group: "Parasternal",
    groupColor: BRAND,
    name: "Parasternal Long Axis (PLAX)",
    patientPosition: "Left lateral decubitus, left arm raised above head to open intercostal spaces",
    probePosition: "2nd–4th left intercostal space, left sternal border; indicator toward right shoulder",
    probeOrientation: "Long axis of heart; align IVS and posterior wall parallel to screen",
    description: "The PLAX view provides excellent visualisation of the anterior septum, posterior wall, and LV outflow tract. With contrast, it is particularly valuable for identifying apical thrombus extending into the mid-cavity and for delineating the subvalvular apparatus.",
    howToGet: [
      "Position patient in steep left lateral decubitus with left arm raised",
      "Place probe at 2nd–4th left intercostal space, left sternal border",
      "Indicator toward right shoulder (10–11 o'clock position)",
      "Activate contrast-specific imaging mode (low MI 0.1–0.2)",
      "Reduce gain 30–50% from standard settings",
      "Adjust depth to include full LV — contrast fills apex last",
      "Optimise to show IVS and posterior wall parallel to screen",
    ],
    structures: [
      "LV anterior septum and posterior wall",
      "Mitral valve (anterior and posterior leaflets)",
      "Aortic valve and LVOT",
      "Aortic root and proximal ascending aorta",
      "Left atrium",
      "Right ventricular outflow tract (anterior)",
    ],
    contrastTips: [
      "Contrast fills LV cavity from base to apex — wait for complete opacification before assessing",
      "Anterior septum and posterior wall are well-delineated with contrast — ideal for wall thickness measurement",
      "Subvalvular apparatus (chordae, papillary muscles) becomes visible with contrast — useful for LVNC assessment",
      "Avascular thrombus appears as a filling defect — most commonly at apex but can extend into mid-cavity",
    ],
    pitfalls: [
      "Near-field artefact from high gain — reduce gain until LV cavity appears uniformly dark before contrast arrives",
      "Blooming artefact — over-gain causes contrast to appear to extend beyond endocardial border",
      "Shadowing from calcified MV or AV — reposition probe to avoid acoustic shadow",
      "Foreshortening — ensure IVS and posterior wall are truly parallel; oblique cuts underestimate LV size",
    ],
    artefacts: [
      { name: "Attenuation artefact", description: "Contrast in near field attenuates signal to far field — appears as acoustic shadow. Reduce gain or use harmonic imaging." },
      { name: "Blooming artefact", description: "Over-gain causes contrast to appear to spill beyond endocardial border. Reduce gain." },
      { name: "Reverb artefact", description: "Reverberation from high-MI imaging — reduce MI or use pulse inversion harmonic mode." },
    ],
    clinicalPearls: [
      "PLAX is the first view to obtain after contrast injection — confirms adequate LV opacification",
      "If PLAX is suboptimal, try moving probe one intercostal space lower",
      "Posterior wall motion is best assessed in PLAX — look for inferior wall hypokinesis (RCA territory)",
    ],
  },
  {
    id: "psax_mv",
    group: "Parasternal",
    groupColor: BRAND,
    name: "PSAX — Mitral Valve Level",
    patientPosition: "Left lateral decubitus, left arm raised; same position as PLAX",
    probePosition: "Same position as PLAX; rotate probe 90° clockwise (indicator toward left shoulder)",
    probeOrientation: "Short axis of LV at mitral valve level; 'fish-mouth' appearance of MV",
    description: "The PSAX at mitral valve level provides a true short-axis view of the LV at the base. With contrast, all six basal segments are clearly delineated, and the 'fish-mouth' opening of the mitral valve confirms correct level.",
    howToGet: [
      "From PLAX, rotate probe 90° clockwise — indicator toward left shoulder (2 o'clock)",
      "Tilt probe slightly inferiorly to obtain true circular LV cross-section",
      "Confirm 'fish-mouth' MV appearance — confirms mitral level",
      "Activate contrast mode and reduce gain",
      "Ensure all 6 segments are visible: anterior, anterolateral, inferolateral, inferior, inferoseptal, anteroseptal",
    ],
    structures: [
      "LV (6 basal segments)",
      "Mitral valve (anterior and posterior leaflets — 'fish-mouth')",
      "Papillary muscles (just below this level)",
      "RV (crescent-shaped, anterior)",
    ],
    contrastTips: [
      "All 6 basal segments should opacify uniformly — asymmetric opacification suggests WMA",
      "Contrast clearly delineates the circular LV lumen — ideal for area-based EF estimation",
      "Papillary muscles appear as filling defects within the contrast-filled LV — normal finding",
      "Circumferential perfusion defects are best appreciated at this level",
    ],
    pitfalls: [
      "Oblique cuts produce an elliptical rather than circular LV — rotate probe to obtain true short axis",
      "Too high (AV level) or too low (papillary level) — confirm 'fish-mouth' MV to ensure correct level",
      "Papillary muscles can mimic filling defects — confirm by moving to papillary level where they are more prominent",
    ],
    artefacts: [
      { name: "Lateral dropout", description: "Signal dropout at lateral walls due to probe angle — tilt probe to improve contact." },
      { name: "Near-field clutter", description: "RV anterior wall creates near-field artefact — reduce gain in near field." },
    ],
    clinicalPearls: [
      "Basal PSAX is the best view for identifying basal wall motion abnormalities",
      "LCx territory: anterolateral and inferolateral segments. LAD: anterior and anteroseptal. RCA: inferior and inferoseptal",
      "Circumferential ST-elevation MI (STEMI) pattern — all segments affected — consider LAD wrap or multivessel disease",
    ],
  },
  {
    id: "psax_pap",
    group: "Parasternal",
    groupColor: BRAND,
    name: "PSAX — Mid-Papillary Level",
    patientPosition: "Left lateral decubitus, left arm raised",
    probePosition: "Same as PSAX mitral; tilt probe slightly inferiorly to reveal papillary muscles",
    probeOrientation: "Short axis at mid-ventricular level; two papillary muscles visible as filling defects",
    description: "The mid-papillary PSAX is the single most important view for myocardial perfusion imaging (MPI). The two papillary muscles serve as anatomical landmarks, and the six mid-ventricular segments correspond to all three coronary territories. Flash-replenishment technique is performed at this level.",
    howToGet: [
      "From PSAX mitral level, tilt probe slightly inferiorly (toward patient's feet)",
      "Two papillary muscles appear as filling defects within the LV cavity",
      "Confirm circular LV cross-section with both papillary muscles visible",
      "For flash replenishment: send a high-MI pulse (1–2 frames) to destroy microbubbles",
      "Immediately switch back to low MI and observe bubble replenishment over 4–8 cardiac cycles",
      "Record cine loop of replenishment for offline analysis",
    ],
    structures: [
      "LV (6 mid-ventricular segments)",
      "Anterolateral papillary muscle (LCx territory)",
      "Posteromedial papillary muscle (RCA territory — dual supply in some patients)",
      "RV (crescent-shaped)",
    ],
    contrastTips: [
      "Flash replenishment: normal = uniform rapid replenishment within 4 cardiac cycles",
      "Delayed replenishment (4–8 cycles) = ischaemia or microvascular disease",
      "Absent replenishment = infarct (scar) — no viable myocardium",
      "Patchy or heterogeneous replenishment = microvascular disease or artefact",
      "Papillary muscles replenish more slowly than myocardium — do not misinterpret as perfusion defect",
    ],
    pitfalls: [
      "Papillary muscles are avascular structures — they appear as filling defects and do NOT replenish — this is NORMAL",
      "Off-axis imaging — oblique cuts create pseudo-perfusion defects; ensure true circular cross-section",
      "Inadequate contrast dose — insufficient bubble concentration prevents accurate perfusion assessment",
      "Patient movement during flash replenishment invalidates the replenishment curve",
    ],
    artefacts: [
      { name: "Flash artefact", description: "Bright flash from high-MI pulse is normal — do not confuse with pathology. Observe subsequent replenishment." },
      { name: "Shadowing from papillary muscles", description: "Papillary muscles can shadow the far wall — reposition probe slightly." },
      { name: "Rib shadow", description: "Rib shadow creates a fixed linear artefact — reposition probe to avoid." },
    ],
    clinicalPearls: [
      "Mid-papillary PSAX is the gold standard view for myocardial perfusion imaging",
      "Posteromedial papillary muscle has dual blood supply (LAD + RCA) — less vulnerable to ischaemia",
      "Anterolateral papillary muscle is supplied by LCx only — more vulnerable to ischaemia",
      "Papillary muscle rupture post-MI: contrast shows avascular papillary muscle with severe MR",
    ],
  },
  {
    id: "a4c",
    group: "Apical",
    groupColor: "#0e7490",
    name: "Apical 4-Chamber (A4C)",
    patientPosition: "Steep left lateral decubitus (60–90°); left arm raised above head; head of bed elevated 15–30°",
    probePosition: "Cardiac apex — typically 5th–6th intercostal space, midaxillary line; indicator toward left",
    probeOrientation: "4-chamber view; LV on right, RV on left of screen; apex at top",
    description: "The apical 4-chamber view is the most important view for contrast echocardiography. It provides the best visualisation of the LV apex (the most common site for thrombus), enables biplane EF calculation, and allows assessment of all apical and mid-ventricular segments. Steep left lateral positioning is essential.",
    howToGet: [
      "Position patient in steep left lateral decubitus — 60–90° tilt is essential",
      "Raise left arm above head to open intercostal spaces",
      "Palpate cardiac apex — typically 5th–6th ICS, midaxillary line",
      "Place probe at apex with indicator toward patient's left (3 o'clock)",
      "Tilt probe slightly anteriorly to open the apex",
      "Activate contrast mode (low MI 0.1–0.2); reduce gain significantly",
      "Adjust depth to include full LV — do NOT foreshorten the apex",
      "Wait for complete LV opacification before acquiring cine loops",
    ],
    structures: [
      "LV (apical, mid, and basal segments — lateral and septal walls)",
      "RV (apical, mid, and basal segments)",
      "Mitral valve",
      "Tricuspid valve",
      "Left atrium and right atrium",
      "LV apex (critical for thrombus assessment)",
    ],
    contrastTips: [
      "LV apex is the last region to opacify — wait for complete apical filling before assessing for thrombus",
      "Apical thrombus: avascular filling defect at apex — does NOT enhance with contrast",
      "Apical HCM: spade-shaped cavity with apical obliteration — contrast dramatically improves diagnosis",
      "LVNC: deep trabecular recesses fill with contrast — NC:C ratio >2.3 (systole) supports diagnosis",
      "Takotsubo: apical ballooning with basal hyperkinesis — contrast confirms extent of apical akinesis",
      "Biplane EF: trace endocardial border at end-diastole and end-systole — contrast improves accuracy by 15–20%",
    ],
    pitfalls: [
      "Foreshortening — most common error. Ensure apex is at top of screen; move probe laterally if needed",
      "Near-field artefact — high gain causes bright artefact near probe; reduce gain to avoid pseudo-thrombus",
      "Apical dropout — signal dropout at apex can mimic thrombus; use contrast to confirm",
      "Inadequate left lateral positioning — supine position causes LV to fall away from chest wall",
    ],
    artefacts: [
      { name: "Near-field clutter", description: "Bright artefact near probe tip mimics thrombus. Reduce gain — true thrombus persists; artefact disappears." },
      { name: "Apical dropout", description: "Signal dropout at apex due to beam angle. Contrast fills the cavity and eliminates this artefact." },
      { name: "Side-lobe artefact", description: "Side lobes from strong reflectors (MV annulus) project into LV cavity. Contrast confirms true cavity filling." },
    ],
    clinicalPearls: [
      "Contrast increases sensitivity for apical thrombus detection from ~33% to >90%",
      "If apical thrombus is suspected on unenhanced echo, ALWAYS use contrast to confirm or exclude",
      "Apical HCM is frequently missed on unenhanced echo — contrast is essential for diagnosis",
      "LVNC: contrast fills deep recesses (>2.3x compacted layer in systole) — confirms diagnosis",
      "EF measured with contrast is more reproducible and accurate than unenhanced EF",
    ],
  },
  {
    id: "a2c",
    group: "Apical",
    groupColor: "#0e7490",
    name: "Apical 2-Chamber (A2C)",
    patientPosition: "Steep left lateral decubitus; same position as A4C",
    probePosition: "Same apex position as A4C; rotate probe 60° counterclockwise",
    probeOrientation: "2-chamber view; LV anterior wall on right, inferior wall on left; no RV visible",
    description: "The apical 2-chamber view is obtained by rotating 60° counterclockwise from A4C. It is the only apical view of the true anterior wall (LAD territory) and is essential for biplane EF calculation. With contrast, anterior and inferior wall motion is clearly delineated.",
    howToGet: [
      "From A4C, rotate probe 60° counterclockwise (indicator toward 12 o'clock)",
      "Confirm only LV is visible — no RV should be seen",
      "Anterior wall (LAD territory) on right side of screen",
      "Inferior wall (RCA territory) on left side of screen",
      "Optimise contrast gain to delineate anterior and inferior walls",
      "Acquire cine loop for biplane EF (A4C + A2C)",
    ],
    structures: [
      "LV anterior wall (LAD territory)",
      "LV inferior wall (RCA territory)",
      "Mitral valve (anterior and posterior leaflets)",
      "Left atrium",
      "LV apex",
    ],
    contrastTips: [
      "Anterior wall is the most important structure in A2C — LAD ischaemia causes anterior WMA",
      "Inferior wall WMA = RCA territory — compare with PSAX and subcostal views",
      "A2C is required for biplane Simpson's EF — always acquire with A4C",
      "Apical anterior wall is a common site for thrombus in anterior STEMI — contrast confirms",
    ],
    pitfalls: [
      "Oblique rotation — confirm no RV is visible; RV in view means probe is not at true 2-chamber",
      "Foreshortening — same risk as A4C; ensure apex is at top of screen",
      "Anterior wall dropout — common in obese patients; contrast resolves this",
    ],
    artefacts: [
      { name: "Anterior wall dropout", description: "Anterior wall is furthest from probe in A2C — prone to dropout. Contrast fills cavity and improves border definition." },
    ],
    clinicalPearls: [
      "A2C is the only apical view showing the true anterior wall — essential for LAD territory assessment",
      "In anterior STEMI, A2C shows anterior and apical akinesis — contrast confirms extent",
      "Biplane EF requires both A4C and A2C — always acquire both with contrast",
    ],
  },
  {
    id: "a3c",
    group: "Apical",
    groupColor: "#0e7490",
    name: "Apical 3-Chamber / Long Axis (A3C)",
    patientPosition: "Steep left lateral decubitus; same position as A4C",
    probePosition: "Same apex position; rotate probe 30–60° counterclockwise from A2C (120–150° from A4C)",
    probeOrientation: "Long axis view from apex; LVOT and aortic valve visible; anteroseptal and inferolateral walls",
    description: "The apical long axis (A3C) completes the triplane assessment and is essential for LVOT and aortic valve evaluation from the apical window. With contrast, anteroseptal and inferolateral walls are delineated, completing the 17-segment model.",
    howToGet: [
      "From A2C, rotate probe further counterclockwise 30–60° (indicator toward 11 o'clock)",
      "LVOT and aortic valve should come into view",
      "Anteroseptal wall on right, inferolateral wall on left",
      "Optimise contrast to delineate anteroseptal and inferolateral walls",
      "Acquire cine loop for triplane EF if platform supports it",
    ],
    structures: [
      "LV anteroseptal wall (LAD territory)",
      "LV inferolateral wall (LCx territory)",
      "LVOT and aortic valve",
      "Mitral valve",
      "Aortic root",
    ],
    contrastTips: [
      "Anteroseptal wall (LAD territory) and inferolateral wall (LCx territory) are best seen in A3C",
      "LVOT obstruction in HCM: contrast delineates the LVOT and SAM of MV",
      "Triplane EF: A4C + A2C + A3C provides most accurate volumetric EF with contrast",
    ],
    pitfalls: [
      "Over-rotation — if LVOT is not visible, rotate back toward A2C",
      "Confusing A3C with A2C — confirm LVOT and AV are visible in A3C",
    ],
    artefacts: [
      { name: "LVOT artefact", description: "Contrast in LVOT can create bright signal near AV — reduce gain in near field." },
    ],
    clinicalPearls: [
      "A3C is essential for HOCM assessment — SAM of MV and LVOT obstruction are best seen here",
      "Inferolateral wall WMA = LCx territory — compare with PSAX inferolateral segment",
      "Complete 17-segment assessment requires A4C + A2C + A3C",
    ],
  },
  {
    id: "subcostal",
    group: "Subcostal",
    groupColor: "#0f766e",
    name: "Subcostal 4-Chamber",
    patientPosition: "Supine; knees bent to relax abdominal muscles; head flat or slightly elevated",
    probePosition: "Subxiphoid process; indicator toward patient's left; probe angled superiorly toward heart",
    probeOrientation: "4-chamber view from below; RV anterior (near field), LV posterior (far field)",
    description: "The subcostal view is an invaluable alternative when apical windows are poor (obesity, COPD, post-surgical). With contrast, the inferior and inferoseptal walls are well-delineated, and RV thrombus or mass can be assessed.",
    howToGet: [
      "Patient supine with knees bent; ask patient to breathe out and hold",
      "Place probe below xiphoid process; indicator toward patient's left",
      "Angle probe superiorly and posteriorly toward the heart",
      "Apply firm pressure — subcostal window requires more pressure than apical",
      "Activate contrast mode; reduce gain",
      "Inferior and inferoseptal walls are in the far field — ensure adequate depth",
    ],
    structures: [
      "LV inferior and inferoseptal walls (far field)",
      "RV (near field — anterior)",
      "Interatrial and interventricular septa",
      "Mitral and tricuspid valves",
      "IVC entry into RA",
    ],
    contrastTips: [
      "Subcostal is the best alternative window for inferior wall assessment when apical window is poor",
      "Contrast fills RV first (near field) then LV — wait for LV opacification",
      "RV thrombus: avascular filling defect in RV — rare but important in PE or RV infarct",
      "Inferior wall WMA: contrast clearly delineates inferior and inferoseptal walls",
    ],
    pitfalls: [
      "Inadequate pressure — subcostal window requires firm pressure; use patient's exhale",
      "Liver interposition — reposition probe laterally if liver is in the way",
      "RV near-field artefact — high gain causes bright artefact in RV; reduce gain",
      "Contrast attenuation — RV contrast can attenuate signal to LV far field; reduce gain",
    ],
    artefacts: [
      { name: "Near-field RV artefact", description: "RV is in near field — contrast causes bright near-field signal. Reduce gain." },
      { name: "Attenuation artefact", description: "RV contrast attenuates signal to LV far field. Reduce gain and use harmonic imaging." },
    ],
    clinicalPearls: [
      "Subcostal is the best window in post-cardiac surgery patients (sternal wound prevents parasternal access)",
      "Subcostal is preferred in COPD/emphysema — hyperinflated lungs push heart inferiorly",
      "In obese patients, subcostal often provides better contrast images than apical",
      "IVC assessment is not affected by contrast — standard technique applies",
    ],
  },
];

// ─── INJECTION TECHNIQUE ──────────────────────────────────────────────────────

const injectionSteps = [
  {
    step: 1,
    title: "IV Access Preparation",
    detail: "Use 18–20G IV catheter in antecubital fossa. Flush with 5 mL normal saline to confirm patency. Avoid hand/wrist veins — higher haemolysis risk with agitated saline or UEA.",
  },
  {
    step: 2,
    title: "Agent Preparation",
    detail: "Prepare agent per manufacturer instructions (see UEA Navigator for agent-specific prep). Definity: activate with Vialmix™ for 45 sec. Lumason: reconstitute per kit. Optison: gently invert 10 times.",
  },
  {
    step: 3,
    title: "Machine Settings",
    detail: "Activate contrast-specific imaging mode. Set MI to 0.1–0.2. Reduce gain 30–50%. Set focus to mid-LV. Ensure frame rate >25 fps.",
  },
  {
    step: 4,
    title: "Bolus Injection",
    detail: "Inject UEA as slow IV bolus over 2–3 seconds. Immediately follow with 5–10 mL normal saline flush. Observe LV opacification on screen — should appear within 3–5 cardiac cycles.",
  },
  {
    step: 5,
    title: "Image Acquisition",
    detail: "Acquire cine loops at each view during peak opacification. For LVO: acquire A4C, A2C, A3C, PLAX, PSAX. For MPI: acquire PSAX mid-papillary with flash replenishment.",
  },
  {
    step: 6,
    title: "Flash Replenishment (MPI only)",
    detail: "At PSAX mid-papillary level: send 1–2 high-MI frames (flash) to destroy microbubbles. Immediately switch to low MI and record replenishment over 4–8 cardiac cycles. Normal: uniform replenishment within 4 beats.",
  },
  {
    step: 7,
    title: "Repeat Injection (if needed)",
    detail: "If LV opacification is inadequate, a second bolus may be given after 5–10 minutes. Do not exceed maximum dose per manufacturer guidelines.",
  },
  {
    step: 8,
    title: "Post-Injection Monitoring",
    detail: "Monitor patient for 30 minutes. Record vital signs at 5, 15, and 30 minutes. Watch for signs of allergic reaction: urticaria, bronchospasm, hypotension, angioedema.",
  },
];

// ─── ARTEFACT GUIDE ───────────────────────────────────────────────────────────

const artefactGuide = [
  {
    name: "Attenuation / Shadowing",
    cause: "Excessive contrast concentration in near field absorbs ultrasound energy, preventing penetration to far field",
    appearance: "Dark (hypoechoic) region in far field behind dense contrast",
    solution: "Reduce contrast dose or injection rate; reduce gain; wait for contrast to dilute",
    mimic: "Posterior wall dropout, pericardial effusion",
  },
  {
    name: "Blooming Artefact",
    cause: "Over-gain causes contrast signal to appear to extend beyond true endocardial border",
    appearance: "Endocardial border appears thicker or irregular; LV cavity appears smaller than true size",
    solution: "Reduce gain until endocardial border is sharply defined",
    mimic: "LV hypertrophy, endocardial fibrosis",
  },
  {
    name: "Near-Field Clutter",
    cause: "High-amplitude echoes from structures near probe (chest wall, RV anterior wall) create reverberation artefacts",
    appearance: "Bright horizontal bands or haze in near field of LV cavity",
    solution: "Reduce gain; use harmonic imaging; reposition probe",
    mimic: "Apical thrombus (near-field clutter can mimic filling defect)",
  },
  {
    name: "Side-Lobe Artefact",
    cause: "Off-axis ultrasound beams (side lobes) reflect from strong reflectors (MV annulus, ribs) into LV cavity",
    appearance: "Curvilinear echoes within LV cavity, often parallel to MV annulus",
    solution: "Contrast fills cavity and eliminates most side-lobe artefacts; reposition probe",
    mimic: "Intracardiac mass, thrombus, vegetation",
  },
  {
    name: "Flash Artefact (MPI)",
    cause: "High-MI pulse used for flash replenishment creates a bright flash frame",
    appearance: "1–2 bright frames immediately after flash pulse — expected finding",
    solution: "Normal finding — observe subsequent replenishment pattern",
    mimic: "Not a pathological finding; expected during flash replenishment technique",
  },
  {
    name: "Pseudo-Perfusion Defect",
    cause: "Off-axis imaging, inadequate contrast dose, or papillary muscle shadowing creates apparent perfusion defect",
    appearance: "Apparent regional hypoenhancement that does not correspond to coronary territory",
    solution: "Reposition probe to obtain true short axis; ensure adequate contrast dose; confirm in multiple views",
    mimic: "True myocardial perfusion defect (ischaemia or infarct)",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function UEAScanCoach() {
  const [selectedView, setSelectedView] = useState<string | null>("a4c");
  const [activeTab, setActiveTab] = useState<"views" | "injection" | "artefacts" | "tips">("views");

  const currentView = UEA_VIEWS.find(v => v.id === selectedView);
  const groups = Array.from(new Set(UEA_VIEWS.map(v => v.group)));

  return (
    <Layout>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="relative container py-10 md:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
              <span className="text-xs text-white/80 font-medium">Contrast Echo Acquisition Guide</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <Droplets className="w-7 h-7 text-[#4ad9e0]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight"
                  style={{ fontFamily: "Merriweather, serif" }}>
                  UEA ScanCoach™
                </h1>
                <p className="text-[#4ad9e0] font-semibold text-sm">Ultrasound Enhancing Agents — Acquisition Guide</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-5 max-w-2xl">
              View-by-view probe guidance for contrast echocardiography. Covers patient positioning,
              machine optimisation, injection technique, artefact recognition, and clinical pearls
              for LV opacification and myocardial perfusion imaging.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uea-navigator">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                  <BookOpen className="w-4 h-4 text-[#4ad9e0]" />
                  UEA Navigator™
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto py-2">
            {(["views", "injection", "artefacts", "tips"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={activeTab === tab ? { background: BRAND } : {}}
              >
                {tab === "views" && <Eye className="w-3.5 h-3.5" />}
                {tab === "injection" && <Droplets className="w-3.5 h-3.5" />}
                {tab === "artefacts" && <AlertTriangle className="w-3.5 h-3.5" />}
                {tab === "tips" && <Zap className="w-3.5 h-3.5" />}
                {tab === "views" && "View Guide"}
                {tab === "injection" && "Injection Technique"}
                {tab === "artefacts" && "Artefact Guide"}
                {tab === "tips" && "Quick Tips"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Views Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "views" && (
        <div className="container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* View selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Select View</h2>
                </div>
                <div className="p-2">
                  {groups.map(group => (
                    <div key={group} className="mb-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {group}
                      </div>
                      {UEA_VIEWS.filter(v => v.group === group).map(view => (
                        <button
                          key={view.id}
                          onClick={() => setSelectedView(view.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all mb-0.5 ${
                            selectedView === view.id
                              ? "text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          style={selectedView === view.id ? { background: view.groupColor } : {}}
                        >
                          <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-semibold leading-tight">{view.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View detail */}
            <div className="lg:col-span-2">
              {currentView ? (
                <div className="space-y-4">
                  {/* View header */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: currentView.groupColor + "15" }}>
                        <Droplets className="w-5 h-5" style={{ color: currentView.groupColor }} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                          {currentView.name}
                        </h2>
                        <div className="inline-flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: currentView.groupColor }}>
                            {currentView.group}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{currentView.description}</p>
                  </div>

                  {/* Transducer Positioning */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>
                      Transducer Positioning
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "#f0fbfc" }}>
                        <Target className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Patient Position</div>
                          <div className="text-xs text-gray-700">{currentView.patientPosition}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "#f0fbfc" }}>
                        <RotateCcw className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Probe Position</div>
                          <div className="text-xs text-gray-700">{currentView.probePosition}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: "#f0fbfc" }}>
                        <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Probe Orientation</div>
                          <div className="text-xs text-gray-700">{currentView.probeOrientation}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How to get this view */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>
                      Step-by-Step Acquisition
                    </h3>
                    <ol className="space-y-2">
                      {currentView.howToGet.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: BRAND }}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Structures visible */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>
                      Structures Visible
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentView.structures.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: BRAND + "12", color: BRAND }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contrast tips */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>
                      Contrast-Specific Tips
                    </h3>
                    <div className="space-y-2">
                      {currentView.contrastTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50 border border-teal-100">
                          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                          <p className="text-xs text-teal-800 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pitfalls */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-amber-700">
                      Common Pitfalls
                    </h3>
                    <div className="space-y-2">
                      {currentView.pitfalls.map((pitfall, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                          <p className="text-xs text-amber-800 leading-relaxed">{pitfall}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View-specific artefacts */}
                  {currentView.artefacts.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-red-700">
                        Artefacts at This View
                      </h3>
                      <div className="space-y-2.5">
                        {currentView.artefacts.map((art, i) => (
                          <div key={i} className="p-3 rounded-lg border border-red-100 bg-red-50">
                            <div className="text-xs font-bold text-red-700 mb-1">{art.name}</div>
                            <p className="text-xs text-red-600 leading-relaxed">{art.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical pearls */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#16a34a" }}>
                      Clinical Pearls
                    </h3>
                    <div className="space-y-2">
                      {currentView.clinicalPearls.map((pearl, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100">
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-600" />
                          <p className="text-xs text-green-800 leading-relaxed">{pearl}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation between views */}
                  <div className="flex justify-between">
                    {(() => {
                      const idx = UEA_VIEWS.findIndex(v => v.id === selectedView);
                      const prev = idx > 0 ? UEA_VIEWS[idx - 1] : null;
                      const next = idx < UEA_VIEWS.length - 1 ? UEA_VIEWS[idx + 1] : null;
                      return (
                        <>
                          {prev ? (
                            <button
                              onClick={() => setSelectedView(prev.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                              {prev.name}
                            </button>
                          ) : <div />}
                          {next && (
                            <button
                              onClick={() => setSelectedView(next.id)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                              style={{ background: BRAND }}
                            >
                              {next.name}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <Droplets className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND + "60" }} />
                  <p className="text-sm text-gray-500">Select a view from the list to see acquisition guidance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Injection Technique Tab ───────────────────────────────────────── */}
      {activeTab === "injection" && (
        <div className="container py-6 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              UEA Injection Technique
            </h2>
            <p className="text-sm text-gray-500">Step-by-step protocol for safe and effective contrast administration</p>
          </div>
          <div className="space-y-3">
            {injectionSteps.map(step => (
              <div key={step.step} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${BRAND}, ${AQUA})` }}>
                  {step.step}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Artefact Guide Tab ────────────────────────────────────────────── */}
      {activeTab === "artefacts" && (
        <div className="container py-6 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              Contrast Artefact Recognition Guide
            </h2>
            <p className="text-sm text-gray-500">Identify, understand, and resolve common contrast echocardiography artefacts</p>
          </div>
          <div className="space-y-4">
            {artefactGuide.map(art => (
              <div key={art.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 pt-1" style={{ fontFamily: "Merriweather, serif" }}>
                    {art.name}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Cause</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{art.cause}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Appearance</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{art.appearance}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1">Solution</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{art.solution}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">Can Mimic</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{art.mimic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Tips Tab ────────────────────────────────────────────────── */}
      {activeTab === "tips" && (
        <div className="container py-6 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              Quick Reference Tips
            </h2>
            <p className="text-sm text-gray-500">Essential contrast echo reminders for the scanning room</p>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Machine Settings at a Glance",
                icon: Zap,
                color: BRAND,
                tips: [
                  "MI: 0.1–0.2 (low MI mode) — high MI destroys microbubbles",
                  "Gain: reduce 30–50% from standard — over-gain causes blooming",
                  "Mode: contrast harmonic (CPS, Power Modulation, or Pulse Inversion)",
                  "Focus: single focus at mid-LV level",
                  "Frame rate: >25 fps (ideally >50 fps)",
                  "Depth: minimum to include full LV",
                ],
              },
              {
                title: "Positioning Essentials",
                icon: Target,
                color: "#0e7490",
                tips: [
                  "Steep left lateral decubitus (60–90°) is ESSENTIAL for apical views",
                  "Left arm raised above head opens intercostal spaces",
                  "Head of bed elevated 15–30° improves apical window",
                  "Subcostal: patient supine, knees bent, breathe out and hold",
                  "Parasternal: left lateral decubitus, 30–45° tilt is sufficient",
                ],
              },
              {
                title: "When to Use Contrast",
                icon: CheckCircle,
                color: "#16a34a",
                tips: [
                  "≥2 contiguous LV segments not adequately visualised (Class I)",
                  "Suspected apical thrombus — contrast sensitivity >90% vs ~33% unenhanced",
                  "Suspected apical HCM — spade-shaped cavity only visible with contrast",
                  "Suspected LVNC — deep recesses fill with contrast",
                  "Stress echo with poor baseline image quality",
                  "Myocardial perfusion imaging (MPI) — flash replenishment technique",
                ],
              },
              {
                title: "Safety Reminders",
                icon: Shield,
                color: "#dc2626",
                tips: [
                  "FDA Black Box Warning (Definity/Optison) — serious cardiopulmonary reactions possible",
                  "Resuscitation equipment and epinephrine MUST be available",
                  "Monitor for 30 minutes post-injection — vital signs at 5, 15, 30 min",
                  "Absolute contraindication: known R-to-L intracardiac or pulmonary shunt",
                  "Relative contraindication: severe decompensated HF, severe PHT (>90 mmHg)",
                  "Lumason (Sulfur hexafluoride) has a safer profile — consider in high-risk patients",
                ],
              },
              {
                title: "Flash Replenishment (MPI) Technique",
                icon: Activity,
                color: BRAND,
                tips: [
                  "Obtain PSAX mid-papillary level with steady contrast infusion or after bolus",
                  "Send 1–2 high-MI frames (flash) to destroy all microbubbles in field",
                  "Immediately switch back to low MI and record replenishment",
                  "Normal: uniform replenishment within 4 cardiac cycles",
                  "Delayed (4–8 cycles): ischaemia or microvascular disease",
                  "Absent: infarct (scar) — no viable myocardium",
                  "Papillary muscles do NOT replenish — this is NORMAL",
                ],
              },
            ].map(({ title, icon: Icon, color, tips }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: color + "15" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                    {title}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Link to Navigator ─────────────────────────────────────────────── */}
      <div className="container pb-8">
        <div className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#4ad9e0]" />
              <span className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider">UEA Navigator™</span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              Need the full protocol checklist?
            </h3>
            <p className="text-white/60 text-xs">
              Safety screening, indications, agent dosing, view-by-view checklist, reporting guidance, and reference values.
            </p>
          </div>
          <Link href="/uea-navigator">
            <button className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "#189aa1" }}>
              <BookOpen className="w-4 h-4" />
              Open UEA Navigator™
            </button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
