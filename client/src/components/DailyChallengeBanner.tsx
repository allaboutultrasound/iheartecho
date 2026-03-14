/**
 * DailyChallengeBanner
 *
 * Hero banner for the Daily Challenge page.
 * Matches the dashboard hero style: dark navy-to-teal gradient with
 * a right-aligned trophy+flames artwork, EKG line, and echo HUD overlay.
 *
 * Props:
 *   streakCount   — current streak number (0 hides the streak pill)
 *   onStart       — callback for the CTA button (optional)
 *   completed     — if true, shows "Completed Today" badge instead of CTA
 */

import { Flame, Trophy, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const BANNER_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663401463434/etVPnUidWNWG8W4GHnRqzv/daily-challenge-banner-v3_2e08740d.png";

interface DailyChallengeBannerProps {
  streakCount?: number;
  onStart?: () => void;
  onViewArchive?: () => void;
  completed?: boolean;
}

export function DailyChallengeBanner({
  streakCount = 0,
  onStart,
  onViewArchive,
  completed = false,
}: DailyChallengeBannerProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
    >
      {/* Background artwork — right-aligned trophy image */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: `url(${BANNER_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
        aria-hidden="true"
      />

      {/* Left-side gradient fade so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(14,30,46,0.95) 0%, rgba(14,30,46,0.80) 40%, rgba(14,30,46,0.30) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container py-10 md:py-14">
        <div className="max-w-lg">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
            <span className="text-xs text-white/80 font-medium">New challenge every day</span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-black text-white leading-tight mb-2"
            style={{ fontFamily: "Merriweather, serif" }}
          >
            Daily Challenge
          </h1>
          <p className="text-[#4ad9e0] font-semibold text-base md:text-lg mb-4">
            Test your echo knowledge
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-sm">
            One question per category, every day. Answer, learn, maintain your streak, and climb the leaderboard.
          </p>

          {/* Streak pill */}
          {streakCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <Flame className="w-4 h-4 text-[#4ad9e0]" />
              <span className="text-white text-sm font-semibold">
                {streakCount}-day streak — keep it going!
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            {!completed ? (
              onStart && (
                <button
                  onClick={onStart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "#189aa1" }}
                >
                  <Trophy className="w-4 h-4" />
                  Start Today's Challenge
                </button>
              )
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5">
                <Trophy className="w-4 h-4 text-[#4ad9e0]" />
                <span className="text-[#4ad9e0] text-sm font-semibold">
                  Completed Today ✓
                </span>
              </div>
            )}
            {onViewArchive && (
              <button
                onClick={onViewArchive}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                View Archive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
