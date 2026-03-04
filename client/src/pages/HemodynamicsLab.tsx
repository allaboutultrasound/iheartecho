/*
  iHeartEcho -- Hemodynamics Lab
  Interactive Wiggers Diagram + PV Loop synchronized to hemodynamic sliders
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body, JetBrains Mono data
*/
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Activity, TrendingUp, TrendingDown, Minus, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  Area, Legend
} from "recharts";

// ---- TYPES ----

interface Params {
  preload: number;      // 0-100 (maps to LVEDP ~5-25 mmHg, EDV ~80-200 mL)
  afterload: number;    // 0-100 (maps to SBP ~80-200 mmHg, SVR)
  contractility: number; // 0-100 (Emax, inotropy)
  heartRate: number;    // 40-140 bpm
}

// ---- PHYSIOLOGY ENGINE ----

function computeHemodynamics(p: Params) {
  const { preload, afterload, contractility, heartRate } = p;

  // Map sliders to physiological values
  const edv   = 80  + preload       * 1.2;          // 80–200 mL
  const edp   = 4   + preload       * 0.21;          // 4–25 mmHg
  const sbp   = 80  + afterload     * 1.2;           // 80–200 mmHg
  const dbp   = 50  + afterload     * 0.5;           // 50–100 mmHg
  const emax  = 0.5 + contractility * 0.025;         // 0.5–3.0 mmHg/mL (Emax)
  const esv   = Math.max(20, edv - (edv - 20) * (contractility / 100) * 0.75);
  const sv    = Math.max(15, edv - esv);
  const co    = (sv * heartRate) / 1000;             // L/min
  const ci    = co / 1.9;                            // assume BSA 1.9
  const ef    = Math.round((sv / edv) * 100);
  const esp   = sbp * 0.9;                           // ESP ~ 90% SBP
  const esP   = Math.max(40, esp);

  // Diastolic function surrogates
  const ee    = Math.max(5, Math.min(30, 8 + (preload - 50) * 0.22 + (afterload - 50) * 0.08));
  const lavi  = Math.max(20, Math.min(60, 28 + (preload - 50) * 0.32));
  const rvsp  = Math.max(20, Math.min(75, 25 + (preload - 50) * 0.35));
  const tapse = Math.max(10, Math.min(28, 22 - (preload - 50) * 0.1));

  return { edv, edp, sbp, dbp, esv, sv, co, ci, ef, esp: esP, emax, ee, lavi, rvsp, tapse, heartRate };
}

// ---- WIGGERS DIAGRAM GENERATOR ----
// Returns N time-points across one cardiac cycle with:
//   lvp  = LV pressure
//   aop  = Aortic pressure
//   lvv  = LV volume
//   ecg  = simplified ECG trace
// Valve events: MVO, MVC, AVO, AVC as time indices

function generateWiggers(p: Params, N = 200) {
  const h = computeHemodynamics(p);
  const { edv, edp, sbp, dbp, esv, sv, esp, heartRate } = h;

  // Cycle timing (fraction of RR interval)
  const rr = 60 / heartRate;            // seconds
  const isocVol  = 0.05;               // isovolumic contraction
  const ejection = 0.30;               // ejection
  const isocRel  = 0.05;               // isovolumic relaxation
  const filling   = 1 - isocVol - ejection - isocRel;  // diastolic filling

  // Phase boundaries (0–1)
  const t_mvc = 0.0;
  const t_avo = t_mvc + isocVol;
  const t_avc = t_avo + ejection;
  const t_mvo = t_avc + isocRel;
  const t_end = 1.0;

  const data: {
    t: number; time: number;
    lvp: number; aop: number; lvv: number; ecg: number;
  }[] = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);             // 0..1
    const time = parseFloat((t * rr * 1000).toFixed(1)); // ms

    let lvp = 0, aop = 0, lvv = 0, ecg = 0;

    // ---- LV PRESSURE ----
    if (t < t_mvc) {
      // Late diastole / atrial kick
      const frac = t / t_mvc;
      lvp = edp * (0.7 + 0.3 * Math.sin(frac * Math.PI));
    } else if (t < t_avo) {
      // Isovolumic contraction
      const frac = (t - t_mvc) / isocVol;
      lvp = edp + (esp - edp) * (frac * frac);
    } else if (t < t_avc) {
      // Ejection
      const frac = (t - t_avo) / ejection;
      // Pressure rises to peak then falls
      const peak = esp * 1.05;
      lvp = esp + (peak - esp) * Math.sin(frac * Math.PI) - (esp - (esp * 0.85)) * frac;
      lvp = Math.max(edp, lvp);
    } else if (t < t_mvo) {
      // Isovolumic relaxation
      const frac = (t - t_avc) / isocRel;
      lvp = (esp * 0.85) * Math.exp(-frac * 4);
      lvp = Math.max(edp * 0.5, lvp);
    } else {
      // Diastolic filling
      const frac = (t - t_mvo) / (t_end - t_mvo);
      // Rapid filling then slow filling then atrial kick
      const rapid = 0.4;
      if (frac < rapid) {
        lvp = edp * 0.5 + (edp * 0.5) * (frac / rapid);
      } else if (frac < 0.85) {
        lvp = edp * (0.9 + 0.1 * ((frac - rapid) / 0.45));
      } else {
        // Atrial kick
        const af = (frac - 0.85) / 0.15;
        lvp = edp + edp * 0.25 * Math.sin(af * Math.PI);
      }
    }

    // ---- AORTIC PRESSURE ----
    if (t < t_avo) {
      // Diastolic run-off (Windkessel)
      const elapsed = t;
      aop = dbp + (sbp - dbp) * Math.exp(-elapsed * 3.5);
    } else if (t < t_avc) {
      // Systolic: rises with LV ejection
      const frac = (t - t_avo) / ejection;
      const peak = sbp;
      aop = dbp + (peak - dbp) * Math.sin(frac * Math.PI * 0.9 + 0.1);
      // Dicrotic notch at AVC
    } else {
      // Diastolic run-off after AVC
      const elapsed = (t - t_avc);
      const notchDip = sbp * 0.88;
      const notchWidth = 0.015;
      const inNotch = elapsed < notchWidth;
      if (inNotch) {
        aop = notchDip - (notchDip - sbp * 0.82) * (elapsed / notchWidth);
      } else {
        aop = dbp + (sbp * 0.87 - dbp) * Math.exp(-(elapsed - notchWidth) * 4.5);
      }
    }

    // ---- LV VOLUME ----
    if (t < t_mvc) {
      // Atrial kick adds volume
      const frac = t / t_mvc;
      lvv = edv - sv * 0.05 + sv * 0.05 * Math.sin(frac * Math.PI);
    } else if (t < t_avo) {
      // Isovolumic contraction — volume constant
      lvv = edv;
    } else if (t < t_avc) {
      // Ejection — volume falls
      const frac = (t - t_avo) / ejection;
      lvv = edv - sv * (0.5 - 0.5 * Math.cos(frac * Math.PI));
    } else if (t < t_mvo) {
      // Isovolumic relaxation — volume constant
      lvv = esv;
    } else {
      // Diastolic filling
      const frac = (t - t_mvo) / (t_end - t_mvo);
      const rapid = 0.4;
      if (frac < rapid) {
        lvv = esv + sv * 0.75 * (0.5 - 0.5 * Math.cos((frac / rapid) * Math.PI));
      } else {
        lvv = esv + sv * 0.75 + sv * 0.25 * (frac - rapid) / (1 - rapid);
      }
    }

    // ---- ECG ----
    // P wave, QRS, T wave
    const p_center = 0.88;
    const qrs_center = 0.02;
    const t_center = 0.18;
    const p_w = 0.04, qrs_w = 0.015, t_w = 0.06;
    const P = 0.15 * Math.exp(-0.5 * Math.pow((t - p_center) / p_w, 2));
    const Q = -0.1 * Math.exp(-0.5 * Math.pow((t - (qrs_center - 0.01)) / (qrs_w * 0.5), 2));
    const R = 1.0  * Math.exp(-0.5 * Math.pow((t - qrs_center) / (qrs_w * 0.4), 2));
    const S = -0.2 * Math.exp(-0.5 * Math.pow((t - (qrs_center + 0.012)) / (qrs_w * 0.5), 2));
    const T = 0.35 * Math.exp(-0.5 * Math.pow((t - t_center) / t_w, 2));
    ecg = P + Q + R + S + T;

    data.push({
      t: parseFloat(t.toFixed(4)),
      time,
      lvp: parseFloat(lvp.toFixed(1)),
      aop: parseFloat(aop.toFixed(1)),
      lvv: parseFloat(lvv.toFixed(1)),
      ecg: parseFloat(ecg.toFixed(3)),
    });
  }

  // Valve event times (ms)
  const rr_ms = rr * 1000;
  const events = {
    mvc: parseFloat((t_mvc * rr_ms).toFixed(0)),
    avo: parseFloat((t_avo * rr_ms).toFixed(0)),
    avc: parseFloat((t_avc * rr_ms).toFixed(0)),
    mvo: parseFloat((t_mvo * rr_ms).toFixed(0)),
  };

  return { data, events, hemo: h };
}

// ---- PV LOOP GENERATOR ----

function generatePVLoop(p: Params, N = 120) {
  const { data } = generateWiggers(p, N);
  return data.map(d => ({ volume: parseFloat(d.lvv.toFixed(1)), pressure: parseFloat(d.lvp.toFixed(1)) }));
}

// ---- SLIDER CONTROL ----

function SliderControl({ label, value, min, max, step = 1, onChange, color, unit }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; color: string; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const level = pct < 33 ? "Low" : pct < 67 ? "Normal" : "High";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color }}>
            {value}{unit}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white text-[10px]"
            style={{ background: color }}>
            {unit === " bpm" ? (value < 60 ? "Brady" : value > 100 ? "Tachy" : "Normal") : level}
          </span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---- CUSTOM TOOLTIP ----

function WiggersTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs"
      style={{ fontFamily: "JetBrains Mono, monospace" }}>
      <div className="text-gray-400 mb-1">{d.time} ms</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.dataKey === "lvp" || p.dataKey === "aop" ? " mmHg" : p.dataKey === "lvv" ? " mL" : ""}
        </div>
      ))}
    </div>
  );
}

// ---- MAIN COMPONENT ----

const PRESETS = [
  { label: "Normal",                values: { preload: 50, afterload: 50, contractility: 50, heartRate: 70 }, color: "#16a34a" },
  { label: "HTN / Pressure Overload", values: { preload: 50, afterload: 80, contractility: 60, heartRate: 72 }, color: "#d97706" },
  { label: "Dilated CMP (DCM)",     values: { preload: 70, afterload: 55, contractility: 20, heartRate: 95 }, color: "#dc2626" },
  { label: "Volume Overload (AR/MR)", values: { preload: 82, afterload: 40, contractility: 65, heartRate: 78 }, color: "#0891b2" },
  { label: "Hypovolemic Shock",     values: { preload: 15, afterload: 75, contractility: 55, heartRate: 118 }, color: "#7c3aed" },
  { label: "Tamponade",             values: { preload: 25, afterload: 60, contractility: 45, heartRate: 110 }, color: "#be185d" },
  { label: "HCM (Obstructive)",     values: { preload: 40, afterload: 80, contractility: 90, heartRate: 80 }, color: "#b45309" },
  { label: "Septic Shock",          values: { preload: 30, afterload: 20, contractility: 55, heartRate: 120 }, color: "#64748b" },
];

function getClinicalContext(p: Params): { title: string; description: string; color: string } {
  const { preload, afterload, contractility, heartRate } = p;
  if (contractility < 25 && preload > 60) return { title: "Decompensated Heart Failure", description: "Severely reduced contractility with elevated filling pressures. Dilated, poorly contracting LV. Expect low EF, elevated E/e', pulmonary congestion.", color: "#dc2626" };
  if (afterload > 75 && contractility > 55) return { title: "Pressure Overload — Compensated", description: "High SVR/afterload with preserved EF. LVH present. Seen in hypertension, aortic stenosis.", color: "#d97706" };
  if (preload > 75 && contractility > 55) return { title: "Volume Overload — High Output", description: "Elevated EDV with preserved contractility. Seen in AR, MR, ASD, high-output states.", color: "#0891b2" };
  if (contractility < 30) return { title: "Cardiomyopathy Pattern", description: "Severely reduced contractility. Dilated LV, low EF, elevated filling pressures.", color: "#dc2626" };
  if (preload < 25 && heartRate > 100) return { title: "Hypovolemia / Shock", description: "Low preload with compensatory tachycardia. Reduced SV and CO. Underfilled LV.", color: "#7c3aed" };
  if (afterload < 25 && heartRate > 100) return { title: "Vasodilatory / Distributive Shock", description: "Low SVR with compensatory tachycardia. High CO but poor perfusion pressure.", color: "#64748b" };
  return { title: "Normal Hemodynamics", description: "Balanced preload, afterload, and contractility. Normal cardiac output and filling pressures.", color: "#16a34a" };
}

export default function HemodynamicsLab() {
  const [params, setParams] = useState<Params>({ preload: 50, afterload: 50, contractility: 50, heartRate: 70 });
  const set = (key: keyof Params) => (v: number) => setParams(p => ({ ...p, [key]: v }));

  const { data: wiggersData, events, hemo } = useMemo(() => generateWiggers(params), [params]);
  const pvData = useMemo(() => generatePVLoop(params), [params]);
  const context = getClinicalContext(params);

  const rr_ms = Math.round((60 / params.heartRate) * 1000);

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Hemodynamics Lab
          </h1>
          <p className="text-sm text-gray-500">
            Adjust preload, afterload, contractility, and heart rate. The Wiggers diagram and PV loop update in real time with synchronized valve events.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

          {/* ---- CONTROLS ---- */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                <Activity className="w-4 h-4" style={{ color: "#189aa1" }} />
                Hemodynamic Controls
              </h3>
              <SliderControl label="Preload (LVEDP / EDV)" value={params.preload} min={0} max={100}
                onChange={set("preload")} color="#0891b2" />
              <SliderControl label="Afterload (SVR / SBP)" value={params.afterload} min={0} max={100}
                onChange={set("afterload")} color="#dc2626" />
              <SliderControl label="Contractility (Emax)" value={params.contractility} min={0} max={100}
                onChange={set("contractility")} color="#16a34a" />
              <SliderControl label="Heart Rate" value={params.heartRate} min={40} max={140}
                onChange={set("heartRate")} color="#9333ea" unit=" bpm" />

              <button onClick={() => setParams({ preload: 50, afterload: 50, contractility: 50, heartRate: 70 })}
                className="w-full py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-[#189aa1] hover:text-[#189aa1] transition-all flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3 h-3" /> Reset to Normal
              </button>

              <div className="p-3 rounded-lg border" style={{ borderColor: context.color + "40", background: context.color + "08" }}>
                <div className="font-bold text-xs mb-1" style={{ color: context.color, fontFamily: "Merriweather, serif" }}>
                  {context.title}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{context.description}</p>
              </div>
            </div>

            {/* Derived Hemodynamics */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-4 py-2.5">
                <h3 className="font-bold text-xs text-white" style={{ fontFamily: "Merriweather, serif" }}>Derived Values</h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  { label: "EDV", value: `${Math.round(hemo.edv)} mL`, normal: "80–150" },
                  { label: "ESV", value: `${Math.round(hemo.esv)} mL`, normal: "20–60" },
                  { label: "SV", value: `${Math.round(hemo.sv)} mL`, normal: "60–100" },
                  { label: "EF", value: `${hemo.ef}%`, normal: "≥55%" },
                  { label: "CO", value: `${hemo.co.toFixed(1)} L/min`, normal: "4–8" },
                  { label: "CI", value: `${hemo.ci.toFixed(1)} L/min/m²`, normal: ">2.2" },
                  { label: "SBP", value: `${Math.round(hemo.sbp)} mmHg`, normal: "100–140" },
                  { label: "DBP", value: `${Math.round(hemo.dbp)} mmHg`, normal: "60–90" },
                  { label: "E/e'", value: hemo.ee.toFixed(1), normal: "<14" },
                  { label: "LAVI", value: `${Math.round(hemo.lavi)} mL/m²`, normal: "<34" },
                  { label: "RVSP", value: `${Math.round(hemo.rvsp)} mmHg`, normal: "<35" },
                  { label: "TAPSE", value: `${Math.round(hemo.tapse)} mm`, normal: "≥17" },
                ].map(item => {
                  const isAbnormal =
                    (item.label === "EF" && hemo.ef < 55) ||
                    (item.label === "E/e'" && hemo.ee > 14) ||
                    (item.label === "LAVI" && hemo.lavi > 34) ||
                    (item.label === "RVSP" && hemo.rvsp > 35) ||
                    (item.label === "TAPSE" && hemo.tapse < 17) ||
                    (item.label === "CO" && (hemo.co < 4 || hemo.co > 8)) ||
                    (item.label === "CI" && hemo.ci < 2.2);
                  return (
                    <div key={item.label} className={`p-2 rounded-lg border text-xs ${isAbnormal ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                      <div className="text-gray-400 text-[10px]">{item.label}</div>
                      <div className="font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: isAbnormal ? "#dc2626" : "#189aa1" }}>
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---- WIGGERS + PV LOOP ---- */}
          <div className="xl:col-span-3 space-y-4">

            {/* Valve event legend */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <span className="font-bold text-gray-600" style={{ fontFamily: "Merriweather, serif" }}>Valve Events:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block bg-blue-500 border-dashed border border-blue-500"></span>
                  <span className="font-semibold text-blue-600">MVC</span>
                  <span className="text-gray-400">Mitral Valve Closes ({events.mvc} ms)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block bg-red-500"></span>
                  <span className="font-semibold text-red-600">AVO</span>
                  <span className="text-gray-400">Aortic Valve Opens ({events.avo} ms)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block bg-orange-500"></span>
                  <span className="font-semibold text-orange-600">AVC</span>
                  <span className="text-gray-400">Aortic Valve Closes ({events.avc} ms)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block bg-green-500 border-dashed border border-green-500"></span>
                  <span className="font-semibold text-green-600">MVO</span>
                  <span className="text-gray-400">Mitral Valve Opens ({events.mvo} ms)</span>
                </span>
                <span className="ml-auto text-gray-400">RR: {rr_ms} ms ({params.heartRate} bpm)</span>
              </div>
            </div>

            {/* ECG */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm" style={{ fontFamily: "Merriweather, serif" }}>ECG</h3>
                <span className="text-xs text-gray-400">Lead II (simulated)</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <ComposedChart data={wiggersData} margin={{ top: 4, right: 10, bottom: 0, left: 30 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[-0.3, 1.2]} hide />
                  <ReferenceLine x={events.mvc} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine x={events.avo} stroke="#ef4444" strokeWidth={1.5} />
                  <ReferenceLine x={events.avc} stroke="#f97316" strokeWidth={1.5} />
                  <ReferenceLine x={events.mvo} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="ecg" stroke="#1e293b" strokeWidth={1.5} dot={false} name="ECG" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* LV Pressure + Aortic Pressure */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm" style={{ fontFamily: "Merriweather, serif" }}>Pressure (mmHg)</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-[#189aa1]"></span> LV Pressure</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-[#dc2626]"></span> Aortic Pressure</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={wiggersData} margin={{ top: 4, right: 10, bottom: 4, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} label={{ value: "Time (ms)", position: "insideBottom", offset: -2, fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} label={{ value: "mmHg", angle: -90, position: "insideLeft", fontSize: 9, offset: 10 }} />
                  <Tooltip content={<WiggersTooltip />} />
                  <ReferenceLine x={events.mvc} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "MVC", position: "top", fontSize: 8, fill: "#3b82f6" }} />
                  <ReferenceLine x={events.avo} stroke="#ef4444" strokeWidth={1.5} label={{ value: "AVO", position: "top", fontSize: 8, fill: "#ef4444" }} />
                  <ReferenceLine x={events.avc} stroke="#f97316" strokeWidth={1.5} label={{ value: "AVC", position: "top", fontSize: 8, fill: "#f97316" }} />
                  <ReferenceLine x={events.mvo} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "MVO", position: "top", fontSize: 8, fill: "#22c55e" }} />
                  <Area type="monotone" dataKey="aop" stroke="#dc2626" fill="#fecaca" fillOpacity={0.3} strokeWidth={2} dot={false} name="Aortic Pressure" />
                  <Line type="monotone" dataKey="lvp" stroke="#189aa1" strokeWidth={2.5} dot={false} name="LV Pressure" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* LV Volume */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm" style={{ fontFamily: "Merriweather, serif" }}>LV Volume (mL)</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>EDV: <b style={{ color: "#189aa1" }}>{Math.round(hemo.edv)} mL</b></span>
                  <span>ESV: <b style={{ color: "#189aa1" }}>{Math.round(hemo.esv)} mL</b></span>
                  <span>SV: <b style={{ color: "#189aa1" }}>{Math.round(hemo.sv)} mL</b></span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={wiggersData} margin={{ top: 4, right: 10, bottom: 4, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} label={{ value: "Time (ms)", position: "insideBottom", offset: -2, fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} label={{ value: "mL", angle: -90, position: "insideLeft", fontSize: 9, offset: 10 }} />
                  <Tooltip content={<WiggersTooltip />} />
                  <ReferenceLine x={events.mvc} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine x={events.avo} stroke="#ef4444" strokeWidth={1.5} />
                  <ReferenceLine x={events.avc} stroke="#f97316" strokeWidth={1.5} />
                  <ReferenceLine x={events.mvo} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="lvv" stroke="#4ad9e0" fill="#e0f9fa" fillOpacity={0.5} strokeWidth={2.5} dot={false} name="LV Volume" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* PV Loop */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm" style={{ fontFamily: "Merriweather, serif" }}>Pressure-Volume Loop</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>EF: <b style={{ color: hemo.ef < 40 ? "#dc2626" : hemo.ef < 55 ? "#d97706" : "#16a34a" }}>{hemo.ef}%</b></span>
                  <span>Emax: <b style={{ color: "#189aa1" }}>{hemo.emax.toFixed(2)} mmHg/mL</b></span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={pvData} margin={{ top: 4, right: 10, bottom: 16, left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="volume" type="number" domain={["auto", "auto"]} tick={{ fontSize: 9 }}
                    label={{ value: "Volume (mL)", position: "insideBottom", offset: -6, fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }}
                    label={{ value: "Pressure (mmHg)", angle: -90, position: "insideLeft", fontSize: 9, offset: 10 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}`, ""]} />
                  <Area type="monotone" dataKey="pressure" stroke="#189aa1" fill="#e0f9fa" fillOpacity={0.4} strokeWidth={2.5} dot={false} name="PV Loop" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* Clinical Presets */}
        <div className="mt-5 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="teal-header px-5 py-3">
            <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Clinical Presets</h3>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESETS.map(preset => (
              <button key={preset.label} onClick={() => setParams(preset.values)}
                className="p-3 rounded-lg border text-left transition-all hover:shadow-sm active:scale-95"
                style={{ borderColor: preset.color + "40", background: preset.color + "08" }}>
                <div className="text-xs font-bold mb-0.5" style={{ color: preset.color, fontFamily: "Merriweather, serif" }}>
                  {preset.label}
                </div>
                <div className="text-[10px] text-gray-400">
                  PL:{preset.values.preload} AL:{preset.values.afterload} CTR:{preset.values.contractility} HR:{preset.values.heartRate}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
