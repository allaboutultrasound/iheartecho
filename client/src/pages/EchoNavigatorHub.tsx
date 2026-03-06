/*
  EchoNavigator Hub — iHeartEcho
  Landing page listing all EchoNavigator modules
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import PremiumModal from "@/components/PremiumModal";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Stethoscope, Microscope, Zap, Users, Baby, Heart,
  Cpu, FlaskConical, BarChart3, ArrowRight, Scan, Lock
} from "lucide-react";

// Roles that grant premium access
const PREMIUM_ROLES = ["premium_user", "diy_user", "diy_admin", "platform_admin"];
function hasPremiumAccess(user: any): boolean {
  if (!user) return false;
  const roles: string[] = (user as any).appRoles ?? [];
  return roles.some(r => PREMIUM_ROLES.includes(r));
}

const BRAND = "#189aa1";

const navigators = [
  {
    path: "/tte",
    icon: Stethoscope,
    title: "Adult TTE EchoNavigator™",
    description: "View-by-view checklist, critical item tracking, normal reference values, and ASE 2025 guidelines.",
    badge: "Adult Echo",
    premium: false,
  },
  {
    path: "/tee",
    icon: Microscope,
    title: "TEE EchoNavigator™",
    description: "ME, TG, and UE views with angle/depth guidance, clinical applications, and intraoperative checklist.",
    badge: "Structural Heart",
    premium: true,
  },
  {
    path: "/stress",
    icon: Zap,
    title: "Stress Echo EchoNavigator™",
    description: "Exercise and DSE protocols, 17-segment WMSI scorer, target HR calculator, and interpretation criteria.",
    badge: "Stress Echo",
    premium: true,
  },
  {
    path: "/strain",
    icon: BarChart3,
    title: "Strain EchoNavigator™",
    description: "Protocol checklist, scanning tips, basic pathology overview, and LV/RV/LA strain reference values.",
    badge: "Adult Echo",
    premium: true,
  },
  {
    path: "/ice",
    icon: Cpu,
    title: "ICE EchoNavigator™",
    description: "Intracardiac echo views, procedural checklists, and key measurements for structural interventions.",
    badge: "Structural Heart",
    premium: true,
  },
  {
    path: "/device",
    icon: FlaskConical,
    title: "Device EchoNavigator™",
    description: "TAVR, MitraClip, WATCHMAN, and ASD/PFO closure — procedural echo guidance and post-implant assessment.",
    badge: "Structural Heart",
    premium: true,
  },
  {
    path: "/pediatric",
    icon: Users,
    title: "Pediatric EchoNavigator™",
    description: "CHD findings, BSA Z-score calculators, Qp/Qs shunt estimation, segmental analysis, and neonatal hemodynamics.",
    badge: "Congenital Heart",
  },
  {
    path: "/fetal",
    icon: Baby,
    title: "Fetal EchoNavigator™",
    description: "Fetal cardiac findings, CHD differentials, biometry Z-scores, situs, arch patterns, and scan coach.",
    badge: "Congenital Heart",
  },
  {
    path: "/achd",
    icon: Heart,
    title: "Adult Congenital EchoNavigator™",
    description: "ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with ASE/AHA thresholds.",
    badge: "Congenital Heart",
  },
];

const badgeColors: Record<string, string> = {
  "Adult Echo": "#189aa1",
  "Structural Heart": "#0e7490",
  "Stress Echo": "#0f766e",
  "Congenital Heart": "#0369a1",
};

export default function EchoNavigatorHub() {
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
              <Stethoscope className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">9 Protocols Available</span>
              </div>
              <h1
                className="text-2xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                EchoNavigator™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Structured echo protocols with view-by-view checklists, normal reference values, scanning tips, and guideline-based interpretation — for every modality and patient population.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/scan-coach">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Scan className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    ScanCoach™
                    <span className="text-[#4ad9e0] text-xs">→</span>
                  </button>
                </Link>
                <Link href="/echoassist-hub">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Zap className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    EchoAssist™
                    <span className="text-[#4ad9e0] text-xs">→</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigator Grid */}
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigators.map(({ path, icon: Icon, title, description, badge, premium }) => {
            const badgeColor = badgeColors[badge] ?? BRAND;
            if (premium && !isPremium) {
              return (
                <div
                  key={path}
                  className="cursor-pointer"
                  onClick={() => setPremiumModal({ name: title, description })}
                >
                <div
                  className="relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer group h-full hover:shadow-md transition-all hover:border-[#189aa1]/30"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {premium && (
                    <div className="absolute top-0 right-0 overflow-hidden rounded-tr-xl rounded-bl-xl">
                      <div
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        PREMIUM
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: BRAND + "15" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: BRAND }} />
                    </div>
                    {!premium && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: badgeColor + "15", color: badgeColor }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-bold text-gray-800 mb-1.5 text-sm leading-snug"
                    style={{ fontFamily: "Merriweather, serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
                  <div
                    className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                    style={{ color: premium ? "#d97706" : BRAND }}
                  >
                    {premium ? <><Lock className="w-3 h-3" /> Premium Access</> : <>Open Protocol <ArrowRight className="w-3 h-3" /></>}
                  </div>
                </div>
                </div>
              );
            }
            return (
              <Link key={path} href={path}>
                <div
                  className="relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer group h-full hover:shadow-md transition-all hover:border-[#189aa1]/30"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: BRAND + "15" }}>
                      <Icon className="w-5 h-5" style={{ color: BRAND }} />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badgeColors[badge] + "15", color: badgeColors[badge] }}>
                      {badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1.5 text-sm leading-snug" style={{ fontFamily: "Merriweather, serif" }}>{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
                  <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: BRAND }}>
                    Open Protocol <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
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
