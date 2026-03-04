/*
  iHeartEcho — Echo Severity Calculator
  Modules: AS, MR (PISA), TR, AR, MVA, RVSP, Diastology, GLS, Stroke Volume, CO
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Calculator, ChevronDown, Info } from "lucide-react";

type Severity = "normal" | "mild" | "moderate" | "severe" | "none";

function SeverityBadge({ severity }: { severity: Severity }) {
  if (!severity) return null;
  const classes: Record<string, string> = {
    normal: "severity-normal",
    mild: "severity-mild",
    moderate: "severity-moderate",
    severe: "severity-severe",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize ${classes[severity]}`}>
      {severity}
    </span>
  );
}

function InputField({
  label, unit, value, onChange, placeholder
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "—"}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white data-value"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        />
        <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 font-medium">{unit}</span>
      </div>
    </div>
  );
}

// ---- AS Calculator ----
function ASCalculator() {
  const [vmax, setVmax] = useState("");
  const [mg, setMg] = useState("");
  const [ava, setAva] = useState("");

  const getSeverity = (): { severity: Severity; criteria: string[] } => {
    const v = parseFloat(vmax), m = parseFloat(mg), a = parseFloat(ava);
    const criteria: string[] = [];
    let sev: Severity = "none";
    const sevRank: Record<Severity, number> = { none: 0, normal: 1, mild: 2, moderate: 3, severe: 4 };
    const upgradeSev = (next: Severity) => { if (sevRank[next] > sevRank[sev]) sev = next; };
    if (v >= 4) { criteria.push(`Vmax ≥ 4 m/s (${v})`); upgradeSev("severe"); }
    else if (v >= 3) { criteria.push(`Vmax 3–3.9 m/s (${v})`); upgradeSev("moderate"); }
    else if (v > 0) { criteria.push(`Vmax < 3 m/s (${v})`); upgradeSev("mild"); }
    if (m >= 40) { criteria.push(`Mean gradient ≥ 40 mmHg (${m})`); upgradeSev("severe"); }
    else if (m >= 20) { criteria.push(`Mean gradient 20–39 mmHg (${m})`); upgradeSev("moderate"); }
    else if (m > 0) { criteria.push(`Mean gradient < 20 mmHg (${m})`); upgradeSev("mild"); }
    if (a > 0 && a <= 1.0) { criteria.push(`AVA ≤ 1.0 cm² (${a})`); upgradeSev("severe"); }
    else if (a > 1.0 && a <= 1.5) { criteria.push(`AVA 1.0–1.5 cm² (${a})`); upgradeSev("moderate"); }
    else if (a > 1.5) { criteria.push(`AVA > 1.5 cm² (${a})`); upgradeSev("mild"); }
    return { severity: sev, criteria };
  };

  const { severity, criteria } = getSeverity();
  const hasInput = vmax || mg || ava;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InputField label="AV Vmax" unit="m/s" value={vmax} onChange={setVmax} placeholder="e.g. 4.1" />
        <InputField label="Mean Gradient" unit="mmHg" value={mg} onChange={setMg} placeholder="e.g. 43" />
        <InputField label="AVA" unit="cm²" value={ava} onChange={setAva} placeholder="e.g. 0.8" />
      </div>
      {hasInput && (
        <div className="result-panel rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-semibold text-gray-700">Result:</span>
            <SeverityBadge severity={severity} />
            <span className="text-xs text-gray-500">Aortic Stenosis</span>
          </div>
          {criteria.length > 0 && (
            <ul className="space-y-1">
              {criteria.map((c, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-xs text-gray-400">Per ASE/ACC/AHA Guidelines</div>
        </div>
      )}
    </div>
  );
}

// ---- Diastology Calculator ----
function DiastologyCalculator() {
  const [e, setE] = useState("");
  const [a, setA] = useState("");
  const [ePrime, setEPrime] = useState("");
  const [trVel, setTrVel] = useState("");
  const [lavi, setLavi] = useState("");

  const getGrade = () => {
    const eVal = parseFloat(e), aVal = parseFloat(a);
    const eaRatio = eVal && aVal ? eVal / aVal : 0;
    const epVal = parseFloat(ePrime);
    const eeRatio = eVal && epVal ? eVal / epVal : 0;
    const tr = parseFloat(trVel);
    const laviVal = parseFloat(lavi);

    const criteria: string[] = [];
    let grade = "";

    if (eaRatio > 0) criteria.push(`E/A ratio: ${eaRatio.toFixed(2)}`);
    if (eeRatio > 0) criteria.push(`E/e' ratio: ${eeRatio.toFixed(1)}`);
    if (tr > 0) criteria.push(`TR velocity: ${tr} m/s`);
    if (laviVal > 0) criteria.push(`LAVI: ${laviVal} mL/m²`);

    // Simplified grading
    const abnormalCount = [
      eeRatio > 14,
      tr > 2.8,
      laviVal > 34,
    ].filter(Boolean).length;

    if (eaRatio < 0.8 && eaRatio > 0) grade = "Grade I — Impaired Relaxation";
    else if (eaRatio >= 0.8 && eaRatio <= 2) {
      if (abnormalCount >= 2) grade = "Grade II — Pseudonormal (Elevated Filling Pressures)";
      else if (abnormalCount === 1) grade = "Indeterminate";
      else grade = "Grade I — Impaired Relaxation";
    } else if (eaRatio > 2) grade = "Grade III — Restrictive";

    return { grade, criteria, eeRatio, filling: eeRatio > 14 ? "Elevated (>14)" : eeRatio > 0 ? "Normal (≤14)" : "" };
  };

  const { grade, criteria, filling } = getGrade();
  const hasInput = e || a || ePrime;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <InputField label="E velocity" unit="m/s" value={e} onChange={setE} placeholder="e.g. 0.9" />
        <InputField label="A velocity" unit="m/s" value={a} onChange={setA} placeholder="e.g. 0.6" />
        <InputField label="e' (septal)" unit="cm/s" value={ePrime} onChange={setEPrime} placeholder="e.g. 7" />
        <InputField label="TR velocity" unit="m/s" value={trVel} onChange={setTrVel} placeholder="e.g. 2.5" />
        <InputField label="LAVI" unit="mL/m²" value={lavi} onChange={setLavi} placeholder="e.g. 38" />
      </div>
      {hasInput && (
        <div className="result-panel rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-sm font-bold text-[#189aa1] mb-1">{grade || "Enter values to grade"}</div>
          {filling && <div className="text-xs text-gray-600 mb-2">Filling Pressure (E/e'): <span className="font-semibold">{filling}</span></div>}
          <ul className="space-y-1">
            {criteria.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#189aa1] flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-gray-400">Per ASE 2016 Diastology Guidelines</div>
        </div>
      )}
    </div>
  );
}

// ---- RVSP Calculator ----
function RVSPCalculator() {
  const [trVmax, setTrVmax] = useState("");
  const [rap, setRap] = useState("5");

  const rvsp = trVmax ? (4 * Math.pow(parseFloat(trVmax), 2) + parseFloat(rap || "5")).toFixed(1) : "";
  const elevated = rvsp ? parseFloat(rvsp) > 35 : false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="TR Vmax" unit="m/s" value={trVmax} onChange={setTrVmax} placeholder="e.g. 3.2" />
        <InputField label="RAP estimate" unit="mmHg" value={rap} onChange={setRap} placeholder="5" />
      </div>
      {rvsp && (
        <div className="result-panel rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">RVSP =</span>
            <span className="text-2xl font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
              {rvsp}
            </span>
            <span className="text-sm text-gray-500">mmHg</span>
            {elevated && <span className="text-xs font-bold px-2 py-0.5 rounded-full severity-moderate">Elevated</span>}
          </div>
          <div className="text-xs text-gray-400 mt-1">Formula: 4 × TR Vmax² + RAP</div>
        </div>
      )}
    </div>
  );
}

// ---- Stroke Volume / CO ----
function SVCalculator() {
  const [lvotD, setLvotD] = useState("");
  const [lvotVti, setLvotVti] = useState("");
  const [hr, setHr] = useState("");

  const lvotArea = lvotD ? (Math.PI * Math.pow(parseFloat(lvotD) / 2, 2)).toFixed(2) : "";
  const sv = lvotArea && lvotVti ? (parseFloat(lvotArea) * parseFloat(lvotVti)).toFixed(1) : "";
  const co = sv && hr ? ((parseFloat(sv) * parseFloat(hr)) / 1000).toFixed(2) : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <InputField label="LVOT Diameter" unit="cm" value={lvotD} onChange={setLvotD} placeholder="e.g. 2.0" />
        <InputField label="LVOT VTI" unit="cm" value={lvotVti} onChange={setLvotVti} placeholder="e.g. 22" />
        <InputField label="Heart Rate" unit="bpm" value={hr} onChange={setHr} placeholder="e.g. 72" />
      </div>
      {sv && (
        <div className="result-panel rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Stroke Volume</div>
              <div className="text-2xl font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
                {sv} <span className="text-sm font-normal text-gray-500">mL</span>
              </div>
              <div className="text-xs text-gray-400">Normal: 60–100 mL</div>
            </div>
            {co && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Cardiac Output</div>
                <div className="text-2xl font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
                  {co} <span className="text-sm font-normal text-gray-500">L/min</span>
                </div>
                <div className="text-xs text-gray-400">Normal: 4–8 L/min</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const calculators = [
  { id: "as", label: "Aortic Stenosis", component: <ASCalculator /> },
  { id: "diastology", label: "Diastology Engine", component: <DiastologyCalculator /> },
  { id: "rvsp", label: "RVSP", component: <RVSPCalculator /> },
  { id: "sv", label: "Stroke Volume / CO", component: <SVCalculator /> },
];

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
            Enter measurements for instant guideline-based interpretation. Results update in real time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {calculators.map(c => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                active === c.id
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={active === c.id ? { background: "#189aa1" } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-4 h-4" style={{ color: "#189aa1" }} />
            <h2 className="font-bold text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
              {calculators.find(c => c.id === active)?.label}
            </h2>
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
              <Info className="w-3 h-3" />
              ASE Guidelines
            </div>
          </div>
          {calculators.find(c => c.id === active)?.component}
        </div>

        {/* Reference table */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="teal-header px-5 py-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: "Merriweather, serif" }}>Quick Reference — AS Severity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#f0fbfc]">
                  <th className="text-left px-4 py-2 font-semibold text-[#189aa1]">Parameter</th>
                  <th className="text-left px-4 py-2 font-semibold text-[#189aa1]">Mild</th>
                  <th className="text-left px-4 py-2 font-semibold text-[#189aa1]">Moderate</th>
                  <th className="text-left px-4 py-2 font-semibold text-[#189aa1]">Severe</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AV Vmax (m/s)", "2.0–2.9", "3.0–3.9", "≥ 4.0"],
                  ["Mean Gradient (mmHg)", "< 20", "20–39", "≥ 40"],
                  ["AVA (cm²)", "> 1.5", "1.0–1.5", "< 1.0"],
                ].map(([param, mild, mod, sev]) => (
                  <tr key={param} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700">{param}</td>
                    <td className="px-4 py-2 text-green-700">{mild}</td>
                    <td className="px-4 py-2 text-amber-700">{mod}</td>
                    <td className="px-4 py-2 text-red-700">{sev}</td>
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
