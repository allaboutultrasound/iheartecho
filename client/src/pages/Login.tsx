/*
  iHeartEcho — Branded Login / Sign-In Page
  Replaces the Manus/Meta OAuth portal as the user-facing entry point.
  Clicking "Sign In" redirects to the OAuth provider transparently.

  Brand: Teal #189aa1, Aqua #4ad9e0, Dark navy #0e1e2e
  Fonts: Merriweather (headings), Open Sans (body)
*/
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Stethoscope,
  Activity,
  BookOpen,
  Shield,
  ArrowRight,
  Heart,
  Zap,
} from "lucide-react";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Clinical EchoNavigators™",
    desc: "TTE, TEE, Stress, Fetal, Pediatric, ACHD, ICE & Device protocols",
  },
  {
    icon: Activity,
    title: "EchoAssist™ & Calculators",
    desc: "Guideline-based severity grading across 9 clinical domains",
  },
  {
    icon: BookOpen,
    title: "CME & Registry Review",
    desc: "Accredited courses, registry prep, and 500+ echo cases",
  },
  {
    icon: Shield,
    title: "Accreditation Tools",
    desc: "Peer review, IQR, echo correlation, and lab analytics",
  },
];

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // If already signed in, send to home
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSignIn = () => {
    setRedirecting(true);
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e1e2e" }}>
        <div className="w-8 h-8 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      {/* ── Left panel: branding ── */}
      <div
        className="relative flex flex-col justify-between p-8 lg:p-12 lg:w-[55%] overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0e1e2e 0%, #0d3d44 55%, #189aa1 100%)",
        }}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #4ad9e0 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, #189aa1 0%, transparent 50%)`,
          }}
        />

        {/* Logo + wordmark */}
        <div className="relative flex items-center gap-3">
          {LOGO ? (
            <img src={LOGO} alt="iHeartEcho" className="w-12 h-12 object-contain drop-shadow-lg" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#189aa1" }}>
              <Heart className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho™
            </div>
            <div className="text-xs font-medium" style={{ color: "#4ad9e0" }}>
              Echocardiography Clinical Companion
            </div>
          </div>
        </div>

        {/* Hero headline */}
        <div className="relative my-8 lg:my-0">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 border border-white/20 bg-white/10">
            <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Real-time Clinical Decision Support</span>
          </div>
          <h1
            className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            The complete echo<br />
            <span style={{ color: "#4ad9e0" }}>clinical companion</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Guideline-based interpretation, structured protocols, accreditation tools,
            and CME — built for sonographers, cardiologists, and ACS professionals.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(24,154,161,0.3)" }}
              >
                <Icon className="w-4 h-4" style={{ color: "#4ad9e0" }} />
              </div>
              <div>
                <div className="text-white text-xs font-semibold mb-0.5">{title}</div>
                <div className="text-white/50 text-xs leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative mt-8 lg:mt-0 text-white/30 text-xs">
          © {new Date().getFullYear()} iHeartEcho™ · All About Ultrasound
        </div>
      </div>

      {/* ── Right panel: sign-in form ── */}
      <div className="flex flex-col items-center justify-center flex-1 p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {LOGO ? (
              <img src={LOGO} alt="iHeartEcho" className="w-10 h-10 object-contain" />
            ) : (
              <Heart className="w-8 h-8" style={{ color: "#189aa1" }} />
            )}
            <div className="text-xl font-black" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>
              iHeartEcho™
            </div>
          </div>

          <h2
            className="text-2xl font-black mb-2"
            style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}
          >
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to access your clinical tools and learning resources.
          </p>

          {/* Sign-in button */}
          <button
            onClick={handleSignIn}
            disabled={redirecting}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
            style={{
              background: redirecting
                ? "#0e9aa1"
                : "linear-gradient(135deg, #189aa1 0%, #0e7a80 100%)",
              boxShadow: "0 4px 20px rgba(24,154,161,0.35)",
            }}
          >
            {redirecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                {LOGO ? (
                  <img src={LOGO} alt="" className="w-5 h-5 object-contain" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                Sign in to iHeartEcho™
                <ArrowRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">New to iHeartEcho?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Create account button */}
          <button
            onClick={handleSignIn}
            disabled={redirecting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 active:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed border"
            style={{ color: "#189aa1", borderColor: "#189aa1" }}
          >
            <Zap className="w-4 h-4" />
            Create a free account
          </button>

          {/* Feature highlights */}
          <div className="mt-8 space-y-2">
            {[
              "Access 15+ clinical echo protocols",
              "Guideline-based severity calculators",
              "CME courses & registry review prep",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#189aa1" }} />
                {item}
              </div>
            ))}
          </div>

          {/* Legal */}
          <p className="mt-8 text-xs text-gray-400 text-center leading-relaxed">
            By signing in you agree to the{" "}
            <a
              href="https://www.iheartecho.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://www.iheartecho.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
