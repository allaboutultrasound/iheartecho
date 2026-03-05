/*
  Strain Navigator™ — iHeartEcho
  LV GLS · RV Free-Wall Strain · LA Reservoir Strain
  Bull's-eye segmental display · ASE/EACVI 2022 reference values
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import {
  Activity, ChevronDown, ChevronUp, Info, AlertCircle, CheckCircle,
  TrendingDown, Zap, BookOpen, ExternalLink, BarChart3
} from "lucide-react";

const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";

// ─── Reference Values (ASE/EACVI 2022) ──────────────────────────────────────

const LV_GLS_NORMAL = -20; // ≤ -20% normal
const LV_GLS_MILDLY_REDUCED = -16; // -16 to -20 mildly reduced
const LV_GLS_MODERATELY_REDUCED = -12; // -12 to -16 moderately reduced
// < -12 severely reduced

const RV_STRAIN_NORMAL = -29; // ≤ -29% normal (free-wall)
const LA_RESERVOIR_NORMAL = 38; // ≥ 38% normal reservoir strain

// ─── Segment Labels ──────────────────────────────────────────────────────────

const SEGMENTS_17 = [
  // Basal (6)
  { id: 1, label: "Basal Anterior", ring: "basal", pos: 0 },
  { id: 2, label: "Basal Anteroseptal", ring: "basal", pos: 1 },
  { id: 3, label: "Basal Inferoseptal", ring: "basal", pos: 2 },
  { id: 4, label: "Basal Inferior", ring: "basal", pos: 3 },
  { id: 5, label: "Basal Inferolateral", ring: "basal", pos: 4 },
  { id: 6, label: "Basal Anterolateral", ring: "basal", pos: 5 },
  // Mid (6)
  { id: 7, label: "Mid Anterior", ring: "mid", pos: 0 },
  { id: 8, label: "Mid Anteroseptal", ring: "mid", pos: 1 },
  { id: 9, label: "Mid Inferoseptal", ring: "mid", pos: 2 },
  { id: 10, label: "Mid Inferior", ring: "mid", pos: 3 },
  { id: 11, label: "Mid Inferolateral", ring: "mid", pos: 4 },
  { id: 12, label: "Mid Anterolateral", ring: "mid", pos: 5 },
  // Apical (4)
  { id: 13, label: "Apical Anterior", ring: "apical", pos: 0 },
  { id: 14, label: "Apical Septal", ring: "apical", pos: 1 },
  { id: 15, label: "Apical Inferior", ring: "apical", pos: 2 },
  { id: 16, label: "Apical Lateral", ring: "apical", pos: 3 },
  // Apex (1)
  { id: 17, label: "Apex", ring: "apex", pos: 0 },
];

function strainColor(val: number | null): string {
  if (val === null) return "#e5e7eb"; // gray — not entered
  if (val <= -20) return "#15803d"; // dark green — normal
  if (val <= -16) return "#86efac"; // light green — mildly reduced
  if (val <= -12) return "#fbbf24"; // amber — moderately reduced
  if (val <= -8) return "#f97316"; // orange — severely reduced
  return "#dc2626"; // red — critically reduced
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
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);
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
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);
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
    const x1 = cx + r1 * Math.cos(startAngle);
    const y1 = cy + r1 * Math.sin(startAngle);
    const x2 = cx + r2 * Math.cos(startAngle);
    const y2 = cy + r2 * Math.sin(startAngle);
    const x3 = cx + r2 * Math.cos(endAngle);
    const y3 = cy + r2 * Math.sin(endAngle);
    const x4 = cx + r1 * Math.cos(endAngle);
    const y4 = cy + r1 * Math.sin(endAngle);
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
      {/* Labels */}
      <text x="160" y="22" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">Anterior</text>
      <text x="160" y="308" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">Inferior</text>
      <text x="18" y="165" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600" transform="rotate(-90,18,165)">Lateral</text>
      <text x="302" y="165" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600" transform="rotate(90,302,165)">Septal</text>
    </svg>
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
      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
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
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
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

  // RV Strain
  const [rvStrain, setRvStrain] = useState("");

  // LA Strain
  const [laReservoir, setLaReservoir] = useState("");
  const [laConduit, setLaConduit] = useState("");
  const [laBooster, setLaBooster] = useState("");

  // Vendor / technique
  const [vendor, setVendor] = useState("");
  const [frameRate, setFrameRate] = useState("");

  const lvGlsNum = parseFloat(lvGls);
  const rvStrainNum = parseFloat(rvStrain);
  const laReservoirNum = parseFloat(laReservoir);

  const lvInterp = !isNaN(lvGlsNum) ? interpretLvGls(lvGlsNum) : null;
  const rvInterp = !isNaN(rvStrainNum) ? interpretRvStrain(rvStrainNum) : null;
  const laInterp = !isNaN(laReservoirNum) ? interpretLaStrain(laReservoirNum) : null;

  // Segmental GLS average
  const enteredSegs = Object.values(segValues).filter(v => v !== null) as number[];
  const segAvg = enteredSegs.length > 0
    ? (enteredSegs.reduce((a, b) => a + b, 0) / enteredSegs.length).toFixed(1)
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
  }

  const selectedSegLabel = selectedSeg !== null
    ? SEGMENTS_17.find(s => s.id === selectedSeg)?.label ?? ""
    : "";

  // Color legend
  const legend = [
    { color: "#15803d", label: "Normal (≤ −20%)" },
    { color: "#86efac", label: "Mildly reduced (−16 to −20%)" },
    { color: "#fbbf24", label: "Moderately reduced (−12 to −16%)" },
    { color: "#f97316", label: "Severely reduced (−8 to −12%)" },
    { color: "#dc2626", label: "Critically reduced (> −8%)" },
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
              LV GLS · RV Free-Wall Strain · LA Reservoir Strain · Segmental Bull's-Eye · ASE/EACVI 2022
            </p>
          </div>
          <a href="https://www.asecho.org/guideline/guidelines-for-cardiac-chamber-quantification/"
            target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border"
            style={{ color: BRAND, borderColor: BRAND + "40", background: BRAND + "10" }}>
            <ExternalLink className="w-3.5 h-3.5" />
            ASE Guidelines
          </a>
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                    <option value="">Select vendor</option>
                    <option>GE HealthCare</option>
                    <option>Philips</option>
                    <option>Siemens Healthineers</option>
                    <option>Canon Medical</option>
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

            {/* Clinical Applications */}
            <SectionCard title="Clinical Applications of Strain Imaging" subtitle="Cardio-oncology · Cardiomyopathy · Diastolic dysfunction · Amyloidosis" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Cardio-Oncology (CTRCD Monitoring)",
                    content: "A relative reduction in LV GLS of >15% from baseline is considered a subclinical sign of cancer therapy-related cardiac dysfunction (CTRCD) per ASE/ESMO 2022. Serial strain imaging every 3 months during cardiotoxic therapy is recommended. GLS decline precedes EF decline by weeks to months.",
                    color: "#7c3aed",
                  },
                  {
                    title: "Cardiac Amyloidosis",
                    content: "Apical-sparing strain pattern (normal apical GLS with reduced basal/mid segments) is a hallmark of cardiac amyloidosis (sensitivity ~80%, specificity ~80% vs. HCM). Relative Apical Strain (RAS) = apical / (basal + mid) > 1 is the diagnostic threshold.",
                    color: "#dc2626",
                  },
                  {
                    title: "HFpEF and Diastolic Dysfunction",
                    content: "LA reservoir strain < 23% is associated with elevated LV filling pressures (E/e′ > 14) and predicts HF hospitalization. LV GLS is often mildly reduced (−16 to −19%) in HFpEF despite preserved EF. Combined GLS + LA strain improves diastolic grading accuracy.",
                    color: BRAND,
                  },
                  {
                    title: "Hypertrophic Cardiomyopathy (HCM)",
                    content: "LV GLS is typically reduced in HCM despite hyperdynamic EF. Basal septal strain is most affected. Strain helps differentiate HCM from athlete's heart (athletes have normal or supranormal GLS). RV strain may be reduced in obstructive HCM.",
                    color: "#0284c7",
                  },
                  {
                    title: "Ischemic Heart Disease",
                    content: "Regional strain abnormalities follow coronary territory distributions. Basal inferior/inferolateral reduction suggests RCA/LCx territory. Anterior/anteroseptal reduction suggests LAD territory. Strain is more sensitive than wall motion scoring for detecting subendocardial ischemia.",
                    color: "#b45309",
                  },
                  {
                    title: "Peripartum Cardiomyopathy",
                    content: "LV GLS is often reduced before EF declines in peripartum cardiomyopathy. GLS < −17% at diagnosis is associated with worse recovery. Serial strain imaging at 1, 3, and 6 months postpartum guides therapy and timing of medication discontinuation.",
                    color: "#be185d",
                  },
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
                    className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                    <span className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800">{ref}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600" />
                  </a>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right column — Bull's Eye + Summary */}
          <div className="flex flex-col gap-5">

            {/* Bull's Eye */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                  17-Segment Bull's-Eye
                </h3>
                <button onClick={clearAllSegments}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors">
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
                    type="number" step="0.1"
                    value={segInput}
                    onChange={e => handleSegInputChange(e.target.value)}
                    placeholder="e.g. −18.5"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 outline-none"
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

            {/* Summary Panel */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                Strain Summary
              </h3>
              <div className="space-y-3">
                <ResultBox
                  label="LV GLS"
                  value={lvGls}
                  normal="≤ −20"
                  unit="%"
                  interpretation={lvInterp?.severity ?? ""}
                />
                <ResultBox
                  label="RV Free-Wall Strain"
                  value={rvStrain}
                  normal="≤ −29"
                  unit="%"
                  interpretation={rvInterp?.severity ?? ""}
                />
                <ResultBox
                  label="LA Reservoir Strain"
                  value={laReservoir}
                  normal="≥ 38"
                  unit="%"
                  interpretation={laInterp?.severity ?? ""}
                />
                {segAvg !== null && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Segmental Avg GLS</span>
                      <span className="text-xs text-gray-400">{enteredSegs.length}/17 segs</span>
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: BRAND }}>{segAvg}%</div>
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
