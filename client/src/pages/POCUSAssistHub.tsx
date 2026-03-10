/*
  POCUS-Assist™ Hub — iHeartEcho™
  Entry point for all POCUS-Assist™ modules:
    • eFAST (free)
    • RUSH (premium)
    • Cardiac POCUS (free)
    • Lung POCUS (premium)
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { usePremium } from "@/hooks/usePremium";
import {
  Shield, Zap, Heart, Wind, Crown, Lock,
  ArrowRight, Activity, Scan,
} from "lucide-react";

const BRAND = "#189aa1";

type Module = {
  navigatorPath: string;
  scanCoachPath: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  free: boolean;
  views: number;
  highlights: string[];
};

const modules: Module[] = [
  {
    navigatorPath: "/pocus-efast",
    scanCoachPath: "/pocus-efast-scan-coach",
    icon: Shield,
    title: "eFAST",
    subtitle: "Extended FAST Exam",
    description:
      "Systematic 6-window eFAST protocol for trauma — RUQ, LUQ, pelvic, subxiphoid cardiac, and bilateral thoracic windows. Free fluid grading, pneumothorax detection, and hemothorax assessment.",
    badge: "Trauma / Emergency",
    badgeColor: "#0e7490",
    free: true,
    views: 6,
    highlights: [
      "Morison's pouch & splenorenal free fluid",
      "Bilateral pneumothorax detection",
      "Subxiphoid cardiac tamponade screen",
    ],
  },
  {
    navigatorPath: "/pocus-rush",
    scanCoachPath: "/pocus-rush-scan-coach",
    icon: Zap,
    title: "RUSH",
    subtitle: "Rapid Ultrasound in Shock",
    description:
      "Structured RUSH protocol — The Pump (cardiac function), The Tank (volume status / IVC), and The Pipes (aorta, DVT, pneumothorax). Systematic shock differentiation with decision support.",
    badge: "Shock Protocol",
    badgeColor: "#b45309",
    free: false,
    views: 11,
    highlights: [
      "Pump: LV/RV function, pericardial effusion",
      "Tank: IVC collapsibility index, free fluid",
      "Pipes: AAA, DVT, pneumothorax",
    ],
  },
  {
    navigatorPath: "/pocus-cardiac",
    scanCoachPath: "/pocus-cardiac-scan-coach",
    icon: Heart,
    title: "Cardiac POCUS",
    subtitle: "Focused Cardiac Ultrasound",
    description:
      "Goal-directed cardiac POCUS with 6 standard views — PLAX, PSAX, A4C, subcostal 4-chamber, and IVC. LV/RV function, pericardial effusion, volume assessment, and tamponade physiology.",
    badge: "Cardiac",
    badgeColor: "#189aa1",
    free: true,
    views: 6,
    highlights: [
      "LV systolic function (visual EF)",
      "Pericardial effusion & tamponade",
      "IVC collapsibility for volume status",
    ],
  },
  {
    navigatorPath: "/pocus-lung",
    scanCoachPath: "/pocus-lung-scan-coach",
    icon: Wind,
    title: "Lung POCUS",
    subtitle: "Thoracic Ultrasound",
    description:
      "8-zone lung POCUS with BLUE protocol integration — pleural sliding, A-lines, B-lines, consolidation, pleural effusion, and diaphragm assessment. Systematic differentiation of dyspnoea aetiology.",
    badge: "Pulmonary",
    badgeColor: "#0f766e",
    free: false,
    views: 8,
    highlights: [
      "B-line quantification (interstitial syndrome)",
      "BLUE protocol for acute dyspnoea",
      "Pleural effusion & consolidation",
    ],
  },
];

export default function POCUSAssistHub() {
  const { isPremium } = usePremium();
  const [upgradeModal, setUpgradeModal] = useState<{ title: string } | null>(null);

  const freeCount = modules.filter((m) => m.free).length;
  const premiumCount = modules.filter((m) => !m.free).length;

  return (
    <Layout>
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0a3a40 60%, #189aa1 100%)" }}
      >
        <div className="container py-10 md:py-14">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Scan className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                  <span className="text-sm text-white/80 font-medium">
                    4 Modules · Navigator + ScanCoach
                  </span>
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
                POCUS-Assist™
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-base mt-0.5">
                Point-of-Care Ultrasound Navigator &amp; ScanCoach
              </p>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                Structured POCUS protocols with window-by-window checklists, probe positioning
                guides, clinical decision support, and scanning tips — for eFAST, RUSH, Cardiac,
                and Lung ultrasound.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Module Grid ─────────────────────────────────────────────────────── */}
      <div className="container py-8">
        {/* Free section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2
              className="text-base font-bold text-gray-700"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              Free — Available to All Members
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules
              .filter((m) => m.free)
              .map((mod) => (
                <ModuleCard
                  key={mod.title}
                  mod={mod}
                  isPremium={isPremium}
                  onUpgrade={() => setUpgradeModal({ title: mod.title })}
                />
              ))}
          </div>
        </div>

        {/* Premium section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <h2
              className="text-base font-bold text-gray-700"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              Premium — Requires Membership
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules
              .filter((m) => !m.free)
              .map((mod) => (
                <ModuleCard
                  key={mod.title}
                  mod={mod}
                  isPremium={isPremium}
                  onUpgrade={() => setUpgradeModal({ title: mod.title })}
                />
              ))}
          </div>
        </div>

        {/* Upgrade CTA — only shown to free users */}
        {!isPremium && (
          <div
            className="mt-2 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Premium Access
                </span>
              </div>
              <h3
                className="text-white font-bold text-base mb-1"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                Unlock RUSH &amp; Lung POCUS
              </h3>
              <p className="text-white/60 text-sm">
                RUSH shock protocol, Lung POCUS with BLUE protocol, plus all EchoAssist™ premium
                specialties.
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
        )}
      </div>

      {/* ── Upgrade Modal ────────────────────────────────────────────────────── */}
      {upgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setUpgradeModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h3
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                Premium Feature
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                <strong>{upgradeModal.title}</strong> requires a Premium membership.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/premium" onClick={() => setUpgradeModal(null)}>
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                >
                  <Crown className="w-4 h-4" /> Upgrade to Premium
                </button>
              </Link>
              <button
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200"
                onClick={() => setUpgradeModal(null)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  mod,
  isPremium,
  onUpgrade,
}: {
  mod: Module;
  isPremium: boolean;
  onUpgrade: () => void;
}) {
  const { navigatorPath, scanCoachPath, icon: Icon, title, subtitle, description, badge, badgeColor, free, views, highlights } = mod;
  const canAccess = free || isPremium;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 transition-all hover:shadow-md"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: badgeColor + "18" }}
          >
            <Icon className="w-5 h-5" style={{ color: badgeColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-bold text-gray-900 text-base leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                {title}
              </h3>
              {!free && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                  <Crown className="w-2.5 h-2.5" /> Premium
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: badgeColor + "15", color: badgeColor }}
          >
            {badge}
          </span>
          <span className="text-[10px] text-gray-400">{views} views</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed">{description}</p>

      {/* Highlights */}
      <ul className="space-y-1">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-xs text-gray-600">
            <Activity className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: badgeColor }} />
            {h}
          </li>
        ))}
      </ul>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {canAccess ? (
          <>
            <Link href={navigatorPath} className="flex-1">
              <button
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: BRAND }}
              >
                Navigator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
            <Link href={scanCoachPath} className="flex-1">
              <button
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all hover:bg-[#189aa1]/5"
                style={{ borderColor: BRAND + "40", color: BRAND }}
              >
                ScanCoach
              </button>
            </Link>
          </>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            onClick={onUpgrade}
          >
            <Crown className="w-3.5 h-3.5" /> Upgrade to Unlock
          </button>
        )}
      </div>
    </div>
  );
}
