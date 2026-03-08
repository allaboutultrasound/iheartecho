/**
 * Premium Access page — explains the $9/month plan and redirects to Thinkific checkout.
 * Also handles the post-checkout sync when the user returns from Thinkific.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Crown, Check, Sparkles, ArrowRight, RefreshCw,
  Stethoscope, BookOpen, Zap, Activity, Users, FileText,
  Star, Shield, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

const CHECKOUT_URL =
  "https://member.allaboutultrasound.com/enroll/3703267?price_id=4651832";

const PREMIUM_FEATURES = [
  {
    icon: Stethoscope,
    title: "Adult TTE Navigator",
    description: "Full structured TTE protocol with view-by-view checklist and ASE reference values.",
  },
  {
    icon: Stethoscope,
    title: "TEE Navigator",
    description: "ME, TG, and UE views with angle/depth guidance and intraoperative checklist.",
  },
  {
    icon: Zap,
    title: "Stress Echo Navigator",
    description: "Exercise and DSE protocols, 17-segment WMSI scorer, and interpretation criteria.",
  },
  {
    icon: Users,
    title: "Pediatric & Fetal Echo",
    description: "CHD findings, BSA Z-scores, Qp/Qs shunt estimation, and fetal cardiac scan coach.",
  },
  {
    icon: Activity,
    title: "Daily Challenge Archive",
    description: "Access the full archive of past daily challenges. Free members get today's challenge only — premium unlocks the complete history.",
  },
  {
    icon: FileText,
    title: "Report Builder",
    description: "Generate complete, structured echo reports instantly from your measurements with 2025 ASE-compliant clinical narratives.",
  },
  {
    icon: Zap,
    title: "Echo Severity Calculator",
    description: "Guideline-based AS, MR, TR, AR, diastology interpretation with LARS and LV GLS.",
  },
  {
    icon: Zap,
    title: "EchoAssist AI",
    description: "Enter measurements and get instant guideline-based severity classification.",
  },
  {
    icon: Activity,
    title: "Hemodynamics Lab",
    description: "Interactive PV loop simulator — adjust preload, afterload, and contractility.",
  },
];

const FREE_FEATURES = [
  "Echo Case Library (full access)",
  "Daily Challenge (today's challenge only)",
  "Basic echo reference values",
  "Community Hub access",
];

const PREMIUM_ONLY_LABELS = [
  "Daily Challenge Archive (full history)",
  "Report Builder",
  "All EchoNavigator protocols",
  "EchoAssist clinical engines",
  "Hemodynamics Lab",
  "Diastology in Special Populations",
];

export default function Premium() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading, refetch } = trpc.premium.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  );

  const checkAndSync = trpc.premium.checkAndSync.useMutation({
    onSuccess: (data) => {
      setSyncMessage(data.message);
      setSyncing(false);
      refetch();
      if (data.isPremium) {
        setTimeout(() => navigate("/"), 2000);
      }
    },
    onError: () => {
      setSyncing(false);
      setSyncMessage("Could not verify membership — please try again.");
    },
  });

  // Auto-sync when returning from Thinkific checkout (URL has ?sync=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sync") === "1" && user && !syncing) {
      setSyncing(true);
      checkAndSync.mutate();
    }
  }, [user]);

  const handleCheckout = () => {
    // Redirect to Thinkific checkout; user returns to /upgrade-success
    const returnUrl = encodeURIComponent(`${window.location.origin}/upgrade-success`);
    window.location.href = `${CHECKOUT_URL}?return_url=${returnUrl}`;
  };

  const handleManualSync = () => {
    if (!user) return;
    setSyncing(true);
    setSyncMessage(null);
    checkAndSync.mutate();
  };

  const loading = authLoading || statusLoading;

  return (
    <Layout>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="relative container py-14 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/90 font-medium">iHeartEcho Premium Access</span>
            </div>
            <h1
              className="text-3xl md:text-5xl font-black text-white leading-tight mb-4"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              The Complete Echo Clinical Suite
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Everything a sonographer, cardiologist, or ACS professional needs — protocols,
              calculators, cases, and AI tools — in one guideline-based platform.
            </p>

            {/* Pricing card */}
            <div className="inline-block bg-white rounded-2xl shadow-xl px-8 py-6 text-center mb-6">
              <div className="text-5xl font-black text-[#189aa1] mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                $9.99
              </div>
              <div className="text-gray-500 text-sm mb-4">per month · cancel anytime</div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
                  <div className="w-4 h-4 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
                  Checking membership…
                </div>
              ) : status?.isPremium ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <Check className="w-4 h-4" />
                    Premium Access Active
                  </div>
                  <a href={status.manageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Manage Subscription
                    </Button>
                  </a>
                </div>
              ) : user ? (
                <div className="flex flex-col items-center gap-3">
                  <Button
                    onClick={handleCheckout}
                    className="bg-[#189aa1] hover:bg-[#147a80] text-white font-bold px-8 py-3 text-base rounded-xl"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium Access
                  </Button>
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="text-xs text-gray-400 hover:text-[#189aa1] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                    Already a member? Sync now
                  </button>
                  {syncMessage && (
                    <p className="text-xs text-gray-500 max-w-xs">{syncMessage}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <a href={getLoginUrl()}>
                    <Button className="bg-[#189aa1] hover:bg-[#147a80] text-white font-bold px-8 py-3 text-base rounded-xl">
                      Sign In to Upgrade
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400">Create a free account first, then upgrade</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-white/60 text-xs">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure checkout via Thinkific</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Cancel anytime</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Instant access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="container py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>
            Everything Included in Premium
          </h2>
          <p className="text-gray-500 text-sm">All tools, all protocols, all cases — one subscription.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {PREMIUM_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#189aa1]/30 hover:shadow-md transition-all"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "#f0fbfc" }}>
                <Icon className="w-4 h-4" style={{ color: "#189aa1" }} />
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1" style={{ fontFamily: "Merriweather, serif" }}>
                {title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Free vs Premium comparison */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-lg font-bold text-gray-700 mb-6" style={{ fontFamily: "Merriweather, serif" }}>
            Free vs Premium
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Free */}
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="font-bold text-gray-500 text-sm mb-4 uppercase tracking-wider">Free</div>
              <ul className="space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                    <Check className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Premium */}
            <div className="rounded-xl border-2 border-[#189aa1] p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#189aa1] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                $9.99/mo
              </div>
              <div className="font-bold text-[#189aa1] text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Premium
              </div>
              <ul className="space-y-2.5">
                {PREMIUM_ONLY_LABELS.map((label) => (
                  <li key={label} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-[#189aa1] mt-0.5 flex-shrink-0" />
                    {label}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-[#189aa1] font-medium">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  + all premium modules
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        {!status?.isPremium && (
          <div className="mt-12 text-center">
            {user ? (
              <Button
                onClick={handleCheckout}
                className="bg-[#189aa1] hover:bg-[#147a80] text-white font-bold px-10 py-3 text-base rounded-xl"
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Premium Access — $9.99/month
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-[#189aa1] hover:bg-[#147a80] text-white font-bold px-10 py-3 text-base rounded-xl">
                  Sign In to Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            )}
            <p className="text-gray-400 text-xs mt-3">
              Checkout is handled securely by Thinkific · Cancel anytime from your account
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
