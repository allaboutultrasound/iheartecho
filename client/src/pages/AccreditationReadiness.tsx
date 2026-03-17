/*
 * Accreditation Readiness Tool
 * Full IAC Echocardiography Accreditation Checklist with per-section progress markers.
 * Data is persisted per lab via tRPC.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Save, AlertCircle, Info, ClipboardCheck, Printer,
} from "lucide-react";
import { toast } from "sonner";

// ─── IAC Checklist Data ───────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  text: string;
  note?: string;
  required?: boolean;
  /** If true: clickable/trackable but excluded from readiness progress calculations */
  caseMixItem?: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
}

interface ChecklistStep {
  id: string;
  step: number;
  title: string;
  description: string;
  sections: ChecklistSection[];
  /** If true: this entire step is excluded from readiness % (Case Mix category) */
  caseMixStep?: boolean;
}

const IAC_CHECKLIST: ChecklistStep[] = [
  // ─── 1. FACILITY ──────────────────────────────────────────────────────────
  {
    id: "facility",
    step: 1,
    title: "Facility",
    description: "Getting started: review standards, perform a self-assessment, and set up your IAC Online Accreditation account.",
    sections: [
      {
        id: "fac-setup",
        title: "Getting Started",
        items: [
          { id: "fac-1", text: "Review the IAC Standards and Guidelines for Adult or Pediatric/Congenital Echocardiography Accreditation (intersocietal.org/programs/echocardiography/standards)", required: true },
          { id: "fac-2", text: "Perform a thorough facility self-assessment — review current policies, protocols, and final reports for IAC Standards compliance", required: true },
          { id: "fac-3", text: "Create or access existing IAC Online Accreditation account at iaconlineaccreditation.org", required: true },
          { id: "fac-4", text: "For reaccreditation: verify all facility details and staff contact information are accurate and current before starting a new application", required: false, note: "Reaccreditation only" },
        ],
      },
      {
        id: "fac-info",
        title: "Facility Information to Gather",
        items: [
          { id: "fac-5", text: "Procedure volumes ready: estimated annual facility and staff procedure volume information", required: true },
          { id: "fac-6", text: "Physician Medical License on file for each state the interpreting physician is licensed to practice", required: true },
          { id: "fac-7", text: "Estimate of number of studies interpreted by the Medical Director and every Medical Staff member", required: true },
          { id: "fac-8", text: "Estimate of number of studies performed by the Technical Director and every Technical Staff member", required: true },
          { id: "fac-9", text: "For ACTE applicants: estimate of studies interpreted by Lead Congenital Echocardiographer and every Adult Congenital Medical Staff member", required: false, note: "Adult Congenital Transthoracic applicants only" },
          { id: "fac-10", text: "For ACTE applicants: estimate of studies performed by Lead Congenital Sonographer and every Congenital Technical Staff member", required: false, note: "Adult Congenital Transthoracic applicants only" },
        ],
      },
    ],
  },

  // ─── 2. EQUIPMENT ─────────────────────────────────────────────────────────
  {
    id: "equipment",
    step: 2,
    title: "Equipment",
    description: "All ultrasound equipment must be listed with manufacturer, model, and year for each modality applied for.",
    sections: [
      {
        id: "eq-inventory",
        title: "Equipment Inventory",
        items: [
          { id: "eq-1", text: "All ultrasound equipment listed with manufacturer, model, and year", required: true },
          { id: "eq-2", text: "Equipment information entered in the IAC Online Accreditation account profile (Manage Equipment)", required: true },
          { id: "eq-3", text: "Equipment meets minimum technical specifications for each accreditation modality applied for", required: true },
          { id: "eq-4", text: "Equipment maintenance and service records on file", required: true },
          { id: "eq-5", text: "Equipment cleaning and disinfection schedule documented per manufacturer specifications", required: true },
          { id: "eq-6", text: "Routine safety inspections and electrical testing policy established and adhered to", required: true },
        ],
      },
      {
        id: "eq-storage",
        title: "Image Storage & Reporting Systems",
        items: [
          { id: "eq-7", text: "Digital image archiving system in place (PACS, CD/DVD, or other digital archiving media — digital storage required)", required: true },
          { id: "eq-8", text: "Image retention policy documented (minimum per IAC Standards for each modality)", required: true },
          { id: "eq-9", text: "Report generation system in place with structured, fully typewritten final reports", required: true },
        ],
      },
    ],
  },

  // ─── 3. STAFF ─────────────────────────────────────────────────────────────
  {
    id: "staff",
    step: 3,
    title: "Staff",
    description: "Training/experience qualification pathways and credential/certificate information for all physicians and sonographers.",
    sections: [
      {
        id: "staff-md",
        title: "Medical Director",
        subtitle: "Must be a licensed physician with appropriate training and credentials",
        items: [
          { id: "st-md-1", text: "Medical Director identified and CV on file", required: true },
          { id: "st-md-2", text: "Medical Director holds appropriate board certification (ABIM, ABP, or equivalent) with echocardiography training/experience", required: true },
          { id: "st-md-3", text: "Medical Director NBE or ABIM/ABP certificate(s) on file (including dates and certificate numbers)", required: true },
          { id: "st-md-4", text: "Medical Director oversees quality improvement program", required: true },
          { id: "st-md-5", text: "Medical Director reviews and approves all policies and procedures", required: true },
        ],
      },
      {
        id: "staff-td",
        title: "Technical Director",
        subtitle: "Must hold RDCS, RCCS, RCS, ACS, or CRCS credential",
        items: [
          { id: "st-td-1", text: "Technical Director identified and CV on file", required: true },
          { id: "st-td-2", text: "Technical Director holds RDCS, RCCS, RCS, ACS, or CRCS credential (including dates and registry numbers)", required: true },
          { id: "st-td-3", text: "Technical Director has documented clinical experience in applicable echo modality", required: true },
          { id: "st-td-4", text: "Technical Director oversees sonographer training and competency", required: true },
        ],
      },
      {
        id: "staff-sono",
        title: "Sonographers (Technical Staff)",
        subtitle: "All performing sonographers must meet minimum credential requirements",
        items: [
          { id: "st-s-1", text: "All sonographers hold RDCS, RCCS, RCS, ACS, or CRCS credential (or are in training under supervision)", required: true },
          { id: "st-s-2", text: "Sonographer credentials and CVs on file for all performing staff", required: true },
          { id: "st-s-3", text: "Sonographers performing stress echo have documented stress echo training", required: false, note: "If applying for Stress Echo" },
          { id: "st-s-4", text: "Sonographers performing TEE have documented TEE training", required: false, note: "If applying for TEE" },
          { id: "st-s-5", text: "Sonographers performing pediatric/fetal echo have documented pediatric/fetal training", required: false, note: "If applying for Pediatric/Fetal" },
        ],
      },
      {
        id: "staff-phys",
        title: "Interpreting Physicians (Medical Staff)",
        subtitle: "All interpreting physicians must meet minimum training requirements",
        items: [
          { id: "st-p-1", text: "All interpreting physicians identified with CVs on file", required: true },
          { id: "st-p-2", text: "Interpreting physicians have documented echo training/experience per IAC qualification pathways", required: true },
          { id: "st-p-3", text: "Interpreting physicians hold appropriate board certification (ABIM/ABP or equivalent)", required: true },
          { id: "st-p-4", text: "Physician certificate(s) on file (NBE, ABIM/ABP including dates and certificate numbers)", required: true },
        ],
      },
      {
        id: "staff-congenital",
        title: "Adult Congenital Staff (ACTE applicants only)",
        subtitle: "Required only for facilities applying in Adult Congenital Transthoracic",
        items: [
          { id: "st-ac-1", text: "Lead Congenital Echocardiographer identified with CV and credentials on file", required: false, note: "ACTE applicants only" },
          { id: "st-ac-2", text: "Lead Congenital Sonographer identified with CV and credentials on file", required: false, note: "ACTE applicants only" },
          { id: "st-ac-3", text: "Adult Congenital Medical Staff CVs and credentials on file", required: false, note: "ACTE applicants only" },
          { id: "st-ac-4", text: "Congenital Technical Staff CVs and credentials on file", required: false, note: "ACTE applicants only" },
        ],
      },
    ],
  },

  // ─── 4. CME ───────────────────────────────────────────────────────────────
  {
    id: "cme",
    step: 4,
    title: "CME",
    description: "Continuing Medical Education (CME) records must be on file and available for submission to the IAC upon request. CME must be earned within the 3-year period prior to application submission.",
    sections: [
      {
        id: "cme-md",
        title: "Medical Director CME",
        items: [
          { id: "cme-md-1", text: "Medical Director: 30 hours CME relevant to cardiac imaging over the past 3 years (on file)", required: true },
          { id: "cme-md-2", text: "Medical Director: at least 15 of those 30 hours must be echocardiography-related", required: true },
        ],
      },
      {
        id: "cme-ms",
        title: "Medical Staff CME",
        items: [
          { id: "cme-ms-1", text: "Each Medical Staff member: 15 hours CME relevant to cardiac imaging over the past 3 years (on file)", required: true },
          { id: "cme-ms-2", text: "Each Medical Staff member: at least 5 of those 15 hours must be echocardiography-related", required: true },
        ],
      },
      {
        id: "cme-tech",
        title: "Technical Director & Technical Staff CME",
        items: [
          { id: "cme-td-1", text: "Technical Director: at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle (on file)", required: true },
          { id: "cme-ts-1", text: "Each Technical Staff member: at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle (on file)", required: true },
        ],
      },
      {
        id: "cme-congenital",
        title: "Adult Congenital Staff CME (ACTE applicants only)",
        subtitle: "Required for adult echocardiography facilities applying in Adult Congenital Transthoracic",
        items: [
          { id: "cme-lce-1", text: "Lead Congenital Echocardiographer: minimum 5 hours CME relevant to congenital echocardiography (on file)", required: false, note: "ACTE applicants only — may be included in overall echo CME" },
          { id: "cme-ls-1", text: "Lead Congenital Sonographer: minimum 5 hours CME relevant to congenital echocardiography (on file)", required: false, note: "ACTE applicants only" },
          { id: "cme-acms-1", text: "Adult Congenital Medical Staff: minimum 3 hours CME relevant to congenital echocardiography (on file)", required: false, note: "ACTE applicants only" },
          { id: "cme-cts-1", text: "Congenital Technical Staff: minimum 3 hours CME relevant to congenital echocardiography (on file)", required: false, note: "ACTE applicants only" },
        ],
      },
    ],
  },

  // ─── 5. POLICIES ──────────────────────────────────────────────────────────
  {
    id: "policies",
    step: 5,
    title: "Policies & Protocols",
    description: "Written policies and procedures must be in place, reviewed, and signed by the Medical Director. Sample documents are available in the IAC Sample Document Repository.",
    sections: [
      {
        id: "pol-required",
        title: "Required Policies (All Facilities)",
        items: [
          { id: "pol-1", text: "Infection Control Policy — appropriate precautions to protect patients and facility personnel per universal precautions", required: true },
          { id: "pol-2", text: "Critical Results Communication Policy — steps for communication of critical findings to the referring provider", required: true },
          { id: "pol-3", text: "Primary Source Verification Policy — verifying all medical and technical staff credentials through the applicable issuing agencies", required: true },
          { id: "pol-4", text: "Patient Complaint Policy — process for patients to issue a complaint/grievance regarding care/services received", required: true },
          { id: "pol-5", text: "Personnel Safety Policy (Ergonomics) — addresses technical staff safety, comfort, and avoidance of work-related musculoskeletal disorders (MSD)", required: true },
          { id: "pol-6", text: "Facility-Specific, Step-by-Step Technical Protocols — for all modalities the facility is applying for (TTE, TEE, SE, ACTE, Fetal)", required: true },
          { id: "pol-7", text: "Quality Improvement (QI) Policy — written policy regarding QI that includes all procedures performed in the facility", required: true },
        ],
      },
      {
        id: "pol-conditional",
        title: "Conditional Policies (If Applicable)",
        items: [
          { id: "pol-8", text: "Radiation Safety Policy — employee safety when in the presence of ionizing radiation", required: false, note: "If applicable" },
          { id: "pol-9", text: "Preliminary vs. Final Report Policy — steps taken when there is a difference between preliminary and final reports", required: false, note: "If applicable" },
          { id: "pol-10", text: "Policy for Use of Ultrasound Enhancing Agents (UEAs) — indications, administration, system settings, monitoring for hypersensitivity reactions, and training", required: false, note: "If applicable" },
          { id: "pol-11", text: "Policy for Recommended Alternative Imaging (Adult Echo only) — when UEAs cannot be used or do not provide adequate visualization", required: false, note: "Adult Echo only" },
          { id: "pol-12", text: "Policy for cleaning/decontaminating and leakage testing of TEE transducer", required: false, note: "If performing TEE" },
          { id: "pol-13", text: "Moderate Sedation Policies — training requirements, vital sign monitoring, type of sedatives and dosing", required: false, note: "If applicable" },
        ],
      },
      {
        id: "pol-qi",
        title: "Quality Improvement (QI) Measures",
        subtitle: "Active QI program with documented results required for all accreditation programs",
        items: [
          { id: "pol-qi-1", text: "Test Appropriateness — minimum 2 cases per modality (TTE, TEE, SE, ACTE) per quarter evaluated and categorized as appropriate/may be appropriate/rarely appropriate", required: true },
          { id: "pol-qi-2", text: "Interpretive Quality Review (Physician Interpretation Variability) — minimum 2 cases per modality (TTE, TEE, SE, ACTE, Fetal) per quarter; must represent as many physicians as possible; discrepancies reconciled", required: true },
          { id: "pol-qi-3", text: "Technical Quality Review (Sonographer Performance Variability) — 2 cases per modality per quarter reviewed for image quality, completeness, and protocol adherence; must represent as many sonographers as possible; discrepancies reconciled", required: true },
          { id: "pol-qi-4", text: "Final Report Completeness and Timeliness — minimum 2 cases per modality per quarter evaluated for completeness and timeliness per IAC Standards 3.2A, 3.2.4A, 3.3A–3.6A; must represent as many physicians as possible", required: true },
          { id: "pol-qi-5", text: "Correlation (Pediatric Only) — minimum 4 cases annually with at least 2 cases per relevant testing area, performed with appropriate imaging modality, surgical findings, or clinical outcomes", required: false, note: "Pediatric facilities only" },
        ],
      },
    ],
  },

  // ─── 6. CASE STUDIES ──────────────────────────────────────────────────────
  {
    id: "cases",
    step: 6,
    title: "Case Studies",
    description: "Case study submissions assess interpretative and technical quality. All cases must be complete examinations from within the required time window. Limited exams are not acceptable.",
    caseMixStep: true,
    sections: [
      {
        id: "cs-general",
        title: "General Requirements (All Modalities)",
        items: [
          { id: "cs-gen-1", text: "Cases selected from within the required time window (12 months for ATTE, ATEE, ACTE, PTTE, Fetal; 36 months for Stress, PTEE)", required: true, caseMixItem: true },
          { id: "cs-gen-2", text: "Cases represent as many CURRENT staff members as possible without duplicating", required: true, caseMixItem: true },
          { id: "cs-gen-3", text: "No case submitted twice within a testing section", required: true, caseMixItem: true },
          { id: "cs-gen-4", text: "No cases independently performed by sonographer or physician trainees", required: true, caseMixItem: true },
          { id: "cs-gen-5", text: "One case study submitted from the Technical Director", required: true, caseMixItem: true },
          { id: "cs-gen-6", text: "Medical Director is represented in submitted cases", required: true, caseMixItem: true },
          { id: "cs-gen-7", text: "All cases are complete examinations (limited exams not acceptable)", required: true, caseMixItem: true },
        ],
      },
      {
        id: "cs-atte",
        title: "Adult Transthoracic (ATTE)",
        subtitle: "Number of cases based on total staff count; mix of AS and LV cases required",
        items: [
          { id: "cs-atte-1", text: "≤5 staff: 4 cases (2 AS, 2 LV) | 6–8 staff: 6 cases (3 AS, 3 LV) | 9–15 staff: 8 cases (4 AS, 4 LV) | 16–25 staff: 10 cases (5 AS, 5 LV) | >25 staff: 12 cases (6 AS, 6 LV)", required: true, caseMixItem: true, note: "LV = regional wall motion abnormalities due to CAD/MI (not global LV dysfunction or diastolic dysfunction). AS = native valvular AS with velocity ≥2 m/sec. Takotsubo with regional abnormalities accepted for LV." },
        ],
      },
      {
        id: "cs-stress",
        title: "Adult Stress Echo",
        subtitle: "Based on total number of staff (medical and technical) performing/interpreting stress echo",
        items: [
          { id: "cs-stress-1", text: "≤5 staff: 4 cases | 6–8: 6 cases | 9–15: 8 cases | 16–25: 10 cases | >25: 12 cases", required: true, caseMixItem: true, note: "Acceptable case types: (1) abnormal regional wall motion at rest due to CAD/MI, OR (2) inducible regional wall motion abnormality due to CAD/MI, OR (3) stress case using UEAs (normal or abnormal). Cases from within past 36 months." },
        ],
      },
      {
        id: "cs-atee",
        title: "Adult Transesophageal (ATEE)",
        items: [
          { id: "cs-atee-1", text: "One complete adult TEE case per physician that performs TEE (all standard views and Doppler assessments)", required: true, caseMixItem: true },
          { id: "cs-atee-2", text: "TEE cases must have indication/finding of significant mitral regurgitation or suspected cardiac source of embolus; at least one case from the facility must have significant MR", required: true, caseMixItem: true },
          { id: "cs-atee-3", text: "Intraoperative TEE may be submitted if physician performed entire study: probe passing, image acquisition, documentation, reporting, and archiving on echo lab system", required: false, caseMixItem: true, note: "Cases from within past 12 months" },
        ],
      },
      {
        id: "cs-acte",
        title: "Adult Congenital Transthoracic (ACTE)",
        subtitle: "Based on total number of staff performing/interpreting adult congenital echo",
        items: [
          { id: "cs-acte-1", text: "≤5 staff: 4 cases | 6–8: 6 cases | 9–15: 8 cases | 16–25: 10 cases | >25: 12 cases", required: true, caseMixItem: true, note: "One case must demonstrate Tetralogy of Fallot (repaired or palliated). Remainder: complex CHD — Conotruncal defects, AV canal defects, ToF, Single ventricle (Fontan), D-TGA repaired or L-TGA, Ross procedure. One case from Lead Congenital Sonographer; Lead Congenital Echocardiographer must be represented. Cases from within past 12 months." },
        ],
      },
      {
        id: "cs-ptte",
        title: "Pediatric Transthoracic (PTTE)",
        subtitle: "All cases must be abnormal",
        items: [
          { id: "cs-ptte-1", text: "≤5 staff: 4 cases (2 shunts, 1 simple obstruction, 1 complex defect) | 6–8: 6 cases (2 shunts, 2 simple, 2 complex) | 9–15: 8 cases (4 shunts, 2 simple, 2 complex) | 16–25: 10 cases (4 shunts, 3 simple, 3 complex) | >25: 12 cases (4 shunts, 4 simple, 4 complex)", required: true, caseMixItem: true, note: "Shunts: ASD, VSD, PDA. Complex: shunt + obstruction, mitral/tricuspid atresia, AV canal, ToF, ventricular hypoplasia, anomalous coronary, truncus arteriosus, interrupted aortic arch. Simple obstruction: aortic/pulmonary valve stenosis, CoA. Initial (unrepaired) studies preferred; repaired accepted if unavailable. Cases from within past 12 months." },
        ],
      },
      {
        id: "cs-ptee",
        title: "Pediatric Transesophageal (PTEE)",
        items: [
          { id: "cs-ptee-1", text: "First-time application: 1 complete TEE case per physician (not focused/limited; all standard views per IAC Standards)", required: true, caseMixItem: true, note: "Cases from within past 36 months" },
          { id: "cs-ptee-2", text: "Reaccreditation: 1 case per physician — may be focused if physician was represented with a complete exam on previous application; otherwise must be complete", required: false, caseMixItem: true, note: "Reaccreditation only" },
        ],
      },
      {
        id: "cs-fetal",
        title: "Fetal Echocardiography",
        subtitle: "Based on total number of staff performing and interpreting fetal echo",
        items: [
          { id: "cs-fetal-1", text: "≤5 staff: 4 cases (1 shunt, 1 simple obstruction, 1 fetal arrhythmia, 1 hypoplastic ventricle) | 6–8: 6 cases (2 shunts, 2 simple, 1 arrhythmia, 1 hypoplastic) | 9–15: 8 cases (4 shunts, 2 simple, 1 arrhythmia, 1 hypoplastic) | 16–25: 10 cases (4 shunts, 3 simple, 1 complex, 1 arrhythmia, 1 hypoplastic) | >25: 12 cases (4 shunts, 4 simple, 2 complex, 1 arrhythmia, 1 hypoplastic)", required: true, caseMixItem: true, note: "Cases from within past 12 months" },
        ],
      },
      {
        id: "cs-multisite",
        title: "Multiple Sites (Additional Cases)",
        subtitle: "Required in addition to base facility cases if application includes one or more multiple sites",
        items: [
          { id: "cs-ms-1", text: "Adult facility: 1 abnormal TTE (AS or LV case) from each site", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-2", text: "Adult facility: 1 representative TEE case per physician performing TEE at each site (unless previously represented at main site)", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-3", text: "Adult facility: 1 stress echocardiogram from each site (abnormal regional WMA at rest, inducible WMA, or stress with UEAs)", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-4", text: "Adult facility: 1 adult congenital transthoracic echo from each site (Conotruncal, AV canal, ToF, Single ventricle, D-TGA/L-TGA, or Ross)", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-5", text: "Pediatric facility: 1 abnormal PTTE from each site (shunt, simple obstruction, or complex defect)", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-6", text: "Pediatric facility: 1 representative PTEE case per physician performing PTEE at each site (unless previously represented at main site)", required: false, caseMixItem: true, note: "Multiple sites only" },
          { id: "cs-ms-7", text: "Pediatric facility: 1 abnormal fetal case from each site (complex defect, fetal arrhythmia, shunt, simple obstruction, or hypoplastic ventricle)", required: false, caseMixItem: true, note: "Multiple sites only" },
        ],
      },
      {
        id: "cs-submission",
        title: "Case Submission Process",
        items: [
          { id: "cs-sub-1", text: "Case study images uploaded via IAC's HIPAA-compliant, secure medical imaging sharing service (intersocietal.org/case-study-upload-submission)", required: true, caseMixItem: true },
          { id: "cs-sub-2", text: "For expedited applications: case study images received by IAC within 2 business days after final submission", required: false, caseMixItem: true, note: "Expedited applications only" },
        ],
      },
    ],
  },
];

// ─── Shared checklist data export for free-tier Navigator use ─────────────────
export { IAC_CHECKLIST };
export type { ChecklistItem, ChecklistSection, ChecklistStep };

// ─── Component ────────────────────────────────────────────────────────────────

const BRAND = "#189aa1";

/**
 * Props for embedding in other contexts (e.g. EchoAccreditation Navigator™).
 * When `trpcProcedure` is provided, uses that instead of the default DIY tool procedure.
 */
interface AccreditationReadinessProps {
  /** tRPC procedure namespace to use. Defaults to "accreditationReadiness" (DIY tool). */
  trpcNamespace?: "accreditationReadiness" | "accreditationReadinessNavigator";
}

export default function AccreditationReadiness({ trpcNamespace = "accreditationReadiness" }: AccreditationReadinessProps = {}) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["step2"]));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // ── Data loading — use the correct tRPC namespace ──
  const diyQuery = trpc.accreditationReadiness.get.useQuery(undefined, {
    enabled: trpcNamespace === "accreditationReadiness",
    retry: false,
  });
  const navQuery = trpc.accreditationReadinessNavigator.get.useQuery(undefined, {
    enabled: trpcNamespace === "accreditationReadinessNavigator",
    retry: false,
  });
  // Auto-check signals from DB (DIY tool only — Navigator has no lab membership)
  const autoChecksQuery = trpc.accreditationReadiness.autoChecks.useQuery(undefined, {
    enabled: trpcNamespace === "accreditationReadiness",
    retry: false,
  });
  const autoChecks: Record<string, boolean> = autoChecksQuery.data ?? {};

  const savedData = trpcNamespace === "accreditationReadiness" ? diyQuery.data : navQuery.data;
  const isLoading = trpcNamespace === "accreditationReadiness" ? diyQuery.isLoading : navQuery.isLoading;

  useEffect(() => {
    if (savedData) {
      try {
        const progress = JSON.parse(savedData.checklistProgress || "{}");
        const notes = JSON.parse(savedData.itemNotes || "{}");
        setChecklistProgress(progress);
        setItemNotes(notes);
      } catch {
        // ignore parse errors
      }
    }
  }, [savedData]);

  // ── Save mutations — one per namespace ──
  const diySave = trpc.accreditationReadiness.save.useMutation({
    onSuccess: () => { setIsDirty(false); toast.success("Progress saved."); },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });
  const navSave = trpc.accreditationReadinessNavigator.save.useMutation({
    onSuccess: () => { setIsDirty(false); toast.success("Progress saved."); },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });
  const saveMutation = trpcNamespace === "accreditationReadiness" ? diySave : navSave;

  // Effective check state: auto-checked items are always true (but user can still manually override)
  const effectiveProgress = useMemo(() => {
    const merged: Record<string, boolean> = { ...checklistProgress };
    for (const [id, val] of Object.entries(autoChecks)) {
      if (val) merged[id] = true; // auto-check overrides unchecked state
    }
    return merged;
  }, [checklistProgress, autoChecks]);

  // ── Progress calculations ──
  const allReadinessItems = IAC_CHECKLIST.flatMap(s => s.sections.flatMap(sec => sec.items));
  const requiredItems = allReadinessItems.filter(i => i.required !== false);
  const checkedTotal = allReadinessItems.filter(i => effectiveProgress[i.id]).length;
  const checkedRequired = requiredItems.filter(i => effectiveProgress[i.id]).length;
  const overallPct = allReadinessItems.length > 0 ? Math.round((checkedTotal / allReadinessItems.length) * 100) : 0;
  const requiredPct = requiredItems.length > 0 ? Math.round((checkedRequired / requiredItems.length) * 100) : 0;

  const handleCheck = useCallback((itemId: string, checked: boolean) => {
    // If auto-checked, don't allow unchecking — the data needs to be removed from the source
    if (autoChecks[itemId] && !checked) return;
    setChecklistProgress(prev => ({ ...prev, [itemId]: checked }));
    setIsDirty(true);
  }, [autoChecks]);

  const handleSave = useCallback(() => {
    saveMutation.mutate({ checklistProgress, itemNotes, completionPct: overallPct });
  }, [checklistProgress, itemNotes, overallPct, saveMutation]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId); else next.add(stepId);
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      return next;
    });
  };

  const getStepProgress = (step: ChecklistStep) => {
    const items = step.sections.flatMap(s => s.items);
    const checked = items.filter(i => effectiveProgress[i.id]).length;
    return { checked, total: items.length, pct: items.length > 0 ? Math.round((checked / items.length) * 100) : 0 };
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const checked = section.items.filter(i => effectiveProgress[i.id]).length;
    return { checked, total: section.items.length, pct: section.items.length > 0 ? Math.round((checked / section.items.length) * 100) : 0 };
  };

  const getReadinessStatus = () => {
    if (requiredPct >= 100) return { label: "Ready to Apply", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> };
    if (requiredPct >= 75) return { label: "Almost Ready", color: "bg-yellow-100 text-yellow-800", icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> };
    if (requiredPct >= 40) return { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: <Info className="w-4 h-4 text-blue-600" /> };
    return { label: "Getting Started", color: "bg-gray-100 text-gray-700", icon: <Circle className="w-4 h-4 text-gray-500" /> };
  };

  const status = getReadinessStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            IAC 2025 Accreditation Readiness Checklist
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Based on the IAC Echocardiography Accreditation Checklist (2025). Organized by Facility, Equipment, Staff, CME, Policies, and Case Studies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print Checklist
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className="flex items-center gap-2 text-white print:hidden"
            style={{ background: BRAND }}
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </div>

      {/* Overall Progress Card */}
      <Card className="border border-[#189aa1]/20 bg-gradient-to-r from-[#f0fbfc] to-white">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {status.icon}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: BRAND }}>{overallPct}%</div>
              <div className="text-xs text-gray-500">Overall readiness</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Required Items</div>
              <div className="text-2xl font-bold text-gray-800">{checkedRequired}<span className="text-base font-normal text-gray-400">/{requiredItems.length}</span></div>
              <Progress value={requiredPct} className="mt-2 h-2" />
              <div className="text-xs text-gray-500 mt-1">{requiredPct}% of required items complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Steps */}
      <div className="space-y-3">
        {IAC_CHECKLIST.map((step) => {
          const stepProg = getStepProgress(step);
          const isExpanded = expandedSteps.has(step.id);
          const isCaseMix = !!step.caseMixStep;

          return (
            <Card
              key={step.id}
              className={`overflow-hidden ${isCaseMix ? "border border-amber-200" : "border border-gray-200"}`}
            >
              {/* Step Header */}
              <button className="w-full text-left" onClick={() => toggleStep(step.id)}>
                <div className={`flex items-center justify-between p-4 transition-colors ${isCaseMix ? "hover:bg-amber-50 bg-amber-50/40" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{
                        background: isCaseMix
                          ? "#d97706"
                          : stepProg.pct === 100 ? "#22c55e" : BRAND,
                      }}
                    >
                      {isCaseMix
                        ? <ClipboardCheck className="w-4 h-4" />
                        : stepProg.pct === 100 ? <CheckCircle2 className="w-4 h-4" /> : step.step
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">{step.title}</span>
                        {isCaseMix && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Tracked separately
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold" style={{ color: isCaseMix ? "#d97706" : BRAND }}>
                        {stepProg.checked}/{stepProg.total}
                      </div>
                      <div className="text-xs text-gray-400">{isCaseMix ? "acknowledged" : `${stepProg.pct}% done`}</div>
                    </div>
                    {!isCaseMix && (
                      <div className="w-16 hidden sm:block">
                        <Progress value={stepProg.pct} className="h-1.5" />
                      </div>
                    )}
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </button>

              {/* Step Content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {step.sections.map((section) => {
                    const secProg = getSectionProgress(section);
                    const isSectionExpanded = expandedSections.has(section.id) || step.sections.length === 1;

                    return (
                      <div key={section.id} className="border-b border-gray-50 last:border-0">
                        {/* Section Header */}
                        <button
                          className="w-full text-left"
                          onClick={() => step.sections.length > 1 && toggleSection(section.id)}
                        >
                          <div className={`flex items-center justify-between px-5 py-3 ${step.sections.length > 1 ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"} transition-colors`}>
                            <div>
                              <div className="font-medium text-gray-700 text-sm">{section.title}</div>
                              {section.subtitle && <div className="text-xs text-gray-400 mt-0.5">{section.subtitle}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: isCaseMix ? "#d97706" : secProg.pct === 100 ? "#22c55e" : BRAND,
                                  color: isCaseMix ? "#d97706" : secProg.pct === 100 ? "#22c55e" : BRAND,
                                }}
                              >
                                {secProg.checked}/{secProg.total}
                              </Badge>
                              {step.sections.length > 1 && (
                                isSectionExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Section Items */}
                        {isSectionExpanded && (
                          <div className="px-5 pb-3 space-y-1">
                            {section.items.map((item) => {
                              const isAutoChecked = !!autoChecks[item.id];
                              const isChecked = !!effectiveProgress[item.id];
                              const hasNote = !!itemNotes[item.id];
                              const isEditingThis = editingNote === item.id;
                              const isCaseMixItem = !!item.caseMixItem;

                              return (
                                <div
                                  key={item.id}
                                  className={`rounded-lg p-3 transition-colors ${
                                    isChecked
                                      ? isCaseMixItem ? "bg-amber-50" : "bg-green-50"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <button
                                      className={`mt-0.5 flex-shrink-0 ${isAutoChecked ? "cursor-default" : ""}`}
                                      onClick={() => !isAutoChecked && handleCheck(item.id, !isChecked)}
                                      title={isAutoChecked ? "Auto-verified from your lab data — remove the source record to uncheck" : isCaseMixItem ? "Mark as acknowledged (does not affect readiness score)" : undefined}
                                    >
                                      {isChecked
                                        ? <CheckCircle2 className={`w-5 h-5 ${isCaseMixItem ? "text-amber-500" : isAutoChecked ? "text-teal-500" : "text-green-500"}`} />
                                        : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                      }
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm leading-snug ${isChecked ? "text-gray-500 line-through" : "text-gray-700"}`}>
                                        {item.text}
                                        {isAutoChecked && (
                                          <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 no-underline" style={{ textDecoration: "none" }}>auto-verified</span>
                                        )}
                                        {item.required === false && !isCaseMixItem && !isAutoChecked && (
                                          <span className="ml-2 text-xs text-gray-400 no-underline">(recommended)</span>
                                        )}
                                        {isCaseMixItem && (
                                          <span className="ml-2 text-xs text-amber-600 no-underline font-medium">(tracked separately)</span>
                                        )}
                                      </div>
                                      {item.note && (
                                        <div className="mt-1 text-xs text-blue-600 flex items-start gap-1">
                                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                          {item.note}
                                        </div>
                                      )}
                                      {/* Note toggle */}
                                      <div className="mt-1.5 flex items-center gap-2">
                                        <button
                                          className="text-xs text-gray-400 hover:text-gray-600 underline"
                                          onClick={() => setEditingNote(isEditingThis ? null : item.id)}
                                        >
                                          {isEditingThis ? "Close note" : hasNote ? "Edit note" : "Add note"}
                                        </button>
                                        {hasNote && !isEditingThis && (
                                          <span className="text-xs text-gray-500 italic truncate max-w-xs">{itemNotes[item.id]}</span>
                                        )}
                                      </div>
                                      {isEditingThis && (
                                        <Textarea
                                          className="mt-2 text-xs h-16 resize-none"
                                          placeholder="Add a note, document location, or action item..."
                                          value={itemNotes[item.id] ?? ""}
                                          onChange={(e) => {
                                            setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }));
                                            setIsDirty(true);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Save */}
      {isDirty && (
        <div className="sticky bottom-4 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 text-white shadow-lg"
            style={{ background: BRAND }}
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      )}
    </div>
  );
}
