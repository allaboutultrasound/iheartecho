/*
  FetalEchoAssist™ — iHeartEcho™
  12 fetal echo calculators with 2023 ASE Fetal Echo Guideline-based feedback
  Reference: Donofrio MT et al. J Am Soc Echocardiogr. 2024;37(1):1-75 (2023 ASE Fetal Echo Guidelines)
  Brand: Teal #189aa1, Aqua #4ad9e0, Navy #0e1e2e
*/
import { useState, useRef, useEffect } from "react";
import { useSearch } from "wouter";
import Layout from "@/components/Layout";
import { Baby, ChevronDown, ChevronUp, Info, Lightbulb, MessageSquare, AlertCircle, Calculator, Activity } from "lucide-react";

const BRAND = "#189aa1";
const AQUA = "#4ad9e0";
const NAVY = "#0e1e2e";

// ─── UI Primitives ────────────────────────────────────────────────────────────
function InputRow({ label, unit, value, onChange, placeholder, hint }: {
  label: string; unit?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}{unit && <span className="font-normal text-gray-400 ml-1">({unit})</span>}</label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "—"}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
      />
      {hint && <p className="text-[10px] text-gray-400 leading-tight">{hint}</p>}
    </div>
  );
}

function ResultPanel({ suggests, note, tip }: { suggests?: string; note?: string; tip?: string }) {
  if (!suggests && !note && !tip) return null;
  return (
    <div className="mt-4 space-y-2">
      {suggests && (
        <div className="flex gap-2 p-3 rounded-lg" style={{ background: BRAND + "12", borderLeft: `3px solid ${BRAND}` }}>
          <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
          <p className="text-xs leading-relaxed text-gray-700">{suggests}</p>
        </div>
      )}
      {note && (
        <div className="flex gap-2 p-3 rounded-lg" style={{ background: "#0284c712", borderLeft: "3px solid #0284c7" }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
          <p className="text-xs leading-relaxed text-gray-700">{note}</p>
        </div>
      )}
      {tip && (
        <div className="flex gap-2 p-3 rounded-lg bg-amber-50" style={{ borderLeft: "3px solid #d97706" }}>
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <p className="text-xs leading-relaxed text-gray-700">{tip}</p>
        </div>
      )}
    </div>
  );
}

function MetricBadge({ label, value, normal }: { label: string; value: string; normal?: boolean | null }) {
  const color = normal === null || normal === undefined ? "#6b7280"
    : normal ? "#16a34a" : "#dc2626";
  const bg = normal === null || normal === undefined ? "#f3f4f6"
    : normal ? "#dcfce7" : "#fee2e2";
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg" style={{ background: bg }}>
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
      <span className="text-base font-bold mt-0.5" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Engine Wrapper ───────────────────────────────────────────────────────────
function EngineSection({ id, title, badge, badgeColor, children }: {
  id: string; title: string; badge: string; badgeColor: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const search = useSearch();

  useEffect(() => {
    const detail = new URLSearchParams(search).get("engine") ?? "";
    if (detail === id) {
      setOpen(true);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [search, id]);

  return (
    <div id={id} ref={ref} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: badgeColor + "20" }}>
          <Calculator className="w-4 h-4" style={{ color: badgeColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{title}</span>
          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badgeColor + "18", color: badgeColor }}>{badge}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-50">{children}</div>}
    </div>
  );
}

// ─── 1. Celermajer Index ──────────────────────────────────────────────────────
function CelermajerIndex() {
  const [cardiacArea, setCardiacArea] = useState("");
  const [thoracicArea, setThoracicArea] = useState("");

  const ca = parseFloat(cardiacArea);
  const ta = parseFloat(thoracicArea);
  const valid = ca > 0 && ta > 0 && ta > ca;
  const index = valid ? ca / ta : null;

  const normal = index !== null ? index <= 0.35 : null;
  const severity = index === null ? null
    : index <= 0.35 ? "Normal"
    : index <= 0.40 ? "Mildly Enlarged"
    : index <= 0.50 ? "Moderately Enlarged"
    : "Severely Enlarged (Cardiomegaly)";

  const suggests = index !== null
    ? `FetalEchoAssist™ Suggests: Celermajer Index = ${index.toFixed(3)}. ${severity}. ${
        normal ? "Cardiac area is within normal limits (≤0.35). No evidence of cardiomegaly."
        : index <= 0.40 ? "Mildly elevated cardiac-to-thoracic area ratio. Correlate with ventricular function, AV valve regurgitation, and arrhythmia."
        : index <= 0.50 ? "Moderately elevated ratio. Evaluate for structural CHD, AV valve regurgitation, high-output states (fetal anemia, AVM), and cardiac dysfunction."
        : "Severely elevated ratio consistent with cardiomegaly. Urgent evaluation for structural CHD, severe AV valve regurgitation, hydrops fetalis, cardiac tumor, or severe fetal anemia is warranted."
      }`
    : undefined;

  const note = index !== null
    ? `FetalEchoAssist™ Note: The Celermajer Index (cardiac area / thoracic area) is measured on a 4-chamber view at end-diastole. Normal reference: ≤0.35 (ASE 2023 Fetal Echo Guidelines). Values >0.50 are associated with poor perinatal outcomes and warrant fetal MRI and multidisciplinary consultation.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Trace the cardiac silhouette at end-diastole on the 4-chamber view. Include pericardial effusion in the cardiac area if present. Ensure the thoracic measurement is at the same level. Repeat in serial scans to track progression.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputRow label="Cardiac Area" unit="cm²" value={cardiacArea} onChange={setCardiacArea} placeholder="e.g. 2.1" hint="Traced on 4-chamber view at end-diastole" />
        <InputRow label="Thoracic Area" unit="cm²" value={thoracicArea} onChange={setThoracicArea} placeholder="e.g. 7.8" hint="Same cross-section as cardiac area" />
      </div>
      {index !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="Celermajer Index" value={index.toFixed(3)} normal={normal} />
          <MetricBadge label="Interpretation" value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Celermajer DS et al. Cardiothoracic ratio in fetal life. Br Heart J. 1992. | ASE 2023 Fetal Echo Guidelines (Donofrio et al. JASE 2024;37:1-75)</p>
    </div>
  );
}

// ─── 2. Fetal Cardiovascular Profile Score (CVPS) ────────────────────────────
function CVPSCalculator() {
  const [hydrops, setHydrops] = useState("2");
  const [venousDoppler, setVenousDoppler] = useState("2");
  const [heartSize, setHeartSize] = useState("2");
  const [cardiacFunction, setCardiacFunction] = useState("2");
  const [arterialDoppler, setArterialDoppler] = useState("2");

  const total = parseInt(hydrops) + parseInt(venousDoppler) + parseInt(heartSize) + parseInt(cardiacFunction) + parseInt(arterialDoppler);

  const severity = total === 10 ? "Normal"
    : total >= 8 ? "Mildly Abnormal"
    : total >= 6 ? "Moderately Abnormal"
    : "Severely Abnormal — High Risk";

  const color = total === 10 ? "#16a34a" : total >= 8 ? "#d97706" : total >= 6 ? "#ea580c" : "#dc2626";

  const suggests = `FetalEchoAssist™ Suggests: CVPS = ${total}/10 — ${severity}. ${
    total === 10 ? "All cardiovascular parameters are within normal limits. Continue routine surveillance."
    : total >= 8 ? "Mild cardiovascular compromise. Increase surveillance frequency. Identify and address underlying etiology (anemia, infection, structural CHD)."
    : total >= 6 ? "Moderate cardiovascular compromise. Multidisciplinary fetal medicine consultation recommended. Consider delivery planning and neonatal cardiac team involvement."
    : "Severe cardiovascular compromise. Immediate multidisciplinary evaluation required. High risk of fetal demise. Delivery timing and neonatal resuscitation planning are critical."
  }`;

  const note = `FetalEchoAssist™ Note: The Fetal Cardiovascular Profile Score (CVPS) is a 10-point scoring system (2 points per domain). Each domain scored 0, 1, or 2. Scores ≤6 are associated with significantly increased perinatal mortality (ASE 2023). Domains: Hydrops (0=generalized, 1=isolated effusion, 2=absent), Venous Doppler (0=UV pulsations/reversed DV a-wave, 1=absent DV a-wave, 2=normal), Heart Size (0=CTR>0.50, 1=CTR 0.35-0.50, 2=normal), Cardiac Function (0=severe dysfunction, 1=moderate, 2=normal), Arterial Doppler (0=absent/reversed UA EDF, 1=elevated UA PI, 2=normal).`;

  const tip = "FetalEchoAssist™ Tip: The CVPS should be integrated with biophysical profile (BPP) scoring. A CVPS ≤6 with BPP ≤6 is a strong indicator for delivery if gestational age permits. Serial CVPS every 1–2 weeks is recommended in high-risk pregnancies.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Hydrops", value: hydrops, set: setHydrops, options: [["2","Absent (Normal)"],["1","Isolated effusion"],["0","Generalized hydrops"]] },
          { label: "Venous Doppler (DV/UV)", value: venousDoppler, set: setVenousDoppler, options: [["2","Normal DV a-wave"],["1","Absent DV a-wave"],["0","Reversed DV a-wave / UV pulsations"]] },
          { label: "Heart Size (CTR)", value: heartSize, set: setHeartSize, options: [["2","Normal (≤0.35)"],["1","Mildly enlarged (0.35–0.50)"],["0","Severely enlarged (>0.50)"]] },
          { label: "Cardiac Function", value: cardiacFunction, set: setCardiacFunction, options: [["2","Normal biventricular function"],["1","Moderate dysfunction / mild TR or MR"],["0","Severe dysfunction / severe AV regurgitation"]] },
          { label: "Arterial Doppler (UA)", value: arterialDoppler, set: setArterialDoppler, options: [["2","Normal UA S/D ratio"],["1","Elevated UA PI (absent EDF)"],["0","Reversed UA end-diastolic flow"]] },
        ].map(({ label, value, set, options }) => (
          <div key={label}>
            <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
            <select
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            >
              {options.map(([v, l]) => <option key={v} value={v}>{l} ({v} pts)</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <MetricBadge label="CVPS Total" value={`${total}/10`} normal={total >= 8} />
        <MetricBadge label="Interpretation" value={severity} normal={total === 10} />
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${total * 10}%`, background: color }} />
      </div>
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Huhta JC. Fetal Cardiovascular Profile Score. Ultrasound Obstet Gynecol. 2005. | ASE 2023 Fetal Echo Guidelines</p>
    </div>
  );
}

// ─── 3. Cardiothoracic Ratio (CTR) ───────────────────────────────────────────
function CardiothoracicRatio() {
  const [mode, setMode] = useState<"diameter"|"circumference">("diameter");
  const [cardiac, setCardiac] = useState("");
  const [thoracic, setThoracic] = useState("");

  const c = parseFloat(cardiac);
  const t = parseFloat(thoracic);
  const valid = c > 0 && t > 0 && t > c;
  const ctr = valid ? c / t : null;
  const normal = ctr !== null ? ctr <= 0.50 : null;

  const severity = ctr === null ? null
    : ctr <= 0.50 ? "Normal"
    : ctr <= 0.55 ? "Mildly Enlarged"
    : ctr <= 0.65 ? "Moderately Enlarged"
    : "Severely Enlarged";

  const suggests = ctr !== null
    ? `FetalEchoAssist™ Suggests: CTR = ${ctr.toFixed(2)} (${mode === "diameter" ? "diameter" : "circumference"} method). ${severity}. ${
        normal ? "Cardiac size is within normal limits (CTR ≤0.50). No cardiomegaly detected."
        : `Elevated CTR of ${ctr.toFixed(2)} suggests cardiomegaly. Evaluate for structural CHD, AV valve regurgitation, arrhythmia, fetal anemia, or high-output cardiac state.`
      }`
    : undefined;

  const note = ctr !== null
    ? `FetalEchoAssist™ Note: Normal CTR (cardiac/thoracic ${mode}) is ≤0.50 throughout gestation (ASE 2023). The CTR is measured on the 4-chamber view at end-diastole. A CTR >0.50 is the standard threshold for cardiomegaly in fetal echo. The Celermajer Index (area method) is more precise but the diameter/circumference CTR is widely used clinically.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure at the widest transverse diameter of the cardiac silhouette (including pericardium). Ensure the image is at the level of the 4-chamber view with the spine posterior. Avoid oblique cuts which falsely elevate the CTR.";

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 mb-2">
        {(["diameter","circumference"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${mode === m ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
            style={mode === m ? { background: BRAND } : {}}
          >
            {m === "diameter" ? "Diameter Method" : "Circumference Method"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputRow label={`Cardiac ${mode === "diameter" ? "Diameter" : "Circumference"}`} unit="cm" value={cardiac} onChange={setCardiac} placeholder="e.g. 3.2" />
        <InputRow label={`Thoracic ${mode === "diameter" ? "Diameter" : "Circumference"}`} unit="cm" value={thoracic} onChange={setThoracic} placeholder="e.g. 6.8" />
      </div>
      {ctr !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="CTR" value={ctr.toFixed(2)} normal={normal} />
          <MetricBadge label="Interpretation" value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: ASE 2023 Fetal Echo Guidelines (Donofrio et al. JASE 2024;37:1-75). Normal CTR ≤0.50.</p>
    </div>
  );
}

// ─── 4. Tei Index (MPI) — Fetal ──────────────────────────────────────────────
function FetalTeiIndex() {
  const [chamber, setChamber] = useState<"LV"|"RV">("RV");
  const [ict, setIct] = useState("");
  const [irt, setIrt] = useState("");
  const [et, setEt] = useState("");

  const i = parseFloat(ict);
  const r = parseFloat(irt);
  const e = parseFloat(et);
  const valid = i > 0 && r > 0 && e > 0;
  const mpi = valid ? (i + r) / e : null;

  // ASE 2023 / published fetal nomograms: RV MPI normal <0.55, LV MPI normal <0.53
  const normalThreshold = chamber === "RV" ? 0.55 : 0.53;
  const normal = mpi !== null ? mpi <= normalThreshold : null;

  const severity = mpi === null ? null
    : mpi <= normalThreshold ? "Normal"
    : mpi <= normalThreshold + 0.10 ? "Mildly Elevated"
    : mpi <= normalThreshold + 0.20 ? "Moderately Elevated"
    : "Severely Elevated";

  const suggests = mpi !== null
    ? `FetalEchoAssist™ Suggests: ${chamber} Tei Index (MPI) = ${mpi.toFixed(2)}. ${severity}. Normal reference: ${chamber} MPI ≤${normalThreshold} (ASE 2023). ${
        normal ? `${chamber} global myocardial performance is within normal limits. No evidence of global ventricular dysfunction.`
        : `Elevated ${chamber} MPI indicates global myocardial dysfunction (combined systolic and diastolic impairment). Evaluate for structural CHD, cardiomyopathy, fetal infection (CMV, parvovirus), or metabolic disorder.`
      }`
    : undefined;

  const note = mpi !== null
    ? `FetalEchoAssist™ Note: The Tei Index (Myocardial Performance Index) = (ICT + IRT) / ET. It is load-independent and reflects global ventricular function. Measured by pulsed-wave Doppler at the AV inflow/outflow. Fetal reference values: RV MPI <0.55, LV MPI <0.53 (Tsutsumi et al., Hernandez-Andrade et al.). Tissue Doppler-derived MPI has slightly different reference ranges.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure ICT (isovolumetric contraction time) and IRT (isovolumetric relaxation time) from AV valve closure to opening intervals. ET (ejection time) is measured from outflow valve opening to closure. Ensure the Doppler sample volume captures both inflow and outflow signals on the same cardiac cycle for accuracy.";

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 mb-2">
        {(["RV","LV"] as const).map((c) => (
          <button key={c} onClick={() => setChamber(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${chamber === c ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
            style={chamber === c ? { background: BRAND } : {}}
          >
            {c} Tei Index
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputRow label="ICT" unit="ms" value={ict} onChange={setIct} placeholder="e.g. 42" hint="Isovolumetric contraction time" />
        <InputRow label="IRT" unit="ms" value={irt} onChange={setIrt} placeholder="e.g. 38" hint="Isovolumetric relaxation time" />
        <InputRow label="ET" unit="ms" value={et} onChange={setEt} placeholder="e.g. 145" hint="Ejection time" />
      </div>
      {mpi !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label={`${chamber} MPI`} value={mpi.toFixed(2)} normal={normal} />
          <MetricBadge label={`Normal ≤${normalThreshold}`} value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Tsutsumi T et al. Ultrasound Obstet Gynecol. 1999. | Hernandez-Andrade E et al. Ultrasound Obstet Gynecol. 2005. | ASE 2023 Fetal Echo Guidelines</p>
    </div>
  );
}

// ─── 5. E/A Ratio (AV Inflow) ────────────────────────────────────────────────
function EARatioCalculator() {
  const [valve, setValve] = useState<"Mitral"|"Tricuspid">("Tricuspid");
  const [eWave, setEWave] = useState("");
  const [aWave, setAWave] = useState("");
  const [ga, setGa] = useState("");

  const e = parseFloat(eWave);
  const a = parseFloat(aWave);
  const g = parseFloat(ga);
  const valid = e > 0 && a > 0;
  const ratio = valid ? e / a : null;

  // ASE 2023: E/A normally <1 in fetal life (atrial kick dominant), approaches 1 near term
  // E/A >1 after 20 wks suggests diastolic dysfunction or elevated filling pressures
  const normalEA = ratio !== null ? ratio < 1.0 : null;
  const aWaveDominant = ratio !== null ? ratio < 1.0 : null;

  const suggests = ratio !== null
    ? `FetalEchoAssist™ Suggests: ${valve} E/A ratio = ${ratio.toFixed(2)}. ${
        aWaveDominant ? `A-wave dominant pattern (E/A <1.0) — normal fetal diastolic filling pattern. The fetal myocardium is relatively non-compliant; atrial contraction (A-wave) dominates throughout most of gestation.`
        : `E/A ratio ≥1.0 — E-wave dominant or equalization. ${g > 0 && g < 20 ? "Before 20 weeks, E/A ≥1.0 may indicate early diastolic dysfunction." : "E/A ≥1.0 after 20 weeks suggests elevated atrial filling pressures, diastolic dysfunction, or myocardial disease. Evaluate for cardiomyopathy, structural CHD, or fetal compromise."}`
      }`
    : undefined;

  const note = ratio !== null
    ? `FetalEchoAssist™ Note: Normal fetal E/A ratio is <1.0 throughout gestation (A-wave dominant). The E/A ratio increases with advancing gestational age, approaching but not exceeding 1.0 at term in normal fetuses. E/A >1.0 is abnormal at any gestational age and suggests impaired myocardial relaxation or elevated filling pressures (ASE 2023). Measure peak velocities with PW Doppler at the AV valve tips on the 4-chamber view.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Ensure the Doppler beam is parallel to inflow direction. Measure E and A peak velocities at the AV valve tips. Avoid measuring during fetal movement or irregular rhythm. The tricuspid valve E/A is typically slightly lower than the mitral valve E/A in normal fetuses.";

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 mb-2">
        {(["Tricuspid","Mitral"] as const).map((v) => (
          <button key={v} onClick={() => setValve(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${valve === v ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
            style={valve === v ? { background: BRAND } : {}}
          >
            {v} Valve
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <InputRow label="E Wave" unit="cm/s" value={eWave} onChange={setEWave} placeholder="e.g. 38" hint="Early passive filling" />
        <InputRow label="A Wave" unit="cm/s" value={aWave} onChange={setAWave} placeholder="e.g. 52" hint="Atrial contraction" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 28" hint="Optional context" />
      </div>
      {ratio !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="E/A Ratio" value={ratio.toFixed(2)} normal={aWaveDominant} />
          <MetricBadge label="Pattern" value={aWaveDominant ? "A-dominant (Normal)" : "E-dominant / Equal (Abnormal)"} normal={aWaveDominant} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Respondek M et al. Ultrasound Obstet Gynecol. 1994. | ASE 2023 Fetal Echo Guidelines (Donofrio et al. JASE 2024;37:1-75)</p>
    </div>
  );
}

// ─── 6. Ductus Venosus PIV ───────────────────────────────────────────────────
function DuctusVenosusPIV() {
  const [sWave, setSWave] = useState("");
  const [dWave, setDWave] = useState("");
  const [aWave, setAWave] = useState("");
  const [meanVel, setMeanVel] = useState("");
  const [ga, setGa] = useState("");

  const s = parseFloat(sWave);
  const d = parseFloat(dWave);
  const a = parseFloat(aWave);
  const vm = parseFloat(meanVel);
  const g = parseFloat(ga);

  // PIV = (S - a) / mean velocity
  const validPIV = s > 0 && a > 0 && vm > 0;
  const piv = validPIV ? (s - a) / vm : null;

  // Normal DV PIV <0.7 (varies slightly with GA; higher in early gestation)
  const normalPIV = piv !== null ? piv < 0.7 : null;

  // Also check for reversed a-wave (a < 0)
  const reversedAWave = a < 0;

  const suggests = piv !== null
    ? `FetalEchoAssist™ Suggests: DV PIV = ${piv.toFixed(2)}. ${
        reversedAWave ? "REVERSED DV a-wave detected — this is a critical finding indicating severe fetal cardiovascular compromise and is a CVPS score of 0 for this domain. Immediate multidisciplinary evaluation is required."
        : piv < 0.7 ? "Normal ductus venosus PIV. No evidence of venous congestion or right heart compromise."
        : piv < 1.0 ? "Mildly elevated DV PIV. Suggests early venous congestion or right heart pressure elevation. Increase surveillance frequency and correlate with UA Doppler and biophysical profile."
        : "Significantly elevated DV PIV. Indicates venous congestion and fetal cardiovascular compromise. Absent DV a-wave is associated with high risk of fetal demise. Multidisciplinary fetal medicine consultation required."
      }`
    : undefined;

  const note = piv !== null
    ? `FetalEchoAssist™ Note: Ductus Venosus PIV = (S − a) / mean velocity. Normal DV PIV <0.7 (ASE 2023). The DV a-wave reflects right atrial pressure — absent or reversed a-wave indicates severely elevated RA pressure and is a key marker of fetal compromise. DV Doppler is a critical component of the CVPS scoring system.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Obtain DV Doppler with the sample volume in the ductus venosus isthmus (narrow segment between umbilical vein and IVC). Use color Doppler to identify the characteristic aliasing at the DV inlet. Angle correction <30°. Measure at least 3 consecutive waveforms and average.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputRow label="S-wave" unit="cm/s" value={sWave} onChange={setSWave} placeholder="e.g. 65" hint="Systolic peak" />
        <InputRow label="D-wave" unit="cm/s" value={dWave} onChange={setDWave} placeholder="e.g. 45" hint="Diastolic peak" />
        <InputRow label="a-wave" unit="cm/s" value={aWave} onChange={setAWave} placeholder="e.g. 22" hint="Atrial contraction (negative if reversed)" />
        <InputRow label="Mean Velocity" unit="cm/s" value={meanVel} onChange={setMeanVel} placeholder="e.g. 40" hint="Time-averaged mean" />
      </div>
      <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 30" hint="Optional context" />
      {piv !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="DV PIV" value={piv.toFixed(2)} normal={normalPIV} />
          {reversedAWave && <MetricBadge label="a-wave" value="REVERSED ⚠️" normal={false} />}
          <MetricBadge label="Status" value={piv < 0.7 ? "Normal" : piv < 1.0 ? "Mildly Elevated" : "Significantly Elevated"} normal={normalPIV} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Hecher K et al. Ultrasound Obstet Gynecol. 1995. | ASE 2023 Fetal Echo Guidelines. Normal DV PIV &lt;0.7.</p>
    </div>
  );
}

// ─── 7. Umbilical Artery S/D Ratio & PI ──────────────────────────────────────
function UmbilicalArteryDoppler() {
  const [sVel, setSVel] = useState("");
  const [dVel, setDVel] = useState("");
  const [meanVel, setMeanVel] = useState("");
  const [ga, setGa] = useState("");

  const s = parseFloat(sVel);
  const d = parseFloat(dVel);
  const vm = parseFloat(meanVel);
  const g = parseFloat(ga);

  const validSD = s > 0 && d > 0;
  const validPI = s > 0 && vm > 0;
  const sdRatio = validSD ? s / d : null;
  const pi = validPI ? (s - d) / vm : null;

  // GA-based normal S/D: decreases with advancing GA
  // At 20 wks: ~4.0, 28 wks: ~3.0, 36 wks: ~2.3
  const normalSD = sdRatio !== null && g > 0
    ? g >= 36 ? sdRatio <= 2.3 : g >= 28 ? sdRatio <= 3.0 : sdRatio <= 4.0
    : sdRatio !== null ? sdRatio <= 3.0 : null;

  const absentEDF = d <= 0;
  const reversedEDF = d < 0;

  const severity = sdRatio === null ? null
    : reversedEDF ? "Reversed EDF — Critical"
    : absentEDF ? "Absent EDF — Critical"
    : normalSD ? "Normal"
    : sdRatio > (g >= 36 ? 2.3 : g >= 28 ? 3.0 : 4.0) * 1.5 ? "Severely Elevated"
    : "Elevated";

  const suggests = sdRatio !== null
    ? `FetalEchoAssist™ Suggests: UA S/D = ${sdRatio.toFixed(2)}${pi !== null ? `, UA PI = ${pi.toFixed(2)}` : ""}. ${severity}. ${
        reversedEDF ? "REVERSED end-diastolic flow is a critical finding indicating severe placental resistance and fetal compromise. Immediate delivery planning is required in viable gestations. CVPS arterial domain = 0."
        : absentEDF ? "ABSENT end-diastolic flow indicates critically elevated placental resistance. High risk of fetal acidemia and demise. Urgent delivery planning required. CVPS arterial domain = 1."
        : normalSD ? "Umbilical artery Doppler is within normal limits for gestational age. Placental resistance is appropriate."
        : "Elevated UA S/D ratio indicates increased placental resistance consistent with uteroplacental insufficiency. Increase surveillance. Correlate with MCA Doppler, DV Doppler, and biophysical profile."
      }`
    : undefined;

  const note = sdRatio !== null
    ? `FetalEchoAssist™ Note: Normal UA S/D ratio decreases with advancing gestational age (reflects decreasing placental resistance): ~4.0 at 20 wks, ~3.0 at 28 wks, ~2.3 at 36 wks. Absent end-diastolic flow (AEDF) and reversed EDF (REDF) are critical findings associated with severe IUGR and high perinatal mortality (ASE 2023). UA Doppler is a key component of the CVPS arterial domain.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure UA Doppler in a free loop of cord (not at placental or fetal insertion). Use a low wall filter (50–100 Hz). Ensure the fetus is not breathing or moving. Average at least 3 consecutive waveforms. If EDF is absent, confirm with multiple measurements and report immediately.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputRow label="S (Systolic)" unit="cm/s" value={sVel} onChange={setSVel} placeholder="e.g. 55" />
        <InputRow label="D (End-Diastolic)" unit="cm/s" value={dVel} onChange={setDVel} placeholder="e.g. 20" hint="Enter 0 for absent, negative for reversed" />
        <InputRow label="Mean Velocity" unit="cm/s" value={meanVel} onChange={setMeanVel} placeholder="e.g. 32" hint="For PI calculation" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 32" />
      </div>
      {sdRatio !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="UA S/D Ratio" value={sdRatio.toFixed(2)} normal={normalSD} />
          {pi !== null && <MetricBadge label="UA PI" value={pi.toFixed(2)} normal={pi < 1.5} />}
          <MetricBadge label="EDF Status" value={reversedEDF ? "Reversed ⚠️" : absentEDF ? "Absent ⚠️" : "Present"} normal={!absentEDF && !reversedEDF} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Gudmundsson S et al. Lancet. 1991. | ASE 2023 Fetal Echo Guidelines. GA-adjusted normal ranges applied.</p>
    </div>
  );
}

// ─── 8. MCA PSV (MoM) ────────────────────────────────────────────────────────
function MCAPSVCalculator() {
  const [mcaPSV, setMcaPSV] = useState("");
  const [ga, setGa] = useState("");

  const psv = parseFloat(mcaPSV);
  const g = parseFloat(ga);

  // Mari nomogram: MCA PSV median (cm/s) ≈ 1.29 × GA - 1.5 (simplified)
  // More accurate: median at 20wk=25, 24wk=31, 28wk=38, 32wk=46, 36wk=55, 40wk=65
  const medianTable: [number, number][] = [
    [18,22],[20,25],[22,28],[24,31],[26,34],[28,38],[30,42],[32,46],[34,50],[36,55],[38,60],[40,65]
  ];
  const getMedian = (gaWks: number) => {
    const sorted = medianTable.sort((a,b) => a[0]-b[0]);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (gaWks >= sorted[i][0] && gaWks <= sorted[i+1][0]) {
        const frac = (gaWks - sorted[i][0]) / (sorted[i+1][0] - sorted[i][0]);
        return sorted[i][1] + frac * (sorted[i+1][1] - sorted[i][1]);
      }
    }
    return sorted[sorted.length - 1][1];
  };

  const valid = psv > 0 && g >= 18 && g <= 40;
  const median = valid ? getMedian(g) : null;
  const mom = median && psv > 0 ? psv / median : null;
  const anemic = mom !== null ? mom >= 1.5 : null;

  const severity = mom === null ? null
    : mom < 1.0 ? "Below Median — Unlikely Anemia"
    : mom < 1.29 ? "Normal (1.0–1.29 MoM)"
    : mom < 1.5 ? "Borderline (1.29–1.50 MoM)"
    : mom < 1.8 ? "Moderate Anemia (1.50–1.80 MoM)"
    : "Severe Anemia (>1.80 MoM)";

  const suggests = mom !== null
    ? `FetalEchoAssist™ Suggests: MCA PSV = ${psv} cm/s at ${g} weeks. MoM = ${mom.toFixed(2)}. ${severity}. ${
        !anemic ? "MCA PSV is below the 1.5 MoM threshold. Fetal anemia is unlikely. Continue routine surveillance."
        : mom < 1.8 ? "MCA PSV ≥1.5 MoM is the standard threshold for significant fetal anemia. Fetal blood sampling (cordocentesis) or intrauterine transfusion should be discussed with fetal medicine specialists."
        : "MCA PSV >1.8 MoM indicates severe fetal anemia. Urgent fetal medicine consultation and likely intrauterine transfusion are required."
      }`
    : undefined;

  const note = mom !== null
    ? `FetalEchoAssist™ Note: MCA PSV ≥1.5 MoM has 100% sensitivity for moderate-to-severe fetal anemia (Hgb <7 g/dL) with <12% false-positive rate (Mari et al. NEJM 2000). The MCA PSV increases with fetal anemia due to increased cardiac output and decreased blood viscosity. This replaces amniocentesis (ΔOD450) for non-invasive anemia screening. Causes: Rh/Kell alloimmunization, parvovirus B19, fetal hemorrhage, twin-twin transfusion.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure MCA PSV at the proximal third of the MCA (near the Circle of Willis origin) using a 0° angle of insonation. Avoid fetal breathing or movement. Do NOT angle-correct. Use the highest reproducible PSV from 3 measurements. This is the most important non-invasive fetal anemia screening tool.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputRow label="MCA PSV" unit="cm/s" value={mcaPSV} onChange={setMcaPSV} placeholder="e.g. 58" hint="Peak systolic velocity, proximal MCA" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 28" hint="18–40 weeks" />
      </div>
      {mom !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="MCA PSV" value={`${psv} cm/s`} normal={!anemic} />
          <MetricBadge label="Median at GA" value={`${median?.toFixed(1)} cm/s`} normal={null} />
          <MetricBadge label="MoM" value={mom.toFixed(2)} normal={!anemic} />
          <MetricBadge label="Interpretation" value={severity!} normal={!anemic} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Mari G et al. N Engl J Med. 2000;342:9-14. | ASE 2023 Fetal Echo Guidelines. Threshold: ≥1.5 MoM.</p>
    </div>
  );
}

// ─── 9. Fetal Heart Rate Z-score ─────────────────────────────────────────────
function FetalHRZScore() {
  const [fhr, setFhr] = useState("");
  const [ga, setGa] = useState("");

  const hr = parseFloat(fhr);
  const g = parseFloat(ga);
  const valid = hr > 0 && g >= 10;

  // ASE 2023 / published norms: FHR 120–160 bpm throughout most of gestation
  // Early gestation (10–14 wks): up to 170 bpm normal
  const lowerNormal = g <= 14 ? 110 : 120;
  const upperNormal = g <= 14 ? 170 : 160;

  const normal = valid ? hr >= lowerNormal && hr <= upperNormal : null;

  const classification = !valid ? null
    : hr < 100 ? "Severe Bradycardia (<100 bpm)"
    : hr < lowerNormal ? "Bradycardia"
    : hr > 200 ? "Severe Tachycardia (>200 bpm — SVT/VT)"
    : hr > 180 ? "Tachycardia (>180 bpm)"
    : hr > upperNormal ? "Mild Tachycardia"
    : "Normal";

  const suggests = valid
    ? `FetalEchoAssist™ Suggests: FHR = ${hr} bpm at ${g} weeks. ${classification}. Normal range at this GA: ${lowerNormal}–${upperNormal} bpm. ${
        normal ? "Fetal heart rate is within normal limits. No arrhythmia detected."
        : hr < lowerNormal ? `Fetal bradycardia detected. ${hr < 100 ? "Severe bradycardia (<100 bpm) requires urgent evaluation for complete heart block (anti-Ro/La antibodies, structural CHD with AV discordance), severe fetal compromise, or umbilical cord compression." : "Evaluate for sinus bradycardia, blocked PACs, or 2:1 AV block. Obtain M-mode and Doppler to characterize rhythm."}`
        : `Fetal tachycardia detected. ${hr > 200 ? "Rate >200 bpm is consistent with SVT (typically 220–300 bpm) or atrial flutter (typically 300–500 bpm with variable block). Urgent fetal cardiology consultation required for antiarrhythmic therapy planning." : "Evaluate for sinus tachycardia (fetal distress, maternal fever/medications) vs. SVT. Obtain M-mode and simultaneous atrial/ventricular Doppler to characterize mechanism."}`
      }`
    : undefined;

  const note = valid
    ? `FetalEchoAssist™ Note: Normal FHR is 120–160 bpm after 14 weeks (ASE 2023). Irregular rhythm is most commonly due to premature atrial contractions (PACs), which are benign in >95% of cases. Sustained tachycardia >200 bpm requires urgent evaluation — SVT and atrial flutter can cause hydrops fetalis within 24–48 hours. Complete heart block (FHR 40–80 bpm) requires evaluation for anti-Ro/La antibodies and structural CHD.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: For rhythm characterization, use M-mode through both an atrial wall and ventricular wall simultaneously, or use simultaneous PW Doppler of mitral inflow (atrial activity) and aortic outflow (ventricular activity). This allows determination of AV relationship and diagnosis of specific arrhythmias.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputRow label="Fetal Heart Rate" unit="bpm" value={fhr} onChange={setFhr} placeholder="e.g. 145" hint="Measured over ≥10 seconds" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 24" hint="10–40 weeks" />
      </div>
      {valid && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="FHR" value={`${hr} bpm`} normal={normal} />
          <MetricBadge label={`Normal: ${lowerNormal}–${upperNormal} bpm`} value={classification!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: ASE 2023 Fetal Echo Guidelines (Donofrio et al. JASE 2024;37:1-75). Normal FHR 120–160 bpm (&gt;14 wks).</p>
    </div>
  );
}

// ─── 10. PA/Ao Ratio ─────────────────────────────────────────────────────────
function PAAoRatio() {
  const [pa, setPa] = useState("");
  const [ao, setAo] = useState("");
  const [ga, setGa] = useState("");

  const p = parseFloat(pa);
  const a = parseFloat(ao);
  const g = parseFloat(ga);
  const valid = p > 0 && a > 0;
  const ratio = valid ? p / a : null;

  // Normal PA/Ao ratio: ~1.0–1.2 (PA slightly larger than Ao in fetal life due to right heart dominance)
  // PA/Ao <0.7 suggests pulmonary stenosis/atresia or HLHS
  // PA/Ao >1.5 suggests aortic stenosis/HLHS or CoA
  const normal = ratio !== null ? ratio >= 0.7 && ratio <= 1.5 : null;

  const severity = ratio === null ? null
    : ratio < 0.5 ? "Severely Reduced — Possible PS/PA or HLHS"
    : ratio < 0.7 ? "Reduced — Possible Pulmonary Stenosis"
    : ratio <= 1.5 ? "Normal (0.7–1.5)"
    : ratio <= 2.0 ? "Elevated — Possible AS or CoA"
    : "Severely Elevated — Possible Severe AS/HLHS";

  const suggests = ratio !== null
    ? `FetalEchoAssist™ Suggests: PA/Ao ratio = ${ratio.toFixed(2)}. ${severity}. ${
        normal ? "PA/Ao ratio is within normal limits. No significant outflow tract disproportion detected. In normal fetal circulation, the PA is slightly larger than the Ao due to right heart dominance."
        : ratio < 0.7 ? "Reduced PA/Ao ratio suggests relative pulmonary outflow hypoplasia. Evaluate for pulmonary stenosis, pulmonary atresia, tetralogy of Fallot, or right heart hypoplasia. Correlate with 3-vessel-trachea view and RVOT Doppler."
        : "Elevated PA/Ao ratio suggests relative aortic outflow hypoplasia. Evaluate for aortic stenosis, hypoplastic left heart syndrome (HLHS), or coarctation of the aorta. Correlate with aortic arch view and isthmus flow."
      }`
    : undefined;

  const note = ratio !== null
    ? `FetalEchoAssist™ Note: Normal fetal PA/Ao ratio is approximately 1.0–1.2 (PA slightly larger than Ao due to right-dominant fetal circulation). The ratio is measured at the level of the semilunar valve annuli on the 3-vessel view or LVOT/RVOT views. Significant disproportion (ratio <0.7 or >1.5) warrants detailed evaluation for conotruncal abnormalities (ASE 2023).`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure PA and Ao at the semilunar valve annulus level (inner edge to inner edge) at end-diastole. Use the 3-vessel view for PA and the LVOT view for Ao. Ensure measurements are taken at the same cardiac cycle. Disproportion >20% between PA and Ao should prompt detailed evaluation.";

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <InputRow label="Pulmonary Artery (PA)" unit="mm" value={pa} onChange={setPa} placeholder="e.g. 5.2" hint="At semilunar valve annulus" />
        <InputRow label="Aorta (Ao)" unit="mm" value={ao} onChange={setAo} placeholder="e.g. 4.8" hint="At semilunar valve annulus" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 24" hint="Optional" />
      </div>
      {ratio !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label="PA/Ao Ratio" value={ratio.toFixed(2)} normal={normal} />
          <MetricBadge label="Interpretation" value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: ASE 2023 Fetal Echo Guidelines. Normal PA/Ao ratio 0.7–1.5. PA slightly larger than Ao in normal fetal circulation.</p>
    </div>
  );
}

// ─── 11. Ventricular Wall Thickness Z-score ───────────────────────────────────
function VentricularWallThickness() {
  const [chamber, setChamber] = useState<"IVS"|"LVPW"|"RVW">("IVS");
  const [thickness, setThickness] = useState("");
  const [ga, setGa] = useState("");

  const t = parseFloat(thickness);
  const g = parseFloat(ga);
  const valid = t > 0 && g >= 18 && g <= 40;

  // Simplified GA-based nomograms (Schneider C et al., Messing B et al.)
  // IVS/LVPW mean (mm) ≈ 0.14 × GA - 0.8; SD ≈ 0.5 mm
  // RVW mean ≈ 0.12 × GA - 0.6; SD ≈ 0.4 mm
  const getMean = () => {
    if (chamber === "RVW") return 0.12 * g - 0.6;
    return 0.14 * g - 0.8;
  };
  const getSD = () => chamber === "RVW" ? 0.4 : 0.5;

  const mean = valid ? getMean() : null;
  const sd = valid ? getSD() : null;
  const zscore = mean !== null && sd !== null ? (t - mean) / sd : null;
  const normal = zscore !== null ? zscore >= -2 && zscore <= 2 : null;

  const severity = zscore === null ? null
    : zscore > 4 ? "Severely Hypertrophied (Z >+4)"
    : zscore > 2 ? "Hypertrophied (Z >+2)"
    : zscore >= -2 ? "Normal (Z −2 to +2)"
    : zscore >= -4 ? "Thin (Z <−2)"
    : "Severely Thin (Z <−4)";

  const suggests = zscore !== null
    ? `FetalEchoAssist™ Suggests: ${chamber} thickness = ${t} mm at ${g} weeks. Z-score = ${zscore.toFixed(1)}. ${severity}. ${
        normal ? `${chamber} thickness is within the normal range for gestational age. No evidence of hypertrophy or hypoplasia.`
        : zscore > 2 ? `Increased ${chamber} thickness (Z = ${zscore.toFixed(1)}). Evaluate for fetal hypertrophic cardiomyopathy — causes include maternal diabetes (most common), Noonan syndrome, Pompe disease, Barth syndrome, and metabolic cardiomyopathies. Correlate with outflow tract obstruction and diastolic function.`
        : `Reduced ${chamber} thickness (Z = ${zscore.toFixed(1)}). Evaluate for dilated cardiomyopathy, myocarditis, or structural CHD with ventricular hypoplasia.`
      }`
    : undefined;

  const note = zscore !== null
    ? `FetalEchoAssist™ Note: Ventricular wall thickness increases linearly with gestational age. Z-scores >+2 suggest hypertrophy; the most common cause is maternal diabetes mellitus (diabetic cardiomyopathy), occurring in up to 30% of infants of diabetic mothers. Symmetric hypertrophy with outflow obstruction suggests obstructive hypertrophic cardiomyopathy. Asymmetric septal hypertrophy (IVS/LVPW >1.3) is a key diagnostic criterion (ASE 2023).`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure wall thickness at end-diastole on M-mode or 2D from the parasternal long-axis equivalent. Measure IVS at the level of the mitral valve tips. Avoid papillary muscles. In diabetic cardiomyopathy, the IVS is typically more affected than the LVPW, and the ratio IVS/LVPW >1.3 is significant.";

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 mb-2 flex-wrap">
        {(["IVS","LVPW","RVW"] as const).map((c) => (
          <button key={c} onClick={() => setChamber(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${chamber === c ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
            style={chamber === c ? { background: BRAND } : {}}
          >
            {c === "IVS" ? "IVS" : c === "LVPW" ? "LV Posterior Wall" : "RV Free Wall"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputRow label={`${chamber} Thickness`} unit="mm" value={thickness} onChange={setThickness} placeholder="e.g. 3.2" hint="At end-diastole" />
        <InputRow label="Gestational Age" unit="weeks" value={ga} onChange={setGa} placeholder="e.g. 28" hint="18–40 weeks" />
      </div>
      {zscore !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label={`${chamber} (mm)`} value={`${t} mm`} normal={normal} />
          <MetricBadge label="Z-score" value={zscore.toFixed(1)} normal={normal} />
          <MetricBadge label="Interpretation" value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: Schneider C et al. Ultrasound Obstet Gynecol. 2005. | Messing B et al. Ultrasound Obstet Gynecol. 2011. | ASE 2023 Fetal Echo Guidelines</p>
    </div>
  );
}

// ─── 12. Shortening Fraction (SF) — Fetal ────────────────────────────────────
function FetalSF() {
  const [chamber, setChamber] = useState<"LV"|"RV">("LV");
  const [edd, setEdd] = useState("");
  const [esd, setEsd] = useState("");

  const d = parseFloat(edd);
  const s = parseFloat(esd);
  const valid = d > 0 && s > 0 && d > s;
  const sf = valid ? ((d - s) / d) * 100 : null;

  // Normal fetal SF: 28–40% (LV and RV similar in fetal life)
  const normal = sf !== null ? sf >= 28 && sf <= 40 : null;

  const severity = sf === null ? null
    : sf < 18 ? "Severely Reduced (<18%)"
    : sf < 28 ? "Reduced (18–28%)"
    : sf <= 40 ? "Normal (28–40%)"
    : sf <= 50 ? "Hyperdynamic (40–50%)"
    : "Severely Hyperdynamic (>50%)";

  const suggests = sf !== null
    ? `FetalEchoAssist™ Suggests: ${chamber} Shortening Fraction = ${sf.toFixed(1)}%. ${severity}. ${
        normal ? `${chamber} systolic function is within normal limits. No evidence of systolic dysfunction or hyperdynamic state.`
        : sf < 28 ? `Reduced ${chamber} SF indicates systolic dysfunction. Evaluate for cardiomyopathy, myocarditis (parvovirus B19, CMV, enterovirus), structural CHD with pressure/volume overload, or severe fetal compromise. Correlate with Tei Index and CVPS.`
        : `Hyperdynamic ${chamber} function (SF >40%). Evaluate for fetal anemia (high-output state), AV fistula, sacrococcygeal teratoma, or twin-twin transfusion syndrome (recipient twin).`
      }`
    : undefined;

  const note = sf !== null
    ? `FetalEchoAssist™ Note: Normal fetal ventricular shortening fraction is 28–40% for both LV and RV (ASE 2023). Unlike postnatal life, the fetal RV and LV have similar SF values due to the parallel fetal circulation. SF <28% indicates systolic dysfunction; SF >40% suggests a hyperdynamic state. M-mode measurement at the level of the mitral/tricuspid valve tips (chordal level) is the standard approach.`
    : undefined;

  const tip = "FetalEchoAssist™ Tip: Measure EDD and ESD on M-mode at the level of the AV valve tips (chordal level), perpendicular to the interventricular septum. Avoid the papillary muscle level. In the fetal RV, the anterior wall and IVS are used. Ensure the M-mode cursor is perpendicular to the ventricular walls for accurate measurements.";

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 mb-2">
        {(["LV","RV"] as const).map((c) => (
          <button key={c} onClick={() => setChamber(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${chamber === c ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600"}`}
            style={chamber === c ? { background: BRAND } : {}}
          >
            {c} Shortening Fraction
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputRow label={`${chamber} EDD`} unit="mm" value={edd} onChange={setEdd} placeholder="e.g. 18.4" hint="End-diastolic dimension" />
        <InputRow label={`${chamber} ESD`} unit="mm" value={esd} onChange={setEsd} placeholder="e.g. 11.2" hint="End-systolic dimension" />
      </div>
      {sf !== null && (
        <div className="flex gap-3 flex-wrap">
          <MetricBadge label={`${chamber} SF`} value={`${sf.toFixed(1)}%`} normal={normal} />
          <MetricBadge label="Normal: 28–40%" value={severity!} normal={normal} />
        </div>
      )}
      <ResultPanel suggests={suggests} note={note} tip={tip} />
      <p className="text-[10px] text-gray-400">Reference: ASE 2023 Fetal Echo Guidelines (Donofrio et al. JASE 2024;37:1-75). Normal fetal SF 28–40%.</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FetalEchoAssist() {
  const search = useSearch();

  useEffect(() => {
    const engine = new URLSearchParams(search).get("engine");
    if (engine) {
      setTimeout(() => {
        const el = document.getElementById(engine);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [search]);

  const engines = [
    { id: "engine-celermajer", title: "Celermajer Index", badge: "Cardiomegaly", color: BRAND, component: <CelermajerIndex /> },
    { id: "engine-cvps", title: "Fetal Cardiovascular Profile Score (CVPS)", badge: "Global Assessment", color: "#dc2626", component: <CVPSCalculator /> },
    { id: "engine-ctr", title: "Cardiothoracic Ratio (CTR)", badge: "Cardiomegaly", color: BRAND, component: <CardiothoracicRatio /> },
    { id: "engine-tei", title: "Tei Index (MPI) — Fetal", badge: "Global Function", color: "#7c3aed", component: <FetalTeiIndex /> },
    { id: "engine-ea", title: "E/A Ratio (AV Inflow)", badge: "Diastolic Function", color: "#0284c7", component: <EARatioCalculator /> },
    { id: "engine-dv", title: "Ductus Venosus PIV", badge: "Venous Doppler", color: "#0369a1", component: <DuctusVenosusPIV /> },
    { id: "engine-ua", title: "Umbilical Artery S/D Ratio & PI", badge: "Placental Resistance", color: "#d97706", component: <UmbilicalArteryDoppler /> },
    { id: "engine-mca", title: "MCA PSV (MoM) — Fetal Anemia Screen", badge: "Fetal Anemia", color: "#dc2626", component: <MCAPSVCalculator /> },
    { id: "engine-fhr", title: "Fetal Heart Rate Classification", badge: "Rhythm", color: "#16a34a", component: <FetalHRZScore /> },
    { id: "engine-paao", title: "PA/Ao Ratio", badge: "Outflow Tracts", color: "#0891b2", component: <PAAoRatio /> },
    { id: "engine-wallthick", title: "Ventricular Wall Thickness Z-score", badge: "Hypertrophy", color: "#7c3aed", component: <VentricularWallThickness /> },
    { id: "engine-sf", title: "Shortening Fraction (SF) — Fetal", badge: "Systolic Function", color: BRAND, component: <FetalSF /> },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0e4a50 60%, ${BRAND} 100%)` }}>
        <div className="container py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: AQUA + "30" }}>
              <Baby className="w-5 h-5" style={{ color: AQUA }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>
                FetalEchoAssist™
              </h1>
              <p className="text-sm" style={{ color: AQUA }}>
                Fetal Echo Calculator Engine — 2023 ASE Guideline-Based Feedback
              </p>
            </div>
          </div>
          <p className="text-white/60 text-xs max-w-2xl mt-2">
            Enter raw fetal echo measurements for instant guideline-based interpretation. All calculators reference the 2023 ASE Fetal Echocardiography Guidelines (Donofrio MT et al. JASE 2024;37:1-75).
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Quick-nav pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {engines.map(({ id, title, badge, color }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white hover:shadow-sm transition-all"
              style={{ color }}
            >
              <Activity className="w-3 h-3" />
              {badge}
            </a>
          ))}
        </div>

        {/* Engine cards */}
        <div className="space-y-3">
          {engines.map(({ id, title, badge, color, component }) => (
            <EngineSection key={id} id={id} title={title} badge={badge} badgeColor={color}>
              {component}
            </EngineSection>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Guideline References</p>
          <p>• Donofrio MT et al. Diagnosis and Treatment of Fetal Cardiac Disease: A Scientific Statement from the American Heart Association. <em>J Am Soc Echocardiogr.</em> 2024;37(1):1-75 (2023 ASE Fetal Echo Guidelines)</p>
          <p>• Mari G et al. Noninvasive diagnosis by Doppler ultrasonography of fetal anemia due to maternal red-cell alloimmunization. <em>N Engl J Med.</em> 2000;342:9-14</p>
          <p>• Huhta JC. Fetal Cardiovascular Profile Score. <em>Ultrasound Obstet Gynecol.</em> 2005;25:550-555</p>
          <p>• Celermajer DS et al. Cardiothoracic ratio in fetal life. <em>Br Heart J.</em> 1992;68:534-538</p>
          <p>• Tsutsumi T et al. Evaluation of ductus venosus blood flow velocity waveforms. <em>Ultrasound Obstet Gynecol.</em> 1999;13:26-29</p>
          <p className="pt-1">© All About Ultrasound — iHeartEcho™ | www.iheartecho.com</p>
        </div>
      </div>
    </Layout>
  );
}
