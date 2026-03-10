/*
  ScanCoach Hub — iHeartEcho™
  Hero banner + clean card grid with icon, name, view count
*/
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import {
  Scan, Stethoscope, Baby, Heart, Users, Activity,
  Zap, Microscope, Droplets, Wind
} from "lucide-react";

const BRAND = "#189aa1";

const coaches = [
  { tab: "tte",       icon: Stethoscope, label: "Adult TTE",          views: 10 },
  { tab: "tee",       icon: Microscope,  label: "TEE",                views: 13 },
  { tab: "ice",       icon: Scan,        label: "ICE",                views: 9  },
  { tab: "uea",       icon: Droplets,    label: "UEA",                views: 7  },
  { tab: "strain",    icon: Activity,    label: "Strain",             views: 4  },
  { tab: "hocm",      icon: Heart,       label: "HOCM",               views: 14 },
  { tab: "chd",       icon: Users,       label: "Pediatric CHD",      views: 14 },
  { tab: "fetal",     icon: Baby,        label: "Fetal Echo",         views: 13 },
  { tab: "achd",      icon: Heart,       label: "Adult Congenital",   views: 13 },
  { tab: "diastolic", icon: Wind,        label: "Diastolic Function", views: 7  },
  { tab: "pulm",      icon: Wind,        label: "Pulm HTN & PE",      views: 8  },
  { tab: "stress",    icon: Zap,         label: "Stress Echo",        views: 13 },
];

export default function ScanCoachHub() {
  const [, navigate] = useLocation();

  // Map tabs that have standalone routes (not tabs in /scan-coach)
  const standaloneRoutes: Record<string, string> = {
    stress: "/stress-scan-coach",
  };

  return (
    <Layout>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-10 md:py-14">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Scan className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-sm text-white/80 font-medium">12 Specialties · View-by-View Probe Guidance</span>
              </div>
              <h1
                className="text-2xl md:text-3xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                ScanCoach™
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-base mt-0.5">Probe Positioning · Anatomy · Clinical Pearls</p>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                View-by-view scanning guides with transducer positioning, normal anatomy, Doppler setup, and clinical pearls — for every modality and patient population.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="container py-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {coaches.map(({ tab, icon: Icon, label, views }) => (
            <button
              key={tab}
              onClick={() => navigate(standaloneRoutes[tab] ?? `/scan-coach?tab=${tab}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-[#189aa1]/50 hover:shadow-md transition-all text-center cursor-pointer group"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: BRAND + "15" }}
              >
                <Icon className="w-5 h-5" style={{ color: BRAND }} />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight text-gray-800">{label}</div>
                <div className="text-[10px] mt-0.5 text-gray-400">{views} views</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
