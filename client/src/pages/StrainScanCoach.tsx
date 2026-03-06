/*
  Strain ScanCoach™ — iHeartEcho
  Bull's-Eye · Segmental Strain Curves · LV GLS Calculator · Tips & Tricks
  ASE 2025 Strain Guideline · Acquisition Best Practices
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState, useMemo, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import {
  Activity, ChevronDown, ChevronUp, Info, AlertCircle,
  BarChart3, CheckCircle2, Lightbulb, Target, Zap,
  Camera, Settings, Eye, BookOpen, ExternalLink, ArrowRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Link } from "wouter";

const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";

// ─── Segment Definitions ─────────────────────────────────────────────────────

const SEGMENTS_17 = [
  { id: 1,  label: "Basal Anterior",      ring: "basal",   pos: 0, wall: "anterior" },
  { id: 2,  label: "Basal Anteroseptal",  ring: "basal",   pos: 1, wall: "septal" },
  { id: 3,  label: "Basal Inferoseptal",  ring: "basal",   pos: 2, wall: "septal" },
  { id: 4,  label: "Basal Inferior",      ring: "basal",   pos: 3, wall: "inferior" },
  { id: 5,  label: "Basal Inferolateral", ring: "basal",   pos: 4, wall: "lateral" },
  { id: 6,  label: "Basal Anterolateral", ring: "basal",   pos: 5, wall: "lateral" },
  { id: 7,  label: "Mid Anterior",        ring: "mid",     pos: 0, wall: "anterior" },
  { id: 8,  label: "Mid Anteroseptal",    ring: "mid",     pos: 1, wall: "septal" },
  { id: 9,  label: "Mid Inferoseptal",    ring: "mid",     pos: 2, wall: "septal" },
  { id: 10, label: "Mid Inferior",        ring: "mid",     pos: 3, wall: "inferior" },
  { id: 11, label: "Mid Inferolateral",   ring: "mid",     pos: 4, wall: "lateral" },
  { id: 12, label: "Mid Anterolateral",   ring: "mid",     pos: 5, wall: "lateral" },
  { id: 13, label: "Apical Anterior",     ring: "apical",  pos: 0, wall: "anterior" },
  { id: 14, label: "Apical Septal",       ring: "apical",  pos: 1, wall: "septal" },
  { id: 15, label: "Apical Inferior",     ring: "apical",  pos: 2, wall: "inferior" },
  { id: 16, label: "Apical Lateral",      ring: "apical",  pos: 3, wall: "lateral" },
  { id: 17, label: "Apex",               ring: "apex",    pos: 0, wall: "apex" },
];

const WALL_GROUPS = [
  { key: "anterior", label: "Anterior Wall",  color: "#dc2626", segIds: [1, 7, 13] },
  { key: "septal",   label: "Septal Wall",    color: "#f472b6", segIds: [2, 3, 8, 9, 14] },
  { key: "inferior", label: "Inferior Wall",  color: "#fb923c", segIds: [4, 10, 15] },
  { key: "lateral",  label: "Lateral Wall",   color: "#189aa1", segIds: [5, 6, 11, 12, 16] },
  { key: "apex",     label: "Apex",           color: "#7c3aed", segIds: [17] },
];

// ─── Strain Color ─────────────────────────────────────────────────────────────

function strainColor(val: number | null): string {
  if (val === null) return "#d1d5db";
  if (val <= -20) return "#991b1b";
  if (val <= -18) return "#ef4444";
  if (val <= -16) return "#f9a8d4";
  if (val <= -12) return "#fbcfe8";
  if (val <= -8)  return "#93c5fd";
  return "#1d4ed8";
}

// ─── Strain Curve Generator ───────────────────────────────────────────────────

function generateStrainCurve(
  strainVal: number | null,
  wms: number,
  _segId: number
): { t: number; strain: number }[] {
  const points = 50;
  const result: { t: number; strain: number }[] = [];
  let peak: number;
  if (strainVal !== null) {
    peak = strainVal;
  } else {
    const wmsDefaults: Record<number, number> = { 1: -20, 2: -12, 3: -2, 4: 3, 5: 5 };
    peak = wmsDefaults[wms] ?? -20;
  }
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 100;
    let strain = 0;
    if (wms === 1 || wms === 2) {
      const amplitude = Math.abs(peak);
      if (t <= 35) {
        strain = -(amplitude * Math.sin((t / 35) * Math.PI * 0.5));
      } else if (t <= 50) {
        const psr = wms === 1 ? amplitude * 0.05 : 0;
        strain = -amplitude + (amplitude + psr) * ((t - 35) / 15);
      } else {
        const midVal = wms === 1 ? amplitude * 0.05 : 0;
        strain = midVal * (1 - (t - 50) / 50);
      }
    } else if (wms === 3) {
      strain = peak * 0.15 * Math.sin((t / 100) * Math.PI);
    } else if (wms === 4) {
      const amp = Math.abs(peak) * 0.6;
      if (t <= 35) strain = amp * Math.sin((t / 35) * Math.PI * 0.5);
      else strain = amp * (1 - (t - 35) / 65);
    } else {
      const amp = Math.abs(peak) * 0.8;
      if (t <= 40) strain = amp * Math.sin((t / 40) * Math.PI * 0.5);
      else strain = amp * (1 - (t - 40) / 60);
    }
    result.push({ t: Math.round(t), strain: parseFloat(strain.toFixed(2)) });
  }
  return result;
}

// ─── LV GLS Interpretation ────────────────────────────────────────────────────

function interpretLvGls(val: number) {
  if (val <= -20) return {
    severity: "Normal LV GLS",
    color: "#15803d",
    suggests: `EchoAssist™ Suggests: LV GLS = ${val}% — within normal limits (≤ −20%). LV longitudinal function is preserved. No evidence of subclinical systolic dysfunction by strain.`,
    note: "EchoAssist™ Note: Normal GLS does not exclude diastolic dysfunction, hypertrophic cardiomyopathy, or early infiltrative disease. Correlate with clinical context, wall thickness, and diastolic parameters.",
    tip: "EchoAssist™ Tip: Serial GLS monitoring is recommended in cardio-oncology patients receiving potentially cardiotoxic therapy. A relative decrease ≥ 15% from baseline is the ASE 2022 threshold for cancer therapy-related cardiac dysfunction (CTRCD).",
  };
  if (val <= -16) return {
    severity: "Mildly Reduced LV GLS",
    color: "#ca8a04",
    suggests: `EchoAssist™ Suggests: LV GLS = ${val}% — mildly reduced (−16 to −20%). Subclinical systolic dysfunction is possible. Consider serial monitoring and clinical correlation.`,
    note: "EchoAssist™ Note: Mildly reduced GLS with preserved EF (LVEF ≥ 50%) may represent early HFpEF, hypertensive heart disease, or subclinical cardiomyopathy. Diastolic parameters and wall thickness should be assessed.",
    tip: "EchoAssist™ Tip: In cardio-oncology, GLS −16 to −20% with a relative drop ≥ 15% from baseline meets ASE 2022 CTRCD criteria even with preserved LVEF. Prompt cardiology referral is recommended.",
  };
  if (val <= -12) return {
    severity: "Moderately Reduced LV GLS",
    color: "#ea580c",
    suggests: `EchoAssist™ Suggests: LV GLS = ${val}% — moderately reduced (−12 to −16%). Significant longitudinal dysfunction is present. LVEF may still be preserved or mildly reduced.`,
    note: "EchoAssist™ Note: GLS in this range is associated with increased risk of adverse cardiovascular events. Consider evaluation for ischemic cardiomyopathy, infiltrative disease (amyloidosis, sarcoidosis), or dilated cardiomyopathy.",
    tip: "EchoAssist™ Tip: Regional patterns of reduced GLS can help differentiate ischemic (coronary territory) from non-ischemic (diffuse or apical-sparing) etiologies. Review the segmental bull's-eye for distribution.",
  };
  return {
    severity: "Severely Reduced LV GLS",
    color: "#dc2626",
    suggests: `EchoAssist™ Suggests: LV GLS = ${val}% — severely reduced (> −12%). Marked longitudinal dysfunction. LVEF is likely reduced or severely impaired. Urgent clinical evaluation is warranted.`,
    note: "EchoAssist™ Note: GLS > −12% is associated with poor prognosis in heart failure, post-MI, and cardio-oncology populations. Comprehensive evaluation including 3D volumetrics, diastolic assessment, and biomarkers is recommended.",
    tip: "EchoAssist™ Tip: In the setting of severely reduced GLS with preserved EF, consider cardiac amyloidosis (check RAS > 1.0, wall thickness, ECG voltage), HCM, or Fabry disease. Multimodality imaging may be required.",
  };
}

// ─── Bull's Eye SVG ──────────────────────────────────────────────────────────

function BullsEye({ values, onSelect, selected }: {
  values: Record<number, number | null>;
  onSelect: (id: number) => void;
  selected: number | null;
}) {
  const cx = 160, cy = 160;
  const radii = { basal: 120, mid: 80, apical: 45, apex: 18 };
  const segments: React.ReactElement[] = [];

  for (let i = 0; i < 6; i++) {
    const seg = SEGMENTS_17.find(s => s.ring === "basal" && s.pos === i)!;
    const startAngle = (i * 60 - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * 60 - 90) * (Math.PI / 180);
    const r1 = radii.mid, r2 = radii.basal;
    const x1 = cx + r1 * Math.cos(startAngle), y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle), y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle), y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle), y4 = cy + r1 * Math.sin(endAngle);
    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const val = values[seg.id] ?? null;
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = (r1 + r2) / 2;
    segments.push(
      <g key={seg.id} onClick={() => onSelect(seg.id)} style={{ cursor: "pointer" }}>
        <path d={d} fill={strainColor(val)} stroke={selected === seg.id ? "#0e1e2e" : "#fff"} strokeWidth={selected === seg.id ? 2.5 : 1} />
        {val !== null && (
          <text x={cx + labelR * Math.cos(midAngle)} y={cy + labelR * Math.sin(midAngle)}
            textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#1f2937">
            {val.toFixed(1)}
          </text>
        )}
      </g>
    );
  }

  for (let i = 0; i < 6; i++) {
    const seg = SEGMENTS_17.find(s => s.ring === "mid" && s.pos === i)!;
    const startAngle = (i * 60 - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * 60 - 90) * (Math.PI / 180);
    const r1 = radii.apical, r2 = radii.mid;
    const x1 = cx + r1 * Math.cos(startAngle), y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle), y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle), y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle), y4 = cy + r1 * Math.sin(endAngle);
    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const val = values[seg.id] ?? null;
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = (r1 + r2) / 2;
    segments.push(
      <g key={seg.id} onClick={() => onSelect(seg.id)} style={{ cursor: "pointer" }}>
        <path d={d} fill={strainColor(val)} stroke={selected === seg.id ? "#0e1e2e" : "#fff"} strokeWidth={selected === seg.id ? 2.5 : 1} />
        {val !== null && (
          <text x={cx + labelR * Math.cos(midAngle)} y={cy + labelR * Math.sin(midAngle)}
            textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#1f2937">
            {val.toFixed(1)}
          </text>
        )}
      </g>
    );
  }

  for (let i = 0; i < 4; i++) {
    const seg = SEGMENTS_17.find(s => s.ring === "apical" && s.pos === i)!;
    const startAngle = (i * 90 - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * 90 - 90) * (Math.PI / 180);
    const r1 = radii.apex, r2 = radii.apical;
    const x1 = cx + r1 * Math.cos(startAngle), y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle), y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle), y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle), y4 = cy + r1 * Math.sin(endAngle);
    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const val = values[seg.id] ?? null;
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = (r1 + r2) / 2;
    segments.push(
      <g key={seg.id} onClick={() => onSelect(seg.id)} style={{ cursor: "pointer" }}>
        <path d={d} fill={strainColor(val)} stroke={selected === seg.id ? "#0e1e2e" : "#fff"} strokeWidth={selected === seg.id ? 2.5 : 1} />
        {val !== null && (
          <text x={cx + labelR * Math.cos(midAngle)} y={cy + labelR * Math.sin(midAngle)}
            textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#1f2937">
            {val.toFixed(1)}
          </text>
        )}
      </g>
    );
  }

  const apexSeg = SEGMENTS_17.find(s => s.ring === "apex")!;
  const apexVal = values[apexSeg.id] ?? null;
  segments.push(
    <g key={apexSeg.id} onClick={() => onSelect(apexSeg.id)} style={{ cursor: "pointer" }}>
      <circle cx={cx} cy={cy} r={radii.apex} fill={strainColor(apexVal)}
        stroke={selected === apexSeg.id ? "#0e1e2e" : "#fff"} strokeWidth={selected === apexSeg.id ? 2.5 : 1} />
      {apexVal !== null && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#1f2937">
          {apexVal.toFixed(1)}
        </text>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto" style={{ userSelect: "none" }}>
      {segments}
      <text x="160" y="22" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">Anterior</text>
      <text x="160" y="308" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">Inferior</text>
      <text x="18" y="165" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600" transform="rotate(-90,18,165)">Lateral</text>
      <text x="302" y="165" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600" transform="rotate(90,302,165)">Septal</text>
    </svg>
  );
}

// ─── Segmental Strain Curves ──────────────────────────────────────────────────

function SegmentalStrainCurves({
  segValues,
  wallMotionScores,
}: {
  segValues: Record<number, number | null>;
  wallMotionScores: Record<number, number>;
}) {
  const [activeWalls, setActiveWalls] = useState<Set<string>>(
    new Set(WALL_GROUPS.map(w => w.key))
  );

  function toggleWall(key: string) {
    setActiveWalls(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const chartData = useMemo(() => {
    const timePoints = 51;
    const data: Record<string, number | string>[] = [];
    for (let i = 0; i < timePoints; i++) {
      const t = i * 2;
      const row: Record<string, number | string> = { t };
      WALL_GROUPS.forEach(wall => {
        if (!activeWalls.has(wall.key)) return;
        const curves = wall.segIds.map(segId => {
          const wms = wallMotionScores[segId] ?? 1;
          const val = segValues[segId] ?? null;
          return generateStrainCurve(val, wms, segId);
        });
        const avgAtT = curves.reduce((sum, curve) => {
          const pt = curve.find(p => p.t === t);
          return sum + (pt?.strain ?? 0);
        }, 0) / curves.length;
        row[wall.key] = parseFloat(avgAtT.toFixed(2));
      });
      data.push(row);
    }
    return data;
  }, [segValues, wallMotionScores, activeWalls]);

  const scoredSegs = SEGMENTS_17.filter(s => wallMotionScores[s.id] !== undefined);
  const wmsi = scoredSegs.length > 0
    ? (scoredSegs.reduce((sum, s) => sum + (wallMotionScores[s.id] ?? 1), 0) / scoredSegs.length).toFixed(2)
    : null;
  const wmsiColor = wmsi === null ? BRAND
    : parseFloat(wmsi) <= 1.0 ? "#15803d"
    : parseFloat(wmsi) <= 1.5 ? "#ca8a04"
    : "#dc2626";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Segmental Strain Curves</h3>
          <p className="text-xs text-gray-500 mt-0.5">Time-strain waveforms by wall · Adjusted by wall motion score</p>
        </div>
        {wmsi !== null && (
          <div className="text-center px-3 py-1.5 rounded-lg" style={{ background: wmsiColor + "15", border: `1px solid ${wmsiColor}30` }}>
            <div className="text-xs text-gray-500">WMSI</div>
            <div className="text-lg font-black font-mono" style={{ color: wmsiColor }}>{wmsi}</div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {WALL_GROUPS.map(wall => (
          <button key={wall.key} onClick={() => toggleWall(wall.key)}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border transition-all"
            style={{
              background: activeWalls.has(wall.key) ? wall.color + "20" : "#f9fafb",
              borderColor: activeWalls.has(wall.key) ? wall.color : "#e5e7eb",
              color: activeWalls.has(wall.key) ? wall.color : "#9ca3af",
            }}>
            {wall.label}
          </button>
        ))}
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="t" tickFormatter={v => v === 0 ? "ED" : v === 35 ? "ES" : v === 100 ? "ED" : ""} ticks={[0, 35, 70, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
            <YAxis domain={[-30, 10]} tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, WALL_GROUPS.find(w => w.key === name)?.label ?? name]} labelFormatter={t => `Time: ${t}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BRAND}30` }} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
            <ReferenceLine y={-20} stroke="#dc262640" strokeDasharray="4 2" strokeWidth={1} label={{ value: "Normal", position: "right", fontSize: 8, fill: "#dc2626" }} />
            {WALL_GROUPS.filter(w => activeWalls.has(w.key)).map(wall => (
              <Line key={wall.key} type="monotone" dataKey={wall.key} stroke={wall.color} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-4">
        <summary className="text-xs font-semibold cursor-pointer flex items-center gap-1" style={{ color: BRAND }}>
          <BarChart3 className="w-3.5 h-3.5" /> Wall Motion Scoring (click to expand)
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SEGMENTS_17.map(seg => (
            <div key={seg.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-36 flex-shrink-0">{seg.label}</span>
              <select
                value={wallMotionScores[seg.id] ?? 1}
                onChange={() => {}}
                className="flex-1 text-xs border rounded px-2 py-1"
                style={{ borderColor: BRAND + "40" }}
              >
                <option value={1}>1 — Normal</option>
                <option value={2}>2 — Hypokinetic</option>
                <option value={3}>3 — Akinetic</option>
                <option value={4}>4 — Dyskinetic</option>
                <option value={5}>5 — Aneurysmal</option>
              </select>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// ─── Collapsible Section Card ─────────────────────────────────────────────────

function SectionCard({ title, subtitle, children, defaultOpen = true, icon }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND + "18" }}>{icon}</div>}
          <div>
            <div className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{title}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────

function TipCard({ icon, title, tip, color = BRAND }: {
  icon: React.ReactNode;
  title: string;
  tip: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg p-4 border" style={{ background: color + "08", borderColor: color + "25" }}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: color + "20" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <div className="text-xs font-bold mb-1" style={{ color }}>{title}</div>
          <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────

function CheckItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-gray-50"
    >
      <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${checked ? "border-teal-600 bg-teal-600" : "border-gray-300"}`}>
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-xs leading-relaxed ${checked ? "line-through text-gray-400" : "text-gray-700"}`}>{label}</span>
    </button>
  );
}

// ─── NumInput ─────────────────────────────────────────────────────────────────

function NumInput({ label, value, onChange, unit, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}{unit && <span className="text-gray-400 ml-1">({unit})</span>}</label>
      <input
        type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border rounded-lg px-3 py-2 text-sm font-mono text-gray-800 outline-none focus:ring-2"
        style={{ borderColor: BRAND + "40" }}
      />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const legend = [
  { color: "#991b1b", label: "≤ −20% — Normal", textColor: "#991b1b" },
  { color: "#ef4444", label: "−18 to −20% — Borderline", textColor: "#ef4444" },
  { color: "#f9a8d4", label: "−16 to −18% — Mildly Reduced", textColor: "#be185d" },
  { color: "#fbcfe8", label: "−12 to −16% — Moderately Reduced", textColor: "#9d174d" },
  { color: "#93c5fd", label: "−8 to −12% — Mod-Severely Reduced", textColor: "#1d4ed8" },
  { color: "#1d4ed8", label: "> −8% — Severely Reduced", textColor: "#1d4ed8" },
  { color: "#d1d5db", label: "Not entered", textColor: "#6b7280" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StrainScanCoach() {
  // Bull's-eye state — default to -22 (normal) per preference
  const [segValues, setSegValues] = useState<Record<number, number | null>>(
    () => Object.fromEntries(SEGMENTS_17.map(s => [s.id, -22])) as Record<number, number | null>
  );
  const [wallMotionScores, setWallMotionScores] = useState<Record<number, number>>({});
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [segInput, setSegInput] = useState("");
  const segInputRef = useRef<HTMLInputElement>(null);

  // LV GLS calculator state
  const [lvGls, setLvGls] = useState("");
  const [vendor, setVendor] = useState("");
  const [frameRate, setFrameRate] = useState("");

  // Acquisition checklist state
  const [acqChecks, setAcqChecks] = useState<Record<string, boolean>>({});

  const lvGlsNum = parseFloat(lvGls);
  const lvInterp = !isNaN(lvGlsNum) ? interpretLvGls(lvGlsNum) : null;

  const enteredSegs = SEGMENTS_17.filter(s => segValues[s.id] !== null && segValues[s.id] !== undefined);
  const segAvg = enteredSegs.length > 0
    ? (enteredSegs.reduce((sum, s) => sum + (segValues[s.id] as number), 0) / enteredSegs.length).toFixed(1)
    : null;

  const wmsi = (() => {
    const scored = SEGMENTS_17.filter(s => wallMotionScores[s.id] !== undefined);
    return scored.length > 0
      ? (scored.reduce((sum, s) => sum + (wallMotionScores[s.id] ?? 1), 0) / scored.length).toFixed(2)
      : null;
  })();

  const selectedSegLabel = selectedSeg !== null
    ? SEGMENTS_17.find(s => s.id === selectedSeg)?.label ?? ""
    : "";

  const handleSegSelect = useCallback((id: number) => {
    setSelectedSeg(id);
    const current = segValues[id];
    setSegInput(current !== null && current !== undefined ? String(current) : "");
    setTimeout(() => segInputRef.current?.focus(), 50);
  }, [segValues]);

  const handleSegInputChange = useCallback((val: string) => {
    setSegInput(val);
    const num = parseFloat(val);
    setSegValues(prev => ({ ...prev, [selectedSeg!]: isNaN(num) ? null : num }));
  }, [selectedSeg]);

  const clearAllSegments = useCallback(() => {
    setSegValues(Object.fromEntries(SEGMENTS_17.map(s => [s.id, null])) as Record<number, number | null>);
    setSelectedSeg(null);
    setSegInput("");
  }, []);

  function toggleAcq(key: string) {
    setAcqChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const acqItems = [
    { key: "hr", label: "Heart rate documented and within acceptable range (ideally 60–80 bpm for strain)" },
    { key: "fr", label: "Frame rate ≥ 40 fps (ideally 60–80 fps) confirmed on all 3 apical views" },
    { key: "harmonic", label: "Tissue harmonic imaging enabled (reduces noise, improves endocardial definition)" },
    { key: "depth", label: "Depth minimized to include only the LV — apex to base just fitting the screen" },
    { key: "focus", label: "Single focus zone placed at the level of the mitral valve" },
    { key: "gain", label: "Gain optimized — endocardium clearly visible without over-gain artifact" },
    { key: "foreshorten", label: "True apex confirmed — no foreshortening (apex should appear rounded, not flat)" },
    { key: "3views", label: "All 3 apical views acquired: A4C, A2C, A3C (APLAX)" },
    { key: "3beats", label: "Minimum 3 consecutive cardiac cycles stored per view (5 for AF)" },
    { key: "ecg", label: "ECG gating active and QRS trigger confirmed on all clips" },
    { key: "breath", label: "Patient instructed to hold breath at end-expiration during acquisition" },
    { key: "vendor", label: "Vendor and software version documented (affects normal range reference)" },
    { key: "midwall", label: "Mid-wall strain reviewed separately (ASE 2025: mid-wall GLS ≥ −17% is normal)" },
    { key: "3d", label: "3D strain considered if 2D image quality is suboptimal or for volumetric accuracy" },
  ];

  const acqDone = acqItems.filter(i => acqChecks[i.key]).length;

  return (
    <Layout>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #0e3a40 60%, ${BRAND} 100%)` }}>
        <div className="relative container py-8 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
                <Camera className="w-3.5 h-3.5 text-[#4ad9e0]" />
                <span className="text-xs text-white/80 font-medium">ScanCoach™ · Strain Imaging</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                Strain ScanCoach™
              </h1>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Interactive bull's-eye, segmental strain curves, LV GLS calculator, and ASE 2025 acquisition guidance — all in one place.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/strain">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                    <Activity className="w-3.5 h-3.5" /> Strain Navigator™
                  </button>
                </Link>
                <Link href="/echoassist">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                    <Zap className="w-3.5 h-3.5" /> EchoAssist™ Strain
                  </button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="text-right">
                <div className="text-xs text-white/50 mb-0.5">Acquisition Checklist</div>
                <div className="text-2xl font-black font-mono text-[#4ad9e0]">{acqDone}/{acqItems.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* ── Tips & Tricks ── */}
            <SectionCard
              title="Tips & Tricks"
              subtitle="Practical acquisition guidance · ASE 2025 · Vendor-neutral"
              icon={<Lightbulb className="w-4 h-4" style={{ color: BRAND }} />}
            >
              <div className="space-y-4">

                {/* Patient & Setup */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>Patient & Setup</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<Target className="w-3.5 h-3.5" />}
                      title="Patient Positioning"
                      tip="Left lateral decubitus with left arm raised above the head. Use a cardiac wedge or pillow under the right hip. This opens the intercostal spaces and brings the heart closer to the chest wall for optimal apical windows."
                    />
                    <TipCard
                      icon={<Activity className="w-3.5 h-3.5" />}
                      title="Heart Rate Optimization"
                      tip="Ideal heart rate for strain acquisition is 60–80 bpm. At higher rates, frame rate requirements increase proportionally. For HR > 100 bpm, target ≥ 60 fps. Avoid strain analysis if HR is irregular (AF) without averaging ≥ 5 cycles."
                    />
                    <TipCard
                      icon={<Settings className="w-3.5 h-3.5" />}
                      title="Machine Settings First"
                      tip="Before acquiring strain clips, set: depth (LV only), single focus at MV level, tissue harmonic imaging ON, gain optimized, sector width narrowed to maximize frame rate. Save these as a strain preset on your machine."
                    />
                    <TipCard
                      icon={<Eye className="w-3.5 h-3.5" />}
                      title="Breath-Hold Technique"
                      tip="Ask the patient to breathe out gently and hold. Acquire during end-expiration to minimize respiratory motion artifact. For patients who cannot hold their breath, use respiratory gating if available, or average multiple cycles."
                    />
                  </div>
                </div>

                {/* Acquisition */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>Acquisition</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<Camera className="w-3.5 h-3.5" />}
                      title="Frame Rate Is Critical"
                      tip="ASE 2025 recommends ≥ 40 fps, ideally 60–80 fps. Low frame rate (< 40 fps) underestimates peak systolic strain. Increase frame rate by: narrowing sector width, reducing depth, turning off color Doppler, and reducing line density."
                      color="#7c3aed"
                    />
                    <TipCard
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      title="Avoid Foreshortening"
                      tip="The single most common error in strain acquisition. The apex must appear rounded and pointed — not flat or cut off. Move the probe one interspace lower and tilt more superiorly if the apex looks foreshortened. Confirm in both A4C and A2C."
                      color="#dc2626"
                    />
                    <TipCard
                      icon={<Zap className="w-3.5 h-3.5" />}
                      title="Three Views, Every Time"
                      tip="GLS requires A4C, A2C, and A3C (APLAX). Acquiring only A4C underestimates GLS by up to 3–4%. Each view contributes 6 segments. The apex (segment 17) is shared across all three views — ensure it is clearly visualized in each."
                    />
                    <TipCard
                      icon={<BarChart3 className="w-3.5 h-3.5" />}
                      title="ECG Gating"
                      tip="Confirm the QRS trigger is correctly identifying the R-wave on every clip. Mis-triggering causes incorrect systolic timing and false strain values. If ECG signal is poor, use the machine's internal trigger or a limb-lead electrode repositioning."
                    />
                  </div>
                </div>

                {/* ASE 2025 Updates */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7c3aed" }}>ASE 2025 Updates</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<Info className="w-3.5 h-3.5" />}
                      title="Mid-Wall Strain (New 2025)"
                      tip="ASE 2025 introduces mid-wall GLS as a separate parameter. Normal mid-wall GLS is ≥ −17%. Mid-wall strain is more sensitive for detecting subendocardial ischemia and early HCM. Most vendors now report this automatically — ensure your software is updated."
                      color="#7c3aed"
                    />
                    <TipCard
                      icon={<Activity className="w-3.5 h-3.5" />}
                      title="Updated Normal Thresholds"
                      tip="ASE 2025 updates normal GLS to ≤ −20% (unchanged from 2022 consensus). However, age- and sex-specific ranges are now recommended: women have slightly more negative GLS (−21 to −22%) than men (−19 to −21%). Adjust interpretation accordingly."
                      color="#7c3aed"
                    />
                    <TipCard
                      icon={<Zap className="w-3.5 h-3.5" />}
                      title="3D Strain Preferred When Available"
                      tip="ASE 2025 endorses 3D GLS as the preferred method when image quality allows (avoids foreshortening, single-beat acquisition). 3D GLS normal range: ≤ −19%. Use 2D GLS when 3D image quality is suboptimal."
                      color="#7c3aed"
                    />
                    <TipCard
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      title="Vendor Normalization"
                      tip="ASE 2025 continues to recommend vendor-specific normal ranges due to inter-vendor variability of up to 2–3%. When comparing serial studies, always use the same vendor and software version. Document vendor and software version in every report."
                      color="#7c3aed"
                    />
                  </div>
                </div>

                {/* Common Pitfalls */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#dc2626" }}>Common Pitfalls</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      title="Over-Gain Artifact"
                      tip="Excessive gain causes endocardial dropout and tracking failure. The endocardium should be a clear, bright, continuous line. If the myocardium appears 'washed out' or the cavity is bright, reduce gain until the endocardium is sharp."
                      color="#dc2626"
                    />
                    <TipCard
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      title="Pericardial Effusion Interference"
                      tip="Even small effusions can cause the tracking algorithm to follow the pericardium instead of the endocardium. Manually review tracking quality in all segments. Exclude segments where tracking clearly fails — do not report GLS if > 3 segments are excluded."
                      color="#dc2626"
                    />
                    <TipCard
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      title="Prosthetic Valves & Pacemakers"
                      tip="Metallic artifacts from prosthetic valves and pacemaker leads cause shadowing that disrupts tracking in adjacent segments. Document affected segments and interpret GLS with caution. 3D strain may be less affected."
                      color="#dc2626"
                    />
                    <TipCard
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      title="LBBB Pattern"
                      tip="Left bundle branch block causes paradoxical septal motion that makes GLS unreliable as a measure of intrinsic myocardial function. In LBBB, report segmental strain patterns rather than global GLS. Consider mechanical dyssynchrony analysis."
                      color="#dc2626"
                    />
                  </div>
                </div>

                {/* Contrast & Difficult Windows */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#ca8a04" }}>Contrast & Difficult Windows</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<Camera className="w-3.5 h-3.5" />}
                      title="When to Use Contrast"
                      tip="Use ultrasound enhancing agents (UEA) when ≥ 2 contiguous segments are not visualized. Contrast improves endocardial definition and tracking quality. Most strain software supports contrast-enhanced tracking — confirm with your vendor."
                      color="#ca8a04"
                    />
                    <TipCard
                      icon={<Settings className="w-3.5 h-3.5" />}
                      title="Subcostal Window Alternative"
                      tip="For patients with poor apical windows (COPD, obesity, post-surgical), the subcostal 4-chamber view can be used for strain if the endocardium is clearly visualized. Note the alternative window in the report as it may affect normal range applicability."
                      color="#ca8a04"
                    />
                  </div>
                </div>

                {/* Reporting */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: BRAND }}>Reporting</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TipCard
                      icon={<BookOpen className="w-3.5 h-3.5" />}
                      title="What to Report"
                      tip="Always report: (1) GLS value with vendor/software version, (2) number of segments tracked/excluded, (3) frame rate, (4) whether contrast was used, (5) clinical context (baseline vs. follow-up, cardio-oncology, etc.). Include the bull's-eye image in the report."
                    />
                    <TipCard
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      title="Serial Comparisons"
                      tip="For serial monitoring (cardio-oncology, HF), always compare same vendor, same software version, same view, same frame rate. A relative GLS decrease ≥ 15% from baseline is the ASE 2022 CTRCD threshold. Document the baseline value in every follow-up report."
                    />
                  </div>
                </div>

              </div>
            </SectionCard>

            {/* ── Imaging Parameters Checklist ── */}
            <SectionCard
              title="Imaging Parameters Checklist"
              subtitle={`${acqDone}/${acqItems.length} items confirmed · ASE 2025`}
              icon={<CheckCircle2 className="w-4 h-4" style={{ color: BRAND }} />}
            >
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Acquisition readiness</span>
                  <span className="text-xs font-bold" style={{ color: BRAND }}>{Math.round((acqDone / acqItems.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(acqDone / acqItems.length) * 100}%`, background: BRAND }} />
                </div>
              </div>
              <div className="space-y-1">
                {acqItems.map(item => (
                  <CheckItem key={item.key} label={item.label} checked={!!acqChecks[item.key]} onToggle={() => toggleAcq(item.key)} />
                ))}
              </div>
            </SectionCard>

            {/* ── LV GLS Calculator ── */}
            <SectionCard
              title="LV GLS Calculator"
              subtitle="Global value · ASE 2025 · Vendor-neutral reference ≤ −20%"
              icon={<Activity className="w-4 h-4" style={{ color: BRAND }} />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <NumInput label="LV GLS" value={lvGls} onChange={setLvGls} unit="%" placeholder="e.g. −19.5" hint="Normal ≤ −20%" />
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Vendor / Platform</label>
                  <select value={vendor} onChange={e => setVendor(e.target.value)}
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-700" style={{ borderColor: BRAND + "40" }}>
                    <option value="">Select vendor</option>
                    <option>GE HealthCare</option>
                    <option>Philips</option>
                    <option>Siemens Healthineers</option>
                    <option>Canon Medical</option>
                    <option>Fujifilm</option>
                    <option>Samsung Medison</option>
                    <option>Mindray</option>
                    <option>Other</option>
                  </select>
                </div>
                <NumInput label="Frame Rate" value={frameRate} onChange={setFrameRate} unit="fps" placeholder="≥ 40" hint="Recommended ≥ 40 fps" />
              </div>

              {lvInterp && (
                <div className="rounded-lg p-4 mb-4" style={{ background: lvInterp.color + "18", borderLeft: `4px solid ${lvInterp.color}` }}>
                  <div className="font-bold text-sm mb-2" style={{ color: lvInterp.color }}>{lvInterp.severity}</div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">{lvInterp.suggests}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{lvInterp.note}</p>
                  <p className="text-xs text-gray-500 leading-relaxed italic">{lvInterp.tip}</p>
                </div>
              )}

              {/* Vendor-specific reference table */}
              <details className="mt-2">
                <summary className="text-xs font-semibold text-teal-700 cursor-pointer hover:underline flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Vendor-specific normal ranges (ASE/EACVI 2022)
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ background: BRAND + "15" }}>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">Vendor</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">Normal GLS (mean ± SD)</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-700">Lower Limit of Normal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["GE HealthCare (EchoPAC)", "−20.2 ± 1.9%", "−16.4%"],
                        ["Philips (QLAB)", "−20.4 ± 2.1%", "−16.2%"],
                        ["Siemens (syngo.via)", "−19.8 ± 2.0%", "−15.8%"],
                        ["Canon Medical (Aplio)", "−20.0 ± 2.0%", "−16.0%"],
                        ["Fujifilm (Arietta)", "−20.1 ± 2.0%", "−16.1%"],
                        ["Vendor-neutral consensus", "−20.0 ± 2.0%", "−16.0%"],
                      ].map(([v, mean, lln]) => (
                        <tr key={v} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-700 font-medium">{v}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{mean}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono">{lln}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              {/* Mid-wall strain note */}
              <div className="mt-4 rounded-lg p-3 border" style={{ background: "#7c3aed08", borderColor: "#7c3aed25" }}>
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#7c3aed" }} />
                  <div>
                    <div className="text-xs font-bold mb-1" style={{ color: "#7c3aed" }}>ASE 2025 — Mid-Wall GLS</div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Normal mid-wall GLS is ≥ −17% (less negative than endocardial GLS). Mid-wall strain is more sensitive for subendocardial ischemia and early HCM. Most vendors report this automatically — check your software version for availability.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── References ── */}
            <SectionCard
              title="References & Guidelines"
              subtitle="ASE 2025 · EACVI · ESC · Cardio-Oncology"
              defaultOpen={false}
              icon={<BookOpen className="w-4 h-4" style={{ color: BRAND }} />}
            >
              <div className="space-y-2">
                {[
                  { ref: "ASE. Recommendations for the Standardization and Interpretation of Echocardiographic Strain. JASE 2025 (August).", url: "https://www.asecho.org/wp-content/uploads/2025/08/Strain-Guideline-AIP-August-2025.pdf" },
                  { ref: "ASE/WFTF. Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults. 2018 Update.", url: "https://asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf" },
                  { ref: "Plana JC et al. Expert Consensus for Multimodality Imaging Evaluation during and after Cancer Therapy. JASE 2014;27:911–39.", url: "https://www.asecho.org" },
                  { ref: "Smiseth OA et al. Myocardial strain imaging: how useful is it in clinical decision making? Eur Heart J 2016;37:1196–207.", url: "https://academic.oup.com/eurheartj" },
                  { ref: "Nagueh SF et al. Recommendations for the Evaluation of Left Ventricular Diastolic Function. JASE 2016;29:277–314.", url: "https://www.asecho.org/guideline/diastolic-dysfunction/" },
                ].map(({ ref, url }) => (
                  <a key={ref} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 rounded-lg transition-colors group" style={{ background: "#f0fbfc" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#d4f5f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#f0fbfc")}>
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                    <span className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800">{ref}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600" />
                  </a>
                ))}
              </div>
            </SectionCard>

          </div>

          {/* ── Right Column — Bull's Eye + Curves + Summary ── */}
          <div className="flex flex-col gap-5">

            {/* Bull's Eye */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                  17-Segment Bull's-Eye
                </h3>
                <button onClick={clearAllSegments}
                  className="text-xs font-semibold px-2 py-0.5 rounded transition-colors"
                  style={{ color: "#189aa1", background: "#189aa1" + "15" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dc262618"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#189aa1" + "15"; (e.currentTarget as HTMLButtonElement).style.color = "#189aa1"; }}>
                  Clear all
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Click a segment to enter its strain value. Outer ring = basal, inner ring = apical.</p>

              <BullsEye values={segValues} onSelect={handleSegSelect} selected={selectedSeg} />

              {selectedSeg !== null && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    {selectedSegLabel} Strain (%)
                  </label>
                  <input
                    ref={segInputRef}
                    type="number" step="0.1"
                    value={segInput}
                    onChange={e => handleSegInputChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Tab" || e.key === "Enter") {
                        e.preventDefault();
                        const ids = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
                        const cur = ids.indexOf(selectedSeg ?? 1);
                        handleSegSelect(ids[(cur + 1) % ids.length]);
                      }
                    }}
                    placeholder="e.g. −18.5"
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm font-mono text-gray-800 outline-none"
                    style={{ borderColor: "#189aa1" + "60" }}
                  />
                </div>
              )}

              {segAvg !== null && (
                <div className="mt-3 p-3 rounded-lg text-center" style={{ background: BRAND + "15" }}>
                  <div className="text-xs text-gray-500 mb-0.5">Segmental Average ({enteredSegs.length} segments)</div>
                  <div className="text-xl font-black font-mono" style={{ color: BRAND }}>{segAvg}%</div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-4 space-y-1">
                {legend.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color, border: "1px solid #cbd5e1" }} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segmental Strain Curves */}
            <SegmentalStrainCurves segValues={segValues} wallMotionScores={wallMotionScores} />

            {/* Summary Panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                Strain Summary
              </h3>
              <div className="space-y-3">
                {/* LV GLS */}
                <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: BRAND + "30" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND }}>LV GLS</span>
                    <span className="text-xs text-gray-400">Normal ≤ −20%</span>
                  </div>
                  <div className="text-2xl font-black font-mono" style={{ color: lvGls ? (parseFloat(lvGls) <= -20 ? "#15803d" : parseFloat(lvGls) <= -16 ? "#ca8a04" : "#dc2626") : BRAND }}>
                    {lvGls ? `${lvGls}%` : "—"}
                  </div>
                  {lvInterp && <div className="text-xs mt-1" style={{ color: lvInterp.color }}>{lvInterp.severity}</div>}
                </div>

                {segAvg !== null && (
                  <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: BRAND + "30" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND }}>Segmental Avg</span>
                      <span className="text-xs text-gray-400">{enteredSegs.length}/17 segs</span>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: BRAND }}>{segAvg}%</div>
                  </div>
                )}

                {wmsi !== null && (
                  <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: BRAND + "30" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND }}>WMSI</span>
                      <span className="text-xs text-gray-400">Normal = 1.0</span>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: parseFloat(wmsi) <= 1.0 ? "#15803d" : parseFloat(wmsi) <= 1.5 ? "#ca8a04" : "#dc2626" }}>{wmsi}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-800 mb-3" style={{ fontFamily: "Merriweather, serif" }}>
                Quick Reference (ASE 2025)
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  ["LV GLS Normal", "≤ −20%"],
                  ["LV GLS Mildly Reduced", "−16 to −20%"],
                  ["LV GLS Mod. Reduced", "−12 to −16%"],
                  ["LV GLS Severely Reduced", "> −12%"],
                  ["Mid-Wall GLS Normal (2025)", "≥ −17%"],
                  ["3D GLS Normal", "≤ −19%"],
                  ["RV FW Strain Normal", "≤ −29%"],
                  ["LA Reservoir Normal", "≥ 38%"],
                  ["CTRCD Threshold (relative)", ">15% drop from baseline"],
                  ["Apical Sparing RAS", "> 1.0"],
                  ["Frame Rate (minimum)", "≥ 40 fps"],
                  ["Frame Rate (ideal)", "60–80 fps"],
                  ["WMSI Normal", "1.0"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-mono font-semibold" style={{ color: BRAND }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
