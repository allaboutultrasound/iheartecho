/*
  iHeartEcho — Dashboard Home
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Calculator, Baby, ClipboardList, Activity, Scan, BookOpen, FileText, ArrowRight, Users, Award, Zap, Stethoscope, Microscope, ExternalLink, Heart } from "lucide-react";

const BRAND = "#189aa1";
const modules = [
  // Adult Echo
  {
    path: "/tte",
    icon: Stethoscope,
    title: "Adult TTE EchoNavigator™",
    description: "Structured TTE protocol with view-by-view checklist, critical item tracking, and ASE reference values.",
    badge: "Adult Echo",
    color: BRAND,
  },
  {
    path: "/tee",
    icon: Microscope,
    title: "TEE EchoNavigator™",
    description: "ME, TG, and UE views with angle/depth guidance, clinical applications, and intraoperative checklist.",
    badge: "Structural Heart",
    color: BRAND,
  },
  {
    path: "/stress",
    icon: Zap,
    title: "Stress Echo EchoNavigator™",
    description: "Exercise and DSE protocols, 17-segment WMSI scorer, target HR calculator, and interpretation criteria.",
    badge: "Stress Echo",
    color: BRAND,
  },
  {
    path: "/pediatric",
    icon: Users,
    title: "Pediatric EchoNavigator™",
    description: "CHD findings, BSA Z-scores, Qp/Qs shunt estimation, segmental analysis, and neonatal hemodynamics.",
    badge: "Congenital Heart",
    color: BRAND,
  },
  {
    path: "/fetal",
    icon: Baby,
    title: "Fetal EchoNavigator™",
    description: "Fetal cardiac findings, CHD differentials, biometry Z-scores, situs, arch patterns, and scan coach.",
    badge: "Congenital Heart",
    color: BRAND,
  },
  {
    path: "/achd",
    icon: Heart,
    title: "Adult Congenital EchoNavigator™",
    description: "ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with ASE/AHA thresholds.",
    badge: "Congenital Heart",
    color: BRAND,
  },
  {
    path: "/calculator",
    icon: Calculator,
    title: "Echo Severity Calculator",
    description: "Guideline-based interpretation for AS, MR, TR, AR, diastology with LARS, LV GLS, and RV strain.",
    badge: "ASE 2025",
    color: BRAND,
  },
  {
    path: "/hemodynamics",
    icon: Activity,
    title: "Hemodynamics Lab",
    description: "Adjust preload, afterload, and contractility. See PV loop changes and echo findings in real time.",
    badge: "Training",
    color: BRAND,
  },
  {
    path: "/scan-coach",
    icon: Scan,
    title: "ScanCoach™",
    description: "Visual probe guidance with anatomy overlays, Doppler positioning, and orientation tips.",
    badge: "Training Mode",
    color: BRAND,
  },
  {
    path: "/cases",
    icon: BookOpen,
    title: "Echo Case Lab",
    description: "Daily echo cases with gamified learning — earn Echo Ninja points, streaks, and leaderboards.",
    badge: "Gamified",
    color: BRAND,
  },
  {
    path: "/report",
    icon: FileText,
    title: "Report Builder",
    description: "Enter measurements and generate a complete, structured echo report instantly.",
    badge: "Time Saver",
    color: BRAND,
  },
  {
    path: "/echoassist",
    icon: Zap,
    title: "EchoAssist™",
    description: "Enter measurements and get instant guideline-based severity classification with clinical narrative.",
    badge: "ASE Guidelines",
    color: BRAND,
  },
];

const stats = [
  { label: "Clinical Calculators", value: "20+", icon: Calculator },
  { label: "Echo Cases", value: "500+", icon: BookOpen },
  { label: "Protocols Covered", value: "15", icon: ClipboardList },
  { label: "Active Users", value: "12,492+", icon: Users },
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/ihe-hero-MNscA4NaWNyxrdkewtLGLG.webp")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative container py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
              <span className="text-xs text-white/80 font-medium">Real-time Clinical Decision Support</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <img
                src="https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/TTSqgyHlTBmxeODV.png?Expires=1804183007&Signature=tWUrD-cUfgsk0u97qoBm0zB3mj75cGUW2F-hh-3aepkHA9QlDWUbfY2eqgxrIpyY2Zp3wTFpuBC7DXxtNjAMv5Ju2HBWLLcCgaGJrEB5X2wKLtoJQKscrbUUOXFV7xdwiJWP5zeVe7QNQaBw5zHqqyN6EYc6a0WovYLeHtUnM~vCz5pDvUh0L43UEpwlSVUZnU9ULfYO~ML9cpjCX-M~Uwb1QHUU2IxD7Qa9wMXw3nUhLxhbrUVdc-byWsUfQg5~PCwxH3jjLLq-4hlrBvFgkyB5QJJiqv6f~GM6bMh8jFE1GfWCAPzQVdcY97tgqT4GBExpYMkQ-K7AK83Fvd5zEg__&Key-Pair-Id=K2HSFNDJXOU9YS"
                alt="iHeartEcho Logo"
                className="w-20 h-20 object-contain drop-shadow-lg"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                  iHeartEcho™
                </h1>
                <p className="text-lg text-[#4ad9e0] font-semibold">Echocardiography Clinical Companion</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-lg">
              A real-time echo interpretation and measurement assistant for sonographers, cardiologists, and ACS professionals. Guideline-based, fast, and built for the clinical environment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tte">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#189aa1" }}>
                  <Stethoscope className="w-4 h-4" />
                  Start TTE Protocol
                </button>
              </Link>
              <Link href="/cases">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                  <BookOpen className="w-4 h-4" />
                  Daily Case
                </button>
              </Link>
              <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                <ExternalLink className="w-4 h-4" />
                iheartecho.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-[#189aa1]/10">
        <div className="container py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fbfc" }}>
                  <Icon className="w-4 h-4" style={{ color: "#189aa1" }} />
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Clinical Modules</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#189aa1] font-medium">
            <Zap className="w-3.5 h-3.5" />
            10 Modules Available
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ path, icon: Icon, title, description, badge, color }) => (
            <Link key={path} href={path}>
              <div className="module-card bg-white rounded-xl p-5 cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
                    {badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1.5 text-sm leading-snug" style={{ fontFamily: "Merriweather, serif" }}>
                  {title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
                <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color }}>
                  Open Module <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Premium CTA */}
          <div className="mt-8 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-[#4ad9e0]" />
              <span className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider">Full Platform</span>
            </div>
            <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              Unlock Full Clinical Suite
            </h3>
            <p className="text-white/60 text-xs">
              Full interpretation engine, fetal navigator, 500+ cases, ACS learning tools — visit iheartecho.com
            </p>
          </div>
          <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "#189aa1" }}>
            <ExternalLink className="w-4 h-4" />
            Visit iheartecho.com
          </a>
        </div>
      </div>
    </Layout>
  );
}
