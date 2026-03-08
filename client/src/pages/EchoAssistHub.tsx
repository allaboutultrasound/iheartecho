/*
  iHeartEcho — EchoAssist Hub
  Unified entry point for all echo protocol + scan coach specialties
  Brand: Teal #189aa1, Aqua #4ad9e0
  US spelling throughout
  Free: Adult Echo, Pediatric Echo, Fetal Echo, Strain, UEA
  Premium: Stress Echo, HOCM, Pulmonary HTN & PE, Structural Heart, TEE, ICE
*/
import { Link } from "wouter";
import Layout from "@/components/Layout";
import {
  Stethoscope, Microscope, Zap, Users, Baby, Heart,
  Cpu, BarChart3, ArrowRight, Droplets, Activity, Wind, Crown, Lock
} from "lucide-react";

const BRAND = "#189aa1";

type Specialty = {
  path: string;
  icon: any;
  title: string;
  description: string;
  badge: string;
  scanCoachPath?: string;
  free: boolean;
};

const specialties: Specialty[] = [
  { path: "/tte", scanCoachPath: "/scan-coach?tab=tte", icon: Stethoscope, title: "Adult Echo", description: "View-by-view TTE protocol with checklist, critical item tracking, normal reference values, ASE 2025 guidelines, and probe guidance with anatomy overlays.", badge: "Adult TTE", free: true },
  { path: "/pediatric", scanCoachPath: "/scan-coach?tab=chd", icon: Users, title: "Pediatric Echo", description: "CHD findings, BSA Z-score calculators, Qp/Qs shunt estimation, segmental analysis, neonatal hemodynamics, and pediatric CHD scan guidance.", badge: "Congenital Heart", free: true },
  { path: "/fetal", scanCoachPath: "/scan-coach?tab=fetal", icon: Baby, title: "Fetal Echo", description: "Fetal cardiac findings, CHD differentials, biometry Z-scores, situs, arch patterns, and fetal scan coach with clinical images.", badge: "Fetal", free: true },
  { path: "/stress", scanCoachPath: "/stress-scan-coach", icon: Zap, title: "Stress Echo", description: "Exercise and DSE protocols, 17-segment WMSI scorer, target HR calculator, interpretation criteria, and pharmacologic stress guidance.", badge: "Stress Echo", free: false },
  { path: "/diastolic", scanCoachPath: "/scan-coach?tab=diastolic", icon: Activity, title: "Diastolic Function", description: "Step-by-step diastolic assessment: mitral inflow, TDI e', E/e' ratio, LAVI, TR velocity, pulmonary venous flow, and ASE 2025 grading algorithm with scan coach.", badge: "Diastology", free: true },
  { path: "/strain", scanCoachPath: "/strain-scan-coach", icon: BarChart3, title: "Strain", description: "LV GLS, RV strain, LA strain, bull's-eye display, clinical interpretation, segmental curves, and strain scan coach with tips and clinical pattern library.", badge: "Strain", free: true },
  { path: "/uea-navigator", scanCoachPath: "/uea-scan-coach", icon: Droplets, title: "UEA (Contrast Echo)", description: "Contrast echo protocol: safety screening, agent preparation, view-by-view LVO and myocardial perfusion assessment, and reporting guidance.", badge: "Contrast Echo", free: true },
  { path: "/hocm-navigator", scanCoachPath: "/hocm-scan-coach", icon: Activity, title: "HOCM", description: "Morphology assessment, SAM grading, resting and provoked LVOT gradients, goal-directed Valsalva, MR evaluation, and ASE/AHA reporting thresholds.", badge: "Cardiomyopathy", free: false },
  { path: "/pulm-htn", scanCoachPath: "/scan-coach?tab=pulm", icon: Wind, title: "Pulmonary HTN & PE", description: "TRV-based PH probability, RVSP estimation, RV function, PA dilation, PE echo signs (McConnell's, 60/60, D-sign), risk stratification, and ASE 2025 thresholds.", badge: "Pulmonary", free: false },
  { path: "/device", scanCoachPath: "/structural-heart-scan-coach", icon: Heart, title: "Structural Heart", description: "TAVR, MitraClip, WATCHMAN, and ASD/PFO closure — procedural echo guidance, post-implant assessment, and structural intervention checklists.", badge: "Structural Heart", free: false },
  { path: "/tee", scanCoachPath: "/tee-scan-coach", icon: Microscope, title: "TEE", description: "ME, TG, and UE views with angle/depth guidance, clinical applications, intraoperative checklist, and TEE scan coach with view acquisition tips.", badge: "TEE", free: false },
  { path: "/ice", scanCoachPath: "/ice-scan-coach", icon: Cpu, title: "ICE", description: "Intracardiac echo views, procedural checklists, key measurements for structural interventions, and ICE scan coach with view acquisition guidance.", badge: "ICE", free: false },
];

const badgeColors: Record<string, string> = {
  "Adult TTE": "#189aa1",
  "Congenital Heart": "#0369a1",
  "Fetal": "#0369a1",
  "Stress Echo": "#0f766e",
  "Strain": "#189aa1",
  "Contrast Echo": "#0e7490",
  "Cardiomyopathy": "#b45309",
  "Pulmonary": "#0e7490",
  "Structural Heart": "#0e7490",
  "TEE": "#189aa1",
  "ICE": "#189aa1",
  "Diastology": "#189aa1",
};

export default function EchoAssistHub() {
  const freeCount = specialties.filter(s => s.free).length;
  const premiumCount = specialties.filter(s => !s.free).length;

  return (
    <Layout>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-10 md:py-14">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Stethoscope className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                  <span className="text-sm text-white/80 font-medium">11 Specialties · Protocol + Scan Coach</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1">
                  <span className="text-sm text-emerald-300 font-medium">{freeCount} Free</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 rounded-full px-3 py-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span className="text-sm text-amber-300 font-medium">{premiumCount} Premium</span>
                </div>
              </div>
              <h1
                className="text-2xl md:text-3xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                EchoAssist
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-base mt-0.5">Echo Protocol &amp; Scan Coach</p>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                Structured echo protocols with view-by-view checklists, normal reference values, scanning tips, probe guidance, and guideline-based interpretation — for every modality and patient population.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Grid */}
      <div className="container py-8">
        {/* Free section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-base font-bold text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
              Free — Available to All Members
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.filter(s => s.free).map(({ path, scanCoachPath, icon: Icon, title, description, badge }) => {
              const badgeColor = badgeColors[badge] ?? BRAND;
              return (
                <div
                  key={path}
                  className="bg-white rounded-xl border border-emerald-100 p-5 h-full hover:shadow-md transition-all hover:border-emerald-300/50 flex flex-col"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: BRAND + "15" }}>
                      <Icon className="w-5 h-5" style={{ color: BRAND }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Free
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: badgeColor + "15", color: badgeColor }}
                      >
                        {badge}
                      </span>
                    </div>
                  </div>
                  <h3
                    className="font-bold text-gray-800 mb-1.5 text-base leading-snug"
                    style={{ fontFamily: "Merriweather, serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{description}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Link href={path} className="flex-1">
                      <button
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: BRAND }}
                      >
                        Protocol <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    {scanCoachPath && (
                      <Link href={scanCoachPath} className="flex-1">
                        <button
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-[#189aa1]/5"
                          style={{ borderColor: BRAND + "40", color: BRAND }}
                        >
                          Scan Coach
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Premium section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
              Premium — Available with Paid Membership
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.filter(s => !s.free).map(({ path, scanCoachPath, icon: Icon, title, description, badge }) => {
              const badgeColor = badgeColors[badge] ?? BRAND;
              return (
                <div
                  key={path}
                  className="bg-white rounded-xl border border-amber-100 p-5 h-full hover:shadow-md transition-all hover:border-amber-300/50 flex flex-col relative"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {/* Premium corner ribbon */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-600">Premium</span>
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: BRAND + "15" }}>
                      <Icon className="w-5 h-5" style={{ color: BRAND }} />
                    </div>
                    <div className="w-24" /> {/* spacer for the absolute badge */}
                  </div>
                  <div className="mb-1.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: badgeColor + "15", color: badgeColor }}
                    >
                      {badge}
                    </span>
                  </div>
                  <h3
                    className="font-bold text-gray-800 mb-1.5 text-base leading-snug"
                    style={{ fontFamily: "Merriweather, serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{description}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <Link href={path} className="flex-1">
                      <button
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: BRAND }}
                      >
                        Protocol <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    {scanCoachPath && (
                      <Link href={scanCoachPath} className="flex-1">
                        <button
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-[#189aa1]/5"
                          style={{ borderColor: BRAND + "40", color: BRAND }}
                        >
                          Scan Coach
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upgrade CTA */}
          <div
            className="mt-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Premium Access</span>
              </div>
              <h3
                className="text-white font-bold text-base mb-1"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                Unlock All 6 Premium Specialties
              </h3>
              <p className="text-white/60 text-sm">
                Stress Echo, HOCM, Pulmonary HTN & PE, Structural Heart, TEE, and ICE — plus all future premium content.
              </p>
            </div>
            <Link href="/premium" className="flex-shrink-0">
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "#189aa1" }}
              >
                <Crown className="w-4 h-4" />
                Upgrade Membership
              </button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
