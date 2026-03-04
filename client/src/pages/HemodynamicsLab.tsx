/*
  iHeartEcho — Hemodynamics Lab
  Interactive PV loop and echo findings simulator
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Slider = { preload: number; afterload: number; contractility: number };

function SliderControl({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
          {value < 33 ? "Low" : value < 67 ? "Normal" : "High"}
        </span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>Low</span><span>Normal</span><span>High</span>
      </div>
    </div>
  );
}

function generatePVLoop(preload: number, afterload: number, contractility: number) {
  // Simplified PV loop generation
  const edv = 80 + preload * 0.8;
  const esp = 60 + afterload * 0.8;
  const sv = (edv - 40) * (contractility / 100) * 0.7;
  const esv = edv - sv;
  const edp = 5 + preload * 0.15;
  const esp2 = esp;

  return [
    { volume: esv, pressure: 5 },
    { volume: esv + sv * 0.1, pressure: edp * 0.3 },
    { volume: edv, pressure: edp },
    { volume: edv - sv * 0.05, pressure: esp2 * 0.5 },
    { volume: esv + sv * 0.2, pressure: esp2 },
    { volume: esv, pressure: esp2 * 0.8 },
    { volume: esv, pressure: 5 },
  ];
}

function getEchoFindings(s: Slider) {
  const findings: { label: string; value: string; trend: "up" | "down" | "normal" }[] = [];

  // EF
  const ef = Math.max(20, Math.min(75, 55 + (s.contractility - 50) * 0.4 - (s.afterload - 50) * 0.1));
  findings.push({ label: "EF", value: `${Math.round(ef)}%`, trend: ef >= 55 ? "normal" : ef >= 40 ? "down" : "down" });

  // Stroke volume
  const sv = Math.max(30, Math.min(120, 70 + (s.preload - 50) * 0.5 + (s.contractility - 50) * 0.3 - (s.afterload - 50) * 0.2));
  findings.push({ label: "Stroke Volume", value: `${Math.round(sv)} mL`, trend: sv >= 60 ? "normal" : "down" });

  // E/e'
  const ee = Math.max(5, Math.min(25, 8 + (s.preload - 50) * 0.2 + (s.afterload - 50) * 0.1));
  findings.push({ label: "E/e' ratio", value: ee.toFixed(1), trend: ee > 14 ? "up" : "normal" });

  // LV wall thickness
  const wt = s.afterload > 60 ? "Increased (LVH)" : "Normal";
  findings.push({ label: "LV Wall Thickness", value: wt, trend: s.afterload > 60 ? "up" : "normal" });

  // RVSP
  const rvsp = Math.max(20, Math.min(70, 25 + (s.preload - 50) * 0.3));
  findings.push({ label: "RVSP", value: `${Math.round(rvsp)} mmHg`, trend: rvsp > 35 ? "up" : "normal" });

  return findings;
}

function getClinicalContext(s: Slider): { title: string; description: string; color: string } {
  if (s.afterload > 70 && s.contractility < 40) {
    return { title: "Decompensated Heart Failure", description: "High afterload with poor contractility. Expect low EF, elevated filling pressures, LVH.", color: "#dc2626" };
  }
  if (s.preload > 70 && s.contractility > 60) {
    return { title: "Volume Overload (High Output)", description: "Elevated preload with preserved function. Seen in AR, MR, high-output states.", color: "#d97706" };
  }
  if (s.afterload > 70 && s.contractility > 60) {
    return { title: "Pressure Overload (Compensated)", description: "High afterload with preserved EF. LVH present. Seen in AS, HTN.", color: "#d97706" };
  }
  if (s.contractility < 30) {
    return { title: "Cardiomyopathy Pattern", description: "Severely reduced contractility. Dilated, poorly contracting LV.", color: "#dc2626" };
  }
  return { title: "Normal Hemodynamics", description: "Balanced preload, afterload, and contractility. Normal cardiac output.", color: "#16a34a" };
}

export default function HemodynamicsLab() {
  const [sliders, setSliders] = useState<Slider>({ preload: 50, afterload: 50, contractility: 50 });
  const pvData = generatePVLoop(sliders.preload, sliders.afterload, sliders.contractility);
  const findings = getEchoFindings(sliders);
  const context = getClinicalContext(sliders);

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Hemodynamics Lab
          </h1>
          <p className="text-sm text-gray-500">
            Adjust preload, afterload, and contractility to see real-time PV loop changes and expected echo findings.
            Perfect for ACS exam preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
            <h3 className="font-bold text-gray-700 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
              <Activity className="w-4 h-4" style={{ color: "#189aa1" }} />
              Hemodynamic Controls
            </h3>
            <SliderControl label="Preload (LVEDP / Volume)" value={sliders.preload}
              onChange={v => setSliders(p => ({ ...p, preload: v }))} color="#0891b2" />
            <SliderControl label="Afterload (SVR / Pressure)" value={sliders.afterload}
              onChange={v => setSliders(p => ({ ...p, afterload: v }))} color="#dc2626" />
            <SliderControl label="Contractility (inotropy)" value={sliders.contractility}
              onChange={v => setSliders(p => ({ ...p, contractility: v }))} color="#16a34a" />

            <button onClick={() => setSliders({ preload: 50, afterload: 50, contractility: 50 })}
              className="w-full py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1] transition-all">
              Reset to Normal
            </button>

            {/* Clinical context */}
            <div className="p-3 rounded-lg border" style={{ borderColor: context.color + "40", background: context.color + "08" }}>
              <div className="font-bold text-sm mb-1" style={{ color: context.color, fontFamily: "Merriweather, serif" }}>{context.title}</div>
              <p className="text-xs text-gray-600">{context.description}</p>
            </div>
          </div>

          {/* PV Loop */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2" style={{ fontFamily: "Merriweather, serif" }}>
              PV Loop
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={pvData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="volume" label={{ value: "Volume (mL)", position: "insideBottom", offset: -2, fontSize: 10 }}
                  tick={{ fontSize: 10 }} />
                <YAxis label={{ value: "Pressure (mmHg)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(1)} />
                <Line type="monotone" dataKey="pressure" stroke="#189aa1" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#f0fbfc] border border-[#189aa1]/10">
                <span className="text-gray-500">EDV: </span>
                <span className="font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
                  {Math.round(80 + sliders.preload * 0.8)} mL
                </span>
              </div>
              <div className="p-2 rounded bg-[#f0fbfc] border border-[#189aa1]/10">
                <span className="text-gray-500">SV: </span>
                <span className="font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
                  {Math.round(Math.max(30, Math.min(120, 70 + (sliders.preload - 50) * 0.5 + (sliders.contractility - 50) * 0.3 - (sliders.afterload - 50) * 0.2)))} mL
                </span>
              </div>
            </div>
          </div>

          {/* Echo Findings */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="teal-header px-5 py-3">
              <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Expected Echo Findings</h3>
            </div>
            <div className="p-4 space-y-3">
              {findings.map(f => (
                <div key={f.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-600">{f.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold data-value" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>
                      {f.value}
                    </span>
                    {f.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                    {f.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-amber-500" />}
                    {f.trend === "normal" && <Minus className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="teal-header px-5 py-3">
            <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Clinical Presets</h3>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Normal", values: { preload: 50, afterload: 50, contractility: 50 }, color: "#16a34a" },
              { label: "↑ Afterload (HTN/AS)", values: { preload: 50, afterload: 80, contractility: 55 }, color: "#d97706" },
              { label: "↓ Contractility (DCM)", values: { preload: 65, afterload: 55, contractility: 20 }, color: "#dc2626" },
              { label: "Volume Overload (AR)", values: { preload: 80, afterload: 45, contractility: 60 }, color: "#0891b2" },
            ].map(preset => (
              <button key={preset.label} onClick={() => setSliders(preset.values)}
                className="p-3 rounded-lg border text-left transition-all hover:shadow-sm"
                style={{ borderColor: preset.color + "40", background: preset.color + "08" }}>
                <div className="text-xs font-bold mb-0.5" style={{ color: preset.color }}>{preset.label}</div>
                <div className="text-xs text-gray-500">Click to apply</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
