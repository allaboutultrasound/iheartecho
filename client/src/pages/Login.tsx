/**
 * Login.tsx — iHeartEcho™ sign-in (magic link + email/password)
 * Brand: Teal #189aa1, Aqua #4ad9e0, Dark navy #0e1e2e
 *
 * Two sign-in modes:
 *   1. Magic link: Enter email → receive magic link → click link → authenticated
 *   2. Password:   Enter email + password → authenticated immediately
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Stethoscope, Activity, BookOpen, Shield, CheckCircle2, Zap, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

const FEATURES = [
  { icon: Stethoscope, title: "Clinical Navigators", desc: "TTE, TEE, Stress, Fetal, Pediatric, ACHD protocols" },
  { icon: Activity, title: "EchoAssist™ & Calculators", desc: "Guideline-based severity grading across 9 domains" },
  { icon: BookOpen, title: "CME & Registry Review", desc: "Accredited courses, registry prep, 500+ echo cases" },
  { icon: Shield, title: "Accreditation Tools", desc: "Peer review, IQR, echo correlation, lab analytics" },
];

type SignInMode = "magic" | "password";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<SignInMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // Magic link mutation
  const requestMutation = trpc.auth.requestMagicLink.useMutation({
    onSuccess: () => setSent(true),
  });

  const handleMagicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || requestMutation.isPending) return;
    requestMutation.mutate({ email: trimmed });
  };

  // Password login — uses the server-side route so the cookie is set correctly
  const [loginPending, setLoginPending] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password || loginPending) return;
    setLoginError("");
    setLoginPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Invalid email or password.");
        setLoginPending(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
      setLoginPending(false);
    }
  };

  if (!loading && isAuthenticated) {
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
        <div className="relative flex items-center gap-3">
          {LOGO ? (
            <img src={LOGO} alt="iHeartEcho™" className="w-20 h-20 object-contain drop-shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(24,154,161,0.3)" }}>
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          )}
          <div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>iHeartEcho™</div>
            <div className="text-xs font-medium" style={{ color: "#4ad9e0" }}>EchoAssist™ Echocardiography Clinical Intelligence</div>
          </div>
        </div>
        <div className="relative my-8 lg:my-0">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 border border-white/20 bg-white/10">
            <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Real-time Clinical Decision Support</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Merriweather, serif" }}>
            The complete echo<br /><span style={{ color: "#4ad9e0" }}>clinical companion</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Guideline-based interpretation, structured protocols, accreditation tools, and CME — built for cardiac ultrasound students, sonographers, echocardiographers, cardiologists, physicians, residents, ACS professionals, and echo educators.
          </p>
        </div>
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

      {/* ── Right panel: sign-in form ── */}
      <div className="flex flex-col items-center justify-center flex-1 p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {LOGO ? (
              <img src={LOGO} alt="iHeartEcho™" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#189aa1" }}>
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="text-xl font-black" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>iHeartEcho™</div>
          </div>

          {!sent ? (
            <>
              {/* Heading */}
              <div className="mb-6">
                <div className="w-14 h-14 rounded-full bg-[#f0fbfc] flex items-center justify-center mb-4">
                  {mode === "password" ? (
                    <Lock className="w-7 h-7" style={{ color: "#189aa1" }} />
                  ) : (
                    <Mail className="w-7 h-7" style={{ color: "#189aa1" }} />
                  )}
                </div>
                <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>
                  Sign in to iHeartEcho™
                </h2>
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode("password"); setLoginError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    mode === "password"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setLoginError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    mode === "magic"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Magic Link
                </button>
              </div>

              {mode === "password" ? (
                /* ── Password sign-in form ── */
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                      disabled={loginPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Link href="/forgot-password">
                        <span className="text-xs font-medium hover:underline" style={{ color: "#189aa1" }}>
                          Forgot password?
                        </span>
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        disabled={loginPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <p className="text-xs text-red-500">{loginError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={loginPending || !email.trim() || !password}
                    className="w-full h-11 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #189aa1 0%, #0e7a80 100%)" }}
                  >
                    {loginPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" />Sign In</>
                    )}
                  </Button>
                </form>
              ) : (
                /* ── Magic link form ── */
                <>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">
                    Enter your email address and we'll send you a one-click sign-in link. No password required.
                  </p>
                  <form onSubmit={handleMagicSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-magic" className="text-sm font-medium text-gray-700">Email address</Label>
                      <Input
                        id="email-magic"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                        disabled={requestMutation.isPending}
                      />
                      {requestMutation.isError && (
                        <p className="text-xs text-red-500 mt-1">
                          {requestMutation.error?.message || "Something went wrong. Please try again."}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={requestMutation.isPending || !email.trim()}
                      className="w-full h-11 font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #189aa1 0%, #0e7a80 100%)" }}
                    >
                      {requestMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending link…</>
                      ) : (
                        <><Mail className="w-4 h-4 mr-2" />Send Magic Link</>
                      )}
                    </Button>
                  </form>
                  <div className="mt-5 flex items-start gap-2 bg-[#f0fbfc] border border-[#189aa1]/20 rounded-xl px-4 py-3">
                    <Zap className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 leading-relaxed space-y-1">
                      <p>The link expires in <strong>15 minutes</strong> and can only be used once.</p>
                      <p>📬 <strong>Don't see it?</strong> Check your <strong>spam</strong> or <strong>junk</strong> folder — the email comes from <span className="font-medium">iHeartEcho™ / All About Ultrasound</span>.</p>
                    </div>
                  </div>
                </>
              )}

              {/* Divider + register/enroll CTA */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">New to iHeartEcho™?</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <Link href="/register">
                <Button
                  variant="outline"
                  className="w-full gap-2 font-semibold text-sm h-11"
                  style={{ color: "#189aa1", borderColor: "#189aa1" }}
                >
                  <Zap className="w-4 h-4" />
                  Create an account
                </Button>
              </Link>

              <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
                By signing in you agree to the{" "}
                <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Terms of Service</a>
                {" "}and{" "}
                <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Privacy Policy</a>.
              </p>
            </>
          ) : (
            /* ── Sent confirmation (magic link mode) ── */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-black mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>
                  Check your inbox
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  If <span className="font-semibold text-gray-700">{email.trim()}</span> is registered, a sign-in link is on its way.
                </p>
              </div>
              <div className="inline-flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left w-full">
                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 leading-relaxed space-y-1">
                  <p>The link expires in <strong>15 minutes</strong> and can only be used once.</p>
                  <p>📬 <strong>Don't see it?</strong> Check your <strong>spam</strong> or <strong>junk</strong> folder — the email comes from <span className="font-medium">iHeartEcho™ / All About Ultrasound</span>.</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => { setSent(false); setEmail(""); requestMutation.reset(); }}
                  className="text-sm font-medium hover:underline block mx-auto"
                  style={{ color: "#189aa1" }}
                >
                  Try a different email address
                </button>
                <button
                  onClick={() => { setSent(false); requestMutation.reset(); }}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
