/*
  iHeartEcho — EchoAssist
  Instant ASE-guideline severity classification from raw measurements.
  Domains: AS, MS, AR, MR, LV Systolic, Diastolic, Strain (LV/RV/LA), RV Function, PA Pressure
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body, JetBrains Mono data
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Zap, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, TrendingDown } from "lucide-react";

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
  moderate:     { bg: "#fff7ed", border: "#fdba74", text: "#9a3412", badge: "#ea580c", badgeText: "Moderate",       icon: "!!" },
  severe:       { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", badge: "#dc2626", badgeText: "Severe",         icon: "!!!" },
  critical:     { bg: "#fdf2f8", border: "#f0abfc", text: "#701a75", badge: "#a21caf", badgeText: "Critical",       icon: "⚠" },
  indeterminate:{ bg: "#f8fafc", border: "#cbd5e1", text: "#475569", badge: "#64748b", badgeText: "Indeterminate",  icon: "?" },
  info:         { bg: "#f0fbfc", border: "#67e8f9", text: "#0e7490", badge: "#0891b2", badgeText: "Result",         icon: "i" },
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
  title, subtitle, children, defaultOpen = true,
}: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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

  return (
    <EngineSection title="Aortic Stenosis" subtitle="AVA by continuity equation · Vmax · Mean gradient · DVI">
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

  return (
    <EngineSection title="Mitral Stenosis" subtitle="MVA · Mean gradient · Pressure half-time · PA pressure" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="MVA (planimetry / continuity)" value={mva} onChange={setMva} unit="cm²" placeholder="nl >4.0" />
        <NumInput label="MV Mean Gradient" value={mvMg} onChange={setMvMg} unit="mmHg" placeholder="sev ≥10" />
        <NumInput label="Pressure Half-Time (PHT)" value={mvPht} onChange={setMvPht} unit="ms" placeholder="nl <60" hint="(sev >220)" />
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" />
      </div>
      {mvaPht && <p className="text-xs text-gray-400 mt-2">MVA by PHT (220/PHT): {mvaPht.toFixed(2)} cm²</p>}
      <ResultCard severity={result.sev} title="Mitral Stenosis Severity" value={result.label} criteria={result.criteria} />
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

  return (
    <EngineSection title="Aortic Regurgitation" subtitle="Vena contracta · EROA · Regurgitant volume · AR PHT" defaultOpen={false}>
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Vena Contracta" value={venaContracta} onChange={setVenaContracta} unit="mm" placeholder="sev ≥6" hint="(sev ≥6 mm)" />
        <NumInput label="EROA" value={eroa} onChange={setEroa} unit="cm²" placeholder="sev ≥0.30" />
        <NumInput label="Regurgitant Volume" value={regVol} onChange={setRegVol} unit="mL" placeholder="sev ≥60" />
        <NumInput label="AR Pressure Half-Time" value={phtAr} onChange={setPhtAr} unit="ms" placeholder="sev <200" />
        <NumInput label="AR Peak Velocity" value={arVmax} onChange={setArVmax} unit="m/s" placeholder="e.g. 3.5" />
        <NumInput label="LVEDD" value={lvedd} onChange={setLvedd} unit="mm" placeholder="nl <58" hint="(nl <58)" />
      </div>
      <ResultCard severity={result.sev} title="Aortic Regurgitation Severity" value={result.label} criteria={result.criteria} />
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

  return (
    <EngineSection title="Mitral Regurgitation" subtitle="Vena contracta · EROA · PISA · Regurgitant volume" defaultOpen={false}>
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

  return (
    <EngineSection title="LV Systolic Function" subtitle="EF · Dimensions · Wall thickness · FS">
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
      <p className="text-xs text-gray-400 mt-3">Reference: ASE 2015 Chamber Quantification (Lang et al.); AHA/ACC HF Classification 2022</p>
    </EngineSection>
  );
}

// ─── DIASTOLIC FUNCTION ENGINE ────────────────────────────────────────────────
function DiastolicEngine() {
  const [eVel, setEVel] = useState("");
  const [aVel, setAVel] = useState("");
  const [ePrimeSep, setEPrimeSep] = useState("");
  const [ePrimeLat, setEPrimeLat] = useState("");
  const [trVmax, setTrVmax] = useState("");
  const [lavi, setLavi] = useState("");
  const [ddt, setDdt] = useState("");

  const eaRatio = has(eVel, aVel) ? n(eVel) / n(aVel) : null;
  const ePrimeAvg = has(ePrimeSep, ePrimeLat) ? (n(ePrimeSep) + n(ePrimeLat)) / 2 : has(ePrimeSep) ? n(ePrimeSep) : has(ePrimeLat) ? n(ePrimeLat) : null;
  const eeRatio = eVel && ePrimeAvg ? n(eVel) * 100 / ePrimeAvg : null;
  const rvsp = has(trVmax) ? 4 * Math.pow(n(trVmax), 2) : null;

  const getGrade = (): { sev: Severity; label: string; criteria: string[]; note?: string } => {
    if (!eaRatio && !ePrimeAvg && !has(lavi)) return { sev: "indeterminate", label: "Insufficient data", criteria: ["Enter E/A, e', LAVI, and TR Vmax for ASE 2025 grading"] };

    const criteria: string[] = [];
    let positiveCount = 0;
    let totalCriteria = 0;

    // ASE 2025 four criteria
    if (ePrimeAvg !== null) {
      totalCriteria++;
      criteria.push(`Average e' = ${ePrimeAvg.toFixed(1)} cm/s${ePrimeAvg < 7 ? " → abnormal (septal <7 cm/s)" : " → normal"}`);
      if (ePrimeAvg < 7) positiveCount++;
    }

    if (eeRatio !== null) {
      totalCriteria++;
      const eeStr = eeRatio.toFixed(1);
      criteria.push(`E/e' ratio = ${eeStr}${eeRatio > 14 ? " → elevated filling pressures (>14)" : eeRatio >= 8 ? " → indeterminate (8–14)" : " → normal (<8)"}`);
      if (eeRatio > 14) positiveCount++;
    }

    if (has(lavi)) {
      totalCriteria++;
      criteria.push(`LAVI = ${lavi} mL/m²${n(lavi) > 34 ? " → dilated (>34 mL/m²)" : " → normal"}`);
      if (n(lavi) > 34) positiveCount++;
    }

    if (rvsp !== null) {
      totalCriteria++;
      criteria.push(`Estimated RVSP = ${rvsp.toFixed(0)} mmHg (TR Vmax ${trVmax} m/s)${rvsp > 35 ? " → elevated (>35 mmHg)" : " → normal"}`);
      if (rvsp > 35) positiveCount++;
    }

    if (eaRatio !== null) {
      criteria.push(`E/A ratio = ${eaRatio.toFixed(2)}${eaRatio < 0.8 ? " → impaired relaxation pattern" : eaRatio > 2.0 ? " → restrictive pattern" : " → normal/pseudonormal range"}`);
    }

    if (has(ddt)) {
      criteria.push(`E deceleration time = ${ddt} ms${n(ddt) < 160 ? " → short (restrictive pattern)" : n(ddt) > 240 ? " → prolonged (impaired relaxation)" : " → normal"}`);
    }

    // Grade assignment
    if (totalCriteria === 0) return { sev: "indeterminate", label: "Insufficient criteria", criteria };

    const ratio = positiveCount / totalCriteria;
    let sev: Severity;
    let label: string;
    let note: string | undefined;

    if (eaRatio !== null && eaRatio < 0.8 && positiveCount === 0) {
      sev = "mild"; label = "Grade I Diastolic Dysfunction — Impaired Relaxation";
      note = "E/A < 0.8 with normal filling pressures = Grade I (impaired relaxation, normal LVEDP).";
    } else if (eaRatio !== null && eaRatio > 2.0 && positiveCount >= 2) {
      sev = "severe"; label = "Grade III Diastolic Dysfunction — Restrictive Filling";
      note = "E/A > 2.0 with elevated filling pressure markers = Grade III (restrictive pattern, elevated LVEDP).";
    } else if (ratio >= 0.5) {
      sev = "moderate"; label = "Grade II Diastolic Dysfunction — Elevated Filling Pressures";
      note = `${positiveCount} of ${totalCriteria} ASE 2025 criteria positive → Grade II (pseudonormal, elevated filling pressures).`;
    } else if (ratio > 0 && ratio < 0.5) {
      sev = "indeterminate"; label = "Indeterminate Diastolic Function";
      note = `${positiveCount} of ${totalCriteria} criteria positive — insufficient to grade. Additional criteria needed.`;
    } else {
      sev = "normal"; label = "Normal Diastolic Function";
      note = "All evaluated criteria within normal limits.";
    }

    return { sev, label, criteria, note };
  };

  const result = getGrade();

  return (
    <EngineSection title="Diastolic Function" subtitle="ASE 2025 diastolic function grading · E/A · e' · E/e' · LAVI · RVSP">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="E velocity" value={eVel} onChange={setEVel} unit="m/s" placeholder="e.g. 0.8" />
        <NumInput label="A velocity" value={aVel} onChange={setAVel} unit="m/s" placeholder="e.g. 0.6" />
        <NumInput label="e' Septal" value={ePrimeSep} onChange={setEPrimeSep} unit="cm/s" placeholder="nl >7" hint="(nl >7)" />
        <NumInput label="e' Lateral" value={ePrimeLat} onChange={setEPrimeLat} unit="cm/s" placeholder="nl >10" hint="(nl >10)" />
        <NumInput label="TR Vmax" value={trVmax} onChange={setTrVmax} unit="m/s" placeholder="nl <2.8" />
        <NumInput label="LAVI" value={lavi} onChange={setLavi} unit="mL/m²" placeholder="nl <34" hint="(nl <34)" />
        <NumInput label="E Deceleration Time" value={ddt} onChange={setDdt} unit="ms" placeholder="nl 160–240" />
      </div>
      {eaRatio !== null && <p className="text-xs text-gray-400 mt-2">E/A ratio: {eaRatio.toFixed(2)} | {ePrimeAvg ? `Avg e': ${ePrimeAvg.toFixed(1)} cm/s | ` : ""}E/e': {eeRatio?.toFixed(1) ?? "—"}</p>}
      <ResultCard severity={result.sev} title="Diastolic Function Grade" value={result.label} criteria={result.criteria} note={result.note} />
      <p className="text-xs text-gray-400 mt-3">Reference: <a href="https://www.asecho.org/wp-content/uploads/2025/07/Left-Ventricular-Diastolic-Function.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#189aa1] transition-colors">ASE 2025 Left Ventricular Diastolic Function Guidelines</a></p>
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
    <EngineSection title="Myocardial Strain (ASE 2025)" subtitle="LV GLS · RV Free Wall Strain · LA Reservoir Strain · RA Reservoir Strain">
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
    <EngineSection title="RV Systolic Function" subtitle="TAPSE · S' · FAC · RV size · RVSP" defaultOpen={false}>
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
      <p className="text-xs text-gray-400 mt-3">Reference: ASE 2015 RV Guidelines (Rudski et al.); ASE 2025 Strain Guideline</p>
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
    <EngineSection title="Pulmonary Hypertension" subtitle="RVSP · PADP · RVOT AT/ET · IVC-based RAP" defaultOpen={false}>
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
      <p className="text-xs text-gray-400 mt-3">Reference: ESC/ERS 2022 PH Guidelines; ASE 2010 Echocardiographic Assessment of PH (Rudski et al.)</p>
    </EngineSection>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EchoAssist() {
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
              EchoAssist
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter raw measurements — get instant ASE/AHA/ACC guideline-based severity classifications, calculated values, and the specific criteria met.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-[#f0fbfc] border border-[#b2e8ec] rounded-xl px-5 py-3 mb-6">
          <Info className="w-4 h-4 text-[#0891b2] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#0e7490]">
            <strong>Clinical tool — not a substitute for physician judgment.</strong> All classifications are based on published ASE, AHA/ACC, and ESC guidelines. Results update in real time as you type. Each section can be used independently.
          </p>
        </div>

        {/* Engine sections */}
        <div className="space-y-4">
          <LVSystolicEngine />
          <DiastolicEngine />
          <StrainEngine />
          <AorticStenosisEngine />
          <MitraStenosisEngine />
          <AorticRegurgEngine />
          <MitralRegurgEngine />
          <RVFunctionEngine />
          <PulmonaryHTNEngine />
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Guideline References</p>
          <p>• ASE 2015 Chamber Quantification (Lang et al.) | ASE 2025 LV Diastolic Function Guidelines</p>
          <p>• ASE 2025 Strain Guideline (Thomas et al.) | ASE 2015 RV Guidelines (Rudski et al.)</p>
          <p>• AHA/ACC 2021 Valvular Heart Disease Guidelines | ASE/EACVI 2017 Valve Regurgitation (Zoghbi et al.)</p>
          <p>• ESC/ERS 2022 Pulmonary Hypertension Guidelines | AHA/ACC 2022 Heart Failure Guidelines</p>
          <p className="pt-1">© All About Ultrasound — iHeartEcho™ | www.iheartecho.com</p>
        </div>
      </div>
    </Layout>
  );
}
