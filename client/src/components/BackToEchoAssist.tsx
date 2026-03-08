/*
  BackToEchoAssist — Reusable breadcrumb/back link
  Renders a small teal "← EchoAssist" link that returns the user to /echoassist
*/
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BackToEchoAssistProps {
  /** Optional extra Tailwind classes on the wrapper */
  className?: string;
}

export default function BackToEchoAssist({ className = "" }: BackToEchoAssistProps) {
  return (
    <Link href="/echoassist">
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer hover:opacity-80 ${className}`}
        style={{ color: "#189aa1" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        EchoAssist
      </span>
    </Link>
  );
}
