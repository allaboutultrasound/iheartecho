/*
  iHeartEcho — EchoAssist
  Instant ASE-guideline severity classification from raw measurements.
  Domains: AS, MS, AR, MR, LV Systolic, Diastolic, Strain (LV/RV/LA), RV Function, PA Pressure
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body, JetBrains Mono data
*/
import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import Layout from "@/components/Layout";
import { Zap, ChevronDown, ChevronUp, Info, Lightbulb, MessageSquare, AlertCircle, TrendingUp, Activity, Save, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import FrankStarlingGraph, { type FrankStarlingParams } from "@/components/FrankStarlingGraph";

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

function NumInput({
  label, value, onChange, unit, placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal text-xs">{hint}</span>}
      </label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        />
        {unit && (
          <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 font-medium whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

type Severity = "normal" | "mild" | "moderate" | "severe" | "critical" | "indeterminate" | "info";

const severityConfig: Record<Severity, { bg: string; border: string; text: string; badge: string; badgeText: string; icon: string }> = {
  normal:       { bg: "#f0fdf4", border: "#86efac", text: "#166534", badge: "#16a34a", badgeText: "Normal",        icon: "✓" },
  mild:         { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", badge: "#d97706", badgeText: "Mild",           icon: "!" },
  moderate:     { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", badge: "#d97706", badgeText: "Moderate",       icon: "!!" },
  severe:       { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", badge: "#dc2626", badgeText: "Severe",         icon: "!!!" },
  critical:     { bg: "#fdf2f8", border: "#f0abfc", text: "#701a75", badge: "#a21caf", badgeText: "Critical",       icon: "⚠" },
  indeterminate:{ bg: "#f8fafc", border: "#cbd5e1", text: "#475569", badge: "#189aa1", badgeText: "Indeterminate",  icon: "?" },
  info:         { bg: "#f0fbfc", border: "#67e8f9", text: "#0e7490", badge: "#189aa1", badgeText: "Result",         icon: "i" },
};

function ResultCard({
  severity, title, value, criteria, note,
}: {
  severity: Severity; title: string; value: string; criteria: string[]; note?: string;
}) {
  const c = severityConfig[severity];
  return (
    <div className="rounded-xl border p-4 mt-3 animate-in fade-in duration-300"
      style={{ background: c.bg, borderColor: c.border }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: c.text }}>{title}</span>
          <div className="text-xl font-bold mt-0.5" style={{ color: c.text, fontFamily: "Merriweather, serif" }}>{value}</div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0 mt-1"
          style={{ background: c.badge }}>
          {c.badgeText}
        </span>
      </div>
      {criteria.length > 0 && (
        <ul className="mt-2 space-y-1">
          {criteria.map((cr, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: c.text }}>
              <span className="mt-0.5 flex-shrink-0">{c.icon}</span>
              <span>{cr}</span>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <p className="mt-2 text-xs italic" style={{ color: c.text }}>{note}</p>
      )}
    </div>
  );
}

function EngineSection({
  title, subtitle, children, defaultOpen = false, id,
}: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);

  // Listen for hash-based open events dispatched by the main page
  useEffect(() => {
    if (!id) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === id) {
        setOpen(true);
        // Scroll into view after a short delay so the section has expanded
        setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    };
    window.addEventListener("echoassist:open", handler);
    return () => window.removeEventListener("echoassist:open", handler);
  }, [id]);

  return (
    <div id={id} ref={ref} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full teal-header px-5 py-3 flex items-center justify-between"
      >
        <div className="text-left">
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>{title}</h3>
          {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/70 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/70 flex-shrink-0" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ─── ECHOASSIST™ DIAGNOSTIC PANEL ───────────────────────────────────────────

interface EchoAssistOutput {
  suggests: string;
  note?: string;
  tip?: string;
}

function EchoAssistPanel({ output }: { output: EchoAssistOutput | null }) {
  if (!output) return null;
  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-[#189aa1]/30 shadow-sm">
      {/* Suggests */}
      <div className="flex items-start gap-3 px-4 py-3 bg-[#f0fbfc] border-b border-[#189aa1]/20">
        <MessageSquare className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0e7490] block mb-0.5">
            EchoAssist™ Suggests
          </span>
          <p className="text-sm text-[#0e7490] font-medium leading-snug">{output.suggests}</p>
        </div>
      </div>
      {/* Note */}
      {output.note && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block mb-0.5">
              EchoAssist™ Note
            </span>
            <p className="text-sm text-amber-800 leading-snug">{output.note}</p>
          </div>
        </div>
      )}
      {/* Tip */}
      {output.tip && (
        <div className="flex items-start gap-3 px-4 py-3 bg-white">
          <Lightbulb className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#189aa1] block mb-0.5">
              EchoAssist™ Tip
            </span>
            <p className="text-sm text-gray-600 leading-snug">{output.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALCULATION HELPERS ──────────────────────────────────────────────────────

const n = (v: string) => parseFloat(v);
const has = (...vals: string[]) => vals.every(v => v !== "" && !isNaN(parseFloat(v)));

// ─── AORTIC STENOSIS ENGINE ───────────────────────────────────────────────────
function AorticStenosisEngine() {
  const [lvotD, setLvotD] = useState("");
  const [lvotVti, setLvotVti] = useState("");
  const [avVti, setAvVti] = useState("");
  const [avVmax, setAvVmax] = useState("");
  const [avMg, setAvMg] = useState("");
  const [bsa, setBsa] = useState("");

  // Calculations
  const lvotArea = has(lvotD) ? Math.PI * Math.pow(n(lvotD) / 2, 2) : null;
  const ava = has(lvotD, lvotVti, avVti) && lvotArea
    ? (lvotArea * n(lvotVti)) / n(avVti)
    : null;
  const avai = ava && has(bsa) ? ava / n(bsa) : null;
  const dvi = has(lvotVti, avVti) ? n(lvotVti) / n(avVti) : null;

  // Severity classification (AHA/ACC 2021 + ASE)
  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!has(avVmax) && !ava) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter AV Vmax or LVOT diameter + VTIs to classify"] };

    const vm = n(avVmax);
    const mg = n(avMg);
    const criteria: string[] = [];
    let sev: Severity = "normal";
    let label = "";

    if (ava !== null) criteria.push(`AVA = ${ava.toFixed(2)} cm²`);
    if (avai !== null) criteria.push(`AVAi = ${avai.toFixed(2)} cm²/m²`);
    if (dvi !== null) criteria.push(`DVI (VTI ratio) = ${dvi.toFixed(2)}`);

    if (has(avVmax)) {
      if (vm >= 5.0) {
        sev = "severe"; label = "Very Severe Aortic Stenosis";
        criteria.push(`AV Vmax ${avVmax} m/s ≥ 5.0 m/s (very severe threshold)`);
      } else if (vm >= 4.0) {
        sev = "severe"; label = "Severe Aortic Stenosis";
        criteria.push(`AV Vmax ${avVmax} m/s ≥ 4.0 m/s`);
      } else if (vm >= 3.0) {
        sev = "moderate"; label = "Moderate Aortic Stenosis";
        criteria.push(`AV Vmax ${avVmax} m/s (3.0–3.9 m/s = moderate)`);
      } else if (vm >= 2.0) {
        sev = "mild"; label = "Mild Aortic Stenosis";
        criteria.push(`AV Vmax ${avVmax} m/s (2.0–2.9 m/s = mild)`);
      } else {
        sev = "normal"; label = "No Significant Aortic Stenosis";
        criteria.push(`AV Vmax ${avVmax} m/s < 2.0 m/s`);
      }
    }

    if (has(avMg)) {
      if (mg >= 40) criteria.push(`Mean gradient ${avMg} mmHg ≥ 40 mmHg (severe)`);
      else if (mg >= 20) criteria.push(`Mean gradient ${avMg} mmHg (20–39 mmHg = moderate)`);
      else criteria.push(`Mean gradient ${avMg} mmHg < 20 mmHg`);
    }

    if (ava !== null) {
      if (ava < 1.0) criteria.push(`AVA < 1.0 cm² → severe`);
      else if (ava < 1.5) criteria.push(`AVA 1.0–1.5 cm² → moderate`);
      else if (ava < 2.0) criteria.push(`AVA 1.5–2.0 cm² → mild`);
      else criteria.push(`AVA ≥ 2.0 cm² → no significant stenosis`);
    }

    if (avai !== null) {
      if (avai < 0.6) criteria.push(`AVAi < 0.6 cm²/m² → severe (especially in small patients)`);
    }

    if (dvi !== null) {
      if (dvi < 0.25) criteria.push(`DVI < 0.25 → severe`);
      else if (dvi < 0.35) criteria.push(`DVI 0.25–0.35 → moderate`);
    }

    let note: string | undefined;
    if (has(avVmax) && ava !== null) {
      if (n(avVmax) >= 4.0 && ava >= 1.0) note = "⚠ Discordant grading: high gradient with non-severe AVA. Consider low-flow state, measurement error, or bicuspid anatomy.";
      if (n(avVmax) < 4.0 && ava < 1.0) note = "⚠ Low-flow, low-gradient AS pattern. Consider dobutamine stress echo or CT calcium scoring.";
    }

    return { sev, label, criteria, note };
  };

  const result = getSeverity();

  const getEchoAssistOutput = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;
    const vm = n(avVmax);
    const mg = n(avMg);
    let suggests = "";
    let note: string | undefined;
    let tip: string | undefined;

    if (result.sev === "normal") {
      suggests = "Findings are consistent with no hemodynamically significant aortic stenosis. AV Vmax and gradients are within normal limits.";
      tip = "Ensure the AV is interrogated from multiple windows (apical, right parasternal, suprasternal) to capture the highest velocity and avoid underestimation.";
    } else if (result.sev === "mild") {
      suggests = `Findings are consistent with mild aortic stenosis. AV Vmax ${has(avVmax) ? avVmax + " m/s" : ""} and gradients indicate mild obstruction without hemodynamic significance at rest.`;
      note = "Mild AS warrants annual clinical review. Progression to moderate or severe AS may occur over 3–5 years, particularly in bicuspid valves or heavily calcified leaflets.";
      tip = "Document peak and mean gradients from the highest-velocity window. The right parasternal approach often yields higher velocities in AS.";
    } else if (result.sev === "moderate") {
      suggests = `Findings are consistent with moderate aortic stenosis${ava ? ` (AVA ${ava.toFixed(2)} cm²)` : ""}. ${has(avVmax) ? `AV Vmax ${avVmax} m/s, mean gradient ${has(avMg) ? avMg + " mmHg" : "not entered"}.` : ""} Hemodynamic significance is intermediate.`;
      note = result.note ?? "Moderate AS requires closer surveillance (echo every 1–2 years). Evaluate for symptoms of syncope, angina, or dyspnea, which may trigger earlier intervention.";
      tip = "Ensure LVOT diameter is measured in the PLAX view at the level of the aortic annulus, inner-edge to inner-edge, in mid-systole. A 1 mm error in LVOT diameter results in ~10% error in AVA.";
    } else if (result.sev === "severe") {
      const veryS = vm >= 5.0;
      suggests = `Findings are consistent with ${veryS ? "very severe" : "severe"} aortic stenosis${ava ? ` (AVA ${ava.toFixed(2)} cm²${avai ? ", AVAi " + avai.toFixed(2) + " cm²/m²" : ""})` : ""}. ${has(avVmax) ? `AV Vmax ${avVmax} m/s${has(avMg) ? ", mean gradient " + avMg + " mmHg" : ""}.` : ""} Meets ASE/AHA/ACC criteria for severe AS — surgical or transcatheter valve replacement should be considered.`;
      note = result.note ?? (veryS ? "Very severe AS (Vmax ≥5.0 m/s) carries high surgical risk. TAVR should be discussed at a multidisciplinary heart team meeting." : "Severe AS with symptoms is a Class I indication for AVR. Assess for LV systolic dysfunction, which may indicate advanced disease.");
      tip = "In severe AS with low EF, consider dobutamine stress echo to distinguish true-severe from pseudo-severe AS. CT calcium scoring (Agatston score ≥2000 in women, ≥3000 in men) supports severe AS in low-flow, low-gradient cases.";
    }
    return { suggests, note, tip };
  };

  return (
    <EngineSection id="engine-as" title="Aortic Stenosis" subtitle="AVA by continuity equation · Vmax · Mean gradient · DVI">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="LVOT Diameter" value={lvotD} onChange={setLvotD} unit="cm" placeholder="e.g. 2.0" hint="(nl 1.8–2.2)" />
        <NumInput label="LVOT VTI" value={lvotVti} onChange={setLvotVti} unit="cm" placeholder="e.g. 22" hint="(nl 18–25)" />
        <NumInput label="AV VTI" value={avVti} onChange={setAvVti} unit="cm" placeholder="e.g. 80" />
        <NumInput label="AV Vmax" value={avVmax} onChange={setAvVmax} unit="m/s" placeholder="nl <2.0" hint="(sev ≥4.0)" />
        <NumInput label="AV Mean Gradient" value={avMg} onChange={setAvMg} unit="mmHg" placeholder="sev ≥40" />
        <NumInput label="BSA" value={bsa} onChange={setBsa} unit="m²" placeholder="e.g. 1.7" hint="(for AVAi)" />
      </div>
      {lvotArea && <p className="text-xs text-gray-400 mt-2">LVOT area: {lvotArea.toFixed(2)} cm²</p>}
      <ResultCard
        severity={result.sev}
        title="Aortic Stenosis Severity"
        value={result.label}
        criteria={result.criteria}
        note={result.note}
      />
      <EchoAssistPanel output={getEchoAssistOutput()} />
      <p className="text-xs text-gray-400 mt-3">Reference: AHA/ACC 2021 Valvular Heart Disease Guidelines; ASE 2017 Valve Stenosis Guidelines</p>
    </EngineSection>
  );
}

// ─── MITRAL STENOSIS ENGINE ───────────────────────────────────────────────────
function MitraStenosisEngine() {
  const [mva, setMva] = useState("");
  const [mvMg, setMvMg] = useState("");
  const [mvPht, setMvPht] = useState("");
  const [trVmax, setTrVmax] = useState("");

  const mvaPht = has(mvPht) ? 220 / n(mvPht) : null;

  const getSeverity = (): { sev: Severity; label: string; criteria: string[] } => {
    if (!has(mva) && !has(mvMg)) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter MVA or mean gradient to classify"] };
    const criteria: string[] = [];
    let sev: Severity = "normal";
    let label = "";

    const area = n(mva) || (mvaPht ?? 0);
    if (mvaPht) criteria.push(`MVA by PHT = ${mvaPht.toFixed(2)} cm² (PHT ${mvPht} ms)`);
    if (has(mva)) criteria.push(`MVA (planimetry/continuity) = ${mva} cm²`);

    if (area > 0) {
      if (area > 4.0) { sev = "normal"; label = "No Significant Mitral Stenosis"; criteria.push("MVA > 4.0 cm² → normal"); }
      else if (area >= 1.5) { sev = "mild"; label = "Mild Mitral Stenosis"; criteria.push("MVA 1.5–4.0 cm² → mild"); }
      else if (area >= 1.0) { sev = "moderate"; label = "Moderate Mitral Stenosis"; criteria.push("MVA 1.0–1.5 cm² → moderate"); }
      else { sev = "severe"; label = "Severe Mitral Stenosis"; criteria.push("MVA < 1.0 cm² → severe"); }
    }

    if (has(mvMg)) {
      if (n(mvMg) >= 10) criteria.push(`Mean gradient ${mvMg} mmHg ≥ 10 mmHg → severe`);
      else if (n(mvMg) >= 5) criteria.push(`Mean gradient ${mvMg} mmHg (5–9 mmHg → moderate)`);
      else criteria.push(`Mean gradient ${mvMg} mmHg < 5 mmHg`);
    }

    if (has(trVmax)) {
      const rvsp = 4 * Math.pow(n(trVmax), 2);
      criteria.push(`Estimated RVSP = ${rvsp.toFixed(0)} mmHg (TR Vmax ${trVmax} m/s) — pulmonary hypertension ${rvsp > 50 ? "present" : "not suggested"}`);
    }

    return { sev, label, criteria };
  };

  const result = getSeverity();

  const getMsEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;
    const area = n(mva) || (mvaPht ?? 0);
    if (result.sev === "normal") return {
      suggests: "No hemodynamically significant mitral stenosis identified. Mitral valve area and gradients are within normal limits.",
      tip: "Ensure MV mean gradient is measured during normal sinus rhythm. Atrial fibrillation or elevated heart rate will artificially elevate gradients."
    };
    if (result.sev === "mild") return {
      suggests: `Findings are consistent with mild mitral stenosis (MVA ${area > 0 ? area.toFixed(2) + " cm²" : "not calculated"}). Hemodynamic impact is minimal at rest.`,
      note: "Mild MS may become symptomatic with exercise or pregnancy due to increased cardiac output and heart rate. Consider exercise stress echo if symptoms are disproportionate to resting findings.",
      tip: "Pressure half-time (PHT) method is most reliable in sinus rhythm. After mitral valvuloplasty or in the presence of significant AR or elevated LVEDP, PHT may overestimate MVA."
    };
    if (result.sev === "moderate") return {
      suggests: `Findings are consistent with moderate mitral stenosis (MVA ${area > 0 ? area.toFixed(2) + " cm²" : "not calculated"}${has(mvMg) ? ", mean gradient " + mvMg + " mmHg" : ""}). Hemodynamic significance is intermediate and warrants clinical correlation.`,
      note: "Moderate MS with NYHA Class II symptoms may be a candidate for percutaneous mitral balloon commissurotomy (PMBC) if valve morphology is favorable (Wilkins score ≤8).",
      tip: "Assess mitral valve morphology using the Wilkins score (leaflet mobility, thickening, calcification, subvalvular apparatus). This guides suitability for PMBC vs. surgical repair."
    };
    return {
      suggests: `Findings are consistent with severe mitral stenosis (MVA ${area > 0 ? area.toFixed(2) + " cm²" : "not calculated"}${has(mvMg) ? ", mean gradient " + mvMg + " mmHg" : ""}). Intervention is indicated in symptomatic patients.`,
      note: "Severe MS is a Class I indication for PMBC in symptomatic patients with favorable anatomy. Assess for LA thrombus (TEE) and mitral regurgitation before proceeding.",
      tip: "Confirm TR Vmax to estimate pulmonary artery pressure. RVSP >50 mmHg in severe MS indicates significant pulmonary hypertension and may alter surgical risk and timing."
    };
  };

  return (
    <EngineSection id="engine-ms" title="Mitral Stenosis" subtitle="MVA · Mean gradient · Pressure half-time · PA pressure">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="MVA (planimetry / continuity)" value={mva} onChange={setMva} unit="cm²" placeholder="nl >4.0" />
        <NumInput label="MV Mean Gradient" value={mvMg} onChange={setMvMg} unit="mmHg" placeholder="sev ≥10" />
        <NumInput label="Pressure Half-Time (PHT)" value={mvPht} onChange={setMvPht} unit="ms" placeholder="nl <60" hint="(sev >220)" />
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" />
      </div>
      {mvaPht && <p className="text-xs text-gray-400 mt-2">MVA by PHT (220/PHT): {mvaPht.toFixed(2)} cm²</p>}
      <ResultCard severity={result.sev} title="Mitral Stenosis Severity" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={getMsEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: AHA/ACC 2021; ASE 2009 Echocardiographic Assessment of Valve Stenosis</p>
    </EngineSection>
  );
}

// ─── AORTIC REGURGITATION ENGINE ──────────────────────────────────────────────
function AorticRegurgEngine() {
  const [venaContracta, setVenaContracta] = useState("");
  const [eroa, setEroa] = useState("");
  const [regVol, setRegVol] = useState("");
  const [phtAr, setPhtAr] = useState("");
  const [arVmax, setArVmax] = useState("");
  const [lvedd, setLvedd] = useState("");

  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!has(venaContracta) && !has(eroa) && !has(regVol)) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter vena contracta, EROA, or regurgitant volume"] };
    const criteria: string[] = [];
    let sev: Severity = "normal";
    let label = "No Significant Aortic Regurgitation";

    if (has(venaContracta)) {
      const vc = n(venaContracta);
      criteria.push(`Vena contracta ${venaContracta} mm`);
      if (vc >= 6) { sev = "severe"; label = "Severe Aortic Regurgitation"; criteria.push("VC ≥ 6 mm → severe"); }
      else if (vc >= 3) { sev = "moderate"; label = "Moderate Aortic Regurgitation"; criteria.push("VC 3–5 mm → moderate"); }
      else { sev = "mild"; label = "Mild Aortic Regurgitation"; criteria.push("VC < 3 mm → mild"); }
    }

    if (has(eroa)) {
      criteria.push(`EROA ${eroa} cm²`);
      if (n(eroa) >= 0.30) criteria.push("EROA ≥ 0.30 cm² → severe");
      else if (n(eroa) >= 0.10) criteria.push("EROA 0.10–0.29 cm² → moderate");
      else criteria.push("EROA < 0.10 cm² → mild");
    }

    if (has(regVol)) {
      criteria.push(`Regurgitant volume ${regVol} mL`);
      if (n(regVol) >= 60) criteria.push("Reg vol ≥ 60 mL → severe");
      else if (n(regVol) >= 30) criteria.push("Reg vol 30–59 mL → moderate");
      else criteria.push("Reg vol < 30 mL → mild");
    }

    if (has(phtAr)) {
      criteria.push(`AR PHT ${phtAr} ms${n(phtAr) < 200 ? " → severe (rapid equalization)" : n(phtAr) < 500 ? " → moderate" : " → mild"}`);
    }

    if (has(arVmax)) criteria.push(`AR peak velocity ${arVmax} m/s`);

    if (has(lvedd)) {
      criteria.push(`LVEDD ${lvedd} mm${n(lvedd) > 70 ? " → dilated LV (volume overload)" : " → within normal limits"}`);
    }

    return { sev, label, criteria };
  };

  const result = getSeverity();

  const getArEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;
    if (result.sev === "normal") return {
      suggests: "No hemodynamically significant aortic regurgitation identified. Vena contracta and quantitative parameters are within normal limits.",
      tip: "Use color Doppler in the PLAX view with a narrow sector and reduced Nyquist limit (50–60 cm/s) to optimally visualize the AR jet width and vena contracta."
    };
    if (result.sev === "mild") return {
      suggests: `Findings are consistent with mild aortic regurgitation${has(venaContracta) ? " (vena contracta " + venaContracta + " mm)" : ""}. Hemodynamic burden on the LV is minimal at rest.`,
      note: "Mild AR is generally well tolerated. Annual clinical review is recommended. Echocardiographic surveillance every 3–5 years is appropriate unless LV dilation is present.",
      tip: "Assess the AR PHT: a short PHT (<200 ms) suggests rapid equalization of aortic and LV diastolic pressures, indicating more severe regurgitation regardless of jet size."
    };
    if (result.sev === "moderate") return {
      suggests: `Findings are consistent with moderate aortic regurgitation${has(venaContracta) ? " (vena contracta " + venaContracta + " mm)" : ""}${has(regVol) ? ", regurgitant volume " + regVol + " mL" : ""}. LV volume overload is present and warrants monitoring.`,
      note: "Moderate AR requires annual echocardiographic surveillance. LV dilation (LVEDD >65 mm or LVESD >50 mm) or declining EF may indicate progression toward severe AR requiring intervention.",
      tip: "Wide pulse pressure and a bounding pulse on clinical exam support significant AR. Assess the descending aorta for holodiastolic flow reversal by PW Doppler — present in moderate-to-severe AR."
    };
    return {
      suggests: `Findings are consistent with severe aortic regurgitation${has(venaContracta) ? " (vena contracta " + venaContracta + " mm)" : ""}${has(eroa) ? ", EROA " + eroa + " cm²" : ""}${has(regVol) ? ", regurgitant volume " + regVol + " mL" : ""}. Significant LV volume overload is present. Surgical aortic valve replacement should be considered.`,
      note: "Severe AR with symptoms or LV systolic dysfunction (EF <55%) or significant LV dilation (LVEDD >65 mm) is a Class I indication for AVR. Asymptomatic severe AR with preserved EF requires close surveillance (echo every 6–12 months).",
      tip: "Holodiastolic flow reversal in the abdominal aorta (PW Doppler) is a highly specific sign of severe AR. Assess the aortic root dimensions — concurrent aortopathy may alter surgical planning."
    };
  };

  return (
    <EngineSection id="engine-ar" title="Aortic Regurgitation" subtitle="Vena contracta · EROA · Regurgitant volume · AR PHT">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Vena Contracta" value={venaContracta} onChange={setVenaContracta} unit="mm" placeholder="sev ≥6" hint="(sev ≥6 mm)" />
        <NumInput label="EROA" value={eroa} onChange={setEroa} unit="cm²" placeholder="sev ≥0.30" />
        <NumInput label="Regurgitant Volume" value={regVol} onChange={setRegVol} unit="mL" placeholder="sev ≥60" />
        <NumInput label="AR Pressure Half-Time" value={phtAr} onChange={setPhtAr} unit="ms" placeholder="sev <200" />
        <NumInput label="AR Peak Velocity" value={arVmax} onChange={setArVmax} unit="m/s" placeholder="e.g. 3.5" />
        <NumInput label="LVEDD" value={lvedd} onChange={setLvedd} unit="mm" placeholder="nl <58" hint="(nl <58)" />
      </div>
      <ResultCard severity={result.sev} title="Aortic Regurgitation Severity" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={getArEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: AHA/ACC 2021; ASE/EACVI 2017 AR Guidelines (Zoghbi et al.)</p>
    </EngineSection>
  );
}

// ─── MITRAL REGURGITATION ENGINE ──────────────────────────────────────────────
function MitralRegurgEngine() {
  const [vcMr, setVcMr] = useState("");
  const [eroaMr, setEroaMr] = useState("");
  const [regVolMr, setRegVolMr] = useState("");
  const [pisa, setPisa] = useState("");
  const [pisaVmax, setPisaVmax] = useState("");
  const [mrVmax, setMrVmax] = useState("");
  const [laSize, setLaSize] = useState("");

  // PISA EROA calculation
  const pisaEroa = has(pisa, pisaVmax, mrVmax)
    ? (2 * Math.PI * Math.pow(n(pisa), 2) * 40) / (n(mrVmax) * 100)
    : null;

  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!has(vcMr) && !has(eroaMr) && !has(regVolMr) && !pisaEroa) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter vena contracta, EROA, or regurgitant volume"] };
    const criteria: string[] = [];
    let sev: Severity = "normal";
    let label = "No Significant Mitral Regurgitation";

    if (has(vcMr)) {
      const vc = n(vcMr);
      criteria.push(`Vena contracta ${vcMr} mm`);
      if (vc >= 7) { sev = "severe"; label = "Severe Mitral Regurgitation"; criteria.push("VC ≥ 7 mm → severe"); }
      else if (vc >= 3) { sev = "moderate"; label = "Moderate Mitral Regurgitation"; criteria.push("VC 3–6 mm → moderate"); }
      else { sev = "mild"; label = "Mild Mitral Regurgitation"; criteria.push("VC < 3 mm → mild"); }
    }

    const effectiveEroa = n(eroaMr) || pisaEroa || 0;
    if (pisaEroa) criteria.push(`EROA by PISA = ${pisaEroa.toFixed(2)} cm²`);
    if (has(eroaMr)) criteria.push(`EROA (entered) = ${eroaMr} cm²`);
    if (effectiveEroa > 0) {
      if (effectiveEroa >= 0.40) criteria.push("EROA ≥ 0.40 cm² → severe");
      else if (effectiveEroa >= 0.20) criteria.push("EROA 0.20–0.39 cm² → moderate");
      else criteria.push("EROA < 0.20 cm² → mild");
    }

    if (has(regVolMr)) {
      criteria.push(`Regurgitant volume ${regVolMr} mL`);
      if (n(regVolMr) >= 60) criteria.push("Reg vol ≥ 60 mL → severe");
      else if (n(regVolMr) >= 30) criteria.push("Reg vol 30–59 mL → moderate");
      else criteria.push("Reg vol < 30 mL → mild");
    }

    if (has(mrVmax)) criteria.push(`MR peak velocity ${mrVmax} m/s`);
    if (has(laSize)) criteria.push(`LA size ${laSize} mm${n(laSize) > 40 ? " → dilated (volume overload)" : ""}`);

    return { sev, label, criteria };
  };

  const result = getSeverity();

  const getMrEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;
    if (result.sev === "normal") return {
      suggests: "No hemodynamically significant mitral regurgitation identified. Quantitative parameters are within normal limits.",
      tip: "Optimize color Doppler gain and Nyquist limit (50–60 cm/s) when assessing MR jet area. Eccentric jets (Coanda effect) are frequently underestimated by jet area alone — use vena contracta and PISA methods."
    };
    if (result.sev === "mild") return {
      suggests: `Findings are consistent with mild mitral regurgitation${has(vcMr) ? " (vena contracta " + vcMr + " mm)" : ""}. LV volume loading is minimal at rest.`,
      note: "Mild MR is generally well tolerated. Echocardiographic follow-up every 3–5 years is appropriate unless symptoms develop or LV dilation is identified.",
      tip: "For eccentric or posteriorly directed MR jets, the PISA method provides a more accurate EROA than jet area. Ensure the aliasing velocity is set to 40 cm/s for the standard PISA calculation."
    };
    if (result.sev === "moderate") return {
      suggests: `Findings are consistent with moderate mitral regurgitation${has(vcMr) ? " (vena contracta " + vcMr + " mm)" : ""}${has(eroaMr) ? ", EROA " + eroaMr + " cm²" : ""}. LV volume overload is present and warrants clinical monitoring.`,
      note: "Moderate MR requires annual echocardiographic surveillance. Progression to severe MR, LV dilation (LVESD >40 mm), or EF decline below 60% may indicate the need for surgical evaluation.",
      tip: "Assess LA size as a marker of chronic volume overload. LA dilation (LAVI >34 mL/m²) in the setting of moderate MR suggests hemodynamic significance and may influence management decisions."
    };
    return {
      suggests: `Findings are consistent with severe mitral regurgitation${has(vcMr) ? " (vena contracta " + vcMr + " mm)" : ""}${pisaEroa ? ", EROA " + pisaEroa.toFixed(2) + " cm²" : has(eroaMr) ? ", EROA " + eroaMr + " cm²" : ""}${has(regVolMr) ? ", regurgitant volume " + regVolMr + " mL" : ""}. Significant LV volume overload is present. Mitral valve repair or replacement should be considered.`,
      note: "Severe primary MR with symptoms or LV systolic dysfunction (EF <60% or LVESD >40 mm) is a Class I indication for surgery. Mitral valve repair is preferred over replacement when feasible.",
      tip: "In severe MR, a preserved or hyperdynamic EF may mask underlying LV dysfunction due to reduced afterload. An EF of 60% in severe MR may represent early dysfunction — use GLS to detect subclinical impairment."
    };
  };

  return (
    <EngineSection id="engine-mr" title="Mitral Regurgitation" subtitle="Vena contracta · EROA · PISA · Regurgitant volume">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Vena Contracta" value={vcMr} onChange={setVcMr} unit="mm" placeholder="sev ≥7" hint="(sev ≥7 mm)" />
        <NumInput label="EROA" value={eroaMr} onChange={setEroaMr} unit="cm²" placeholder="sev ≥0.40" />
        <NumInput label="Regurgitant Volume" value={regVolMr} onChange={setRegVolMr} unit="mL" placeholder="sev ≥60" />
        <NumInput label="PISA Radius" value={pisa} onChange={setPisa} unit="cm" placeholder="e.g. 0.9" hint="(at 40 cm/s alias)" />
        <NumInput label="MR Peak Velocity" value={mrVmax} onChange={setMrVmax} unit="m/s" placeholder="e.g. 5.0" />
        <NumInput label="LA AP Dimension" value={laSize} onChange={setLaSize} unit="mm" placeholder="nl <40" />
      </div>
      {pisaEroa && <p className="text-xs text-gray-400 mt-2">PISA-derived EROA: {pisaEroa.toFixed(2)} cm²</p>}
      <ResultCard severity={result.sev} title="Mitral Regurgitation Severity" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={getMrEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: AHA/ACC 2021; ASE/EACVI 2017 MR Guidelines (Zoghbi et al.)</p>
    </EngineSection>
  );
}

// ─── LV SYSTOLIC FUNCTION ENGINE ─────────────────────────────────────────────
function LVSystolicEngine() {
  const [ef, setEf] = useState("");
  const [lvedd, setLvedd] = useState("");
  const [lvesd, setLvesd] = useState("");
  const [ivsd, setIvsd] = useState("");
  const [pwd, setPwd] = useState("");
  const [lvMassIndex, setLvMassIndex] = useState("");
  const [fs, setFs] = useState("");

  const fsCalc = has(lvedd, lvesd) ? ((n(lvedd) - n(lvesd)) / n(lvedd) * 100) : null;

  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!has(ef)) return { sev: "indeterminate", label: "Enter EF to classify", criteria: [] };
    const efVal = n(ef);
    const criteria: string[] = [];
    let sev: Severity;
    let label: string;

    if (efVal >= 55) { sev = "normal"; label = "Preserved LV Systolic Function (EF ≥55%)"; criteria.push("EF ≥ 55% → normal (HFpEF range)"); }
    else if (efVal >= 50) { sev = "mild"; label = "Low-Normal LV Systolic Function (EF 50–54%)"; criteria.push("EF 50–54% → low-normal (HFmrEF range)"); }
    else if (efVal >= 40) { sev = "moderate"; label = "Mildly Reduced LV Systolic Function (EF 40–49%)"; criteria.push("EF 40–49% → mildly reduced (HFmrEF)"); }
    else if (efVal >= 30) { sev = "severe"; label = "Moderately Reduced LV Systolic Function (EF 30–39%)"; criteria.push("EF 30–39% → moderately reduced (HFrEF)"); }
    else { sev = "critical"; label = "Severely Reduced LV Systolic Function (EF <30%)"; criteria.push("EF < 30% → severely reduced (HFrEF, high risk)"); }

    if (has(lvedd)) {
      const d = n(lvedd);
      criteria.push(`LVEDD ${lvedd} mm${d > 70 ? " → severely dilated" : d > 58 ? " → dilated" : " → normal"}`);
    }
    if (has(lvesd)) criteria.push(`LVESD ${lvesd} mm`);

    const fsDisplay = fsCalc ?? (has(fs) ? n(fs) : null);
    if (fsDisplay !== null) {
      criteria.push(`FS = ${fsDisplay.toFixed(1)}%${fsDisplay < 25 ? " → reduced" : " → normal (nl 25–43%)"}`);
    }

    const ivsVal = n(ivsd || "0");
    const pwVal = n(pwd || "0");
    if (has(ivsd) || has(pwd)) {
      const maxWall = Math.max(ivsVal, pwVal);
      if (maxWall > 16) criteria.push(`Wall thickness ${maxWall} mm → severe hypertrophy`);
      else if (maxWall > 12) criteria.push(`Wall thickness ${maxWall} mm → hypertrophy present`);
      else criteria.push(`Wall thickness ${maxWall} mm → normal`);
    }

    if (has(lvMassIndex)) {
      const lmi = n(lvMassIndex);
      criteria.push(`LV mass index ${lvMassIndex} g/m²${lmi > 115 ? " → increased (nl <115 M, <95 F)" : " → normal"}`);
    }

    return { sev, label, criteria };
  };

  const result = getSeverity();

  const getLvEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;
    const efVal = n(ef);
    if (result.sev === "normal") return {
      suggests: `Findings are consistent with preserved LV systolic function (EF ${ef}%). No evidence of systolic impairment.`,
      tip: "Biplane Simpson's method of discs (MOD) is the recommended technique for EF quantification. Ensure adequate endocardial border tracing in both A4C and A2C views, avoiding foreshortening."
    };
    if (result.sev === "mild") return {
      suggests: `Findings are consistent with low-normal LV systolic function (EF ${ef}%). This falls in the HFmrEF range (EF 50–54%). Clinical correlation is warranted.`,
      note: "Low-normal EF may represent early or recovering systolic dysfunction. Assess for wall motion abnormalities, LV dilation, and risk factors for coronary artery disease.",
      tip: "LV GLS is a more sensitive marker of subclinical systolic dysfunction than EF. A GLS less negative than −18% in the setting of low-normal EF may indicate early myocardial dysfunction."
    };
    if (result.sev === "moderate") return {
      suggests: `Findings are consistent with mildly reduced LV systolic function (EF ${ef}%, HFmrEF). Guideline-directed medical therapy should be considered.`,
      note: "EF 40–49% (HFmrEF) may represent a transitional state between preserved and reduced EF. Evaluate for ischemic etiology, valvular disease, and cardiomyopathy. Repeat echo in 3–6 months after therapy initiation.",
      tip: "Assess wall motion segmentally using the 17-segment model. Regional wall motion abnormalities suggest ischemic etiology; global dysfunction suggests non-ischemic cardiomyopathy."
    };
    if (result.sev === "severe") return {
      suggests: `Findings are consistent with moderately reduced LV systolic function (EF ${ef}%, HFrEF). Guideline-directed medical therapy is indicated.`,
      note: "EF 30–39% meets criteria for HFrEF. GDMT including ACE inhibitor/ARB/ARNI, beta-blocker, MRA, and SGLT2 inhibitor is indicated. Assess for ICD candidacy if EF remains ≤35% after 3 months of optimal therapy.",
      tip: "Evaluate for LV dyssynchrony (LBBB morphology, QRS >150 ms) as CRT may be indicated. Assess mitral regurgitation severity, as functional MR is common in dilated cardiomyopathy and may worsen prognosis."
    };
    return {
      suggests: `Findings are consistent with severely reduced LV systolic function (EF ${ef}%). This represents advanced HFrEF with high risk for arrhythmia and adverse cardiac events.`,
      note: "EF <30% carries high risk for sudden cardiac death. ICD implantation should be considered. Evaluate for advanced HF therapies including LVAD or cardiac transplantation referral if refractory to GDMT.",
      tip: "In severely reduced EF, ensure measurements are obtained at end-diastole (largest LV cavity) and end-systole (smallest cavity). Avoid measuring during ectopic beats. Consider 3D echocardiography for more accurate volumetric assessment."
    };
  };

  return (
    <EngineSection id="engine-lv" title="LV Systolic Function" subtitle="EF · Dimensions · Wall thickness · FS">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Ejection Fraction (EF)" value={ef} onChange={setEf} unit="%" placeholder="nl ≥55" hint="(nl ≥55%)" />
        <NumInput label="Fractional Shortening" value={fs} onChange={setFs} unit="%" placeholder="nl 25–43" />
        <NumInput label="LVEDD" value={lvedd} onChange={setLvedd} unit="mm" placeholder="nl 42–58" />
        <NumInput label="LVESD" value={lvesd} onChange={setLvesd} unit="mm" placeholder="nl 25–40" />
        <NumInput label="IVSd" value={ivsd} onChange={setIvsd} unit="mm" placeholder="nl 6–12" />
        <NumInput label="PWd" value={pwd} onChange={setPwd} unit="mm" placeholder="nl 6–12" />
        <NumInput label="LV Mass Index" value={lvMassIndex} onChange={setLvMassIndex} unit="g/m²" placeholder="nl <115 M" />
      </div>
      {fsCalc !== null && <p className="text-xs text-gray-400 mt-2">Calculated FS: {fsCalc.toFixed(1)}%</p>}
      <ResultCard severity={result.sev} title="LV Systolic Function" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={getLvEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: <a href='https://asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf' target='_blank' rel='noopener noreferrer' className='underline hover:text-[#189aa1]'>ASE/WFTF 2018 Chamber Quantification</a>; AHA/ACC HF Classification 2022</p>
    </EngineSection>
  );
}

// ─── DIASTOLIC FUNCTION ENGINE ────────────────────────────────────────────────
// ─── ASE 2025 DIASTOLIC ALGORITHMS ────────────────────────────────────────────
// Algorithm 1 (Figure 2): Two-step Diastolic Dysfunction Detection
//   Step 1: e' reduced if septal ≤6 OR lateral ≤7 OR average ≤6.5 cm/s
//   Step 2: ≥1 of: avg E/e'>14, LARS≤18%, E/A≤0.8 or ≥2, LAVI>34 mL/m²
//   DD present if: (e' reduced AND ≥1 Step2) OR (e' preserved AND ≥2 Step2)
//
// Algorithm 2 (Figure 3): LV Diastolic Function Grading & LAP Estimation
//   Variables: (1) e' reduced (sep≤6/lat≤7/avg≤6.5), (2) E/e' sep≥15/lat≥13/avg≥14, (3) TR≥2.8m/s or PASP≥35
//   All normal → Normal LAP → Normal DF
//   Only e' reduced, E/A≤0.8 → Normal LAP → Grade I
//   Only e' reduced, E/A>0.8 → check PV S/D≤0.67 or LARS≤18% or LAVI>34 or IVRT≤70ms
//     None present → Normal LAP → Grade I (if symptomatic → Exercise Echo)
//     ≥1 present → Increased LAP → E/A<2 → Grade II; E/A≥2 → Grade III
//   Increased TR/PASP only OR Increased E/e' only OR any 2 abnormal → same PV/LARS/LAVI/IVRT branch
//   3 of above → Increased LAP → E/A<2 → Grade II; E/A≥2 → Grade III
//   Exclusions: AF, MAC, MR, MS, LVAD, non-cardiac PH, HTX, pericardial constriction

function DiastolicEngine() {
  const [eVel, setEVel] = useState("");
  const [aVel, setAVel] = useState("");
  const [ePrimeSep, setEPrimeSep] = useState("");
  const [ePrimeLat, setEPrimeLat] = useState("");
  const [trVmax, setTrVmax] = useState("");
  const [lavi, setLavi] = useState("");
  const [lars, setLars] = useState("");
  const [pvSD, setPvSD] = useState("");
  const [ivrt, setIvrt] = useState("");
  const [ddt, setDdt] = useState("");
  const [exclusion, setExclusion] = useState(false);

  // Derived values
  const eaRatio = has(eVel, aVel) ? n(eVel) / n(aVel) : null;
  const ePrimeSepVal = has(ePrimeSep) ? n(ePrimeSep) : null;
  const ePrimeLatVal = has(ePrimeLat) ? n(ePrimeLat) : null;
  const ePrimeAvg = ePrimeSepVal !== null && ePrimeLatVal !== null
    ? (ePrimeSepVal + ePrimeLatVal) / 2
    : ePrimeSepVal ?? ePrimeLatVal;
  const eeRatio = has(eVel) && ePrimeAvg !== null ? n(eVel) * 100 / ePrimeAvg : null;
  const rvsp = has(trVmax) ? 4 * Math.pow(n(trVmax), 2) : null;

  // ── Step 1: Is e' reduced? ──────────────────────────────────────────────────
  // Reduced if septal ≤6 OR lateral ≤7 OR average ≤6.5
  const ePrimeReduced =
    (ePrimeSepVal !== null && ePrimeSepVal <= 6) ||
    (ePrimeLatVal !== null && ePrimeLatVal <= 7) ||
    (ePrimeAvg !== null && ePrimeAvg <= 6.5);
  const ePrimeEntered = ePrimeSepVal !== null || ePrimeLatVal !== null;

  // ── Step 2 criteria (DD detection algorithm) ────────────────────────────────
  const eeAbove14 = eeRatio !== null && eeRatio > 14;
  const larsAbnDD = has(lars) && n(lars) <= 18;
  const eaAbnDD = eaRatio !== null && (eaRatio <= 0.8 || eaRatio >= 2);
  const laviAbnDD = has(lavi) && n(lavi) > 34;
  const step2Positive = [eeAbove14, larsAbnDD, eaAbnDD, laviAbnDD].filter(Boolean).length;

  // ── Grading algorithm variables ─────────────────────────────────────────────
  // Variable 1: e' reduced (same as Step 1)
  // Variable 2: E/e' elevated (septal ≥15 OR lateral ≥13 OR average ≥14)
  const eeElevated =
    (ePrimeSepVal !== null && has(eVel) && (n(eVel) * 100 / ePrimeSepVal) >= 15) ||
    (ePrimeLatVal !== null && has(eVel) && (n(eVel) * 100 / ePrimeLatVal) >= 13) ||
    (eeRatio !== null && eeRatio >= 14);
  // Variable 3: TR ≥2.8 m/s OR PASP ≥35 mmHg
  const trAbn = (has(trVmax) && n(trVmax) >= 2.8) || (rvsp !== null && rvsp >= 35);

  const gradingVarsAbn = [ePrimeReduced && ePrimeEntered, eeElevated, trAbn].filter(Boolean).length;

  // Secondary branch criteria (PV S/D, LARS, LAVI, IVRT)
  const pvSDAbn = has(pvSD) && n(pvSD) <= 0.67;
  const larsAbnGrade = has(lars) && n(lars) <= 18;
  const laviAbnGrade = has(lavi) && n(lavi) > 34;
  const ivrtAbn = has(ivrt) && n(ivrt) <= 70;
  const secondaryPositive = [pvSDAbn, larsAbnGrade, laviAbnGrade, ivrtAbn].filter(Boolean).length;
  const secondaryEntered = has(pvSD) || has(lars) || has(lavi) || has(ivrt);

  // ── Main grading logic ──────────────────────────────────────────────────────
  const getGrade = (): { sev: Severity; label: string; lap: string; criteria: string[]; note?: string; ddDetected?: boolean | null } => {
    const criteria: string[] = [];

    // Populate criteria display
    if (ePrimeEntered) {
      const parts = [];
      if (ePrimeSepVal !== null) parts.push(`septal ${ePrimeSepVal} cm/s${ePrimeSepVal <= 6 ? " ≤6 ✓" : ""}`);
      if (ePrimeLatVal !== null) parts.push(`lateral ${ePrimeLatVal} cm/s${ePrimeLatVal <= 7 ? " ≤7 ✓" : ""}`);
      if (ePrimeAvg !== null && ePrimeSepVal !== null && ePrimeLatVal !== null) parts.push(`avg ${ePrimeAvg.toFixed(1)} cm/s${ePrimeAvg <= 6.5 ? " ≤6.5 ✓" : ""}`);
      criteria.push(`e' (${parts.join(", ")}) → ${ePrimeReduced ? "REDUCED (Step 1 positive)" : "Normal"}`);
    }
    if (eeRatio !== null) criteria.push(`E/e' avg = ${eeRatio.toFixed(1)}${eeElevated ? " → Elevated (≥14)" : " → Normal (<14)"}`);
    if (has(trVmax)) criteria.push(`TR Vmax = ${trVmax} m/s${n(trVmax) >= 2.8 ? " → Abnormal (≥2.8)" : " → Normal (<2.8)"}${rvsp ? ` | RVSP ~${rvsp.toFixed(0)} mmHg` : ""}`);
    if (has(lars)) criteria.push(`LARS = ${lars}%${larsAbnGrade ? " → Reduced (≤18%)" : " → Normal (>18%)"}`);
    if (has(lavi)) criteria.push(`LAVI = ${lavi} mL/m²${laviAbnGrade ? " → Dilated (>34)" : " → Normal (≤34)"}`);
    if (has(pvSD)) criteria.push(`PV S/D = ${pvSD}${pvSDAbn ? " → Abnormal (≤0.67)" : " → Normal (>0.67)"}`);
    if (has(ivrt)) criteria.push(`IVRT = ${ivrt} ms${ivrtAbn ? " → Short (≤70 ms, elevated LAP)" : " → Normal (>70 ms)"}`);
    if (eaRatio !== null) criteria.push(`E/A = ${eaRatio.toFixed(2)}${eaRatio < 0.8 ? " → Impaired relaxation" : eaRatio >= 2 ? " → Restrictive" : " → Normal/pseudonormal"}`);
    if (has(ddt)) criteria.push(`E DT = ${ddt} ms${n(ddt) < 160 ? " → Short (restrictive)" : n(ddt) > 240 ? " → Prolonged (impaired relaxation)" : " → Normal"}`);

    if (!ePrimeEntered && !has(trVmax) && !eeRatio && !has(lavi)) {
      return { sev: "indeterminate", label: "Insufficient data", lap: "—", criteria: ["Enter e' (septal/lateral), E velocity, TR Vmax, and LAVI to apply ASE 2025 algorithms"] };
    }

    if (exclusion) {
      return { sev: "indeterminate", label: "Algorithm not applicable", lap: "—", criteria: [...criteria, "⚠ Exclusion criterion present (AF, MAC, MR, MS, LVAD, non-cardiac PH, HTX, or pericardial constriction) — standard ASE 2025 grading algorithm is not reliable in this context."], note: "Use clinical judgment and supplementary methods. Consider invasive hemodynamic assessment if filling pressures are clinically relevant." };
    }

    // ── ALGORITHM 2: Grading & LAP ──────────────────────────────────────────
    // All 3 variables normal
    if (ePrimeEntered && !ePrimeReduced && !eeElevated && !trAbn) {
      return { sev: "normal", label: "Normal Diastolic Function", lap: "Normal LAP", criteria, note: "All three grading variables are within normal limits. No evidence of elevated LV filling pressures.", ddDetected: false };
    }

    // Only e' reduced (Variable 1 only)
    if (ePrimeEntered && ePrimeReduced && !eeElevated && !trAbn) {
      if (eaRatio !== null && eaRatio <= 0.8) {
        return { sev: "mild", label: "Grade I Diastolic Dysfunction", lap: "Normal LAP", criteria, note: "Reduced e' with E/A ≤0.8 and no other elevated filling pressure markers = Grade I (impaired relaxation, normal LVEDP).", ddDetected: true };
      }
      if (eaRatio !== null && eaRatio > 0.8) {
        if (!secondaryEntered) {
          return { sev: "indeterminate", label: "Grade I vs II — Secondary criteria needed", lap: "Indeterminate", criteria: [...criteria, "Enter PV S/D, LARS, LAVI, or IVRT to distinguish Grade I from Grade II"], ddDetected: null };
        }
        if (secondaryPositive === 0) {
          return { sev: "mild", label: "Grade I Diastolic Dysfunction", lap: "Normal LAP", criteria, note: "Reduced e', E/A >0.8, but no secondary LAP markers present. Grade I — if symptomatic, consider Diastolic Exercise Echo.", ddDetected: true };
        }
        const ea = eaRatio;
        if (ea !== null && ea >= 2) {
          return { sev: "severe", label: "Grade III Diastolic Dysfunction", lap: "Increased LAP", criteria, note: `Reduced e', E/A ≥2, and ≥1 secondary LAP marker present (${secondaryPositive} of 4). Grade III — restrictive filling pattern with markedly elevated filling pressures.`, ddDetected: true };
        }
        return { sev: "moderate", label: "Grade II Diastolic Dysfunction", lap: "Increased LAP", criteria, note: `Reduced e', E/A >0.8, and ≥1 secondary LAP marker present (${secondaryPositive} of 4). Grade II — pseudonormal pattern with elevated filling pressures.`, ddDetected: true };
      }
    }

    // 3 of 3 variables abnormal → Increased LAP directly
    if (gradingVarsAbn === 3) {
      if (eaRatio !== null && eaRatio >= 2) {
        return { sev: "severe", label: "Grade III Diastolic Dysfunction", lap: "Increased LAP", criteria, note: "All 3 grading variables abnormal with E/A ≥2 = Grade III (restrictive, markedly elevated LAP).", ddDetected: true };
      }
      return { sev: "moderate", label: "Grade II Diastolic Dysfunction", lap: "Increased LAP", criteria, note: "All 3 grading variables abnormal with E/A <2 = Grade II (pseudonormal, elevated LAP).", ddDetected: true };
    }

    // Increased TR/PASP only OR Increased E/e' only OR any 2 abnormal → secondary branch
    if (gradingVarsAbn >= 1) {
      if (!secondaryEntered) {
        return { sev: "indeterminate", label: "LAP indeterminate — secondary criteria needed", lap: "Indeterminate", criteria: [...criteria, `${gradingVarsAbn} of 3 grading variable(s) abnormal. Enter PV S/D, LARS, LAVI, or IVRT to determine LAP.`], ddDetected: null };
      }
      if (secondaryPositive === 0) {
        // No secondary markers → Normal LAP
        if (ePrimeEntered && ePrimeReduced && eaRatio !== null && eaRatio <= 0.8) {
          return { sev: "mild", label: "Grade I Diastolic Dysfunction", lap: "Normal LAP", criteria, note: "Reduced e' with E/A ≤0.8 and no secondary LAP markers. Grade I — if symptomatic, consider Diastolic Exercise Echo.", ddDetected: true };
        }
        return { sev: "mild", label: "Grade I Diastolic Dysfunction", lap: "Normal LAP", criteria, note: `${gradingVarsAbn} grading variable(s) abnormal but no secondary LAP markers (PV S/D, LARS, LAVI, IVRT) present. Grade I — if symptomatic, consider Diastolic Exercise Echo.`, ddDetected: true };
      }
      // ≥1 secondary marker → Increased LAP
      if (eaRatio !== null && eaRatio >= 2) {
        return { sev: "severe", label: "Grade III Diastolic Dysfunction", lap: "Increased LAP", criteria, note: `${gradingVarsAbn} grading variable(s) abnormal, ${secondaryPositive} secondary LAP marker(s) present, E/A ≥2 = Grade III (restrictive, markedly elevated LAP).`, ddDetected: true };
      }
      return { sev: "moderate", label: "Grade II Diastolic Dysfunction", lap: "Increased LAP", criteria, note: `${gradingVarsAbn} grading variable(s) abnormal, ${secondaryPositive} secondary LAP marker(s) present, E/A <2 = Grade II (pseudonormal, elevated LAP).`, ddDetected: true };
    }

    return { sev: "indeterminate", label: "Indeterminate — enter more parameters", lap: "—", criteria, ddDetected: null };
  };

  // ── DD Detection (Algorithm 1) ──────────────────────────────────────────────
  const getDDDetection = (): { detected: boolean | null; reason: string } => {
    if (!ePrimeEntered) return { detected: null, reason: "Enter e' to assess Step 1" };
    if (ePrimeReduced && step2Positive >= 1) return { detected: true, reason: `e' reduced + ${step2Positive} Step 2 criterion/criteria met` };
    if (!ePrimeReduced && step2Positive >= 2) return { detected: true, reason: `e' preserved but ${step2Positive} Step 2 criteria met (≥2 required)` };
    if (ePrimeReduced && step2Positive === 0) return { detected: false, reason: "e' reduced but no Step 2 criteria met — not DD by algorithm" };
    if (!ePrimeReduced && step2Positive === 1) return { detected: false, reason: "e' preserved and only 1 Step 2 criterion met (need ≥2)" };
    if (!ePrimeReduced && step2Positive === 0) return { detected: false, reason: "e' normal and no Step 2 criteria met" };
    return { detected: null, reason: "Enter additional Step 2 parameters (E/e', LARS, E/A, LAVI)" };
  };

  const result = getGrade();
  const ddResult = getDDDetection();

  const getDiastEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate" && result.label === "Insufficient data") return null;
    if (result.sev === "normal") return {
      suggests: `EchoAssist™ Suggests: Normal diastolic function. All ASE 2025 grading variables within normal limits. LAP is estimated to be normal. No evidence of diastolic dysfunction.${ePrimeAvg ? " Average e' " + ePrimeAvg.toFixed(1) + " cm/s." : ""}${eeRatio ? " E/e' " + eeRatio.toFixed(1) + "." : ""}`,
      tip: "EchoAssist™ Tip: Ensure e' velocities are sampled at the septal and lateral mitral annulus using TDI with a low wall filter and high gain. Angle of incidence should be <20° for accurate velocity measurement."
    };
    if (result.label.includes("Grade I")) return {
      suggests: `EchoAssist™ Suggests: Grade I diastolic dysfunction (impaired relaxation pattern). e' is reduced indicating impaired LV relaxation.${eaRatio !== null ? " E/A " + eaRatio.toFixed(2) + "." : ""} LAP is estimated to be normal. LVEDP is not elevated at rest.`,
      note: `EchoAssist™ Note: Grade I is common in aging and hypertension. It reflects impaired active LV relaxation with normal filling pressures. ${result.lap === "Normal LAP" && eaRatio !== null && eaRatio > 0.8 ? "If symptomatic with unexplained dyspnea, consider Diastolic Exercise Echo — a rise in E/e' >14 or TR >2.8 m/s with exercise confirms exercise-induced elevated filling pressures." : ""}`,
      tip: "EchoAssist™ Tip: Valsalva maneuver may reveal a pseudonormal pattern converting to E/A <0.8, confirming Grade I rather than Grade II. Obtain PV S/D and LARS if not yet done."
    };
    if (result.label.includes("Grade II")) return {
      suggests: `EchoAssist™ Suggests: Grade II diastolic dysfunction (pseudonormal filling pattern). LAP is estimated to be elevated.${eeRatio ? " E/e' " + eeRatio.toFixed(1) + (eeElevated ? " (elevated ≥14)." : ".") : ""}${has(lars) ? " LARS " + lars + "%." : ""}${has(lavi) ? " LAVI " + lavi + " mL/m²." : ""} Mean LAP is elevated — consistent with HFpEF physiology.`,
      note: "EchoAssist™ Note: Grade II is associated with increased risk of HF hospitalization and AF. Evaluate for underlying hypertension, diabetes, obesity, or HFpEF. Valsalva maneuver should show E/A reversal to <0.8 (pseudonormal pattern).",
      tip: "EchoAssist™ Tip: Confirm with PV S/D ≤0.67 (blunted systolic filling), LARS ≤18%, or IVRT ≤70 ms. These secondary markers strengthen the diagnosis of elevated LAP."
    };
    if (result.label.includes("Grade III")) return {
      suggests: `EchoAssist™ Suggests: Grade III diastolic dysfunction (restrictive filling pattern). LAP is markedly elevated.${eaRatio !== null ? " E/A " + eaRatio.toFixed(2) + " (≥2.0 — restrictive)." : ""} This represents advanced diastolic impairment with significantly elevated LV filling pressures.`,
      note: "EchoAssist™ Note: Grade III carries a poor prognosis and is associated with advanced HF, cardiac amyloidosis, and constrictive pericarditis. Assess reversibility with Valsalva — if E/A remains ≥2 (irreversible restriction), this indicates more advanced disease and higher mortality risk.",
      tip: "EchoAssist™ Tip: In Grade III, IVRT is typically very short (<60 ms) and DT <160 ms. Cardiac amyloidosis should be excluded — check for apical-sparing strain pattern (RAS >1.0) and increased wall thickness."
    };
    if (result.label.includes("not applicable")) return {
      suggests: "EchoAssist™ Suggests: Standard ASE 2025 diastolic grading algorithm is not applicable due to an exclusion criterion (AF, MAC, significant MR/MS, LVAD, non-cardiac PH, HTX, or pericardial constriction).",
      note: "EchoAssist™ Note: In these conditions, standard E/e' thresholds and grading criteria are unreliable. Use clinical judgment, invasive hemodynamics, or condition-specific assessment protocols.",
      tip: "EchoAssist™ Tip: In AF, use averaged measurements over ≥5 beats. In significant MR, E/e' overestimates filling pressures. In constrictive pericarditis, look for respiratory variation in E velocity and annulus reversus (lateral e' > septal e')."
    };
    return {
      suggests: "EchoAssist™ Suggests: Diastolic function assessment is indeterminate. Additional parameters are needed to complete the ASE 2025 grading algorithm.",
      note: "EchoAssist™ Note: Enter PV S/D (normal >0.67), LARS (normal >18%), LAVI (normal ≤34 mL/m²), or IVRT (normal >70 ms) to determine LAP and complete grading.",
      tip: "EchoAssist™ Tip: If TR is absent or not measurable, LARS ≤18% or PV S/D ≤0.67 can substitute as surrogate markers of elevated filling pressures per ASE 2025 supplementary methods."
    };
  };

  const ddColor = ddResult.detected === true ? "#dc2626" : ddResult.detected === false ? "#15803d" : "#6b7280";

  return (
    <EngineSection id="engine-diastolic" title="Diastolic Function" subtitle="ASE 2025 · Two-step DD detection + Grading & LAP algorithm · e' · E/e' · TR · LARS · LAVI · PV S/D">
      {/* Exclusion toggle */}
      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
        <input type="checkbox" id="diastExclusion" checked={exclusion} onChange={e => setExclusion(e.target.checked)} className="w-4 h-4 accent-amber-500" />
        <label htmlFor="diastExclusion" className="text-xs text-amber-800 font-medium cursor-pointer">
          Exclusion present: AF · MAC · MR · MS · LVAD · Non-cardiac PH · HTX · Pericardial constriction
        </label>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="e' Septal" value={ePrimeSep} onChange={setEPrimeSep} unit="cm/s" placeholder="nl >7" hint="(nl >7 cm/s)" />
        <NumInput label="e' Lateral" value={ePrimeLat} onChange={setEPrimeLat} unit="cm/s" placeholder="nl >10" hint="(nl >10 cm/s)" />
        <NumInput label="E velocity" value={eVel} onChange={setEVel} unit="m/s" placeholder="e.g. 0.8" />
        <NumInput label="A velocity" value={aVel} onChange={setAVel} unit="m/s" placeholder="e.g. 0.6" />
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" hint="(nl <2.8)" />
        <NumInput label="LARS" value={lars} onChange={setLars} unit="%" placeholder="nl >18" hint="(nl >18%)" />
        <NumInput label="LAVI" value={lavi} onChange={setLavi} unit="mL/m²" placeholder="nl ≤34" hint="(nl ≤34)" />
        <NumInput label="PV S/D ratio" value={pvSD} onChange={setPvSD} unit="" placeholder="nl >0.67" hint="(nl >0.67)" />
        <NumInput label="IVRT" value={ivrt} onChange={setIvrt} unit="ms" placeholder="nl >70" hint="(nl 70–90 ms)" />
        <NumInput label="E Deceleration Time" value={ddt} onChange={setDdt} unit="ms" placeholder="nl 160–240" />
      </div>

      {/* Derived values summary */}
      {(ePrimeAvg !== null || eaRatio !== null || eeRatio !== null) && (
        <p className="text-xs text-gray-400 mt-2">
          {ePrimeAvg !== null ? `Avg e': ${ePrimeAvg.toFixed(1)} cm/s` : ""}
          {ePrimeAvg !== null && eaRatio !== null ? " | " : ""}
          {eaRatio !== null ? `E/A: ${eaRatio.toFixed(2)}` : ""}
          {eeRatio !== null ? ` | E/e': ${eeRatio.toFixed(1)}` : ""}
          {rvsp !== null ? ` | RVSP ~${rvsp.toFixed(0)} mmHg` : ""}
        </p>
      )}

      {/* Algorithm 1: DD Detection */}
      {ePrimeEntered && (
        <div className="mt-3 p-3 rounded-lg border" style={{ borderColor: ddColor + "40", background: ddColor + "08" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: ddColor }}>Algorithm 1 — DD Detection (ASE 2025 Figure 2)</p>
          <p className="text-xs" style={{ color: ddColor }}>
            {ddResult.detected === true ? "✓ Diastolic Dysfunction Detected" : ddResult.detected === false ? "✗ Diastolic Dysfunction Not Detected" : "⋯ Indeterminate"}
            {" — "}{ddResult.reason}
          </p>
          <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
            <p>Step 1 — e' reduced: {ePrimeReduced ? <span className="text-red-600 font-medium">Yes</span> : <span className="text-green-700 font-medium">No</span>}</p>
            <p>Step 2 — criteria met: {step2Positive}/4 (E/e&apos; &gt;14: {eeAbove14 ? "✓" : "✗"} · LARS≤18%: {larsAbnDD ? "✓" : has(lars) ? "✗" : "—"} · E/A≤0.8 or ≥2: {eaAbnDD ? "✓" : eaRatio !== null ? "✗" : "—"} · LAVI &gt;34: {laviAbnDD ? "✓" : has(lavi) ? "✗" : "—"})</p>
          </div>
        </div>
      )}

      {/* Algorithm 2: Grading & LAP */}
      <div className="mt-2">
        <p className="text-xs font-semibold text-gray-500 mb-1">Algorithm 2 — Grading & LAP (ASE 2025 Figure 3)</p>
        <ResultCard severity={result.sev} title="Diastolic Function Grade" value={`${result.label}${result.lap !== "—" ? " · " + result.lap : ""}`} criteria={result.criteria} note={result.note} />
      </div>

      <EchoAssistPanel output={getDiastEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: <a href="https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#189aa1] transition-colors">ASE 2025 Left Ventricular Diastolic Function Guidelines (Nagueh et al., JASE 2025)</a></p>
    </EngineSection>
  );
}

// ─── STRAIN ENGINE ────────────────────────────────────────────────────────────
function StrainEngine() {
  const [lvGls, setLvGls] = useState("");
  const [rvFws, setRvFws] = useState("");
  const [lars, setLars] = useState("");
  const [rars, setRars] = useState("");
  const [lvSr, setLvSr] = useState("");
  const [rvSr, setRvSr] = useState("");
  // RAS (Relative Apical Strain)
  const [rasApical, setRasApical] = useState("");
  const [rasBasal, setRasBasal] = useState("");
  const [rasMid, setRasMid] = useState("");
  const rasApicalNum = parseFloat(rasApical);
  const rasBasalNum = parseFloat(rasBasal);
  const rasMidNum = parseFloat(rasMid);
  const rasValue = (!isNaN(rasApicalNum) && !isNaN(rasBasalNum) && !isNaN(rasMidNum) && (rasBasalNum + rasMidNum) !== 0)
    ? Math.abs(rasApicalNum) / (Math.abs(rasBasalNum) + Math.abs(rasMidNum))
    : null;
  const rasInterpretation = rasValue !== null
    ? rasValue > 1.0
      ? { label: "Apical-Sparing Pattern", color: "#dc2626", text: `EchoAssist™ Suggests: RAS = ${rasValue.toFixed(2)} (> 1.0). This apical-sparing longitudinal strain pattern is a hallmark of cardiac amyloidosis (sensitivity ~80%, specificity ~80% vs. HCM). Prompt further evaluation with T1 mapping, nuclear scintigraphy (PYP/DPD), or serum/urine protein electrophoresis.`, note: "EchoAssist™ Note: Apical-sparing strain is defined as relatively preserved apical GLS with disproportionate reduction in basal and mid-ventricular segments. This pattern reflects the characteristic base-to-apex amyloid deposition gradient.", tip: "EchoAssist™ Tip: RAS > 1.0 combined with increased LV wall thickness (≥ 12 mm), low-voltage ECG, and diastolic dysfunction should trigger a comprehensive amyloidosis workup. Transthyretin (ATTR) amyloidosis is treatable with tafamidis." }
      : { label: "Non-Apical-Sparing Pattern", color: "#15803d", text: `EchoAssist™ Suggests: RAS = ${rasValue.toFixed(2)} (≤ 1.0). No apical-sparing pattern identified. This does not exclude amyloidosis but makes it less likely. Diffuse or ischemic patterns should be considered based on clinical context.`, note: "EchoAssist™ Note: RAS ≤ 1.0 with reduced GLS is more consistent with ischemic cardiomyopathy, dilated cardiomyopathy, or HCM. Regional wall motion abnormalities and coronary territory correlation are recommended.", tip: "EchoAssist™ Tip: In HCM, strain is typically reduced in the hypertrophied segments (often septal/basal) with relatively preserved apical strain — RAS may approach but usually does not exceed 1.0 as prominently as in amyloidosis." }
    : null;

  const getLvGlsSeverity = (): { sev: Severity; label: string; criteria: string[] } => {
    if (!has(lvGls)) return { sev: "indeterminate", label: "Enter LV GLS", criteria: [] };
    const val = n(lvGls);
    const criteria = [`LV GLS = ${lvGls}% (ASE 2025 normal threshold ≤ −18%)`];
    if (has(lvSr)) criteria.push(`LV peak systolic strain rate = ${lvSr} s⁻¹ (nl ≤ −1.0 s⁻¹)`);
    if (val <= -20) return { sev: "normal", label: "Normal LV GLS (≤ −20%)", criteria };
    if (val <= -18) return { sev: "normal", label: "Normal LV GLS (−18 to −20%)", criteria: [...criteria, "Within ASE 2025 normal range"] };
    if (val <= -16) return { sev: "mild", label: "Mildly Impaired LV GLS (−16 to −18%)", criteria: [...criteria, "Borderline — subclinical myocardial dysfunction suspected"] };
    if (val <= -12) return { sev: "moderate", label: "Moderately Impaired LV GLS (−12 to −16%)", criteria: [...criteria, "Significant myocardial strain — consider cardiotoxicity, HCM, infiltrative disease"] };
    return { sev: "severe", label: "Severely Impaired LV GLS (> −12%)", criteria: [...criteria, "Advanced myocardial dysfunction — high clinical significance"] };
  };

  const getRvFwsSeverity = (): { sev: Severity; label: string; criteria: string[] } => {
    if (!has(rvFws)) return { sev: "indeterminate", label: "Enter RV Free Wall Strain", criteria: [] };
    const val = n(rvFws);
    const criteria = [`RV free wall strain = ${rvFws}% (ASE 2025 normal ≤ −20%)`];
    if (has(rvSr)) criteria.push(`RV peak systolic strain rate = ${rvSr} s⁻¹`);
    if (val <= -20) return { sev: "normal", label: "Normal RV Free Wall Strain (≤ −20%)", criteria };
    if (val <= -17) return { sev: "mild", label: "Mildly Impaired RV FWS (−17 to −20%)", criteria: [...criteria, "Early RV myocardial dysfunction — monitor closely"] };
    if (val <= -12) return { sev: "moderate", label: "Moderately Impaired RV FWS (−12 to −17%)", criteria: [...criteria, "Significant RV dysfunction — consider RV pressure/volume overload"] };
    return { sev: "severe", label: "Severely Impaired RV FWS (> −12%)", criteria: [...criteria, "Severe RV myocardial dysfunction"] };
  };

  const getLarsSeverity = (): { sev: Severity; label: string; criteria: string[] } => {
    if (!has(lars)) return { sev: "indeterminate", label: "Enter LARS", criteria: [] };
    const val = n(lars);
    const criteria = [`LA reservoir strain (LARS) = ${lars}% (normal ≥ 35%)`];
    if (val >= 35) return { sev: "normal", label: "Normal LA Reservoir Strain (≥35%)", criteria: [...criteria, "Preserved LA reservoir function"] };
    if (val >= 25) return { sev: "mild", label: "Mildly Impaired LARS (25–34%)", criteria: [...criteria, "Early LA myopathy — independent predictor of AF recurrence and elevated filling pressures"] };
    if (val >= 18) return { sev: "moderate", label: "Moderately Impaired LARS (18–24%)", criteria: [...criteria, "Significant LA dysfunction — associated with elevated LV filling pressures"] };
    return { sev: "severe", label: "Severely Impaired LARS (<18%)", criteria: [...criteria, "Advanced LA myopathy — high risk for AF, stroke, and HF hospitalization"] };
  };

  const getRarsSeverity = (): { sev: Severity; label: string; criteria: string[] } => {
    if (!has(rars)) return { sev: "indeterminate", label: "Enter RARS", criteria: [] };
    const val = n(rars);
    const criteria = [`RA reservoir strain (RARS) = ${rars}% (normal ≥ 35%)`];
    if (val >= 35) return { sev: "normal", label: "Normal RA Reservoir Strain (≥35%)", criteria };
    if (val >= 25) return { sev: "mild", label: "Mildly Impaired RARS (25–34%)", criteria: [...criteria, "Early RA myopathy"] };
    if (val >= 18) return { sev: "moderate", label: "Moderately Impaired RARS (18–24%)", criteria: [...criteria, "Significant RA dysfunction — consider RV pressure overload or TR"] };
    return { sev: "severe", label: "Severely Impaired RARS (<18%)", criteria: [...criteria, "Advanced RA myopathy — high risk for adverse outcomes"] };
  };

  const lvResult = getLvGlsSeverity();
  const rvResult = getRvFwsSeverity();
  const laResult = getLarsSeverity();
  const raResult = getRarsSeverity();

  return (
    <EngineSection id="engine-strain" title="Myocardial Strain (ASE 2025)" subtitle="LV GLS · RV Free Wall Strain · LA Reservoir Strain · RA Reservoir Strain">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="LV GLS" value={lvGls} onChange={setLvGls} unit="%" placeholder="nl ≤ −18" hint="(nl ≤ −18%)" />
        <NumInput label="LV Strain Rate" value={lvSr} onChange={setLvSr} unit="s⁻¹" placeholder="nl ≤ −1.0" />
        <NumInput label="RV Free Wall Strain" value={rvFws} onChange={setRvFws} unit="%" placeholder="nl ≤ −20" hint="(nl ≤ −20%)" />
        <NumInput label="RV Strain Rate" value={rvSr} onChange={setRvSr} unit="s⁻¹" placeholder="nl ≤ −1.0" />
        <NumInput label="LA Reservoir Strain (LARS)" value={lars} onChange={setLars} unit="%" placeholder="nl ≥ 35" hint="(nl ≥35%)" />
        <NumInput label="RA Reservoir Strain (RARS)" value={rars} onChange={setRars} unit="%" placeholder="nl ≥ 35" hint="(nl ≥35%)" />
      </div>
      <div className="space-y-0">
        {has(lvGls) && <ResultCard severity={lvResult.sev} title="LV Global Longitudinal Strain" value={lvResult.label} criteria={lvResult.criteria} />}
        {has(rvFws) && <ResultCard severity={rvResult.sev} title="RV Free Wall Strain" value={rvResult.label} criteria={rvResult.criteria} />}
        {has(lars) && <ResultCard severity={laResult.sev} title="LA Reservoir Strain" value={laResult.label} criteria={laResult.criteria} />}
        {has(rars) && <ResultCard severity={raResult.sev} title="RA Reservoir Strain" value={raResult.label} criteria={raResult.criteria} />}
        {!has(lvGls) && !has(rvFws) && !has(lars) && !has(rars) && (
          <div className="mt-3 text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Enter any strain value above to see guideline-based interpretation
          </div>
        )}
      </div>
      <EchoAssistPanel output={(() => {
        const anyEntered = has(lvGls) || has(rvFws) || has(lars) || has(rars);
        if (!anyEntered) return null;
        const lvAbn = has(lvGls) && lvResult.sev !== "normal" && lvResult.sev !== "indeterminate";
        const rvAbn = has(rvFws) && rvResult.sev !== "normal" && rvResult.sev !== "indeterminate";
        const laAbn = has(lars) && laResult.sev !== "normal" && laResult.sev !== "indeterminate";
        const suggests = [
          has(lvGls) ? `LV GLS ${lvGls}% is ${lvAbn ? "impaired (threshold ≤ −18%)" : "within normal limits"}` : null,
          has(rvFws) ? `RV free wall strain ${rvFws}% is ${rvAbn ? "impaired (threshold ≤ −20%)" : "within normal limits"}` : null,
          has(lars) ? `LARS ${lars}% is ${laAbn ? "reduced (threshold ≥35%)" : "within normal limits"}` : null,
        ].filter(Boolean).join("; ");
        const note = laAbn ? "Reduced LARS (<18%) is an independent predictor of elevated LV filling pressures per ASE 2025 diastolic guidelines and may substitute for TR Vmax when TR is absent." :
          lvAbn ? "Impaired LV GLS in the setting of preserved EF suggests subclinical myocardial dysfunction. Consider cardiotoxicity surveillance, infiltrative cardiomyopathy, or early HCM." : undefined;
        const tip = has(lvGls) ? "LV GLS should be reported as a negative percentage (e.g., −20%). Ensure vendor-neutral values are used when comparing across platforms — a 2% inter-vendor variability is expected." :
          has(lars) ? "LARS is best measured using speckle-tracking echocardiography in the A4C and A2C views. Ensure adequate frame rate (50–80 fps) for accurate tracking." : undefined;
        return { suggests: suggests || "Strain parameters entered.", note, tip };
      })()}
      />
      {/* RAS Calculator */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-sm font-bold text-gray-700 mb-1">Relative Apical Strain (RAS) Calculator</div>
        <div className="text-xs text-gray-500 mb-3">Apical-sparing pattern · Amyloidosis vs. HCM · RAS = |Apical GLS| / (|Basal GLS| + |Mid GLS|)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <NumInput label="Apical GLS (average)" value={rasApical} onChange={setRasApical} unit="%" placeholder="e.g. −19.5" hint="Apical 4 segments avg" />
          <NumInput label="Basal GLS (average)" value={rasBasal} onChange={setRasBasal} unit="%" placeholder="e.g. −12.0" hint="Basal 6 segments avg" />
          <NumInput label="Mid GLS (average)" value={rasMid} onChange={setRasMid} unit="%" placeholder="e.g. −14.0" hint="Mid 6 segments avg" />
        </div>
        {rasValue !== null && (
          <div className="rounded-lg p-3 mb-3 flex items-center gap-3" style={{ background: "#f0fbfc", border: "1px solid #189aa140" }}>
            <div className="text-3xl font-black font-mono" style={{ color: "#189aa1" }}>{rasValue.toFixed(2)}</div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">RAS Value</div>
              <div className="text-xs text-gray-600">Threshold: &gt; 1.0 = apical-sparing pattern</div>
            </div>
          </div>
        )}
        {rasInterpretation && (
          <div className="rounded-lg p-4 mb-3" style={{ background: rasInterpretation.color + "18", borderLeft: `4px solid ${rasInterpretation.color}` }}>
            <div className="font-bold text-sm mb-2" style={{ color: rasInterpretation.color }}>{rasInterpretation.label}</div>
            <p className="text-xs text-gray-700 leading-relaxed mb-2">{rasInterpretation.text}</p>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{rasInterpretation.note}</p>
            <p className="text-xs text-gray-500 leading-relaxed italic">{rasInterpretation.tip}</p>
          </div>
        )}
        {rasValue === null && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
            <strong>How to use:</strong> Enter the average strain values for the apical segments (segments 13–17), basal segments (1–6), and mid segments (7–12) from the Strain Navigator bull's-eye. RAS &gt; 1.0 indicates an apical-sparing pattern, a hallmark of cardiac amyloidosis.
          </div>
        )}
      </div>

      {/* Clinical Applications */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-sm font-bold text-gray-700 mb-1">Clinical Pattern Library</div>
        <div className="text-xs text-gray-500 mb-3">Interactive disease-specific strain patterns have moved to Strain ScanCoach</div>
        <a
          href="/strain-scan-coach"
          className="flex items-center justify-between gap-3 rounded-xl p-4 border-2 transition-all hover:shadow-md group"
          style={{ background: "#f0fbfc", borderColor: "#189aa1" + "40" }}
        >
          <div>
            <div className="font-bold text-sm text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>Strain ScanCoach — Clinical Pattern Library</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              10 clickable disease patterns (DCM, HCM, ATTR amyloid, LAD/RCA ischemia, Takotsubo, cardiotoxicity, myocarditis, LBBB) that load representative 17-segment values into the interactive bull's-eye for visual comparison and teaching.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-xs text-white" style={{ background: "#189aa1" }}>
            Open
          </div>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-3">Reference: ASE 2025 Strain Guideline (Thomas et al.); ASE 2015 LARS/RARS recommendations</p>
    </EngineSection>
  );
}

// ─── RV FUNCTION ENGINE ───────────────────────────────────────────────────────
function RVFunctionEngine() {
  const [tapse, setTapse] = useState("");
  const [rvSPrime, setRvSPrime] = useState("");
  const [rvFac, setRvFac] = useState("");
  const [rvedd, setRvedd] = useState("");
  const [rvsp, setRvsp] = useState("");
  const [trVmax, setTrVmax] = useState("");

  const rvsFromTr = has(trVmax) ? 4 * Math.pow(n(trVmax), 2) : null;

  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!has(tapse) && !has(rvSPrime) && !has(rvFac)) return { sev: "indeterminate", label: "Enter TAPSE, S', or FAC", criteria: [] };
    const criteria: string[] = [];
    let abnormalCount = 0;
    let totalCount = 0;

    if (has(tapse)) {
      totalCount++;
      const t = n(tapse);
      criteria.push(`TAPSE = ${tapse} mm${t < 14 ? " → significantly reduced (<14 mm)" : t < 17 ? " → mildly reduced (14–16 mm)" : " → normal (≥17 mm)"}`);
      if (t < 17) abnormalCount++;
    }

    if (has(rvSPrime)) {
      totalCount++;
      const s = n(rvSPrime);
      criteria.push(`RV S' (TDI) = ${rvSPrime} cm/s${s < 9.5 ? " → reduced (<9.5 cm/s)" : " → normal (≥9.5 cm/s)"}`);
      if (s < 9.5) abnormalCount++;
    }

    if (has(rvFac)) {
      totalCount++;
      const f = n(rvFac);
      criteria.push(`RV FAC = ${rvFac}%${f < 35 ? " → reduced (<35%)" : " → normal (≥35%)"}`);
      if (f < 35) abnormalCount++;
    }

    if (has(rvedd)) {
      criteria.push(`RV basal diameter = ${rvedd} mm${n(rvedd) > 41 ? " → dilated (>41 mm)" : " → normal"}`);
    }

    const rvsDisplay = n(rvsp) || rvsFromTr;
    if (rvsDisplay) {
      criteria.push(`Estimated RVSP = ${rvsDisplay.toFixed(0)} mmHg${rvsDisplay > 50 ? " → severe pulmonary hypertension" : rvsDisplay > 35 ? " → elevated" : " → normal"}`);
    }

    let sev: Severity;
    let label: string;
    const ratio = totalCount > 0 ? abnormalCount / totalCount : 0;

    if (ratio === 0) { sev = "normal"; label = "Normal RV Systolic Function"; }
    else if (ratio <= 0.33) { sev = "mild"; label = "Mildly Reduced RV Systolic Function"; }
    else if (ratio <= 0.66) { sev = "moderate"; label = "Moderately Reduced RV Systolic Function"; }
    else { sev = "severe"; label = "Severely Reduced RV Systolic Function"; }

    return { sev, label, criteria };
  };

  const result = getSeverity();

  return (
    <EngineSection id="engine-rv" title="RV Systolic Function" subtitle="TAPSE · S' · FAC · RV size · RVSP">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="TAPSE" value={tapse} onChange={setTapse} unit="mm" placeholder="nl ≥17" hint="(nl ≥17)" />
        <NumInput label="RV S' (TDI)" value={rvSPrime} onChange={setRvSPrime} unit="cm/s" placeholder="nl ≥9.5" hint="(nl ≥9.5)" />
        <NumInput label="RV FAC" value={rvFac} onChange={setRvFac} unit="%" placeholder="nl ≥35" hint="(nl ≥35%)" />
        <NumInput label="RV Basal Diameter" value={rvedd} onChange={setRvedd} unit="mm" placeholder="nl <41" />
        <NumInput label="Estimated RVSP" value={rvsp} onChange={setRvsp} unit="mmHg" placeholder="nl <35" />
        <NumInput label="TR Vmax (for RVSP)" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" />
      </div>
      {rvsFromTr && <p className="text-xs text-gray-400 mt-2">RVSP from TR Vmax: {rvsFromTr.toFixed(0)} mmHg</p>}
      <ResultCard severity={result.sev} title="RV Systolic Function" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={(() => {
        if (result.sev === "indeterminate") return null;
        if (result.sev === "normal") return {
          suggests: "Findings are consistent with normal RV systolic function. TAPSE, S\u2019, and FAC are within normal limits.",
          tip: "TAPSE is measured from the apical 4-chamber view with M-mode cursor placed at the lateral tricuspid annulus. Ensure the cursor is parallel to the direction of annular motion for accurate measurement."
        };
        const sev = result.sev;
        return {
          suggests: `Findings are consistent with ${sev === "mild" ? "mildly" : sev === "moderate" ? "moderately" : "severely"} reduced RV systolic function.${has(tapse) ? " TAPSE " + tapse + " mm" + (n(tapse) < 17 ? " (reduced, nl \u226517 mm)" : "") + "." : ""}${has(rvSPrime) ? " RV S\u2019 " + rvSPrime + " cm/s" + (n(rvSPrime) < 9.5 ? " (reduced, nl \u22659.5 cm/s)" : "") + "." : ""}`,
          note: sev === "severe" ? "Severely reduced RV function warrants evaluation for pulmonary hypertension, RV infarction, or cardiomyopathy. RV-PA coupling (TAPSE/RVSP ratio <0.55 mm/mmHg) may indicate uncoupled RV-PA physiology." :
            "RV dysfunction may be secondary to pressure overload (PH, PE), volume overload (TR, ASD), or primary myocardial disease. Assess TR severity and PA pressure to determine etiology.",
          tip: "RV free wall strain (FWS) by speckle-tracking is a sensitive marker of early RV dysfunction, particularly in pulmonary hypertension and right heart failure. FWS < \u221220% is abnormal per ASE 2025."
        };
      })()}
      />
      <p className="text-xs text-gray-400 mt-3">Reference: <a href='https://www.asecho.org/wp-content/uploads/2025/03/PIIS0894731725000379.pdf' target='_blank' rel='noopener noreferrer' className='underline hover:text-[#189aa1]'>ASE 2025 Right Heart & PH Guidelines</a>; ASE 2025 Strain Guideline</p>
    </EngineSection>
  );
}

// ─── TRICUSPID REGURGITATION ENGINE ─────────────────────────────────────────
function TricuspidRegurgEngine() {
  const [vcTr, setVcTr] = useState("");
  const [eroaTr, setEroaTr] = useState("");
  const [regVolTr, setRegVolTr] = useState("");
  const [pisaRadiusTr, setPisaRadiusTr] = useState("");
  const [trVmax, setTrVmax] = useState("");
  const [rvBasal, setRvBasal] = useState("");
  const [raArea, setRaArea] = useState("");
  const [ivcDiam, setIvcDiam] = useState("");
  const [ivcCollapse, setIvcCollapse] = useState("");
  const [hepaticVein, setHepaticVein] = useState<"" | "normal" | "blunted" | "reversal">("" );
  const [jetArea, setJetArea] = useState("");

  // PISA EROA at 28 cm/s aliasing (standard for TR)
  const pisaEroaTr = has(pisaRadiusTr, trVmax)
    ? (2 * Math.PI * Math.pow(n(pisaRadiusTr), 2) * 28) / (n(trVmax) * 100)
    : null;

  // RVSP from TR Vmax (simplified Bernoulli)
  const rvsp = has(trVmax) ? 4 * Math.pow(n(trVmax), 2) : null;

  // RAP estimate from IVC
  const rapEstimate = (): number | null => {
    if (!has(ivcDiam)) return null;
    const d = n(ivcDiam);
    if (d <= 21 && ivcCollapse === "normal") return 3;   // ≤21 mm + >50% collapse → 3 mmHg
    if (d <= 21 && ivcCollapse === "blunted") return 8;  // ≤21 mm + <50% collapse → 8 mmHg
    if (d > 21 && ivcCollapse === "normal") return 8;    // >21 mm + >50% collapse → 8 mmHg
    if (d > 21 && ivcCollapse === "blunted") return 15;  // >21 mm + <50% collapse → 15 mmHg
    return null;
  };
  const rap = rapEstimate();
  const rvsWithRap = rvsp !== null && rap !== null ? rvsp + rap : null;

  // ─── ASE/AHA 2021 Severity Grading ───────────────────────────────────────────
  // Criteria: vena contracta, EROA (PISA), regurgitant volume, jet area, hepatic vein flow
  // Mild: VC <7 mm, EROA <0.20 cm², RVol <30 mL, jet area <5 cm²
  // Moderate: VC 7–13 mm, EROA 0.20–0.39 cm², RVol 30–44 mL
  // Severe: VC ≥14 mm, EROA ≥0.40 cm², RVol ≥45 mL, systolic reversal in hepatic veins
  // Massive/Torrential (Hahn 2019 / ESC 2021): VC ≥21 mm, EROA ≥0.75 cm², RVol ≥45 mL
  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    const anyData = has(vcTr) || has(eroaTr) || has(regVolTr) || has(pisaRadiusTr) || has(jetArea) || hepaticVein !== "";
    if (!anyData) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter vena contracta, EROA, regurgitant volume, or jet area to classify TR severity"] };

    const criteria: string[] = [];
    let sevScore = 0; // 0=normal/trace, 1=mild, 2=moderate, 3=severe, 4=massive
    let votes = 0;

    // Vena contracta (most reliable single parameter)
    if (has(vcTr)) {
      const vc = n(vcTr);
      criteria.push(`Vena contracta = ${vcTr} mm`);
      if (vc >= 21) { criteria.push("VC ≥21 mm → massive/torrential"); sevScore = Math.max(sevScore, 4); votes++; }
      else if (vc >= 14) { criteria.push("VC 14–20 mm → severe"); sevScore = Math.max(sevScore, 3); votes++; }
      else if (vc >= 7) { criteria.push("VC 7–13 mm → moderate"); sevScore = Math.max(sevScore, 2); votes++; }
      else { criteria.push("VC <7 mm → mild"); sevScore = Math.max(sevScore, 1); votes++; }
    }

    // EROA (entered directly or from PISA)
    const effectiveEroa = n(eroaTr) || pisaEroaTr || 0;
    if (pisaEroaTr) criteria.push(`EROA by PISA = ${pisaEroaTr.toFixed(2)} cm²`);
    if (has(eroaTr)) criteria.push(`EROA (entered) = ${eroaTr} cm²`);
    if (effectiveEroa > 0) {
      if (effectiveEroa >= 0.75) { criteria.push("EROA ≥0.75 cm² → massive/torrential"); sevScore = Math.max(sevScore, 4); votes++; }
      else if (effectiveEroa >= 0.40) { criteria.push("EROA 0.40–0.74 cm² → severe"); sevScore = Math.max(sevScore, 3); votes++; }
      else if (effectiveEroa >= 0.20) { criteria.push("EROA 0.20–0.39 cm² → moderate"); sevScore = Math.max(sevScore, 2); votes++; }
      else { criteria.push("EROA <0.20 cm² → mild"); sevScore = Math.max(sevScore, 1); votes++; }
    }

    // Regurgitant volume
    if (has(regVolTr)) {
      const rv = n(regVolTr);
      criteria.push(`Regurgitant volume = ${regVolTr} mL`);
      if (rv >= 45) { criteria.push("RVol ≥45 mL → severe"); sevScore = Math.max(sevScore, 3); votes++; }
      else if (rv >= 30) { criteria.push("RVol 30–44 mL → moderate"); sevScore = Math.max(sevScore, 2); votes++; }
      else { criteria.push("RVol <30 mL → mild"); sevScore = Math.max(sevScore, 1); votes++; }
    }

    // Jet area (color Doppler — supportive only)
    if (has(jetArea)) {
      const ja = n(jetArea);
      criteria.push(`TR jet area = ${jetArea} cm²`);
      if (ja >= 10) { criteria.push("Jet area ≥10 cm² → severe (supportive)"); sevScore = Math.max(sevScore, 3); }
      else if (ja >= 5) { criteria.push("Jet area 5–9 cm² → moderate (supportive)"); sevScore = Math.max(sevScore, 2); }
      else { criteria.push("Jet area <5 cm² → mild (supportive)"); }
    }

    // Hepatic vein flow
    if (hepaticVein !== "") {
      if (hepaticVein === "reversal") {
        criteria.push("Hepatic vein systolic flow reversal → severe/massive TR");
        sevScore = Math.max(sevScore, 3);
        votes++;
      } else if (hepaticVein === "blunted") {
        criteria.push("Hepatic vein systolic flow blunting → at least moderate TR");
        sevScore = Math.max(sevScore, 2);
        votes++;
      } else {
        criteria.push("Hepatic vein systolic flow normal → mild/no TR");
      }
    }

    // RV/RA size context
    if (has(rvBasal)) {
      const rv = n(rvBasal);
      criteria.push(`RV basal diameter = ${rvBasal} mm${rv > 41 ? " → dilated (>41 mm)" : " → normal"}`);
    }
    if (has(raArea)) {
      const ra = n(raArea);
      criteria.push(`RA area = ${raArea} cm²${ra > 18 ? " → dilated (>18 cm²)" : " → normal"}`);
    }
    if (rvsp !== null) criteria.push(`TR Vmax = ${trVmax} m/s → RVSP gradient = ${rvsp.toFixed(0)} mmHg`);
    if (rvsWithRap !== null) criteria.push(`Estimated RVSP (with RAP ${rap} mmHg) = ${rvsWithRap.toFixed(0)} mmHg`);
    if (has(ivcDiam)) criteria.push(`IVC diameter = ${ivcDiam} mm${n(ivcDiam) > 21 ? " → dilated" : " → normal"}`);

    let sev: Severity;
    let label: string;
    if (sevScore === 0) { sev = "normal"; label = "Trace / No Significant Tricuspid Regurgitation"; }
    else if (sevScore === 1) { sev = "mild"; label = "Mild Tricuspid Regurgitation"; }
    else if (sevScore === 2) { sev = "moderate"; label = "Moderate Tricuspid Regurgitation"; }
    else if (sevScore === 3) { sev = "severe"; label = "Severe Tricuspid Regurgitation"; }
    else { sev = "critical"; label = "Massive / Torrential Tricuspid Regurgitation"; }

    return { sev, label, criteria };
  };

  const result = getSeverity();

  const getTrEchoAssist = (): EchoAssistOutput | null => {
    if (result.sev === "indeterminate") return null;

    const vcStr = has(vcTr) ? ` (vena contracta ${vcTr} mm)` : "";
    const eroaStr = pisaEroaTr ? `, EROA ${pisaEroaTr.toFixed(2)} cm²` : has(eroaTr) ? `, EROA ${eroaTr} cm²` : "";
    const rvStr = has(regVolTr) ? `, regurgitant volume ${regVolTr} mL` : "";
    const rvsStr = rvsWithRap ? ` Estimated RVSP ${rvsWithRap.toFixed(0)} mmHg.` : rvsp ? ` TR Vmax ${trVmax} m/s (RVSP gradient ${rvsp.toFixed(0)} mmHg).` : "";

    if (result.sev === "normal") return {
      suggests: "No hemodynamically significant tricuspid regurgitation identified. Trace TR is a normal physiologic finding in up to 65–85% of healthy adults.",
      tip: "Optimize color Doppler gain and set Nyquist limit to 50–60 cm/s when assessing TR. The RV-focused apical 4-chamber view and parasternal RV inflow view provide the best windows for TR jet assessment."
    };

    if (result.sev === "mild") return {
      suggests: `Findings are consistent with mild tricuspid regurgitation${vcStr}. RV volume loading is minimal at rest.`,
      note: "Mild TR is generally well tolerated and does not require intervention. Annual echocardiographic follow-up is appropriate if RV dilation or elevated PA pressure is present.",
      tip: "Vena contracta width is the most reproducible single parameter for TR grading. Measure at the narrowest portion of the TR jet in the parasternal RV inflow or apical 4-chamber view, perpendicular to the jet direction."
    };

    if (result.sev === "moderate") return {
      suggests: `Findings are consistent with moderate tricuspid regurgitation${vcStr}${eroaStr}${rvStr}.${rvsStr} RV volume overload is present and warrants clinical monitoring.`,
      note: "Moderate TR requires echocardiographic surveillance every 1–2 years. Assess for RV dilation (basal diameter >41 mm), RA dilation (area >18 cm²), and IVC plethora as markers of hemodynamic significance. Concomitant left-sided valve disease or pulmonary hypertension may accelerate progression.",
      tip: "Hepatic vein pulsed-wave Doppler is a key supportive parameter. Systolic flow blunting (S/D ratio <1) indicates at least moderate TR. Systolic flow reversal is specific for severe TR. Sample from the right hepatic vein 1–2 cm from the IVC junction."
    };

    if (result.sev === "severe") return {
      suggests: `Findings are consistent with severe tricuspid regurgitation${vcStr}${eroaStr}${rvStr}.${rvsStr} Significant RV volume overload is present. Tricuspid valve intervention should be considered in symptomatic patients or those undergoing concomitant left-sided surgery.`,
      note: "Severe TR with symptoms (fatigue, dyspnea, hepatic congestion, peripheral edema) or progressive RV dilation is a Class IIa indication for tricuspid valve repair or replacement. Isolated severe TR surgery carries higher risk — early intervention before RV dysfunction develops is preferred.",
      tip: "In severe TR, the PISA method may underestimate EROA due to flow convergence zone flattening. Use a combination of vena contracta, EROA, regurgitant volume, and hepatic vein flow reversal to confirm severity. 3D color Doppler vena contracta area is the most accurate method when available."
    };

    // Massive/Torrential
    return {
      suggests: `Findings are consistent with massive/torrential tricuspid regurgitation${vcStr}${eroaStr}${rvStr}.${rvsStr} Severe RV volume overload with likely right heart failure physiology. Urgent cardiology evaluation is warranted.`,
      note: "Massive TR (VC ≥21 mm, EROA ≥0.75 cm²) is associated with advanced right heart failure, hepatic congestion, and poor prognosis. Tricuspid valve intervention — surgical or transcatheter (TEER, replacement) — should be urgently considered. Assess for RV-PA uncoupling (TAPSE/RVSP <0.55 mm/mmHg).",
      tip: "In massive TR, the RV may appear severely dilated with paradoxical septal motion. Assess RV systolic function carefully — a low TAPSE in the setting of massive TR may reflect volume-mediated dysfunction rather than intrinsic myocardial disease. Post-intervention RV recovery is possible with timely repair."
    };
  };

  return (
    <EngineSection id="engine-tr" title="Tricuspid Regurgitation" subtitle="Vena contracta · EROA · PISA · Regurgitant volume · Hepatic vein flow">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Vena Contracta" value={vcTr} onChange={setVcTr} unit="mm" placeholder="sev ≥14" hint="(sev ≥14 mm)" />
        <NumInput label="EROA" value={eroaTr} onChange={setEroaTr} unit="cm²" placeholder="sev ≥0.40" />
        <NumInput label="Regurgitant Volume" value={regVolTr} onChange={setRegVolTr} unit="mL" placeholder="sev ≥45" />
        <NumInput label="PISA Radius" value={pisaRadiusTr} onChange={setPisaRadiusTr} unit="cm" placeholder="e.g. 0.8" hint="(at 28 cm/s alias)" />
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" hint="(for RVSP)" />
        <NumInput label="TR Jet Area" value={jetArea} onChange={setJetArea} unit="cm²" placeholder="sev ≥10" hint="(supportive)" />
        <NumInput label="RV Basal Diameter" value={rvBasal} onChange={setRvBasal} unit="mm" placeholder="nl <41" />
        <NumInput label="RA Area" value={raArea} onChange={setRaArea} unit="cm²" placeholder="nl <18" />
        <NumInput label="IVC Diameter" value={ivcDiam} onChange={setIvcDiam} unit="mm" placeholder="nl ≤21" />
      </div>

      {/* IVC collapse and hepatic vein selectors */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">IVC Collapse with Sniff</label>
          <select
            value={ivcCollapse}
            onChange={e => setIvcCollapse(e.target.value as "" | "normal" | "blunted")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]"
          >
            <option value="">— select —</option>
            <option value="normal">&gt;50% collapse (normal)</option>
            <option value="blunted">&lt;50% collapse (blunted)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Hepatic Vein Systolic Flow</label>
          <select
            value={hepaticVein}
            onChange={e => setHepaticVein(e.target.value as "" | "normal" | "blunted" | "reversal")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]"
          >
            <option value="">— select —</option>
            <option value="normal">Normal systolic flow</option>
            <option value="blunted">Systolic flow blunting</option>
            <option value="reversal">Systolic flow reversal</option>
          </select>
        </div>
      </div>

      {pisaEroaTr && <p className="text-xs text-gray-400 mt-2">PISA-derived EROA (28 cm/s): {pisaEroaTr.toFixed(2)} cm²</p>}
      {rvsWithRap !== null && <p className="text-xs text-gray-400 mt-1">Estimated RVSP (TR gradient + RAP {rap} mmHg): {rvsWithRap.toFixed(0)} mmHg</p>}

      <ResultCard severity={result.sev} title="Tricuspid Regurgitation Severity" value={result.label} criteria={result.criteria} />
      <EchoAssistPanel output={getTrEchoAssist()} />
      <p className="text-xs text-gray-400 mt-3">Reference: AHA/ACC 2021 Valvular Heart Disease Guidelines; ASE/EACVI 2017 (Zoghbi et al.); Hahn et al. JACC 2019 TR Grading</p>
    </EngineSection>
  );
}

// ─── PULMONARY HYPERTENSION ENGINE ────────────────────────────────────────────
function PulmonaryHTNEngine() {
  const [trVmax, setTrVmax] = useState("");
  const [rap, setRap] = useState("5");
  const [prEndDiastVel, setPrEndDiastVel] = useState("");
  const [rvotAT, setRvotAT] = useState("");
  const [rvotET, setRvotET] = useState("");
  const [ivcDiam, setIvcDiam] = useState("");
  const [ivcCollapse, setIvcCollapse] = useState("normal");

  const rvsp = has(trVmax) ? 4 * Math.pow(n(trVmax), 2) + n(rap) : null;
  const padp = has(prEndDiastVel) ? 4 * Math.pow(n(prEndDiastVel), 2) + n(rap) : null;
  const atEtRatio = has(rvotAT, rvotET) ? n(rvotAT) / n(rvotET) : null;

  const rapFromIvc = () => {
    if (!has(ivcDiam)) return null;
    const d = n(ivcDiam);
    if (d <= 2.1 && ivcCollapse === "normal") return 3;
    if (d <= 2.1 && ivcCollapse !== "normal") return 8;
    if (d > 2.1 && ivcCollapse === "normal") return 8;
    return 15;
  };

  const estimatedRap = rapFromIvc();

  const getSeverity = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!rvsp) return { sev: "indeterminate", label: "Enter TR Vmax to estimate RVSP", criteria: [] };
    const criteria: string[] = [];

    criteria.push(`Estimated RVSP = ${rvsp.toFixed(0)} mmHg (TR Vmax ${trVmax} m/s + RAP ${rap} mmHg)`);
    if (padp) criteria.push(`Estimated PADP = ${padp.toFixed(0)} mmHg (PR end-diastolic velocity ${prEndDiastVel} m/s)`);
    if (atEtRatio) criteria.push(`RVOT AT/ET ratio = ${atEtRatio.toFixed(2)}${atEtRatio < 0.30 ? " → elevated PA pressure (AT/ET <0.30)" : " → normal"}`);
    if (estimatedRap !== null) criteria.push(`Estimated RAP from IVC = ${estimatedRap} mmHg`);

    const rvsVal = rvsp;
    if (rvsVal > 60) return { sev: "severe", label: "Severe Pulmonary Hypertension (RVSP >60 mmHg)", criteria, note: "ESC/ERS 2022: mPAP >40 mmHg equivalent. High-risk PH. Refer to PH specialist." };
    if (rvsVal > 50) return { sev: "severe", label: "Moderate-Severe Pulmonary Hypertension (RVSP 50–60 mmHg)", criteria };
    if (rvsVal > 35) return { sev: "moderate", label: "Moderate Pulmonary Hypertension (RVSP 35–50 mmHg)", criteria, note: "ESC/ERS 2022: intermediate probability PH. Clinical correlation and right heart catheterization may be warranted." };
    if (rvsVal > 25) return { sev: "mild", label: "Mildly Elevated RVSP (25–35 mmHg)", criteria, note: "Borderline elevation. Monitor clinically." };
    return { sev: "normal", label: "Normal Estimated RVSP (≤25 mmHg)", criteria };
  };

  const result = getSeverity();

  return (
    <EngineSection id="engine-ph" title="Pulmonary Hypertension" subtitle="RVSP · PADP · RVOT AT/ET · IVC-based RAP">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" hint="(nl <2.8)" />
        <NumInput label="Estimated RAP" value={rap} onChange={setRap} unit="mmHg" placeholder="3, 5, 8, or 15" />
        <NumInput label="PR End-Diastolic Velocity" value={prEndDiastVel} onChange={setPrEndDiastVel} unit="m/s" placeholder="e.g. 1.1" hint="(for PADP)" />
        <NumInput label="RVOT Acceleration Time (AT)" value={rvotAT} onChange={setRvotAT} unit="ms" placeholder="nl >100" />
        <NumInput label="RVOT Ejection Time (ET)" value={rvotET} onChange={setRvotET} unit="ms" placeholder="e.g. 320" />
        <NumInput label="IVC Diameter" value={ivcDiam} onChange={setIvcDiam} unit="cm" placeholder="nl <2.1" />
      </div>
      <div className="mt-3">
        <label className="block text-xs font-semibold text-gray-600 mb-1">IVC Collapsibility</label>
        <select value={ivcCollapse} onChange={e => setIvcCollapse(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1] bg-white">
          <option value="normal">Normal (&gt;50%)</option>
          <option value="reduced">Reduced (20–50%)</option>
          <option value="minimal">Minimal (&lt;20%)</option>
        </select>
      </div>
      {rvsp && <p className="text-xs text-gray-400 mt-2">Calculated RVSP: {rvsp.toFixed(0)} mmHg{padp ? ` | PADP: ${padp.toFixed(0)} mmHg` : ""}{atEtRatio ? ` | AT/ET: ${atEtRatio.toFixed(2)}` : ""}</p>}
      <ResultCard severity={result.sev} title="Pulmonary Hypertension Assessment" value={result.label} criteria={result.criteria} note={result.note} />
      <EchoAssistPanel output={(() => {
        if (!rvsp) return null;
        const rvsVal = rvsp;
        if (rvsVal <= 25) return {
          suggests: `Estimated RVSP is ${rvsVal.toFixed(0)} mmHg, which is within normal limits. No echocardiographic evidence of pulmonary hypertension.`,
          tip: "Ensure TR Vmax is measured from the apical 4-chamber view using CW Doppler with careful angulation to obtain the highest velocity signal. The right parasternal or subcostal window may yield higher velocities."
        };
        if (rvsVal <= 35) return {
          suggests: `Estimated RVSP is ${rvsVal.toFixed(0)} mmHg, representing a borderline elevation. This may reflect early or mild pulmonary hypertension and warrants clinical correlation.`,
          note: "Borderline RVSP elevation (25\u201335 mmHg) may be physiological in athletes or with elevated cardiac output. Assess for adjunctive signs of PH: RV dilation, septal flattening (D-sign), and RVOT notching.",
          tip: "Confirm TR Vmax by measuring from multiple windows. A single measurement may underestimate true TR velocity. Assess IVC diameter and collapsibility to estimate RAP, which directly affects RVSP calculation."
        };
        if (rvsVal <= 50) return {
          suggests: `Estimated RVSP is ${rvsVal.toFixed(0)} mmHg, consistent with moderate pulmonary hypertension. Right heart catheterization is recommended to confirm diagnosis and characterize hemodynamics.`,
          note: "Moderate PH (RVSP 35\u201350 mmHg) warrants evaluation for pre-capillary (Group 1\u20133 PH) vs. post-capillary (Group 2, HFpEF/HFrEF) etiology. Assess LV filling pressures and mitral valve disease.",
          tip: "Assess for the D-sign (septal flattening in systole = pressure overload; in diastole = volume overload) and RV:LV ratio. RVOT notching on PW Doppler is a specific sign of pre-capillary PH."
        };
        return {
          suggests: `Estimated RVSP is ${rvsVal.toFixed(0)} mmHg, consistent with ${rvsVal > 60 ? "severe" : "moderate-to-severe"} pulmonary hypertension. Urgent specialist referral and right heart catheterization are indicated.`,
          note: result.note ?? "Severe PH (RVSP >50 mmHg) carries significant morbidity and mortality. Evaluate for RV-PA uncoupling (TAPSE/RVSP <0.55 mm/mmHg), which indicates decompensated RV function and poor prognosis.",
          tip: "In severe PH, assess for pericardial effusion, which may indicate decompensated right heart failure. Tricuspid annular plane systolic excursion (TAPSE) <14 mm in the setting of severe PH indicates significantly impaired RV-PA coupling."
        };
      })()}
      />
      <p className="text-xs text-gray-400 mt-3">Reference: ASE 2025 Pulmonary Hypertension Guidelines (<a href='https://www.asecho.org/wp-content/uploads/2025/03/PIIS0894731725000379.pdf' target='_blank' rel='noopener noreferrer' className='underline hover:text-[#189aa1]'>ASE 2025 PH Guideline PDF</a>); ESC/ERS 2022 PH Guidelines</p>
    </EngineSection>
  );
}

// ─── FRANK-STARLING ENGINE ───────────────────────────────────────────────────
function FrankStarlingEngine() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "engine-frank-starling") {
        setOpen(true);
        setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    };
    window.addEventListener("echoassist:open", handler);
    return () => window.removeEventListener("echoassist:open", handler);
  }, []);
  const [fsParams, setFsParams] = useState<FrankStarlingParams>({ preload: 50, afterload: 50, contractility: 50 });

  const contractilityLabel =
    fsParams.contractility >= 70 ? "Hyperdynamic (EF >70%)"
    : fsParams.contractility >= 45 ? "Normal (EF 55–70%)"
    : fsParams.contractility >= 25 ? "Mildly Reduced (EF 40–55%)"
    : "Severely Reduced (EF <40%)";

  const preloadLabel =
    fsParams.preload >= 70 ? "Volume overloaded — elevated LVEDP"
    : fsParams.preload >= 40 ? "Euvolemic — normal filling pressures"
    : "Hypovolemic — low preload";

  const afterloadLabel =
    fsParams.afterload >= 70 ? "High afterload — increased SVR/SBP"
    : fsParams.afterload >= 40 ? "Normal afterload"
    : "Low afterload — vasodilated state";

  const suggests =
    fsParams.contractility < 25
      ? `EchoAssist\u2122 Suggests: Severely depressed contractility with Starling failure. The Frank-Starling curve is flat — further preload augmentation will not improve stroke volume. Consider inotropic support, afterload reduction, or mechanical circulatory support.`
      : fsParams.contractility < 45
      ? `EchoAssist\u2122 Suggests: Reduced contractility shifts the Frank-Starling curve downward. Stroke volume is diminished at any given preload. Optimize preload, reduce afterload (vasodilators), and consider guideline-directed medical therapy.`
      : fsParams.contractility >= 70
      ? `EchoAssist\u2122 Suggests: Hyperdynamic state — steep ascending limb. The ventricle is highly preload-responsive. Assess for high-output states: sepsis, anemia, thyrotoxicosis, AV fistula, or severe MR/AR.`
      : `EchoAssist\u2122 Suggests: Normal contractility. The ascending limb of the Frank-Starling curve is intact — preload augmentation will increase stroke volume up to the plateau. Maintain euvolemia and optimize heart rate.`;

  const note =
    fsParams.afterload >= 70
      ? "EchoAssist\u2122 Note: High afterload depresses the Frank-Starling curve — the same preload generates less stroke volume. Afterload reduction (ACE inhibitors, ARBs, hydralazine, nitroprusside) can restore SV without increasing preload."
      : fsParams.preload >= 75
      ? "EchoAssist\u2122 Note: Operating on the plateau of the Frank-Starling curve. Further volume loading is unlikely to improve stroke volume and may worsen pulmonary congestion. Consider diuresis if filling pressures are elevated."
      : fsParams.preload <= 25
      ? "EchoAssist\u2122 Note: Operating on the steep ascending limb — the ventricle is preload-dependent. Fluid resuscitation will increase stroke volume. Assess IVC collapsibility and passive leg raise response."
      : "EchoAssist\u2122 Note: Operating in the mid-range of the Frank-Starling curve. Both preload augmentation and contractility enhancement can improve stroke volume.";

  const tip = "EchoAssist\u2122 Tip: The Frank-Starling relationship is the physiologic basis for fluid responsiveness testing (passive leg raise, fluid challenge). A >10% increase in SV or VTI with PLR predicts fluid responsiveness. Correlate with IVC collapsibility, E/e\u2019, and LVOT VTI trends.";

  return (
    <div id="engine-frank-starling" ref={ref} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 flex items-center justify-between"
        style={{ background: "linear-gradient(90deg, #0e4a50, #189aa1)" }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-white" />
          <div className="text-left">
            <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Frank-Starling Curve</h3>
            <p className="text-xs text-white/70">Preload · Afterload · Contractility · Stroke Volume</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/70" /> : <ChevronDown className="w-4 h-4 text-white/70" />}
      </button>

      {open && (
        <div className="p-5">
          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { key: "preload" as const, label: "Preload", sublabel: preloadLabel, color: "#189aa1" },
              { key: "afterload" as const, label: "Afterload", sublabel: afterloadLabel, color: "#dc2626" },
              { key: "contractility" as const, label: "Contractility", sublabel: contractilityLabel, color: "#16a34a" },
            ].map(({ key, label, sublabel, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">{label}</span>
                  <span className="font-mono font-bold" style={{ color }}>{fsParams[key]}</span>
                </div>
                <input
                  type="range" min={0} max={100} value={fsParams[key]}
                  onChange={e => setFsParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: color }}
                />
                <p className="text-[10px] text-gray-400 leading-tight">{sublabel}</p>
              </div>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: "Normal", p: { preload: 50, afterload: 50, contractility: 50 } },
              { label: "HFrEF", p: { preload: 70, afterload: 60, contractility: 20 } },
              { label: "Hypovolemia", p: { preload: 15, afterload: 60, contractility: 55 } },
              { label: "Septic Shock", p: { preload: 30, afterload: 20, contractility: 70 } },
              { label: "Cardiogenic Shock", p: { preload: 80, afterload: 75, contractility: 10 } },
              { label: "Hypertensive Crisis", p: { preload: 55, afterload: 95, contractility: 50 } },
              { label: "Athlete", p: { preload: 60, afterload: 35, contractility: 80 } },
            ].map(({ label, p }) => (
              <button
                key={label}
                onClick={() => setFsParams(p)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1] transition-all font-medium"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Graph */}
          <FrankStarlingGraph params={fsParams} showReferenceCurves height={260} />

          {/* EchoAssist output */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 bg-[#f0fbfc] border border-[#b2e8ec] rounded-lg px-4 py-3">
              <Zap className="w-3.5 h-3.5 text-[#189aa1] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#0e7490] leading-relaxed">{suggests}</p>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">{note}</p>
            </div>
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
              <Lightbulb className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">Reference: <a href="https://pubmed.ncbi.nlm.nih.gov/13660189/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#189aa1]">Starling EH. The Linacre Lecture on the Law of the Heart. 1918</a> | <a href="https://pubmed.ncbi.nlm.nih.gov/16908781/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#189aa1]">Katz AM. Ernest Henry Starling, his predecessors, and the "Law of the Heart". Circulation. 2002</a></p>
        </div>
      )}
    </div>
  );
}

// ─── STRESS ECHO ASSIST ENGINE ──────────────────────────────────────────────

const stressSegments17 = [
  { id: "bas_ant", label: "Basal Anterior", territory: "LAD" },
  { id: "bas_antlat", label: "Basal Anterolateral", territory: "LCx" },
  { id: "bas_inflat", label: "Basal Inferolateral", territory: "LCx" },
  { id: "bas_inf", label: "Basal Inferior", territory: "RCA" },
  { id: "bas_infsep", label: "Basal Inferoseptal", territory: "RCA" },
  { id: "bas_antsep", label: "Basal Anteroseptal", territory: "LAD" },
  { id: "mid_ant", label: "Mid Anterior", territory: "LAD" },
  { id: "mid_antlat", label: "Mid Anterolateral", territory: "LCx" },
  { id: "mid_inflat", label: "Mid Inferolateral", territory: "LCx" },
  { id: "mid_inf", label: "Mid Inferior", territory: "RCA" },
  { id: "mid_infsep", label: "Mid Inferoseptal", territory: "RCA" },
  { id: "mid_antsep", label: "Mid Anteroseptal", territory: "LAD" },
  { id: "ap_ant", label: "Apical Anterior", territory: "LAD" },
  { id: "ap_lat", label: "Apical Lateral", territory: "LCx" },
  { id: "ap_inf", label: "Apical Inferior", territory: "RCA" },
  { id: "ap_sep", label: "Apical Septal", territory: "LAD" },
  { id: "apex", label: "Apex", territory: "LAD" },
];

const wmScoreLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Normal", color: "#16a34a" },
  2: { label: "Hypokinetic", color: "#d97706" },
  3: { label: "Akinetic", color: "#ea580c" },
  4: { label: "Dyskinetic", color: "#dc2626" },
  5: { label: "Aneurysmal", color: "#b45309" },
};

const stressInterpretation = [
  {
    result: "Positive (Ischemia)",
    color: "#dc2626",
    criteria: [
      "New or worsening wall motion abnormality at peak stress",
      "New RWMA in ≥2 adjacent segments",
      "Transient LV dilation at peak stress",
      "EF decrease ≥5% at peak stress",
      "New MR at peak (papillary muscle ischemia)",
    ],
  },
  {
    result: "Negative (No Ischemia)",
    color: "#16a34a",
    criteria: [
      "No new wall motion abnormalities at peak stress",
      "Normal or improved wall motion throughout",
      "EF maintained or increased at peak",
      "Target HR achieved (≥85% max HR)",
    ],
  },
  {
    result: "Inconclusive",
    color: "#d97706",
    criteria: [
      "Suboptimal HR response (<80% max HR without atropine)",
      "Poor image quality at peak",
      "LBBB development at peak (limits wall motion interpretation)",
      "Inadequate stress achieved",
    ],
  },
  {
    result: "Viability (Low-Dose DSE)",
    color: "#0369a1",
    criteria: [
      "Biphasic response: improved at low dose → worsens at high dose = viable + ischemic",
      "Sustained improvement at all doses = viable, no significant ischemia",
      "No change at any dose = non-viable (scar)",
      "Worsens at low dose = non-viable or severe ischemia",
    ],
  },
];

function StressEchoAssistEngine() {
  const { isAuthenticated } = useAuth();
  // Inner tab
  const [innerTab, setInnerTab] = useState<"wmsi" | "target_hr" | "interpretation">("wmsi");
  // WMSI state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [stage, setStage] = useState<"rest" | "stress">("rest");
  // Target HR
  const [age, setAge] = useState("");
  const [protocol, setProtocol] = useState("exercise");
  // Case saving
  const [studyId, setStudyId] = useState("");
  const [studyDate, setStudyDate] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const setScore = (id: string, score: number) => {
    setScores(prev => ({ ...prev, [`${stage}_${id}`]: score }));
  };
  const getScore = (id: string) => scores[`${stage}_${id}`] || 0;

  const scoredSegments = stressSegments17.filter(s => scores[`${stage}_${s.id}`] > 0);
  const wmsi = scoredSegments.length > 0
    ? (scoredSegments.reduce((acc, s) => acc + (scores[`${stage}_${s.id}`] || 1), 0) / stressSegments17.length).toFixed(2)
    : null;

  const newAbnormal = stage === "stress" ? stressSegments17.filter(s => {
    const restScore = scores[`rest_${s.id}`] || 1;
    const stressScore = scores[`stress_${s.id}`] || 1;
    return stressScore > restScore;
  }) : [];

  const territories = ["LAD", "LCx", "RCA"];
  const territoryAbnormal = territories.map(t => ({
    territory: t,
    segments: newAbnormal.filter(s => s.territory === t),
  })).filter(t => t.segments.length > 0);

  // Target HR calc
  const maxHR = age ? 220 - parseFloat(age) : 0;
  const target85 = maxHR ? Math.round(maxHR * 0.85) : 0;
  const target80 = maxHR ? Math.round(maxHR * 0.80) : 0;

  // EchoAssist interpretation
  const hasNewWMA = newAbnormal.length > 0;
  const wmsiNum = wmsi ? parseFloat(wmsi) : null;
  const getInterpretation = () => {
    if (!wmsi) return null;
    if (stage === "stress" && hasNewWMA) {
      const terrs = territoryAbnormal.map(t => `${t.territory} (${t.segments.map(s => s.label).join(", ")})`).join("; ");
      return {
        suggests: `Positive Stress Echo — Inducible ischemia identified. WMSI = ${wmsi}. New wall motion abnormalities at stress in: ${terrs}.`,
        note: "EchoAssist™ Note: New or worsening regional wall motion abnormalities at peak stress in ≥2 adjacent segments are the primary criterion for a positive stress echo. Transient LV dilation and EF drop ≥5% are additional positive markers.",
        tip: "EchoAssist™ Tip: Correlate with the coronary territory distribution of the new WMAs to guide catheterization planning. LAD territory involvement carries higher risk than isolated RCA or LCx disease.",
      };
    }
    if (stage === "stress" && wmsiNum !== null && wmsiNum <= 1.0) {
      return {
        suggests: `Negative Stress Echo — No new wall motion abnormalities at stress. WMSI = ${wmsi} (normal = 1.0). All 17 segments normal or hyperkinetic at peak stress.`,
        note: "EchoAssist™ Note: A negative stress echo with adequate heart rate response (≥85% MPHR) has a high negative predictive value for significant obstructive CAD.",
        tip: "EchoAssist™ Tip: Confirm target HR was achieved. A suboptimal HR response (<80% MPHR without atropine augmentation) renders the study inconclusive regardless of wall motion findings.",
      };
    }
    if (stage === "rest") {
      return {
        suggests: `Resting WMSI = ${wmsi}. ${wmsiNum && wmsiNum > 1.0 ? "Resting wall motion abnormality present — consider prior MI, cardiomyopathy, or LBBB." : "Normal resting wall motion."}`,
        note: "EchoAssist™ Note: Switch to Stress stage and enter peak stress scores to generate a full stress echo interpretation.",
        tip: "EchoAssist™ Tip: Document resting WMSI before stress to identify baseline abnormalities that may confound stress interpretation.",
      };
    }
    return null;
  };
  const interpretation = getInterpretation();

  const saveMutation = trpc.caseMix.create.useMutation({
    onSuccess: () => { setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); },
  });

  const handleSave = () => {
    if (!studyId.trim()) return;
    saveMutation.mutate({
      modality: "STRESS",
      caseType: hasNewWMA ? "Positive Stress Echo — Inducible Ischemia" : "Negative Stress Echo",
      studyIdentifier: studyId.trim(),
      studyDate: studyDate || undefined,
      notes: interpretation ? `${interpretation.suggests}` : undefined,
    });
  };

  return (
    <EngineSection id="engine-stress" title="Stress Echo EchoAssist™" subtitle="17-Segment WMSI · Target HR · Protocol Dosing · Interpretation · Save as Case">
      <div>
            <div className="flex flex-wrap gap-2 mb-5">
              {(["wmsi", "target_hr", "interpretation"] as const).map(t => (
                <button key={t} onClick={() => setInnerTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    innerTab === t ? "text-white shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
                  }`}
                  style={innerTab === t ? { background: "#189aa1" } : {}}>
                  {t === "wmsi" ? "Wall Motion Scoring" : t === "target_hr" ? "Target HR / Dosing" : "Interpretation"}
                </button>
              ))}
            </div>

            {innerTab === "wmsi" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(["rest", "stress"] as const).map(s => (
                    <button key={s} onClick={() => setStage(s)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        stage === s ? "text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      style={stage === s ? { background: "#189aa1" } : {}}>
                      {s} Images
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stressSegments17.map(seg => {
                    const score = getScore(seg.id);
                    const wmInfo = wmScoreLabels[score];
                    return (
                      <div key={seg.id} className="border border-gray-100 rounded-lg p-2 bg-white">
                        <div className="text-xs font-medium text-gray-600 mb-1">{seg.label}</div>
                        <div className="text-xs text-gray-400 mb-2">{seg.territory}</div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(s => (
                            <button key={s} onClick={() => setScore(seg.id, score === s ? 0 : s)}
                              className="flex-1 py-1 rounded text-xs font-bold transition-all"
                              style={{
                                background: score === s ? wmScoreLabels[s].color : "#f3f4f6",
                                color: score === s ? "white" : "#6b7280",
                              }}>
                              {s}
                            </button>
                          ))}
                        </div>
                        {score > 0 && (
                          <div className="text-xs font-semibold mt-1" style={{ color: wmInfo.color }}>{wmInfo.label}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {wmsi && (
                  <div className="rounded-lg p-4 border border-[#189aa1]/20 bg-[#f0fbfc] animate-in fade-in duration-300">
                    <div className="flex items-center gap-6 mb-2">
                      <div>
                        <div className="text-xs text-gray-500">WMSI</div>
                        <div className="text-3xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{wmsi}</div>
                        <div className="text-xs text-gray-500">Normal = 1.0</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Abnormal segments</div>
                        <div className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {scoredSegments.filter(s => (scores[`${stage}_${s.id}`] || 1) > 1).length}/17
                        </div>
                      </div>
                    </div>
                    {stage === "stress" && newAbnormal.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                        <div className="text-xs font-bold text-red-700 mb-1">⚠ New wall motion abnormalities at stress:</div>
                        {territoryAbnormal.map(t => (
                          <div key={t.territory} className="text-xs text-red-600">
                            <strong>{t.territory}:</strong> {t.segments.map(s => s.label).join(", ")}
                          </div>
                        ))}
                        <div className="text-xs text-red-600 mt-1 font-semibold">Positive stress echo — inducible ischemia</div>
                      </div>
                    )}
                    {interpretation && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-[#189aa1]/30">
                        <div className="flex items-start gap-3 px-4 py-3 bg-[#f0fbfc] border-b border-[#189aa1]/20">
                          <MessageSquare className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0e7490] block mb-0.5">EchoAssist™ Suggests</span>
                            <p className="text-sm text-[#0e7490] font-medium leading-snug">{interpretation.suggests}</p>
                          </div>
                        </div>
                        {interpretation.note && (
                          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block mb-0.5">EchoAssist™ Note</span>
                              <p className="text-xs text-amber-700 leading-snug">{interpretation.note}</p>
                            </div>
                          </div>
                        )}
                        {interpretation.tip && (
                          <div className="flex items-start gap-3 px-4 py-3 bg-sky-50">
                            <Lightbulb className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 block mb-0.5">EchoAssist™ Tip</span>
                              <p className="text-xs text-sky-700 leading-snug">{interpretation.tip}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400">Score: 1=Normal | 2=Hypokinetic | 3=Akinetic | 4=Dyskinetic</div>

                {/* Save as Case */}
                {isAuthenticated && (
                  <div className="mt-4 p-4 rounded-xl border border-[#189aa1]/20 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Save className="w-4 h-4 text-[#189aa1]" />
                      <span className="text-sm font-bold text-gray-700">Save as Accreditation Case</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Study Identifier *</label>
                        <input value={studyId} onChange={e => setStudyId(e.target.value)}
                          placeholder="e.g. STR-2024-001"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Study Date</label>
                        <input type="date" value={studyDate} onChange={e => setStudyDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleSave}
                        disabled={!studyId.trim() || saveMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#189aa1" }}>
                        <Save className="w-3.5 h-3.5" />
                        {saveMutation.isPending ? "Saving..." : "Save Case"}
                      </button>
                      {savedOk && (
                        <div className="flex items-center gap-1.5 text-sm text-green-600 font-semibold animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4" /> Case saved to accreditation tracker
                        </div>
                      )}
                      {saveMutation.isError && (
                        <div className="text-sm text-red-600">Error saving — please try again</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {innerTab === "target_hr" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Patient Age</label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
                      <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 65"
                        className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                      <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">yrs</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Protocol</label>
                    <select value={protocol} onChange={e => setProtocol(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
                      <option value="exercise">Exercise Stress Echo</option>
                      <option value="dse">Dobutamine Stress Echo (DSE)</option>
                      <option value="vasodilator">Vasodilator (Regadenoson/Adenosine)</option>
                    </select>
                  </div>
                </div>
                {maxHR > 0 && (
                  <div className="rounded-lg p-4 border border-[#189aa1]/20 bg-[#f0fbfc] animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Max HR (220-age)</div>
                        <div className="text-2xl font-black text-gray-700" style={{ fontFamily: "JetBrains Mono, monospace" }}>{maxHR}</div>
                        <div className="text-xs text-gray-400">bpm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Target (85%)</div>
                        <div className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{target85}</div>
                        <div className="text-xs text-gray-400">bpm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Adequate (80%)</div>
                        <div className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{target80}</div>
                        <div className="text-xs text-gray-400">bpm</div>
                      </div>
                    </div>
                    {protocol === "dse" && (
                      <div className="p-3 rounded bg-white border border-gray-100 text-xs text-gray-600">
                        <div className="font-bold text-[#189aa1] mb-1">DSE Protocol (Standard)</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[["5 min", "5 μg/kg/min"],["10 min", "10 μg/kg/min"],["15 min", "20 μg/kg/min"],["20 min", "30 μg/kg/min"],["25 min", "40 μg/kg/min"],["If target not reached", "Atropine 0.25–1 mg IV"]].map(([time, dose]) => (
                            <div key={time} className="flex justify-between">
                              <span className="text-gray-500">{time}:</span>
                              <span className="font-mono font-bold text-[#189aa1]">{dose}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 font-semibold text-amber-600">Target: {Math.round(maxHR * 0.85)} bpm or ≥85% max HR</div>
                      </div>
                    )}
                    {protocol === "vasodilator" && (
                      <div className="p-3 rounded bg-white border border-gray-100 text-xs text-gray-600">
                        <div className="font-bold text-[#189aa1] mb-1">Regadenoson Protocol</div>
                        <div>Single bolus: 0.4 mg IV over 10 seconds</div>
                        <div>Images: 60–90 seconds post-injection</div>
                        <div className="mt-1 text-amber-600 font-semibold">Contraindicated: 2nd/3rd degree AV block, severe asthma/COPD</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {innerTab === "interpretation" && (
              <div className="space-y-3">
                {stressInterpretation.map((crit, ci) => (
                  <div key={ci} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 flex items-center gap-3" style={{ borderLeft: `4px solid ${crit.color}` }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: crit.color }} />
                      <h4 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{crit.result}</h4>
                    </div>
                    <div className="px-5 pb-4">
                      <ul className="space-y-1.5 mt-2">
                        {crit.criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="mt-0.5 flex-shrink-0 text-[#189aa1]">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </EngineSection>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EchoAssist() {
  // Fire hash-based open event on mount so the matching engine auto-opens
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    // Dispatch after a short delay so all engine components have mounted
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("echoassist:open", { detail: hash }));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              EchoAssist™
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter raw measurements — get instant ASE/AHA/ACC guideline-based severity classifications, calculated values, and the specific criteria met. Domains: Frank-Starling, AS, MS, AR, MR, TR, LV, Diastology, Strain, RV, PA Pressure.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-[#f0fbfc] border border-[#b2e8ec] rounded-xl px-5 py-3 mb-6">
          <Info className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#0e7490]">
            <strong>Clinical tool — not a substitute for physician judgment.</strong> All classifications are based on published ASE, AHA/ACC, and ESC guidelines. Results update in real time as you type. Each section can be used independently.
          </p>
        </div>

        {/* Engine sections */}
        <div className="space-y-4">
            <LVSystolicEngine />
          <DiastolicEngine />
          <StrainEngine />
          <StressEchoAssistEngine />
          <AorticStenosisEngine />
          <MitraStenosisEngine />
          <AorticRegurgEngine />
          <MitralRegurgEngine />
          <TricuspidRegurgEngine />
          <RVFunctionEngine />
          <PulmonaryHTNEngine />
          <FrankStarlingEngine />
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Guideline References</p>
          <p>• <a href='https://asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf' target='_blank' rel='noopener noreferrer' className='underline hover:text-[#189aa1]'>ASE/WFTF 2018 Chamber Quantification</a> | ASE 2025 LV Diastolic Function Guidelines</p>
          <p>• ASE 2025 Strain Guideline (Thomas et al.) | <a href='https://www.asecho.org/wp-content/uploads/2025/03/PIIS0894731725000379.pdf' target='_blank' rel='noopener noreferrer' className='underline hover:text-[#189aa1]'>ASE 2025 Right Heart & PH Guidelines</a></p>
          <p>• AHA/ACC 2021 Valvular Heart Disease Guidelines | ASE/EACVI 2017 Valve Regurgitation (Zoghbi et al.) | Hahn et al. JACC 2019 TR Grading</p>
          <p>• ESC/ERS 2022 PH Guidelines | AHA/ACC 2022 Heart Failure Guidelines</p>
          <p className="pt-1">© All About Ultrasound — iHeartEcho™ | www.iheartecho.com</p>
        </div>
      </div>
    </Layout>
  );
}
