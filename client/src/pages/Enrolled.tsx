/*
  iHeartEcho™ — Post-Enrollment Welcome Page
  Shown to users who complete the Thinkific free membership enrollment
  and are redirected back to iHeartEcho via the redirect_url parameter.
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Heart, Stethoscope, BookOpen, Zap, LogIn } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const FEATURES = [
  { icon: Stethoscope, label: "EchoAssist™ Calculators", desc: "Guideline-based severity interpretation for AS, MR, TR, and more." },
  { icon: Zap,         label: "Daily Echo Challenge",    desc: "Sharpen your skills with a new clinical question every day." },
  { icon: BookOpen,    label: "Echo Case Library",       desc: "Browse annotated echo cases with teaching points." },
  { icon: Heart,       label: "Echo Flashcards",         desc: "Rapid-fire review of key echo concepts and measurements." },
];

export default function Enrolled() {
  const { isAuthenticated, loading } = useAuth();

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
    >
      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-8 py-8 text-center"
          style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            You're enrolled!
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            Your free iHeartEcho™ membership is active. Sign in to start using your clinical tools.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Features preview */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              What's included in your free membership
            </p>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#189aa1" + "18" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#189aa1" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-2 space-y-2">
            {loading ? null : isAuthenticated ? (
              <Link href="/">
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}
                >
                  <Heart className="w-4 h-4" />
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <a
                  href={getLoginUrl()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #189aa1, #0e7490)" }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to iHeartEcho™
                </a>
                <p className="text-center text-xs text-gray-400">
                  Use the same email you enrolled with on Thinkific.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-white/50 text-xs text-center max-w-sm">
        Your account is linked to your All About Ultrasound membership. Any changes to your membership on Thinkific are reflected here automatically.
      </p>
    </div>
  );
}
