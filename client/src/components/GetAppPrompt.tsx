/**
 * GetAppPrompt.tsx
 *
 * Mobile-only "Get App" banner that prompts users to install iHeartEcho
 * as a Progressive Web App (PWA) on their home screen.
 *
 * Behaviour:
 * - Renders only on mobile devices (max-width 768 px)
 * - Android / Chrome: uses the native `beforeinstallprompt` event
 * - iOS / Safari: shows manual share-sheet instructions (iOS doesn't
 *   support the install prompt API)
 * - Dismissed state is persisted in localStorage so the banner doesn't
 *   reappear after the user closes it
 * - Already-installed check: hides the banner when running in standalone
 *   mode (i.e. the app is already on the home screen)
 */

import { useState, useEffect } from "react";
import { X, Share, Plus, Download } from "lucide-react";

// Extend Window to include the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "ihe_get_app_dismissed_v1";

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function GetAppPrompt() {
  const [show, setShow] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already installed, not on mobile, or previously dismissed
    if (
      isInStandaloneMode() ||
      !isMobile() ||
      localStorage.getItem(DISMISSED_KEY) === "1"
    ) {
      return;
    }

    if (isIOS()) {
      // iOS: show after a short delay so the page has settled
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: listen for the native prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    setShowIOSInstructions(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleGetApp = async () => {
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        dismiss();
      }
      setDeferredPrompt(null);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* ── Main banner ─────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden"
        style={{
          background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 100%)",
          borderTop: "1px solid rgba(74,217,224,0.25)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* App icon */}
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/icon-192_df958e9b.png"
            alt="iHeartEcho"
            className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md"
          />

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho™
            </p>
            <p className="text-white/60 text-xs leading-snug mt-0.5">
              Save to your home screen for quick access
            </p>
          </div>

          {/* Get App button */}
          <button
            onClick={handleGetApp}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: "#189aa1" }}
          >
            {isIOS() ? (
              <Share className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Get App
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── iOS share-sheet instructions overlay ────────────────────────── */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[10000] md:hidden flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="rounded-t-2xl p-6 pb-8"
            style={{ background: "#0e1e2e", border: "1px solid rgba(74,217,224,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-center gap-3 mb-5">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/icon-192_df958e9b.png"
                alt="iHeartEcho"
                className="w-12 h-12 rounded-xl shadow-md"
              />
              <div>
                <p className="text-white font-bold" style={{ fontFamily: "Merriweather, serif" }}>
                  Get iHeartEcho™
                </p>
                <p className="text-white/50 text-xs">Add to your iPhone home screen</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "#189aa1" }}
                >
                  1
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Tap the Share button</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ background: "rgba(74,217,224,0.15)", border: "1px solid rgba(74,217,224,0.3)" }}
                    >
                      <Share className="w-3 h-3 text-[#4ad9e0]" />
                      Share
                    </div>
                    <span className="text-white/50 text-xs">in Safari's bottom toolbar</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "#189aa1" }}
                >
                  2
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Tap "Add to Home Screen"</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ background: "rgba(74,217,224,0.15)", border: "1px solid rgba(74,217,224,0.3)" }}
                    >
                      <Plus className="w-3 h-3 text-[#4ad9e0]" />
                      Add to Home Screen
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: "#189aa1" }}
                >
                  3
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Tap "Add" to confirm</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    iHeartEcho™ will appear on your home screen like a native app
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 py-3 rounded-xl text-sm font-semibold text-white/60 transition-colors hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
