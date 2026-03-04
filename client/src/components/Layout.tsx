/*
  iHeartEcho Layout — Sidebar Navigation
  Brand: Teal #189aa1, Aqua #4ad9e0, Dark sidebar
  Fonts: Merriweather headings, Open Sans body
*/
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart, Calculator, Baby, ClipboardList, Activity,
  Scan, BookOpen, FileText, Menu, X, ChevronRight
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: Heart },
  { path: "/calculator", label: "Echo Calculator", icon: Calculator },
  { path: "/fetal", label: "Fetal Navigator", icon: Baby },
  { path: "/protocol", label: "Protocol Assistant", icon: ClipboardList },
  { path: "/hemodynamics", label: "Hemodynamics Lab", icon: Activity },
  { path: "/scan-coach", label: "Scan Coach", icon: Scan },
  { path: "/cases", label: "Case Lab", icon: BookOpen },
  { path: "/report", label: "Report Builder", icon: FileText },
];

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
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#189aa1" }}>
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho
            </div>
            <div className="text-xs text-[#4ad9e0] leading-tight">Clinical Companion</div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">Modules</div>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link key={path} href={path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 group
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
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-xs text-white/40">© All About Ultrasound</div>
          <div className="text-xs text-[#4ad9e0] mt-0.5">iHeartEcho v1.0</div>
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
            Cardiac & Fetal Echo Clinical Companion
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
