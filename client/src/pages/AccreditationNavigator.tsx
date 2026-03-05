/*
  EchoAccreditation Navigator™ — iHeartEcho
  IAC Standards guide with search for TTE, TEE, Stress, Pediatric, Fetal, HOCM
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, BookOpen, ChevronDown, ChevronUp, ExternalLink, Award, Users,
  FileText, Clock, GraduationCap, Stethoscope, Activity, Baby, Heart, Zap
} from "lucide-react";

const BRAND = "#189aa1";

// ─── Types ────────────────────────────────────────────────────────────────────
type Modality = "TTE" | "TEE" | "Stress" | "Pediatric" | "Fetal" | "HOCM";
type Category = "personnel" | "facility" | "equipment" | "procedures" | "case_mix" | "cme" | "quality" | "policies";

interface Standard {
  id: string;
  section: string;
  title: string;
  content: string;
  modalities: Modality[];
  category: Category;
  tags: string[];
}

// ─── IAC Standards Data ───────────────────────────────────────────────────────
const STANDARDS: Standard[] = [
  // ─── PERSONNEL ──────────────────────────────────────────────────────────────
  {
    id: "pers-01",
    section: "Section 1.1",
    title: "Medical Director Qualifications",
    content: `The Medical Director must be a licensed physician with documented training and experience in echocardiography. Requirements include:\n\n• Board certification in cardiovascular disease, pediatric cardiology, or equivalent specialty\n• Minimum 3 years of echocardiography experience post-training\n• Active involvement in the echo laboratory (minimum 25% time)\n• Responsible for overall quality, protocol development, and staff supervision\n• Must interpret a minimum number of studies per year to maintain competency (varies by modality)\n\nFor TTE/TEE: ABIM or equivalent board certification in cardiovascular disease\nFor Pediatric/Fetal: Board certification in pediatric cardiology\nFor Stress Echo: Additional training in stress testing protocols required`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "personnel",
    tags: ["medical director", "physician", "qualifications", "board certification", "leadership"],
  },
  {
    id: "pers-02",
    section: "Section 1.2",
    title: "Sonographer Qualifications",
    content: `Sonographers performing echocardiographic studies must meet the following requirements:\n\n• Registered Diagnostic Cardiac Sonographer (RDCS) credential from ARDMS, or\n• Registered Cardiac Sonographer (RCS) credential from CCI, or\n• Equivalent recognized credential\n• Alternatively: documented training under direct physician supervision with a defined competency pathway\n\nFor TEE: Additional training and competency documentation required\nFor Stress Echo: Training in stress testing protocols and emergency response\nFor Pediatric/Fetal: Specialized training in congenital heart disease imaging\n\nNew graduates: Must work under direct supervision until credentialing is obtained. A defined timeline for credential attainment must be documented.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "personnel",
    tags: ["sonographer", "ARDMS", "RDCS", "RCS", "credentials", "qualifications", "certification"],
  },
  {
    id: "pers-03",
    section: "Section 1.3",
    title: "Interpreting Physician Qualifications",
    content: `Physicians interpreting echocardiographic studies must demonstrate:\n\n• Appropriate board certification (cardiovascular disease, pediatric cardiology, or equivalent)\n• Documented training in echocardiography interpretation\n• Minimum annual volume requirements for interpretation (varies by modality):\n  - TTE: Typically 150+ studies/year\n  - TEE: Typically 50+ studies/year\n  - Stress Echo: Typically 50+ studies/year\n  - Pediatric: Typically 150+ studies/year\n\nPhysicians must maintain competency through ongoing CME and case volume. Documentation of annual interpretation volumes must be maintained.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "personnel",
    tags: ["interpreting physician", "cardiologist", "volume", "competency", "annual", "interpretation"],
  },
  {
    id: "pers-04",
    section: "Section 1.4",
    title: "CME Requirements — Sonographers",
    content: `Continuing Medical Education (CME) / Continuing Education (CE) requirements for sonographers:\n\n• ARDMS RDCS: 30 CE credits every 3 years (triennium)\n• CCI RCS: 30 CE credits every 3 years\n• At least 50% of CE credits must be in the registered specialty\n• CE activities must be from approved providers (ARDMS/CCI approved)\n\nDocumentation requirements:\n• CE certificates must be maintained in personnel files\n• Annual review of CE status recommended\n• Failure to maintain CE results in credential lapse\n\nApproved CE sources include: ASE annual meeting, ASE online education, ICAEL workshops, accredited echo conferences, online CME providers.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "cme",
    tags: ["CME", "CE", "continuing education", "ARDMS", "CCI", "credits", "renewal", "30 credits", "triennium"],
  },
  {
    id: "pers-05",
    section: "Section 1.5",
    title: "CME Requirements — Interpreting Physicians",
    content: `CME requirements for physicians interpreting echocardiographic studies:\n\n• ABIM Maintenance of Certification (MOC) requirements apply\n• Echocardiography-specific CME strongly recommended\n• ASE recommends minimum 15 hours of echo-specific CME per year\n• Documentation of echo-specific CME must be maintained\n\nFor HOCM/HCM specialists:\n• Additional training in LVOT obstruction assessment\n• Familiarity with septal reduction therapy evaluation\n\nApproved CME sources: ASE Scientific Sessions, ACC/AHA meetings, SCAI, echo-specific online CME, peer-reviewed journal CME.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "cme",
    tags: ["CME", "physician", "MOC", "ABIM", "continuing education", "15 hours", "annual"],
  },

  // ─── CASE MIX REQUIREMENTS ───────────────────────────────────────────────────
  {
    id: "case-01",
    section: "Section 3.1",
    title: "TTE Case Mix Requirements",
    content: `For IAC TTE accreditation, the laboratory must document a representative case mix that includes:\n\n• Minimum annual volume: Typically 500+ TTE studies/year for full-time labs\n• Required case types must include:\n  - Normal/technically limited studies\n  - Valvular heart disease (stenosis and regurgitation)\n  - Left ventricular systolic dysfunction\n  - Diastolic dysfunction assessment\n  - Pericardial disease\n  - Congenital heart disease (at least basic)\n  - Aortic pathology\n  - Masses/thrombi\n  - Hypertensive heart disease\n\nCase mix documentation: The lab must demonstrate capability to perform and interpret the full range of TTE indications. Case logs submitted for review must reflect this diversity.`,
    modalities: ["TTE"],
    category: "case_mix",
    tags: ["TTE", "case mix", "volume", "annual", "500 studies", "case types", "valvular", "LV function"],
  },
  {
    id: "case-02",
    section: "Section 3.2",
    title: "TEE Case Mix Requirements",
    content: `For IAC TEE accreditation, the laboratory must document:\n\n• Minimum annual volume: Typically 50+ TEE studies/year\n• Required case types must include:\n  - Atrial fibrillation / LAA thrombus evaluation\n  - Valvular heart disease assessment\n  - Endocarditis evaluation\n  - Aortic pathology (dissection, aneurysm)\n  - Structural heart disease evaluation\n  - Intraoperative TEE (if applicable)\n  - Source of embolism evaluation\n\nPersonnel requirements:\n• Physician performing TEE must have documented TEE training\n• Minimum 50 supervised TEE procedures before independent practice\n• Annual volume maintenance: minimum 25 TEE/year for interpreting physicians`,
    modalities: ["TEE"],
    category: "case_mix",
    tags: ["TEE", "case mix", "50 studies", "LAA", "endocarditis", "aortic", "intraoperative", "structural heart"],
  },
  {
    id: "case-03",
    section: "Section 3.3",
    title: "Stress Echo Case Mix Requirements",
    content: `For IAC Stress Echo accreditation:\n\n• Minimum annual volume: Typically 100+ stress echo studies/year\n• Required case types must include:\n  - Exercise stress echocardiography (treadmill or bicycle)\n  - Pharmacological stress (dobutamine, adenosine, or regadenoson)\n  - Positive studies (wall motion abnormalities)\n  - Negative/normal studies\n  - Technically limited studies\n  - Valvular assessment with stress (e.g., exercise MR, AS)\n\nProtocol requirements:\n• Written protocols for each stress modality\n• Emergency response plan and crash cart availability\n• Physician presence during pharmacological stress\n• ACLS certification for supervising personnel`,
    modalities: ["Stress"],
    category: "case_mix",
    tags: ["stress echo", "case mix", "100 studies", "dobutamine", "exercise", "DSE", "wall motion", "ACLS"],
  },
  {
    id: "case-04",
    section: "Section 3.4",
    title: "Pediatric Echo Case Mix Requirements",
    content: `For IAC Pediatric Echo accreditation:\n\n• Minimum annual volume: Typically 300+ pediatric echo studies/year\n• Required case types must include:\n  - Congenital heart disease (multiple lesion types)\n  - ASD, VSD, PDA (shunt lesions)\n  - Tetralogy of Fallot and conotruncal anomalies\n  - Left-sided obstructive lesions (AS, CoA, HLHS)\n  - Right-sided obstructive lesions (PS, PA)\n  - Cardiomyopathy\n  - Pericardial disease\n  - Normal studies\n  - Post-operative CHD\n\nSpecialty requirements:\n• Medical Director must have pediatric cardiology training\n• Sonographers must have documented pediatric echo competency\n• Z-score reporting capability required`,
    modalities: ["Pediatric"],
    category: "case_mix",
    tags: ["pediatric", "case mix", "300 studies", "CHD", "congenital", "ASD", "VSD", "TOF", "Z-scores", "coarctation"],
  },
  {
    id: "case-05",
    section: "Section 3.5",
    title: "Fetal Echo Case Mix Requirements",
    content: `For IAC Fetal Echo accreditation:\n\n• Minimum annual volume: Typically 100+ fetal echo studies/year\n• Required case types must include:\n  - Normal fetal cardiac anatomy\n  - Structural CHD (multiple lesion types)\n  - Arrhythmia evaluation\n  - Functional assessment (hydrops, cardiomyopathy)\n  - High-risk pregnancies (maternal diabetes, teratogen exposure)\n  - Post-referral from obstetric ultrasound\n\nPersonnel requirements:\n• Physician must have specific fetal echocardiography training\n• Sonographers must have documented fetal echo competency\n• Correlation with obstetric findings required\n• Postnatal follow-up documentation encouraged`,
    modalities: ["Fetal"],
    category: "case_mix",
    tags: ["fetal echo", "case mix", "100 studies", "fetal CHD", "arrhythmia", "hydrops", "obstetric", "prenatal"],
  },
  {
    id: "case-06",
    section: "Section 3.6",
    title: "HOCM / HCM Case Mix Requirements",
    content: `For IAC HOCM (Hypertrophic Cardiomyopathy) accreditation:\n\n• Minimum annual volume: Typically 50+ HCM studies/year\n• Required case types must include:\n  - HCM with and without obstruction\n  - LVOT gradient assessment (resting and provoked)\n  - Mitral valve assessment (SAM, MR)\n  - Diastolic function in HCM\n  - Pre- and post-septal reduction therapy\n  - Alcohol septal ablation evaluation\n  - Surgical myectomy evaluation\n  - Risk stratification parameters (max wall thickness, LA size, LV function)\n\nSpecialty requirements:\n• Expertise in provocation maneuvers (Valsalva, amyl nitrite)\n• Familiarity with HCM-specific measurement standards (ASE/ESC HCM guidelines)`,
    modalities: ["HOCM"],
    category: "case_mix",
    tags: ["HOCM", "HCM", "case mix", "50 studies", "LVOT gradient", "SAM", "septal reduction", "myectomy", "ablation", "obstruction"],
  },

  // ─── FACILITY & EQUIPMENT ────────────────────────────────────────────────────
  {
    id: "fac-01",
    section: "Section 2.1",
    title: "Facility Requirements",
    content: `The echocardiography laboratory must meet the following facility standards:\n\n• Dedicated examination room(s) with adequate space for equipment and patient access\n• Patient privacy and dignity must be maintained (curtains, doors, gowning area)\n• Emergency equipment accessible (crash cart, defibrillator, oxygen)\n• Adequate lighting for image acquisition and review\n• HIPAA-compliant patient record storage\n• Clean and disinfected environment between patients\n• Adequate ventilation and temperature control\n\nFor TEE:\n• Dedicated TEE room or procedure area\n• Suction equipment available\n• Monitoring equipment (ECG, pulse oximetry, BP)\n• Resuscitation equipment immediately available\n\nFor Stress Echo:\n• Emergency response plan posted\n• Crash cart with defibrillator\n• ACLS-trained personnel present during pharmacological stress`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "facility",
    tags: ["facility", "room", "privacy", "crash cart", "emergency", "HIPAA", "TEE room", "stress lab"],
  },
  {
    id: "fac-02",
    section: "Section 2.2",
    title: "Equipment Requirements",
    content: `Echocardiographic equipment must meet the following standards:\n\n• Current-generation ultrasound system capable of:\n  - 2D imaging\n  - M-mode\n  - Color flow Doppler\n  - Pulsed wave (PW) Doppler\n  - Continuous wave (CW) Doppler\n  - Tissue Doppler Imaging (TDI)\n\n• For advanced accreditation:\n  - 3D/4D capability (recommended for structural heart programs)\n  - Strain imaging capability (speckle tracking)\n  - Contrast imaging capability\n\n• Equipment maintenance:\n  - Regular preventive maintenance per manufacturer schedule\n  - Calibration documentation\n  - Transducer cleaning logs\n  - Equipment failure/repair logs\n\n• DICOM-compatible image storage and archiving system required`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "equipment",
    tags: ["equipment", "ultrasound", "2D", "Doppler", "TDI", "3D", "strain", "DICOM", "maintenance", "calibration"],
  },

  // ─── PROCEDURES & PROTOCOLS ───────────────────────────────────────────────────
  {
    id: "proc-01",
    section: "Section 4.1",
    title: "TTE Protocol Requirements",
    content: `A complete TTE examination must include the following minimum views per ASE/IAC standards:\n\n• Parasternal long axis (PLAX)\n• Parasternal short axis (PSAX) — multiple levels\n• Apical 4-chamber (A4C)\n• Apical 2-chamber (A2C)\n• Apical 3-chamber / apical long axis (A3C/APLAX)\n• Subcostal 4-chamber\n• Subcostal IVC\n• Suprasternal notch (aortic arch)\n\nRequired Doppler:\n• Mitral inflow (PW)\n• Tissue Doppler (septal and lateral e′)\n• Aortic valve (CW)\n• Tricuspid regurgitation (CW for RVSP)\n• Pulmonary valve (PW)\n• LVOT (PW for stroke volume)\n\nMeasurements: LV dimensions, wall thickness, EF (biplane Simpson), LA volume, aortic root, RV size, IVC.`,
    modalities: ["TTE"],
    category: "procedures",
    tags: ["TTE", "protocol", "views", "PLAX", "apical", "subcostal", "Doppler", "measurements", "complete exam", "ASE"],
  },
  {
    id: "proc-02",
    section: "Section 4.2",
    title: "TEE Protocol Requirements",
    content: `A complete TEE examination must include the following minimum views:\n\n• Mid-esophageal (ME) views:\n  - ME 4-chamber\n  - ME 2-chamber\n  - ME long axis (120°)\n  - ME aortic valve short axis (30-45°)\n  - ME aortic valve long axis (120-135°)\n  - ME bicaval (90-110°)\n  - ME right pulmonary vein\n  - ME left pulmonary vein\n\n• Transgastric (TG) views:\n  - TG mid short axis (0°)\n  - TG 2-chamber (90°)\n  - TG long axis (120°)\n\n• Upper esophageal (UE) views:\n  - UE aortic arch long axis\n  - UE aortic arch short axis\n\nDescending thoracic aorta views required for aortic assessment.`,
    modalities: ["TEE"],
    category: "procedures",
    tags: ["TEE", "protocol", "views", "mid-esophageal", "transgastric", "bicaval", "aortic", "upper esophageal", "complete exam"],
  },
  {
    id: "proc-03",
    section: "Section 4.3",
    title: "Report Turnaround Time Requirements",
    content: `IAC standards require documented report turnaround time policies:\n\n• Routine TTE: Final report within 24-48 hours of study completion (facility-defined)\n• Urgent/STAT studies: Verbal communication to ordering physician immediately; written report within 24 hours\n• Inpatient studies: Preliminary report within 24 hours; final within 48 hours\n• TEE: Preliminary report at time of procedure; final within 24 hours\n• Stress Echo: Preliminary report at time of procedure; final within 24 hours\n\nDocumentation requirements:\n• Written turnaround time policy must exist\n• Compliance monitoring required (track % of reports meeting target)\n• Outliers must be documented with explanation\n• Annual review of turnaround time performance`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "procedures",
    tags: ["report", "turnaround time", "24 hours", "48 hours", "STAT", "urgent", "preliminary", "final", "compliance"],
  },

  // ─── QUALITY ASSURANCE ────────────────────────────────────────────────────────
  {
    id: "qa-01",
    section: "Section 5.1",
    title: "Peer Review Program Requirements",
    content: `IAC requires a documented peer review program with the following elements:\n\n• Minimum peer review rate: Typically 5-10% of studies reviewed\n• Peer review must be performed by a qualified interpreting physician\n• Blinded review (reviewer does not see original interpretation) preferred\n• Discordance tracking and documentation required\n• Feedback mechanism to original interpreter\n\nRequired documentation:\n• Peer review log with study date, modality, reviewer, original interpretation, peer interpretation, and concordance/discordance\n• Discordance rate tracking (major vs. minor discordances)\n• Annual summary report to Medical Director\n• Action plan for persistent discordances\n\nFor IAC submission: Representative peer review cases may be required.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "quality",
    tags: ["peer review", "5%", "10%", "discordance", "blinded", "quality assurance", "log", "annual review"],
  },
  {
    id: "qa-02",
    section: "Section 5.2",
    title: "Image Quality Monitoring",
    content: `The laboratory must have a documented image quality monitoring program:\n\n• Regular review of image quality across all sonographers\n• Tracking of technically limited studies (% of total)\n• Feedback mechanism for image quality issues\n• Remediation plan for persistent image quality problems\n\nImage quality grading:\n• Excellent: All required views obtained with diagnostic quality\n• Good: All required views obtained; minor limitations\n• Adequate: Most required views obtained; some limitations noted\n• Poor/Limited: Significant limitations affecting interpretation\n\nDocumentation:\n• Image quality log or database\n• Trending of technically limited rates by sonographer\n• Annual image quality report to Medical Director`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "quality",
    tags: ["image quality", "technically limited", "monitoring", "grading", "feedback", "remediation", "trending"],
  },
  {
    id: "qa-03",
    section: "Section 5.3",
    title: "Appropriate Use Criteria (AUC) Monitoring",
    content: `IAC requires documentation of appropriate use criteria monitoring:\n\n• AUC monitoring must be performed for at least a representative sample of studies\n• ACCF/AHA/ASE Appropriate Use Criteria for Echo should be referenced\n• Rarely appropriate studies must be tracked and reviewed\n• Feedback to ordering physicians for outlier patterns\n\nDocumentation requirements:\n• AUC monitoring log with indication, modality, and appropriateness rating\n• Trending of rarely appropriate studies\n• Communication with ordering physicians/departments\n• Annual AUC summary report\n\nNote: AUC monitoring is increasingly emphasized in IAC reviews. Laboratories should track indications prospectively.`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "quality",
    tags: ["appropriate use", "AUC", "rarely appropriate", "indications", "monitoring", "ordering physician", "ACCF", "AHA"],
  },

  // ─── POLICIES ─────────────────────────────────────────────────────────────────
  {
    id: "pol-01",
    section: "Section 6.1",
    title: "Required Written Policies",
    content: `IAC requires the following written policies to be in place and reviewed annually:\n\n• Infection control and transducer disinfection\n• Patient safety and emergency response\n• Equipment maintenance and calibration\n• Report turnaround time\n• Peer review program\n• Image quality monitoring\n• Appropriate use criteria monitoring\n• Staff competency and credentialing\n• Contrast agent use (if applicable)\n• TEE procedure policy (if applicable)\n• Stress echo emergency protocol (if applicable)\n• Patient consent procedures\n• HIPAA compliance\n\nAll policies must:\n• Be dated and version-controlled\n• Have a defined review date (typically annual)\n• Be accessible to all laboratory personnel\n• Be signed/approved by the Medical Director`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "policies",
    tags: ["policies", "written", "infection control", "patient safety", "annual review", "Medical Director", "HIPAA", "consent"],
  },
  {
    id: "pol-02",
    section: "Section 6.2",
    title: "Infection Control — Transducer Disinfection",
    content: `Transducer disinfection policies must comply with IAC and CDC standards:\n\n• Low-level disinfection (LLD): Required for external transducers (TTE) after each patient\n  - Approved LLD agents: CaviWipes, Sani-Cloth, or equivalent\n  - Wipe down all contact surfaces\n  - Allow appropriate contact time per product instructions\n\n• High-level disinfection (HLD): Required for TEE probes and all semi-critical transducers\n  - Approved HLD methods: Cidex OPA, Cidex Plus, automated reprocessors (Medivator, Trophon)\n  - Complete immersion for full contact time\n  - Rinse and dry per protocol\n  - Log each HLD cycle (probe ID, date, time, solution lot, operator)\n\n• Probe covers: Required for all TEE and intracavitary procedures\n• Gel hygiene: Single-use gel packets recommended; multi-use bottles must be capped between uses`,
    modalities: ["TTE", "TEE"],
    category: "policies",
    tags: ["infection control", "disinfection", "HLD", "LLD", "TEE probe", "Cidex", "Trophon", "transducer", "high-level disinfection"],
  },
  {
    id: "pol-03",
    section: "Section 6.3",
    title: "Contrast Agent Policy",
    content: `If ultrasound enhancing agents (UEA) / contrast are used, the following policies are required:\n\n• Written protocol for UEA administration\n• Physician supervision during contrast administration\n• Monitoring requirements (ECG, pulse oximetry, BP)\n• Contraindication screening (right-to-left shunt, known hypersensitivity)\n• Emergency response plan for adverse reactions\n• Resuscitation equipment immediately available\n• Post-procedure monitoring period (minimum 30 minutes)\n\nDocumentation:\n• Consent for contrast administration\n• Contrast administration log (agent, lot, dose, patient response)\n• Adverse event reporting\n\nApproved agents: Definity (perflutren), Lumason (sulfur hexafluoride), Optison (perflutren)\nFDA Black Box Warning: Must be reviewed with patients at high cardiopulmonary risk.`,
    modalities: ["TTE", "Stress"],
    category: "policies",
    tags: ["contrast", "UEA", "Definity", "Lumason", "Optison", "perflutren", "adverse reaction", "consent", "monitoring", "FDA"],
  },
  {
    id: "pol-04",
    section: "Section 6.4",
    title: "Stress Echo Emergency Protocol",
    content: `A written emergency protocol is required for all stress echocardiography programs:\n\n• Physician must be present during all pharmacological stress studies\n• ACLS-trained personnel must be available during all stress studies\n• Crash cart with defibrillator must be immediately accessible\n• Reversal agents must be available:\n  - Dobutamine reversal: IV beta-blocker (metoprolol, esmolol, atropine for bradycardia)\n  - Adenosine/regadenoson reversal: Aminophylline\n\n• Absolute contraindications to stress echo must be screened:\n  - Acute MI within 2 days\n  - Unstable angina\n  - Severe symptomatic AS\n  - Uncontrolled arrhythmias\n  - Decompensated heart failure\n\n• Termination criteria must be posted and followed\n• Post-stress monitoring minimum 15-30 minutes`,
    modalities: ["Stress"],
    category: "policies",
    tags: ["stress echo", "emergency", "ACLS", "crash cart", "dobutamine", "reversal", "contraindications", "termination criteria", "aminophylline"],
  },

  // ─── ACCREDITATION PROCESS ────────────────────────────────────────────────────
  {
    id: "acc-01",
    section: "Section 7.1",
    title: "IAC Application Process Overview",
    content: `The IAC accreditation process for echocardiography laboratories:\n\n1. Pre-application preparation:\n   • Review current IAC Standards document for desired modality\n   • Conduct internal gap analysis against standards\n   • Implement required policies and programs\n   • Collect required documentation\n\n2. Application submission:\n   • Complete online application at intersocietal.org\n   • Submit required documentation (policies, case logs, staff credentials)\n   • Pay application fee\n\n3. Review process:\n   • IAC reviewers evaluate submitted documentation\n   • Site visit may be required for initial accreditation\n   • Deficiency letters issued if standards not met\n\n4. Accreditation decision:\n   • Accreditation granted (3-year cycle)\n   • Conditional accreditation (deficiencies must be corrected)\n   • Denial (significant deficiencies)\n\n5. Reaccreditation:\n   • Required every 3 years\n   • Ongoing compliance monitoring`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "procedures",
    tags: ["IAC", "application", "process", "accreditation", "3 years", "reaccreditation", "site visit", "gap analysis", "intersocietal"],
  },
  {
    id: "acc-02",
    section: "Section 7.2",
    title: "Common Deficiencies and How to Avoid Them",
    content: `The most common IAC deficiencies cited during accreditation reviews:\n\n1. Incomplete peer review documentation\n   • Fix: Implement a systematic peer review log; review minimum 5-10% of studies\n\n2. Missing or outdated policies\n   • Fix: Annual policy review cycle; Medical Director signature required\n\n3. Staff credentials not current\n   • Fix: Maintain credential expiration tracking; CE documentation in personnel files\n\n4. Inadequate case mix documentation\n   • Fix: Prospective case logging by type; annual case mix analysis\n\n5. Turnaround time non-compliance\n   • Fix: Track report completion times; document outliers with explanations\n\n6. Missing infection control logs\n   • Fix: Daily TEE probe HLD logs; transducer cleaning documentation\n\n7. Inadequate AUC monitoring\n   • Fix: Prospective AUC tracking; feedback to ordering physicians\n\n8. Equipment maintenance gaps\n   • Fix: Preventive maintenance schedule; repair logs; calibration records`,
    modalities: ["TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"],
    category: "quality",
    tags: ["deficiencies", "common", "peer review", "policies", "credentials", "case mix", "turnaround", "infection control", "AUC", "equipment"],
  },
];

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: React.ElementType }> = {
  personnel: { label: "Personnel", color: "#7c3aed", icon: Users },
  facility: { label: "Facility", color: "#0891b2", icon: Stethoscope },
  equipment: { label: "Equipment", color: "#0369a1", icon: Activity },
  procedures: { label: "Procedures & Protocols", color: "#189aa1", icon: ClipboardListIcon },
  case_mix: { label: "Case Mix", color: "#16a34a", icon: FileText },
  cme: { label: "CME / Education", color: "#d97706", icon: GraduationCap },
  quality: { label: "Quality Assurance", color: "#dc2626", icon: Award },
  policies: { label: "Policies", color: "#6b7280", icon: FileText },
};

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="12" y2="16" />
    </svg>
  );
}

const MODALITY_CONFIG: Record<Modality, { label: string; color: string; icon: React.ElementType }> = {
  TTE: { label: "TTE", color: "#189aa1", icon: Stethoscope },
  TEE: { label: "TEE", color: "#0369a1", icon: Activity },
  Stress: { label: "Stress Echo", color: "#d97706", icon: Zap },
  Pediatric: { label: "Pediatric", color: "#7c3aed", icon: Users },
  Fetal: { label: "Fetal", color: "#db2777", icon: Baby },
  HOCM: { label: "HOCM / HCM", color: "#dc2626", icon: Heart },
};

// ─── Standard Card ────────────────────────────────────────────────────────────
function StandardCard({ standard }: { standard: Standard }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_CONFIG[standard.category];
  const CatIcon = cat.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cat.color + "18" }}>
          <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-gray-400">{standard.section}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.color + "15", color: cat.color }}>{cat.label}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-800">{standard.title}</h3>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {standard.modalities.map(m => {
                  const mc = MODALITY_CONFIG[m];
                  return (
                    <span key={m} className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: mc.color + "15", color: mc.color }}>
                      {mc.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-3 text-xs text-gray-700 leading-relaxed whitespace-pre-line">{standard.content}</div>
          <div className="flex flex-wrap gap-1 mt-3">
            {standard.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccreditationNavigator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModality, setActiveModality] = useState<Modality | "All">("All");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return STANDARDS.filter(s => {
      const modalityMatch = activeModality === "All" || s.modalities.includes(activeModality as Modality);
      const categoryMatch = activeCategory === "All" || s.category === activeCategory;
      const textMatch = !q || (
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.section.toLowerCase().includes(q)
      );
      return modalityMatch && categoryMatch && textMatch;
    });
  }, [searchQuery, activeModality, activeCategory]);

  const modalities: Array<Modality | "All"> = ["All", "TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM"];
  const categories: Array<Category | "All"> = ["All", "personnel", "case_mix", "cme", "procedures", "quality", "policies", "facility", "equipment"];

  return (
    <Layout>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}>
        <div className="container py-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              <BookOpen className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Accreditation Tools</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                EchoAccreditation Navigator™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Your go-to guide for IAC echo accreditation standards — search case requirements, CME, staff qualifications, and policies for TTE, TEE, Stress, Pediatric, Fetal, and HOCM.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-gray-200 bg-[#f0fbfc] sticky top-0 z-10">
        <div className="container py-3 space-y-2">
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 h-9 text-sm bg-white"
              placeholder="Search standards, case requirements, CME, policies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Modality filter */}
          <div className="flex flex-wrap gap-1">
            {modalities.map(m => {
              const isActive = activeModality === m;
              const mc = m !== "All" ? MODALITY_CONFIG[m as Modality] : null;
              return (
                <button
                  key={m}
                  onClick={() => setActiveModality(m)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${isActive ? "text-white shadow-sm" : "text-gray-600 bg-white border border-gray-200 hover:border-gray-300"}`}
                  style={isActive ? { background: mc?.color ?? BRAND } : {}}
                >
                  {m === "All" ? "All Modalities" : mc?.label}
                </button>
              );
            })}
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${activeCategory === "All" ? "text-white shadow-sm" : "text-gray-600 bg-white border border-gray-200 hover:border-gray-300"}`}
              style={activeCategory === "All" ? { background: BRAND } : {}}
            >
              All Topics
            </button>
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
              const cc = CATEGORY_CONFIG[cat];
              const CatIcon = cc.icon;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${isActive ? "text-white shadow-sm" : "text-gray-600 bg-white border border-gray-200 hover:border-gray-300"}`}
                  style={isActive ? { background: cc.color } : {}}
                >
                  <CatIcon className="w-3 h-3" />
                  {cc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{filtered.length}</span> standard{filtered.length !== 1 ? "s" : ""} found
            {searchQuery && <span> for "<span className="font-medium text-[#189aa1]">{searchQuery}</span>"</span>}
          </p>
          <a
            href="https://intersocietal.org/programs/echocardiography/standards/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#189aa1] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Official IAC Standards
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No standards found matching your search.</p>
            <button onClick={() => { setSearchQuery(""); setActiveModality("All"); setActiveCategory("All"); }} className="mt-2 text-xs text-[#189aa1] hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filtered.map(s => <StandardCard key={s.id} standard={s} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="container py-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Based on IAC Standards for Echocardiography Accreditation. Always refer to the current official IAC Standards document for definitive requirements.</span>
            </div>
            <div className="flex gap-3">
              <a href="https://intersocietal.org/programs/echocardiography/standards/" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">IAC Standards →</a>
              <a href="https://www.asecho.org/guidelines/" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">ASE Guidelines →</a>
              <a href="https://www.ardms.org/maintain-certification/ce-requirements/" target="_blank" rel="noopener noreferrer" className="text-[#189aa1] hover:underline">ARDMS CE →</a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
