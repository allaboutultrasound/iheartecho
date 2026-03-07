/**
 * Register.tsx — iHeartEcho branded sign-up page (email/password)
 * Fully white-labelled — no Manus/Meta branding.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Heart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

export default function Register() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const registerMutation = trpc.emailAuth.register.useMutation({
    onSuccess: () => {
      setRegistered(true);
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    registerMutation.mutate({ firstName, lastName, email, password });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e1e2e" }}>
        <div className="w-8 h-8 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#f0fbfc" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: "#189aa1" }} />
          </div>
          <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>
            Check your email
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            We've sent a verification link to <strong>{email}</strong>. Click the link in the email to activate your account.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Didn't receive it? Check your spam folder, or{" "}
            <button
              onClick={() => registerMutation.mutate({ firstName, lastName, email, password })}
              className="underline hover:text-gray-600"
              style={{ color: "#189aa1" }}
            >
              resend the email
            </button>.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ fontFamily: "Open Sans, sans-serif" }}>
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-center p-12 lg:w-[45%] relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0e1e2e 0%, #0d3d44 55%, #189aa1 100%)" }}
      >
        <div className="relative flex items-center gap-3 mb-10">
          {LOGO ? (
            <img src={LOGO} alt="iHeartEcho" className="w-12 h-12 object-contain drop-shadow-lg" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#189aa1" }}>
              <Heart className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>iHeartEcho™</div>
            <div className="text-xs font-medium" style={{ color: "#4ad9e0" }}>Echocardiography Clinical Companion</div>
          </div>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Merriweather, serif" }}>
          Join thousands of<br /><span style={{ color: "#4ad9e0" }}>echo professionals</span>
        </h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm">
          Get instant access to guideline-based calculators, structured protocols, CME courses, and accreditation tools.
        </p>
        <div className="mt-8 text-white/30 text-xs">© {new Date().getFullYear()} iHeartEcho™ · All About Ultrasound</div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col items-center justify-center flex-1 p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {LOGO ? <img src={LOGO} alt="iHeartEcho" className="w-10 h-10 object-contain" /> : <Heart className="w-8 h-8" style={{ color: "#189aa1" }} />}
            <div className="text-xl font-black" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>iHeartEcho™</div>
          </div>

          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>Create your account</h2>
          <p className="text-sm text-gray-500 mb-8">Join iHeartEcho and access your clinical toolkit.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">First name</Label>
                <Input
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Last name</Label>
                <Input
                  type="text"
                  autoComplete="family-name"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </div>

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
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending || !firstName || !lastName || !email || !password || !confirmPassword}
              className="w-full h-11 font-semibold text-white mt-2"
              style={{ background: "linear-gradient(135deg, #189aa1 0%, #0e7a80 100%)" }}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
              ) : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#189aa1" }}>Sign in</Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Terms of Service</a>
            {" "}and{" "}
            <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
