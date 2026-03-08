/*
  iHeartEcho — Diastolic Function EchoAssist™
  Protocol + Scan Coach for LV Diastolic Function Assessment
  Brand: Teal #189aa1, Aqua #4ad9e0
  US spelling throughout
  Guideline: ASE 2025 LV Diastolic Function Guidelines
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import {
  ChevronDown, ChevronRight, Activity, AlertTriangle,
  CheckCircle, Info, BarChart3, Stethoscope, BookOpen,
  ArrowRight, TrendingUp, TrendingDown, Minus, Zap
} from "lucide-react";

const BRAND = "#189aa1";
const AQUA = "#4ad9e0";

// ── Named export for embedding in ScanCoach.tsx ────────────────────────────
export function DiastolicScanCoachContent() {
  return (
    <div className="max-w-4xl">

      <SectionCard title="Mitral Inflow — Apical 4-Chamber" icon={Stethoscope} defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "View", value: "Apical 4-chamber (A4C)" },
              { label: "Doppler Mode", value: "Pulsed Wave (PW)" },
              { label: "Sample Volume", value: "1–3 mm at mitral leaflet tips" },
              { label: "Timing", value: "End-expiration, held breath" },
              { label: "Angle Correction", value: "Align beam parallel to mitral inflow (< 20°)" },
              { label: "Gain", value: "Reduce to see spectral envelope clearly" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
            <p className="text-sm text-teal-800 leading-relaxed">
              <strong>Tip:</strong> Position the sample volume precisely at the leaflet tips — moving it toward the annulus or into the LV will alter E and A velocities. Repeat if E/A ratio seems inconsistent with clinical picture.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tissue Doppler Imaging (TDI) — Mitral Annulus" icon={Activity} defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "View", value: "Apical 4-chamber (A4C)" },
              { label: "Doppler Mode", value: "Pulsed TDI (tissue velocity mode)" },
              { label: "Septal Site", value: "Medial mitral annulus (septal corner)" },
              { label: "Lateral Site", value: "Lateral mitral annulus" },
              { label: "Sample Volume", value: "5–10 mm over annulus" },
              { label: "Filter", value: "Low (to capture annular velocities)" },
              { label: "Scale", value: "20–30 cm/s" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
            <p className="text-sm text-teal-800 leading-relaxed">
              <strong>Tip:</strong> Measure both septal and lateral e' and average them for E/e' calculation. Lateral e' is more variable — if the lateral wall has a motion abnormality, rely on septal e' alone.
            </p>
          </div>
          <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Pitfall:</strong> Do not confuse the s' (systolic) wave with e'. The e' wave occurs immediately after the QRS-T complex on ECG. The s' wave is the tallest peak during systole.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Pulmonary Venous Flow" icon={TrendingUp}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "View", value: "Apical 4-chamber (A4C)" },
              { label: "Doppler Mode", value: "Pulsed Wave (PW)" },
              { label: "Sample Volume", value: "Right upper pulmonary vein, 1–2 cm into vein" },
              { label: "Gain", value: "Reduce to see S, D, and Ar waves" },
              { label: "Scale", value: "40–60 cm/s" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
            <p className="text-sm text-teal-800 leading-relaxed">
              <strong>Tip:</strong> Ar duration &gt; 30 ms longer than mitral A duration indicates elevated LV end-diastolic pressure (LVEDP). This is one of the most specific signs of elevated filling pressures.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Left Atrial Volume Index (LAVI)" icon={BarChart3}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Views", value: "A4C and A2C at end-systole" },
              { label: "Method", value: "Biplane area-length or Simpson's" },
              { label: "Timing", value: "Frame before mitral valve opens (end-systole)" },
              { label: "Exclude", value: "Pulmonary veins and LAA from tracing" },
              { label: "Normal", value: "< 34 mL/m²" },
              { label: "Abnormal", value: "≥ 34 mL/m²" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Pitfall:</strong> Atrial fibrillation, mitral stenosis, and mitral regurgitation cause LA enlargement independent of diastolic dysfunction. Do not use LAVI as a diastolic marker in these conditions.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="TR Velocity (RVSP Estimation)" icon={Zap}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "View", value: "Apical 4-chamber or parasternal" },
              { label: "Doppler Mode", value: "Continuous Wave (CW)" },
              { label: "Alignment", value: "Align parallel to TR jet (use color Doppler first)" },
              { label: "Threshold", value: "> 2.8 m/s = abnormal for diastolic grading" },
              { label: "Formula", value: "RVSP = 4(TRV²) + RAP" },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-sm">
                <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
            <p className="text-sm text-teal-800 leading-relaxed">
              <strong>Tip:</strong> Use agitated saline contrast if TR is not well visualized. Even a trace TR jet can be used for velocity measurement if the envelope is complete.
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="mt-6 rounded-xl p-5" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
        <div className="text-sm font-bold text-[#4ad9e0] mb-3">Quick Reference — ASE 2025 Diastolic Grading</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { grade: "Normal", ea: "0.8–2.0", ee: "≤ 14", color: "#22c55e" },
            { grade: "Grade I", ea: "≤ 0.8", ee: "≤ 14", color: "#facc15" },
            { grade: "Grade II", ea: "0.8–2.0", ee: "> 14", color: "#f97316" },
            { grade: "Grade III", ea: "> 2.0", ee: "> 14", color: "#ef4444" },
          ].map(({ grade, ea, ee, color }) => (
            <div key={grade} className="rounded-lg p-3 bg-white/10">
              <div className="font-bold text-sm mb-1" style={{ color }}>{grade}</div>
              <div className="text-xs text-white/70">E/A: <span className="text-white font-medium">{ea}</span></div>
              <div className="text-xs text-white/70">E/e': <span className="text-white font-medium">{ee}</span></div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type Section = {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
};

// ── Helpers ────────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND + "15" }}>
            <Icon className="w-4 h-4" style={{ color: BRAND }} />
          </div>
          <span className="font-bold text-gray-800 text-base" style={{ fontFamily: "Merriweather, serif" }}>{title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function RefTable({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: BRAND + "12" }}>
            {headers.map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: color + "18", color }}>
      {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DiastolicNavigator() {
  const _params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const _initialTab = (_params.get("tab") === "scancoach" ? "scancoach" : "protocol") as "protocol" | "scancoach";
  const [activeTab, setActiveTab] = useState<"protocol" | "scancoach">(_initialTab);

  return (
    <Layout>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}>
        <div className="container py-10 md:py-14">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Activity className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                  <span className="text-sm text-white/80 font-medium">EchoAssist™ · Diastolic Function</span>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">Free</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                Diastolic Function
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-base mt-0.5">LV Diastolic Assessment · ASE 2025</p>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                Systematic assessment of LV diastolic function using mitral inflow, tissue Doppler, pulmonary venous flow, and left atrial volume — with ASE 2025 grading algorithm and scan coach.
              </p>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "protocol" ? "bg-white text-[#189aa1]" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
            >
              Protocol
            </button>
            <button
              onClick={() => setActiveTab("scancoach")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "scancoach" ? "bg-white text-[#189aa1]" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
            >
              Scan Coach
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">

        {/* ── PROTOCOL TAB ── */}
        {activeTab === "protocol" && (
          <div className="max-w-4xl">

            {/* Step-by-step checklist */}
            <SectionCard title="Step-by-Step Assessment Protocol" icon={CheckCircle} defaultOpen>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Follow this systematic sequence for every diastolic function assessment. Obtain all parameters before applying the grading algorithm.
              </p>
              <ol className="space-y-3">
                {[
                  { step: "1", label: "Assess LV Systolic Function", detail: "Confirm LVEF. Diastolic grading applies to preserved (EF ≥ 50%) and mildly reduced (EF 40–49%) function. Separate algorithm applies for EF < 40%." },
                  { step: "2", label: "Mitral Inflow (Pulsed Doppler)", detail: "Sample volume at mitral leaflet tips. Measure E wave (peak early diastolic velocity), A wave (peak late diastolic velocity), E/A ratio, and E wave deceleration time (DT)." },
                  { step: "3", label: "Tissue Doppler Imaging (TDI)", detail: "Pulsed TDI at septal and lateral mitral annulus. Measure e' (early diastolic annular velocity) at each site. Average septal and lateral e' for E/e' ratio." },
                  { step: "4", label: "Peak TR Velocity", detail: "CW Doppler across tricuspid valve. Measure peak TR jet velocity to estimate RVSP. Used as a surrogate for LV filling pressure elevation." },
                  { step: "5", label: "Left Atrial Volume Index (LAVI)", detail: "Biplane area-length or Simpson's method. Index to BSA. LAVI > 34 mL/m² indicates LA enlargement and supports elevated filling pressures." },
                  { step: "6", label: "Pulmonary Venous Flow (if needed)", detail: "Pulsed Doppler in right upper pulmonary vein. Measure S wave, D wave, and Ar (atrial reversal) velocity and duration. Ar – A duration > 30 ms suggests elevated LVEDP." },
                  { step: "7", label: "Apply Grading Algorithm", detail: "Use the four ASE 2025 criteria to classify diastolic function grade. See Grading Algorithm section below." },
                ].map(({ step, label, detail }) => (
                  <li key={step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5" style={{ background: BRAND }}>
                      {step}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{label}</div>
                      <div className="text-sm text-gray-500 mt-0.5 leading-relaxed">{detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>

            {/* ASE 2025 Grading Algorithm */}
            <SectionCard title="ASE 2025 Diastolic Grading Algorithm" icon={BarChart3} defaultOpen>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                The ASE 2025 algorithm uses four primary criteria. Count the number of criteria that exceed the abnormal threshold to determine the grade.
              </p>

              {/* Four criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Septal e'", normal: "≥ 7 cm/s", abnormal: "< 7 cm/s", note: "Reflects myocardial relaxation" },
                  { label: "Lateral e'", normal: "≥ 10 cm/s", abnormal: "< 10 cm/s", note: "Reflects myocardial relaxation" },
                  { label: "Average E/e'", normal: "≤ 14", abnormal: "> 14", note: "Surrogate for LV filling pressure" },
                  { label: "Peak TR Velocity", normal: "≤ 2.8 m/s", abnormal: "> 2.8 m/s", note: "Surrogate for elevated RVSP" },
                  { label: "LAVI", normal: "≤ 34 mL/m²", abnormal: "> 34 mL/m²", note: "Marker of chronic LA pressure load" },
                ].map(({ label, normal, abnormal, note }) => (
                  <div key={label} className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                    <div className="font-semibold text-gray-800 text-sm mb-1">{label}</div>
                    <div className="flex items-center gap-2 text-xs mb-0.5">
                      <span className="w-16 text-gray-500">Normal:</span>
                      <span className="font-medium text-emerald-700">{normal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="w-16 text-gray-500">Abnormal:</span>
                      <span className="font-medium text-red-600">{abnormal}</span>
                    </div>
                    <div className="text-xs text-gray-400 italic">{note}</div>
                  </div>
                ))}
              </div>

              {/* Grade table */}
              <RefTable
                headers={["Grade", "Criteria Met", "Interpretation", "E/A Pattern"]}
                rows={[
                  ["Normal", "< 2 of 4 abnormal", "Normal diastolic function", "E/A 0.8–2.0, DT 160–240 ms"],
                  ["Grade I", "≥ 2 of 4 abnormal + E/A ≤ 0.8", "Impaired relaxation (mild)", "E/A ≤ 0.8, DT > 200 ms"],
                  ["Grade II", "≥ 2 of 4 abnormal + E/A 0.8–2.0", "Pseudonormal (moderate)", "E/A 0.8–2.0, DT 160–200 ms"],
                  ["Grade III", "≥ 2 of 4 abnormal + E/A > 2.0", "Restrictive filling (severe)", "E/A > 2.0, DT < 160 ms"],
                  ["Indeterminate", "Exactly 2 of 4, mixed pattern", "Cannot classify — additional data needed", "Variable"],
                ]}
              />

              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>EF &lt; 40%:</strong> When LVEF is reduced, diastolic dysfunction is assumed to be present. The grading algorithm is used to estimate filling pressure severity rather than confirm dysfunction.
                </p>
              </div>
            </SectionCard>

            {/* Normal Reference Values */}
            <SectionCard title="Normal Reference Values" icon={Info}>
              <RefTable
                headers={["Parameter", "Normal Range", "Units", "Notes"]}
                rows={[
                  ["E wave velocity", "0.6 – 1.0", "m/s", "Age-dependent; decreases with age"],
                  ["A wave velocity", "0.4 – 0.7", "m/s", "Increases with age"],
                  ["E/A ratio", "0.8 – 2.0", "", "< 0.8 = impaired relaxation; > 2.0 = restrictive"],
                  ["E wave deceleration time (DT)", "160 – 240", "ms", "< 160 ms = restrictive"],
                  ["IVRT", "70 – 90", "ms", "Prolonged in impaired relaxation"],
                  ["Septal e'", "≥ 7", "cm/s", "< 7 cm/s = abnormal"],
                  ["Lateral e'", "≥ 10", "cm/s", "< 10 cm/s = abnormal"],
                  ["Average E/e'", "≤ 14", "", "> 14 = elevated filling pressures"],
                  ["LAVI", "≤ 34", "mL/m²", "> 34 = LA enlargement"],
                  ["Peak TR velocity", "≤ 2.8", "m/s", "> 2.8 = elevated RVSP"],
                  ["Pulmonary vein S/D ratio", "> 1.0", "", "S < D suggests elevated LA pressure"],
                  ["Ar velocity", "< 35", "cm/s", "Ar – A duration > 30 ms = elevated LVEDP"],
                ]}
              />
            </SectionCard>

            {/* Pitfalls */}
            <SectionCard title="Common Pitfalls & Clinical Pearls" icon={AlertTriangle}>
              <div className="space-y-3">
                {[
                  { type: "pitfall", text: "Mitral inflow is load-dependent — hypovolemia can normalize a pseudonormal pattern. Always correlate with clinical context." },
                  { type: "pitfall", text: "Atrial fibrillation eliminates the A wave. Do not apply standard E/A grading in AF — use E/e' and LAVI as primary markers." },
                  { type: "pitfall", text: "Mitral stenosis and mitral regurgitation significantly alter inflow patterns. Interpret diastolic parameters with caution in significant mitral valve disease." },
                  { type: "pitfall", text: "Lateral e' may be unreliable in patients with lateral wall motion abnormalities or lateral annular calcification. Use septal e' preferentially in these cases." },
                  { type: "pearl", text: "Valsalva maneuver can unmask elevated filling pressures: a decrease in E/A ratio ≥ 0.5 during Valsalva suggests pseudonormal pattern (Grade II)." },
                  { type: "pearl", text: "In young healthy adults, E/A > 2.0 with short DT may represent physiologic supernormal filling, not Grade III dysfunction — clinical context is essential." },
                  { type: "pearl", text: "LAVI is the most robust single marker of chronically elevated filling pressures. Prioritize it when other parameters are discordant." },
                  { type: "pearl", text: "E/e' > 14 combined with LAVI > 34 mL/m² has high specificity for elevated LV filling pressures even when other criteria are borderline." },
                ].map((item, i) => (
                  <div key={i} className={`flex gap-2 p-3 rounded-lg ${item.type === "pitfall" ? "bg-red-50 border border-red-100" : "bg-teal-50 border border-teal-100"}`}>
                    {item.type === "pitfall"
                      ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      : <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />}
                    <p className={`text-sm leading-relaxed ${item.type === "pitfall" ? "text-red-800" : "text-teal-800"}`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Special Populations */}
            <SectionCard title="Special Populations" icon={BookOpen}>
              <div className="space-y-4">
                {[
                  {
                    title: "Aging",
                    content: "Diastolic function declines with age. E/A ratio normally decreases and DT increases. Age-specific reference values should be applied. Isolated Grade I dysfunction in patients > 65 years without symptoms or structural disease may represent normal aging."
                  },
                  {
                    title: "Hypertrophic Cardiomyopathy (HCM)",
                    content: "Diastolic dysfunction is nearly universal in HCM. Impaired relaxation (Grade I) is most common. Restrictive filling (Grade III) is a poor prognostic marker. E/e' and LAVI are most reliable parameters."
                  },
                  {
                    title: "Constrictive Pericarditis vs. Restrictive Cardiomyopathy",
                    content: "Both present with elevated filling pressures. Key differentiator: in constriction, septal e' is paradoxically preserved or elevated (annulus paradoxus) and medial e' > lateral e' (annulus reversus). Respiratory variation in mitral and tricuspid inflow is prominent in constriction."
                  },
                  {
                    title: "Reduced LVEF (EF < 40%)",
                    content: "Diastolic dysfunction is assumed present. Use E/e', LAVI, and TR velocity to estimate filling pressure severity. Grade I (E/A ≤ 0.8) = low filling pressures; Grade II (E/A 0.8–2.0) = indeterminate; Grade III (E/A > 2.0) = elevated filling pressures."
                  },
                  {
                    title: "Atrial Fibrillation",
                    content: "A wave is absent. Use E/e' > 11 (average), LAVI > 34 mL/m², and TR velocity > 2.8 m/s as primary markers. Average multiple beats (≥ 5) for E wave measurement."
                  },
                ].map(({ title, content }) => (
                  <div key={title}>
                    <div className="font-semibold text-gray-800 text-sm mb-1" style={{ color: BRAND }}>{title}</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>
        )}

        {/* ── SCAN COACH TAB ── */}
        {activeTab === "scancoach" && (
          <div className="max-w-4xl">

            <SectionCard title="Mitral Inflow — Apical 4-Chamber" icon={Stethoscope} defaultOpen>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "View", value: "Apical 4-chamber (A4C)" },
                    { label: "Doppler Mode", value: "Pulsed Wave (PW)" },
                    { label: "Sample Volume", value: "1–3 mm at mitral leaflet tips" },
                    { label: "Timing", value: "End-expiration, held breath" },
                    { label: "Angle Correction", value: "Align beam parallel to mitral inflow (< 20°)" },
                    { label: "Gain", value: "Reduce to see spectral envelope clearly" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="text-sm text-teal-800 leading-relaxed">
                    <strong>Tip:</strong> Position the sample volume precisely at the leaflet tips — moving it toward the annulus or into the LV will alter E and A velocities. Repeat if E/A ratio seems inconsistent with clinical picture.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tissue Doppler Imaging (TDI) — Mitral Annulus" icon={Activity} defaultOpen>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "View", value: "Apical 4-chamber (A4C)" },
                    { label: "Doppler Mode", value: "Pulsed TDI (tissue velocity mode)" },
                    { label: "Septal Site", value: "Medial mitral annulus (septal corner)" },
                    { label: "Lateral Site", value: "Lateral mitral annulus" },
                    { label: "Sample Volume", value: "5–10 mm over annulus" },
                    { label: "Filter", value: "Low (to capture annular velocities)" },
                    { label: "Scale", value: "20–30 cm/s" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="text-sm text-teal-800 leading-relaxed">
                    <strong>Tip:</strong> Measure both septal and lateral e' and average them for E/e' calculation. Lateral e' is more variable — if the lateral wall has a motion abnormality, rely on septal e' alone.
                  </p>
                </div>
                <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Pitfall:</strong> Do not confuse the s' (systolic) wave with e'. The e' wave occurs immediately after the QRS-T complex on ECG. The s' wave is the tallest peak during systole.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Pulmonary Venous Flow" icon={TrendingUp}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "View", value: "Apical 4-chamber (A4C)" },
                    { label: "Vein", value: "Right upper pulmonary vein (most accessible)" },
                    { label: "Doppler Mode", value: "Pulsed Wave (PW)" },
                    { label: "Sample Volume", value: "2–3 mm, 1–2 cm into vein orifice" },
                    { label: "Measure", value: "S wave, D wave, Ar velocity, Ar duration" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="text-sm text-teal-800 leading-relaxed">
                    <strong>Tip:</strong> Color Doppler helps locate the pulmonary vein orifice. The Ar wave (atrial reversal) is a small retrograde signal at end-diastole. Ar – A duration &gt; 30 ms is a reliable marker of elevated LVEDP.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="TR Jet — Peak Velocity" icon={Zap}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "View", value: "Apical 4-chamber or parasternal RV inflow" },
                    { label: "Doppler Mode", value: "Continuous Wave (CW)" },
                    { label: "Angle", value: "Align parallel to TR jet (use color Doppler to guide)" },
                    { label: "Measure", value: "Peak TR velocity (m/s)" },
                    { label: "RVSP", value: "4 × TR² + estimated RAP (5, 10, or 15 mmHg)" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <p className="text-sm text-teal-800 leading-relaxed">
                    <strong>Tip:</strong> Use multiple windows to find the highest TR velocity. The apical 4-chamber view often underestimates peak TR velocity — try subcostal or parasternal RV inflow views if the jet is eccentric.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Left Atrial Volume Index (LAVI)" icon={BarChart3}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Method", value: "Biplane area-length or Simpson's biplane" },
                    { label: "Views", value: "A4C and A2C at end-systole (before mitral valve opens)" },
                    { label: "Timing", value: "Frame just before mitral valve opening (maximum LA size)" },
                    { label: "Index", value: "Divide LA volume by BSA (mL/m²)" },
                    { label: "Normal", value: "≤ 34 mL/m²" },
                    { label: "Mildly enlarged", value: "35–41 mL/m²" },
                    { label: "Moderately enlarged", value: "42–48 mL/m²" },
                    { label: "Severely enlarged", value: "> 48 mL/m²" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-36 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Pitfall:</strong> Foreshortening of the LA in the apical views will underestimate LAVI. Ensure the LA is maximally visualized and the mitral annulus is at the bottom of the image.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Valsalva Maneuver — Unmasking Pseudonormal" icon={TrendingDown}>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Used when E/A is 0.8–2.0 (pseudonormal range) to determine true diastolic grade. A decrease in E/A ≥ 0.5 during Valsalva suggests pseudonormal pattern (Grade II).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Instruction", value: "Ask patient to bear down (strain) for 10–15 seconds" },
                    { label: "Record", value: "Mitral inflow PW Doppler during sustained Valsalva" },
                    { label: "Positive result", value: "E/A decreases ≥ 0.5 → pseudonormal (Grade II)" },
                    { label: "Negative result", value: "E/A unchanged → may be truly normal or Grade III" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-gray-500 w-32 flex-shrink-0">{label}:</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Quick Reference Card */}
            <div className="mt-6 rounded-xl p-5" style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-[#4ad9e0]" />
                <span className="text-sm font-semibold text-[#4ad9e0] uppercase tracking-wider">Quick Reference — Grading at a Glance</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { grade: "Normal", ea: "0.8–2.0", ee: "≤ 14", color: "#22c55e" },
                  { grade: "Grade I", ea: "≤ 0.8", ee: "≤ 14", color: "#facc15" },
                  { grade: "Grade II", ea: "0.8–2.0", ee: "> 14", color: "#f97316" },
                  { grade: "Grade III", ea: "> 2.0", ee: "> 14", color: "#ef4444" },
                ].map(({ grade, ea, ee, color }) => (
                  <div key={grade} className="rounded-lg p-3 bg-white/10">
                    <div className="font-bold text-sm mb-1" style={{ color }}>{grade}</div>
                    <div className="text-xs text-white/70">E/A: <span className="text-white font-medium">{ea}</span></div>
                    <div className="text-xs text-white/70">E/e': <span className="text-white font-medium">{ee}</span></div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
