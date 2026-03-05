/*
  iHeartEcho Layout — Sidebar Navigation
  Brand: Teal #189aa1, Aqua #4ad9e0, Dark sidebar
  Fonts: Merriweather headings, Open Sans body
*/
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart, Calculator, Baby, ClipboardList, Activity,
  Scan, BookOpen, FileText, Menu, X, ChevronRight,
  Stethoscope, Microscope, Zap, Users, ExternalLink, ShoppingBag, FlaskConical
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { path: "/", label: "Dashboard", icon: Heart },
    ],
  },
  {
    label: "Adult Echo",
    items: [
      { path: "/tte", label: "TTE Navigator", icon: Stethoscope },
      { path: "/tee", label: "TEE Navigator", icon: Microscope },
    ],
  },
  {
    label: "Stress Echo",
    items: [
      { path: "/stress", label: "Stress Navigator", icon: Zap },
    ],
  },
  {
    label: "Pediatric Echo",
    items: [
      { path: "/pediatric", label: "Pediatric Navigator", icon: Users },
    ],
  },
  {
    label: "Fetal Echo",
    items: [
      { path: "/fetal", label: "Fetal Navigator", icon: Baby },
    ],
  },
  {
    label: "Calculators & Tools",
    items: [
      { path: "/calculator", label: "Echo Calculator", icon: Calculator },
      { path: "/hemodynamics", label: "Hemodynamics Lab", icon: Activity },
      { path: "/scan-coach", label: "Scan Coach", icon: Scan },
      { path: "/cases", label: "Case Lab", icon: BookOpen },
      { path: "/report", label: "Report Builder", icon: FileText },
      { path: "/echoassist", label: "EchoAssist", icon: FlaskConical },
    ],
  },
];

// Flat list for header label lookup
const navItems = navGroups.flatMap(g => g.items);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f0fbfc]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-30 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-64 bg-[#0e1e2e] text-white flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <img
            src="https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/TTSqgyHlTBmxeODV.png?Expires=1804183007&Signature=tWUrD-cUfgsk0u97qoBm0zB3mj75cGUW2F-hh-3aepkHA9QlDWUbfY2eqgxrIpyY2Zp3wTFpuBC7DXxtNjAMv5Ju2HBWLLcCgaGJrEB5X2wKLtoJQKscrbUUOXFV7xdwiJWP5zeVe7QNQaBw5zHqqyN6EYc6a0WovYLeHtUnM~vCz5pDvUh0L43UEpwlSVUZnU9ULfYO~ML9cpjCX-M~Uwb1QHUU2IxD7Qa9wMXw3nUhLxhbrUVdc-byWsUfQg5~PCwxH3jjLLq-4hlrBvFgkyB5QJJiqv6f~GM6bMh8jFE1GfWCAPzQVdcY97tgqT4GBExpYMkQ-K7AK83Fvd5zEg__&Key-Pair-Id=K2HSFNDJXOU9YS"
            alt="iHeartEcho"
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho™
            </div>
            <div className="text-xs text-[#4ad9e0] leading-tight">Echocardiography Clinical Companion</div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-1">{group.label}</div>
              {group.items.map(({ path, label, icon: Icon }) => {
                const active = location === path;
                return (
                  <Link key={path} href={path}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 group
                        ${active
                          ? "bg-[#189aa1] text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-[#4ad9e0] group-hover:text-white"}`} />
                      <span className="text-sm font-medium">{label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SonoShop */}
        <div className="px-3 pb-2">
          <a
            href="https://store.allaboutultrasound.com/collections/iheartecho"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-150 group w-full"
            style={{ background: "linear-gradient(135deg, #189aa1 0%, #4ad9e0 100%)" }}
          >
            <ShoppingBag className="w-4 h-4 text-white flex-shrink-0" />
            <span className="text-sm font-semibold text-white">SonoShop</span>
            <ExternalLink className="w-3 h-3 text-white/70 ml-auto" />
          </a>
        </div>
        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#4ad9e0] hover:text-white transition-colors mb-1">
            <ExternalLink className="w-3 h-3" />
            www.iheartecho.com
          </a>
          <div className="text-xs text-white/30">© All About Ultrasound</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#189aa1]/20 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            className="lg:hidden p-1.5 rounded-md text-[#189aa1] hover:bg-[#f0fbfc]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
            <span className="text-sm font-semibold text-[#189aa1]" style={{ fontFamily: "Merriweather, serif" }}>
              {navItems.find(n => n.path === location)?.label ?? "iHeartEcho"}
            </span>
          </div>
          <div className="ml-auto text-xs text-gray-400 hidden sm:block">
            Echocardiography Clinical Companion
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
