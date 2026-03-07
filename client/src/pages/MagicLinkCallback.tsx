/**
 * MagicLinkCallback.tsx — Handles the magic link callback
 * URL: /auth/magic?token=...
 *
 * Automatically calls verifyMagicLink on mount, then redirects to the app.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, XCircle, Heart, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const LOGO = import.meta.env.VITE_APP_LOGO as string;

type Status = "verifying" | "success" | "error";

export default function MagicLinkCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: () => {
      setStatus("success");
      // Redirect to home after a short delay so the user sees the success state
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message || "The magic link is invalid or has expired.");
    },
  });

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("No token found in the link. Please request a new magic link.");
      return;
    }

    verifyMutation.mutate({ token });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className="px-8 py-6 text-center"
            style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
              {LOGO ? (
                <img src={LOGO} alt="iHeartEcho" className="w-8 h-8 object-contain" />
              ) : (
                <Heart className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho™
            </h1>
            <p className="text-sm text-[#4ad9e0] mt-1">Signing you in…</p>
          </div>

          {/* Body */}
          <div className="px-8 py-10 text-center">
            {status === "verifying" && (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#f0fbfc] flex items-center justify-center mx-auto">
                  <Loader2 className="w-7 h-7 text-[#189aa1] animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                    Verifying your link…
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we sign you in.
                  </p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                    You're signed in!
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Redirecting you to iHeartEcho…
                  </p>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: "#189aa1",
                        animation: "progress 1.5s linear forwards",
                        width: "0%",
                      }}
                    />
                  </div>
                </div>
                <style>{`
                  @keyframes progress {
                    from { width: 0% }
                    to { width: 100% }
                  }
                `}</style>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                    Sign-in failed
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <Link href="/magic-link">
                    <Button
                      className="w-full font-semibold text-white"
                      style={{ background: "#189aa1" }}
                    >
                      Request a new magic link
                    </Button>
                  </Link>
                  <Link href="/login">
                    <button className="text-sm text-gray-400 hover:text-gray-600 mt-1 block mx-auto">
                      Sign in with password instead
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © All About Ultrasound ·{" "}
              <a href="https://www.iheartecho.com" className="text-[#189aa1] hover:underline">
                www.iheartecho.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
