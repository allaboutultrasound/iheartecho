/**
 * Login.tsx — iHeartEcho branded sign-in page (email/password)
 * Fully white-labelled — no Manus/Meta branding.
 * Brand: Teal #189aa1, Aqua #4ad9e0, Dark navy #0e1e2e
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Stethoscope, Activity, BookOpen, Shield, Heart, Zap } from "lucide-react";
import { toast } from "sonner";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

const FEATURES = [
  { icon: Stethoscope, title: "Clinical EchoNavigators™", desc: "TTE, TEE, Stress, Fetal, Pediatric, ACHD protocols" },
  { icon: Activity, title: "EchoAssist™ & Calculators", desc: "Guideline-based severity grading across 9 domains" },
  { icon: BookOpen, title: "CME & Registry Review", desc: "Accredited courses, registry prep, 500+ echo cases" },
  { icon: Shield, title: "Accreditation Tools", desc: "Peer review, IQR, echo correlation, lab analytics" },
];

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const loginMutation = trpc.emailAuth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err) => {
      toast.error(err.message || "Sign in failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e1e2e" }}>
        <div className="w-8 h-8 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: "Open Sans, sans-serif" }}>
      {/* ── Left panel: branding ── */}
      <div
        className="relative flex flex-col justify-between p-8 lg:p-12 lg:w-[55%] overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0e1e2e 0%, #0d3d44 55%, #189aa1 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #4ad9e0 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, #189aa1 0%, transparent 50%)`,
          }}
        />
        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img
            src={LOGO || "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/tMerpTNEMefRhZwO.png?Expires=1804389585&Signature=WUUmbeKd6gRL-5YievLbV1CH3uu0nlv-Re4ouPNZeR8Uaa5fZGvIpyzCfN4GeYzdNVN-L2Dfhpb6wP3tKMLML8tU2MU77LZNA0Db1Qt~FgBKmBrDM8f98IhyhaIIh3mcPdLcoP5aezbNBOluLkAKxGF1onaa3LNS33jvn6RdWOARg3rQF-iGyCG8t~MaJrqXCHCHnEQWkv8ww0KFZrIE6cKq-EgnS6NZ6Ugc~9fSwQmMSgxfKiJuZdqcca1LwferRwRh3oNdounneCfHfE~QI00U4T7~b0DybwkrOKG0VWDKwXiSGd2AgO7up05Jcgsq7v8V58dmlV9XRRUqXN~soA__&Key-Pair-Id=K2HSFNDJXOU9YS"}
            alt="iHeartEcho"
            className="w-20 h-20 object-contain drop-shadow-lg"
          />
          <div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>iHeartEcho™</div>
            <div className="text-xs font-medium" style={{ color: "#4ad9e0" }}>Echocardiography Clinical Companion</div>
          </div>
        </div>
        {/* Hero */}
        <div className="relative my-8 lg:my-0">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 border border-white/20 bg-white/10">
            <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Real-time Clinical Decision Support</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Merriweather, serif" }}>
            The complete echo<br /><span style={{ color: "#4ad9e0" }}>clinical companion</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Guideline-based interpretation, structured protocols, accreditation tools, and CME — built for sonographers, cardiologists, and ACS professionals.
          </p>
        </div>
        {/* Features */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(24,154,161,0.3)" }}>
                <Icon className="w-4 h-4" style={{ color: "#4ad9e0" }} />
              </div>
              <div>
                <div className="text-white text-xs font-semibold mb-0.5">{title}</div>
                <div className="text-white/50 text-xs leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-8 lg:mt-0 text-white/30 text-xs">© {new Date().getFullYear()} iHeartEcho™ · All About Ultrasound</div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-col items-center justify-center flex-1 p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={LOGO || "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/tMerpTNEMefRhZwO.png?Expires=1804389585&Signature=WUUmbeKd6gRL-5YievLbV1CH3uu0nlv-Re4ouPNZeR8Uaa5fZGvIpyzCfN4GeYzdNVN-L2Dfhpb6wP3tKMLML8tU2MU77LZNA0Db1Qt~FgBKmBrDM8f98IhyhaIIh3mcPdLcoP5aezbNBOluLkAKxGF1onaa3LNS33jvn6RdWOARg3rQF-iGyCG8t~MaJrqXCHCHnEQWkv8ww0KFZrIE6cKq-EgnS6NZ6Ugc~9fSwQmMSgxfKiJuZdqcca1LwferRwRh3oNdounneCfHfE~QI00U4T7~b0DybwkrOKG0VWDKwXiSGd2AgO7up05Jcgsq7v8V58dmlV9XRRUqXN~soA__&Key-Pair-Id=K2HSFNDJXOU9YS"} alt="iHeartEcho" className="w-10 h-10 object-contain" />
            <div className="text-xl font-black" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>iHeartEcho™</div>
          </div>

          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to access your clinical tools and learning resources.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "#189aa1" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full h-11 font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #189aa1 0%, #0e7a80 100%)" }}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">New to iHeartEcho?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Link href="/register">
            <button className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 border" style={{ color: "#189aa1", borderColor: "#189aa1" }}>
              <Zap className="w-4 h-4" />
              Create a free account
            </button>
          </Link>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Link href="/magic-link">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-sm transition-all hover:bg-[#f0fbfc] border border-[#189aa1]/30 text-[#189aa1]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Sign in with a magic link
            </button>
          </Link>

          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            By signing in you agree to the{" "}
            <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Terms of Service</a>
            {" "}and{" "}
            <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
