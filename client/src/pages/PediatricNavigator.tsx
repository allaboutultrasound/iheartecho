/*
  iHeartEcho — Pediatric Echo Navigator
  Covers: Neonatal/Infant/Child CHD findings, Z-score calculator (BSA-based),
          Segmental analysis, Shunt estimation (Qp/Qs), Neonatal RVSP, Common CHD checklist
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import BackToEchoAssist from "@/components/BackToEchoAssist";
import { Baby, AlertCircle, CheckCircle2, HelpCircle, Activity, Scan } from "lucide-react";

// --- DATA ---------------------------------------------------------------------

const chdFindings = [
  {
    category: "Septal Defects",
    findings: [
      {
        finding: "Perimembranous VSD",
        differentials: ["Isolated perimembranous VSD", "VSD with AR (aortic cusp prolapse)", "VSD with subarterial extension", "Malalignment VSD (TOF, DORV)"],
        urgency: "moderate",
        notes: "Assess for aortic cusp prolapse (especially with subarterial/outlet VSD). Measure defect size and Qp/Qs. Spontaneous closure common in small muscular VSDs.",
        keyMeasurements: ["VSD size (mm)", "Qp/Qs ratio", "RV pressure (TR Vmax)", "Aortic cusp prolapse?"],
      },
      {
        finding: "Muscular VSD",
        differentials: ["Isolated muscular VSD", "Swiss-cheese VSD (multiple)", "Post-MI VSD (adults)", "Trabecular VSD"],
        urgency: "mild",
        notes: "Multiple muscular VSDs ('Swiss cheese') require careful sweep. Small muscular VSDs often close spontaneously by age 2.",
        keyMeasurements: ["Number and location of defects", "Total shunt burden", "RV pressure"],
      },
      {
        finding: "Secundum ASD",
        differentials: ["Secundum ASD", "Patent foramen ovale (PFO)", "Sinus venosus ASD", "Coronary sinus ASD"],
        urgency: "moderate",
        notes: "Assess rims for device closure candidacy (≥5 mm all rims). Look for anomalous pulmonary veins with sinus venosus type. RV volume overload pattern.",
        keyMeasurements: ["ASD size (mm)", "Rim measurements (all 6 rims)", "RV size/function", "Qp/Qs"],
      },
      {
        finding: "Primum ASD / Partial AVSD",
        differentials: ["Partial AVSD (primum ASD + cleft MV)", "Complete AVSD (Trisomy 21)", "Transitional AVSD", "Isolated cleft MV"],
        urgency: "high",
        notes: "Always assess AV valve morphology and regurgitation. Trisomy 21 association with complete AVSD. Assess LV/RV balance.",
        keyMeasurements: ["ASD size", "MV cleft and regurgitation", "AV valve morphology", "LV/RV balance"],
      },
    ],
  },
  {
    category: "Outflow Tract Abnormalities",
    findings: [
      {
        finding: "Tetralogy of Fallot (TOF)",
        differentials: ["Classic TOF", "TOF with pulmonary atresia (TOF/PA)", "TOF with absent pulmonary valve", "DORV with subaortic VSD (TOF-type)"],
        urgency: "high",
        notes: "4 features: VSD (perimembranous/malalignment), RVOTO, overriding aorta, RVH. Assess pulmonary valve, MPA, and branch PA sizes. Check aortic arch sidedness.",
        keyMeasurements: ["RVOT gradient", "Pulmonary valve annulus Z-score", "MPA/RPA/LPA sizes", "Aortic override %", "Coronary anatomy (LAD from RCA?)"],
      },
      {
        finding: "Pulmonary Stenosis",
        differentials: ["Valvar PS (most common)", "Subvalvar (infundibular) PS", "Supravalvar PS", "Branch PA stenosis", "Noonan syndrome PS"],
        urgency: "moderate",
        notes: "Valvar PS: doming, thickened leaflets, post-stenotic dilation. Assess gradient (peak and mean). Noonan: dysplastic valve, no post-stenotic dilation.",
        keyMeasurements: ["PV peak gradient", "PV mean gradient", "PV annulus Z-score", "MPA size", "RV pressure"],
      },
      {
        finding: "Aortic Stenosis (Pediatric)",
        differentials: ["Valvar AS (bicuspid/unicuspid)", "Subvalvar AS (discrete membrane, tunnel)", "Supravalvar AS (Williams syndrome)", "HCM with LVOTO"],
        urgency: "high",
        notes: "Bicuspid AV most common cause. Williams syndrome: supravalvar AS + peripheral PA stenosis. Assess gradient and valve morphology carefully.",
        keyMeasurements: ["AV peak/mean gradient", "AV annulus Z-score", "LVOT diameter", "Aortic root size", "LV function"],
      },
      {
        finding: "Coarctation of Aorta",
        differentials: ["Discrete juxtaductal coarctation", "Long segment hypoplastic arch", "Interrupted aortic arch (IAA)", "Pseudocoarctation"],
        urgency: "high",
        notes: "Assess arch from suprasternal notch. Doppler: continuous diastolic flow ('diastolic tail') = significant coarctation. Check for bicuspid AV (50–80% association).",
        keyMeasurements: ["CoA gradient (peak/mean)", "Arch Z-scores (transverse, isthmus)", "Bicuspid AV?", "Collateral flow (abdominal aorta Doppler)"],
      },
    ],
  },
  {
    category: "Complex CHD",
    findings: [
      {
        finding: "Transposition of Great Arteries (d-TGA)",
        differentials: ["d-TGA (concordant AV, discordant VA)", "l-TGA / CCTGA (discordant AV and VA)", "DORV with subpulmonary VSD (Taussig-Bing)", "Truncus arteriosus"],
        urgency: "high",
        notes: "Parallel great arteries (aorta anterior-right). Identify AV and VA connections using segmental analysis. Assess coronary anatomy (critical for arterial switch).",
        keyMeasurements: ["AV connections", "VA connections", "Coronary anatomy", "IVS intact vs VSD", "PV gradient (neo-aorta post-switch)"],
      },
      {
        finding: "Hypoplastic Left Heart Syndrome (HLHS)",
        differentials: ["Classic HLHS (MA/AA)", "HLHS with mitral stenosis/aortic atresia", "Critical AS with hypoplastic LV", "Unbalanced AVSD (LV dominant)"],
        urgency: "high",
        notes: "Measure all left-sided structures. Assess ASD size (restrictive = emergency). PDA patency critical. Retrograde aortic arch flow confirms HLHS.",
        keyMeasurements: ["MV annulus Z-score", "LV volume Z-score", "Aortic root Z-score", "ASD size", "PDA size and flow direction"],
      },
      {
        finding: "Single Ventricle / Functional SV",
        differentials: ["Tricuspid atresia", "Double inlet LV (DILV)", "Heterotaxy with unbalanced AVSD", "HLHS spectrum"],
        urgency: "high",
        notes: "Segmental analysis essential. Assess AV valve regurgitation, ventricular function, and outflow tract obstruction. Glenn/Fontan physiology assessment.",
        keyMeasurements: ["Ventricular function (EF)", "AV valve regurgitation", "Outflow tract gradient", "PA pressures", "IVC/SVC flow (post-Fontan)"],
      },
      {
        finding: "Ebstein Anomaly",
        differentials: ["Ebstein anomaly", "Tricuspid valve dysplasia (neonatal)", "Uhl anomaly", "Arrhythmogenic RV cardiomyopathy"],
        urgency: "high",
        notes: "Apical displacement of septal TV leaflet ≥8 mm/m² BSA. Assess atrialized RV size. Look for ASD/PFO and WPW. Neonatal Ebstein can be severe.",
        keyMeasurements: ["TV septal leaflet displacement (mm/m²)", "Atrialized RV size", "Functional RV size", "TR severity", "ASD/PFO size"],
      },
    ],
  },
  {
    category: "Neonatal / Critical",
    findings: [
      {
        finding: "Critical Pulmonary Stenosis / Pulmonary Atresia with Intact IVS",
        differentials: ["Critical PS (valvar)", "Pulmonary atresia with intact IVS (PA/IVS)", "TOF with severe PS", "Neonatal Ebstein with functional PA"],
        urgency: "high",
        notes: "PA/IVS: assess RV size and tricuspid valve (Z-scores). Sinusoids/RV-coronary fistulae — if present, RV decompression may be contraindicated.",
        keyMeasurements: ["TV annulus Z-score", "RV volume Z-score", "PV morphology", "Coronary sinusoids?", "PDA size"],
      },
      {
        finding: "Patent Ductus Arteriosus (PDA) — Hemodynamically Significant",
        differentials: ["Large PDA (premature infant)", "PDA with Eisenmenger", "Aortopulmonary window", "Coronary fistula"],
        urgency: "moderate",
        notes: "Assess direction of ductal flow. LA:Ao ratio >1.4 suggests significant left-to-right shunt. In premature infants, assess for NEC and IVH risk.",
        keyMeasurements: ["PDA size (mm)", "Flow direction", "LA:Ao ratio", "LV dilation?", "Pulmonary overcirculation signs"],
      },
    ],
  },
];

// --- Z-SCORE CALCULATOR (BSA-normalized, simplified Daubeney/Pettersen-based) --
function PedZScoreCalc() {
  const [bsa, setBsa] = useState("");
  const [structure, setStructure] = useState("mv_annulus");
  const [value, setValue] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // BSA from weight/height (Mosteller formula)
  const calcBsa = weight && height
    ? Math.sqrt((parseFloat(weight) * parseFloat(height)) / 3600).toFixed(2)
    : "";
  const bsaVal = bsa || calcBsa;

  // Simplified normative data (Pettersen et al. 2008 / Daubeney 1999 approach)
  // mean = a * BSA^b, SD approximated
  const normativeData: Record<string, { a: number; b: number; sd: number; unit: string }> = {
    mv_annulus:   { a: 3.02, b: 0.45, sd: 0.30, unit: "cm" },
    tv_annulus:   { a: 3.39, b: 0.45, sd: 0.35, unit: "cm" },
    aortic_root:  { a: 1.92, b: 0.44, sd: 0.22, unit: "cm" },
    aortic_annulus: { a: 1.48, b: 0.44, sd: 0.18, unit: "cm" },
    pv_annulus:   { a: 1.77, b: 0.44, sd: 0.20, unit: "cm" },
    mpa:          { a: 2.00, b: 0.44, sd: 0.25, unit: "cm" },
    rpa:          { a: 1.25, b: 0.44, sd: 0.18, unit: "cm" },
    lpa:          { a: 1.20, b: 0.44, sd: 0.18, unit: "cm" },
    lv_edv:       { a: 42.0, b: 1.22, sd: 8.0,  unit: "mL" },
    lv_esv:       { a: 15.0, b: 1.22, sd: 4.0,  unit: "mL" },
    lv_edd:       { a: 3.10, b: 0.45, sd: 0.30, unit: "cm" },
  };

  const bsaNum = parseFloat(bsaVal || "0");
  const valNum = parseFloat(value);
  const norm = normativeData[structure];
  const mean = norm && bsaNum > 0 ? norm.a * Math.pow(bsaNum, norm.b) : 0;
  const zScore = norm && bsaNum > 0 && valNum > 0
    ? ((valNum - mean) / norm.sd).toFixed(2)
    : null;

  const getZInterp = (z: number) => {
    if (z < -3) return { label: "Severely Reduced (< -3 SD)", color: "#dc2626" };
    if (z < -2) return { label: "Reduced (< -2 SD)", color: "#d97706" };
    if (z > 3) return { label: "Severely Enlarged (> +3 SD)", color: "#dc2626" };
    if (z > 2) return { label: "Enlarged (> +2 SD)", color: "#d97706" };
    return { label: "Normal Range (±2 SD)", color: "#16a34a" };
  };

  const structures = [
    { value: "mv_annulus", label: "Mitral Valve Annulus" },
    { value: "tv_annulus", label: "Tricuspid Valve Annulus" },
    { value: "aortic_root", label: "Aortic Root (sinus)" },
    { value: "aortic_annulus", label: "Aortic Valve Annulus" },
    { value: "pv_annulus", label: "Pulmonary Valve Annulus" },
    { value: "mpa", label: "Main Pulmonary Artery" },
    { value: "rpa", label: "Right Pulmonary Artery" },
    { value: "lpa", label: "Left Pulmonary Artery" },
    { value: "lv_edd", label: "LV End-Diastolic Diameter" },
    { value: "lv_edv", label: "LV End-Diastolic Volume" },
    { value: "lv_esv", label: "LV End-Systolic Volume" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        <strong>Reference:</strong> Z-scores based on Pettersen et al. (2008) and Daubeney et al. (1999) normative data.
        Values are approximations — use institution-specific or published nomograms for clinical decisions.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Weight</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg"
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">kg</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Height</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="cm"
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">cm</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">BSA (or auto-calc)</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
            <input type="number" value={bsa} onChange={e => setBsa(e.target.value)} placeholder={calcBsa || "m²"}
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">m²</span>
          </div>
          {calcBsa && !bsa && <div className="text-xs text-[#189aa1] mt-0.5">Auto: {calcBsa} m²</div>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Measurement</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={norm?.unit}
              className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
            <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">{norm?.unit}</span>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Structure</label>
        <select value={structure} onChange={e => setStructure(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30 focus:border-[#189aa1]">
          {structures.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {zScore !== null && (
        <div className="rounded-lg p-4 border border-[#189aa1]/20 bg-[#f0fbfc] animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <div className="text-xs text-gray-500">Z-Score</div>
              <div className="text-3xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{zScore}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expected Mean</div>
              <div className="text-lg font-bold text-gray-700" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {mean.toFixed(2)} {norm?.unit}
              </div>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: getZInterp(parseFloat(zScore)).color }}>
                {getZInterp(parseFloat(zScore)).label}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">BSA: {bsaVal} m² | Mosteller formula | Pettersen 2008 normative data</div>
        </div>
      )}
    </div>
  );
}

// --- Qp/Qs CALCULATOR ---------------------------------------------------------
function QpQsCalc() {
  const [pvVti, setPvVti] = useState("");
  const [pvD, setPvD] = useState("");
  const [lvotVti, setLvotVti] = useState("");
  const [lvotD, setLvotD] = useState("");

  const pvArea = pvD ? (Math.PI * Math.pow(parseFloat(pvD) / 2, 2)).toFixed(3) : "";
  const lvotArea = lvotD ? (Math.PI * Math.pow(parseFloat(lvotD) / 2, 2)).toFixed(3) : "";
  const qp = pvArea && pvVti ? (parseFloat(pvArea) * parseFloat(pvVti)).toFixed(1) : "";
  const qs = lvotArea && lvotVti ? (parseFloat(lvotArea) * parseFloat(lvotVti)).toFixed(1) : "";
  const ratio = qp && qs ? (parseFloat(qp) / parseFloat(qs)).toFixed(2) : "";

  const ratioInterp = ratio
    ? parseFloat(ratio) >= 2.0 ? { label: "Large shunt (≥2:1) — likely surgical/interventional candidate", color: "#dc2626" }
    : parseFloat(ratio) >= 1.5 ? { label: "Moderate shunt (1.5–2:1) — consider intervention", color: "#d97706" }
    : { label: "Small shunt (<1.5:1) — observe", color: "#16a34a" }
    : null;

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 mb-2">Qp/Qs = (PV CSA × PV VTI) / (LVOT CSA × LVOT VTI)</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#189aa1] uppercase tracking-wider">Pulmonary (Qp)</div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">PV Annulus Diameter</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
              <input type="number" value={pvD} onChange={e => setPvD(e.target.value)} placeholder="cm"
                className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">PV VTI (RVOT)</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
              <input type="number" value={pvVti} onChange={e => setPvVti(e.target.value)} placeholder="cm"
                className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">cm</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#189aa1] uppercase tracking-wider">Systemic (Qs)</div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">LVOT Diameter</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
              <input type="number" value={lvotD} onChange={e => setLvotD(e.target.value)} placeholder="cm"
                className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">LVOT VTI</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
              <input type="number" value={lvotVti} onChange={e => setLvotVti(e.target.value)} placeholder="cm"
                className="flex-1 px-3 py-2 text-sm outline-none" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">cm</span>
            </div>
          </div>
        </div>
      </div>
      {ratio && (
        <div className="rounded-lg p-4 border border-[#189aa1]/20 bg-[#f0fbfc] animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <div className="text-xs text-gray-500">Qp/Qs Ratio</div>
              <div className="text-3xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{ratio} : 1</div>
            </div>
            <div className="text-xs text-gray-500">
              <div>Qp: {qp} mL/beat</div>
              <div>Qs: {qs} mL/beat</div>
            </div>
          </div>
          {ratioInterp && (
            <div className="text-xs font-semibold px-2 py-1 rounded" style={{ color: ratioInterp.color, background: ratioInterp.color + "15" }}>
              {ratioInterp.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- SEGMENTAL ANALYSIS HELPER ------------------------------------------------
function SegmentalAnalysis() {
  const [visceroAtrial, setVisceroAtrial] = useState("");
  const [avConnection, setAvConnection] = useState("");
  const [vaConnection, setVaConnection] = useState("");

  const isNormal = visceroAtrial === "solitus" && avConnection === "concordant" && vaConnection === "concordant";
  const isTGA = visceroAtrial === "solitus" && avConnection === "concordant" && vaConnection === "discordant";
  const isCCTGA = avConnection === "discordant" && vaConnection === "discordant";
  const isDORV = vaConnection === "dorv";

  const getInterpretation = () => {
    if (isNormal) return { label: "Normal Cardiac Segmental Anatomy", color: "#16a34a" };
    if (isTGA) return { label: "d-TGA (Concordant AV, Discordant VA)", color: "#dc2626" };
    if (isCCTGA) return { label: "CCTGA / L-TGA (Discordant AV + VA)", color: "#dc2626" };
    if (isDORV) return { label: "Double Outlet Right Ventricle (DORV)", color: "#d97706" };
    if (avConnection === "single_ventricle") return { label: "Univentricular AV Connection", color: "#189aa1" };
    if (vaConnection && avConnection && visceroAtrial) return { label: "Complex CHD — Detailed analysis required", color: "#d97706" };
    return null;
  };

  const interp = getInterpretation();

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 mb-2">
        Van Praagh segmental notation: {"{"}Visceroatrial situs, AV connection, VA connection{"}"}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Visceroatrial Situs</label>
          <select value={visceroAtrial} onChange={e => setVisceroAtrial(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
            <option value="">Select...</option>
            <option value="solitus">Solitus (S) — Normal</option>
            <option value="inversus">Inversus (I) — Mirror image</option>
            <option value="ambiguus_ra">Ambiguus — Right isomerism (asplenia)</option>
            <option value="ambiguus_la">Ambiguus — Left isomerism (polysplenia)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">AV Connection</label>
          <select value={avConnection} onChange={e => setAvConnection(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
            <option value="">Select...</option>
            <option value="concordant">Concordant (RA→RV, LA→LV)</option>
            <option value="discordant">Discordant (RA→LV, LA→RV)</option>
            <option value="single_ventricle">Univentricular (both atria → 1 ventricle)</option>
            <option value="ambiguous">Ambiguous (heterotaxy)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">VA Connection</label>
          <select value={vaConnection} onChange={e => setVaConnection(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#189aa1]/30">
            <option value="">Select...</option>
            <option value="concordant">Concordant (RV→PA, LV→Ao)</option>
            <option value="discordant">Discordant (RV→Ao, LV→PA)</option>
            <option value="dorv">DORV (both GAs from RV)</option>
            <option value="dolv">DOLV (both GAs from LV)</option>
            <option value="truncus">Common Trunk (Truncus arteriosus)</option>
          </select>
        </div>
      </div>
      {interp && (
        <div className="rounded-lg p-4 border animate-in fade-in duration-300" style={{ borderColor: interp.color + "40", background: interp.color + "10" }}>
          <div className="font-bold text-sm mb-1" style={{ color: interp.color }}>{interp.label}</div>
          {isNormal && <div className="text-xs text-gray-500">Normal segmental anatomy: {"{"} S, C, C {"}"}</div>}
          {isTGA && <div className="text-xs text-gray-500">Segmental notation: {"{"} S, C, D {"}"}. Requires arterial switch operation (Jatene). Assess coronary anatomy.</div>}
          {isCCTGA && <div className="text-xs text-gray-500">Segmental notation: {"{"} S, D, L {"}"}. Physiologically corrected but morphologic RV is systemic ventricle.</div>}
        </div>
      )}
    </div>
  );
}

// // --- NEONATAL HEMODYNAMICS COMPONENT -----------------------------------------------------
function NeonatalHemodynamics() {
  const [trVmax, setTrVmax] = useState("");
  const [rap, setRap] = useState("5");
  const [prVmax, setPrVmax] = useState("");
  const [pdaDir, setPdaDir] = useState<"left-to-right" | "right-to-left" | "bidirectional" | "">("")
  const [ivcDil, setIvcDil] = useState(false);
  const [raaDil, setRaaDil] = useState(false);

  // RVSP from TR Vmax (Bernoulli)
  const rvsp = trVmax ? (4 * Math.pow(parseFloat(trVmax), 2) + parseFloat(rap || "5")).toFixed(1) : "";
  const rvspNum = rvsp ? parseFloat(rvsp) : 0;

  // Neonatal-specific RVSP interpretation
  // In transitional circulation (0–48h), RVSP may equal systemic — normal
  // After 48h: RVSP >2/3 systemic = elevated
  const getRvspInterp = () => {
    if (!rvsp) return null;
    if (rvspNum >= 60) return { label: "Severely elevated (≥60 mmHg) — Likely PPHN or CHD", color: "#dc2626", note: "Evaluate for PPHN, CHD with RV outflow obstruction, or parenchymal lung disease" };
    if (rvspNum >= 40) return { label: "Moderately elevated (40–59 mmHg) — Persistent PH", color: "#d97706", note: "Consider transitional circulation if <48h of life. If >48h: evaluate for PPHN" };
    if (rvspNum >= 25) return { label: "Mildly elevated (25–39 mmHg) — Monitor", color: "#d97706", note: "May be normal in first 24–48h of life (transitional). Recheck at 48–72h" };
    return { label: "Normal (<25 mmHg) — Pulmonary pressures normal", color: "#16a34a", note: "Normal neonatal pulmonary vascular resistance" };
  };
  const rvspInterp = getRvspInterp();

  // PR end-diastolic velocity → estimate PA diastolic pressure
  const padp = prVmax ? (4 * Math.pow(parseFloat(prVmax), 2) + parseFloat(rap || "5")).toFixed(1) : "";

  // PDA direction interpretation
  const pdaInterp = pdaDir === "left-to-right"
    ? { label: "L→R shunt: Systemic > Pulmonary pressure (normal direction)", color: "#16a34a" }
    : pdaDir === "right-to-left"
    ? { label: "R→L shunt: Pulmonary > Systemic pressure — PPHN / Critical CHD", color: "#dc2626" }
    : pdaDir === "bidirectional"
    ? { label: "Bidirectional: Near-equal pressures — Transitional or PPHN", color: "#d97706" }
    : null;

  // Supporting features
  const supportingFeatures: string[] = [];
  if (ivcDil) supportingFeatures.push("IVC dilation → Elevated RAP / RV failure");
  if (raaDil) supportingFeatures.push("RA dilation → Chronic RV pressure/volume overload");

  return (
    <div className="space-y-5">
      {/* PPHN / Transitional Circulation info */}
      <div className="bg-teal-100 border border-teal-300 rounded-xl p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teal-600">
          <strong>Transitional Circulation (0–48h):</strong> RVSP may equal systemic pressure — this is normal in the first 24–48h of life.
          Persistent pulmonary hypertension of the newborn (PPHN) is diagnosed when RVSP remains elevated (&gt;2/3 systemic) beyond 48h
          or when there is R→L shunting at the PDA or PFO.
        </div>
      </div>

      {/* RVSP Calculator */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="teal-header px-5 py-3">
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>RVSP from TR Vmax (Bernoulli)</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">TR Vmax <span className="text-gray-400">(m/s)</span></label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
                <input type="number" value={trVmax} onChange={e => setTrVmax(e.target.value)} placeholder="e.g. 3.2"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-white" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">m/s</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">RAP Estimate <span className="text-gray-400">(mmHg)</span></label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
                <input type="number" value={rap} onChange={e => setRap(e.target.value)} placeholder="5"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-white" style={{ fontFamily: "JetBrains Mono, monospace" }} />
                <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">mmHg</span>
              </div>
            </div>
          </div>
          {rvsp && rvspInterp && (
            <div className="rounded-lg p-4 border" style={{ borderColor: rvspInterp.color + "40", background: rvspInterp.color + "10" }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm text-gray-600">RVSP =</span>
                <span className="text-3xl font-black" style={{ fontFamily: "JetBrains Mono, monospace", color: rvspInterp.color }}>{rvsp}</span>
                <span className="text-sm text-gray-500">mmHg</span>
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: rvspInterp.color }}>{rvspInterp.label}</div>
              <div className="text-xs text-gray-500">{rvspInterp.note}</div>
            </div>
          )}
        </div>
      </div>

      {/* PA Diastolic Pressure from PR */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="teal-header px-5 py-3">
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>PA Diastolic Pressure from PR End-Diastolic Velocity</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 mb-1">PR End-Diastolic Velocity <span className="text-gray-400">(m/s)</span></label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/30">
              <input type="number" value={prVmax} onChange={e => setPrVmax(e.target.value)} placeholder="e.g. 1.2"
                className="flex-1 px-3 py-2 text-sm outline-none bg-white" style={{ fontFamily: "JetBrains Mono, monospace" }} />
              <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200">m/s</span>
            </div>
          </div>
          {padp && (
            <div className="rounded-lg p-3 bg-[#f0fbfc] border border-[#189aa1]/20">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">PA Diastolic Pressure =</span>
                <span className="text-2xl font-black text-[#189aa1]" style={{ fontFamily: "JetBrains Mono, monospace" }}>{padp}</span>
                <span className="text-sm text-gray-500">mmHg</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">PADP = 4 × PR end-diastolic velocity² + RAP | Normal neonatal PADP: &lt;15 mmHg</div>
            </div>
          )}
        </div>
      </div>

      {/* PDA Direction */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="teal-header px-5 py-3">
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>PDA Shunt Direction (Hemodynamic Significance)</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["left-to-right", "right-to-left", "bidirectional"] as const).map(d => (
              <button key={d} onClick={() => setPdaDir(pdaDir === d ? "" : d)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  pdaDir === d ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={pdaDir === d ? { background: "#189aa1" } : {}}>
                {d === "left-to-right" ? "L→R (Normal)" : d === "right-to-left" ? "R→L (PPHN)" : "Bidirectional"}
              </button>
            ))}
          </div>
          {pdaInterp && (
            <div className="rounded-lg p-3 border" style={{ borderColor: pdaInterp.color + "40", background: pdaInterp.color + "10" }}>
              <div className="text-sm font-bold" style={{ color: pdaInterp.color }}>{pdaInterp.label}</div>
            </div>
          )}
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            <strong>Clinical note:</strong> R→L PDA shunting = pulmonary pressure exceeds systemic — indicates PPHN or critical CHD (e.g., d-TGA, HLHS, critical PS/AS).
            PGE1 should be considered to maintain ductal patency in duct-dependent lesions.
          </div>
        </div>
      </div>

      {/* Supporting Features */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="teal-header px-5 py-3">
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Supporting Hemodynamic Features</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={ivcDil} onChange={e => setIvcDil(e.target.checked)} className="rounded" />
              IVC dilated (&gt;9 mm in neonate)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={raaDil} onChange={e => setRaaDil(e.target.checked)} className="rounded" />
              RA dilation present
            </label>
          </div>
          {supportingFeatures.length > 0 && (
            <div className="space-y-1">
              {supportingFeatures.map((f, i) => (
                <div key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5">{f}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PPHN Reference Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Neonatal Pulmonary Hypertension Reference</h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f0fbfc]">
                <th className="text-left px-3 py-2 font-bold text-[#189aa1]">Parameter</th>
                <th className="text-left px-3 py-2 font-bold text-green-600">Normal Neonate</th>
                <th className="text-left px-3 py-2 font-bold text-amber-600">Transitional (0–48h)</th>
                <th className="text-left px-3 py-2 font-bold text-red-600">PPHN</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["RVSP", "<25 mmHg", "Up to systemic", "≥60 mmHg or >2/3 systemic"],
                ["TR Vmax", "<2.5 m/s", "Up to 3.5 m/s", ">3.5 m/s"],
                ["PA Diastolic", "<15 mmHg", "Variable", ">25 mmHg"],
                ["PDA Direction", "L→R", "Bidirectional", "R→L or bidirectional"],
                ["PFO Direction", "L→R (small)", "Bidirectional", "R→L"],
                ["IVC", "Normal (<9 mm)", "Variable", "Dilated"],
                ["RV Function", "Normal", "Normal", "Reduced (TAPSE, FAC)"],
              ].map(([param, normal, trans, pphn], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 font-semibold text-gray-700">{param}</td>
                  <td className="px-3 py-2 text-green-700">{normal}</td>
                  <td className="px-3 py-2 text-amber-700">{trans}</td>
                  <td className="px-3 py-2 text-red-700">{pphn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
type TabId = "findings" | "zscore" | "qpqs" | "segmental" | "neonatal";

export default function PediatricNavigator() {
  const [tab, setTab] = useState<TabId>("findings");
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);

  const currentFindings = chdFindings[selectedCategory].findings;

  const tabs = [
    { id: "findings" as TabId, label: "CHD Findings" },
    { id: "zscore" as TabId, label: "Z-Score Calculator" },
    { id: "qpqs" as TabId, label: "Qp/Qs Shunt" },
    { id: "segmental" as TabId, label: "Segmental Analysis" },
    { id: "neonatal" as TabId, label: "Neonatal Hemodynamics" },
  ];

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}>
        <div className="container py-8 md:py-10">
          <div className="mb-3">
            <BackToEchoAssist className="text-white/70 hover:text-white" />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
              <Baby className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Congenital Heart · Pediatric Echo</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                Pediatric Echo Navigator
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Congenital heart disease findings, BSA-normalized Z-scores, Qp/Qs shunt estimation, and segmental analysis.
              </p>
              <div className="mt-3">
                <Link href="/scan-coach?tab=chd">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Scan className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    Open in ScanCoach
                    <span className="text-xs text-[#4ad9e0]">→</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={tab === t.id ? { background: "#189aa1" } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* CHD Findings */}
        {tab === "findings" && (
          <div>
            {/* Category selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {chdFindings.map((cat, i) => (
                <button key={i} onClick={() => { setSelectedCategory(i); setSelectedFinding(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === i ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1]"
                  }`}
                  style={selectedCategory === i ? { background: "#0e7490" } : {}}>
                  {cat.category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Findings list */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {chdFindings[selectedCategory].category}
                </h3>
                {currentFindings.map((f, i) => (
                  <button key={i} onClick={() => setSelectedFinding(i === selectedFinding ? null : i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedFinding === i
                        ? "border-[#189aa1] bg-[#f0fbfc] shadow-sm"
                        : "border-gray-100 bg-white hover:border-[#189aa1]/40 hover:bg-[#f0fbfc]/50"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        f.urgency === "high" ? "bg-red-500" : f.urgency === "moderate" ? "bg-amber-400" : "bg-green-400"
                      }`} />
                      <span className="text-sm font-semibold text-gray-700">{f.finding}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.urgency === "high" ? "bg-red-50 text-red-600" :
                        f.urgency === "moderate" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                      }`}>
                        {f.urgency === "high" ? "Critical" : f.urgency === "moderate" ? "Moderate" : "Mild"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              <div>
                {selectedFinding !== null ? (
                  <div className="bg-white rounded-xl border border-[#189aa1]/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="teal-header px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-white" />
                        <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
                          {currentFindings[selectedFinding].finding}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Differential Diagnosis</div>
                        <ul className="space-y-2">
                          {currentFindings[selectedFinding].differentials.map((d, i) => (
                            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                                style={{ background: "#189aa1" }}>{i + 1}</span>
                              <span className="text-sm text-gray-700 font-medium">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Measurements</div>
                        <ul className="space-y-1">
                          {currentFindings[selectedFinding].keyMeasurements.map((m, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#189aa1] flex-shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-teal-100 border border-teal-300">
                        <div className="text-xs font-semibold text-teal-600 mb-1">Clinical Notes</div>
                        <p className="text-xs text-teal-600">{currentFindings[selectedFinding].notes}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          Always perform complete segmental analysis. Refer to pediatric cardiologist for all complex CHD.
                          Z-scores required for all valve annuli and great vessel measurements.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-[#189aa1]/30 p-10 flex flex-col items-center justify-center text-center h-full min-h-48">
                    <HelpCircle className="w-10 h-10 mb-3" style={{ color: "#4ad9e0" }} />
                    <p className="text-sm text-gray-400">Select a finding to see differential diagnosis and key measurements</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "zscore" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="teal-header px-5 py-4">
              <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Pediatric Z-Score Calculator (BSA-Normalized)
              </h3>
            </div>
            <div className="p-5">
              <PedZScoreCalc />
            </div>
          </div>
        )}

        {tab === "qpqs" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="teal-header px-5 py-4">
              <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Qp/Qs Shunt Estimation
              </h3>
            </div>
            <div className="p-5">
              <QpQsCalc />
            </div>
          </div>
        )}

        {tab === "segmental" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="teal-header px-5 py-4">
              <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Segmental Analysis (Van Praagh Notation)
              </h3>
            </div>
            <div className="p-5">
              <SegmentalAnalysis />
            </div>
          </div>
        )}

        {/* Neonatal Hemodynamics Tab */}
        {tab === "neonatal" && <NeonatalHemodynamics />}

        {/* Quick reference */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
              Pediatric Echo Quick Reference
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {[
              { title: "Z-Score Interpretation", items: ["< -2: Reduced/Small", "-2 to +2: Normal", "> +2: Enlarged/Dilated", "< -3 or > +3: Severely abnormal"] },
              { title: "Qp/Qs Shunt Thresholds", items: ["< 1.5:1 — Small shunt, observe", "1.5–2:1 — Moderate, consider repair", "≥ 2:1 — Large, surgical candidate", "Eisenmenger: Qp/Qs reverses"] },
              { title: "Neonatal Critical CHD", items: ["HLHS: Restrict ASD if <3 mm", "d-TGA: PGE1 to maintain PDA", "PA/IVS: Assess sinusoids", "CoA: Femoral pulse differential"] },
            ].map(ref => (
              <div key={ref.title} className="p-3 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10">
                <div className="font-bold text-[#189aa1] mb-2" style={{ fontFamily: "Merriweather, serif" }}>{ref.title}</div>
                <ul className="space-y-1">
                  {ref.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-1 h-1 rounded-full bg-[#189aa1] flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
