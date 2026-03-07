/**
 * VerifyEmail.tsx — Handles the email verification link click
 * URL: /verify-email?token=xxx
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

export default function VerifyEmail() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.emailAuth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.alreadyVerified ? "Your email was already verified." : "Your account is now active!");
      // Auto-redirect after 3 seconds
      setTimeout(() => { window.location.href = "/"; }, 3000);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Verification failed. The link may have expired.");
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {LOGO ? (
            <img src={LOGO} alt="iHeartEcho" className="w-10 h-10 object-contain" />
          ) : (
            <Heart className="w-8 h-8" style={{ color: "#189aa1" }} />
          )}
          <div className="text-xl font-black" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>iHeartEcho™</div>
        </div>

        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#f0fbfc" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#189aa1" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>Verifying your email…</h2>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#f0fbfc" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#189aa1" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">{message || "Your account is now active. Redirecting you to the app…"}</p>
            <Link href="/">
              <Button className="w-full font-semibold text-white" style={{ background: "#189aa1" }}>
                Go to iHeartEcho
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-50">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Merriweather, serif", color: "#0e1e2e" }}>Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link href="/register">
              <Button className="w-full font-semibold text-white" style={{ background: "#189aa1" }}>
                Create a new account
              </Button>
            </Link>
            <div className="mt-3">
              <Link href="/login" className="text-sm hover:underline" style={{ color: "#189aa1" }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
