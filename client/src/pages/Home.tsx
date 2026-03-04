/*
  iHeartEcho — Dashboard Home
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Calculator, Baby, ClipboardList, Activity, Scan, BookOpen, FileText, ArrowRight, Users, Award, Zap } from "lucide-react";

const modules = [
  {
    path: "/calculator",
    icon: Calculator,
    title: "Echo Severity Calculator",
    description: "Instant guideline-based interpretation for AS, MR, TR, AR, diastology, GLS, and more.",
    badge: "ASE Guidelines",
    color: "#189aa1",
  },
  {
    path: "/fetal",
    icon: Baby,
    title: "Fetal Echo Navigator",
    description: "Interpret fetal cardiac findings, CHD differentials, Z-scores, situs, and arch patterns.",
    badge: "Fetal Echo",
    color: "#7c3aed",
  },
  {
    path: "/protocol",
    icon: ClipboardList,
    title: "Protocol Assistant",
    description: "Step-by-step interactive echo protocol guidance to prevent missed measurements.",
    badge: "Adult & Peds",
    color: "#0891b2",
  },
  {
    path: "/hemodynamics",
    icon: Activity,
    title: "Hemodynamics Lab",
    description: "Adjust preload, afterload, and contractility. See PV loop changes and echo findings.",
    badge: "ACS Training",
    color: "#059669",
  },
  {
    path: "/scan-coach",
    icon: Scan,
    title: "Scan Coach",
    description: "Visual probe guidance with anatomy overlays, Doppler positioning, and orientation tips.",
    badge: "Training Mode",
    color: "#d97706",
  },
  {
    path: "/cases",
    icon: BookOpen,
    title: "Echo Case Lab",
    description: "Daily echo cases with gamified learning — earn Echo Ninja points, streaks, and leaderboards.",
    badge: "Gamified",
    color: "#dc2626",
  },
  {
    path: "/report",
    icon: FileText,
    title: "AI Report Builder",
    description: "Enter measurements and generate a complete, structured echo report instantly.",
    badge: "Time Saver",
    color: "#189aa1",
  },
];

const stats = [
  { label: "Clinical Calculators", value: "20+", icon: Calculator },
  { label: "Echo Cases", value: "500+", icon: BookOpen },
  { label: "Protocols Covered", value: "12", icon: ClipboardList },
  { label: "Active Users", value: "8,400+", icon: Users },
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
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho™
            </h1>
            <p className="text-lg text-[#4ad9e0] font-semibold mb-2">Cardiac & Fetal Echo Clinical Companion</p>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-lg">
              A real-time echo interpretation and measurement assistant for sonographers, cardiologists, and ACS students. Guideline-based, fast, and built for the clinical environment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/calculator">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#189aa1" }}>
                  <Calculator className="w-4 h-4" />
                  Open Calculator
                </button>
              </Link>
              <Link href="/cases">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                  <BookOpen className="w-4 h-4" />
                  Daily Case
                </button>
              </Link>
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
            7 Modules Available
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
              <span className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider">Premium</span>
            </div>
            <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: "Merriweather, serif" }}>
              Unlock Full Clinical Suite
            </h3>
            <p className="text-white/60 text-xs">
              Full interpretation engine, fetal navigator, 500+ cases, ACS learning tools — $19–29/month
            </p>
          </div>
          <button className="flex-shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "#189aa1" }}>
            Start Free Trial
          </button>
        </div>
      </div>
    </Layout>
  );
}
