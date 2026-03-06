/*
  EchoAssist Hub — iHeartEcho
  Landing page listing all EchoAssist engines
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import PremiumModal from "@/components/PremiumModal";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Zap, Activity, BarChart3, Wind, Heart, TrendingUp,
  ArrowRight, Calculator, Stethoscope, Scan, Lock
} from "lucide-react";

// Roles that grant premium access
const PREMIUM_ROLES = ["premium_user", "diy_user", "diy_admin", "platform_admin"];
function hasPremiumAccess(user: any): boolean {
  if (!user) return false;
  const roles: string[] = (user as any).appRoles ?? [];
  return roles.some(r => PREMIUM_ROLES.includes(r));
}

const BRAND = "#189aa1";

const engines = [
  {
    path: "/echoassist#engine-lv",
    icon: Heart,
    title: "LV Systolic Function",
    description: "EF-based classification (HFpEF / HFmrEF / HFrEF), wall motion scoring, and GLS interpretation.",
    badge: "LV Function",
    premium: false,
  },
  {
    path: "/echoassist#engine-diastology",
    icon: TrendingUp,
    title: "Diastolic Function",
    description: "ASE 2016 diastology algorithm — E/A, e', E/e', TR Vmax, LA volume index — grading and filling pressure estimation.",
    badge: "LV Function",
    premium: false,
  },
  {
    path: "/echoassist#engine-as",
    icon: Activity,
    title: "Aortic Stenosis",
    description: "AVA by continuity equation, Vmax, mean gradient, DVI — guideline-based severity classification (ASE 2025).",
    badge: "Valve Disease",
    premium: true,
  },
  {
    path: "/echoassist#engine-ms",
    icon: Activity,
    title: "Mitral Stenosis",
    description: "MVA by PHT and planimetry, mean gradient, PA pressure estimation — rheumatic vs. degenerative classification.",
    badge: "Valve Disease",
    premium: true,
  },
  {
    path: "/echoassist#engine-ar",
    icon: Activity,
    title: "Aortic Regurgitation",
    description: "Vena contracta, EROA, regurgitant volume, AR PHT — integrated severity grading per ASE/ACC/AHA.",
    badge: "Valve Disease",
    premium: true,
  },
  {
    path: "/echoassist#engine-mr",
    icon: Activity,
    title: "Mitral Regurgitation",
    description: "Vena contracta, EROA, PISA, regurgitant volume — primary and secondary MR severity classification.",
    badge: "Valve Disease",
    premium: true,
  },
  {
    path: "/echoassist#engine-strain",
    icon: BarChart3,
    title: "Strain (LV / RV / LA)",
    description: "LV GLS, RV free-wall strain, and LA reservoir strain interpretation with reference ranges and clinical context.",
    badge: "Strain",
    premium: true,
  },
  {
    path: "/echoassist#engine-rv",
    icon: Wind,
    title: "RV Function",
    description: "TAPSE, S', FAC, RV GLS, and RIMP — integrated RV systolic function grading with pulmonary pressure context.",
    badge: "RV / PA",
    premium: true,
  },
  {
    path: "/echoassist#engine-pa",
    icon: Zap,
    title: "PA Pressure",
    description: "RVSP from TR Vmax + RAP, mPAP estimation, and pulmonary hypertension probability classification.",
    badge: "RV / PA",
    premium: true,
  },
  {
    path: "/calculator",
    icon: Calculator,
    title: "Echo Severity Calculator",
    description: "All calculators in one place — AS, MR, TR, AR, diastology, LARS, LV GLS, and RV strain with full reference tables.",
    badge: "All Engines",
    note: "Full calculator suite",
    premium: false,
  },
];

const badgeColors: Record<string, string> = {
  "Valve Disease": "#0e7490",
  "LV Function": "#189aa1",
  "Strain": "#0f766e",
  "RV / PA": "#0369a1",
  "All Engines": "#7c3aed",
};

export default function EchoAssistHub() {
  const { user } = useAuth();
  const isPremium = hasPremiumAccess(user);
  const [premiumModal, setPremiumModal] = useState<{ name: string; description: string } | null>(null);
  return (
    <Layout>
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-10">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Zap className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">ASE 2025 Guidelines</span>
              </div>
              <h1
                className="text-2xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                EchoAssist™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Enter measurements and get instant guideline-based severity classification with clinical narrative — for valvular disease, LV function, diastology, strain, RV function, and PA pressure.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/echo-navigators">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Stethoscope className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    EchoNavigator™
                    <span className="text-[#4ad9e0] text-xs">→</span>
                  </button>
                </Link>
                <Link href="/scan-coach">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Scan className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    ScanCoach™
                    <span className="text-[#4ad9e0] text-xs">→</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Grid */}
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {engines.map(({ path, icon: Icon, title, description, badge, note, premium }) => {
            const badgeColor = badgeColors[badge] ?? BRAND;
            const cardInner = (
              <div
                className="relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer group h-full hover:shadow-md transition-all hover:border-[#189aa1]/30"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                {premium && !isPremium ? (
                  <div className="absolute top-0 right-0 overflow-hidden rounded-tr-xl rounded-bl-xl">
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      PREMIUM
                    </div>
                  </div>
                ) : !premium ? (
                  <div className="absolute top-0 right-0 overflow-hidden rounded-tr-xl rounded-bl-xl">
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                    >
                      FREE
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: BRAND + "15" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: BRAND }} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: badgeColor + "15", color: badgeColor }}
                  >
                    {badge}
                  </span>
                </div>
                <h3
                  className="font-bold text-gray-800 mb-1.5 text-sm leading-snug"
                  style={{ fontFamily: "Merriweather, serif" }}
                >
                  {title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
                {note && (
                  <p className="text-xs text-[#189aa1]/70 italic mb-2">{note}</p>
                )}
                <div
                  className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                  style={{ color: (premium && !isPremium) ? "#d97706" : BRAND }}
                >
                  {(premium && !isPremium) ? <><Lock className="w-3 h-3" /> Premium Access</> : <>Open Engine <ArrowRight className="w-3 h-3" /></>}
                </div>
              </div>
            );
            if (premium && !isPremium) {
              return (
                <div key={path} className="cursor-pointer" onClick={() => setPremiumModal({ name: title, description })}>
                  {cardInner}
                </div>
              );
            }
            return <Link key={path} href={path}>{cardInner}</Link>;
          })}
        </div>
      </div>
      {premiumModal && (
        <PremiumModal
          featureName={premiumModal.name}
          featureDescription={premiumModal.description}
          onClose={() => setPremiumModal(null)}
        />
      )}
    </Layout>
  );
}
