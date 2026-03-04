/*
  iHeartEcho -- Echo Report Builder
  IAC Adult TTE Accreditation Standards compliant
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body, JetBrains Mono data
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { FileText, Copy, Download, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

// --- UI PRIMITIVES ---

function Field({ label, value, onChange, unit, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "--"}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        {unit && <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1] bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full teal-header px-5 py-3 flex items-center justify-between">
        <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>{title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-white/70" /> : <ChevronDown className="w-4 h-4 text-white/70" />}
      </button>
      {open && <div className="p-4 grid grid-cols-2 gap-3">{children}</div>}
    </div>
  );
}

// --- DATA MODEL (IAC Adult TTE compliant) ---

interface ReportData {
  // Study info
  indication: string; imageQuality: string; studyType: string;

  // LV dimensions & systolic function
  lvedd: string; lvesd: string; ivsd: string; pwd: string;
  lvLength: string; lvMass: string; lvMassIndex: string;
  ef: string; efMethod: string; fs: string;
  sv: string; co: string; ci: string;
  rwma: string; rwmaTerritory: string;
  // LV strain
  lvGls: string; lvGlsInterpretation: string;
  lvStrainRate: string;

  // Diastolic function (ASE 2016 + LARS)
  eVel: string; aVel: string; eaRatio: string;
  ePrimeSeptal: string; ePrimeLateral: string; ePrimeAvg: string;
  eeRatio: string; trVel: string; lavi: string;
  ddt: string; ivrt: string;
  diastGrade: string; lvedp: string;

  // Left atrium
  laApSize: string; laVolume: string; laVolumeIndex: string;
  lars: string; larsInterpretation: string;
  laFunction: string;

  // Right atrium
  raSize: string; raVolume: string; raVolumeIndex: string;
  rars: string; rarsInterpretation: string;

  // Right ventricle
  rvSize: string; rvFreeWall: string; rvFunction: string;
  tapse: string; rvSPrime: string; rvFac: string;
  rvsp: string; rvGls: string; rvStrainRate: string;
  rvedd: string;

  // Aortic valve
  avVmax: string; avMg: string; ava: string; avai: string;
  avSeverity: string; avMorphology: string;

  // Mitral valve
  mrSeverity: string; mrMechanism: string;
  mvArea: string; mvMeanGrad: string; msSeverity: string;
  mvMorphology: string;

  // Tricuspid valve
  trSeverity: string; trVmax: string; trMechanism: string;

  // Pulmonic valve
  pvSeverity: string; pvVmax: string; rvotVti: string;

  // Aorta
  aorticRoot: string; ascAorta: string; aorticArch: string;

  // Pericardium / IVC
  pericardialEffusion: string; pericardialComment: string;
  ivcDiam: string; ivcCollapse: string; raP: string;

  // Conclusion
  conclusion: string;
}

// --- REPORT GENERATOR ---

function generateReport(d: ReportData): string {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const sep = "-".repeat(60);

  // LV systolic
  const ef = parseFloat(d.ef);
  const efInterp = !d.ef ? "" :
    ef >= 55 ? "preserved systolic function" :
    ef >= 50 ? "low-normal systolic function" :
    ef >= 40 ? "mildly reduced systolic function" :
    ef >= 30 ? "moderately reduced systolic function" :
    "severely reduced systolic function";

  const lvSize = !d.lvedd ? "not measured" :
    parseFloat(d.lvedd) > 58 ? "dilated" :
    parseFloat(d.lvedd) < 42 ? "small" : "normal in size";

  const wallThick = d.ivsd || d.pwd ?
    (parseFloat(d.ivsd || "0") > 12 || parseFloat(d.pwd || "0") > 12 ? "concentric hypertrophy pattern" : "normal wall thickness") : "";

  const lvStrainText = d.lvGls
    ? `\nLV Global Longitudinal Strain (GLS): ${d.lvGls}% (${d.lvGlsInterpretation || (parseFloat(d.lvGls) <= -18 ? "normal" : parseFloat(d.lvGls) <= -16 ? "mildly impaired" : parseFloat(d.lvGls) <= -12 ? "moderately impaired" : "severely impaired")}).` +
      (d.lvStrainRate ? ` LV Strain Rate: ${d.lvStrainRate} s\u207b\u00b9.` : "")
    : "";

  const rwmaText = d.rwma && d.rwma !== "None"
    ? ` Regional wall motion abnormality: ${d.rwma}${d.rwmaTerritory ? ` (${d.rwmaTerritory} territory)` : ""}.`
    : " No regional wall motion abnormality detected.";

  const hemodynamicsText = (d.sv || d.co || d.ci)
    ? `\nHemodynamics: ${d.sv ? `SV ${d.sv} mL. ` : ""}${d.co ? `CO ${d.co} L/min. ` : ""}${d.ci ? `CI ${d.ci} L/min/m\u00b2.` : ""}`
    : "";

  // Diastology
  const eeRatioCalc = d.eVel && d.ePrimeAvg
    ? (parseFloat(d.eVel) / parseFloat(d.ePrimeAvg) * 100 / 100).toFixed(1)
    : d.eeRatio || null;

  const diastText = d.diastGrade !== "Not assessed"
    ? `\n\nDIASTOLIC FUNCTION (ASE 2016):\n${d.diastGrade}.` +
      (d.eVel ? ` E ${d.eVel} m/s.` : "") +
      (d.aVel ? ` A ${d.aVel} m/s.` : "") +
      (d.eaRatio || (d.eVel && d.aVel) ? ` E/A ${d.eaRatio || (parseFloat(d.eVel) / parseFloat(d.aVel)).toFixed(2)}.` : "") +
      (d.ePrimeSeptal ? ` e' septal ${d.ePrimeSeptal} cm/s.` : "") +
      (d.ePrimeLateral ? ` e' lateral ${d.ePrimeLateral} cm/s.` : "") +
      (eeRatioCalc ? ` Average E/e' ${eeRatioCalc}.` : "") +
      (d.trVel ? ` TR Vmax ${d.trVel} m/s.` : "") +
      (d.lavi ? ` LAVI ${d.lavi} mL/m\u00b2.` : "") +
      (d.ddt ? ` Deceleration time ${d.ddt} ms.` : "") +
      (d.ivrt ? ` IVRT ${d.ivrt} ms.` : "") +
      (d.lvedp ? ` Estimated LVEDP ${d.lvedp} mmHg.` : "")
    : "";

  // Left atrium
  const laText = (d.laApSize || d.laVolume || d.laVolumeIndex || d.lars)
    ? `\n\nLEFT ATRIUM:\n` +
      (d.laApSize ? `LA anteroposterior dimension ${d.laApSize} mm. ` : "") +
      (d.laVolume ? `LA volume ${d.laVolume} mL. ` : "") +
      (d.laVolumeIndex ? `LAVI ${d.laVolumeIndex} mL/m\u00b2 (${parseFloat(d.laVolumeIndex) > 34 ? "dilated" : "normal"}). ` : "") +
      (d.lars
        ? `LA Reservoir Strain (LARS): ${d.lars}% (${d.larsInterpretation || (parseFloat(d.lars) >= 35 ? "normal" : parseFloat(d.lars) >= 25 ? "mildly impaired" : parseFloat(d.lars) >= 18 ? "moderately impaired" : "severely impaired")}). `
        : "") +
      (d.laFunction && d.laFunction !== "Not assessed" ? `LA function: ${d.laFunction}.` : "")
    : "";

  // Right atrium
  const raText = (d.raSize || d.raVolume || d.raVolumeIndex || d.rars)
    ? `\n\nRIGHT ATRIUM:\n` +
      (d.raSize && d.raSize !== "Not assessed" ? `RA size: ${d.raSize.toLowerCase()}. ` : "") +
      (d.raVolume ? `RA volume ${d.raVolume} mL. ` : "") +
      (d.raVolumeIndex ? `RAVI ${d.raVolumeIndex} mL/m\u00b2. ` : "") +
      (d.rars
        ? `RA Reservoir Strain (RARS): ${d.rars}% (${d.rarsInterpretation || (parseFloat(d.rars) >= 35 ? "normal" : "impaired")}). `
        : "")
    : "";

  // Aortic valve
  const avText = d.avSeverity !== "Not assessed"
    ? `\n\nAORTIC VALVE:\n` +
      (d.avMorphology && d.avMorphology !== "Not assessed" ? `${d.avMorphology}. ` : "") +
      (d.avSeverity === "Normal" ? "No significant stenosis or regurgitation. " : `${d.avSeverity}. `) +
      (d.avVmax ? `AV Vmax ${d.avVmax} m/s. ` : "") +
      (d.avMg ? `Mean gradient ${d.avMg} mmHg. ` : "") +
      (d.ava ? `AVA ${d.ava} cm\u00b2. ` : "") +
      (d.avai ? `AVAi ${d.avai} cm\u00b2/m\u00b2.` : "")
    : "";

  // Mitral valve
  const mvText = (d.mrSeverity !== "None" || d.msSeverity !== "None" || d.mvMorphology !== "Not assessed")
    ? `\n\nMITRAL VALVE:\n` +
      (d.mvMorphology && d.mvMorphology !== "Not assessed" ? `${d.mvMorphology}. ` : "") +
      (d.mrSeverity !== "None" ? `${d.mrSeverity}${d.mrMechanism && d.mrMechanism !== "Not assessed" ? ` (${d.mrMechanism})` : ""}. ` : "") +
      (d.msSeverity !== "None" ? `${d.msSeverity}. ` : "") +
      (d.mvArea ? `MVA ${d.mvArea} cm\u00b2. ` : "") +
      (d.mvMeanGrad ? `Mean gradient ${d.mvMeanGrad} mmHg.` : "")
    : "";

  // Tricuspid valve
  const tvText = d.trSeverity !== "None"
    ? `\n\nTRICUSPID VALVE:\n${d.trSeverity}${d.trMechanism && d.trMechanism !== "Not assessed" ? ` (${d.trMechanism})` : ""}.` +
      (d.trVmax ? ` TR Vmax ${d.trVmax} m/s.` : "") +
      (d.rvsp ? ` Estimated RVSP ${d.rvsp} mmHg (+ RAP ${d.raP || "5"} mmHg).` : "")
    : "";

  // Pulmonic valve
  const pvText = d.pvSeverity !== "None" && d.pvSeverity !== "Not assessed"
    ? `\n\nPULMONIC VALVE:\n${d.pvSeverity}.` +
      (d.pvVmax ? ` PV Vmax ${d.pvVmax} m/s.` : "") +
      (d.rvotVti ? ` RVOT VTI ${d.rvotVti} cm.` : "")
    : "";

  // RV
  const rvStrainText = d.rvGls
    ? ` RV Free Wall Strain: ${d.rvGls}% (${parseFloat(d.rvGls) <= -20 ? "normal" : parseFloat(d.rvGls) <= -17 ? "mildly impaired" : "impaired"}).` +
      (d.rvStrainRate ? ` RV Strain Rate: ${d.rvStrainRate} s\u207b\u00b9.` : "")
    : "";

  const rvText = d.rvSize !== "Not assessed"
    ? `\n\nRIGHT VENTRICLE:\nRV is ${d.rvSize.toLowerCase()} with ${d.rvFunction.toLowerCase()} function.` +
      (d.rvedd ? ` RV basal diameter ${d.rvedd} mm.` : "") +
      (d.tapse ? ` TAPSE ${d.tapse} mm.` : "") +
      (d.rvSPrime ? ` RV S' ${d.rvSPrime} cm/s.` : "") +
      (d.rvFac ? ` RV FAC ${d.rvFac}%.` : "") +
      rvStrainText
    : "";

  // Aorta
  const aortaText = (d.aorticRoot || d.ascAorta)
    ? `\n\nAORTA:\n` +
      (d.aorticRoot ? `Aortic root ${d.aorticRoot} cm. ` : "") +
      (d.ascAorta ? `Ascending aorta ${d.ascAorta} cm. ` : "") +
      (d.aorticArch && d.aorticArch !== "Not assessed" ? `Aortic arch: ${d.aorticArch}.` : "")
    : "";

  // Pericardium
  const pericardText = d.pericardialEffusion !== "None"
    ? `\n\nPERICARDIUM:\n${d.pericardialEffusion} pericardial effusion.` +
      (d.pericardialComment ? ` ${d.pericardialComment}.` : "")
    : "";

  // IVC / RA pressure
  const ivcText = d.ivcDiam
    ? `\n\nINFERIOR VENA CAVA:\nIVC diameter ${d.ivcDiam} cm with ${d.ivcCollapse.toLowerCase()} collapsibility. Estimated RA pressure ${d.raP || "5"} mmHg.`
    : "";

  const conclusionText = d.conclusion
    ? `\n\nIMPRESSION:\n${d.conclusion}`
    : "";

  return `ECHOCARDIOGRAPHIC REPORT
${sep}
Study Type: ${d.studyType || "Transthoracic Echocardiogram (TTE)"}
Indication: ${d.indication || "--"}
Image Quality: ${d.imageQuality || "--"}
${sep}

LEFT VENTRICLE:
LV is ${lvSize}${efInterp ? ` with ${efInterp}` : ""}.${wallThick ? ` ${wallThick}.` : ""}${rwmaText}
${d.lvedd ? `LVEDD ${d.lvedd} mm. ` : ""}${d.lvesd ? `LVESD ${d.lvesd} mm. ` : ""}${d.ivsd ? `IVSd ${d.ivsd} mm. ` : ""}${d.pwd ? `PWd ${d.pwd} mm. ` : ""}${d.lvMass ? `LV mass ${d.lvMass} g. ` : ""}${d.lvMassIndex ? `LV mass index ${d.lvMassIndex} g/m\u00b2.` : ""}
${d.ef ? `EF ${d.ef}% (${d.efMethod || "Biplane Simpson"}).` : ""}${d.fs ? ` FS ${d.fs}%.` : ""}${hemodynamicsText}${lvStrainText}${diastText}${laText}${raText}${avText}${mvText}${tvText}${pvText}${rvText}${aortaText}${pericardText}${ivcText}${conclusionText}

${sep}
Interpreted by: ___________________________
Date: ${now}
(c) All About Ultrasound -- iHeartEcho(tm) | www.iheartecho.com`;
}

// --- MAIN COMPONENT ---

export default function ReportBuilder() {
  const [data, setData] = useState<ReportData>({
    indication: "", imageQuality: "Adequate", studyType: "Transthoracic Echocardiogram (TTE)",
    lvedd: "", lvesd: "", ivsd: "", pwd: "",
    lvLength: "", lvMass: "", lvMassIndex: "",
    ef: "", efMethod: "Biplane Simpson", fs: "",
    sv: "", co: "", ci: "",
    rwma: "None", rwmaTerritory: "",
    lvGls: "", lvGlsInterpretation: "", lvStrainRate: "",
    eVel: "", aVel: "", eaRatio: "", ePrimeSeptal: "", ePrimeLateral: "", ePrimeAvg: "",
    eeRatio: "", trVel: "", lavi: "", ddt: "", ivrt: "", diastGrade: "Not assessed", lvedp: "",
    laApSize: "", laVolume: "", laVolumeIndex: "", lars: "", larsInterpretation: "", laFunction: "Not assessed",
    raSize: "Not assessed", raVolume: "", raVolumeIndex: "", rars: "", rarsInterpretation: "",
    rvSize: "Normal", rvFreeWall: "", rvFunction: "Normal",
    tapse: "", rvSPrime: "", rvFac: "", rvsp: "", rvGls: "", rvStrainRate: "", rvedd: "",
    avVmax: "", avMg: "", ava: "", avai: "", avSeverity: "Normal", avMorphology: "Not assessed",
    mrSeverity: "None", mrMechanism: "Not assessed",
    mvArea: "", mvMeanGrad: "", msSeverity: "None", mvMorphology: "Not assessed",
    trSeverity: "None", trVmax: "", trMechanism: "Not assessed",
    pvSeverity: "Not assessed", pvVmax: "", rvotVti: "",
    aorticRoot: "", ascAorta: "", aorticArch: "Not assessed",
    pericardialEffusion: "None", pericardialComment: "",
    ivcDiam: "", ivcCollapse: "Normal (>50%)", raP: "5",
    conclusion: "",
  });

  const [copied, setCopied] = useState(false);
  const report = generateReport(data);
  const set = (key: keyof ReportData) => (v: string) => setData(d => ({ ...d, [key]: v }));

  const copyReport = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Echo Report Builder
          </h1>
          <p className="text-sm text-gray-500">
            IAC Adult TTE accreditation-compliant structured report. Enter measurements and findings below.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input form */}
          <div className="space-y-4">

            {/* Study Info */}
            <Section title="Study Information">
              <div className="col-span-2">
                <SelectField label="Study Type" value={data.studyType} onChange={set("studyType")}
                  options={["Transthoracic Echocardiogram (TTE)", "Limited TTE", "Stress Echo", "Contrast Echo", "3D TTE"]} />
              </div>
              <div className="col-span-2">
                <Field label="Indication" value={data.indication} onChange={set("indication")}
                  placeholder="e.g. Dyspnea, chest pain, pre-op evaluation" />
              </div>
              <div className="col-span-2">
                <SelectField label="Image Quality" value={data.imageQuality} onChange={set("imageQuality")}
                  options={["Adequate", "Good", "Excellent", "Suboptimal — limited windows", "Poor — non-diagnostic"]} />
              </div>
            </Section>

            {/* LV Dimensions */}
            <Section title="Left Ventricle — Dimensions & Systolic Function">
              <Field label="LVEDD" value={data.lvedd} onChange={set("lvedd")} unit="mm" placeholder="42–58" hint="(nl 42–58)" />
              <Field label="LVESD" value={data.lvesd} onChange={set("lvesd")} unit="mm" placeholder="25–40" />
              <Field label="IVSd" value={data.ivsd} onChange={set("ivsd")} unit="mm" placeholder="6–12" hint="(nl 6–12)" />
              <Field label="PWd" value={data.pwd} onChange={set("pwd")} unit="mm" placeholder="6–12" />
              <Field label="LV Mass" value={data.lvMass} onChange={set("lvMass")} unit="g" placeholder="e.g. 180" />
              <Field label="LV Mass Index" value={data.lvMassIndex} onChange={set("lvMassIndex")} unit="g/m²" placeholder="nl <115 M, <95 F" />
              <Field label="EF" value={data.ef} onChange={set("ef")} unit="%" placeholder="nl ≥55" hint="(nl ≥55%)" />
              <SelectField label="EF Method" value={data.efMethod} onChange={set("efMethod")}
                options={["Biplane Simpson", "Visual estimation", "3D volumetric", "M-mode Teichholz", "Single-plane Simpson"]} />
              <Field label="FS" value={data.fs} onChange={set("fs")} unit="%" placeholder="nl 25–43" />
              <div className="col-span-2">
                <SelectField label="Regional Wall Motion" value={data.rwma} onChange={set("rwma")}
                  options={["None", "Anterior hypokinesis", "Anteroseptal hypokinesis", "Inferior hypokinesis", "Inferolateral hypokinesis", "Lateral hypokinesis", "Septal hypokinesis", "Apical hypokinesis", "Anterior akinesis", "Inferior akinesis", "Apical akinesis", "Anterior dyskinesis", "Apical dyskinesis", "Apical aneurysm"]} />
              </div>
              <div className="col-span-2">
                <SelectField label="RWMA Territory" value={data.rwmaTerritory} onChange={set("rwmaTerritory")}
                  options={["", "LAD territory", "RCA territory", "LCx territory", "Multi-vessel territory", "Non-ischemic pattern"]} />
              </div>
            </Section>

            {/* LV Hemodynamics */}
            <Section title="Left Ventricle — Hemodynamics" defaultOpen={false}>
              <Field label="Stroke Volume" value={data.sv} onChange={set("sv")} unit="mL" placeholder="nl 60–100" />
              <Field label="Cardiac Output" value={data.co} onChange={set("co")} unit="L/min" placeholder="nl 4–8" />
              <Field label="Cardiac Index" value={data.ci} onChange={set("ci")} unit="L/min/m²" placeholder="nl >2.2" />
            </Section>

            {/* LV Strain */}
            <Section title="Left Ventricle — Strain (ASE 2025)">
              <Field label="LV GLS" value={data.lvGls} onChange={set("lvGls")} unit="%" placeholder="nl ≤ −18" hint="(nl ≤ −18%)" />
              <SelectField label="LV GLS Interpretation" value={data.lvGlsInterpretation} onChange={set("lvGlsInterpretation")}
                options={["", "Normal (≤ −18%)", "Mildly impaired (−16 to −18%)", "Moderately impaired (−12 to −16%)", "Severely impaired (> −12%)"]} />
              <Field label="LV Strain Rate" value={data.lvStrainRate} onChange={set("lvStrainRate")} unit="s⁻¹" placeholder="nl ≤ −1.0" />
              <div className="col-span-2 text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                ASE 2025: LV GLS normal threshold ≤ −18%. Values between −16% and −18% are borderline. Vendor-specific normal ranges should be applied.
              </div>
            </Section>

            {/* Diastolic Function */}
            <Section title="Diastolic Function (ASE 2016)">
              <Field label="E velocity" value={data.eVel} onChange={set("eVel")} unit="m/s" placeholder="e.g. 0.8" />
              <Field label="A velocity" value={data.aVel} onChange={set("aVel")} unit="m/s" placeholder="e.g. 0.6" />
              <Field label="E/A ratio" value={data.eaRatio} onChange={set("eaRatio")} unit="" placeholder="auto-calc" />
              <Field label="Decel Time (DT)" value={data.ddt} onChange={set("ddt")} unit="ms" placeholder="nl 160–240" />
              <Field label="e' Septal" value={data.ePrimeSeptal} onChange={set("ePrimeSeptal")} unit="cm/s" placeholder="nl >7" hint="(nl >7)" />
              <Field label="e' Lateral" value={data.ePrimeLateral} onChange={set("ePrimeLateral")} unit="cm/s" placeholder="nl >10" hint="(nl >10)" />
              <Field label="e' Average" value={data.ePrimeAvg} onChange={set("ePrimeAvg")} unit="cm/s" placeholder="avg of sep+lat" />
              <Field label="Average E/e'" value={data.eeRatio} onChange={set("eeRatio")} unit="" placeholder="nl <14" hint="(nl <14)" />
              <Field label="TR Vmax" value={data.trVel} onChange={set("trVel")} unit="m/s" placeholder="nl <2.8" hint="(nl <2.8)" />
              <Field label="LAVI" value={data.lavi} onChange={set("lavi")} unit="mL/m²" placeholder="nl <34" hint="(nl <34)" />
              <Field label="IVRT" value={data.ivrt} onChange={set("ivrt")} unit="ms" placeholder="nl 70–90" />
              <Field label="Est. LVEDP" value={data.lvedp} onChange={set("lvedp")} unit="mmHg" placeholder="e.g. 12" />
              <div className="col-span-2">
                <SelectField label="Diastolic Grade" value={data.diastGrade} onChange={set("diastGrade")}
                  options={["Not assessed", "Normal diastolic function", "Grade I — Impaired Relaxation (E/A <0.8, E/e' <10, LAVI <34)", "Grade II — Pseudonormal / Elevated Filling Pressures (E/A 0.8–2.0, E/e' 10–14, LAVI >34)", "Grade III — Restrictive Filling (E/A >2.0, E/e' >14, LAVI >34)", "Indeterminate (insufficient criteria)"]} />
              </div>
            </Section>

            {/* Left Atrium */}
            <Section title="Left Atrium">
              <Field label="LA AP Dimension" value={data.laApSize} onChange={set("laApSize")} unit="mm" placeholder="nl <40 M, <38 F" hint="(nl <40)" />
              <Field label="LA Volume" value={data.laVolume} onChange={set("laVolume")} unit="mL" placeholder="e.g. 55" />
              <Field label="LA Volume Index (LAVI)" value={data.laVolumeIndex} onChange={set("laVolumeIndex")} unit="mL/m²" placeholder="nl <34" hint="(nl <34)" />
              <SelectField label="LA Function" value={data.laFunction} onChange={set("laFunction")}
                options={["Not assessed", "Normal", "Mildly impaired", "Moderately impaired", "Severely impaired"]} />
              <Field label="LARS (LA Reservoir Strain)" value={data.lars} onChange={set("lars")} unit="%" placeholder="nl ≥35" hint="(nl ≥35%)" />
              <SelectField label="LARS Interpretation" value={data.larsInterpretation} onChange={set("larsInterpretation")}
                options={["", "Normal (≥35%)", "Mildly impaired (25–34%)", "Moderately impaired (18–24%)", "Severely impaired (<18%)"]} />
              <div className="col-span-2 text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                LARS is an independent predictor of elevated LV filling pressures and AF recurrence. Normal ≥35% (ASE 2025).
              </div>
            </Section>

            {/* Right Atrium */}
            <Section title="Right Atrium">
              <SelectField label="RA Size" value={data.raSize} onChange={set("raSize")}
                options={["Not assessed", "Normal", "Mildly dilated", "Moderately dilated", "Severely dilated"]} />
              <Field label="RA Volume" value={data.raVolume} onChange={set("raVolume")} unit="mL" placeholder="e.g. 35" />
              <Field label="RA Volume Index (RAVI)" value={data.raVolumeIndex} onChange={set("raVolumeIndex")} unit="mL/m²" placeholder="nl <33" hint="(nl <33)" />
              <Field label="RARS (RA Reservoir Strain)" value={data.rars} onChange={set("rars")} unit="%" placeholder="nl ≥35" hint="(nl ≥35%)" />
              <SelectField label="RARS Interpretation" value={data.rarsInterpretation} onChange={set("rarsInterpretation")}
                options={["", "Normal (≥35%)", "Mildly impaired (25–34%)", "Moderately impaired (18–24%)", "Severely impaired (<18%)"]} />
            </Section>

            {/* Right Ventricle */}
            <Section title="Right Ventricle">
              <Field label="RV Basal Diameter" value={data.rvedd} onChange={set("rvedd")} unit="mm" placeholder="nl <41" hint="(nl <41)" />
              <SelectField label="RV Size" value={data.rvSize} onChange={set("rvSize")}
                options={["Not assessed", "Normal", "Mildly dilated", "Moderately dilated", "Severely dilated"]} />
              <SelectField label="RV Systolic Function" value={data.rvFunction} onChange={set("rvFunction")}
                options={["Not assessed", "Normal", "Mildly reduced", "Moderately reduced", "Severely reduced"]} />
              <Field label="TAPSE" value={data.tapse} onChange={set("tapse")} unit="mm" placeholder="nl ≥17" hint="(nl ≥17)" />
              <Field label="RV S' (TDI)" value={data.rvSPrime} onChange={set("rvSPrime")} unit="cm/s" placeholder="nl ≥9.5" hint="(nl ≥9.5)" />
              <Field label="RV FAC" value={data.rvFac} onChange={set("rvFac")} unit="%" placeholder="nl ≥35" hint="(nl ≥35%)" />
              <Field label="RV Free Wall Strain (GLS)" value={data.rvGls} onChange={set("rvGls")} unit="%" placeholder="nl ≤ −20" hint="(nl ≤ −20%)" />
              <Field label="RV Strain Rate" value={data.rvStrainRate} onChange={set("rvStrainRate")} unit="s⁻¹" placeholder="nl ≤ −1.0" />
              <div className="col-span-2 text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                ASE 2025: RV Free Wall Strain normal ≤ −20%. TAPSE ≥17 mm and S' ≥9.5 cm/s indicate normal RV systolic function.
              </div>
            </Section>

            {/* Aortic Valve */}
            <Section title="Aortic Valve">
              <div className="col-span-2">
                <SelectField label="AV Morphology" value={data.avMorphology} onChange={set("avMorphology")}
                  options={["Not assessed", "Trileaflet — normal morphology", "Trileaflet — calcified", "Bicuspid aortic valve", "Bicuspid — calcified", "Prosthetic aortic valve", "Unicuspid"]} />
              </div>
              <SelectField label="AV Severity" value={data.avSeverity} onChange={set("avSeverity")}
                options={["Not assessed", "Normal", "Mild AS", "Moderate AS", "Severe AS", "Very Severe AS", "Low-Flow Low-Gradient AS", "Mild AR", "Moderate AR", "Severe AR"]} />
              <Field label="AV Vmax" value={data.avVmax} onChange={set("avVmax")} unit="m/s" placeholder="e.g. 4.1" />
              <Field label="Mean Gradient" value={data.avMg} onChange={set("avMg")} unit="mmHg" placeholder="e.g. 43" />
              <Field label="AVA (continuity)" value={data.ava} onChange={set("ava")} unit="cm²" placeholder="e.g. 0.8" />
              <Field label="AVAi" value={data.avai} onChange={set("avai")} unit="cm²/m²" placeholder="nl >0.85" hint="(sev <0.6)" />
            </Section>

            {/* Mitral Valve */}
            <Section title="Mitral Valve">
              <div className="col-span-2">
                <SelectField label="MV Morphology" value={data.mvMorphology} onChange={set("mvMorphology")}
                  options={["Not assessed", "Normal morphology", "Myxomatous degeneration", "Rheumatic changes", "Prolapse — posterior leaflet", "Prolapse — anterior leaflet", "Prolapse — bileaflet", "Restricted motion (Carpentier IIIa)", "Annular calcification", "Prosthetic mitral valve"]} />
              </div>
              <SelectField label="MR Severity" value={data.mrSeverity} onChange={set("mrSeverity")}
                options={["None", "Trace MR", "Mild MR", "Mild-Moderate MR", "Moderate MR", "Moderate-Severe MR", "Severe MR"]} />
              <SelectField label="MR Mechanism" value={data.mrMechanism} onChange={set("mrMechanism")}
                options={["Not assessed", "Primary (degenerative)", "Secondary (functional)", "Mixed", "Ischemic", "Rheumatic"]} />
              <SelectField label="MS Severity" value={data.msSeverity} onChange={set("msSeverity")}
                options={["None", "Mild MS", "Moderate MS", "Severe MS"]} />
              <Field label="MVA" value={data.mvArea} onChange={set("mvArea")} unit="cm²" placeholder="nl >4.0" />
              <Field label="MV Mean Gradient" value={data.mvMeanGrad} onChange={set("mvMeanGrad")} unit="mmHg" placeholder="sev >10" />
            </Section>

            {/* Tricuspid Valve */}
            <Section title="Tricuspid Valve & PA Pressure">
              <SelectField label="TR Severity" value={data.trSeverity} onChange={set("trSeverity")}
                options={["None", "Trace TR", "Mild TR", "Mild-Moderate TR", "Moderate TR", "Moderate-Severe TR", "Severe TR"]} />
              <SelectField label="TR Mechanism" value={data.trMechanism} onChange={set("trMechanism")}
                options={["Not assessed", "Functional (annular dilation)", "Primary (leaflet disease)", "Pacemaker lead", "Rheumatic", "Carcinoid", "Ebstein anomaly"]} />
              <Field label="TR Vmax" value={data.trVmax} onChange={set("trVmax")} unit="m/s" placeholder="e.g. 3.2" />
              <Field label="Estimated RVSP" value={data.rvsp} onChange={set("rvsp")} unit="mmHg" placeholder="e.g. 45" />
            </Section>

            {/* Pulmonic Valve */}
            <Section title="Pulmonic Valve & RVOT" defaultOpen={false}>
              <SelectField label="PV Severity" value={data.pvSeverity} onChange={set("pvSeverity")}
                options={["Not assessed", "Normal", "Mild PS", "Moderate PS", "Severe PS", "Mild PR", "Moderate PR", "Severe PR"]} />
              <Field label="PV Vmax" value={data.pvVmax} onChange={set("pvVmax")} unit="m/s" placeholder="nl <1.5" />
              <Field label="RVOT VTI" value={data.rvotVti} onChange={set("rvotVti")} unit="cm" placeholder="e.g. 18" />
            </Section>

            {/* Aorta */}
            <Section title="Aorta" defaultOpen={false}>
              <Field label="Aortic Root (sinus)" value={data.aorticRoot} onChange={set("aorticRoot")} unit="cm" placeholder="nl <3.8 M, <3.5 F" hint="(nl <3.8)" />
              <Field label="Ascending Aorta" value={data.ascAorta} onChange={set("ascAorta")} unit="cm" placeholder="nl <4.0" hint="(nl <4.0)" />
              <div className="col-span-2">
                <SelectField label="Aortic Arch" value={data.aorticArch} onChange={set("aorticArch")}
                  options={["Not assessed", "Normal", "Mild dilation", "Moderate dilation", "Severe dilation (≥5.0 cm)", "Atherosclerotic changes"]} />
              </div>
            </Section>

            {/* Pericardium */}
            <Section title="Pericardium">
              <div className="col-span-2">
                <SelectField label="Pericardial Effusion" value={data.pericardialEffusion} onChange={set("pericardialEffusion")}
                  options={["None", "Trace", "Small (<1 cm)", "Moderate (1–2 cm)", "Large (>2 cm)", "Large with tamponade physiology", "Constrictive physiology"]} />
              </div>
              <div className="col-span-2">
                <Field label="Pericardial Comment" value={data.pericardialComment} onChange={set("pericardialComment")}
                  placeholder="e.g. No RV diastolic collapse" />
              </div>
            </Section>

            {/* IVC / RA Pressure */}
            <Section title="Inferior Vena Cava & RA Pressure">
              <Field label="IVC Diameter" value={data.ivcDiam} onChange={set("ivcDiam")} unit="cm" placeholder="nl <2.1" hint="(nl <2.1)" />
              <SelectField label="IVC Collapsibility" value={data.ivcCollapse} onChange={set("ivcCollapse")}
                options={["Normal (>50%)", "Reduced (20–50%)", "Minimal (<20%)"]} />
              <Field label="Estimated RA Pressure" value={data.raP} onChange={set("raP")} unit="mmHg" placeholder="3, 5, 10, or 15" />
            </Section>

            {/* Conclusion */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Impression / Conclusion</label>
              <textarea value={data.conclusion} onChange={e => set("conclusion")(e.target.value)}
                rows={4} placeholder="e.g. Severe aortic stenosis with preserved LV systolic function and impaired LV GLS. Mildly elevated LV filling pressures. Clinical correlation recommended."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1] resize-none" />
            </div>
          </div>

          {/* Report preview */}
          <div className="sticky top-20 self-start">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Generated Report</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={downloadReport}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button onClick={copyReport}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all">
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="p-5">
                <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap overflow-auto max-h-[700px]"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  {report}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
