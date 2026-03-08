/*
  BackToEchoAssist — Reusable breadcrumb/back link
  Renders a small "← EchoAssist" link that returns the user to the EchoAssist hub
  (the branded landing page that holds all navigators and ScanCoach entries)
*/
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BackToEchoAssistProps {
  /** Optional extra Tailwind classes on the wrapper */
  className?: string;
}

export default function BackToEchoAssist({ className = "" }: BackToEchoAssistProps) {
  return (
    <Link href="/echo-assist-hub">
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer hover:opacity-80 ${className}`}
        style={{ color: "#4ad9e0" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        EchoAssist Hub
      </span>
    </Link>
  );
}
