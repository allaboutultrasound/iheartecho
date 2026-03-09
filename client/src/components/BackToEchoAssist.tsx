/*
  BackToEchoAssist™ — Reusable breadcrumb/back link
  Renders a small "← EchoAssist™" link that returns the user to the EchoAssist™ hub
  (the branded landing page that holds all navigators and ScanCoach entries)

  Pass `href` and `label` to override the destination (e.g. ScanCoach pages link to /scan-coach-hub)
*/
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BackToEchoAssistProps {
  /** Optional extra Tailwind classes on the wrapper */
  className?: string;
  /** Override the destination URL. Defaults to /echo-assist-hub */
  href?: string;
  /** Override the link label. Defaults to "EchoAssist™ Hub" */
  label?: string;
}

export default function BackToEchoAssist({
  className = "",
  href = "/echo-assist-hub",
  label = "EchoAssist™ Hub",
}: BackToEchoAssistProps) {
  return (
    <Link href={href}>
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer hover:opacity-80 ${className}`}
        style={{ color: "#4ad9e0" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {label}
      </span>
    </Link>
  );
}
