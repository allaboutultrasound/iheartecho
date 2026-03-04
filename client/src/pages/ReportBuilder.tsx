/*
  iHeartEcho — AI Echo Report Builder
  Generates structured echo reports from measurements
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { FileText, Copy, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function Field({ label, value, onChange, unit, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30 focus-within:border-[#189aa1]">
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "—"}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white" style={{ fontFamily: "JetBrains Mono, monospace" }} />
        {unit && <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1] bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface ReportData {
  patientName: string; dob: string; mrn: string; indication: string;
  lvedd: string; lvesd: string; ivsd: string; pwd: string;
  ef: string; efMethod: string; rwma: string;
  eVel: string; aVel: string; ePrime: string; trVel: string; lavi: string; diastGrade: string;
  avVmax: string; avMg: string; ava: string; avSeverity: string;
  mrSeverity: string; trSeverity: string; arSeverity: string; msSeverity: string;
  rvSize: string; rvFunction: string; rvsp: string;
  pericardialEffusion: string; ivcDiam: string; ivcCollapse: string;
  conclusion: string;
}

function generateReport(d: ReportData): string {
  const ef = parseFloat(d.ef);
  const efText = !d.ef ? "" :
    ef >= 55 ? `preserved systolic function (EF ${d.ef}%)` :
    ef >= 40 ? `mildly reduced systolic function (EF ${d.ef}%)` :
    ef >= 30 ? `moderately reduced systolic function (EF ${d.ef}%)` :
    `severely reduced systolic function (EF ${d.ef}%)`;

  const lvSize = !d.lvedd ? "" :
    parseFloat(d.lvedd) > 5.8 ? "dilated" :
    parseFloat(d.lvedd) < 4.2 ? "small" : "normal size";

  const diastText = d.diastGrade !== "Not assessed" ? `\n\nDIASTOLIC FUNCTION:\n${d.diastGrade}.` +
    (d.ePrime ? ` E/e' ratio: ${d.eVel && d.ePrime ? (parseFloat(d.eVel) / parseFloat(d.ePrime)).toFixed(1) : "—"}.` : "") : "";

  const avText = d.avSeverity !== "Normal" && d.avSeverity !== "Not assessed"
    ? `\n\nAORTIC VALVE:\n${d.avSeverity} aortic stenosis.` +
      (d.avVmax ? ` AV Vmax ${d.avVmax} m/s.` : "") +
      (d.avMg ? ` Mean gradient ${d.avMg} mmHg.` : "") +
      (d.ava ? ` AVA ${d.ava} cm².` : "")
    : d.avSeverity === "Normal" ? "\n\nAORTIC VALVE:\nAortic valve appears normal. No significant stenosis or regurgitation." : "";

  const mrText = d.mrSeverity !== "None" && d.mrSeverity !== "Not assessed"
    ? `\n\nMITRAL VALVE:\n${d.mrSeverity} mitral regurgitation.` : "";

  const trText = d.trSeverity !== "None" && d.trSeverity !== "Not assessed"
    ? `\n\nTRICUSPID VALVE:\n${d.trSeverity} tricuspid regurgitation.` +
      (d.rvsp ? ` Estimated RVSP ${d.rvsp} mmHg.` : "") : "";

  const rvText = d.rvSize !== "Not assessed"
    ? `\n\nRIGHT VENTRICLE:\nRV is ${d.rvSize.toLowerCase()} with ${d.rvFunction.toLowerCase()} function.` : "";

  const pericardText = d.pericardialEffusion !== "None" && d.pericardialEffusion !== "Not assessed"
    ? `\n\nPERICARDIUM:\n${d.pericardialEffusion} pericardial effusion noted.` : "";

  const ivcText = d.ivcDiam
    ? `\n\nINFERIOR VENA CAVA:\nIVC diameter ${d.ivcDiam} cm with ${d.ivcCollapse.toLowerCase()} collapsibility.` : "";

  const conclusionText = d.conclusion
    ? `\n\nCONCLUSION:\n${d.conclusion}` : "";

  return `ECHOCARDIOGRAPHIC REPORT
${"─".repeat(50)}
Patient: ${d.patientName || "—"}    DOB: ${d.dob || "—"}    MRN: ${d.mrn || "—"}
Indication: ${d.indication || "—"}
${"─".repeat(50)}

LEFT VENTRICLE:
Left ventricle is ${lvSize || "—"}${efText ? ` with ${efText}` : ""}.${d.rwma && d.rwma !== "None" ? ` Regional wall motion abnormality: ${d.rwma}.` : " No regional wall motion abnormality."}${d.lvedd ? ` LVEDD ${d.lvedd} mm.` : ""}${d.ivsd ? ` IVSd ${d.ivsd} mm.` : ""}${d.pwd ? ` PWd ${d.pwd} mm.` : ""}
EF estimated by ${d.efMethod || "visual estimation"}.${diastText}${avText}${mrText}${trText}${rvText}${pericardText}${ivcText}${conclusionText}

${"─".repeat(50)}
Interpreted by: ___________________________
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
© All About Ultrasound — iHeartEcho™`;
}

export default function ReportBuilder() {
  const [data, setData] = useState<ReportData>({
    patientName: "", dob: "", mrn: "", indication: "",
    lvedd: "", lvesd: "", ivsd: "", pwd: "",
    ef: "", efMethod: "Biplane Simpson", rwma: "None",
    eVel: "", aVel: "", ePrime: "", trVel: "", lavi: "", diastGrade: "Not assessed",
    avVmax: "", avMg: "", ava: "", avSeverity: "Normal",
    mrSeverity: "None", trSeverity: "None", arSeverity: "None", msSeverity: "None",
    rvSize: "Normal", rvFunction: "Normal", rvsp: "",
    pericardialEffusion: "None", ivcDiam: "", ivcCollapse: "Normal (>50%)",
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

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            AI Echo Report Builder
          </h1>
          <p className="text-sm text-gray-500">
            Enter measurements and findings. A structured echo report is generated instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input form */}
          <div className="space-y-4">
            {/* Patient info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Patient Information</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <Field label="Patient Name" value={data.patientName} onChange={set("patientName")} placeholder="Last, First" />
                <Field label="Date of Birth" value={data.dob} onChange={set("dob")} placeholder="MM/DD/YYYY" />
                <Field label="MRN" value={data.mrn} onChange={set("mrn")} placeholder="Medical record #" />
                <Field label="Indication" value={data.indication} onChange={set("indication")} placeholder="e.g. Chest pain eval" />
              </div>
            </div>

            {/* LV */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Left Ventricle</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <Field label="LVEDD" value={data.lvedd} onChange={set("lvedd")} unit="mm" placeholder="e.g. 52" />
                <Field label="LVESD" value={data.lvesd} onChange={set("lvesd")} unit="mm" placeholder="e.g. 35" />
                <Field label="IVSd" value={data.ivsd} onChange={set("ivsd")} unit="mm" placeholder="e.g. 10" />
                <Field label="PWd" value={data.pwd} onChange={set("pwd")} unit="mm" placeholder="e.g. 10" />
                <Field label="EF" value={data.ef} onChange={set("ef")} unit="%" placeholder="e.g. 60" />
                <SelectField label="EF Method" value={data.efMethod} onChange={set("efMethod")}
                  options={["Biplane Simpson", "Visual estimation", "3D volumetric", "M-mode Teichholz"]} />
                <div className="col-span-2">
                  <SelectField label="Regional Wall Motion" value={data.rwma} onChange={set("rwma")}
                    options={["None", "Anterior hypokinesis", "Inferior hypokinesis", "Lateral hypokinesis", "Septal hypokinesis", "Apical hypokinesis", "Anterior akinesis", "Inferior akinesis", "Apical akinesis"]} />
                </div>
              </div>
            </div>

            {/* Diastology */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Diastolic Function</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <Field label="E velocity" value={data.eVel} onChange={set("eVel")} unit="m/s" placeholder="e.g. 0.8" />
                <Field label="A velocity" value={data.aVel} onChange={set("aVel")} unit="m/s" placeholder="e.g. 0.6" />
                <Field label="e' (septal)" value={data.ePrime} onChange={set("ePrime")} unit="cm/s" placeholder="e.g. 8" />
                <Field label="LAVI" value={data.lavi} onChange={set("lavi")} unit="mL/m²" placeholder="e.g. 30" />
                <div className="col-span-2">
                  <SelectField label="Diastolic Grade" value={data.diastGrade} onChange={set("diastGrade")}
                    options={["Not assessed", "Normal diastolic function", "Grade I — Impaired Relaxation", "Grade II — Pseudonormal (Elevated Filling Pressures)", "Grade III — Restrictive", "Indeterminate"]} />
                </div>
              </div>
            </div>

            {/* Valves */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Valvular Assessment</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <SelectField label="AV Severity" value={data.avSeverity} onChange={set("avSeverity")}
                  options={["Not assessed", "Normal", "Mild AS", "Moderate AS", "Severe AS", "Mild AR", "Moderate AR", "Severe AR"]} />
                <Field label="AV Vmax" value={data.avVmax} onChange={set("avVmax")} unit="m/s" placeholder="e.g. 4.1" />
                <Field label="Mean Gradient" value={data.avMg} onChange={set("avMg")} unit="mmHg" placeholder="e.g. 43" />
                <Field label="AVA" value={data.ava} onChange={set("ava")} unit="cm²" placeholder="e.g. 0.8" />
                <SelectField label="MR Severity" value={data.mrSeverity} onChange={set("mrSeverity")}
                  options={["None", "Trace MR", "Mild MR", "Mild-Moderate MR", "Moderate MR", "Moderate-Severe MR", "Severe MR"]} />
                <SelectField label="TR Severity" value={data.trSeverity} onChange={set("trSeverity")}
                  options={["None", "Trace TR", "Mild TR", "Mild-Moderate TR", "Moderate TR", "Moderate-Severe TR", "Severe TR"]} />
              </div>
            </div>

            {/* RV / IVC */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Right Heart & IVC</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <SelectField label="RV Size" value={data.rvSize} onChange={set("rvSize")}
                  options={["Not assessed", "Normal", "Mildly dilated", "Moderately dilated", "Severely dilated"]} />
                <SelectField label="RV Function" value={data.rvFunction} onChange={set("rvFunction")}
                  options={["Not assessed", "Normal", "Mildly reduced", "Moderately reduced", "Severely reduced"]} />
                <Field label="RVSP" value={data.rvsp} onChange={set("rvsp")} unit="mmHg" placeholder="e.g. 35" />
                <SelectField label="Pericardial Effusion" value={data.pericardialEffusion} onChange={set("pericardialEffusion")}
                  options={["None", "Not assessed", "Small", "Moderate", "Large", "Large with tamponade physiology"]} />
                <Field label="IVC Diameter" value={data.ivcDiam} onChange={set("ivcDiam")} unit="cm" placeholder="e.g. 1.8" />
                <SelectField label="IVC Collapsibility" value={data.ivcCollapse} onChange={set("ivcCollapse")}
                  options={["Normal (>50%)", "Reduced (20–50%)", "Minimal (<20%)"]} />
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Conclusion / Impression</label>
              <textarea value={data.conclusion} onChange={e => set("conclusion")(e.target.value)}
                rows={3} placeholder="e.g. Severe aortic stenosis with preserved LV systolic function. Clinical correlation recommended."
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
                <button onClick={copyReport}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="p-5">
                <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap overflow-auto max-h-[600px]"
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
