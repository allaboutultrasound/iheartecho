/*
  iHeartEcho — Fetal Echo Navigator
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Baby, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

const findings3VV = [
  {
    finding: "4 vessels in 3VV",
    differentials: ["Persistent left SVC", "Double SVC", "Vertical vein (TAPVR)", "Anomalous pulmonary vein"],
    urgency: "high",
  },
  {
    finding: "Absent ductus arteriosus",
    differentials: ["Pulmonary atresia with VSD", "Tetralogy of Fallot (severe)", "Absent pulmonary valve"],
    urgency: "high",
  },
  {
    finding: "Right-sided aortic arch",
    differentials: ["Tetralogy of Fallot", "Truncus arteriosus", "Isolated right arch (normal variant)"],
    urgency: "moderate",
  },
  {
    finding: "Dilated main pulmonary artery",
    differentials: ["Pulmonary stenosis", "Absent pulmonary valve", "Pulmonary hypertension"],
    urgency: "moderate",
  },
  {
    finding: "Absent pulmonary valve",
    differentials: ["Absent pulmonary valve syndrome", "TOF with absent PV"],
    urgency: "high",
  },
];

const findingsFC = [
  {
    finding: "Hypoplastic left heart",
    differentials: ["HLHS", "Critical AS with hypoplastic LV", "Mitral atresia"],
    urgency: "high",
  },
  {
    finding: "Ventricular disproportion (R > L)",
    differentials: ["HLHS spectrum", "Coarctation of aorta", "Critical AS"],
    urgency: "high",
  },
  {
    finding: "Ventricular disproportion (L > R)",
    differentials: ["Pulmonary atresia", "Critical PS", "Ebstein anomaly"],
    urgency: "moderate",
  },
  {
    finding: "AV canal defect",
    differentials: ["Complete AVSD (Trisomy 21)", "Partial AVSD", "Transitional AVSD"],
    urgency: "moderate",
  },
  {
    finding: "Cardiac mass",
    differentials: ["Rhabdomyoma (TSC)", "Fibroma", "Teratoma", "Hemangioma"],
    urgency: "high",
  },
];

// Z-score calculator (simplified Hadlock-based)
function ZScoreCalc() {
  const [ga, setGa] = useState("");
  const [measurement, setMeasurement] = useState("mv_annulus");
  const [value, setValue] = useState("");

  const normativeData: Record<string, { mean: (ga: number) => number; sd: number }> = {
    mv_annulus: { mean: (g) => 0.18 * g - 0.5, sd: 1.2 },
    tv_annulus: { mean: (g) => 0.2 * g - 0.6, sd: 1.3 },
    aortic_root: { mean: (g) => 0.14 * g - 0.3, sd: 0.9 },
    pulm_root: { mean: (g) => 0.15 * g - 0.35, sd: 1.0 },
  };

  const gaNum = parseFloat(ga);
  const valNum = parseFloat(value);
  const norm = normativeData[measurement];
  const zScore = norm && gaNum && valNum
    ? ((valNum - norm.mean(gaNum)) / norm.sd).toFixed(2)
    : null;

  const getZInterpret = (z: number) => {
    if (z < -2) return { label: "Below Normal (< -2 SD)", color: "#dc2626" };
    if (z > 2) return { label: "Above Normal (> +2 SD)", color: "#d97706" };
    return { label: "Normal Range (±2 SD)", color: "#16a34a" };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#189aa1" }}>Z</span>
        Z-Score Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Gestational Age</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
            <input type="number" value={ga} onChange={e => setGa(e.target.value)} placeholder="e.g. 22"
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">wks</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Structure</label>
          <select value={measurement} onChange={e => setMeasurement(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]">
            <option value="mv_annulus">MV Annulus</option>
            <option value="tv_annulus">TV Annulus</option>
            <option value="aortic_root">Aortic Root</option>
            <option value="pulm_root">Pulm Root</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Measurement</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="mm"
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">mm</span>
          </div>
        </div>
      </div>
      {zScore !== null && (
        <div className="result-panel rounded-lg p-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Z-Score:</span>
            <span className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>{zScore}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: getZInterpret(parseFloat(zScore)).color }}>
              {getZInterpret(parseFloat(zScore)).label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FetalNavigator() {
  const [view, setView] = useState<"3vv" | "4ch" | "zscore">("3vv");
  const [selected, setSelected] = useState<number | null>(null);

  const findings = view === "3vv" ? findings3VV : findingsFC;

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Fetal Echo Navigator
          </h1>
          <p className="text-sm text-gray-500">
            Select a fetal cardiac finding to generate a differential diagnosis and clinical guidance.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: "3vv", label: "3-Vessel View" },
            { id: "4ch", label: "4-Chamber View" },
            { id: "zscore", label: "Z-Score Calculator" },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id as any); setSelected(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === tab.id ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={view === tab.id ? { background: "#189aa1" } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {view === "zscore" ? (
          <ZScoreCalc />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Findings list */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Finding</h3>
              {findings.map((f, i) => (
                <button key={i} onClick={() => setSelected(i === selected ? null : i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected === i
                      ? "border-[#189aa1] bg-[#f0fbfc] shadow-sm"
                      : "border-gray-100 bg-white hover:border-[#189aa1]/40 hover:bg-[#f0fbfc]/50"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      f.urgency === "high" ? "bg-red-500" : "bg-amber-400"
                    }`} />
                    <span className="text-sm font-semibold text-gray-700">{f.finding}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.urgency === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    }`}>
                      {f.urgency === "high" ? "High Priority" : "Moderate"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Differential panel */}
            <div>
              {selected !== null ? (
                <div className="bg-white rounded-xl border border-[#189aa1]/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="teal-header px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Baby className="w-4 h-4 text-white" />
                      <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
                        {findings[selected].finding}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Differential Diagnosis
                    </div>
                    <ul className="space-y-2">
                      {findings[selected].differentials.map((d, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                            style={{ background: "#189aa1" }}>{i + 1}</span>
                          <span className="text-sm text-gray-700 font-medium">{d}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Always correlate with full fetal echo, situs determination, and maternal history.
                        Refer to fetal cardiologist for high-priority findings.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-[#189aa1]/30 p-10 flex flex-col items-center justify-center text-center h-full min-h-48">
                  <HelpCircle className="w-10 h-10 mb-3" style={{ color: "#4ad9e0" }} />
                  <p className="text-sm text-gray-400">Select a finding from the list to see the differential diagnosis</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Situs helper */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="teal-header px-5 py-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: "Merriweather, serif" }}>Situs Determination Helper</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              { title: "Situs Solitus", desc: "Stomach left, liver right, apex left. Normal arrangement.", color: "#16a34a" },
              { title: "Situs Inversus", desc: "Mirror image. Stomach right, liver left, apex right.", color: "#d97706" },
              { title: "Situs Ambiguus", desc: "Heterotaxy. Bilateral right (asplenia) or bilateral left (polysplenia).", color: "#dc2626" },
            ].map(s => (
              <div key={s.title} className="p-3 rounded-lg border" style={{ borderColor: s.color + "40", background: s.color + "08" }}>
                <div className="font-bold mb-1" style={{ color: s.color, fontFamily: "Merriweather, serif" }}>{s.title}</div>
                <p className="text-xs text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
