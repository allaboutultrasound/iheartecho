/**
 * Register.tsx — iHeartEcho™ account creation
 *
 * Two paths:
 *   1. Email + password registration (creates account directly in iHeartEcho)
 *   2. Thinkific free membership enrollment (external link)
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { THINKIFIC_FREE_MEMBERSHIP_URL } from "@/const";
import {
  Loader2, Heart, CheckCircle2, Zap, Stethoscope, Lock, Eye, EyeOff, Mail, ExternalLink,
} from "lucide-react";

const LOGO = import.meta.env.VITE_APP_LOGO as string;
const BRAND = "#189aa1";

export default function Register() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const registerMutation = trpc.emailAuth.register.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerMutation.isPending) return;
    registerMutation.mutate({
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0e1e2e] via-[#0e4a50] to-[#189aa1] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="flex justify-center mb-4">
            {LOGO ? (
              <img src={LOGO} alt="iHeartEcho" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: BRAND }}>
                <Heart className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Create Your Account
          </h1>
          <p className="text-gray-500 text-sm">
            Join thousands of echo professionals on iHeartEcho™
          </p>
        </div>

        {/* Registration form */}
        <div className="px-8 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First name</Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  autoFocus
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-10"
                  disabled={registerMutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last name</Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-10"
                  disabled={registerMutation.isPending}
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
                className="h-10"
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 pr-10"
                  disabled={registerMutation.isPending}
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

            {registerMutation.isError && (
              <p className="text-xs text-red-500">
                {registerMutation.error?.message || "Registration failed. Please try again."}
              </p>
            )}

            <Button
              type="submit"
              disabled={registerMutation.isPending || !email.trim() || !password || !firstName.trim() || !lastName.trim()}
              className="w-full h-11 font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0e7a80 100%)` }}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" />Create Account</>
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="bg-[#f0fbfc] rounded-xl p-4 mt-5 space-y-2">
            {[
              "Free access to Daily Echo Challenge",
              "Echo calculators and reference tools",
              "ScanCoach™ probe guidance",
              "Upgrade anytime for full clinical suite",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BRAND }} />
                {benefit}
              </div>
            ))}
          </div>

          {/* Thinkific option */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <a href={THINKIFIC_FREE_MEMBERSHIP_URL} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              variant="outline"
              className="w-full gap-2 text-sm h-10"
              style={{ color: BRAND, borderColor: BRAND }}
            >
              <ExternalLink className="w-4 h-4" />
              Enroll via All About Ultrasound
            </Button>
          </a>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{" "}
            <Link href="/login">
              <span className="font-medium hover:underline" style={{ color: BRAND }}>Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
