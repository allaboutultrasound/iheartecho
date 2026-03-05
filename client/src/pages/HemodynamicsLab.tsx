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
  // Disease-specific modifiers (optional, only set by presets)
  lvaoGradient?: number;   // mmHg — LV-to-Ao systolic gradient (AS)
  pulseWidthFactor?: number; // multiplier for pulse pressure (AR: >1, MS: <1)
  lapMultiplier?: number;  // multiplier for LAP amplitude (MR: elevated v-wave)
  msInflow?: boolean;      // Mitral Stenosis: restrict LV filling, low LV pressure
  tamponade?: boolean;     // Tamponade: equalize pressures
  hcmGradient?: number;    // mmHg — dynamic LVOT gradient (HCM)
}

// ---- PHYSIOLOGY ENGINE ----

function computeHemodynamics(p: Params) {
  const { preload, afterload, contractility, heartRate } = p;

  // Map sliders to physiological values
  const edv   = 80  + preload       * 1.2;          // 80–200 mL
  const edp   = 4   + preload       * 0.21;          // 4–25 mmHg
  let sbp     = 80  + afterload     * 1.2;           // 80–200 mmHg
  let dbp     = 50  + afterload     * 0.5;           // 50–100 mmHg
  const emax  = 0.5 + contractility * 0.025;         // 0.5–3.0 mmHg/mL (Emax)
  const esv   = Math.max(20, edv - (edv - 20) * (contractility / 100) * 0.75);
  const sv    = Math.max(15, edv - esv);
  const co    = (sv * heartRate) / 1000;             // L/min
  const ci    = co / 1.9;                            // assume BSA 1.9
  const ef    = Math.round((sv / edv) * 100);

  // Apply disease-specific modifiers to aortic pressure
  if (p.pulseWidthFactor !== undefined) {
    // AR: widen pulse pressure (high SBP, very low DBP)
    // MS: narrow pulse pressure (low SBP due to reduced SV)
    const pp = sbp - dbp;
    const newPP = pp * p.pulseWidthFactor;
    const mid = (sbp + dbp) / 2;
    sbp = mid + newPP / 2;
    dbp = Math.max(20, mid - newPP / 2);
  }
  if (p.tamponade) {
    // Tamponade: narrow pulse pressure, equalize diastolic pressures
    sbp = Math.min(sbp, 100);
    dbp = Math.max(dbp, sbp - 20); // very narrow pulse pressure
  }

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

  // LAP baseline: mean LAP ~ 0.7 × LVEDP (preload-driven)
  // lapMultiplier: MR elevates v-wave (>1.5), MS elevates overall LAP (>2.0)
  const lapMult = p.lapMultiplier ?? 1.0;
  const lap_mean = Math.max(4, edp * 0.75 * Math.max(1.0, lapMult * 0.7));
  // a-wave peak ~ 1.4× mean LAP; v-wave peak ~ 1.6× mean LAP (amplified by lapMultiplier for MR)
  const lap_a_peak = lap_mean * 1.45;
  const lap_v_peak = lap_mean * (1.65 * lapMult);  // MR: giant v-wave

  const data: {
    t: number; time: number;
    lvp: number; aop: number; lvv: number; ecg: number; lap: number;
  }[] = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);             // 0..1
    const time = parseFloat((t * rr * 1000).toFixed(1)); // ms

    let lvp = 0, aop = 0, lvv = 0, ecg = 0;

    // ---- LV PRESSURE ----
    // Disease modifiers applied below:
    // AS: LV pressure elevated above aortic by lvaoGradient during ejection
    // HCM: dynamic LVOT gradient added in mid-to-late ejection
    // MS: LV filling restricted, diastolic LV pressure lower than normal
    const lvaoGrad = p.lvaoGradient ?? 0;
    const hcmGrad  = p.hcmGradient  ?? 0;
    const msInflow = p.msInflow     ?? false;

    if (t < t_mvc) {
      // Late diastole / atrial kick
      const frac = t / t_mvc;
      // MS: LV fills less, so diastolic pressure is lower
      const dipFactor = msInflow ? 0.6 : 1.0;
      lvp = edp * dipFactor * (0.7 + 0.3 * Math.sin(frac * Math.PI));
    } else if (t < t_avo) {
      // Isovolumic contraction
      const frac = (t - t_mvc) / isocVol;
      // AS: LV must build higher pressure to overcome gradient before AVO
      const targetEsp = esp + lvaoGrad * 0.8;
      lvp = edp + (targetEsp - edp) * (frac * frac);
    } else if (t < t_avc) {
      // Ejection
      const frac = (t - t_avo) / ejection;
      // Base LV pressure during ejection
      const peak = (esp + lvaoGrad) * 1.05;
      lvp = (esp + lvaoGrad) + (peak - (esp + lvaoGrad)) * Math.sin(frac * Math.PI)
            - ((esp + lvaoGrad) - (esp + lvaoGrad) * 0.85) * frac;
      // HCM: add dynamic gradient in mid-late ejection (Venturi effect)
      if (hcmGrad > 0) {
        const hcmFrac = Math.max(0, (frac - 0.3) / 0.7); // ramps up mid-ejection
        lvp += hcmGrad * Math.sin(hcmFrac * Math.PI);
      }
      lvp = Math.max(edp, lvp);
    } else if (t < t_mvo) {
      // Isovolumic relaxation
      const frac = (t - t_avc) / isocRel;
      lvp = ((esp + lvaoGrad) * 0.85) * Math.exp(-frac * 4);
      lvp = Math.max(edp * 0.5, lvp);
    } else {
      // Diastolic filling
      const frac = (t - t_mvo) / (t_end - t_mvo);
      const rapid = 0.4;
      const dipFactor = msInflow ? 0.55 : 1.0; // MS: restricted inflow, lower LV diastolic pressure
      if (frac < rapid) {
        lvp = edp * dipFactor * (0.5 + 0.5 * (frac / rapid));
      } else if (frac < 0.85) {
        lvp = edp * dipFactor * (0.9 + 0.1 * ((frac - rapid) / 0.45));
      } else {
        // Atrial kick
        const af = (frac - 0.85) / 0.15;
        lvp = edp * dipFactor + edp * 0.25 * Math.sin(af * Math.PI);
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

    // ---- LAP (Left Atrial Pressure) ----
    // Waveform: a-wave (atrial contraction, just before MVC at t~0.88-0.0)
    //           c-wave (mitral valve bulge at MVC)
    //           x-descent (atrial relaxation, during isovolumic contraction)
    //           v-wave (venous filling during systole, peaks near AVC)
    //           y-descent (rapid emptying after MVO)
    //           diastasis (slow filling phase)
    let lap = lap_mean;

    // a-wave: centered at P-wave (~0.88 of cycle), width ~0.06
    const a_center = 0.90;  // slightly after P wave
    const a_w = 0.05;
    const a_wave = (lap_a_peak - lap_mean) * Math.exp(-0.5 * Math.pow((t - a_center) / a_w, 2));
    // Also handle wrap-around: a-wave also appears near t=0 (beginning of cycle)
    const a_wave2 = (lap_a_peak - lap_mean) * Math.exp(-0.5 * Math.pow((t - (a_center - 1.0)) / a_w, 2));

    // c-wave: small bump at MVC (t_mvc = 0.0)
    const c_center = t_mvc + 0.01;
    const c_w = 0.015;
    const c_wave = (lap_mean * 0.15) * Math.exp(-0.5 * Math.pow((t - c_center) / c_w, 2));

    // x-descent: fall during IVCT and early ejection (t_mvc to ~t_avo+0.05)
    const x_start = t_mvc + 0.01;
    const x_end = t_avo + 0.08;
    let x_descent = 0;
    if (t >= x_start && t <= x_end) {
      const xf = (t - x_start) / (x_end - x_start);
      x_descent = -(lap_mean * 0.35) * Math.sin(xf * Math.PI);
    }

    // v-wave: rises during systole (AVO to AVC), peaks near AVC
    const v_center = t_avc - 0.02;
    const v_w = 0.10;
    const v_wave = (lap_v_peak - lap_mean) * Math.exp(-0.5 * Math.pow((t - v_center) / v_w, 2));

    // y-descent: rapid fall after MVO
    const y_start = t_mvo;
    const y_end = t_mvo + 0.12;
    let y_descent = 0;
    if (t >= y_start && t <= y_end) {
      const yf = (t - y_start) / (y_end - y_start);
      y_descent = -(lap_mean * 0.45) * Math.sin(yf * Math.PI);
    }

    lap = lap_mean + a_wave + a_wave2 + c_wave + x_descent + v_wave + y_descent;
    lap = Math.max(1, parseFloat(lap.toFixed(1)));

    data.push({
      t: parseFloat(t.toFixed(4)),
      time,
      lvp: parseFloat(lvp.toFixed(1)),
      aop: parseFloat(aop.toFixed(1)),
      lvv: parseFloat(lvv.toFixed(1)),
      ecg: parseFloat(ecg.toFixed(3)),
      lap,
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
// Also returns key corner points for annotation
function generatePVLoop(p: Params, N = 200) {
  const { data } = generateWiggers(p, N);
  const points = data.map(d => ({ volume: parseFloat(d.lvv.toFixed(1)), pressure: parseFloat(d.lvp.toFixed(1)) }));

  // Find the 4 corner points by phase index
  const h = computeHemodynamics(p);
  const isocVol = 0.05;
  const ejection = 0.30;
  const isocRel = 0.05;
  const t_mvc = 0.0;
  const t_avo = t_mvc + isocVol;
  const t_avc = t_avo + ejection;
  const t_mvo = t_avc + isocRel;

  const idx = (t: number) => Math.min(N - 1, Math.round(t * (N - 1)));
  const corners = {
    mvc: points[idx(t_mvc)],
    avo: points[idx(t_avo)],
    avc: points[idx(t_avc)],
    mvo: points[idx(t_mvo)],
    // IVCT midpoint
    ivct_mid: points[idx((t_mvc + t_avo) / 2)],
    // IVRT midpoint
    ivrt_mid: points[idx((t_avc + t_mvo) / 2)],
    // Systole midpoint (mid ejection)
    sys_mid: points[idx((t_avo + t_avc) / 2)],
    // Diastole midpoint (mid filling)
    dia_mid: points[idx((t_mvo + 1.0) / 2)],
  };
  return { points, corners, hemo: h };
}

// ---- SLIDER CONTROL ----

function SliderControl({ label, value, min, max, step = 1, onChange, unit }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; color?: string; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  // Level logic
  let level: string;
  let isHigh = false;
  let isLow = false;
  if (unit === " bpm") {
    if (value < 60) { level = "Brady"; isLow = true; }
    else if (value > 100) { level = "Tachy"; isHigh = true; }
    else level = "Normal";
  } else {
    if (pct < 33) { level = "Low"; isLow = true; }
    else if (pct > 66) { level = "High"; isHigh = true; }
    else level = "Normal";
  }

  // Color scheme: teal base, red only when high
  const TEAL = "#189aa1";
  const RED  = "#dc2626";
  const AMBER = "#d97706";
  const trackColor = isHigh ? RED : isLow ? AMBER : TEAL;
  const badgeBg    = isHigh ? RED : isLow ? AMBER : TEAL;

  // Tick marks: 5 evenly spaced
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="select-none">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tabular-nums"
            style={{ fontFamily: "JetBrains Mono, monospace", color: trackColor }}>
            {value}{unit}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: badgeBg }}>
            {level}
          </span>
        </div>
      </div>

      {/* Custom slider track + thumb */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200" style={{ top: "50%", transform: "translateY(-50%)" }} />
        {/* Filled portion */}
        <div
          className="absolute h-2 rounded-full transition-all duration-75"
          style={{
            top: "50%", transform: "translateY(-50%)",
            left: 0,
            width: `${pct}%`,
            background: `linear-gradient(to right, ${trackColor}88, ${trackColor})`,
          }}
        />
        {/* Tick marks */}
        {ticks.map(t => (
          <div
            key={t}
            className="absolute w-px h-3 rounded-full"
            style={{
              left: `${t}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              background: t <= pct ? "rgba(255,255,255,0.6)" : "#d1d5db",
              zIndex: 1,
            }}
          />
        ))}
        {/* Native range input — transparent, sits on top for interaction */}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing"
          style={{ zIndex: 2, height: "100%" }}
        />
        {/* Visible thumb */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-md transition-all duration-75 pointer-events-none"
          style={{
            left: `calc(${pct}% - 10px)`,
            top: "50%",
            transform: "translateY(-50%)",
            background: trackColor,
            boxShadow: `0 1px 4px rgba(0,0,0,0.25), 0 0 0 3px ${trackColor}30`,
            zIndex: 3,
          }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span className="text-gray-300">drag to adjust</span>
        <span>{max}{unit}</span>
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
          {p.dataKey === "lvp" || p.dataKey === "aop" || p.dataKey === "lap" ? " mmHg" : p.dataKey === "lvv" ? " mL" : ""}
        </div>
      ))}
    </div>
  );
}

// ---- MAIN COMPONENT ----

const PRESETS: { label: string; values: Params; color: string }[] = [
  { label: "Normal",
    values: { preload: 50, afterload: 50, contractility: 50, heartRate: 70 },
    color: "#16a34a" },
  { label: "HTN / Pressure Overload",
    values: { preload: 50, afterload: 80, contractility: 60, heartRate: 72 },
    color: "#d97706" },
  { label: "Dilated CMP (DCM)",
    values: { preload: 70, afterload: 55, contractility: 20, heartRate: 95 },
    color: "#dc2626" },
  { label: "Volume Overload",
    values: { preload: 82, afterload: 40, contractility: 65, heartRate: 78, pulseWidthFactor: 1.3 },
    color: "#0891b2" },
  { label: "Hypovolemic Shock",
    values: { preload: 15, afterload: 75, contractility: 55, heartRate: 118 },
    color: "#7c3aed" },
  { label: "Tamponade",
    values: { preload: 25, afterload: 60, contractility: 45, heartRate: 110, tamponade: true },
    color: "#be185d" },
  { label: "HCM (Obstructive)",
    values: { preload: 40, afterload: 80, contractility: 90, heartRate: 80, hcmGradient: 60 },
    color: "#b45309" },
  { label: "Septic Shock",
    values: { preload: 30, afterload: 20, contractility: 55, heartRate: 120 },
    color: "#64748b" },
  // Valvular disease presets
  { label: "Aortic Stenosis (Severe)",
    // LV-Ao gradient 60 mmHg: LV systolic ~240 mmHg, Ao ~180 mmHg
    values: { preload: 55, afterload: 88, contractility: 65, heartRate: 68, lvaoGradient: 60 },
    color: "#c2410c" },
  { label: "Aortic Regurgitation",
    // Wide pulse pressure: high SBP, very low DBP (bounding pulse)
    values: { preload: 85, afterload: 38, contractility: 62, heartRate: 75, pulseWidthFactor: 2.2 },
    color: "#0369a1" },
  { label: "Mitral Stenosis (Severe)",
    // Elevated LAP, restricted LV inflow, narrow pulse pressure
    values: { preload: 72, afterload: 45, contractility: 58, heartRate: 85, lapMultiplier: 2.5, msInflow: true },
    color: "#7e22ce" },
  { label: "Mitral Regurgitation",
    // Giant LAP v-wave from systolic regurgitation into LA
    values: { preload: 78, afterload: 42, contractility: 60, heartRate: 80, lapMultiplier: 2.8 },
    color: "#be123c" },
];

function getClinicalContext(p: Params): { title: string; description: string; color: string } {
  const { preload, afterload, contractility, heartRate } = p;
  // Valvular disease patterns (checked before generic patterns)
  if (afterload >= 85 && preload >= 50 && preload <= 62 && contractility >= 60 && contractility <= 70 && heartRate <= 72)
    return { title: "Aortic Stenosis (Severe)", description: "Fixed high afterload from outflow obstruction. LV compensates with concentric LVH and elevated LVEDP. Slow-rising, low-amplitude pulse. Expect preserved EF until late decompensation. AVA <1.0 cm², Vmax >4 m/s.", color: "#c2410c" };
  if (preload >= 82 && afterload <= 42 && contractility >= 58 && heartRate >= 72 && heartRate <= 78)
    return { title: "Aortic Regurgitation (Chronic)", description: "Volume overload from diastolic regurgitation. Eccentric LVH with large EDV and wide pulse pressure. Bounding pulse. Diastolic flow reversal in descending aorta. EF may be preserved until late.", color: "#0369a1" };
  if (preload >= 68 && preload <= 76 && afterload >= 42 && afterload <= 48 && heartRate >= 82 && heartRate <= 88)
    return { title: "Mitral Stenosis (Severe)", description: "Fixed inflow obstruction elevates LA pressure and limits LV filling. Low EDV, reduced SV. LA dilation, risk of AF and pulmonary hypertension. MVA <1.0 cm², mean gradient >10 mmHg.", color: "#7e22ce" };
  if (preload >= 75 && afterload <= 45 && contractility >= 57 && contractility <= 63 && heartRate >= 77 && heartRate <= 83)
    return { title: "Mitral Regurgitation (Chronic)", description: "Volume overload from systolic regurgitation into LA. Elevated preload, reduced effective forward SV. LA and LV dilation. EF appears falsely preserved due to low-resistance regurgitant pathway.", color: "#be123c" };
  // Generic patterns
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
  const pvLoopResult = useMemo(() => generatePVLoop(params), [params]);
  const pvData = pvLoopResult.points;
  const pvCorners = pvLoopResult.corners;
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

        {/* Clinical Presets */}
        <div className="mb-5 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Lead II (simulated)</span>
                  <span className="flex items-center gap-1"><b className="text-purple-600">P</b> wave</span>
                  <span className="flex items-center gap-1"><b className="text-red-600">QRS</b> complex</span>
                  <span className="flex items-center gap-1"><b className="text-orange-500">T</b> wave</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <ComposedChart data={wiggersData} margin={{ top: 16, right: 10, bottom: 0, left: 30 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[-0.4, 1.4]} hide />
                  {/* Valve event lines */}
                  <ReferenceLine x={events.mvc} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine x={events.avo} stroke="#ef4444" strokeWidth={1.5} />
                  <ReferenceLine x={events.avc} stroke="#f97316" strokeWidth={1.5} />
                  <ReferenceLine x={events.mvo} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} />
                  {/* P wave label — at ~88% of RR */}
                  <ReferenceLine
                    x={Math.round(0.88 * rr_ms)}
                    stroke="transparent"
                    label={{ value: "P", position: "top", fontSize: 9, fill: "#9333ea", fontWeight: 700 }}
                  />
                  {/* QRS label — at ~2% of RR */}
                  <ReferenceLine
                    x={Math.round(0.02 * rr_ms)}
                    stroke="transparent"
                    label={{ value: "QRS", position: "top", fontSize: 9, fill: "#dc2626", fontWeight: 700 }}
                  />
                  {/* T wave label — at ~18% of RR */}
                  <ReferenceLine
                    x={Math.round(0.18 * rr_ms)}
                    stroke="transparent"
                    label={{ value: "T", position: "top", fontSize: 9, fill: "#f97316", fontWeight: 700 }}
                  />
                  {/* PR interval bracket */}
                  <ReferenceLine
                    x={Math.round(0.93 * rr_ms)}
                    stroke="#9333ea" strokeDasharray="2 3" strokeWidth={0.8}
                  />
                  <Line type="monotone" dataKey="ecg" stroke="#1e293b" strokeWidth={1.8} dot={false} name="ECG" />
                </ComposedChart>
              </ResponsiveContainer>
              {/* ECG interval summary */}
              <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-gray-500">
                <span><b className="text-purple-600">PR:</b> {Math.round((0.02 - 0.88 + 1) * rr_ms)} ms</span>
                <span><b className="text-red-600">QRS:</b> ~{Math.round(0.03 * rr_ms)} ms</span>
                <span><b className="text-orange-500">QT:</b> {Math.round(0.40 * rr_ms)} ms</span>
                <span><b className="text-gray-500">RR:</b> {rr_ms} ms</span>
                <span><b className="text-gray-500">HR:</b> {params.heartRate} bpm</span>
              </div>
            </div>

            {/* LV Pressure + Aortic Pressure */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 text-sm" style={{ fontFamily: "Merriweather, serif" }}>Pressure (mmHg)</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-[#189aa1]"></span> LV Pressure</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-[#dc2626]"></span> Aortic Pressure</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-[#9333ea]"></span> LA Pressure</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={wiggersData} margin={{ top: 4, right: 10, bottom: 4, left: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} label={{ value: "Time (ms)", position: "insideBottom", offset: -2, fontSize: 9 }} />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    label={{ value: "mmHg", angle: -90, position: "insideLeft", fontSize: 9, offset: 10 }}
                    domain={[0, Math.max(250, Math.round(hemo.sbp + (params.lvaoGradient ?? 0) + 20))]}
                  />
                  <Tooltip content={<WiggersTooltip />} />
                  <ReferenceLine x={events.mvc} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "MVC", position: "top", fontSize: 8, fill: "#3b82f6" }} />
                  <ReferenceLine x={events.avo} stroke="#ef4444" strokeWidth={1.5} label={{ value: "AVO", position: "top", fontSize: 8, fill: "#ef4444" }} />
                  <ReferenceLine x={events.avc} stroke="#f97316" strokeWidth={1.5} label={{ value: "AVC", position: "top", fontSize: 8, fill: "#f97316" }} />
                  <ReferenceLine x={events.mvo} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "MVO", position: "top", fontSize: 8, fill: "#22c55e" }} />
                  <Area type="monotone" dataKey="aop" stroke="#dc2626" fill="#fecaca" fillOpacity={0.3} strokeWidth={2} dot={false} name="Aortic Pressure" />
                  <Line type="monotone" dataKey="lvp" stroke="#189aa1" strokeWidth={2.5} dot={false} name="LV Pressure" />
                  <Line type="monotone" dataKey="lap" stroke="#9333ea" strokeWidth={1.8} strokeDasharray="5 2" dot={false} name="LA Pressure" />
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
              {/* PV Loop phase legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#3b82f620" }}></span><span className="text-blue-600 font-semibold">IVCT</span></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#ef444420" }}></span><span className="text-red-600 font-semibold">Systole / Ejection</span></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#f9731620" }}></span><span className="text-orange-600 font-semibold">IVRT</span></span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#22c55e20" }}></span><span className="text-green-600 font-semibold">Diastole / Filling</span></span>
              </div>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={pvData} margin={{ top: 20, right: 50, bottom: 20, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="volume" type="number" domain={["auto", "auto"]} tick={{ fontSize: 9 }}
                      label={{ value: "Volume (mL)", position: "insideBottom", offset: -8, fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }}
                      label={{ value: "Pressure (mmHg)", angle: -90, position: "insideLeft", fontSize: 9, offset: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}`, ""]} />
                    {/* Corner marker dots */}
                    {pvCorners.mvc && (
                      <ReferenceLine x={pvCorners.mvc.volume} stroke="#3b82f6" strokeDasharray="3 3" strokeWidth={1}
                        label={{ value: "MVC", position: "insideTopLeft", fontSize: 8, fill: "#3b82f6", fontWeight: 700 }} />
                    )}
                    {pvCorners.avo && (
                      <ReferenceLine x={pvCorners.avo.volume} stroke="#ef4444" strokeWidth={1.5}
                        label={{ value: "AVO", position: "insideTopLeft", fontSize: 8, fill: "#ef4444", fontWeight: 700 }} />
                    )}
                    {pvCorners.avc && (
                      <ReferenceLine x={pvCorners.avc.volume} stroke="#f97316" strokeWidth={1.5}
                        label={{ value: "AVC", position: "insideTopRight", fontSize: 8, fill: "#f97316", fontWeight: 700 }} />
                    )}
                    {pvCorners.mvo && (
                      <ReferenceLine x={pvCorners.mvo.volume} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1}
                        label={{ value: "MVO", position: "insideTopRight", fontSize: 8, fill: "#22c55e", fontWeight: 700 }} />
                    )}
                    {/* Pressure reference lines for IVCT and IVRT */}
                    {pvCorners.ivct_mid && (
                      <ReferenceLine y={pvCorners.ivct_mid.pressure} stroke="#3b82f6" strokeDasharray="2 4" strokeWidth={0.8}
                        label={{ value: "IVCT", position: "right", fontSize: 8, fill: "#3b82f6" }} />
                    )}
                    {pvCorners.ivrt_mid && (
                      <ReferenceLine y={pvCorners.ivrt_mid.pressure} stroke="#f97316" strokeDasharray="2 4" strokeWidth={0.8}
                        label={{ value: "IVRT", position: "right", fontSize: 8, fill: "#f97316" }} />
                    )}
                    {/* EDV and ESV reference lines */}
                    <ReferenceLine x={Math.round(hemo.edv)} stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: `EDV ${Math.round(hemo.edv)}`, position: "insideBottomRight", fontSize: 8, fill: "#64748b" }} />
                    <ReferenceLine x={Math.round(hemo.esv)} stroke="#94a3b8" strokeDasharray="4 3" strokeWidth={1}
                      label={{ value: `ESV ${Math.round(hemo.esv)}`, position: "insideBottomLeft", fontSize: 8, fill: "#64748b" }} />
                    {/* ESP reference */}
                    <ReferenceLine y={Math.round(hemo.esp)} stroke="#189aa1" strokeDasharray="3 3" strokeWidth={0.8}
                      label={{ value: `ESP ${Math.round(hemo.esp)} mmHg`, position: "right", fontSize: 8, fill: "#189aa1" }} />
                    {/* EDP reference */}
                    <ReferenceLine y={Math.round(hemo.edp)} stroke="#0891b2" strokeDasharray="3 3" strokeWidth={0.8}
                      label={{ value: `EDP ${Math.round(hemo.edp)} mmHg`, position: "right", fontSize: 8, fill: "#0891b2" }} />
                    <Area type="monotone" dataKey="pressure" stroke="#189aa1" fill="#e0f9fa" fillOpacity={0.4} strokeWidth={2.5} dot={false} name="PV Loop" />
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Phase labels overlaid on the loop quadrants */}
                <div className="absolute inset-0 pointer-events-none" style={{ top: 20, left: 40, right: 50, bottom: 20 }}>
                  {/* These are positioned conceptually — actual pixel positions are approximated */}
                  <div className="absolute text-[9px] font-bold text-blue-500 opacity-70" style={{ left: "5%", top: "15%" }}>IVCT</div>
                  <div className="absolute text-[9px] font-bold text-red-500 opacity-70" style={{ left: "40%", top: "5%" }}>SYSTOLE</div>
                  <div className="absolute text-[9px] font-bold text-orange-500 opacity-70" style={{ right: "5%", top: "40%" }}>IVRT</div>
                  <div className="absolute text-[9px] font-bold text-green-600 opacity-70" style={{ left: "30%", bottom: "10%" }}>DIASTOLE</div>
                </div>
              </div>
              {/* PV Loop annotation summary */}
              <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
                <div className="p-1.5 rounded bg-blue-50 border border-blue-100 text-center">
                  <div className="font-bold text-blue-600">IVCT</div>
                  <div className="text-gray-500">MVC → AVO</div>
                  <div className="font-mono text-blue-700">{Math.round((0.05) * (60 / params.heartRate) * 1000)} ms</div>
                </div>
                <div className="p-1.5 rounded bg-red-50 border border-red-100 text-center">
                  <div className="font-bold text-red-600">Ejection</div>
                  <div className="text-gray-500">AVO → AVC</div>
                  <div className="font-mono text-red-700">{Math.round((0.30) * (60 / params.heartRate) * 1000)} ms</div>
                </div>
                <div className="p-1.5 rounded bg-orange-50 border border-orange-100 text-center">
                  <div className="font-bold text-orange-600">IVRT</div>
                  <div className="text-gray-500">AVC → MVO</div>
                  <div className="font-mono text-orange-700">{Math.round((0.05) * (60 / params.heartRate) * 1000)} ms</div>
                </div>
                <div className="p-1.5 rounded bg-green-50 border border-green-100 text-center">
                  <div className="font-bold text-green-600">Filling</div>
                  <div className="text-gray-500">MVO → MVC</div>
                  <div className="font-mono text-green-700">{Math.round((0.60) * (60 / params.heartRate) * 1000)} ms</div>
                </div>
              </div>
            </div>

          </div>
        </div>


      </div>
    </Layout>
  );
}
