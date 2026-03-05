/*
  Strain Navigator™ — iHeartEcho
  LV GLS · RV Free-Wall Strain · LA Reservoir Strain
  Bull's-eye segmental display · Segmental Strain Curves · Wall Motion Scoring
  Save to Case · ASE/EACVI 2022 reference values
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState, useMemo, useRef } from "react";
import Layout from "@/components/Layout";
import {
  Activity, ChevronDown, ChevronUp, Info, AlertCircle,
  TrendingDown, Zap, BookOpen, ExternalLink, BarChart3,
  Save, X, Plus, CheckCircle2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";

// ─── Reference Values (ASE/EACVI 2022) ──────────────────────────────────────

const LV_GLS_NORMAL = -20;
const LV_GLS_MILDLY_REDUCED = -16;
const LV_GLS_MODERATELY_REDUCED = -12;
const RV_STRAIN_NORMAL = -29;
const LA_RESERVOIR_NORMAL = 38;

// ─── Wall Motion Score Labels ─────────────────────────────────────────────────
// 1=Normal, 2=Hypokinetic, 3=Akinetic, 4=Dyskinetic, 5=Aneurysmal
const WMS_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Hypokinetic",
  3: "Akinetic",
  4: "Dyskinetic",
  5: "Aneurysmal",
};

// ─── Segment Definitions ─────────────────────────────────────────────────────

const SEGMENTS_17 = [
  // Basal (6)
  { id: 1, label: "Basal Anterior", ring: "basal", pos: 0, wall: "anterior" },
  { id: 2, label: "Basal Anteroseptal", ring: "basal", pos: 1, wall: "septal" },
  { id: 3, label: "Basal Inferoseptal", ring: "basal", pos: 2, wall: "septal" },
  { id: 4, label: "Basal Inferior", ring: "basal", pos: 3, wall: "inferior" },
  { id: 5, label: "Basal Inferolateral", ring: "basal", pos: 4, wall: "lateral" },
  { id: 6, label: "Basal Anterolateral", ring: "basal", pos: 5, wall: "lateral" },
  // Mid (6)
  { id: 7, label: "Mid Anterior", ring: "mid", pos: 0, wall: "anterior" },
  { id: 8, label: "Mid Anteroseptal", ring: "mid", pos: 1, wall: "septal" },
  { id: 9, label: "Mid Inferoseptal", ring: "mid", pos: 2, wall: "septal" },
  { id: 10, label: "Mid Inferior", ring: "mid", pos: 3, wall: "inferior" },
  { id: 11, label: "Mid Inferolateral", ring: "mid", pos: 4, wall: "lateral" },
  { id: 12, label: "Mid Anterolateral", ring: "mid", pos: 5, wall: "lateral" },
  // Apical (4)
  { id: 13, label: "Apical Anterior", ring: "apical", pos: 0, wall: "anterior" },
  { id: 14, label: "Apical Septal", ring: "apical", pos: 1, wall: "septal" },
  { id: 15, label: "Apical Inferior", ring: "apical", pos: 2, wall: "inferior" },
  { id: 16, label: "Apical Lateral", ring: "apical", pos: 3, wall: "lateral" },
  // Apex (1)
  { id: 17, label: "Apex", ring: "apex", pos: 0, wall: "apex" },
];

// Wall groups for curve display
const WALL_GROUPS = [
  { key: "anterior", label: "Anterior Wall", color: "#dc2626", segIds: [1, 7, 13] },
  { key: "septal", label: "Septal Wall", color: "#f472b6", segIds: [2, 3, 8, 9, 14] },
  { key: "inferior", label: "Inferior Wall", color: "#fb923c", segIds: [4, 10, 15] },
  { key: "lateral", label: "Lateral Wall", color: "#189aa1", segIds: [5, 6, 11, 12, 16] },
  { key: "apex", label: "Apex", color: "#7c3aed", segIds: [17] },
];

// ─── Strain Color ─────────────────────────────────────────────────────────────

function strainColor(val: number | null): string {
  if (val === null) return "#e5e7eb"; // gray — not entered
  if (val <= -20) return "#dc2626";   // red — normal
  if (val <= -16) return "#f472b6";   // pink — mildly reduced
  if (val <= -12) return "#fbcfe8";   // light pink — moderately reduced
  if (val <= -8)  return "#93c5fd";   // light blue — mod-severely reduced
  return "#1d4ed8";                   // dark blue — severely reduced
}

// ─── Synthetic Strain Waveform Generator ─────────────────────────────────────
// Generates a time-strain curve based on strain value and wall motion score
// Points: 0 = ED, 30 = peak systole, 60 = ES, 80 = early diastole, 100 = ED2

function generateStrainCurve(
  strainVal: number | null,
  wms: number, // 1-5
  segId: number
): { t: number; strain: number }[] {
  const points = 50;
  const result: { t: number; strain: number }[] = [];

  // Effective strain value — if null, use a placeholder based on WMS
  let peak: number;
  if (strainVal !== null) {
    peak = strainVal;
  } else {
    // Estimate from WMS if no strain entered
    const wmsDefaults: Record<number, number> = { 1: -20, 2: -12, 3: -2, 4: 3, 5: 5 };
    peak = wmsDefaults[wms] ?? -20;
  }

  // Waveform shape modifiers by WMS
  // Normal: smooth deep negative curve with post-systolic dip
  // Hypokinetic: shallow negative curve
  // Akinetic: near-flat with slight negative
  // Dyskinetic: positive systolic deflection (paradoxical)
  // Aneurysmal: positive with exaggerated deflection

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 100; // 0–100 normalized time
    let strain = 0;

    if (wms === 1 || wms === 2) {
      // Normal/hypokinetic: sinusoidal negative curve
      // Peak at ~35% of cycle (end-systole)
      const amplitude = Math.abs(peak);
      if (t <= 35) {
        strain = -(amplitude * Math.sin((t / 35) * Math.PI * 0.5));
      } else if (t <= 50) {
        // Post-systolic slight rebound
        const psr = wms === 1 ? amplitude * 0.05 : 0;
        strain = -amplitude + (amplitude + psr) * ((t - 35) / 15);
      } else {
        // Diastolic return to 0
        const midVal = wms === 1 ? amplitude * 0.05 : 0;
        strain = midVal * (1 - (t - 50) / 50);
      }
    } else if (wms === 3) {
      // Akinetic: near-flat, slight negative drift
      strain = peak * 0.15 * Math.sin((t / 100) * Math.PI);
    } else if (wms === 4) {
      // Dyskinetic: positive systolic deflection (paradoxical motion)
      const amp = Math.abs(peak) * 0.6;
      if (t <= 35) {
        strain = amp * Math.sin((t / 35) * Math.PI * 0.5);
      } else {
        strain = amp * (1 - (t - 35) / 65);
      }
    } else {
      // Aneurysmal: exaggerated positive
      const amp = Math.abs(peak) * 0.8;
      if (t <= 40) {
        strain = amp * Math.sin((t / 40) * Math.PI * 0.5);
      } else {
        strain = amp * (1 - (t - 40) / 60);
      }
    }

    result.push({ t: Math.round(t), strain: parseFloat(strain.toFixed(2)) });
  }

  return result;
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

  // Basal ring — 6 segments
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

  // Mid ring — 6 segments
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

  // Apical ring — 4 segments
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

  // Apex segment
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

// ─── Segmental Strain Curves Component ───────────────────────────────────────

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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Build chart data: one point per time step (0–100), one line per wall group
  const chartData = useMemo(() => {
    const timePoints = 51; // 0, 2, 4, ... 100
    const data: Record<string, number | string>[] = [];

    for (let i = 0; i < timePoints; i++) {
      const t = i * 2;
      const row: Record<string, number | string> = { t };

      WALL_GROUPS.forEach(wall => {
        if (!activeWalls.has(wall.key)) return;
        // Average the curves of all segments in this wall group
        const curves = wall.segIds.map(segId => {
          const wms = wallMotionScores[segId] ?? 1;
          const val = segValues[segId] ?? null;
          return generateStrainCurve(val, wms, segId);
        });

        // Average at this time point
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

  // WMSI calculation
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            Segmental Strain Curves
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Time-strain waveforms by wall · Adjusted by wall motion score</p>
        </div>
        {wmsi !== null && (
          <div className="text-center px-3 py-1.5 rounded-lg" style={{ background: wmsiColor + "15", border: `1px solid ${wmsiColor}30` }}>
            <div className="text-xs text-gray-500">WMSI</div>
            <div className="text-lg font-black font-mono" style={{ color: wmsiColor }}>{wmsi}</div>
          </div>
        )}
      </div>

      {/* Wall toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {WALL_GROUPS.map(wall => (
          <button
            key={wall.key}
            onClick={() => toggleWall(wall.key)}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border transition-all"
            style={{
              background: activeWalls.has(wall.key) ? wall.color + "20" : "#f9fafb",
              borderColor: activeWalls.has(wall.key) ? wall.color : "#e5e7eb",
              color: activeWalls.has(wall.key) ? wall.color : "#9ca3af",
            }}
          >
            {wall.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="t"
              tickFormatter={v => v === 0 ? "ED" : v === 35 ? "ES" : v === 100 ? "ED" : ""}
              ticks={[0, 35, 70, 100]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
            />
            <YAxis
              domain={[-30, 10]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              formatter={(val: number, name: string) => [`${val.toFixed(1)}%`, WALL_GROUPS.find(w => w.key === name)?.label ?? name]}
              labelFormatter={t => `Time: ${t}%`}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${BRAND}30` }}
            />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
            <ReferenceLine y={-20} stroke="#dc262640" strokeDasharray="4 2" strokeWidth={1} label={{ value: "Normal", position: "right", fontSize: 8, fill: "#dc2626" }} />
            {WALL_GROUPS.filter(w => activeWalls.has(w.key)).map(wall => (
              <Line
                key={wall.key}
                type="monotone"
                dataKey={wall.key}
                stroke={wall.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Wall motion score inputs per segment */}
      <details className="mt-4">
        <summary className="text-xs font-semibold cursor-pointer flex items-center gap-1" style={{ color: BRAND }}>
          <BarChart3 className="w-3.5 h-3.5" /> Wall Motion Scoring (click to expand)
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SEGMENTS_17.map(seg => {
            const wms = wallMotionScores[seg.id] ?? 1;
            const wallGroup = WALL_GROUPS.find(w => w.segIds.includes(seg.id));
            return (
              <div key={seg.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#f9fafb" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: wallGroup?.color ?? BRAND }} />
                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">{seg.label}</span>
                <select
                  value={wms}
                  onChange={e => {
                    // This is handled by parent — we use a callback
                    const event = new CustomEvent("wms-change", { detail: { segId: seg.id, score: parseInt(e.target.value) } });
                    document.dispatchEvent(event);
                  }}
                  className="text-xs border rounded px-1 py-0.5 flex-shrink-0"
                  style={{ borderColor: BRAND + "40", color: wms > 1 ? "#dc2626" : "#15803d" }}
                >
                  {Object.entries(WMS_LABELS).map(([score, label]) => (
                    <option key={score} value={score}>{score} — {label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        {wmsi !== null && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-3" style={{ background: wmsiColor + "10", border: `1px solid ${wmsiColor}30` }}>
            <div>
              <div className="text-xs text-gray-500">Wall Motion Score Index (WMSI)</div>
              <div className="text-xl font-black font-mono" style={{ color: wmsiColor }}>{wmsi}</div>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {parseFloat(wmsi) <= 1.0 ? "Normal wall motion — no regional abnormalities scored" :
               parseFloat(wmsi) <= 1.5 ? "Mild-moderate wall motion abnormality — correlate with ischemia workup" :
               "Significant wall motion abnormality — consider ischemia, cardiomyopathy, or acute MI"}
            </div>
          </div>
        )}
      </details>
    </div>
  );
}

// ─── Save to Case Modal ───────────────────────────────────────────────────────

function SaveToCaseModal({
  onClose,
  segValues,
  wallMotionScores,
  lvGls,
  rvStrain,
  laReservoir,
  wmsi,
  vendor,
  frameRate,
}: {
  onClose: () => void;
  segValues: Record<number, number | null>;
  wallMotionScores: Record<number, number>;
  lvGls: string;
  rvStrain: string;
  laReservoir: string;
  wmsi: string | null;
  vendor: string;
  frameRate: string;
}) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: cases, isLoading: casesLoading } = trpc.strain.listMyCases.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const saveSnapshot = trpc.strain.saveSnapshot.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Saved to Case — Strain snapshot attached successfully.");
      setTimeout(onClose, 1500);
    },
    onError: (err: { message: string }) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const createCaseAndSave = trpc.strain.createCaseAndSaveSnapshot.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Case Created & Saved — New case created with strain snapshot.");
      setTimeout(onClose, 1500);
    },
    onError: (err: { message: string }) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  function handleSave() {
    const snapshotData = {
      segmentValues: JSON.stringify(segValues),
      wallMotionScores: JSON.stringify(wallMotionScores),
      lvGls: lvGls || null,
      rvStrain: rvStrain || null,
      laStrain: laReservoir || null,
      wmsi: wmsi || null,
      vendor: vendor || null,
      frameRate: frameRate ? parseInt(frameRate) : null,
      notes: notes || null,
    };

    if (mode === "new") {
      if (!newCaseTitle.trim()) return;
      createCaseAndSave.mutate({ caseTitle: newCaseTitle.trim(), ...snapshotData });
    } else {
      saveSnapshot.mutate({ caseId: selectedCaseId ?? undefined, ...snapshotData });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Save to Case</h3>
            <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <p className="text-sm text-gray-600 mb-4">You need to be signed in to save strain snapshots to a case.</p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: BRAND }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND + "20" }}>
              <Save className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Save to Case</h3>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12" style={{ color: "#15803d" }} />
            <p className="font-semibold text-gray-700">Snapshot saved successfully!</p>
          </div>
        ) : (
          <>
            {/* Snapshot preview */}
            <div className="rounded-lg p-3 mb-4" style={{ background: "#f0fbfc", border: `1px solid ${BRAND}30` }}>
              <div className="text-xs font-semibold mb-2" style={{ color: BRAND }}>Snapshot Preview</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-gray-500">LV GLS:</span> <span className="font-mono font-bold text-gray-700">{lvGls || "—"}%</span></div>
                <div><span className="text-gray-500">RV Strain:</span> <span className="font-mono font-bold text-gray-700">{rvStrain || "—"}%</span></div>
                <div><span className="text-gray-500">LA Strain:</span> <span className="font-mono font-bold text-gray-700">{laReservoir || "—"}%</span></div>
                <div><span className="text-gray-500">WMSI:</span> <span className="font-mono font-bold text-gray-700">{wmsi || "—"}</span></div>
                <div><span className="text-gray-500">Vendor:</span> <span className="font-bold text-gray-700">{vendor || "—"}</span></div>
                <div><span className="text-gray-500">Segments:</span> <span className="font-bold text-gray-700">{Object.values(segValues).filter(v => v !== null).length}/17</span></div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden border mb-4" style={{ borderColor: BRAND + "40" }}>
              <button
                onClick={() => setMode("pick")}
                className="flex-1 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: mode === "pick" ? BRAND : "white",
                  color: mode === "pick" ? "white" : BRAND,
                }}
              >
                Attach to Existing Case
              </button>
              <button
                onClick={() => setMode("new")}
                className="flex-1 py-2 text-xs font-semibold transition-colors"
                style={{
                  background: mode === "new" ? BRAND : "white",
                  color: mode === "new" ? "white" : BRAND,
                }}
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Create New Case
              </button>
            </div>

            {mode === "pick" && (
              <div className="mb-4">
                {casesLoading ? (
                  <div className="text-xs text-gray-400 py-2">Loading cases...</div>
                ) : cases && cases.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {cases.map((c: { id: number; title: string; createdAt: Date }) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCaseId(c.id)}
                        className="w-full text-left p-2.5 rounded-lg border text-xs transition-all"
                        style={{
                          borderColor: selectedCaseId === c.id ? BRAND : "#e5e7eb",
                          background: selectedCaseId === c.id ? BRAND + "10" : "white",
                          color: "#374151",
                        }}
                      >
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 py-2 text-center">
                    No cases yet. Create a new case to get started.
                  </div>
                )}
              </div>
            )}

            {mode === "new" && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Case Title *</label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={e => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. 65M with DCM, EF 30%"
                  className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 outline-none"
                  style={{ borderColor: BRAND + "60" }}
                />
              </div>
            )}

            {/* Notes */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Clinical Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Ischemic pattern, LAD territory, pre-chemo baseline..."
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 outline-none resize-none"
                style={{ borderColor: BRAND + "40" }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                style={{ borderColor: BRAND + "40", color: BRAND }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveSnapshot.isPending || createCaseAndSave.isPending || (mode === "new" && !newCaseTitle.trim())}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {saveSnapshot.isPending || createCaseAndSave.isPending ? "Saving..." : "Save Snapshot"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Numeric Input ────────────────────────────────────────────────────────────

function NumInput({ label, value, onChange, unit, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="flex items-center gap-1 bg-white border rounded-lg px-3 py-2" style={{ borderColor: "#189aa1" + "40" }}>
        <input
          type="number" step="0.1"
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? ""}
          className="flex-1 bg-transparent text-sm font-mono text-gray-800 outline-none min-w-0"
        />
        {unit && <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>}
      </div>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children, defaultOpen = true }: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3 flex items-center justify-between text-left"
        style={{ background: `linear-gradient(90deg, ${BRAND_DARK}, ${BRAND})` }}
      >
        <div>
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>{title}</h3>
          {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/70 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/70 flex-shrink-0" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ─── Result Box ───────────────────────────────────────────────────────────────

function ResultBox({ label, value, normal, unit, interpretation }: {
  label: string; value: string; normal: string; unit: string; interpretation: string;
}) {
  const numVal = parseFloat(value);
  const isGood = !isNaN(numVal);
  return (
    <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: "#189aa1" + "30" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#189aa1" }}>{label}</span>
        <span className="text-xs text-gray-400">nl: {normal} {unit}</span>
      </div>
      {isGood ? (
        <>
          <div className="text-2xl font-black font-mono" style={{ color: BRAND }}>{value} {unit}</div>
          <div className="text-xs text-gray-600 mt-1">{interpretation}</div>
        </>
      ) : (
        <div className="text-sm text-gray-400 italic">Enter value above</div>
      )}
    </div>
  );
}

// ─── LV GLS Interpretation ────────────────────────────────────────────────────

function interpretLvGls(val: number): { severity: string; color: string; suggests: string; note: string; tip: string } {
  if (val <= -20) return {
    severity: "Normal LV GLS",
    color: "#15803d",
    suggests: `EchoAssist™ Suggests: LV Global Longitudinal Strain is within normal limits (${val.toFixed(1)}%). Normal LV GLS is ≤ −20% by ASE/EACVI 2022 reference values. Subclinical LV dysfunction is not suggested by this value alone.`,
    note: `EchoAssist™ Note: LV GLS is a sensitive marker of subclinical LV dysfunction and may be abnormal before EF declines. Ensure adequate frame rate (≥40 fps), consistent endocardial tracking, and vendor-specific reference ranges are applied.`,
    tip: `EchoAssist™ Tip: LV GLS is particularly valuable in chemotherapy monitoring (cardio-oncology), pre-operative risk stratification, and early detection of cardiomyopathy before EF falls below 50%.`,
  };
  if (val <= -16) return {
    severity: "Mildly Reduced LV GLS",
    color: "#ca8a04",
    suggests: `EchoAssist™ Suggests: LV Global Longitudinal Strain is mildly reduced (${val.toFixed(1)}%). Values between −16% and −20% suggest early or subclinical LV systolic dysfunction. EF may still be preserved. Clinical correlation with wall motion, EF, and diastolic parameters is recommended.`,
    note: `EchoAssist™ Note: A relative reduction in LV GLS of >15% from baseline is considered clinically significant in cardio-oncology surveillance (ESMO/ASE 2022). Repeat strain imaging in 3–6 months if cardiotoxic therapy is ongoing.`,
    tip: `EchoAssist™ Tip: Mildly reduced GLS with preserved EF is the hallmark of Stage B heart failure (structural disease without symptoms). Consider NT-proBNP and clinical risk factor assessment.`,
  };
  if (val <= -12) return {
    severity: "Moderately Reduced LV GLS",
    color: "#ea580c",
    suggests: `EchoAssist™ Suggests: LV Global Longitudinal Strain is moderately reduced (${val.toFixed(1)}%). Values between −12% and −16% indicate significant longitudinal dysfunction. This range is commonly seen in dilated cardiomyopathy, ischemic disease, and advanced Stage B/C HFpEF.`,
    note: `EchoAssist™ Note: Segmental strain analysis (bull's-eye) should be reviewed for regional patterns. Ischemic patterns show basal-dominant reduction; non-ischemic patterns tend to be diffuse or apical-sparing.`,
    tip: `EchoAssist™ Tip: Apical-sparing strain pattern (normal apical segments with reduced basal/mid segments) is a hallmark of cardiac amyloidosis and should prompt further evaluation with T1 mapping or nuclear imaging.`,
  };
  return {
    severity: "Severely Reduced LV GLS",
    color: "#dc2626",
    suggests: `EchoAssist™ Suggests: LV Global Longitudinal Strain is severely reduced (${val.toFixed(1)}%). Values > −12% indicate severe longitudinal dysfunction, typically associated with EF < 40%, advanced cardiomyopathy, or acute myocardial injury. Urgent clinical evaluation is warranted.`,
    note: `EchoAssist™ Note: At this severity, LV GLS provides incremental prognostic value beyond EF. Severely reduced GLS is independently associated with adverse cardiovascular events, heart failure hospitalization, and mortality.`,
    tip: `EchoAssist™ Tip: In acute settings (STEMI, myocarditis, Takotsubo), severely reduced GLS may be transient. Serial imaging at 3 months is recommended to assess recovery and guide therapy decisions.`,
  };
}

function interpretRvStrain(val: number): { severity: string; color: string; suggests: string } {
  if (val <= -29) return { severity: "Normal RV Free-Wall Strain", color: "#15803d", suggests: `EchoAssist™ Suggests: RV free-wall strain is normal (${val.toFixed(1)}%). Normal threshold is ≤ −29% (ASE/EACVI 2022). RV longitudinal function is preserved.` };
  if (val <= -20) return { severity: "Mildly Reduced RV Strain", color: "#ca8a04", suggests: `EchoAssist™ Suggests: RV free-wall strain is mildly reduced (${val.toFixed(1)}%). Values between −20% and −29% suggest early RV dysfunction. Correlate with TAPSE, S', FAC, and PA pressure.` };
  return { severity: "Significantly Reduced RV Strain", color: "#dc2626", suggests: `EchoAssist™ Suggests: RV free-wall strain is significantly reduced (${val.toFixed(1)}%). Values > −20% indicate significant RV dysfunction. Evaluate for pulmonary hypertension, RV pressure/volume overload, and RVMI.` };
}

function interpretLaStrain(val: number): { severity: string; color: string; suggests: string } {
  if (val >= 38) return { severity: "Normal LA Reservoir Strain", color: "#15803d", suggests: `EchoAssist™ Suggests: LA reservoir strain is normal (${val.toFixed(1)}%). Normal threshold is ≥ 38% (ASE/EACVI 2022). LA mechanical function is preserved.` };
  if (val >= 25) return { severity: "Mildly Reduced LA Strain", color: "#ca8a04", suggests: `EchoAssist™ Suggests: LA reservoir strain is mildly reduced (${val.toFixed(1)}%). Values between 25–38% suggest early LA dysfunction, often seen in Grade I–II diastolic dysfunction, atrial fibrillation risk, and hypertensive heart disease.` };
  return { severity: "Significantly Reduced LA Strain", color: "#dc2626", suggests: `EchoAssist™ Suggests: LA reservoir strain is significantly reduced (${val.toFixed(1)}%). Values < 25% indicate significant LA dysfunction, associated with Grade III diastolic dysfunction, elevated LA pressure, and high risk of AF and HF hospitalization.` };
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function StrainNavigator() {
  // LV GLS — global and segmental
  const [lvGls, setLvGls] = useState("");
  const [segValues, setSegValues] = useState<Record<number, number | null>>({});
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [segInput, setSegInput] = useState("");

  // Wall motion scores per segment (default 1 = normal)
  const [wallMotionScores, setWallMotionScores] = useState<Record<number, number>>({});

  // RV Strain
  const [rvStrain, setRvStrain] = useState("");

  // LA Strain
  const [laReservoir, setLaReservoir] = useState("");
  const [laConduit, setLaConduit] = useState("");
  const [laBooster, setLaBooster] = useState("");

  // Vendor / technique
  const [vendor, setVendor] = useState("");
  const [frameRate, setFrameRate] = useState("");

  // Save to Case modal
  const [showSaveModal, setShowSaveModal] = useState(false);

  const lvGlsNum = parseFloat(lvGls);
  const rvStrainNum = parseFloat(rvStrain);
  const laReservoirNum = parseFloat(laReservoir);

  const lvInterp = !isNaN(lvGlsNum) ? interpretLvGls(lvGlsNum) : null;
  const rvInterp = !isNaN(rvStrainNum) ? interpretRvStrain(rvStrainNum) : null;
  const laInterp = !isNaN(laReservoirNum) ? interpretLaStrain(laReservoirNum) : null;

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

  // Segmental GLS average
  const enteredSegs = Object.values(segValues).filter(v => v !== null) as number[];
  const segAvg = enteredSegs.length > 0
    ? (enteredSegs.reduce((a, b) => a + b, 0) / enteredSegs.length).toFixed(1)
    : null;

  // WMSI
  const scoredSegs = SEGMENTS_17.filter(s => wallMotionScores[s.id] !== undefined);
  const wmsi = scoredSegs.length > 0
    ? (scoredSegs.reduce((sum, s) => sum + (wallMotionScores[s.id] ?? 1), 0) / scoredSegs.length).toFixed(2)
    : null;

  function handleSegSelect(id: number) {
    setSelectedSeg(id);
    setSegInput(segValues[id] !== null && segValues[id] !== undefined ? String(segValues[id]) : "");
  }

  function handleSegInputChange(v: string) {
    setSegInput(v);
    const num = parseFloat(v);
    if (selectedSeg !== null) {
      setSegValues(prev => ({ ...prev, [selectedSeg]: isNaN(num) ? null : num }));
    }
  }

  function clearAllSegments() {
    setSegValues({});
    setSelectedSeg(null);
    setSegInput("");
    setWallMotionScores({});
  }

  // Listen for wall motion score changes from the SegmentalStrainCurves component
  useMemo(() => {
    const handler = (e: Event) => {
      const { segId, score } = (e as CustomEvent).detail;
      setWallMotionScores(prev => ({ ...prev, [segId]: score }));
    };
    document.addEventListener("wms-change", handler);
    return () => document.removeEventListener("wms-change", handler);
  }, []);

  const selectedSegLabel = selectedSeg !== null
    ? SEGMENTS_17.find(s => s.id === selectedSeg)?.label ?? ""
    : "";

  // Color legend
  const legend = [
    { color: "#dc2626", label: "Normal (≤ −20%)" },
    { color: "#f472b6", label: "Mildly reduced (−16 to −20%)" },
    { color: "#fbcfe8", label: "Moderately reduced (−12 to −16%)" },
    { color: "#93c5fd", label: "Mod-severely reduced (−8 to −12%)" },
    { color: "#1d4ed8", label: "Severely reduced (> −8%)" },
    { color: "#e5e7eb", label: "Not entered" },
  ];

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})` }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              Strain Navigator™
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              LV GLS · RV Free-Wall Strain · LA Reservoir Strain · Segmental Bull's-Eye · Wall Motion Scoring · ASE/EACVI 2022
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: BRAND }}
            >
              <Save className="w-3.5 h-3.5" />
              Save to Case
            </button>
            <a href="https://www.asecho.org/guideline/guidelines-for-cardiac-chamber-quantification/"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
              style={{ color: BRAND, borderColor: BRAND + "40", background: BRAND + "10" }}>
              <ExternalLink className="w-3.5 h-3.5" />
              ASE Guidelines
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Clinical Disclaimer:</strong> Strain values are vendor-specific. Reference ranges are based on ASE/EACVI 2022 recommendations for vendor-neutral GLS (−20 ± 2%). Always apply vendor-specific normal ranges and correlate with clinical context. Strain Navigator™ is a clinical decision support tool, not a substitute for physician interpretation.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column — inputs */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* LV GLS Global */}
            <SectionCard title="LV Global Longitudinal Strain (GLS)" subtitle="Global value · ASE/EACVI 2022 · Vendor-neutral reference ≤ −20%">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <NumInput label="LV GLS" value={lvGls} onChange={setLvGls} unit="%" placeholder="e.g. −19.5" hint="Normal ≤ −20%" />
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Vendor / Platform</label>
                  <select value={vendor} onChange={e => setVendor(e.target.value)}
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-gray-700" style={{ borderColor: "#189aa1" + "40" }}>
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
            </SectionCard>

            {/* RV Free-Wall Strain */}
            <SectionCard title="RV Free-Wall Strain" subtitle="3-segment free-wall average · Normal ≤ −29% · ASE/EACVI 2022">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <NumInput label="RV Free-Wall Strain" value={rvStrain} onChange={setRvStrain} unit="%" placeholder="e.g. −28.0" hint="Normal ≤ −29%" />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-700">Measurement tip:</strong> RV free-wall strain is the average of the 3 free-wall segments (basal, mid, apical) from the RV-focused apical 4-chamber view. Avoid including the septum (use 3-segment, not 6-segment).
                </div>
              </div>
              {rvInterp && (
                <div className="rounded-lg p-4" style={{ background: rvInterp.color + "18", borderLeft: `4px solid ${rvInterp.color}` }}>
                  <div className="font-bold text-sm mb-1" style={{ color: rvInterp.color }}>{rvInterp.severity}</div>
                  <p className="text-xs text-gray-700 leading-relaxed">{rvInterp.suggests}</p>
                </div>
              )}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: BRAND + "15" }}>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Parameter</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Normal</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Clinical Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["RV Free-Wall Strain", "≤ −29%", "Pulmonary HTN, RVMI, RV failure"],
                      ["RV Global Strain (6-seg)", "≤ −24%", "Includes septum — less specific for RV"],
                      ["TAPSE (complementary)", "≥ 17 mm", "Longitudinal displacement — quick screen"],
                      ["RV S' (TDI)", "≥ 9.5 cm/s", "Tissue Doppler — angle-dependent"],
                    ].map(([p, n, c]) => (
                      <tr key={p} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-700 font-medium">{p}</td>
                        <td className="px-3 py-2 text-gray-600 font-mono">{n}</td>
                        <td className="px-3 py-2 text-gray-500">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* LA Strain */}
            <SectionCard title="LA Strain" subtitle="Reservoir · Conduit · Booster (pump) · Normal reservoir ≥ 38%">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <NumInput label="LA Reservoir Strain" value={laReservoir} onChange={setLaReservoir} unit="%" placeholder="nl ≥ 38" hint="Systolic phase" />
                <NumInput label="LA Conduit Strain" value={laConduit} onChange={setLaConduit} unit="%" placeholder="nl ~24%" hint="Early diastolic phase" />
                <NumInput label="LA Booster (Pump) Strain" value={laBooster} onChange={setLaBooster} unit="%" placeholder="nl ~14%" hint="Late diastolic / atrial kick" />
              </div>
              {laInterp && (
                <div className="rounded-lg p-4 mb-4" style={{ background: laInterp.color + "18", borderLeft: `4px solid ${laInterp.color}` }}>
                  <div className="font-bold text-sm mb-1" style={{ color: laInterp.color }}>{laInterp.severity}</div>
                  <p className="text-xs text-gray-700 leading-relaxed">{laInterp.suggests}</p>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                <strong>LA Strain Phases:</strong> Reservoir = total LA deformation during LV systole (most clinically used). Conduit = passive emptying during early diastole. Booster (pump) = active emptying during atrial contraction. Reservoir strain is the most reproducible and prognostically validated parameter.
              </div>
            </SectionCard>

            {/* RAS Calculator */}
            <SectionCard title="Relative Apical Strain (RAS) Calculator" subtitle="Apical-sparing pattern · Amyloidosis vs. HCM · RAS = |Apical GLS| / (|Basal GLS| + |Mid GLS|)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <NumInput label="Apical GLS (average)" value={rasApical} onChange={setRasApical} unit="%" placeholder="e.g. −19.5" hint="Apical 4 segments avg" />
                <NumInput label="Basal GLS (average)" value={rasBasal} onChange={setRasBasal} unit="%" placeholder="e.g. −12.0" hint="Basal 6 segments avg" />
                <NumInput label="Mid GLS (average)" value={rasMid} onChange={setRasMid} unit="%" placeholder="e.g. −14.0" hint="Mid 6 segments avg" />
              </div>

              {rasValue !== null && (
                <div className="rounded-lg p-3 mb-3 flex items-center gap-3" style={{ background: "#f0fbfc", border: `1px solid ${BRAND}40` }}>
                  <div className="text-3xl font-black font-mono" style={{ color: BRAND }}>{rasValue.toFixed(2)}</div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">RAS Value</div>
                    <div className="text-xs text-gray-600">Threshold: &gt; 1.0 = apical-sparing pattern</div>
                  </div>
                </div>
              )}

              {rasInterpretation && (
                <div className="rounded-lg p-4" style={{ background: rasInterpretation.color + "18", borderLeft: `4px solid ${rasInterpretation.color}` }}>
                  <div className="font-bold text-sm mb-2" style={{ color: rasInterpretation.color }}>{rasInterpretation.label}</div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">{rasInterpretation.text}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{rasInterpretation.note}</p>
                  <p className="text-xs text-gray-500 leading-relaxed italic">{rasInterpretation.tip}</p>
                </div>
              )}

              {rasValue === null && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                  <strong>How to use:</strong> Enter the average strain values for the apical segments (segments 13–17), basal segments (1–6), and mid segments (7–12) from the bull's-eye display above. RAS &gt; 1.0 indicates an apical-sparing pattern, which is a hallmark of cardiac amyloidosis.
                </div>
              )}
            </SectionCard>

            {/* Clinical Applications */}
            <SectionCard title="Clinical Applications of Strain Imaging" subtitle="Cardio-oncology · Cardiomyopathy · Diastolic dysfunction · Amyloidosis" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Cardio-Oncology (CTRCD Monitoring)", content: "A relative reduction in LV GLS of >15% from baseline is considered a subclinical sign of cancer therapy-related cardiac dysfunction (CTRCD) per ASE/ESMO 2022. Serial strain imaging every 3 months during cardiotoxic therapy is recommended. GLS decline precedes EF decline by weeks to months.", color: "#7c3aed" },
                  { title: "Cardiac Amyloidosis", content: "Apical-sparing strain pattern (normal apical GLS with reduced basal/mid segments) is a hallmark of cardiac amyloidosis (sensitivity ~80%, specificity ~80% vs. HCM). Relative Apical Strain (RAS) = apical / (basal + mid) > 1 is the diagnostic threshold.", color: "#dc2626" },
                  { title: "HFpEF and Diastolic Dysfunction", content: "LA reservoir strain < 23% is associated with elevated LV filling pressures (E/e′ > 14) and predicts HF hospitalization. LV GLS is often mildly reduced (−16 to −19%) in HFpEF despite preserved EF. Combined GLS + LA strain improves diastolic grading accuracy.", color: BRAND },
                  { title: "Hypertrophic Cardiomyopathy (HCM)", content: "LV GLS is typically reduced in HCM despite hyperdynamic EF. Basal septal strain is most affected. Strain helps differentiate HCM from athlete's heart (athletes have normal or supranormal GLS). RV strain may be reduced in obstructive HCM.", color: "#0284c7" },
                  { title: "Ischemic Heart Disease", content: "Regional strain abnormalities follow coronary territory distributions. Basal inferior/inferolateral reduction suggests RCA/LCx territory. Anterior/anteroseptal reduction suggests LAD territory. Strain is more sensitive than wall motion scoring for detecting subendocardial ischemia.", color: "#b45309" },
                  { title: "Peripartum Cardiomyopathy", content: "LV GLS is often reduced before EF declines in peripartum cardiomyopathy. GLS < −17% at diagnosis is associated with worse recovery. Serial strain imaging at 1, 3, and 6 months postpartum guides therapy and timing of medication discontinuation.", color: "#be185d" },
                ].map(({ title, content, color }) => (
                  <div key={title} className="rounded-lg p-4 border-l-4" style={{ background: color + "0d", borderLeftColor: color }}>
                    <h4 className="font-bold text-xs mb-2" style={{ color }}>{title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* References */}
            <SectionCard title="References & Guidelines" subtitle="ASE · EACVI · ESC · Cardio-Oncology" defaultOpen={false}>
              <div className="space-y-2">
                {[
                  { ref: "Lang RM et al. Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults. JASE 2015;28:1–39.", url: "https://www.asecho.org/guideline/guidelines-for-cardiac-chamber-quantification/" },
                  { ref: "Marwick TH et al. Recommendations on the Use of Echocardiography in Adult Hypertension. JASE 2015;28:727–54.", url: "https://www.asecho.org" },
                  { ref: "Plana JC et al. Expert Consensus for Multimodality Imaging Evaluation of Adult Patients during and after Cancer Therapy (Cardio-Oncology). JASE 2014;27:911–39.", url: "https://www.asecho.org" },
                  { ref: "Smiseth OA et al. Myocardial strain imaging: how useful is it in clinical decision making? Eur Heart J 2016;37:1196–207.", url: "https://academic.oup.com/eurheartj" },
                  { ref: "Nagueh SF et al. Recommendations for the Evaluation of Left Ventricular Diastolic Function by Echocardiography. JASE 2016;29:277–314.", url: "https://www.asecho.org/guideline/diastolic-dysfunction/" },
                  { ref: "Badano LP et al. Recommendations for the Use of Cardiac Imaging to Assess and Follow Patients with Hypertrophic Cardiomyopathy. Eur Heart J Cardiovasc Imaging 2023.", url: "https://academic.oup.com/ehjcimaging" },
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

          {/* Right column — Bull's Eye + Curves + Summary */}
          <div className="flex flex-col gap-5">

            {/* Bull's Eye */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                  17-Segment Bull's-Eye
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="sm:hidden text-xs font-semibold px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    style={{ color: "white", background: BRAND }}
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button onClick={clearAllSegments}
                    className="text-xs font-semibold px-2 py-0.5 rounded transition-colors"
                    style={{ color: "#189aa1", background: "#189aa1" + "15" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dc262618"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#189aa1" + "15"; (e.currentTarget as HTMLButtonElement).style.color = "#189aa1"; }}>
                    Clear all
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">Click a segment to enter its strain value. Outer ring = basal, inner ring = apical.</p>

              <BullsEye values={segValues} onSelect={handleSegSelect} selected={selectedSeg} />

              {selectedSeg !== null && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    {selectedSegLabel} Strain (%)
                  </label>
                  <input
                    type="number" step="0.1"
                    value={segInput}
                    onChange={e => handleSegInputChange(e.target.value)}
                    placeholder="e.g. −18.5"
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm font-mono text-gray-800 outline-none"
                    style={{ borderColor: "#189aa1" + "60" }}
                    autoFocus
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
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color, border: "1px solid #e5e7eb" }} />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Segmental Strain Curves — below bull's-eye */}
            <SegmentalStrainCurves
              segValues={segValues}
              wallMotionScores={wallMotionScores}
            />

            {/* Summary Panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                Strain Summary
              </h3>
              <div className="space-y-3">
                <ResultBox label="LV GLS" value={lvGls} normal="≤ −20" unit="%" interpretation={lvInterp?.severity ?? ""} />
                <ResultBox label="RV Free-Wall Strain" value={rvStrain} normal="≤ −29" unit="%" interpretation={rvInterp?.severity ?? ""} />
                <ResultBox label="LA Reservoir Strain" value={laReservoir} normal="≥ 38" unit="%" interpretation={laInterp?.severity ?? ""} />
                {segAvg !== null && (
                  <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: "#189aa1" + "30" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#189aa1" }}>Segmental Avg GLS</span>
                      <span className="text-xs text-gray-400">{enteredSegs.length}/17 segs</span>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: BRAND }}>{segAvg}%</div>
                  </div>
                )}
                {wmsi !== null && (
                  <div className="rounded-lg p-4 border" style={{ background: "#f0fbfc", borderColor: "#189aa1" + "30" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#189aa1" }}>WMSI</span>
                      <span className="text-xs text-gray-400">{scoredSegs.length} segs scored</span>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: parseFloat(wmsi) <= 1.0 ? "#15803d" : parseFloat(wmsi) <= 1.5 ? "#ca8a04" : "#dc2626" }}>{wmsi}</div>
                    <div className="text-xs text-gray-500 mt-1">Normal = 1.0 · Abnormal &gt; 1.0</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-800 mb-3" style={{ fontFamily: "Merriweather, serif" }}>
                Quick Reference
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  ["LV GLS Normal", "≤ −20%"],
                  ["LV GLS Mildly Reduced", "−16 to −20%"],
                  ["LV GLS Mod. Reduced", "−12 to −16%"],
                  ["LV GLS Severely Reduced", "> −12%"],
                  ["RV FW Strain Normal", "≤ −29%"],
                  ["RV FW Strain Reduced", "> −20%"],
                  ["LA Reservoir Normal", "≥ 38%"],
                  ["LA Reservoir Reduced", "< 25%"],
                  ["CTRCD Threshold (relative)", ">15% drop from baseline"],
                  ["Apical Sparing RAS", "> 1.0"],
                  ["WMSI Normal", "1.0"],
                  ["WMSI Abnormal", "> 1.0"],
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

      {/* Save to Case Modal */}
      {showSaveModal && (
        <SaveToCaseModal
          onClose={() => setShowSaveModal(false)}
          segValues={segValues}
          wallMotionScores={wallMotionScores}
          lvGls={lvGls}
          rvStrain={rvStrain}
          laReservoir={laReservoir}
          wmsi={wmsi}
          vendor={vendor}
          frameRate={frameRate}
        />
      )}
    </Layout>
  );
}
