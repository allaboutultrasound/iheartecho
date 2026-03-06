/**
 * Case Mix Submission — IAC Echocardiography Accreditation
 * Reflects exact requirements from IAC Checklist (Updated 6-8-2023)
 *
 * Sections:
 *  1. Global submission rules
 *  2. Per-modality requirements (staff-count based)
 *  3. Multiple sites addendum
 */
import { useState } from "react";
import {
  Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Users, Activity, Microscope, Baby, Heart, Stethoscope, Building2
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";

// ─── Staff-count tiers ────────────────────────────────────────────────────────
type StaffTier = "le5" | "6to8" | "9to15" | "16to25" | "gt25";

const STAFF_TIERS: { id: StaffTier; label: string }[] = [
  { id: "le5",   label: "5 or fewer staff" },
  { id: "6to8",  label: "6 – 8 staff" },
  { id: "9to15", label: "9 – 15 staff" },
  { id: "16to25",label: "16 – 25 staff" },
  { id: "gt25",  label: "Greater than 25 staff" },
];

// ─── Modality data ─────────────────────────────────────────────────────────────

interface CaseBreakdown {
  label: string;
  count: number;
}

interface ModalityRequirement {
  id: string;
  label: string;
  fullName: string;
  icon: React.ElementType;
  color: string;
  staffBased: boolean; // true = number of cases depends on staff count
  /** Cases required per staff tier (only when staffBased = true) */
  casesByTier?: Record<StaffTier, number>;
  /** Fixed number of cases (when staffBased = false, e.g. TEE per physician) */
  fixedNote?: string;
  /** Breakdown of case types within the total (per tier when staffBased) */
  breakdownByTier?: Record<StaffTier, CaseBreakdown[]>;
  /** Specific case type requirements (bullet points) */
  caseTypeRules: string[];
  /** Submission rules (bullet points) */
  submissionRules: string[];
  /** Lookback window in months */
  lookbackMonths: number;
}

const MODALITIES: ModalityRequirement[] = [
  // ── Adult Stress ──────────────────────────────────────────────────────────
  {
    id: "STRESS",
    label: "Adult Stress Echo",
    fullName: "Adult Stress Echocardiography",
    icon: Activity,
    color: "#d97706",
    staffBased: true,
    casesByTier: { le5: 4, "6to8": 6, "9to15": 8, "16to25": 10, gt25: 12 },
    caseTypeRules: [
      "Any ONE of the following case types is acceptable: (1) abnormal regional wall motion at rest due to CAD or MI, OR (2) inducible regional wall motion abnormality due to CAD or MI, OR (3) a stress case using ultrasound enhancing agents (may be normal or abnormal).",
    ],
    submissionRules: [
      "Represent as many CURRENT staff members as possible without duplicating.",
      "One case study must be submitted from the Technical Director.",
      "Medical Director must be represented.",
      "Cases must NOT be independently performed by sonographer or physician trainees.",
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 36,
  },

  // ── Adult TEE ─────────────────────────────────────────────────────────────
  {
    id: "ATEE",
    label: "Adult TEE",
    fullName: "Adult Transesophageal Echocardiography",
    icon: Microscope,
    color: "#0e6b72",
    staffBased: false,
    fixedNote: "1 complete case per physician who performs TEE at the facility.",
    caseTypeRules: [
      "Each case must be a COMPLETE examination including all standard views and Doppler assessments.",
      "TEE representative cases must have an indication or finding of significant mitral regurgitation OR suspected cardiac source of embolus.",
      "At least ONE representative case from the facility must have a finding of significant mitral regurgitation.",
      "Intraoperative TEE may be submitted if the facility physician performed the entire study: probe passage, image acquisition and documentation, reporting, and imaging archiving on the echo lab archiving system.",
      "Limited or shorter pathology-directed TEE exams are NOT acceptable for accreditation review.",
    ],
    submissionRules: [
      "Cases must NOT be independently performed by physician trainees.",
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 12,
  },

  // ── Adult Congenital TTE ──────────────────────────────────────────────────
  {
    id: "ACTE",
    label: "Adult Congenital TTE",
    fullName: "Adult Congenital Transthoracic Echocardiography",
    icon: Heart,
    color: "#7c3aed",
    staffBased: true,
    casesByTier: { le5: 4, "6to8": 6, "9to15": 8, "16to25": 10, gt25: 12 },
    caseTypeRules: [
      "ONE case study must demonstrate Tetralogy of Fallot (repaired or palliated).",
      "Remaining cases must demonstrate complex congenital heart disease. Acceptable lesions: (1) Conotruncal defects, (2) Atrioventricular canal defects, (3) Tetralogy of Fallot, (4) Single ventricle (Fontan), (5) D-TGA (repaired) or congenitally corrected transposition (L-TGA), (6) Ross procedure.",
    ],
    submissionRules: [
      "Represent as many CURRENT congenital staff members as possible without duplicating.",
      "One case study must be submitted from the Lead Congenital Sonographer.",
      "Lead Congenital Echocardiographer must be represented.",
      "Cases must NOT be independently performed by sonographer or physician trainees.",
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 12,
  },

  // ── Pediatric TTE ─────────────────────────────────────────────────────────
  {
    id: "PTTE",
    label: "Pediatric TTE",
    fullName: "Pediatric Transthoracic Echocardiography",
    icon: Users,
    color: "#059669",
    staffBased: true,
    casesByTier: { le5: 4, "6to8": 6, "9to15": 8, "16to25": 10, gt25: 12 },
    breakdownByTier: {
      le5:    [{ label: "Shunt lesions", count: 2 }, { label: "Simple obstructions", count: 1 }, { label: "Complex defects", count: 1 }],
      "6to8": [{ label: "Shunt lesions", count: 2 }, { label: "Simple obstructions", count: 2 }, { label: "Complex defects", count: 2 }],
      "9to15":[{ label: "Shunt lesions", count: 4 }, { label: "Simple obstructions", count: 2 }, { label: "Complex defects", count: 2 }],
      "16to25":[{ label: "Shunt lesions", count: 4 }, { label: "Simple obstructions", count: 3 }, { label: "Complex defects", count: 3 }],
      gt25:   [{ label: "Shunt lesions", count: 4 }, { label: "Simple obstructions", count: 4 }, { label: "Complex defects", count: 4 }],
    },
    caseTypeRules: [
      "ALL cases must be ABNORMAL.",
      "ALL cases must be COMPLETE examinations.",
      "Shunt lesions: ASD, VSD, or PDA.",
      "Simple obstructions: aortic and/or pulmonary valve stenosis, coarctation of the aorta.",
      "Complex defects: shunt lesions plus an obstruction, mitral or tricuspid atresia, AV canal defect, Tetralogy of Fallot, ventricular hypoplasia, anomalous coronary artery, truncus arteriosus, interrupted aortic arch.",
      "Initial studies demonstrating un-repaired defects are preferred; repaired defects accepted if initial studies unavailable.",
    ],
    submissionRules: [
      "Represent as many CURRENT staff members as possible without duplicating.",
      "One case study must be submitted from the Technical Director.",
      "Medical Director must be represented.",
      "Cases must NOT be independently performed by sonographer or physician trainees.",
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 12,
  },

  // ── Pediatric TEE ─────────────────────────────────────────────────────────
  {
    id: "PTEE",
    label: "Pediatric TEE",
    fullName: "Pediatric Transesophageal Echocardiography",
    icon: Microscope,
    color: "#0891b2",
    staffBased: false,
    fixedNote: "1 case per physician — complete examination (not focused/limited) including all views listed in the Standards. For reaccreditation: 1 focused case per physician is acceptable if a complete exam was submitted on the previous application; otherwise a complete exam is required.",
    caseTypeRules: [
      "First-time application: 1 complete case per physician (not focused/limited).",
      "Reaccreditation: 1 focused case per physician if a complete exam was previously submitted; otherwise 1 complete case per physician.",
    ],
    submissionRules: [
      "Cases must NOT be independently performed by physician trainees.",
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 36,
  },

  // ── Fetal Echo ────────────────────────────────────────────────────────────
  {
    id: "FETAL",
    label: "Fetal Echo",
    fullName: "Fetal Echocardiography",
    icon: Baby,
    color: "#db2777",
    staffBased: true,
    casesByTier: { le5: 4, "6to8": 6, "9to15": 8, "16to25": 10, gt25: 12 },
    breakdownByTier: {
      le5:    [{ label: "Shunts", count: 1 }, { label: "Simple obstructions", count: 1 }, { label: "Fetal arrhythmia", count: 1 }, { label: "Hypoplastic ventricle", count: 1 }],
      "6to8": [{ label: "Shunts", count: 2 }, { label: "Simple obstructions", count: 2 }, { label: "Fetal arrhythmia", count: 1 }, { label: "Hypoplastic ventricle", count: 1 }],
      "9to15":[{ label: "Shunts", count: 4 }, { label: "Simple obstructions", count: 2 }, { label: "Fetal arrhythmia", count: 1 }, { label: "Hypoplastic ventricle", count: 1 }],
      "16to25":[{ label: "Shunts", count: 4 }, { label: "Simple obstructions", count: 3 }, { label: "Complex defect", count: 1 }, { label: "Fetal arrhythmia", count: 1 }, { label: "Hypoplastic ventricle", count: 1 }],
      gt25:   [{ label: "Shunts", count: 4 }, { label: "Simple obstructions", count: 4 }, { label: "Complex defects", count: 2 }, { label: "Fetal arrhythmia", count: 1 }, { label: "Hypoplastic ventricle", count: 1 }],
    },
    caseTypeRules: [
      "Cases must NOT be independently performed by sonographer or physician trainees.",
    ],
    submissionRules: [
      "The same case may not be submitted twice within a testing section.",
    ],
    lookbackMonths: 12,
  },
];

// ─── Global Submission Rules ───────────────────────────────────────────────────
const GLOBAL_RULES = [
  "Represent as many CURRENT staff members as possible without duplicating across cases.",
  "Cases submitted must NOT be independently performed by sonographer or physician trainees.",
  "One case study must be submitted from the Technical Director.",
  "Medical Director must be represented.",
  "All cases must be COMPLETE examinations — limited exams are not acceptable.",
  "All cases must be selected from within the applicable lookback window from the date of application filing.",
  "The same case may not be submitted twice within a testing section.",
];

// ─── Multiple Sites Requirements ──────────────────────────────────────────────
const MULTI_SITE_ADULT = [
  "1 abnormal TTE (AS or LV case*) from each site.",
  "1 representative Adult TEE case and its final report for each physician that performs TEE at the multiple site, unless previously represented at the main site.",
  "1 stress echocardiogram from each site (abnormal RWMA at rest, inducible RWMA, or stress with ultrasound enhancing agents).",
  "1 adult congenital TTE from each site: conotruncal defects, AV canal defects, ToF, single ventricle (Fontan), D-TGA (repaired) or L-TGA, or Ross procedure.",
];
const MULTI_SITE_PEDIATRIC = [
  "1 abnormal PTTE from each site: shunt, simple obstruction, or complex defect.",
  "1 representative PTEE case and its final report for each physician that performs PTEE at the multiple site, unless previously represented at the main site.",
];
const MULTI_SITE_FETAL = [
  "1 abnormal fetal case from each site: complex defect, fetal arrhythmia, shunt, simple obstruction, or hypoplastic ventricle.",
];
const MULTI_SITE_NOTE =
  "*LV cases = regional wall motion abnormalities due to CAD or MI (NOT global LV dysfunction or diastolic dysfunction). Takotsubo cardiomyopathy with regional abnormalities is accepted. AS cases must be native valvular AS with Vmax ≥ 2 m/s.";

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({
  title, subtitle, icon: Icon, color, defaultOpen = false, children,
}: {
  title: string; subtitle?: string; icon: React.ElementType; color: string;
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{title}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── Rule List ────────────────────────────────────────────────────────────────
function RuleList({ items, color = BRAND }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Modality Card ────────────────────────────────────────────────────────────
function ModalityCard({ modality, tier }: { modality: ModalityRequirement; tier: StaffTier }) {
  const totalCases = modality.staffBased ? (modality.casesByTier?.[tier] ?? 0) : null;
  const breakdown = modality.staffBased ? (modality.breakdownByTier?.[tier] ?? []) : [];

  return (
    <CollapsibleSection
      title={modality.label}
      subtitle={modality.fullName}
      icon={modality.icon}
      color={modality.color}
    >
      <div className="space-y-5">

        {/* Case count */}
        {modality.staffBased && totalCases !== null ? (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Required Cases</div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="text-3xl font-black"
                style={{ fontFamily: "JetBrains Mono, monospace", color: modality.color }}
              >
                {totalCases}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                cases required<br />
                <span className="font-medium text-gray-700">Lookback: {modality.lookbackMonths} months</span>
              </div>
            </div>
            {breakdown.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {breakdown.map(b => (
                  <div
                    key={b.label}
                    className="rounded-lg px-3 py-2 text-center border"
                    style={{ background: modality.color + "0d", borderColor: modality.color + "30" }}
                  >
                    <div className="text-lg font-bold" style={{ color: modality.color, fontFamily: "JetBrains Mono, monospace" }}>{b.count}</div>
                    <div className="text-xs text-gray-600 leading-tight mt-0.5">{b.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Case Volume</div>
            <div className="rounded-lg p-3 text-xs text-gray-700 leading-relaxed" style={{ background: modality.color + "0d", borderLeft: `3px solid ${modality.color}` }}>
              {modality.fixedNote}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <span className="font-medium text-gray-700">Lookback: {modality.lookbackMonths} months</span>
            </div>
          </div>
        )}

        {/* Case type rules */}
        {modality.caseTypeRules.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Case Type Requirements</div>
            <RuleList items={modality.caseTypeRules} color={modality.color} />
          </div>
        )}

        {/* Submission rules */}
        {modality.submissionRules.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Submission Rules</div>
            <RuleList items={modality.submissionRules} color={modality.color} />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CaseMixSubmission() {
  const [tier, setTier] = useState<StaffTier>("le5");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
          IAC Case Mix Requirements
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          IAC Echocardiography Accreditation Checklist — Updated 6-8-2023. Select your facility staff count to see the required case volumes for each modality.
        </p>
      </div>

      {/* Staff Count Selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: BRAND }} />
          <span className="text-sm font-bold text-gray-800">Facility Staff Count</span>
          <span className="text-xs text-gray-400">(medical + technical staff who perform/interpret each modality)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STAFF_TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                tier === t.id
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={tier === t.id ? { background: BRAND } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Summary Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Stethoscope className="w-4 h-4" style={{ color: BRAND }} />
          <span className="text-sm font-bold text-gray-800">Required Cases at a Glance</span>
          <span className="ml-auto text-xs text-gray-400 font-medium">{STAFF_TIERS.find(t => t.id === tier)?.label}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2.5 font-semibold text-gray-500">Modality</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Cases Required</th>
                <th className="text-center px-4 py-2.5 font-semibold text-gray-500">Lookback</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Key Requirement</th>
              </tr>
            </thead>
            <tbody>
              {MODALITIES.map(m => {
                const count = m.staffBased ? m.casesByTier?.[tier] : null;
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: m.color + "18" }}>
                          <m.icon className="w-3 h-3" style={{ color: m.color }} />
                        </div>
                        <span className="font-semibold text-gray-800">{m.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {count !== null && count !== undefined
                        ? <span className="font-bold text-base" style={{ color: m.color, fontFamily: "JetBrains Mono, monospace" }}>{count}</span>
                        : <span className="text-gray-500 italic">Per physician</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{m.lookbackMonths} mo</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {m.id === "ATEE" && "1 complete case per TEE physician; ≥1 case with significant MR"}
                      {m.id === "PTEE" && "1 complete case per physician (focused ok for reaccreditation)"}
                      {m.id === "STRESS" && "Abnormal RWMA at rest, inducible RWMA, or UEA stress case"}
                      {m.id === "ACTE" && "Must include ≥1 ToF case; remainder from approved complex CHD list"}
                      {m.id === "PTTE" && (() => {
                        const bd = m.breakdownByTier?.[tier];
                        return bd ? bd.map(b => `${b.count} ${b.label}`).join(", ") : "Shunts, obstructions, complex defects";
                      })()}
                      {m.id === "FETAL" && (() => {
                        const bd = m.breakdownByTier?.[tier];
                        return bd ? bd.map(b => `${b.count} ${b.label}`).join(", ") : "Shunts, obstructions, arrhythmia, hypoplastic ventricle";
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Rules */}
      <CollapsibleSection
        title="Universal Submission Rules"
        subtitle="Applies to all modalities"
        icon={Info}
        color={BRAND}
        defaultOpen={true}
      >
        <RuleList items={GLOBAL_RULES} color={BRAND} />
      </CollapsibleSection>

      {/* Per-Modality Cards */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Modality-Specific Requirements</div>
        <div className="space-y-3">
          {MODALITIES.map(m => (
            <ModalityCard key={m.id} modality={m} tier={tier} />
          ))}
        </div>
      </div>

      {/* Multiple Sites */}
      <CollapsibleSection
        title="Multiple Sites — Additional Requirements"
        subtitle="Required in addition to base facility cases"
        icon={Building2}
        color="#6b7280"
      >
        <div className="space-y-5">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Adult Facility (each additional site)</div>
            <RuleList items={MULTI_SITE_ADULT} color="#6b7280" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pediatric Facility (each additional site)</div>
            <RuleList items={MULTI_SITE_PEDIATRIC} color="#059669" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fetal (each additional site, if applicable)</div>
            <RuleList items={MULTI_SITE_FETAL} color="#db2777" />
          </div>
          <div className="rounded-lg p-3 text-xs text-gray-600 leading-relaxed" style={{ background: "#f8fafc", borderLeft: "3px solid #6b7280" }}>
            {MULTI_SITE_NOTE}
          </div>
        </div>
      </CollapsibleSection>

      {/* Source note */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Source: IAC Echocardiography Accreditation Checklist, Updated 6-8-2023 · <a href="https://www.intersocietal.org/echo/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">intersocietal.org/echo</a>
      </p>
    </div>
  );
}
