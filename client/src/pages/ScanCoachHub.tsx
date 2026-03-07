/*
  ScanCoach Hub — iHeartEcho
  Landing page listing all ScanCoach options
*/
import { Link } from "wouter";
import Layout from "@/components/Layout";
import {
  Scan, Stethoscope, Baby, Heart, Users, Activity,
  ArrowRight, Zap, Microscope, Droplets
} from "lucide-react";

const BRAND = "#189aa1";

const coaches = [
  {
    path: "/scan-coach?tab=tte",
    icon: Stethoscope,
    title: "Adult TTE ScanCoach™",
    description: "Probe placement diagrams, transducer angulation, anatomy overlays, and Doppler positioning for all standard TTE views.",
    badge: "Adult Echo",
  },
  {
    path: "/scan-coach?tab=fetal",
    icon: Baby,
    title: "Fetal Echo ScanCoach™",
    description: "Fetal cardiac view acquisition with maternal positioning, probe orientation, and normal vs. abnormal findings at each view.",
    badge: "Congenital Heart",
  },
  {
    path: "/scan-coach?tab=chd",
    icon: Users,
    title: "Pediatric CHD ScanCoach™",
    description: "Congenital heart disease view guidance with segmental analysis approach, probe tips, and key diagnostic findings.",
    badge: "Congenital Heart",
  },
  {
    path: "/scan-coach?tab=achd",
    icon: Heart,
    title: "Adult Congenital ScanCoach™",
    description: "ACHD-specific scanning guidance for repaired and unrepaired lesions — ASD, VSD, ToF, CoA, TGA, and Fontan.",
    badge: "Congenital Heart",
  },
  {
    path: "/strain-scan-coach",
    icon: Activity,
    title: "Strain ScanCoach™",
    description: "Interactive 17-segment bull's-eye, segmental strain curves, LV GLS calculator, ASE 2025 acquisition guidance, and Tips & Tricks for strain imaging.",
    badge: "Adult Echo",
  },
  {
    path: "/tee-scan-coach",
    icon: Microscope,
    title: "TEE ScanCoach™",
    description: "View-by-view TEE acquisition guide covering all ME, TG, and UE views with probe angle/depth, anatomy descriptions, Doppler tips, and reference image placeholders.",
    badge: "TEE",
  },
  {
    path: "/ice-scan-coach",
    icon: Scan,
    title: "ICE ScanCoach™",
    description: "Intracardiac echocardiography guide with catheter positioning, rotation technique, procedural Doppler guidance, and reference image placeholders for all 7 standard ICE views.",
    badge: "ICE",
  },
  {
    path: "/uea-scan-coach",
    icon: Droplets,
    title: "UEA ScanCoach™",
    description: "Contrast echo acquisition guide: probe positioning, machine optimization (MI, gain, depth), injection technique, flash replenishment, artifact recognition, and view-by-view clinical pearls.",
    badge: "Contrast Echo",
  },
];

const badgeColors: Record<string, string> = {
  "Adult Echo": "#189aa1",
  "Congenital Heart": "#0369a1",
  "TEE": "#0e7490",
  "ICE": "#0f766e",
  "Contrast Echo": "#0e7490",
};

export default function ScanCoachHub() {
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
              <Scan className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-xs text-white/80 font-medium">Probe Guidance & Acquisition</span>
              </div>
              <h1
                className="text-2xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                ScanCoach™
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-xl">
                Step-by-step tutorials and expert insights that take you from basic cardiac imaging to complex congenital heart disease cases.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/echo-navigators">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all">
                    <Stethoscope className="w-3.5 h-3.5 text-[#4ad9e0]" />
                    EchoNavigator™
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

      {/* Coach Grid */}
      <div className="container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map(({ path, icon: Icon, title, description, badge, note }: { path: string; icon: React.ElementType; title: string; description: string; badge: string; note?: string }) => {
            const badgeColor = badgeColors[badge] ?? BRAND;
            return (
              <Link key={path} href={path}>
                <div
                  className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer group h-full hover:shadow-md transition-all hover:border-[#189aa1]/30"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
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
                    style={{ color: BRAND }}
                  >
                    Open ScanCoach <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
