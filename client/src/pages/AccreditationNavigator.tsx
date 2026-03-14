/*
  EchoAccreditation Navigator™ — iHeartEcho™
  IAC 2025 Standards — Adult Echo, Pediatric/Congenital Echo, PeriOp TEE
  Tabs: Equipment | Facility | Medical Director | Medical Staff | Technical Director
        | Technical Staff | CME | Case Study Submissions | Quality Measures | Application Submission
  Filters: Adult TTE | Adult TEE | Stress | Pediatric TTE | Pediatric TEE | Fetal | PeriOp TEE
*/
import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import BackToEchoAssist from "@/components/BackToEchoAssist";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BookOpen, ExternalLink, Award, Users, FileText, GraduationCap,
  Stethoscope, Activity, Baby, Heart, Zap, ClipboardList, ShieldCheck,
  Monitor, Building2, UserCheck, Settings, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Info, ListChecks, Square, CheckSquare, BarChart3
} from "lucide-react";

const BRAND = "#189aa1";

// ─── Filter Types ─────────────────────────────────────────────────────────────
type Filter = "Adult TTE" | "Adult TEE" | "Stress" | "Pediatric TTE" | "Pediatric TEE" | "Fetal" | "PeriOp TEE";
type TabId =
  | "equipment"
  | "facility"
  | "medical-director"
  | "medical-staff"
  | "technical-director"
  | "technical-staff"
  | "cme"
  | "case-studies"
  | "quality-measures"
  | "application";

// ─── Filter Groups ────────────────────────────────────────────────────────────
const ADULT_FILTERS: Filter[] = ["Adult TTE", "Adult TEE", "Stress"];
const PEDIATRIC_FILTERS: Filter[] = ["Pediatric TTE", "Pediatric TEE", "Fetal"];
const PERIOP_FILTERS: Filter[] = ["PeriOp TEE"];
const ALL_FILTERS: Filter[] = [...ADULT_FILTERS, ...PEDIATRIC_FILTERS, ...PERIOP_FILTERS];

const FILTER_CONFIG: Record<Filter, { label: string; color: string; icon: React.ElementType; source: string }> = {
  "Adult TTE":    { label: "Adult TTE",    color: "#189aa1", icon: Stethoscope, source: "IAC Adult Echo Standards 2025" },
  "Adult TEE":    { label: "Adult TEE",    color: "#0e7490", icon: Stethoscope, source: "IAC Adult Echo Standards 2025" },
  "Stress":       { label: "Stress Echo",  color: "#7c3aed", icon: Activity,    source: "IAC Adult Echo Standards 2025" },
  "Pediatric TTE":{ label: "Ped TTE",      color: "#059669", icon: Users,       source: "IAC Pediatric Echo Standards 2025" },
  "Pediatric TEE":{ label: "Ped TEE",      color: "#047857", icon: Users,       source: "IAC Pediatric Echo Standards 2025" },
  "Fetal":        { label: "Fetal",        color: "#db2777", icon: Baby,        source: "IAC Pediatric Echo Standards 2025" },
  "PeriOp TEE":   { label: "PeriOp TEE",   color: "#b45309", icon: Heart,       source: "IAC PeriOp TEE Standards 2025" },
};

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "equipment",          label: "Equipment",               icon: Monitor },
  { id: "facility",           label: "Facility",                icon: Building2 },
  { id: "medical-director",   label: "Medical Director",        icon: Award },
  { id: "medical-staff",      label: "Medical Staff",           icon: Stethoscope },
  { id: "technical-director", label: "Technical Director",      icon: UserCheck },
  { id: "technical-staff",    label: "Technical Staff",         icon: Users },
  { id: "cme",                label: "CME",                     icon: GraduationCap },
  { id: "case-studies",       label: "Case Study Submissions",  icon: FileText },
  { id: "quality-measures",   label: "Quality Measures",        icon: ClipboardList },
  { id: "application",        label: "Application Submission",  icon: CheckCircle2 },
];

// ─── Content Data Structure ───────────────────────────────────────────────────
interface Section {
  id: string;
  ref: string;
  title: string;
  items: string[];
  note?: string;
}

interface TabContent {
  filters: Filter[];
  sections: Section[];
}

// ─── EQUIPMENT ────────────────────────────────────────────────────────────────
const EQUIPMENT_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE"],
    sections: [
      {
        id: "eq-atte-1", ref: "1.1B", title: "Cardiac Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for pulsed (PW) and continuous wave (CW) Doppler",
          "Tissue Doppler imaging (TDI)",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Display or DICOM header must identify: institution, patient name, second identifier (MRN or DOB), date and time, ECG",
          "Capabilities to measure: distance between two points, area on 2-D image, blood flow velocities, time intervals, peak and mean gradients from spectral Doppler",
        ],
        note: "Instrument settings to enable optimization of ultrasound enhancing agents (UEAs) and tissue Doppler imaging are recommended.",
      },
      {
        id: "eq-atte-2", ref: "2.3A", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of ultrasound instrumentation and digitizing equipment",
          "Establish and adhere to a policy for routine safety inspections and testing of all facility electrical equipment",
          "Establish and adhere to an instrument cleaning schedule including routine cleaning of equipment parts, filters, and transducers per manufacturer specifications",
          "Cleaning schedule must be frequent enough to allow for accurate data collection",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "eq-atee-1", ref: "2.1B", title: "TEE Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Multiplane transesophageal ultrasound transducers must incorporate multiplane imaging capabilities",
          "Capabilities to measure: distance, area, blood flow velocities, time intervals, peak and mean gradients",
        ],
        note: "3-D TEE capability is recommended when available.",
      },
      {
        id: "eq-atee-2", ref: "2.3A", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of all ultrasound instrumentation",
          "Establish and adhere to a policy for routine safety inspections and testing of all electrical equipment",
          "Establish and adhere to an instrument cleaning schedule per manufacturer specifications",
          "TEE transducers must be cleaned and disinfected according to manufacturer and facility infection control protocols",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "eq-stress-1", ref: "3.1B", title: "Stress Echo Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Capabilities to measure: distance, area, blood flow velocities, time intervals, peak and mean gradients",
        ],
      },
      {
        id: "eq-stress-2", ref: "3.1.1B", title: "Stress Testing Equipment",
        items: [
          "Treadmill or bicycle ergometer for exercise stress testing",
          "Pharmacologic stress agent infusion pump for dobutamine/adenosine protocols",
          "12-lead ECG monitoring system with cardiac monitoring leads",
          "Blood pressure monitoring equipment",
          "Emergency resuscitation equipment (crash cart, defibrillator, oxygen, suction) must be immediately available",
          "Allergy kits must be available and easily accessible in all areas where UEAs are in use; expiration dates must be checked regularly",
        ],
        note: "An alternative protocol should be in place when triggered acquisition/timing malfunctions.",
      },
      {
        id: "eq-stress-3", ref: "2.3A", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of all ultrasound instrumentation",
          "Establish and adhere to a policy for routine safety inspections and testing of all electrical equipment",
          "Establish and adhere to an instrument cleaning schedule per manufacturer specifications",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE"],
    sections: [
      {
        id: "eq-ptte-1", ref: "1.1B (Ped)", title: "Pediatric Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Display or DICOM header must identify: institution, patient name, second identifier (MRN or DOB), date and time, ECG",
          "Capabilities to measure: distance, area, blood flow velocities, time intervals, peak and mean gradients",
          "Transducers appropriate for pediatric patients including neonates and infants (high-frequency transducers required)",
        ],
        note: "3-D imaging capability is recommended when clinically indicated.",
      },
      {
        id: "eq-ptte-2", ref: "2.3A (Ped)", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of all ultrasound instrumentation",
          "Establish and adhere to a policy for routine safety inspections and testing of all electrical equipment",
          "Establish and adhere to an instrument cleaning schedule per manufacturer specifications",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "eq-ptee-1", ref: "2.1B (Ped)", title: "Pediatric TEE Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Multiplane transesophageal transducers must incorporate multiplane imaging capabilities",
          "Pediatric and neonatal TEE probes must be available in appropriate sizes",
          "Capabilities to measure: distance, area, blood flow velocities, time intervals, peak and mean gradients",
        ],
      },
      {
        id: "eq-ptee-2", ref: "2.3A (Ped)", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of all ultrasound instrumentation",
          "Establish and adhere to a policy for routine safety inspections and testing of all electrical equipment",
          "TEE transducers must be cleaned and disinfected according to manufacturer and facility infection control protocols",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "eq-fetal-1", ref: "3.1B (Ped)", title: "Fetal Echo Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Display or DICOM header must identify: institution, patient name, second identifier, date and time",
          "Capabilities to measure: distance, area, blood flow velocities, time intervals, peak and mean gradients",
          "High-resolution transducers appropriate for fetal imaging",
        ],
        note: "3-D/4-D fetal echocardiography capability is recommended when clinically indicated.",
      },
      {
        id: "eq-fetal-2", ref: "2.3A (Ped)", title: "Instrument Maintenance",
        items: [
          "Record method and frequency of maintenance of all ultrasound instrumentation",
          "Establish and adhere to a policy for routine safety inspections and testing of all electrical equipment",
          "Establish and adhere to an instrument cleaning schedule per manufacturer specifications",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "eq-periop-1", ref: "1.1B (PeriOp)", title: "PeriOp TEE Ultrasound System Requirements",
        items: [
          "M-Mode imaging capability",
          "2-D imaging (real-time B-mode)",
          "Spectral display for PW and CW Doppler and tissue Doppler imaging",
          "Color flow Doppler imaging",
          "Monitor or display of suitable size and quality for all modalities",
          "Display or DICOM header must identify: parent institution, patient name, second identifier (MRN or DOB), date and time, ECG",
          "Capabilities to measure: distance between two points, area on 2-D image, blood flow velocities, time intervals, peak and mean gradients",
          "Transesophageal ultrasound transducers must incorporate multiplane imaging capabilities",
        ],
        note: "Instrument settings to enable optimization of ultrasound enhancing agents (UEAs) and tissue Doppler imaging are recommended.",
      },
      {
        id: "eq-periop-2", ref: "4.1.3A (PeriOp)", title: "Emergency Equipment Requirements",
        items: [
          "A fully equipped cardiac arrest cart (crash cart) must be readily available",
          "A defibrillator must be readily available",
          "Equipment for starting and maintaining intravenous access",
          "Oxygen tanks or wall-mounted oxygen sources with appropriate cannulae and/or masks",
          "Suction equipment",
        ],
        note: "Emergency supplies must be readily available in every location where TEE procedures are performed.",
      },
    ],
  },
};

// ─── FACILITY ─────────────────────────────────────────────────────────────────
const FACILITY_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE"],
    sections: [
      {
        id: "fac-atte-1", ref: "2.1A", title: "Examination and Interpretation Areas",
        items: [
          "Examinations must be performed in a setting providing patient and technical staff safety, comfort, and privacy",
          "Adequate spacing is required for a patient bed (allowing position changes), echocardiographic imaging system, and patient privacy",
          "Portable studies must still allow adequate room for patient positioning and equipment use",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
          "Adequate designated space must be provided for interpretation of echocardiograms and preparation of reports",
        ],
        note: "Approximately 150 sq ft is recommended for a TTE exam room; approximately 200–250 sq ft is recommended for TEE or exercise stress areas.",
      },
      {
        id: "fac-atte-2", ref: "2.2A", title: "Storage",
        items: [
          "Space permitted for storage of records and supplies must be sufficient for the patient volume of the facility",
          "Space should be provided for data evaluation, interpretation, and discussion of the study with the sonographer and/or referring physician",
        ],
      },
      {
        id: "fac-atte-3", ref: "5.1A–5.3A", title: "Administrative Policies",
        items: [
          "Patient Confidentiality: All personnel must adhere to professional principles of patient-physician confidentiality as legally required by federal, state, local, or institutional policy",
          "Patient/Customer Complaints: A policy must be in place outlining the process for patients or customers to issue a complaint/grievance and how the facility handles it",
          "Primary Source Verification: A policy must be in place identifying how the facility verifies medical education, training, licenses, and certifications of all physicians and staff",
        ],
        note: "Sample documents for each required policy are available on the IAC website at intersocietal.org/helpful-resources/sample-documents-repository.",
      },
      {
        id: "fac-atte-4", ref: "6.1A", title: "Multiple Sites",
        items: [
          "All facilities must have the same Medical Director",
          "All facilities must have a Technical Director",
          "Identical testing protocols must be used at all sites",
          "Identical diagnostic criteria must be used at all sites",
          "For multi-site facilities, each site must be represented in the QI process at least annually",
          "Equipment of similar quality and capability must be used at all sites",
          "Quality and safety standards must be identical across all sites",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "fac-atee-1", ref: "2.1A", title: "TEE Examination Areas",
        items: [
          "TEE examinations must be performed in a setting providing patient and technical staff safety, comfort, and privacy",
          "Approximately 200–250 sq ft is recommended for a TEE examination area",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
          "Adequate designated space must be provided for interpretation and report preparation",
        ],
      },
      {
        id: "fac-atee-2", ref: "4.1A", title: "Safety Requirements for TEE",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Personnel Safety Policy (Ergonomics): A policy must be in place to address staff safety, comfort, and avoidance of work-related musculoskeletal disorders (MSD)",
          "Emergency resuscitation equipment must be readily available",
          "A fully equipped crash cart must be accessible",
          "Oxygen and suction equipment must be available",
        ],
      },
      {
        id: "fac-atee-3", ref: "5.1A–5.3A", title: "Administrative Policies",
        items: [
          "Patient Confidentiality: All personnel must adhere to patient-physician confidentiality requirements",
          "Patient/Customer Complaints: A policy must be in place for handling complaints/grievances",
          "Primary Source Verification: A policy must be in place for verifying credentials of all physicians and staff",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "fac-stress-1", ref: "3.8B", title: "Stress Echo Facility Arrangement",
        items: [
          "The stress echocardiography area must be arranged to allow for rapid image acquisition at peak stress",
          "Approximately 200–250 sq ft is recommended for a stress echo examination area",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing",
          "Establishment of and/or adherence to an infection control policy",
        ],
      },
      {
        id: "fac-stress-2", ref: "4.1A", title: "Safety Requirements for Stress Echo",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Personnel Safety Policy (Ergonomics): A policy must be in place to address staff safety and avoidance of MSD",
          "Emergency resuscitation equipment must be immediately available: crash cart, defibrillator, oxygen, suction, IV access",
          "A method to track procedural complications must be maintained",
          "A physician must be present or immediately available during all stress procedures",
        ],
      },
      {
        id: "fac-stress-3", ref: "5.1A–5.3A", title: "Administrative Policies",
        items: [
          "Patient Confidentiality: All personnel must adhere to patient-physician confidentiality requirements",
          "Patient/Customer Complaints: A policy must be in place for handling complaints/grievances",
          "Primary Source Verification: A policy must be in place for verifying credentials of all physicians and staff",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE"],
    sections: [
      {
        id: "fac-ptte-1", ref: "2.1A (Ped)", title: "Pediatric Examination Areas",
        items: [
          "Examinations must be performed in a setting providing patient and technical staff safety, comfort, and privacy",
          "Adequate spacing is required for a patient bed, echocardiographic imaging system, and patient privacy",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
          "Adequate designated space must be provided for interpretation and report preparation",
        ],
      },
      {
        id: "fac-ptte-2", ref: "4.1A (Ped)", title: "Safety Requirements",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Personnel Safety Policy (Ergonomics): A policy must be in place to address staff safety and avoidance of MSD",
          "Emergency resuscitation equipment must be readily available",
          "Radiation safety techniques must be observed when in the presence of ionizing radiation",
        ],
      },
      {
        id: "fac-ptte-3", ref: "5.1A–5.3A (Ped)", title: "Administrative Policies",
        items: [
          "Patient Confidentiality: All personnel must adhere to patient-physician confidentiality requirements",
          "Patient/Customer Complaints: A policy must be in place for handling complaints/grievances",
          "Primary Source Verification: A policy must be in place for verifying credentials of all physicians and staff",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "fac-ptee-1", ref: "2.1A (Ped)", title: "Pediatric TEE Examination Areas",
        items: [
          "TEE examinations must be performed in a setting providing patient and technical staff safety, comfort, and privacy",
          "Approximately 200–250 sq ft is recommended for a TEE examination area",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
        ],
      },
      {
        id: "fac-ptee-2", ref: "4.1A (Ped)", title: "Safety Requirements",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Emergency resuscitation equipment must be readily available",
          "A method to track procedural complications must be maintained",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "fac-fetal-1", ref: "2.1A (Ped)", title: "Fetal Echo Examination Areas",
        items: [
          "Examinations must be performed in a setting providing patient and technical staff safety, comfort, and privacy",
          "Adequate spacing is required for a patient bed, echocardiographic imaging system, and patient privacy",
          "Patient privacy must be assured with appropriate curtains or doors",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
        ],
      },
      {
        id: "fac-fetal-2", ref: "4.1A (Ped)", title: "Safety Requirements",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Emergency resuscitation equipment must be readily available",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "fac-periop-1", ref: "2.1A (PeriOp)", title: "PeriOp TEE Facility Requirements",
        items: [
          "Examinations may be performed in operating rooms, electrophysiology laboratories, catheterization laboratories, and hybrid operating rooms",
          "Every location where TEE is performed must have an emergency procedure plan",
          "Patient privacy and safety must be maintained in all locations",
          "A sink and antiseptic soap must be readily available for hand washing per infection control policy",
          "Establishment of and/or adherence to an infection control policy",
        ],
      },
      {
        id: "fac-periop-2", ref: "4.1A (PeriOp)", title: "Safety Requirements",
        items: [
          "Patient and employee safety are promoted by written policies and procedures approved by the Medical Director",
          "Personnel Safety Policy (Ergonomics): A policy must be in place to address staff safety and avoidance of MSD",
          "When in the presence of ionizing radiation, all staff must observe proper radiation safety techniques",
          "A fully equipped crash cart must be readily available",
          "A defibrillator must be readily available",
          "Equipment for starting and maintaining intravenous access must be available",
          "Oxygen tanks or wall-mounted oxygen sources with appropriate cannulae and/or masks must be available",
          "Suction equipment must be available",
        ],
      },
      {
        id: "fac-periop-3", ref: "5.1A–5.3A (PeriOp)", title: "Administrative Policies",
        items: [
          "Patient Confidentiality: All personnel must adhere to patient-physician confidentiality requirements",
          "Patient/Customer Complaints: A policy must be in place for handling complaints/grievances",
          "Primary Source Verification: A policy must be in place for verifying credentials of all physicians and staff",
        ],
        note: "Sample documents for each required policy are available on the IAC website at intersocietal.org/helpful-resources/sample-documents-repository.",
      },
      {
        id: "fac-periop-4", ref: "6.1A (PeriOp)", title: "Multiple Sites",
        items: [
          "All facilities must have the same Medical Director",
          "All facilities must have a Technical Manager",
          "Identical testing protocols must be used at all sites",
          "Identical diagnostic criteria must be used at all sites",
          "For multi-site facilities, each site must be represented in the QI process at least annually",
          "Equipment of similar quality and capability must be used at all sites",
          "Quality and safety standards must be identical across all sites",
        ],
      },
    ],
  },
};

// ─── MEDICAL DIRECTOR ─────────────────────────────────────────────────────────
const MEDICAL_DIRECTOR_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "md-adult-1", ref: "1.1A", title: "Medical Director — Initial Qualifications",
        items: [
          "Must be a licensed physician",
          "Option 1: NBE active Testamur status AND qualifying practice experience over previous 18 months: TTE 450 exams / 18 mo; TEE 75 exams / 18 mo; Stress 75 exams / 18 mo",
          "Option 2: Level 2 or 3 COCATS echocardiography training AND qualifying practice experience over previous 24 months: TTE 600 exams / 24 mo; TEE 100 exams / 24 mo; Stress 100 exams / 24 mo",
          "Option 3: Cumulative practice experience of at least 1,800 echocardiography examinations AND qualifying practice experience over previous 36 months: TTE 900 exams / 36 mo; TEE 150 exams / 36 mo; Stress 150 exams / 36 mo",
        ],
      },
      {
        id: "md-adult-2", ref: "1.1.2A", title: "Medical Director — Ongoing Practice Experience",
        items: [
          "TTE: minimum 300 examinations per year (performance/interpretation)",
          "TEE: minimum 50 examinations per year",
          "Stress: minimum 50 examinations per year",
        ],
      },
      {
        id: "md-adult-3", ref: "1.1.3A", title: "Medical Director — Responsibilities",
        items: [
          "Responsible for all clinical services provided and for the determination of quality and appropriateness of care",
          "Supervises the entire operation of the facility or may delegate specific operations to associate directors and the Technical Director",
          "Assures compliance of medical and technical staff to the Standards and supervises their work",
          "Must be an active participant in the interpretation of studies performed in the facility",
        ],
      },
      {
        id: "md-adult-4", ref: "1.1.4A", title: "Medical Director — CME Requirements",
        items: [
          "Must document at least 30 hours of CME relevant to cardiac imaging over a period of three years",
          "CME credits must be earned within the three-year period prior to application submission",
          "At least 15 hours must be echocardiography related",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
        note: "If within the past three years the Medical Director has completed formal training or has acquired/renewed NBE Testamur status, the CME requirement will be considered fulfilled.",
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "md-atee-1", ref: "1.1A", title: "Medical Director — TEE Qualifications",
        items: [
          "Must meet all Medical Director qualifications for Adult TTE (1.1A)",
          "In order to achieve accreditation for TEE, the facility must first be accredited in adult transthoracic echocardiography",
          "TEE ongoing experience: minimum 50 TEE examinations per year",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "md-stress-1", ref: "1.1A / Appendix A", title: "Medical Director — Stress Echo Qualifications",
        items: [
          "Must meet all Medical Director qualifications for Adult TTE (1.1A)",
          "In order to achieve accreditation for Stress Echo, the facility must first be accredited in adult transthoracic echocardiography",
          "Stress ongoing experience: minimum 50 stress examinations per year",
          "If a non-physician (nurse, PA, NP, exercise physiologist) supervises the stress test under the physician's license, the facility must document appropriate training and competence per ACC/AHA Clinical Competence Statement on Stress Testing",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "md-peds-1", ref: "1.1A (Ped)", title: "Medical Director — Initial Qualifications",
        items: [
          "Must be a licensed physician",
          "Option 1: Advanced Level of Expertise — high level of expertise in all aspects of pediatric echocardiography; able to perform independently and interpret echocardiograms in patients with all forms of congenital and acquired pediatric heart disease, and to supervise and train others. In addition to core requirement of 150 studies, each advanced level physician must perform and interpret at least 200 additional pediatric TTE exams and review or perform/interpret another 200 pediatric echocardiograms. At least 50 must be done in infants ≤1 year of age.",
          "Option 2: Three years of echocardiography practice experience with at least 1,800 echocardiogram/Doppler examination interpretations in infants, children, and patients with congenital heart disease",
        ],
        note: "It is recognized that some facilities performing pediatric echocardiograms, particularly those that perform a majority of adult studies, will not achieve the above numbers. However, the individual Medical Director must possess the outlined experience.",
      },
      {
        id: "md-peds-2", ref: "1.1.2A (Ped)", title: "Medical Director — Responsibilities",
        items: [
          "Responsible for all clinical services provided and for the determination of quality and appropriateness of care",
          "Supervises the entire operation of the facility as it relates to pediatric echocardiography",
          "Assures compliance of medical and technical staff to the Standards and supervises their work",
          "Must be an active participant in the interpretation of studies performed in the facility",
        ],
      },
      {
        id: "md-peds-3", ref: "1.1.2.5A (Ped)", title: "Medical Director — CME Requirements",
        items: [
          "Must document at least 30 hours of CME relevant to cardiac imaging over a period of three years",
          "CME credits must be earned within the three-year period prior to application submission",
          "15 hours must be relevant to pediatric/congenital echocardiography",
          "Yearly accumulated CME must be kept on file and available to IAC when requested",
        ],
        note: "If the Medical Director has completed formal training as specified under 1.1.1.1A in the past three years, the CME requirement will be considered fulfilled.",
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "md-ptee-1", ref: "1.1A (Ped)", title: "Medical Director — Pediatric TEE Qualifications",
        items: [
          "Must meet all Medical Director qualifications for Pediatric TTE (1.1A Ped)",
          "Additional training and experience in pediatric TEE required",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "md-fetal-1", ref: "1.1A (Ped)", title: "Medical Director — Fetal Echo Qualifications",
        items: [
          "Must meet all Medical Director qualifications for Pediatric TTE (1.1A Ped)",
          "Additional training and experience in fetal echocardiography required",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "md-periop-1", ref: "1.1A (PeriOp)", title: "Medical Director — Initial Qualifications",
        items: [
          "Must be a licensed physician",
          "Option 1: NBE active Testamur status AND qualifying practice experience over previous 18 months: 150 PTE exams / 18 mo",
          "Option 2: Level 2 or 3 COCATS echocardiography training AND qualifying practice experience over previous 24 months: 200 PTE exams / 24 mo",
          "Option 3: Cumulative practice experience of at least 450 perioperative TEE examinations AND qualifying practice experience over previous 36 months: 300 PTE exams / 36 mo",
        ],
      },
      {
        id: "md-periop-2", ref: "1.1.2A (PeriOp)", title: "Medical Director — Ongoing Practice Experience",
        items: [
          "Minimum 100 perioperative TEE examinations per year (performance/interpretation)",
        ],
      },
      {
        id: "md-periop-3", ref: "1.1.3A (PeriOp)", title: "Medical Director — Responsibilities",
        items: [
          "Responsible for all clinical services provided and for the determination of quality and appropriateness of care",
          "Supervises the entire operation of the perioperative TEE service",
          "Assures compliance of medical and technical staff to the Standards and supervises their work",
          "Must be an active participant in the interpretation of studies performed in the facility",
          "Approves written policies and procedures for patient and employee safety",
        ],
      },
      {
        id: "md-periop-4", ref: "1.1.4A (PeriOp)", title: "Medical Director — CME Requirements",
        items: [
          "Must document at least 30 hours of CME relevant to cardiac imaging over a period of three years",
          "CME credits must be earned within the three-year period prior to application submission",
          "At least 15 hours must be echocardiography related",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
        note: "If within the past three years the Medical Director has completed formal training or has acquired/renewed NBE Testamur status, the CME requirement will be considered fulfilled.",
      },
    ],
  },
};

// ─── MEDICAL STAFF ────────────────────────────────────────────────────────────
const MEDICAL_STAFF_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "ms-adult-1", ref: "1.3A", title: "Medical Staff — Initial Qualifications",
        items: [
          "All members of the medical staff must be licensed physicians",
          "Option 1: NBE active Testamur status AND qualifying practice experience over previous 12 months: TTE 150 exams / 12 mo; TEE 25 exams / 12 mo; Stress 25 exams / 12 mo",
          "Option 2: Level 2 or 3 COCATS echocardiography training",
          "Option 3: Cumulative practice experience of at least 600 echocardiography examinations AND qualifying practice experience over previous 12 months: TTE 150 exams / 12 mo; TEE 25 exams / 12 mo; Stress 25 exams / 12 mo",
        ],
        note: "If there has been a lapse in the ongoing practice of echocardiography of more than two years, there must be documentation of: (i) supervised review of interpretive and performance skills by the Medical Director; and (ii) 30 hours of echocardiography-related CME prior to resuming independent interpretation.",
      },
      {
        id: "ms-adult-2", ref: "1.3.2A", title: "Medical Staff — Ongoing Practice Experience",
        items: [
          "TTE: minimum 150 examinations per year (performance/interpretation)",
          "TEE: minimum 25 examinations per year",
          "Stress: minimum 25 examinations per year",
        ],
      },
      {
        id: "ms-adult-3", ref: "1.3.3A", title: "Medical Staff — Responsibilities",
        items: [
          "The medical staff interprets and/or performs clinical studies",
        ],
      },
      {
        id: "ms-adult-4", ref: "1.3.4A", title: "Medical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of CME relevant to cardiac imaging over a period of three years",
          "CME credits must be earned within the three-year period prior to application submission",
          "At least 5 hours must be echocardiography related",
          "Yearly accumulated CME must be kept on file and available to the IAC when requested",
        ],
        note: "If within the past three years the medical staff member has completed formal training or has acquired/renewed NBE Testamur status, the CME requirement will be considered fulfilled.",
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "ms-atee-1", ref: "1.3A", title: "Medical Staff — TEE Qualifications",
        items: [
          "Must meet all Medical Staff qualifications for Adult TTE (1.3A)",
          "TEE ongoing experience: minimum 25 TEE examinations per year",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "ms-stress-1", ref: "1.3A", title: "Medical Staff — Stress Echo Qualifications",
        items: [
          "Must meet all Medical Staff qualifications for Adult TTE (1.3A)",
          "Stress ongoing experience: minimum 25 stress examinations per year",
          "Physicians interpreting stress echocardiograms should follow COCATS level II training requirements",
          "Level III training is recommended for interpretation of advanced stress echo (valvular heart disease, HCM, pulmonary hypertension, etc.)",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "ms-peds-1", ref: "1.3A (Ped)", title: "Medical Staff — Initial Qualifications",
        items: [
          "All members of the medical staff must be licensed physicians",
          "Option 1: Advanced Level of Expertise — high level of expertise in all aspects of pediatric echocardiography; able to perform independently and interpret echocardiograms in patients with all forms of congenital and acquired pediatric heart disease, and to supervise and train others. In addition to core requirement of 150 studies, each advanced level physician must perform and interpret at least 200 additional pediatric TTE exams and review or perform/interpret another 200 pediatric echocardiograms.",
          "Option 2: Three years of echocardiography practice experience with at least 1,800 echocardiogram/Doppler examination interpretations in infants, children, and patients with congenital heart disease",
        ],
      },
      {
        id: "ms-peds-2", ref: "1.3.2A (Ped)", title: "Medical Staff — Responsibilities",
        items: [
          "The medical staff interprets and/or performs clinical studies",
        ],
      },
      {
        id: "ms-peds-3", ref: "1.3.3A (Ped)", title: "Medical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of echocardiography-related CME during their credentialing triennial cycle",
          "10 hours must be relevant to pediatric/congenital echocardiography",
          "Yearly accumulated CME must be kept on file and available to IAC when requested",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "ms-ptee-1", ref: "1.3A (Ped)", title: "Medical Staff — Pediatric TEE Qualifications",
        items: [
          "Must meet all Medical Staff qualifications for Pediatric TTE (1.3A Ped)",
          "Additional training and experience in pediatric TEE required",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "ms-fetal-1", ref: "1.3A (Ped)", title: "Medical Staff — Fetal Echo Qualifications",
        items: [
          "Must meet all Medical Staff qualifications for Pediatric TTE (1.3A Ped)",
          "Additional training and experience in fetal echocardiography required",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "ms-periop-1", ref: "1.3A (PeriOp)", title: "Medical Staff — Initial Qualifications",
        items: [
          "All members of the medical staff must be licensed physicians",
          "Option 1: NBE active Testamur status AND qualifying practice experience over previous 12 months: 50 PTE exams / 12 mo",
          "Option 2: Level 2 or 3 COCATS echocardiography training AND qualifying practice experience over previous 24 months: 75 PTE exams / 24 mo",
          "Option 3: Cumulative practice experience of at least 150 perioperative TEE examinations AND qualifying practice experience over previous 36 months: 100 PTE exams / 36 mo",
        ],
        note: "All performing physicians must be adequately trained and experienced to perform and interpret the study (1.4.1B).",
      },
      {
        id: "ms-periop-2", ref: "1.3.2A (PeriOp)", title: "Medical Staff — Ongoing Practice Experience",
        items: [
          "Minimum 50 perioperative TEE examinations per year (performance/interpretation)",
        ],
      },
      {
        id: "ms-periop-3", ref: "1.3.3A (PeriOp)", title: "Medical Staff — Responsibilities",
        items: [
          "The medical staff performs and interprets perioperative TEE studies",
        ],
      },
      {
        id: "ms-periop-4", ref: "1.3.4A (PeriOp)", title: "Medical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of CME relevant to cardiac imaging over a period of three years",
          "CME credits must be earned within the three-year period prior to application submission",
          "At least 5 hours must be echocardiography related",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
};

// ─── TECHNICAL DIRECTOR ───────────────────────────────────────────────────────
const TECHNICAL_DIRECTOR_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "td-adult-1", ref: "1.2A", title: "Technical Director — Qualifications",
        items: [
          "A qualified Technical Director(s) must be designated for the facility; generally a full-time position",
          "If not on-site full time or serves as TD in another facility, an appropriately credentialed sonographer must be present and assume TD duties",
          "In a facility with no sonographers, the Medical Director serves as Technical Director",
          "Must hold an appropriate credential in echocardiography:",
          "  • Registered Diagnostic Cardiac Sonographer (RDCS) from ARDMS",
          "  • Registered Cardiac Sonographer (RCS) or Registered Congenital Cardiac Sonographer (RCCS) from CCI",
          "  • Canadian Registered Cardiac Sonographer (CRCS), Sonography Canada",
          "  • Advanced Cardiac Sonographer (ACS) from CCI",
        ],
      },
      {
        id: "td-adult-2", ref: "1.2.2A", title: "Technical Director — Responsibilities",
        items: [
          "Reports directly to the Medical Director or his/her delegate",
          "Performance of echocardiograms in the facility",
          "General supervision of the technical staff and/or ancillary staff",
          "Delegation, when warranted, of specific responsibilities to the technical staff and/or ancillary staff",
          "Daily technical operation of the facility (staff scheduling, patient scheduling, facility record keeping, etc.)",
          "Operation and maintenance of facility equipment",
          "Compliance of the technical and/or ancillary staff to the Standards",
          "Working with the Medical Director, medical staff, and technical staff to ensure quality patient care",
          "Technical training",
        ],
      },
      {
        id: "td-adult-3", ref: "1.2.3A", title: "Technical Director — CME Requirements",
        items: [
          "Must document at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "td-atee-1", ref: "1.2A", title: "Technical Director — TEE Qualifications",
        items: [
          "Must meet all Technical Director qualifications for Adult TTE (1.2A)",
          "Additional training and competency documentation in TEE required",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "td-stress-1", ref: "1.2A", title: "Technical Director — Stress Echo Qualifications",
        items: [
          "Must meet all Technical Director qualifications for Adult TTE (1.2A)",
          "Additional training in stress testing protocols required",
          "Sonographers who perform stress echocardiography should have independently performed 1,000 complete TTE exams with a minimum of one year experience (preferably two years)",
          "Sonographers should perform at least 100 stress echocardiograms annually for maintenance of competency",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "td-peds-1", ref: "1.2A (Ped)", title: "Technical Director — Qualifications",
        items: [
          "A qualified Technical Director(s) must be designated for the facility; generally a full-time position",
          "If not on-site full time or serves as TD in another facility, an appropriately credentialed sonographer must be present and assume TD duties",
          "In a facility with no sonographers, the physician Technical Director must have either Advanced Level of Expertise or three years of echocardiography practice experience with at least 1,800 echocardiogram/Doppler examination interpretations in infants, children, and patients with congenital heart disease, or an appropriate sonographer credential",
          "Must hold an appropriate credential in echocardiography:",
          "  • RDCS in Pediatric Echocardiography (PE) from ARDMS",
          "  • Registered Congenital Cardiac Sonographer (RCCS) from CCI",
        ],
      },
      {
        id: "td-peds-2", ref: "1.2.2A (Ped)", title: "Technical Director — Responsibilities",
        items: [
          "Reports directly to the Medical Director or his/her delegate",
          "Performance of echocardiograms in the facility",
          "General supervision of technical and ancillary staff",
          "Daily technical operation of the facility",
          "Operation and maintenance of facility equipment",
          "Compliance of the technical and/or ancillary staff to the Standards",
          "Working with the Medical Director, medical staff, and technical staff to ensure quality patient care",
          "Technical training",
        ],
      },
      {
        id: "td-peds-3", ref: "1.2.2.2A (Ped)", title: "Technical Director — CME Requirements",
        items: [
          "Must document at least 15 hours of echocardiography-related CME during their credentialing triennial cycle",
          "10 hours must be relevant to pediatric/congenital echocardiography",
          "Yearly accumulated CME must be kept on file and available to IAC when requested",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "td-ptee-1", ref: "1.2A (Ped)", title: "Technical Director — Pediatric TEE Qualifications",
        items: [
          "Must meet all Technical Director qualifications for Pediatric TTE (1.2A Ped)",
          "Additional training and competency documentation in pediatric TEE required",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "td-fetal-1", ref: "1.2A (Ped)", title: "Technical Director — Fetal Echo Qualifications",
        items: [
          "Must meet all Technical Director qualifications for Pediatric TTE (1.2A Ped)",
          "Additional training and competency documentation in fetal echocardiography required",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "td-periop-1", ref: "1.2A (PeriOp)", title: "Technical Manager — Qualifications",
        items: [
          "A qualified Technical Manager must be designated for the facility",
          "Must hold an appropriate credential in echocardiography:",
          "  • RDCS from ARDMS",
          "  • RCS or RCCS from CCI",
          "  • CRCS from Sonography Canada",
          "  • ACS from CCI",
          "  • Or be a physician with appropriate training and experience in perioperative TEE",
        ],
      },
      {
        id: "td-periop-2", ref: "1.2.2A (PeriOp)", title: "Technical Manager — Responsibilities",
        items: [
          "Reports directly to the Medical Director or his/her delegate",
          "General supervision of technical staff",
          "Daily technical operation of the perioperative TEE service",
          "Operation and maintenance of facility equipment",
          "Compliance of technical staff to the Standards",
          "Working with the Medical Director and medical staff to ensure quality patient care",
          "Technical training",
        ],
      },
      {
        id: "td-periop-3", ref: "1.2.3A (PeriOp)", title: "Technical Manager — CME Requirements",
        items: [
          "Must document at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
};

// ─── TECHNICAL STAFF ──────────────────────────────────────────────────────────
const TECHNICAL_STAFF_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "ts-adult-1", ref: "1.4A", title: "Technical Staff — Qualifications",
        items: [
          "Must hold an appropriate credential in echocardiography:",
          "  • RDCS from ARDMS",
          "  • RCS or RCCS from CCI",
          "  • CRCS from Sonography Canada",
          "  • ACS from CCI",
          "Provisional Staff (new graduates): Must obtain an appropriate credential within one year from the date of graduation; must work under appropriate supervision of a credentialed sonographer",
          "Cross-training staff: Must obtain an appropriate credential within two years from the start date of training; must work under appropriate supervision of a credentialed sonographer",
        ],
      },
      {
        id: "ts-adult-2", ref: "1.5A", title: "Technical Staff — Responsibilities",
        items: [
          "Reports to the Technical Director",
          "Assumes the responsibilities specified by the Technical Director",
          "Generally responsible for the performance of clinical examinations and other tasks assigned",
        ],
      },
      {
        id: "ts-adult-3", ref: "1.6A", title: "Technical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "ts-atee-1", ref: "1.4A", title: "Technical Staff — TEE Qualifications",
        items: [
          "Must meet all Technical Staff qualifications for Adult TTE (1.4A)",
          "Additional training and competency documentation in TEE required",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "ts-stress-1", ref: "1.4A / 3.6B", title: "Technical Staff — Stress Echo Qualifications",
        items: [
          "Must meet all Technical Staff qualifications for Adult TTE (1.4A)",
          "Should have independently performed 1,000 complete TTE exams with a minimum of one year experience (preferably two years) before performing stress echo",
          "Should perform at least 100 stress echocardiograms annually for maintenance of competency",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "ts-peds-1", ref: "1.4A (Ped)", title: "Technical Staff — Qualifications",
        items: [
          "Must hold an appropriate credential in echocardiography:",
          "  • RDCS in Pediatric Echocardiography (PE) from ARDMS",
          "  • RCCS from CCI",
          "Provisional Staff: Must obtain an appropriate credential within one year from the date of graduation; must work under appropriate supervision of a credentialed sonographer",
          "Cross-training staff: Must obtain an appropriate credential within two years from the start date of training; must work under appropriate supervision",
        ],
      },
      {
        id: "ts-peds-2", ref: "1.5A (Ped)", title: "Technical Staff — Responsibilities",
        items: [
          "Reports to the Technical Director",
          "Assumes the responsibilities specified by the Technical Director",
          "Generally responsible for the performance of clinical examinations and other tasks assigned",
        ],
      },
      {
        id: "ts-peds-3", ref: "1.6A (Ped)", title: "Technical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of echocardiography-related CME during their credentialing triennial cycle",
          "10 hours must be relevant to pediatric/congenital echocardiography",
          "Yearly accumulated CME must be kept on file and available to IAC when requested",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "ts-ptee-1", ref: "1.4A (Ped)", title: "Technical Staff — Pediatric TEE Qualifications",
        items: [
          "Must meet all Technical Staff qualifications for Pediatric TTE (1.4A Ped)",
          "Additional training and competency documentation in pediatric TEE required",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "ts-fetal-1", ref: "1.4A (Ped)", title: "Technical Staff — Fetal Echo Qualifications",
        items: [
          "Must meet all Technical Staff qualifications for Pediatric TTE (1.4A Ped)",
          "Additional training and competency documentation in fetal echocardiography required",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "ts-periop-1", ref: "1.4A (PeriOp)", title: "Technical Staff — Qualifications",
        items: [
          "Must hold an appropriate credential in echocardiography:",
          "  • RDCS from ARDMS",
          "  • RCS or RCCS from CCI",
          "  • CRCS from Sonography Canada",
          "  • ACS from CCI",
          "Technical Personnel in PeriOp TEE may include a sonographer, a certified nurse anesthetist (CRNA), or a nurse",
          "Duties include: preparing the patient for the test, assisting the physician with ultrasound equipment, monitoring the patient during and after the examination, and administration of anesthetic medication and airway management",
        ],
      },
      {
        id: "ts-periop-2", ref: "1.4.2A (PeriOp)", title: "Technical Staff — CME Requirements",
        items: [
          "Must document at least 15 hours of cardiac imaging-related CME during their credentialing triennial cycle",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
};

// ─── CME ──────────────────────────────────────────────────────────────────────
const CME_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "cme-adult-1", ref: "1.1.4A / 1.2.3A / 1.3.4A / 1.6A", title: "CME Summary — Adult Echo Personnel",
        items: [
          "Medical Director: 30 hours of CME relevant to cardiac imaging over 3 years; at least 15 hours must be echocardiography related",
          "Technical Director: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "Medical Staff: 15 hours of CME relevant to cardiac imaging over 3 years; at least 5 hours must be echocardiography related",
          "Technical Staff: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "All CME credits must be earned within the three-year period prior to application submission",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
        note: "One hour of CME or non-CME work-related musculoskeletal disorder (WRMSD) training is recommended for all staff. This can be fulfilled through CME, in-service training, or IAC webcast.",
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "cme-atee-1", ref: "1.1.4A / 1.2.3A / 1.3.4A / 1.6A", title: "CME Summary — Adult TEE Personnel",
        items: [
          "Medical Director: 30 hours of CME relevant to cardiac imaging over 3 years; at least 15 hours must be echocardiography related",
          "Technical Director: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "Medical Staff: 15 hours of CME relevant to cardiac imaging over 3 years; at least 5 hours must be echocardiography related",
          "Technical Staff: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "All CME credits must be earned within the three-year period prior to application submission",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "cme-stress-1", ref: "1.1.4A / 1.2.3A / 1.3.4A / 1.6A", title: "CME Summary — Stress Echo Personnel",
        items: [
          "Medical Director: 30 hours of CME relevant to cardiac imaging over 3 years; at least 15 hours must be echocardiography related",
          "Technical Director: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "Medical Staff: 15 hours of CME relevant to cardiac imaging over 3 years; at least 5 hours must be echocardiography related",
          "Technical Staff: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "All CME credits must be earned within the three-year period prior to application submission",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "cme-peds-1", ref: "1.1.2.5A / 1.2.2.2A / 1.3.3A / 1.6A (Ped)", title: "CME Summary — Pediatric Echo Personnel",
        items: [
          "Medical Director: 30 hours of CME relevant to cardiac imaging over 3 years; 15 hours must be relevant to pediatric/congenital echocardiography",
          "Technical Director: 15 hours of echocardiography-related CME during credentialing triennial cycle; 10 hours must be relevant to pediatric/congenital echocardiography",
          "Medical Staff: 15 hours of echocardiography-related CME during credentialing triennial cycle; 10 hours must be relevant to pediatric/congenital echocardiography",
          "Technical Staff: 15 hours of echocardiography-related CME during credentialing triennial cycle; 10 hours must be relevant to pediatric/congenital echocardiography",
          "All CME credits must be earned within the three-year period prior to application submission",
          "Yearly accumulated CME must be kept on file and available to IAC when requested",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "cme-ptee-1", ref: "(Ped)", title: "CME Summary — Pediatric TEE Personnel",
        items: [
          "Same CME requirements as Pediatric TTE with additional emphasis on TEE-specific training",
          "Medical Director: 30 hours; 15 hours pediatric/congenital related",
          "Technical Director: 15 hours; 10 hours pediatric/congenital related",
          "Medical Staff: 15 hours; 10 hours pediatric/congenital related",
          "Technical Staff: 15 hours; 10 hours pediatric/congenital related",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "cme-fetal-1", ref: "(Ped)", title: "CME Summary — Fetal Echo Personnel",
        items: [
          "Same CME requirements as Pediatric TTE with additional emphasis on fetal echocardiography training",
          "Medical Director: 30 hours; 15 hours pediatric/congenital related",
          "Technical Director: 15 hours; 10 hours pediatric/congenital related",
          "Medical Staff: 15 hours; 10 hours pediatric/congenital related",
          "Technical Staff: 15 hours; 10 hours pediatric/congenital related",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "cme-periop-1", ref: "1.1.4A / 1.2.3A / 1.3.4A / 1.4.2A (PeriOp)", title: "CME Summary — PeriOp TEE Personnel",
        items: [
          "Medical Director: 30 hours of CME relevant to cardiac imaging over 3 years; at least 15 hours must be echocardiography related",
          "Technical Manager: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "Medical Staff: 15 hours of CME relevant to cardiac imaging over 3 years; at least 5 hours must be echocardiography related",
          "Technical Staff: 15 hours of cardiac imaging-related CME during credentialing triennial cycle",
          "All CME credits must be earned within the three-year period prior to application submission",
          "Yearly accumulated CME must be kept on file and available for submission upon request",
        ],
      },
    ],
  },
};

// ─── CASE STUDY SUBMISSIONS ───────────────────────────────────────────────────
const CASE_STUDIES_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE"],
    sections: [
      {
        id: "cs-atte-1", ref: "1.2B", title: "Adult TTE — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in examination performance and interpretation",
          "Volume requirements are assessed per modality and must be documented",
        ],
      },
      {
        id: "cs-atte-2", ref: "Part C / 2.1C", title: "Adult TTE — QI Case Reviews",
        items: [
          "A minimum of 2 cases per modality (TTE) per quarter must be evaluated for test appropriateness",
          "A minimum of 2 cases per modality (TTE) per quarter must be reviewed for technical quality (image quality, completeness, adherence to protocol)",
          "A minimum of 2 cases per modality (TTE) per quarter must be evaluated for interpretive quality and accuracy",
          "A minimum of 2 cases per modality (TTE) per quarter must be evaluated for final report completeness and timeliness",
          "Cases must represent as many sonographers/physicians as possible",
          "Discrepancies in acquisition quality and variability must be reconciled",
          "Differences in interpretation must be reconciled to achieve uniform examination interpretation",
        ],
        note: "Correlation with other imaging modalities (cardiac CT, MRI, catheterization, nuclear perfusion) should be routinely performed. Appropriate areas: LV function/RWMA/EF, aortic stenosis, aortic regurgitation, mitral valve regurgitation, mitral stenosis, pulmonary artery pressure.",
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "cs-atee-1", ref: "2.2B", title: "Adult TEE — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in TEE examination performance and interpretation",
        ],
      },
      {
        id: "cs-atee-2", ref: "Part C / 2.1C", title: "Adult TEE — QI Case Reviews",
        items: [
          "A minimum of 2 TEE cases per quarter must be evaluated for test appropriateness",
          "A minimum of 2 TEE cases per quarter must be reviewed for technical quality",
          "A minimum of 2 TEE cases per quarter must be evaluated for interpretive quality",
          "A minimum of 2 TEE cases per quarter must be evaluated for final report completeness and timeliness",
          "Cases must represent as many sonographers/physicians as possible",
        ],
        note: "Appropriate areas for correlation of TEE: LV function and regional wall motion analysis, mechanism and severity of valvular dysfunction, presence or absence of thrombi or vegetations, presence or absence of aortic dissection, atheromas, hematomas, or ruptures.",
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "cs-stress-1", ref: "3.2B", title: "Stress Echo — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in stress echo examination performance and interpretation",
        ],
      },
      {
        id: "cs-stress-2", ref: "Part C / 2.1C", title: "Stress Echo — QI Case Reviews",
        items: [
          "A minimum of 2 stress echo cases per quarter must be evaluated for test appropriateness",
          "A minimum of 2 stress echo cases per quarter must be reviewed for technical quality",
          "A minimum of 2 stress echo cases per quarter must be evaluated for interpretive quality",
          "A minimum of 2 stress echo cases per quarter must be evaluated for final report completeness and timeliness",
          "Cases must represent as many sonographers/physicians as possible",
        ],
        note: "Appropriate areas for correlation of stress echo: LV function/RWMA/EF, myocardial viability, myocardial perfusion, valvular disease, pulmonary artery pressure.",
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE"],
    sections: [
      {
        id: "cs-ptte-1", ref: "1.2B (Ped)", title: "Pediatric TTE — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in pediatric TTE examination performance and interpretation",
        ],
      },
      {
        id: "cs-ptte-2", ref: "Part C / 2.1C (Ped)", title: "Pediatric TTE — QI Case Reviews",
        items: [
          "A minimum of 2 pediatric TTE cases per quarter must be evaluated for test appropriateness",
          "A minimum of 2 pediatric TTE cases per quarter must be reviewed for technical quality",
          "A minimum of 2 pediatric TTE cases per quarter must be evaluated for interpretive quality",
          "A minimum of 2 pediatric TTE cases per quarter must be evaluated for final report completeness and timeliness",
          "Cases must represent as many sonographers/physicians as possible",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "cs-ptee-1", ref: "2.2B (Ped)", title: "Pediatric TEE — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in pediatric TEE examination performance and interpretation",
        ],
      },
      {
        id: "cs-ptee-2", ref: "Part C / 2.1C (Ped)", title: "Pediatric TEE — QI Case Reviews",
        items: [
          "A minimum of 2 pediatric TEE cases per quarter must be evaluated for test appropriateness",
          "A minimum of 2 pediatric TEE cases per quarter must be reviewed for technical quality",
          "A minimum of 2 pediatric TEE cases per quarter must be evaluated for interpretive quality",
          "A minimum of 2 pediatric TEE cases per quarter must be evaluated for final report completeness and timeliness",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "cs-fetal-1", ref: "3.2B (Ped)", title: "Fetal Echo — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in fetal echocardiography examination performance and interpretation",
        ],
      },
      {
        id: "cs-fetal-2", ref: "Part C / 2.1C (Ped)", title: "Fetal Echo — QI Case Reviews",
        items: [
          "A minimum of 2 fetal echo cases per quarter must be evaluated for test appropriateness",
          "A minimum of 2 fetal echo cases per quarter must be reviewed for technical quality",
          "A minimum of 2 fetal echo cases per quarter must be evaluated for interpretive quality",
          "A minimum of 2 fetal echo cases per quarter must be evaluated for final report completeness and timeliness",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "cs-periop-1", ref: "1.2B (PeriOp)", title: "PeriOp TEE — Procedure Volumes",
        items: [
          "The annual procedure volume must be sufficient to maintain proficiency in perioperative TEE examination performance and interpretation",
        ],
      },
      {
        id: "cs-periop-2", ref: "Part C / 2.1C (PeriOp)", title: "PeriOp TEE — QI Case Reviews",
        items: [
          "A minimum of 2 perioperative TEE cases per quarter must be evaluated for technical quality (image quality, completeness, adherence to protocol)",
          "A minimum of 2 perioperative TEE cases per quarter must be evaluated for interpretive quality and accuracy",
          "A minimum of 2 perioperative TEE cases per quarter must be evaluated for final report completeness and timeliness",
          "Cases must represent as many echocardiographers/physicians as possible",
          "Discrepancies in acquisition quality and variability must be reconciled",
          "Differences in interpretation must be reconciled to achieve uniform examination interpretation",
        ],
        note: "Correlation should be performed with any appropriate available imaging modality, surgical findings, or clinical outcomes for a minimum of 4 cases annually. Appropriate areas: LV function and RWMA, LV or RV function, presence/mechanism/localization/severity of valvular dysfunction, defects of atrial and ventricular septa, presence/absence of thrombi or vegetations, presence/absence of anomalous venous connections, presence/absence of aortic dissection/atheromas/hematomas/ruptures.",
      },
    ],
  },
};

// ─── QUALITY MEASURES ─────────────────────────────────────────────────────────
const QUALITY_MEASURES_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "qm-adult-1", ref: "1.1C–1.2C", title: "QI Program Requirements",
        items: [
          "The facility must have a written Quality Improvement (QI) program for all imaging procedures",
          "The QI program must include evaluation and review of: test appropriateness; technical quality and safety; interpretive quality review; report completeness and timeliness",
          "The Medical Director, staff, and/or an appointed QI Committee must provide oversight to the QI program",
          "Oversight includes review of QI evaluation reports and any corrective actions taken to address deficiencies",
        ],
        note: "The IAC Quality Improvement (QI) Self-Assessment Tool may be utilized. Learn more at www.intersocietal.org/QITool.",
      },
      {
        id: "qm-adult-2", ref: "2.1C", title: "QI Measures — Adult Echo",
        items: [
          "Test Appropriateness: Minimum 2 cases per modality (TTE, TEE, SE, ACTE) per quarter; categorized as appropriate/usually appropriate, may be appropriate, or rarely appropriate/usually not appropriate",
          "Technical Quality Review: Minimum 2 cases per modality per quarter; evaluate clinical images for clarity, completeness of study, adherence to facility imaging acquisition protocols; cases must represent as many sonographers as possible",
          "Interpretive Quality Review: Minimum 2 cases per modality per quarter; evaluate quality and accuracy of interpretation; cases must represent as many physicians as possible",
          "Final Report Completeness and Timeliness: Minimum 2 cases per modality per quarter; evaluate completeness and timeliness per Standards 3.2A, 3.2.4A, 3.3A–3.6A",
        ],
      },
      {
        id: "qm-adult-3", ref: "3.1C", title: "QI Meetings",
        items: [
          "The facility must have a minimum of 2 QI meetings per year",
          "At least one meeting must review the results of the QI analyses and any additional QI-related topics",
          "All staff must participate in at least one meeting per year",
        ],
      },
      {
        id: "qm-adult-4", ref: "4.1C–4.2C", title: "QI Documentation and Record Retention",
        items: [
          "QI documentation must include: the data for all QI measures above; minutes from the QI meetings; participant list (may include remote participation and/or review of minutes)",
          "QI documentation must be maintained and available for all appropriate personnel to review",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "qm-atee-1", ref: "Part C", title: "QI Program — Adult TEE",
        items: [
          "Same QI program requirements as Adult TTE apply to TEE modality",
          "Minimum 2 TEE cases per quarter for each QI measure",
          "Minimum 2 QI meetings per year; all staff must participate in at least one per year",
          "QI documentation must be maintained and available for all appropriate personnel to review",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "qm-stress-1", ref: "Part C", title: "QI Program — Stress Echo",
        items: [
          "Same QI program requirements as Adult TTE apply to Stress Echo modality",
          "Minimum 2 stress echo cases per quarter for each QI measure",
          "Minimum 2 QI meetings per year; all staff must participate in at least one per year",
          "QI documentation must be maintained and available for all appropriate personnel to review",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "qm-peds-1", ref: "1.1C–1.2C (Ped)", title: "QI Program Requirements — Pediatric/Fetal",
        items: [
          "The facility must have a written QI program for all imaging procedures",
          "The QI program must include evaluation and review of: test appropriateness; technical quality and safety; interpretive quality review; report completeness and timeliness",
          "The Medical Director, staff, and/or an appointed QI Committee must provide oversight to the QI program",
        ],
      },
      {
        id: "qm-peds-2", ref: "2.1C (Ped)", title: "QI Measures — Pediatric/Fetal",
        items: [
          "Test Appropriateness: Minimum 2 cases per modality per quarter; categorized as appropriate/usually appropriate, may be appropriate, or rarely appropriate/usually not appropriate",
          "Technical Quality Review: Minimum 2 cases per modality per quarter; evaluate clinical images for clarity, completeness of study, adherence to facility imaging acquisition protocols",
          "Interpretive Quality Review: Minimum 2 cases per modality per quarter; evaluate quality and accuracy of interpretation",
          "Final Report Completeness and Timeliness: Minimum 2 cases per modality per quarter; evaluate completeness and timeliness per Standards",
        ],
      },
      {
        id: "qm-peds-3", ref: "3.1C (Ped)", title: "QI Meetings — Pediatric/Fetal",
        items: [
          "The facility must have a minimum of 2 QI meetings per year",
          "At least one meeting must review the results of the QI analyses and any additional QI-related topics",
          "All staff must participate in at least one meeting per year",
        ],
      },
      {
        id: "qm-peds-4", ref: "4.1C–4.2C (Ped)", title: "QI Documentation — Pediatric/Fetal",
        items: [
          "QI documentation must include: the data for all QI measures above; minutes from the QI meetings; participant list",
          "QI documentation must be maintained and available for all appropriate personnel to review",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "qm-ptee-1", ref: "Part C (Ped)", title: "QI Program — Pediatric TEE",
        items: [
          "Same QI program requirements as Pediatric TTE apply to Pediatric TEE modality",
          "Minimum 2 pediatric TEE cases per quarter for each QI measure",
          "Minimum 2 QI meetings per year; all staff must participate in at least one per year",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "qm-fetal-1", ref: "Part C (Ped)", title: "QI Program — Fetal Echo",
        items: [
          "Same QI program requirements as Pediatric TTE apply to Fetal Echo modality",
          "Minimum 2 fetal echo cases per quarter for each QI measure",
          "Minimum 2 QI meetings per year; all staff must participate in at least one per year",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "qm-periop-1", ref: "1.1C–1.2C (PeriOp)", title: "QI Program Requirements — PeriOp TEE",
        items: [
          "The facility must have a written QI program for all imaging procedures",
          "The QI program must include evaluation and review of: technical quality and safety; interpretive quality review; report completeness and timeliness",
          "The Medical Director of the service, staff, and/or an appointed QI Committee must provide oversight to the QI program",
        ],
        note: "The IAC Quality Improvement (QI) Self-Assessment Tool may be utilized. Learn more at www.intersocietal.org/QITool.",
      },
      {
        id: "qm-periop-2", ref: "2.1C (PeriOp)", title: "QI Measures — PeriOp TEE",
        items: [
          "Minimum of 2 perioperative TEE cases per quarter must be evaluated (same cases may be used for all measures)",
          "Technical Quality Review: Evaluate clinical images for clarity, completeness of study, adherence to facility imaging acquisition protocols; minimum 2 cases per quarter; cases must represent as many echocardiographers as possible",
          "Interpretive Quality Review: Evaluate quality and accuracy of interpretation; minimum 2 cases per quarter; cases must represent as many physicians as possible",
          "Final Report Completeness and Timeliness: Evaluate completeness and timeliness per Standards 3.3A, 3.4.4A (completeness) and 3.2A–3.2.2A (timeliness); minimum 2 cases per quarter",
        ],
        note: "Correlation should be performed with any appropriate available imaging modality, surgical findings, or clinical outcomes for a minimum of 4 cases annually.",
      },
      {
        id: "qm-periop-3", ref: "3.1C (PeriOp)", title: "QI Meetings — PeriOp TEE",
        items: [
          "The facility must have a minimum of 2 QI meetings per year",
          "At least one meeting must review the results of the QI analyses and any additional QI-related topics",
          "All staff must participate in at least one meeting per year",
        ],
      },
      {
        id: "qm-periop-4", ref: "4.1C–4.2C (PeriOp)", title: "QI Documentation — PeriOp TEE",
        items: [
          "QI documentation must include: the data for all QI measures above; minutes from the QI meetings; participant list (may include remote participation and/or review of minutes)",
          "QI documentation must be maintained and available for all appropriate personnel to review",
        ],
      },
    ],
  },
};

// ─── APPLICATION SUBMISSION ───────────────────────────────────────────────────
const APPLICATION_CONTENT: Record<Filter, TabContent> = {
  "Adult TTE": {
    filters: ["Adult TTE", "Adult TEE", "Stress"],
    sections: [
      {
        id: "app-adult-1", ref: "IAC Application Process", title: "Application Submission — Adult Echo",
        items: [
          "Facilities must apply through the IAC online application portal at intersocietal.org",
          "In order to achieve accreditation for TEE, Stress, or Adult Congenital TTE, all facilities are required to first be accredited in Adult Transthoracic Echocardiography",
          "Facilities may submit completed applications for all testing areas at the same time, or may first apply for TTE and add on TEE, Stress, or Adult Congenital TTE at a later date",
          "All areas granted accreditation will expire at the same time regardless of when they were submitted in the accreditation cycle",
          "Application must include: facility information, personnel documentation, equipment documentation, QI program documentation, case submission data",
        ],
      },
      {
        id: "app-adult-2", ref: "3.1A–3.1.3A", title: "Records and Archiving Requirements",
        items: [
          "A system for recording and archiving echocardiographic data (images, measurements, and final reports) must be in place",
          "A permanent record of the images and interpretation must be made and retained in accordance with applicable state or federal guidelines for medical records, generally five to seven years",
          "Images and interpretation must be retrievable for comparison with new studies",
          "Acceptable archiving media includes digital storage (PACS, CD/DVD, or other digital archiving media); digital storage is required",
          "Measures for HIPAA compliance and IT security must be in place",
        ],
      },
      {
        id: "app-adult-3", ref: "3.2A–3.6A", title: "Report Requirements",
        items: [
          "Provisions must exist for the timely reporting of examination data",
          "A policy must be in place for communicating critical results",
          "STAT echocardiogram findings must be made available immediately by an interpreting physician",
          "Routine inpatient studies must be interpreted by a qualified physician within 24 hours of completion; outpatient studies by end of next business day",
          "Final verified signed report must be completed within the longer of 48 hours or the next business day after interpretation",
          "Preliminary reports can only be issued by a physician",
          "Echocardiography reporting must be standardized; all physicians must agree on uniform diagnostic criteria and a standardized report format",
          "Report must include: demographics (date, facility name/ID, patient name/ID, DOB/age, indication, performing sonographer, ordering physician, height, weight, gender, blood pressure); summary of results; quantitative data; Doppler evaluation; report text comments on all structures",
          "Final report must be completely typewritten, reviewed, signed, and dated manually or electronically by the interpreting physician; stamped signatures or signing by non-physician staff is unacceptable",
        ],
      },
    ],
  },
  "Adult TEE": {
    filters: ["Adult TEE"],
    sections: [
      {
        id: "app-atee-1", ref: "IAC Application Process", title: "Application Submission — Adult TEE",
        items: [
          "Must first be accredited in Adult TTE before applying for Adult TEE accreditation",
          "Application must include all Adult TEE-specific documentation: TEE personnel qualifications, TEE equipment documentation, TEE QI program documentation",
          "TEE Report must include: medication used for procedure (or reference to anesthesiology service), ease of transducer insertion, complications (yes or no), components of procedure (color flow Doppler, PW/CW Doppler, contrast administration), and comments on all cardiac structures",
        ],
      },
    ],
  },
  "Stress": {
    filters: ["Stress"],
    sections: [
      {
        id: "app-stress-1", ref: "IAC Application Process", title: "Application Submission — Stress Echo",
        items: [
          "Must first be accredited in Adult TTE before applying for Stress Echo accreditation",
          "Application must include all Stress Echo-specific documentation: stress echo personnel qualifications, stress echo equipment documentation, stress echo QI program documentation",
          "Stress Echo Report must include: type of stress protocol (exercise or pharmacologic), medications administered, hemodynamic response, ECG findings, imaging findings at each stage, interpretation",
        ],
      },
    ],
  },
  "Pediatric TTE": {
    filters: ["Pediatric TTE", "Pediatric TEE", "Fetal"],
    sections: [
      {
        id: "app-peds-1", ref: "IAC Application Process (Ped)", title: "Application Submission — Pediatric/Fetal Echo",
        items: [
          "Facilities must apply through the IAC online application portal at intersocietal.org",
          "Application must include: facility information, personnel documentation, equipment documentation, QI program documentation, case submission data",
          "Pediatric and congenital transthoracic, pediatric and congenital transesophageal, and fetal echocardiography are separate accreditation areas",
        ],
      },
      {
        id: "app-peds-2", ref: "3.1A–3.6A (Ped)", title: "Records and Report Requirements — Pediatric/Fetal",
        items: [
          "A system for recording and archiving echocardiographic data must be in place",
          "A permanent record of images and interpretation must be retained per applicable state or federal guidelines (generally five to seven years)",
          "Images and interpretation must be retrievable for comparison with new studies",
          "Digital storage is required",
          "Measures for HIPAA compliance and IT security must be in place",
          "Provisions must exist for the timely reporting of examination data",
          "A policy must be in place for communicating critical results",
          "Routine inpatient studies must be interpreted within 24 hours; outpatient studies by end of next business day",
          "Final verified signed report must be completed within the longer of 48 hours or the next business day after interpretation",
          "Report must be completely typewritten, reviewed, signed, and dated by the interpreting physician",
        ],
      },
    ],
  },
  "Pediatric TEE": {
    filters: ["Pediatric TEE"],
    sections: [
      {
        id: "app-ptee-1", ref: "IAC Application Process (Ped)", title: "Application Submission — Pediatric TEE",
        items: [
          "Application must include all Pediatric TEE-specific documentation: personnel qualifications, equipment documentation, QI program documentation",
          "TEE Report must include: medication used for procedure, ease of transducer insertion, complications, components of procedure, and comments on all cardiac structures",
        ],
      },
    ],
  },
  "Fetal": {
    filters: ["Fetal"],
    sections: [
      {
        id: "app-fetal-1", ref: "IAC Application Process (Ped)", title: "Application Submission — Fetal Echo",
        items: [
          "Application must include all Fetal Echo-specific documentation: personnel qualifications, equipment documentation, QI program documentation",
          "Fetal Echo Report must include: gestational age, indication for study, fetal position/presentation, cardiac situs, cardiac axis, structural findings, Doppler findings, interpretation",
        ],
      },
    ],
  },
  "PeriOp TEE": {
    filters: ["PeriOp TEE"],
    sections: [
      {
        id: "app-periop-1", ref: "IAC Application Process (PeriOp)", title: "Application Submission — PeriOp TEE",
        items: [
          "Facilities must apply through the IAC online application portal at intersocietal.org",
          "Application must include: facility information, personnel documentation, equipment documentation, QI program documentation, case submission data",
          "PeriOp TEE is a separate accreditation area from Adult Echo",
        ],
      },
      {
        id: "app-periop-2", ref: "3.1A–3.4.4A (PeriOp)", title: "Records and Report Requirements — PeriOp TEE",
        items: [
          "A system for recording and archiving echocardiographic data must be in place",
          "A permanent record of images and interpretation must be retained per applicable state or federal guidelines",
          "Digital storage is required; measures for HIPAA compliance and IT security must be in place",
          "Provisions must exist for the timely reporting of examination data",
          "A policy must be in place for communicating critical results",
          "STAT findings must be made available immediately by an interpreting physician",
          "Routine inpatient studies must be interpreted within 24 hours; outpatient studies by end of next business day",
          "Final verified signed report must be completed within the longer of 48 hours or the next business day after interpretation",
          "Pre-procedural report must include comments on: left ventricle, right ventricle, left atrium, right atrium, left atrial appendage, interatrial septum, aortic valve, mitral valve, tricuspid valve, pulmonic valve, pericardium, aorta, and measurements/spectral Doppler data",
          "Post-procedural report must include comments relevant to the procedure performed",
          "Final report must be completely typewritten, reviewed, signed, and dated by the interpreting physician",
        ],
      },
    ],
  },
};

// ─── Tab Content Map ──────────────────────────────────────────────────────────
const TAB_CONTENT_MAP: Record<TabId, Record<Filter, TabContent>> = {
  "equipment":          EQUIPMENT_CONTENT,
  "facility":           FACILITY_CONTENT,
  "medical-director":   MEDICAL_DIRECTOR_CONTENT,
  "medical-staff":      MEDICAL_STAFF_CONTENT,
  "technical-director": TECHNICAL_DIRECTOR_CONTENT,
  "technical-staff":    TECHNICAL_STAFF_CONTENT,
  "cme":                CME_CONTENT,
  "case-studies":       CASE_STUDIES_CONTENT,
  "quality-measures":   QUALITY_MEASURES_CONTENT,
  "application":        APPLICATION_CONTENT,
};

// ─── Filter → DB key mapping ──────────────────────────────────────────────────
const FILTER_TO_DB_KEY: Record<Filter, string> = {
  "Adult TTE":    "adult-tte",
  "Adult TEE":    "adult-tee",
  "Stress":       "stress",
  "Pediatric TTE":"ped-tte",
  "Pediatric TEE":"ped-tee",
  "Fetal":        "fetal",
  "PeriOp TEE":   "periop-tee",
};

// ─── Section Card Component ───────────────────────────────────────────────────
function SectionCard({
  section,
  filterColor,
  checklistMode,
  checked,
  onToggle,
}: {
  section: Section;
  filterColor: string;
  checklistMode: boolean;
  checked: boolean;
  onToggle?: (checked: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-all ${
        checklistMode && checked ? "border-green-400 shadow-sm" : "border-gray-200"
      }`}
    >
      <div
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checklist checkbox */}
          {checklistMode && (
            <button
              onClick={() => onToggle?.(!checked)}
              className="flex-shrink-0 mt-0.5 focus:outline-none"
              aria-label={checked ? "Uncheck section" : "Check section as complete"}
            >
              {checked
                ? <CheckSquare className="w-5 h-5" style={{ color: filterColor }} />
                : <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
            </button>
          )}
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0 mt-0.5"
            style={{ background: filterColor + "18", color: filterColor }}
          >
            {section.ref}
          </span>
          <span className="font-semibold text-gray-800 text-sm">{section.title}</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-shrink-0 ml-2 p-1 rounded hover:bg-gray-100"
        >
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      {open && (
        <div className="px-5 pb-4 border-t border-gray-100">
          <ul className="mt-3 space-y-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: filterColor }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {section.note && (
            <div className="mt-3 flex items-start gap-2 rounded-lg p-3 text-xs text-gray-600 leading-relaxed" style={{ background: filterColor + "0d", borderLeft: `3px solid ${filterColor}` }}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: filterColor }} />
              <span>{section.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Readiness Summary Panel ──────────────────────────────────────────────────
function ReadinessSummaryPanel({
  allChecked,
  filterColor,
}: {
  allChecked: Record<string, string[]>;
  filterColor: string;
}) {
  const types: Array<{ key: string; label: string; color: string; totalSections: number }> = [
    { key: "adult-tte",  label: "Adult TTE",    color: "#189aa1", totalSections: countSectionsForFilter("Adult TTE") },
    { key: "adult-tee",  label: "Adult TEE",    color: "#0e7490", totalSections: countSectionsForFilter("Adult TEE") },
    { key: "stress",     label: "Stress Echo",  color: "#7c3aed", totalSections: countSectionsForFilter("Stress") },
    { key: "ped-tte",    label: "Ped TTE",      color: "#059669", totalSections: countSectionsForFilter("Pediatric TTE") },
    { key: "ped-tee",    label: "Ped TEE",      color: "#047857", totalSections: countSectionsForFilter("Pediatric TEE") },
    { key: "fetal",      label: "Fetal",        color: "#db2777", totalSections: countSectionsForFilter("Fetal") },
    { key: "periop-tee", label: "PeriOp TEE",   color: "#b45309", totalSections: countSectionsForFilter("PeriOp TEE") },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4" style={{ color: filterColor }} />
        <span className="font-semibold text-gray-800 text-sm">Readiness Summary — All Accreditation Types</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {types.map(t => {
          const checkedCount = (allChecked[t.key] ?? []).length;
          const pct = t.totalSections > 0 ? Math.round((checkedCount / t.totalSections) * 100) : 0;
          return (
            <div key={t.key} className="rounded-lg p-3" style={{ background: t.color + "0d", border: `1px solid ${t.color}30` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: t.color }}>{t.label}</span>
                <span className="text-xs font-bold" style={{ color: t.color }}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: t.color }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{checkedCount} / {t.totalSections} sections</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper: count total sections for a filter across all tabs ────────────────
function countSectionsForFilter(filter: Filter): number {
  let count = 0;
  for (const tabId of Object.keys(TAB_CONTENT_MAP) as TabId[]) {
    const content = TAB_CONTENT_MAP[tabId][filter];
    if (content) count += content.sections.length;
  }
  return count;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccreditationNavigator() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("equipment");
  const [activeFilter, setActiveFilter] = useState<Filter>("Adult TTE");
  const [checklistMode, setChecklistMode] = useState(false);

  // Local state for unauthenticated users (localStorage-backed)
  const [localChecked, setLocalChecked] = useState<Record<string, Set<string>>>(() => {
    try {
      const raw = localStorage.getItem("accreditation-checklist");
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, new Set(v)]));
    } catch { return {}; }
  });

  const dbKey = FILTER_TO_DB_KEY[activeFilter];

  // ─── tRPC queries (only run when authenticated) ───────────────────────────
  const checklistQuery = trpc.accreditationChecklist.get.useQuery(
    { accreditationType: dbKey },
    { enabled: isAuthenticated && checklistMode }
  );
  const allChecklistQuery = trpc.accreditationChecklist.getAll.useQuery(
    undefined,
    { enabled: isAuthenticated && checklistMode }
  );
  const toggleMutation = trpc.accreditationChecklist.toggle.useMutation();
  const bulkToggleMutation = trpc.accreditationChecklist.bulkToggle.useMutation();

  // ─── Checked set for the current filter ──────────────────────────────────
  const checkedKeys: Set<string> = useMemo(() => {
    if (isAuthenticated) {
      return new Set(checklistQuery.data?.checkedKeys ?? []);
    }
    return localChecked[dbKey] ?? new Set();
  }, [isAuthenticated, checklistQuery.data, localChecked, dbKey]);

  // ─── All checked (for summary panel) ─────────────────────────────────────
  const allChecked: Record<string, string[]> = useMemo(() => {
    if (isAuthenticated) {
      return allChecklistQuery.data ?? {};
    }
    return Object.fromEntries(
      Object.entries(localChecked).map(([k, v]) => [k, Array.from(v)])
    );
  }, [isAuthenticated, allChecklistQuery.data, localChecked]);

  // ─── Toggle a section ─────────────────────────────────────────────────────
  const handleToggle = useCallback((sectionKey: string, checked: boolean) => {
    if (isAuthenticated) {
      toggleMutation.mutate(
        { accreditationType: dbKey, sectionKey, checked },
        {
          onSuccess: () => {
            checklistQuery.refetch();
            allChecklistQuery.refetch();
          },
        }
      );
    } else {
      setLocalChecked(prev => {
        const next = { ...prev };
        const set = new Set(next[dbKey] ?? []);
        if (checked) set.add(sectionKey); else set.delete(sectionKey);
        next[dbKey] = set;
        try {
          localStorage.setItem(
            "accreditation-checklist",
            JSON.stringify(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, Array.from(v)])))
          );
        } catch {}
        return next;
      });
    }
  }, [isAuthenticated, dbKey, toggleMutation, checklistQuery, allChecklistQuery]);

  // ─── Tab readiness score ──────────────────────────────────────────────────
  const tabReadiness = useMemo(() => {
    const scores: Record<TabId, { checked: number; total: number }> = {} as Record<TabId, { checked: number; total: number }>;
    for (const tab of TABS) {
      const content = TAB_CONTENT_MAP[tab.id][activeFilter];
      const sections = content?.sections ?? [];
      const total = sections.length;
      const checked = sections.filter(s => checkedKeys.has(s.id)).length;
      scores[tab.id] = { checked, total };
    }
    return scores;
  }, [activeFilter, checkedKeys]);

  const filterConfig = FILTER_CONFIG[activeFilter];
  const tabContentMap = TAB_CONTENT_MAP[activeTab];
  const content = tabContentMap[activeFilter];

  // Determine which filter groups to show
  const filterGroups = [
    { label: "Adult Echo (IAC 2025)", filters: ADULT_FILTERS, source: "intersocietal.org/wp-content/uploads/2025/08/IACAdultEchocardiographyStandards2025.pdf" },
    { label: "Pediatric & Fetal (IAC 2025)", filters: PEDIATRIC_FILTERS, source: "intersocietal.org/wp-content/uploads/2025/04/IACPediatricEchocardiographyStandards2025.pdf" },
    { label: "Perioperative TEE (IAC 2025)", filters: PERIOP_FILTERS, source: "intersocietal.org/wp-content/uploads/2025/04/IACPerioperativeTEEStandards2025.pdf" },
  ];

  return (
    <Layout>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-8">
          <div className="mb-3">
            <BackToEchoAssist className="text-white/70 hover:text-white" />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              <BookOpen className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">IAC 2025 Standards</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                EchoAccreditation Navigator™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Complete IAC 2025 accreditation standards for Adult Echo, Pediatric &amp; Fetal Echo, and Perioperative TEE — organized by topic and modality.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {filterGroups.map(g => (
                  <a
                    key={g.label}
                    href={`https://${g.source}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {g.label} PDF
                  </a>
                ))}
                {/* Checklist Mode Toggle */}
                <button
                  onClick={() => setChecklistMode(m => !m)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    checklistMode
                      ? "bg-[#4ad9e0] text-[#0e1e2e]"
                      : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  {checklistMode ? "Checklist Mode: ON" : "Checklist Mode"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-gray-200 bg-[#f0fbfc] sticky top-0 z-20">
        <div className="container py-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 mr-1">Filter by modality:</span>
            {filterGroups.map(group => (
              <div key={group.label} className="flex items-center gap-1">
                {group.filters.map(f => {
                  const fc = FILTER_CONFIG[f];
                  const isActive = activeFilter === f;
                  const Icon = fc.icon;
                  return (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive ? "text-white shadow-sm" : "bg-white hover:bg-gray-50"}`}
                      style={isActive ? { background: fc.color } : { color: fc.color, border: `1px solid ${fc.color}40` }}
                    >
                      <Icon className="w-3 h-3" />
                      {fc.label}
                    </button>
                  );
                })}
                {group !== filterGroups[filterGroups.length - 1] && (
                  <div className="w-px h-5 bg-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-[57px] z-10 overflow-x-auto">
        <div className="container">
          <div className="flex gap-0 min-w-max">
            {TABS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              const score = checklistMode ? tabReadiness[tab.id] : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-[#189aa1] text-[#189aa1]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                  {score && score.total > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        score.checked === score.total
                          ? "bg-green-100 text-green-700"
                          : score.checked > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {score.checked}/{score.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 max-w-4xl">
        {/* Readiness Summary Panel (checklist mode only) */}
        {checklistMode && (
          <ReadinessSummaryPanel allChecked={allChecked} filterColor={filterConfig.color} />
        )}

        {/* Active filter badge + checklist progress */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: filterConfig.color }}
          >
            {(() => { const Icon = filterConfig.icon; return <Icon className="w-3.5 h-3.5" />; })()}
            {filterConfig.label}
          </div>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{filterConfig.source}</span>
          {checklistMode && content && content.sections.length > 0 && (() => {
            const tabScore = tabReadiness[activeTab];
            const pct = tabScore.total > 0 ? Math.round((tabScore.checked / tabScore.total) * 100) : 0;
            return (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: filterConfig.color }}>
                  {tabScore.checked}/{tabScore.total} sections complete ({pct}%)
                </span>
                <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: filterConfig.color }}
                  />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Login prompt for unauthenticated checklist users */}
        {checklistMode && !isAuthenticated && (
          <div className="mb-4 flex items-start gap-3 rounded-lg p-4 text-sm" style={{ background: "#189aa10d", border: "1px solid #189aa130" }}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
            <div>
              <span className="font-semibold" style={{ color: BRAND }}>Your progress is saved locally.</span>
              {" "}
              <Link href="/login" className="underline" style={{ color: BRAND }}>Sign in</Link> to sync your checklist across devices and access your readiness history.
            </div>
          </div>
        )}

        {/* Sections */}
        {content && content.sections.length > 0 ? (
          <div className="space-y-3">
            {content.sections.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                filterColor={filterConfig.color}
                checklistMode={checklistMode}
                checked={checkedKeys.has(section.id)}
                onToggle={(checked) => handleToggle(section.id, checked)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No content available for this combination.</p>
            <p className="text-xs mt-1">Try a different filter or tab.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container py-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Based on IAC 2025 Standards. Always refer to the current official IAC Standards documents for definitive requirements.</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a href="https://intersocietal.org/wp-content/uploads/2025/08/IACAdultEchocardiographyStandards2025.pdf" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">Adult Echo PDF →</a>
              <a href="https://intersocietal.org/wp-content/uploads/2025/04/IACPediatricEchocardiographyStandards2025.pdf" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">Pediatric/Fetal PDF →</a>
              <a href="https://intersocietal.org/wp-content/uploads/2025/04/IACPerioperativeTEEStandards2025.pdf" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">PeriOp TEE PDF →</a>
              <a href="https://intersocietal.org/programs/echocardiography/" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">IAC Echo Accreditation →</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
