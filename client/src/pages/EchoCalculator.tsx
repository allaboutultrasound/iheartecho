/*
  iHeartEcho — Echo Severity Calculator
  Updated per: ASE 2021 VHD Guidelines, ASE 2016 Diastology (+ LARS), ASE 2025 Strain Guideline
  Modules: AS, MR (PISA), TR, AR, MVA (PHT), RVSP, Diastology+LARS, LV Function+GLS/SR, RV Function+Strain/SR, SV/CO
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Calculator, Info, ChevronDown, ChevronUp, Zap } from "lucide-react";

function EchoAssistLink({ engine, params }: { engine: string; params: Record<string, string> }) {
  const qs = Object.entries(params).filter(([, v]) => v !== "").map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const href = `/echoassist?${qs}#engine-${engine}`;
  return (
    <Link href={href}
      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}>
      <Zap className="w-3 h-3" />
      Analyse in EchoAssist™ →
    </Link>
  );
}

type Severity = "normal" | "mild" | "moderate" | "severe" | "none";

function SeverityBadge({ severity }: { severity: Severity }) {
  if (!severity || severity === "none") return null;
  const map: Record<string, string> = {
    normal: "bg-green-100 text-green-700",
    mild: "bg-yellow-100 text-yellow-700",
    moderate: "bg-amber-50 text-amber-600",
    severe: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize ${map[severity]}`}>
      {severity}
    </span>
  );
}

function InputField({ label, unit, value, onChange, placeholder, hint }: {
  label: string; unit: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">({hint})</span>}
      </label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white"
          style={{ fontFamily: "JetBrains Mono, monospace" }} />
        <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 font-medium">{unit}</span>
      </div>
    </div>
  );
}

function ResultPanel({ children, guideline }: { children: React.ReactNode; guideline: string }) {
  return (
    <div className="rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 border border-[#189aa1]/20 bg-[#f0fbfc]">
      {children}
      <div className="mt-2 text-xs text-gray-400 border-t border-[#189aa1]/10 pt-2">{guideline}</div>
    </div>
  );
}

// --- AORTIC STENOSIS ---------------------------------------------------------
// Per ASE/ACC/AHA 2021 VHD Guidelines
function ASCalculator() {
  const [vmax, setVmax] = useState("");
  const [mg, setMg] = useState("");
  const [ava, setAva] = useState("");
  const [avai, setAvai] = useState("");
  const [dvi, setDvi] = useState("");

  const sevRank: Record<Severity, number> = { none: 0, normal: 1, mild: 2, moderate: 3, severe: 4 };

  const getSeverity = () => {
    const v = parseFloat(vmax), m = parseFloat(mg), a = parseFloat(ava), ai = parseFloat(avai), d = parseFloat(dvi);
    const criteria: string[] = [];
    let sev: Severity = "none";
    const up = (next: Severity) => { if (sevRank[next] > sevRank[sev]) sev = next; };

    if (v >= 4.0) { criteria.push(`Vmax ≥ 4.0 m/s → Severe (${v})`); up("severe"); }
    else if (v >= 3.0) { criteria.push(`Vmax 3.0–3.9 m/s → Moderate (${v})`); up("moderate"); }
    else if (v >= 2.0) { criteria.push(`Vmax 2.0–2.9 m/s → Mild (${v})`); up("mild"); }
    else if (v > 0) { criteria.push(`Vmax < 2.0 m/s → Normal (${v})`); up("normal"); }

    if (m >= 40) { criteria.push(`Mean gradient ≥ 40 mmHg → Severe (${m})`); up("severe"); }
    else if (m >= 20) { criteria.push(`Mean gradient 20–39 mmHg → Moderate (${m})`); up("moderate"); }
    else if (m > 0) { criteria.push(`Mean gradient < 20 mmHg → Mild (${m})`); up("mild"); }

    if (a > 0 && a <= 1.0) { criteria.push(`AVA ≤ 1.0 cm² → Severe (${a})`); up("severe"); }
    else if (a > 1.0 && a <= 1.5) { criteria.push(`AVA 1.0–1.5 cm² → Moderate (${a})`); up("moderate"); }
    else if (a > 1.5) { criteria.push(`AVA > 1.5 cm² → Mild/Normal (${a})`); up("mild"); }

    if (ai > 0 && ai <= 0.6) { criteria.push(`AVAi ≤ 0.6 cm²/m² → Severe (${ai})`); up("severe"); }
    else if (ai > 0.6 && ai <= 0.85) { criteria.push(`AVAi 0.6–0.85 cm²/m² → Moderate (${ai})`); up("moderate"); }

    if (d > 0 && d < 0.25) { criteria.push(`DVI < 0.25 → Severe (${d})`); up("severe"); }
    else if (d >= 0.25 && d < 0.35) { criteria.push(`DVI 0.25–0.35 → Moderate (${d})`); up("moderate"); }

    return { severity: sev, criteria };
  };

  const { severity, criteria } = getSeverity() as { severity: Severity; criteria: string[] };
  const hasInput = vmax || mg || ava;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InputField label="AV Vmax" unit="m/s" value={vmax} onChange={setVmax} placeholder="e.g. 4.1" />
        <InputField label="Mean Gradient" unit="mmHg" value={mg} onChange={setMg} placeholder="e.g. 43" />
        <InputField label="AVA (continuity)" unit="cm²" value={ava} onChange={setAva} placeholder="e.g. 0.8" />
        <InputField label="AVAi" unit="cm²/m²" value={avai} onChange={setAvai} placeholder="e.g. 0.55" hint="AVA/BSA" />
        <InputField label="DVI" unit="ratio" value={dvi} onChange={setDvi} placeholder="e.g. 0.22" hint="LVOT VTI/AV VTI" />
      </div>
      {hasInput && (
        <ResultPanel guideline="Per ASE/ACC/AHA 2021 Valvular Heart Disease Guidelines">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-gray-700">Aortic Stenosis:</span>
            <SeverityBadge severity={severity} />
          </div>
          <ul className="space-y-1">
            {criteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />{c}
              </li>
            ))}
          </ul>
          {severity === "severe" && (
            <div className="mt-2 text-xs font-semibold text-red-600 bg-red-50 rounded px-2 py-1">
              Low-flow, low-gradient AS: if AVA ≤1.0 cm² but gradient &lt;40 mmHg, consider dobutamine stress echo or CT calcium scoring.
            </div>
          )}
          <EchoAssistLink engine="as" params={{ avVmax: vmax, avMg: mg }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- MITRAL REGURGITATION ----------------------------------------------------
// Per ASE/ACC/AHA 2021 VHD Guidelines (Zoghbi et al.) — Full multi-parameter grading
function MRCalculator() {
  // PISA
  const [pisaR, setPisaR] = useState("");
  const [aliasV, setAliasV] = useState("40");
  const [mrVmax, setMrVmax] = useState("");
  // Quantitative
  const [eroa, setEroa] = useState("");
  const [rvol, setRvol] = useState("");
  const [rf, setRf] = useState(""); // regurgitant fraction
  // Qualitative / semi-quantitative
  const [vcw, setVcw] = useState("");  // vena contracta width
  const [jetArea, setJetArea] = useState(""); // jet area / LA area %
  const [pvFlow, setPvFlow] = useState<"normal" | "blunted" | "reversal" | "">("")
  const [mrType, setMrType] = useState<"primary" | "secondary" | "">("")

  const pisaFlow = pisaR && aliasV ? (2 * Math.PI * Math.pow(parseFloat(pisaR), 2) * parseFloat(aliasV)).toFixed(1) : "";
  const calcEroa = pisaFlow && mrVmax ? (parseFloat(pisaFlow) / parseFloat(mrVmax)).toFixed(2) : "";
  const calcRvol = calcEroa && mrVmax ? (parseFloat(calcEroa) * parseFloat(mrVmax) * 0.1).toFixed(1) : "";

  const eVal = eroa || calcEroa;
  const rVal = rvol || calcRvol;

  // Integrated severity grading
  const getSeverity = (): { sev: Severity; criteria: string[]; warnings: string[] } => {
    const e = parseFloat(eVal || "0");
    const r = parseFloat(rVal || "0");
    const v = parseFloat(vcw || "0");
    const ja = parseFloat(jetArea || "0");
    const rfVal = parseFloat(rf || "0");
    const criteria: string[] = [];
    const warnings: string[] = [];
    let sevScore = 0;

    // Quantitative (most reliable)
    if (e >= 0.4) { criteria.push(`EROA ${e} cm² ≥ 0.40 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (e >= 0.2) { criteria.push(`EROA ${e} cm² 0.20–0.39 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (e > 0) { criteria.push(`EROA ${e} cm² < 0.20 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (r >= 60) { criteria.push(`R.Vol ${r} mL ≥ 60 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (r >= 30) { criteria.push(`R.Vol ${r} mL 30–59 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (r > 0) { criteria.push(`R.Vol ${r} mL < 30 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (rfVal >= 50) { criteria.push(`RF ${rfVal}% ≥ 50% → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (rfVal >= 30) { criteria.push(`RF ${rfVal}% 30–49% → Moderate`); sevScore = Math.max(sevScore, 2); }

    // Semi-quantitative
    if (v >= 0.7) { criteria.push(`VCW ${v} cm ≥ 0.7 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (v >= 0.3) { criteria.push(`VCW ${v} cm 0.3–0.69 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (v > 0) { criteria.push(`VCW ${v} cm < 0.3 → Mild`); sevScore = Math.max(sevScore, 1); }

    // Qualitative
    if (ja >= 40) { criteria.push(`Jet area ${ja}% of LA ≥ 40% → Severe (qualitative)`); }
    else if (ja > 0 && ja < 20) { criteria.push(`Jet area ${ja}% of LA < 20% → Mild (qualitative)`); }

    if (pvFlow === "reversal") { criteria.push("Pulmonary vein systolic flow reversal → Severe"); sevScore = Math.max(sevScore, 3); }
    else if (pvFlow === "blunted") { criteria.push("Pulmonary vein systolic flow blunting → Moderate/Severe"); }

    // Secondary MR thresholds differ
    if (mrType === "secondary" && e >= 0.2) {
      warnings.push("Secondary MR: Severe threshold is EROA ≥0.20 cm² and R.Vol ≥30 mL (ASE/ESC 2021)");
    }

    const sev: Severity = sevScore >= 3 ? "severe" : sevScore === 2 ? "moderate" : sevScore === 1 ? "mild" : "none";
    return { sev, criteria, warnings };
  };

  const { sev, criteria, warnings } = getSeverity();
  const hasInput = eVal || rVal || vcw || jetArea;

  return (
    <div className="space-y-4">
      {/* MR Type */}
      <div className="flex gap-3 items-center">
        <span className="text-xs font-semibold text-gray-600">MR Type:</span>
        {(["primary", "secondary"] as const).map(t => (
          <button key={t} onClick={() => setMrType(mrType === t ? "" : t)}
            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
              mrType === t ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={mrType === t ? { background: "#189aa1" } : {}}>
            {t === "primary" ? "Primary (Organic)" : "Secondary (Functional)"}
          </button>
        ))}
      </div>

      {mrType === "secondary" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          Secondary MR: Severe threshold is lower — EROA ≥0.20 cm², R.Vol ≥30 mL (per ASE/ESC 2021 guidelines)
        </div>
      )}

      {/* PISA */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PISA Method (Quantitative)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="PISA Radius" unit="cm" value={pisaR} onChange={setPisaR} placeholder="e.g. 0.9" />
          <InputField label="Aliasing Velocity" unit="cm/s" value={aliasV} onChange={setAliasV} placeholder="40" />
          <InputField label="MR Vmax" unit="cm/s" value={mrVmax} onChange={setMrVmax} placeholder="e.g. 500" />
        </div>
        {pisaFlow && <div className="text-xs text-gray-500 mt-1">PISA Flow Rate: <span className="font-mono font-bold text-[#189aa1]">{pisaFlow} mL/s</span></div>}
      </div>

      {/* Direct entry */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantitative Parameters</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="EROA" unit="cm²" value={eroa} onChange={setEroa} placeholder={calcEroa || "e.g. 0.4"} />
          <InputField label="Regurgitant Volume" unit="mL" value={rvol} onChange={setRvol} placeholder={calcRvol || "e.g. 60"} />
          <InputField label="Regurgitant Fraction" unit="%" value={rf} onChange={setRf} placeholder="e.g. 55" hint="Severe ≥50%" />
        </div>
      </div>

      {/* Semi-quantitative */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Semi-Quantitative</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="Vena Contracta Width" unit="cm" value={vcw} onChange={setVcw} placeholder="e.g. 0.7" hint="Severe ≥0.7" />
          <InputField label="Jet Area / LA Area" unit="%" value={jetArea} onChange={setJetArea} placeholder="e.g. 45" hint="Severe ≥40%" />
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pulmonary Vein Systolic Flow</label>
            <select value={pvFlow} onChange={e => setPvFlow(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
              <option value="">Select...</option>
              <option value="normal">Normal (S &gt; D)</option>
              <option value="blunted">Blunted (S ≈ D)</option>
              <option value="reversal">Systolic reversal → Severe</option>
            </select>
          </div>
        </div>
      </div>

      {hasInput && (
        <ResultPanel guideline="Per ASE/ACC/AHA 2021 VHD Guidelines (Zoghbi et al.) — Integrated multi-parameter grading">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Mitral Regurgitation:</span>
            <SeverityBadge severity={sev} />
          </div>
          <ul className="space-y-1 mb-2">
            {criteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />{c}
              </li>
            ))}
          </ul>
          {warnings.map((w, i) => (
            <div key={i} className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded px-2 py-1">{w}</div>
          ))}
          <div className="mt-3 pt-2 border-t border-[#189aa1]/10">
            <div className="text-xs text-gray-500 font-semibold mb-1">Severity Thresholds (Primary MR)</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[["Mild","EROA <0.20, R.Vol <30, VCW <0.3","#16a34a"],["Moderate","EROA 0.20–0.39, R.Vol 30–59","#d97706"],["Severe","EROA ≥0.40, R.Vol ≥60, VCW ≥0.7","#dc2626"]].map(([label, vals, color]) => (
                <div key={label} className="p-2 rounded" style={{ background: color + "10" }}>
                  <div className="font-bold" style={{ color }}>{label}</div>
                  <div className="text-gray-500 mt-0.5">{vals}</div>
                </div>
              ))}
            </div>
           </div>
          <EchoAssistLink engine="mr" params={{ eroaMr: eroa || calcEroa, regVolMr: rvol || calcRvol, vcMr: vcw }} />
        </ResultPanel>
      )}
    </div>
  );
}
// // --- TRICUSPID REGURGITATION ----------------------------------------------
// Per ASE 2021 VHD Guidelines — Full multi-parameter grading
function TRCalculator() {
  const [eroa, setEroa] = useState("");
  const [rvol, setRvol] = useState("");
  const [vcw, setVcw] = useState("");
  const [jetArea, setJetArea] = useState(""); // jet area cm²
  const [pisaR, setPisaR] = useState("");
  const [aliasV, setAliasV] = useState("28");
  const [trVmax, setTrVmax] = useState("");
  const [hvFlow, setHvFlow] = useState<"normal" | "blunted" | "reversal" | "">("")
  const [ivcDil, setIvcDil] = useState(false);
  const [raDil, setRaDil] = useState(false);

  // PISA calculation for TR
  const pisaFlow = pisaR && aliasV ? (2 * Math.PI * Math.pow(parseFloat(pisaR), 2) * parseFloat(aliasV)).toFixed(1) : "";
  const calcEroa = pisaFlow && trVmax ? (parseFloat(pisaFlow) / (parseFloat(trVmax) * 100)).toFixed(2) : "";
  const eVal = eroa || calcEroa;

  const getSeverity = (): { sev: Severity; criteria: string[]; supportingFeatures: string[] } => {
    const e = parseFloat(eVal || "0");
    const r = parseFloat(rvol || "0");
    const v = parseFloat(vcw || "0");
    const ja = parseFloat(jetArea || "0");
    const criteria: string[] = [];
    const supportingFeatures: string[] = [];
    let sevScore = 0;

    // Quantitative
    if (e >= 0.4) { criteria.push(`EROA ${e} cm² ≥ 0.40 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (e >= 0.2) { criteria.push(`EROA ${e} cm² 0.20–0.39 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (e > 0) { criteria.push(`EROA ${e} cm² < 0.20 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (r >= 45) { criteria.push(`R.Vol ${r} mL ≥ 45 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (r >= 30) { criteria.push(`R.Vol ${r} mL 30–44 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (r > 0) { criteria.push(`R.Vol ${r} mL < 30 → Mild`); sevScore = Math.max(sevScore, 1); }

    // Semi-quantitative
    if (v >= 0.7) { criteria.push(`VCW ${v} cm ≥ 0.7 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (v >= 0.3) { criteria.push(`VCW ${v} cm 0.3–0.69 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (v > 0) { criteria.push(`VCW ${v} cm < 0.3 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (ja >= 10) { criteria.push(`Jet area ${ja} cm² ≥ 10 cm² → Severe (qualitative)`); sevScore = Math.max(sevScore, 3); }
    else if (ja > 0) { criteria.push(`Jet area ${ja} cm² < 10 cm² → Mild-Moderate`); }

    // Supportive features
    if (hvFlow === "reversal") { supportingFeatures.push("⚠ Hepatic vein systolic flow reversal → Severe TR"); sevScore = Math.max(sevScore, 3); }
    else if (hvFlow === "blunted") { supportingFeatures.push("Hepatic vein systolic flow blunting → Moderate-Severe"); }
    if (ivcDil) supportingFeatures.push("IVC dilated (>21 mm) → Elevated RAP");
    if (raDil) supportingFeatures.push("RA dilation (area >18 cm²) → Chronic TR");

    const sev: Severity = sevScore >= 3 ? "severe" : sevScore === 2 ? "moderate" : sevScore === 1 ? "mild" : "none";
    return { sev, criteria, supportingFeatures };
  };

  const { sev, criteria, supportingFeatures } = getSeverity();
  const hasInput = eVal || rvol || vcw || jetArea;

  return (
    <div className="space-y-4">
      {/* PISA */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PISA Method</div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="PISA Radius" unit="cm" value={pisaR} onChange={setPisaR} placeholder="e.g. 0.8" />
          <InputField label="Aliasing Velocity" unit="cm/s" value={aliasV} onChange={setAliasV} placeholder="28" />
          <InputField label="TR Vmax" unit="m/s" value={trVmax} onChange={setTrVmax} placeholder="e.g. 3.0" />
        </div>
      </div>

      {/* Quantitative */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantitative Parameters</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="EROA" unit="cm²" value={eroa} onChange={setEroa} placeholder={calcEroa || "e.g. 0.4"} />
          <InputField label="Regurgitant Volume" unit="mL" value={rvol} onChange={setRvol} placeholder="e.g. 45" />
          <InputField label="Vena Contracta Width" unit="cm" value={vcw} onChange={setVcw} placeholder="e.g. 0.7" hint="Severe ≥0.7" />
          <InputField label="Jet Area" unit="cm²" value={jetArea} onChange={setJetArea} placeholder="e.g. 10" hint="Severe ≥10 cm²" />
        </div>
      </div>

      {/* Supporting features */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supporting Features</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hepatic Vein Systolic Flow</label>
            <select value={hvFlow} onChange={e => setHvFlow(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
              <option value="">Select...</option>
              <option value="normal">Normal (S &gt; D)</option>
              <option value="blunted">Blunted (S ≈ D)</option>
              <option value="reversal">Systolic reversal → Severe</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={ivcDil} onChange={e => setIvcDil(e.target.checked)} className="rounded" />
              IVC dilated (&gt;21 mm)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={raDil} onChange={e => setRaDil(e.target.checked)} className="rounded" />
              RA dilated (&gt;18 cm²)
            </label>
          </div>
        </div>
      </div>

      {hasInput && (
        <ResultPanel guideline="Per ASE 2021 VHD Guidelines — TR Severity (Lancellotti et al.)">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Tricuspid Regurgitation:</span>
            <SeverityBadge severity={sev} />
          </div>
          <ul className="space-y-1 mb-2">
            {criteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />{c}
              </li>
            ))}
          </ul>
          {supportingFeatures.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#189aa1]/10">
              <div className="text-xs font-semibold text-gray-500 mb-1">Supporting Features</div>
              {supportingFeatures.map((f, i) => (
                <div key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-1">{f}</div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-[#189aa1]/10 text-xs text-gray-500">
            Severe TR: EROA ≥0.40 cm² | R.Vol ≥45 mL | VCW ≥0.7 cm | Jet area ≥10 cm² | HV systolic reversal
          </div>
          <EchoAssistLink engine="rv" params={{ trVmax }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- AORTIC REGURGITATION -----------------------------------------------------
function ARCalculator() {
  // Semi-quantitative
  const [vcw, setVcw] = useState("");
  const [jetLvot, setJetLvot] = useState(""); // jet width / LVOT diameter %
  const [pht, setPht] = useState(""); // pressure half-time
  // Quantitative
  const [eroa, setEroa] = useState("");
  const [rvol, setRvol] = useState("");
  const [rf, setRf] = useState(""); // regurgitant fraction
  // Qualitative / supporting
  const [diastRevDesc, setDiastRevDesc] = useState<"none" | "brief" | "holodiastolic" | "">("")
  const [lvDil, setLvDil] = useState(false);
  const [aortaSize, setAortaSize] = useState("");

  const getSeverity = (): { sev: Severity; criteria: string[]; supportingFeatures: string[] } => {
    const v = parseFloat(vcw || "0");
    const jl = parseFloat(jetLvot || "0");
    const p = parseFloat(pht || "0");
    const e = parseFloat(eroa || "0");
    const r = parseFloat(rvol || "0");
    const rfVal = parseFloat(rf || "0");
    const criteria: string[] = [];
    const supportingFeatures: string[] = [];
    let sevScore = 0;

    // Quantitative (most reliable)
    if (e >= 0.3) { criteria.push(`EROA ${e} cm² ≥ 0.30 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (e >= 0.1) { criteria.push(`EROA ${e} cm² 0.10–0.29 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (e > 0) { criteria.push(`EROA ${e} cm² < 0.10 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (r >= 60) { criteria.push(`R.Vol ${r} mL ≥ 60 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (r >= 30) { criteria.push(`R.Vol ${r} mL 30–59 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (r > 0) { criteria.push(`R.Vol ${r} mL < 30 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (rfVal >= 50) { criteria.push(`RF ${rfVal}% ≥ 50% → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (rfVal >= 30) { criteria.push(`RF ${rfVal}% 30–49% → Moderate`); sevScore = Math.max(sevScore, 2); }

    // Semi-quantitative
    if (v >= 0.6) { criteria.push(`VCW ${v} cm ≥ 0.6 → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (v >= 0.3) { criteria.push(`VCW ${v} cm 0.3–0.59 → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (v > 0) { criteria.push(`VCW ${v} cm < 0.3 → Mild`); sevScore = Math.max(sevScore, 1); }

    if (jl >= 65) { criteria.push(`Jet/LVOT ratio ${jl}% ≥ 65% → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (jl >= 25) { criteria.push(`Jet/LVOT ratio ${jl}% 25–64% → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (jl > 0) { criteria.push(`Jet/LVOT ratio ${jl}% < 25% → Mild`); sevScore = Math.max(sevScore, 1); }

    if (p > 0 && p <= 200) { criteria.push(`PHT ${p} ms ≤ 200 ms → Severe`); sevScore = Math.max(sevScore, 3); }
    else if (p > 200 && p <= 500) { criteria.push(`PHT ${p} ms 200–500 ms → Moderate`); sevScore = Math.max(sevScore, 2); }
    else if (p > 500) { criteria.push(`PHT ${p} ms > 500 ms → Mild`); sevScore = Math.max(sevScore, 1); }

    // Supporting features
    if (diastRevDesc === "holodiastolic") {
      supportingFeatures.push("⚠ Holodiastolic flow reversal in descending aorta → Severe AR");
      sevScore = Math.max(sevScore, 3);
    } else if (diastRevDesc === "brief") {
      supportingFeatures.push("Brief diastolic flow reversal in descending aorta → Mild-Moderate AR");
    }
    if (lvDil) supportingFeatures.push("LV dilation → Chronic volume overload from AR");
    if (aortaSize && parseFloat(aortaSize) >= 45) {
      supportingFeatures.push(`⚠ Aortic root/ascending aorta ${aortaSize} mm ≥ 45 mm → Consider surgical threshold`);
    }

    const sev: Severity = sevScore >= 3 ? "severe" : sevScore === 2 ? "moderate" : sevScore === 1 ? "mild" : "none";
    return { sev, criteria, supportingFeatures };
  };

  const { sev, criteria, supportingFeatures } = getSeverity();
  const hasInput = vcw || pht || eroa || rvol || jetLvot;

  return (
    <div className="space-y-4">
      {/* Quantitative */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quantitative Parameters</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <InputField label="EROA" unit="cm²" value={eroa} onChange={setEroa} placeholder="e.g. 0.3" hint="Severe ≥0.30" />
          <InputField label="Regurgitant Volume" unit="mL" value={rvol} onChange={setRvol} placeholder="e.g. 60" hint="Severe ≥60" />
          <InputField label="Regurgitant Fraction" unit="%" value={rf} onChange={setRf} placeholder="e.g. 50" hint="Severe ≥50%" />
        </div>
      </div>

      {/* Semi-quantitative */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Semi-Quantitative</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InputField label="Vena Contracta Width" unit="cm" value={vcw} onChange={setVcw} placeholder="e.g. 0.6" hint="Severe ≥0.6" />
          <InputField label="Jet Width / LVOT" unit="%" value={jetLvot} onChange={setJetLvot} placeholder="e.g. 65" hint="Severe ≥65%" />
          <InputField label="AR Jet PHT" unit="ms" value={pht} onChange={setPht} placeholder="e.g. 250" hint="Severe ≤200" />
          <InputField label="Aortic Root/Asc Ao" unit="mm" value={aortaSize} onChange={setAortaSize} placeholder="e.g. 42" hint="Surgical ≥45" />
        </div>
      </div>

      {/* Supporting features */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Supporting Features</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Diastolic Flow Reversal (Desc. Ao)</label>
            <select value={diastRevDesc} onChange={e => setDiastRevDesc(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
              <option value="">Select...</option>
              <option value="none">None / Absent</option>
              <option value="brief">Brief early diastolic reversal</option>
              <option value="holodiastolic">Holodiastolic reversal → Severe</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={lvDil} onChange={e => setLvDil(e.target.checked)} className="rounded" />
              LV dilation present
            </label>
          </div>
        </div>
      </div>

      {hasInput && (
        <ResultPanel guideline="Per ASE/ACC/AHA 2021 VHD Guidelines — AR Severity (Zoghbi et al.)">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-gray-700">Aortic Regurgitation:</span>
            <SeverityBadge severity={sev} />
          </div>
          <ul className="space-y-1 mb-2">
            {criteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />{c}
              </li>
            ))}
          </ul>
          {supportingFeatures.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#189aa1]/10">
              <div className="text-xs font-semibold text-gray-500 mb-1">Supporting Features</div>
              {supportingFeatures.map((f, i) => (
                <div key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-1">{f}</div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-[#189aa1]/10">
            <div className="text-xs text-gray-500 font-semibold mb-1">Severity Thresholds</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[["Mild","VCW <0.3, Jet/LVOT <25%, PHT >500","#16a34a"],["Moderate","VCW 0.3–0.59, EROA 0.10–0.29","#d97706"],["Severe","VCW ≥0.6, EROA ≥0.30, R.Vol ≥60, PHT ≤200","#dc2626"]].map(([label, vals, color]) => (
                <div key={label} className="p-2 rounded" style={{ background: color + "10" }}>
                  <div className="font-bold" style={{ color }}>{label}</div>
                  <div className="text-gray-500 mt-0.5">{vals}</div>
                </div>
              ))}
             </div>
          </div>
          <EchoAssistLink engine="ar" params={{ venaContracta: vcw, eroa, regVol: rvol, phtAr: pht }} />
        </ResultPanel>
      )}
    </div>
  );
}
// --- MVA (Pressure Half-Time) -------------------------------------------------
function MVACalculator() {
  const [pht, setPht] = useState("");
  const [mva, setMva] = useState("");

  const calcMva = pht ? (220 / parseFloat(pht)).toFixed(2) : "";
  const mvaVal = mva || calcMva;

  const getSeverity = (): Severity => {
    const m = parseFloat(mvaVal || "0");
    if (m > 0 && m <= 1.0) return "severe";
    if (m > 1.0 && m <= 1.5) return "moderate";
    if (m > 1.5) return "mild";
    return "none";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Pressure Half-Time" unit="ms" value={pht} onChange={setPht} placeholder="e.g. 220" />
        <InputField label="MVA (direct)" unit="cm²" value={mva} onChange={setMva} placeholder={calcMva || "optional"} />
      </div>
      {(pht || mva) && (
        <ResultPanel guideline="MVA = 220 / PHT — Per ASE/ACC/AHA Guidelines">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-gray-700">Mitral Valve Area:</span>
            <span className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {mvaVal} cm²
            </span>
            <SeverityBadge severity={getSeverity()} />
          </div>
          <div className="text-xs text-gray-500">Severe MS: MVA ≤1.0 cm² | Moderate: 1.0–1.5 cm² | Mild: &gt;1.5 cm²</div>
          <EchoAssistLink engine="ms" params={{ mva: mvaVal }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- RVSP ---------------------------------------------------------------------
function RVSPCalculator() {
  const [trVmax, setTrVmax] = useState("");
  const [rap, setRap] = useState("5");

  const rvsp = trVmax ? (4 * Math.pow(parseFloat(trVmax), 2) + parseFloat(rap || "5")).toFixed(1) : "";
  const val = rvsp ? parseFloat(rvsp) : 0;
  const severity: Severity = val >= 60 ? "severe" : val >= 40 ? "moderate" : val > 35 ? "mild" : "normal";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="TR Vmax" unit="m/s" value={trVmax} onChange={setTrVmax} placeholder="e.g. 3.2" />
        <InputField label="RAP estimate" unit="mmHg" value={rap} onChange={setRap} placeholder="5" />
      </div>
      {rvsp && (
        <ResultPanel guideline="RVSP = 4 × TR Vmax² + RAP — Bernoulli equation">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-gray-600">RVSP =</span>
            <span className="text-3xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{rvsp}</span>
            <span className="text-sm text-gray-500">mmHg</span>
            <SeverityBadge severity={severity} />
          </div>
          <div className="text-xs text-gray-500">Normal ≤35 | Mild 36–40 | Moderate 41–60 | Severe &gt;60 mmHg</div>
          <EchoAssistLink engine="ph" params={{ trVmax, rap }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- DIASTOLOGY ENGINE (ASE 2016 + LARS) -------------------------------------
function DiastologyCalculator() {
  const [e, setE] = useState("");
  const [a, setA] = useState("");
  const [eSeptal, setESeptal] = useState("");
  const [eLateral, setELateral] = useState("");
  const [trVel, setTrVel] = useState("");
  const [lavi, setLavi] = useState("");
  const [lars, setLars] = useState("");
  const [showLars, setShowLars] = useState(false);

  const eVal = parseFloat(e), aVal = parseFloat(a);
  const eaRatio = eVal && aVal ? eVal / aVal : 0;
  const epSeptal = parseFloat(eSeptal), epLateral = parseFloat(eLateral);
  const avgEp = epSeptal && epLateral ? (epSeptal + epLateral) / 2 : epSeptal || epLateral || 0;
  const eeRatio = eVal && avgEp ? eVal / avgEp : 0;
  const tr = parseFloat(trVel);
  const laviVal = parseFloat(lavi);
  const larsVal = parseFloat(lars);

  // ASE 2016 Algorithm A (EF ≥50%)
  // Step 1: Is e' abnormal? septal <7 or lateral <10
  const epAbnormal = (epSeptal > 0 && epSeptal < 7) || (epLateral > 0 && epLateral < 10);
  // Step 2: Count abnormal criteria (≥2 of 3 = elevated filling pressure)
  const abnormalCriteria = [
    eeRatio > 14,
    tr > 2.8,
    laviVal > 34,
  ];
  const abnormalCount = abnormalCriteria.filter(Boolean).length;

  // LARS grading (per published cutoffs: ≥35% normal, 24–35% grade I, <24% grade II/III)
  const larsGrade = larsVal > 0
    ? larsVal >= 35 ? { label: "Normal (≥35%)", color: "#16a34a" }
    : larsVal >= 24 ? { label: "Mildly Reduced — Grade I DD", color: "#d97706" }
    : larsVal >= 18 ? { label: "Moderately Reduced — Grade II DD", color: "#d97706" }
    : { label: "Severely Reduced — Grade III DD", color: "#dc2626" }
    : null;

  // Grade determination
  let grade = "";
  let fillingPressure = "";
  let gradeColor = "#189aa1";

  if (eaRatio > 0) {
    if (eaRatio < 0.8) {
      grade = "Grade I — Impaired Relaxation";
      fillingPressure = "Normal filling pressures";
      gradeColor = "#d97706";
    } else if (eaRatio >= 0.8 && eaRatio <= 2.0) {
      if (abnormalCount >= 2) {
        grade = "Grade II — Pseudonormal (Elevated Filling Pressures)";
        fillingPressure = "Elevated filling pressures";
        gradeColor = "#d97706";
      } else if (abnormalCount === 1) {
        grade = "Indeterminate — Insufficient criteria";
        fillingPressure = "Filling pressure uncertain";
        gradeColor = "#189aa1";
      } else {
        grade = "Normal Diastolic Function";
        fillingPressure = "Normal filling pressures";
        gradeColor = "#16a34a";
      }
    } else if (eaRatio > 2.0) {
      grade = "Grade III — Restrictive Filling";
      fillingPressure = "Markedly elevated filling pressures";
      gradeColor = "#dc2626";
    }
  }

  // LARS override: if LARS severely reduced, upgrade filling pressure concern
  const larsElevated = larsVal > 0 && larsVal < 18;

  const hasInput = e || a || eSeptal;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InputField label="E velocity" unit="m/s" value={e} onChange={setE} placeholder="e.g. 0.85" />
        <InputField label="A velocity" unit="m/s" value={a} onChange={setA} placeholder="e.g. 0.65" />
        <InputField label="e' Septal" unit="cm/s" value={eSeptal} onChange={setESeptal} placeholder="e.g. 6" hint="<7 = abnormal" />
        <InputField label="e' Lateral" unit="cm/s" value={eLateral} onChange={setELateral} placeholder="e.g. 9" hint="<10 = abnormal" />
        <InputField label="TR Vmax" unit="m/s" value={trVel} onChange={setTrVel} placeholder="e.g. 2.5" hint=">2.8 = abnormal" />
        <InputField label="LAVI" unit="mL/m²" value={lavi} onChange={setLavi} placeholder="e.g. 38" hint=">34 = abnormal" />
      </div>

      {/* LARS section */}
      <div className="border border-[#189aa1]/20 rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#f0fbfc] text-sm font-semibold text-[#189aa1] hover:bg-[#e0f7f8] transition-all"
          onClick={() => setShowLars(!showLars)}>
          <span>Left Atrial Reservoir Strain (LARS)</span>
          {showLars ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showLars && (
          <div className="p-4 space-y-3">
            <InputField label="LA Reservoir Strain (LASr)" unit="%" value={lars} onChange={setLars} placeholder="e.g. 28" hint="Normal ≥35%" />
            {larsGrade && (
              <div className="p-3 rounded-lg border animate-in fade-in duration-200" style={{ borderColor: larsGrade.color + "40", background: larsGrade.color + "10" }}>
                <div className="text-sm font-bold mb-0.5" style={{ color: larsGrade.color }}>{larsGrade.label}</div>
                <div className="text-xs text-gray-500">
                  LARS normal ≥35% | Grade I DD: 24–35% | Grade II DD: 18–24% | Grade III DD: &lt;18%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  LARS &lt;18% is associated with elevated LV filling pressures (PCWP ≥15 mmHg). Can substitute for TR velocity in indeterminate cases.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasInput && (
        <ResultPanel guideline="Per ASE/EACVI 2016 Diastology Guidelines (Nagueh et al.) + LARS (Nagueh 2023, JACC Imaging)">
          <div className="mb-3">
            <div className="text-sm font-bold mb-0.5" style={{ color: gradeColor }}>{grade || "Enter E and A to grade"}</div>
            {fillingPressure && <div className="text-xs font-semibold" style={{ color: gradeColor }}>{fillingPressure}</div>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {eaRatio > 0 && (
              <div className="bg-white rounded p-2 border border-gray-100 text-center">
                <div className="text-xs text-gray-400">E/A</div>
                <div className="font-bold text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{eaRatio.toFixed(2)}</div>
              </div>
            )}
            {eeRatio > 0 && (
              <div className={`bg-white rounded p-2 border text-center ${eeRatio > 14 ? "border-red-200" : "border-gray-100"}`}>
                <div className="text-xs text-gray-400">E/e' avg</div>
                <div className={`font-bold ${eeRatio > 14 ? "text-red-600" : "text-[#189aa1]"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {eeRatio.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">{eeRatio > 14 ? "↑ Elevated" : "Normal"}</div>
              </div>
            )}
            {tr > 0 && (
              <div className={`bg-white rounded p-2 border text-center ${tr > 2.8 ? "border-red-200" : "border-gray-100"}`}>
                <div className="text-xs text-gray-400">TR Vmax</div>
                <div className={`font-bold ${tr > 2.8 ? "text-red-600" : "text-[#189aa1]"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {tr}
                </div>
                <div className="text-xs text-gray-400">{tr > 2.8 ? "↑ Elevated" : "Normal"}</div>
              </div>
            )}
            {laviVal > 0 && (
              <div className={`bg-white rounded p-2 border text-center ${laviVal > 34 ? "border-red-200" : "border-gray-100"}`}>
                <div className="text-xs text-gray-400">LAVI</div>
                <div className={`font-bold ${laviVal > 34 ? "text-red-600" : "text-[#189aa1]"}`} style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {laviVal}
                </div>
                <div className="text-xs text-gray-400">{laviVal > 34 ? "↑ Dilated" : "Normal"}</div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600 mb-1">
            Abnormal criteria met: <span className="font-bold text-[#189aa1]">{abnormalCount}/3</span>
            <span className="text-gray-400 ml-1">(≥2/3 = elevated filling pressures)</span>
          </div>

          {larsElevated && (
            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              ⚠ LARS &lt;18% — strongly suggests elevated LV filling pressures regardless of E/A pattern.
            </div>
          )}
          <EchoAssistLink engine="diastolic" params={{ eVel: e, aVel: a, ePrimeSep: eSeptal, ePrimeLat: eLateral, trVmax: trVel, lavi, lars }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- LV FUNCTION + GLS + STRAIN RATE -----------------------------------------
function LVFunctionCalculator() {
  const [ef, setEf] = useState("");
  const [gls, setGls] = useState("");
  const [glsSR, setGlsSR] = useState("");
  const [edv, setEdv] = useState("");
  const [esv, setEsv] = useState("");

  const calcEF = edv && esv ? (((parseFloat(edv) - parseFloat(esv)) / parseFloat(edv)) * 100).toFixed(1) : "";
  const efVal = ef || calcEF;

  // GLS interpretation per ASE 2025 Strain Guideline
  // Normal GLS: more negative than -18% | Borderline: -16% to -18% | Abnormal: less negative than -16%
  const glsNum = parseFloat(gls);
  const glsAbs = Math.abs(glsNum);
  const glsInterp = gls
    ? glsAbs >= 18 ? { label: "Normal (≥18%)", color: "#16a34a", note: "Normal LV myocardial deformation" }
    : glsAbs >= 16 ? { label: "Borderline (16–18%)", color: "#d97706", note: "Subtle subclinical dysfunction. Monitor closely." }
    : { label: "Abnormal (<16%)", color: "#dc2626", note: "Reduced LV GLS. Evaluate for subclinical cardiomyopathy, cardiotoxicity, or ischemia." }
    : null;

  // GLS Strain Rate interpretation (normal: more negative than -1.0 s⁻¹)
  const glsSRNum = parseFloat(glsSR);
  const glsSRAbs = Math.abs(glsSRNum);
  const glsSRInterp = glsSR
    ? glsSRAbs >= 1.0 ? { label: "Normal (≥1.0 s⁻¹)", color: "#16a34a" }
    : { label: "Reduced (<1.0 s⁻¹)", color: "#dc2626" }
    : null;

  const efNum = parseFloat(efVal || "0");
  const efInterp = efNum > 0
    ? efNum >= 55 ? { label: "Normal EF (≥55%)", color: "#16a34a" }
    : efNum >= 40 ? { label: "Mildly-Moderately Reduced EF (40–54%)", color: "#d97706" }
    : efNum >= 30 ? { label: "Moderately Reduced EF (30–39%)", color: "#d97706" }
    : { label: "Severely Reduced EF (<30%)", color: "#dc2626" }
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InputField label="LVEF (biplane)" unit="%" value={ef} onChange={setEf} placeholder="e.g. 55" />
        <InputField label="LV EDV" unit="mL" value={edv} onChange={setEdv} placeholder="e.g. 120" />
        <InputField label="LV ESV" unit="mL" value={esv} onChange={setEsv} placeholder="e.g. 50" />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">LV Strain (Speckle Tracking)</div>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="LV GLS" unit="%" value={gls} onChange={setGls} placeholder="e.g. -20" hint="Normal ≤-18%" />
          <InputField label="LV GLS Strain Rate" unit="s⁻¹" value={glsSR} onChange={setGlsSR} placeholder="e.g. -1.2" hint="Normal ≤-1.0" />
        </div>
      </div>

      {(efVal || gls) && (
        <ResultPanel guideline="EF per ASE/WFTF 2018 Chamber Quantification | GLS per ASE 2025 Strain Guideline (Thomas et al.)">
          {efInterp && (
            <div className="mb-3 p-2 rounded border" style={{ borderColor: efInterp.color + "40", background: efInterp.color + "10" }}>
              <div className="text-xs text-gray-500 mb-0.5">LVEF</div>
              <div className="text-xl font-black" style={{ fontFamily: "JetBrains Mono, monospace", color: efInterp.color }}>
                {efVal}%
              </div>
              <div className="text-xs font-semibold" style={{ color: efInterp.color }}>{efInterp.label}</div>
            </div>
          )}
          {glsInterp && (
            <div className="mb-2 p-2 rounded border" style={{ borderColor: glsInterp.color + "40", background: glsInterp.color + "10" }}>
              <div className="text-xs text-gray-500 mb-0.5">LV Global Longitudinal Strain (GLS)</div>
              <div className="text-xl font-black" style={{ fontFamily: "JetBrains Mono, monospace", color: glsInterp.color }}>
                {gls}%
              </div>
              <div className="text-xs font-semibold" style={{ color: glsInterp.color }}>{glsInterp.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{glsInterp.note}</div>
            </div>
          )}
          {glsSRInterp && (
            <div className="p-2 rounded border" style={{ borderColor: glsSRInterp.color + "40", background: glsSRInterp.color + "10" }}>
              <div className="text-xs text-gray-500 mb-0.5">LV GLS Strain Rate</div>
              <div className="text-xl font-black" style={{ fontFamily: "JetBrains Mono, monospace", color: glsSRInterp.color }}>
                {glsSR} s⁻¹
              </div>
              <div className="text-xs font-semibold" style={{ color: glsSRInterp.color }}>{glsSRInterp.label}</div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-400">
            GLS normal: more negative than -18% | Borderline: -16 to -18% | Abnormal: less negative than -16%
          </div>
          <EchoAssistLink engine="lv" params={{ ef, lvGls: gls, lvSr: glsSR }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- RV FUNCTION + STRAIN -----------------------------------------------------
function RVFunctionCalculator() {
  const [tapse, setTapse] = useState("");
  const [rvFac, setRvFac] = useState("");
  const [rvSp, setRvSp] = useState("");
  const [rvFws, setRvFws] = useState("");
  const [rvFwsSR, setRvFwsSR] = useState("");
  const [rvGls, setRvGls] = useState("");

  // TAPSE: normal ≥17 mm
  const tapseInterp = tapse
    ? parseFloat(tapse) >= 17 ? { label: "Normal (≥17 mm)", color: "#16a34a" }
    : parseFloat(tapse) >= 14 ? { label: "Mildly Reduced (14–16 mm)", color: "#d97706" }
    : { label: "Reduced (<14 mm)", color: "#dc2626" }
    : null;

  // RV FAC: normal ≥35%
  const rvFacInterp = rvFac
    ? parseFloat(rvFac) >= 35 ? { label: "Normal (≥35%)", color: "#16a34a" }
    : parseFloat(rvFac) >= 25 ? { label: "Mildly Reduced (25–34%)", color: "#d97706" }
    : { label: "Reduced (<25%)", color: "#dc2626" }
    : null;

  // RV S' (TDI): normal ≥9.5 cm/s
  const rvSpInterp = rvSp
    ? parseFloat(rvSp) >= 9.5 ? { label: "Normal (≥9.5 cm/s)", color: "#16a34a" }
    : { label: "Reduced (<9.5 cm/s)", color: "#dc2626" }
    : null;

  // RV Free Wall Strain: normal more negative than -20% (ASE 2025: lower limit -17%)
  const rvFwsNum = Math.abs(parseFloat(rvFws));
  const rvFwsInterp = rvFws
    ? rvFwsNum >= 20 ? { label: "Normal (≥20%)", color: "#16a34a", note: "Normal RV free wall deformation" }
    : rvFwsNum >= 17 ? { label: "Borderline (17–20%)", color: "#d97706", note: "Subtle RV dysfunction. Monitor." }
    : { label: "Abnormal (<17%)", color: "#dc2626", note: "Reduced RV free wall strain. Evaluate for RV dysfunction, PAH, RV ischemia." }
    : null;

  // RV FWS Strain Rate: normal more negative than -1.0 s⁻¹
  const rvFwsSRInterp = rvFwsSR
    ? Math.abs(parseFloat(rvFwsSR)) >= 1.0 ? { label: "Normal (≥1.0 s⁻¹)", color: "#16a34a" }
    : { label: "Reduced (<1.0 s⁻¹)", color: "#dc2626" }
    : null;

  const hasInput = tapse || rvFac || rvSp || rvFws;

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Conventional RV Parameters</div>
      <div className="grid grid-cols-3 gap-3">
        <InputField label="TAPSE" unit="mm" value={tapse} onChange={setTapse} placeholder="e.g. 20" hint="Normal ≥17" />
        <InputField label="RV FAC" unit="%" value={rvFac} onChange={setRvFac} placeholder="e.g. 40" hint="Normal ≥35%" />
        <InputField label="RV S' (TDI)" unit="cm/s" value={rvSp} onChange={setRvSp} placeholder="e.g. 11" hint="Normal ≥9.5" />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">RV Strain (Speckle Tracking)</div>
        <div className="grid grid-cols-3 gap-3">
          <InputField label="RV Free Wall Strain" unit="%" value={rvFws} onChange={setRvFws} placeholder="e.g. -22" hint="Normal ≤-20%" />
          <InputField label="RV FWS Strain Rate" unit="s⁻¹" value={rvFwsSR} onChange={setRvFwsSR} placeholder="e.g. -1.1" hint="Normal ≤-1.0" />
          <InputField label="RV GLS (4-chamber)" unit="%" value={rvGls} onChange={setRvGls} placeholder="e.g. -18" hint="Normal ≤-17%" />
        </div>
      </div>

      {hasInput && (
        <ResultPanel guideline="Per ASE 2010 RV Guidelines + ASE 2025 Strain Guideline (Thomas et al.) — RV FWS lower normal limit -17%">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tapseInterp && (
              <div className="p-2 rounded border" style={{ borderColor: tapseInterp.color + "40", background: tapseInterp.color + "10" }}>
                <div className="text-xs text-gray-500">TAPSE</div>
                <div className="font-black text-lg" style={{ fontFamily: "JetBrains Mono, monospace", color: tapseInterp.color }}>{tapse} mm</div>
                <div className="text-xs font-semibold" style={{ color: tapseInterp.color }}>{tapseInterp.label}</div>
              </div>
            )}
            {rvFacInterp && (
              <div className="p-2 rounded border" style={{ borderColor: rvFacInterp.color + "40", background: rvFacInterp.color + "10" }}>
                <div className="text-xs text-gray-500">RV FAC</div>
                <div className="font-black text-lg" style={{ fontFamily: "JetBrains Mono, monospace", color: rvFacInterp.color }}>{rvFac}%</div>
                <div className="text-xs font-semibold" style={{ color: rvFacInterp.color }}>{rvFacInterp.label}</div>
              </div>
            )}
            {rvSpInterp && (
              <div className="p-2 rounded border" style={{ borderColor: rvSpInterp.color + "40", background: rvSpInterp.color + "10" }}>
                <div className="text-xs text-gray-500">RV S' (TDI)</div>
                <div className="font-black text-lg" style={{ fontFamily: "JetBrains Mono, monospace", color: rvSpInterp.color }}>{rvSp} cm/s</div>
                <div className="text-xs font-semibold" style={{ color: rvSpInterp.color }}>{rvSpInterp.label}</div>
              </div>
            )}
            {rvFwsInterp && (
              <div className="p-2 rounded border" style={{ borderColor: rvFwsInterp.color + "40", background: rvFwsInterp.color + "10" }}>
                <div className="text-xs text-gray-500">RV Free Wall Strain</div>
                <div className="font-black text-lg" style={{ fontFamily: "JetBrains Mono, monospace", color: rvFwsInterp.color }}>{rvFws}%</div>
                <div className="text-xs font-semibold" style={{ color: rvFwsInterp.color }}>{rvFwsInterp.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{rvFwsInterp.note}</div>
              </div>
            )}
            {rvFwsSRInterp && (
              <div className="p-2 rounded border" style={{ borderColor: rvFwsSRInterp.color + "40", background: rvFwsSRInterp.color + "10" }}>
                <div className="text-xs text-gray-500">RV FWS Strain Rate</div>
                <div className="font-black text-lg" style={{ fontFamily: "JetBrains Mono, monospace", color: rvFwsSRInterp.color }}>{rvFwsSR} s⁻¹</div>
                <div className="text-xs font-semibold" style={{ color: rvFwsSRInterp.color }}>{rvFwsSRInterp.label}</div>
              </div>
            )}
          </div>
          <EchoAssistLink engine="rv" params={{ tapse, rvFac, rvFws, rvSr: rvFwsSR }} />
        </ResultPanel>
      )}
    </div>
  );
}
// --- STROKE VOLUME / CARDIAC OUTPUT ------------------------------------------
function SVCalculator() {
  const [lvotD, setLvotD] = useState("");
  const [lvotVti, setLvotVti] = useState("");
  const [hr, setHr] = useState("");

  const lvotArea = lvotD ? (Math.PI * Math.pow(parseFloat(lvotD) / 2, 2)).toFixed(2) : "";
  const sv = lvotArea && lvotVti ? (parseFloat(lvotArea) * parseFloat(lvotVti)).toFixed(1) : "";
  const co = sv && hr ? ((parseFloat(sv) * parseFloat(hr)) / 1000).toFixed(2) : "";
  const ci = co ? (parseFloat(co) / 1.7).toFixed(2) : ""; // assume BSA 1.7 if not entered

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <InputField label="LVOT Diameter" unit="cm" value={lvotD} onChange={setLvotD} placeholder="e.g. 2.0" />
        <InputField label="LVOT VTI" unit="cm" value={lvotVti} onChange={setLvotVti} placeholder="e.g. 22" />
        <InputField label="Heart Rate" unit="bpm" value={hr} onChange={setHr} placeholder="e.g. 72" />
      </div>
      {sv && (
        <ResultPanel guideline="SV = LVOT CSA × LVOT VTI | CO = SV × HR | CI assumes BSA 1.7 m²">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">LVOT CSA</div>
              <div className="font-bold text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{lvotArea} cm²</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Stroke Volume</div>
              <div className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{sv} <span className="text-sm font-normal text-gray-500">mL</span></div>
              <div className="text-xs text-gray-400">Normal: 60–100 mL</div>
            </div>
            {co && (
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Cardiac Output</div>
                <div className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{co} <span className="text-sm font-normal text-gray-500">L/min</span></div>
                <div className="text-xs text-gray-400">Normal: 4–8 L/min | CI ~{ci} L/min/m²</div>
              </div>
            )}
          </div>
          <EchoAssistLink engine="lv" params={{ lvotD, lvotVti }} />
        </ResultPanel>
      )}
    </div>
  );
}

// --- MAIN COMPONENT -----------------------------------------------------------
const calculators = [
  { id: "as", label: "Aortic Stenosis", sub: "ASE/ACC/AHA 2021" },
  { id: "mr", label: "Mitral Regurgitation", sub: "PISA Method" },
  { id: "tr", label: "Tricuspid Regurgitation", sub: "ASE 2021" },
  { id: "ar", label: "Aortic Regurgitation", sub: "ASE 2021" },
  { id: "mva", label: "MVA (PHT)", sub: "Pressure Half-Time" },
  { id: "rvsp", label: "RVSP / PAP", sub: "Bernoulli" },
  { id: "diastology", label: "Diastology + LARS", sub: "ASE 2016 + LARS" },
  { id: "lv", label: "LV Function + GLS", sub: "ASE 2025 Strain" },
  { id: "rv", label: "RV Function + Strain", sub: "ASE 2025 Strain" },
  { id: "sv", label: "Stroke Volume / CO", sub: "LVOT Method" },
];

const componentMap: Record<string, React.ReactNode> = {
  as: <ASCalculator />,
  mr: <MRCalculator />,
  tr: <TRCalculator />,
  ar: <ARCalculator />,
  mva: <MVACalculator />,
  rvsp: <RVSPCalculator />,
  diastology: <DiastologyCalculator />,
  lv: <LVFunctionCalculator />,
  rv: <RVFunctionCalculator />,
  sv: <SVCalculator />,
};

export default function EchoCalculator() {
  const [active, setActive] = useState("as");

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Echo Severity Calculator
          </h1>
          <p className="text-sm text-gray-500">
            Guideline-based interpretation per ASE/ACC/AHA 2021 VHD, ASE 2016 Diastology, and ASE 2025 Strain Guidelines.
          </p>
        </div>

        {/* EchoAssist link banner */}
        <div className="flex items-center justify-between bg-[#f0fbfc] border border-[#b2e8ec] rounded-xl px-5 py-3 mb-5">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-[#189aa1] flex-shrink-0" />
            <p className="text-xs text-[#0e7490]">
              <strong>Need full guideline-based interpretation?</strong> EchoAssist™ provides instant severity classification with clinical narrative for all domains.
            </p>
          </div>
          <Link href="/echoassist"
            className="flex-shrink-0 ml-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#189aa1" }}>
            <Zap className="w-3.5 h-3.5" />
            Open EchoAssist™
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {calculators.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                active === c.id ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={active === c.id ? { background: "#189aa1" } : {}}>
              <div>{c.label}</div>
              <div className={`text-xs font-normal ${active === c.id ? "text-white/70" : "text-gray-400"}`}>{c.sub}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="teal-header px-5 py-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
              {calculators.find(c => c.id === active)?.label}
            </h3>
            <span className="ml-auto text-xs text-white/60">{calculators.find(c => c.id === active)?.sub}</span>
          </div>
          <div className="p-5">
            {componentMap[active]}
          </div>
        </div>

        {/* Reference table */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#189aa1]" />
            <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Quick Reference — Strain Normal Values (ASE 2025)</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-semibold text-gray-600">Parameter</th>
                  <th className="text-left py-2 pr-4 font-semibold text-green-600">Normal</th>
                  <th className="text-left py-2 pr-4 font-semibold text-amber-600">Borderline</th>
                  <th className="text-left py-2 font-semibold text-red-600">Abnormal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ["LV GLS", "≤ -18%", "-16% to -18%", "> -16%"],
                  ["LV GLS Strain Rate", "≤ -1.0 s⁻¹", "—", "> -1.0 s⁻¹"],
                  ["RV Free Wall Strain", "≤ -20%", "-17% to -20%", "> -17%"],
                  ["RV FWS Strain Rate", "≤ -1.0 s⁻¹", "—", "> -1.0 s⁻¹"],
                  ["LA Reservoir Strain (LARS)", "≥ 35%", "24–35%", "< 18%"],
                  ["LA Conduit Strain", "≥ 23%", "—", "< 18%"],
                ].map(([param, normal, borderline, abnormal]) => (
                  <tr key={param}>
                    <td className="py-1.5 pr-4 font-medium text-gray-700">{param}</td>
                    <td className="py-1.5 pr-4 text-green-600 font-mono">{normal}</td>
                    <td className="py-1.5 pr-4 text-amber-600 font-mono">{borderline}</td>
                    <td className="py-1.5 text-red-600 font-mono">{abnormal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
